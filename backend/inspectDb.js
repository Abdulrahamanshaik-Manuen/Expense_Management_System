import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CompanySetting from './src/models/CompanySetting.js';
import Expense from './src/models/Expense.js';
import SaleInvoice from './src/models/SaleInvoice.js';
import PurchaseOrder from './src/models/PurchaseOrder.js';

// Notice the override: true
dotenv.config({ path: './.env', override: true });

const inspect = async () => {
  const uris = [
    process.env.MONGO_URI,
    'mongodb://127.0.0.1:27017/expense_management'
  ];
  
  for (const uri of uris) {
    if (!uri) continue;
    try {
      console.log(`Trying to connect to: ${uri}`);
      await mongoose.connect(uri);
      console.log('Connected successfully!');
      
      const settings = await CompanySetting.find({});
      console.log('--- COMPANY SETTINGS ---');
      settings.forEach(s => {
        console.log(`ID: ${s._id}, Name: ${s.companyName}, GST: ${s.gstNumber}`);
      });
      
      const expCount = await Expense.countDocuments({});
      const invCount = await SaleInvoice.countDocuments({});
      const poCount = await PurchaseOrder.countDocuments({});
      console.log(`Expenses count: ${expCount}`);
      console.log(`SaleInvoices count: ${invCount}`);
      console.log(`PurchaseOrders count: ${poCount}`);

      process.exit(0);
    } catch (err) {
      console.error(`Failed to connect to ${uri}: ${err.message}`);
    }
  }
  process.exit(1);
};

inspect();
