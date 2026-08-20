package com.proyecto.service;

import com.proyecto.model.PaymentMethod;
import java.util.List;
import java.util.Map;

public interface ConfigService {
    void sincronizarMetodosPago(List<Map<String, Object>> methods);
    List<PaymentMethod> obtenerMetodosPagoActivos();
}
