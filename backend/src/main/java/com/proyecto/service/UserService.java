package com.proyecto.service;

import com.proyecto.model.Usuario;
import com.proyecto.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UsuarioRepository usuarioRepository;

    public Usuario obtenerPorId(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    public Usuario actualizarNombre(UUID id, String nuevoNombre) {
        Usuario usuario = obtenerPorId(id);
        usuario.setNombre(nuevoNombre);
        return usuarioRepository.save(usuario);
    }

    public void suspenderUsuario(UUID id) {
        Usuario usuario = obtenerPorId(id);
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }
}
