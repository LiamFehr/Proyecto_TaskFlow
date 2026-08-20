package com.proyecto.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsDto {
    private String stockValor;
    private String stockTrend;
    private long criticos;
    private long sobreStock;
    private long ventasMes;
}
