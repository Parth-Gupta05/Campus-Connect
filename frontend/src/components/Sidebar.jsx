import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  LayoutDashboard, 
  User, 
  Award, 
  Users, 
  Compass, 
  Calendar, 
  GraduationCap, 
  ShieldCheck, 
  BarChart3, 
  LogOut, 
  PanelLeft,
  Loader2,
  Palette
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('cc_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState(null);
  const [hasUncheckedEvents, setHasUncheckedEvents] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('cc_sidebar_open', String(next));
      window.dispatchEvent(new Event('cc_sidebar_toggle'));
      return next;
    });
  };

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('cc_sidebar_open');
      if (saved !== null) {
        setIsSidebarOpen(saved === 'true');
      }
    };

    window.addEventListener('cc_sidebar_toggle', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('cc_sidebar_toggle', handleSync);
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

  useEffect(() => {
    if (user && user.role === 'student') {
      axios.get('/user/profile')
        .then(res => setProfile(res.data))
        .catch(console.error);

      axios.get('/events/public')
        .then(res => {
          const events = res.data;
          if (events.length > 0) {
            const lastChecked = localStorage.getItem('lastCheckedEvents');
            if (!lastChecked) {
              setHasUncheckedEvents(true);
            } else {
              const lastCheckedDate = new Date(lastChecked).getTime();
              const hasNew = events.some(e => new Date(e.createdAt || e.date).getTime() > lastCheckedDate);
              setHasUncheckedEvents(hasNew);
            }
          }
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (location.pathname === '/events') {
      setHasUncheckedEvents(false);
      localStorage.setItem('lastCheckedEvents', new Date().toISOString());
    }
  }, [location.pathname]);

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
    showToast('Logged out successfully', 'success');
  };

  const studentLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Appearance', icon: Palette, path: '/appearance' },
    { name: 'Placements', icon: Award, path: '/placements' },
    { name: 'Clubs', icon: Users, path: '/clubs' },
    { name: 'Opportunities', icon: Compass, path: '/opportunities' },
    { name: 'Events', icon: Calendar, path: '/events' },
    { name: 'Certificates', icon: GraduationCap, path: '/certificates' },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', icon: ShieldCheck, path: '/admin' },
    { name: 'User Management', icon: Users, path: '#' },
    { name: 'System Analytics', icon: BarChart3, path: '#' },
  ];

  const clubLinks = [
    { name: 'Club Portal', icon: LayoutDashboard, path: '/club' }
  ];

  const links = user.role === 'admin' ? adminLinks : (user.role === 'club' ? clubLinks : studentLinks);

  return (
    <aside 
      className={`hidden md:flex flex-col bg-background-100 border-r border-gray-400 h-full md:h-screen shrink-0 overflow-hidden transition-[width] duration-300 ease-geist will-change-[width] ${
        isSidebarOpen ? 'w-64' : 'w-16'
      } z-40 select-none`}
    >
      {/* Brand & Toggle Header */}
      <div className="h-14 flex items-center border-b border-gray-400 px-3 shrink-0 relative overflow-hidden">
        <Link 
          to="/dashboard" 
          className={`flex items-center gap-2.5 min-w-0 transition-all duration-300 ease-geist ${
            isSidebarOpen 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 -translate-x-4 pointer-events-none absolute left-3'
          }`}
          title="Campus Connect"
        >
          <BrandLogo className="w-7 h-7 shrink-0" />
          <span className="font-sans font-semibold text-sm tracking-tight text-gray-1000 whitespace-nowrap truncate min-w-0">
            Campus Connect
          </span>
        </Link>

        <button 
          onClick={toggleSidebar} 
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className={`relative p-2 hover:bg-gray-200 rounded-md transition-all duration-300 ease-geist text-gray-700 hover:text-gray-1000 cursor-pointer shrink-0 ${
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
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-1 custom-scrollbar">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const showDot = (link.name === 'Certificates' && hasIncompleteCerts) || (link.name === 'Events' && hasUncheckedEvents);
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.name}
              to={link.path} 
              title={!isSidebarOpen ? link.name : undefined}
              className={`relative flex items-center h-10 rounded-lg text-sm transition-all duration-200 group ${
                isSidebarOpen ? 'px-3' : 'px-0 justify-center'
              } ${
                isActive 
                  ? 'bg-gray-200 text-gray-1000 font-medium shadow-xs border border-gray-300 dark:border-gray-600' 
                  : 'text-gray-900 hover:text-gray-1000 hover:bg-gray-100'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0 relative">
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
                {showDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background-100" />
                )}
              </div>
              <span 
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-geist text-xs sm:text-sm ${
                  isSidebarOpen 
                    ? 'max-w-[160px] opacity-100 translate-x-0 ml-3' 
                    : 'max-w-0 opacity-0 -translate-x-2 ml-0 pointer-events-none'
                }`}
              >
                {link.name}
              </span>

              {/* Floating Tooltip when Collapsed */}
              {!isSidebarOpen && (
                <div className="fixed left-16 ml-3 px-2.5 py-1 bg-gray-1000 text-background-100 text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                  {link.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls: Logout */}
      <div className="p-3 border-t border-gray-400 shrink-0 overflow-hidden">
        {/* Animated Logout Button */}
        <button 
          onClick={handleLogout} 
          disabled={isLoggingOut} 
          aria-label="Log out"
          title={!isSidebarOpen ? "Log out" : undefined}
          className={`relative flex items-center h-10 rounded-lg text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group w-full ${
            isSidebarOpen ? 'px-3' : 'px-0 justify-center'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-red-600 dark:text-red-400" strokeWidth={1.5} />
            ) : (
              <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors" strokeWidth={1.5} />
            )}
          </div>
          <span 
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-geist ${
              isSidebarOpen 
                ? 'max-w-[160px] opacity-100 translate-x-0 ml-3' 
                : 'max-w-0 opacity-0 -translate-x-2 ml-0 pointer-events-none'
            }`}
          >
            Log out
          </span>

          {/* Floating Tooltip when Collapsed */}
          {!isSidebarOpen && (
            <div className="fixed left-16 ml-3 px-2.5 py-1 bg-red-600 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
              Log out
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}