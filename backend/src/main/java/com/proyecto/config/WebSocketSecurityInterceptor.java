package com.proyecto.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Valida el header X-Authorization-Token en el frame STOMP CONNECT.
 * Solo la app de escritorio (ERP) puede mantener el canal abierto.
 * Cierra sesiones anteriores cuando el ERP reconecta para evitar duplicados.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketSecurityInterceptor implements ChannelInterceptor {

    @Value("${relay.ws.auth-token}")
    private String authToken;

    private final WebSocketSessionRegistry sessionRegistry;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("X-Authorization-Token");
            if (token == null || !authToken.equals(token)) {
                log.warn("WebSocket CONNECT rechazado: token inválido o ausente");
                throw new MessagingException("Token de autorización inválido");
            }

            String newSessionId = accessor.getSessionId();
            int prevCount = sessionRegistry.getActiveCount();

            // Cerrar todas las sesiones anteriores — solo 1 conexión ERP activa
            if (prevCount > 0) {
                log.info("ERP reconectando (sesión {}). Cerrando {} sesión(es) anterior(es).", newSessionId, prevCount);
                sessionRegistry.closeOtherSessions(newSessionId);
            }

            log.info("WebSocket ERP conectado — sesión: {}", newSessionId);
        }

        if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            log.info("WebSocket ERP desconectado — sesión: {}", accessor.getSessionId());
        }

        return message;
    }
}
