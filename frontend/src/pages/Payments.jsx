import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, CreditCard, Check, Clock, AlertCircle, ArrowLeft,
  Building2, Plus, Download, RefreshCw, ChevronRight
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Payments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: '',
    property_id: '',
    recipient_id: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPaymentHistory();
    
    // Check for payment callback
    const status = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    if (status && sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [user, navigate, searchParams]);

  const fetchPaymentHistory = async () => {
    try {
      const response = await axios.get(`${API}/payments/history`, {
        params: { user_id: user?.id }
      });
      setPaymentHistory(response.data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const checkPaymentStatus = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      setPaymentStatus(response.data);
      fetchPaymentHistory();
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/payments/create-checkout`, {
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description,
        property_id: paymentForm.property_id || null,
        recipient_id: paymentForm.recipient_id || null
      });
      
      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-700', icon: Check, label: 'Paid' },
      complete: { color: 'bg-green-100 text-green-700', icon: Check, label: 'Complete' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
      initiated: { color: 'bg-blue-100 text-blue-700', icon: RefreshCw, label: 'Processing' },
      failed: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Failed' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const quickPaymentOptions = [
    { amount: 1500, label: 'Monthly Rent', icon: Building2 },
    { amount: 500, label: 'Security Deposit', icon: DollarSign },
    { amount: 200, label: 'Utilities', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#1A2F3A] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-white/70 hover:text-white">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Payments</h1>
              <p className="text-sm text-white/70">Manage your payments and transactions</p>
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
            data-testid="new-payment-btn"
          >
            <Plus size={16} />
            New Payment
          </button>
        </div>
      </header>

      {/* Payment Status Alert */}
      {paymentStatus && (
        <div className="max-w-6xl mx-auto px-6 mt-6">
          <div className={`p-4 rounded-2xl ${paymentStatus.payment_status === 'paid' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center gap-3">
              {paymentStatus.payment_status === 'paid' ? (
                <Check className="text-green-600" size={24} />
              ) : (
                <Clock className="text-yellow-600" size={24} />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {paymentStatus.payment_status === 'paid' 
                    ? 'Payment Successful!' 
                    : 'Payment Processing'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  ${paymentStatus.amount?.toLocaleString()} {paymentStatus.currency?.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#1A2F3A] mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Quick Payment
              </h2>
              <div className="space-y-3">
                {quickPaymentOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      setPaymentForm({
                        ...paymentForm,
                        amount: option.amount.toString(),
                        description: option.label
                      });
                      setShowPaymentModal(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#1A2F3A]/20 hover:bg-[#F5F5F0] transition-all"
                    data-testid={`quick-pay-${option.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
                      <option.icon size={20} className="text-[#1A2F3A]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-[#1A2F3A]">{option.label}</p>
                      <p className="text-sm text-gray-500">${option.amount.toLocaleString()} CAD</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">This Month</span>
                  <span className="text-xl font-semibold">
                    ${paymentHistory
                      .filter(p => p.payment_status === 'paid')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Pending</span>
                  <span>
                    ${paymentHistory
                      .filter(p => p.payment_status === 'pending')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total Transactions</span>
                  <span>{paymentHistory.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Transaction History
                </h2>
                <button 
                  onClick={fetchPaymentHistory}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  data-testid="refresh-history-btn"
                >
                  <RefreshCw size={18} className="text-gray-500" />
                </button>
              </div>

              {paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto mb-4 text-gray-300" size={48} />
                  <p className="text-gray-500">No transactions yet</p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="mt-4 text-[#1A2F3A] font-medium hover:underline"
                  >
                    Make your first payment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div 
                      key={payment.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#F5F5F0] hover:bg-gray-100 transition-colors"
                      data-testid={`payment-item-${payment.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                          <CreditCard size={24} className="text-[#1A2F3A]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A2F3A]">{payment.description || 'Payment'}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#1A2F3A]">
                          ${payment.amount?.toLocaleString()} {payment.currency?.toUpperCase()}
                        </p>
                        {getStatusBadge(payment.payment_status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="payment-modal">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-8">
            <h2 
              className="text-2xl font-semibold text-[#1A2F3A] mb-6"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Make a Payment
            </h2>
            
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Amount (CAD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none"
                    placeholder="0.00"
                    required
                    min="1"
                    step="0.01"
                    data-testid="payment-amount-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Description</label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none"
                  placeholder="Monthly rent, deposit, etc."
                  required
                  data-testid="payment-description-input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="submit-payment-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Pay Now
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
