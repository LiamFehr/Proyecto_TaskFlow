package com.proyecto.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "presupuestos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Presupuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String vendedorEmail;
    private String clienteNombre;
    private String clienteTelefono;
    private String dniCuit;
    private String condicionIva;
    private String ciudad;
    private String provincia;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    private BigDecimal total;

    private LocalDateTime fecha;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "presupuesto_id")
    private List<PresupuestoItem> items = new ArrayList<>();
}
