package com.proyecto.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documentos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDocumento tipo;

    @Column(name = "archivo_original")
    private String archivoOriginal;

    @Column(nullable = false)
    private LocalDateTime fecha;

    private String usuario;

    private String hash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoDocumento estado;

    @Column(columnDefinition = "TEXT")
    private String detallesJson;
}
