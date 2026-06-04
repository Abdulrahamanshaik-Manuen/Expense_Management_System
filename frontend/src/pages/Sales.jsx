import React, { useEffect, useState, useRef } from 'react';
import { capturePreviewAsPDF } from '../utils/capturePreviewAsPDF';
import API from '../services/api';
import {
  Plus,
  Trash,
  FileText,
  Calendar,
  Layers,
  CreditCard,
  User,
  ShoppingBag,
  Briefcase,
  AlertTriangle,
  Loader2,
  Download,
  X,
  Eye,
  FileSpreadsheet,
  Edit
} from 'lucide-react';

/** Indian/Western Currency Number-to-Words */
function priceToWords(price, currency = 'INR') {
  const unitName = 'Rupees';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ',
    'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ',
    'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let num = Math.floor(price);
  if (num === 0) return `Zero ${unitName} only`;

  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + unitName + ' ' : unitName + ' ';
  return str.trim() + ' only';
}

const Sales = () => {

  const [activeTab, setActiveTab] = useState('invoices'); // invoices, products
  const [user, setUser] = useState({ role: 'admin' });
  const [loading, setLoading] = useState(false);

  // DB structures
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [companyProfiles, setCompanyProfiles] = useState([]);

  // Filter States
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  const activeCompanyId = localStorage.getItem('selectedCompanyId');
  const activeCompany = companyProfiles.find(p => p._id === activeCompanyId) || companyProfiles[0];
  const activeCurrency = activeCompany?.currency || 'INR';
  const currencySymbol = '';

  const filteredInvoices = invoices.filter(inv => {
    const matchCompany = !activeCompanyId || (inv.companyId?._id || inv.companyId) === activeCompanyId;
    if (!matchCompany) return false;

    const invDate = new Date(inv.invoiceDate || inv.createdAt);
    const matchMonth = filterMonth === 'All' || (invDate.getMonth() + 1) === parseInt(filterMonth);
    const matchYear = filterYear === 'All' || invDate.getFullYear() === parseInt(filterYear);
    return matchMonth && matchYear;
  });

  const downloadCSVReport = () => {
    const headers = ['Invoice Number', 'Date', 'Customer Name', 'Customer Email', 'Customer Company', 'Subtotal', 'Tax Amount', 'Total Amount', 'Currency', 'Amount Paid', 'Amount Due', 'Payment Status'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString(),
      inv.customerName,
      inv.customerEmail,
      inv.customerCompany || '',
      (inv.totalAmount - inv.taxAmount).toFixed(2),
      inv.taxAmount.toFixed(2),
      inv.totalAmount.toFixed(2),
      activeCurrency,
      inv.amountPaid.toFixed(2),
      inv.amountDue.toFixed(2),
      inv.paymentStatus
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Report_${filterMonth === 'All' ? 'All_Months' : 'Month_' + filterMonth}_${filterYear === 'All' ? 'All_Years' : filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Modals / Toggles
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedInvoiceForExport, setSelectedInvoiceForExport] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);


  // Form states
  // 1. Product catalog
  const [prodForm, setProdForm] = useState({
    name: '',
    category: 'Website Development',
    price: '',
    description: '',
  });

  // 2. Sale Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '',
    customerCompany: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerGst: '',
    amountPaid: '0',
    companyId: '',
    items: [{ name: '', quantity: 1, price: '', discount: 0, taxRate: 18 }],
  });

  // 3. Log sales payment receipts values
  const [payReceiptVal, setPayReceiptVal] = useState({});
  // Download state for invoice buttons
  const [downloadingInvId, setDownloadingInvId] = useState(null);
  const [capturingPDF, setCapturingPDF] = useState(false);
  // Ref for the preview paper sheet element
  const invoicePaperRef = useRef(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      setUser(JSON.parse(userString));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, prodRes, settingsRes] = await Promise.all([
        API.get('/invoices'),
        API.get('/products'),
        API.get('/settings'),
      ]);
      setInvoices(invRes.data);
      setProducts(prodRes.data);
      setCompanyProfiles(settingsRes.data);
      if (settingsRes.data && settingsRes.data.length > 0) {
        const activeId = localStorage.getItem('selectedCompanyId') || settingsRes.data[0]._id;
        setInvoiceForm(prev => ({
          ...prev,
          companyId: activeId
        }));
      }
    } catch (err) {
      console.error('Error fetching sales details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Download invoice via unified download endpoint with format and dynamic companyId selection
  const downloadInvoice = async (id, invoiceNumber, format = 'pdf', companyId = '') => {
    try {
      setDownloadingInvId(id);
      const res = await API.get(`/invoices/${id}/download?format=${format}&companyId=${companyId}`, {
        responseType: 'blob',
      });
      const mime = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const ext = format === 'pdf' ? 'pdf' : 'docx';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber || 'invoice'}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert(`Failed to download invoice as ${format.toUpperCase()}.`);
    } finally {
      setDownloadingInvId(null);
    }
  };

  // Submit Product
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/products', prodForm);
      setProdForm({ name: '', category: 'Website Development', price: '', description: '' });
      setShowAddProduct(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Are you sure you want to delete this catalogue product?')) return;
    try {
      await API.delete(`/products/${prodId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting product.');
    }
  };

  // Multi item sales invoices handlers
  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { name: '', quantity: 1, price: '', discount: 0, taxRate: 18 }]
    });
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const removeInvoiceItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  // Pre-select predefined product into item row
  const selectCatalogProduct = (index, prodId) => {
    const matched = products.find(p => p._id === prodId);
    if (!matched) return;
    updateInvoiceItem(index, 'name', matched.name);
    updateInvoiceItem(index, 'price', matched.price);
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditing) {
        await API.put(`/invoices/${editingId}`, invoiceForm);
      } else {
        await API.post('/invoices', invoiceForm);
      }
      setInvoiceForm({
        customerName: '',
        customerCompany: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        customerGst: '',
        amountPaid: '0',
        companyId: localStorage.getItem('selectedCompanyId') || companyProfiles[0]?._id || '',
        items: [{ name: '', quantity: 1, price: '', discount: 0, taxRate: 18 }],
      });
      setIsEditing(false);
      setEditingId(null);
      setShowAddInvoice(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error compiling Sales Invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = (inv) => {
    setIsEditing(true);
    setEditingId(inv._id);
    setInvoiceForm({
      customerName: inv.customerName || '',
      customerCompany: inv.customerCompany || '',
      customerPhone: inv.customerPhone || '',
      customerEmail: inv.customerEmail || '',
      customerAddress: inv.customerAddress || '',
      customerGst: inv.customerGst || '',
      amountPaid: inv.amountPaid !== undefined ? inv.amountPaid.toString() : '0',
      companyId: inv.companyId?._id || inv.companyId || companyProfiles[0]?._id || '',
      items: inv.items && inv.items.length > 0
        ? inv.items.map(item => ({
            name: item.name || item.description || '',
            quantity: item.quantity || 1,
            price: item.price || item.unitPrice || '',
            discount: item.discount || 0,
            taxRate: item.taxRate !== undefined ? item.taxRate : 18
          }))
        : [{ name: '', quantity: 1, price: '', discount: 0, taxRate: 18 }]
    });
    setShowAddInvoice(true);
  };

  const handleDeleteInvoice = async (invId) => {
    if (!window.confirm('Are you sure you want to delete this invoice permanently?')) return;
    try {
      setLoading(true);
      await API.delete(`/invoices/${invId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting invoice.');
    } finally {
      setLoading(false);
    }
  };

  const closeInvoiceModal = () => {
    setShowAddInvoice(false);
    setIsEditing(false);
    setEditingId(null);
    setInvoiceForm({
      customerName: '',
      customerCompany: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      customerGst: '',
      amountPaid: '0',
      companyId: localStorage.getItem('selectedCompanyId') || companyProfiles[0]?._id || '',
      items: [{ name: '', quantity: 1, price: '', discount: 0, taxRate: 18 }],
    });
  };

  // Log payment receipts against invoice dues
  const handleRecordSalesPayment = async (invId) => {
    const payVal = Number(payReceiptVal[invId]);
    if (isNaN(payVal) || payVal <= 0) {
      alert('Please enter a valid paid amount.');
      return;
    }
    try {
      await API.put(`/invoices/${invId}/payment`, { amountPaid: payVal });
      setPayReceiptVal(prev => ({ ...prev, [invId]: '' }));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Receipt tracking log failed.');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)]">
      {/* Top Tab Controls */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
          >
            Service Billings
          </button>
        </div>

        <div>
          {activeTab === 'invoices' && (
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingId(null);
                setInvoiceForm({
                  customerName: '',
                  customerCompany: '',
                  customerPhone: '',
                  customerEmail: '',
                  customerAddress: '',
                  customerGst: '',
                  amountPaid: '0',
                  companyId: localStorage.getItem('selectedCompanyId') || companyProfiles[0]?._id || '',
                  items: [{ name: '', quantity: 1, price: '', discount: 0, taxRate: 18 }],
                });
                setShowAddInvoice(true);
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/10"
            >
              <Plus size={16} /> Create Invoice
            </button>
          )}

          {activeTab === 'products' && user.role === 'admin' && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/10"
            >
              <Plus size={16} /> Create Service Product
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-slate-500 text-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs">Processing tax invoice secure registers...</span>
        </div>
      )}

      {/* ================= TAB 1: INVOICES REGISTRY ================= */}
      {!loading && activeTab === 'invoices' && (
        <>
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

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Invoice details</th>
                    <th className="px-6 py-4">Client Contact</th>
                    <th className="px-6 py-4">Total & Tax</th>
                    <th className="px-6 py-4">Balances Dues</th>
                    <th className="px-6 py-4">Invoice PDF & Actions</th>
                    <th className="px-6 py-4">Record Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-500 font-medium">
                        No invoices found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{inv.invoiceNumber}</p>
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar size={12} /> Issued: {new Date(inv.invoiceDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{inv.customerName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {inv.customerEmail} {inv.customerCompany && `• ${inv.customerCompany}`}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-800">{currencySymbol}{inv.totalAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Tax (GST): {currencySymbol}{inv.taxAmount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <p className={`font-extrabold ${inv.amountDue > 0 ? 'text-red-650' : 'text-emerald-600'} leading-none`}>
                            {currencySymbol}{inv.amountDue.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Paid: <span className="font-bold text-slate-700">{currencySymbol}{(inv.amountPaid || 0).toLocaleString()}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Status:
                            <span className={`ml-1 inline-flex text-[9px] font-black px-1.5 py-0.5 rounded-full ${inv.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              inv.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                            {inv.paymentStatus}
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setSelectedCompanyId(inv.companyId?._id || inv.companyId || companyProfiles[0]?._id || '');
                              setShowPreviewModal(true);
                            }}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
                          >
                            <Eye size={13} className="text-slate-500" />
                            View
                          </button>
                          <button
                            onClick={() => handleEditInvoice(inv)}
                            className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-blue-650 px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
                            title="Edit Invoice"
                          >
                            <Edit size={13} className="text-blue-500" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(inv._id)}
                            className="inline-flex items-center gap-1 bg-white hover:bg-slate-55 border border-slate-200 text-red-650 px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
                            title="Delete Invoice"
                          >
                            <Trash size={13} className="text-red-500" />
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvoiceForExport(inv);
                              setSelectedCompanyId(inv.companyId?._id || inv.companyId || companyProfiles[0]?._id || '');
                              setShowExportModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-500 font-semibold cursor-pointer"
                          >
                            <FileText size={14} /> Export
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {inv.amountDue > 0 ? (
                          <div className="flex items-center gap-2 max-w-[160px]">
                            <input
                              type="number"
                              placeholder="Record Pay"
                              value={payReceiptVal[inv._id] || ''}
                              onChange={(e) => setPayReceiptVal({ ...payReceiptVal, [inv._id]: e.target.value })}
                              className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                            />
                            <button
                              onClick={() => handleRecordSalesPayment(inv._id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2.5 py-1 text-xs font-bold transition-all cursor-pointer"
                            >
                              Log
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Paid Settled
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

      {/* ================= TAB 2: SERVICE CATALOGUE ================= */}
      {!loading && activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium md:col-span-3">
              No products configured in catalog catalogue.
            </div>
          ) : (
            products.map((prod) => (
              <div key={prod._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-extrabold text-base text-slate-800 leading-tight">{prod.name}</h4>
                    <span className="inline-flex text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">
                      {prod.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {prod.description || 'No descriptive description allocated.'}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  <span className="text-lg font-black text-slate-900">{currencySymbol}{prod.price.toLocaleString()}</span>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteProduct(prod._id)}
                      className="p-1 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-650 border border-slate-200 hover:border-red-200 rounded cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* ================= MODAL: ADD PRODUCT ================= */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleProductSubmit}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-900">Register Catalog Service</h3>
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">Service Name</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. Standard Website Package"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Website Development">Website Development</option>
                    <option value="Mobile App Development">Mobile App Development</option>
                    <option value="Software Development">Software Development</option>
                    <option value="SaaS Services">SaaS Services</option>
                    <option value="API Services">API Services</option>
                    <option value="Maintenance Services">Maintenance Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">Base Pricing</label>
                  <input
                    type="number"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">Description Detail</label>
                <textarea
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  rows="3"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Specs, frameworks, deliverables..."
                ></textarea>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-all bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition-colors"
              >
                Register Package
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: ADD SALES TAX INVOICE ================= */}
      {showAddInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleInvoiceSubmit}
            className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-900">{isEditing ? 'Edit Tax Sale Invoice' : 'Draw Tax Sale Invoice'}</h3>
              <button
                type="button"
                onClick={closeInvoiceModal}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
              
              {/* Billing Company Selector */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={12} className="text-blue-500" /> Billing Company Setting Profile
                </h4>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-650 mb-1">Select Billing Profile</label>
                  <select
                    value={invoiceForm.companyId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, companyId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer h-9"
                  >
                    {companyProfiles.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.companyName} ({p.gstNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Inline Info Section */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <User size={12} className="text-blue-500" /> Client Billing Inline Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Customer Full Name</label>
                    <input
                      type="text"
                      required
                      value={invoiceForm.customerName}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Corporate Email</label>
                    <input
                      type="email"
                      required
                      value={invoiceForm.customerEmail}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerEmail: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9"
                      placeholder="john@doecompany.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={invoiceForm.customerPhone}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerPhone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9"
                      placeholder="+91..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={invoiceForm.customerCompany}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerCompany: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9"
                      placeholder="Doe Tech Solutions"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={invoiceForm.customerGst}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerGst: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9"
                      placeholder="07AAAAA1111A1Z1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Billing Address</label>
                  <input
                    type="text"
                    value={invoiceForm.customerAddress}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerAddress: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9"
                    placeholder="Physical workplace location address..."
                  />
                </div>
              </div>

              {/* Invoice Items builder */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag size={12} className="text-emerald-500" /> Billed Products Lists
                  </h4>
                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="text-xs text-blue-600 hover:text-blue-500 font-semibold cursor-pointer transition-colors"
                  >
                    + Add Item Row
                  </button>
                </div>

                {invoiceForm.items.length > 0 && (
                  <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-3">Catalogue Auto-fill</div>
                    <div className="col-span-3">Item Title / Detail</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-1">Disc</div>
                    <div className="col-span-2">GST %</div>
                  </div>
                )}

                <div className="space-y-2">
                  {invoiceForm.items.map((item, index) => (
                    <div key={index} className="flex flex-col md:grid md:grid-cols-12 gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl relative items-center">
                      
                      {/* Catalogue Auto-fill */}
                      <div className="col-span-3 w-full">
                        <label className="block md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catalogue Auto-fill</label>
                        <select
                          onChange={(e) => selectCatalogProduct(index, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer h-9"
                        >
                          <option value="">-- Auto fill --</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Item Title / Detail */}
                      <div className="col-span-3 w-full">
                        <label className="block md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Title / Detail</label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => updateInvoiceItem(index, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9"
                          placeholder="Item Title"
                        />
                      </div>

                      {/* Qty */}
                      <div className="col-span-1 w-full">
                        <label className="block md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qty</label>
                        <input
                          type="number"
                          required
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9 text-center"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-2 w-full">
                        <label className="block md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price</label>
                        <input
                          type="number"
                          required
                          value={item.price}
                          onChange={(e) => updateInvoiceItem(index, 'price', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9"
                          placeholder="Price"
                        />
                      </div>

                      {/* Discount */}
                      <div className="col-span-1 w-full">
                        <label className="block md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Disc</label>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateInvoiceItem(index, 'discount', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9"
                          placeholder="Disc"
                        />
                      </div>

                      {/* GST % & Action */}
                      <div className="col-span-2 w-full flex items-center justify-between gap-2">
                        <div className="w-full">
                          <label className="block md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST %</label>
                          <input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) => updateInvoiceItem(index, 'taxRate', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-9 text-center"
                          />
                        </div>
                        {invoiceForm.items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeInvoiceItem(index)}
                            className="text-red-500 hover:text-red-700 font-semibold cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
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

              {/* Payment logged */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Advanced Paid</label>
                  <input
                    type="number"
                    value={invoiceForm.amountPaid}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amountPaid: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500 h-9"
                    placeholder="0.00"
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={closeInvoiceModal}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition-all"
              >
                {loading ? (isEditing ? 'Saving Changes...' : 'Compiling corporate PDF...') : (isEditing ? 'Save Changes' : 'Get Invoice')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: DYNAMIC EXPORT BILLING COMPANY SELECTOR ================= */}
      {showExportModal && selectedInvoiceForExport && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in animate-duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setShowExportModal(false);
                setSelectedInvoiceForExport(null);
              }}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer animate-duration-200"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
                <FileText size={24} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Export Invoice</h3>
              <p className="text-xs text-slate-655 mt-2 leading-relaxed">
                Generate and download tax invoice <span className="font-semibold text-slate-800">{selectedInvoiceForExport.invoiceNumber}</span>. Select a billing company profile below to dynamically compile its styling, branding, and billing details onto the document.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Billing Company Profile
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Use Default / System Registered --</option>
                  {companyProfiles.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.companyName} ({p.gstNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => downloadInvoice(selectedInvoiceForExport._id, selectedInvoiceForExport.invoiceNumber, 'pdf', selectedCompanyId)}
                  disabled={downloadingInvId === selectedInvoiceForExport._id}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-3 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {downloadingInvId === selectedInvoiceForExport._id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Download PDF
                    </>
                  )}
                </button>

                <button
                  onClick={() => downloadInvoice(selectedInvoiceForExport._id, selectedInvoiceForExport.invoiceNumber, 'docx', selectedCompanyId)}
                  disabled={downloadingInvId === selectedInvoiceForExport._id}
                  className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {downloadingInvId === selectedInvoiceForExport._id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Download Word
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: IN-BROWSER TAX INVOICE LIVE VIEWER ================= */}
      {showPreviewModal && selectedInvoice && (() => {
        // Resolve active company biller profile from the invoice's saved company details
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

        // Self-heal and normalize line items: support both SaleInvoice and standard Invoice
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

        const totalAmountVal  = Number(selectedInvoice.totalAmount || selectedInvoice.total || itemsList.reduce((acc, item) => acc + item.total, 0)) || 0;
        const taxAmountVal    = Number(selectedInvoice.taxAmount)   || (totalAmountVal * 18 / 118);
        const cgstVal         = taxAmountVal / 2;
        const sgstVal         = taxAmountVal / 2;
        const baseAmountVal   = totalAmountVal - taxAmountVal;
        const totalQuantity   = (selectedInvoice.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
        const amountPaidVal   = Number(selectedInvoice.amountPaid || 0);
        const amountDueVal    = Number(selectedInvoice.amountDue !== undefined ? selectedInvoice.amountDue : (totalAmountVal - amountPaidVal));

        return (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in text-slate-800">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 text-slate-800 text-left">
              
              {/* Close Button top corner */}
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedInvoice(null);
                }}
                className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Title & Biller Header (Selector Removed) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">In-Browser PDF Document Live Preview</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-blue-500" />
                    Tax Invoice Preview
                  </h3>
                </div>
              </div>

              {/* HIGH FIDELITY PAPER SHEET (MATCHES PDF EXACTLY) */}
              <div ref={invoicePaperRef} className="bg-[#FAF9F5] text-black border border-slate-350 p-6 sm:p-12 shadow-2xl rounded-sm space-y-6 select-text max-w-[800px] mx-auto text-left font-sans leading-relaxed">
                
                {/* Meta details & branding header */}
                <div className="flex flex-row justify-between items-start gap-4 pb-4">
                  {/* Company Logo or Fallback vector branding */}
                  <div>
                    {activeBiller.logoSquareUrl ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src={activeBiller.logoSquareUrl.startsWith('http') || activeBiller.logoSquareUrl.startsWith('data:') ? activeBiller.logoSquareUrl : `http://localhost:5000${activeBiller.logoSquareUrl}`} 
                          alt="Company Logo" 
                          className="w-20 h-20 object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {activeBiller.logoUrl ? (
                          <img 
                            src={activeBiller.logoUrl.startsWith('http') || activeBiller.logoUrl.startsWith('data:') ? activeBiller.logoUrl : `http://localhost:5000${activeBiller.logoUrl}`} 
                            alt="Brand Logo" 
                            className="h-20 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <h2 className="text-sm font-bold text-[#002e6e]">{activeBiller.companyName}</h2>
                        )}
                      </div>
                    ) : activeBiller.logoUrl ? (
                      <img 
                        src={activeBiller.logoUrl.startsWith('http') || activeBiller.logoUrl.startsWith('data:') ? activeBiller.logoUrl : `http://localhost:5000${activeBiller.logoUrl}`} 
                        alt="Brand Logo" 
                        className="h-20 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      /* Exact Vector Fallback matched to drawVectorLogo */
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 bg-[#002e6e] flex items-center justify-center">
                          <div className="absolute top-1.5 w-2 h-2 bg-[#2fa64f] rounded-full"></div>
                          <div className="absolute bottom-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white"></div>
                          <div className="absolute bottom-1 w-1.5 h-2.5 bg-[#2fa64f]"></div>
                        </div>
                        <div>
                          <h2 className="text-[17px] font-black text-[#002e6e] leading-none select-none tracking-tight">{activeBiller.companyName.toUpperCase()}</h2>
                          <div className="h-[1.5px] bg-[#002e6e] mt-1.5 w-32"></div>
                          <div className="h-[1.5px] bg-[#2fa64f] mt-[1px] w-32"></div>
                          <p className="text-[8px] font-black text-[#2fa64f] tracking-[0.25em] mt-1 text-center w-32 uppercase leading-none">i n f o t e c h</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date & Invoice Info (No Box) */}
                  <div className="text-[10px] font-bold text-black flex flex-col justify-center gap-1 bg-transparent select-none text-right">
                    <div>Date : {new Date(selectedInvoice.invoiceDate || selectedInvoice.date || selectedInvoice.createdAt).toLocaleDateString('en-GB')}</div>
                    <div>Invoice No : {selectedInvoice.invoiceNumber || 'N/A'}</div>
                  </div>
                </div>

                {/* Big centered title */}
                <h1 className="text-2xl font-black text-[#00b4d8] text-center uppercase tracking-wider my-4 select-none">
                  INVOICE
                </h1>

                {/* FROM / BILL TO boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-black">
                  {/* FROM section */}
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

                  {/* BILL TO section */}
                  <div className="border border-[#cccccc] rounded-none overflow-hidden flex flex-col bg-white">
                    <div className="bg-[#e8e5d3] border-b border-[#cccccc] px-3 py-1 text-[9px] font-bold text-black uppercase select-none">
                      BILL TO
                    </div>
                    <div className="p-3 leading-relaxed space-y-1">
                      <p className="font-bold text-[10.5px] text-black uppercase">{selectedInvoice.customerName || selectedInvoice.client || 'N/A'}</p>
                      <p className="text-[#333333] whitespace-pre-line">{selectedInvoice.customerAddress || 'N/A'}</p>
                      <p className="text-[#333333]">GST NO : {selectedInvoice.customerGst || 'N/A'}</p>
                      <p className="text-[#333333]">Phone No : {selectedInvoice.customerPhone || selectedInvoice.phone || 'N/A'}</p>
                      <p className="text-[#333333]">Mobile No : {selectedInvoice.customerPhone || selectedInvoice.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Main Items Table */}
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
                      {/* CGST Row */}
                      <tr className="h-7 font-bold text-black">
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-left">CGST (9%)</td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="p-2 text-right">{cgstVal.toLocaleString()}/-</td>
                      </tr>
                      {/* SGST Row */}
                      <tr className="h-7 font-bold text-black">
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-left">SGST (9%)</td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="p-2 text-right">{sgstVal.toLocaleString()}/-</td>
                      </tr>
                      {/* Total Row */}
                      <tr className="bg-[#e8e5d3] font-bold border-t border-black h-7 text-black">
                        <td className="border-r border-black p-2 text-left">Total:</td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-center">{totalQuantity} Months</td>
                        <td className="p-2 text-right">{totalAmountVal.toLocaleString()}/-</td>
                      </tr>
                      {amountPaidVal > 0 && (
                        <>
                          <tr className="font-bold border-t border-black h-7 text-black">
                            <td className="border-r border-black p-2 text-left text-emerald-700">Amount Paid:</td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="p-2 text-right text-emerald-700">-{amountPaidVal.toLocaleString()}/-</td>
                          </tr>
                          <tr className="bg-[#e8e5d3] font-bold border-t border-black h-7 text-black">
                            <td className="border-r border-black p-2 text-left text-red-650">Amount Due:</td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="p-2 text-right text-red-650">{amountDueVal.toLocaleString()}/-</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* GST Tax Summary Table */}
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

                {/* Amount in words & Bank details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[10px] text-black pt-4 border-t border-slate-200">
                  {/* Banking Details (Left - 6 cols) */}
                  <div className="md:col-span-6 space-y-1">
                    <h5 className="font-bold text-black uppercase tracking-wide select-none">Company's Bank Details</h5>
                    <div className="pl-2 space-y-0.5 text-slate-800">
                      <p><span className="text-slate-500 select-none">A/c Holder's Name :</span> <span className="font-bold text-black">{activeBiller.accountHolderName || 'N/A'}</span></p>
                      <p><span className="text-slate-500 select-none">Bank Name :</span> <span className="font-semibold text-black">{activeBiller.bankName || 'N/A'}</span></p>
                      <p><span className="text-slate-500 select-none">Account No :</span> <span className="font-bold text-black tracking-wider">{activeBiller.bankAccountNumber || activeBiller.accountNumber || 'N/A'}</span></p>
                      <p><span className="text-slate-500 select-none">Branch & IFS Code :</span> <span className="font-bold text-black">{activeBiller.ifscCode || 'N/A'}</span></p>
                    </div>
                  </div>

                  {/* Amount in words (Right - 6 cols) */}
                  <div className="md:col-span-6 space-y-1 md:pl-6 md:border-l md:border-slate-200">
                    <p className="text-slate-500 font-medium select-none">Total Amount (in words):</p>
                    <p className="font-bold text-black pr-4">{priceToWords(totalAmountVal, activeBiller.currency)}</p>
                  </div>
                </div>

                {/* Note section */}
                <div className="border border-black rounded-none overflow-hidden bg-white">
                  <div className="bg-[#e8e5d3] border-b border-black text-center py-1 text-[9px] font-bold text-black select-none">
                    Note
                  </div>
                  <p className="text-[9px] text-[#333333] italic text-center py-2 px-4 whitespace-pre-line leading-relaxed">
                    {activeBiller.noteText || 'Thank you for your business!'}
                  </p>
                </div>

              </div>

              {/* Action buttons footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => capturePreviewAsPDF(
                    invoicePaperRef.current,
                    selectedInvoice.invoiceNumber || 'invoice',
                    () => setCapturingPDF(true),
                    () => setCapturingPDF(false)
                  )}
                  disabled={capturingPDF}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <Download size={14} />
                  {capturingPDF ? 'Capturing...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => downloadInvoice(selectedInvoice._id, selectedInvoice.invoiceNumber, 'docx', selectedInvoice.companyId?._id || selectedInvoice.companyId || '')}
                  disabled={downloadingInvId === selectedInvoice._id}
                  className="px-5 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <Download size={14} />
                  {downloadingInvId === selectedInvoice._id ? 'Downloading...' : 'Download Word'}
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
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
    </div>
  );
};


export default Sales;
