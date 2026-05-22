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

  const [stats, setStats] = useState({
    totalSales: 0,
    salesPaid: 0,
    salesDue: 0,
    expensesPaid: 0,
    expensesPending: 0,
    purchasePending: 0,
    totalInvoices: 0,
    totalExpenses: 0,
  });
  const [expenseData, setExpenseData] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);
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

        const expenses = expensesRes.data;
        const invoices = invoicesRes.data;
        const purchases = purchasesRes.data;

        let totalSalesVal = 0, salesPaidVal = 0, salesDueVal = 0;
        invoices.forEach(inv => {
          totalSalesVal += inv.totalAmount || 0;
          salesPaidVal += inv.amountPaid || 0;
          salesDueVal += inv.amountDue || 0;
        });

        let expPaidVal = 0, expPendingVal = 0;
        expenses.forEach(exp => {
          if (exp.paymentStatus === 'Paid') expPaidVal += exp.amount || 0;
          else expPendingVal += exp.amount || 0;
        });

        let purchPendingVal = 0;
        purchases.forEach(pr => { purchPendingVal += pr.amountDue || 0; });

        setStats({
          totalSales: totalSalesVal,
          salesPaid: salesPaidVal,
          salesDue: salesDueVal,
          expensesPaid: expPaidVal,
          expensesPending: expPendingVal,
          purchasePending: purchPendingVal,
          totalInvoices: invoices.length,
          totalExpenses: expenses.length,
        });

        const categoryMap = {};
        expenses.forEach(exp => {
          const cat = exp.category?.name || 'Unclassified';
          categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount;
        });
        setExpenseData(Object.keys(categoryMap).map(name => ({ name, value: categoryMap[name] })));

        setCashFlowData([
          { month: 'Jan', Sales: totalSalesVal * 0.15, Expenses: expPaidVal * 0.12 },
          { month: 'Feb', Sales: totalSalesVal * 0.20, Expenses: expPaidVal * 0.18 },
          { month: 'Mar', Sales: totalSalesVal * 0.18, Expenses: expPaidVal * 0.15 },
          { month: 'Apr', Sales: totalSalesVal * 0.22, Expenses: expPaidVal * 0.25 },
          { month: 'May', Sales: totalSalesVal * 0.25, Expenses: expPaidVal * 0.30 },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Quick-action cards differ by role
  const adminQuickActions = [
    { label: 'Sales & Billing', icon: <FileSpreadsheet size={20} />, path: '/sales', color: 'blue', desc: 'Manage invoices & receipts' },
    { label: 'Expenses', icon: <DollarSign size={20} />, path: '/expenses', color: 'emerald', desc: 'Track operational costs' },
    { label: 'Purchases', icon: <ShoppingBag size={20} />, path: '/purchases', color: 'amber', desc: 'POs, entries & vendors' },
    { label: 'Invoices', icon: <FileText size={20} />, path: '/invoices', color: 'purple', desc: 'Download client invoices' },
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


      {/* ── KPI METRIC CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
              'Outstanding balances'
            )}
          </div>
        </div>

        {/* Payables — only shown to admin in full; manager sees invoice count */}
        {isAdmin ? (
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
        ) : (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoices</span>
              <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <FileText size={16} />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
              {loading ? (
                <div className="h-6 w-24 bg-slate-100 rounded animate-pulse my-0.5" />
              ) : (
                stats.totalInvoices
              )}
            </h3>
            <div className="text-[11px] text-slate-500 mt-1">
              {loading ? (
                <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse mt-1" />
              ) : (
                `${stats.totalExpenses} expenses logged`
              )}
            </div>
          </div>
        )}
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
    </div>
  );
};

export default Dashboard;
