import mongoose from 'mongoose';

const companySettingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      default: 'MANUEN INFOTECH',
    },
    address: {
      type: String,
      required: true,
      default: 'Vaarahi Enclave, 6/13 Brodipet, Guntur-2',
    },
    mobile: {
      type: String,
      required: true,
      default: '799-700-1144',
    },
    phone: {
      type: String,
      required: true,
      default: '0863-2223115, 2330548',
    },
    gstNumber: {
      type: String,
      required: true,
      default: '37AAUCM1990N1ZH',
    },
    accountHolderName: {
      type: String,
      required: true,
      default: 'MANUEN INFOTECH (OPC)',
    },
    bankName: {
      type: String,
      required: true,
      default: 'HDFC BANK',
    },
    accountNumber: {
      type: String,
      required: true,
      default: '50200118677718',
    },
    ifscCode: {
      type: String,
      required: true,
      default: 'Kothapet & HDFC0004266',
    },
    defaultHsnCode: {
      type: String,
      required: true,
      default: '998361',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    logoSquareUrl: {
      type: String,
      default: '',
    },
    noteText: {
      type: String,
      required: true,
      default: 'Please send payment within 30 days of receiving this invoice. There will be 10% interest charge per month on late invoice.',
    },
    currency: {
      type: String,
      enum: ['INR'],
      default: 'INR',
    },
  },
  {
    timestamps: true,
  }
);

const CompanySetting = mongoose.model('CompanySetting', companySettingSchema);

export default CompanySetting;
