import mongoose from 'mongoose';

const saleInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    // Inline Customer Details
    customerName: {
      type: String,
      required: true,
    },
    customerCompany: {
      type: String,
    },
    customerPhone: {
      type: String,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerAddress: {
      type: String,
    },
    customerGst: {
      type: String,
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
        discount: { type: Number, default: 0 }, // Flat discount value
        taxRate: { type: Number, default: 18 }, // GST %
      },
    ],
    taxAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
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
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    pdfUrl: {
      type: String,
    },
    createdBy: {
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

const SaleInvoice = mongoose.model('SaleInvoice', saleInvoiceSchema);

export default SaleInvoice;
