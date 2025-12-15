package com.proyecto.repository;

import com.proyecto.model.Otp2FA;
import com.proyecto.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface OtpRepository extends JpaRepository<Otp2FA, UUID> {

    List<Otp2FA> findByUsuarioAndUsadoFalseAndExpiracionAfter(
            Usuario usuario,
            LocalDateTime now);
}
