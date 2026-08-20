package com.proyecto.service;

import com.proyecto.dto.PedidoDTO;
import com.proyecto.dto.PresupuestoDto;
import com.proyecto.dto.ProductoPedidoDTO;
import com.proyecto.model.Pedido;
import com.proyecto.model.Presupuesto;
import com.proyecto.model.PresupuestoItem;
import com.proyecto.repository.PresupuestoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PresupuestoService {

    private final PresupuestoRepository presupuestoRepository;
    private final PedidoService pedidoService;
    private final RelayBroadcastService relayBroadcastService;

    @Transactional
    public Presupuesto guardar(PresupuestoDto req, String vendedorEmail) {
        List<PresupuestoItem> items = buildItems(req);

        Presupuesto p = new Presupuesto();
        p.setVendedorEmail(vendedorEmail);
        p.setClienteNombre(req.getClienteNombre());
        p.setClienteTelefono(req.getClienteTelefono());
        p.setDniCuit(req.getDniCuit());
        p.setCondicionIva(req.getCondicionIva());
        p.setCiudad(req.getCiudad());
        p.setProvincia(req.getProvincia());
        p.setObservaciones(req.getObservaciones());
        p.setTotal(calcTotal(items));
        p.setFecha(LocalDateTime.now());
        p.setItems(items);

        Presupuesto saved = presupuestoRepository.save(p);
        try {
            relayBroadcastService.broadcastPresupuesto(saved);
        } catch (Exception e) {
            // Log if needed
        }
        return saved;
    }

    @Transactional
    public Presupuesto actualizar(Long id, PresupuestoDto req) {
        Presupuesto p = presupuestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado: " + id));

        p.setClienteNombre(req.getClienteNombre());
        p.setClienteTelefono(req.getClienteTelefono());
        p.setDniCuit(req.getDniCuit());
        p.setCondicionIva(req.getCondicionIva());
        p.setCiudad(req.getCiudad());
        p.setProvincia(req.getProvincia());
        p.setObservaciones(req.getObservaciones());

        p.getItems().clear();
        p.getItems().addAll(buildItems(req));
        p.setTotal(calcTotal(p.getItems()));

        Presupuesto saved = presupuestoRepository.save(p);
        try {
            relayBroadcastService.broadcastPresupuesto(saved);
        } catch (Exception e) {
            // Log if needed
        }
        return saved;
    }

    public List<Presupuesto> listar(String vendedorEmail) {
        return presupuestoRepository.findByVendedorEmailOrderByFechaDesc(vendedorEmail);
    }

    public Presupuesto obtener(Long id) {
        return presupuestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado: " + id));
    }

    @Transactional
    public void eliminar(Long id) {
        presupuestoRepository.deleteById(id);
    }

    @Transactional
    public Pedido convertirAPedido(Long id, String vendedorEmail) {
        Presupuesto p = obtener(id);

        List<ProductoPedidoDTO> items = p.getItems().stream()
                .map(i -> {
                    ProductoPedidoDTO item = new ProductoPedidoDTO();
                    item.setCodigo("");
                    item.setDescripcion(i.getDescription() != null ? i.getDescription() : "");
                    item.setCantidad(i.getQuantity() != null ? i.getQuantity() : BigDecimal.ONE);
                    item.setPrecio(i.getPrice() != null ? i.getPrice() : BigDecimal.ZERO);
                    return item;
                })
                .collect(Collectors.toList());

        PedidoDTO dto = new PedidoDTO();
        dto.setClienteNombre(p.getClienteNombre() != null ? p.getClienteNombre() : "CONSUMIDOR FINAL");
        dto.setVendedorNombre(vendedorEmail);
        dto.setTotal(p.getTotal());
        dto.setItems(items);

        return pedidoService.crearPedido(dto, vendedorEmail);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<PresupuestoItem> buildItems(PresupuestoDto req) {
        if (req.getItems() == null) return List.of();
        return req.getItems().stream()
                .map(i -> {
                    PresupuestoItem item = new PresupuestoItem();
                    item.setProductId(i.getProductId());
                    item.setDescription(i.getDescription());
                    item.setPrice(i.getPrice() != null ? i.getPrice() : BigDecimal.ZERO);
                    item.setQuantity(i.getQuantity() != null ? i.getQuantity() : BigDecimal.ONE);
                    return item;
                })
                .collect(Collectors.toList());
    }

    private BigDecimal calcTotal(List<PresupuestoItem> items) {
        return items.stream()
                .map(i -> i.getPrice().multiply(i.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
