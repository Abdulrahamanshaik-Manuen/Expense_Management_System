/**
 * Dynamically applies theme preferences (Light/Dark mode & Accent color) 
 * by overriding Tailwind CSS variables on the root document element.
 * Saves values in localStorage.
 * 
 * @param {'light'|'dark'} themeName 
 * @param {'blue'|'emerald'|'violet'|'amber'|'rose'} accentColor 
 */
export const applyTheme = (themeName, accentColor) => {
  const root = document.documentElement;

  // 1. Accent color configurations (Overriding Tailwind `--color-blue-*` variables)
  const accentColors = {
    blue: {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8'
    },
    emerald: {
      '50': '#ecfdf5',
      '100': '#d1fae5',
      '200': '#a7f3d0',
      '500': '#10b981',
      '600': '#059669',
      '700': '#047857'
    },
    violet: {
      '50': '#f5f3ff',
      '100': '#ede9fe',
      '200': '#ddd6fe',
      '500': '#8b5cf6',
      '600': '#7c3aed',
      '700': '#6d28d9'
    },
    amber: {
      '50': '#fffbeb',
      '100': '#fef3c7',
      '200': '#fde68a',
      '500': '#f59e0b',
      '600': '#d97706',
      '700': '#b45309'
    },
    rose: {
      '50': '#fff1f2',
      '100': '#ffe4e6',
      '200': '#fecdd3',
      '500': '#f43f5e',
      '600': '#e11d48',
      '700': '#be123c'
    }
  };

  const selectedAccent = accentColors[accentColor] || accentColors.blue;
  root.style.setProperty('--color-blue-50', selectedAccent['50']);
  root.style.setProperty('--color-blue-100', selectedAccent['100']);
  root.style.setProperty('--color-blue-200', selectedAccent['200']);
  root.style.setProperty('--color-blue-500', selectedAccent['500']);
  root.style.setProperty('--color-blue-600', selectedAccent['600']);
  root.style.setProperty('--color-blue-700', selectedAccent['700']);

  // 2. Light / Dark mode color variables
  if (themeName === 'dark') {
    root.classList.add('dark');
    
    // Backgrounds
    root.style.setProperty('--color-slate-50', '#0b0f19'); // Dark app background
    root.style.setProperty('--color-white', '#111827');    // Dark card background
    
    // Borders & dividers
    root.style.setProperty('--color-slate-100', '#1f2937');
    root.style.setProperty('--color-slate-200', '#374151');
    root.style.setProperty('--color-slate-350', '#4b5563');
    
    // Main texts
    root.style.setProperty('--color-slate-900', '#f8fafc'); // Pure white headings
    root.style.setProperty('--color-slate-800', '#e2e8f0'); // Off-white body
    root.style.setProperty('--color-slate-700', '#cbd5e1'); // Light gray details
    root.style.setProperty('--color-slate-650', '#94a3b8'); // Muted text
    root.style.setProperty('--color-slate-550', '#64748b'); // Subtle text
    root.style.setProperty('--color-slate-500', '#64748b');
  } else {
    root.classList.remove('dark');
    
    // Clear dark mode overrides, falling back to original CSS values
    root.style.removeProperty('--color-slate-50');
    root.style.removeProperty('--color-white');
    root.style.removeProperty('--color-slate-100');
    root.style.removeProperty('--color-slate-200');
    root.style.removeProperty('--color-slate-350');
    root.style.removeProperty('--color-slate-900');
    root.style.removeProperty('--color-slate-800');
    root.style.removeProperty('--color-slate-700');
    root.style.removeProperty('--color-slate-650');
    root.style.removeProperty('--color-slate-550');
    root.style.removeProperty('--color-slate-500');
  }

  // Save selection
  localStorage.setItem('theme-mode', themeName);
  localStorage.setItem('theme-accent', accentColor);
};
