package com.proyecto.config;

import com.proyecto.model.Usuario;
import com.proyecto.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        crearUsuarioSiNoExiste("admin@taskflow.com", "admin123", "Administrador", "ADMIN");
        crearUsuarioSiNoExiste("vendedor@taskflow.com", "vendedor123", "Vendedor", "VENDEDOR");
    }

    private void crearUsuarioSiNoExiste(String email, String password, String nombre, String rol) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElse(Usuario.builder()
                        .email(email)
                        .build());

        usuario.setNombre(nombre);
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario.setPasswordHash(passwordEncoder.encode(password)); // Siempre actualiza la contraseña

        usuarioRepository.save(usuario);
        System.out.println("Usuario actualizado/creado: " + email + " / " + password + " (" + rol + ")");
    }
}
