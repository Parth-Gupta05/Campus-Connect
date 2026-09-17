import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck,
  AlertCircle, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  Info, 
  BellOff, 
  Loader2,
  ArrowRight,
  Award 
} from 'lucide-react';
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
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    fetchNotifications();
    fetchProfile();
    
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
      case 'event_registration': return <Calendar className="w-4 h-4 text-gray-1000" strokeWidth={1.5} />;
      case 'announcement': return <MessageSquare className="w-4 h-4 text-gray-1000" strokeWidth={1.5} />;
      case 'profile_update': return <CheckCircle2 className="w-4 h-4 text-gray-1000" strokeWidth={1.5} />;
      case 'system': return <Info className="w-4 h-4 text-gray-1000" strokeWidth={1.5} />;
      case 'committee_assignment': return <Award className="w-4 h-4 text-amber-500" strokeWidth={1.5} />;
      default: return <Bell className="w-4 h-4 text-gray-1000" strokeWidth={1.5} />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-[120] transition-opacity duration-300 cursor-pointer" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer */}
      <aside 
        ref={sidebarRef}
        aria-label="Notifications panel"
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background-100 border-l border-gray-400 shadow-2xl z-[130] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-400">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-1000" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold tracking-tight text-gray-1000">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close notifications"
            className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-700 hover:text-gray-1000 cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Quick Action Strip */}
        <div className="px-4 py-2 border-b border-gray-400 flex justify-end bg-background-200">
          <button 
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || notifications.length === 0}
            className="text-xs font-medium text-gray-900 hover:text-gray-1000 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.5} /> Mark all as read
          </button>
        </div>

        {/* Notification Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Action Required Banner */}
          {profile && ((profile.githubUsername && !profile.githubVerified) || (profile.leetcodeUsername && !profile.leetcodeVerified)) && (
            <div className="m-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-500 font-medium text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>Action Required: Verification Pending</span>
              </div>
              <p className="text-xs text-gray-900 leading-relaxed">
                You have unverified platform accounts. Verify your {profile.githubUsername && !profile.githubVerified ? 'GitHub' : ''}{(profile.githubUsername && !profile.githubVerified) && (profile.leetcodeUsername && !profile.leetcodeVerified) ? ' and ' : ''}{profile.leetcodeUsername && !profile.leetcodeVerified ? 'LeetCode' : ''} profiles to unlock live telemetry.
              </p>
              <Link 
                to="/profile" 
                onClick={onClose}
                className="text-xs font-medium text-amber-500 hover:underline inline-flex items-center gap-1 mt-1"
              >
                Go to Profile to Verify <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-900" strokeWidth={1.5} />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-400">
              {notifications.map(notification => (
                <div 
                  key={notification._id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-colors ${
                    !notification.isRead 
                      ? 'bg-gray-100/70 dark:bg-gray-800/40 hover:bg-gray-200/80 dark:hover:bg-gray-800/70' 
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-background-200 border border-gray-400 flex items-center justify-center">
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-xs ${!notification.isRead ? 'font-semibold text-gray-1000' : 'font-medium text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 shrink-0 rounded-full bg-blue-500 mt-1" />
                        )}
                      </div>
                      <p className="text-xs mt-1 text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                        {notification.message}
                      </p>
                      <span className="text-[10px] text-gray-600 mt-2 block font-mono">
                        {new Date(notification.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-background-200 border border-gray-400 flex items-center justify-center mb-3 text-gray-600">
                <BellOff className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-sm text-gray-1000 mb-1">You're all caught up!</p>
              <p className="text-xs text-gray-700">Check back later for new alerts and updates.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
