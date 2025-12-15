package com.proyecto.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@Service
public class OcrService {

    private static final Logger logger = LoggerFactory.getLogger(OcrService.class);

    public String extractText(MultipartFile file) {
        Tesseract tesseract = new Tesseract();

        // Configurar ruta de tessdata
        // Busca carpeta "tessdata" en el directorio actual (backend)
        tesseract.setDatapath("tessdata");

        // Optimización para números (whitelist)
        tesseract.setTessVariable("tessedit_char_whitelist", "0123456789");

        // Single Line Mode (PSM 7) es muy estricto. PSM 6 (Single Block) es más
        // tolerante a ruido
        tesseract.setPageSegMode(6);

        // Convert MultipartFile to File
        File convFile = new File(System.getProperty("java.io.tmpdir") + "/" + file.getOriginalFilename());
        try {
            try (FileOutputStream fos = new FileOutputStream(convFile)) {
                fos.write(file.getBytes());
            }

            String result = tesseract.doOCR(convFile);

            // Clean up
            boolean deleted = convFile.delete();
            if (!deleted) {
                logger.warn("No se pudo eliminar el archivo temporal: {}", convFile.getAbsolutePath());
            }

            return result.trim();
        } catch (IOException | TesseractException e) {
            logger.error("Error procesando OCR", e);
            throw new RuntimeException("Error al procesar la imagen: " + e.getMessage());
        }
    }
}
