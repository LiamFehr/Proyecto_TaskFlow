package com.proyecto.service;

import com.proyecto.model.PaymentMethod;
import com.proyecto.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConfigServiceImpl implements ConfigService {

    private final PaymentMethodRepository repository;

    @Override
    @Transactional
    public void sincronizarMetodosPago(List<Map<String, Object>> methods) {
        if (methods == null) return;
        
        log.info("Sincronizando {} medios de pago desde el ERP (Limpiando previos...)", methods.size());
        
        // Limpiamos los métodos anteriores para que no queden duplicados de instalaciones previas o setups manuales
        repository.deleteAllInBatch();

        for (Map<String, Object> data : methods) {
            PaymentMethod m = PaymentMethod.builder()
                    .erpId(((Number) data.get("idLocal")).longValue())
                    .name((String) data.getOrDefault("name", ""))
                    .type((String) data.getOrDefault("type", "CASH"))
                    .iconKey((String) data.getOrDefault("iconKey", ""))
                    .adjustmentType((String) data.getOrDefault("adjustmentType", "none"))
                    .build();
            
            Object adjVal = data.get("adjustmentValue");
            if (adjVal instanceof Number) {
                m.setAdjustmentValue(new BigDecimal(adjVal.toString()));
            } else {
                m.setAdjustmentValue(BigDecimal.ZERO);
            }

            m.setActive((Boolean) data.getOrDefault("active", true));
            m.setDisplayOrder(((Number) data.getOrDefault("displayOrder", 0)).intValue());
            m.setBackground((String) data.getOrDefault("background", ""));
            m.setTextColor((String) data.getOrDefault("textColor", ""));

            m.setInstallmentsEnabled((Boolean) data.getOrDefault("installmentsEnabled", false));
            m.setInstallmentsQuantity(data.containsKey("installmentsQuantity") && data.get("installmentsQuantity") != null 
                    ? ((Number) data.get("installmentsQuantity")).intValue() : null);
            
            Object intPer = data.get("interestPercent");
            if (intPer instanceof Number) {
                m.setInterestPercent(new BigDecimal(intPer.toString()));
            } else {
                m.setInterestPercent(BigDecimal.ZERO);
            }

            repository.save(m);
        }
    }

    @Override
    public List<PaymentMethod> obtenerMetodosPagoActivos() {
        return repository.findByActiveTrueOrderByDisplayOrderAsc();
    }
}
