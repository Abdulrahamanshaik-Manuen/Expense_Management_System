import React, { useEffect, useState, useRef } from 'react';
import API from '../services/api';
import {
  Plus,
  Trash,
  Calendar,
  Layers,
  FileText,
  UploadCloud,
  Tag,
  Eye,
  X,
  Download,
  FileSpreadsheet,
  Edit
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

const Expenses = () => {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('entries'); // entries, categories
  const [user, setUser] = useState({ role: 'admin' });
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companyProfiles, setCompanyProfiles] = useState([]);

  // Filter States
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  const activeCurrency = companyProfiles[0]?.currency || 'INR';
  const currencySymbol = activeCurrency === 'USD' ? '$' : '₹';

  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    const matchMonth = filterMonth === 'All' || (expDate.getMonth() + 1) === parseInt(filterMonth);
    const matchYear = filterYear === 'All' || expDate.getFullYear() === parseInt(filterYear);
    return matchMonth && matchYear;
  });

  const downloadCSVReport = () => {
    const headers = ['Date', 'Title', 'Category', 'Amount', 'Currency', 'Payment Method', 'Paid To', 'Payment Status', 'Notes'];
    const rows = filteredExpenses.map(exp => [
      new Date(exp.date).toLocaleDateString(),
      exp.title,
      exp.category?.name || 'Uncategorized',
      exp.amount,
      activeCurrency,
      exp.paymentMethod,
      exp.paidTo,
      exp.paymentStatus,
      exp.notes || ''
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Expenses_Report_${filterMonth === 'All' ? 'All_Months' : 'Month_' + filterMonth}_${filterYear === 'All' ? 'All_Years' : filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Modals / Form toggles
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Document Viewer Modal State
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [docName, setDocName] = useState('');

  // Expense Voucher Modal State
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const handleViewDocument = (url, name) => {
    setDocUrl(url);
    setDocName(name);
    setShowDocViewer(true);
  };

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Cash',
    paidTo: '',
    notes: '',
    paymentStatus: 'Pending',
    companyId: '',
  });
  const [receiptFile, setReceiptFile] = useState(null);

  // Category Form State
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
      const [expRes, catRes, settingsRes] = await Promise.all([
        API.get('/expenses'),
        API.get('/expense-categories'),
        API.get('/settings'),
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
      setCompanyProfiles(settingsRes.data);
      if (catRes.data.length > 0 && !expenseForm.category) {
        setExpenseForm(prev => ({ ...prev, category: catRes.data[0]._id }));
      }
      if (settingsRes.data.length > 0) {
        setExpenseForm(prev => ({ ...prev, companyId: settingsRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseChange = (e) => {
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleEditExpense = (exp) => {
    setIsEditing(true);
    setEditingId(exp._id);
    setExpenseForm({
      title: exp.title || '',
      amount: exp.amount || '',
      category: exp.category?._id || exp.category || '',
      date: exp.date ? new Date(exp.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      paymentMethod: exp.paymentMethod || 'Cash',
      paidTo: exp.paidTo || '',
      notes: exp.notes || '',
      paymentStatus: exp.paymentStatus || 'Pending',
      companyId: exp.companyId?._id || exp.companyId || '',
    });
    setReceiptFile(null);
    setShowAddExpense(true);
  };

  const closeExpenseModal = () => {
    setShowAddExpense(false);
    setIsEditing(false);
    setEditingId(null);
    setExpenseForm({
      title: '',
      amount: '',
      category: categories[0]?._id || '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Cash',
      paidTo: '',
      notes: '',
      paymentStatus: 'Pending',
      companyId: companyProfiles[0]?._id || '',
    });
    setReceiptFile(null);
  };

  // Submit dynamic expense
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!expenseForm.category) {
      setErrorMsg('Please select a category or create one first.');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('title', expenseForm.title);
      data.append('amount', expenseForm.amount);
      data.append('category', expenseForm.category);
      data.append('date', expenseForm.date);
      data.append('paymentMethod', expenseForm.paymentMethod);
      data.append('paidTo', expenseForm.paidTo);
      data.append('notes', expenseForm.notes);
      data.append('paymentStatus', expenseForm.paymentStatus);
      if (expenseForm.companyId) {
        data.append('companyId', expenseForm.companyId);
      }
      if (receiptFile) {
        data.append('receipt', receiptFile);
      }

      if (isEditing) {
        await API.put(`/expenses/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await API.post('/expenses', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Clear Form & Close Modal
      setExpenseForm({
        title: '',
        amount: '',
        category: categories[0]?._id || '',
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: 'Cash',
        paidTo: '',
        notes: '',
        paymentStatus: 'Pending',
        companyId: companyProfiles[0]?._id || '',
      });
      setReceiptFile(null);
      setIsEditing(false);
      setEditingId(null);
      setShowAddExpense(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error submitting expense.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic category submit
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) return;
    try {
      await API.post('/expense-categories', { name: categoryName, description: categoryDesc });
      setCategoryName('');
      setCategoryDesc('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating category.');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await API.delete(`/expense-categories/${catId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting category.');
    }
  };

  // Admin approvals toggles
  const handleApproval = async (expId, statusVal) => {
    try {
      await API.put(`/expenses/${expId}/status`, { status: statusVal });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval state toggle failed.');
    }
  };

  // dynamic payment status updates
  const handlePaymentToggle = async (expId, currentPayStatus) => {
    try {
      const nextStatus = currentPayStatus === 'Paid' ? 'Pending' : 'Paid';
      await API.put(`/expenses/${expId}/payment`, { paymentStatus: nextStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment state toggle failed.');
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Delete this expense permanently?')) return;
    try {
      await API.delete(`/expenses/${expId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed.');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 p-8 text-slate-850 overflow-y-auto max-h-[calc(100vh-80px)]">
      {/* Tab controls */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'entries'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
          >
            Expense Entries
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              Category
            </button>
          )}
        </div>

        {activeTab === 'entries' && (
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/10"
          >
            <Plus size={16} />
            Add Expense
          </button>
        )}
      </div>

      {activeTab === 'entries' ? (
        /* ================= EXPENSE ENTRIES DISPLAY GRID ================= */
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
                    <th className="px-6 py-4">Expense Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Financials</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4">Receipt</th>
                    <th className="px-6 py-4">Verification Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                        No expense records matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-slate-50 transition-colors">
                      {/* Details */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 leading-tight">{exp.title}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar size={12} /> {new Date(exp.date).toLocaleDateString()}
                          {exp.notes && <span className="text-slate-400 italic">• {exp.notes}</span>}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                          <Tag size={12} className="text-slate-500" />
                          {exp.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Financials */}
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900">{currencySymbol}{exp.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Via {exp.paymentMethod} to {exp.paidTo}</p>
                      </td>

                      {/* Payment Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${exp.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                          'bg-amber-50 text-amber-700 border-amber-250'
                          }`}>
                          {exp.paymentStatus}
                        </span>
                      </td>

                      {/* Receipt */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedExpense(exp);
                              setShowVoucherModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
                          >
                            <Eye size={13} className="text-slate-450" />
                            View
                          </button>
                          {exp.receiptUrl ? (
                            <button
                              onClick={() => handleViewDocument(exp.receiptUrl, exp.title)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 font-semibold cursor-pointer hover:underline"
                            >
                              <FileText size={13} /> File
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">No File</span>
                          )}
                        </div>
                      </td>

                      {/* Verification Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Payment Toggle */}
                          <button
                            onClick={() => handlePaymentToggle(exp._id, exp.paymentStatus)}
                            className={`px-2 py-1 border text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ${exp.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50'
                              : 'bg-amber-50 text-amber-755 border-amber-200 hover:bg-amber-100/50'
                              }`}
                            title="Toggle Payment Status"
                          >
                            {exp.paymentStatus === 'Paid' ? 'Paid' : 'Mark Paid'}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEditExpense(exp)}
                            className="p-1.5 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer border border-slate-200 hover:border-blue-200"
                            title="Edit Record"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="p-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer border border-slate-200 hover:border-red-200"
                            title="Delete permanently"
                          >
                            <Trash size={14} />
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
    ) : (
        /* ================= CATEGORIES MANAGER VIEW (ADMIN ONLY) ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Category form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 h-fit shadow-sm">
            <h3 className="font-extrabold text-base text-slate-800 mb-4 flex items-center gap-2">
              <Layers className="text-blue-600" size={18} /> Add Dynamic Category
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. Internet Bill"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Allocate operational notes..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold text-xs transition-colors cursor-pointer shadow-lg shadow-blue-500/10"
              >
                Provision Category
              </button>
            </form>
          </div>

          {/* Categories database list */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-extrabold text-base text-slate-800 mb-6">Standard Registry Collections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat._id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start justify-between gap-4 group hover:border-slate-300 hover:bg-white transition-all shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{cat.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{cat.description || 'No descriptive context allocated.'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat._id)}
                    className="p-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg border border-slate-200 hover:border-red-200 cursor-pointer opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    title="Remove category"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= DYNAMIC LOGGING EXPENSE MODAL ================= */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleExpenseSubmit}
            className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-900">{isEditing ? 'Edit Expense' : 'Add Expense'}</h3>
              <button
                type="button"
                onClick={closeExpenseModal}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expense Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={expenseForm.title}
                    onChange={handleExpenseChange}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. Internet Broadband May"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Operational Cost ({currencySymbol})</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    value={expenseForm.amount}
                    onChange={handleExpenseChange}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Category</label>
                  <select
                    name="category"
                    required
                    value={expenseForm.category}
                    onChange={handleExpenseChange}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expenditure Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={expenseForm.date}
                    onChange={handleExpenseChange}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Type Method</label>
                  <select
                    name="paymentMethod"
                    value={expenseForm.paymentMethod}
                    onChange={handleExpenseChange}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Paid Out To</label>
                  <input
                    type="text"
                    name="paidTo"
                    required
                    value={expenseForm.paidTo}
                    onChange={handleExpenseChange}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. Jio Fibres Co."
                  />
                </div>
              </div>

              {/* Receipt File upload drop box */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bill Invoice Receipt File</label>
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-full bg-slate-50 border border-dashed border-slate-200 hover:border-blue-500 hover:bg-slate-100/50 rounded-xl py-4 flex items-center justify-center gap-3 cursor-pointer transition-colors"
                >
                  <UploadCloud className="text-slate-400 group-hover:text-blue-500" size={18} />
                  <span className="text-xs font-semibold text-slate-600">
                    {receiptFile ? receiptFile.name : 'Click to select supporting document'}
                  </span>
                  <span className="text-[10px] text-slate-400">(PDF, JPG, PNG - Max 5MB)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Profile</label>
                <select
                  name="companyId"
                  required
                  value={expenseForm.companyId}
                  onChange={handleExpenseChange}
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {companyProfiles.map((profile) => (
                    <option key={profile._id} value={profile._id}>{profile.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Direct Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={expenseForm.paymentStatus}
                    onChange={handleExpenseChange}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="Pending">Pending (Log as bill due)</option>
                    <option value="Paid">Paid (Cash logged payout)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Custom Context Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={expenseForm.notes}
                    onChange={handleExpenseChange}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. Approved monthly recurring"
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={closeExpenseModal}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition-colors"
              >
                {loading ? 'Saving Changes...' : (isEditing ? 'Save Changes' : 'Provision Log')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= DOCUMENT VIEWER MODAL ================= */}
      {showDocViewer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in animate-duration-200">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 h-[85vh] flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                  <FileText className="text-blue-600" size={18} /> Document Preview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{docName}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`http://localhost:5000${docUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  Download Receipt
                </a>
                <button
                  onClick={() => setShowDocViewer(false)}
                  className="text-slate-600 hover:text-slate-850 transition-all font-bold text-xs bg-white border border-slate-200 shadow-sm"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
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

      {/* ================= MODAL: EXPENSE PAYMENT VOUCHER LIVE VIEWER ================= */}
      {showVoucherModal && selectedExpense && (() => {
        const activeCompany = selectedExpense.companyId && typeof selectedExpense.companyId === 'object'
          ? selectedExpense.companyId
          : (companyProfiles.find(p => p._id === selectedExpense.companyId) || companyProfiles[0] || {});

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowVoucherModal(false);
                  setSelectedExpense(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-850 transition-colors cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Header info */}
              <div className="pb-6 mb-6 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">OFFICIAL CORPORATE PAYMENT VOUCHER PREVIEW</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  Debit Voucher Viewer
                </h3>
              </div>

              {/* HIGH FIDELITY PAPER VOUCHER SHEET */}
              <div className="bg-[#FAF9F5] text-black border border-slate-300 p-6 sm:p-10 shadow-lg rounded-sm space-y-6 select-text max-w-[800px] mx-auto text-left font-sans leading-relaxed">

                {/* Top corporate header & Meta details */}
                <div className="flex flex-row justify-between items-start gap-4 pb-4 border-b border-slate-300">
                  {/* Corporate Branding Vector / Uploaded Logo */}
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
                      <p className="text-[7.5px] font-bold text-slate-500 tracking-[0.05em] uppercase leading-relaxed max-w-[400px]">
                        {activeCompany.gstNumber ? `GSTIN: ${activeCompany.gstNumber} | ` : ''}
                        {activeCompany.address || 'Internal Audit Ledger'}
                      </p>
                    </div>
                  </div>

                  {/* Voucher ID and Date Box */}
                  <div className="border border-black px-3.5 py-1.5 w-48 text-[9px] font-bold text-black flex flex-col justify-center gap-1 bg-white select-none">
                    <div>Date : {new Date(selectedExpense.date).toLocaleDateString('en-GB')}</div>
                    <div className="border-t border-slate-200 pt-1">Voucher No : EXP-{selectedExpense._id.substr(-6).toUpperCase()}</div>
                  </div>
                </div>

                {/* Centered Voucher Title */}
                <h1 className="text-xl font-extrabold text-[#002e6e] text-center uppercase tracking-wide my-2 select-none decoration-double underline">
                  DEBIT PAYMENT VOUCHER
                </h1>

                {/* Voucher Specifics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] text-black bg-white border border-slate-200 p-4 rounded-none">
                  <div className="space-y-1.5">
                    <p><span className="text-slate-500 font-bold uppercase select-none">Paid Out To:</span> <span className="font-bold text-black text-[10.5px]">{selectedExpense.paidTo || 'N/A'}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase select-none">Expense Category:</span> <span className="font-semibold text-black">{selectedExpense.category?.name || 'Uncategorized'}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase select-none">Expense Title:</span> <span className="font-medium text-slate-800">{selectedExpense.title}</span></p>
                  </div>
                  <div className="space-y-1.5">
                    <p><span className="text-slate-500 font-bold uppercase select-none">Payment Method:</span> <span className="font-semibold text-black">{selectedExpense.paymentMethod}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase select-none">Payment Status:</span> <span className={`inline-flex text-[9px] font-black px-1.5 py-0.5 rounded-full ${selectedExpense.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>{selectedExpense.paymentStatus}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase select-none">Custom Notes:</span> <span className="text-slate-700 italic">{selectedExpense.notes || 'No description comments logged.'}</span></p>
                  </div>
                </div>

                {/* Ledger breakdown grid */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[10px] text-black bg-white">
                    <thead>
                      <tr className="bg-[#e8e5d3] border-b border-black text-[9px] font-bold text-black select-none">
                        <th className="border-r border-black p-2 text-center w-12">S NO</th>
                        <th className="border-r border-black p-2 text-left">Particulars Description</th>
                        <th className="p-2 text-right w-36">Debit Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-10">
                        <td className="border-r border-black p-2 text-center">1</td>
                        <td className="border-r border-black p-2 text-left font-medium">
                          {selectedExpense.title} <span className="text-slate-500 font-normal">[{selectedExpense.category?.name || 'Category'}]</span>
                        </td>
                        <td className="p-2 text-right font-semibold">${selectedExpense.amount.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-[#e8e5d3] font-bold border-t border-black h-8 text-black">
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-right uppercase tracking-wider select-none">Grand Total Payout:</td>
                        <td className="p-2 text-right">${selectedExpense.amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Amount in words & Signature card */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[9.5px] text-black pt-4 border-t border-slate-300">
                  <div className="md:col-span-7 space-y-1">
                    <p className="text-slate-500 font-semibold uppercase select-none">Total Amount (in Rupee spelling conversion):</p>
                    <p className="font-extrabold text-black pr-2">{priceToWords(selectedExpense.amount)}</p>
                  </div>

                  <div className="md:col-span-5 flex flex-col justify-end space-y-0.5 pl-4 border-l border-slate-200">
                    <p className="text-slate-500 font-bold uppercase select-none mb-1">Voucher Signatures</p>
                    <p className="text-[#333333]"><span className="text-slate-400 select-none">Prepared By:</span> Internal Auditor</p>
                    <p className="text-[#333333]"><span className="text-slate-400 select-none">Authorized By:</span> Corporate CFO</p>
                  </div>
                </div>

              </div>

              {/* INTEGRATED RECEIPTS PREVIEW (AT THE BOTTOM FOR SIMULTANEOUS REVIEW) */}
              {selectedExpense.receiptUrl ? (
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="text-blue-600" size={16} /> Supporting Receipt Attachment
                  </h4>
                  <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 h-96 flex items-center justify-center relative">
                    {selectedExpense.receiptUrl.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={`http://localhost:5000${selectedExpense.receiptUrl}`}
                        className="w-full h-full border-0"
                        title="Receipt Preview"
                      />
                    ) : (
                      <img
                        src={`http://localhost:5000${selectedExpense.receiptUrl}`}
                        alt="Receipt Preview"
                        className="max-w-full max-h-full object-contain p-2"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-semibold select-none">
                  No supporting physical receipt uploaded for this ledger expense record.
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowVoucherModal(false);
                    setSelectedExpense(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-850 text-xs font-semibold cursor-pointer transition-colors shadow-sm bg-white"
                >
                  Close Voucher
                </button>
              </div>

            </div>
          </div>
        )
      })()}
    </div>
  );
};

export default Expenses;
