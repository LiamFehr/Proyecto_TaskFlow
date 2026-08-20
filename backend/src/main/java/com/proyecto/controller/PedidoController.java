package com.proyecto.controller;

import com.proyecto.dto.PedidoDTO;
import com.proyecto.dto.PedidoRemotoDTO;
import com.proyecto.model.Pedido;
import com.proyecto.repository.PedidoRepository;
import com.proyecto.service.PedidoFileService;
import com.proyecto.service.PedidoService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;
    private final PedidoFileService pedidoFileService;
    private final PedidoRepository pedidoRepository;

    @PostMapping
    public ResponseEntity<Pedido> crearPedido(@RequestBody PedidoDTO pedido) {
        // En producción real usaríamos @AuthenticationPrincipal, pero para simplificar
        // ahora
        String vendedorEmail = "vendedor@taskflow.com";
        if (pedido.getVendedorNombre() != null) {
            vendedorEmail = pedido.getVendedorNombre();
        }
        return ResponseEntity.ok(pedidoService.crearPedido(pedido, vendedorEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> obtenerPorId(@PathVariable Long id) {
        return pedidoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cola")
    public ResponseEntity<List<Pedido>> obtenerColaCaja() {
        return ResponseEntity.ok(pedidoService.obtenerColaCaja());
    }

    @GetMapping("/historial")
    public ResponseEntity<List<Pedido>> obtenerHistorialVentas() {
        return ResponseEntity.ok(pedidoService.obtenerHistorialVentas());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pedido> actualizarPedido(@PathVariable Long id, @RequestBody PedidoDTO dto) {
        return ResponseEntity.ok(pedidoService.actualizarPedido(id, dto));
    }

    @PostMapping("/{id}/tomar")
    public ResponseEntity<Pedido> tomarPedido(@PathVariable Long id) {
        String cajeroEmail = "caja@taskflow.com"; // En prod usar JWT
        return ResponseEntity.ok(pedidoService.tomarPedido(id, cajeroEmail));
    }

    @PostMapping("/{id}/liberar")
    public ResponseEntity<Pedido> liberarPedido(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.liberarPedido(id));
    }

    @PostMapping("/{id}/cerrar")
    public ResponseEntity<Pedido> cerrarVenta(@PathVariable Long id, @RequestBody PedidoDTO cierreData) {
        return ResponseEntity.ok(pedidoService.cerrarVenta(id, cierreData));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPedido(@PathVariable Long id) {
        pedidoService.eliminarPedido(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/limpiar-cola")
    public ResponseEntity<Void> limpiarCola() {
        pedidoService.limpiarCola();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reenviar")
    public ResponseEntity<Void> reenviarPedido(@PathVariable Long id) {
        pedidoService.reenviarPedido(id);
        return ResponseEntity.ok().build();
    }

    // ── Relay ERP ────────────────────────────────────────────────────────────

    /**
     * POST /api/pedidos/remotos — público.
     * Recibe un pedido del cliente web, lo persiste y lo reenvía al ERP via WebSocket.
     */
    @PostMapping("/remotos")
    public ResponseEntity<?> recibirPedidoRemoto(@Valid @RequestBody PedidoRemotoDTO request) {
        log.info("Recibiendo pedido remoto — uuid: {}, cliente: {}", request.getUuid(), request.getClienteNombre());
        try {
            if (pedidoService.existePedido(request.getUuid())) {
                log.warn("Pedido ya recibido: {}", request.getUuid());
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensaje", "Pedido ya recibido", "uuid", request.getUuid()));
            }
            Pedido pedido = pedidoService.crearPedidoRemoto(request);
            log.info("Pedido procesado con éxito — id: {}, turno: {}", pedido.getId(), pedido.getNumeroOrden());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id",     pedido.getId(),
                "uuid",   pedido.getUuid(),
                "turno",  pedido.getNumeroOrden(),
                "mensaje","Pedido recibido y enviado a caja"
            ));
        } catch (Exception e) {
            log.error("CRITICAL ERROR: Fallo al procesar pedido remoto - uuid: {} - Error: {}", request.getUuid(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage(), "tipo", e.getClass().getName()));
        }
    }

    /**
     * POST /api/pedidos/{uuid}/confirmar — protegido (X-Api-Key).
     * El ERP confirma que recibió el pedido y creó la venta local.
     */
    @PostMapping("/{uuid}/confirmar")
    public ResponseEntity<Map<String, String>> confirmarRecepcion(
            @PathVariable String uuid,
            @RequestBody(required = false) Map<String, String> body) {
        String erpSaleNumber = body != null ? body.get("saleNumber") : null;
        pedidoService.confirmarRecepcion(uuid, erpSaleNumber);
        return ResponseEntity.ok(Map.of("uuid", uuid, "estado", "RECIBIDO"));
    }

    /**
     * GET /api/pedidos/pendientes-erp — protegido (X-Api-Key).
     * El ERP lo llama al reconectarse para recuperar pedidos que pudo haber perdido.
     */
    @GetMapping("/pendientes-erp")
    public ResponseEntity<List<Pedido>> getPendientesERP() {
        return ResponseEntity.ok(pedidoService.getPendientesERP());
    }

    // --- Legacy File Endpoints (Mantener para descargar TXT temporalmente) ---

    @GetMapping("/legacy/{filename}/descargar-txt")
    public ResponseEntity<Resource> descargarPedidoTxt(@PathVariable String filename) {
        try {
            Resource file = pedidoFileService.descargarTxt(filename);
            String txtFilename = filename.replace(".json", ".txt");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + txtFilename + "\"")
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(file);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
