import React, { useState, useEffect, useRef } from 'react';
import NotificationSidebar from './NotificationSidebar';
import { Search, Bell, Loader2 } from 'lucide-react';
import ThemeSwitcher from './ui/ThemeSwitcher';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ showSearch = true, defaultSearchQuery = '' }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState(defaultSearchQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
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
      // Only perform search if input is actively focused
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

  return (
    <>
      <header className={`flex bg-background-100/80 backdrop-blur-md border-b border-gray-400 items-center px-4 sm:px-6 h-14 z-40 sticky top-0 w-full transition-colors ${showSearch ? 'justify-between' : 'justify-end'}`}>
        {showSearch && (
          <div className="relative w-full max-w-[180px] sm:max-w-xs lg:max-w-md flex-1 mr-4" ref={searchRef}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" strokeWidth={1.5} />
            <input 
              className="w-full pl-9 pr-12 py-1.5 text-sm bg-background-200 border border-gray-400 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 font-sans text-gray-1000 placeholder:text-gray-600 transition-colors" 
              placeholder="Search students by name or UID..." 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 animate-spin" />
            ) : (
              <kbd className="hidden sm:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-gray-700 bg-gray-200 border border-gray-400 rounded">
                ⌘K
              </kbd>
            )}

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background-100 border border-gray-400 rounded-xl shadow-xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {searchResults.map((result) => (
                      <li key={result._id}>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            navigate(`/student/${result.uid}`);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-background-200 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-400 overflow-hidden shrink-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {result.avatarUrl ? (
                              <img src={result.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              result.name?.slice(0,2).toUpperCase() || 'ST'
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-1000 truncate">{result.name}</p>
                            <p className="text-[10px] text-gray-600 font-mono truncate">{result.uid} {result.branch && `· ${result.branch}`}</p>
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
        )}
        
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitcher small={true} />

          <button 
            onClick={() => setIsNotificationOpen(true)} 
            aria-label="View notifications"
            className="relative flex items-center justify-center p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-900 hover:text-gray-1000 cursor-pointer"
          >
            <Bell className="w-4 h-4" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background-100" />
            )}
          </button>
        </div>
      </header>

      <NotificationSidebar 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)}
        unreadCount={unreadCount}
        setUnreadCount={setUnreadCount}
      />
    </>
  );
}
