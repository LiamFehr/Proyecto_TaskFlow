package com.proyecto.controller;

import com.proyecto.model.Usuario;
import com.proyecto.service.AuthService;
import com.proyecto.service.OtpService;
import com.proyecto.service.RecuperacionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final AuthService authService;
    private final RecuperacionService recuperacionService;
    private final OtpService otpService;

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody RegistroRequest request) {
        try {
            Usuario usuario = authService.registrarCliente(
                    request.getNombre(),
                    request.getEmail(),
                    request.getPassword());
            return ResponseEntity.ok(new MessageResponse("Usuario registrado con id: " + usuario.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String jwt = authService.login(request.getEmail(), request.getPassword());
            Usuario usuario = authService.obtenerPorEmail(request.getEmail()).orElseThrow();
            return ResponseEntity.ok(new TokenResponse(jwt, usuario.getRol(), usuario.getEmail(), usuario.getNombre()));
        } catch (IllegalArgumentException e) {
            // Credenciales inválidas
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (IllegalStateException e) {
            // Usuario inactivo etc
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @PostMapping("/recuperar")
    public ResponseEntity<?> solicitarRecuperacion(@RequestBody RecuperarRequest request) {
        String token = recuperacionService.generarTokenRecuperacion(request.getEmail());
        return ResponseEntity.ok(new MessageResponse("Token generado (enviar por email): " + token));
    }

    @PostMapping("/recuperar/confirmar")
    public ResponseEntity<?> confirmarRecuperacion(@RequestBody ConfirmarRecuperarRequest request) {
        recuperacionService.cambiarPassword(request.getToken(), request.getNuevaPassword());
        return ResponseEntity.ok("Contraseña actualizada");
    }

    // 2FA se integraría en login real; aquí solo stub
    @PostMapping("/2fa/enviar")
    public ResponseEntity<?> enviar2fa(@RequestBody SimpleEmailRequest request) {
        // Ejemplo de uso para callar warning (en produccion buscar Usuario)
        // Usuario u = authService.obtenerPorEmail(request.getEmail()).orElseThrow();
        // otpService.generarOtp(u);
        return ResponseEntity.ok("2FA enviado (stub) - Service " + otpService.getClass().getSimpleName());
    }

    @PostMapping("/2fa/validar")
    public ResponseEntity<?> validar2fa() {
        // otpService.validarOtp(...)
        return ResponseEntity.ok("2FA validado (stub) " + otpService.getClass().getSimpleName());
    }

    // DTOs internos
    @Data
    public static class RegistroRequest {
        private String nombre;
        private String email;
        private String password;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RecuperarRequest {
        private String email;
    }

    @Data
    public static class ConfirmarRecuperarRequest {
        private String token;
        private String nuevaPassword;
    }

    @Data
    public static class SimpleEmailRequest {
        private String email;
    }

    @Data
    @lombok.AllArgsConstructor
    public static class TokenResponse {
        private final String token;
        private final String rol;
        private final String email;
        private final String nombre;
    }

    @Data
    @lombok.AllArgsConstructor
    public static class MessageResponse {
        private String message;
    }
}
