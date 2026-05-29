import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoicePayment,
  deleteInvoice,
  downloadInvoice,
  updateInvoice,
} from '../controllers/invoiceController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createInvoice)
  .get(protect, getInvoices);

router.route('/:id')
  .get(protect, getInvoiceById)
  .put(protect, updateInvoice)
  .delete(protect, authorizeRoles('admin'), deleteInvoice);

router.route('/:id/payment')
  .put(protect, updateInvoicePayment);

router.route('/:id/download')
  .get(protect, downloadInvoice);

export default router;
