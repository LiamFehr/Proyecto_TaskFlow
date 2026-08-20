package com.proyecto.service.strategy;

import com.proyecto.dto.ImpactoDocumentoDto;
import com.proyecto.model.Documento;
import com.proyecto.model.Product;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Component("PRECIOS")
@RequiredArgsConstructor
@Slf4j
public class PrecioStrategy implements DocumentStrategy {

    private final ProductRepository productRepository;
    private static final BigDecimal OUTLIER_THRESHOLD = new BigDecimal("0.50"); // 50%

    @Override
    public List<ImpactoDocumentoDto> preview(MultipartFile file) {
        log.info("========== PRECIO STRATEGY PREVIEW CALLED ==========");
        String filename = file.getOriginalFilename();
        log.info("Filename: {}", filename);
        if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
            log.info("File ends with .pdf, trying PDF parser");
            // If it's clearly a PDF, try PDF parser first
            try {
                return parsePdf(file);
            } catch (Exception pdfEx) {
                throw new RuntimeException("Error parsing PDF file", pdfEx);
            }
        }

        // Try Excel first
        log.info("Attempting Excel/Workbook parser...");
        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            return parseExcel(workbook);
        } catch (Exception e) {
            // Fallback to CSV
            try {
                return parseCsv(file);
            } catch (Exception csvEx) {
                // Last attempt: try PDF
                try {
                    return parsePdf(file);
                } catch (Exception pdfEx) {
                    throw new RuntimeException("Error trying to parse as Excel, CSV, and PDF", pdfEx);
                }
            }
        }
    }

    private List<ImpactoDocumentoDto> parseExcel(Workbook workbook) {
        log.info("[EXCEL PARSER] Starting Excel parse");
        List<ImpactoDocumentoDto> impactos = new ArrayList<>();
        Sheet sheet = workbook.getSheetAt(0);

        int codeIdx = -1;
        int priceIdx = -1;
        int marcaIdx = -1;
        int descIdx = -1; // NEW

        int headerRowIdx = -1;
        // Search header in first 30 rows
        for (int i = 0; i <= 30; i++) {
            Row row = sheet.getRow(i);
            if (row == null)
                continue;

            int tempCodeIdx = -1;
            int tempPriceIdx = -1;
            int tempMarcaIdx = -1;
            int tempDescIdx = -1; // NEW: Description

            for (Cell cell : row) {
                if (cell.getCellType() == CellType.STRING) {
                    String val = cell.getStringCellValue().toLowerCase().trim();
                    if (val.contains("cod") || val.contains("sku") || val.contains("code"))
                        tempCodeIdx = cell.getColumnIndex();
                    else if ((val.contains("precio") || val.contains("price")) && val.contains("final")) // Prioritize
                                                                                                         // "Precio
                                                                                                         // Final"
                        tempPriceIdx = cell.getColumnIndex();
                    else if (tempPriceIdx == -1 && (val.contains("precio") || val.contains("valor")
                            || val.contains("costo") || val.contains("price"))) // Fallback
                        tempPriceIdx = cell.getColumnIndex();
                    else if (val.contains("marca") || val.contains("brand")) // NEW
                        tempMarcaIdx = cell.getColumnIndex();
                    else if (val.contains("desc") || val.contains("nombre") || val.contains("detalle")
                            || val.contains("articulo")) // NEW
                        tempDescIdx = cell.getColumnIndex();
                }
            }

            // Heuristic: Require Code AND (Price OR Description) to be the header.
            // Relaxation: If we found Code and Desc, we can proceed even if Price is
            // tricky, but generally we want price.
            // Let's stick to Code & Price OR Code & Desc.
            if (tempCodeIdx != -1 && (tempPriceIdx != -1 || tempDescIdx != -1)) {
                headerRowIdx = i;
                codeIdx = tempCodeIdx;
                priceIdx = tempPriceIdx;
                marcaIdx = tempMarcaIdx;
                descIdx = tempDescIdx; // NEW
                break;
            }
        }

        // Fallback
        if (codeIdx == -1)
            codeIdx = 0;
        if (priceIdx == -1)
            priceIdx = 1;

        int startRow = (headerRowIdx == -1) ? 0 : headerRowIdx + 1;

        // First Pass: Collect Codes
        java.util.Set<String> codesToFetch = new java.util.HashSet<>();
        List<TempRow> tempRows = new ArrayList<>();

        for (Row row : sheet) {
            if (row.getRowNum() < startRow)
                continue;

            Cell codeCell = row.getCell(codeIdx);
            Cell priceCell = row.getCell(priceIdx);

            if (codeCell == null || priceCell == null)
                continue;

            String code = new DataFormatter().formatCellValue(codeCell).trim();
            double priceVal = getCellValueAsNumeric(priceCell);

            // NEW: Extract marca if column exists
            String marca = "";
            if (marcaIdx != -1) {
                Cell marcaCell = row.getCell(marcaIdx, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                if (marcaCell != null) {
                    marca = new DataFormatter().formatCellValue(marcaCell).trim();
                    if (tempRows.size() < 3) {
                        log.info("[EXCEL ROW {}] code='{}', marca='{}' from col {}", row.getRowNum(), code, marca,
                                marcaIdx);
                    }
                } else if (tempRows.size() < 3) {
                    log.warn("[EXCEL ROW {}] marcaCell is NULL at col {}", row.getRowNum(), marcaIdx);
                }
            } else if (tempRows.size() < 3) {
                log.warn("[EXCEL ROW {}] marcaIdx is -1 (not detected)", row.getRowNum());
            }

            // NEW: Extract description if column exists
            String description = "";
            if (descIdx != -1) {
                Cell descCell = row.getCell(descIdx, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                if (descCell != null) {
                    description = new DataFormatter().formatCellValue(descCell).trim();
                }
            }

            if (code.isEmpty())
                continue;

            codesToFetch.add(code);
            tempRows.add(new TempRow(code, priceVal, marca, description)); // NEW: include description
        }

        // Batch Fetch
        java.util.List<Product> foundProducts = productRepository.findByCodeIn(codesToFetch);
        // NEW: Also attempt to fetch by UPPERCASE version if not found to handle
        // case-mismatch in DB
        java.util.Set<String> upperCodes = codesToFetch.stream().map(String::toUpperCase)
                .collect(java.util.stream.Collectors.toSet());
        // Simple merge of results
        foundProducts.addAll(productRepository.findByCodeIn(upperCodes));

        // Map keyed by Normalized (Upper) Code for easy lookup
        java.util.Map<String, Product> productMap = new java.util.HashMap<>();
        for (Product p : foundProducts) {
            if (p.getCode() != null) {
                productMap.put(p.getCode().trim().toUpperCase(), p);
            }
        }

        // Create Impacts using Map
        for (TempRow row : tempRows) {
            String normalizedCode = row.code.trim().toUpperCase();
            Product product = productMap.get(normalizedCode);

            BigDecimal currentPrice = product != null ? product.getPrice() : BigDecimal.ZERO;
            BigDecimal newPrice = BigDecimal.valueOf(row.price);

            // LOGIC: Description Priority
            // 1. File Description (if not empty)
            // 2. Existing DB Description (if present)
            // 3. "Manual Import [Code]"
            String finalDescription;
            if (row.description != null && !row.description.trim().isEmpty()) {
                finalDescription = row.description.trim();
            } else if (product != null && product.getDescription() != null && !product.getDescription().isEmpty()) {
                finalDescription = product.getDescription();
            } else {
                finalDescription = "Manual Import " + row.code;
            }

            impactos.add(ImpactoDocumentoDto.builder()
                    .code(row.code) // Use original code from file to preserve casing user provided? Or normalized?
                                    // Safer to use DB code if exists, otherwise file code.
                    .marca(row.marca.isEmpty() ? (product != null ? product.getMarca() : "") : row.marca)
                    .description(finalDescription)
                    .stockActual(product != null ? product.getStock() : BigDecimal.ZERO)
                    .stockNuevo(product != null ? product.getStock() : BigDecimal.ZERO)
                    .diferenciaStock(BigDecimal.ZERO)
                    .precioActual(currentPrice)
                    .precioNuevo(newPrice)
                    .build());
        }
        return impactos;
    }

    private static class TempRow {
        String code;
        double price;
        String marca;
        String description;

        public TempRow(String code, double price, String marca, String description) {
            this.code = code;
            this.price = price;
            this.marca = marca;
            this.description = description;
        }
    }

    private static class TempRowCsv {
        String code;
        double price;
        String marca;
        String description;

        public TempRowCsv(String code, double price, String marca, String description) {
            this.code = code;
            this.price = price;
            this.marca = marca;
            this.description = description;
        }
    }

    private double getCellValueAsNumeric(Cell cell) {
        if (cell.getCellType() == CellType.NUMERIC)
            return cell.getNumericCellValue();
        try {
            return Double.parseDouble(cell.getStringCellValue().replace("$", "").replace(",", ".").trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private List<ImpactoDocumentoDto> parseCsv(MultipartFile file) throws Exception {
        List<ImpactoDocumentoDto> impactos = new ArrayList<>();
        try (java.io.BufferedReader br = new java.io.BufferedReader(
                new java.io.InputStreamReader(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            int lineIdx = 0;
            int codeIdx = -1;
            int priceIdx = -1;
            int marcaIdx = -1;
            int descIdx = -1; // Description column

            List<String> rawLines = new ArrayList<>();
            while ((line = br.readLine()) != null) {
                rawLines.add(line);
            }

            // First Pass: Detect Header and Collect Codes
            java.util.Set<String> codesToFetch = new java.util.HashSet<>();
            List<TempRowCsv> tempRows = new ArrayList<>();

            for (String currentLine : rawLines) {
                lineIdx++;
                if (lineIdx == 1)
                    currentLine = currentLine.replace("\uFEFF", ""); // BOM

                // Split by comma or semicolon
                String[] parts = currentLine.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
                if (parts.length < 2)
                    parts = currentLine.split(";");

                // Improved CSV Header Search
                if (codeIdx == -1 || priceIdx == -1) {
                    if (lineIdx <= 30) {
                        int tempCodeIdx = -1;
                        int tempPriceIdx = -1;
                        int tempMarcaIdx = -1;
                        int tempDescIdx = -1;
                        for (int i = 0; i < parts.length; i++) {
                            String val = parts[i].toLowerCase().replace("\"", "").trim();
                            if (val.contains("cod") || val.contains("sku") || val.contains("code"))
                                tempCodeIdx = i;
                            else if ((val.contains("precio") || val.contains("price")) && val.contains("final"))
                                tempPriceIdx = i;
                            else if (tempPriceIdx == -1 && (val.contains("precio") || val.contains("valor")
                                    || val.contains("costo") || val.contains("price")))
                                tempPriceIdx = i;
                            else if (val.contains("marca") || val.contains("brand"))
                                tempMarcaIdx = i;
                            else if (val.contains("desc") || val.contains("nombre") || val.contains("detalle"))
                                tempDescIdx = i;
                        }

                        // Smart Detection: Require BOTH to assume this is the header
                        if (tempCodeIdx != -1 && tempPriceIdx != -1) {
                            codeIdx = tempCodeIdx;
                            priceIdx = tempPriceIdx;
                            marcaIdx = tempMarcaIdx;
                            descIdx = tempDescIdx;
                            log.info("CSV Header detected - Code: {}, Price: {}, Marca: {}, Desc: {}", codeIdx,
                                    priceIdx,
                                    marcaIdx, descIdx);
                            continue; // Skip header line
                        }
                        // If we haven't found the header yet, this line is likely metadata/garbage.
                        // Skip it.
                        continue;
                    } else {
                        // Fallback if no header found in first 30 lines
                        if (codeIdx == -1)
                            codeIdx = 0;
                        if (priceIdx == -1)
                            priceIdx = parts.length > 5 ? 5 : 1;
                    }
                }

                if (codeIdx >= parts.length || priceIdx >= parts.length)
                    continue;

                String code = parts[codeIdx].replace("\"", "").trim();
                String priceStr = parts[priceIdx].replace("\"", "").trim();

                // Extract marca if column exists
                String marca = "";
                if (marcaIdx != -1 && marcaIdx < parts.length) {
                    marca = parts[marcaIdx].replace("\"", "").trim();
                }

                // Extract description if column exists
                String description = "";
                if (descIdx != -1 && descIdx < parts.length) {
                    description = parts[descIdx].replace("\"", "").trim();
                }

                double priceVal = 0;
                try {
                    // Handle Argentine format: 156.594,613 -> 156594.613
                    // Remove dots (thousands separator) and replace comma with dot (decimal
                    // separator)
                    String cleanPrice = priceStr.replace(".", "").replace(",", ".").replaceAll("[^0-9.]", "");
                    priceVal = Double.parseDouble(cleanPrice);
                } catch (NumberFormatException e) {
                    continue;
                }

                if (priceVal < 0) {
                    continue;
                }

                codesToFetch.add(code);
                tempRows.add(new TempRowCsv(code, priceVal, marca, description));
            }

            // Batch Fetch
            java.util.List<Product> foundProducts = productRepository.findByCodeIn(codesToFetch);
            java.util.Map<String, Product> productMap = new java.util.HashMap<>();
            for (Product p : foundProducts) {
                if (p.getCode() != null) {
                    productMap.put(p.getCode().trim().toUpperCase(), p);
                }
            }

            // Create Impacts
            for (TempRowCsv row : tempRows) {
                Product product = productMap.get(row.code.trim().toUpperCase());
                BigDecimal currentPrice = product != null ? product.getPrice() : BigDecimal.ZERO;
                BigDecimal newPrice = BigDecimal.valueOf(row.price);

                impactos.add(ImpactoDocumentoDto.builder()
                        .code(row.code)
                        .marca(row.marca.isEmpty() ? (product != null ? product.getMarca() : "") : row.marca)
                        .description(!row.description.isEmpty() ? row.description
                                : (product != null ? product.getDescription() : "Manual Import " + row.code))
                        .stockActual(product != null ? product.getStock() : BigDecimal.ZERO)
                        .stockNuevo(product != null ? product.getStock() : BigDecimal.ZERO)
                        .diferenciaStock(BigDecimal.ZERO)
                        .precioActual(currentPrice)
                        .precioNuevo(newPrice)
                        .build());
            }
        }
        return impactos;
    }

    private List<ImpactoDocumentoDto> parsePdf(MultipartFile file) {
        List<ImpactoDocumentoDto> impactos = new ArrayList<>();

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            SpreadsheetExtractionAlgorithm extractor = new SpreadsheetExtractionAlgorithm();
            technology.tabula.ObjectExtractor objectExtractor = new technology.tabula.ObjectExtractor(document);

            // Process first page (can be extended to all pages if needed)
            Page page = objectExtractor.extract(1);
            List<Table> tables = extractor.extract(page);

            if (tables.isEmpty()) {
                throw new RuntimeException("No tables found in PDF");
            }

            // Use first table
            Table table = tables.get(0);
            List<List<RectangularTextContainer>> rows = table.getRows();

            int codeIdx = -1;
            int priceIdx = -1;
            int headerRowIdx = -1;

            // Search for header in first 30 rows
            for (int i = 0; i < Math.min(30, rows.size()); i++) {
                List<RectangularTextContainer> row = rows.get(i);

                int tempCodeIdx = -1;
                int tempPriceIdx = -1;

                for (int j = 0; j < row.size(); j++) {
                    String cellText = row.get(j).getText().toLowerCase().trim();
                    if (cellText.contains("cod") || cellText.contains("sku") || cellText.contains("code")) {
                        tempCodeIdx = j;
                    } else if (cellText.contains("precio") || cellText.contains("valor") ||
                            cellText.contains("costo") || cellText.contains("price")) {
                        tempPriceIdx = j;
                    }
                }

                // Require both columns for header
                if (tempCodeIdx != -1 && tempPriceIdx != -1) {
                    headerRowIdx = i;
                    codeIdx = tempCodeIdx;
                    priceIdx = tempPriceIdx;
                    break;
                }
            }

            // Fallback
            if (codeIdx == -1)
                codeIdx = 0;
            if (priceIdx == -1)
                priceIdx = 1;

            int startRow = (headerRowIdx == -1) ? 0 : headerRowIdx + 1;

            // First Pass: Collect Codes
            java.util.Set<String> codesToFetch = new java.util.HashSet<>();
            List<TempRow> tempRows = new ArrayList<>();

            for (int i = startRow; i < rows.size(); i++) {
                List<RectangularTextContainer> row = rows.get(i);

                if (row.size() <= Math.max(codeIdx, priceIdx)) {
                    continue;
                }

                String code = row.get(codeIdx).getText().trim();
                String priceStr = row.get(priceIdx).getText().trim();

                if (code.isEmpty() || priceStr.isEmpty()) {
                    continue;
                }

                double priceVal;
                try {
                    // Remove currency symbols and parse
                    priceVal = Double.parseDouble(priceStr.replaceAll("[^0-9.]", ""));
                } catch (NumberFormatException e) {
                    continue;
                }

                if (priceVal < 0) {
                    continue;
                }

                codesToFetch.add(code);
                tempRows.add(new TempRow(code, priceVal, "", "")); // PDF: No marca, No description extracted
            }

            // Batch Fetch
            java.util.List<Product> foundProducts = productRepository.findByCodeIn(codesToFetch);
            java.util.Map<String, Product> productMap = new java.util.HashMap<>();
            for (Product p : foundProducts) {
                if (p.getCode() != null) {
                    productMap.put(p.getCode().trim().toUpperCase(), p);
                }
            }

            // Create Impacts
            for (TempRow row : tempRows) {
                Product product = productMap.get(row.code.trim().toUpperCase());
                BigDecimal currentPrice = product != null ? product.getPrice() : BigDecimal.ZERO;
                BigDecimal newPrice = BigDecimal.valueOf(row.price);

                impactos.add(ImpactoDocumentoDto.builder()
                        .code(row.code)
                        .description(product != null ? product.getDescription() : "Manual Import " + row.code)
                        .stockActual(product != null ? product.getStock() : BigDecimal.ZERO)
                        .stockNuevo(product != null ? product.getStock() : BigDecimal.ZERO)
                        .diferenciaStock(BigDecimal.ZERO)
                        .precioActual(currentPrice)
                        .precioNuevo(newPrice)
                        .build());
            }

        } catch (Exception e) {
            throw new RuntimeException("Error parsing PDF", e);
        }

        return impactos;
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PrecioStrategy.class);

    @Override
    public void apply(Documento documento, List<ImpactoDocumentoDto> impactos) {
        // Collect all codes
        java.util.Set<String> codes = new java.util.HashSet<>();
        for (ImpactoDocumentoDto imp : impactos) {
            codes.add(imp.getCode());
        }

        // Batch fetch products
        // Batch fetch products (Case Insensitive Strategy)
        // We fetch by exact codes, then also by upper codes to capture variations
        java.util.Set<String> upperCodes = codes.stream().map(String::toUpperCase)
                .collect(java.util.stream.Collectors.toSet());
        List<Product> exactMatches = productRepository.findByCodeIn(codes);
        List<Product> upperMatches = productRepository.findByCodeIn(upperCodes);

        java.util.Map<String, Product> productMap = new java.util.HashMap<>();

        // Populate map with normalized key
        for (Product p : exactMatches)
            if (p.getCode() != null)
                productMap.put(p.getCode().trim().toUpperCase(), p);
        for (Product p : upperMatches)
            if (p.getCode() != null)
                productMap.put(p.getCode().trim().toUpperCase(), p);

        // Update or create products (UPSERT)
        java.util.List<Product> productsToSave = new ArrayList<>();
        for (ImpactoDocumentoDto imp : impactos) {
            Product product = productMap.get(imp.getCode().trim().toUpperCase());

            // If product doesn't exist, create new one
            if (product == null) {
                product = new Product();
                product.setCode(imp.getCode());
                product.setHidden(false);
                product.setSearchable(true);
                product.setStock(BigDecimal.ZERO);
                // Only set description on creation if provided
                product.setDescription(imp.getDescription());
            } else {
                // UPDATE existing product
                // Only update description if the import has a valid one (not the fallback
                // "Manual Import" if we want to preserve DB)
                // But wait, the ImpactoDto ALREADY calculated the final description in the
                // parse step!
                // So we can just set it.
                product.setDescription(imp.getDescription());
            }

            // Update price (for both new and existing products)
            product.setPrice(imp.getPrecioNuevo());

            // Save marca if present in uploaded file (not empty)
            if (imp.getMarca() != null && !imp.getMarca().trim().isEmpty()) {
                product.setMarca(imp.getMarca());
            }

            productsToSave.add(product);
        }

        // Batch save (both new and updated products)
        if (!productsToSave.isEmpty()) {
            productRepository.saveAll(productsToSave);
        }
    }
}
