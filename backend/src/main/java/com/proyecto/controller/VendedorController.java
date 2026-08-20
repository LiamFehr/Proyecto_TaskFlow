package com.proyecto.controller;

import com.proyecto.model.Product;
import com.proyecto.service.VendedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendedor")
@RequiredArgsConstructor
@CrossOrigin
public class VendedorController {

    private final VendedorService vendedorService;

    @GetMapping("/productos")
    public ResponseEntity<List<Product>> buscarProductos(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "marca", required = false) String marca,
            @RequestParam(value = "exact", required = false, defaultValue = "false") boolean exact) {
        if (search == null || search.isBlank()) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(vendedorService.buscarProductos(search, marca, exact));
    }

    @GetMapping("/pedidos")
    public ResponseEntity<?> listarPedidos() {
        return ResponseEntity.ok(vendedorService.listarPedidosPendientes());
    }

    @PatchMapping("/pedidos/{id}/procesar")
    public ResponseEntity<?> procesarPedido(@PathVariable String id) {
        vendedorService.marcarPedidoProcesado(id);
        return ResponseEntity.ok().build();
    }
}
