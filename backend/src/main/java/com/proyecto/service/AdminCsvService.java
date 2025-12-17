package com.proyecto.service;

import com.proyecto.model.ImportacionCsv;
import com.proyecto.model.Product;
import com.proyecto.model.Usuario;
import com.proyecto.repository.ImportacionCsvRepository;
import com.proyecto.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class AdminCsvService {

    private final ProductRepository productRepository;
    private final ImportacionCsvRepository importacionCsvRepository;

    @org.springframework.transaction.annotation.Transactional
    public ImportacionCsv importarProductosDesdeLista(java.util.List<com.proyecto.dto.ProductDto> dtos, String filename,
            Usuario admin) {
        int insertados = 0;
        int actualizados = 0;
        StringBuilder errores = new StringBuilder();

        for (int i = 0; i < dtos.size(); i++) {
            com.proyecto.dto.ProductDto dto = dtos.get(i);
            try {
                // Validations
                if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
                    errores.append("Item ").append(i).append(": Código vacío\n");
                    continue;
                }

                String codigo = dto.getCode().trim();
                java.math.BigDecimal price = dto.getPrice();
                if (price == null)
                    price = java.math.BigDecimal.ZERO;

                Product product = productRepository.findByCode(codigo)
                        .orElse(Product.builder()
                                .code(codigo)
                                .hidden(false)
                                .searchable(true)
                                .build());

                boolean esNuevo = (product.getId() == null);

                product.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : "");
                product.setPrice(price);

                // Optional fields
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
                errores.append("Item ").append(i).append(": Error interna - ").append(e.getMessage()).append("\n");
            }
        }

        ImportacionCsv log = ImportacionCsv.builder()
                .usuario(admin)
                .archivo(filename != null ? filename : "IMPORT_JSON")
                .productosInsertados(insertados)
                .productosActualizados(actualizados)
                .errores(errores.toString())
                .build();

        return importacionCsvRepository.save(log);
    }

    @org.springframework.transaction.annotation.Transactional
    public ImportacionCsv importarProductosDesdeCsv(MultipartFile file, Usuario admin) {
        int insertados = 0;
        int actualizados = 0;
        StringBuilder errores = new StringBuilder();

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String linea;
            int lineaN = 0;

            while ((linea = br.readLine()) != null) {
                lineaN++;

                // BOM check on first line
                if (lineaN == 1) {
                    // Remove BOM if present (UTF-8)
                    linea = linea.replace("\uFEFF", "");
                    if (linea.toLowerCase().contains("codigo")) {
                        continue;
                    }
                }

                // Regex to split by comma, respecting quotes
                // Matches commas that are followed by an even number of quotes (meaning they
                // are outside quotes)
                String[] partes = linea.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);

                // User provided CSV Example:
                // id,legacy_id,code,barcode,description,price,hidden,searchable
                // indices: 0 1 2 3 4 5 6 7

                // Fallback for simple semicolon
                if (partes.length < 3) {
                    partes = linea.split(";");
                }

                if (partes.length < 3) {
                    errores.append("Línea ").append(lineaN).append(": formato inválido (se esperaba csv con ; o ,)\n");
                    continue;
                }

                // DETERMINE COLUMNS DYNAMICALLY OR FIXED BASED ON SAMPLE
                // Based on sample: 145,1128,1128,1128,"PORTA CAFE...",960,false,true
                // Code is index 2. Description is index 4. Price is index 5.

                String codigo;
                String descripcion;
                String precioStr;

                if (partes.length >= 6) {
                    // Standard 8-column format from sample
                    codigo = partes[2].trim();
                    descripcion = partes[4].trim();
                    precioStr = partes[5].trim();
                } else {
                    // Fallback to simple 3-column [code, desc, price] if file is different
                    codigo = partes[0].trim();
                    descripcion = partes[1].trim();
                    precioStr = partes[2].trim();
                }

                // Remove quotes around description if present
                if (descripcion.startsWith("\"") && descripcion.endsWith("\"")) {
                    descripcion = descripcion.substring(1, descripcion.length() - 1);
                }
                // Handle internal quotes escaped as ""
                descripcion = descripcion.replace("\"\"", "\"");

                if (codigo.isEmpty()) {
                    errores.append("Línea ").append(lineaN).append(": el código no puede estar vacío\n");
                    continue;
                }

                try {
                    // CLEANING PRICE (comma to dot, remove $, remove quotes)
                    String precioClean = precioStr.replace("\"", "").replace("$", "").replace(",", ".").trim();

                    double precioVal = Double.parseDouble(precioClean);
                    java.math.BigDecimal price = java.math.BigDecimal.valueOf(precioVal);
                    if (price.compareTo(java.math.BigDecimal.ZERO) < 0) {
                        errores.append("Línea ").append(lineaN).append(": el precio no puede ser negativo\n");
                        continue;
                    }

                    // --- LOGICA UPSERT (Opción A) ---
                    // 1. Buscar o crear nueva instancia vacía
                    Product product = productRepository.findByCode(codigo)
                            .orElse(new Product());

                    boolean esNuevo = (product.getId() == null);

                    // 2. Setear VALORES (siempre, tanto para new como update)
                    product.setCode(codigo); // Importante setearlo si es nuevo
                    product.setDescription(descripcion);
                    product.setPrice(price);

                    if (partes.length > 3 && partes[3].trim().length() > 0 && !partes[3].equals(codigo)) {
                        product.setBarcode(partes[3].trim());
                    }

                    // 3. Defaults para nuevos
                    if (esNuevo) {
                        product.setHidden(false);
                        product.setSearchable(true);
                    }

                    // 4. Guardar
                    productRepository.save(product);

                    if (esNuevo) {
                        insertados++;
                    } else {
                        actualizados++;
                    }

                } catch (NumberFormatException ex) {
                    errores.append("Línea ").append(lineaN)
                            .append(": precio inválido -> ").append(precioStr).append("\n");
                } catch (Exception ex) {
                    // Catch genérico para que una fila mala no aborte todo el archivo
                    errores.append("Línea ").append(lineaN)
                            .append(": error inesperado -> ").append(ex.getMessage()).append("\n");
                    ex.printStackTrace(); // Log to console for debugging
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("Error al procesar el CSV: " + e.getMessage(), e);
        }

        ImportacionCsv log = ImportacionCsv.builder()
                .usuario(admin)
                .archivo(file.getOriginalFilename())
                .productosInsertados(insertados)
                .productosActualizados(actualizados)
                .errores(errores.toString())
                .build();

        return importacionCsvRepository.save(log);
    }
}
