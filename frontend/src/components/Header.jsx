import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import API from '../services/api';

const Header = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Helper to extract initials
  const getInitials = (name) => {
    if (!name) return 'S';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0][0].toUpperCase();
  };

  const fetchCompanies = async () => {
    try {
      const res = await API.get('/settings');
      setCompanies(res.data);
      const activeId = localStorage.getItem('selectedCompanyId');
      if (activeId) {
        setSelectedCompanyId(activeId);
      } else if (res.data.length > 0) {
        localStorage.setItem('selectedCompanyId', res.data[0]._id);
        setSelectedCompanyId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch companies in header:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();

    const handleCompanyUpdate = () => {
      fetchCompanies();
    };

    window.addEventListener('company-changed', handleCompanyUpdate);
    return () => {
      window.removeEventListener('company-changed', handleCompanyUpdate);
    };
  }, []);

  const activeCompany = companies.find(c => c._id === selectedCompanyId) || companies[0];

  const handleCompanyChange = (e) => {
    const newId = e.target.value;
    localStorage.setItem('selectedCompanyId', newId);
    setSelectedCompanyId(newId);
    window.location.reload();
  };

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

      {/* User / Company Profile Info Widget */}
      <div className="flex items-center gap-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 p-2.5 pl-4 pr-5 rounded-2xl shadow-sm transition-all duration-200 select-none">
        {/* Avatar with gradient or uploaded logo */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/10 shrink-0 overflow-hidden">
          {activeCompany && activeCompany.logoSquareUrl ? (
            <img 
              src={activeCompany.logoSquareUrl} 
              alt={activeCompany.companyName} 
              className="w-full h-full object-cover" 
            />
          ) : activeCompany && activeCompany.logoUrl ? (
            <img 
              src={activeCompany.logoUrl} 
              alt={activeCompany.companyName} 
              className="w-full h-full object-contain p-1" 
            />
          ) : (
            <span>{activeCompany ? getInitials(activeCompany.companyName) : 'SU'}</span>
          )}
        </div>

        {/* Company Dropdown / Selection */}
        <div className="flex flex-col text-left justify-center min-w-[150px]">
          {companies.length > 0 ? (
            <select
              value={selectedCompanyId}
              onChange={handleCompanyChange}
              className="text-sm font-bold text-slate-800 tracking-tight leading-tight bg-transparent border-none focus:ring-0 focus:outline-none p-0 pr-6 cursor-pointer appearance-none relative select-company-dropdown"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
                backgroundSize: '16px',
                paddingRight: '20px'
              }}
            >
              {companies.map((c) => (
                <option key={c._id} value={c._id} className="text-slate-800 bg-white font-semibold">
                  {c.companyName}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-semibold text-slate-450">No Companies Registered</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

