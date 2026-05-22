import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  Briefcase,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Authenticate
      const res = await API.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/80 overflow-hidden font-sans select-none">

      {/* ================= VIBRANT GLOWING BACKGROUND SHAPES ================= */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>

      {/* Floating glass overlay card */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl z-10 transition-all duration-300 transform scale-100 hover:border-blue-500/20">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-blue-500/30 mb-4 animate-bounce">
            E
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
            <Sparkles className="text-blue-500" size={20} /> Expense Manager
          </h2>
        </div>

        {/* Dynamic Selector Tabs removed */}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Registration fields removed */}

          {/* Username input field */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><User size={16} /></span>
              <input
                type="text"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Password input field */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Access Password</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><Lock size={16} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-12 py-3 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Registration select field removed */}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white rounded-xl py-3.5 font-bold text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Login
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Footer info details */}
        <div className="flex items-center justify-center gap-1.5 mt-8 border-t border-slate-100 pt-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <ShieldCheck size={12} className="text-emerald-500" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
