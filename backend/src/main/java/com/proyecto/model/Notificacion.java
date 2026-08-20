package com.proyecto.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false)
    private String mensaje;

    @Column(nullable = false)
    private String rolDestino; // VENDEDOR, ADMIN

    @Builder.Default
    private boolean leida = false;

    @Column(nullable = false)
    private LocalDateTime fecha;

    private Long pedidoId;
}
