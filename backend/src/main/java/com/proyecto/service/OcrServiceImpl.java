package com.proyecto.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@Service
public class OcrServiceImpl implements OcrService {

    @Override
    public String extractText(MultipartFile file) {
        Tesseract tesseract = new Tesseract();
        // Nota: En producción, tesseract necesita datapath (tessdata)
        // tesseract.setDatapath("/usr/local/share/tessdata");
        try {
            File convFile = convert(file);
            String result = tesseract.doOCR(convFile);
            convFile.delete();
            return result;
        } catch (TesseractException | IOException e) {
            return "Error parsing image: " + e.getMessage();
        }
    }

    private File convert(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) fileName = "temp_ocr";
        File convFile = new File(System.getProperty("java.io.tmpdir") + File.separator + fileName);
        try (FileOutputStream fos = new FileOutputStream(convFile)) {
            fos.write(file.getBytes());
        }
        return convFile;
    }
}
