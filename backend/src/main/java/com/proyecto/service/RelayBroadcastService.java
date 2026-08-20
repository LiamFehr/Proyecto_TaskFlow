package com.proyecto.service;

import com.proyecto.model.Pedido;
import com.proyecto.model.PedidoItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Publica mensajes en los topics WebSocket STOMP.
 * El ERP de escritorio está suscripto a estos topics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RelayBroadcastService {

    private static final String TOPIC_PEDIDOS = "/topic/pedidos-entrantes";
    private static final String TOPIC_PRESUPUESTOS = "/topic/presupuestos-entrantes";
    private static final String TOPIC_STATUS  = "/topic/status-sincro";
    private static final String TOPIC_NOTIF   = "/topic/notificaciones";

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Envía el pedido al ERP de escritorio via WebSocket.
     * Incluye erp_producto_id en cada item para que el ERP pueda crear la venta.
     */
    public void broadcastPedido(Pedido pedido) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("id",            pedido.getId());
        msg.put("uuid",          pedido.getUuid());
        msg.put("clienteNombre", pedido.getCliente());
        msg.put("total",         pedido.getTotal());
        msg.put("vendedorId",    pedido.getVendedorNombre());
        msg.put("terminal",      pedido.getTerminal());
        msg.put("creadoEn",      pedido.getFecha());

        List<Map<String, Object>> items = pedido.getItems().stream().map(item -> {
            Map<String, Object> i = new HashMap<>();
            i.put("idProductoLocal", item.getErpProductoId()); // ERP product ID
            i.put("nombreProducto",  item.getDescripcion());
            i.put("cantidad",        item.getCantidad());
            i.put("precioUnitario",  item.getPrecioUnitario());
            i.put("alicuotaIva",     item.getVatRate()); // FIXED: El ERP de escritorio lee "alicuotaIva"
            i.put("subtotal",        item.getCantidad() != null && item.getPrecioUnitario() != null
                    ? item.getCantidad().multiply(item.getPrecioUnitario()) : null);
            return i;
        }).collect(Collectors.toList());

        msg.put("items", items);

        log.info("Broadcast pedido uuid={} → {}", pedido.getUuid(), TOPIC_PEDIDOS);
        messagingTemplate.convertAndSend(TOPIC_PEDIDOS, msg);
    }
    /**
     * Envía el presupuesto al ERP de escritorio via WebSocket.
     */
    public void broadcastPresupuesto(com.proyecto.model.Presupuesto p) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("id", p.getId());
        msg.put("vendedorEmail", p.getVendedorEmail());
        msg.put("clienteNombre", p.getClienteNombre());
        msg.put("clienteTelefono", p.getClienteTelefono());
        msg.put("dniCuit", p.getDniCuit());
        msg.put("total", p.getTotal());
        msg.put("fecha", p.getFecha());
        msg.put("observaciones", p.getObservaciones());

        List<Map<String, Object>> items = p.getItems().stream().map(item -> {
            Map<String, Object> i = new HashMap<>();
            i.put("productId", item.getProductId());
            i.put("description", item.getDescription());
            i.put("price", item.getPrice());
            i.put("quantity", item.getQuantity());
            return i;
        }).collect(Collectors.toList());

        msg.put("items", items);

        log.info("Broadcast presupuesto id={} → {}", p.getId(), TOPIC_PRESUPUESTOS);
        messagingTemplate.convertAndSend(TOPIC_PRESUPUESTOS, msg);
    }

    public void broadcastStatus(String uuid, String estado) {
        messagingTemplate.convertAndSend(TOPIC_STATUS,
                Map.of("uuid", uuid, "estado", estado));
    }

    public void broadcastNotification(com.proyecto.model.Notificacion n) {
        log.info("Broadcast notificacion rol={} → {}", n.getRolDestino(), TOPIC_NOTIF);
        messagingTemplate.convertAndSend(TOPIC_NOTIF, n);
    }
}
