package com.proyecto.service;

import com.proyecto.model.Notificacion;
import com.proyecto.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {
    private final RelayBroadcastService relayBroadcastService;
    private final NotificacionRepository repository;

    @Transactional
    public void notify(String rol, String titulo, String mensaje, Long pedidoId) {
        Notificacion n = Notificacion.builder()
                .titulo(titulo)
                .mensaje(mensaje)
                .rolDestino(rol)
                .fecha(LocalDateTime.now())
                .pedidoId(pedidoId)
                .leida(false)
                .build();
        Notificacion saved = repository.save(n);
        relayBroadcastService.broadcastNotification(saved); // BROACAST
    }

    public List<Notificacion> getUnreadByRole(String role) {
        return repository.findByRolDestinoAndLeidaOrderByFechaDesc(role, false);
    }

    @Transactional
    public void markAsRead(Long id) {
        repository.findById(id).ifPresent(n -> {
            n.setLeida(true);
            repository.save(n);
        });
    }
}
