package com.proyecto.controller;

import com.proyecto.dto.PresupuestoDto;
import com.proyecto.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/presupuestos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PresupuestoController {

    private final PdfService pdfService;

    @PostMapping("/pdf")
    public ResponseEntity<byte[]> generarPdf(@RequestBody PresupuestoDto data) {
        byte[] pdfBytes = pdfService.generarPresupuestoPdf(data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"presupuesto.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
