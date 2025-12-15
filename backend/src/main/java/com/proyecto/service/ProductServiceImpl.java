package com.proyecto.service;

import com.proyecto.dto.ProductDto;
import com.proyecto.model.Product;
import com.proyecto.exception.ProductNotFoundException;
import com.proyecto.mapper.ProductMapper;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    public Page<ProductDto> getAll(Pageable pageable) {
        Page<Product> products = productRepository.findByHiddenFalseAndSearchableTrue(pageable);
        return products.map(productMapper::toDto);
    }

    @Override
    public ProductDto getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Producto no encontrado con ID: " + id));
        return productMapper.toDto(product);
    }

    @Override
    public Page<ProductDto> search(String text, Pageable pageable) {
        // Use the new explicit query method for strict code/barcode search
        Page<Product> products = productRepository.searchByCodeOrBarcode(text, pageable);
        return products.map(productMapper::toDto);
    }

    @Override
    public ProductDto findByCode(String code) {
        Product product = productRepository.findByCodeAndHiddenFalseAndSearchableTrue(code)
                .orElseThrow(() -> new ProductNotFoundException("Producto no encontrado con código: " + code));
        return productMapper.toDto(product);
    }

    @Override
    public ProductDto findByBarcode(String barcode) {
        Product product = productRepository.findByBarcodeAndHiddenFalseAndSearchableTrue(barcode)
                .orElseThrow(
                        () -> new ProductNotFoundException("Producto no encontrado con código de barras: " + barcode));
        return productMapper.toDto(product);
    }
}