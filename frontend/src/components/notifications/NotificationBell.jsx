import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, X, Check, MessageSquare, DollarSign, FileText, Home, Calendar, Star, Wrench, Loader2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationBell = ({ userId }) => {
  const { isSupported, permission, notification, requestPermission, clearNotification, fcmToken } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/notifications/${userId}`);
      const fetchedNotifications = response.data.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type || 'general',
        time: new Date(n.created_at),
        read: n.read,
        data: n.data
      }));
      setNotifications(fetchedNotifications);
      setHasUnread(fetchedNotifications.some(n => !n.read));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
    setLoading(false);
  }, [userId]);

  // Fetch on mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Register FCM token with backend
  useEffect(() => {
    const registerToken = async () => {
      if (fcmToken && userId) {
        try {
          await axios.post(`${API}/notifications/register-token`, {
            user_id: userId,
            token: fcmToken
          });
          console.log('FCM token registered with backend');
        } catch (error) {
          console.error('Failed to register FCM token:', error);
        }
      }
    };
    registerToken();
  }, [fcmToken, userId]);

  // Add new notification when received via FCM
  useEffect(() => {
    if (notification) {
      const newNotification = {
        id: Date.now().toString(),
        title: notification.notification?.title || 'New Notification',
        body: notification.notification?.body || '',
        type: notification.data?.type || 'general',
        time: new Date(),
        read: false,
        data: notification.data
      };
      setNotifications(prev => [newNotification, ...prev].slice(0, 20));
      setHasUnread(true);
      clearNotification();
      
      // Refresh from backend to get the persisted notification
      setTimeout(fetchNotifications, 1000);
    }
  }, [notification, clearNotification, fetchNotifications]);

  const handleEnableNotifications = async () => {
    const token = await requestPermission();
    if (token && userId) {
      // Register token with backend
      try {
        await axios.post(`${API}/notifications/register-token`, {
          user_id: userId,
          token: token
        });
        
        // Send a welcome notification
        await axios.post(`${API}/notifications/send`, {
          user_id: userId,
          title: 'Notifications Enabled!',
          body: "You'll now receive real-time updates about messages, payments, and properties.",
          type: 'system',
          data: { action: 'welcome' }
        });
        
        // Refresh notifications
        fetchNotifications();
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    }
  };

  const markAllRead = async () => {
    // Mark all as read locally
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasUnread(false);
    
    // Mark all as read in backend
    for (const notif of notifications.filter(n => !n.read)) {
      try {
        await axios.post(`${API}/notifications/mark-read/${notif.id}`);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const markAsRead = async (notifId) => {
    setNotifications(prev => prev.map(n => 
      n.id === notifId ? { ...n, read: true } : n
    ));
    setHasUnread(notifications.some(n => n.id !== notifId && !n.read));
    
    try {
      await axios.post(`${API}/notifications/mark-read/${notifId}`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'payment': return DollarSign;
      case 'document': return FileText;
      case 'property': return Home;
      case 'booking': return Calendar;
      case 'review': return Star;
      case 'maintenance': return Wrench;
      default: return Bell;
    }
  };

  const getIconStyle = (type) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-600';
      case 'message': return 'bg-blue-100 text-blue-600';
      case 'document': return 'bg-purple-100 text-purple-600';
      case 'property': return 'bg-orange-100 text-orange-600';
      case 'booking': return 'bg-teal-100 text-teal-600';
      case 'review': return 'bg-yellow-100 text-yellow-600';
      case 'maintenance': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        data-testid="notification-bell"
      >
        {hasUnread ? (
          <BellRing size={20} className="text-[#1A2F3A]" />
        ) : (
          <Bell size={20} className="text-gray-600" />
        )}
        {hasUnread && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl z-50 overflow-hidden border border-gray-100"
            data-testid="notification-dropdown"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52]">
              <h3 className="font-semibold text-white">Notifications</h3>
              {notifications.some(n => !n.read) && (
                <button 
                  onClick={markAllRead}
                  className="text-xs text-white/80 hover:text-white flex items-center gap-1"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {!isSupported ? (
                <div className="p-6 text-center">
                  <Bell className="mx-auto mb-3 text-gray-300" size={32} />
                  <p className="text-sm text-gray-500">
                    Notifications are not supported in this browser
                  </p>
                </div>
              ) : permission !== 'granted' ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A2F3A]/10 flex items-center justify-center">
                    <BellRing className="text-[#1A2F3A]" size={28} />
                  </div>
                  <h4 className="font-semibold text-[#1A2F3A] mb-2">Stay Updated</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Get instant alerts for messages, offers, bookings, and property updates
                  </p>
                  <button
                    onClick={handleEnableNotifications}
                    className="px-5 py-2.5 bg-[#1A2F3A] text-white rounded-full text-sm font-medium hover:bg-[#2C4A52] transition-colors"
                    data-testid="enable-notifications-btn"
                  >
                    Enable Notifications
                  </button>
                </div>
              ) : loading ? (
                <div className="p-6 flex items-center justify-center">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="mx-auto mb-3 text-gray-300" size={32} />
                  <p className="text-sm text-gray-500">
                    No notifications yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    We'll notify you when something happens
                  </p>
                </div>
              ) : (
                <div>
                  {notifications.map((notif) => {
                    const Icon = getIcon(notif.type);
                    return (
                      <div 
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notif.read ? 'bg-blue-50/50' : ''
                        }`}
                        data-testid={`notification-item-${notif.id}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${getIconStyle(notif.type)}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[#1A2F3A] truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {notif.body}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notif.time)}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                <button 
                  onClick={fetchNotifications}
                  className="text-xs text-[#1A2F3A] hover:underline"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
