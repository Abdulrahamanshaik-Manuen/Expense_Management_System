import express from 'express';
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/expenseCategoryController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('admin'), createCategory)
  .get(protect, getCategories);

router.route('/:id')
  .put(protect, authorizeRoles('admin'), updateCategory)
  .delete(protect, authorizeRoles('admin'), deleteCategory);

export default router;
