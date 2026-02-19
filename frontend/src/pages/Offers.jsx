import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Send, Clock, CheckCircle, XCircle,
  MessageSquare, TrendingUp, Home, FileText, AlertCircle
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusStyles = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Accepted' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  countered: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Countered' },
  withdrawn: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Withdrawn' }
};

const Offers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('make'); // make, sent, received
  const [myOffers, setMyOffers] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const listingId = searchParams.get('listing_id');
  const listingTitle = searchParams.get('listing_title');
  const listingPrice = searchParams.get('price');

  const [form, setForm] = useState({
    offer_amount: listingPrice ? Math.round(parseInt(listingPrice) * 0.95).toString() : '',
    financing_type: 'mortgage',
    closing_date: '',
    conditions: [],
    message: ''
  });

  const conditionOptions = [
    'Subject to financing', 'Subject to inspection', 'Subject to appraisal',
    'Subject to sale of buyer\'s property', 'No conditions (firm offer)'
  ];

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (listingId) setActiveTab('make');
    fetchOffers();
  }, [user]);

  const fetchOffers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sent, received] = await Promise.all([
        axios.get(`${API}/offers/buyer/${user.id}`).catch(() => ({ data: [] })),
        axios.get(`${API}/offers/seller/${user.id}`).catch(() => ({ data: [] }))
      ]);
      setMyOffers(sent.data || []);
      setReceivedOffers(received.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!listingId) return;
    try {
      await axios.post(`${API}/offers?buyer_id=${user.id}`, {
        listing_id: listingId,
        offer_amount: parseInt(form.offer_amount),
        financing_type: form.financing_type,
        closing_date: form.closing_date,
        conditions: form.conditions,
        message: form.message
      });
      alert('Offer submitted successfully!');
      setActiveTab('sent');
      fetchOffers();
    } catch (e) {
      console.error(e);
      alert('Failed to submit offer.');
    }
  };

  const handleRespond = async (offerId, action, counterAmount) => {
    try {
      const params = new URLSearchParams({ action, seller_id: user.id });
      if (counterAmount) params.append('counter_amount', counterAmount);
      await axios.put(`${API}/offers/${offerId}/respond?${params}`);
      fetchOffers();
    } catch (e) { console.error(e); }
  };

  const toggleCondition = (cond) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.includes(cond)
        ? prev.conditions.filter(c => c !== cond)
        : [...prev.conditions, cond]
    }));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-[#1A2F3A] text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-white/70 hover:text-white"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Property Offers</h1>
            <p className="text-sm text-white/70">Buy and sell real estate</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6">
          {listingId && (
            <button onClick={() => setActiveTab('make')}
              className={`flex-1 py-2.5 rounded-lg text-sm ${activeTab === 'make' ? 'bg-[#1A2F3A] text-white' : 'text-gray-500'}`}>
              New Offer
            </button>
          )}
          <button onClick={() => setActiveTab('sent')}
            className={`flex-1 py-2.5 rounded-lg text-sm ${activeTab === 'sent' ? 'bg-[#1A2F3A] text-white' : 'text-gray-500'}`}
            data-testid="tab-sent-offers">
            My Offers ({myOffers.length})
          </button>
          <button onClick={() => setActiveTab('received')}
            className={`flex-1 py-2.5 rounded-lg text-sm ${activeTab === 'received' ? 'bg-[#1A2F3A] text-white' : 'text-gray-500'}`}
            data-testid="tab-received-offers">
            Received ({receivedOffers.length})
          </button>
        </div>

        {/* Make Offer */}
        {activeTab === 'make' && listingId && (
          <div className="bg-white rounded-2xl p-6">
            <div className="mb-6 p-4 bg-[#F5F5F0] rounded-xl">
              <p className="text-sm text-gray-500">Making offer on</p>
              <p className="font-semibold text-[#1A2F3A] text-lg">{decodeURIComponent(listingTitle || 'Property')}</p>
              {listingPrice && <p className="text-gray-500">Listed at ${parseInt(listingPrice).toLocaleString()}</p>}
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Your Offer Amount ($)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" value={form.offer_amount} onChange={e => setForm({ ...form, offer_amount: e.target.value })}
                    className="w-full pl-10 pr-4 py-4 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none text-2xl font-semibold text-[#1A2F3A]"
                    placeholder="0" required data-testid="offer-amount-input" />
                </div>
                {listingPrice && form.offer_amount && (
                  <p className="text-sm mt-2 text-gray-500">
                    {((parseInt(form.offer_amount) / parseInt(listingPrice)) * 100).toFixed(1)}% of asking price
                    {parseInt(form.offer_amount) < parseInt(listingPrice) ? ' (below asking)' : parseInt(form.offer_amount) > parseInt(listingPrice) ? ' (above asking)' : ' (at asking)'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Financing</label>
                <div className="flex gap-2">
                  {['mortgage', 'cash', 'pre-approved'].map(f => (
                    <button key={f} type="button" onClick={() => setForm({ ...form, financing_type: f })}
                      className={`px-4 py-2 rounded-xl text-sm capitalize ${form.financing_type === f ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {f === 'pre-approved' ? 'Pre-Approved' : f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Preferred Closing Date</label>
                <input type="date" value={form.closing_date} onChange={e => setForm({ ...form, closing_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Conditions</label>
                <div className="space-y-2">
                  {conditionOptions.map(c => (
                    <label key={c} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50">
                      <input type="checkbox" checked={form.conditions.includes(c)} onChange={() => toggleCondition(c)} className="w-4 h-4 rounded" />
                      <span className="text-sm text-gray-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Message to Seller (optional)</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none" rows={3}
                  placeholder="Tell the seller why you're the right buyer..." />
              </div>

              <button type="submit" className="w-full py-4 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] flex items-center justify-center gap-2 text-lg"
                data-testid="submit-offer-btn">
                <Send size={18} /> Submit Offer
              </button>
            </form>
          </div>
        )}

        {/* Sent Offers */}
        {activeTab === 'sent' && (
          <div>
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>)}</div>
            ) : myOffers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <FileText className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-gray-500">No offers sent yet.</p>
                <Link to="/browse" className="text-[#1A2F3A] hover:underline text-sm mt-2 inline-block">Browse Properties</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myOffers.map(offer => {
                  const st = statusStyles[offer.status] || statusStyles.pending;
                  return (
                    <div key={offer.id} className="bg-white rounded-2xl p-6" data-testid={`offer-${offer.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-[#1A2F3A]">{offer.listing?.title || 'Property'}</h3>
                          <p className="text-sm text-gray-500">{offer.listing?.address}, {offer.listing?.city}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${st.bg} ${st.text}`}>{st.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div><p className="text-xs text-gray-500">Your Offer</p><p className="font-semibold text-[#1A2F3A]">${offer.offer_amount?.toLocaleString()}</p></div>
                        <div><p className="text-xs text-gray-500">Asking Price</p><p className="font-semibold text-gray-600">${offer.listing?.price?.toLocaleString()}</p></div>
                        <div><p className="text-xs text-gray-500">Financing</p><p className="font-semibold text-gray-600 capitalize">{offer.financing_type}</p></div>
                      </div>
                      {offer.status === 'countered' && offer.counter_amount && (
                        <div className="bg-blue-50 rounded-xl p-4 mb-3">
                          <p className="text-sm text-blue-700">Counter offer: <strong>${offer.counter_amount.toLocaleString()}</strong></p>
                          {offer.counter_message && <p className="text-sm text-blue-600 mt-1">{offer.counter_message}</p>}
                        </div>
                      )}
                      {offer.status === 'accepted' && (
                        <div className="bg-green-50 rounded-xl p-4">
                          <p className="text-green-700 font-medium flex items-center gap-2"><CheckCircle size={16} /> Congratulations! Your offer was accepted.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Received Offers */}
        {activeTab === 'received' && (
          <div>
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>)}</div>
            ) : receivedOffers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Home className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-gray-500">No offers received yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedOffers.map(offer => {
                  const st = statusStyles[offer.status] || statusStyles.pending;
                  return (
                    <div key={offer.id} className="bg-white rounded-2xl p-6" data-testid={`received-offer-${offer.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-[#1A2F3A]">{offer.listing?.title || 'Property'}</h3>
                          <p className="text-sm text-gray-500">From: {offer.buyer?.name || offer.buyer?.email || 'Buyer'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${st.bg} ${st.text}`}>{st.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div><p className="text-xs text-gray-500">Offer Amount</p><p className="text-2xl font-bold text-[#1A2F3A]">${offer.offer_amount?.toLocaleString()}</p></div>
                        <div><p className="text-xs text-gray-500">Financing</p><p className="font-semibold text-gray-600 capitalize">{offer.financing_type}</p></div>
                        <div><p className="text-xs text-gray-500">Closing</p><p className="font-semibold text-gray-600">{offer.closing_date || 'Flexible'}</p></div>
                      </div>
                      {offer.conditions?.length > 0 && (
                        <div className="mb-3"><p className="text-xs text-gray-500 mb-1">Conditions:</p>
                          <div className="flex flex-wrap gap-1">{offer.conditions.map((c, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{c}</span>)}</div>
                        </div>
                      )}
                      {offer.message && <p className="text-sm text-gray-600 mb-3 italic">"{offer.message}"</p>}
                      {offer.status === 'pending' && (
                        <div className="flex gap-3 mt-4">
                          <button onClick={() => handleRespond(offer.id, 'accepted')}
                            className="flex-1 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 flex items-center justify-center gap-2"
                            data-testid={`accept-offer-${offer.id}`}>
                            <CheckCircle size={16} /> Accept
                          </button>
                          <button onClick={() => {
                            const counter = prompt('Enter counter offer amount:');
                            if (counter) handleRespond(offer.id, 'countered', parseInt(counter));
                          }}
                            className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 flex items-center justify-center gap-2"
                            data-testid={`counter-offer-${offer.id}`}>
                            <TrendingUp size={16} /> Counter
                          </button>
                          <button onClick={() => handleRespond(offer.id, 'rejected')}
                            className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2"
                            data-testid={`reject-offer-${offer.id}`}>
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Offers;
