import mongoose from 'mongoose';

const purchaseEntrySchema = new mongoose.Schema(
  {
    poRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    purchaseVoucherNumber: {
      type: String,
      unique: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Supplier Information Snapshot (for historical records)
    supplierName: {
      type: String,
      required: true,
    },
    supplierGSTIN: {
      type: String,
    },
    supplierMobileNumber: {
      type: String,
    },
    supplierEmail: {
      type: String,
    },
    supplierAddress: {
      type: String,
    },
    // Item Details (Strictly excluding GST and HSN/SAC codes)
    items: [
      {
        name: { type: String, required: true },
        code: { type: String },
        quantity: { type: Number, required: true },
        unit: { type: String, default: 'Pcs' },
        price: { type: Number, required: true }, // Unit Price
        discountType: { type: String, enum: ['percentage', 'amount'], default: 'percentage' },
        discountValue: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        totalItemAmount: { type: Number, required: true },
      },
    ],
    // Additional Overhead Charges
    transportationCharges: {
      type: Number,
      default: 0,
    },
    packingCharges: {
      type: Number,
      default: 0,
    },
    loadingUnloadingCharges: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },
    // Summary Fields
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      required: true,
      default: 0,
    },
    additionalChargesTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    // Legacy support field (totalAmount)
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    // Payment details
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Partial'],
      default: 'Unpaid',
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit'],
      default: 'Cash',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    amountDue: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentReferenceNumber: {
      type: String,
    },
    // Additional notes & file
    notes: {
      type: String,
    },
    invoiceUrl: {
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanySetting',
      default: '6a0d837fd7ace7063e6a8379',
    },
  },
  {
    timestamps: true,
  }
);

const PurchaseEntry = mongoose.model('PurchaseEntry', purchaseEntrySchema);

export default PurchaseEntry;
