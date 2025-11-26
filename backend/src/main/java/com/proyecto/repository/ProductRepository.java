package com.proyecto.repository;

import com.proyecto.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Obtener todos los items visibles y buscables
    List<Product> findByHiddenFalseAndSearchableTrue();

    // Buscar por descripción (solo items visibles y buscables)
    List<Product> findByDescriptionContainingIgnoreCaseAndHiddenFalseAndSearchableTrue(String text);

    // Buscar por código interno (solo items visibles y buscables)
    Optional<Product> findByCodeAndHiddenFalseAndSearchableTrue(String code);

    // Buscar por código de barras (solo items visibles y buscables)
    Optional<Product> findByBarcodeAndHiddenFalseAndSearchableTrue(String barcode);
}
