import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import ExpenseCategory from './src/models/ExpenseCategory.js';
import Expense from './src/models/Expense.js';
import Vendor from './src/models/Vendor.js';
import Product from './src/models/Product.js';
import PurchaseRequest from './src/models/PurchaseRequest.js';
import PurchaseOrder from './src/models/PurchaseOrder.js';
import SaleInvoice from './src/models/SaleInvoice.js';

dotenv.config({ override: true });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    // Get admin user for references
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found. Run seedUsers.js first.');
      process.exit(1);
    }

    // ======== 1. EXPENSE CATEGORIES ========
    await ExpenseCategory.deleteMany({});
    const categories = await ExpenseCategory.insertMany([
      { name: 'Rent', description: 'Office and workspace rent' },
      { name: 'Utilities', description: 'Electricity, water, internet bills' },
      { name: 'Travel', description: 'Business travel and transportation' },
      { name: 'Office Supplies', description: 'Stationery, printer ink, etc.' },
      { name: 'Software', description: 'Software subscriptions and licenses' },
      { name: 'Marketing', description: 'Advertising and promotions' },
    ]);
    console.log(`Seeded ${categories.length} expense categories`);

    // ======== 2. EXPENSES ========
    await Expense.deleteMany({});
    const expenses = await Expense.insertMany([
      {
        title: 'January Office Rent',
        amount: 25000,
        category: categories[0]._id,
        date: new Date('2025-01-05'),
        paymentMethod: 'Bank Transfer',
        paidTo: 'ABC Realty',
        notes: 'Monthly office rent',
        addedBy: admin._id,
        paymentStatus: 'Paid',
      },
      {
        title: 'Internet Bill - January',
        amount: 2500,
        category: categories[1]._id,
        date: new Date('2025-01-10'),
        paymentMethod: 'UPI',
        paidTo: 'Airtel Broadband',
        notes: 'Monthly internet',
        addedBy: admin._id,
        paymentStatus: 'Paid',
      },
      {
        title: 'Client Meeting Travel',
        amount: 4500,
        category: categories[2]._id,
        date: new Date('2025-01-15'),
        paymentMethod: 'Card',
        paidTo: 'Uber',
        notes: 'Cab to client office and back',
        addedBy: admin._id,
        paymentStatus: 'Paid',
      },
      {
        title: 'Printer Cartridges',
        amount: 3200,
        category: categories[3]._id,
        date: new Date('2025-02-01'),
        paymentMethod: 'Cash',
        paidTo: 'Staples Store',
        notes: 'Black and color cartridges',
        addedBy: admin._id,
        paymentStatus: 'Pending',
      },
      {
        title: 'GitHub Team Plan',
        amount: 8000,
        category: categories[4]._id,
        date: new Date('2025-02-10'),
        paymentMethod: 'Card',
        paidTo: 'GitHub Inc.',
        notes: 'Annual team subscription',
        addedBy: admin._id,
        paymentStatus: 'Paid',
      },
      {
        title: 'Google Ads Campaign',
        amount: 15000,
        category: categories[5]._id,
        date: new Date('2025-03-01'),
        paymentMethod: 'Bank Transfer',
        paidTo: 'Google Ads',
        notes: 'March ad campaign',
        addedBy: admin._id,
        paymentStatus: 'Pending',
      },
      {
        title: 'February Office Rent',
        amount: 25000,
        category: categories[0]._id,
        date: new Date('2025-02-05'),
        paymentMethod: 'Bank Transfer',
        paidTo: 'ABC Realty',
        notes: 'Monthly office rent',
        addedBy: admin._id,
        paymentStatus: 'Paid',
      },
      {
        title: 'Electricity Bill - Feb',
        amount: 5800,
        category: categories[1]._id,
        date: new Date('2025-02-15'),
        paymentMethod: 'UPI',
        paidTo: 'State Electricity Board',
        notes: 'February electricity',
        addedBy: admin._id,
        paymentStatus: 'Paid',
      },
    ]);
    console.log(`Seeded ${expenses.length} expenses`);

    // ======== 3. VENDORS ========
    await Vendor.deleteMany({});
    const vendors = await Vendor.insertMany([
      {
        name: 'TechWorld Solutions',
        contactPerson: 'Rahul Sharma',
        email: 'rahul@techworld.com',
        phone: '9876543210',
        address: '12 MG Road, Bangalore',
        gstNumber: 'GST29ABCDE1234F1Z5',
        paymentTerms: 'Net 30',
      },
      {
        name: 'CloudServe India',
        contactPerson: 'Priya Patel',
        email: 'priya@cloudserve.in',
        phone: '9988776655',
        address: '45 Whitefield, Bangalore',
        gstNumber: 'GST29FGHIJ5678K2Z6',
        paymentTerms: 'Net 15',
      },
      {
        name: 'OfficeHub Supplies',
        contactPerson: 'Amit Kumar',
        email: 'amit@officehub.com',
        phone: '9112233445',
        address: '78 Koramangala, Bangalore',
        gstNumber: 'GST29LMNOP9012Q3Z7',
        paymentTerms: 'Net 30',
      },
    ]);
    console.log(`Seeded ${vendors.length} vendors`);

    // ======== 4. PRODUCTS ========
    await Product.deleteMany({});
    const products = await Product.insertMany([
      {
        name: 'E-Commerce Website',
        category: 'Website Development',
        price: 150000,
        description: 'Full-stack e-commerce website with payment gateway',
      },
      {
        name: 'Mobile App (Android + iOS)',
        category: 'Mobile App Development',
        price: 250000,
        description: 'Cross-platform mobile application',
      },
      {
        name: 'CRM Software',
        category: 'Software Development',
        price: 180000,
        description: 'Customer relationship management tool',
      },
      {
        name: 'Cloud Hosting (Annual)',
        category: 'SaaS Services',
        price: 60000,
        description: 'Annual cloud hosting plan with SSL',
      },
      {
        name: 'REST API Integration',
        category: 'API Services',
        price: 45000,
        description: 'Third-party API integration service',
      },
      {
        name: 'Monthly Maintenance',
        category: 'Maintenance Services',
        price: 15000,
        description: 'Monthly website and server maintenance',
      },
    ]);
    console.log(`Seeded ${products.length} products`);

    // ======== 5. PURCHASE REQUESTS ========
    await PurchaseRequest.deleteMany({});
    const purchaseRequests = await PurchaseRequest.insertMany([
      {
        itemDescription: 'AWS Server for Production',
        category: 'Cloud Servers',
        estimatedBudget: 50000,
        requestedBy: admin._id,
        remarks: 'Need for new client project deployment',
      },
      {
        itemDescription: 'Domain name - clientproject.com',
        category: 'Domains & Hosting',
        estimatedBudget: 1200,
        requestedBy: admin._id,
        remarks: 'Client domain purchase',
      },
      {
        itemDescription: 'Adobe Creative Cloud License',
        category: 'Software Licenses',
        estimatedBudget: 28000,
        requestedBy: admin._id,
        remarks: 'Design team needs access',
      },
      {
        itemDescription: 'Dell Laptop for New Developer',
        category: 'Laptops & Computers',
        estimatedBudget: 85000,
        requestedBy: admin._id,
        remarks: 'New hire starting next month',
      },
      {
        itemDescription: 'Office Chairs (5 units)',
        category: 'Office Furniture',
        estimatedBudget: 35000,
        requestedBy: admin._id,
        remarks: 'Ergonomic chairs for the team',
      },
    ]);
    console.log(`Seeded ${purchaseRequests.length} purchase requests`);

    // ======== 6. PURCHASE ORDERS ========
    await PurchaseOrder.deleteMany({});
    const purchaseOrders = await PurchaseOrder.insertMany([
      {
        poNumber: 'PO-20250101-001',
        vendor: vendors[0]._id,
        items: [
          { name: 'AWS EC2 Instance (1 Year)', quantity: 1, price: 45000, taxRate: 18 },
          { name: 'SSL Certificate', quantity: 2, price: 2500, taxRate: 18 },
        ],
        taxAmount: 9000,
        totalAmount: 59000,
        status: 'Completed',
        createdBy: admin._id,
      },
      {
        poNumber: 'PO-20250115-002',
        vendor: vendors[1]._id,
        items: [
          { name: 'Cloud Storage (500GB)', quantity: 1, price: 12000, taxRate: 18 },
        ],
        taxAmount: 2160,
        totalAmount: 14160,
        status: 'Sent',
        createdBy: admin._id,
      },
      {
        poNumber: 'PO-20250201-003',
        vendor: vendors[2]._id,
        items: [
          { name: 'Ergonomic Office Chair', quantity: 5, price: 7000, taxRate: 18 },
          { name: 'Standing Desk', quantity: 2, price: 15000, taxRate: 18 },
        ],
        taxAmount: 11700,
        totalAmount: 76700,
        status: 'Draft',
        createdBy: admin._id,
      },
    ]);
    console.log(`Seeded ${purchaseOrders.length} purchase orders`);

    // ======== 7. SALES INVOICES ========
    await SaleInvoice.deleteMany({});
    const salesInvoices = await SaleInvoice.insertMany([
      {
        invoiceNumber: 'INV-20250110-001',
        customerName: 'Ramesh Gupta',
        customerCompany: 'Gupta Enterprises',
        customerPhone: '9876501234',
        customerEmail: 'ramesh@guptaent.com',
        customerAddress: '23 Park Street, Delhi',
        customerGst: 'GST07XYZAB1234C1D2',
        items: [
          { name: 'E-Commerce Website', quantity: 1, price: 150000, discount: 5000, taxRate: 18 },
        ],
        taxAmount: 26100,
        discountAmount: 5000,
        totalAmount: 171100,
        paymentStatus: 'Paid',
        amountPaid: 171100,
        amountDue: 0,
        dueDate: new Date('2025-02-10'),
        createdBy: admin._id,
      },
      {
        invoiceNumber: 'INV-20250120-002',
        customerName: 'Sneha Reddy',
        customerCompany: 'Reddy Tech Pvt Ltd',
        customerPhone: '8765432109',
        customerEmail: 'sneha@reddytech.com',
        customerAddress: '56 Jubilee Hills, Hyderabad',
        customerGst: 'GST36PQRST5678U3V4',
        items: [
          { name: 'Mobile App (Android + iOS)', quantity: 1, price: 250000, discount: 10000, taxRate: 18 },
          { name: 'Monthly Maintenance (3 months)', quantity: 3, price: 15000, discount: 0, taxRate: 18 },
        ],
        taxAmount: 51300,
        discountAmount: 10000,
        totalAmount: 336300,
        paymentStatus: 'Partial',
        amountPaid: 200000,
        amountDue: 136300,
        dueDate: new Date('2025-03-20'),
        createdBy: admin._id,
      },
      {
        invoiceNumber: 'INV-20250205-003',
        customerName: 'Vikram Singh',
        customerCompany: 'Singh Solutions',
        customerPhone: '7654321098',
        customerEmail: 'vikram@singhsol.com',
        customerAddress: '89 Banjara Hills, Hyderabad',
        items: [
          { name: 'CRM Software', quantity: 1, price: 180000, discount: 0, taxRate: 18 },
          { name: 'REST API Integration', quantity: 2, price: 45000, discount: 2000, taxRate: 18 },
        ],
        taxAmount: 48240,
        discountAmount: 2000,
        totalAmount: 316240,
        paymentStatus: 'Pending',
        amountPaid: 0,
        amountDue: 316240,
        dueDate: new Date('2025-04-05'),
        createdBy: admin._id,
      },
      {
        invoiceNumber: 'INV-20250301-004',
        customerName: 'Anita Desai',
        customerCompany: 'Desai Corp',
        customerPhone: '6543210987',
        customerEmail: 'anita@desaicorp.com',
        customerAddress: '12 Connaught Place, Delhi',
        items: [
          { name: 'Cloud Hosting (Annual)', quantity: 1, price: 60000, discount: 0, taxRate: 18 },
        ],
        taxAmount: 10800,
        discountAmount: 0,
        totalAmount: 70800,
        paymentStatus: 'Paid',
        amountPaid: 70800,
        amountDue: 0,
        dueDate: new Date('2025-03-31'),
        createdBy: admin._id,
      },
    ]);
    console.log(`Seeded ${salesInvoices.length} sales invoices`);

    console.log('\nAll sample data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

seedData();
