package com.proyecto.service;

import com.proyecto.dto.DashboardMetricsDto;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class MetricService {

    private final ProductRepository productRepository;
    private final StockService stockService;

    public DashboardMetricsDto getDashboardMetrics() {
        return DashboardMetricsDto.builder()
                .valorStockTotal(productRepository.getTotalStockValue() != null ? productRepository.getTotalStockValue() : BigDecimal.ZERO)
                .productosCriticos(stockService.countLowStock())
                .marcasConSobreStock(productRepository.countOverStock())
                .ventasPorMes(new HashMap<>())
                .alertasRecientes(new ArrayList<>())
                .build();
    }
}
