package com.proyecto.service;

import com.proyecto.dto.ProductDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StockService {
    long countLowStock();
    Page<ProductDto> getStock(Long marcaId, String search, Boolean alertOnly, Pageable pageable);
}
