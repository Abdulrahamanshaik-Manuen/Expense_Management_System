import Expense from '../models/Expense.js';
import { generateExpenseVoucherBuffer } from '../utils/generateInvoice.js';

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private (Manager/Admin)
export const createExpense = async (req, res) => {
  try {
    const { title, amount, category, date, paymentMethod, paidTo, notes, paymentStatus, companyId } = req.body;
    let receiptUrl = '';

    if (req.file) {
      const base64Data = req.file.buffer.toString('base64');
      receiptUrl = `data:${req.file.mimetype};base64,${base64Data}`;
    }

    const expenseDate = date ? new Date(date) : new Date();
    const year = expenseDate.getFullYear();
    const month = expenseDate.getMonth();
    const day = expenseDate.getDate();

    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    const count = await Expense.countDocuments({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    const serial = String(count + 1).padStart(3, '0');
    const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    const voucherNo = `EXP${dateStr}${serial}`;

    const expense = new Expense({
      title,
      amount: Number(amount),
      category,
      date,
      paymentMethod,
      paidTo,
      notes,
      receiptUrl,
      paymentStatus: paymentStatus || 'Pending',
      addedBy: req.user._id,
      companyId: companyId || '6a0d837fd7ace7063e6a8379',
      voucherNo,
    });

    const createdExpense = await expense.save();
    
    // Return populated category name
    const populated = await createdExpense.populate([
      { path: 'category', select: 'name' },
      { path: 'companyId' }
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    // Migration: populate voucherNo for legacy expenses
    const legacyExpenses = await Expense.find({
      $or: [
        { voucherNo: { $exists: false } },
        { voucherNo: '' },
        { voucherNo: null }
      ]
    }).sort({ date: 1, createdAt: 1 });

    for (const exp of legacyExpenses) {
      const expenseDate = new Date(exp.date);
      const year = expenseDate.getFullYear();
      const month = expenseDate.getMonth();
      const day = expenseDate.getDate();

      const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

      const count = await Expense.countDocuments({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        _id: { $ne: exp._id },
        voucherNo: { $exists: true, $ne: '' }
      });

      const serial = String(count + 1).padStart(3, '0');
      const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
      exp.voucherNo = `EXP${dateStr}${serial}`;
      await exp.save();
    }

    let query = {};

    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('addedBy', 'name email')
      .populate('category', 'name description')
      .populate('companyId');
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expense approval status
// @route   PUT /api/expenses/:id/status
// @access  Private (Admin Only)
export const updateExpenseStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    expense.status = status;
    const updatedExpense = await expense.save();
    
    const populated = await updatedExpense.populate([
      { path: 'addedBy', select: 'name email' },
      { path: 'category', select: 'name' },
      { path: 'companyId' }
    ]);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expense payment status
// @route   PUT /api/expenses/:id/payment
// @access  Private (Manager/Admin)
export const updateExpensePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body; // 'Pending' or 'Paid'

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    expense.paymentStatus = paymentStatus;
    const updatedExpense = await expense.save();

    const populated = await updatedExpense.populate([
      { path: 'addedBy', select: 'name email' },
      { path: 'category', select: 'name' },
      { path: 'companyId' }
    ]);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin Only)
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an existing expense
// @route   PUT /api/expenses/:id
// @access  Private (Manager/Admin)
export const updateExpense = async (req, res) => {
  try {
    const { title, amount, category, date, paymentMethod, paidTo, notes, paymentStatus, companyId } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (title !== undefined) expense.title = title;
    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = category;
    
    if (date !== undefined) {
      const oldDate = new Date(expense.date).toISOString().split('T')[0];
      const newDate = new Date(date).toISOString().split('T')[0];
      
      if (oldDate !== newDate) {
        expense.date = date;
        
        // Recalculate voucherNo
        const expenseDate = new Date(date);
        const year = expenseDate.getFullYear();
        const month = expenseDate.getMonth();
        const day = expenseDate.getDate();

        const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

        const count = await Expense.countDocuments({
          date: {
            $gte: startOfDay,
            $lte: endOfDay
          },
          _id: { $ne: expense._id }
        });

        const serial = String(count + 1).padStart(3, '0');
        const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
        expense.voucherNo = `EXP${dateStr}${serial}`;
      } else {
        expense.date = date;
      }
    }
    
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (paidTo !== undefined) expense.paidTo = paidTo;
    if (notes !== undefined) expense.notes = notes;
    if (paymentStatus !== undefined) expense.paymentStatus = paymentStatus;
    if (companyId !== undefined) expense.companyId = companyId;

    if (!expense.voucherNo) {
      const expenseDate = new Date(expense.date);
      const year = expenseDate.getFullYear();
      const month = expenseDate.getMonth();
      const day = expenseDate.getDate();

      const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

      const count = await Expense.countDocuments({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        _id: { $ne: expense._id },
        voucherNo: { $exists: true, $ne: '' }
      });

      const serial = String(count + 1).padStart(3, '0');
      const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
      expense.voucherNo = `EXP${dateStr}${serial}`;
    }

    if (req.file) {
      const base64Data = req.file.buffer.toString('base64');
      expense.receiptUrl = `data:${req.file.mimetype};base64,${base64Data}`;
    }

    const updatedExpense = await expense.save();
    
    const populated = await updatedExpense.populate([
      { path: 'category', select: 'name' },
      { path: 'companyId' }
    ]);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download an Expense Voucher as PDF
// @route   GET /api/expenses/:id/download
// @access  Private
export const downloadExpenseVoucher = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('category', 'name')
      .populate('companyId');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    const pdfBuffer = await generateExpenseVoucherBuffer(expense);
    const ref = expense.voucherNo || `EXP-${expense._id.toString().slice(-6).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Expense_Voucher_${ref}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

