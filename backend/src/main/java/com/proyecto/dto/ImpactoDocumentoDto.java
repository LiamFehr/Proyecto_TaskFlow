package com.proyecto.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class ImpactoDocumentoDto {
    private String code;
    private String marca;
    private String description;

    private BigDecimal stockActual;
    private BigDecimal stockNuevo;
    private BigDecimal diferenciaStock;

    private BigDecimal precioActual;
    private BigDecimal precioNuevo;
    private BigDecimal diferenciaPrecioPorcentaje;

    private boolean esOutlier; // Para precios
    private String mensaje;
}
