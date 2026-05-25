import React, { useEffect, useState, useRef } from 'react';
import API from '../services/api';
import {
  Plus,
  Trash,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Users,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
  DollarSign,
  ShoppingBag,
  Landmark,
  Building,
  Activity,
  FileCheck,
  Eye,
  X,
  FileSpreadsheet
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

const Purchases = () => {
  const invoiceFileInput = useRef(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('entries');

  // Database states
  const [orders, setOrders] = useState([]);
  const [entries, setEntries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [companyProfiles, setCompanyProfiles] = useState([]);

  // Filter States
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  const activeCurrency = companyProfiles[0]?.currency || 'INR';
  const currencySymbol = activeCurrency === 'USD' ? '$' : '₹';

  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    const matchMonth = filterMonth === 'All' || (entryDate.getMonth() + 1) === parseInt(filterMonth);
    const matchYear = filterYear === 'All' || entryDate.getFullYear() === parseInt(filterYear);
    return matchMonth && matchYear;
  });

  const filteredOrders = orders.filter(po => {
    const poDate = new Date(po.createdAt);
    const matchMonth = filterMonth === 'All' || (poDate.getMonth() + 1) === parseInt(filterMonth);
    const matchYear = filterYear === 'All' || poDate.getFullYear() === parseInt(filterYear);
    return matchMonth && matchYear;
  });

  const filteredVendors = vendors.filter(ven => {
    const venDate = new Date(ven.createdAt);
    const matchMonth = filterMonth === 'All' || (venDate.getMonth() + 1) === parseInt(filterMonth);
    const matchYear = filterYear === 'All' || venDate.getFullYear() === parseInt(filterYear);
    return matchMonth && matchYear;
  });

  const downloadCSVReport = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activeTab === 'entries') {
      headers = ['Invoice Number', 'Supplier', 'PO Ref', 'Total Amount', 'Currency', 'Amount Paid', 'Amount Due', 'Payment Status', 'Due Date', 'Created At'];
      rows = filteredEntries.map(entry => [
        entry.invoiceNumber,
        entry.vendor?.name || 'N/A',
        entry.poRef?.poNumber || 'Direct Purchase',
        entry.totalAmount.toFixed(2),
        activeCurrency,
        entry.amountPaid.toFixed(2),
        entry.amountDue.toFixed(2),
        entry.paymentStatus,
        entry.dueDate ? new Date(entry.dueDate).toLocaleDateString() : 'N/A',
        new Date(entry.createdAt).toLocaleDateString()
      ]);
      filename = `Purchase_Entries_Report_${filterMonth === 'All' ? 'All_Months' : 'Month_' + filterMonth}_${filterYear === 'All' ? 'All_Years' : filterYear}.csv`;
    } else if (activeTab === 'orders') {
      headers = ['PO Number', 'Supplier Vendor', 'GST Number', 'Total Amount', 'Currency', 'Status', 'Created At'];
      rows = filteredOrders.map(po => [
        po.poNumber,
        po.vendor?.name || 'N/A',
        po.vendor?.gstNumber || 'N/A',
        po.totalAmount.toFixed(2),
        activeCurrency,
        po.status,
        new Date(po.createdAt).toLocaleDateString()
      ]);
      filename = `Purchase_Orders_Report_${filterMonth === 'All' ? 'All_Months' : 'Month_' + filterMonth}_${filterYear === 'All' ? 'All_Years' : filterYear}.csv`;
    } else if (activeTab === 'vendors') {
      headers = ['Supplier Name', 'Payment Terms', 'Contact Person', 'Email', 'Phone', 'GSTIN', 'Created At'];
      rows = filteredVendors.map(ven => [
        ven.name,
        ven.paymentTerms,
        ven.contactPerson || 'N/A',
        ven.email,
        ven.phone || 'N/A',
        ven.gstNumber || 'N/A',
        new Date(ven.createdAt).toLocaleDateString()
      ]);
      filename = `Suppliers_Registry_Report_${filterMonth === 'All' ? 'All_Months' : 'Month_' + filterMonth}_${filterYear === 'All' ? 'All_Years' : filterYear}.csv`;
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

  // Form Modals Toggles
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);

  // Document Viewer State
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [docName, setDocName] = useState('');

  // PO Live Preview Modal State
  const [selectedPo, setSelectedPo] = useState(null);
  const [showPoPreviewModal, setShowPoPreviewModal] = useState(false);

  // Purchase Entry Specs Preview Modal State
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showEntryPreviewModal, setShowEntryPreviewModal] = useState(false);

  // 2. Vendor Form State
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    paymentTerms: 'Net 30',
  });

  // 3. Purchase Order Form State
  const [poForm, setPoForm] = useState({
    vendor: '',
    items: [{ name: '', quantity: 1, price: '', taxRate: 18 }],
    companyId: '',
  });

  // 4. Purchase Entry Form State
  const [entryForm, setEntryForm] = useState({
    poRef: '',
    vendor: '',
    invoiceNumber: '',
    totalAmount: '',
    amountPaid: '0',
    dueDate: '',
    items: [{ name: '', quantity: 1, price: '', warrantyMonths: 12 }],
    companyId: '',
  });
  const [invoiceFile, setInvoiceFile] = useState(null);

  // 5. Payment Log State
  const [payLogVal, setPayLogVal] = useState({});
  // Download state for PO buttons
  const [downloadingPoId, setDownloadingPoId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, entryRes, venRes, settingsRes] = await Promise.all([
        API.get('/purchase-orders'),
        API.get('/purchase-entries'),
        API.get('/vendors'),
        API.get('/settings'),
      ]);
      setOrders(poRes.data);
      setEntries(entryRes.data);
      setVendors(venRes.data);
      setCompanyProfiles(settingsRes.data);

      // Auto-prefills first vendor
      if (venRes.data.length > 0) {
        setPoForm(prev => ({ ...prev, vendor: venRes.data[0]._id }));
        setEntryForm(prev => ({ ...prev, vendor: venRes.data[0]._id }));
      }
      // Auto-prefills first company setting
      if (settingsRes.data.length > 0) {
        setPoForm(prev => ({ ...prev, companyId: settingsRes.data[0]._id }));
        setEntryForm(prev => ({ ...prev, companyId: settingsRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching procurement details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (url, name) => {
    setDocUrl(url);
    setDocName(name);
    setShowDocViewer(true);
  };

  // Download PO via the unified download endpoint
  const downloadPO = async (poId, poNumber) => {
    try {
      setDownloadingPoId(poId);
      const res = await API.get(`/purchase-orders/${poId}/download?format=pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${poNumber || 'purchase-order'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PO download failed:', err);
      alert('Failed to download Purchase Order PDF.');
    } finally {
      setDownloadingPoId(null);
    }
  };

  // Submit Vendor
  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/vendors', vendorForm);
      setVendorForm({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        gstNumber: '',
        paymentTerms: 'Net 30',
      });
      setShowAddVendor(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating supplier.');
    }
  };

  // PO Items Helpers
  const addPoItem = () => {
    setPoForm({
      ...poForm,
      items: [...poForm.items, { name: '', quantity: 1, price: '', taxRate: 18 }]
    });
  };

  const updatePoItem = (index, field, value) => {
    const newItems = [...poForm.items];
    newItems[index][field] = value;
    setPoForm({ ...poForm, items: newItems });
  };

  const removePoItem = (index) => {
    const newItems = poForm.items.filter((_, i) => i !== index);
    setPoForm({ ...poForm, items: newItems });
  };

  // Submit PO
  const handlePOSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post('/purchase-orders', poForm);
      setPoForm({
        vendor: vendors[0]?._id || '',
        items: [{ name: '', quantity: 1, price: '', taxRate: 18 }],
        companyId: companyProfiles[0]?._id || '',
      });
      setShowAddOrder(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating PO.');
    } finally {
      setLoading(false);
    }
  };

  // Entry Items Helpers
  const addEntryItem = () => {
    setEntryForm({
      ...entryForm,
      items: [...entryForm.items, { name: '', quantity: 1, price: '', warrantyMonths: 12 }]
    });
  };

  const updateEntryItem = (index, field, value) => {
    const newItems = [...entryForm.items];
    newItems[index][field] = value;
    setEntryForm({ ...entryForm, items: newItems });
  };

  const removeEntryItem = (index) => {
    const newItems = entryForm.items.filter((_, i) => i !== index);
    setEntryForm({ ...entryForm, items: newItems });
  };

  const handlePoRefChange = (poId) => {
    if (!poId) {
      setEntryForm(prev => ({
        ...prev,
        poRef: '',
        vendor: vendors[0]?._id || '',
        totalAmount: '',
        items: [{ name: '', quantity: 1, price: '', warrantyMonths: 12 }]
      }));
      return;
    }

    const selectedPo = orders.find(o => o._id === poId);
    if (selectedPo) {
      setEntryForm(prev => ({
        ...prev,
        poRef: poId,
        vendor: selectedPo.vendor?._id || selectedPo.vendor || '',
        totalAmount: selectedPo.totalAmount.toString(),
        items: selectedPo.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          warrantyMonths: 12
        }))
      }));
    }
  };

  // Submit Purchase Entry
  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    if (!invoiceFile) {
      alert('Supporting Invoice document upload is required.');
      return;
    }
    try {
      setLoading(true);
      const data = new FormData();
      data.append('poRef', entryForm.poRef);
      data.append('vendor', entryForm.vendor);
      data.append('invoiceNumber', entryForm.invoiceNumber);
      data.append('totalAmount', entryForm.totalAmount);
      data.append('amountPaid', entryForm.amountPaid);
      data.append('dueDate', entryForm.dueDate);
      data.append('items', JSON.stringify(entryForm.items));
      if (entryForm.companyId) {
        data.append('companyId', entryForm.companyId);
      }
      data.append('invoice', invoiceFile);

      await API.post('/purchase-entries', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEntryForm({
        poRef: '',
        vendor: vendors[0]?._id || '',
        invoiceNumber: '',
        totalAmount: '',
        amountPaid: '0',
        dueDate: '',
        items: [{ name: '', quantity: 1, price: '', warrantyMonths: 12 }],
        companyId: companyProfiles[0]?._id || '',
      });
      setInvoiceFile(null);
      setShowAddEntry(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating purchase entry.');
    } finally {
      setLoading(false);
    }
  };

  // Record payouts dynamically
  const handleRecordPayment = async (entryId) => {
    const payVal = Number(payLogVal[entryId]);
    if (isNaN(payVal) || payVal <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }
    try {
      await API.put(`/purchase-entries/${entryId}/payment`, { amountPaid: payVal });
      setPayLogVal(prev => ({ ...prev, [entryId]: '' }));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment tracking log failed.');
    }
  };

  // Compute stats metrics dynamically
  const totalDues = entries.reduce((sum, item) => sum + (item.amountDue || 0), 0);
  const totalPOAmount = orders.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  return (
    <div className="flex-1 bg-slate-50 p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)]">
      {/* ── PROCUREMENT KPIS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Outstanding Dues */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Payables</span>
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
              <AlertTriangle size={16} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900">₹{totalDues.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Pending payments to vendors</p>
        </div>

        {/* Issued PO Value */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Issued PO Value</span>
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingBag size={16} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900">₹{totalPOAmount.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500 mt-1">{orders.length} Purchase Orders active</p>
        </div>

        {/* Total Vendors */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Standard Suppliers</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Building size={16} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900">{vendors.length} Vendors</h3>
          <p className="text-[11px] text-slate-500 mt-1">Registered partner profiles</p>
        </div>
      </div>

      {/* ── TAB NAVIGATION ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 pb-4 mb-8 gap-4">
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1.5">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'entries'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-805 hover:bg-white shadow-sm border border-transparent hover:border-slate-150'
              }`}
          >
            <Landmark size={14} /> Purchase Entries ({filteredEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-805 hover:bg-white shadow-sm border border-transparent hover:border-slate-150'
              }`}
          >
            <FileCheck size={14} /> Purchase Orders ({filteredOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'vendors'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-805 hover:bg-white shadow-sm border border-transparent hover:border-slate-150'
              }`}
          >
            <Building size={14} /> Suppliers ({filteredVendors.length})
          </button>
        </div>

        {/* Dynamic Contextual Action Trigger */}
        <div className="flex justify-end">
          {activeTab === 'entries' && (
            <button
              onClick={() => setShowAddEntry(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={14} /> Log Entry
            </button>
          )}
          {activeTab === 'orders' && (
            <button
              onClick={() => setShowAddOrder(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={14} /> Draft PO
            </button>
          )}
          {activeTab === 'vendors' && (
            <button
              onClick={() => setShowAddVendor(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={14} /> Register Vendor
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-16">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 font-bold"></div>
          <p className="text-sm font-bold tracking-wide text-slate-550 mt-2">Loading procurement data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Reports & Filtering Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month Filter</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[140px]"
                >
                  <option value="All">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year Filter</span>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[110px]"
                >
                  <option value="All">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>

            <button
              onClick={downloadCSVReport}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 hover:-translate-y-0.5 transition-all self-end md:self-center"
            >
              <FileSpreadsheet size={14} />
              Download CSV Report
            </button>
          </div>

          {/* TAB 1: Purchase Entries */}
          {activeTab === 'entries' && (
            <>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">Goods Received & Purchase Entries</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Physical items processed with linked corporate invoices</p>
                  </div>
                  <Landmark className="text-blue-600" size={18} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <th className="px-6 py-4">Invoice details</th>
                        <th className="px-6 py-4">Financials</th>
                        <th className="px-6 py-4">Outstanding dues</th>
                        <th className="px-6 py-4">Invoice File</th>
                        <th className="px-6 py-4">Record Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                            No purchase entries matching the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((entry) => (
                          <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">Invoice: #{entry.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Supplier: {entry.vendor?.name} • PO: {entry.poRef?.poNumber || 'Direct Purchase'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-extrabold text-slate-900">{currencySymbol}{entry.totalAmount.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Paid: {currencySymbol}{entry.amountPaid.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-extrabold text-red-650">{currencySymbol}{entry.amountDue.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-550 mt-0.5 flex items-center gap-1.5">
                              Status:
                              <span className={`inline-flex text-[9px] font-black px-1.5 py-0.5 rounded-full ${entry.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : entry.paymentStatus === 'Partial'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {entry.paymentStatus}
                              </span>
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedEntry(entry);
                                  setShowEntryPreviewModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
                              >
                                <Eye size={13} className="text-slate-450" />
                                View
                              </button>
                              {entry.invoiceUrl ? (
                                <button
                                  onClick={() => handleViewDocument(entry.invoiceUrl, `Invoice #${entry.invoiceNumber}`)}
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-500 font-bold hover:underline cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50"
                                >
                                  <FileText size={13} /> File
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">No File</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {entry.amountDue > 0 ? (
                              <div className="flex items-center gap-2 max-w-[160px]">
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={payLogVal[entry._id] || ''}
                                  onChange={(e) => setPayLogVal({ ...payLogVal, [entry._id]: e.target.value })}
                                  className="w-20 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800 shadow-sm"
                                />
                                <button
                                  onClick={() => handleRecordPayment(entry._id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
                                >
                                  Log
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                Fully Settled
                              </span>
                            )}
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

          {/* TAB 2: Purchase Orders */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Issued Purchase Orders (POs)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Corporate PO records generated for vendor fulfillment</p>
                </div>
                <FileCheck className="text-blue-600" size={18} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="px-6 py-4">PO Number</th>
                      <th className="px-6 py-4">Supplier Vendor</th>
                      <th className="px-6 py-4">Aggregates Total</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                          No Purchase Orders matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((po) => (
                        <tr key={po._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{po.poNumber}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{po.vendor?.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">GST: {po.vendor?.gstNumber || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-emerald-600">₹{po.totalAmount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${po.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : po.status === 'Draft'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedPo(po);
                                  setShowPoPreviewModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
                              >
                                <Eye size={13} className="text-slate-450" />
                                View
                              </button>
                              <button
                                onClick={() => downloadPO(po._id, po.poNumber)}
                                disabled={downloadingPoId === po._id}
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-500 font-bold disabled:opacity-50 cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50"
                              >
                                {downloadingPoId === po._id
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <FileText size={14} />}
                                {downloadingPoId === po._id ? 'Generating...' : 'Download PDF'}
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
          )}

          {/* TAB 4: Suppliers Registry */}
          {activeTab === 'vendors' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Registered Suppliers</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Standard vendor profiles and GST listings</p>
                </div>
                <Building className="text-emerald-600" size={16} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400 font-medium">
                    No corporate suppliers matching the selected filters.
                  </div>
                ) : (
                  filteredVendors.map((ven) => (
                    <div
                      key={ven._id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                          <h5 className="font-bold text-xs text-slate-800 truncate pr-2">{ven.name}</h5>
                          <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 whitespace-nowrap">
                            {ven.paymentTerms}
                          </span>
                        </div>
                        <div className="space-y-2 text-[10px] text-slate-600">
                          <p><span className="font-bold text-slate-400">Contact:</span> {ven.contactPerson}</p>
                          <p><span className="font-bold text-slate-400">Email:</span> {ven.email}</p>
                          {ven.phone && <p><span className="font-bold text-slate-400">Phone:</span> {ven.phone}</p>}
                          {ven.gstNumber && <p><span className="font-bold text-slate-400">GSTIN:</span> {ven.gstNumber}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}
      {/* ================= MODAL: ADD VENDOR ================= */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleVendorSubmit}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-800">Register Supplier Vendor</h3>
              <button
                type="button"
                onClick={() => setShowAddVendor(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. Amazon Web Services"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Jane Smith"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="billing@aws.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="+91..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">GSTIN</label>
                  <input
                    type="text"
                    value={vendorForm.gstNumber}
                    onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="GSTIN"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Type of Payment</label>
                  <select
                    value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Address</label>
                <input
                  type="text"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Billing HQ Location"
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAddVendor(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-all bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition-colors"
              >
                Add Vendor
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ================= MODAL: ADD PURCHASE ORDER ================= */}
      {showAddOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handlePOSubmit}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-800">Draft Purchase Order (PO)</h3>
              <button
                type="button"
                onClick={() => setShowAddOrder(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Profile</label>
                  <select
                    required
                    value={poForm.companyId}
                    onChange={(e) => setPoForm({ ...poForm, companyId: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {companyProfiles.map((profile) => (
                      <option key={profile._id} value={profile._id}>{profile.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Supplier Vendor</label>
                  <select
                    required
                    value={poForm.vendor}
                    onChange={(e) => setPoForm({ ...poForm, vendor: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {vendors.map(ven => (
                      <option key={ven._id} value={ven._id}>{ven.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Array builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purchase Items Lists</label>
                  <button
                    type="button"
                    onClick={addPoItem}
                    className="text-xs text-blue-600 hover:text-blue-505 font-bold cursor-pointer transition-colors"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="space-y-3">
                  {poForm.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl relative">
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => updatePoItem(index, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Item name / specs"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          required
                          value={item.quantity}
                          onChange={(e) => updatePoItem(index, 'quantity', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Qty"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          required
                          value={item.price}
                          onChange={(e) => updatePoItem(index, 'price', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Price"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center justify-between gap-2">
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => updatePoItem(index, 'taxRate', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="GST %"
                        />
                        {poForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePoItem(index)}
                            className="text-red-505 hover:text-red-600 font-semibold cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAddOrder(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-all bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition-colors"
              >
                {loading ? 'Generating official PDF...' : 'Provision Purchase Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: ADD PURCHASE ENTRY ================= */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleEntrySubmit}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-800">Log Physical Purchase Entry</h3>
              <button
                type="button"
                onClick={() => setShowAddEntry(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Profile</label>
                  <select
                    required
                    value={entryForm.companyId}
                    onChange={(e) => setEntryForm({ ...entryForm, companyId: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {companyProfiles.map((profile) => (
                      <option key={profile._id} value={profile._id}>{profile.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Select Supplier Vendor</label>
                  <select
                    required
                    value={entryForm.vendor}
                    onChange={(e) => setEntryForm({ ...entryForm, vendor: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {vendors.map(ven => (
                      <option key={ven._id} value={ven._id}>{ven.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Linked PO Reference (Optional)</label>
                  <select
                    value={entryForm.poRef}
                    onChange={(e) => handlePoRefChange(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Direct Purchase (No PO Link)</option>
                    {orders.filter(o => o.status !== 'Completed').map(po => (
                      <option key={po._id} value={po._id}>{po.poNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Invoice Bill Number</label>
                  <input
                    type="text"
                    required
                    value={entryForm.invoiceNumber}
                    onChange={(e) => setEntryForm({ ...entryForm, invoiceNumber: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="INV-AWS-5523"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={entryForm.dueDate}
                    onChange={(e) => setEntryForm({ ...entryForm, dueDate: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Total Bill Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    value={entryForm.totalAmount}
                    onChange={(e) => setEntryForm({ ...entryForm, totalAmount: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Amount Paid Down ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    value={entryForm.amountPaid}
                    onChange={(e) => setEntryForm({ ...entryForm, amountPaid: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Upload Physical Invoice Bill (Required)</label>
                <div
                  onClick={() => invoiceFileInput.current.click()}
                  className="w-full bg-slate-50 border border-dashed border-slate-200 hover:border-blue-500 rounded-xl py-4 flex items-center justify-center gap-3 cursor-pointer transition-all"
                >
                  <FolderOpen className="text-blue-500" size={16} />
                  <span className="text-xs font-semibold text-slate-600">
                    {invoiceFile ? invoiceFile.name : 'Select Invoice Attachment'}
                  </span>
                  <input
                    type="file"
                    ref={invoiceFileInput}
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setInvoiceFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                </div>
              </div>

              {/* Entry item warranty lists */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider">Acquired Assets Specifications</label>
                  <button
                    type="button"
                    onClick={addEntryItem}
                    className="text-xs text-blue-600 hover:text-blue-505 font-bold cursor-pointer transition-colors"
                  >
                    + Add Asset Row
                  </button>
                </div>

                {entryForm.items.length > 0 && (
                  <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-5">Asset Specification Name</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Price ({currencySymbol})</div>
                    <div className="col-span-3">Warranty (Months)</div>
                  </div>
                )}

                <div className="space-y-2">
                  {entryForm.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 border border-slate-200 p-2 rounded-xl relative items-center">
                      <div className="md:col-span-5">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => updateEntryItem(index, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Asset specification name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          required
                          value={item.quantity}
                          onChange={(e) => updateEntryItem(index, 'quantity', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Qty"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          required
                          value={item.price}
                          onChange={(e) => updateEntryItem(index, 'price', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Price"
                        />
                      </div>
                      <div className="md:col-span-3 flex items-center justify-between gap-2">
                        <input
                          type="number"
                          required
                          value={item.warrantyMonths}
                          onChange={(e) => updateEntryItem(index, 'warrantyMonths', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Warranty (Months)"
                        />
                        {entryForm.items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeEntryItem(index)}
                            className="text-red-500 hover:text-red-600 font-semibold cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
                          >
                            ✕
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAddEntry(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-all bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition-all"
              >
                {loading ? 'Uploading supporting assets files...' : 'Log Purchase Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= DOCUMENT VIEWER MODAL ================= */}
      {showDocViewer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[85vh] flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <FileText className="text-blue-500" size={18} /> Document Preview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{docName}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`http://localhost:5000${docUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition-all"
                >
                  Download Invoice
                </a>
                <button
                  onClick={() => setShowDocViewer(false)}
                  className="text-slate-400 hover:text-slate-100 cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-800 transition-all font-bold text-xs bg-slate-850 border border-slate-800"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-855 flex items-center justify-center relative">
              {docUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`http://localhost:5000${docUrl}`}
                  className="w-full h-full border-0"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={`http://localhost:5000${docUrl}`}
                  alt="Document Preview"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PURCHASE ORDER LIVE VIEWER ================= */}
      {showPoPreviewModal && selectedPo && (() => {
        const activeCompany = selectedPo.companyId && typeof selectedPo.companyId === 'object'
          ? selectedPo.companyId
          : (companyProfiles.find(p => p._id === selectedPo.companyId) || companyProfiles[0] || {});

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowPoPreviewModal(false);
                  setSelectedPo(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Header info */}
              <div className="pb-6 mb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">OFFICIAL PURCHASE ORDER LIVE PREVIEW</span>
                </div>
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-blue-500" />
                  PO Document Viewer
                </h3>
              </div>

              {/* HIGH FIDELITY PAPER PO SHEET */}
              <div className="bg-[#FAF9F5] text-black border border-slate-350 p-6 sm:p-10 shadow-2xl rounded-sm space-y-6 select-text max-w-[800px] mx-auto text-left font-sans leading-relaxed">

                {/* Corporate Branding & Meta */}
                <div className="flex flex-row justify-between items-start gap-4 pb-4 border-b border-slate-300">
                  <div className="flex items-center gap-3">
                    {activeCompany.logoSquareUrl ? (
                      <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center overflow-hidden border border-slate-200 p-0.5">
                        <img src={`http://localhost:5000${activeCompany.logoSquareUrl}`} alt="Logo Icon" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="relative w-8 h-8 bg-[#002e6e] flex items-center justify-center font-black text-white text-xs select-none">
                        {(activeCompany.companyName || 'M')[0]}
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-black text-[#002e6e] uppercase tracking-tight">
                        {activeCompany.companyName || 'CORPORATE PROCUREMENT'}
                      </h2>
                      <p className="text-[7.5px] font-bold text-slate-500 tracking-[0.1em] uppercase leading-none">
                        {activeCompany.gstNumber ? `GSTIN: ${activeCompany.gstNumber} | ` : ''}Official Purchase Requisition
                      </p>
                    </div>
                  </div>

                  <div className="border border-black px-3.5 py-1.5 w-48 text-[9px] font-bold text-black flex flex-col justify-center gap-1 bg-white select-none">
                    <div>Date : {new Date(selectedPo.createdAt).toLocaleDateString('en-GB')}</div>
                    <div className="border-t border-slate-200 pt-1">PO No : {selectedPo.poNumber}</div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-xl font-extrabold text-[#002e6e] text-center uppercase tracking-wide my-2 select-none decoration-double underline">
                  PURCHASE ORDER
                </h1>

                {/* Vendor & Biller Address Sheets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] border-b border-slate-300 pb-4">
                  {/* Vendor profile */}
                  <div className="space-y-1 bg-white border border-slate-200 p-3">
                    <h4 className="font-extrabold text-[#002e6e] uppercase select-none mb-1 text-[9.5px]">Vendor / Supplier Info:</h4>
                    <p><span className="text-slate-500 font-semibold select-none">Company:</span> <span className="font-bold">{selectedPo.vendor?.name || 'N/A'}</span></p>
                    <p><span className="text-slate-500 font-semibold select-none">Contact:</span> {selectedPo.vendor?.contactPerson || 'N/A'}</p>
                    <p><span className="text-slate-500 font-semibold select-none">Email:</span> {selectedPo.vendor?.email || 'N/A'}</p>
                    <p><span className="text-slate-500 font-semibold select-none">Phone:</span> {selectedPo.vendor?.phone || 'N/A'}</p>
                    <p><span className="text-slate-500 font-semibold select-none">GSTIN:</span> {selectedPo.vendor?.gstNumber || 'N/A'}</p>
                    <p><span className="text-slate-500 font-semibold select-none">Address:</span> {selectedPo.vendor?.address || 'N/A'}</p>
                  </div>

                  {/* Corporate headquarters */}
                  <div className="space-y-1 bg-white border border-slate-200 p-3">
                    <h4 className="font-extrabold text-[#002e6e] uppercase select-none mb-1 text-[9.5px]">Deliver To (Corporate Billing):</h4>
                    <p className="font-bold">{activeCompany.companyName}</p>
                    <p className="text-slate-700 leading-normal">{activeCompany.address}</p>
                    {activeCompany.mobile && <p><span className="text-slate-500 font-semibold select-none">Mobile No:</span> {activeCompany.mobile}</p>}
                    <p><span className="text-slate-500 font-semibold select-none">Payment Terms:</span> <span className="font-bold text-slate-800">{selectedPo.vendor?.paymentTerms || 'Net 30'}</span></p>
                    <p><span className="text-slate-500 font-semibold select-none">Requisitioner:</span> Procurement Admin</p>
                  </div>
                </div>

                {/* Items breakdown table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[10px] text-black bg-white">
                    <thead>
                      <tr className="bg-[#e8e5d3] border-b border-black text-[9px] font-bold text-black select-none">
                        <th className="border-r border-black p-2 text-center w-10">S.NO</th>
                        <th className="border-r border-black p-2 text-left">Description Specs</th>
                        <th className="border-r border-black p-2 text-center w-16">Qty</th>
                        <th className="border-r border-black p-2 text-right w-24">Unit Price</th>
                        <th className="border-r border-black p-2 text-center w-14">GST Rate</th>
                        <th className="p-2 text-right w-28">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPo.items || []).map((item, index) => {
                        const qty = item.quantity || item.qty || 1;
                        const price = item.price || 0;
                        const taxRate = item.taxRate || 18;
                        const rowTotal = qty * price;

                        return (
                          <tr key={index} className="border-b border-slate-200">
                            <td className="border-r border-black p-2 text-center">{index + 1}</td>
                            <td className="border-r border-black p-2 text-left font-medium">{item.name}</td>
                            <td className="border-r border-black p-2 text-center">{qty}</td>
                            <td className="border-r border-black p-2 text-right">₹{price.toFixed(2)}</td>
                            <td className="border-r border-black p-2 text-center">{taxRate}%</td>
                            <td className="p-2 text-right font-semibold">₹{rowTotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}

                      {/* Calculations summary row block */}
                      <tr className="border-t border-black h-8 text-[9.5px]">
                        <td colSpan="3" className="border-r border-black p-2 bg-[#fcfbf9]"></td>
                        <td colSpan="2" className="border-r border-black p-2 text-right font-bold uppercase select-none">Subtotal:</td>
                        <td className="p-2 text-right font-semibold">
                          ₹{(selectedPo.totalAmount - (selectedPo.taxAmount || 0)).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-t border-slate-300 h-8 text-[9.5px]">
                        <td colSpan="3" className="border-r border-black p-2 bg-[#fcfbf9]"></td>
                        <td colSpan="2" className="border-r border-black p-2 text-right font-bold uppercase select-none">Tax (GST Amt):</td>
                        <td className="p-2 text-right font-semibold">
                          ₹{(selectedPo.taxAmount || 0).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-[#e8e5d3] font-bold border-t border-black h-8 text-black text-[10px]">
                        <td colSpan="3" className="border-r border-black p-2"></td>
                        <td colSpan="2" className="border-r border-black p-2 text-right uppercase tracking-wider select-none">Grand Total Cost:</td>
                        <td className="p-2 text-right">₹{selectedPo.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Spell-out & signature */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[9.5px] text-black pt-4 border-t border-slate-300">
                  <div className="md:col-span-7 space-y-2">
                    <div>
                      <p className="text-slate-500 font-semibold uppercase select-none">Amount in Words (Rupee Speller):</p>
                      <p className="font-extrabold text-black pr-2">{priceToWords(selectedPo.totalAmount)}</p>
                    </div>
                    {activeCompany.bankName && (
                      <div className="pt-2 border-t border-slate-200/60 mt-2 space-y-0.5">
                        <p className="text-[#002e6e] font-bold uppercase select-none">Payment Bank Details:</p>
                        <p><span className="text-slate-500">A/c Holder:</span> {activeCompany.accountHolderName}</p>
                        <p><span className="text-slate-500">Bank:</span> {activeCompany.bankName} | <span className="text-slate-500">A/c No:</span> {activeCompany.accountNumber}</p>
                        <p><span className="text-slate-500">IFS Code:</span> {activeCompany.ifscCode}</p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-5 flex flex-col justify-end space-y-1 pl-4 border-l border-slate-200">
                    <p className="text-slate-500 font-bold uppercase select-none mb-1">Corporate Authorizations</p>
                    <p className="text-[#333333]"><span className="text-slate-400 select-none">Authorized Signatory:</span> Chief Procurement Officer</p>
                    <div className="border-t border-dashed border-slate-400 mt-4 pt-1 w-32 text-center text-slate-500 italic select-none">
                      {activeCompany.companyName || 'Procurement Seal'}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setShowPoPreviewModal(false);
                    setSelectedPo(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-855 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: PURCHASE ENTRY SPECS VIEWER ================= */}
      {showEntryPreviewModal && selectedEntry && (() => {
        const activeCompany = selectedEntry.companyId && typeof selectedEntry.companyId === 'object'
          ? selectedEntry.companyId
          : (companyProfiles.find(p => p._id === selectedEntry.companyId) || companyProfiles[0] || {});

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowEntryPreviewModal(false);
                  setSelectedEntry(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Header info */}
              <div className="pb-6 mb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-450 uppercase tracking-widest">REAL-TIME PURCHASE ENTRY SPECIFICATIONS AUDITOR</span>
                </div>
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <Landmark size={20} className="text-blue-500" />
                  Goods Inward Specification Auditor
                </h3>
              </div>

              {/* SPLIT PANEL LAYOUT: LEFT SIDE FOR SPECS, RIGHT SIDE FOR INVOICE PDF */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                {/* LEFT SIDE: ASSETS SPECS AND AUDIT INFORMATION */}
                <div className="lg:col-span-6 space-y-6">

                  {/* Meta details card */}
                  <div className="bg-slate-950 border border-slate-855 p-5 rounded-2xl space-y-3 shadow-md">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider border-b border-slate-850 pb-2">Entry Metadata Details</h4>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-500 font-medium">Invoice Number</p>
                        <p className="font-extrabold text-slate-200 mt-0.5">#{selectedEntry.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Company Profile</p>
                        <div className="flex items-center gap-2 mt-1">
                          {activeCompany.logoSquareUrl ? (
                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center overflow-hidden border border-slate-700 p-0.5">
                              <img src={`http://localhost:5000${activeCompany.logoSquareUrl}`} alt="Logo Icon" className="max-w-full max-h-full object-contain" />
                            </div>
                          ) : (
                            <div className="relative w-4 h-4 bg-blue-600 rounded flex items-center justify-center font-black text-white text-[8px] select-none">
                              {(activeCompany.companyName || 'M')[0]}
                            </div>
                          )}
                          <span className="font-extrabold text-slate-200">{activeCompany.companyName || 'N/A'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Supplier Vendor</p>
                        <p className="font-extrabold text-slate-200 mt-0.5">{selectedEntry.vendor?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Linked PO Reference</p>
                        <p className="font-semibold text-blue-400 mt-0.5">{selectedEntry.poRef?.poNumber || 'Direct Purchase / No PO'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Payment Due Date</p>
                        <p className="font-semibold text-slate-350 mt-0.5">
                          {selectedEntry.dueDate ? new Date(selectedEntry.dueDate).toLocaleDateString('en-GB') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Ledger Audit */}
                  <div className="bg-slate-950 border border-slate-855 p-5 rounded-2xl space-y-3 shadow-md">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider border-b border-slate-850 pb-2">Financial Allocation Audit</h4>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Total Bill Amt</p>
                        <p className="font-black text-slate-100 text-sm mt-1">₹{selectedEntry.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Paid amount</p>
                        <p className="font-black text-emerald-400 text-sm mt-1">₹{selectedEntry.amountPaid.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Outstanding</p>
                        <p className={`font-black text-sm mt-1 ${selectedEntry.amountDue > 0 ? 'text-red-400' : 'text-emerald-450'}`}>
                          ₹{selectedEntry.amountDue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <span className="text-slate-500 font-medium">Ledger Status:</span>
                      <span className={`inline-flex text-[10px] font-black px-2.5 py-0.5 rounded-full border ${selectedEntry.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : selectedEntry.paymentStatus === 'Partial'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {selectedEntry.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Acquired Assets Specs Breakdown */}
                  <div className="bg-slate-950 border border-slate-855 p-5 rounded-2xl space-y-3 shadow-md">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider border-b border-slate-850 pb-2">Acquired Assets Specifications</h4>

                    <div className="overflow-hidden border border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                            <th className="p-3">Asset Spec Name</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-center">Warranty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-855 text-slate-200">
                          {(selectedEntry.items || []).map((item, index) => {
                            const warranty = item.warrantyMonths || 0;
                            return (
                              <tr key={index} className="hover:bg-slate-900/40">
                                <td className="p-3 font-semibold text-slate-250 leading-tight">{item.name}</td>
                                <td className="p-3 text-center font-bold text-slate-350">{item.quantity}</td>
                                <td className="p-3 text-right font-bold text-slate-100">₹{item.price.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black ${warranty < 12 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                    {warranty} M
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* RIGHT SIDE: CORRESPONDING SUPPLIER INVOICE DOCUMENT PREVIEW */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="text-blue-500" size={14} /> Supporting Physical Bill PDF / Image
                    </h4>
                    {selectedEntry.invoiceUrl && (
                      <a
                        href={`http://localhost:5000${selectedEntry.invoiceUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-extrabold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        Open Fullscreen ↗
                      </a>
                    )}
                  </div>

                  <div className="flex-1 min-h-[400px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-850 flex items-center justify-center relative shadow-md">
                    {selectedEntry.invoiceUrl ? (
                      selectedEntry.invoiceUrl.toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={`http://localhost:5000${selectedEntry.invoiceUrl}`}
                          className="w-full h-full border-0"
                          title="Supplier Invoice Preview"
                        />
                      ) : (
                        <img
                          src={`http://localhost:5000${selectedEntry.invoiceUrl}`}
                          alt="Supplier Invoice Preview"
                          className="max-w-full max-h-full object-contain p-2"
                        />
                      )
                    ) : (
                      <div className="text-center text-xs text-slate-500 font-semibold p-6 select-none">
                        No supporting physical supplier bill document uploaded for this entry.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setShowEntryPreviewModal(false);
                    setSelectedEntry(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close Specs Auditor
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Purchases;
