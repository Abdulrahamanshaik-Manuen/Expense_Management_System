import SupplierLedger from '../models/SupplierLedger.js';
import FinancialAccount from '../models/FinancialAccount.js';

/**
 * Chronologically recalculates running balances for all ledger transactions of a specific vendor.
 * Ensures consistent data integrity if a historical transaction is modified, reversed, or deleted.
 * @param {string} vendorId 
 */
export const recalculateSupplierLedger = async (vendorId) => {
  try {
    const transactions = await SupplierLedger.find({ vendor: vendorId }).sort({
      date: 1,
      createdAt: 1,
    });

    let currentBalance = 0;
    for (const tx of transactions) {
      currentBalance += (tx.credit || 0) - (tx.debit || 0);
      tx.balance = currentBalance;
      await tx.save();
    }
  } catch (error) {
    console.error('Error recalculating supplier ledger balance:', error);
    throw error;
  }
};

/**
 * Automates double-entry postings for a new Purchase Entry.
 * Affects Supplier Ledger (Debit/Credit running balances) and Financial Accounts (General Ledger journals).
 * @param {Object} purchaseEntry 
 */
export const postPurchaseEntry = async (purchaseEntry) => {
  try {
    const voucherNo = purchaseEntry.purchaseVoucherNumber;
    const purchaseDate = purchaseEntry.purchaseDate || new Date();

    // 1. Post Purchase Credit to Supplier Ledger
    await SupplierLedger.create({
      vendor: purchaseEntry.vendor,
      purchaseEntry: purchaseEntry._id,
      transactionType: 'Purchase',
      voucherNo,
      date: purchaseDate,
      credit: purchaseEntry.grandTotal,
      debit: 0,
      notes: `Logged Purchase Voucher. Invoice Ref: ${purchaseEntry.invoiceNumber}`,
    });

    // 2. Post Payment Debit to Supplier Ledger (if a down-payment is registered)
    if (purchaseEntry.amountPaid > 0) {
      await SupplierLedger.create({
        vendor: purchaseEntry.vendor,
        purchaseEntry: purchaseEntry._id,
        transactionType: 'Payment',
        voucherNo,
        date: purchaseDate,
        credit: 0,
        debit: purchaseEntry.amountPaid,
        notes: `Down-payment via ${purchaseEntry.paymentMode}.${purchaseEntry.paymentReferenceNumber ? ' Ref: ' + purchaseEntry.paymentReferenceNumber : ''}`,
      });
    }

    // Recalculate Supplier Ledger balances
    await recalculateSupplierLedger(purchaseEntry.vendor);

    // 3. Double-Entry General Ledger journal entries
    // A. Debit Purchases Account (for items purchase net of discounts)
    const netPurchasesVal = purchaseEntry.subTotal - purchaseEntry.totalDiscount;
    await FinancialAccount.create({
      accountName: 'Purchase Account',
      debit: netPurchasesVal,
      credit: 0,
      voucherNo,
      date: purchaseDate,
      description: `Purchase of goods. Vendor: ${purchaseEntry.supplierName}`,
    });

    // B. Debit Overhead Expense Accounts if incurred
    if (purchaseEntry.transportationCharges > 0) {
      await FinancialAccount.create({
        accountName: 'Transportation Expense',
        debit: purchaseEntry.transportationCharges,
        credit: 0,
        voucherNo,
        date: purchaseDate,
        description: `Transportation overhead for purchase ${voucherNo}`,
      });
    }

    if (purchaseEntry.packingCharges > 0) {
      await FinancialAccount.create({
        accountName: 'Packing Expense',
        debit: purchaseEntry.packingCharges,
        credit: 0,
        voucherNo,
        date: purchaseDate,
        description: `Packing charges for purchase ${voucherNo}`,
      });
    }

    if (purchaseEntry.loadingUnloadingCharges > 0) {
      await FinancialAccount.create({
        accountName: 'Loading Expense',
        debit: purchaseEntry.loadingUnloadingCharges,
        credit: 0,
        voucherNo,
        date: purchaseDate,
        description: `Loading/unloading overhead for purchase ${voucherNo}`,
      });
    }

    if (purchaseEntry.otherCharges > 0) {
      await FinancialAccount.create({
        accountName: 'Other Expense',
        debit: purchaseEntry.otherCharges,
        credit: 0,
        voucherNo,
        date: purchaseDate,
        description: `Misc overhead charges for purchase ${voucherNo}`,
      });
    }

    // C. Credit Accounts Payable (the total liability generated)
    await FinancialAccount.create({
      accountName: 'Accounts Payable',
      debit: 0,
      credit: purchaseEntry.grandTotal,
      voucherNo,
      date: purchaseDate,
      description: `Payable liability to ${purchaseEntry.supplierName}`,
    });

    // D. If down-payment is registered, debit Accounts Payable and credit Cash/Bank
    if (purchaseEntry.amountPaid > 0) {
      await FinancialAccount.create({
        accountName: 'Accounts Payable',
        debit: purchaseEntry.amountPaid,
        credit: 0,
        voucherNo,
        date: purchaseDate,
        description: `Payment settlement to ${purchaseEntry.supplierName}`,
      });

      await FinancialAccount.create({
        accountName: 'Cash/Bank',
        debit: 0,
        credit: purchaseEntry.amountPaid,
        voucherNo,
        date: purchaseDate,
        description: `Cash outflow for purchase down-payment. Voucher: ${voucherNo}`,
      });
    }
  } catch (error) {
    console.error('Error posting double-entry purchase record:', error);
    throw error;
  }
};

/**
 * Reverses all Supplier Ledger and Financial Account journal entries associated with a Purchase Entry.
 * Called before editing or upon deleting a voucher.
 * @param {Object} purchaseEntry 
 */
export const reversePurchaseEntry = async (purchaseEntry) => {
  try {
    const voucherNo = purchaseEntry.purchaseVoucherNumber;
    const vendorId = purchaseEntry.vendor;

    // 1. Delete associated SupplierLedger logs
    await SupplierLedger.deleteMany({ purchaseEntry: purchaseEntry._id });

    // 2. Delete associated FinancialAccount general journal logs
    await FinancialAccount.deleteMany({ voucherNo });

    // 3. Re-balance Supplier Ledger balances for this vendor
    await recalculateSupplierLedger(vendorId);
  } catch (error) {
    console.error('Error reversing double-entry purchase record:', error);
    throw error;
  }
};
