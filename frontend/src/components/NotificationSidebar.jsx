import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FiX, FiCheck, FiBell, FiInfo, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

export default function NotificationSidebar({ isOpen, onClose, unreadCount, setUnreadCount }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const sidebarRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      if (error.response && error.response.status === 401) return; // Silent abort on 401
      console.error('Failed to fetch notifications', error);
    }
  };

  const fetchProfile = async () => {
    if (user?.role === 'student') {
      try {
        const res = await axios.get('/user/profile');
        setProfile(res.data);
      } catch (e) {
        console.error('Failed to fetch profile in sidebar', e);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchProfile();
    }
  }, [isOpen]);

  useEffect(() => {
    // Initial fetch for badge
    fetchNotifications();
    fetchProfile();
    
    // Polling every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Calculate total unread count including unverified accounts
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.isRead).length;
    const unverifiedCount = profile ? [
      profile.githubUsername && !profile.githubVerified,
      profile.leetcodeUsername && !profile.leetcodeVerified
    ].filter(Boolean).length : 0;
    
    // We only add 1 to the badge if there are any unverified accounts, 
    // since they are grouped into a single "Action Required" banner.
    setUnreadCount(unreadNotifications + (unverifiedCount > 0 ? 1 : 0));
  }, [notifications, profile, setUnreadCount]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read', error);
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All caught up!', 'success');
    } catch (error) {
      console.error('Failed to mark all as read', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'event_registration': return <FiCalendar className="text-primary" />;
      case 'announcement': return <FiMessageSquare className="text-secondary" />;
      case 'profile_update': return <FiCheck className="text-success" />;
      case 'system': return <FiInfo className="text-info" />;
      default: return <FiBell className="text-primary" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-scrim/30 backdrop-blur-sm z-[60] transition-opacity duration-300" />
      )}

      {/* Sidebar Panel */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-surface-container-lowest border-l border-border-light shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <h2 className="text-title-lg font-bold flex items-center gap-2">
            <FiBell /> Notifications
            {unreadCount > 0 && (
              <span className="bg-error text-on-error text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors text-on-surface-variant">
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="p-3 border-b border-border-light flex justify-end bg-surface">
          <button 
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || notifications.length === 0}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <FiCheck /> Mark all as read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {profile && ((profile.githubUsername && !profile.githubVerified) || (profile.leetcodeUsername && !profile.leetcodeVerified)) && (
            <div className="p-4 bg-error/10 border-b border-error/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-error font-bold text-sm">
                <FiInfo className="text-lg" /> Action Required
              </div>
              <p className="text-xs text-on-surface-variant">
                You have unverified platform accounts. Please verify your {profile.githubUsername && !profile.githubVerified ? 'GitHub' : ''}{(profile.githubUsername && !profile.githubVerified) && (profile.leetcodeUsername && !profile.leetcodeVerified) ? ' and ' : ''}{profile.leetcodeUsername && !profile.leetcodeVerified ? 'LeetCode' : ''} accounts.
              </p>
              <Link to="/profile" className="text-xs font-bold text-error hover:underline w-fit" onClick={onClose}>Go to Profile to Verify &rarr;</Link>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center p-8">
              <FiLoader className="animate-spin text-primary text-2xl" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-border-light">
              {notifications.map(notification => (
                <div 
                  key={notification._id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-surface-variant ${!notification.isRead ? 'bg-primary-container/20' : 'bg-surface-container-lowest'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 p-2 bg-surface rounded-full shadow-sm">
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-sm ${!notification.isRead ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 shrink-0 rounded-full bg-primary mt-1.5" />
                        )}
                      </div>
                      <p className={`text-sm mt-1 line-clamp-2 ${!notification.isRead ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-2">
                        {new Date(notification.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-on-surface-variant text-center">
              <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-4">
                <FiBell className="text-2xl opacity-50" />
              </div>
              <p className="font-medium text-lg text-on-surface mb-1">You're all caught up!</p>
              <p className="text-sm">Check back later for new alerts.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
