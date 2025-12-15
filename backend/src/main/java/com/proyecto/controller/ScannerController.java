package com.proyecto.controller;

import com.proyecto.service.OcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class ScannerController {

    private static final Logger logger = LoggerFactory.getLogger(ScannerController.class);

    private final OcrService ocrService;

    @PostMapping("/scan")
    public ResponseEntity<?> scanImage(@RequestParam("image") MultipartFile image) {
        logger.info("Recibida petición OCR. Archivo: {}, Tamaño: {}", image.getOriginalFilename(), image.getSize());
        try {
            String text = ocrService.extractText(image);
            Map<String, Object> response = new HashMap<>();
            response.put("text", text);
            // hardcoded confidence for now as basic backend implementation might not return
            // it easily without more parsing
            response.put("confidence", 80);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error en ScannerController", e);
            return ResponseEntity.internalServerError().body("Error procesando OCR: " + e.getMessage());
        }
    }
}
