package com.proyecto.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;
import org.springframework.web.socket.handler.WebSocketHandlerDecoratorFactory;

/**
 * Registra y desregistra sesiones WebSocket en el WebSocketSessionRegistry.
 * Se usa en WebSocketConfig para rastrear conexiones activas del ERP.
 * Extraído como clase nombrada para evitar problemas de CGLIB con clases anónimas.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ErpWebSocketDecoratorFactory implements WebSocketHandlerDecoratorFactory {

    private final WebSocketSessionRegistry sessionRegistry;

    @Override
    public WebSocketHandler decorate(WebSocketHandler handler) {
        return new WebSocketHandlerDecorator(handler) {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                sessionRegistry.register(session);
                log.debug("WebSocket session registered: {}", session.getId());
                super.afterConnectionEstablished(session);
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
                sessionRegistry.unregister(session.getId());
                log.debug("WebSocket session unregistered: {}", session.getId());
                super.afterConnectionClosed(session, status);
            }
        };
    }
}
