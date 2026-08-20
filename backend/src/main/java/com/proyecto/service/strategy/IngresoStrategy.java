package com.proyecto.service.strategy;

import com.proyecto.dto.ImpactoDocumentoDto;
import com.proyecto.model.Documento;
import com.proyecto.model.Product;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.pdmodel.PDDocument;
import technology.tabula.Page;
import technology.tabula.RectangularTextContainer;
import technology.tabula.Table;
import technology.tabula.extractors.SpreadsheetExtractionAlgorithm;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component("INGRESO")
@RequiredArgsConstructor
public class IngresoStrategy implements DocumentStrategy {

    private final ProductRepository productRepository;

    @Override
    public List<ImpactoDocumentoDto> preview(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
            try {
                return parsePdf(file);
            } catch (Exception pdfEx) {
                throw new RuntimeException("Error parsing PDF file", pdfEx);
            }
        }

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            return parseExcel(workbook);
        } catch (Exception e) {
            try {
                return parseCsv(file);
            } catch (Exception csvEx) {
                try {
                    return parsePdf(file);
                } catch (Exception pdfEx) {
                    throw new RuntimeException("Error trying to parse as Excel, CSV, and PDF", pdfEx);
                }
            }
        }
    }

    private List<ImpactoDocumentoDto> parseExcel(Workbook workbook) {
        List<ImpactoDocumentoDto> impactos = new ArrayList<>();
        Sheet sheet = workbook.getSheetAt(0);

        int codeIdx = -1;
        int qtyIdx = -1;

        int headerRowIdx = -1;
        // Search header in first 20 rows
        for (int i = 0; i <= 20; i++) {
            Row row = sheet.getRow(i);
            if (row == null)
                continue;

            boolean foundCode = false;
            boolean foundQuantity = false;

            for (Cell cell : row) {
                if (cell.getCellType() == CellType.STRING) {
                    String val = cell.getStringCellValue().toLowerCase().trim();
                    if (val.contains("cod") || val.contains("sku") || val.contains("code"))
                        foundCode = true;
                    else if (val.contains("cant") || val.contains("unid") || val.contains("stock")
                            || val.contains("quantity"))
                        foundQuantity = true;
                }
            }

            if (foundCode || foundQuantity) {
                headerRowIdx = i;
                // Capture indices
                for (Cell cell : row) {
                    if (cell.getCellType() == CellType.STRING) {
                        String val = cell.getStringCellValue().toLowerCase().trim();
                        if (val.contains("cod") || val.contains("sku") || val.contains("code"))
                            codeIdx = cell.getColumnIndex();
                        else if (val.contains("cant") || val.contains("unid") || val.contains("stock")
                                || val.contains("quantity"))
                            qtyIdx = cell.getColumnIndex();
                    }
                }
                break;
            }
        }

        if (codeIdx == -1)
            codeIdx = 1;
        if (qtyIdx == -1)
            qtyIdx = 0;

        int startRow = (headerRowIdx == -1) ? 0 : headerRowIdx + 1;

        // BATCH PHASE 1: Collect all codes
        java.util.Set<String> codesToFetch = new java.util.HashSet<>();
        java.util.List<TempIngresoRow> tempRows = new java.util.ArrayList<>();

        for (Row row : sheet) {
            if (row.getRowNum() < startRow)
                continue;

            Cell codeCell = row.getCell(codeIdx);
            Cell qtyCell = row.getCell(qtyIdx);

            if (codeCell == null || qtyCell == null)
                continue;

            String code = new DataFormatter().formatCellValue(codeCell).trim();
            double qty = 0;
            if (qtyCell.getCellType() == CellType.NUMERIC)
                qty = qtyCell.getNumericCellValue();
            else
                try {
                    qty = Double.parseDouble(qtyCell.getStringCellValue().replace(",", "."));
                } catch (Exception e) {
                }

            if (code.isEmpty() || qty <= 0)
                continue;

            codesToFetch.add(code);
            tempRows.add(new TempIngresoRow(code, qty));
        }

        // BATCH PHASE 2: Fetch all products in one query
        java.util.Map<String, Product> productMap = productRepository.findByCodeIn(codesToFetch)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        p -> p.getCode().trim().toUpperCase(),
                        p -> p,
                        (p1, p2) -> p1));

        // BATCH PHASE 3: Build DTOs
        for (TempIngresoRow tempRow : tempRows) {
            Product product = productMap.get(tempRow.code.trim().toUpperCase());
            BigDecimal currentStock = product != null ? product.getStock() : BigDecimal.ZERO;
            BigDecimal diff = BigDecimal.valueOf(tempRow.qty);

            impactos.add(ImpactoDocumentoDto.builder()
                    .code(tempRow.code)
                    .marca(product != null ? product.getMarca() : "")
                    .description(product != null ? product.getDescription() : "Manual Import")
                    .stockActual(currentStock)
                    .stockNuevo(currentStock.add(diff))
                    .diferenciaStock(diff)
                    .precioActual(product != null ? product.getPrice() : BigDecimal.ZERO)
                    .precioNuevo(product != null ? product.getPrice() : BigDecimal.ZERO)
                    .build());
        }
        return impactos;
    }

    @lombok.AllArgsConstructor
    private static class TempIngresoRow {
        String code;
        double qty;
    }

    private List<ImpactoDocumentoDto> parseCsv(MultipartFile file) throws Exception {
        List<ImpactoDocumentoDto> impactos = new ArrayList<>();
        java.util.Set<String> codes = new java.util.HashSet<>();
        java.util.Map<String, Double> qtyMap = new java.util.HashMap<>();

        try (java.io.BufferedReader br = new java.io.BufferedReader(
                new java.io.InputStreamReader(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            int lineIdx = 0;
            int codeIdx = -1;
            int qtyIdx = -1;

            while ((line = br.readLine()) != null) {
                lineIdx++;
                if (lineIdx == 1)
                    line = line.replace("\uFEFF", "");

                String[] parts = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
                if (parts.length < 2)
                    parts = line.split(";");

                // Improved CSV Header Search
                if (lineIdx <= 20 && (codeIdx == -1 || qtyIdx == -1)) {
                    int tempCodeIdx = -1;
                    int tempQtyIdx = -1;
                    for (int i = 0; i < parts.length; i++) {
                        String val = parts[i].toLowerCase().replace("\"", "").trim();
                        if (val.contains("cod") || val.contains("sku") || val.contains("code"))
                            tempCodeIdx = i;
                        else if (val.contains("cant") || val.contains("unid") || val.contains("stock")
                                || val.contains("quantity"))
                            tempQtyIdx = i;
                    }
                    if (tempCodeIdx != -1 || tempQtyIdx != -1) {
                        codeIdx = tempCodeIdx;
                        qtyIdx = tempQtyIdx;
                        continue; // Skip header line
                    }
                }

                if (codeIdx == -1 && lineIdx > 20) {
                    codeIdx = 1;
                    qtyIdx = 0; // Default
                }
                if (codeIdx == -1)
                    continue;

                if (codeIdx >= parts.length || qtyIdx >= parts.length)
                    continue;

                String code = parts[codeIdx].replace("\"", "").trim();
                String qtyStr = parts[qtyIdx].replace("\"", "").trim();
                double qty = 0;
                try {
                    qty = Double.parseDouble(qtyStr);
                } catch (NumberFormatException e) {
                    continue;
                }

                if (code.isEmpty() || qty <= 0)
                    continue;

                codes.add(code);
                qtyMap.put(code, qty);
            }
        }

        // BATCH FETCH all products
        java.util.Map<String, Product> productMap = productRepository.findByCodeIn(codes)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        p -> p.getCode().trim().toUpperCase(),
                        p -> p,
                        (p1, p2) -> p1));

        // BUILD DTOs
        for (String code : codes) {
            Product product = productMap.get(code.trim().toUpperCase());
            BigDecimal currentStock = product != null ? product.getStock() : BigDecimal.ZERO;
            BigDecimal diff = BigDecimal.valueOf(qtyMap.get(code));

            impactos.add(ImpactoDocumentoDto.builder()
                    .code(code)
                    .marca(product != null ? product.getMarca() : "")
                    .description(product != null ? product.getDescription() : "Manual Import")
                    .stockActual(currentStock)
                    .stockNuevo(currentStock.add(diff))
                    .diferenciaStock(diff)
                    .precioActual(product != null ? product.getPrice() : BigDecimal.ZERO)
                    .precioNuevo(product != null ? product.getPrice() : BigDecimal.ZERO)
                    .build());
        }
        return impactos;
    }

    private List<ImpactoDocumentoDto> parsePdf(MultipartFile file) {
        List<ImpactoDocumentoDto> impactos = new ArrayList<>();

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            SpreadsheetExtractionAlgorithm extractor = new SpreadsheetExtractionAlgorithm();
            technology.tabula.ObjectExtractor objectExtractor = new technology.tabula.ObjectExtractor(document);

            Page page = objectExtractor.extract(1);
            List<Table> tables = extractor.extract(page);

            if (tables.isEmpty()) {
                throw new RuntimeException("No tables found in PDF");
            }

            Table table = tables.get(0);
            List<List<RectangularTextContainer>> rows = table.getRows();

            int codeIdx = -1;
            int qtyIdx = -1;
            int headerRowIdx = -1;

            for (int i = 0; i < Math.min(20, rows.size()); i++) {
                List<RectangularTextContainer> row = rows.get(i);

                boolean foundCode = false;
                boolean foundQty = false;

                for (int j = 0; j < row.size(); j++) {
                    String cellText = row.get(j).getText().toLowerCase().trim();
                    if (cellText.contains("cod") || cellText.contains("sku") || cellText.contains("code")) {
                        codeIdx = j;
                        foundCode = true;
                    } else if (cellText.contains("cantidad") || cellText.contains("qty") ||
                            cellText.contains("stock") || cellText.contains("quantity")) {
                        qtyIdx = j;
                        foundQty = true;
                    }
                }

                if (foundCode && foundQty) {
                    headerRowIdx = i;
                    break;
                }
            }

            if (codeIdx == -1)
                codeIdx = 1;
            if (qtyIdx == -1)
                qtyIdx = 0;

            int startRow = (headerRowIdx == -1) ? 0 : headerRowIdx + 1;

            for (int i = startRow; i < rows.size(); i++) {
                List<RectangularTextContainer> row = rows.get(i);

                if (row.size() <= Math.max(codeIdx, qtyIdx)) {
                    continue;
                }

                String code = row.get(codeIdx).getText().trim();
                String qtyStr = row.get(qtyIdx).getText().trim();

                if (code.isEmpty() || qtyStr.isEmpty()) {
                    continue;
                }

                double qty;
                try {
                    qty = Double.parseDouble(qtyStr.replaceAll("[^0-9.]", ""));
                } catch (NumberFormatException e) {
                    continue;
                }

                if (qty <= 0) {
                    continue;
                }

                Product product = productRepository.findByCode(code).orElse(null);
                BigDecimal currentStock = product != null ? product.getStock() : BigDecimal.ZERO;
                BigDecimal diff = BigDecimal.valueOf(qty);

                impactos.add(ImpactoDocumentoDto.builder()
                        .code(code)
                        .description(product != null ? product.getDescription() : "Manual Import")
                        .stockActual(currentStock)
                        .stockNuevo(currentStock.add(diff))
                        .diferenciaStock(diff)
                        .precioActual(product != null ? product.getPrice() : BigDecimal.ZERO)
                        .precioNuevo(product != null ? product.getPrice() : BigDecimal.ZERO)
                        .build());
            }

        } catch (Exception e) {
            throw new RuntimeException("Error parsing PDF", e);
        }

        return impactos;
    }

    @Override
    public void apply(Documento documento, List<ImpactoDocumentoDto> impactos) {
        // 1. Extract all codes
        java.util.Set<String> codes = impactos.stream()
                .map(ImpactoDocumentoDto::getCode)
                .collect(java.util.stream.Collectors.toSet());

        // 2. Fetch all products in one query
        java.util.Map<String, Product> productMap = productRepository.findByCodeIn(codes)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        p -> p.getCode().trim().toUpperCase(),
                        p -> p,
                        (p1, p2) -> p1 // Conflict resolution: keep first
                ));

        List<Product> productsToUpdate = new ArrayList<>();

        // 3. Update products
        for (ImpactoDocumentoDto imp : impactos) {
            Product product = productMap.get(imp.getCode().trim().toUpperCase());
            if (product == null) {
                // Should not happen if preview worked, but safety check
                continue;
            }

            product.setStock(product.getStock().add(imp.getDiferenciaStock()));
            productsToUpdate.add(product);
        }

        // 4. Batch save
        if (!productsToUpdate.isEmpty()) {
            productRepository.saveAll(productsToUpdate);
        }
    }
}
