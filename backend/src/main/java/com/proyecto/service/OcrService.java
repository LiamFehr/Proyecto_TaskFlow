package com.proyecto.service;

import org.springframework.web.multipart.MultipartFile;

public interface OcrService {
    String extractText(MultipartFile file);
}
