package com.proyecto.service;

import com.proyecto.model.Otp2FA;
import com.proyecto.model.Usuario;
import com.proyecto.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;

    public Otp2FA generarOtp(Usuario usuario) {
        // invalidar anteriores
        List<Otp2FA> activos = otpRepository
                .findByUsuarioAndUsadoFalseAndExpiracionAfter(usuario, LocalDateTime.now());
        activos.forEach(o -> {
            o.setUsado(true);
            otpRepository.save(o);
        });

        String codigo = String.format("%06d", new Random().nextInt(1_000_000));

        Otp2FA otp = Otp2FA.builder()
                .usuario(usuario)
                .codigo(codigo)
                .expiracion(LocalDateTime.now().plusMinutes(5))
                .usado(false)
                .build();

        return otpRepository.save(otp);
    }

    public boolean validarOtp(Usuario usuario, String codigoIngresado) {
        List<Otp2FA> activos = otpRepository
                .findByUsuarioAndUsadoFalseAndExpiracionAfter(usuario, LocalDateTime.now());

        return activos.stream()
                .filter(o -> o.getCodigo().equals(codigoIngresado))
                .findFirst()
                .map(o -> {
                    o.setUsado(true);
                    otpRepository.save(o);
                    return true;
                })
                .orElse(false);
    }
}
