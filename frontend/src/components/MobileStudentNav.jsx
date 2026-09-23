import React, { useContext, useState } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Award,
  Compass,
  Calendar,
  User,
  Users,
  GraduationCap,
  LogOut,
  Loader2,
  Menu,
  X,
  Briefcase,
  Palette,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ThemeSwitcher from './ui/ThemeSwitcher';

const STUDENT_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/profile', label: 'Profile', icon: Palette, end: true },
  { to: '/placements', label: 'Placements', icon: Award, isActive: (path) => path.startsWith('/placements') },
  { to: '/clubs', label: 'Clubs', icon: Users, isActive: (path) => path.startsWith('/clubs') },
  { to: '/opportunities', label: 'Opportunities', icon: Compass, end: true },
  { to: '/events', label: 'Events', icon: Calendar, end: true },
  { to: '/certificates', label: 'Certificates', icon: GraduationCap, end: true },
];

const CLUB_ITEMS = [
  { to: '/club', label: 'Club Portal', icon: LayoutDashboard, isActive: (path) => path.startsWith('/club') },
];

function NavItem({ to, label, icon: Icon, end, isActive: isActiveFn, onClick, showLogoutSpinner, compact = false }) {
  const location = useLocation();
  const isMatch = isActiveFn ? isActiveFn(location.pathname) : null;

  const labelClasses = compact
    ? 'text-[10px] leading-none font-medium'
    : 'text-sm leading-none font-medium';
  const iconSize = compact ? 'w-5 h-5' : 'w-[1.375rem] h-[1.375rem]';
  const gap = compact ? 'gap-[3px]' : 'gap-1.5';
  const padding = compact ? 'py-1 px-2' : 'px-4 py-3.5';

  if (!to) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex ${compact ? 'flex-col items-center justify-center' : 'flex-row items-center'} ${gap} w-full rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${padding}`}
        disabled={showLogoutSpinner}
      >
        {showLogoutSpinner ? (
          <Loader2 className={`${iconSize} animate-spin`} strokeWidth={1.5} />
        ) : (
          <Icon className={iconSize} strokeWidth={1.5} />
        )}
        <span className={`${labelClasses}`}>{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => {
        const active = isMatch !== null ? isMatch : isActive;
        const base = compact
          ? 'flex flex-col items-center justify-center gap-[3px] min-w-[4.25rem] px-1.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer'
          : 'flex items-center gap-1.5 w-full rounded-xl px-4 py-3.5 transition-colors cursor-pointer';
        const variant = active
          ? 'text-gray-1000 ' + (compact ? '' : 'bg-gray-200 font-semibold')
          : 'text-gray-700 hover:text-gray-1000 ' + (compact ? '' : 'hover:bg-gray-200');
        return `${base} ${variant}`;
      }}
    >
      <Icon className={iconSize} strokeWidth={1.5} />
      <span className={labelClasses}>{label}</span>
    </NavLink>
  );
}

export default function MobileStudentNav() {
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!user || user.role === 'admin') return null;

  const allItems = user.role === 'club' ? CLUB_ITEMS : STUDENT_ITEMS;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsSheetOpen(false);
    try {
      await logout();
      showToast('Logged out successfully', 'success');
    } catch (err) {
      showToast('Failed to log out', 'error');
      setIsLoggingOut(false);
    }
  };

  const current =
    allItems.find(i => i.isActive ? i.isActive(location.pathname) : (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)))
    || null;

  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsSheetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative md:hidden flex items-center shrink-0" ref={menuRef}>
      <nav aria-label="Primary navigation" role="navigation">
        <button
          type="button"
          aria-label={isSheetOpen ? 'Close main menu' : 'Open main menu'}
          aria-haspopup="dialog"
          aria-expanded={isSheetOpen}
          title={isSheetOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsSheetOpen(open => !open)}
          className="relative flex items-center justify-center p-1.5 sm:p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-900 hover:text-gray-1000 cursor-pointer"
        >
          {isSheetOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
        </button>
      </nav>

      {isSheetOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-background-100 border border-gray-400 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-2">
            <div className="space-y-0.5 mb-2">
              {allItems.map(item => (
                <NavItem
                  key={item.to}
                  end={item.end}
                  isActive={item.isActive}
                  to={item.to}
                  onClick={() => setIsSheetOpen(false)}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </div>

            <div className="my-2 border-t border-gray-400/60 mx-2" />

            <div className="flex items-center justify-between rounded-xl px-4 py-2.5 hover:bg-gray-200 transition-colors">
              <span className="text-sm font-medium text-gray-900">Theme</span>
              <ThemeSwitcher small />
            </div>

            <div className="my-2 border-t border-gray-400/60 mx-2" />

            <div className="space-y-0.5">
              <NavItem
                icon={LogOut}
                label="Log out"
                onClick={handleLogout}
                showLogoutSpinner={isLoggingOut}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
