import PurchaseOrder from '../models/PurchaseOrder.js';
import Vendor from '../models/Vendor.js';
import { generatePOInvoice, generateInvoiceBuffer } from '../utils/generateInvoice.js';
import asyncHandler from 'express-async-handler';

// Helper to generate a unique PO number
const generatePONumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const count = await PurchaseOrder.countDocuments({
    poNumber: new RegExp(`^PO-${dateStr}`),
  });
  const sequentialNum = String(count + 1).padStart(3, '0');
  return `PO-${dateStr}-${sequentialNum}`;
};

// @desc    Create a new Purchase Order & generate PDF
// @route   POST /api/purchase-orders
// @access  Private (Admin Only)
export const createPurchaseOrder = async (req, res) => {
  try {
    const { vendor: vendorId, items, companyId } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for Purchase Order' });
    }

    // Calculate subtotal, tax amount, and total amount
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach((item) => {
      const itemSubtotal = item.quantity * item.price;
      const itemTax = itemSubtotal * ((item.taxRate || 18) / 100);
      subtotal += itemSubtotal;
      taxAmount += itemTax;
    });

    const totalAmount = subtotal + taxAmount;
    const poNumber = await generatePONumber();

    const po = new PurchaseOrder({
      poNumber,
      vendor: vendorId,
      items,
      taxAmount,
      totalAmount,
      createdBy: req.user._id,
      status: 'Draft',
      companyId: companyId || '6a0d837fd7ace7063e6a8379',
    });

    // Generate the PDF
    const pdfUrl = await generatePOInvoice(po, vendor);
    po.pdfUrl = pdfUrl;

    const createdPO = await po.save();
    res.status(201).json(createdPO);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Purchase Orders
// @route   GET /api/purchase-orders
// @access  Private
export const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({})
      .populate('vendor', 'name email gstNumber')
      .populate('createdBy', 'name email')
      .populate('companyId');
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get PO by ID
// @route   GET /api/purchase-orders/:id
// @access  Private
export const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('vendor', 'name email address phone gstNumber paymentTerms')
      .populate('createdBy', 'name email')
      .populate('companyId');
      
    if (!po) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    res.json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Purchase Order Status
// @route   PUT /api/purchase-orders/:id/status
// @access  Private (Admin Only)
export const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { status } = req.body; // Draft, Sent, Completed, Cancelled

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    po.status = status;
    const updatedPO = await po.save();
    res.json(updatedPO);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download a Purchase Order as PDF or DOCX
// @route   GET /api/purchase-orders/:id/download?format=pdf|docx
// @access  Private
export const downloadPurchaseOrder = asyncHandler(async (req, res) => {
  const { format = 'pdf' } = req.query;

  const po = await PurchaseOrder.findById(req.params.id)
    .populate('vendor', 'name email address phone gstNumber paymentTerms contactPerson');
  if (!po) {
    res.status(404);
    throw new Error('Purchase Order not found');
  }

  // Normalise into the same invoice shape the unified generator expects
  const invoiceData = {
    invoiceNumber:   po.poNumber,
    date:            po.createdAt || new Date(),
    customerName:    po.vendor?.name || 'Vendor',
    customerAddress: po.vendor?.address || 'N/A',
    customerPhone:   po.vendor?.phone || po.vendor?.contactPerson || 'N/A',
    customerGst:     po.vendor?.gstNumber || 'N/A',
    totalAmount:     po.totalAmount || 0,
    taxAmount:       po.taxAmount   || 0,
    companyId:       po.companyId || '6a0d837fd7ace7063e6a8379',
    items: (po.items || []).map(item => ({
      description: item.name || 'Item',
      quantity:    item.quantity || 1,
      unitPrice:   item.price   || 0,
      total:       (item.quantity || 1) * (item.price || 0),
    })),
  };

  const buffer   = await generateInvoiceBuffer(invoiceData, format);
  const filename = `${po.poNumber || 'purchase-order'}.${format === 'pdf' ? 'pdf' : 'docx'}`;
  const mime     = format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});
