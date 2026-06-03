import React, { useEffect, useState } from 'react';
import API from '../services/api';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  Activity,
  Layers,
  ShieldCheck,
  FileText,
  ShoppingBag,
  FileSpreadsheet,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : { name: 'User', role: 'admin' };
  const isAdmin = true; // All users are admins in this unified setup

  const [timePeriod, setTimePeriod] = useState('All Time');
  const [rawExpenses, setRawExpenses] = useState([]);
  const [rawInvoices, setRawInvoices] = useState([]);
  const [rawPurchases, setRawPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [expensesRes, invoicesRes, purchasesRes] = await Promise.all([
          API.get('/expenses'),
          API.get('/invoices'),
          API.get('/purchase-entries'),
        ]);

        setRawExpenses(expensesRes.data || []);
        setRawInvoices(invoicesRes.data || []);
        setRawPurchases(purchasesRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const checkDateInPeriod = (dateValue, period) => {
    if (!dateValue) return false;
    const dateObj = new Date(dateValue);
    const now = new Date();
    
    if (period === 'This Month') {
      return dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
    }
    if (period === 'Last 30 Days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return dateObj >= thirtyDaysAgo && dateObj <= now;
    }
    if (period === 'This Quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
      return dateObj >= quarterStart && dateObj <= now;
    }
    if (period === 'This Year') {
      return dateObj.getFullYear() === now.getFullYear();
    }
    return true; // 'All Time'
  };

  const activeCompanyId = localStorage.getItem('selectedCompanyId');

  const filteredRawInvoices = React.useMemo(() => {
    return rawInvoices.filter(inv => !activeCompanyId || (inv.companyId?._id || inv.companyId) === activeCompanyId);
  }, [rawInvoices, activeCompanyId]);

  const filteredRawExpenses = React.useMemo(() => {
    return rawExpenses.filter(exp => !activeCompanyId || (exp.companyId?._id || exp.companyId) === activeCompanyId);
  }, [rawExpenses, activeCompanyId]);

  const filteredRawPurchases = React.useMemo(() => {
    return rawPurchases.filter(pr => !activeCompanyId || (pr.companyId?._id || pr.companyId) === activeCompanyId);
  }, [rawPurchases, activeCompanyId]);

  const filteredInvoices = React.useMemo(() => {
    return filteredRawInvoices.filter(inv => checkDateInPeriod(inv.invoiceDate || inv.createdAt, timePeriod));
  }, [filteredRawInvoices, timePeriod]);

  const filteredExpenses = React.useMemo(() => {
    return filteredRawExpenses.filter(exp => checkDateInPeriod(exp.date || exp.createdAt, timePeriod));
  }, [filteredRawExpenses, timePeriod]);

  const filteredPurchases = React.useMemo(() => {
    return filteredRawPurchases.filter(pr => checkDateInPeriod(pr.purchaseDate || pr.createdAt, timePeriod));
  }, [filteredRawPurchases, timePeriod]);

  const stats = React.useMemo(() => {
    let totalSales = 0, salesPaid = 0, salesDue = 0;
    filteredInvoices.forEach(inv => {
      totalSales += inv.totalAmount || 0;
      salesPaid += inv.amountPaid || 0;
      salesDue += inv.amountDue || 0;
    });

    let expensesPaid = 0, expensesPending = 0;
    filteredExpenses.forEach(exp => {
      if (exp.paymentStatus === 'Paid') expensesPaid += exp.amount || 0;
      else expensesPending += exp.amount || 0;
    });

    let purchasePending = 0;
    let totalPurchasesBilled = 0;
    filteredPurchases.forEach(pr => {
      purchasePending += pr.amountDue || 0;
      totalPurchasesBilled += pr.grandTotal || pr.totalAmount || 0;
    });

    // Net Profit: Sales (Revenue) minus all expenses and purchases logged
    const netProfit = totalSales - (expensesPaid + expensesPending + totalPurchasesBilled);

    return {
      totalSales,
      salesPaid,
      salesDue,
      expensesPaid,
      expensesPending,
      purchasePending,
      totalInvoices: filteredInvoices.length,
      totalExpenses: filteredExpenses.length,
      netProfit
    };
  }, [filteredInvoices, filteredExpenses, filteredPurchases]);

  const expenseData = React.useMemo(() => {
    const categoryMap = {};
    filteredExpenses.forEach(exp => {
      const cat = exp.category?.name || 'Unclassified';
      categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount;
    });
    return Object.keys(categoryMap).map(name => ({ name, value: categoryMap[name] }));
  }, [filteredExpenses]);

  const cashFlowData = React.useMemo(() => {
    const months = [];
    const now = new Date();
    // Get last 6 months starting from 5 months ago
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      months.push({
        month: `${monthName} ${year.toString().slice(-2)}`,
        year,
        monthIndex,
        Sales: 0,
        Expenses: 0
      });
    }

    filteredRawInvoices.forEach(inv => {
      const dateVal = inv.invoiceDate || inv.createdAt;
      if (!dateVal) return;
      const d = new Date(dateVal);
      const mIdx = d.getMonth();
      const yVal = d.getFullYear();
      const bucket = months.find(m => m.monthIndex === mIdx && m.year === yVal);
      if (bucket) {
        bucket.Sales += inv.totalAmount || 0;
      }
    });

    filteredRawExpenses.forEach(exp => {
      const dateVal = exp.date || exp.createdAt;
      if (!dateVal) return;
      const d = new Date(dateVal);
      const mIdx = d.getMonth();
      const yVal = d.getFullYear();
      const bucket = months.find(m => m.monthIndex === mIdx && m.year === yVal);
      if (bucket) {
        bucket.Expenses += exp.amount || 0;
      }
    });

    return months.map(({ month, Sales, Expenses }) => ({
      month,
      Sales,
      Expenses
    }));
  }, [filteredRawInvoices, filteredRawExpenses]);

  const recentActivity = React.useMemo(() => {
    const combined = [
      ...filteredRawInvoices.map(inv => ({
        id: inv._id,
        type: 'Sale',
        title: `Invoice ${inv.invoiceNumber}`,
        subtitle: inv.customerName || 'Direct Customer',
        amount: inv.totalAmount || 0,
        date: new Date(inv.invoiceDate || inv.createdAt),
        status: inv.paymentStatus || 'Unpaid',
        path: '/sales'
      })),
      ...filteredRawExpenses.map(exp => ({
        id: exp._id,
        type: 'Expense',
        title: exp.title,
        subtitle: exp.category?.name || 'Operational Cost',
        amount: exp.amount || 0,
        date: new Date(exp.date || exp.createdAt),
        status: exp.paymentStatus || 'Paid',
        path: '/expenses'
      })),
      ...filteredRawPurchases.map(pr => ({
        id: pr._id,
        type: 'Purchase',
        title: pr.purchaseVoucherNumber || `Purchase Entry`,
        subtitle: pr.supplierName || pr.vendor?.name || 'Supplier',
        amount: pr.grandTotal || pr.totalAmount || 0,
        date: new Date(pr.purchaseDate || pr.createdAt),
        status: pr.paymentStatus || 'Unpaid',
        path: '/purchases'
      }))
    ];

    combined.sort((a, b) => b.date - a.date);
    return combined.slice(0, 5);
  }, [filteredRawInvoices, filteredRawExpenses, filteredRawPurchases]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Quick-action cards differ by role
  const adminQuickActions = [
    { label: 'Sales', icon: <FileSpreadsheet size={20} />, path: '/sales', color: 'blue', desc: 'Manage invoices & receipts' },
    { label: 'Expenses', icon: <DollarSign size={20} />, path: '/expenses', color: 'emerald', desc: 'Track operational costs' },
    { label: 'Purchases', icon: <ShoppingBag size={20} />, path: '/purchases', color: 'amber', desc: 'POs, entries & vendors' },
    { label: 'Reports', icon: <Layers size={20} />, path: '/reports', color: 'purple', desc: 'Inspect operations reports' },
    { label: 'System Settings', icon: <ShieldCheck size={20} />, path: '/settings', color: 'cyan', desc: 'Configure company profile' },
  ];

  const quickActions = adminQuickActions;

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-slate-200', hover: 'hover:border-blue-500/40 hover:shadow-sm' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-slate-200', hover: 'hover:border-emerald-500/40 hover:shadow-sm' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-slate-200', hover: 'hover:border-amber-500/40 hover:shadow-sm' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-slate-200', hover: 'hover:border-purple-500/40 hover:shadow-sm' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-slate-200', hover: 'hover:border-rose-500/40 hover:shadow-sm' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-slate-200', hover: 'hover:border-cyan-500/40 hover:shadow-sm' },
  };

  return (
    <div className="flex-1 bg-slate-50 p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)]">
      
      {/* Welcome Header & Timeperiod Dropdown Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Welcome back, {currentUser.name}!
              <Sparkles size={16} className="text-blue-500 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Here's the financial status of your enterprise workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analysis Period:</span>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="All Time">All Time</option>
            <option value="This Month">This Month</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
          </select>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {/* Sales */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 animate-pulse">
              <TrendingUp size={16} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
            {loading ? (
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse my-0.5" />
            ) : (
              `₹${stats.totalSales.toLocaleString()}`
            )}
          </h3>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
            {loading ? (
              <div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse mt-1" />
            ) : (
              `+₹${stats.salesPaid.toLocaleString()} collected`
            )}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expenses</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <TrendingDown size={16} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
            {loading ? (
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse my-0.5" />
            ) : (
              `₹${stats.expensesPaid.toLocaleString()}`
            )}
          </h3>
          <div className="text-[11px] text-amber-600 mt-1 font-semibold">
            {loading ? (
              <div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse mt-1" />
            ) : (
              `₹${stats.expensesPending.toLocaleString()} pending`
            )}
          </div>
        </div>

        {/* Receivables */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden hover:border-amber-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receivables</span>
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <DollarSign size={16} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
            {loading ? (
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse my-0.5" />
            ) : (
              `₹${stats.salesDue.toLocaleString()}`
            )}
          </h3>
          <div className="text-[11px] text-slate-500 mt-1">
            {loading ? (
              <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse mt-1" />
            ) : (
              'Outstanding collections'
            )}
          </div>
        </div>

        {/* Payables */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden hover:border-red-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payables</span>
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
              <AlertTriangle size={16} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
            {loading ? (
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse my-0.5" />
            ) : (
              `₹${stats.purchasePending.toLocaleString()}`
            )}
          </h3>
          <div className="text-[11px] text-slate-500 mt-1">
            {loading ? (
              <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse mt-1" />
            ) : (
              'Vendor dues pending'
            )}
          </div>
        </div>

        {/* Dynamic Net Profit/Loss */}
        <div className={`bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden transition-all duration-300 ${
          stats.netProfit >= 0 ? 'hover:border-emerald-500/30' : 'hover:border-red-500/30'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Profit</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              stats.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {stats.netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          <h3 className={`text-xl font-black font-sans tracking-tight ${
            stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-650'
          }`}>
            {loading ? (
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse my-0.5" />
            ) : (
              `${stats.netProfit >= 0 ? '+' : ''}₹${stats.netProfit.toLocaleString()}`
            )}
          </h3>
          <div className="text-[11px] text-slate-500 mt-1">
            {loading ? (
              <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse mt-1" />
            ) : (
              'Revenue minus spends & bills'
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTION SHORTCUTS ────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-sm font-extrabold text-slate-800">Quick Access</h4>
          <span className="text-[10px] text-slate-400 font-medium">— Jump to any module</span>
        </div>
        <div className={`grid gap-3 ${isAdmin ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`}>
          {quickActions.map((action) => {
            const c = colorMap[action.color];
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`group flex flex-col items-start gap-3 bg-white border ${c.border} ${c.hover} rounded-xl p-4 text-left transition-all duration-200 hover:bg-slate-50 cursor-pointer`}
              >
                <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center ${c.text}`}>
                  {action.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{action.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CHARTS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses area chart */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">Revenue vs. Expenses</h4>
              <p className="text-xs text-slate-500 mt-0.5">Dual-axis cash flow tracking</p>
            </div>
            <Activity className="text-blue-500" size={16} />
          </div>
          <div className="h-64 relative">
            {loading ? (
              <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center animate-pulse gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Loading Cash Flow...</p>
              </div>
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)' }} />
                <Legend />
                <Area type="monotone" dataKey="Sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="Expenses" stroke="#10b981" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense category bar chart */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">Expense Categories</h4>
              <p className="text-xs text-slate-500 mt-0.5">Spending by category</p>
            </div>
            <Layers className="text-emerald-500" size={16} />
          </div>
          <div className="h-64 relative">
            {loading ? (
              <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center animate-pulse gap-2">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Loading Categories...</p>
              </div>
            ) : expenseData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold">
                No expense data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {expenseData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── RECENT FINANCIAL ACTIVITY FEED ───────────────────────── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-extrabold text-sm text-slate-800">Recent Transactions</h4>
            <p className="text-xs text-slate-500 mt-0.5">Real-time consolidated ledger logs</p>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-500 transition-all hover:translate-x-0.5 cursor-pointer"
          >
            Detailed Reports <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="pb-3 pr-4">Transaction Details</th>
                <th className="pb-3 px-4">Category / Contact</th>
                <th className="pb-3 px-4">Payment Status</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-500 font-semibold">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Gathering latest audit events...
                  </td>
                </tr>
              ) : recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-550 font-semibold">
                    No transactions registered in this workspace yet.
                  </td>
                </tr>
              ) : (
                recentActivity.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-all duration-150">
                    <td className="py-3.5 pr-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                        tx.type === 'Sale' ? 'bg-blue-50 text-blue-600' :
                        tx.type === 'Expense' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {tx.type === 'Sale' ? 'S' : tx.type === 'Expense' ? 'E' : 'P'}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800">{tx.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{tx.date.toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {tx.subtitle}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        tx.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        tx.status === 'Partial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        onClick={() => navigate(tx.path)}
                        className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:text-blue-500 transition-all hover:translate-x-0.5 cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
