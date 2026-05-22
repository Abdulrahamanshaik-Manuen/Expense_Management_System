import React, { useEffect, useState } from 'react';
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
  X
} from 'lucide-react';

const Sales = () => {
  const [activeTab, setActiveTab] = useState('invoices'); // invoices, products
  const [user, setUser] = useState({ role: 'admin' });
  const [loading, setLoading] = useState(false);

  // DB structures
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [companyProfiles, setCompanyProfiles] = useState([]);

  // Modals / Toggles
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedInvoiceForExport, setSelectedInvoiceForExport] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

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
        setInvoiceForm(prev => ({
          ...prev,
          companyId: settingsRes.data[0]._id
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
      await API.post('/invoices', invoiceForm);
      setInvoiceForm({
        customerName: '',
        customerCompany: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        customerGst: '',
        amountPaid: '0',
        companyId: companyProfiles[0]?._id || '',
        items: [{ name: '', quantity: 1, price: '', discount: 0, taxRate: 18 }],
      });
      setShowAddInvoice(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error compiling Sales Invoice.');
    } finally {
      setLoading(false);
    }
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
              onClick={() => setShowAddInvoice(true)}
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="px-6 py-4">Invoice details</th>
                  <th className="px-6 py-4">Client Contact</th>
                  <th className="px-6 py-4">Total & Tax</th>
                  <th className="px-6 py-4">Balances Dues</th>
                  <th className="px-6 py-4">Invoice PDF</th>
                  <th className="px-6 py-4">Record Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-500 font-medium">
                      No tax invoices logged in system yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
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
                        <p className="font-extrabold text-slate-800">${inv.totalAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Tax (GST): ${inv.taxAmount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`font-extrabold ${inv.amountDue > 0 ? 'text-red-650' : 'text-emerald-600'}`}>
                          ${inv.amountDue.toLocaleString()}
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
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedInvoiceForExport(inv);
                            setSelectedCompanyId(inv.companyId?._id || inv.companyId || companyProfiles[0]?._id || '');
                            setShowExportModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-500 font-semibold cursor-pointer"
                        >
                          <FileText size={14} /> Export / Download
                        </button>
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
                  <span className="text-lg font-black text-slate-900">${prod.price.toLocaleString()}</span>
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
      )}      {/* ================= MODAL: ADD PRODUCT ================= */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Register Catalog Service</h3>
              <button onClick={() => setShowAddProduct(false)} className="text-slate-500 hover:text-slate-800 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-2">Service Name</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Standard Website Package"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
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
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-2">Base Pricing ($)</label>
                  <input
                    type="number"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-2">Description Detail</label>
                <textarea
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  rows="3"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Specs, frameworks, deliverables..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10"
                >
                  Register Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD SALES TAX INVOICE ================= */}
      {showAddInvoice && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Draw Tax Sale Invoice</h3>
              <button onClick={() => setShowAddInvoice(false)} className="text-slate-555 hover:text-slate-800 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleInvoiceSubmit} className="space-y-4">

              {/* Billing Company Selector */}
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={12} className="text-blue-500" /> Billing Company Setting Profile
                </h4>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-550 mb-1">Select Billing Profile</label>
                  <select
                    value={invoiceForm.companyId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, companyId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
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
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
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
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
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
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      placeholder="john@doecompany.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={invoiceForm.customerPhone}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerPhone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
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
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      placeholder="Doe Tech Solutions"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={invoiceForm.customerGst}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerGst: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Physical workplace location address..."
                  />
                </div>
              </div>

              {/* Invoice Items builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag size={12} className="text-emerald-500" /> Billed Products Lists
                  </h4>
                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="text-xs text-blue-600 hover:text-blue-500 font-semibold cursor-pointer"
                  >
                    + Add Item Row
                  </button>
                </div>

                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl relative">
                    <div className="md:col-span-4">
                      <label className="block text-[9px] text-slate-500 mb-1">Catalogue Auto-fill</label>
                      <select
                        onChange={(e) => selectCatalogProduct(index, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Auto fill --</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[9px] text-slate-500 mb-1">Item Title / Detail</label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => updateInvoiceItem(index, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        placeholder="Item Title"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[9px] text-slate-500 mb-1">Qty</label>
                      <input
                        type="number"
                        required
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(index, 'quantity', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[9px] text-slate-500 mb-1">Price</label>
                      <input
                        type="number"
                        required
                        value={item.price}
                        onChange={(e) => updateInvoiceItem(index, 'price', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        placeholder="Price"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[9px] text-slate-500 mb-1">Disc</label>
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateInvoiceItem(index, 'discount', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        placeholder="Disc $"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-center justify-between gap-1.5">
                      <div>
                        <label className="block text-[9px] text-slate-500 mb-1">GST %</label>
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => updateInvoiceItem(index, 'taxRate', Number(e.target.value))}
                          className="w-10 bg-white border border-slate-200 rounded px-1 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {invoiceForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInvoiceItem(index)}
                          className="text-red-500 hover:text-red-700 font-semibold cursor-pointer mt-4"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment logged */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Advanced Paid ($)</label>
                  <input
                    type="number"
                    value={invoiceForm.amountPaid}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amountPaid: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddInvoice(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10"
                >
                  {loading ? 'Compiling corporate PDF...' : 'Get Invoice'}
                </button>
              </div>
            </form>
          </div>
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
    </div>
  );
};

export default Sales;
