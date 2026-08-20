package com.proyecto.service.strategy;

import com.proyecto.dto.ImpactoDocumentoDto;
import com.proyecto.model.Documento;
import com.proyecto.model.Product;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.List;

@Component("CONTADO")
@RequiredArgsConstructor
public class ContadoStrategy implements DocumentStrategy {

    private final ProductRepository productRepository;

    @Override
    public List<ImpactoDocumentoDto> preview(MultipartFile file) {
        // TODO: Implement parsing logic
        return new ArrayList<>();
    }

    @Override
    public void apply(Documento documento, List<ImpactoDocumentoDto> impactos) {
        for (ImpactoDocumentoDto imp : impactos) {
            Product product = productRepository.findByCode(imp.getCode())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + imp.getCode()));

            product.setStock(imp.getStockNuevo());
            productRepository.save(product);
        }
    }
}
