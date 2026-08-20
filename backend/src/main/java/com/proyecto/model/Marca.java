package com.proyecto.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "marcas")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Marca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la marca es obligatorio")
    @Column(unique = true, nullable = false)
    private String nombre;

    private String proveedor;

    @Column(name = "lead_time_dias")
    private Integer leadTimeDias;

    @Builder.Default
    private Boolean activo = true;
}
