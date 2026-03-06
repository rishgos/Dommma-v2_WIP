import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, CreditCard, FileText, Download, Plus, Check, X, 
  Home, Shield, Zap, Wrench, Truck, Building2, Package, Users,
  ChevronRight, Loader2, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { useAuth } from '../App';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Icon mapping for payment types
const iconMap = {
  Home, Shield, Zap, Wrench, Truck, Building2, Package, Users, 
  DollarSign, FileText, CreditCard, Tool: Wrench
};

function PaymentTypeCard({ type, label, icon, description, selected, onClick }) {
  const IconComponent = iconMap[icon] || DollarSign;
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected 
          ? 'border-[#1A2F3A] bg-[#1A2F3A]/5' 
          : 'border-gray-100 hover:border-gray-200 bg-white'
      }`}
      data-testid={`payment-type-${type}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          selected ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          <IconComponent size={20} />
        </div>
        <div>
          <p className="font-medium text-[#1A2F3A]">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
}

function InvoiceRow({ invoice, onDownload }) {
  const statusColors = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700'
  };
  
  const statusIcons = {
    paid: CheckCircle,
    pending: Clock,
    failed: AlertCircle
  };
  
  const StatusIcon = statusIcons[invoice.status] || Clock;
  
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-sm transition-shadow" data-testid={`invoice-${invoice.id}`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <FileText size={20} className="text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-[#1A2F3A]">{invoice.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>{invoice.invoice_number}</span>
            <span>•</span>
            <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-[#1A2F3A]">${invoice.amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusColors[invoice.status]}`}>
            <StatusIcon size={10} />
            {invoice.status}
          </span>
        </div>
        <button 
          onClick={() => onDownload(invoice.id)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Download PDF"
          data-testid={`download-invoice-${invoice.id}`}
        >
          <Download size={18} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}

export default function Payments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('pay'); // 'pay' or 'invoices'
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Payment form state
  const [selectedType, setSelectedType] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check for success/cancel from Stripe checkout
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setActiveTab('invoices');
      // Complete the payment
      const sessionId = localStorage.getItem('pending_checkout_session');
      if (sessionId) {
        axios.post(`${API}/api/payments/webhook/complete?session_id=${sessionId}`);
        localStorage.removeItem('pending_checkout_session');
      }
    }
    
    fetchData();
  }, [user, navigate, searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/api/payments/types/${user.user_type}`),
        axios.get(`${API}/api/invoices/${user.id}`)
      ]);
      setPaymentTypes(typesRes.data);
      setInvoices(invoicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedType || !amount || parseFloat(amount) <= 0) {
      alert('Please select a payment type and enter a valid amount');
      return;
    }
    
    setProcessing(true);
    try {
      const payload = {
        amount: parseFloat(amount),
        description: description || selectedType.label,
        payment_type: selectedType.type,
        recipient_name: recipientName || null,
        property_address: propertyAddress || null,
        notes: notes || null
      };
      
      const res = await axios.post(`${API}/api/payments/create?user_id=${user.id}`, payload);
      
      if (res.data.requires_redirect) {
        // Save session ID for completion tracking
        localStorage.setItem('pending_checkout_session', res.data.checkout_url.split('cs_')[1]?.split('/')[0] || '');
        window.location.href = res.data.checkout_url;
      } else {
        // Payment completed with saved card
        setShowSuccess(true);
        resetForm();
        fetchData();
        setActiveTab('invoices');
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Payment failed. Please try again.');
    }
    setProcessing(false);
  };

  const resetForm = () => {
    setSelectedType(null);
    setAmount('');
    setDescription('');
    setRecipientName('');
    setPropertyAddress('');
    setNotes('');
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await axios.get(`${API}/api/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download invoice');
    }
  };

  const getRoleTitle = () => {
    const titles = {
      renter: 'Make payments for rent, utilities, and services',
      landlord: 'Manage property expenses and contractor payments',
      contractor: 'Track business expenses and payments'
    };
    return titles[user?.user_type] || 'Manage your payments';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#1A2F3A]" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            <DollarSign className="text-[#1A2F3A]" />
            Pay & Invoices
          </h1>
          <p className="text-gray-600 mt-1">{getRoleTitle()}</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="font-medium text-green-800">Payment Successful!</p>
              <p className="text-sm text-green-600">Your invoice has been generated and saved.</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="ml-auto p-1 hover:bg-green-100 rounded">
              <X size={18} className="text-green-600" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('pay')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'pay' 
                ? 'bg-[#1A2F3A] text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            data-testid="tab-pay"
          >
            <CreditCard size={18} />
            Make Payment
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'invoices' 
                ? 'bg-[#1A2F3A] text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            data-testid="tab-invoices"
          >
            <FileText size={18} />
            Invoices ({invoices.length})
          </button>
        </div>

        {/* Make Payment Tab */}
        {activeTab === 'pay' && (
          <form onSubmit={handleSubmitPayment} className="space-y-6">
            {/* Payment Type Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#1A2F3A] mb-4">What are you paying for?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentTypes.map((type) => (
                  <PaymentTypeCard
                    key={type.type}
                    {...type}
                    selected={selectedType?.type === type.type}
                    onClick={() => {
                      setSelectedType(type);
                      setDescription(type.label);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {selectedType && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-[#1A2F3A] mb-4">Payment Details</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (CAD) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.50"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                        required
                        data-testid="payment-amount"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this payment for?"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                      required
                      data-testid="payment-description"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name (Optional)</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g., John's Plumbing"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                      data-testid="payment-recipient"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Address (Optional)</label>
                    <input
                      type="text"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      placeholder="e.g., 123 Main St, Vancouver"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                      data-testid="payment-property"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional details..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                    data-testid="payment-notes"
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Payment Type</span>
                    <span className="font-medium text-[#1A2F3A]">{selectedType.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="text-xl font-bold text-[#1A2F3A]">
                      ${parseFloat(amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} CAD
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing || !amount || parseFloat(amount) <= 0}
                  className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="submit-payment"
                >
                  {processing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Pay ${parseFloat(amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 mb-2">No invoices yet</p>
                <p className="text-sm text-gray-400">Your payment history will appear here</p>
                <button
                  onClick={() => setActiveTab('pay')}
                  className="mt-4 px-4 py-2 bg-[#1A2F3A] text-white rounded-lg text-sm hover:bg-[#2C4A52] transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Make a Payment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <InvoiceRow 
                    key={invoice.id} 
                    invoice={invoice} 
                    onDownload={downloadInvoice}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-6 text-white">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Shield size={18} />
            Secure Payments
          </h3>
          <p className="text-sm text-white/80 mb-3">
            All payments are processed securely through Stripe. Your payment information is encrypted and never stored on our servers.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/60">
            <span>256-bit SSL</span>
            <span>•</span>
            <span>PCI-DSS Compliant</span>
            <span>•</span>
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
