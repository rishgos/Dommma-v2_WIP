import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Settings, User, Bell, Shield, Globe, Moon, Sun,
  Mail, Phone, Lock, Eye, EyeOff, Save, Check,
  CreditCard, Trash2, LogOut, ChevronRight, Plus, Star, Loader2, CheckCircle, X, Home, Download, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

import { subscribeToPush, unsubscribeFromPush, isPushSupported } from '../lib/pushNotifications';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cardAddedMessage, setCardAddedMessage] = useState(false);
  
  // Profile settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'en'
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email_new_listings: true,
    email_messages: true,
    email_applications: true,
    push_enabled: true,
    sms_enabled: false
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profile_visible: true,
    show_phone: false,
    allow_messages: true
  });
  
  // Password change
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new_password: '',
    confirm: ''
  });
  
  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load user profile
    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      language: user.language || 'en'
    });
    
    // Load saved preferences
    loadPreferences();
    loadPaymentMethods();
    
    // Check for card added success
    if (searchParams.get('card_added') === 'true') {
      setActiveTab('payments');
      setCardAddedMessage(true);
      // Clear the URL params
      window.history.replaceState({}, '', '/settings');
    }
  }, [user, navigate, searchParams]);

  const loadPaymentMethods = async () => {
    if (!user) return;
    setLoadingPayments(true);
    try {
      const res = await axios.get(`${API}/api/stripe/payment-methods/${user.id}`);
      setPaymentMethods(res.data.payment_methods || []);
      setDefaultPaymentMethod(res.data.default_payment_method);
    } catch (error) {
      console.log('No payment methods found');
    }
    setLoadingPayments(false);
  };

  const loadPreferences = async () => {
    try {
      const res = await axios.get(`${API}/api/users/${user.id}/preferences`);
      if (res.data) {
        if (res.data.notifications) setNotifications(res.data.notifications);
        if (res.data.privacy) setPrivacy(res.data.privacy);
      }
    } catch (error) {
      console.log('No saved preferences found');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/users/${user.id}`, {
        name: profile.name,
        phone: profile.phone,
        language: profile.language
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Failed to save profile');
    }
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Handle Web Push subscription toggle
      if (notifications.push_enabled && isPushSupported()) {
        await subscribeToPush(user.id);
      } else if (!notifications.push_enabled) {
        await unsubscribeFromPush(user.id);
      }
      await axios.put(`${API}/api/users/${user.id}/preferences`, {
        notifications
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Failed to save notification preferences');
    }
    setSaving(false);
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/users/${user.id}/preferences`, {
        privacy
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Failed to save privacy settings');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm) {
      alert('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    try {
      await axios.post(`${API}/api/auth/change-password`, {
        user_id: user.id,
        current_password: passwordForm.current,
        new_password: passwordForm.new_password
      });
      alert('Password changed successfully');
      setPasswordForm({ current: '', new_password: '', confirm: '' });
    } catch (error) {
      alert('Failed to change password: ' + (error.response?.data?.detail || 'Invalid current password'));
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;
    
    const doubleConfirm = window.prompt('Type "DELETE" to confirm account deletion:');
    if (doubleConfirm !== 'DELETE') return;
    
    try {
      await axios.delete(`${API}/api/users/${user.id}`);
      logout();
      navigate('/');
    } catch (error) {
      alert('Failed to delete account');
    }
  };

  const handleSetDefaultPayment = async (paymentMethodId) => {
    try {
      await axios.post(`${API}/api/stripe/payment-methods/${user.id}/default?payment_method_id=${paymentMethodId}`);
      setDefaultPaymentMethod(paymentMethodId);
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        is_default: pm.id === paymentMethodId
      })));
    } catch (error) {
      alert('Failed to set default payment method');
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    if (!window.confirm('Remove this payment method?')) return;
    try {
      await axios.delete(`${API}/api/stripe/payment-methods/${paymentMethodId}`);
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
      if (defaultPaymentMethod === paymentMethodId) {
        setDefaultPaymentMethod(null);
      }
    } catch (error) {
      alert('Failed to remove payment method');
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    setAddingCard(true);
    
    try {
      // First create/get stripe customer
      const customerRes = await axios.post(`${API}/api/stripe/customer?user_id=${user.id}`);
      const customerId = customerRes.data.customer_id;
      
      // Get setup intent
      const setupRes = await axios.post(`${API}/api/stripe/setup-intent?user_id=${user.id}`);
      
      // Create a Stripe checkout session for setup mode
      const checkoutRes = await axios.post(`${API}/api/stripe/checkout-setup?user_id=${user.id}`);
      
      if (checkoutRes.data.checkout_url) {
        // Redirect to Stripe's hosted checkout for adding card
        window.location.href = checkoutRes.data.checkout_url;
      } else {
        // Fallback - refresh and show message
        alert('Card setup initiated. Your card will appear shortly.');
        await loadPaymentMethods();
      }
    } catch (error) {
      alert('Failed to set up card addition: ' + (error.response?.data?.detail || error.message));
    }
    setAddingCard(false);
  };

  const getCardBrandIcon = (brand) => {
    const brandColors = {
      visa: '#1A1F71',
      mastercard: '#EB001B',
      amex: '#006FCF',
      discover: '#FF6000'
    };
    return brandColors[brand?.toLowerCase()] || '#1A2F3A';
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            <Settings className="text-[#1A2F3A]" />
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#1A2F3A] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    data-testid={`settings-tab-${tab.id}`}
                  >
                    <tab.icon size={18} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-xl font-semibold text-[#1A2F3A]">Profile Information</h2>
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                      data-testid="settings-name-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 (604) 555-0123"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                      data-testid="settings-phone-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={profile.language}
                      onChange={e => setProfile({ ...profile, language: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] outline-none"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50"
                  data-testid="save-profile-btn"
                >
                  {saved ? <Check size={18} /> : <Save size={18} />}
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-[#1A2F3A]">Payment Methods</h2>
                    <button
                      onClick={handleAddCard}
                      disabled={addingCard}
                      className="px-4 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                      data-testid="add-card-btn"
                    >
                      {addingCard ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      Add Card
                    </button>
                  </div>
                  
                  {/* Card Added Success Message */}
                  {cardAddedMessage && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={20} />
                      <div className="flex-1">
                        <p className="font-medium text-green-800">Card Added Successfully!</p>
                        <p className="text-sm text-green-600">Your payment method has been saved.</p>
                      </div>
                      <button onClick={() => setCardAddedMessage(false)} className="p-1 hover:bg-green-100 rounded">
                        <X size={16} className="text-green-600" />
                      </button>
                    </div>
                  )}
                  
                  {loadingPayments ? (
                    <div className="text-center py-8">
                      <Loader2 className="animate-spin mx-auto text-gray-400" size={32} />
                      <p className="text-gray-500 mt-2">Loading payment methods...</p>
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
                      <p className="text-gray-500 mb-2">No payment methods saved</p>
                      <p className="text-sm text-gray-400">Add a card to make payments easier</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div 
                          key={method.id}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                            method.is_default 
                              ? 'border-[#1A2F3A] bg-[#1A2F3A]/5' 
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                          data-testid={`payment-method-${method.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-12 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
                              style={{ backgroundColor: getCardBrandIcon(method.brand) }}
                            >
                              {method.brand?.toUpperCase().slice(0, 4)}
                            </div>
                            <div>
                              <p className="font-medium text-[#1A2F3A] flex items-center gap-2">
                                •••• •••• •••• {method.last4}
                                {method.is_default && (
                                  <span className="text-xs bg-[#1A2F3A] text-white px-2 py-0.5 rounded-full">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                Expires {method.exp_month}/{method.exp_year}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!method.is_default && (
                              <button
                                onClick={() => handleSetDefaultPayment(method.id)}
                                className="px-3 py-1.5 text-sm text-[#1A2F3A] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                                title="Set as default"
                              >
                                <Star size={14} />
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePaymentMethod(method.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove card"
                              data-testid={`delete-card-${method.id}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Payment Info */}
                <div className="bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-6 text-white">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield size={18} />
                    Secure Payments
                  </h3>
                  <p className="text-sm text-white/80 mb-4">
                    Your payment information is securely stored with Stripe. We never see or store your full card details.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span>256-bit encryption</span>
                    <span>•</span>
                    <span>PCI-DSS compliant</span>
                    <span>•</span>
                    <span>Powered by Stripe</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab - Enhanced like Wise */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-[#1A2F3A] mb-2">Notification Preferences</h2>
                  <p className="text-gray-500 text-sm">Control how and when you receive updates from DOMMMA</p>
                </div>

                {/* Account Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="notifications-account">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Shield size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A2F3A]">Account & Security</h3>
                      <p className="text-xs text-gray-500">Important alerts about your account</p>
                    </div>
                  </div>
                  <div className="space-y-3 pl-13">
                    {[
                      { key: 'security_login', label: 'New login from unknown device', desc: 'Get alerted when someone signs in to your account', locked: true },
                      { key: 'security_password', label: 'Password changes', desc: 'Notification when your password is changed', locked: true },
                      { key: 'payment_receipts', label: 'Payment receipts', desc: 'Receive receipts for all payments you make' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                        {item.locked ? (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Lock size={14} />
                            <span className="text-xs">Always on</span>
                          </div>
                        ) : (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications[item.key] !== false}
                              onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A2F3A]"></div>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messages & Communication */}
                <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="notifications-messages">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Mail size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A2F3A]">Messages & Communication</h3>
                      <p className="text-xs text-gray-500">Stay connected with landlords, renters, and contractors</p>
                    </div>
                  </div>
                  <div className="space-y-3 pl-13">
                    {[
                      { key: 'email_messages', label: 'Direct messages', desc: 'Email when someone sends you a message' },
                      { key: 'push_messages', label: 'Push notifications for messages', desc: 'Get instant alerts on your device' },
                      { key: 'email_applications', label: 'Application updates', desc: 'Status changes on your rental applications' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key] !== false}
                            onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A2F3A]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Property & Listings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="notifications-property">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Home size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A2F3A]">Property & Listings</h3>
                      <p className="text-xs text-gray-500">Updates about properties you're interested in</p>
                    </div>
                  </div>
                  <div className="space-y-3 pl-13">
                    {[
                      { key: 'email_new_listings', label: 'New listing alerts', desc: 'Properties matching your saved searches' },
                      { key: 'price_drops', label: 'Price drop alerts', desc: 'When saved properties reduce their price' },
                      { key: 'viewing_reminders', label: 'Viewing reminders', desc: 'Reminders before scheduled property viewings' },
                      { key: 'availability_updates', label: 'Availability updates', desc: 'When saved properties become available' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key] !== false}
                            onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A2F3A]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payments & Billing */}
                <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="notifications-payments">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <CreditCard size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A2F3A]">Payments & Billing</h3>
                      <p className="text-xs text-gray-500">Payment reminders and transaction updates</p>
                    </div>
                  </div>
                  <div className="space-y-3 pl-13">
                    {[
                      { key: 'rent_reminders', label: 'Rent due reminders', desc: 'Get reminded before your rent is due' },
                      { key: 'late_payment_alerts', label: 'Late payment alerts', desc: 'Notifications when payments are overdue' },
                      { key: 'invoice_generated', label: 'Invoice generated', desc: 'When new invoices are created for you' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key] !== false}
                            onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A2F3A]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Methods */}
                <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="notifications-delivery">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#1A2F3A]/10 rounded-xl flex items-center justify-center">
                      <Bell size={20} className="text-[#1A2F3A]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A2F3A]">Delivery Methods</h3>
                      <p className="text-xs text-gray-500">Choose how you want to receive notifications</p>
                    </div>
                  </div>
                  <div className="space-y-3 pl-13">
                    {[
                      { key: 'push_enabled', label: 'Push notifications', desc: 'Get instant alerts on your browser or mobile device' },
                      { key: 'sms_enabled', label: 'SMS notifications', desc: 'Receive important updates via text message' },
                      { key: 'email_digest', label: 'Weekly email digest', desc: 'Get a summary of activity every week' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key]}
                            onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A2F3A]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="px-6 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
                    data-testid="save-notifications-btn"
                  >
                    {saved ? <Check size={18} /> : <Save size={18} />}
                    {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-xl font-semibold text-[#1A2F3A]">Privacy Settings</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div>
                      <p className="font-medium text-gray-700">Profile Visibility</p>
                      <p className="text-sm text-gray-500">Allow others to view your profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.profile_visible}
                      onChange={e => setPrivacy({ ...privacy, profile_visible: e.target.checked })}
                      className="w-5 h-5 text-[#1A2F3A] rounded border-gray-300 focus:ring-[#1A2F3A]"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div>
                      <p className="font-medium text-gray-700">Show Phone Number</p>
                      <p className="text-sm text-gray-500">Display phone on your listings/profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.show_phone}
                      onChange={e => setPrivacy({ ...privacy, show_phone: e.target.checked })}
                      className="w-5 h-5 text-[#1A2F3A] rounded border-gray-300 focus:ring-[#1A2F3A]"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div>
                      <p className="font-medium text-gray-700">Allow Messages</p>
                      <p className="text-sm text-gray-500">Let other users send you messages</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.allow_messages}
                      onChange={e => setPrivacy({ ...privacy, allow_messages: e.target.checked })}
                      className="w-5 h-5 text-[#1A2F3A] rounded border-gray-300 focus:ring-[#1A2F3A]"
                    />
                  </label>
                </div>
                
                <button
                  onClick={handleSavePrivacy}
                  disabled={saving}
                  className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saved ? <Check size={18} /> : <Save size={18} />}
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold text-[#1A2F3A]">Change Password</h2>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.current}
                          onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.confirm}
                        onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] outline-none"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleChangePassword}
                    disabled={saving || !passwordForm.current || !passwordForm.new_password}
                    className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Lock size={18} />
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
                
                {/* Data Export */}
                <div className="bg-white dark:bg-[#1A2332] rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-[#1A2F3A] dark:text-white mb-2 flex items-center gap-2">
                    <Download size={20} /> Download My Data
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Download a copy of all your personal data stored on DOMMMA, including your profile, listings, applications, messages, payments, and more. This is your right under Canadian privacy law (PIPEDA).
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        setSaving(true);
                        const res = await axios.get(`${API}/api/users/${user.id}/export`);
                        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `dommma-data-export-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setSaving(false);
                        alert('Your data has been downloaded successfully.');
                      } catch (error) {
                        setSaving(false);
                        alert('Failed to download data. Please try again.');
                      }
                    }}
                    disabled={saving}
                    className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50"
                    data-testid="download-data-btn"
                  >
                    <Download size={18} />
                    {saving ? 'Preparing Download...' : 'Download All My Data'}
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                  <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} /> Danger Zone
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Permanently delete your account and all associated data. This removes your profile, listings, applications, messages, payments, favorites, and all other data from DOMMMA. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    data-testid="delete-account-btn"
                  >
                    <Trash2 size={18} />
                    Delete My Account
                  </button>
                  <p className="text-xs text-red-400 dark:text-red-500 mt-3">
                    You will be asked to confirm twice. All data will be permanently removed in compliance with PIPEDA.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
