package com.proyecto.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
public class DashboardMetricsDto {
    private BigDecimal valorStockTotal;
    private long productosCriticos;
    private long marcasConSobreStock;
    private Map<String, Long> ventasPorMes; // E.g., "Jan" -> 120
    private List<String> alertasRecientes;
}
