package com.proyecto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "item")
@Data
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // codigo interno
    @Column(name = "code")
    private String code;

    // codigo de barras
    @Column(name = "barcode")
    private String barcode;

    @Column(name = "description", nullable = false)
    private String description;

    private Double price;

    private Double stock;

}
