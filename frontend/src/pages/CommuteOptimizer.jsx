import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Plus, X, Clock, Sparkles, Loader2,
  Navigation, Train, Car, Bike, Bed, Bath, DollarSign
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const transportIcons = { transit: Train, driving: Car, cycling: Bike, walking: Navigation };

const CommuteOptimizer = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState(['']);
  const [maxCommute, setMaxCommute] = useState(45);
  const [transport, setTransport] = useState('transit');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const addAddress = () => { if (addresses.length < 3) setAddresses([...addresses, '']); };
  const removeAddress = (i) => setAddresses(addresses.filter((_, idx) => idx !== i));
  const updateAddress = (i, val) => { const a = [...addresses]; a[i] = val; setAddresses(a); };

  const search = async () => {
    const valid = addresses.filter(a => a.trim());
    if (valid.length === 0) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await axios.post(`${API}/ai/commute-search`, {
        work_addresses: valid,
        max_commute_minutes: maxCommute,
        transport_mode: transport
      });
      setResults(res.data);
    } catch (e) { console.error(e); alert('Search failed.'); }
    setLoading(false);
  };

  const scoreColor = (score) => {
    if (score >= 8) return 'bg-green-100 text-green-700';
    if (score >= 5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-[#1A2F3A] text-white px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/browse" className="text-white/70 hover:text-white"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Commute Optimizer</h1>
            <p className="text-sm text-white/70">Find your ideal home based on commute to work</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1A2F3A] mb-4">Where do you work?</h2>

          <div className="space-y-3 mb-6">
            {addresses.map((addr, i) => (
              <div key={i} className="flex items-center gap-3">
                <MapPin size={18} className="text-[#1A2F3A] shrink-0" />
                <input
                  type="text" value={addr}
                  onChange={e => updateAddress(i, e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  placeholder={`Work address ${i + 1} (e.g., 200 Granville St, Vancouver)`}
                  data-testid={`work-address-${i}`}
                />
                {addresses.length > 1 && (
                  <button onClick={() => removeAddress(i)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
                )}
              </div>
            ))}
            {addresses.length < 3 && (
              <button onClick={addAddress} className="flex items-center gap-2 text-sm text-[#1A2F3A] hover:underline pl-8">
                <Plus size={14} /> Add another work location
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Max Commute (minutes)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="15" max="90" value={maxCommute}
                  onChange={e => setMaxCommute(parseInt(e.target.value))}
                  className="flex-1 accent-[#1A2F3A]" />
                <span className="text-sm font-semibold text-[#1A2F3A] w-12">{maxCommute}m</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Transport Mode</label>
              <div className="flex gap-2">
                {['transit', 'driving', 'cycling'].map(mode => {
                  const Icon = transportIcons[mode];
                  return (
                    <button key={mode} onClick={() => setTransport(mode)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm capitalize ${transport === mode ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <Icon size={14} /> {mode}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={search} disabled={loading || !addresses.some(a => a.trim())}
            className="w-full py-4 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-40 flex items-center justify-center gap-2"
            data-testid="commute-search-btn">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Finding Best Properties...' : 'Find Properties by Commute'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4" data-testid="commute-results">
            {results.tips?.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-4">
                <p className="text-sm text-blue-700">{results.tips[0]}</p>
              </div>
            )}

            <h3 className="text-lg font-semibold text-[#1A2F3A]">
              Ranked by Commute ({results.ranked_properties?.length || 0} properties)
            </h3>

            {results.ranked_properties?.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 flex items-center gap-5" data-testid={`commute-result-${i}`}>
                <div className="w-12 h-12 rounded-xl bg-[#1A2F3A] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#1A2F3A]">{p.title}</h4>
                  <p className="text-sm text-gray-500">{p.address}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock size={14} /> {p.estimated_commute}
                    </span>
                    {p.listing && (
                      <>
                        <span className="text-sm text-gray-600">${p.listing.price}/mo</span>
                        <span className="text-sm text-gray-600">{p.listing.bedrooms}bd/{p.listing.bathrooms}ba</span>
                      </>
                    )}
                  </div>
                  {p.notes && <p className="text-xs text-gray-400 mt-1">{p.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${scoreColor(p.commute_score)}`}>
                    {p.commute_score}/10
                  </span>
                  {p.listing && (
                    <button onClick={() => navigate(`/browse?listing=${p.listing.id}`)}
                      className="block mt-2 text-xs text-[#1A2F3A] hover:underline">
                      View Listing
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CommuteOptimizer;
