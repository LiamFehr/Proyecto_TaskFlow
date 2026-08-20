const fmt = (n: number) =>
    n.toLocaleString('es-AR', { minimumFractionDigits: 2 });

const ENTERPRISE = {
    name: 'Victor H. Petruccio SS',
    address: 'ALMAFUERTE 509 – Paraná, Entre Ríos',
    cuit: '30-71187763-7',
    condition: 'Resp. Inscripto – IVA',
    phone: '(0343) 4242908 / 343-5248195',
    email: 'victorhugopetruccio1947@gmail.com',
};

interface PresupuestoData {
    clientName: string;
    clientPhone: string;
    dniCuit: string;
    condicionIva: string;
    ciudad: string;
    provincia: string;
    observations: string;
    items: { description: string; code?: string; price: number; quantity: number }[];
    total: number;
}

export function generatePresupuestoHtml(data: PresupuestoData): string {
    const dateFormatted = new Date().toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });

    const itemRows = data.items.map(item => `
        <tr>
            <td style="border:1px solid #888;padding:4px 6px;text-align:center;">${item.quantity}</td>
            <td style="border:1px solid #888;padding:4px 8px;">
                ${item.description}
                ${item.code ? `<span style="font-size:10px;color:#888;"> (${item.code})</span>` : ''}
            </td>
            <td style="border:1px solid #888;padding:4px 8px;text-align:right;">$${fmt(item.price)}</td>
            <td style="border:1px solid #888;padding:4px 8px;text-align:right;font-weight:700;">$${fmt(item.price * item.quantity)}</td>
        </tr>`).join('');

    const emptyRows = Array.from({ length: Math.max(0, 8 - data.items.length) }).map(() =>
        `<tr style="height:22px;">
            <td style="border:1px solid #888;"></td>
            <td style="border:1px solid #888;"></td>
            <td style="border:1px solid #888;text-align:right;padding:4px 8px;font-size:11px;color:#aaa;">0,00</td>
            <td style="border:1px solid #888;text-align:right;padding:4px 8px;font-size:11px;color:#aaa;">0,00</td>
        </tr>`).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Presupuesto</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  @page{size:A4;margin:15mm 10mm;}
  body{font-family:"Times New Roman",Times,serif;font-size:12px;color:#000;}
</style>
</head><body>
<div style="width:100%;padding:0;color:#000;font-family:'Times New Roman',Times,serif;font-size:12px;">

  <!-- HEADER -->
  <div style="border:1.5px solid #000;border-radius:6px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:stretch;gap:0;">

    <div style="display:flex;align-items:center;gap:12px;flex:1;">
      <div>
        <div style="font-size:18px;font-weight:900;font-family:Arial,sans-serif;letter-spacing:-0.5px;margin-bottom:3px;">${ENTERPRISE.name}</div>
        <div style="font-size:10px;line-height:1.7;color:#222;">
          <div>${ENTERPRISE.address} &nbsp;•&nbsp; CUIT: ${ENTERPRISE.cuit}</div>
          <div style="font-weight:700;">${ENTERPRISE.condition}</div>
          <div>Tel: ${ENTERPRISE.phone}</div>
          <div>E-mail: ${ENTERPRISE.email}</div>
        </div>
      </div>
    </div>

    <div style="width:1.5px;background:#000;margin:0 14px;"></div>

    <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:6px;min-width:130px;">
      <div style="font-size:16px;font-weight:900;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">PRESUPUESTO</div>
      <div style="font-size:11px;white-space:nowrap;"><strong>Fecha:</strong> ${dateFormatted}</div>
    </div>

  </div>

  <!-- CLIENTE -->
  <div style="border:1px solid #000;padding:3px 8px;text-align:center;font-weight:700;font-size:13px;">${data.clientName || 'CONSUMIDOR FINAL'}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #000;border-top:none;">
    <div style="border-right:1px solid #000;padding:3px 8px;font-size:11px;"><strong>Ciudad:</strong> ${data.ciudad || ''}</div>
    <div style="padding:3px 8px;font-size:11px;"><strong>Tel:</strong> ${data.clientPhone || ''}</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #000;border-top:none;">
    <div style="border-right:1px solid #000;padding:3px 8px;font-size:11px;"><strong>Provincia:</strong> ${data.provincia || ''}</div>
    <div style="padding:3px 8px;font-size:11px;"><strong>CUIT/DNI:</strong> ${data.dniCuit || ''}</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid #000;border-top:none;margin-bottom:0;">
    <div style="border-right:1px solid #000;padding:3px 8px;font-size:11px;"><strong>Cond. IVA:</strong> ${data.condicionIva || ''}</div>
    <div style="padding:3px 8px;font-size:11px;"></div>
  </div>

  <!-- MERCADERÍA -->
  <table style="width:100%;border-collapse:collapse;font-size:12px;">
    <thead>
      <tr style="background:#1a1a1a;">
        <th style="border:1px solid #000;padding:5px 6px;font-size:11px;text-align:center;width:70px;font-family:Arial,sans-serif;color:#fff;letter-spacing:1px;">CANTIDAD</th>
        <th style="border:1px solid #000;padding:5px 6px;font-size:11px;text-align:center;font-family:Arial,sans-serif;color:#fff;letter-spacing:1px;">DESCRIPCIÓN</th>
        <th style="border:1px solid #000;padding:5px 6px;font-size:11px;text-align:center;width:100px;font-family:Arial,sans-serif;color:#fff;letter-spacing:1px;">P. UNITARIO</th>
        <th style="border:1px solid #000;padding:5px 6px;font-size:11px;text-align:center;width:100px;font-family:Arial,sans-serif;color:#fff;letter-spacing:1px;">P. TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- TOTALES Y CONDICIONES -->
  <div style="border:1px solid #000;border-top:none;padding:6px 10px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;page-break-inside:avoid;">
    <div style="flex:1;font-size:12px;">
      <div style="font-weight:700;text-align:center;margin-bottom:6px;font-size:11px;letter-spacing:1px;">PRECIOS CON IVA</div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 10px;align-items:baseline;">
        <span style="font-weight:600;white-space:nowrap;">Forma de pago:</span><span style="font-weight:700;">CONTADO</span>
        <span style="font-weight:600;white-space:nowrap;">Plazo de entrega:</span><span style="font-weight:700;">10 DÍAS</span>
        <span style="font-weight:600;white-space:nowrap;">Validez de la oferta:</span><span style="font-weight:700;">10 DÍAS</span>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:140px;">
      <div style="display:flex;justify-content:space-between;width:100%;font-size:13px;font-weight:700;">
        <span>TOTAL</span><span>$ ${fmt(data.total)}</span>
      </div>
    </div>
  </div>

  ${data.observations ? `<div style="border:1px solid #000;border-top:none;padding:5px 8px;font-size:10px;color:#222;font-style:italic;line-height:1.5;">Observaciones: ${data.observations}</div>` : ''}

  <div style="margin-top:6px;font-size:9px;color:#555;text-align:center;">
    * El plazo de entrega es estimativo. Podría verse afectado por razones ajenas a la Empresa.
  </div>
</div>
</body></html>`;
}

export function printPresupuesto(data: PresupuestoData): void {
    const html = generatePresupuestoHtml(data);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => {
        win.focus();
        win.print();
    };
}
