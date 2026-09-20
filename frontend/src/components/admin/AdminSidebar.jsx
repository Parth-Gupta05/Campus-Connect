import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Briefcase, Users, LogOut, PanelLeft, ShieldAlert, Building2, Loader2, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdminSidebar() {
  const { logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('cc_admin_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('cc_admin_sidebar_open', String(next));
      window.dispatchEvent(new Event('cc_admin_sidebar_toggle'));
      return next;
    });
  };

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('cc_admin_sidebar_open');
      if (saved !== null) {
        setIsSidebarOpen(saved === 'true');
      }
    };
    window.addEventListener('cc_admin_sidebar_toggle', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cc_admin_sidebar_toggle', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      navigate('/signin');
    } catch (err) {
      setIsLoggingOut(false);
      showToast('Failed to log out', 'error');
    }
  };

  const navItems = [
    { to: '/admin/opportunities', label: 'Opportunities', icon: Briefcase },
    { to: '/admin/students', label: 'Students Directory', icon: Users },
    { to: '/admin/clubs', label: 'Clubs & AICTE Units', icon: Building2 },
    { to: '/admin/evaluations/assessments', label: 'Assessments', icon: FileSpreadsheet },
    { to: '/admin/evaluations/global', label: 'Global Skill Matrix', icon: TrendingUp },
  ];

  return (
    <aside 
      className={`bg-background-100 border-r border-gray-400 h-screen sticky top-0 flex flex-col z-50 shrink-0 overflow-hidden transition-[width] duration-300 ease-geist will-change-[width] select-none ${
        isSidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Brand & Toggle Header */}
      <div className="h-14 flex items-center border-b border-gray-400 px-3.5 shrink-0 relative overflow-hidden bg-background-100">
        <div 
          className={`flex items-center gap-2.5 min-w-0 transition-all duration-300 ease-geist ${
            isSidebarOpen 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 -translate-x-4 pointer-events-none absolute left-3.5'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gray-1000 text-background-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            CC
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-gray-1000 tracking-tight leading-none truncate">
              CampusConnect
            </h2>
            <div className="flex items-center gap-1 mt-1">
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.2 rounded">
                <ShieldAlert className="w-2.5 h-2.5" />
                Root Admin
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={toggleSidebar} 
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className={`relative p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-700 hover:text-gray-1000 cursor-pointer shrink-0 ${
            isSidebarOpen ? 'ml-auto' : 'mx-auto'
          }`}
        >
          <PanelLeft 
            className={`w-4 h-4 transition-transform duration-300 ease-geist ${
              isSidebarOpen ? 'rotate-0' : 'rotate-180'
            }`} 
            strokeWidth={1.5} 
          />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={!isSidebarOpen ? item.label : undefined}
              className={({ isActive }) =>
                `relative flex items-center h-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 group ${
                  isSidebarOpen ? 'px-3' : 'px-0 justify-center'
                } ${
                  isActive
                    ? 'bg-gray-200 text-gray-1000 font-semibold shadow-2xs'
                    : 'text-gray-900 hover:text-gray-1000 hover:bg-gray-100'
                }`
              }
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <span 
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-geist ${
                  isSidebarOpen 
                    ? 'max-w-[160px] opacity-100 translate-x-0 ml-3' 
                    : 'max-w-0 opacity-0 -translate-x-2 ml-0 pointer-events-none'
                }`}
              >
                {item.label}
              </span>

              {/* Floating Tooltip when Collapsed */}
              {!isSidebarOpen && (
                <div className="fixed left-16 ml-3 px-2.5 py-1 bg-gray-1000 text-background-100 text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Sign out */}
      <div className="p-2 border-t border-gray-400 shrink-0 overflow-hidden">
        <button
          onClick={handleLogout}
          aria-label="Sign Out"
          title={!isSidebarOpen ? "Sign Out" : undefined}
          className={`relative flex items-center h-10 rounded-lg font-medium text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer group w-full ${
            isSidebarOpen ? 'px-3' : 'px-0 justify-center'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            )}
          </div>
          <span 
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-geist ${
              isSidebarOpen 
                ? 'max-w-[160px] opacity-100 translate-x-0 ml-3' 
                : 'max-w-0 opacity-0 -translate-x-2 ml-0 pointer-events-none'
            }`}
          >
            Sign Out
          </span>

          {/* Floating Tooltip when Collapsed */}
          {!isSidebarOpen && (
            <div className="fixed left-16 ml-3 px-2.5 py-1 bg-red-600 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
