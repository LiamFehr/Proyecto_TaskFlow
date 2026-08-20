package com.proyecto.service;

import com.proyecto.dto.PedidoDTO;
import com.proyecto.dto.PedidoRemotoDTO;
import com.proyecto.model.Pedido;
import com.proyecto.model.PedidoItem;
import com.proyecto.model.Product; // ADDED MISSING IMPORT
import com.proyecto.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import com.proyecto.repository.ProductRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private static final Logger log = LoggerFactory.getLogger(PedidoService.class);
    private final PedidoRepository pedidoRepository;
    private final ProductRepository productRepository;
    private final RelayBroadcastService relayBroadcastService;
    private final NotificacionService notificacionService;

    // Guard de segunda línea: evita procesar confirmaciones duplicadas del ERP
    private final Set<String> confirmedUuids = ConcurrentHashMap.newKeySet();


    @Transactional
    public Pedido crearPedido(PedidoDTO dto, String vendedorEmail) {
        // Generar turno FIFO Cíclico (00-99)
        String turno = generarTurnoCiclico();

        List<PedidoItem> items = dto.getItems().stream()
                .map(prod -> {
                    PedidoItem item = new PedidoItem();
                    item.setCodigo(prod.getCodigo());
                    item.setDescripcion(prod.getDescripcion());
                    item.setCantidad(prod.getCantidad());
                    item.setPrecioUnitario(prod.getPrecio());
                    return item;
                })
                .collect(Collectors.toList());

        Pedido pedido = new Pedido();
        pedido.setVendedorNombre(vendedorEmail);
        pedido.setCliente(dto.getClienteNombre());
        pedido.setNumeroOrden(turno);
        pedido.setFecha(LocalDateTime.now());
        pedido.setEstado(Pedido.EstadoPedido.EN_COLA);
        pedido.setEnCaja(true);
        pedido.setTotal(dto.getTotal());
        pedido.setItems(items);

        Pedido saved = pedidoRepository.save(pedido);
        try {
            log.info("Emitiendo broadcast para pedido {}", saved.getId());
            relayBroadcastService.broadcastPedido(saved);
        } catch (Exception e) {
            log.warn("Fallo broadcast inicial: {}", e.getMessage());
        }
        return saved;
    }

    private String generarTurnoCiclico() {
        try {
            Pedido ultimo = pedidoRepository.findTopByOrderByFechaDesc();
            if (ultimo == null || ultimo.getNumeroOrden() == null) {
                return "00";
            }
            String lastTurno = ultimo.getNumeroOrden();
            // Intentar parsear si es numérico (ignorando ORD- viejos)
            if (lastTurno.matches("\\d+")) {
                int next = (Integer.parseInt(lastTurno) + 1) % 100;
                return String.format("%02d", next);
            } else {
                return "00"; // Reset si el anterior tenia formato viejo
            }
        } catch (Exception e) {
            return "00"; // Fallback seguro
        }
    }

    @Transactional
    public Pedido actualizarPedido(Long id, PedidoDTO dto) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        // Actualizar datos básicos
        if (dto.getClienteNombre() != null)
            pedido.setCliente(dto.getClienteNombre());
        if (dto.getTotal() != null)
            pedido.setTotal(dto.getTotal());

        // Reemplazar items (Estrategia simple: Borrar e insertar nuevos para reflejar
        // edición completa)
        // Hibernate manejará la eliminación de huérfanos si orphanRemoval=true
        pedido.getItems().clear();

        List<PedidoItem> nuevosItems = dto.getItems().stream()
                .map(prod -> {
                    PedidoItem item = new PedidoItem();
                    item.setCodigo(prod.getCodigo());
                    item.setDescripcion(prod.getDescripcion());
                    item.setCantidad(prod.getCantidad());
                    item.setPrecioUnitario(prod.getPrecio());
                    return item;
                })
                .collect(Collectors.toList());

        pedido.getItems().addAll(nuevosItems);

        return pedidoRepository.save(pedido);
    }

    public List<Pedido> obtenerColaCaja() {
        List<Pedido.EstadoPedido> estados = List.of(Pedido.EstadoPedido.EN_COLA, Pedido.EstadoPedido.PENDIENTE,
                Pedido.EstadoPedido.ATENDIENDO);
        log.info("DEBUG: Fetching Cola for states: {}", estados);
        List<Pedido> pedidos = pedidoRepository.findByEstadoInOrderByFechaAsc(estados);
        log.info("DEBUG: Found {} orders in queue.", pedidos.size());
        return pedidos;
    }

    public List<Pedido> obtenerHistorialVentas() {
        return pedidoRepository.findByEstadoOrderByFechaDesc(Pedido.EstadoPedido.COMPLETADO);
    }

    // ── Relay ERP ─────────────────────────────────────────────────────────────

    public boolean existePedido(String uuid) {
        return uuid != null && pedidoRepository.existsByUuid(uuid);
    }

    @Transactional
    public Pedido crearPedidoRemoto(PedidoRemotoDTO request) {
        // Validación de duplicados por UUID (Idempotencia)
        if (request.getUuid() != null) {
            java.util.Optional<Pedido> existente = pedidoRepository.findByUuid(request.getUuid());
            if (existente.isPresent()) {
                log.warn("Pedido remoto duplicado recibido (UUID: {}). Retornando existente.", request.getUuid());
                return existente.get();
            }
        }

        String turno = generarTurnoCiclico();

        List<PedidoItem> items = request.getItems().stream().map(i -> {
                PedidoItem item = new PedidoItem();
                if (i.getProductoId() != null) {
                    Product producto = productRepository.findById(i.getProductoId())
                            .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + i.getProductoId()));
                    BigDecimal precio = i.getPrecioUnitario() != null ? i.getPrecioUnitario() : producto.getPrice();
                    String codigo = producto.getCode() != null && !producto.getCode().isBlank()
                            ? producto.getCode() : "PROD-" + producto.getId();
                    String desc = producto.getName() != null && !producto.getName().isBlank()
                            ? producto.getName()
                            : (producto.getDescription() != null ? producto.getDescription() : codigo);

                    item.setCodigo(codigo);
                    item.setDescripcion(desc);
                    item.setCantidad(i.getCantidad());
                    item.setPrecioUnitario(precio);
                    item.setErpProductoId(producto.getErpId());
                    // FIXED: propagar el vatRate del producto del catálogo (no usar el default 21%)
                    item.setVatRate(producto.getVatRate() != null ? producto.getVatRate() : new BigDecimal("21.00"));
                } else {
                    item.setCodigo("MANUAL");
                    item.setDescripcion(i.getDescripcion() != null ? i.getDescripcion() : "Item manual");
                    item.setCantidad(i.getCantidad());
                    item.setPrecioUnitario(i.getPrecioUnitario() != null ? i.getPrecioUnitario() : BigDecimal.ZERO);
                    // FIXED: usar el vatRate enviado por el frontend; si es null, usar 21% como default
                    item.setVatRate(i.getVatRate() != null ? i.getVatRate() : new BigDecimal("21.00"));
                }
                return item;
        }).collect(Collectors.toList());

        BigDecimal total = request.getTotal() != null ? request.getTotal()
            : items.stream()
                .map(i -> i.getPrecioUnitario().multiply(i.getCantidad()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Pedido pedido = new Pedido();
        pedido.setUuid(request.getUuid());
        pedido.setTerminal(request.getTerminal() != null ? request.getTerminal() : "WEB");
        pedido.setVendedorNombre("WEB");
        pedido.setCliente(request.getClienteNombre());
        pedido.setNumeroOrden(turno);
        pedido.setFecha(LocalDateTime.now());
        pedido.setEstado(Pedido.EstadoPedido.EN_COLA);
        pedido.setEnCaja(true);
        pedido.setItems(items);
        pedido.setTotal(total);

        Pedido saved = pedidoRepository.save(pedido);
        log.info("Pedido remoto creado — uuid={} turno={}", saved.getUuid(), saved.getNumeroOrden());

        try {
            relayBroadcastService.broadcastPedido(saved);
            log.info("Broadcast emitido para pedido remoto uuid={}", saved.getUuid());
        } catch (Exception e) {
            log.warn("Fallo broadcast pedido remoto uuid={}: {}", saved.getUuid(), e.getMessage());
        }

        return saved;
    }

    @Transactional
    public void eliminarPedido(Long id) {
        pedidoRepository.deleteById(id);
    }

    @Transactional
    public void limpiarCola() {
        List<Pedido.EstadoPedido> estados = List.of(Pedido.EstadoPedido.EN_COLA, Pedido.EstadoPedido.PENDIENTE, Pedido.EstadoPedido.ATENDIENDO);
        List<Pedido> pedidos = pedidoRepository.findByEstadoInOrderByFechaAsc(estados);
        pedidoRepository.deleteAll(pedidos);
        log.info("Limpieza de cola: se eliminaron {} pedidos", pedidos.size());
    }

    public void reenviarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        relayBroadcastService.broadcastPedido(pedido);
        log.info("Pedido {} re-enviado a ERP manualmente", id);
    }

    @Transactional
    public void confirmarRecepcion(String uuid, String erpSaleNumber) {
        // Guard: solo procesar la primera confirmación por UUID (segunda línea de defensa)
        if (!confirmedUuids.add(uuid)) {
            log.warn("Confirmación duplicada ignorada — uuid={} erpSaleNumber={}", uuid, erpSaleNumber);
            return;
        }
        pedidoRepository.findByUuid(uuid).ifPresent(p -> {
            log.info("ERP confirmó recepción uuid={} erpSaleNumber={}", uuid, erpSaleNumber);
            if (erpSaleNumber != null && !erpSaleNumber.isBlank()) {
                p.setNumeroOrden(erpSaleNumber);
                pedidoRepository.save(p);
            }
            relayBroadcastService.broadcastStatus(uuid, "RECIBIDO");
        });
    }

    public List<Pedido> getPendientesERP() {
        return pedidoRepository.findByEstadoInOrderByFechaAsc(
            List.of(Pedido.EstadoPedido.EN_COLA, Pedido.EstadoPedido.PENDIENTE));
    }

    @Transactional
    public Pedido tomarPedido(Long id, String cajeroEmail) {
        log.info("DEBUG: Tomar pedido {}", id);
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        if (pedido.getCajeroAtendiendo() != null && !pedido.getCajeroAtendiendo().equals(cajeroEmail)) {
            throw new RuntimeException("Pedido bloqueado por otro cajero: " + pedido.getCajeroAtendiendo());
        }

        pedido.setCajeroAtendiendo(cajeroEmail);
        pedido.setLockTimestamp(LocalDateTime.now());
        pedido.setEstado(Pedido.EstadoPedido.ATENDIENDO);

        Pedido saved = pedidoRepository.save(pedido);
        log.info("DEBUG: Pedido {} saved with state {}", saved.getId(), saved.getEstado());
        return saved;
    }

    @Transactional
    public Pedido liberarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        pedido.setCajeroAtendiendo(null);
        // Si estaba atendiendo, se puede volver a EN_COLA para que tenga el icono verde
        if (pedido.getEstado() == Pedido.EstadoPedido.ATENDIENDO) {
            pedido.setEstado(Pedido.EstadoPedido.EN_COLA);
        }
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido cerrarVenta(Long id, PedidoDTO cierreData) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        // Actualizar datos finales de caja
        pedido.setMetodoPago(Pedido.MetodoPago.valueOf(cierreData.getMetodoPago()));
        pedido.setMontoEntregado(cierreData.getMontoEntregado());
        pedido.setTotal(cierreData.getTotal()); // Confirmar total final

        // Descontar Stock (Permite negativos implicitamente al restar bigdecimal)
        for (PedidoItem item : pedido.getItems()) {
            if (item.getCodigo() != null && !item.getCodigo().isEmpty()) {
                productRepository.findByCode(item.getCodigo()).ifPresent(producto -> {
                    BigDecimal nuevaCantidad = producto.getStock().subtract(item.getCantidad());
                    producto.setStock(nuevaCantidad);
                    productRepository.save(producto);
                });
            }
        }

        pedido.setEstado(Pedido.EstadoPedido.COMPLETADO);
        pedido.setFechaCierre(LocalDateTime.now());
        pedido.setEnCaja(false);
        pedido.setCajeroAtendiendo(null); // Liberar lock

        Pedido saved = pedidoRepository.save(pedido);

        // Notificar a Vendedor (y roles interesados)
        String msg = String.format("Orden %s - %s venta confirmada", 
                                  saved.getNumeroOrden(), 
                                  saved.getCliente());
        notificacionService.notify("VENDEDOR", "Venta Confirmada", msg, saved.getId());

        return saved;
    }
}
