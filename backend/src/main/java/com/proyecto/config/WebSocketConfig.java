package com.proyecto.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketSecurityInterceptor wsSecurityInterceptor;
    private final ErpWebSocketDecoratorFactory erpWebSocketDecoratorFactory;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Con SockJS (para browsers/web)
        registry.addEndpoint("/ws-next-system")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Raw WebSocket (para el cliente Tauri del ERP)
        registry.addEndpoint("/ws-next-system-raw")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        registry.addDecoratorFactory(erpWebSocketDecoratorFactory);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(wsSecurityInterceptor);
    }
}
