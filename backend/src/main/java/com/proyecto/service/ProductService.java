package com.proyecto.service;

import com.proyecto.dto.ProductDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    Page<ProductDto> getAll(Pageable pageable);

    ProductDto getById(Long id);

    Page<ProductDto> search(String text, Pageable pageable);

    ProductDto findByCode(String code);

    ProductDto findByBarcode(String barcode);
}
