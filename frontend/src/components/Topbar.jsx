import React, { useState } from 'react';
import NotificationSidebar from './NotificationSidebar';
import { Search, Bell } from 'lucide-react';
import ThemeSwitcher from './ui/ThemeSwitcher';

export default function Topbar({ showSearch = false }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <>
      <header className={`flex bg-background-100/80 backdrop-blur-md border-b border-gray-400 items-center px-4 sm:px-6 h-14 z-40 sticky top-0 w-full transition-colors ${showSearch ? 'justify-between' : 'justify-end'}`}>
        {showSearch && (
          <div className="relative w-80 lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" strokeWidth={1.5} />
            <input 
              className="w-full pl-9 pr-12 py-1.5 text-sm bg-background-200 border border-gray-400 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 font-sans text-gray-1000 placeholder:text-gray-600 transition-colors" 
              placeholder="Search opportunities, events..." 
              type="text" 
            />
            <kbd className="hidden sm:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-gray-700 bg-gray-200 border border-gray-400 rounded">
              ⌘K
            </kbd>
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
