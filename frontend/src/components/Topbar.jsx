import React, { useState, useEffect, useRef, useContext } from 'react';
import NotificationSidebar from './NotificationSidebar';
import MobileStudentNav from './MobileStudentNav';
import { Search, Bell, Loader2, User, LogOut, ShieldAlert, Building2, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import ThemeSwitcher from './ui/ThemeSwitcher';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Topbar({ showSearch = true, defaultSearchQuery = '' }) {
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const isAuthenticated = !!user;

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [searchQuery, setSearchQuery] = useState(defaultSearchQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const searchRef = useRef(null);
  const accountRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (defaultSearchQuery) {
      setSearchQuery(defaultSearchQuery);
    }
  }, [defaultSearchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const isInputFocused = searchRef.current?.querySelector('input') === document.activeElement;
      
      if (searchQuery.trim().length >= 2 && isInputFocused) {
        setIsSearching(true);
        try {
          const res = await axios.get(`/user/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(res.data);
          setShowDropdown(true);
        } catch (error) {
          console.error("Search error", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowAccountMenu(false);
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      navigate('/signin');
    } catch (err) {
      showToast('Failed to log out', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const profilePath =
    user?.role === 'admin'
      ? '/admin/opportunities'
      : user?.role === 'club'
      ? '/club'
      : '/profile';

  const roleLabel =
    user?.role === 'admin'
      ? 'Root Admin'
      : user?.role === 'club'
      ? 'Club Portal'
      : user?.uid
      ? user.uid
      : user?.email
      ? user.email.split('@')[0]
      : 'Profile';

  const roleIcon =
    user?.role === 'admin' ? ShieldAlert : user?.role === 'club' ? Building2 : LayoutDashboard;

  return (
    <>
      <header className={`flex bg-background-100/80 backdrop-blur-md border-b border-gray-400 items-center gap-1.5 sm:gap-3 px-2.5 sm:px-4 md:px-6 h-14 z-40 sticky top-0 w-full min-w-0 transition-colors ${showSearch ? 'justify-between' : 'justify-end'}`}>
        {showSearch && (
          <>
          <Link
            to="/dashboard"
            className="md:hidden flex items-center shrink-0 text-gray-1000"
            aria-label="Campus Connect home"
          >
            <BrandLogo className="w-7 h-7 shrink-0" />
          </Link>
          <div className="relative min-w-0 w-full max-w-[14rem] sm:max-w-xs md:max-w-md lg:max-w-lg flex-1 sm:mr-4" ref={searchRef}>
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" strokeWidth={1.5} />
            <input 
              className="w-full pl-8 sm:pl-9 pr-9 sm:pr-12 py-1.5 text-[13px] sm:text-sm bg-background-200 border border-gray-400 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 font-sans text-gray-1000 placeholder:text-gray-600 transition-colors" 
              placeholder="Search…" 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
            />
            {isSearching ? (
              <Loader2 className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 animate-spin" />
            ) : (
              <kbd className="hidden sm:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-gray-700 bg-gray-200 border border-gray-400 rounded">
                ⌘K
              </kbd>
            )}

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background-100 border border-gray-400 rounded-xl shadow-xl overflow-hidden z-50 w-full sm:min-w-[22rem]">
                {searchResults.length > 0 ? (
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {searchResults.map((result) => (
                      <li key={result._id}>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            if (result.role === 'club') {
                              navigate(`/clubs/${result._id}`);
                            } else {
                              navigate(`/student/${result.uid}`);
                            }
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-background-200 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-400 overflow-hidden shrink-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {result.avatarUrl ? (
                              <img src={result.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              result.name?.slice(0,2).toUpperCase() || (result.role === 'club' ? 'CB' : 'ST')
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-1000 truncate flex items-center gap-1.5">
                              {result.name}
                              {result.role === 'club' && <Building2 className="w-3.5 h-3.5 text-gray-500" />}
                            </p>
                            <p className="text-[10px] text-gray-600 font-mono truncate">
                              {result.role === 'club' ? result.uid : `${result.uid} ${result.branch ? `· ${result.branch}` : ''}`}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-xs text-gray-600">
                    No students found.
                  </div>
                )}
              </div>
            )}
          </div>
          </>
        )}
        
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 min-w-0">
          <div className="hidden md:block">
            <ThemeSwitcher small={true} />
          </div>

          {isAuthenticated && (
            <button 
              onClick={() => setIsNotificationOpen(true)}
              aria-label="View notifications"
              className="relative flex items-center justify-center p-1.5 sm:p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-900 hover:text-gray-1000 cursor-pointer"
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-[14px] px-[3px] bg-red-500 text-white text-[9px] font-bold rounded-full ring-2 ring-background-100">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {isAuthenticated && (
            <div ref={accountRef} className="relative shrink-0 hidden md:block">
              <button 
                onClick={() => setShowAccountMenu((v) => !v)}
                aria-label={showAccountMenu ? 'Close account menu' : 'Open account menu'}
                aria-haspopup="menu"
                aria-expanded={showAccountMenu}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-900 hover:text-gray-1000 cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 border border-gray-400 overflow-hidden shrink-0 flex items-center justify-center text-[11px] sm:text-xs font-semibold text-gray-700">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={1.75} />
                  )}
                </div>
              </button>

              {showAccountMenu && (
                <div 
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 sm:w-60 bg-background-100 border border-gray-400 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-1 duration-100"
                >
                  <div className="px-3.5 py-3 border-b border-gray-400 bg-background-200/50 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-1000 text-background-100 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          roleLabel?.slice(0,2).toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-1000 truncate">
                          {user.role === 'admin'
                            ? 'CampusConnect Admin'
                            : user.role === 'club'
                            ? 'Club Account'
                            : user.email?.split('@')[0] || user.uid || 'Student'}
                        </p>
                        <p className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono uppercase tracking-wider text-gray-600 truncate">
                          {(() => {
                            const Ico = roleIcon;
                            return (<><Ico className="w-2.5 h-2.5" /> {roleLabel}</>);
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1.5">
                    <Link
                      to={profilePath}
                      onClick={() => setShowAccountMenu(false)}
                      role="menuitem"
                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-900 hover:text-gray-1000 hover:bg-gray-200 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                      <span className="font-medium">{user.role === 'student' ? 'My Profile' : user.role === 'club' ? 'Club Portal' : 'Admin Home'}</span>
                    </Link>

                    <div className="my-1 border-t border-gray-400" />

                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      role="menuitem"
                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-left"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-600 dark:text-red-400" strokeWidth={1.5} />
                      ) : (
                        <LogOut className="w-4 h-4" strokeWidth={1.5} />
                      )}
                      <span className="font-medium">{isLoggingOut ? 'Logging out…' : 'Log out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isAuthenticated && <MobileStudentNav />}
        </div>
      </header>

      {isAuthenticated && (
        <NotificationSidebar 
          isOpen={isNotificationOpen} 
          onClose={() => setIsNotificationOpen(false)}
          unreadCount={unreadCount}
          setUnreadCount={setUnreadCount}
        />
      )}
    </>
  );
}
