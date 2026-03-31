import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, MessageSquare, DollarSign, FileText, Briefcase, Home } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

const NOTIFICATION_ICONS = {
  message: MessageSquare,
  payment: DollarSign,
  booking: FileText,
  job_post: Briefcase,
  job_bid: DollarSign,
  bid_accepted: Check,
  application: Home,
  general: Bell,
};

export default function NotificationCenter({ userId, onCountUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        axios.get(`${API}/notifications/${userId}?limit=20`),
        axios.get(`${API}/notifications/${userId}/count`)
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.unread_count);
      onCountUpdate?.(countRes.data.unread_count);
    } catch (e) { console.error('Notification fetch error:', e); }
  }, [userId, onCountUpdate]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!userId || !WS_URL) return;
    let ws = null;
    let reconnectTimer = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      try {
        ws = new WebSocket(`${WS_URL}/ws/${userId}`);
        wsRef.current = ws;

        ws.onopen = () => {
          // Send ping to keep alive
          const pingInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            } else {
              clearInterval(pingInterval);
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
              setNotifications(prev => [data.notification, ...prev]);
              setUnreadCount(prev => prev + 1);
            } else if (data.type === 'notification_count') {
              setUnreadCount(data.count);
            }
          } catch (e) { /* ignore parse errors */ }
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimer = setTimeout(connect, 10000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        if (isMounted) {
          reconnectTimer = setTimeout(connect, 10000);
        }
      }
    };

    connect();
    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/notifications/${userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) { console.error(e); }
  };

  const clearAll = async () => {
    try {
      await axios.delete(`${API}/notifications/${userId}/clear`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) { console.error(e); }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef} data-testid="notification-center">
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="relative p-2 text-gray-600 hover:text-[#1A2F3A] transition-colors"
        data-testid="notification-bell"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full min-w-[18px] px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden" data-testid="notification-dropdown">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-[#1A2F3A] text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1" data-testid="mark-all-read">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500" data-testid="clear-all">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <Bell size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = NOTIFICATION_ICONS[n.type] || Bell;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                    onClick={() => !n.read && markRead(n.id)}
                    data-testid={`notification-${n.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${!n.read ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.read ? 'font-semibold text-[#1A2F3A]' : 'text-gray-700'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
