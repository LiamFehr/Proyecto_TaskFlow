package com.proyecto.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.proyecto.entity.Product;
import com.proyecto.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ProductController {

    private final ProductService service;

    @GetMapping
    public List<Product> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/search")
    public List<Product> search(@RequestParam String q) {
        return service.search(q);
    }

    @GetMapping("/code/{code}")
    public Product findByCode(@PathVariable String code) {
        return service.findByCode(code);
    }

    @GetMapping("/barcode/{barcode}")
    public Product findByBarcode(@PathVariable String barcode) {
        return service.findByBarcode(barcode);
    }
}
