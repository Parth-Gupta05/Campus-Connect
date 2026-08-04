import React, { useState } from 'react';
import NotificationSidebar from './NotificationSidebar';

export default function Topbar({ showSearch = false }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <>
      <div className={`hidden md:flex bg-white/80 backdrop-blur-xl border-b border-border-light shadow-sm items-center px-6 h-20 z-40 sticky top-0 w-full ${showSearch ? 'justify-between' : 'justify-end'}`}>
        {showSearch && (
          <div className="relative w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-border-light rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface placeholder:text-text-slate" 
              placeholder="Search opportunities, events..." 
              type="text" 
            />
          </div>
        )}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsNotificationOpen(true)} 
            className="relative flex items-center justify-center p-2 hover:bg-surface-variant rounded-lg transition-colors text-on-surface-variant hover:text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
            )}
          </button>
        </div>
      </div>

      <NotificationSidebar 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)}
        unreadCount={unreadCount}
        setUnreadCount={setUnreadCount}
      />
    </>
  );
}
