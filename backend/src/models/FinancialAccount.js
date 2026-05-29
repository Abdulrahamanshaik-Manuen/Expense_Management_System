import mongoose from 'mongoose';

const financialAccountSchema = new mongoose.Schema(
  {
    accountName: {
      type: String,
      enum: [
        'Purchase Account',
        'Sales Account',
        'Accounts Payable',
        'Accounts Receivable',
        'Cash/Bank',
        'Transportation Expense',
        'Packing Expense',
        'Loading Expense',
        'Other Expense',
      ],
      required: true,
    },
    debit: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
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
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const FinancialAccount = mongoose.model('FinancialAccount', financialAccountSchema);

export default FinancialAccount;
