import PurchaseOrder from '../models/PurchaseOrder.js';
import Vendor from '../models/Vendor.js';
import CompanySetting from '../models/CompanySetting.js';
import { generateInvoiceBuffer } from '../utils/generateInvoice.js';
import asyncHandler from 'express-async-handler';

const getCompanyPrefix = (name) => {
  if (!name) return 'MIT';
  const upperName = name.toUpperCase().trim();
  if (upperName.includes('MANUEN INFOTECH')) {
    return 'MIT';
  }
  const words = upperName.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    return words.slice(0, 3).map(w => w[0]).join('');
  } else if (words.length === 2) {
    const w1 = words[0];
    const w2 = words[1];
    if (w2.startsWith('INFO') && w2.length > 4) {
      return w1[0] + 'IT';
    }
    return w1[0] + w2[0];
  } else {
    return upperName.slice(0, 3);
  }
};

// Helper to generate a unique PO number
const generatePONumber = async (companyId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  let companyPrefix = 'MIT';
  if (companyId) {
    const company = await CompanySetting.findById(companyId);
    if (company && company.companyName) {
      companyPrefix = getCompanyPrefix(company.companyName);
    }
  } else {
    const defaultCompany = await CompanySetting.findOne();
    if (defaultCompany && defaultCompany.companyName) {
      companyPrefix = getCompanyPrefix(defaultCompany.companyName);
    }
  }

  const prefix = `${companyPrefix}-PO${dateStr}`;
  const count = await PurchaseOrder.countDocuments({
    poNumber: new RegExp(`^${prefix}`),
  });

  // Find highest serial number to avoid duplicate generation if previous POs were deleted
  let nextNum = count + 1;
  const lastPO = await PurchaseOrder.findOne({
    poNumber: new RegExp(`^${prefix}`),
  }).sort({ poNumber: -1 });

  if (lastPO && lastPO.poNumber) {
    const match = lastPO.poNumber.match(/\d+$/);
    if (match) {
      const lastSerial = parseInt(match[0], 10);
      if (!isNaN(lastSerial) && lastSerial >= nextNum) {
        nextNum = lastSerial + 1;
      }
    }
  }

  const sequentialNum = String(nextNum).padStart(3, '0');
  return `${prefix}${sequentialNum}`;
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
    const poNumber = await generatePONumber(companyId);

    const po = new PurchaseOrder({
      poNumber,
      vendor: vendorId,
      items,
      taxAmount,
      totalAmount,
      createdBy: req.user._id,
      status: req.body.status || 'Draft',
      companyId: companyId || '6a0d837fd7ace7063e6a8379',
    });

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
      .populate('companyId')
      .sort({ createdAt: -1 });
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
    .populate('vendor', 'name email address phone gstNumber paymentTerms contactPerson bankName accountHolderName accountNumber ifscCode');
  if (!po) {
    res.status(404);
    throw new Error('Purchase Order not found');
  }

  // Normalise into the same invoice shape the unified generator expects
  const invoiceData = {
    titleText:       'PURCHASE VOUCHER',
    invoiceNumber:   po.poNumber,
    date:            po.createdAt || new Date(),
    customerName:    po.vendor?.name || 'Vendor',
    customerAddress: po.vendor?.address || 'N/A',
    customerPhone:   po.vendor?.phone || po.vendor?.contactPerson || 'N/A',
    customerGst:     po.vendor?.gstNumber || 'N/A',
    totalAmount:     po.totalAmount || 0,
    taxAmount:       po.taxAmount   || 0,
    companyId:       po.companyId || '6a0d837fd7ace7063e6a8379',
    supplierBankName:          po.vendor?.bankName,
    supplierAccountHolderName: po.vendor?.accountHolderName || po.vendor?.name,
    supplierAccountNumber:     po.vendor?.accountNumber,
    supplierIfscCode:          po.vendor?.ifscCode,
    items: (po.items || []).map(item => ({
      description: item.name || 'Item',
      quantity:    item.quantity || 1,
      unitPrice:   item.price   || 0,
      taxRate:     item.taxRate !== undefined ? item.taxRate : 18,
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

// @desc    Update a Purchase Order
// @route   PUT /api/purchase-orders/:id
// @access  Private (Admin Only)
export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const { vendor: vendorId, items, companyId, status } = req.body;

  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) {
    res.status(404);
    throw new Error('Purchase Order not found');
  }

  if (vendorId !== undefined) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      res.status(404);
      throw new Error('Vendor not found');
    }
    po.vendor = vendorId;
  }

  if (companyId !== undefined) {
    po.companyId = companyId;
  }

  if (status !== undefined) {
    po.status = status;
  }

  if (items !== undefined) {
    po.items = items;
  }

  // Calculate subtotal, tax amount, and total amount
  let subtotal = 0;
  let taxAmount = 0;

  po.items.forEach((item) => {
    const itemSubtotal = item.quantity * item.price;
    const itemTax = itemSubtotal * ((item.taxRate || 18) / 100);
    subtotal += itemSubtotal;
    taxAmount += itemTax;
  });

  po.taxAmount = taxAmount;
  po.totalAmount = subtotal + taxAmount;

  const updatedPO = await po.save();
  res.json(updatedPO);
});

// @desc    Delete a Purchase Order
// @route   DELETE /api/purchase-orders/:id
// @access  Private (Admin Only)
export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) {
    res.status(404);
    throw new Error('Purchase Order not found');
  }
  await po.deleteOne();
  res.json({ message: 'Purchase Order removed successfully' });
});
