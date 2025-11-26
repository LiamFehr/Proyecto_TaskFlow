package com.proyecto.service;

import com.proyecto.entity.Product;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository repo;

    @Override
    public List<Product> getAll() {
        // Solo retorna items visibles y buscables
        return repo.findByHiddenFalseAndSearchableTrue();
    }

    @Override
    public Product getById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    @Override
    public List<Product> search(String text) {
        // Solo busca en items visibles y buscables
        return repo.findByDescriptionContainingIgnoreCaseAndHiddenFalseAndSearchableTrue(text);
    }

    @Override
    public Product findByCode(String code) {
        return repo.findByCodeAndHiddenFalseAndSearchableTrue(code)
                .orElseThrow(() -> new RuntimeException("Producto con código " + code + " no encontrado"));
    }

    @Override
    public Product findByBarcode(String barcode) {
        return repo.findByBarcodeAndHiddenFalseAndSearchableTrue(barcode)
                .orElseThrow(() -> new RuntimeException("Producto con código de barras " + barcode + " no encontrado"));
    }
}