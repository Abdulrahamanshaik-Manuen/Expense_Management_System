import SupplierLedger from '../models/SupplierLedger.js';
import FinancialAccount from '../models/FinancialAccount.js';
import SaleInvoice from '../models/SaleInvoice.js';
import Expense from '../models/Expense.js';

// @desc    Get ledger statement for a specific vendor
// @route   GET /api/vendors/:id/ledger
// @access  Private
export const getSupplierLedger = async (req, res) => {
  try {
    const ledger = await SupplierLedger.find({ vendor: req.params.id })
      .populate('purchaseEntry', 'purchaseVoucherNumber invoiceNumber totalAmount amountPaid paymentStatus')
      .sort({ date: 1, createdAt: 1 });
      
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dynamic Profit & Loss and Account balances
// @route   GET /api/reports/financials
// @access  Private
export const getFinancialsReport = async (req, res) => {
  try {
    // 1. Profit & Loss Aggregates
    // Sales Revenue (from Sales Invoices)
    const salesInvoices = await SaleInvoice.find({});
    const salesRevenue = salesInvoices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // Purchases Expense (from Financial Account Debit balances on 'Purchase Account')
    const purchaseAccounts = await FinancialAccount.find({ accountName: 'Purchase Account' });
    const purchasesExpense = purchaseAccounts.reduce((sum, a) => sum + (a.debit || 0), 0);

    // Standard Business Expenses (from Expense collection)
    const rawExpenses = await Expense.find({ paymentStatus: 'Paid' });
    const businessExpenses = rawExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Procurement specific expenses (Transportation, Packing, Loading, Others)
    const procurementAccounts = await FinancialAccount.find({
      accountName: { $in: ['Transportation Expense', 'Packing Expense', 'Loading Expense', 'Other Expense'] }
    });
    
    let transportExpense = 0;
    let packingExpense = 0;
    let loadingExpense = 0;
    let miscProcureExpense = 0;

    procurementAccounts.forEach(acc => {
      if (acc.accountName === 'Transportation Expense') transportExpense += acc.debit;
      if (acc.accountName === 'Packing Expense') packingExpense += acc.debit;
      if (acc.accountName === 'Loading Expense') loadingExpense += acc.debit;
      if (acc.accountName === 'Other Expense') miscProcureExpense += acc.debit;
    });

    const totalProcurementExpenses = transportExpense + packingExpense + loadingExpense + miscProcureExpense;
    const totalExpenses = businessExpenses + purchasesExpense + totalProcurementExpenses;
    const netProfit = salesRevenue - totalExpenses;

    // 2. Balance Sheet Liabilities & Cash Flow Aggregates
    // Accounts Payable (from Accounts Payable ledger: Credits - Debits)
    const payables = await FinancialAccount.find({ accountName: 'Accounts Payable' });
    const totalCreditsPayable = payables.reduce((sum, a) => sum + (a.credit || 0), 0);
    const totalDebitsPayable = payables.reduce((sum, a) => sum + (a.debit || 0), 0);
    const outstandingPayables = totalCreditsPayable - totalDebitsPayable;

    // Accounts Receivable (from Sales Invoices amountDue)
    const outstandingReceivables = salesInvoices.reduce((sum, s) => sum + (s.amountDue || 0), 0);

    // Cash/Bank ledger aggregate (debit balances minus credit outflows)
    const bankJournal = await FinancialAccount.find({ accountName: 'Cash/Bank' });
    const totalBankDebits = bankJournal.reduce((sum, a) => sum + (a.debit || 0), 0);
    const totalBankCredits = bankJournal.reduce((sum, a) => sum + (a.credit || 0), 0);
    // Estimated initial bank balance + sales cash collected - payments
    const cashCollectedSales = salesInvoices.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    const cashOutflowPurchases = totalBankCredits;
    const cashOutflowExpenses = rawExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Net operating cash balance (estimated starting at 5,00,000 baseline)
    const netCashBalance = 500000 + cashCollectedSales - cashOutflowPurchases - cashOutflowExpenses;

    res.json({
      revenue: {
        salesRevenue,
      },
      expenses: {
        purchasesExpense,
        businessExpenses,
        transportExpense,
        packingExpense,
        loadingExpense,
        miscProcureExpense,
        totalProcurementExpenses,
        totalExpenses,
      },
      netProfit,
      ledgerBalances: {
        outstandingPayables,
        outstandingReceivables,
        netCashBalance,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
