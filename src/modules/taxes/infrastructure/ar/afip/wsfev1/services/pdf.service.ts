import fs from 'fs';
import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

const fonts = {
  Roboto: {
    normal: 'node_modules/pdfmake/build/vfs_fonts.js',
    bold: 'node_modules/pdfmake/build/vfs_fonts.js',
    italics: 'node_modules/pdfmake/build/vfs_fonts.js',
    bolditalics: 'node_modules/pdfmake/build/vfs_fonts.js',
  },
};

const printer = new PdfPrinter(fonts);

export function buildFacturaB(docData?: {
  tipoCbte: number;
  puntoVenta: number;
  numeroComprobante: number;
  fechaEmision: string; // formato: 'DD/MM/YYYY'
  cae: string;
  caeVto: string; // formato: 'DD/MM/YYYY'
  cliente: {
    tipoDoc: string;
    nroDoc: string;
    concepto: string;
  };
  montos: {
    total: string;
    neto: string;
    iva: string;
  };
}): TDocumentDefinitions {
  return {
    pageSize: { width: 300, height: 'auto' },
    pageMargins: [16, 16, 16, 16],
    content: [
      {
        text: [
          `FACTURA B - TIPO "${docData.tipoCbte}"\n`,
          `PUNTO DE VENTA: ${docData.puntoVenta.toString().padStart(4, '0')}\n`,
          `COMP. N°: ${docData.numeroComprobante.toString().padStart(8, '0')}`,
        ],
        alignment: 'center',
        bold: true,
        margin: [0, 0, 0, 12],
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 268, y2: 0, lineWidth: 1, dash: { length: 2 } }],
        margin: [0, 8, 0, 4],
      },
      {
        text: [
          'CUIT Emisor: 20-41511833-4\n',
          `Fecha de Emisión: ${docData.fechaEmision}\n`,
          `CAE: ${docData.cae}\n`,
          `Vto. CAE: ${docData.caeVto}`,
        ],
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 268, y2: 0, lineWidth: 1, dash: { length: 2 } }],
        margin: [0, 8, 0, 4],
      },
      {
        text: [
          { text: 'Cliente:\n', bold: true },
          `Tipo Doc.: ${docData.cliente.tipoDoc}\n`,
          `Nro. Doc.: ${docData.cliente.nroDoc}\n`,
          `Concepto: ${docData.cliente.concepto}`,
        ],
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 268, y2: 0, lineWidth: 1, dash: { length: 2 } }],
        margin: [0, 8, 0, 4],
      },
      {
        table: {
          widths: ['*', '*'],
          body: [
            ['IMPORTE TOTAL:', `$ ${docData.montos.total}`],
            ['Neto Gravado:', `$ ${docData.montos.neto}`],
            ['IVA 21%:', `$ ${docData.montos.iva}`],
          ],
        },
        layout: 'noBorders',
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 268, y2: 0, lineWidth: 1, dash: { length: 2 } }],
        margin: [0, 8, 0, 4],
      },
      {
        text: 'Gracias por su compra',
        alignment: 'center',
        margin: [0, 12, 0, 0],
      },
    ],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
    },
  };
}

const pdfDoc = printer.createPdfKitDocument(buildFacturaB());
pdfDoc.pipe(fs.createWriteStream('factura.pdf'));
pdfDoc.end();
app.get('/factura', (req, res) => {
  const docDefinition: TDocumentDefinitions = buildFacturaB({
    tipoCbte: 6,
    puntoVenta: 2,
    numeroComprobante: 1,
    fechaEmision: '14/07/2025',
    cae: '75284262888927',
    caeVto: '24/07/2025',
    cliente: {
      tipoDoc: 'DNI (96)',
      nroDoc: '35.127.979',
      concepto: 'Servicios (2)',
    },
    montos: {
      total: '15.000,00',
      neto: '12.396,69',
      iva: '2.603,31',
    },
  });

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="factura.pdf"');

  pdfDoc.pipe(res);
  pdfDoc.end();
});
