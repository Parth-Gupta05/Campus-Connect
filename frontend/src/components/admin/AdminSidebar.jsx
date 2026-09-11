import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiBriefcase, FiUsers, FiLogOut, FiSettings } from 'react-icons/fi';

export default function AdminSidebar() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/signin';
  };

  return (
    <aside className="w-64 bg-surface border-r border-border-light h-screen sticky top-0 flex flex-col z-50 shrink-0">
      <div className="p-6 border-b border-border-light">
        <h2 className="text-2xl font-display-hero font-bold text-primary tracking-tight">Campus<span className="text-on-surface">Connect</span></h2>
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-error/10 text-error border border-error/20 inline-block mt-2">
          Root Admin
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <NavLink
          to="/admin/opportunities"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              isActive
                ? 'bg-primary text-on-primary shadow-md transform scale-[1.02]'
                : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
            }`
          }
        >
          <FiBriefcase className="text-lg" />
          Opportunities
        </NavLink>
        
        <NavLink
          to="/admin/students"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              isActive
                ? 'bg-primary text-on-primary shadow-md transform scale-[1.02]'
                : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
            }`
          }
        >
          <FiUsers className="text-lg" />
          Students Directory
        </NavLink>
        <div className="opacity-50 cursor-not-allowed flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-on-surface-variant">
          <FiSettings className="text-lg" />
          Settings
        </div>
      </div>

      <div className="p-4 border-t border-border-light">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-sm text-error hover:bg-error/10 transition-all duration-300"
        >
          <FiLogOut className="text-lg" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
