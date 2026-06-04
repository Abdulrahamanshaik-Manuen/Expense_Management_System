import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } from 'docx';
import PDFDocument from 'pdfkit';
import { getStreamAsBuffer } from 'get-stream';
import CompanySetting from '../models/CompanySetting.js';
import path from 'path';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Indian Currency Number-to-Words */
function priceToWords(price, currency = 'INR') {
  const unitName = 'Rupees';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ',
    'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ',
    'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let num = Math.floor(price);
  if (num === 0) return `Zero ${unitName} only`;

  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + unitName + ' ' : unitName + ' ';
  return str.trim() + ' only';
}

/** Draw vector logo when no image uploaded */
function drawVectorLogo(doc, x, y, companyName) {
  doc.fillColor('#002e6e').rect(x, y, 32, 32).fill();
  doc.fillColor('#2fa64f').circle(x + 16, y + 10, 4).fill();
  doc.moveTo(x + 8, y + 26).lineTo(x + 16, y + 16).lineTo(x + 24, y + 26).fillColor('#ffffff').fill();
  doc.rect(x + 14, y + 20, 4, 8).fillColor('#2fa64f').fill();
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#002e6e').text(companyName, x + 40, y + 2);
  doc.moveTo(x + 40, y + 18).lineTo(x + 200, y + 18).strokeColor('#002e6e').lineWidth(1).stroke();
  doc.moveTo(x + 40, y + 20).lineTo(x + 200, y + 20).strokeColor('#2fa64f').lineWidth(1).stroke();
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#2fa64f').text('I N F O T E C H', x + 65, y + 23);
}

/** Get logo source (Buffer for Base64 Data URL, Path for legacy files, or null) */
function getLogoSource(logoUrl) {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('data:')) {
    try {
      const parts = logoUrl.split(';base64,');
      if (parts.length === 2) {
        return Buffer.from(parts[1], 'base64');
      }
    } catch (e) {
      console.error('Error decoding base64 logo:', e);
    }
    return null;
  }
  const resolvedPath = path.resolve(logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl);
  if (fs.existsSync(resolvedPath)) {
    return resolvedPath;
  }
  return null;
}

/** Fetch settings from DB, create defaults if none exist */
async function getSettings(companyId = null) {
  let settings;
  if (companyId) {
    try {
      settings = await CompanySetting.findById(companyId);
    } catch (err) {
      console.error('Error finding company settings by ID:', err);
    }
  }
  if (!settings) {
    settings = await CompanySetting.findOne();
  }
  if (!settings) {
    settings = await CompanySetting.create({});
  }
  return settings;
}

// ─────────────────────────────────────────────────────────────
// 1. SALE / MANAGER INVOICE  ─ returns Buffer (for HTTP download)
// ─────────────────────────────────────────────────────────────

/**
 * Generate an invoice Buffer (PDF or DOCX) for the download endpoint.
 * @param {Object} invoice – normalised invoice plain object
 * @param {'pdf'|'docx'} format
 * @returns {Promise<Buffer>}
 */
