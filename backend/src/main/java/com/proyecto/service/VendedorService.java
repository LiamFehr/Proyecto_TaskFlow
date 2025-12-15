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
    // private final PedidoFileService pedidoFileService; // Retirado temporalmente
    // por no uso

    public List<Product> buscarProductos(String search) {
        if (search == null || search.isBlank()) {
            return List.of();
        }

        // Primero probamos por código exacto (ProductRepository tiene
        // findByCodeAndHiddenFalse...)
        return productRepository.findByCodeAndHiddenFalseAndSearchableTrue(search)
                .map(List::of)
                .orElseGet(() -> productRepository.findByDescriptionContainingIgnoreCase(search));
        // Nota: findByDescription... debe existir en ProductRepository o JPA lo crea si
        // sigue convención
    }

    // Métodos stub – debes implementarlos en base a tu formato JSON actual:

    public List<?> listarPedidosPendientes() {
        // TODO: implementar lógica real de pedidos
        return List.of();
    }

    public void marcarPedidoProcesado(String pedidoId) {
        // TODO: borrar/mover archivo JSON correspondiente a ese pedido
    }
}
