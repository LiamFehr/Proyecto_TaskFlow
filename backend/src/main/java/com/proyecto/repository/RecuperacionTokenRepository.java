package com.proyecto.repository;

import com.proyecto.model.RecuperacionToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface RecuperacionTokenRepository extends JpaRepository<RecuperacionToken, UUID> {

    Optional<RecuperacionToken> findByToken(String token);
}
