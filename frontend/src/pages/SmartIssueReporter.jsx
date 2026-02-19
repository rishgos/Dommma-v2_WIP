import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Camera, Sparkles, Star, MapPin, Phone,
  Shield, ChevronRight, Loader2, AlertTriangle, CheckCircle, X
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const urgencyColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700'
};

const SmartIssueReporter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('upload'); // upload, analyzing, results
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [bookingForm, setBookingForm] = useState({ preferred_date: '', preferred_time: '', address: '', notes: '' });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const analyzeIssue = async () => {
    if (!description && !image) return;
    setLoading(true);
    setStep('analyzing');
    try {
      let imageData = '';
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        const uploadRes = await axios.post(`${API}/upload/image`, formData);
        imageData = uploadRes.data.url;
      }
      const res = await axios.post(`${API}/ai/analyze-issue`, {
        image_data: imageData,
        description: description
      });
      setAnalysis(res.data.analysis);
      setContractors(res.data.matched_contractors || []);
      setStep('results');
    } catch (e) {
      console.error(e);
      alert('Analysis failed. Please try again.');
      setStep('upload');
    }
    setLoading(false);
  };

  const bookContractor = async (contractor) => {
    if (!user) { navigate('/login'); return; }
    try {
      await axios.post(`${API}/bookings?customer_id=${user.id}`, {
        contractor_id: contractor.user_id,
        title: `${analysis?.issue_type || 'Repair'}: ${analysis?.description?.substring(0, 50) || description.substring(0, 50)}`,
        description: `Issue: ${description}\n\nAI Analysis: ${analysis?.description || ''}\nUrgency: ${analysis?.urgency || 'medium'}\nEstimated Cost: ${analysis?.estimated_cost_range || 'TBD'}`,
        preferred_date: bookingForm.preferred_date,
        preferred_time: bookingForm.preferred_time,
        address: bookingForm.address,
        notes: bookingForm.notes
      });
      alert('Booking request sent to ' + contractor.business_name + '!');
      setSelectedContractor(null);
    } catch (e) { alert('Booking failed.'); }
  };

  const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={12} className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
  ));

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-[#1A2F3A] text-white px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link to={user ? "/dashboard" : "/"} className="text-white/70 hover:text-white"><ArrowLeft size={18} /></Link>
            <div>
              <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Smart Issue Reporter</h1>
              <p className="text-sm text-white/70">Upload a photo or describe your issue — AI will find the right contractor</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['upload', 'analyzing', 'results'].map((s, i) => (
              <div key={s} className={`flex-1 h-1 rounded-full ${step === s || ['analyzing', 'results'].indexOf(step) >= i ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-[#1A2F3A] mb-6">What's the issue?</h2>
              
              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-3">Upload a Photo (optional)</label>
                {imagePreview ? (
                  <div className="relative w-full h-64 rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="Issue" className="w-full h-full object-cover" />
                    <button onClick={() => { setImage(null); setImagePreview(null); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#1A2F3A] transition-colors" data-testid="issue-image-upload">
                    <Camera size={32} className="text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500">Click to upload or drag a photo</p>
                    <p className="text-xs text-gray-400 mt-1">Water leak, broken fixture, damage, etc.</p>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">Describe the Issue</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none"
                  placeholder="e.g., Water is leaking from under the kitchen sink, the pipe joint seems loose. It started yesterday evening..."
                  data-testid="issue-description-input"
                />
              </div>

              <button
                onClick={analyzeIssue}
                disabled={!description && !image}
                className="w-full py-4 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                data-testid="analyze-issue-btn"
              >
                <Sparkles size={20} /> Analyze & Find Contractors
              </button>
            </div>

            <div className="bg-white/50 rounded-2xl p-6">
              <p className="text-sm text-gray-500 text-center">
                Our AI analyzes your issue, assesses urgency, estimates costs, and matches you with the best local contractors.
              </p>
            </div>
          </div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-[#1A2F3A] flex items-center justify-center mb-6 animate-pulse">
              <Sparkles size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#1A2F3A] mb-2">Analyzing Your Issue...</h2>
            <p className="text-gray-500">AI is identifying the problem and finding the best contractors</p>
            <Loader2 className="mt-6 text-[#1A2F3A] animate-spin" size={32} />
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && analysis && (
          <div className="space-y-6">
            {/* Analysis Card */}
            <div className="bg-white rounded-2xl p-6" data-testid="issue-analysis-result">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#1A2F3A] flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1A2F3A]">AI Analysis</h2>
                  <span className={`px-3 py-1 rounded-full text-xs ${urgencyColors[analysis.urgency] || urgencyColors.medium}`}>
                    {analysis.urgency?.toUpperCase()} urgency
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{analysis.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#F5F5F0] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Issue Type</p>
                  <p className="font-semibold text-[#1A2F3A] capitalize">{analysis.issue_type}</p>
                </div>
                <div className="bg-[#F5F5F0] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Estimated Cost</p>
                  <p className="font-semibold text-[#1A2F3A]">{analysis.estimated_cost_range || 'Get quote'}</p>
                </div>
              </div>

              {analysis.immediate_steps?.length > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} /> Immediate Steps
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {analysis.immediate_steps.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              )}

              <button onClick={() => { setStep('upload'); setAnalysis(null); setContractors([]); }}
                className="text-sm text-[#1A2F3A] hover:underline">
                Analyze another issue
              </button>
            </div>

            {/* Matched Contractors */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4">
                Matched Contractors ({contractors.length})
              </h3>
              {contractors.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <p className="text-gray-500">No contractors found for this issue type. Try browsing all contractors.</p>
                  <Link to="/contractors" className="text-[#1A2F3A] hover:underline text-sm mt-2 inline-block">Browse All</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {contractors.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl p-5 flex items-center gap-4" data-testid={`matched-contractor-${c.id}`}>
                      <div className="w-14 h-14 rounded-xl bg-[#1A2F3A] flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                        {c.business_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#1A2F3A]">{c.business_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">{renderStars(c.rating)}</div>
                          <span className="text-xs text-gray-500">({c.review_count || 0})</span>
                          {c.verified && <span className="flex items-center gap-1 text-xs text-green-600"><Shield size={10} />Verified</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{c.years_experience} years exp. · ${c.hourly_rate}/hr</p>
                      </div>
                      <button onClick={() => setSelectedContractor(c)}
                        className="px-4 py-2 bg-[#1A2F3A] text-white rounded-xl text-sm hover:bg-[#2C4A52] shrink-0"
                        data-testid={`book-matched-${c.id}`}>
                        Book Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedContractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedContractor(null)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Book {selectedContractor.business_name}
            </h2>
            <p className="text-sm text-gray-500 mb-6 capitalize">{analysis?.issue_type} — {analysis?.urgency} urgency</p>
            <form onSubmit={(e) => { e.preventDefault(); bookContractor(selectedContractor); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Preferred Date</label>
                  <input type="date" value={bookingForm.preferred_date} onChange={e => setBookingForm({ ...bookingForm, preferred_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Time</label>
                  <select value={bookingForm.preferred_time} onChange={e => setBookingForm({ ...bookingForm, preferred_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none">
                    <option value="">Select</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    {analysis?.urgency === 'emergency' && <option value="asap">ASAP</option>}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Address</label>
                <input type="text" value={bookingForm.address} onChange={e => setBookingForm({ ...bookingForm, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="Service address" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Additional Notes</label>
                <textarea value={bookingForm.notes} onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedContractor(null)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52]" data-testid="confirm-issue-booking">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartIssueReporter;
