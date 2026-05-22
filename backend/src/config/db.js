import mongoose from 'mongoose';
import ExpenseCategory from '../models/ExpenseCategory.js';

const seedDefaultCategories = async () => {
  try {
    const defaultCategories = [
      { name: 'Office Rent', description: 'Monthly rent for corporate office spaces' },
      { name: 'Electricity Bill', description: 'Electric power utilities' },
      { name: 'Water Bill', description: 'Water and sewage utilities' },
      { name: 'Internet Bill', description: 'Office broadband, servers bandwidth, and cloud connectivity' },
      { name: 'Fuel Charges', description: 'Vehicular fuel and logistics transportation travel costs' },
      { name: 'Office Maintenance', description: 'Repairs, cleanings, and infrastructure updates' },
      { name: 'Staff Welfare', description: 'Employee benefits, team lunches, and event hosting' },
      { name: 'Miscellaneous', description: 'Other unclassified operational daily expenditures' },
    ];

    for (const category of defaultCategories) {
      await ExpenseCategory.updateOne(
        { name: category.name },
        { $setOnInsert: category },
        { upsert: true }
      );
    }
    console.log('Seeded default expense categories successfully.');
  } catch (error) {
    console.error(`Category seeding failed: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_management');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed standard categories on connection success
    await seedDefaultCategories();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
