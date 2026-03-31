import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, DollarSign, Calendar, Clock, CreditCard, 
  CheckCircle2, XCircle, AlertCircle, Send, ArrowLeft,
  Home, User, Mail, Phone, Edit2, Loader2, Shield,
  MessageSquare, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Initialize Stripe (use publishable key from env or fallback)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// Payment Method Form Component
const PaymentMethodForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          name: user?.name,
          email: user?.email
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Save to backend
      await axios.post(`${API}/rent/save-payment-method?tenant_id=${user.id}`, {
        payment_method_id: paymentMethod.id
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1A2F3A',
                '::placeholder': { color: '#9CA3AF' }
              }
            }
          }}
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
          Save Card
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
        <Shield size={12} />
        Secured by Stripe. We never store your card details.
      </p>
    </form>
  );
};

// Agreement Card Component
const AgreementCard = ({ agreement, role, onAccept, onDecline, onCounter, onPay }) => {
  const [expanded, setExpanded] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [counterTerms, setCounterTerms] = useState({
    due_day: agreement.due_day,
    grace_period_days: agreement.grace_period_days,
    late_fee_type: agreement.late_fee_type,
    late_fee_amount: agreement.late_fee_amount
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800'
  };

  const lateFeeDisplay = agreement.late_fee_type === 'flat' 
    ? `$${agreement.late_fee_amount}` 
    : `${agreement.late_fee_amount}%`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
              <Home size={24} className="text-[#1A2F3A]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A2F3A]">{agreement.listing?.title || 'Property'}</h3>
              <p className="text-sm text-gray-500">{agreement.listing?.address}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[agreement.status]}`}>
                  {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
                </span>
                {role === 'tenant' && agreement.landlord && (
                  <span className="text-xs text-gray-500">Landlord: {agreement.landlord.name}</span>
                )}
                {role === 'landlord' && agreement.tenant && (
                  <span className="text-xs text-gray-500">Tenant: {agreement.tenant.name}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="p-2 hover:bg-gray-100 rounded-lg">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Key Terms */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <DollarSign size={20} className="mx-auto text-green-600 mb-1" />
          <p className="text-lg font-semibold">${agreement.monthly_rent?.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Monthly Rent</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <Calendar size={20} className="mx-auto text-blue-600 mb-1" />
          <p className="text-lg font-semibold">{agreement.due_day}{['st','nd','rd'][((agreement.due_day+90)%100-10)%10-1]||'th'}</p>
          <p className="text-xs text-gray-500">Due Date</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <Clock size={20} className="mx-auto text-orange-600 mb-1" />
          <p className="text-lg font-semibold">{agreement.grace_period_days} days</p>
          <p className="text-xs text-gray-500">Grace Period</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <AlertCircle size={20} className="mx-auto text-red-600 mb-1" />
          <p className="text-lg font-semibold">{lateFeeDisplay}</p>
          <p className="text-xs text-gray-500">Late Fee</p>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-[#1A2F3A] mb-3">Agreement Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Start Date:</span> {new Date(agreement.start_date).toLocaleDateString()}</p>
                {agreement.end_date && <p><span className="text-gray-500">End Date:</span> {new Date(agreement.end_date).toLocaleDateString()}</p>}
                {agreement.etransfer_email && <p><span className="text-gray-500">E-Transfer:</span> {agreement.etransfer_email}</p>}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-[#1A2F3A] mb-3">Payment Information</h4>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600">
                  Rent of <strong>${agreement.monthly_rent?.toLocaleString()}</strong> is due on the <strong>{agreement.due_day}{['st','nd','rd'][((agreement.due_day+90)%100-10)%10-1]||'th'}</strong> of each month.
                  A late fee of <strong>{lateFeeDisplay}</strong> will apply after <strong>{agreement.grace_period_days} days</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Counter Proposal Form */}
          {showCounter && role === 'tenant' && agreement.status === 'pending' && (
            <div className="mt-6 p-4 bg-white rounded-xl border border-blue-200">
              <h4 className="font-medium text-[#1A2F3A] mb-4">Propose Counter Terms</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Due Day</label>
                  <select
                    value={counterTerms.due_day}
                    onChange={(e) => setCounterTerms({...counterTerms, due_day: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {[1,5,10,15,20,25].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Grace Period</label>
                  <select
                    value={counterTerms.grace_period_days}
                    onChange={(e) => setCounterTerms({...counterTerms, grace_period_days: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {[3,5,7,10].map(d => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Late Fee Type</label>
                  <select
                    value={counterTerms.late_fee_type}
                    onChange={(e) => setCounterTerms({...counterTerms, late_fee_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="flat">Flat Fee</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Amount</label>
                  <input
                    type="number"
                    value={counterTerms.late_fee_amount}
                    onChange={(e) => setCounterTerms({...counterTerms, late_fee_amount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowCounter(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                <button onClick={() => onCounter(agreement.id, counterTerms)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Submit Counter</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {agreement.status === 'pending' && role === 'tenant' && (
        <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center gap-3 mb-4">
            <Info size={16} className="text-blue-600" />
            <p className="text-sm text-gray-600">Review the terms carefully before accepting.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onAccept(agreement.id)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
            >
              <CheckCircle2 size={18} />
              Accept Terms
            </button>
            <button
              onClick={() => setShowCounter(!showCounter)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              <MessageSquare size={18} />
              Counter Propose
            </button>
            <button
              onClick={() => onDecline(agreement.id)}
              className="flex items-center gap-2 px-6 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50"
            >
              <XCircle size={18} />
              Decline
            </button>
          </div>
        </div>
      )}

      {agreement.status === 'active' && role === 'tenant' && (
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={() => onPay(agreement.id)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52]"
          >
            <CreditCard size={18} />
            Pay Rent - ${agreement.monthly_rent?.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function RentAgreements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('tenant');
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAgreements();
      checkPaymentMethod();
    }
  }, [user, role]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/rent/agreements?user_id=${user.id}&role=${role}`);
      setAgreements(response.data);
    } catch (error) {
      console.error('Error fetching agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentMethod = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}`);
      setHasPaymentMethod(!!response.data?.default_payment_method_id);
    } catch (error) {
      console.error('Error checking payment method:', error);
    }
  };

  const handleAccept = async (agreementId) => {
    setActionLoading(agreementId);
    try {
      await axios.post(`${API}/rent/agreements/${agreementId}/accept?tenant_id=${user.id}`);
      fetchAgreements();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to accept agreement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (agreementId) => {
    if (!window.confirm('Are you sure you want to decline this agreement?')) return;
    setActionLoading(agreementId);
    try {
      await axios.post(`${API}/rent/agreements/${agreementId}/decline?tenant_id=${user.id}`);
      fetchAgreements();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to decline agreement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounter = async (agreementId, terms) => {
    setActionLoading(agreementId);
    try {
      await axios.post(`${API}/rent/agreements/${agreementId}/counter?tenant_id=${user.id}`, terms);
      fetchAgreements();
      alert('Counter proposal submitted. The landlord will be notified.');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to submit counter proposal');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePay = async (agreementId) => {
    if (!hasPaymentMethod) {
      setShowPaymentSetup(true);
      return;
    }
    setActionLoading(agreementId);
    try {
      const response = await axios.post(`${API}/rent/payments/${agreementId}/pay?tenant_id=${user.id}`);
      alert(response.data.message);
      fetchAgreements();
    } catch (error) {
      alert(error.response?.data?.detail || 'Payment failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Rent Payments</p>
              <h1 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Rent Agreements
              </h1>
              <p className="text-white/70 mt-2">Manage your rent payments and agreements</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full p-1">
              <button
                onClick={() => setRole('tenant')}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${role === 'tenant' ? 'bg-white text-[#1A2F3A]' : 'text-white/70 hover:text-white'}`}
              >
                As Tenant
              </button>
              <button
                onClick={() => setRole('landlord')}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${role === 'landlord' ? 'bg-white text-[#1A2F3A]' : 'text-white/70 hover:text-white'}`}
              >
                As Landlord
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Payment Method Banner for Tenants */}
        {role === 'tenant' && !hasPaymentMethod && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard size={24} className="text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Set up automatic payments</p>
                <p className="text-sm text-yellow-600">Add a payment method to enable automatic rent collection</p>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentSetup(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Add Card
            </button>
          </div>
        )}

        {/* Payment Setup Modal */}
        {showPaymentSetup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-[#1A2F3A] mb-4">Add Payment Method</h3>
              <Elements stripe={stripePromise}>
                <PaymentMethodForm
                  onSuccess={() => {
                    setShowPaymentSetup(false);
                    setHasPaymentMethod(true);
                  }}
                  onCancel={() => setShowPaymentSetup(false)}
                />
              </Elements>
            </div>
          </div>
        )}

        {/* Agreements List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#1A2F3A]" />
          </div>
        ) : agreements.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400">No Agreements Yet</h3>
            <p className="text-gray-400 mt-2">
              {role === 'tenant' 
                ? "You don't have any rent agreements yet." 
                : "You haven't created any rent agreements yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {agreements.map(agreement => (
              <AgreementCard
                key={agreement.id}
                agreement={agreement}
                role={role}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCounter={handleCounter}
                onPay={handlePay}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
