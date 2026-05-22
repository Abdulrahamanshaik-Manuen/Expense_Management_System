import express from 'express';
import {
  createPurchaseRequest,
  getPurchaseRequests,
  updatePurchaseRequestStatus,
  deletePurchaseRequest,
} from '../controllers/purchaseRequestController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createPurchaseRequest)
  .get(protect, getPurchaseRequests);

router.route('/:id/status')
  .put(protect, authorizeRoles('admin'), updatePurchaseRequestStatus);

router.route('/:id')
  .delete(protect, deletePurchaseRequest);

export default router;
