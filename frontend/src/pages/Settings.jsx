import React, { useState, useEffect } from 'react';
import { applyTheme } from '../utils/theme.js';
import {
  Sun,
  Moon,
  Sparkles,
  Check,
  Sliders
} from 'lucide-react';

const Settings = () => {
  const [themeMode, setThemeMode] = useState('light');
  const [accentColor, setAccentColor] = useState('blue');

  // Load saved configurations on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode') || 'light';
    const savedAccent = localStorage.getItem('theme-accent') || 'blue';
    setThemeMode(savedTheme);
    setAccentColor(savedAccent);
  }, []);

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    applyTheme(mode, accentColor);
  };

  const handleAccentChange = (accent) => {
    setAccentColor(accent);
    applyTheme(themeMode, accent);
  };

  const accentOptions = [
    { name: 'blue', label: 'Ocean Blue', colorClass: 'bg-blue-600', borderClass: 'border-blue-500' },
    { name: 'emerald', label: 'Forest Emerald', colorClass: 'bg-emerald-500', borderClass: 'border-emerald-500' },
    { name: 'violet', label: 'Royal Violet', colorClass: 'bg-violet-600', borderClass: 'border-violet-500' },
    { name: 'amber', label: 'Sunset Amber', colorClass: 'bg-amber-500', borderClass: 'border-amber-500' },
    { name: 'rose', label: 'Rose Crimson', colorClass: 'bg-rose-600', borderClass: 'border-rose-500' },
  ];

  return (
    <div className="flex-1 bg-slate-50 p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)]">
      
      {/* Title block */}
      <div className="mb-8">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="text-blue-600" size={22} />
          Appearance Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">Personalize your workspace styling, color schemes, and dashboard interfaces.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Section 1: Light/Dark Mode Selection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sun size={16} className="text-amber-500" />
            Theme Mode
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Light Mode Card */}
            <div
              onClick={() => handleThemeChange('light')}
              className={`p-5 rounded-2xl border bg-white shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:border-slate-350 select-none ${
                themeMode === 'light' 
                  ? 'border-blue-600 ring-2 ring-blue-500/10' 
                  : 'border-slate-200'
              }`}
            >
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                <Sun size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Light Appearance</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Classic clean interface</p>
              </div>
              {themeMode === 'light' && (
                <Check size={16} className="ml-auto text-blue-600 font-bold" />
              )}
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => handleThemeChange('dark')}
              className={`p-5 rounded-2xl border bg-white shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:border-slate-350 select-none ${
                themeMode === 'dark' 
                  ? 'border-blue-600 ring-2 ring-blue-500/10' 
                  : 'border-slate-200'
              }`}
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                <Moon size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Dark Appearance</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Sleek dark mode theme</p>
              </div>
              {themeMode === 'dark' && (
                <Check size={16} className="ml-auto text-blue-600 font-bold" />
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Accent Color Customizer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            Primary Accent Color
          </h3>
          
          <div className="flex flex-wrap gap-4">
            {accentOptions.map((accent) => {
              const isSelected = accentColor === accent.name;
              return (
                <button
                  key={accent.name}
                  onClick={() => handleAccentChange(accent.name)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none bg-white ${
                    isSelected 
                      ? 'border-blue-600 ring-2 ring-blue-500/10 text-slate-800' 
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${accent.colorClass} shrink-0`}></span>
                  {accent.label}
                  {isSelected && (
                    <Check size={12} className="ml-1 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;











