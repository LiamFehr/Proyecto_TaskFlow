package com.proyecto.service;

import com.proyecto.model.RecuperacionToken;
import com.proyecto.model.Usuario;
import com.proyecto.repository.RecuperacionTokenRepository;
import com.proyecto.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RecuperacionService {

    private final RecuperacionTokenRepository tokenRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public String generarTokenRecuperacion(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // Generate 6-char alphanumeric code
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar chars (I,1,0,O)
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        String token = sb.toString();

        RecuperacionToken rec = RecuperacionToken.builder()
                .token(token)
                .usuario(usuario)
                .expiracion(LocalDateTime.now().plusHours(1))
                .usado(false)
                .build();

        tokenRepository.save(rec);

        // enviar email con el token
        // enviar email con el token
        emailService.enviarRecuperacion(usuario.getEmail(), token);

        return token;
    }

    public void cambiarPassword(String token, String nuevaPassword) {
        RecuperacionToken rec = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido"));

        if (rec.isUsado() || rec.getExpiracion().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Token expirado o ya usado");
        }

        if (nuevaPassword == null || nuevaPassword.length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres.");
        }

        Usuario usuario = rec.getUsuario();
        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        rec.setUsado(true);
        tokenRepository.save(rec);
    }
}
