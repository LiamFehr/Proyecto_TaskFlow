package com.proyecto.dto;

import lombok.Data;
import java.util.List;

@Data
public class PresupuestoDto {
    private String clienteNombre;
    private String clienteTelefono;
    private String observaciones;

    // New fields
    private String dniCuit;
    private String condicionIva;
    private String ciudad;
    private String provincia;
    private List<PresupuestoItemDto> items;

    @Data
    public static class PresupuestoItemDto {
        private Long productId; // Optional, null if manual
        private String description;
        private Double price;
        private Integer quantity;
    }
}
