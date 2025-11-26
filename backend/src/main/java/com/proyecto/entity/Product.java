package com.proyecto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "items_active", schema = "public")
@Data
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "legacy_id")
    private Long legacyId;

    // codigo interno
    @Column(name = "code")
    private String code;

    // codigo de barras
    @Column(name = "barcode")
    private String barcode;

    @Column(name = "description", nullable = false)
    private String description;

    private BigDecimal price;

    private Boolean hidden;

    private Boolean searchable;

}
