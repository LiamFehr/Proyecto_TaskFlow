package com.proyecto.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pedido_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PedidoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String codigo;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private BigDecimal cantidad;

    @Column(name = "precio_unitario")
    private BigDecimal precioUnitario;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    private BigDecimal vatRate = new BigDecimal("21.00");

    @Column(name = "unit_net_price", precision = 19, scale = 2)
    private BigDecimal unitNetPrice;

    @Column(name = "total_price", precision = 19, scale = 2)
    private BigDecimal totalPrice;

    /** ID del producto en el ERP de escritorio. Se usa en el broadcast WebSocket. */
    @Column(name = "erp_producto_id")
    private Long erpProductoId;
}
