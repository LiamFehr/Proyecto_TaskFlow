package com.proyecto.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "importaciones_csv")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportacionCsv {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false)
    private String archivo;

    @Column(nullable = false)
    private int productosInsertados;

    @Column(nullable = false)
    private int productosActualizados;

    @Column(columnDefinition = "TEXT")
    private String errores;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();
}
