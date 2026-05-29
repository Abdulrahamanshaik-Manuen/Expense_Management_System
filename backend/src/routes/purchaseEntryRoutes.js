import express from 'express';
import {
  createPurchaseEntry,
  getPurchaseEntries,
  updatePurchaseEntry,
  deletePurchaseEntry,
  downloadPurchaseVoucher,
  updatePurchaseEntryPayment,
} from '../controllers/purchaseEntryController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, upload.single('invoice'), createPurchaseEntry)
  .get(protect, getPurchaseEntries);

router.route('/:id')
  .put(protect, upload.single('invoice'), updatePurchaseEntry)
  .delete(protect, deletePurchaseEntry);

router.route('/:id/download')
  .get(protect, downloadPurchaseVoucher);

router.route('/:id/payment')
  .put(protect, updatePurchaseEntryPayment);

export default router;
