package com.proyecto.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registra todas las sesiones WebSocket activas.
 * Permite cerrar sesiones antiguas cuando el ERP reconecta.
 */
@Component
@Slf4j
public class WebSocketSessionRegistry {

    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void register(WebSocketSession session) {
        sessions.put(session.getId(), session);
    }

    public void unregister(String sessionId) {
        sessions.remove(sessionId);
    }

    public int getActiveCount() {
        return sessions.size();
    }

    /**
     * Cierra todas las sesiones excepto la indicada.
     * Se llama cuando el ERP abre una nueva conexión para limpiar las anteriores.
     */
    public void closeOtherSessions(String keepSessionId) {
        sessions.forEach((id, session) -> {
            if (!id.equals(keepSessionId) && session.isOpen()) {
                try {
                    log.info("Cerrando sesión WebSocket obsoleta: {}", id);
                    session.close(CloseStatus.GOING_AWAY);
                } catch (IOException e) {
                    log.warn("No se pudo cerrar sesión {}: {}", id, e.getMessage());
                }
            }
        });
    }
}
