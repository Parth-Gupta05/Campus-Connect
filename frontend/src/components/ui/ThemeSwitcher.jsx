import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Monitor, Sun, Moon } from 'lucide-react';

export default function ThemeSwitcher({ small = false, className = '' }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Select display theme"
      className={`inline-flex items-center rounded-full p-0.5 border border-gray-400 bg-background-100 shadow-sm transition-colors ${
        small ? 'h-7 gap-0.5' : 'h-8 gap-1'
      } ${className}`}
    >
      {options.map(({ id, label, icon: Icon }) => {
        const isSelected = theme === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            title={id === 'system' ? 'System theme' : `${label} mode`}
            onClick={() => setTheme(id)}
            className={`relative flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer ${
              small ? 'w-6 h-6' : 'w-7 h-7'
            } ${
              isSelected
                ? 'bg-gray-300 text-gray-1000 font-semibold shadow-xs'
                : 'text-gray-700 hover:text-gray-1000 hover:bg-gray-200'
            }`}
          >
            <Icon className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={1.5} />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
