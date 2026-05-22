import express from 'express';
import {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
} from '../controllers/vendorController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('admin'), createVendor)
  .get(protect, getVendors);

router.route('/:id')
  .get(protect, getVendorById)
  .put(protect, authorizeRoles('admin'), updateVendor)
  .delete(protect, authorizeRoles('admin'), deleteVendor);

export default router;
