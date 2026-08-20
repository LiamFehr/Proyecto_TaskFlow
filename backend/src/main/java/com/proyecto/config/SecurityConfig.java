package com.proyecto.config;

import com.proyecto.repository.UsuarioRepository;
import com.proyecto.security.JwtAuthenticationFilter;
import com.proyecto.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
public class SecurityConfig {

        private final JwtUtil jwtUtil;
        private final UsuarioRepository usuarioRepository;
        private final com.proyecto.security.OAuth2SuccessHandler oAuth2SuccessHandler;

        @Value("${relay.api.auth-token:changeme}")
        private String relayApiToken;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtUtil, usuarioRepository);

                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                 // Public Endpoints
                                                 .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                                                 .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                                                 .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()

                                                 // Public Resources (Catalog & Cart)
                                                 .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                                                 .requestMatchers(HttpMethod.GET, "/api/items/**").permitAll()
                                                 .requestMatchers("/api/ocr/**").permitAll()

                                                 // WebSocket handshake — el token se valida en el frame STOMP
                                                 .requestMatchers("/ws-next-system/**", "/ws-next-system-raw/**").permitAll()

                                                 // Pedidos remotos — público (Escritorio recibe el JSON, lo mete en su grilla de 'Pendientes')
                                                 .requestMatchers(HttpMethod.POST, "/api/pedidos/remotos").permitAll()

                                                 // Catálogo público para la web (Self-Service)
                                                 .requestMatchers(HttpMethod.GET, "/api/inventario/productos").permitAll()
                                                 .requestMatchers(HttpMethod.GET, "/api/inventario/categorias").permitAll()
                                                 .requestMatchers(HttpMethod.PUT, "/api/v1/inventario/sincronizar").permitAll()
                                                 .requestMatchers(HttpMethod.PUT, "/api/v1/config/payment-methods").permitAll()
                                                 .requestMatchers("/api/v1/config/payment-methods").permitAll()

                                                 // Presupuestos — requiere login (vendedor/admin)
                                                 .requestMatchers("/api/presupuestos/**").hasAnyRole("VENDEDOR", "ADMIN")

                                                 // Role-based Access
                                                 .requestMatchers(HttpMethod.GET, "/api/vendedor/productos").permitAll()
                                                 .requestMatchers("/api/vendedor/**").hasAnyRole("VENDEDOR", "ADMIN")
                                                 .requestMatchers("/api/pedidos/**").permitAll() // Habilitamos acceso público para el carrito de autoservicio

                                                 .anyRequest().authenticated())
                                .exceptionHandling(e -> e.authenticationEntryPoint(
                                                new org.springframework.security.web.authentication.HttpStatusEntryPoint(
                                                                org.springframework.http.HttpStatus.UNAUTHORIZED)))
                                .oauth2Login(oauth2 -> oauth2
                                                .authorizationEndpoint(authorization -> authorization
                                                                .baseUri("/api/oauth2/authorization"))
                                                .redirectionEndpoint(redirection -> redirection
                                                                .baseUri("/api/login/oauth2/code/*"))
                                                .successHandler(oAuth2SuccessHandler))
                                .addFilterBefore(new ApiKeyFilter(relayApiToken), UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        /**
         * Filtro que autentica requests con header X-Api-Key.
         * Usado por el ERP de escritorio para /api/v1/inventario/sincronizar,
         * /api/pedidos/pendientes-erp y /api/pedidos/{uuid}/confirmar.
         */
        static class ApiKeyFilter extends org.springframework.web.filter.OncePerRequestFilter {
                private final String expectedToken;
                ApiKeyFilter(String expectedToken) { this.expectedToken = expectedToken; }

                @Override
                protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                        throws IOException, ServletException {
                        String token = req.getHeader("X-Api-Key");
                        if (token != null && expectedToken.equals(token)) {
                                org.springframework.security.core.Authentication auth =
                                        new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                                "erp-client", null, java.util.Collections.emptyList());
                                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                        chain.doFilter(req, res);
                }
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
                return cfg.getAuthenticationManager();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                configuration.setAllowedOrigins(List.of(
                                "http://localhost:5173",
                                "http://localhost:5174",
                                "http://localhost:5175",
                                "tauri://localhost",
                                "http://tauri.localhost",
                                "https://tauri.localhost",
                                "https://victorpetruccio.online",
                                "https://www.victorpetruccio.online"));

                configuration.setAllowedMethods(List.of(
                                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

                configuration.setAllowedHeaders(List.of(
                                "Authorization",
                                "Content-Type",
                                "Accept",
                                "X-Api-Key",
                                "X-Authorization-Token"));

                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);

                return source;
        }
}
