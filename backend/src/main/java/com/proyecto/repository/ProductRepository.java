package com.proyecto.repository;

import com.proyecto.model.Product;
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

        java.util.List<Product> findByDescriptionContainingIgnoreCase(String description);

        Optional<Product> findByCode(String code);
        Optional<Product> findByErpId(Long erpId);

        @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p WHERE (LOWER(p.code) = LOWER(:text) OR LOWER(p.barcode) = LOWER(:text)) AND p.hidden = false")
        java.util.Optional<Product> findExactByCodeOrBarcode(@org.springframework.data.repository.query.Param("text") String text);

        // Missing methods restored/implemented
        java.util.List<Product> findByCodeIn(java.util.Collection<String> codes);
        java.util.List<Product> findByErpIdIn(java.util.Collection<Long> erpIds);

        @org.springframework.data.jpa.repository.Query("SELECT SUM(p.finalPrice * p.stock) FROM Product p WHERE p.hidden = false")
        java.math.BigDecimal getTotalStockValue();

        @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Product p WHERE p.stock <= 5 AND p.hidden = false")
        long countCriticalStock();

        @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Product p WHERE p.stock >= 100 AND p.hidden = false")
        long countOverStock();

        @org.springframework.data.jpa.repository.Modifying
        @org.springframework.data.jpa.repository.Query("DELETE FROM Product p WHERE p.code IS NULL OR p.code = ''")
        void deleteCorrupted();

        @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p WHERE " +
                        "(:search IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT(:search, '%')) OR LOWER(p.barcode) LIKE LOWER(CONCAT(:search, '%')) OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.marca) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
                        "(:marca IS NULL OR p.marca = :marca) AND " +
                        "(:hidden IS NULL OR p.hidden = :hidden) " +
                        "ORDER BY " +
                        "CASE WHEN LOWER(p.code) LIKE LOWER(CONCAT(:search, '%')) THEN 1 " +
                        "     WHEN LOWER(p.barcode) LIKE LOWER(CONCAT(:search, '%')) THEN 1 " +
                        "     ELSE 2 END, p.name ASC")
        Page<Product> findWithFilters(@org.springframework.data.repository.query.Param("search") String search,
                        @org.springframework.data.repository.query.Param("marca") String marca,
                        @org.springframework.data.repository.query.Param("hidden") Boolean hidden,
                        Pageable pageable);

        @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p WHERE " +
                        "(:search IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT(:search, '%')) OR LOWER(p.barcode) LIKE LOWER(CONCAT(:search, '%')) OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.marca) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
                        "(:marca IS NULL OR p.marca = :marca) AND " +
                        "(:hidden IS NULL OR p.hidden = :hidden) AND " +
                        "(:alertOnly = false OR p.stock <= 5) " +
                        "ORDER BY " +
                        "CASE WHEN LOWER(p.code) LIKE LOWER(CONCAT(:search, '%')) THEN 1 " +
                        "     WHEN LOWER(p.barcode) LIKE LOWER(CONCAT(:search, '%')) THEN 1 " +
                        "     ELSE 2 END, p.name ASC")
        Page<Product> findWithFiltersAndStockAlert(@org.springframework.data.repository.query.Param("search") String search,
                        @org.springframework.data.repository.query.Param("marca") String marca,
                        @org.springframework.data.repository.query.Param("hidden") Boolean hidden,
                        @org.springframework.data.repository.query.Param("alertOnly") Boolean alertOnly,
                        Pageable pageable);
}
