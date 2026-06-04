import React, { useEffect, useState } from 'react';
import API from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Calendar,
  Filter,
  Plus,
  MoreVertical,
  ArrowRight,
  Info,
  ShieldCheck,
  ChevronRight,
  Home,
  Users,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('All Time');
  const [txFilter, setTxFilter] = useState('All'); // All | Inflow | Outflow
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data lists
  const [rawExpenses, setRawExpenses] = useState([]);
  const [rawInvoices, setRawInvoices] = useState([]);
  const [rawPurchases, setRawPurchases] = useState([]);
  const [companyProfiles, setCompanyProfiles] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const [expensesRes, invoicesRes, purchasesRes, settingsRes] = await Promise.all([
          API.get('/expenses'),
          API.get('/invoices'),
          API.get('/purchase-entries'),
          API.get('/settings'),
        ]);

        setRawExpenses(expensesRes.data || []);
        setRawInvoices(invoicesRes.data || []);
        setRawPurchases(purchasesRes.data || []);
        setCompanyProfiles(settingsRes.data || []);
      } catch (error) {
        console.error('Error fetching analytics details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, []);

  const activeCompanyId = localStorage.getItem('selectedCompanyId');
  const activeCompany = companyProfiles.find(p => p._id === activeCompanyId) || companyProfiles[0];
  const activeCurrency = activeCompany?.currency || 'INR';
  const currencySymbol = '';

  const filteredRawInvoices = React.useMemo(() => {
    return rawInvoices.filter(inv => !activeCompanyId || (inv.companyId?._id || inv.companyId) === activeCompanyId);
  }, [rawInvoices, activeCompanyId]);

  const filteredRawExpenses = React.useMemo(() => {
    return rawExpenses.filter(exp => !activeCompanyId || (exp.companyId?._id || exp.companyId) === activeCompanyId);
  }, [rawExpenses, activeCompanyId]);

  const filteredRawPurchases = React.useMemo(() => {
    return rawPurchases.filter(pr => !activeCompanyId || (pr.companyId?._id || pr.companyId) === activeCompanyId);
  }, [rawPurchases, activeCompanyId]);

  // Helper: check if date is within selected time period
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

  // Helper: check if date is within a specific past period for MoM trend
  const checkDateInPreviousPeriod = (dateValue, period) => {
    if (!dateValue) return false;
    const dateObj = new Date(dateValue);
    const now = new Date();

    if (period === 'This Month') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return dateObj.getMonth() === prevMonth && dateObj.getFullYear() === prevYear;
    }
    if (period === 'Last 30 Days') {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(now.getDate() - 60);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return dateObj >= sixtyDaysAgo && dateObj < thirtyDaysAgo;
    }
    if (period === 'This Quarter') {
      const currentQStart = Math.floor(now.getMonth() / 3) * 3;
      const prevQStartMonth = currentQStart - 3 < 0 ? 9 : currentQStart - 3;
      const prevQYear = currentQStart - 3 < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevQStart = new Date(prevQYear, prevQStartMonth, 1);
      const prevQEnd = new Date(prevQYear, prevQStartMonth + 3, 0);
      return dateObj >= prevQStart && dateObj <= prevQEnd;
    }
    if (period === 'This Year') {
      return dateObj.getFullYear() === now.getFullYear() - 1;
    }
    return false;
  };

  // Compute dynamic stats based on period
  const stats = React.useMemo(() => {
    let currentInflow = 0;
    let currentOutflow = 0;
    
    // Previous periods for MoM / period comparison
    let prevInflow = 0;
    let prevOutflow = 0;

    // 1. Calculate sales (inflow)
    filteredRawInvoices.forEach(inv => {
      const date = inv.invoiceDate || inv.createdAt;
      const amount = inv.totalAmount || 0;
      if (checkDateInPeriod(date, timePeriod)) {
        currentInflow += amount;
      } else if (checkDateInPreviousPeriod(date, timePeriod)) {
        prevInflow += amount;
      }
    });

    // 2. Calculate expenses & purchases (outflow)
    filteredRawExpenses.forEach(exp => {
      const date = exp.date || exp.createdAt;
      const amount = exp.amount || 0;
      if (checkDateInPeriod(date, timePeriod)) {
        currentOutflow += amount;
      } else if (checkDateInPreviousPeriod(date, timePeriod)) {
        prevOutflow += amount;
      }
    });

    filteredRawPurchases.forEach(pr => {
      const date = pr.purchaseDate || pr.createdAt;
      const amount = pr.grandTotal || pr.totalAmount || 0;
      if (checkDateInPeriod(date, timePeriod)) {
        currentOutflow += amount;
      } else if (checkDateInPreviousPeriod(date, timePeriod)) {
        prevOutflow += amount;
      }
    });

    const netCashFlow = currentInflow - currentOutflow;
    const prevNetCashFlow = prevInflow - prevOutflow;

    // Growth rates
    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number(((curr - prev) / prev * 100).toFixed(1));
    };

    const inflowGrowth = calcGrowth(currentInflow, prevInflow);
    const outflowGrowth = calcGrowth(currentOutflow, prevOutflow);
    const netGrowth = calcGrowth(netCashFlow, prevNetCashFlow);

    // Initial base balance baseline (cumulative + 15,00,000 starting cash)
    const baseClosingBalance = 1500000;
    const closingBalance = baseClosingBalance + currentInflow - currentOutflow;

    return {
      inflow: currentInflow,
      outflow: currentOutflow,
      netCashFlow,
      closingBalance,
      openingBalance: baseClosingBalance,
      inflowGrowth,
      outflowGrowth,
      netGrowth
    };
  }, [filteredRawInvoices, filteredRawExpenses, filteredRawPurchases, timePeriod]);

  // Bi-directional cash flow chart data
  const cashFlowTimeline = React.useMemo(() => {
    const now = new Date();
    
    // Daily view for "This Month" or "Last 30 Days"
    if (timePeriod === 'This Month' || timePeriod === 'Last 30 Days') {
      const daysCount = timePeriod === 'This Month' ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() : 30;
      const dataset = [];
      
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        if (timePeriod === 'This Month' && d.getMonth() !== now.getMonth()) continue;

        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        dataset.push({
          label: dateStr,
          dateObj: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
          Inflow: 0,
          Outflow: 0,
          Net: 0
        });
      }

      filteredRawInvoices.forEach(inv => {
        const date = new Date(inv.invoiceDate || inv.createdAt);
        const match = dataset.find(pt => 
          pt.dateObj.getDate() === date.getDate() && 
          pt.dateObj.getMonth() === date.getMonth() && 
          pt.dateObj.getFullYear() === date.getFullYear()
        );
        if (match) {
          match.Inflow += inv.totalAmount || 0;
        }
      });

      filteredRawExpenses.forEach(exp => {
        const date = new Date(exp.date || exp.createdAt);
        const match = dataset.find(pt => 
          pt.dateObj.getDate() === date.getDate() && 
          pt.dateObj.getMonth() === date.getMonth() && 
          pt.dateObj.getFullYear() === date.getFullYear()
        );
        if (match) {
          match.Outflow -= exp.amount || 0; // negative value for bi-directional display
        }
      });

      filteredRawPurchases.forEach(pr => {
        const date = new Date(pr.purchaseDate || pr.createdAt);
        const match = dataset.find(pt => 
          pt.dateObj.getDate() === date.getDate() && 
          pt.dateObj.getMonth() === date.getMonth() && 
          pt.dateObj.getFullYear() === date.getFullYear()
        );
        if (match) {
          match.Outflow -= pr.grandTotal || pr.totalAmount || 0; // negative
        }
      });

      return dataset.map(item => ({
        name: item.label,
        Inflow: item.Inflow,
        Outflow: item.Outflow,
        'Net Cash Flow': item.Inflow + item.Outflow
      }));
    }

    // Monthly view for longer periods (Quarter, Year, All Time)
    // Find oldest transaction date to dynamically size the dataset range
    let oldestDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // default to last 12 months
    
    const allDates = [
      ...filteredRawInvoices.map(inv => new Date(inv.invoiceDate || inv.createdAt)),
      ...filteredRawExpenses.map(exp => new Date(exp.date || exp.createdAt)),
      ...filteredRawPurchases.map(pr => new Date(pr.purchaseDate || pr.createdAt))
    ].filter(d => !isNaN(d.getTime()));

    if (allDates.length > 0) {
      const minDate = new Date(Math.min(...allDates));
      // Clamp oldestDate to minDate (set day to 1)
      oldestDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    }

    // Generate monthly buckets from oldestDate to now
    const dataset = [];
    let current = new Date(oldestDate);
    
    // Safety check to prevent infinite loop
    let timelineCount = 0;
    while (current <= now && timelineCount < 120) {
      dataset.push({
        monthName: current.toLocaleString('default', { month: 'short' }),
        year: current.getFullYear(),
        monthIndex: current.getMonth(),
        Inflow: 0,
        Outflow: 0
      });
      current.setMonth(current.getMonth() + 1);
      timelineCount++;
    }

    filteredRawInvoices.forEach(inv => {
      const d = new Date(inv.invoiceDate || inv.createdAt);
      const match = dataset.find(pt => pt.monthIndex === d.getMonth() && pt.year === d.getFullYear());
      if (match) match.Inflow += inv.totalAmount || 0;
    });

    filteredRawExpenses.forEach(exp => {
      const d = new Date(exp.date || exp.createdAt);
      const match = dataset.find(pt => pt.monthIndex === d.getMonth() && pt.year === d.getFullYear());
      if (match) match.Outflow -= exp.amount || 0;
    });

    filteredRawPurchases.forEach(pr => {
      const d = new Date(pr.purchaseDate || pr.createdAt);
      const match = dataset.find(pt => pt.monthIndex === d.getMonth() && pt.year === d.getFullYear());
      if (match) match.Outflow -= pr.grandTotal || pr.totalAmount || 0;
    });

    return dataset.map(item => ({
      name: `${item.monthName} ${item.year.toString().slice(-2)}`,
      Inflow: item.Inflow,
      Outflow: item.Outflow,
      'Net Cash Flow': item.Inflow + item.Outflow
    }));
  }, [filteredRawInvoices, filteredRawExpenses, filteredRawPurchases, timePeriod]);

  // Donut chart data
  const donutData = React.useMemo(() => {
    const total = stats.inflow + stats.outflow;
    if (total === 0) {
      return [
        { name: 'Inflow', value: 50, color: '#10b981' },
        { name: 'Outflow', value: 50, color: '#ef4444' }
      ];
    }
    return [
      { name: 'Inflow', value: stats.inflow, color: '#10b981', pct: (stats.inflow / total * 100).toFixed(1) },
      { name: 'Outflow', value: stats.outflow, color: '#ef4444', pct: (stats.outflow / total * 100).toFixed(1) }
    ];
  }, [stats]);

  // Top Outflow Categories
  const topCategories = React.useMemo(() => {
    const categoriesMap = {};
    
    // Group raw business expenses
    filteredRawExpenses.forEach(exp => {
      const date = exp.date || exp.createdAt;
      if (checkDateInPeriod(date, timePeriod)) {
        const catName = exp.category?.name || 'Operations';
        categoriesMap[catName] = (categoriesMap[catName] || 0) + exp.amount;
      }
    });

    // Group purchases into dynamic 'Procurements' category
    filteredRawPurchases.forEach(pr => {
      const date = pr.purchaseDate || pr.createdAt;
      if (checkDateInPeriod(date, timePeriod)) {
        const amount = pr.grandTotal || pr.totalAmount || 0;
        categoriesMap['Procurements'] = (categoriesMap['Procurements'] || 0) + amount;
      }
    });

    const list = Object.keys(categoriesMap).map(name => ({
      name,
      amount: categoriesMap[name]
    }));

    list.sort((a, b) => b.amount - a.amount);
    
    const totalOut = stats.outflow || 1;
    return list.map(item => ({
      ...item,
      pct: Number((item.amount / totalOut * 100).toFixed(1))
    })).slice(0, 5);
  }, [filteredRawExpenses, filteredRawPurchases, stats.outflow, timePeriod]);

  // Consolidated audit ledger log (Recent transactions)
  const consolidatedTransactions = React.useMemo(() => {
    const feed = [
      ...filteredRawInvoices.map(inv => ({
        id: inv._id,
        type: 'Inflow',
        category: 'Sales Revenue',
        description: `Invoice #${inv.invoiceNumber}`,
        account: inv.companyId?.companyName || 'MANUEN INFOTECH',
        amount: inv.totalAmount || 0,
        date: new Date(inv.invoiceDate || inv.createdAt),
        method: 'Bank Transfer',
        status: inv.paymentStatus || 'Pending'
      })),
      ...filteredRawExpenses.map(exp => ({
        id: exp._id,
        type: 'Outflow',
        category: exp.category?.name || 'Office Supplies',
        description: exp.title,
        account: exp.paymentMethod === 'UPI' ? 'ICICI Bank' : 'HDFC Bank',
        amount: exp.amount || 0,
        date: new Date(exp.date || exp.createdAt),
        method: exp.paymentMethod || 'UPI',
        status: exp.paymentStatus || 'Paid'
      })),
      ...filteredRawPurchases.map(pr => ({
        id: pr._id,
        type: 'Outflow',
        category: 'Procurements',
        description: pr.purchaseVoucherNumber || `Purchase Entry`,
        account: 'HDFC Bank',
        amount: pr.grandTotal || pr.totalAmount || 0,
        date: new Date(pr.purchaseDate || pr.createdAt),
        method: pr.paymentMode || 'NEFT',
        status: pr.paymentStatus || 'Pending'
      }))
    ];

    feed.sort((a, b) => b.date - a.date);

    return feed.filter(tx => {
      // 1. Type filter
      if (txFilter === 'Inflow' && tx.type !== 'Inflow') return false;
      if (txFilter === 'Outflow' && tx.type !== 'Outflow') return false;

      // 2. Search term filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          tx.description.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query) ||
          tx.account.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [filteredRawInvoices, filteredRawExpenses, filteredRawPurchases, txFilter, searchTerm]);

  // Date range formatted label for header
  const dateRangeLabel = React.useMemo(() => {
    const now = new Date();
    if (timePeriod === 'This Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    if (timePeriod === 'Last 30 Days') {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    if (timePeriod === 'This Quarter') {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qStartMonth, 1);
      return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    if (timePeriod === 'This Year') {
      return `01 Jan ${now.getFullYear()} — 31 Dec ${now.getFullYear()}`;
    }
    return 'All Time Consolidated Record';
  }, [timePeriod]);

  // Category Icon Resolver
  const renderCategoryIcon = (name) => {
    const lowercase = name.toLowerCase();
    if (lowercase.includes('rent')) return <Home className="text-rose-500" size={16} />;
    if (lowercase.includes('salaries') || lowercase.includes('payroll')) return <Users className="text-teal-500" size={16} />;
    if (lowercase.includes('office') || lowercase.includes('supplies')) return <Briefcase className="text-amber-500" size={16} />;
    return <Layers className="text-indigo-500" size={16} />;
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)]">
      
      {/* ── TOP HEADER SECTION ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Financial Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Inflow & Outflow</h1>
          <p className="text-xs text-slate-500 mt-1">Track your money flow and financial health</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Analysis Period Dropdown */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2">
            <Calendar size={15} className="text-slate-400" />
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="This Month">This Month</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Quarter">This Quarter</option>
              <option value="This Year">This Year</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          {/* Date range label */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-sm text-xs font-semibold text-slate-600 flex items-center gap-2 select-text">
            <span>{dateRangeLabel}</span>
          </div>

          {/* Action button */}
          <button
            onClick={() => navigate('/sales')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={15} /> Add Transaction
          </button>
        </div>
      </div>

      {/* ── KPI FOUR-CARDS GRID ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Total Inflow Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative hover:border-blue-500/20 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Inflow</span>
            <button className="text-slate-350 hover:text-slate-500"><Info size={14} /></button>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            {loading ? (
              <div className="h-7 w-32 bg-slate-100 rounded animate-pulse my-1" />
            ) : (
              `${currencySymbol}${stats.inflow.toLocaleString()}`
            )}
          </h2>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              stats.inflowGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {stats.inflowGrowth >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
              {Math.abs(stats.inflowGrowth)}%
            </div>
            <span className="text-[10px] text-slate-400 font-medium">vs previous period</span>
          </div>
        </div>

        {/* Total Outflow Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative hover:border-rose-500/20 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Outflow</span>
            <button className="text-slate-350 hover:text-slate-500"><Info size={14} /></button>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            {loading ? (
              <div className="h-7 w-32 bg-slate-100 rounded animate-pulse my-1" />
            ) : (
              `${currencySymbol}${stats.outflow.toLocaleString()}`
            )}
          </h2>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              stats.outflowGrowth <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {stats.outflowGrowth > 0 ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
              {Math.abs(stats.outflowGrowth)}%
            </div>
            <span className="text-[10px] text-slate-400 font-medium">vs previous period</span>
          </div>
        </div>

        {/* Net Cash Flow Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative hover:border-indigo-500/20 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Cash Flow</span>
            <button className="text-slate-350 hover:text-slate-500"><Info size={14} /></button>
          </div>
          <h2 className={`text-2xl font-black tracking-tight font-sans ${stats.netCashFlow >= 0 ? 'text-blue-600' : 'text-rose-655'}`}>
            {loading ? (
              <div className="h-7 w-32 bg-slate-100 rounded animate-pulse my-1" />
            ) : (
              `${stats.netCashFlow >= 0 ? '+' : ''}${currencySymbol}${stats.netCashFlow.toLocaleString()}`
            )}
          </h2>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              stats.netGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {stats.netGrowth >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
              {Math.abs(stats.netGrowth)}%
            </div>
            <span className="text-[10px] text-slate-400 font-medium">vs previous period</span>
          </div>
        </div>

        {/* Closing Balance Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative hover:border-teal-500/20 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Closing Balance</span>
            <button className="text-slate-350 hover:text-slate-500"><Info size={14} /></button>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            {loading ? (
              <div className="h-7 w-32 bg-slate-100 rounded animate-pulse my-1" />
            ) : (
              `${currencySymbol}${stats.closingBalance.toLocaleString()}`
            )}
          </h2>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-medium">
            <span>As of {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

      </div>

      {/* ── MIDDLE CHART & SUMMARY SECTION ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Composed Cash Flow Overview (Line & Stacked Bars) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Cash Flow Overview</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Bi-directional consolidated ledger tracking</p>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 p-0.5 rounded-lg select-none">
              {['Day', 'Week', 'Month', 'Year'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setTimePeriod(tab === 'Month' ? 'This Month' : tab === 'Year' ? 'This Year' : 'Last 30 Days')}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-md cursor-pointer transition-all ${
                    (tab === 'Month' && timePeriod === 'This Month') || 
                    (tab === 'Year' && timePeriod === 'This Year') ||
                    ((tab === 'Day' || tab === 'Week') && timePeriod === 'Last 30 Days')
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[280px] relative w-full">
            {loading && (
              <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center animate-pulse gap-2 z-10">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Recalculating timeline ledger...</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                  formatter={(value) => `${currencySymbol}${Math.abs(Number(value)).toLocaleString()}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold', color: '#64748b', marginTop: 10 }} />
                <Bar dataKey="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="Outflow" fill="#ef4444" radius={[0, 0, 4, 4]} maxBarSize={18} />
                <Line type="monotone" dataKey="Net Cash Flow" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 1, r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash Flow Summary & Donut chart */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Summary ledger breakdown */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
            <h3 className="font-extrabold text-sm text-slate-900 mb-4">Cash Flow Summary</h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Opening Balance</span>
                <span className="font-bold text-slate-800">{currencySymbol}{stats.openingBalance.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Total Inflow</span>
                <span className="font-bold text-emerald-600">+{currencySymbol}{stats.inflow.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Total Outflow</span>
                <span className="font-bold text-rose-600">-{currencySymbol}{stats.outflow.toLocaleString()}</span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span>Net Cash Flow</span>
                <span>{currencySymbol}{stats.netCashFlow.toLocaleString()}</span>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between text-blue-900 font-extrabold">
                <span>Closing Balance</span>
                <span>{currencySymbol}{stats.closingBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Inflow vs Outflow Donut */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex-1 flex flex-col justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 mb-3">Inflow vs Outflow</h3>
            
            <div className="h-36 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${currencySymbol}${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-xs font-black text-slate-800">
                  {currencySymbol}{(stats.inflow + stats.outflow).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-around items-center text-[10px] font-bold text-slate-500 mt-2 border-t border-slate-50 pt-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Inflow {donutData[0]?.pct || 0}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span>Outflow {donutData[1]?.pct || 0}%</span>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/reports')}
              className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-blue-600 hover:text-blue-500 transition-all group cursor-pointer"
            >
              View full report <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </div>

      {/* ── BOTTOM TRANSACTIONS TABLE & TOP CATEGORIES SECTION ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Transactions Consolidated audit log (Left Column) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Recent Transactions</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">consolidated ledgers list</p>
            </div>

            {/* Pill Search Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-0.5 rounded-lg select-none text-[10px] font-extrabold text-slate-400">
              {['All', 'Inflow', 'Outflow'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setTxFilter(tab)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    txFilter === tab 
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40' 
                      : 'hover:text-slate-650'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Consolidate Search Input widget */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search ledger details, categories, or channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all h-9"
            />
          </div>

          <div className="overflow-x-auto flex-1 min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="pb-3 pr-4">Transaction Details</th>
                  <th className="pb-3 px-4">Account Channel</th>
                  <th className="pb-3 px-4">Payment Status</th>
                  <th className="pb-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-16 text-slate-450 font-bold">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Consolidating accounts data...
                    </td>
                  </tr>
                ) : consolidatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-16 text-slate-400 font-medium">
                      No matching records in consolidation ledger.
                    </td>
                  </tr>
                ) : (
                  consolidatedTransactions.slice(0, 7).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 pr-4 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm ${
                          tx.type === 'Inflow' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {tx.type === 'Inflow' ? '+' : '—'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">{tx.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold flex items-center gap-1">
                            {tx.category} • {tx.date.toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500">
                        {tx.account}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          tx.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          tx.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 font-black text-right ${tx.type === 'Inflow' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {tx.type === 'Inflow' ? '+' : '—'}{currencySymbol}{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Categories (Outflow breakdown progress list) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Top Categories (Outflow)</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Top business spend sectors</p>
              </div>
              <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-650 px-2 py-0.5 rounded-md">This Month</span>
            </div>

            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 bg-slate-100 rounded"></div>
                      <div className="h-3 w-10 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded"></div>
                  </div>
                ))
              ) : topCategories.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs font-semibold">
                  No outflow data registered yet.
                </div>
              ) : (
                topCategories.map((cat, idx) => {
                  const gradientClass = 
                    idx === 0 ? 'from-rose-500 to-rose-450' :
                    idx === 1 ? 'from-teal-500 to-teal-450' :
                    idx === 2 ? 'from-amber-500 to-amber-450' :
                    'from-indigo-500 to-indigo-450';
                  
                  return (
                    <div key={cat.name} className="space-y-2 group">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center">
                            {renderCategoryIcon(cat.name)}
                          </div>
                          <span>{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold">{currencySymbol}{cat.amount.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-medium ml-1.5">{cat.pct}%</span>
                        </div>
                      </div>
                      
                      {/* Gradient Progress Bar */}
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-500`}
                          style={{ width: `${cat.pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/expenses')}
            className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-blue-600 hover:text-blue-500 transition-all group cursor-pointer"
          >
            View all categories <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
