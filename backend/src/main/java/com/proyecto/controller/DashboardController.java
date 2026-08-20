package com.proyecto.controller;

import com.proyecto.dto.DashboardStatsDto;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ProductRepository productRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats() {
        // Real Calculations
        BigDecimal totalValue = productRepository.getTotalStockValue();
        if (totalValue == null)
            totalValue = BigDecimal.ZERO;

        long criticalCount = productRepository.countCriticalStock();
        long overstockCount = productRepository.countOverStock();

        // Ventas Mes - Mock for now until Sales module is fully active
        long ventasMes = 0;

        return ResponseEntity.ok(DashboardStatsDto.builder()
                .stockValor("$ " + NumberFormat.getNumberInstance(Locale.US).format(totalValue))
                .stockTrend("+0%") // Dynamic trend requires historical data
                .criticos(criticalCount)
                .sobreStock(overstockCount)
                .ventasMes(ventasMes)
                .build());
    }
}
