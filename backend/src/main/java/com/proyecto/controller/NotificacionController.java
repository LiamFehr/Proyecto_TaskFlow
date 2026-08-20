package com.proyecto.controller;

import com.proyecto.model.Notificacion;
import com.proyecto.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/notificaciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificacionController {

    private final NotificacionService service;

    @GetMapping("/unread")
    public List<Notificacion> getUnread(@RequestParam String role) {
        return service.getUnreadByRole(role);
    }

    @PostMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        service.markAsRead(id);
    }
}
