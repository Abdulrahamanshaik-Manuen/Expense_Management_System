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
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        taxRate: { type: Number, default: 18 },
        warrantyMonths: { type: Number, default: 0 },
      },
    ],
    invoiceNumber: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    invoiceUrl: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial'],
      default: 'Pending',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    amountDue: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
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
    supportingDocs: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PurchaseEntry = mongoose.model('PurchaseEntry', purchaseEntrySchema);

export default PurchaseEntry;
