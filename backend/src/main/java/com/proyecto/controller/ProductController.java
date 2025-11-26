package com.proyecto.controller;

import com.proyecto.dto.ProductDto;
import com.proyecto.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductDto>> getAll(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productService.getAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ProductDto>> search(
            @RequestParam("q") String text,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productService.search(text, pageable));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ProductDto> findByCode(@PathVariable String code) {
        return ResponseEntity.ok(productService.findByCode(code));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ProductDto> findByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(productService.findByBarcode(barcode));
    }
}
