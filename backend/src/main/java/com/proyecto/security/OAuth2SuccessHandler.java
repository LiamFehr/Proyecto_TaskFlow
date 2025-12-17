package com.proyecto.security;

import com.proyecto.model.Usuario;
import com.proyecto.repository.UsuarioRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        // Google uses "email", GitHub might use "login". For Google it is "email".
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null) {
            throw new ServletException("Email not found from OAuth2 provider");
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        Usuario usuario;

        if (usuarioOpt.isPresent()) {
            usuario = usuarioOpt.get();
        } else {
            // Register new user via Google
            usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setNombre(name != null ? name : "Usuario Google");
            usuario.setPasswordHash(""); // No password for OAuth users
            usuario.setRol("CLIENTE"); // Explicit String "CLIENTE"
            usuario.setActivo(true);
            usuarioRepository.save(usuario);
        }

        // Generate JWT
        String token = jwtUtil.generarToken(usuario);

        // Redirect to Frontend with Token
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/oauth/callback?token=" + token);
    }
}
