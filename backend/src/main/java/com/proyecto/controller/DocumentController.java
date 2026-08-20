package com.proyecto.controller;

import com.proyecto.dto.ImpactoDocumentoDto;
import com.proyecto.model.Documento;
import com.proyecto.model.TipoDocumento;
import com.proyecto.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipo") TipoDocumento tipo) {
        // TODO: Get real user from SecurityContext
        String usuario = "admin";
        var result = documentService.uploadAndPreview(file, tipo, usuario);

        // Map to Agent Spec: { "id": 123, "items": [...] }
        // Assuming result has getDocumento().getId() and getPreview()
        // Return structure expected by frontend: { "documento": ..., "preview": ... }
        var response = java.util.Map.of(
                "documento", result.getDocumento(),
                "preview", result.getPreview());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/preview")
    public ResponseEntity<List<ImpactoDocumentoDto>> preview(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        // Note: In a real app the file might be re-read from storage,
        // but here we might re-upload or read from disk.
        // For simplicity, re-uploading for preview check if strategy requires it.
        // Actually DocumentService.preview takes file.
        return ResponseEntity.ok(documentService.preview(id, file));
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<?> apply(
            @PathVariable Long id,
            @RequestBody List<com.proyecto.dto.ImpactoDocumentoDto> impactos) {
        try {
            documentService.apply(id, impactos);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error applying document: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        try {
            documentService.cancel(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error cancelling document: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Documento>> listDocuments() {
        return ResponseEntity.ok(documentService.findAll());
    }
}
