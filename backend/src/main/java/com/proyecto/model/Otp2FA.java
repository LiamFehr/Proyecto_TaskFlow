package com.proyecto.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "otp_2fa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Otp2FA {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 6)
    private String codigo; // 6 dígitos

    @Column(nullable = false)
    private LocalDateTime expiracion;

    @Builder.Default
    @Column(nullable = false)
    private boolean usado = false;
}
