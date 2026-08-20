package com.proyecto.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Relay ERP ---
    /** UUID enviado por el cliente web para deduplicación de pedidos remotos. */
    @Column(unique = true)
    private String uuid;

    /** Terminal de origen (ej: "WEB", "APP_MOBILE"). */
    private String terminal;

    // --- Identificación ---
    @Column(nullable = false)
    private String numeroOrden; // Turno FIFO (Ej: "A-102")

    @Column(nullable = false)
    private String vendedorNombre;

    @Column(nullable = false)
    @JsonProperty("clienteNombre")
    private String cliente;

    @Column(nullable = false)
    @JsonProperty("fechaCreacion")
    private LocalDateTime fecha;

    @Column
    private LocalDateTime fechaCierre;

    // --- Estado del Flujo ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPedido estado = EstadoPedido.PENDIENTE; // PENDIENTE -> EN_COLA -> ATENDIENDO -> COMPLETADO

    @Column(name = "en_caja")
    private Boolean enCaja = false; // true = visible en la cola de caja

    // --- Control de Concurrencia (Locks) ---
    @Column(name = "cajero_atendiendo")
    private String cajeroAtendiendo; // Usuario que tiene el lock

    @Column(name = "lock_timestamp")
    private LocalDateTime lockTimestamp; // Para liberar locks expirados

    // --- Detalles Financieros ---
    @Column(nullable = false)
    private BigDecimal total = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private MetodoPago metodoPago;

    @Column(name = "monto_entregado")
    private BigDecimal montoEntregado; // Para calcular vuelto

    // --- Items ---
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "pedido_id")
    private List<PedidoItem> items = new ArrayList<>();

    public enum EstadoPedido {
        PENDIENTE, // Vendedor armando
        EN_COLA, // Enviado a caja
        ATENDIENDO, // Cajera editando
        COMPLETADO, // Cobrado y Stock descontado
        CANCELADO
    }

    public enum MetodoPago {
        EFECTIVO,
        DEBITO,
        CREDITO,
        TRANSFERENCIA,
        QR,
        CTA_CTE,
        CUOTAS_3,
        NARANJA_8,
        OTRO
    }
}
