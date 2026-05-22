import React from 'react';
import { Sparkles } from 'lucide-react';

const Header = () => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'Universal User' };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between text-slate-800 sticky top-0 z-30 animate-fade-in">
      {/* Constant Branding Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
          <Sparkles className="text-blue-600" size={18} />
          Expense Management System
        </h2>
        <p className="text-xs text-slate-550 mt-0.5">Real-time data pipeline</p>
      </div>
    </header>
  );
};

export default Header;
