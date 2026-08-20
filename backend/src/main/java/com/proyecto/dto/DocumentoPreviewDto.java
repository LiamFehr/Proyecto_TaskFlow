package com.proyecto.dto;

import com.proyecto.model.Documento;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DocumentoPreviewDto {
    private Documento documento;
    private List<ImpactoDocumentoDto> preview;
}
