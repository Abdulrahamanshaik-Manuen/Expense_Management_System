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
function priceToWords(price) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ',
    'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ',
    'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let num = Math.floor(price);
  if (num === 0) return 'Zero Rupees only';
  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees ' : 'Rupees ';
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
            children: [new TextRun({ text: 'INVOICE', bold: true, size: 40, color: '00b4d8' })],
          }),
          new Paragraph({ text: '' }),

          // FROM / BILL TO
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'FROM', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'BILL TO', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: settings.companyName, bold: true })] }),
                      new Paragraph({ text: settings.address }),
                      new Paragraph({ text: `Mobile: ${settings.mobile}` }),
                      new Paragraph({ text: `GST No: ${settings.gstNumber}` }),
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: (invoice.customerName || invoice.client || 'N/A').toUpperCase(), bold: true })] }),
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
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'S NO', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Description of Services', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'HSN Code', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Quantity', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount', bold: true })] })], shading: { fill: 'E8E5D3' } }),
                ]
              }),
              ...(invoice.items || []).map((item, idx) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(String(idx + 1))] }),
                    new TableCell({ children: [new Paragraph(item.description || item.name || 'Item')] }),
                    new TableCell({ children: [new Paragraph(settings.defaultHsnCode)] }),
                    new TableCell({ children: [new Paragraph(`${item.quantity} Months`)] }),
                    new TableCell({ children: [new Paragraph(`${Number(item.total).toLocaleString()}/-`)] }),
                  ]
                }),
              ),
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
            ],
          }),
          new Paragraph({ text: '' }),

          // GST summary
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
          new Paragraph({ children: [new TextRun({ text: `Total Amount (in words): ${priceToWords(totalAmountVal)}`, bold: true })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: "Company's Bank Details", bold: true })] }),
          new Paragraph({ text: `A/c Holder's Name : ${settings.accountHolderName}` }),
          new Paragraph({ text: `Bank Name : ${settings.bankName}` }),
          new Paragraph({ text: `Account No : ${settings.accountNumber}` }),
          new Paragraph({ text: `Branch & IFS Code : ${settings.ifscCode}` }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Note', bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: 'E8E5D3' } })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: settings.noteText, italic: true })], alignment: AlignmentType.CENTER })] })] }),
            ],
          }),
        ],
      }],
    });
    return await Packer.toBuffer(doc);
  }

  // ── PDF ───────────────────────────────────────────────────
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const bufferPromise = getStreamAsBuffer(doc);
  _drawInvoicePDF(doc, invoice, settings, formattedDate,
    totalAmountVal, taxAmountVal, cgstVal, sgstVal, baseAmountVal, totalQuantity);
  doc.end();
  return await bufferPromise;
}

// ─────────────────────────────────────────────────────────────
// 2. SALE INVOICE ─ saves file to disk, returns URL string
//    (used when auto-generating on create / payment update)
// ─────────────────────────────────────────────────────────────

/**
 * Generate a Sales Invoice PDF and persist it to /uploads/invoices/.
 * @param {Object} invoice – Mongoose SaleInvoice document or plain object
 * @returns {Promise<string>} – e.g. `/uploads/invoices/inv-INV-xxx.pdf`
 */
