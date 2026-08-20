package com.proyecto.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarcaDto {
    private Long id;
    private String nombre;
    private String proveedor;
    private Integer leadTimeDias;
    private Boolean activo;
}
