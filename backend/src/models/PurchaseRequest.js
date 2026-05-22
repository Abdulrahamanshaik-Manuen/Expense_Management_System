import mongoose from 'mongoose';

const purchaseRequestSchema = new mongoose.Schema(
  {
    itemDescription: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Domains & Hosting',
        'Cloud Servers',
        'Software Licenses',
        'API Services',
        'Laptops & Computers',
        'Office Furniture',
        'Networking Devices',
        'Office Equipment',
        'Other',
      ],
    },
    estimatedBudget: {
      type: Number,
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const PurchaseRequest = mongoose.model('PurchaseRequest', purchaseRequestSchema);

export default PurchaseRequest;
