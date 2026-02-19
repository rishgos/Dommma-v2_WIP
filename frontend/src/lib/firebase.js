// Firebase configuration for DOMMMA
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, logEvent, setUserProperties } from 'firebase/analytics';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBgVjeQ_3HoeMDWRW81W5WFpgX5oG69rUM",
  authDomain: "dommma-6ee32.firebaseapp.com",
  projectId: "dommma-6ee32",
  storageBucket: "dommma-6ee32.firebasestorage.app",
  messagingSenderId: "858858950233",
  appId: "1:858858950233:web:9fcf3cff311d136e836b48",
  measurementId: "G-DGJPK7M8R7"
};

// Initialize Firebase (singleton pattern)
let app;
let analytics;
let messaging;

export const initializeFirebase = () => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Analytics (only in browser)
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
  }
  return app;
};

// Get Firebase app instance
export const getFirebaseApp = () => {
  if (!app) {
    initializeFirebase();
  }
  return app;
};

// Get Analytics instance
export const getFirebaseAnalytics = () => {
  if (!analytics && typeof window !== 'undefined') {
    const app = getFirebaseApp();
    analytics = getAnalytics(app);
  }
  return analytics;
};

// Initialize messaging (must check browser support)
export const getFirebaseMessaging = async () => {
  if (typeof window === 'undefined') return null;
  
  const supported = await isSupported();
  if (!supported) {
    console.log('Firebase Messaging is not supported in this browser');
    return null;
  }
  
  if (!messaging) {
    const app = getFirebaseApp();
    messaging = getMessaging(app);
  }
  return messaging;
};

// ============== ANALYTICS FUNCTIONS ==============

// Track page views
export const trackPageView = (pageName, pageTitle) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_path: pageName,
      page_title: pageTitle
    });
  }
};

// Track user login
export const trackLogin = (method, userType) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'login', {
      method: method,
      user_type: userType
    });
    setUserProperties(analytics, {
      user_type: userType
    });
  }
};

// Track sign up
export const trackSignUp = (method, userType) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'sign_up', {
      method: method,
      user_type: userType
    });
  }
};

// Track property view
export const trackPropertyView = (propertyId, propertyTitle, price) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'view_item', {
      item_id: propertyId,
      item_name: propertyTitle,
      price: price,
      currency: 'CAD'
    });
  }
};

// Track property search
export const trackPropertySearch = (searchTerm, filters, resultsCount) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'search', {
      search_term: searchTerm,
      filters: JSON.stringify(filters),
      results_count: resultsCount
    });
  }
};

// Track payment initiated
export const trackPaymentInitiated = (amount, description) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'begin_checkout', {
      value: amount,
      currency: 'CAD',
      items: [{ item_name: description }]
    });
  }
};

// Track payment completed
export const trackPaymentCompleted = (amount, transactionId) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'purchase', {
      transaction_id: transactionId,
      value: amount,
      currency: 'CAD'
    });
  }
};

// Track document upload
export const trackDocumentUpload = (docType) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'document_upload', {
      document_type: docType
    });
  }
};

// Track document signed
export const trackDocumentSigned = (docType) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'document_signed', {
      document_type: docType
    });
  }
};

// Track message sent
export const trackMessageSent = () => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'message_sent');
  }
};

// Track Nova AI chat interaction
export const trackNovaChatInteraction = (queryType) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'nova_chat_interaction', {
      query_type: queryType
    });
  }
};

// Track feature engagement
export const trackFeatureEngagement = (featureName) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, 'feature_engagement', {
      feature_name: featureName
    });
  }
};

// ============== PUSH NOTIFICATION FUNCTIONS ==============

// VAPID key for web push (you'll need to generate this from Firebase Console)
// Firebase Console > Project Settings > Cloud Messaging > Web configuration > Generate key pair
const VAPID_KEY = 'YOUR_VAPID_KEY'; // Will be replaced when user provides it

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return null;
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  return new Promise(async (resolve) => {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      resolve(null);
      return;
    }
    
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
      resolve(payload);
    });
  });
};

// Show notification (for foreground messages)
export const showNotification = (title, body, icon = '/logo192.png') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      badge: '/logo192.png',
      tag: 'dommma-notification'
    });
  }
};

export default {
  initializeFirebase,
  getFirebaseApp,
  getFirebaseAnalytics,
  getFirebaseMessaging,
  trackPageView,
  trackLogin,
  trackSignUp,
  trackPropertyView,
  trackPropertySearch,
  trackPaymentInitiated,
  trackPaymentCompleted,
  trackDocumentUpload,
  trackDocumentSigned,
  trackMessageSent,
  trackNovaChatInteraction,
  trackFeatureEngagement,
  requestNotificationPermission,
  onForegroundMessage,
  showNotification
};
