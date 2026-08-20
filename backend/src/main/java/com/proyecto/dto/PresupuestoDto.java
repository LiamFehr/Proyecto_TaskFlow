package com.proyecto.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PresupuestoDto {
    private String clienteNombre;
    private String clienteTelefono;
    private String observaciones;
    private String dniCuit;
    private String condicionIva;
    private String ciudad;
    private String provincia;
    private List<ItemDto> items;

    @Data
    public static class ItemDto {
        private Long productId;
        private String description;
        private BigDecimal price;
        private BigDecimal quantity;
    }
}
