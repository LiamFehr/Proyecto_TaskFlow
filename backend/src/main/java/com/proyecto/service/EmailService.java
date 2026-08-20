package com.proyecto.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@lombok.extern.slf4j.Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${mail.from}")
    private String mailFrom;

    @org.springframework.beans.factory.annotation.Value("${app.base-url}")
    private String appBaseUrl;

    public EmailService(
            @org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarRecuperacion(String to, String token) {
        if (mailSender == null) {
            log.warn("Intento de envío de email fallido: SMTP no configurado. Token: {}", token);
            // En entorno real, esto podría lanzar excepción o manejarse silenciosamente
            // según regla de negocio.
            // Para recuperación de contraseña, es crítico avisar que falló.
            throw new IllegalStateException("El servicio de email no está configurado. Contacte al administrador.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Recuperación de Contraseña - TaskFlow");
        message.setText("Hola,\n\n" +
                "Has solicitado recuperar tu contraseña.\n\n" +
                "Código: " + token + "\n\n" +
                "O haz clic en el siguiente enlace para restablecerla directamente:\n" +
                "" + appBaseUrl + "/recuperar?token=" + token + "&email=" + to + "\n\n" +
                "Este código expirará en 1 hora.\n" +
                "Si no solicitaste este cambio, ignora este mensaje.\n\n" +
                "Saludos,\nEl equipo de TaskFlow");

        mailSender.send(message);
    }
}
