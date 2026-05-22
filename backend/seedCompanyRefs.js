import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CompanySetting from './src/models/CompanySetting.js';
import Expense from './src/models/Expense.js';
import SaleInvoice from './src/models/SaleInvoice.js';
import PurchaseOrder from './src/models/PurchaseOrder.js';
import PurchaseEntry from './src/models/PurchaseEntry.js';

// Load environmental variables with override enabled
dotenv.config({ path: './.env', override: true });

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_management';
    console.log(`Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to Database successfully!');

    const defaultCompanyId = '6a0d837fd7ace7063e6a8379'; // MANUEN INFOTECH
    
    // Verify default company exists
    const company = await CompanySetting.findById(defaultCompanyId);
    if (!company) {
      console.error(`Error: Default company with ID ${defaultCompanyId} not found in CompanySetting!`);
      process.exit(1);
    }
    console.log(`Verified default company: ${company.companyName} (${company._id})`);

    // Migrate Expenses
    const expRes = await Expense.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompanyId } }
    );
    console.log(`Expenses seeded: updated ${expRes.modifiedCount} documents (matched: ${expRes.matchedCount})`);

    // Migrate SaleInvoices
    const salesRes = await SaleInvoice.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompanyId } }
    );
    console.log(`SaleInvoices seeded: updated ${salesRes.modifiedCount} documents (matched: ${salesRes.matchedCount})`);

    // Migrate PurchaseOrders
    const poRes = await PurchaseOrder.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompanyId } }
    );
    console.log(`PurchaseOrders seeded: updated ${poRes.modifiedCount} documents (matched: ${poRes.matchedCount})`);

    // Migrate PurchaseEntries
    const peRes = await PurchaseEntry.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: defaultCompanyId } }
    );
    console.log(`PurchaseEntries seeded: updated ${peRes.modifiedCount} documents (matched: ${peRes.matchedCount})`);

    console.log('Database seeding/migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

seed();
