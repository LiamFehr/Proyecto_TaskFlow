package com.proyecto.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyecto.model.Product;
import com.proyecto.model.Usuario;
import com.proyecto.repository.ProductRepository;
import com.proyecto.repository.UsuarioRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BackupService {

    private final ProductRepository productRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    // Structure for the backup file
    @Data
    @Builder
    public static class FullBackup {
        private String timestamp;
        private List<Usuario> usuarios;
        private List<Product> productos;
        // Add orders here if they exist in DB
    }

    public byte[] generateJsonBackup() {
        try {
            List<Usuario> usuarios = usuarioRepository.findAll();
            List<Product> productos = productRepository.findAll();

            FullBackup backup = FullBackup.builder()
                    .timestamp(LocalDateTime.now().toString())
                    .usuarios(usuarios)
                    .productos(productos)
                    .build();

            String jsonString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(backup);
            return jsonString.getBytes(StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new RuntimeException("Error generating backup", e);
        }
    }
}
