package com.proyecto.service.strategy;

import com.proyecto.dto.ImpactoDocumentoDto;
import com.proyecto.model.Documento;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface DocumentStrategy {
    List<ImpactoDocumentoDto> preview(MultipartFile file);

    void apply(Documento documento, List<ImpactoDocumentoDto> impactos);
}
