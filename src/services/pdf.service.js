// Servicio de generacion de PDFs para albaranes
// Usa pdfkit para crear el documento en memoria y devolverlo como Buffer
// El PDF incluye datos de la compañia, cliente, proyecto y detalle del albaran

import PDFDocument from 'pdfkit';

// Genera el PDF de un albaran y lo devuelve como Buffer
export const generateDeliveryNotePDF = (albaran) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    // Recopilamos los chunks del stream en memoria
    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Cabecera
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('ALBARAN', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Fecha: ${new Date(albaran.workDate).toLocaleDateString('es-ES')}`, { align: 'right' })
      .text(`Tipo: ${albaran.format === 'material' ? 'Materiales' : 'Horas'}`, { align: 'right' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Datos de la compañia
    if (albaran.company) {
      doc.fontSize(12).font('Helvetica-Bold').text('EMPRESA EMISORA');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${albaran.company.name || '-'}`);
      doc.text(`CIF: ${albaran.company.cif || '-'}`);
      if (albaran.company.address) {
        const a = albaran.company.address;
        doc.text(`Direccion: ${a.street || ''} ${a.number || ''}, ${a.postal || ''} ${a.city || ''}`);
      }
      doc.moveDown();
    }

    // Datos del cliente
    if (albaran.client) {
      doc.fontSize(12).font('Helvetica-Bold').text('CLIENTE');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${albaran.client.name || '-'}`);
      doc.text(`CIF: ${albaran.client.cif || '-'}`);
      doc.text(`Email: ${albaran.client.email || '-'}`);
      if (albaran.client.address) {
        const a = albaran.client.address;
        doc.text(`Direccion: ${a.street || ''} ${a.number || ''}, ${a.postal || ''} ${a.city || ''}`);
      }
      doc.moveDown();
    }

    // Datos del proyecto
    if (albaran.project) {
      doc.fontSize(12).font('Helvetica-Bold').text('PROYECTO');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${albaran.project.name || '-'}`);
      doc.text(`Codigo: ${albaran.project.projectCode || '-'}`);
      if (albaran.project.notes) {
        doc.text(`Notas: ${albaran.project.notes}`);
      }
      doc.moveDown();
    }

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Detalle del albaran
    doc.fontSize(12).font('Helvetica-Bold').text('DETALLE');
    doc.fontSize(10).font('Helvetica');

    if (albaran.description) {
      doc.text(`Descripcion: ${albaran.description}`);
      doc.moveDown(0.5);
    }

    if (albaran.format === 'material') {
      // Albaran de materiales
      doc.font('Helvetica-Bold').text('Material:', { continued: true });
      doc.font('Helvetica').text(` ${albaran.material || '-'}`);
      doc.font('Helvetica-Bold').text('Cantidad:', { continued: true });
      doc.font('Helvetica').text(` ${albaran.quantity || 0} ${albaran.unit || ''}`);
    } else {
      // Albaran de horas
      if (albaran.hours) {
        doc.font('Helvetica-Bold').text('Horas totales:', { continued: true });
        doc.font('Helvetica').text(` ${albaran.hours}h`);
      }

      // Tabla de trabajadores si los hay
      if (albaran.workers && albaran.workers.length > 0) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Trabajadores:');
        doc.font('Helvetica');
        albaran.workers.forEach(w => {
          doc.text(`  - ${w.name}: ${w.hours}h`);
        });
      }
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Firma
    if (albaran.signed) {
      doc.fontSize(12).font('Helvetica-Bold').text('FIRMA');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Firmado el: ${new Date(albaran.signedAt).toLocaleDateString('es-ES')}`);

      // Si hay imagen de firma la incluimos en el PDF
      if (albaran.signatureUrl) {
        doc.moveDown(0.5);
        try {
          doc.image(albaran.signatureUrl, { width: 200 });
        } catch {
          doc.text('(Firma digital adjunta)');
        }
      }
    } else {
      doc.fontSize(12).font('Helvetica-Bold').text('FIRMA');
      doc.moveDown(3);
      doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
      doc.fontSize(10).font('Helvetica').text('Firma del cliente', 50);
    }

    // Pie de pagina
    doc.fontSize(8).font('Helvetica')
      .text(
        `Generado el ${new Date().toLocaleString('es-ES')}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

    doc.end();
  });
};