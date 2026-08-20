package com.proyecto.service;

import com.proyecto.dto.ProductDto;
import com.proyecto.model.Product;
import com.proyecto.exception.ProductNotFoundException;
import com.proyecto.mapper.ProductMapper;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
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
    public Page<ProductDto> search(String text, String marca, Pageable pageable) {
        // Use findWithFilters to support marca filtering
        Page<Product> products = productRepository.findWithFilters(text, marca, false, pageable);
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

    @Override
    @Transactional
    public void sincronizar(List<Map<String, Object>> productos) {
        log.info("Iniciando sincronización de {} productos desde ERP", productos.size());

        // 1. Pre-cargar mapeo de ErpId y Codigo para evitar miles de SELECTs
        List<Long> incomingErpIds = productos.stream()
                .map(item -> (Number) item.get("idLocal"))
                .filter(java.util.Objects::nonNull)
                .map(Number::longValue)
                .toList();
        
        List<String> incomingCodes = productos.stream()
                .map(item -> (String) item.get("codigo"))
                .filter(java.util.Objects::nonNull)
                .toList();

        Map<Long, Product> existingByErpId = productRepository.findByErpIdIn(incomingErpIds).stream()
                .collect(java.util.stream.Collectors.toMap(Product::getErpId, p -> p, (p1, p2) -> p1));
        
        Map<String, Product> existingByCode = productRepository.findByCodeIn(incomingCodes).stream()
                .collect(java.util.stream.Collectors.toMap(Product::getCode, p -> p, (p1, p2) -> p1));

        int updated = 0;
        int created = 0;

        for (Map<String, Object> item : productos) {
            try {
                Long erpId = item.get("idLocal") != null ? ((Number) item.get("idLocal")).longValue() : null;
                String code = (String) item.get("codigo");
                
                Product product = null;
                if (erpId != null) product = existingByErpId.get(erpId);
                if (product == null && code != null) product = existingByCode.get(code);
                
                if (product == null) {
                    product = new Product();
                    created++;
                } else {
                    updated++;
                }
                
                product.setErpId(erpId);
                product.setCode(code);
                product.setBarcode((String) item.get("barcode"));
                product.setName((String) item.get("nombre"));
                product.setDescription((String) item.get("descripcion"));
                
                product.setFinalPrice(parseBigDecimal(item.get("precioFinal")));
                product.setNetPrice(parseBigDecimal(item.get("precioNeto")));
                product.setVatRate(parseBigDecimal(item.get("alicuotaIva")));
                product.setStock(parseBigDecimal(item.get("stock")));
                
                product.setMarca((String) item.get("marca"));
                product.setHidden(getBoolean(item.get("oculto"), false));
                product.setSearchable(getBoolean(item.get("searchable"), true));
                
                productRepository.save(product);
            } catch (Exception e) {
                log.error("Error sincronizando producto {}: {}", item.get("codigo"), e.getMessage());
            }
        }
        log.info("Sincronización finalizada: {} creados, {} actualizados", created, updated);
    }

    private BigDecimal parseBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        try {
            return new BigDecimal(value.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private boolean getBoolean(Object value, boolean defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Boolean) return (Boolean) value;
        return Boolean.parseBoolean(value.toString());
    }
}
