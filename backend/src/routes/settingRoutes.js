import express from 'express';
import asyncHandler from 'express-async-handler';
import CompanySetting from '../models/CompanySetting.js';
import { protect } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// @desc    Get all company invoice setting profiles
// @route   GET /api/settings
// @access  Private
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    let settingsList = await CompanySetting.find().sort({ createdAt: -1 });
    if (settingsList.length === 0) {
      // Create a default company profile if none exist
      const defaultSettings = await CompanySetting.create({});
      settingsList = [defaultSettings];
    }
    res.json(settingsList);
  })
);

// @desc    Create a new company setting profile (includes logo uploads)
// @route   POST /api/settings
// @access  Private
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'logoSquare', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const {
      companyName,
      address,
      mobile,
      phone,
      gstNumber,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      defaultHsnCode,
      noteText,
      currency,
    } = req.body;

    const settings = new CompanySetting({
      companyName: companyName || 'MANUEN INFOTECH',
      address: address || 'Vaarahi Enclave, 6/13 Brodipet, Guntur-2',
      mobile: mobile || '799-700-1144',
      phone: phone || '0863-2223115, 2330548',
      gstNumber: gstNumber || '37AAUCM1990N1ZH',
      accountHolderName: accountHolderName || 'MANUEN INFOTECH (OPC)',
      bankName: bankName || 'HDFC BANK',
      accountNumber: accountNumber || '50200118677718',
      ifscCode: ifscCode || 'Kothapet & HDFC0004266',
      defaultHsnCode: defaultHsnCode || '998361',
      noteText: noteText || 'Please send payment within 30 days of receiving this invoice.',
      currency: currency || 'INR',
    });

    if (req.files) {
      if (req.files['logo'] && req.files['logo'][0]) {
        settings.logoUrl = `/uploads/${req.files['logo'][0].filename}`;
      }
      if (req.files['logoSquare'] && req.files['logoSquare'][0]) {
        settings.logoSquareUrl = `/uploads/${req.files['logoSquare'][0].filename}`;
      }
    }

    const createdSettings = await settings.save();
    res.status(201).json(createdSettings);
  })
);

// @desc    Update a specific company setting profile (includes logo uploads)
// @route   PUT /api/settings/:id
// @access  Private
router.put(
  '/:id',
  protect,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'logoSquare', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const settings = await CompanySetting.findById(req.params.id);
    if (!settings) {
      res.status(404);
      throw new Error('Company setting profile not found');
    }

    const {
      companyName,
      address,
      mobile,
      phone,
      gstNumber,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      defaultHsnCode,
      noteText,
      currency,
    } = req.body;

    if (companyName !== undefined) settings.companyName = companyName;
    if (address !== undefined) settings.address = address;
    if (mobile !== undefined) settings.mobile = mobile;
    if (phone !== undefined) settings.phone = phone;
    if (gstNumber !== undefined) settings.gstNumber = gstNumber;
    if (accountHolderName !== undefined) settings.accountHolderName = accountHolderName;
    if (bankName !== undefined) settings.bankName = bankName;
    if (accountNumber !== undefined) settings.accountNumber = accountNumber;
    if (ifscCode !== undefined) settings.ifscCode = ifscCode;
    if (defaultHsnCode !== undefined) settings.defaultHsnCode = defaultHsnCode;
    if (noteText !== undefined) settings.noteText = noteText;
    if (currency !== undefined) settings.currency = currency;

    if (req.files) {
      if (req.files['logo'] && req.files['logo'][0]) {
        settings.logoUrl = `/uploads/${req.files['logo'][0].filename}`;
      }
      if (req.files['logoSquare'] && req.files['logoSquare'][0]) {
        settings.logoSquareUrl = `/uploads/${req.files['logoSquare'][0].filename}`;
      }
    }

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  })
);

// @desc    Delete a specific company setting profile
// @route   DELETE /api/settings/:id
// @access  Private
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const settings = await CompanySetting.findById(req.params.id);
    if (!settings) {
      res.status(404);
      throw new Error('Company setting profile not found');
    }

    const totalProfiles = await CompanySetting.countDocuments();
    if (totalProfiles <= 1) {
      res.status(400);
      throw new Error('Cannot delete the last remaining company profile. The system requires at least one profile.');
    }

    await settings.deleteOne();
    res.json({ message: 'Company profile removed successfully' });
  })
);

export default router;
