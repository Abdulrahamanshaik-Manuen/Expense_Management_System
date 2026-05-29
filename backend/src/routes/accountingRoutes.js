import express from 'express';
import { getSupplierLedger, getFinancialsReport } from '../controllers/accountingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Supplier Ledger route (Protected)
router.route('/vendors/:id/ledger')
  .get(protect, getSupplierLedger);

// Dynamic P&L Financial Report route (Protected)
router.route('/reports/financials')
  .get(protect, getFinancialsReport);

export default router;
