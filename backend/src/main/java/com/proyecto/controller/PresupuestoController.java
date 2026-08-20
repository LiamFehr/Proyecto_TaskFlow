package com.proyecto.controller;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.proyecto.dto.PresupuestoDto;
import com.proyecto.model.Pedido;
import com.proyecto.model.Presupuesto;
import com.proyecto.service.PresupuestoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Presupuesto> guardar(@RequestBody PresupuestoDto req, Principal principal) {
        String email = principal != null ? principal.getName() : "vendedor@taskflow.com";
        return ResponseEntity.ok(presupuestoService.guardar(req, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Presupuesto> actualizar(@PathVariable Long id, @RequestBody PresupuestoDto req) {
        return ResponseEntity.ok(presupuestoService.actualizar(id, req));
    }

    @GetMapping
    public ResponseEntity<List<Presupuesto>> listar(Principal principal) {
        String email = principal != null ? principal.getName() : "vendedor@taskflow.com";
        return ResponseEntity.ok(presupuestoService.listar(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Presupuesto> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(presupuestoService.obtener(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        presupuestoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/to-pedido")
    public ResponseEntity<Pedido> convertirAPedido(@PathVariable Long id, Principal principal) {
        String email = principal != null ? principal.getName() : "vendedor@taskflow.com";
        return ResponseEntity.ok(presupuestoService.convertirAPedido(id, email));
    }

    // ── PDF ───────────────────────────────────────────────────────────────────

    @PostMapping("/pdf")
    public ResponseEntity<byte[]> generarPdf(@RequestBody PresupuestoDto req) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        Font titleFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font smallFont  = FontFactory.getFont(FontFactory.HELVETICA, 8);

        // Header
        Paragraph company = new Paragraph("NEXT SYSTEM ERP", titleFont);
        company.setAlignment(Element.ALIGN_CENTER);
        doc.add(company);

        Paragraph subtitle = new Paragraph("PRESUPUESTO", headerFont);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        doc.add(subtitle);

        String fecha = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        doc.add(new Paragraph("Fecha: " + fecha, smallFont));
        doc.add(Chunk.NEWLINE);

        // Cliente
        doc.add(new Paragraph("DATOS DEL CLIENTE", headerFont));
        doc.add(new Paragraph("Nombre: " + nvl(req.getClienteNombre()), normalFont));
        if (notBlank(req.getClienteTelefono()))
            doc.add(new Paragraph("Tel: " + req.getClienteTelefono(), normalFont));
        if (notBlank(req.getDniCuit()))
            doc.add(new Paragraph("DNI/CUIT: " + req.getDniCuit(), normalFont));
        if (notBlank(req.getCondicionIva()))
            doc.add(new Paragraph("IVA: " + req.getCondicionIva(), normalFont));
        if (notBlank(req.getCiudad()))
            doc.add(new Paragraph("Ciudad: " + req.getCiudad()
                    + (notBlank(req.getProvincia()) ? ", " + req.getProvincia() : ""), normalFont));
        doc.add(Chunk.NEWLINE);

        // Items table
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{10, 55, 17.5f, 17.5f});

        addHeaderCell(table, "CANT.", headerFont);
        addHeaderCell(table, "DESCRIPCIÓN", headerFont);
        addHeaderCell(table, "PRECIO UNIT.", headerFont);
        addHeaderCell(table, "SUBTOTAL", headerFont);

        BigDecimal total = BigDecimal.ZERO;
        if (req.getItems() != null) {
            for (PresupuestoDto.ItemDto item : req.getItems()) {
                BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                BigDecimal qty   = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
                BigDecimal sub   = price.multiply(qty);
                total = total.add(sub);

                table.addCell(new PdfPCell(new Phrase(qty.stripTrailingZeros().toPlainString(), normalFont)));
                table.addCell(new PdfPCell(new Phrase(nvl(item.getDescription()), normalFont)));
                PdfPCell priceCell = new PdfPCell(new Phrase("$" + formatNum(price), normalFont));
                priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(priceCell);
                PdfPCell subCell = new PdfPCell(new Phrase("$" + formatNum(sub), normalFont));
                subCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(subCell);
            }
        }
        doc.add(table);
        doc.add(Chunk.NEWLINE);

        // Total
        Paragraph totalPara = new Paragraph("TOTAL: $" + formatNum(total),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
        totalPara.setAlignment(Element.ALIGN_RIGHT);
        doc.add(totalPara);

        if (notBlank(req.getObservaciones())) {
            doc.add(Chunk.NEWLINE);
            doc.add(new Paragraph("Observaciones: " + req.getObservaciones(), smallFont));
        }

        doc.close();
        byte[] pdf = baos.toByteArray();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"presupuesto.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // ── PDF helpers ───────────────────────────────────────────────────────────

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new java.awt.Color(220, 220, 220));
        cell.setPadding(4);
        table.addCell(cell);
    }

    private String nvl(String s) { return s != null ? s : ""; }
    private boolean notBlank(String s) { return s != null && !s.isBlank(); }
    private String formatNum(BigDecimal n) {
        return String.format("%,.2f", n).replace(',', 'X').replace('.', ',').replace('X', '.');
    }
}