export async function generateInvoiceBuffer(invoice, format) {
  const settings = await getSettings(invoice.companyId);
  const formattedDate = new Date(invoice.date || invoice.invoiceDate || Date.now()).toLocaleDateString('en-GB');

  const totalAmountVal = Number(invoice.totalAmount) || 0;
  const taxAmountVal = Number(invoice.taxAmount) || (totalAmountVal * 18 / 118);
  const cgstVal = taxAmountVal / 2;
  const sgstVal = taxAmountVal / 2;
  const baseAmountVal = totalAmountVal - taxAmountVal;
  const totalQuantity = (invoice.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  // ── DOCX ──────────────────────────────────────────────────
  if (format === 'docx') {
    const isPO = invoice.titleText === 'PURCHASE ORDER' || invoice.titleText === 'PURCHASE VOUCHER';
    const clientName = (invoice.customerName || invoice.client || 'N/A').toUpperCase();

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: settings.companyName, bold: true, size: 28, color: '002e6e' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Smart Solutions, Better Business', italic: true, size: 16, color: '2fa64f' })],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: invoice.titleText || (isPO ? 'PURCHASE ORDER' : 'INVOICE'), bold: true, size: 40, color: '00b4d8' })],
          }),
          new Paragraph({ text: '' }),

          // FROM / BILL TO
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: isPO ? 'VENDOR / SUPPLIER ' : 'FROM', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: isPO ? 'DELIVER TO (CORPORATE BILLING)' : 'BILL TO', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: isPO ? [
                      new Paragraph({ children: [new TextRun({ text: clientName, bold: true })] }),
                      new Paragraph({ text: invoice.customerAddress || 'N/A' }),
                      new Paragraph({ text: `Phone: ${invoice.customerPhone || 'N/A'}` }),
                      new Paragraph({ text: `GST No: ${invoice.customerGst || 'N/A'}` }),
                    ] : [
                      new Paragraph({ children: [new TextRun({ text: settings.companyName, bold: true })] }),
                      new Paragraph({ text: settings.address }),
                      new Paragraph({ text: `Mobile: ${settings.mobile}` }),
                      new Paragraph({ text: `GST No: ${settings.gstNumber}` }),
                    ]
                  }),
                  new TableCell({
                    children: isPO ? [
                      new Paragraph({ children: [new TextRun({ text: settings.companyName.toUpperCase(), bold: true })] }),
                      new Paragraph({ text: settings.address }),
                      new Paragraph({ text: `Mobile: ${settings.mobile}` }),
                      new Paragraph({ text: `GST No: ${settings.gstNumber}` }),
                    ] : [
                      new Paragraph({ children: [new TextRun({ text: clientName, bold: true })] }),
                      new Paragraph({ text: invoice.customerAddress || 'N/A' }),
                      new Paragraph({ text: `GST NO: ${invoice.customerGst || 'N/A'}` }),
                      new Paragraph({ text: `Phone: ${invoice.customerPhone || 'N/A'}` }),
                    ]
                  }),
                ]
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Items table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: isPO ? [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'S NO', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Description Specs', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Qty', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Unit Price', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'GST Rate', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Cost', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                ] : [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'S NO', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Description of Services', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'HSN Code', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Quantity', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                ]
              }),
              ...(invoice.items || []).map((item, idx) => {
                const itemTotal = Number(item.total) || ((item.quantity || 1) * (item.unitPrice || item.price || 0));
                return new TableRow({
                  children: isPO ? [
                    new TableCell({ children: [new Paragraph(String(idx + 1))] }),
                    new TableCell({ children: [new Paragraph(item.description || item.name || 'Item')] }),
                    new TableCell({ children: [new Paragraph(String(item.quantity || 1))] }),
                    new TableCell({ children: [new Paragraph(`${Number(item.unitPrice || 0).toLocaleString()}/-`)] }),
                    new TableCell({ children: [new Paragraph(`${item.taxRate || 18}%`)] }),
                    new TableCell({ children: [new Paragraph(`${Number(itemTotal).toLocaleString()}/-`)] }),
                  ] : [
                    new TableCell({ children: [new Paragraph(String(idx + 1))] }),
                    new TableCell({ children: [new Paragraph(item.description || item.name || 'Item')] }),
                    new TableCell({ children: [new Paragraph(settings.defaultHsnCode)] }),
                    new TableCell({ children: [new Paragraph(`${item.quantity} Months`)] }),
                    new TableCell({ children: [new Paragraph(`${Number(itemTotal).toLocaleString()}/-`)] }),
                  ]
                });
              }),
              ...(isPO ? [
                // PO Subtotal row
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Subtotal:', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${Number(totalAmountVal - taxAmountVal).toLocaleString()}/-`, bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  ]
                }),
                // PO Tax (GST Amt) row
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tax (GST Amt):', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${Number(taxAmountVal).toLocaleString()}/-`, bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  ]
                }),
                // PO Grand Total row
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Grand Total Cost:', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalAmountVal.toLocaleString()}/-`, bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  ]
                }),
              ] : [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('CGST (9%)')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph(`${cgstVal.toLocaleString()}/-`)] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('SGST (9%)')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph('')] }),
                    new TableCell({ children: [new Paragraph(`${sgstVal.toLocaleString()}/-`)] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total:', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph('')], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalQuantity} Months`, bold: true })] })], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalAmountVal.toLocaleString()}/-`, bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  ]
                }),
              ]),
            ],
          }),
          new Paragraph({ text: '' }),

          // GST Summary if not PO
          ...(!isPO ? [
            new Paragraph({ children: [new TextRun({ text: 'GST Tax Summary', bold: true, size: 20 })] }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'HSN', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CGST (9%)', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SGST (9%)', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Tax Amount', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(settings.defaultHsnCode)] }),
                    new TableCell({ children: [new Paragraph(`${baseAmountVal.toLocaleString()}/-`)] }),
                    new TableCell({ children: [new Paragraph(`${cgstVal.toLocaleString()}/-`)] }),
                    new TableCell({ children: [new Paragraph(`${sgstVal.toLocaleString()}/-`)] }),
                    new TableCell({ children: [new Paragraph(`${taxAmountVal.toLocaleString()}/-`)] }),
                  ]
                }),
              ],
            }),
            new Paragraph({ text: '' }),
          ] : []),

          new Paragraph({ children: [new TextRun({ text: `${isPO ? 'Amount in Words (Rupee Speller):' : 'Total Amount (in words):'} ${priceToWords(totalAmountVal, settings.currency)}`, bold: true })] }),
          new Paragraph({ text: '' }),

          new Paragraph({ children: [new TextRun({ text: isPO ? "Payment Bank Details" : "Company's Bank Details", bold: true })] }),
          ...(isPO && invoice.supplierBankName ? [
            new Paragraph({ text: `A/c Holder's Name : ${invoice.supplierAccountHolderName || clientName}` }),
            new Paragraph({ text: `Bank Name : ${invoice.supplierBankName}` }),
            new Paragraph({ text: `Account No : ${invoice.supplierAccountNumber}` }),
            new Paragraph({ text: `Branch & IFS Code : ${invoice.supplierIfscCode}` }),
          ] : [
            new Paragraph({ text: `A/c Holder's Name : ${settings.accountHolderName}` }),
            new Paragraph({ text: `Bank Name : ${settings.bankName}` }),
            new Paragraph({ text: `Account No : ${settings.accountNumber}` }),
            new Paragraph({ text: `Branch & IFS Code : ${settings.ifscCode}` }),
          ]),
          new Paragraph({ text: '' }),

          ...(!isPO ? [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Note', bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: 'E8E5D3' } })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: settings.noteText, italic: true })], alignment: AlignmentType.CENTER })] })] }),
              ],
            })
          ] : []),

          ...(isPO ? [
            new Paragraph({ text: '' }),
            new Paragraph({ text: '' }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: 'Corporate Authorizations', bold: true, size: 18, color: '555555' }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: 'Authorized Signatory: Chief Procurement Officer', size: 16, color: '333333' }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: '___________________________________', color: '94a3b8' }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: settings.companyName.toUpperCase(), bold: true, size: 17, color: '000000' }),
              ],
            }),
          ] : []),
        ],
      }],
    });
    return await Packer.toBuffer(doc);
  }

  // ── PDF ───────────────────────────────────────────────────
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const bufferPromise = getStreamAsBuffer(doc);
  _drawInvoicePDF(doc, invoice, settings, formattedDate,
    totalAmountVal, taxAmountVal, cgstVal, sgstVal, baseAmountVal, totalQuantity,
    invoice.titleText || 'INVOICE');
  doc.end();
  return await bufferPromise;
}



