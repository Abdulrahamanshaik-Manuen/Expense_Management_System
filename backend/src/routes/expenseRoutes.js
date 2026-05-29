import express from 'express';
import {
  createExpense,
  getExpenses,
  updateExpenseStatus,
  updateExpensePaymentStatus,
  deleteExpense,
  updateExpense,
} from '../controllers/expenseController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, upload.single('receipt'), createExpense)
  .get(protect, getExpenses);

router.route('/:id/status')
  .put(protect, authorizeRoles('admin'), updateExpenseStatus);

router.route('/:id/payment')
  .put(protect, updateExpensePaymentStatus);

router.route('/:id')
  .put(protect, upload.single('receipt'), updateExpense)
  .delete(protect, authorizeRoles('admin'), deleteExpense);

export default router;
