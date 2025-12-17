package com.proyecto.controller;

import com.proyecto.model.ImportacionCsv;
import com.proyecto.model.Usuario;
import com.proyecto.repository.ImportacionCsvRepository;
import com.proyecto.repository.UsuarioRepository;
import com.proyecto.service.AdminCsvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin
public class AdminController {

    private final AdminCsvService adminCsvService;
    private final ImportacionCsvRepository importacionCsvRepository;
    private final UsuarioRepository usuarioRepository;
    private final com.proyecto.repository.ProductRepository productRepository;
    private final com.proyecto.service.BackupService backupService;

    // ... existing imports/fields ...

    @GetMapping("/backup")
    public ResponseEntity<byte[]> descargarBackup() {
        byte[] backupData = backupService.generateJsonBackup();
        String filename = "taskflow_backup_" + java.time.LocalDate.now() + ".json";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(backupData);
    }

    @GetMapping("/productos")
    public ResponseEntity<List<com.proyecto.model.Product>> listarProductos() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @PutMapping("/productos/{id}")
    public ResponseEntity<?> actualizarProducto(@PathVariable Long id, @RequestBody com.proyecto.dto.ProductDto dto) {
        return productRepository.findById(id)
                .map(product -> {
                    if (dto.getCode() != null)
                        product.setCode(dto.getCode());
                    if (dto.getDescription() != null)
                        product.setDescription(dto.getDescription());
                    if (dto.getPrice() != null)
                        product.setPrice(dto.getPrice());
                    if (dto.getHidden() != null)
                        product.setHidden(dto.getHidden());
                    if (dto.getSearchable() != null)
                        product.setSearchable(dto.getSearchable());

                    productRepository.save(product);
                    return ResponseEntity.ok(product);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/productos/{id}")
    public ResponseEntity<?> eliminarProducto(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/productos/importar")
    public ResponseEntity<?> importarProductos(@RequestParam("file") MultipartFile file,
            Authentication auth) {
        String email = (String) auth.getPrincipal();
        Usuario admin = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Admin no encontrado"));

        ImportacionCsv log = adminCsvService.importarProductosDesdeCsv(file, admin);
        return ResponseEntity.ok(log);
    }

    @PostMapping("/productos/importar-json")
    public ResponseEntity<?> importarProductosJson(@RequestBody List<com.proyecto.dto.ProductDto> products,
            @RequestParam(value = "filename", defaultValue = "manual_import.json") String filename,
            Authentication auth) {
        String email = (String) auth.getPrincipal();
        Usuario admin = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Admin no encontrado"));

        ImportacionCsv log = adminCsvService.importarProductosDesdeLista(products, filename, admin);
        return ResponseEntity.ok(log);
    }

    @GetMapping("/importaciones")
    public ResponseEntity<List<ImportacionCsv>> listarImportaciones() {
        return ResponseEntity.ok(importacionCsvRepository.findAll());
    }

    @GetMapping("/importaciones/{id}")
    public ResponseEntity<ImportacionCsv> verImportacion(@PathVariable Long id) {
        return importacionCsvRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
