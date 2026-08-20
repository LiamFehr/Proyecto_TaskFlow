package com.proyecto.service;

import com.proyecto.model.Product;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VendedorService {

    private final ProductRepository productRepository;
    private final PedidoFileService pedidoFileService;

    public List<Product> buscarProductos(String search, String marca, boolean exactOnly) {
        if (search == null || search.isBlank()) {
            return List.of();
        }

        // 1. Try exact match first (as requested: "solo que si hace mach no sugerido")
        java.util.Optional<Product> exact = productRepository.findExactByCodeOrBarcode(search);
        if (exact.isPresent()) {
            return List.of(exact.get());
        }

        // 2. Otherwise do broad search with prioritized logic (ONLY if not exactOnly)
        if (exactOnly) {
            return List.of();
        }
        org.springframework.data.domain.Page<Product> page = productRepository.findWithFilters(
                search,
                marca,
                false, // hidden = false
                org.springframework.data.domain.PageRequest.of(0, 50));
        return page.getContent();
    }

    public List<String> listarPedidosPendientes() {
        return pedidoFileService.listarPedidos();
    }

    public void marcarPedidoProcesado(String pedidoId) {
        pedidoFileService.eliminarPedido(pedidoId);
    }
}
