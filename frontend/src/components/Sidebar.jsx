import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  ShoppingBag,
  FileSpreadsheet,
  FileText,
  Users,
  ShieldCheck,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'Universal User', role: 'admin' };

  const navItems = [
    { name: 'Home', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Expenses', path: '/expenses', icon: <DollarSign size={20} /> },
    { name: 'Purchases', path: '/purchases', icon: <ShoppingBag size={20} /> },
    { name: 'Sales & Billing', path: '/sales', icon: <FileSpreadsheet size={20} /> },
    { name: 'Invoices', path: '/invoices', icon: <FileText size={20} /> },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin Settings', path: '/settings', icon: <ShieldCheck size={20} /> });
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl shadow-slate-900/10">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30 animate-pulse">
          E
        </div>
        <div>
          <h1 className="font-extrabold text-lg leading-none tracking-tight text-white">Expense</h1>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-xs font-bold uppercase tracking-wider ${isActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Badge Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-xs font-bold transition-all duration-200 cursor-pointer bg-slate-900/60 shadow-sm"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
