import Invoice from '../models/Invoice.js';
import SaleInvoice from '../models/SaleInvoice.js';
import { generateInvoiceBuffer, generateSalesInvoicePDF } from '../utils/generateInvoice.js';
import asyncHandler from 'express-async-handler';

// =============================================
// SALE INVOICE endpoints (used by Sales page)
// =============================================

// @desc    Create a new Sales Invoice
// @route   POST /api/invoices
// @access  Private (Manager/Admin)
export const createInvoice = asyncHandler(async (req, res) => {
  const {
    customerName,
    customerCompany,
    customerPhone,
    customerEmail,
    customerAddress,
    customerGst,
    items,
    discountAmount,
    dueDate,
    amountPaid,
    companyId,
  } = req.body;

  if (!customerName || !customerEmail) {
    res.status(400);
    throw new Error('Customer name and email are required');
  }
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Invoice must contain at least one item');
  }

  let calculatedDiscount = Number(discountAmount || 0);
  let calculatedTax = 0;
  let netTotal = 0;

  items.forEach((item) => {
    const itemSubtotal = item.quantity * item.price;
    const itemDiscount = item.discount || 0;
    const itemNet = itemSubtotal - itemDiscount;
    const itemTax = itemNet * ((item.taxRate || 18) / 100);
    netTotal += itemNet;
    calculatedTax += itemTax;
  });

  const totalAmount = netTotal + calculatedTax;
  const paidAmount = Number(amountPaid || 0);
  const amountDue = totalAmount - paidAmount;

  let paymentStatus = 'Pending';
  if (paidAmount >= totalAmount) {
    paymentStatus = 'Paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'Partial';
  }

  // Generate invoice number
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await SaleInvoice.countDocuments({
    invoiceNumber: new RegExp(`^INV-${dateStr}`),
  });
  const sequentialNum = String(count + 1).padStart(3, '0');
  const invoiceNumber = `INV-${dateStr}-${sequentialNum}`;

  const invoice = new SaleInvoice({
    invoiceNumber,
    customerName,
    customerCompany,
    customerPhone,
    customerEmail,
    customerAddress,
    customerGst,
    items,
    taxAmount: calculatedTax,
    discountAmount: calculatedDiscount,
    totalAmount,
    paymentStatus,
    amountPaid: paidAmount,
    amountDue,
    dueDate,
    createdBy: req.user._id,
    companyId: companyId || '6a0d837fd7ace7063e6a8379',
  });

  const createdInvoice = await invoice.save();

  // Generate and set PDF URL
  try {
    const pdfUrl = await generateSalesInvoicePDF(createdInvoice);
    createdInvoice.pdfUrl = pdfUrl;
    await createdInvoice.save();
  } catch (pdfErr) {
    console.error('Error generating sales PDF:', pdfErr);
  }

  res.status(201).json(createdInvoice);
});

// @desc    Get all Sales Invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await SaleInvoice.find({}).populate('createdBy', 'name email').populate('companyId');
  
  // Dynamic self-healing: generate PDFs for any legacy invoices missing a pdfUrl
  for (let inv of invoices) {
    if (!inv.pdfUrl) {
      try {
        const pdfUrl = await generateSalesInvoicePDF(inv);
        inv.pdfUrl = pdfUrl;
        await inv.save();
      } catch (pdfErr) {
        console.error(`Error auto-generating legacy PDF for invoice ${inv.invoiceNumber}:`, pdfErr);
      }
    }
  }

  res.json(invoices);
});

// @desc    Get Invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await SaleInvoice.findById(req.params.id).populate('createdBy', 'name email').populate('companyId');
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  res.json(invoice);
});

// @desc    Log payment against an invoice
// @route   PUT /api/invoices/:id/payment
// @access  Private (Manager/Admin)
export const updateInvoicePayment = asyncHandler(async (req, res) => {
  const { amountPaid: newPayment } = req.body;
  const invoice = await SaleInvoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const additionalPayment = Number(newPayment);
  if (isNaN(additionalPayment) || additionalPayment <= 0) {
    res.status(400);
    throw new Error('Invalid payment amount');
  }

  invoice.amountPaid += additionalPayment;
  if (invoice.amountPaid > invoice.totalAmount) {
    invoice.amountPaid = invoice.totalAmount;
  }
  invoice.amountDue = invoice.totalAmount - invoice.amountPaid;

  if (invoice.amountPaid >= invoice.totalAmount) {
    invoice.paymentStatus = 'Paid';
  } else if (invoice.amountPaid > 0) {
    invoice.paymentStatus = 'Partial';
  }

  const updatedInvoice = await invoice.save();

  // Regenerate PDF on payment update
  try {
    const pdfUrl = await generateSalesInvoicePDF(updatedInvoice);
    updatedInvoice.pdfUrl = pdfUrl;
    await updatedInvoice.save();
  } catch (pdfErr) {
    console.error('Error generating sales PDF on payment:', pdfErr);
  }

  res.json(updatedInvoice);
});

// @desc    Delete a Sales Invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin Only)
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await SaleInvoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  await invoice.deleteOne();
  res.json({ message: 'Invoice removed successfully' });
});

// =============================================
// DOWNLOAD endpoint (Word / PDF)
// =============================================

// @desc    Download invoice as Word or PDF
// @route   GET /api/invoices/:id/download?format=docx|pdf
// @access  Private (admin/manager)
export const downloadInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { format, companyId } = req.query;

  // Try SaleInvoice first, then fallback to Invoice
  let invoice = await SaleInvoice.findById(id);
  if (!invoice) {
    invoice = await Invoice.findById(id);
  }
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const invoiceData = invoice.toObject();
  
  if (companyId) {
    invoiceData.companyId = companyId;
  }

  // Normalize client/company fields for the generator
  if (!invoiceData.client) invoiceData.client = invoiceData.customerName || 'N/A';
  invoiceData.date = invoiceData.invoiceDate || invoiceData.date || new Date();

  // Pass through all customer detail fields for BILL TO section
  invoiceData.customerName    = invoiceData.customerName   || invoiceData.client || 'N/A';
  invoiceData.customerAddress = invoiceData.customerAddress || 'N/A';
  invoiceData.customerPhone   = invoiceData.customerPhone  || invoiceData.phone  || 'N/A';
  invoiceData.customerGst     = invoiceData.customerGst    || 'N/A';

  // Normalize line items — handle both SaleInvoice (name/price) and Invoice (description/unitPrice)
  if (!invoiceData.items) invoiceData.items = [];
  invoiceData.items = invoiceData.items.map((item) => {
    const qty   = item.quantity  || 1;
    const price = item.unitPrice || item.price || 0;
    const tot   = item.total     || (qty * price);
    return {
      description: item.description || item.name || 'Item',
      quantity:    qty,
      unitPrice:   price,
      total:       tot,
    };
  });

  const buffer = await generateInvoiceBuffer(invoiceData, format);
  const filename = `${invoiceData.invoiceNumber || 'invoice'}.${format === 'pdf' ? 'pdf' : 'docx'}`;
  const mime = format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});
