package com.proyecto.service;

import org.springframework.stereotype.Service;
import com.proyecto.entity.Product;
import java.util.List;

@Service
public interface ProductService {

    List<Product> getAll();

    Product getById(Long id);

    List<Product> search(String text);

    Product findByCode(String code);

    Product findByBarcode(String barcode);
}