// ─────────────────────────────────────────────────────────────
// PRIVATE – Shared PDF drawing routine (all document types)
// ─────────────────────────────────────────────────────────────
function _drawInvoicePDF(
  doc, invoice, settings, formattedDate,
  totalAmountVal, taxAmountVal, cgstVal, sgstVal, baseAmountVal, totalQuantity,
  titleText = 'INVOICE'
) {
  const headerY = 40;

  // ── Logo ──────────────────────────────────────────────────
  const squareLogoSrc = getLogoSource(settings.logoSquareUrl);
  const nameLogoSrc = getLogoSource(settings.logoUrl);

  if (squareLogoSrc && nameLogoSrc) {
    // Both uploaded: Draw square logo on left (80x80), and name logo next to it (240x80)
    doc.image(squareLogoSrc, 40, headerY, { width: 80, height: 80 });
    doc.image(nameLogoSrc, 128, headerY, { width: 240, height: 80 });
  } else if (squareLogoSrc) {
    // Only Square Logo: Draw square logo (80x80) and text company name next to it
    doc.image(squareLogoSrc, 40, headerY, { width: 80, height: 80 });
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#002e6e').text(settings.companyName, 130, headerY + 30);
  } else if (nameLogoSrc) {
    // Only Name Logo: Draw name logo (310x80)
    doc.image(nameLogoSrc, 40, headerY, { width: 310, height: 80 });
  } else {
    // None: Vector fallback
    drawVectorLogo(doc, 40, headerY, settings.companyName);
  }

  const isPO = titleText === 'PURCHASE ORDER' || titleText === 'PURCHASE VOUCHER';

  // ── Date / Doc-number Info (No Box) ───────────────────────
  const boxW = 148; const boxX = 555 - boxW;
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Date : ${formattedDate}`, boxX, headerY + 5, { align: 'right', width: boxW });
  doc.text(`${isPO ? 'PO' : 'Invoice'} No : ${invoice.invoiceNumber || 'N/A'}`, boxX, headerY + 20, { align: 'right', width: boxW });

  // ── Title ─────────────────────────────────────────────────
  doc.fontSize(25).font('Helvetica-Bold').fillColor('#00b4d8').text(titleText, 40, 130, { align: 'center' });

  // ── FROM & BILL TO ────────────────────────────────────────
  const billingY = 170; const colH = 92;
  const clientName = (invoice.customerName || invoice.client || 'N/A').toUpperCase();

  doc.lineWidth(1).strokeColor('#cccccc');

  // Left Box (FROM or VENDOR)
  doc.rect(40, billingY, 240, colH).stroke();
  doc.fillColor('#e8e5d3').rect(41, billingY + 1, 238, 16).fill();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
  doc.text(isPO ? 'VENDOR / SUPPLIER' : 'FROM', 50, billingY + 4);

  if (isPO) {
    // Left is Vendor Info
    doc.fontSize(8).font('Helvetica-Bold').text(clientName, 50, billingY + 23);
    doc.font('Helvetica').fillColor('#333333').text(invoice.customerAddress || 'N/A', 50, billingY + 35, { width: 222 });
    doc.text(`Phone No : ${invoice.customerPhone || 'N/A'}`, 50, billingY + 64);
    doc.text(`GST No : ${invoice.customerGst || 'N/A'}`, 50, billingY + 75);
  } else {
    // Left is Company Info
    doc.fontSize(8).font('Helvetica-Bold').text(settings.companyName.toUpperCase(), 50, billingY + 23);
    doc.font('Helvetica').fillColor('#333333').text(settings.address, 50, billingY + 35, { width: 222 });
    doc.text(`Mobile No : ${settings.mobile}`, 50, billingY + 64);
    doc.text(`GST No : ${settings.gstNumber}`, 50, billingY + 75);
  }

  // Right Box (BILL TO or DELIVER TO)
  doc.rect(294, billingY, 261, colH).stroke();
  doc.fillColor('#e8e5d3').rect(295, billingY + 1, 259, 16).fill();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
  doc.text(isPO ? 'DELIVER TO (CORPORATE BILLING)' : 'BILL TO', 304, billingY + 4);

  if (isPO) {
    // Right is Company Info
    doc.fontSize(8).font('Helvetica-Bold').text(settings.companyName.toUpperCase(), 304, billingY + 23);
    doc.font('Helvetica').fillColor('#333333').text(settings.address, 304, billingY + 35, { width: 245 });
    doc.text(`Mobile No : ${settings.mobile}`, 304, billingY + 64);
    doc.text(`GST No : ${settings.gstNumber}`, 304, billingY + 75);
  } else {
    // Right is Client Info
    doc.fontSize(8).font('Helvetica-Bold').text(clientName, 304, billingY + 23);
    doc.font('Helvetica').fillColor('#333333').text(invoice.customerAddress || 'N/A', 304, billingY + 35, { width: 245 });
    doc.text(`GST NO : ${invoice.customerGst || 'N/A'}`, 304, billingY + 52);
    doc.text(`Phone No : ${invoice.customerPhone || 'N/A'}`, 304, billingY + 63);
    doc.text(`Mobile No : ${invoice.customerPhone || 'N/A'}`, 304, billingY + 74);
  }

  // ── Main items table ──────────────────────────────────────
  const tableY = billingY + colH + 14;
  const colX = isPO ? [40, 75, 290, 350, 410, 475, 555] : [40, 75, 320, 395, 470, 555];
  const colW = isPO ? [35, 215, 60, 60, 65, 80] : [35, 245, 75, 75, 85];
  const hdrLabels = isPO
    ? ['S NO', 'Description Specs', 'Qty', 'Unit Price', 'GST Rate', 'Total Cost']
    : ['S NO', 'Description of Services', 'HSN Code', 'Quantity', 'Amount'];

  doc.fillColor('#e8e5d3').rect(40, tableY, 515, 20).fill();
  doc.lineWidth(1).strokeColor('#000000').rect(40, tableY, 515, 20).stroke();
  for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], tableY).lineTo(colX[i], tableY + 20).stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
  hdrLabels.forEach((h, idx) => {
    const align = (idx === 0 || idx >= 2) ? 'center' : 'left';
    doc.text(h, colX[idx] + (align === 'left' ? 7 : 0), tableY + 6, { width: colW[idx], align });
  });

  let rowY = tableY + 20;
  const rowH = 26;
  (invoice.items || []).forEach((item, idx) => {
    const itemTotal = Number(item.total) || ((item.quantity || 1) * (item.unitPrice || item.price || 0));
    doc.rect(40, rowY, 515, rowH).stroke();
    for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
    doc.fontSize(8.5).font('Helvetica').fillColor('#000000');
    doc.text(String(idx + 1), colX[0], rowY + 9, { width: colW[0], align: 'center' });
    doc.text(item.description || item.name || 'Item', colX[1] + 7, rowY + 9, { width: colW[1] - 14 });
    if (isPO) {
      const taxRate = item.taxRate !== undefined ? item.taxRate : 18;
      doc.text(String(item.quantity || 1), colX[2], rowY + 9, { width: colW[2], align: 'center' });
      doc.text(`${Number(item.unitPrice || item.price || 0).toLocaleString()}/-`, colX[3], rowY + 9, { width: colW[3] - 4, align: 'right' });
      doc.text(`${taxRate}%`, colX[4], rowY + 9, { width: colW[4], align: 'center' });
      doc.text(`${Number(itemTotal).toLocaleString()}/-`, colX[5], rowY + 9, { width: colW[5] - 8, align: 'right' });
    } else {
      doc.text(settings.defaultHsnCode, colX[2], rowY + 9, { width: colW[2], align: 'center' });
      doc.text(`${item.quantity} Months`, colX[3], rowY + 9, { width: colW[3], align: 'center' });
      doc.text(`${Number(itemTotal).toLocaleString()}/-`, colX[4], rowY + 9, { width: colW[4] - 8, align: 'right' });
    }
    rowY += rowH;
  });

  if (isPO) {
    // Subtotal row
    doc.rect(40, rowY, 515, rowH).stroke();
    for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
    doc.font('Helvetica-Bold').text('Subtotal:', colX[1] + 7, rowY + 9);
    doc.text(`${Number(totalAmountVal - taxAmountVal).toLocaleString()}/-`, colX[5], rowY + 9, { width: colW[5] - 8, align: 'right' });
    rowY += rowH;

    // Tax (GST Amt) row
    doc.rect(40, rowY, 515, rowH).stroke();
    for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
    doc.font('Helvetica-Bold').text('Tax (GST Amt):', colX[1] + 7, rowY + 9);
    doc.text(`${Number(taxAmountVal).toLocaleString()}/-`, colX[5], rowY + 9, { width: colW[5] - 8, align: 'right' });
    rowY += rowH;

    // Grand Total Cost row
    doc.fillColor('#e8e5d3').rect(40, rowY, 515, rowH).fill();
    doc.rect(40, rowY, 515, rowH).stroke();
    for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
    doc.font('Helvetica-Bold').fillColor('#000000');
    doc.text('Grand Total Cost:', colX[1] + 7, rowY + 9);
    doc.text(`${Number(totalAmountVal).toLocaleString()}/-`, colX[5], rowY + 9, { width: colW[5] - 8, align: 'right' });
    rowY += rowH;
  } else {
    // CGST row
    doc.rect(40, rowY, 515, rowH).stroke();
    for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
    doc.font('Helvetica-Bold').text('CGST (9%)', colX[1] + 7, rowY + 9);
    doc.text(`${cgstVal.toLocaleString()}/-`, colX[4], rowY + 9, { width: colW[4] - 8, align: 'right' });
    rowY += rowH;

    // SGST row
    doc.rect(40, rowY, 515, rowH).stroke();
    for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
    doc.font('Helvetica-Bold').text('SGST (9%)', colX[1] + 7, rowY + 9);
    doc.text(`${sgstVal.toLocaleString()}/-`, colX[4], rowY + 9, { width: colW[4] - 8, align: 'right' });
    rowY += rowH;

    // Total row
    doc.fillColor('#e8e5d3').rect(40, rowY, 515, rowH).fill();
    doc.rect(40, rowY, 515, rowH).stroke();
    for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
    doc.font('Helvetica-Bold').fillColor('#000000');
    doc.text('Total:', colX[0] + 5, rowY + 9);
    doc.text(`${totalQuantity} Months`, colX[3], rowY + 9, { width: colW[3], align: 'center' });
    doc.text(`${totalAmountVal.toLocaleString()}/-`, colX[4], rowY + 9, { width: colW[4] - 8, align: 'right' });
    rowY += rowH;

    // Conditionally render Amount Paid and Amount Due rows if amountPaid > 0
    if (invoice.amountPaid > 0) {
      // Amount Paid row
      doc.rect(40, rowY, 515, rowH).stroke();
      for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
      doc.font('Helvetica-Bold').fillColor('#16a34a'); // green
      doc.text('Amount Paid:', colX[0] + 5, rowY + 9);
      doc.text(`-${Number(invoice.amountPaid).toLocaleString()}/-`, colX[4], rowY + 9, { width: colW[4] - 8, align: 'right' });
      rowY += rowH;

      // Amount Due row
      doc.fillColor('#e8e5d3').rect(40, rowY, 515, rowH).fill();
      doc.rect(40, rowY, 515, rowH).stroke();
      for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
      doc.font('Helvetica-Bold').fillColor('#dc2626'); // red
      doc.text('Amount Due:', colX[0] + 5, rowY + 9);
      doc.text(`${Number(invoice.amountDue || (totalAmountVal - invoice.amountPaid)).toLocaleString()}/-`, colX[4], rowY + 9, { width: colW[4] - 8, align: 'right' });
      rowY += rowH;
    }
  }

  // ── GST summary table ─────────────────────────────────────
  if (!isPO) {
    rowY += 14;
    const gstX = [40, 110, 200, 310, 422, 555];
    const gstW = [70, 90, 110, 112, 133];
    const gstHdrs = ['HSN', 'Amount', 'CGST (9%)', 'SGST (9%)', 'Total Tax Amount'];

    doc.fillColor('#e8e5d3').rect(40, rowY, 515, 18).fill();
    doc.strokeColor('#000000').rect(40, rowY, 515, 18).stroke();
    for (let i = 1; i < gstX.length - 1; i++) doc.moveTo(gstX[i], rowY).lineTo(gstX[i], rowY + 18).stroke();
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
    gstHdrs.forEach((h, idx) => doc.text(h, gstX[idx], rowY + 5, { width: gstW[idx], align: idx === 0 ? 'center' : 'right' }));

    rowY += 18;
    doc.rect(40, rowY, 515, 18).stroke();
    for (let i = 1; i < gstX.length - 1; i++) doc.moveTo(gstX[i], rowY).lineTo(gstX[i], rowY + 18).stroke();
    doc.font('Helvetica').fontSize(8);
    doc.text(settings.defaultHsnCode, gstX[0], rowY + 5, { width: gstW[0], align: 'center' });
    doc.text(`${baseAmountVal.toLocaleString()}/-`, gstX[1], rowY + 5, { width: gstW[1] - 6, align: 'right' });
    doc.text(`${cgstVal.toLocaleString()}/-`, gstX[2], rowY + 5, { width: gstW[2] - 6, align: 'right' });
    doc.text(`${sgstVal.toLocaleString()}/-`, gstX[3], rowY + 5, { width: gstW[3] - 6, align: 'right' });
    doc.text(`${taxAmountVal.toLocaleString()}/-`, gstX[4], rowY + 5, { width: gstW[4] - 6, align: 'right' });

    rowY += 18;
    doc.fillColor('#e8e5d3').rect(40, rowY, 515, 18).fill();
    doc.rect(40, rowY, 515, 18).stroke();
    for (let i = 1; i < gstX.length - 1; i++) doc.moveTo(gstX[i], rowY).lineTo(gstX[i], rowY + 18).stroke();
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000');
    doc.text('Total', gstX[0], rowY + 5, { width: gstW[0], align: 'center' });
    doc.text(`${baseAmountVal.toLocaleString()}/-`, gstX[1], rowY + 5, { width: gstW[1] - 6, align: 'right' });
    doc.text(`${cgstVal.toLocaleString()}/-`, gstX[2], rowY + 5, { width: gstW[2] - 6, align: 'right' });
    doc.text(`${sgstVal.toLocaleString()}/-`, gstX[3], rowY + 5, { width: gstW[3] - 6, align: 'right' });
    doc.text(`${taxAmountVal.toLocaleString()}/-`, gstX[4], rowY + 5, { width: gstW[4] - 6, align: 'right' });
  }

  // ── Amount in words & bank details ───────────────────────
  rowY += 30;

  // LEFT: Payment Bank Details (moved here from right)
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text(isPO ? 'Payment Bank Details' : "Company's Bank Details", 40, rowY);
  doc.fontSize(8).font('Helvetica').fillColor('#333333');
  if (isPO && invoice.supplierBankName) {
    doc.text(`A/c Holder's Name : ${invoice.supplierAccountHolderName || clientName}`, 50, rowY + 13);
    doc.text(`Bank Name : ${invoice.supplierBankName}`, 50, rowY + 24);
    doc.text(`Account No : ${invoice.supplierAccountNumber}`, 50, rowY + 35);
    doc.text(`Branch & IFS Code : ${invoice.supplierIfscCode}`, 50, rowY + 46);
  } else {
    doc.text(`A/c Holder's Name : ${settings.accountHolderName}`, 50, rowY + 13);
    doc.text(`Bank Name : ${settings.bankName}`, 50, rowY + 24);
    doc.text(`Account No : ${settings.accountNumber}`, 50, rowY + 35);
    doc.text(`Branch & IFS Code : ${settings.ifscCode}`, 50, rowY + 46);
  }

  // RIGHT: Amount in Words (moved here from left)
  const rightX = 310;
  doc.fontSize(8.5).font('Helvetica').fillColor('#555555').text(isPO ? 'Amount in Words (Rupee Speller):' : 'Total Amount (in words):', rightX, rowY);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text(priceToWords(totalAmountVal, settings.currency), rightX, rowY + 13, { width: 240 });

  // ── Note block ────────────────────────────────────────────
  if (!isPO) {
    rowY += 72;
    doc.rect(40, rowY, 515, 34).stroke();
    doc.fillColor('#e8e5d3').rect(41, rowY + 1, 513, 14).fill();
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000').text('Note', 40, rowY + 4, { align: 'center', width: 515 });
    doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#000000').text(settings.noteText, 40, rowY + 19, { align: 'center', width: 515 });
  }

  if (isPO) {
    rowY += 65;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text('Corporate Authorizations', rightX, rowY);
    doc.fontSize(8).font('Helvetica').fillColor('#333333').text('Authorized Signatory: Chief Procurement Officer', rightX + 10, rowY + 13);

    rowY += 45;
    doc.moveTo(rightX + 10, rowY).lineTo(rightX + 180, rowY).strokeColor('#94a3b8').lineWidth(0.5).stroke();
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text(settings.companyName.toUpperCase(), rightX + 10, rowY + 5);
  }
}


