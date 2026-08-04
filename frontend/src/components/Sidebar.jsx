import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLoader } from 'react-icons/fi';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (user && user.role === 'student') {
      axios.get('/user/profile')
        .then(res => setProfile(res.data))
        .catch(console.error);
    }
  }, [user]);

  const manualCerts = profile?.resumeDetails?.certificates || [];
  const scrapedCerts = profile?.scrapedData?.linkedin?.certifications || [];
  
  // Combine them, preferring manualCerts if titles match
  const certificatesMap = new Map();
  
  scrapedCerts.forEach(cert => {
    certificatesMap.set(cert.title, {
      fileUrl: '',
      isComplete: false
    });
  });

  manualCerts.forEach(cert => {
    certificatesMap.set(cert.title, cert);
  });

  const allCertificates = Array.from(certificatesMap.values());
  const hasIncompleteCerts = allCertificates.some(cert => !cert.isComplete || !cert.fileUrl);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const studentLinks = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Profile', icon: 'person', path: '/profile' },
    { name: 'Opportunities', icon: 'work', path: '/opportunities' },
    { name: 'Events', icon: 'event', path: '#' },
    { name: 'Certificates', icon: 'school', path: '/certificates' },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', icon: 'admin_panel_settings', path: '/admin' },
    { name: 'User Management', icon: 'group', path: '#' },
    { name: 'System Analytics', icon: 'analytics', path: '#' },
  ];

  const links = user.role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className={`hidden md:flex flex-col bg-surface border-r border-border-light h-screen sticky top-0 shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'} z-50`}>
      <div className="px-6 h-20 flex items-center justify-between border-b border-border-light gap-2">
        <span className={`text-lg font-bold text-on-surface whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-full' : 'opacity-0 w-0 overflow-hidden'}`}>
          Campus Connect
        </span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-surface-variant rounded-lg transition-colors flex-shrink-0 text-on-surface-variant cursor-pointer">
          <span className="material-symbols-outlined">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const showDot = link.name === 'Certificates' && hasIncompleteCerts;
          
          return (
            <Link 
              key={link.name}
              to={link.path} 
              className={`relative flex items-center gap-3 py-3 rounded-lg font-button-text text-button-text transition-all duration-300 ${isSidebarOpen ? 'px-4' : 'px-0 justify-center'} ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'}`}
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined">{link.icon}</span>
                {showDot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
                )}
              </div>
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border-light">
        <div className={`flex flex-col gap-2`}>
          <button onClick={handleLogout} disabled={isLoggingOut} className={`flex items-center py-2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isSidebarOpen ? 'px-4 gap-3' : 'justify-center px-0'}`}>
            {isLoggingOut ? (
              <FiLoader className="animate-spin text-[24px]" />
            ) : (
              <span className="material-symbols-outlined">logout</span>
            )}
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}