package com.proyecto.controller;

import com.proyecto.dto.ProductDto;
import com.proyecto.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @GetMapping
    public ResponseEntity<Page<ProductDto>> getStock(
            @RequestParam(required = false) Long marcaId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean alertOnly,
            Pageable pageable) {
        return ResponseEntity.ok(stockService.getStock(marcaId, search, alertOnly, pageable));
    }
}