// ─────────────────────────────────────────────────────────────
// 4. PURCHASE VOUCHER ─ returns Buffer (for HTTP download)
// ─────────────────────────────────────────────────────────────

/**
 * Generate a Purchase Voucher Buffer (PDF) for direct streaming/downloading.
 * @param {Object} purchaseEntry – normalised purchase entry plain object
 * @returns {Promise<Buffer>}
 */
export async function generatePurchaseVoucherBuffer(purchaseEntry) {
  const settings = await getSettings(purchaseEntry.companyId);
  const formattedVoucherDate = new Date(purchaseEntry.purchaseDate || Date.now()).toLocaleDateString('en-GB');
  const formattedDueDate = purchaseEntry.dueDate ? new Date(purchaseEntry.dueDate).toLocaleDateString('en-GB') : 'Immediate / N/A';

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const bufferPromise = getStreamAsBuffer(doc);

  const headerY = 40;
  const squareLogoSrc = getLogoSource(settings.logoSquareUrl);
  const nameLogoSrc = getLogoSource(settings.logoUrl);

  if (squareLogoSrc && nameLogoSrc) {
    doc.image(squareLogoSrc, 40, headerY, { width: 80, height: 80 });
    doc.image(nameLogoSrc, 128, headerY, { width: 240, height: 80 });
  } else if (squareLogoSrc) {
    doc.image(squareLogoSrc, 40, headerY, { width: 80, height: 80 });
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#002e6e').text(settings.companyName, 130, headerY + 30);
  } else if (nameLogoSrc) {
    doc.image(nameLogoSrc, 40, headerY, { width: 310, height: 80 });
  } else {
    drawVectorLogo(doc, 40, headerY, settings.companyName);
  }

  // ── Voucher Info (No Box) ────────────────────────────────
  const boxW = 176; const boxX = 555 - boxW;
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1a202c');
  doc.text(`Received Date : ${formattedVoucherDate}`, boxX, headerY + 5, { align: 'right', width: boxW });
  doc.text(`Supplier Ref: #${purchaseEntry.invoiceNumber || 'N/A'}`, boxX, headerY + 20, { align: 'right', width: boxW });

  // ── Document Title (matches preview) ─────────────────────
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a365d').text('GOODS RECEIVED NOTE (GRN)', 40, 130, { align: 'center' });
  doc.moveTo(40, 153).lineTo(555, 153).strokeColor('#000000').lineWidth(1).stroke();

  // ── Two-column info block ─────────────────────────────────
  const infoY = 170;
  const colMid = 297;

  // Left: Supplier Vendor Details
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text('SUPPLIER VENDOR DETAILS:', 40, infoY);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333').text((purchaseEntry.supplierName || purchaseEntry.vendor?.name || 'N/A').toUpperCase(), 40, infoY + 14);
  if (purchaseEntry.supplierGSTIN) {
    doc.font('Helvetica').fillColor('#333333').text(`GSTIN: ${purchaseEntry.supplierGSTIN}`, 40, infoY + 26);
  }
  doc.font('Helvetica').fillColor('#333333').text(`Email: ${purchaseEntry.supplierEmail || purchaseEntry.vendor?.email || 'N/A'}`, 40, infoY + 38);

  // Right: Delivered To (Receiver)
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text('DELIVERED TO (RECEIVER):', colMid, infoY);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333').text(settings.companyName.toUpperCase(), colMid, infoY + 14);
  doc.font('Helvetica').fillColor('#333333').text(`GSTIN: ${settings.gstNumber || 'N/A'}`, colMid, infoY + 26);
  doc.text(`PO Reference: ${purchaseEntry.poRef?.poNumber || 'Direct Purchase / No PO'}`, colMid, infoY + 38, { width: 250 });

  // ── Items Table (matches preview columns) ────────────────
  // S NO | Description of Goods / Assets | Quantity & Unit | Discount | Total Amount
  const tableY = infoY + 90;
  const colX = [40, 80, 340, 410, 480, 555];
  const colW = [40, 260, 70, 70, 75];
  const tableHdrs = ['S NO', 'Description of Goods / Assets', 'Quantity & Unit', 'Discount', 'Total Amount'];

  doc.fillColor('#e8e5d3').rect(40, tableY, 515, 20).fill();
  doc.lineWidth(1).strokeColor('#000000').rect(40, tableY, 515, 20).stroke();
  for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], tableY).lineTo(colX[i], tableY + 20).stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
  tableHdrs.forEach((hdr, idx) => {
    const align = (idx === 0) ? 'center' : (idx === 1 ? 'left' : 'right');
    doc.text(hdr, colX[idx] + (align === 'left' ? 5 : 0), tableY + 6, { width: colW[idx], align });
  });

  let rowY = tableY + 20;
  const rowH = 28;
  (purchaseEntry.items || []).forEach((item, idx) => {
    doc.rect(40, rowY, 515, rowH).stroke();
    for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
    doc.fontSize(8).fillColor('#1e293b');

    // S.No
    doc.font('Helvetica').text(String(idx + 1), colX[0], rowY + 9, { width: colW[0], align: 'center' });

    // Description + Code (two lines like preview)
    doc.font('Helvetica-Bold').text(item.name || 'Item', colX[1] + 5, rowY + 5, { width: colW[1] - 8 });
    doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text(`Code: ${item.code || 'N/A'}`, colX[1] + 5, rowY + 16, { width: colW[1] - 8 });
    doc.fontSize(8).fillColor('#1e293b');

    // Quantity & Unit
    doc.font('Helvetica').text(`${item.quantity} ${item.unit || 'Pcs'}`, colX[2], rowY + 9, { width: colW[2], align: 'right' });

    // Discount
    doc.text(`${Number(item.discountAmount || 0).toLocaleString()}/-`, colX[3], rowY + 9, { width: colW[3], align: 'right' });

    // Total Amount
    doc.font('Helvetica-Bold').text(`${Number(item.totalItemAmount || (item.quantity * item.price)).toLocaleString()}/-`, colX[4], rowY + 9, { width: colW[4] - 5, align: 'right' });

    rowY += rowH;
  });

  // TOTAL INVOICE VALUE row (matches preview footer row)
  doc.fillColor('#e8e5d3').rect(40, rowY, 515, rowH).fill();
  doc.lineWidth(1).strokeColor('#000000').rect(40, rowY, 515, rowH).stroke();
  for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
  doc.text('TOTAL INVOICE VALUE:', colX[1] + 5, rowY + 9);
  doc.text(
    `${Number(purchaseEntry.grandTotal || purchaseEntry.totalAmount || 0).toLocaleString()}/-`,
    colX[4], rowY + 9, { width: colW[4] - 5, align: 'right' }
  );
  rowY += rowH;

  // ── Payment Summary two-column (matches preview) ──────────
  rowY += 16;
  const summaryBorderY = rowY;

  // Left: Payment Status
  doc.lineWidth(0.5).strokeColor('#cbd5e1').rect(40, summaryBorderY, 250, 60).stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#333333').text('PAYMENT STATUS:', 50, summaryBorderY + 10);
  doc.font('Helvetica-Bold').fillColor(
    purchaseEntry.paymentStatus === 'Paid' ? '#16a34a' : (purchaseEntry.paymentStatus === 'Partial' ? '#d97706' : '#dc2626')
  ).text(purchaseEntry.paymentStatus || 'Unpaid', 150, summaryBorderY + 10);
  doc.fontSize(8).font('Helvetica').fillColor('#555555').text('Due Date:', 50, summaryBorderY + 26);
  doc.font('Helvetica-Bold').fillColor('#000000').text(formattedDueDate, 105, summaryBorderY + 26);

  // Right: Balances Outstanding Breakdown
  doc.lineWidth(0.5).strokeColor('#cbd5e1').rect(305, summaryBorderY, 250, 60).stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#333333').text('BALANCES OUTSTANDING BREAKDOWN:', 315, summaryBorderY + 10);
  doc.fontSize(8).font('Helvetica').fillColor('#555555').text('Amount Paid:', 315, summaryBorderY + 26);
  doc.font('Helvetica-Bold').fillColor('#000000').text(`${Number(purchaseEntry.amountPaid || 0).toLocaleString()}/-`, 395, summaryBorderY + 26);
  doc.font('Helvetica').fillColor('#555555').text('Amount Due (Outstanding Dues):', 315, summaryBorderY + 40);
  doc.font('Helvetica-Bold').fillColor('#dc2626').text(`${Number(purchaseEntry.amountDue || 0).toLocaleString()}/-`, 440, summaryBorderY + 40);

  // ── Amount in Words ───────────────────────────────────────
  rowY = summaryBorderY + 78;
  doc.fontSize(8).font('Helvetica').fillColor('#555555').text('Grand Total (in words):', 40, rowY);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text(
    priceToWords(purchaseEntry.grandTotal || purchaseEntry.totalAmount || 0, settings.currency),
    40, rowY + 12, { width: 515 }
  );

  // ── Signatures (matches preview layout) ─────────────────
  rowY += 60;
  doc.moveTo(40, rowY).lineTo(180, rowY).strokeColor('#94a3b8').lineWidth(0.5).stroke();
  doc.moveTo(375, rowY).lineTo(515, rowY).stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#555555');
  doc.text('Prepared / Received By', 40, rowY + 5, { width: 140, align: 'center' });
  doc.text('Authorized Signatory', 375, rowY + 5, { width: 140, align: 'center' });

  doc.end();
  return await bufferPromise;
}

