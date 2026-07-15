import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  if (!user) return null;

  const studentLinks = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Profile', icon: 'person', path: '/profile' },
    { name: 'Opportunities', icon: 'work', path: '#' },
    { name: 'Events', icon: 'event', path: '#' },
    { name: 'Certificates', icon: 'school', path: '#' },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', icon: 'admin_panel_settings', path: '/admin' },
    { name: 'User Management', icon: 'group', path: '#' },
    { name: 'System Analytics', icon: 'analytics', path: '#' },
  ];

  const links = user.role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className={`hidden md:flex flex-col bg-surface border-r border-border-light h-screen sticky top-0 shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} z-50`}>
      <div className="p-gutter h-20 flex items-center justify-between border-b border-border-light">
        <span className={`font-headline-md text-headline-md font-bold text-on-surface whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
          Campus Connect
        </span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-surface-variant rounded-lg transition-colors flex-shrink-0 text-on-surface-variant cursor-pointer">
          <span className="material-symbols-outlined">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={link.name}
              to={link.path} 
              className={`flex items-center gap-3 py-3 rounded-lg font-button-text text-button-text transition-all duration-300 ${isSidebarOpen ? 'px-4' : 'px-0 justify-center'} ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border-light">
        <div className={`flex flex-col gap-2`}>
          <button onClick={logout} className={`flex items-center py-2 text-on-surface-variant hover:text-primary transition-colors ${isSidebarOpen ? 'px-4 gap-3' : 'justify-center px-0'}`}>
            <span className="material-symbols-outlined">logout</span>
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}