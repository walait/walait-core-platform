import PdfPrinter from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

const fonts = {
	Roboto: {
		normal: "node_modules/pdfmake/build/vfs_fonts.js",
		bold: "node_modules/pdfmake/build/vfs_fonts.js",
		italics: "node_modules/pdfmake/build/vfs_fonts.js",
		bolditalics: "node_modules/pdfmake/build/vfs_fonts.js",
	},
};

const printer = new PdfPrinter(fonts);

export function buildFacturaB(docData: {
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
		pageSize: { width: 300, height: "auto" },
		pageMargins: [16, 16, 16, 16],
		content: [
			{
				text: [
					`FACTURA B - TIPO "${docData.tipoCbte}"\n`,
					`PUNTO DE VENTA: ${docData.puntoVenta.toString().padStart(4, "0")}\n`,
					`COMP. N°: ${docData.numeroComprobante.toString().padStart(8, "0")}`,
				],
				alignment: "center",
				bold: true,
				margin: [0, 0, 0, 12],
			},
			{
				canvas: [
					{
						type: "line",
						x1: 0,
						y1: 0,
						x2: 268,
						y2: 0,
						lineWidth: 1,
						dash: { length: 2 },
					},
				],
				margin: [0, 8, 0, 4],
			},
			{
				text: [
					"CUIT Emisor: 20-41511833-4\n",
					`Fecha de Emisión: ${docData.fechaEmision}\n`,
					`CAE: ${docData.cae}\n`,
					`Vto. CAE: ${docData.caeVto}`,
				],
			},
			{
				canvas: [
					{
						type: "line",
						x1: 0,
						y1: 0,
						x2: 268,
						y2: 0,
						lineWidth: 1,
						dash: { length: 2 },
					},
				],
				margin: [0, 8, 0, 4],
			},
			{
				text: [
					{ text: "Cliente:\n", bold: true },
					`Tipo Doc.: ${docData.cliente.tipoDoc}\n`,
					`Nro. Doc.: ${docData.cliente.nroDoc}\n`,
					`Concepto: ${docData.cliente.concepto}`,
				],
			},
			{
				canvas: [
					{
						type: "line",
						x1: 0,
						y1: 0,
						x2: 268,
						y2: 0,
						lineWidth: 1,
						dash: { length: 2 },
					},
				],
				margin: [0, 8, 0, 4],
			},
			{
				table: {
					widths: ["*", "*"],
					body: [
						["IMPORTE TOTAL:", `$ ${docData.montos.total}`],
						["Neto Gravado:", `$ ${docData.montos.neto}`],
						["IVA 21%:", `$ ${docData.montos.iva}`],
					],
				},
				layout: "noBorders",
			},
			{
				canvas: [
					{
						type: "line",
						x1: 0,
						y1: 0,
						x2: 268,
						y2: 0,
						lineWidth: 1,
						dash: { length: 2 },
					},
				],
				margin: [0, 8, 0, 4],
			},
			{
				text: "Gracias por su compra",
				alignment: "center",
				margin: [0, 12, 0, 0],
			},
		],
		defaultStyle: {
			font: "Roboto",
			fontSize: 9,
		},
	};
}
