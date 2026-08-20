package com.proyecto.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoPedidoDTO {
    private String codigo;
    private String descripcion;
    private BigDecimal cantidad;
    private BigDecimal precio;
}
