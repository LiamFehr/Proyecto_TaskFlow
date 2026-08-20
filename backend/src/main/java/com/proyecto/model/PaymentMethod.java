package com.proyecto.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

/**
 * Entidad para los métodos de pago sincronizados desde el ERP.
 */
@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID original en el ERP local */
    @Column(name = "erp_id", unique = true)
    private Long erpId;

    @Column(nullable = false)
    private String name;

    private String type; // CASH, DEBIT, CREDIT, TRANSFER, WAITING_PAYMENT

    private String iconKey;

    private String adjustmentType; // none, discount_percent, surcharge_percent, fixed_amount
    
    @Builder.Default
    private BigDecimal adjustmentValue = BigDecimal.ZERO;

    @Builder.Default
    private boolean active = true;

    private int displayOrder;

    private String background;
    private String textColor;

    // installments
    @Builder.Default
    private boolean installmentsEnabled = false;
    private Integer installmentsQuantity;
    private BigDecimal interestPercent;
}
