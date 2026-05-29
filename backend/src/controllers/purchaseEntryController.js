import PurchaseEntry from '../models/PurchaseEntry.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Vendor from '../models/Vendor.js';
import { postPurchaseEntry, reversePurchaseEntry } from '../utils/accounting.js';
import { generatePurchaseVoucherBuffer } from '../utils/generateInvoice.js';

// Helper to generate chronological, sequential purchase voucher numbers
const generateVoucherNumber = async () => {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `PV-${todayStr}`;
  // Count matching prefixes today
  const count = await PurchaseEntry.countDocuments({
    purchaseVoucherNumber: new RegExp(`^${prefix}`),
  });
  const sequentialNum = String(count + 1).padStart(3, '0');
  return `${prefix}-${sequentialNum}`;
};

// @desc    Create a new Purchase Entry (Procurement Voucher with full ledgers)
// @route   POST /api/purchase-entries
// @access  Private (Manager/Admin)
export const createPurchaseEntry = async (req, res) => {
  try {
    const {
      poRef,
      vendor,
      invoiceNumber,
      invoiceDate,
      purchaseDate,
      subTotal,
      totalDiscount,
      transportationCharges,
      packingCharges,
      loadingUnloadingCharges,
      otherCharges,
      additionalChargesTotal,
      grandTotal,
      paymentStatus,
      paymentMode,
      amountPaid,
      amountDue,
      paymentReferenceNumber,
      notes,
      items,
      companyId,
    } = req.body;

    let invoiceUrl = '';
    if (req.file) {
      invoiceUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    } else {
      return res.status(400).json({ message: 'Please upload a supporting supplier invoice document.' });
    }

    // Parse items if passed as stringified JSON (usually standard for multipart form-data)
    let parsedItems = items;
    if (typeof items === 'string') {
      parsedItems = JSON.parse(items);
    }

    // Retrieve Supplier Vendor to capture a historical contact snapshot
    const vendorDoc = await Vendor.findById(vendor);
    if (!vendorDoc) {
      return res.status(404).json({ message: 'Supplier/Vendor not found.' });
    }

    const purchaseVoucherNumber = await generateVoucherNumber();

    const entry = new PurchaseEntry({
      poRef: poRef || null,
      vendor,
      purchaseVoucherNumber,
      purchaseDate: purchaseDate || new Date(),
      invoiceNumber,
      invoiceDate: invoiceDate || new Date(),
      // Supplier Snapshot
      supplierName: vendorDoc.name,
      supplierGSTIN: vendorDoc.gstNumber || '',
      supplierMobileNumber: vendorDoc.phone || '',
      supplierEmail: vendorDoc.email || '',
      supplierAddress: vendorDoc.address || '',
      // Items (Strictly excluding GST and HSN/SAC)
      items: parsedItems,
      // Overhead Charges
      transportationCharges: Number(transportationCharges || 0),
      packingCharges: Number(packingCharges || 0),
      loadingUnloadingCharges: Number(loadingUnloadingCharges || 0),
      otherCharges: Number(otherCharges || 0),
      // Summary Breakdown
      subTotal: Number(subTotal),
      totalDiscount: Number(totalDiscount || 0),
      additionalChargesTotal: Number(additionalChargesTotal || 0),
      grandTotal: Number(grandTotal),
      totalAmount: Number(grandTotal), // legacy compatibility
      // Payments info
      paymentStatus: paymentStatus || 'Unpaid',
      paymentMode: paymentMode || 'Cash',
      amountPaid: Number(amountPaid || 0),
      amountDue: Number(amountDue),
      paymentReferenceNumber: paymentReferenceNumber || '',
      notes: notes || '',
      invoiceUrl,
      addedBy: req.user._id,
      companyId: companyId || '6a0d837fd7ace7063e6a8379',
    });

    const createdEntry = await entry.save();

    // Trigger Double-Entry accounting posting
    await postPurchaseEntry(createdEntry);

    // If there is a linked PO, mark it as Completed
    if (poRef) {
      await PurchaseOrder.findByIdAndUpdate(poRef, { status: 'Completed' });
    }

    res.status(201).json(createdEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Purchase Entries (normalised to support legacy data gracefully)
// @route   GET /api/purchase-entries
// @access  Private
export const getPurchaseEntries = async (req, res) => {
  try {
    const rawEntries = await PurchaseEntry.find({})
      .populate('vendor', 'name email gstNumber phone address')
      .populate('poRef', 'poNumber')
      .populate('addedBy', 'name email')
      .populate('companyId')
      .sort({ createdAt: -1 });

    // Normalise legacy objects so front-end parses cleanly without crashes
    const entries = rawEntries.map((entry) => {
      const plain = entry.toObject();
      if (!plain.purchaseVoucherNumber) {
        plain.purchaseVoucherNumber = `PV-LEGACY-${plain._id.toString().slice(-6).toUpperCase()}`;
        plain.purchaseDate = plain.createdAt;
        plain.invoiceDate = plain.createdAt;
        plain.supplierName = plain.vendor?.name || 'Legacy Vendor';
        plain.supplierGSTIN = plain.vendor?.gstNumber || '';
        plain.supplierMobileNumber = plain.vendor?.phone || '';
        plain.supplierEmail = plain.vendor?.email || '';
        plain.supplierAddress = plain.vendor?.address || '';
        plain.subTotal = plain.totalAmount || 0;
        plain.totalDiscount = 0;
        plain.additionalChargesTotal = 0;
        plain.grandTotal = plain.totalAmount || 0;
        plain.paymentStatus = plain.paymentStatus === 'Pending' ? 'Unpaid' : plain.paymentStatus;
      }
      return plain;
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update/Edit an existing Purchase Entry (with full accounting reversal & re-posting)
// @route   PUT /api/purchase-entries/:id
// @access  Private (Manager/Admin)
export const updatePurchaseEntry = async (req, res) => {
  try {
    const entry = await PurchaseEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Purchase Entry not found.' });
    }

    // 1. Perform reversal of ledger entries based on old purchase entry state
    await reversePurchaseEntry(entry);

    const {
      poRef,
      vendor,
      invoiceNumber,
      invoiceDate,
      purchaseDate,
      subTotal,
      totalDiscount,
      transportationCharges,
      packingCharges,
      loadingUnloadingCharges,
      otherCharges,
      additionalChargesTotal,
      grandTotal,
      paymentStatus,
      paymentMode,
      amountPaid,
      amountDue,
      paymentReferenceNumber,
      notes,
      items,
      companyId,
    } = req.body;

    let invoiceUrl = entry.invoiceUrl;
    if (req.file) {
      invoiceUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    }

    let parsedItems = items;
    if (typeof items === 'string') {
      parsedItems = JSON.parse(items);
    }

    // Re-snapshot vendor details if changed or if legacy
    const vendorDoc = await Vendor.findById(vendor);
    if (!vendorDoc) {
      return res.status(404).json({ message: 'Supplier/Vendor not found.' });
    }

    // Update document fields
    entry.poRef = poRef || null;
    entry.vendor = vendor;
    entry.invoiceNumber = invoiceNumber;
    entry.invoiceDate = invoiceDate || entry.invoiceDate;
    entry.purchaseDate = purchaseDate || entry.purchaseDate;
    
    // Update snapshot
    entry.supplierName = vendorDoc.name;
    entry.supplierGSTIN = vendorDoc.gstNumber || '';
    entry.supplierMobileNumber = vendorDoc.phone || '';
    entry.supplierEmail = vendorDoc.email || '';
    entry.supplierAddress = vendorDoc.address || '';
    
    // Items & Financials
    entry.items = parsedItems;
    entry.transportationCharges = Number(transportationCharges || 0);
    entry.packingCharges = Number(packingCharges || 0);
    entry.loadingUnloadingCharges = Number(loadingUnloadingCharges || 0);
    entry.otherCharges = Number(otherCharges || 0);
    entry.subTotal = Number(subTotal);
    entry.totalDiscount = Number(totalDiscount || 0);
    entry.additionalChargesTotal = Number(additionalChargesTotal || 0);
    entry.grandTotal = Number(grandTotal);
    entry.totalAmount = Number(grandTotal); // legacy compatibility
    
    // Payments
    entry.paymentStatus = paymentStatus || 'Unpaid';
    entry.paymentMode = paymentMode || 'Cash';
    entry.amountPaid = Number(amountPaid || 0);
    entry.amountDue = Number(amountDue);
    entry.paymentReferenceNumber = paymentReferenceNumber || '';
    
    entry.notes = notes || '';
    entry.invoiceUrl = invoiceUrl;
    if (companyId) entry.companyId = companyId;

    // Save and re-post updated entries
    const updatedEntry = await entry.save();
    await postPurchaseEntry(updatedEntry);

    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a Purchase Entry (with full double-entry rollback)
// @route   DELETE /api/purchase-entries/:id
// @access  Private (Manager/Admin)
export const deletePurchaseEntry = async (req, res) => {
  try {
    const entry = await PurchaseEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Purchase Entry not found.' });
    }

    // 1. Perform reversal rollback of all accounting postings
    await reversePurchaseEntry(entry);

    // 2. Delete the record
    await PurchaseEntry.findByIdAndDelete(req.params.id);

    res.json({ message: 'Purchase Voucher and related ledgers rolled back & deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record/Update payment status and down-payment logs
// @route   PUT /api/purchase-entries/:id/payment
// @access  Private (Manager/Admin)
export const updatePurchaseEntryPayment = async (req, res) => {
  try {
    const { amountPaid: newPayment, paymentMode, paymentReferenceNumber, paymentStatus } = req.body;

    const entry = await PurchaseEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Purchase Entry not found.' });
    }

    // 1. Rollback old double-entry journals & supplier ledger
    await reversePurchaseEntry(entry);

    const additionalPayment = Number(newPayment || 0);
    
    // Support either absolute status adjustment or incremental payments
    if (paymentStatus) {
      entry.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        entry.amountPaid = entry.grandTotal || entry.totalAmount;
      } else if (paymentStatus === 'Unpaid') {
        entry.amountPaid = 0;
      }
    } else {
      entry.amountPaid += additionalPayment;
    }

    // Bound checks
    const targetLimit = entry.grandTotal || entry.totalAmount;
    if (entry.amountPaid > targetLimit) {
      entry.amountPaid = targetLimit;
    }
    if (entry.amountPaid < 0) {
      entry.amountPaid = 0;
    }

    entry.amountDue = targetLimit - entry.amountPaid;

    // Recompute status if not explicitly set
    if (!paymentStatus) {
      if (entry.amountPaid >= targetLimit) {
        entry.paymentStatus = 'Paid';
      } else if (entry.amountPaid > 0) {
        entry.paymentStatus = 'Partial';
      } else {
        entry.paymentStatus = 'Unpaid';
      }
    }

    if (paymentMode) entry.paymentMode = paymentMode;
    if (paymentReferenceNumber) entry.paymentReferenceNumber = paymentReferenceNumber;

    const updatedEntry = await entry.save();

    // 2. Post new accounting logs back into general journal & ledger
    await postPurchaseEntry(updatedEntry);

    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download Printable PDF Purchase Voucher
// @route   GET /api/purchase-entries/:id/download
// @access  Private
export const downloadPurchaseVoucher = async (req, res) => {
  try {
    const entry = await PurchaseEntry.findById(req.params.id)
      .populate('vendor')
      .populate('companyId');

    if (!entry) {
      return res.status(404).json({ message: 'Purchase Entry not found.' });
    }

    // Normalise standard fields if legacy entry is downloaded
    const normalised = entry.toObject();
    if (!normalised.purchaseVoucherNumber) {
      normalised.purchaseVoucherNumber = `PV-LEGACY-${normalised._id.toString().slice(-6).toUpperCase()}`;
      normalised.purchaseDate = normalised.createdAt;
      normalised.invoiceDate = normalised.createdAt;
      normalised.supplierName = normalised.vendor?.name || 'Legacy Vendor';
      normalised.supplierGSTIN = normalised.vendor?.gstNumber || '';
      normalised.supplierMobileNumber = normalised.vendor?.phone || '';
      normalised.supplierEmail = normalised.vendor?.email || '';
      normalised.supplierAddress = normalised.vendor?.address || '';
      normalised.subTotal = normalised.totalAmount || 0;
      normalised.totalDiscount = 0;
      normalised.additionalChargesTotal = 0;
      normalised.grandTotal = normalised.totalAmount || 0;
      normalised.paymentStatus = normalised.paymentStatus === 'Pending' ? 'Unpaid' : normalised.paymentStatus;
    }

    const pdfBuffer = await generatePurchaseVoucherBuffer(normalised);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Purchase_Voucher_${normalised.purchaseVoucherNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
