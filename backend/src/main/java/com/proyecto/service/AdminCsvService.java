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
                if (lineaN == 1 && linea.toLowerCase().contains("codigo")) {
                    // opcional: saltear encabezado
                    continue;
                }

                String[] partes = linea.split(";");
                if (partes.length < 3) {
                    partes = linea.split(",");
                }

                if (partes.length < 3) {
                    errores.append("Línea ").append(lineaN).append(": formato inválido (se esperaba csv con ; o ,)\n");
                    continue;
                }

                String codigo = partes[0].trim();
                String descripcion = partes[1].trim();
                String precioStr = partes[2].trim();

                try {
                    double precioLista = Double.parseDouble(precioStr);
                    java.math.BigDecimal price = java.math.BigDecimal.valueOf(precioLista);

                    // Buscar por código (ProductRepository debe tener findByCode)
                    Product product = productRepository.findByCode(codigo)
                            .orElse(Product.builder()
                                    .code(codigo)
                                    .hidden(false)
                                    .searchable(true)
                                    .build());

                    boolean esNuevo = (product.getId() == null);

                    product.setDescription(descripcion);
                    product.setPrice(price);

                    // Si es nuevo, defaults (o manejados en builder)
                    if (product.getHidden() == null)
                        product.setHidden(false);
                    if (product.getSearchable() == null)
                        product.setSearchable(true);

                    productRepository.save(product);

                    if (esNuevo)
                        insertados++;
                    else
                        actualizados++;

                } catch (NumberFormatException ex) {
                    errores.append("Línea ").append(lineaN)
                            .append(": precio inválido -> ").append(precioStr).append("\n");
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
