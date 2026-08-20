package com.proyecto.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "presupuesto_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresupuestoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;
    private String description;
    private BigDecimal price;
    private BigDecimal quantity;
}
