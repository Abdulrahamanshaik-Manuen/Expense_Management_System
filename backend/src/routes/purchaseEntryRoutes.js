import express from 'express';
import {
  createPurchaseEntry,
  getPurchaseEntries,
  updatePurchaseEntryPayment,
} from '../controllers/purchaseEntryController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Multipurpose directory upload path config
const invoiceUpload = upload.fields([
  { name: 'invoice', maxCount: 1 },
  { name: 'supportingDocs', maxCount: 5 }
]);

router.route('/')
  .post(protect, upload.single('invoice'), createPurchaseEntry)
  .get(protect, getPurchaseEntries);

router.route('/:id/payment')
  .put(protect, updatePurchaseEntryPayment);

export default router;
