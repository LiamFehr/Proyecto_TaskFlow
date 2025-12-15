package com.proyecto.controller;

import com.proyecto.model.Product;
import com.proyecto.service.VendedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vendedor")
@RequiredArgsConstructor
@CrossOrigin
public class VendedorController {

    private final VendedorService vendedorService;

    @GetMapping("/productos")
    public ResponseEntity<List<Product>> buscarProductos(
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(vendedorService.buscarProductos(search));
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
