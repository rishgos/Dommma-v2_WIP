import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X, Check, MessageSquare, DollarSign, FileText, Home } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationBell = () => {
  const { isSupported, permission, notification, requestPermission, clearNotification } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Add new notification when received
  useEffect(() => {
    if (notification) {
      const newNotification = {
        id: Date.now(),
        title: notification.notification?.title || 'New Notification',
        body: notification.notification?.body || '',
        type: notification.data?.type || 'general',
        time: new Date(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev].slice(0, 10));
      setHasUnread(true);
      clearNotification();
    }
  }, [notification, clearNotification]);

  const handleEnableNotifications = async () => {
    const token = await requestPermission();
    if (token) {
      // Add a welcome notification
      setNotifications([{
        id: Date.now(),
        title: 'Notifications Enabled!',
        body: "You'll now receive updates about messages, payments, and properties.",
        type: 'system',
        time: new Date(),
        read: false
      }]);
      setHasUnread(true);
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasUnread(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'payment': return DollarSign;
      case 'document': return FileText;
      case 'property': return Home;
      default: return Bell;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
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
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
            data-testid="notification-dropdown"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-[#1A2F3A]">Notifications</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-xs text-[#1A2F3A] hover:underline flex items-center gap-1"
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
                  <BellRing className="mx-auto mb-3 text-[#1A2F3A]" size={32} />
                  <p className="text-sm text-gray-600 mb-4">
                    Enable notifications to stay updated on messages, payments, and new properties
                  </p>
                  <button
                    onClick={handleEnableNotifications}
                    className="px-4 py-2 bg-[#1A2F3A] text-white rounded-full text-sm hover:bg-[#2C4A52] transition-colors"
                    data-testid="enable-notifications-btn"
                  >
                    Enable Notifications
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="mx-auto mb-3 text-gray-300" size={32} />
                  <p className="text-sm text-gray-500">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <div>
                  {notifications.map((notif) => {
                    const Icon = getIcon(notif.type);
                    return (
                      <div 
                        key={notif.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notif.read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notif.type === 'payment' ? 'bg-green-100 text-green-600' :
                            notif.type === 'message' ? 'bg-blue-100 text-blue-600' :
                            notif.type === 'document' ? 'bg-purple-100 text-purple-600' :
                            notif.type === 'property' ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
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
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <button 
                  onClick={() => setShowDropdown(false)}
                  className="text-xs text-[#1A2F3A] hover:underline"
                >
                  Close
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
