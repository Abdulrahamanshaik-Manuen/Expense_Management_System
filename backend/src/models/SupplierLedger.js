import mongoose from 'mongoose';

const supplierLedgerSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    purchaseEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseEntry',
    },
    transactionType: {
      type: String,
      enum: ['Purchase', 'Payment'],
      required: true,
    },
    voucherNo: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    debit: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const SupplierLedger = mongoose.model('SupplierLedger', supplierLedgerSchema);

export default SupplierLedger;
