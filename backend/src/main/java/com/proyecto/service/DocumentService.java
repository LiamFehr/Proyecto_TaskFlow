package com.proyecto.service;

import com.proyecto.dto.ImpactoDocumentoDto;
import com.proyecto.model.Documento;
import com.proyecto.model.EstadoDocumento;
import com.proyecto.model.TipoDocumento;
import com.proyecto.repository.DocumentoRepository;
import com.proyecto.service.strategy.DocumentStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentoRepository documentoRepository;
    private final Map<String, DocumentStrategy> strategies;
    private final ObjectMapper objectMapper;

    @Transactional
    public com.proyecto.dto.DocumentoPreviewDto uploadAndPreview(MultipartFile file, TipoDocumento tipo,
            String usuario) {
        // 1. Validate Strategy Exists
        DocumentStrategy strategy = strategies.get(tipo.name());
        if (strategy == null) {
            throw new RuntimeException("No strategy found for type: " + tipo);
        }

        // 2. Generate Preview (Fail fast if file is invalid)
        List<ImpactoDocumentoDto> previewData = strategy.preview(file);

        // 3. Create Document Header
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown.xlsx";
        Documento doc = Documento.builder()
                .tipo(tipo)
                .archivoOriginal(fileName)
                .fecha(LocalDateTime.now())
                .usuario(usuario)
                .estado(EstadoDocumento.BORRADOR)
                .hash(calculateHash(file))
                .build();

        doc = documentoRepository.save(doc);

        return com.proyecto.dto.DocumentoPreviewDto.builder()
                .documento(doc)
                .preview(previewData)
                .build();
    }

    public List<ImpactoDocumentoDto> preview(Long documentoId, MultipartFile file) {
        Documento doc = documentoRepository.findById(documentoId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        DocumentStrategy strategy = strategies.get(doc.getTipo().name());
        if (strategy == null) {
            throw new RuntimeException("No strategy found for type: " + doc.getTipo());
        }

        return strategy.preview(file);
    }

    @Transactional
    public void apply(Long documentoId, List<ImpactoDocumentoDto> impactosConfirmados) {
        Documento doc = documentoRepository.findById(documentoId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (doc.getEstado() != EstadoDocumento.BORRADOR) {
            throw new RuntimeException("Document is not in BORRADOR state");
        }

        DocumentStrategy strategy = strategies.get(doc.getTipo().name());
        if (strategy == null) {
            throw new RuntimeException("No strategy found for type: " + doc.getTipo());
        }
        strategy.apply(doc, impactosConfirmados);

        try {
            doc.setDetallesJson(objectMapper.writeValueAsString(impactosConfirmados));
        } catch (Exception e) {
            throw new RuntimeException("Error saving document details JSON", e);
        }

        doc.setEstado(EstadoDocumento.APLICADO);
        documentoRepository.save(doc);
    }

    @Transactional
    public void cancel(Long documentoId) {
        Documento doc = documentoRepository.findById(documentoId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (doc.getEstado() == EstadoDocumento.APLICADO) {
            throw new RuntimeException("Cannot cancel an applied document");
        }

        doc.setEstado(EstadoDocumento.CANCELADO);
        documentoRepository.save(doc);
    }

    public List<Documento> findAll() {
        return documentoRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "fecha"));
    }

    private String calculateHash(MultipartFile file) {
        // TODO: Implement actual hash
        return UUID.randomUUID().toString();
    }
}
