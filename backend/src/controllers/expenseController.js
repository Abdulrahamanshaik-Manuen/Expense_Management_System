import Expense from '../models/Expense.js';

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private (Manager/Admin)
export const createExpense = async (req, res) => {
  try {
    const { title, amount, category, date, paymentMethod, paidTo, notes, paymentStatus, companyId } = req.body;
    let receiptUrl = '';

    if (req.file) {
      receiptUrl = `/${req.file.path.replace(/\\/g, '/')}`; // Ensure proper slash format
    }

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
    let query = {};

    const expenses = await Expense.find(query)
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
    if (date !== undefined) expense.date = date;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (paidTo !== undefined) expense.paidTo = paidTo;
    if (notes !== undefined) expense.notes = notes;
    if (paymentStatus !== undefined) expense.paymentStatus = paymentStatus;
    if (companyId !== undefined) expense.companyId = companyId;

    if (req.file) {
      expense.receiptUrl = `/${req.file.path.replace(/\\/g, '/')}`;
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

