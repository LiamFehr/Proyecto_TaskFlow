package com.proyecto.controller;

import com.proyecto.model.PaymentMethod;
import com.proyecto.service.ConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
@RequiredArgsConstructor
@CrossOrigin
public class ConfigController {

    private final ConfigService configService;

    @PutMapping("/payment-methods")
    public ResponseEntity<Map<String, String>> syncPaymentMethods(@RequestBody Map<String, List<Map<String, Object>>> body) {
        List<Map<String, Object>> methods = body.get("methods");
        if (methods != null) {
            configService.sincronizarMetodosPago(methods);
        }
        return ResponseEntity.ok(Map.of(
            "status", "OK",
            "mensaje", "Métodos de pago sincronizados correctamente"
        ));
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<List<PaymentMethod>> getPaymentMethods() {
        return ResponseEntity.ok(configService.obtenerMetodosPagoActivos());
    }
}