// ─────────────────────────────────────────────────────────────
// Legacy default export (kept for any direct import compat)
// ─────────────────────────────────────────────────────────────
export default generateInvoiceBuffer;

/**
 * Generate an Expense Voucher Buffer (PDF) for direct streaming/downloading.
 * @param {Object} expense – normalised expense plain object
 * @returns {Promise<Buffer>}
 */
export async function generateExpenseVoucherBuffer(expense) {
  const settings = await getSettings(expense.companyId);
  const formattedDate = new Date(expense.date || Date.now()).toLocaleDateString('en-GB');

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const bufferPromise = getStreamAsBuffer(doc);

  const headerY = 40;
  const squareLogoSrc = getLogoSource(settings.logoSquareUrl);
  const nameLogoSrc = getLogoSource(settings.logoUrl);

  if (squareLogoSrc && nameLogoSrc) {
    doc.image(squareLogoSrc, 40, headerY, { width: 80, height: 80 });
    doc.image(nameLogoSrc, 128, headerY, { width: 240, height: 80 });
  } else if (squareLogoSrc) {
    doc.image(squareLogoSrc, 40, headerY, { width: 80, height: 80 });
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#002e6e').text(settings.companyName, 130, headerY + 30);
  } else if (nameLogoSrc) {
    doc.image(nameLogoSrc, 40, headerY, { width: 310, height: 80 });
  } else {
    drawVectorLogo(doc, 40, headerY, settings.companyName);
  }

  // ── Voucher Info (No Box) ────────────────────────────────
  const boxW = 160; const boxX = 555 - boxW;
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1a202c');
  doc.text(`Date: ${formattedDate}`, boxX, headerY + 5, { align: 'right', width: boxW });
  doc.text(`Voucher No: ${expense.voucherNo || ('EXP-' + expense._id.toString().slice(-6).toUpperCase())}`, boxX, headerY + 20, { align: 'right', width: boxW });

  // ── Title ─────────────────────────────────────────────────
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#002e6e').text('DEBIT PAYMENT VOUCHER', 40, 130, { align: 'center' });

  // ── Info Block ───────────────────────────────────────────
  const infoY = 170;
  const infoH = 80;
  doc.lineWidth(1).strokeColor('#cbd5e1').rect(40, infoY, 515, infoH).stroke();

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#555555');
  doc.text('Paid Out To:', 50, infoY + 10);
  doc.font('Helvetica-Bold').fillColor('#000000').text(expense.paidTo || 'N/A', 150, infoY + 10);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Expense Category:', 50, infoY + 25);
  doc.font('Helvetica').fillColor('#000000').text(expense.category?.name || 'Uncategorized', 150, infoY + 25);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Expense Title:', 50, infoY + 40);
  doc.font('Helvetica').fillColor('#000000').text(expense.title || 'N/A', 150, infoY + 40);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Payment Method:', 310, infoY + 10);
  doc.font('Helvetica').fillColor('#000000').text(expense.paymentMethod || 'N/A', 410, infoY + 10);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Payment Status:', 310, infoY + 25);
  doc.font('Helvetica-Bold').fillColor(expense.paymentStatus === 'Paid' ? '#16a34a' : '#d97706').text(expense.paymentStatus || 'Pending', 410, infoY + 25);

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#555555').text('Custom Notes:', 310, infoY + 40);
  doc.font('Helvetica-Oblique').fillColor('#333333').text(expense.notes || 'No description comments logged.', 410, infoY + 40, { width: 135 });

  // ── Particulars Table ────────────────────────────────────
  const tableY = infoY + infoH + 20;
  const colX = [40, 75, 420, 555];
  const colW = [35, 345, 135];
  const tableHdrs = ['S.No', 'Particulars Description', 'Debit Amount'];

  doc.fillColor('#e8e5d3').rect(40, tableY, 515, 20).fill();
  doc.lineWidth(1).strokeColor('#000000').rect(40, tableY, 515, 20).stroke();
  for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], tableY).lineTo(colX[i], tableY + 20).stroke();

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
  tableHdrs.forEach((hdr, idx) => {
    const align = (idx === 0) ? 'center' : (idx === 1 ? 'left' : 'right');
    doc.text(hdr, colX[idx] + (align === 'left' ? 7 : 0), tableY + 6, { width: colW[idx], align });
  });

  const rowY = tableY + 20;
  const rowH = 26;
  doc.rect(40, rowY, 515, rowH).stroke();
  for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
  doc.fontSize(8.5).font('Helvetica').fillColor('#000000');
  doc.text('1', colX[0], rowY + 7, { width: colW[0], align: 'center' });
  doc.text(`${expense.title} [${expense.category?.name || 'Category'}]`, colX[1] + 7, rowY + 7, { width: colW[1] - 8 });
  doc.font('Helvetica-Bold').text(`${Number(expense.amount).toFixed(2)}`, colX[2] - 8, rowY + 7, { width: colW[2], align: 'right' });

  const totalRowY = rowY + rowH;
  doc.fillColor('#e8e5d3').rect(40, totalRowY, 515, rowH).fill();
  doc.rect(40, totalRowY, 515, rowH).stroke();
  for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], totalRowY).lineTo(colX[i], totalRowY + rowH).stroke();
  doc.font('Helvetica-Bold').fillColor('#000000');
  doc.text('Grand Total Payout:', colX[1] + 7, totalRowY + 9);
  doc.text(`${Number(expense.amount).toFixed(2)}`, colX[2] - 8, totalRowY + 9, { width: colW[2], align: 'right' });

  // ── Amount in words ──────────────────────────────────────
  const wordsY = totalRowY + rowH + 20;
  doc.fontSize(8).font('Helvetica').fillColor('#555555').text('Total Amount (in words):', 40, wordsY);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text(priceToWords(expense.amount, settings.currency), 40, wordsY + 11, { width: 515 });

  // ── Signatures ───────────────────────────────────────────
  const sigY = wordsY + 60;
  doc.moveTo(40, sigY).lineTo(180, sigY).strokeColor('#94a3b8').lineWidth(0.5).stroke();
  doc.moveTo(375, sigY).lineTo(515, sigY).stroke();

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#555555');
  doc.text('Prepared By', 40, sigY + 5, { width: 140, align: 'center' });
  doc.text('Authorized Signatory', 375, sigY + 5, { width: 140, align: 'center' });

  doc.end();
  return await bufferPromise;
}

