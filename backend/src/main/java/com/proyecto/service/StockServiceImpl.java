package com.proyecto.service;

import com.proyecto.dto.ProductDto;
import com.proyecto.mapper.ProductMapper;
import com.proyecto.model.Marca;
import com.proyecto.repository.MarcaRepository;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {
    private final ProductRepository productRepository;
    private final MarcaRepository marcaRepository;
    private final ProductMapper productMapper;

    @Override
    public long countLowStock() {
        return productRepository.countCriticalStock();
    }

    @Override
    public Page<ProductDto> getStock(Long marcaId, String search, Boolean alertOnly, Pageable pageable) {
        String marcaNombre = null;
        if (marcaId != null) {
            marcaNombre = marcaRepository.findById(marcaId)
                    .map(Marca::getNombre)
                    .orElse(null);
        }

        boolean alert = alertOnly != null && alertOnly;
        
        return productRepository.findWithFiltersAndStockAlert(search, marcaNombre, false, alert, pageable)
                .map(productMapper::toDto);
    }
}
