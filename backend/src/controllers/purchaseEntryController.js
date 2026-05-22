import PurchaseEntry from '../models/PurchaseEntry.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

// @desc    Create a new Purchase Entry (actual purchase)
// @route   POST /api/purchase-entries
// @access  Private (Manager/Admin)
export const createPurchaseEntry = async (req, res) => {
  try {
    const { poRef, vendor, items, invoiceNumber, totalAmount, amountPaid, dueDate, companyId } = req.body;
    let invoiceUrl = '';

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an invoice document' });
    }

    invoiceUrl = `/${req.file.path.replace(/\\/g, '/')}`;

    // Parse items if passed as stringified JSON (usually standard for multipart form-data)
    let parsedItems = items;
    if (typeof items === 'string') {
      parsedItems = JSON.parse(items);
    }

    const numericTotal = Number(totalAmount);
    const numericPaid = Number(amountPaid || 0);
    const amountDue = numericTotal - numericPaid;

    let paymentStatus = 'Pending';
    if (numericPaid >= numericTotal) {
      paymentStatus = 'Paid';
    } else if (numericPaid > 0) {
      paymentStatus = 'Partial';
    }

    const entry = new PurchaseEntry({
      poRef: poRef || null,
      vendor,
      items: parsedItems,
      invoiceNumber,
      totalAmount: numericTotal,
      invoiceUrl,
      paymentStatus,
      amountPaid: numericPaid,
      amountDue,
      dueDate,
      addedBy: req.user._id,
      companyId: companyId || '6a0d837fd7ace7063e6a8379',
    });

    const createdEntry = await entry.save();

    // If there is a linked PO, mark it as Completed
    if (poRef) {
      await PurchaseOrder.findByIdAndUpdate(poRef, { status: 'Completed' });
    }

    res.status(201).json(createdEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Purchase Entries
// @route   GET /api/purchase-entries
// @access  Private
export const getPurchaseEntries = async (req, res) => {
  try {
    const entries = await PurchaseEntry.find({})
      .populate('vendor', 'name email gstNumber')
      .populate('poRef', 'poNumber')
      .populate('addedBy', 'name email')
      .populate('companyId');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record/Update payment for a purchase entry
// @route   PUT /api/purchase-entries/:id/payment
// @access  Private (Manager/Admin)
export const updatePurchaseEntryPayment = async (req, res) => {
  try {
    const { amountPaid: newPayment } = req.body; // Add this amount to existing amountPaid
    
    const entry = await PurchaseEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Purchase Entry not found' });
    }

    const additionalPayment = Number(newPayment);
    if (isNaN(additionalPayment) || additionalPayment <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    entry.amountPaid += additionalPayment;
    
    // Safety check in case it exceeds totalAmount
    if (entry.amountPaid > entry.totalAmount) {
      entry.amountPaid = entry.totalAmount;
    }

    entry.amountDue = entry.totalAmount - entry.amountPaid;

    if (entry.amountPaid >= entry.totalAmount) {
      entry.paymentStatus = 'Paid';
    } else if (entry.amountPaid > 0) {
      entry.paymentStatus = 'Partial';
    }

    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
