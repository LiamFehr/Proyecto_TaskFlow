package com.proyecto.controller;

import com.proyecto.dto.DashboardMetricsDto;
import com.proyecto.service.MetricService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final MetricService metricService;

    @GetMapping
    public ResponseEntity<DashboardMetricsDto> getMetrics() {
        return ResponseEntity.ok(metricService.getDashboardMetrics());
    }

}
