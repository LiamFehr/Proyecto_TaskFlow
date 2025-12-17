package com.proyecto.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void enviarRecuperacion(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("no-reply@victorpetruccio.online");
        message.setTo(to);
        message.setSubject("Recuperación de Contraseña - TaskFlow");
        message.setText("Hola,\n\n" +
                "Has solicitado recuperar tu contraseña.\n\n" +
                "Código: " + token + "\n\n" +
                "O haz clic en el siguiente enlace para restablecerla directamente:\n" +
                "https://victorpetruccio.online/recuperar?token=" + token + "&email=" + to + "\n\n" +
                "Este código expirará en 1 hora.\n" +
                "Si no solicitaste este cambio, ignora este mensaje.\n\n" +
                "Saludos,\nEl equipo de TaskFlow");

        mailSender.send(message);
    }
}
