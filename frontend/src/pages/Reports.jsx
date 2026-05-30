import React, { useEffect, useState } from 'react';
import API from '../services/api';
import {
  Search, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Eye,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Tag,
  Briefcase,
  Layers,
  Building,
  Landmark,
  FileCheck,
  ChevronRight,
  Sparkles,
  TrendingDown,
  BookOpen,
  FileText,
  Activity
} from 'lucide-react';

/** Indian Currency Number-to-Words */
function priceToWords(price) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ',
    'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ',
    'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let num = Math.floor(price);
  if (num === 0) return 'Zero Rupees only';
  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees ' : 'Rupees ';
  return str.trim() + ' only';
}

const Reports = () => {
  const [activeTab, setActiveTab] = useState('expenses'); // expenses, purchases, sales, financials
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Range Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Loaded DB data
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [purchaseEntries, setPurchaseEntries] = useState([]);
  const [invoices, setInvoices] = useState([]); // SaleInvoices
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [financialsData, setFinancialsData] = useState(null);

  // Preview & Download States
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);
  
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseVoucherModal, setShowExpenseVoucherModal] = useState(false);
  
  const [selectedPurchaseEntry, setSelectedPurchaseEntry] = useState(null);
  const [showPurchasePreviewModal, setShowPurchasePreviewModal] = useState(false);

  const [showDocViewer, setShowDocViewer] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [docName, setDocName] = useState('');

  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadType, setDownloadType] = useState(null); // 'docx' or 'pdf'
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const activeCurrency = companyProfiles[0]?.currency || 'INR';
  const currencySymbol = activeCurrency === 'USD' ? '$' : '₹';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [expRes, catRes, purchaseRes, invRes, settingsRes, finRes] = await Promise.all([
        API.get('/expenses'),
        API.get('/expense-categories'),
        API.get('/purchase-entries'),
        API.get('/invoices'),
        API.get('/settings'),
        API.get('/accounting/reports/financials').catch(() => ({ data: null }))
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
      setPurchaseEntries(purchaseRes.data);
      setInvoices(invRes.data);
      setCompanyProfiles(settingsRes.data);
      if (finRes && finRes.data) {
        setFinancialsData(finRes.data);
      }
      if (settingsRes.data?.length > 0) {
        setSelectedCompanyId(settingsRes.data[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch registry data for reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper: Date filter logic
  const checkDateInRange = (dateValue) => {
    if (!dateValue) return true;
    const dateObj = new Date(dateValue);
    
    if (fromDate) {
      const fromStart = new Date(fromDate + 'T00:00:00');
      if (dateObj < fromStart) return false;
    }
    
    if (toDate) {
      const toEnd = new Date(toDate + 'T23:59:59');
      if (dateObj > toEnd) return false;
    }
    
    return true;
  };

  // 1. FILTERED EXPENSES
  const filteredExpenses = expenses.filter(exp => {
    const matchSearch = 
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.category?.name && exp.category.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.paidTo && exp.paidTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchSearch && checkDateInRange(exp.date);
  });

  // Expenses Metrics
  const expenseTotal = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const expensePaid = filteredExpenses.filter(e => e.paymentStatus === 'Paid').reduce((sum, e) => sum + (e.amount || 0), 0);
  const expenseRemaining = filteredExpenses.filter(e => e.paymentStatus !== 'Paid').reduce((sum, e) => sum + (e.amount || 0), 0);

  // 2. FILTERED PURCHASES
  const filteredPurchases = purchaseEntries.filter(entry => {
    const matchSearch = 
      (entry.invoiceNumber && entry.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.supplierName && entry.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.vendor?.name && entry.vendor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.purchaseVoucherNumber && entry.purchaseVoucherNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchSearch && checkDateInRange(entry.purchaseDate || entry.createdAt);
  });

  // Purchases Metrics
  const purchaseTotal = filteredPurchases.reduce((sum, p) => sum + (p.grandTotal || p.totalAmount || 0), 0);
  const purchasePaid = filteredPurchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const purchaseRemaining = filteredPurchases.reduce((sum, p) => sum + (p.amountDue || 0), 0);

  // 3. FILTERED INVOICES (SALES REVENUE)
  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = 
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.customerCompany && inv.customerCompany.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchSearch && checkDateInRange(inv.invoiceDate || inv.createdAt);
  });

  // Sales Metrics
  const salesTotal = filteredInvoices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const salesTax = filteredInvoices.reduce((sum, s) => sum + (s.taxAmount || 0), 0);
  const salesNet = salesTotal - salesTax;

  // Universal Invoice PDF/Word downloader
  const downloadInvoice = async (id, invoiceNumber, format) => {
    try {
      setDownloadingId(id);
      setDownloadType(format);
      const res = await API.get(`/invoices/${id}/download?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      const filename = `${invoiceNumber || 'invoice'}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to generate or download the requested document format.');
    } finally {
      setDownloadingId(null);
      setDownloadType(null);
    }
  };

  // View Uploaded Receipt/Invoice Files
  const handleViewDocument = (url, name) => {
    setDocUrl(url);
    setDocName(name);
    setShowDocViewer(true);
  };

  // CSV Report Generator per tab
  const downloadCSVReport = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activeTab === 'expenses') {
      headers = ['Date', 'Title', 'Category', 'Amount', 'Currency', 'Payment Method', 'Paid To', 'Payment Status', 'Notes'];
      rows = filteredExpenses.map(exp => [
        new Date(exp.date).toLocaleDateString(),
        exp.title,
        exp.category?.name || 'Uncategorized',
        exp.amount.toFixed(2),
        activeCurrency,
        exp.paymentMethod,
        exp.paidTo,
        exp.paymentStatus,
        exp.notes || ''
      ]);
      filename = `Expenses_Report_${fromDate || 'Start'}_to_${toDate || 'End'}.csv`;
    } else if (activeTab === 'purchases') {
      headers = ['Voucher Date', 'Voucher Number', 'Invoice Number', 'Supplier', 'PO Number', 'Sub Total', 'Discount', 'Grand Total', 'Currency', 'Amount Paid', 'Amount Due', 'Payment Status'];
      rows = filteredPurchases.map(entry => [
        entry.purchaseDate ? new Date(entry.purchaseDate).toLocaleDateString() : 'N/A',
        entry.purchaseVoucherNumber || 'N/A',
        entry.invoiceNumber,
        entry.supplierName || entry.vendor?.name || 'N/A',
        entry.poRef?.poNumber || 'Direct Purchase',
        (entry.subTotal || entry.totalAmount || 0).toFixed(2),
        (entry.totalDiscount || 0).toFixed(2),
        (entry.grandTotal || entry.totalAmount || 0).toFixed(2),
        activeCurrency,
        entry.amountPaid.toFixed(2),
        entry.amountDue.toFixed(2),
        entry.paymentStatus
      ]);
      filename = `Purchases_Report_${fromDate || 'Start'}_to_${toDate || 'End'}.csv`;
    } else if (activeTab === 'sales') {
      headers = ['Invoice Number', 'Date Issued', 'Customer Name', 'Customer Company', 'Net Subtotal', 'GST Tax Amount', 'Total Gross Amount', 'Currency', 'Payment Status'];
      rows = filteredInvoices.map(inv => [
        inv.invoiceNumber,
        new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString(),
        inv.customerName,
        inv.customerCompany || '',
        (inv.totalAmount - inv.taxAmount).toFixed(2),
        inv.taxAmount.toFixed(2),
        inv.totalAmount.toFixed(2),
        activeCurrency,
        inv.paymentStatus
      ]);
      filename = `Sales_Revenue_Report_${fromDate || 'Start'}_to_${toDate || 'End'}.csv`;
    }

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-slate-50 p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)] select-none">
      
      {/* Header with Title and CSV download button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Financial Registry Reports
              <Sparkles size={16} className="text-blue-500 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Generate, filter, and inspect detailed operation reports</p>
          </div>
        </div>

        {activeTab !== 'financials' && (
          <button
            onClick={downloadCSVReport}
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 hover:-translate-y-0.5 transition-all w-full md:w-auto"
          >
            <FileSpreadsheet size={14} />
            Download CSV Report
          </button>
        )}
      </div>

      {/* ── FILTER TOOLBAR ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Report</span>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Search by keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 h-10"
                />
              </div>
            </div>

            {/* From Date */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={11} className="text-blue-500" /> From Date
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-500 cursor-pointer h-10"
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={11} className="text-blue-500" /> To Date
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-500 cursor-pointer h-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ──────────────────────────────────────── */}
      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1.5 mb-8 w-fit">
        <button
          onClick={() => { setActiveTab('expenses'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider ${activeTab === 'expenses'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            : 'text-slate-500 hover:text-slate-800 hover:bg-white'
            }`}
        >
          <DollarSign size={14} /> Expenses ({filteredExpenses.length})
        </button>
        <button
          onClick={() => { setActiveTab('purchases'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider ${activeTab === 'purchases'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            : 'text-slate-500 hover:text-slate-800 hover:bg-white'
            }`}
        >
          <Landmark size={14} /> Purchases ({filteredPurchases.length})
        </button>
        <button
          onClick={() => { setActiveTab('sales'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider ${activeTab === 'sales'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            : 'text-slate-500 hover:text-slate-800 hover:bg-white'
            }`}
        >
          <TrendingUp size={14} /> Sales Report ({filteredInvoices.length})
        </button>
        <button
          onClick={() => { setActiveTab('financials'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider ${activeTab === 'financials'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            : 'text-slate-500 hover:text-slate-800 hover:bg-white'
            }`}
        >
          <BookOpen size={14} /> Accounts & Financials
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-650 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 text-slate-500">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold tracking-wide">Assembling registry logs & data aggregates...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          
          {/* ================= TAB 1: EXPENSE REPORT ================= */}
          {activeTab === 'expenses' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Expenses logged</span>
                  <h3 className="text-2xl font-black text-slate-900">{currencySymbol}{expenseTotal.toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Sum of all filtered records</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Total Paid out</span>
                  <h3 className="text-2xl font-black text-emerald-600">{currencySymbol}{expensePaid.toLocaleString()}</h3>
                  <p className="text-[10px] text-emerald-500 mt-1">Settled operational payments</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-amber-500/20 hover:border-amber-500/40 transition-all">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Remaining / Dues Pending</span>
                  <h3 className="text-2xl font-black text-amber-600">{currencySymbol}{expenseRemaining.toLocaleString()}</h3>
                  <p className="text-[10px] text-amber-550 mt-1">Outstanding bills to settle</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <th className="px-6 py-4">Expense Details</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Financials & Method</th>
                        <th className="px-6 py-4">Status & Dues</th>
                        <th className="px-6 py-4 text-right">Receipt Voucher</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-16 text-slate-500 font-medium">
                            No expenses logged for this filtered timeframe.
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((exp) => (
                          <tr key={exp._id} className="hover:bg-slate-50/50 transition-all duration-200">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">{exp.title}</p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                <Calendar size={12} className="text-slate-400" /> Issued: {new Date(exp.date).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 font-semibold">
                                <Tag size={10} className="text-slate-400" />
                                {exp.category?.name || 'Uncategorized'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-extrabold text-slate-900">{currencySymbol}{exp.amount.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Paid via {exp.paymentMethod} to {exp.paidTo}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border ${
                                exp.paymentStatus === 'Paid' 
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              }`}>
                                {exp.paymentStatus === 'Paid' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                {exp.paymentStatus}
                              </span>
                              {exp.paymentStatus !== 'Paid' && (
                                <p className="text-[10px] text-red-500 mt-1 font-semibold">
                                  Due: {currencySymbol}{exp.amount.toLocaleString()}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedExpense(exp);
                                    setShowExpenseVoucherModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Eye size={13} className="text-slate-500" />
                                  View Voucher
                                </button>
                                {exp.receiptUrl ? (
                                  <button
                                    onClick={() => handleViewDocument(exp.receiptUrl, exp.title)}
                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-500 font-bold hover:underline cursor-pointer bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-xl"
                                  >
                                    <FileText size={12} /> File
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">No Attachment</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 2: PURCHASES REPORT ================= */}
          {activeTab === 'purchases' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Purchases Billed</span>
                  <h3 className="text-2xl font-black text-slate-900">{currencySymbol}{purchaseTotal.toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Sum of filtered purchase entries</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Total Payouts Settled</span>
                  <h3 className="text-2xl font-black text-emerald-600">{currencySymbol}{purchasePaid.toLocaleString()}</h3>
                  <p className="text-[10px] text-emerald-500 mt-1">Amount paid out to suppliers</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-red-500/20 hover:border-red-500/40 transition-all">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Remaining Outstanding Payables</span>
                  <h3 className="text-2xl font-black text-red-600">{currencySymbol}{purchaseRemaining.toLocaleString()}</h3>
                  <p className="text-[10px] text-red-500 mt-1">Dues pending to vendors</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <th className="px-6 py-4">Voucher details</th>
                        <th className="px-6 py-4">Supplier / PO Reference</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Outstanding dues & Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredPurchases.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-16 text-slate-500 font-medium">
                            No purchase entries located for this filtered range.
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases.map((entry) => (
                          <tr key={entry._id} className="hover:bg-slate-50/50 transition-all duration-200">
                            <td className="px-6 py-4">
                              <p className="font-extrabold text-slate-900">{entry.purchaseVoucherNumber || 'Direct Log'}</p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                <Calendar size={12} className="text-slate-400" /> Date: {entry.purchaseDate ? new Date(entry.purchaseDate).toLocaleDateString('en-GB') : new Date(entry.createdAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{entry.supplierName || entry.vendor?.name || 'N/A'}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">PO: {entry.poRef?.poNumber || 'Direct Purchase'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-extrabold text-slate-900">{currencySymbol}{(entry.grandTotal || entry.totalAmount || 0).toLocaleString()}</p>
                              <p className="text-[10px] text-slate-550 mt-0.5">Paid: {currencySymbol}{(entry.amountPaid || 0).toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className={`font-extrabold ${entry.amountDue > 0 ? 'text-red-650' : 'text-emerald-650'}`}>
                                {currencySymbol}{entry.amountDue.toLocaleString()}
                              </p>
                              <p className="text-[10px] mt-0.5">
                                <span className={`inline-flex text-[9px] font-black px-2 py-0.5 rounded-full border ${entry.paymentStatus === 'Paid'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : entry.paymentStatus === 'Partial'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    : 'bg-red-500/10 text-red-600 border-red-500/20'
                                  }`}>
                                  {entry.paymentStatus}
                                </span>
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedPurchaseEntry(entry);
                                    setShowPurchasePreviewModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Eye size={13} className="text-slate-500" />
                                  View specifications
                                </button>
                                {entry.invoiceUrl ? (
                                  <button
                                    onClick={() => handleViewDocument(entry.invoiceUrl, `Invoice #${entry.invoiceNumber}`)}
                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-500 font-bold hover:underline cursor-pointer bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-xl"
                                  >
                                    <FileText size={12} /> File
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">No File</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 3: SALES REVENUE REPORT ================= */}
          {activeTab === 'sales' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Sales (Gross Billed)</span>
                  <h3 className="text-2xl font-black text-slate-900">{currencySymbol}{salesTotal.toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Sum of all generated sale invoices</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-blue-500/20 hover:border-blue-500/40 transition-all">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Net Base Revenue</span>
                  <h3 className="text-2xl font-black text-blue-600">{currencySymbol}{salesNet.toLocaleString()}</h3>
                  <p className="text-[10px] text-blue-500 mt-1">Revenue excluding tax values</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Tax Amount (GST 18% collected)</span>
                  <h3 className="text-2xl font-black text-emerald-600">{currencySymbol}{salesTax.toLocaleString()}</h3>
                  <p className="text-[10px] text-emerald-500 mt-1">Allocated tax liabilities</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <th className="px-6 py-4">Invoice details</th>
                        <th className="px-6 py-4">Client Contact</th>
                        <th className="px-6 py-4">Tax (GST)</th>
                        <th className="px-6 py-4">Total Amount (Gross)</th>
                        <th className="px-6 py-4 text-right">Download Formats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-16 text-slate-500 font-medium">
                            No sales invoices found matching your range.
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((inv) => (
                          <tr key={inv._id} className="hover:bg-slate-50/50 transition-all duration-200">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-805 tracking-tight">{inv.invoiceNumber}</p>
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <Calendar size={12} className="text-slate-400" /> Issued: {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{inv.customerName}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {inv.customerEmail} {inv.customerCompany && `• ${inv.customerCompany}`}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{currencySymbol}{inv.taxAmount.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">GST 18% included</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-black text-slate-900 tracking-wide">
                                {currencySymbol}{inv.totalAmount.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Net: {currencySymbol}{(inv.totalAmount - inv.taxAmount).toLocaleString()}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setSelectedCompanyId(inv.companyId?._id || inv.companyId || companyProfiles[0]?._id || '');
                                    setShowInvoicePreviewModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Eye size={13} className="text-slate-500" />
                                  View
                                </button>
                                <button
                                  disabled={downloadingId === inv._id}
                                  onClick={() => downloadInvoice(inv._id, inv.invoiceNumber, 'docx')}
                                  className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 border border-blue-100 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {downloadingId === inv._id && downloadType === 'docx' ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <FileText size={12} />
                                  )}
                                  Word (.docx)
                                </button>
                                <button
                                  disabled={downloadingId === inv._id}
                                  onClick={() => downloadInvoice(inv._id, inv.invoiceNumber, 'pdf')}
                                  className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100/80 border border-red-100 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {downloadingId === inv._id && downloadType === 'pdf' ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <FileText size={12} />
                                  )}
                                  PDF (.pdf)
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 4: ACCOUNTS & DOUBLE-ENTRY FINANCIALS ================= */}
          {activeTab === 'financials' && financialsData && (
            <div className="space-y-6">
              
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-550 uppercase block mb-1">Total Sales Revenue</span>
                  <h3 className="text-xl font-black text-slate-900">₹{(financialsData.revenue?.salesRevenue || 0).toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Realized & outstanding invoices value</p>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-red-500/10">
                  <span className="text-[10px] font-bold text-slate-550 block mb-1 uppercase text-red-500">Total Expenses</span>
                  <h3 className="text-xl font-black text-red-650">₹{(financialsData.expenses?.totalExpenses || 0).toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Purchases, Overheads & business spends</p>
                </div>

                <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${financialsData.netProfit >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                  <span className="text-[10px] font-bold block mb-1 uppercase text-slate-500">Net Profit / Loss</span>
                  <h3 className={`text-xl font-black ${financialsData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{financialsData.netProfit.toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Revenue minus accumulated expenses</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-blue-500/10">
                  <span className="text-[10px] font-bold text-slate-550 block mb-1 uppercase text-blue-500">Cash / Bank Balance</span>
                  <h3 className="text-xl font-black text-blue-600">₹{(financialsData.ledgerBalances?.netCashBalance || 0).toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Baseline deposits minus operational flows</p>
                </div>
              </div>

              {/* Profit & Loss Sheet */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-800">Dynamic Profit & Loss (P&L) Statement</h4>
                  <Activity size={16} className="text-blue-500" />
                </div>

                <div className="text-xs divide-y divide-slate-100 font-semibold space-y-2">
                  <div className="flex justify-between py-2 font-bold text-slate-900 text-sm">
                    <span>1. Sales Revenue (Credited)</span>
                    <span>₹{(financialsData.revenue?.salesRevenue || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="pt-2 font-bold text-slate-700">
                    <span>2. Less: Cost of Procurement Purchases & Expenses</span>
                  </div>
                  
                  <div className="flex justify-between py-1.5 pl-4 text-slate-600">
                    <span>• Inventory Purchases</span>
                    <span>-₹{(financialsData.expenses?.purchasesExpense || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 text-slate-600">
                    <span>• Transportation & Logistics</span>
                    <span>-₹{(financialsData.expenses?.transportExpense || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 text-slate-600">
                    <span>• Packing Overhead Charges</span>
                    <span>-₹{(financialsData.expenses?.packingExpense || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 text-slate-600">
                    <span>• Loading/Unloading Costs</span>
                    <span>-₹{(financialsData.expenses?.loadingExpense || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 text-slate-600">
                    <span>• Miscellaneous Procurement Expenses</span>
                    <span>-₹{(financialsData.expenses?.miscProcureExpense || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1.5 pl-4 text-slate-600">
                    <span>• General Operational Expenses</span>
                    <span>-₹{(financialsData.expenses?.businessExpenses || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                    <span>Net Operating Profit</span>
                    <span className={financialsData.netProfit >= 0 ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                      ₹{financialsData.netProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* General Ledger Balance sheet aggregates */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-800">Dynamic Double-Entry Ledgers Audits Balance</h4>
                  <Landmark size={16} className="text-blue-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Cash / Bank Account</p>
                    <p className="font-black text-blue-600 text-base">₹{(financialsData.ledgerBalances?.netCashBalance || 0).toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500 font-normal mt-1 leading-relaxed">Represents net bank cash position (Initial credit + sales collections minus purchases & expense payouts).</p>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accounts Receivable (Debtors)</p>
                    <p className="font-black text-emerald-600 text-base">₹{(financialsData.ledgerBalances?.outstandingReceivables || 0).toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500 font-normal mt-1 leading-relaxed">Outstanding collections dues owed from customers on generated sales invoices.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accounts Payable (Creditors)</p>
                    <p className="font-black text-red-650 text-base">₹{(financialsData.ledgerBalances?.outstandingPayables || 0).toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500 font-normal mt-1 leading-relaxed">Total outstanding liabilities owed to suppliers under purchase vouchers ledger statements.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ================= MODAL: IN-BROWSER TAX INVOICE LIVE VIEWER ================= */}
      {showInvoicePreviewModal && selectedInvoice && (() => {
        const activeBiller = (selectedInvoice.companyId && typeof selectedInvoice.companyId === 'object' && selectedInvoice.companyId.companyName)
          ? selectedInvoice.companyId
          : companyProfiles.find(c => c._id === selectedCompanyId) || companyProfiles[0] || {
            companyName: 'SYSTEM DEFAULT BILLER',
            gstNumber: 'N/A',
            companyEmail: 'billing@biller.com',
            companyPhone: 'N/A',
            companyAddress: 'Registered Business Address',
            bankName: 'N/A',
            bankAccountNumber: 'N/A',
            ifscCode: 'N/A'
          };

        const itemsList = (selectedInvoice.items || []).map((item) => {
          const name = item.name || item.description || 'Line Item';
          const qty = item.quantity || 1;
          const price = item.price || item.unitPrice || 0;
          const discount = item.discount || 0;
          const taxRate = item.taxRate !== undefined ? item.taxRate : 18;
          
          const subtotal = (qty * price) - discount;
          const taxAmount = subtotal * (taxRate / 100);
          const total = subtotal + taxAmount;

          return { name, qty, price, discount, taxRate, subtotal, taxAmount, total };
        });

        const totalAmountVal = Number(selectedInvoice.totalAmount || selectedInvoice.total || itemsList.reduce((acc, item) => acc + item.total, 0)) || 0;
        const taxAmountVal   = Number(selectedInvoice.taxAmount)   || (totalAmountVal * 18 / 118);
        const cgstVal        = taxAmountVal / 2;
        const sgstVal        = taxAmountVal / 2;
        const baseAmountVal  = totalAmountVal - taxAmountVal;
        const totalQuantity  = (selectedInvoice.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

        return (
          <div className="fixed inset-0 bg-slate-955/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
              
              <button
                onClick={() => {
                  setShowInvoicePreviewModal(false);
                  setSelectedInvoice(null);
                }}
                className="absolute top-6 right-6 text-slate-550 hover:text-slate-805 transition-colors cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Tax Invoice Live Preview</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                    <FileText size={20} className="text-blue-500" />
                    Tax Invoice Preview
                  </h3>
                </div>
              </div>

              {/* PAPER SHEET */}
              <div className="bg-[#FAF9F5] text-black border border-slate-350 p-6 sm:p-12 shadow-2xl rounded-sm space-y-6 select-text max-w-[800px] mx-auto text-left font-sans leading-relaxed">
                
                <div className="flex flex-row justify-between items-start gap-4 pb-4">
                  <div>
                    {activeBiller.logoSquareUrl ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src={activeBiller.logoSquareUrl.startsWith('http') ? activeBiller.logoSquareUrl : `http://localhost:5000${activeBiller.logoSquareUrl}`} 
                          alt="Company Logo" 
                          className="w-10 h-10 object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {activeBiller.logoUrl ? (
                          <img 
                            src={activeBiller.logoUrl.startsWith('http') ? activeBiller.logoUrl : `http://localhost:5000${activeBiller.logoUrl}`} 
                            alt="Brand Logo" 
                            className="h-10 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <h2 className="text-sm font-bold text-[#002e6e]">{activeBiller.companyName}</h2>
                        )}
                      </div>
                    ) : activeBiller.logoUrl ? (
                      <img 
                        src={activeBiller.logoUrl.startsWith('http') ? activeBiller.logoUrl : `http://localhost:5000${activeBiller.logoUrl}`} 
                        alt="Brand Logo" 
                        className="h-10 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 bg-[#002e6e] flex items-center justify-center">
                          <div className="absolute top-1.5 w-2 h-2 bg-[#2fa64f] rounded-full"></div>
                          <div className="absolute bottom-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white"></div>
                          <div className="absolute bottom-1 w-1.5 h-2.5 bg-[#2fa64f]"></div>
                        </div>
                        <div>
                          <h2 className="text-[17px] font-black text-[#002e6e] leading-none select-none tracking-tight">{activeBiller.companyName?.toUpperCase()}</h2>
                          <div className="h-[1.5px] bg-[#002e6e] mt-1.5 w-32"></div>
                          <div className="h-[1.5px] bg-[#2fa64f] mt-[1px] w-32"></div>
                          <p className="text-[8px] font-black text-[#2fa64f] tracking-[0.25em] mt-1 text-center w-32 uppercase leading-none">i n f o t e c h</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-black px-3.5 py-2 w-44 text-[10px] font-bold text-black flex flex-col justify-center divide-y divide-black gap-1.5 bg-white select-none">
                    <div className="pb-1">Date : {new Date(selectedInvoice.invoiceDate || selectedInvoice.createdAt).toLocaleDateString('en-GB')}</div>
                    <div className="pt-1">Invoice No : {selectedInvoice.invoiceNumber || 'N/A'}</div>
                  </div>
                </div>

                <h1 className="text-2xl font-black text-[#00b4d8] text-center uppercase tracking-wider my-4 select-none">
                  INVOICE
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-black">
                  <div className="border border-[#cccccc] rounded-none overflow-hidden flex flex-col bg-white">
                    <div className="bg-[#e8e5d3] border-b border-[#cccccc] px-3 py-1 text-[9px] font-bold text-black uppercase select-none">
                      FROM
                    </div>
                    <div className="p-3 leading-relaxed space-y-1">
                      <p className="font-bold text-[10.5px] text-black uppercase">{activeBiller.companyName}</p>
                      <p className="text-[#333333] whitespace-pre-line">{activeBiller.companyAddress || activeBiller.address || 'Address N/A'}</p>
                      <p className="text-[#333333]">Mobile No : {activeBiller.companyPhone || activeBiller.mobile || 'N/A'}</p>
                      <p className="text-[#333333]">GST No : {activeBiller.gstNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="border border-[#cccccc] rounded-none overflow-hidden flex flex-col bg-white">
                    <div className="bg-[#e8e5d3] border-b border-[#cccccc] px-3 py-1 text-[9px] font-bold text-black uppercase select-none">
                      BILL TO
                    </div>
                    <div className="p-3 leading-relaxed space-y-1">
                      <p className="font-bold text-[10.5px] text-black uppercase">{selectedInvoice.customerName || 'N/A'}</p>
                      <p className="text-[#333333] whitespace-pre-line">{selectedInvoice.customerAddress || 'N/A'}</p>
                      <p className="text-[#333333]">GST NO : {selectedInvoice.customerGst || 'N/A'}</p>
                      <p className="text-[#333333]">Phone No : {selectedInvoice.customerPhone || 'N/A'}</p>
                      <p className="text-[#333333]">Mobile No : {selectedInvoice.customerPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[10px] text-black bg-white">
                    <thead>
                      <tr className="bg-[#e8e5d3] border-b border-black text-[9px] font-bold text-black select-none">
                        <th className="border-r border-black p-2 text-center w-12">S NO</th>
                        <th className="border-r border-black p-2 text-left">Description of Services</th>
                        <th className="border-r border-black p-2 text-center w-24">HSN Code</th>
                        <th className="border-r border-black p-2 text-center w-24">Quantity</th>
                        <th className="p-2 text-right w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {itemsList.map((item, idx) => {
                        const itemBaseAmount = item.qty * item.price;
                        return (
                          <tr key={idx} className="h-7">
                            <td className="border-r border-black p-2 text-center">{idx + 1}</td>
                            <td className="border-r border-black p-2 text-left">{item.name}</td>
                            <td className="border-r border-black p-2 text-center">{activeBiller.defaultHsnCode || 'N/A'}</td>
                            <td className="border-r border-black p-2 text-center">{item.qty} Months</td>
                            <td className="p-2 text-right">{itemBaseAmount.toLocaleString()}/-</td>
                          </tr>
                        );
                      })}
                      <tr className="h-7 font-bold text-black">
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-left">CGST (9%)</td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="p-2 text-right">{cgstVal.toLocaleString()}/-</td>
                      </tr>
                      <tr className="h-7 font-bold text-black">
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-left">SGST (9%)</td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="p-2 text-right">{sgstVal.toLocaleString()}/-</td>
                      </tr>
                      <tr className="bg-[#e8e5d3] font-bold border-t border-black h-7 text-black">
                        <td className="border-r border-black p-2 text-left">Total:</td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-center">{totalQuantity} Months</td>
                        <td className="p-2 text-right">{totalAmountVal.toLocaleString()}/-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1">
                  <p className="text-[9.5px] font-bold text-black select-none">GST Tax Summary</p>
                  <table className="w-full border-collapse border border-black text-[9px] text-black bg-white">
                    <thead>
                      <tr className="bg-[#e8e5d3] border-b border-black font-bold text-black select-none">
                        <th className="border-r border-black p-1.5 text-center w-20">HSN</th>
                        <th className="border-r border-black p-1.5 text-right">Amount</th>
                        <th className="border-r border-black p-1.5 text-right">CGST (9%)</th>
                        <th className="border-r border-black p-1.5 text-right">SGST (9%)</th>
                        <th className="p-1.5 text-right">Total Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      <tr className="h-6">
                        <td className="border-r border-black p-1.5 text-center">{activeBiller.defaultHsnCode || 'N/A'}</td>
                        <td className="border-r border-black p-1.5 text-right">{baseAmountVal.toLocaleString()}/-</td>
                        <td className="border-r border-black p-1.5 text-right">{cgstVal.toLocaleString()}/-</td>
                        <td className="border-r border-black p-1.5 text-right">{sgstVal.toLocaleString()}/-</td>
                        <td className="p-1.5 text-right">{taxAmountVal.toLocaleString()}/-</td>
                      </tr>
                      <tr className="bg-[#e8e5d3] font-bold h-6 text-black">
                        <td className="border-r border-black p-1.5 text-center">Total</td>
                        <td className="border-r border-black p-1.5 text-right">{baseAmountVal.toLocaleString()}/-</td>
                        <td className="border-r border-black p-1.5 text-right">{cgstVal.toLocaleString()}/-</td>
                        <td className="border-r border-black p-1.5 text-right">{sgstVal.toLocaleString()}/-</td>
                        <td className="p-1.5 text-right">{taxAmountVal.toLocaleString()}/-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[10px] text-black pt-4 border-t border-slate-200">
                  <div className="md:col-span-6 space-y-1">
                    <p className="text-slate-500 font-medium select-none">Total Amount (in words):</p>
                    <p className="font-bold text-black pr-4">{priceToWords(totalAmountVal)}</p>
                  </div>
                  
                  <div className="md:col-span-6 space-y-1">
                    <h5 className="font-bold text-black uppercase tracking-wide select-none">Company's Bank Details</h5>
                    <div className="pl-2 space-y-0.5 text-slate-800">
                      <p><span className="text-slate-500 select-none">A/c Holder's Name :</span> <span className="font-bold text-black">{activeBiller.accountHolderName || 'N/A'}</span></p>
                      <p><span className="text-slate-500 select-none">Bank Name :</span> <span className="font-semibold text-black">{activeBiller.bankName || 'N/A'}</span></p>
                      <p><span className="text-slate-500 select-none">Account No :</span> <span className="font-bold text-black tracking-wider">{activeBiller.bankAccountNumber || activeBiller.accountNumber || 'N/A'}</span></p>
                      <p><span className="text-slate-500 select-none">Branch & IFS Code :</span> <span className="font-bold text-black">{activeBiller.ifscCode || 'N/A'}</span></p>
                    </div>
                  </div>
                </div>

                <div className="border border-black rounded-none overflow-hidden bg-white">
                  <div className="bg-[#e8e5d3] border-b border-black text-center py-1 text-[9px] font-bold text-black select-none">
                    Note
                  </div>
                  <p className="text-[9px] text-[#333333] italic text-center py-2 px-4 whitespace-pre-line leading-relaxed">
                    {activeBiller.noteText || 'Thank you for your business!'}
                  </p>
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
                <button
                  onClick={() => {
                    setShowInvoicePreviewModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: EXPENSE PAYMENT VOUCHER LIVE VIEWER ================= */}
      {showExpenseVoucherModal && selectedExpense && (() => {
        const activeCompany = selectedExpense.companyId && typeof selectedExpense.companyId === 'object'
          ? selectedExpense.companyId
          : (companyProfiles.find(p => p._id === selectedExpense.companyId) || companyProfiles[0] || {});

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">

              <button
                onClick={() => {
                  setShowExpenseVoucherModal(false);
                  setSelectedExpense(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-850 transition-colors cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg"
              >
                <X size={20} />
              </button>

              <div className="pb-6 mb-6 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">OFFICIAL EXPENSE PAYMENT VOUCHER PREVIEW</span>
                </div>
                <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                  <DollarSign size={20} className="text-blue-500" />
                  Expense Voucher Preview
                </h3>
              </div>

              {/* PAPER SHEET */}
              <div className="bg-[#FAF9F5] text-black border border-slate-350 p-6 sm:p-12 shadow-2xl rounded-sm space-y-6 select-text max-w-[800px] mx-auto text-left font-sans leading-relaxed">
                <div className="flex flex-row justify-between items-start gap-4 pb-4">
                  <div>
                    {activeCompany.logoUrl ? (
                      <img 
                        src={activeCompany.logoUrl.startsWith('http') ? activeCompany.logoUrl : `http://localhost:5000${activeCompany.logoUrl}`} 
                        alt="Brand Logo" 
                        className="h-10 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <h2 className="text-[17px] font-black text-[#002e6e] uppercase tracking-tight">{activeCompany.companyName}</h2>
                    )}
                  </div>
                  <div className="border border-black px-3.5 py-2 w-44 text-[10px] font-bold text-black flex flex-col justify-center divide-y divide-black gap-1.5 bg-white select-none">
                    <div className="pb-1">Voucher Date : {new Date(selectedExpense.date).toLocaleDateString('en-GB')}</div>
                    <div className="pt-1">Payment Status: {selectedExpense.paymentStatus}</div>
                  </div>
                </div>

                <h1 className="text-xl font-black text-slate-900 text-center uppercase tracking-wider my-4 select-none border-b border-black pb-2">
                  PAYMENT VOUCHER
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-black">
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-bold text-[10.5px] text-black uppercase">PAID TO / DEBTOR:</p>
                    <p className="text-[#333333] font-semibold">{selectedExpense.paidTo}</p>
                    <p className="text-[#333333]">Category: {selectedExpense.category?.name || 'Unclassified'}</p>
                  </div>
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-bold text-[10.5px] text-black uppercase">ISSUED BY (CREDITOR):</p>
                    <p className="text-[#333333] font-semibold">{activeCompany.companyName}</p>
                    <p className="text-[#333333]">GSTIN: {activeCompany.gstNumber || 'N/A'}</p>
                  </div>
                </div>

                <table className="w-full border-collapse border border-black text-[10px] text-black bg-white">
                  <thead>
                    <tr className="bg-[#e8e5d3] border-b border-black text-[9px] font-bold text-black select-none">
                      <th className="border-r border-black p-2 text-center w-12">S NO</th>
                      <th className="border-r border-black p-2 text-left">Description / Particulars</th>
                      <th className="border-r border-black p-2 text-center w-28">Payment Method</th>
                      <th className="p-2 text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="h-20">
                      <td className="border-r border-black p-2 text-center">1</td>
                      <td className="border-r border-black p-2 text-left valign-top">
                        <p className="font-bold">{selectedExpense.title}</p>
                        <p className="text-slate-500 mt-1 italic text-[9px]">{selectedExpense.notes || 'No notes allocated.'}</p>
                      </td>
                      <td className="border-r border-black p-2 text-center">{selectedExpense.paymentMethod}</td>
                      <td className="p-2 text-right font-bold">{currencySymbol}{selectedExpense.amount.toLocaleString()}/-</td>
                    </tr>
                    <tr className="bg-[#e8e5d3] font-bold border-t border-black h-8 text-black">
                      <td className="border-r border-black p-2"></td>
                      <td className="border-r border-black p-2 text-left">TOTAL PAID OUT VALUE:</td>
                      <td className="border-r border-black p-2"></td>
                      <td className="p-2 text-right font-black">{currencySymbol}{selectedExpense.amount.toLocaleString()}/-</td>
                    </tr>
                  </tbody>
                </table>

                <div className="space-y-1 text-[10px] pt-4">
                  <p className="text-slate-500 font-medium select-none">Amount in words:</p>
                  <p className="font-bold text-black">{priceToWords(selectedExpense.amount)}</p>
                </div>

                <div className="pt-8 flex justify-between text-[10px] font-bold select-none text-black">
                  <div>
                    <div className="w-36 border-b border-black mt-8"></div>
                    <p className="text-center mt-1">Receiver's Signature</p>
                  </div>
                  <div>
                    <div className="w-36 border-b border-black mt-8"></div>
                    <p className="text-center mt-1">Authorized Signatory</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowExpenseVoucherModal(false);
                    setSelectedExpense(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: PURCHASE ENTRY SPECS VIEWER ================= */}
      {showPurchasePreviewModal && selectedPurchaseEntry && (() => {
        const activeCompany = companyProfiles[0] || {};
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">

              <button
                onClick={() => {
                  setShowPurchasePreviewModal(false);
                  setSelectedPurchaseEntry(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-850 transition-colors cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg"
              >
                <X size={20} />
              </button>

              <div className="pb-6 mb-6 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest font-mono">SUPPLIER GOODS RECEIVED NOTE PREVIEW</span>
                </div>
                <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                  <Landmark size={20} className="text-blue-500" />
                  Purchase Entry Detail
                </h3>
              </div>

              {/* PAPER SHEET */}
              <div className="bg-[#FAF9F5] text-black border border-slate-350 p-6 sm:p-12 shadow-2xl rounded-sm space-y-6 select-text max-w-[800px] mx-auto text-left font-sans leading-relaxed">
                
                <div className="flex flex-row justify-between items-start gap-4 pb-4">
                  <div>
                    {activeCompany.logoUrl ? (
                      <img 
                        src={activeCompany.logoUrl.startsWith('http') ? activeCompany.logoUrl : `http://localhost:5000${activeCompany.logoUrl}`} 
                        alt="Brand Logo" 
                        className="h-10 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <h2 className="text-[17px] font-black text-[#002e6e] uppercase tracking-tight">{activeCompany.companyName}</h2>
                    )}
                  </div>
                  <div className="border border-black px-3.5 py-2 w-44 text-[10px] font-bold text-black flex flex-col justify-center divide-y divide-black gap-1.5 bg-white select-none">
                    <div className="pb-1">Received Date : {new Date(selectedPurchaseEntry.purchaseDate || selectedPurchaseEntry.createdAt).toLocaleDateString('en-GB')}</div>
                    <div className="pt-1">Supplier Ref: #{selectedPurchaseEntry.invoiceNumber}</div>
                  </div>
                </div>

                <h1 className="text-xl font-black text-slate-900 text-center uppercase tracking-wider my-4 select-none border-b border-black pb-2">
                  GOODS RECEIVED NOTE (GRN)
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-black">
                  <div className="space-y-1">
                    <p className="font-bold text-[10.5px] text-black uppercase">SUPPLIER VENDOR DETAILS:</p>
                    <p className="text-[#333333] font-semibold">{selectedPurchaseEntry.supplierName || selectedPurchaseEntry.vendor?.name}</p>
                    {selectedPurchaseEntry.supplierGSTIN && <p className="text-[#333333]">GSTIN: {selectedPurchaseEntry.supplierGSTIN}</p>}
                    <p className="text-[#333333]">Email: {selectedPurchaseEntry.supplierEmail || selectedPurchaseEntry.vendor?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-[10.5px] text-black uppercase">DELIVERED TO (RECEIVER):</p>
                    <p className="text-[#333333] font-semibold">{activeCompany.companyName}</p>
                    <p className="text-[#333333]">GSTIN: {activeCompany.gstNumber}</p>
                    <p className="text-[#333333]">PO Reference: {selectedPurchaseEntry.poRef?.poNumber || 'Direct Purchase / No PO'}</p>
                  </div>
                </div>

                {/* Items */}
                <table className="w-full border-collapse border border-black text-[10px] text-black bg-white">
                  <thead>
                    <tr className="bg-[#e8e5d3] border-b border-black text-[9px] font-bold text-black select-none">
                      <th className="border-r border-black p-2 text-center w-12">S NO</th>
                      <th className="border-r border-black p-2 text-left">Description of Goods / Assets</th>
                      <th className="border-r border-black p-2 text-center w-24">Quantity & Unit</th>
                      <th className="border-r border-black p-2 text-right">Discount</th>
                      <th className="p-2 text-right w-28">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {(selectedPurchaseEntry.items || []).map((item, idx) => (
                      <tr key={idx} className="h-8">
                        <td className="border-r border-black p-2 text-center">{idx + 1}</td>
                        <td className="border-r border-black p-2 text-left">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-[8.5px] text-slate-500 font-mono">Code: {item.code || 'N/A'}</p>
                        </td>
                        <td className="border-r border-black p-2 text-center">{item.quantity} {item.unit || 'Pcs'}</td>
                        <td className="border-r border-black p-2 text-right">₹{(item.discountAmount || 0).toLocaleString()}/-</td>
                        <td className="p-2 text-right font-semibold">{currencySymbol}{(item.totalItemAmount || 0).toLocaleString()}/-</td>
                      </tr>
                    ))}
                    <tr className="bg-[#e8e5d3] font-bold border-t border-black h-8 text-black">
                      <td className="border-r border-black p-2"></td>
                      <td className="border-r border-black p-2 text-left">TOTAL INVOICE VALUE:</td>
                      <td className="border-r border-black p-2"></td>
                      <td className="border-r border-black p-2"></td>
                      <td className="p-2 text-right font-black">{currencySymbol}{(selectedPurchaseEntry.grandTotal || selectedPurchaseEntry.totalAmount || 0).toLocaleString()}/-</td>
                    </tr>
                  </tbody>
                </table>

                {/* Payment summary details inside paper */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-[10px] text-black bg-white">
                  <div>
                    <p className="font-bold text-[#333333] uppercase">Payment Status:</p>
                    <p className="text-slate-650 mt-1">Status: <span className="font-bold">{selectedPurchaseEntry.paymentStatus}</span></p>
                    <p className="text-slate-655">Due Date: {selectedPurchaseEntry.dueDate ? new Date(selectedPurchaseEntry.dueDate).toLocaleDateString() : 'Immediate'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#333333] uppercase">Balances Outstanding Breakdown:</p>
                    <p className="text-slate-650 mt-1">Amount Paid: {currencySymbol}{selectedPurchaseEntry.amountPaid.toLocaleString()}/-</p>
                    <p className="text-slate-655">Amount Due (Outstanding Dues): <span className="text-red-500 font-bold">{currencySymbol}{selectedPurchaseEntry.amountDue.toLocaleString()}/-</span></p>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowPurchasePreviewModal(false);
                    setSelectedPurchaseEntry(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= DOCUMENT VIEWER MODAL ================= */}
      {showDocViewer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in animate-duration-200">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 h-[85vh] flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                  <FileText className="text-blue-600" size={18} /> Supporting Attachment Preview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{docName}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`http://localhost:5000/${docUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => setShowDocViewer(false)}
                  className="text-slate-600 hover:text-slate-850 transition-all font-bold text-xs bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
              {docUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`http://localhost:5000/${docUrl}`}
                  className="w-full h-full border-0"
                  title="Supporting Document Preview"
                />
              ) : (
                <img
                  src={`http://localhost:5000/${docUrl}`}
                  alt="Supporting Document Preview"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
