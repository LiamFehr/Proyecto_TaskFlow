package com.proyecto.controller;

import com.proyecto.dto.PedidoDTO;
import com.proyecto.service.PedidoFileService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "*")
public class PedidoController {

    private final PedidoFileService pedidoService;

    public PedidoController(PedidoFileService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    public ResponseEntity<Void> guardarPedido(@RequestBody PedidoDTO pedido) {
        try {
            pedidoService.guardarPedido(pedido);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<String>> listarPedidos() {
        return ResponseEntity.ok(pedidoService.listarPedidos());
    }

    @GetMapping("/{filename}")
    public ResponseEntity<PedidoDTO> leerPedido(@PathVariable String filename) {
        try {
            return ResponseEntity.ok(pedidoService.leerPedido(filename));
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{filename}/descargar")
    public ResponseEntity<Resource> descargarPedido(@PathVariable String filename) {
        try {
            Resource file = pedidoService.descargar(filename);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(file);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{filename}/descargar-txt")
    public ResponseEntity<Resource> descargarPedidoTxt(@PathVariable String filename) {
        try {
            Resource file = pedidoService.descargarTxt(filename);
            String txtFilename = filename.replace(".json", ".txt");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + txtFilename + "\"")
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(file);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{filename}")
    public ResponseEntity<Void> eliminarPedido(@PathVariable String filename) {
        boolean deleted = pedidoService.eliminarPedido(filename);
        if (deleted) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
