package com.proyecto.model;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;


@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_code", columnList = "code")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "enterprise_id", nullable = false)
    @Builder.Default
    private Long enterpriseId = 1L;

    @Column(unique = true, length = 50)
    private String code;

    @Column(length = 50)
    private String barcode;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(length = 500)
    private String description;

    // Pricing model
    @Column(name = "cost_price", precision = 19, scale = 2)
    private BigDecimal costPrice;

    @Column(name = "net_price", precision = 19, scale = 2)
    private BigDecimal netPrice;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal vatRate = new BigDecimal("21.00");

    @Column(name = "final_price", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal finalPrice = BigDecimal.ZERO;

    @Column(name = "price_source", nullable = false, length = 20)
    @Builder.Default
    private String priceSource = "FINAL";

    // Stock
    @Column(precision = 19, scale = 3)
    @Builder.Default
    private BigDecimal stock = BigDecimal.ZERO;

    @Column(name = "allow_negative_stock", nullable = false)
    @Builder.Default
    private Boolean allowNegativeStock = true;

    @Column(name = "stock_alert_threshold", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal stockAlertThreshold = new BigDecimal("10.00");

    // Attributes
    @Builder.Default
    private Boolean hidden = false;
    @Builder.Default
    private Boolean searchable = true;

    @Column(length = 100)
    private String marca;

    // Sync field
    /** ID del producto en el ERP de escritorio. Null hasta que se sincronice. */
    @Column(name = "erp_id")
    private Long erpId;

    // Optimistic locking
    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    @Column(name = "created_at")
    @Builder.Default
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private java.time.LocalDateTime updatedAt = java.time.LocalDateTime.now();

    // Compatibility for codebase using getPrice/setPrice
    public BigDecimal getPrice() {
        return finalPrice;
    }

    public void setPrice(BigDecimal price) {
        this.finalPrice = price;
    }
}
