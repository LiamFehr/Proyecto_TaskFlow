package com.proyecto.controller;

import com.proyecto.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller para la sincronización de inventario desde el ERP de escritorio.
 * Protegido por X-Api-Key vía ApiKeyFilter en SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/inventario")
@RequiredArgsConstructor
@CrossOrigin
public class InventarioController {

    private final ProductService productService;

    @PutMapping("/sincronizar")
    public ResponseEntity<Map<String, String>> sincronizar(@RequestBody Map<String, List<Map<String, Object>>> body) {
        List<Map<String, Object>> productos = body.get("productos");
        if (productos != null && !productos.isEmpty()) {
            productService.sincronizar(productos);
        }
        return ResponseEntity.ok(Map.of(
            "status", "OK",
            "mensaje", "Sincronización completada correctamente",
            "count", productos != null ? String.valueOf(productos.size()) : "0"
        ));
    }
}
