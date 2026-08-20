package com.proyecto.dto;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PedidoRemotoDTO {
    @NotBlank private String uuid;
    @NotBlank private String clienteNombre;
    @NotEmpty @Valid private List<ItemRequestDTO> items;
    private BigDecimal total;
    private String terminal;
    private String notas;

    @Data
    public static class ItemRequestDTO {
        private Long productoId;      // null = item manual (sin producto en catálogo)
        private String descripcion;   // requerido si productoId es null
        @NotNull @DecimalMin("0.01") private BigDecimal cantidad;
        private BigDecimal precioUnitario;
        /** Alícuota IVA en porcentaje (ej: 21.00, 10.50, 0.00). Null = usar defecto del producto o 21%. */
        private BigDecimal vatRate;
    }
}
