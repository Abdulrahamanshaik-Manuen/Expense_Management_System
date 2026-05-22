import ExpenseCategory from '../models/ExpenseCategory.js';
import Expense from '../models/Expense.js';

// @desc    Create a new expense category
// @route   POST /api/expense-categories
// @access  Private (Admin Only)
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const categoryExists = await ExpenseCategory.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new ExpenseCategory({ name, description });
    const createdCategory = await category.save();

    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all expense categories
// @route   GET /api/expense-categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an expense category
// @route   PUT /api/expense-categories/:id
// @access  Private (Admin Only)
export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = name || category.name;
    category.description = description || category.description;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an expense category
// @route   DELETE /api/expense-categories/:id
// @access  Private (Admin Only)
export const deleteCategory = async (req, res) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Prevent deletion if expenses are already linked to this category
    const expensesLinked = await Expense.findOne({ category: req.params.id });
    if (expensesLinked) {
      return res.status(400).json({ message: 'Cannot delete category with linked expenses' });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
