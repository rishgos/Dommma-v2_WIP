import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, DollarSign, Calendar, Clock, CreditCard, 
  CheckCircle2, XCircle, AlertCircle, Send, ArrowLeft,
  Home, User, Loader2, Shield, Plus,
  MessageSquare, Info, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

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
        billing_details: { name: user?.name, email: user?.email }
      });
      if (stripeError) { setError(stripeError.message); setLoading(false); return; }
      await axios.post(`${API}/rent/save-payment-method?tenant_id=${user.id}`, {
        payment_method_id: paymentMethod.id
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save payment method');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="payment-method-form">
      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#1A2F3A', '::placeholder': { color: '#9CA3AF' } } } }} />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} />{error}
        </div>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50" data-testid="cancel-payment-btn">Cancel</button>
        <button type="submit" disabled={!stripe || loading} className="flex-1 px-4 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2" data-testid="save-card-btn">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
          Save Card
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
        <Shield size={12} />Secured by Stripe. We never store your card details.
      </p>
    </form>
  );
};

const CreateAgreementModal = ({ onClose, onCreated, userId }) => {
  const [listings, setListings] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [tenantSearch, setTenantSearch] = useState('');
  const [form, setForm] = useState({
    listing_id: '', tenant_id: '', monthly_rent: '', due_day: 1,
    grace_period_days: 3, late_fee_type: 'flat', late_fee_amount: 50,
    etransfer_email: '', start_date: '', end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await axios.get(`${API}/listings?landlord_id=${userId}`);
        setListings(res.data);
      } catch (e) { console.error(e); }
    };
    fetchListings();
  }, [userId]);

  useEffect(() => {
    if (tenantSearch.length < 2) { setTenants([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/users/search?q=${tenantSearch}&type=renter`);
        setTenants(res.data || []);
      } catch (e) { setTenants([]); }
    }, 400);
    return () => clearTimeout(timer);
  }, [tenantSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.listing_id || !form.tenant_id || !form.monthly_rent || !form.start_date) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/rent/agreements?landlord_id=${userId}`, {
        ...form,
        monthly_rent: parseFloat(form.monthly_rent),
        due_day: parseInt(form.due_day),
        grace_period_days: parseInt(form.grace_period_days),
        late_fee_amount: parseFloat(form.late_fee_amount),
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create agreement');
    } finally { setLoading(false); }
  };

  const selectedListing = listings.find(l => l.id === form.listing_id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="create-agreement-modal">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <h3 className="text-xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Create Rent Agreement
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" data-testid="close-create-modal"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Property *</label>
            <select value={form.listing_id} onChange={(e) => {
              const l = listings.find(li => li.id === e.target.value);
              setForm({...form, listing_id: e.target.value, monthly_rent: l?.price || form.monthly_rent});
            }} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]" data-testid="select-property" required>
              <option value="">Select a property...</option>
              {listings.map(l => <option key={l.id} value={l.id}>{l.title} - {l.address}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tenant *</label>
            <input type="text" placeholder="Search tenant by name or email..." value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
              data-testid="search-tenant" />
            {tenants.length > 0 && (
              <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto">
                {tenants.map(t => (
                  <button key={t.id} type="button" onClick={() => { setForm({...form, tenant_id: t.id}); setTenantSearch(t.name + ' (' + t.email + ')'); setTenants([]); }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm" data-testid={`tenant-option-${t.id}`}>
                    <span className="font-medium">{t.name}</span> <span className="text-gray-500">({t.email})</span>
                  </button>
                ))}
              </div>
            )}
            {form.tenant_id && <p className="text-xs text-green-600 mt-1">Tenant selected</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Rent ($) *</label>
              <input type="number" value={form.monthly_rent} onChange={(e) => setForm({...form, monthly_rent: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200" placeholder="2000" data-testid="monthly-rent-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Day of Month *</label>
              <select value={form.due_day} onChange={(e) => setForm({...form, due_day: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200" data-testid="due-day-select">
                {[1,5,10,15,20,25].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200" data-testid="start-date-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200" data-testid="end-date-input" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h4 className="font-medium text-[#1A2F3A]">Late Fee Settings</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Grace Period</label>
                <select value={form.grace_period_days} onChange={(e) => setForm({...form, grace_period_days: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" data-testid="grace-period-select">
                  {[3,5,7,10].map(d => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fee Type</label>
                <select value={form.late_fee_type} onChange={(e) => setForm({...form, late_fee_type: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" data-testid="late-fee-type-select">
                  <option value="flat">Flat Fee ($)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <input type="number" value={form.late_fee_amount} onChange={(e) => setForm({...form, late_fee_amount: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" data-testid="late-fee-amount-input" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Transfer Email (optional)</label>
            <input type="email" value={form.etransfer_email} onChange={(e) => setForm({...form, etransfer_email: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200" placeholder="your@email.com" data-testid="etransfer-email-input" />
          </div>

          {selectedListing && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <Info size={14} className="inline mr-1" />
                Agreement for <strong>{selectedListing.title}</strong> at ${parseFloat(form.monthly_rent || 0).toLocaleString()}/month.
                Late fee: {form.late_fee_type === 'flat' ? `$${form.late_fee_amount}` : `${form.late_fee_amount}%`} after {form.grace_period_days} days grace period.
              </p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full px-6 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            data-testid="create-agreement-submit">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Create & Send to Tenant
          </button>
        </form>
      </div>
    </div>
  );
};

const AgreementCard = ({ agreement, role, onAccept, onDecline, onCounter, onPay }) => {
  const [expanded, setExpanded] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [counterTerms, setCounterTerms] = useState({
    due_day: agreement.due_day, grace_period_days: agreement.grace_period_days,
    late_fee_type: agreement.late_fee_type, late_fee_amount: agreement.late_fee_amount
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800'
  };

  const lateFeeDisplay = agreement.late_fee_type === 'flat' 
    ? `$${agreement.late_fee_amount}` : `${agreement.late_fee_amount}%`;

  const ordSuffix = (n) => ['st','nd','rd'][((n+90)%100-10)%10-1] || 'th';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" data-testid={`agreement-card-${agreement.id}`}>
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[agreement.status]}`} data-testid="agreement-status">
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
          <button onClick={() => setExpanded(!expanded)} className="p-2 hover:bg-gray-100 rounded-lg" data-testid="toggle-expand">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <DollarSign size={20} className="mx-auto text-green-600 mb-1" />
          <p className="text-lg font-semibold" data-testid="agreement-rent">${agreement.monthly_rent?.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Monthly Rent</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <Calendar size={20} className="mx-auto text-blue-600 mb-1" />
          <p className="text-lg font-semibold">{agreement.due_day}{ordSuffix(agreement.due_day)}</p>
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
                  Rent of <strong>${agreement.monthly_rent?.toLocaleString()}</strong> is due on the <strong>{agreement.due_day}{ordSuffix(agreement.due_day)}</strong> of each month.
                  A late fee of <strong>{lateFeeDisplay}</strong> will apply after <strong>{agreement.grace_period_days} days</strong>.
                </p>
              </div>
            </div>
          </div>

          {showCounter && role === 'tenant' && agreement.status === 'pending' && (
            <div className="mt-6 p-4 bg-white rounded-xl border border-blue-200" data-testid="counter-form">
              <h4 className="font-medium text-[#1A2F3A] mb-4">Propose Counter Terms</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Due Day</label>
                  <select value={counterTerms.due_day} onChange={(e) => setCounterTerms({...counterTerms, due_day: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {[1,5,10,15,20,25].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Grace Period</label>
                  <select value={counterTerms.grace_period_days} onChange={(e) => setCounterTerms({...counterTerms, grace_period_days: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {[3,5,7,10].map(d => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Late Fee Type</label>
                  <select value={counterTerms.late_fee_type} onChange={(e) => setCounterTerms({...counterTerms, late_fee_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="flat">Flat Fee</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Amount</label>
                  <input type="number" value={counterTerms.late_fee_amount} onChange={(e) => setCounterTerms({...counterTerms, late_fee_amount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowCounter(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                <button onClick={() => onCounter(agreement.id, counterTerms)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" data-testid="submit-counter-btn">Submit Counter</button>
              </div>
            </div>
          )}
        </div>
      )}

      {agreement.status === 'pending' && role === 'tenant' && (
        <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center gap-3 mb-4">
            <Info size={16} className="text-blue-600" />
            <p className="text-sm text-gray-600">Review the terms carefully before accepting.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onAccept(agreement.id)} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700" data-testid="accept-agreement-btn">
              <CheckCircle2 size={18} />Accept Terms
            </button>
            <button onClick={() => setShowCounter(!showCounter)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700" data-testid="counter-propose-btn">
              <MessageSquare size={18} />Counter Propose
            </button>
            <button onClick={() => onDecline(agreement.id)} className="flex items-center gap-2 px-6 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50" data-testid="decline-agreement-btn">
              <XCircle size={18} />Decline
            </button>
          </div>
        </div>
      )}

      {agreement.status === 'active' && role === 'tenant' && (
        <div className="p-6 border-t border-gray-100">
          <button onClick={() => onPay(agreement.id)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52]" data-testid="pay-rent-btn">
            <CreditCard size={18} />Pay Rent - ${agreement.monthly_rent?.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
};

export default function RentAgreements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('tenant');
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    // Give time for auth context to restore from localStorage
    const timer = setTimeout(() => setAuthChecked(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authChecked && !user) navigate('/login');
  }, [user, authChecked, navigate]);

  useEffect(() => {
    if (user) { fetchAgreements(); checkPaymentMethod(); checkConnectStatus(); }
  }, [user, role]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/rent/agreements?user_id=${user.id}&role=${role}`);
      setAgreements(res.data);
    } catch (error) { console.error('Error fetching agreements:', error); }
    finally { setLoading(false); }
  };

  const checkPaymentMethod = async () => {
    try {
      const res = await axios.get(`${API}/users/${user.id}`);
      setHasPaymentMethod(!!res.data?.default_payment_method_id);
    } catch (error) { console.error(error); }
  };

  const checkConnectStatus = async () => {
    try {
      const res = await axios.get(`${API}/stripe-connect/status?landlord_id=${user.id}`);
      setConnectStatus(res.data);
    } catch (error) { console.error(error); }
  };

  const handleSetupConnect = async () => {
    setConnectLoading(true);
    try {
      // Create account if needed
      await axios.post(`${API}/stripe-connect/create-account?landlord_id=${user.id}`);
      // Get onboarding link
      const res = await axios.post(`${API}/stripe-connect/onboarding-link?landlord_id=${user.id}&return_url=${encodeURIComponent(window.location.origin)}`);
      if (res.data?.url) window.location.href = res.data.url;
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to start Stripe Connect setup');
    } finally { setConnectLoading(false); }
  };

  const handleConnectDashboard = async () => {
    try {
      const res = await axios.get(`${API}/stripe-connect/dashboard-link?landlord_id=${user.id}`);
      if (res.data?.url) window.open(res.data.url, '_blank');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to open dashboard');
    }
  };

  const handleAccept = async (agreementId) => {
    try {
      await axios.post(`${API}/rent/agreements/${agreementId}/accept?tenant_id=${user.id}`);
      fetchAgreements();
    } catch (error) { alert(error.response?.data?.detail || 'Failed to accept agreement'); }
  };

  const handleDecline = async (agreementId) => {
    if (!window.confirm('Are you sure you want to decline this agreement?')) return;
    try {
      await axios.post(`${API}/rent/agreements/${agreementId}/decline?tenant_id=${user.id}`);
      fetchAgreements();
    } catch (error) { alert(error.response?.data?.detail || 'Failed to decline agreement'); }
  };

  const handleCounter = async (agreementId, terms) => {
    try {
      await axios.post(`${API}/rent/agreements/${agreementId}/counter?tenant_id=${user.id}`, terms);
      fetchAgreements();
      alert('Counter proposal submitted.');
    } catch (error) { alert(error.response?.data?.detail || 'Failed to submit counter proposal'); }
  };

  const handlePay = async (agreementId) => {
    if (!hasPaymentMethod) { setShowPaymentSetup(true); return; }
    try {
      const res = await axios.post(`${API}/rent/payments/${agreementId}/pay?tenant_id=${user.id}`);
      alert(res.data.message);
      fetchAgreements();
    } catch (error) { alert(error.response?.data?.detail || 'Payment failed'); }
  };

  if (!user) { return null; }

  return (
    <MainLayout>
      <section className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] py-16 pb-32 px-4" data-testid="rent-agreements-hero">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Rent Payments</p>
              <h1 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Rent Agreements
              </h1>
              <p className="text-white/70 mt-2">Manage your rent payments and agreements</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-full p-1">
                <button onClick={() => setRole('tenant')}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${role === 'tenant' ? 'bg-white text-[#1A2F3A]' : 'text-white/70 hover:text-white'}`}
                  data-testid="role-tenant-btn">As Tenant</button>
                <button onClick={() => setRole('landlord')}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${role === 'landlord' ? 'bg-white text-[#1A2F3A]' : 'text-white/70 hover:text-white'}`}
                  data-testid="role-landlord-btn">As Landlord</button>
              </div>
              {role === 'landlord' && (
                <button onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#1A2F3A] rounded-full text-sm font-medium hover:bg-gray-100"
                  data-testid="create-agreement-btn">
                  <Plus size={16} />New Agreement
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {role === 'tenant' && !hasPaymentMethod && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between" data-testid="payment-setup-banner">
            <div className="flex items-center gap-3">
              <CreditCard size={24} className="text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Set up automatic payments</p>
                <p className="text-sm text-yellow-600">Add a payment method to enable automatic rent collection</p>
              </div>
            </div>
            <button onClick={() => setShowPaymentSetup(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700" data-testid="add-card-btn">
              Add Card
            </button>
          </div>
        )}

        {role === 'landlord' && connectStatus && !connectStatus.payouts_enabled && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between" data-testid="connect-setup-banner">
            <div className="flex items-center gap-3">
              <DollarSign size={24} className="text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">
                  {connectStatus.status === 'not_connected' ? 'Set up payouts' : 'Complete payout setup'}
                </p>
                <p className="text-sm text-blue-600">
                  {connectStatus.status === 'not_connected' 
                    ? 'Connect your bank to receive rent payments from tenants' 
                    : 'Complete your Stripe onboarding to start receiving payouts'}
                </p>
              </div>
            </div>
            <button onClick={handleSetupConnect} disabled={connectLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              data-testid="setup-connect-btn">
              {connectLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {connectStatus.status === 'not_connected' ? 'Connect Bank' : 'Continue Setup'}
            </button>
          </div>
        )}

        {role === 'landlord' && connectStatus?.payouts_enabled && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between" data-testid="connect-active-banner">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-green-600" />
              <div>
                <p className="font-medium text-green-800">Payouts Active</p>
                <p className="text-sm text-green-600">Your bank account is connected. Rent payments will be deposited automatically.</p>
              </div>
            </div>
            <button onClick={handleConnectDashboard}
              className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-100" data-testid="connect-dashboard-btn">
              View Stripe Dashboard
            </button>
          </div>
        )}

        {showPaymentSetup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-[#1A2F3A] mb-4">Add Payment Method</h3>
              <Elements stripe={stripePromise}>
                <PaymentMethodForm onSuccess={() => { setShowPaymentSetup(false); setHasPaymentMethod(true); }} onCancel={() => setShowPaymentSetup(false)} />
              </Elements>
            </div>
          </div>
        )}

        {showCreateModal && (
          <CreateAgreementModal userId={user.id} onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchAgreements(); }} />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#1A2F3A]" />
          </div>
        ) : agreements.length === 0 ? (
          <div className="text-center py-20" data-testid="no-agreements">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400">No Agreements Yet</h3>
            <p className="text-gray-400 mt-2">
              {role === 'tenant' ? "You don't have any rent agreements yet." : "You haven't created any rent agreements yet."}
            </p>
            {role === 'landlord' && (
              <button onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] inline-flex items-center gap-2" data-testid="create-first-agreement-btn">
                <Plus size={18} />Create Your First Agreement
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6" data-testid="agreements-list">
            {agreements.map(agreement => (
              <AgreementCard key={agreement.id} agreement={agreement} role={role}
                onAccept={handleAccept} onDecline={handleDecline} onCounter={handleCounter} onPay={handlePay} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
