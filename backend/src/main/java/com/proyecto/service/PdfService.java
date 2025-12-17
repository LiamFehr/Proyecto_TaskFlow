package com.proyecto.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.proyecto.dto.PresupuestoDto;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfService {

    public byte[] generarPresupuestoPdf(PresupuestoDto data) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // Margins: Left, Right, Top, Bottom
            Document document = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter.getInstance(document, out);

            document.open();

            // Fonts - Fix: Use FontFactory.getFont instead of new Font(String name...)
            Font companyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font headerBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font headerNormal = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
            Font tableBodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font smallLinkFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.UNDERLINE, Color.BLUE);
            Font smallDisclaimerFont = FontFactory.getFont(FontFactory.HELVETICA, 7);

            // --- HEADER SECTION ---
            PdfPTable headerTable = new PdfPTable(3);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 2, 4, 2 }); // Logo, Info, Date

            // 1. Logo (Fall-safe)
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            try {
                // Try loading from classpath stream
                java.io.InputStream is = getClass().getResourceAsStream("/images/logo_standard.png");
                if (is != null) {
                    byte[] logoBytes = is.readAllBytes();
                    Image logo = Image.getInstance(logoBytes);
                    logo.scaleToFit(120, 60);
                    logoCell.addElement(logo);
                } else {
                    logoCell.addElement(new Paragraph("VHP", companyFont));
                }
            } catch (Exception e) {
                // Absolute fallback
                logoCell.addElement(new Paragraph("VHP", companyFont));
            }
            headerTable.addCell(logoCell);

            // 2. Company Info
            PdfPCell companyInfoCell = new PdfPCell();
            companyInfoCell.setBorder(Rectangle.NO_BORDER);
            companyInfoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            Paragraph pCompany = new Paragraph("Victor H. Petruccio SS", companyFont);
            pCompany.setAlignment(Element.ALIGN_CENTER);
            companyInfoCell.addElement(pCompany);

            Paragraph pDetails = new Paragraph(
                    "ALMAFUERTE 509. CUIT:30-71187763-7 | Inicio de act.: 08/201\n" +
                            "Resp. Inscripto - (3100) Paraná, Entre Ríos, Argentina\n" +
                            "Tel: (0343) 4242908 - Cel: 343-5248195\n" +
                            "E-mail: victorhugopetruccio1947@gmail.com",
                    headerNormal);
            pDetails.setAlignment(Element.ALIGN_CENTER);
            companyInfoCell.addElement(pDetails);
            headerTable.addCell(companyInfoCell);

            // 3. Date Box
            PdfPCell dateCell = new PdfPCell();
            dateCell.setBorder(Rectangle.BOX);
            dateCell.setPadding(5);
            dateCell.addElement(new Paragraph(
                    "Fecha: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), headerBold));
            headerTable.addCell(dateCell);

            document.add(headerTable);

            // Link Line
            Paragraph pLink = new Paragraph("http://www.victorpetruccio.com/", smallLinkFont);
            pLink.setAlignment(Element.ALIGN_CENTER);
            pLink.setSpacingAfter(5);
            document.add(pLink);

            // --- TITLE BAR ---
            PdfPTable titleTable = new PdfPTable(1);
            titleTable.setWidthPercentage(100);
            PdfPCell titleCell = new PdfPCell(new Phrase("PRESUPUESTO", titleFont));
            titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            titleCell.setBackgroundColor(Color.LIGHT_GRAY);
            titleCell.setPadding(3);
            titleTable.addCell(titleCell);
            document.add(titleTable);

            // --- CLIENT SECTION ---
            PdfPTable clientTable = new PdfPTable(1);
            clientTable.setWidthPercentage(100);

            // "CLIENTE" Label
            PdfPCell clientLabelCell = new PdfPCell(new Phrase("CLIENTE", headerNormal));
            clientLabelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            clientLabelCell.setBorder(Rectangle.LEFT | Rectangle.RIGHT | Rectangle.TOP);
            clientTable.addCell(clientLabelCell);

            // Client Name
            String cName = (data.getClienteNombre() != null) ? data.getClienteNombre() : "";
            PdfPCell clientNameCell = new PdfPCell(new Phrase(cName, headerBold));
            clientNameCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            clientNameCell.setBorder(Rectangle.LEFT | Rectangle.RIGHT | Rectangle.BOTTOM);
            clientNameCell.setPaddingBottom(5);
            clientTable.addCell(clientNameCell);
            document.add(clientTable);

            // Client Details Grid
            PdfPTable clientDetailsTable = new PdfPTable(2);
            clientDetailsTable.setWidthPercentage(100);
            clientDetailsTable.setWidths(new float[] { 1, 1 });

            String cTel = (data.getClienteTelefono() != null) ? data.getClienteTelefono() : "";
            // Use observaciones as Address
            String address = (data.getObservaciones() != null) ? data.getObservaciones() : "";
            String city = (data.getCiudad() != null) ? data.getCiudad() : "Paraná";
            String prov = (data.getProvincia() != null) ? data.getProvincia() : "Entre Ríos";
            String dni = (data.getDniCuit() != null) ? data.getDniCuit() : "";
            String iva = (data.getCondicionIva() != null) ? data.getCondicionIva() : "Consumidor Final";

            PdfPCell cLeft = new PdfPCell();
            cLeft.setBorder(Rectangle.BOX);
            cLeft.addElement(new Phrase("Dirección: " + address, headerNormal));
            cLeft.addElement(new Phrase("Ciudad: " + city, headerNormal));
            cLeft.addElement(new Phrase("Provincia: " + prov, headerNormal));
            clientDetailsTable.addCell(cLeft);

            PdfPCell cRight = new PdfPCell();
            cRight.setBorder(Rectangle.BOX);
            cRight.addElement(new Phrase("Tel: " + cTel, headerNormal));
            cRight.addElement(new Phrase("CUIT/DNI: " + dni, headerNormal));
            cRight.addElement(new Phrase("IVA: " + iva, headerNormal));
            clientDetailsTable.addCell(cRight);

            document.add(clientDetailsTable);

            // Spacer
            document.add(new Paragraph("MERCADERÍA", FontFactory.getFont(FontFactory.HELVETICA, 8)));

            // --- ITEMS TABLE ---
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 1, 5, 2, 2 });
            table.setSpacingBefore(5);

            // Header
            addHeaderCell(table, "CANTIDAD", tableHeaderFont);
            addHeaderCell(table, "DESCRIPCIÓN", tableHeaderFont);
            addHeaderCell(table, "Precio Unitario", tableHeaderFont);
            addHeaderCell(table, "Precio Total", tableHeaderFont);

            // Body
            Locale arLocale = new Locale.Builder().setLanguage("es").setRegion("AR").build();
            NumberFormat currency = NumberFormat.getCurrencyInstance(arLocale);
            double total = 0;

            for (PresupuestoDto.PresupuestoItemDto item : data.getItems()) {
                addBodyCell(table, String.valueOf(item.getQuantity()), tableBodyFont, Element.ALIGN_CENTER);
                addBodyCell(table, item.getDescription(), tableBodyFont, Element.ALIGN_LEFT);
                addBodyCell(table, currency.format(item.getPrice()), tableBodyFont, Element.ALIGN_RIGHT);

                double subtotal = item.getPrice() * item.getQuantity();
                total += subtotal;
                addBodyCell(table, currency.format(subtotal), tableBodyFont, Element.ALIGN_RIGHT);
            }

            // Fill empty rows dynamically
            int currentRows = data.getItems().size();
            int minRows = 12; // Minimum rows to look good on A4
            int rowsToAdd = 1; // Default to 1 extra row

            if (currentRows < minRows) {
                rowsToAdd = minRows - currentRows;
            }

            for (int i = 0; i < rowsToAdd; i++) {
                addBodyCell(table, " ", tableBodyFont, Element.ALIGN_CENTER);
                addBodyCell(table, " ", tableBodyFont, Element.ALIGN_LEFT);
                addBodyCell(table, " ", tableBodyFont, Element.ALIGN_RIGHT);
                addBodyCell(table, " ", tableBodyFont, Element.ALIGN_RIGHT);
            }

            document.add(table);

            // --- FOOTER / TOTALS ---
            PdfPTable footerTable = new PdfPTable(3);
            footerTable.setWidthPercentage(100);
            footerTable.setSpacingBefore(10);
            footerTable.setWidths(new float[] { 3, 3, 3 });

            // Col 1: Precios con IVA
            PdfPCell f1 = new PdfPCell();
            f1.addElement(new Paragraph("PRECIOS CON IVA", headerBold));
            f1.addElement(new Paragraph("Validez de la oferta: 10 DÍAS (*)", headerNormal));
            f1.setBorder(Rectangle.BOX);
            footerTable.addCell(f1);

            // Col 2: Condiciones
            PdfPCell f2 = new PdfPCell();
            f2.addElement(new Paragraph("Forma de pago: CONTADO", headerNormal));
            f2.addElement(new Paragraph("Plazo de entrega: 10 DIAS (*)", headerNormal));
            f2.setBorder(Rectangle.BOX);
            footerTable.addCell(f2);

            // Col 3: Total
            PdfPCell f3 = new PdfPCell();
            Paragraph pTotal = new Paragraph("TOTAL   " + currency.format(total), totalFont);
            pTotal.setAlignment(Element.ALIGN_RIGHT);
            f3.addElement(pTotal);
            f3.setVerticalAlignment(Element.ALIGN_MIDDLE);
            f3.setBorder(Rectangle.BOX);
            footerTable.addCell(f3);

            document.add(footerTable);

            // Disclaimer
            Paragraph disclaimer = new Paragraph(
                    "*El plazo de entrega es estimativo. Podría verse afectado por razones ajenas a la Empresa.",
                    smallDisclaimerFont);
            disclaimer.setSpacingBefore(5);
            document.add(disclaimer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error al generar PDF", e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBorderWidth(1);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(align);
        cell.setBorderWidth(1);
        table.addCell(cell);
    }
}
