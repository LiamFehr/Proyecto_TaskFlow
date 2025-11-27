package com.proyecto.repository;

import com.proyecto.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByHiddenFalseAndSearchableTrue(Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p WHERE (LOWER(p.code) LIKE LOWER(CONCAT(:text, '%')) OR LOWER(p.barcode) LIKE LOWER(CONCAT(:text, '%'))) AND p.hidden = false AND p.searchable = true")
    Page<Product> searchByCodeOrBarcode(@org.springframework.data.repository.query.Param("text") String text,
            Pageable pageable);

    Optional<Product> findByCodeAndHiddenFalseAndSearchableTrue(String code);

    Optional<Product> findByBarcodeAndHiddenFalseAndSearchableTrue(String barcode);
}
