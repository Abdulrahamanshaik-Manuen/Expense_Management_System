import express from 'express';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  downloadPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from '../controllers/purchaseOrderController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('admin'), createPurchaseOrder)
  .get(protect, getPurchaseOrders);

router.route('/:id')
  .get(protect, getPurchaseOrderById)
  .put(protect, authorizeRoles('admin'), updatePurchaseOrder)
  .delete(protect, authorizeRoles('admin'), deletePurchaseOrder);

router.route('/:id/status')
  .put(protect, authorizeRoles('admin'), updatePurchaseOrderStatus);

// Unified download endpoint (same pattern as invoices)
router.route('/:id/download')
  .get(protect, downloadPurchaseOrder);

export default router;
