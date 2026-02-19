import { useState, useEffect, useCallback } from 'react';
import { 
  initializeFirebase, 
  requestNotificationPermission, 
  onForegroundMessage,
  showNotification 
} from '../lib/firebase';

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [fcmToken, setFcmToken] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Check if notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Initialize Firebase
      initializeFirebase();
      
      // Register service worker
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported) return;
    
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Foreground notification:', payload);
      setNotification(payload);
      
      // Show notification for foreground messages
      if (payload.notification) {
        showNotification(
          payload.notification.title,
          payload.notification.body
        );
      }
    });
    
    return () => {
      // Cleanup if needed
    };
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return null;
    
    const token = await requestNotificationPermission();
    if (token) {
      setFcmToken(token);
      setPermission('granted');
      
      // TODO: Send token to backend to store for this user
      console.log('FCM Token obtained:', token);
    }
    return token;
  }, [isSupported]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    isSupported,
    permission,
    fcmToken,
    notification,
    requestPermission,
    clearNotification
  };
};

export default useNotifications;
