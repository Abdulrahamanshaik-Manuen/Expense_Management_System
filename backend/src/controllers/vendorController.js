import Vendor from '../models/Vendor.js';

// @desc    Register a new vendor
// @route   POST /api/vendors
// @access  Private (Admin Only)
export const createVendor = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address, gstNumber, paymentTerms, bankName, accountNumber, ifscCode, accountHolderName } = req.body;

    const vendorExists = await Vendor.findOne({ name });
    if (vendorExists) {
      return res.status(400).json({ message: 'Vendor with this name already exists' });
    }

    const vendor = new Vendor({
      name,
      contactPerson,
      email,
      phone,
      address,
      gstNumber,
      paymentTerms,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
    });

    const createdVendor = await vendor.save();
    res.status(201).json(createdVendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({});
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private
export const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a vendor
// @route   PUT /api/vendors/:id
// @access  Private (Admin Only)
export const updateVendor = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address, gstNumber, paymentTerms, bankName, accountNumber, ifscCode, accountHolderName } = req.body;

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    vendor.name = name || vendor.name;
    vendor.contactPerson = contactPerson || vendor.contactPerson;
    vendor.email = email || vendor.email;
    vendor.phone = phone || vendor.phone;
    vendor.address = address || vendor.address;
    vendor.gstNumber = gstNumber || vendor.gstNumber;
    vendor.paymentTerms = paymentTerms || vendor.paymentTerms;
    
    // Explicitly update bank account details if they are provided, otherwise keep existing values
    if (bankName !== undefined) vendor.bankName = bankName;
    if (accountNumber !== undefined) vendor.accountNumber = accountNumber;
    if (ifscCode !== undefined) vendor.ifscCode = ifscCode;
    if (accountHolderName !== undefined) vendor.accountHolderName = accountHolderName;

    const updatedVendor = await vendor.save();
    res.json(updatedVendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a vendor
// @route   DELETE /api/vendors/:id
// @access  Private (Admin Only)
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await vendor.deleteOne();
    res.json({ message: 'Vendor removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
