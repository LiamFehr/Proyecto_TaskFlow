package com.proyecto.service;

import com.proyecto.model.ImportacionCsv;
import com.proyecto.model.Product;
import com.proyecto.model.Usuario;
import com.proyecto.repository.ImportacionCsvRepository;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminCsvService {

    private final ProductRepository productRepository;
    private final ImportacionCsvRepository importacionCsvRepository;

    @org.springframework.transaction.annotation.Transactional
    public ImportacionCsv importarProductosDesdeLista(List<com.proyecto.dto.ProductDto> dtos, String filename,
            Usuario admin) {
        int insertados = 0;
        int actualizados = 0;
        StringBuilder errores = new StringBuilder();

        for (int i = 0; i < dtos.size(); i++) {
            com.proyecto.dto.ProductDto dto = dtos.get(i);
            try {
                if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
                    errores.append("Item ").append(i).append(": Código vacío\n");
                    continue;
                }
                String codigo = dto.getCode().trim();
                BigDecimal price = dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO;

                Product product = productRepository.findByCode(codigo)
                        .orElse(Product.builder().code(codigo).hidden(false).searchable(true).build());

                boolean esNuevo = (product.getId() == null);
                product.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : "");
                product.setPrice(price);
                if (dto.getHidden() != null)
                    product.setHidden(dto.getHidden());
                if (dto.getSearchable() != null)
                    product.setSearchable(dto.getSearchable());

                productRepository.save(product);
                if (esNuevo)
                    insertados++;
                else
                    actualizados++;

            } catch (Exception e) {
                errores.append("Item ").append(i).append(": Error - ").append(e.getMessage()).append("\n");
            }
        }
        return saveLog(admin, filename != null ? filename : "IMPORT_JSON", insertados, actualizados, errores);
    }

    @org.springframework.transaction.annotation.Transactional
    public ImportacionCsv importarProductosDesdeCsv(MultipartFile file, Usuario admin) {
        String filename = file.getOriginalFilename();
        if (filename != null && (filename.endsWith(".xlsx") || filename.endsWith(".xls"))) {
            return importarDesdeExcel(file, admin);
        }
        return importarDesdeTexto(file, admin);
    }

    private ImportacionCsv importarDesdeExcel(MultipartFile file, Usuario admin) {
        int insertados = 0;
        int actualizados = 0;
        StringBuilder errores = new StringBuilder();

        try (InputStream is = file.getInputStream();
                Workbook workbook = new XSSFWorkbook(is)) { // Supports .xlsx

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            Map<String, Integer> headerMap = new HashMap<>();

            // Header detection
            if (rows.hasNext()) {
                Row headerRow = rows.next();
                for (Cell cell : headerRow) {
                    headerMap.put(getCellValue(cell).toLowerCase().trim(), cell.getColumnIndex());
                }
            }

            int rowNum = 1;
            while (rows.hasNext()) {
                Row row = rows.next();
                rowNum++;
                try {
                    String codigo = getColumnValue(row, headerMap, "code", "codigo", "sku");
                    if (codigo.isEmpty()) {
                        // Try fallback: maybe first column?
                        if (headerMap.isEmpty())
                            codigo = getCellValue(row.getCell(0));
                    }

                    if (codigo.isEmpty())
                        continue; // Skip empty rows

                    String descripcion = getColumnValue(row, headerMap, "description", "descripcion", "nombre", "desc",
                            "detalle", "producto", "articulo");
                    String precioStr = getColumnValue(row, headerMap, "price", "precio", "costo", "valor");
                    String barcode = getColumnValue(row, headerMap, "barcode", "barra", "ean", "upc");

                    // If simple Excel with no Headers, assume Col 0=Code, Col 1=Desc, Col 2=Price
                    if (headerMap.isEmpty() || !headerMap.containsKey("code")) {
                        // Fallback logic for headerless files
                        codigo = getCellValue(row.getCell(0));
                        descripcion = getCellValue(row.getCell(1));
                        precioStr = getCellValue(row.getCell(2));
                    }

                    BigDecimal price = parsePrice(precioStr);

                    Result res = upsertProduct(codigo, descripcion, price, barcode);
                    if (res == Result.INSERTED)
                        insertados++;
                    else if (res == Result.UPDATED)
                        actualizados++;

                } catch (Exception e) {
                    errores.append("Fila ").append(rowNum).append(": ").append(e.getMessage()).append("\n");
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("Error procesando Excel: " + e.getMessage(), e);
        }
        return saveLog(admin, file.getOriginalFilename(), insertados, actualizados, errores);
    }

    private ImportacionCsv importarDesdeTexto(MultipartFile file, Usuario admin) {
        int insertados = 0;
        int actualizados = 0;
        StringBuilder errores = new StringBuilder();

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line = br.readLine();
            if (line == null)
                return saveLog(admin, file.getOriginalFilename(), 0, 0, new StringBuilder("Archivo vacío"));

            // Remove BOM
            line = line.replace("\uFEFF", "");

            String separator = line.contains(";") ? ";" : ",";
            String[] headers = line.split(separator);
            Map<String, Integer> headerMap = new HashMap<>();

            boolean hasHeader = false;
            for (int i = 0; i < headers.length; i++) {
                String h = headers[i].toLowerCase().trim().replace("\"", "");
                headerMap.put(h, i);
                if (h.equals("code") || h.equals("codigo"))
                    hasHeader = true;
            }

            int lineNum = 1;
            // If no header detected, we might need to reset reader or assume first line is
            // data?
            // For safety, if "code" keyword is missing in first line, assume it's data
            // unless it looks like text headers.
            // But usually CSVs have headers. Let's assume headers if any standard column is
            // found.

            // If we consumed the header, loop rests.
            // If we didn't confirm header, we might have skipped data.
            // Simple approach: Only treat as header if it contains specific keywords. Else,
            // treat as data (Col0=Code).

            boolean firstLineIsHeader = hasHeader;

            while (true) {
                if (!firstLineIsHeader && lineNum == 1) {
                    // Process first line as data
                } else {
                    line = br.readLine();
                    if (line == null)
                        break;
                    lineNum++;
                }

                if (line.trim().isEmpty())
                    continue;

                // Smart split handling quotes
                String[] parts;
                if (separator.equals(",")) {
                    parts = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
                } else {
                    parts = line.split(";");
                }

                try {
                    String codigo;
                    String descripcion;
                    String precioStr;
                    String barcode = null;

                    if (firstLineIsHeader) {
                        codigo = getCsvValue(parts, headerMap, "code", "codigo", "sku");
                        descripcion = getCsvValue(parts, headerMap, "description", "descripcion", "nombre", "desc",
                                "detalle", "producto", "articulo");
                        precioStr = getCsvValue(parts, headerMap, "price", "precio", "costo", "valor");
                        barcode = getCsvValue(parts, headerMap, "barcode", "barra", "ean");
                    } else {
                        // Fallback: Col0=Code, Col1=Desc, Col2=Price (Standard export)
                        codigo = parts.length > 0 ? parts[0] : "";
                        descripcion = parts.length > 1 ? parts[1] : "";
                        precioStr = parts.length > 2 ? parts[2] : "0";
                        // If file has 8 cols like previous sample: code=2
                        if (parts.length >= 6) {
                            // Using the legacy hardcoded fallback if pure data
                            // id, legacy, code, barcode, desc, price
                            codigo = parts[2];
                            descripcion = parts[4];
                            precioStr = parts[5];
                        }
                    }

                    codigo = clean(codigo);
                    descripcion = clean(descripcion);
                    precioStr = clean(precioStr);
                    barcode = clean(barcode);

                    if (codigo.isEmpty())
                        continue;

                    BigDecimal price = parsePrice(precioStr);
                    Result res = upsertProduct(codigo, descripcion, price, barcode);

                    if (res == Result.INSERTED)
                        insertados++;
                    else if (res == Result.UPDATED)
                        actualizados++;

                } catch (Exception e) {
                    errores.append("Línea ").append(lineNum).append(": ").append(e.getMessage()).append("\n");
                }

                if (!firstLineIsHeader && lineNum == 1) {
                    // Start loop for next lines logic
                    firstLineIsHeader = true; // prevent re-entry to this block, technically just proceed
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error CSV: " + e.getMessage(), e);
        }
        return saveLog(admin, file.getOriginalFilename(), insertados, actualizados, errores);
    }

    private Result upsertProduct(String code, String desc, BigDecimal price, String barcode) {
        Product product = productRepository.findByCode(code)
                .orElse(new Product());

        boolean isNew = (product.getId() == null);

        // If updating, only update non-empty fields? No, updates should overwrite?
        // User said "didn't update". Let's overwrite.

        if (isNew) {
            product.setCode(code);
            product.setHidden(false);
            product.setSearchable(true);
        }

        if (!desc.isEmpty())
            product.setDescription(desc);
        if (price != null)
            product.setPrice(price);
        if (barcode != null && !barcode.isEmpty() && !barcode.equals(code))
            product.setBarcode(barcode);

        productRepository.save(product);
        return isNew ? Result.INSERTED : Result.UPDATED;
    }

    private BigDecimal parsePrice(String val) {
        try {
            if (val == null || val.isEmpty())
                return BigDecimal.ZERO;
            String clean = val.replace("$", "").replace(",", ".").trim();
            return new BigDecimal(clean);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private String getColumnValue(Row row, Map<String, Integer> map, String... keys) {
        for (String k : keys) {
            if (map.containsKey(k)) {
                return getCellValue(row.getCell(map.get(k)));
            }
        }
        return "";
    }

    private String getCsvValue(String[] parts, Map<String, Integer> map, String... keys) {
        for (String k : keys) {
            if (map.containsKey(k)) {
                int idx = map.get(k);
                if (idx < parts.length)
                    return parts[idx];
            }
        }
        return "";
    }

    private String getCellValue(Cell cell) {
        if (cell == null)
            return "";
        try {
            switch (cell.getCellType()) {
                case STRING:
                    return cell.getStringCellValue().trim();
                case NUMERIC:
                    if (DateUtil.isCellDateFormatted(cell))
                        return cell.getDateCellValue().toString();
                    return String.valueOf((long) cell.getNumericCellValue()); // Integer code assumption
                case BOOLEAN:
                    return String.valueOf(cell.getBooleanCellValue());
                case FORMULA:
                    return cell.getCellFormula();
                default:
                    return "";
            }
        } catch (Exception e) {
            return "";
        }
    }

    private String clean(String s) {
        if (s == null)
            return "";
        return s.trim().replace("\"", "");
    }

    private ImportacionCsv saveLog(Usuario admin, String fname, int ins, int upd, StringBuilder err) {
        ImportacionCsv log = ImportacionCsv.builder()
                .usuario(admin)
                .archivo(fname)
                .productosInsertados(ins)
                .productosActualizados(upd)
                .errores(err.toString())
                .build();
        return importacionCsvRepository.save(log);
    }

    private enum Result {
        INSERTED, UPDATED
    }
}