export async function generateSalesInvoicePDF(invoice) {
  const settings = await getSettings(invoice.companyId);
  const formattedDate = new Date(invoice.invoiceDate || invoice.date || Date.now()).toLocaleDateString('en-GB');

  const totalAmountVal = Number(invoice.totalAmount) || 0;
  const taxAmountVal = Number(invoice.taxAmount) || (totalAmountVal * 18 / 118);
  const cgstVal = taxAmountVal / 2;
  const sgstVal = taxAmountVal / 2;
  const baseAmountVal = totalAmountVal - taxAmountVal;
  const totalQuantity = (invoice.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const filename = `inv-${invoice.invoiceNumber}-${Date.now()}.pdf`;
      const relativePath = `uploads/invoices/${filename}`;
      const filePath = path.resolve(relativePath);

      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      _drawInvoicePDF(doc, invoice, settings, formattedDate,
        totalAmountVal, taxAmountVal, cgstVal, sgstVal, baseAmountVal, totalQuantity);

      doc.end();
      writeStream.on('finish', () => resolve(`/${relativePath.replace(/\\/g, '/')}`));
      writeStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// 3. PURCHASE ORDER ─ saves file to disk, returns URL string
// ─────────────────────────────────────────────────────────────

/**
 * Generate a Purchase Order PDF and persist it to /uploads/pos/.
 * @param {Object} po     – Mongoose PurchaseOrder document
 * @param {Object} vendor – Populated Vendor document
 * @returns {Promise<string>}
 */
export async function generatePOInvoice(po, vendor) {
  const settings = await getSettings(po.companyId);
  const formattedDate = new Date(po.createdAt || Date.now()).toLocaleDateString('en-GB');

  const totalAmountVal = Number(po.totalAmount) || 0;
  const taxAmountVal = Number(po.taxAmount) || 0;
  const cgstVal = taxAmountVal / 2;
  const sgstVal = taxAmountVal / 2;
  const baseAmountVal = totalAmountVal - taxAmountVal;
  const totalQuantity = (po.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  // Build a normalised invoice-like object so _drawInvoicePDF can render it
  const poAsInvoice = {
    invoiceNumber: po.poNumber,
    date: po.createdAt || new Date(),
    customerName: vendor.name || 'Vendor',
    customerAddress: vendor.address || 'N/A',
    customerPhone: vendor.phone || vendor.contactPerson || 'N/A',
    customerGst: vendor.gstNumber || 'N/A',
    totalAmount: totalAmountVal,
    taxAmount: taxAmountVal,
    items: (po.items || []).map(item => ({
      description: item.name || 'Item',
      quantity: item.quantity || 1,
      unitPrice: item.price || 0,
      total: (item.quantity || 1) * (item.price || 0),
    })),
  };

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const filename = `po-${po.poNumber}-${Date.now()}.pdf`;
      const relativePath = `uploads/pos/${filename}`;
      const filePath = path.resolve(relativePath);

      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Draw PURCHASE ORDER with the same MANUEN layout but BILL TO = vendor
      _drawInvoicePDF(doc, poAsInvoice, settings, formattedDate,
        totalAmountVal, taxAmountVal, cgstVal, sgstVal, baseAmountVal, totalQuantity,
        'PURCHASE ORDER');

      doc.end();
      writeStream.on('finish', () => resolve(`/${relativePath.replace(/\\/g, '/')}`));
      writeStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
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
  let hasSquareLogo = false;
  let hasNameLogo = false;
  let squareLogoPath = '';
  let nameLogoPath = '';

  if (settings.logoSquareUrl) {
    squareLogoPath = path.resolve(settings.logoSquareUrl.startsWith('/') ? settings.logoSquareUrl.slice(1) : settings.logoSquareUrl);
    if (fs.existsSync(squareLogoPath)) {
      hasSquareLogo = true;
    }
  }

  if (settings.logoUrl) {
    nameLogoPath = path.resolve(settings.logoUrl.startsWith('/') ? settings.logoUrl.slice(1) : settings.logoUrl);
    if (fs.existsSync(nameLogoPath)) {
      hasNameLogo = true;
    }
  }

  if (hasSquareLogo && hasNameLogo) {
    // Both uploaded: Draw square logo on left (40x40), and name logo next to it (135x40) with tighter space
    doc.image(squareLogoPath, 40, headerY, { width: 40, height: 40 });
    doc.image(nameLogoPath, 84, headerY, { width: 135, height: 40 });
  } else if (hasSquareLogo) {
    // Only Square Logo: Draw square logo (40x40) and text company name next to it
    doc.image(squareLogoPath, 40, headerY, { width: 40, height: 40 });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#002e6e').text(settings.companyName, 85, headerY + 13);
  } else if (hasNameLogo) {
    // Only Name Logo: Draw name logo (155x40)
    doc.image(nameLogoPath, 40, headerY, { width: 155, height: 40 });
  } else {
    // None: Vector fallback
    drawVectorLogo(doc, 40, headerY, settings.companyName);
  }

  // ── Date / Doc-number box ─────────────────────────────────
  const boxW = 148; const boxH = 38; const boxX = 555 - boxW;
  doc.lineWidth(1).strokeColor('#000000');
  doc.rect(boxX, headerY, boxW, boxH).stroke();
  doc.moveTo(boxX, headerY + 19).lineTo(boxX + boxW, headerY + 19).stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Date : ${formattedDate}`, boxX + 7, headerY + 5);
  doc.text(`${titleText === 'PURCHASE ORDER' ? 'PO' : 'Invoice'} No : ${invoice.invoiceNumber || 'N/A'}`, boxX + 7, headerY + 24);

  // ── Title ─────────────────────────────────────────────────
  doc.fontSize(25).font('Helvetica-Bold').fillColor('#00b4d8').text(titleText, 40, 90, { align: 'center' });

  // ── FROM & BILL TO ────────────────────────────────────────
  const billingY = 130; const colH = 92;

  doc.lineWidth(1).strokeColor('#cccccc');
  doc.rect(40, billingY, 240, colH).stroke();
  doc.fillColor('#e8e5d3').rect(41, billingY + 1, 238, 16).fill();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text('FROM', 50, billingY + 4);
  doc.fontSize(8).font('Helvetica-Bold').text(settings.companyName.toUpperCase(), 50, billingY + 23);
  doc.font('Helvetica').fillColor('#333333').text(settings.address, 50, billingY + 35, { width: 222 });
  doc.text(`Mobile No : ${settings.mobile}`, 50, billingY + 64);
  doc.text(`GST No : ${settings.gstNumber}`, 50, billingY + 75);

  const clientName = (invoice.customerName || invoice.client || 'N/A').toUpperCase();
  doc.rect(294, billingY, 261, colH).stroke();
  doc.fillColor('#e8e5d3').rect(295, billingY + 1, 259, 16).fill();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text('BILL TO', 304, billingY + 4);
  doc.fontSize(8).font('Helvetica-Bold').text(clientName, 304, billingY + 23);
  doc.font('Helvetica').fillColor('#333333').text(invoice.customerAddress || 'N/A', 304, billingY + 35, { width: 245 });
  doc.text(`GST NO : ${invoice.customerGst || 'N/A'}`, 304, billingY + 52);
  doc.text(`Phone No : ${invoice.customerPhone || 'N/A'}`, 304, billingY + 63);
  doc.text(`Mobile No : ${invoice.customerPhone || 'N/A'}`, 304, billingY + 74);

  // ── Main items table ──────────────────────────────────────
  const tableY = billingY + colH + 14;
  const colX = [40, 75, 320, 395, 470, 555];
  const colW = [35, 245, 75, 75, 85];
  const hdrLabels = ['S NO', 'Description of Services', 'HSN Code', 'Quantity', 'Amount'];

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
    doc.text(settings.defaultHsnCode, colX[2], rowY + 9, { width: colW[2], align: 'center' });
    doc.text(`${item.quantity} Months`, colX[3], rowY + 9, { width: colW[3], align: 'center' });
    doc.text(`${Number(itemTotal).toLocaleString()}/-`, colX[4], rowY + 9, { width: colW[4] - 8, align: 'right' });
    rowY += rowH;
  });

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

  // ── GST summary table ─────────────────────────────────────
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

  // ── Amount in words & bank details ───────────────────────
  rowY += 30;
  doc.fontSize(8.5).font('Helvetica').fillColor('#555555').text('Total Amount (in words):', 40, rowY);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text(priceToWords(totalAmountVal), 40, rowY + 13, { width: 250 });

  const bankX = 310;
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text("Company's Bank Details", bankX, rowY);
  doc.fontSize(8).font('Helvetica').fillColor('#333333');
  doc.text(`A/c Holder's Name : ${settings.accountHolderName}`, bankX + 10, rowY + 13);
  doc.text(`Bank Name : ${settings.bankName}`, bankX + 10, rowY + 24);
  doc.text(`Account No : ${settings.accountNumber}`, bankX + 10, rowY + 35);
  doc.text(`Branch & IFS Code : ${settings.ifscCode}`, bankX + 10, rowY + 46);

  // ── Note block ────────────────────────────────────────────
  rowY += 72;
  doc.rect(40, rowY, 515, 34).stroke();
  doc.fillColor('#e8e5d3').rect(41, rowY + 1, 513, 14).fill();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000').text('Note', 40, rowY + 4, { align: 'center', width: 515 });
  doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#000000').text(settings.noteText, 40, rowY + 19, { align: 'center', width: 515 });
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
  const formattedInvoiceDate = new Date(purchaseEntry.invoiceDate || Date.now()).toLocaleDateString('en-GB');
  const formattedDueDate = purchaseEntry.dueDate ? new Date(purchaseEntry.dueDate).toLocaleDateString('en-GB') : 'Immediate / N/A';

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const bufferPromise = getStreamAsBuffer(doc);

  const headerY = 40;
  let hasSquareLogo = false;
  let hasNameLogo = false;
  let squareLogoPath = '';
  let nameLogoPath = '';

  if (settings.logoSquareUrl) {
    squareLogoPath = path.resolve(settings.logoSquareUrl.startsWith('/') ? settings.logoSquareUrl.slice(1) : settings.logoSquareUrl);
    if (fs.existsSync(squareLogoPath)) {
      hasSquareLogo = true;
    }
  }

  if (settings.logoUrl) {
    nameLogoPath = path.resolve(settings.logoUrl.startsWith('/') ? settings.logoUrl.slice(1) : settings.logoUrl);
    if (fs.existsSync(nameLogoPath)) {
      hasNameLogo = true;
    }
  }

  if (hasSquareLogo && hasNameLogo) {
    doc.image(squareLogoPath, 40, headerY, { width: 40, height: 40 });
    doc.image(nameLogoPath, 84, headerY, { width: 135, height: 40 });
  } else if (hasSquareLogo) {
    doc.image(squareLogoPath, 40, headerY, { width: 40, height: 40 });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#002e6e').text(settings.companyName, 85, headerY + 13);
  } else if (hasNameLogo) {
    doc.image(nameLogoPath, 40, headerY, { width: 155, height: 40 });
  } else {
    drawVectorLogo(doc, 40, headerY, settings.companyName);
  }

  // ── Voucher Box ──────────────────────────────────────────
  const boxW = 160; const boxH = 68; const boxX = 555 - boxW;
  doc.lineWidth(1).strokeColor('#4a5568');
  doc.rect(boxX, headerY, boxW, boxH).stroke();
  doc.moveTo(boxX, headerY + 17).lineTo(boxX + boxW, headerY + 17).stroke();
  doc.moveTo(boxX, headerY + 34).lineTo(boxX + boxW, headerY + 34).stroke();
  doc.moveTo(boxX, headerY + 51).lineTo(boxX + boxW, headerY + 51).stroke();
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1a202c');
  doc.text(`Voucher No: ${purchaseEntry.purchaseVoucherNumber || 'N/A'}`, boxX + 6, headerY + 4);
  doc.text(`Voucher Date: ${formattedVoucherDate}`, boxX + 6, headerY + 21);
  doc.text(`Ref Invoice: ${purchaseEntry.invoiceNumber || 'N/A'} (${formattedInvoiceDate})`, boxX + 6, headerY + 38);
  doc.text(`Due Date: ${formattedDueDate}`, boxX + 6, headerY + 55);

  // ── Document Title ─────────────────────────────────────────
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#1a365d').text('PURCHASE VOUCHER', 40, 100, { align: 'center' });

  // ── Supplier & Company details cards ─────────────────────────
  const billingY = 135; const colH = 92;

  // Company Info card (Left)
  doc.lineWidth(1).strokeColor('#cbd5e1');
  doc.rect(40, billingY, 240, colH).stroke();
  doc.fillColor('#f1f5f9').rect(41, billingY + 1, 238, 16).fill();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('COMPANY DETAILS', 50, billingY + 4);
  doc.fontSize(8).font('Helvetica-Bold').text(settings.companyName.toUpperCase(), 50, billingY + 23);
  doc.font('Helvetica').fillColor('#334155').text(settings.address, 50, billingY + 35, { width: 220 });
  doc.text(`Mobile: ${settings.mobile}`, 50, billingY + 64);
  doc.text(`GST No: ${settings.gstNumber}`, 50, billingY + 75);

  // Supplier Snapshot Info card (Right)
  doc.rect(294, billingY, 261, colH).stroke();
  doc.fillColor('#f1f5f9').rect(295, billingY + 1, 259, 16).fill();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('SUPPLIER DETAILS', 304, billingY + 4);
  doc.fontSize(8).font('Helvetica-Bold').text((purchaseEntry.supplierName || 'N/A').toUpperCase(), 304, billingY + 23);
  doc.font('Helvetica').fillColor('#334155').text(purchaseEntry.supplierAddress || 'N/A', 304, billingY + 35, { width: 245 });
  doc.text(`GSTIN: ${purchaseEntry.supplierGSTIN || 'N/A'}`, 304, billingY + 54);
  doc.text(`Phone: ${purchaseEntry.supplierMobileNumber || 'N/A'}`, 304, billingY + 65);
  doc.text(`Email: ${purchaseEntry.supplierEmail || 'N/A'}`, 304, billingY + 76);

  // ── Items Table ──────────────────────────────────────────
  const tableY = billingY + colH + 15;
  const colX = [40, 70, 260, 320, 370, 430, 485, 555];
  const colW = [30, 190, 60, 50, 60, 55, 70];
  const tableHdrs = ['S.No', 'Item Description', 'Item Code', 'Quantity', 'Unit', 'Price', 'Discount', 'Total'];

  doc.fillColor('#e2e8f0').rect(40, tableY, 515, 20).fill();
  doc.lineWidth(1).strokeColor('#475569').rect(40, tableY, 515, 20).stroke();
  for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], tableY).lineTo(colX[i], tableY + 20).stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a');
  tableHdrs.forEach((hdr, idx) => {
    const align = (idx === 0 || idx === 2 || idx === 3 || idx === 4) ? 'center' : (idx === 1 ? 'left' : 'right');
    doc.text(hdr, colX[idx] + (align === 'left' ? 5 : 0), tableY + 6, { width: colW[idx], align });
  });

  let rowY = tableY + 20;
  const rowH = 22;
  (purchaseEntry.items || []).forEach((item, idx) => {
    doc.rect(40, rowY, 515, rowH).stroke();
    for (let i = 1; i < colX.length - 1; i++) doc.moveTo(colX[i], rowY).lineTo(colX[i], rowY + rowH).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#1e293b');
    doc.text(String(idx + 1), colX[0], rowY + 7, { width: colW[0], align: 'center' });
    doc.text(item.name || 'Item', colX[1] + 5, rowY + 7, { width: colW[1] - 8 });
    doc.text(item.code || '-', colX[2], rowY + 7, { width: colW[2], align: 'center' });
    doc.text(String(item.quantity), colX[3], rowY + 7, { width: colW[3], align: 'center' });
    doc.text(item.unit || 'Pcs', colX[4], rowY + 7, { width: colW[4], align: 'center' });
    doc.text(Number(item.price).toFixed(2), colX[5], rowY + 7, { width: colW[5] - 5, align: 'right' });
    doc.text(Number(item.discountAmount || 0).toFixed(2), colX[6], rowY + 7, { width: colW[6] - 5, align: 'right' });
    doc.text(Number(item.totalItemAmount || (item.quantity * item.price)).toFixed(2), colX[7], rowY + 7, { width: colW[7] - 5, align: 'right' });
    rowY += rowH;
  });

  // ── Overheads & Grand Summary Blocks ────────────────────────
  rowY += 15;
  const bottomY = rowY;

  // Left side: Additional Overhead Charges & Payment Info
  doc.lineWidth(1).strokeColor('#cbd5e1');
  doc.rect(40, bottomY, 250, 105).stroke();
  doc.fillColor('#f8fafc').rect(41, bottomY + 1, 248, 16).fill();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('OVERHEAD CHARGES & PAYMENTS', 48, bottomY + 4);

  doc.fontSize(7.5).font('Helvetica').fillColor('#334155');
  doc.text(`Transportation Charges:`, 48, bottomY + 23);
  doc.font('Helvetica-Bold').text(Number(purchaseEntry.transportationCharges || 0).toFixed(2), 170, bottomY + 23, { align: 'right', width: 110 });

  doc.font('Helvetica').text(`Packing Charges:`, 48, bottomY + 35);
  doc.font('Helvetica-Bold').text(Number(purchaseEntry.packingCharges || 0).toFixed(2), 170, bottomY + 35, { align: 'right', width: 110 });

  doc.font('Helvetica').text(`Loading/Unloading:`, 48, bottomY + 47);
  doc.font('Helvetica-Bold').text(Number(purchaseEntry.loadingUnloadingCharges || 0).toFixed(2), 170, bottomY + 47, { align: 'right', width: 110 });

  doc.font('Helvetica').text(`Other Charges:`, 48, bottomY + 59);
  doc.font('Helvetica-Bold').text(Number(purchaseEntry.otherCharges || 0).toFixed(2), 170, bottomY + 59, { align: 'right', width: 110 });

  doc.moveTo(40, bottomY + 72).lineTo(290, bottomY + 72).stroke();
  
  doc.font('Helvetica').text(`Payment Status:`, 48, bottomY + 78);
  doc.font('Helvetica-Bold').fillColor(purchaseEntry.paymentStatus === 'Paid' ? '#16a34a' : (purchaseEntry.paymentStatus === 'Partial' ? '#d97706' : '#dc2626')).text(purchaseEntry.paymentStatus, 140, bottomY + 78, { width: 140, align: 'right' });
  
  doc.font('Helvetica').fillColor('#334155').text(`Payment Mode:`, 48, bottomY + 90);
  doc.font('Helvetica-Bold').text(`${purchaseEntry.paymentMode || 'Credit'}${purchaseEntry.paymentReferenceNumber ? ' (Ref: ' + purchaseEntry.paymentReferenceNumber + ')' : ''}`, 140, bottomY + 90, { width: 140, align: 'right' });

  // Right side: Financial Summary Block
  doc.lineWidth(1).strokeColor('#cbd5e1');
  doc.rect(305, bottomY, 250, 105).stroke();
  doc.fillColor('#f8fafc').rect(306, bottomY + 1, 248, 16).fill();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('FINANCIAL SUMMARY', 313, bottomY + 4);

  doc.fontSize(8).font('Helvetica').fillColor('#334155');
  doc.text(`Sub Total:`, 313, bottomY + 23);
  doc.text(Number(purchaseEntry.subTotal || 0).toFixed(2), 430, bottomY + 23, { align: 'right', width: 115 });

  doc.text(`Total Discount:`, 313, bottomY + 35);
  doc.text(`(-) ${Number(purchaseEntry.totalDiscount || 0).toFixed(2)}`, 430, bottomY + 35, { align: 'right', width: 115 });

  doc.text(`Overheads Total:`, 313, bottomY + 47);
  doc.text(`(+) ${Number(purchaseEntry.additionalChargesTotal || 0).toFixed(2)}`, 430, bottomY + 47, { align: 'right', width: 115 });

  doc.moveTo(305, bottomY + 59).lineTo(555, bottomY + 59).stroke();

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
  doc.text(`GRAND TOTAL:`, 313, bottomY + 64);
  doc.text(Number(purchaseEntry.grandTotal || 0).toFixed(2), 430, bottomY + 64, { align: 'right', width: 115 });

  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  doc.text(`Amount Paid (Down-payment):`, 313, bottomY + 78);
  doc.text(Number(purchaseEntry.amountPaid || 0).toFixed(2), 430, bottomY + 78, { align: 'right', width: 115 });

  doc.font('Helvetica-Bold').text(`OUTSTANDING DUE:`, 313, bottomY + 90);
  doc.text(Number(purchaseEntry.amountDue || 0).toFixed(2), 430, bottomY + 90, { align: 'right', width: 115 });

  // ── Notes ────────────────────────────────────────────────
  rowY = bottomY + 120;
  if (purchaseEntry.notes) {
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('Notes / Remarks:', 40, rowY);
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#475569').text(purchaseEntry.notes, 40, rowY + 12, { width: 515 });
    rowY += 40;
  }

  // ── Amount in words ──────────────────────────────────────
  doc.fontSize(8).font('Helvetica').fillColor('#475569').text('Grand Total (in words):', 40, rowY);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text(priceToWords(purchaseEntry.grandTotal), 40, rowY + 11, { width: 515 });

  // ── Signatures ───────────────────────────────────────────
  rowY += 60;
  doc.moveTo(40, rowY).lineTo(180, rowY).strokeColor('#94a3b8').lineWidth(0.5).stroke();
  doc.moveTo(375, rowY).lineTo(515, rowY).stroke();

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
  doc.text('Prepared / Received By', 40, rowY + 5, { width: 140, align: 'center' });
  doc.text('Authorized Signatory', 375, rowY + 5, { width: 140, align: 'center' });

  doc.end();
  return await bufferPromise;
}

// ─────────────────────────────────────────────────────────────
// Legacy default export (kept for any direct import compat)
// ─────────────────────────────────────────────────────────────
export default generateInvoiceBuffer;

