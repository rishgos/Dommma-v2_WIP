import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, X, DollarSign, Calendar, MapPin, Clock, 
  Send, ChevronRight, Wrench, Zap, Droplets, Paintbrush, 
  Hammer, Leaf, Sparkles, Star, Shield, Check, AlertCircle, Loader2
} from 'lucide-react';
import axios from 'axios';
import AddressAutocomplete from '../../components/ui/AddressAutocomplete';

const API = process.env.REACT_APP_BACKEND_URL;

const categoryIcons = {
  plumbing: Droplets, electrical: Zap, painting: Paintbrush,
  renovation: Hammer, carpentry: Hammer, landscaping: Leaf,
  cleaning: Sparkles, general: Wrench
};

const categories = ['plumbing', 'electrical', 'painting', 'renovation', 'landscaping', 'cleaning', 'general'];

/**
 * JobPostForm - Form to create a new job posting (bark.com style)
 */
export function JobPostForm({ isOpen, onClose, onSuccess, userId }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    address: '',
    budget_min: '',
    budget_max: '',
    preferred_date: '',
    urgency: 'flexible'
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.description || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        ...formData,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null
      };

      const res = await axios.post(`${API}/api/jobs?user_id=${userId}`, payload);
      onSuccess?.(res.data);
      onClose();
      
      // Reset form
      setFormData({
        title: '', category: '', description: '', address: '',
        budget_min: '', budget_max: '', preferred_date: '', urgency: 'flexible'
      });
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto" data-testid="job-post-form">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1A2F3A]">Post a Job</h2>
            <p className="text-sm text-gray-500">Get quotes from local professionals</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-[#1A2F3A]' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Step {step} of 3</p>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of work do you need? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const Icon = categoryIcons[cat] || Wrench;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          formData.category === cat
                            ? 'border-[#1A2F3A] bg-[#1A2F3A]/5 text-[#1A2F3A]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        data-testid={`category-btn-${cat}`}
                      >
                        <Icon size={18} />
                        <span className="capitalize text-sm">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Fix leaky faucet in kitchen"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                  data-testid="job-title-input"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Describe what you need done *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Be specific about the job requirements, any issues you're experiencing, and what outcome you're looking for..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A] resize-none"
                  data-testid="job-description-input"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job location *
                </label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(addr) => setFormData({ ...formData, address: addr })}
                  placeholder="Enter address"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Budget range (optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={formData.budget_min}
                      onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                      placeholder="Min"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                    />
                  </div>
                  <span className="text-gray-400">to</span>
                  <div className="relative flex-1">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                      placeholder="Max"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  When do you need this done?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                  />
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How urgent is this?
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'flexible', label: 'Flexible' },
                    { value: 'this_week', label: 'This Week' },
                    { value: 'urgent', label: 'Urgent' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, urgency: opt.value })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        formData.urgency === opt.value
                          ? 'bg-[#1A2F3A] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-[#1A2F3A]">Job Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Category:</span> <span className="capitalize">{formData.category}</span></p>
                  <p><span className="font-medium">Title:</span> {formData.title}</p>
                  <p><span className="font-medium">Location:</span> {formData.address}</p>
                  {(formData.budget_min || formData.budget_max) && (
                    <p><span className="font-medium">Budget:</span> ${formData.budget_min || '0'} - ${formData.budget_max || 'Open'}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-3xl flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-gray-600 hover:text-[#1A2F3A] transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && (!formData.category || !formData.title)}
              className="px-6 py-2.5 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50"
              data-testid="submit-job-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Post Job
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * JobCard - Display a job posting card
 */
export function JobCard({ job, onViewBids, isOwner = false }) {
  const Icon = categoryIcons[job.category] || Wrench;
  const urgencyColors = {
    flexible: 'bg-gray-100 text-gray-600',
    this_week: 'bg-yellow-100 text-yellow-700',
    urgent: 'bg-red-100 text-red-700'
  };

  return (
    <div className="bg-white rounded-2xl p-5 hover:shadow-lg transition-shadow" data-testid={`job-card-${job.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
            <Icon size={20} className="text-[#1A2F3A]" />
          </div>
          <div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyColors[job.urgency] || urgencyColors.flexible}`}>
              {job.urgency === 'this_week' ? 'This Week' : job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
            </span>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(job.created_at).toLocaleDateString()}
        </span>
      </div>

      <h3 className="font-semibold text-[#1A2F3A] mb-2">{job.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {job.address?.split(',')[0] || 'Location TBD'}
        </span>
        {(job.budget_min || job.budget_max) && (
          <span className="flex items-center gap-1">
            <DollarSign size={12} />
            {job.budget_min && job.budget_max 
              ? `$${job.budget_min} - $${job.budget_max}`
              : job.budget_max ? `Up to $${job.budget_max}` : `From $${job.budget_min}`
            }
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#1A2F3A]">{job.bid_count || 0} bids</span>
          {job.status === 'open' && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Open</span>
          )}
          {job.status === 'in_progress' && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">In Progress</span>
          )}
        </div>
        <button
          onClick={() => onViewBids?.(job)}
          className="text-sm font-medium text-[#1A2F3A] hover:underline flex items-center gap-1"
        >
          {isOwner ? 'View Bids' : 'Submit Bid'} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * JobBidForm - Form for contractors to submit a bid
 */
export function JobBidForm({ job, isOpen, onClose, onSuccess, contractorId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    message: '',
    estimated_duration: '',
    available_date: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.message) {
      setError('Please enter your quote amount and a message');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API}/api/jobs/${job.id}/bids?contractor_id=${contractorId}`, {
        amount: parseFloat(formData.amount),
        message: formData.message,
        estimated_duration: formData.estimated_duration || null,
        available_date: formData.available_date || null
      });
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit bid');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#1A2F3A]">Submit Your Bid</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">For: {job.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Quote *
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter your price"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                data-testid="bid-amount-input"
              />
            </div>
            {job.budget_min && job.budget_max && (
              <p className="text-xs text-gray-500 mt-1">
                Customer's budget: ${job.budget_min} - ${job.budget_max}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message to Customer *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Introduce yourself and explain why you're the right fit for this job..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A] resize-none"
              data-testid="bid-message-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Est. Duration
              </label>
              <input
                type="text"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                placeholder="e.g., 2-3 hours"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Available Date
              </label>
              <input
                type="date"
                value={formData.available_date}
                onChange={(e) => setFormData({ ...formData, available_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="submit-bid-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Bid
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * BidsList - Show bids for a job (for job owners)
 */
export function BidsList({ job, isOpen, onClose, onAcceptBid, userId }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    if (isOpen && job) {
      fetchBids();
    }
  }, [isOpen, job]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/jobs/${job.id}/bids`);
      setBids(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bid) => {
    try {
      setAccepting(bid.id);
      await axios.put(`${API}/api/jobs/${job.id}/bids/${bid.id}/accept?user_id=${userId}`);
      onAcceptBid?.(bid);
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to accept bid');
    } finally {
      setAccepting(null);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#1A2F3A]">Bids for Your Job</h2>
              <p className="text-sm text-gray-500">{job.title}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto text-[#1A2F3A]" size={32} />
              <p className="text-sm text-gray-500 mt-2">Loading bids...</p>
            </div>
          ) : bids.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No bids yet. Contractors will be notified about your job.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div key={bid.id} className="border border-gray-200 rounded-2xl p-4" data-testid={`bid-${bid.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#1A2F3A] flex items-center justify-center text-white font-bold">
                        {bid.contractor?.business_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#1A2F3A]">{bid.contractor?.business_name || 'Contractor'}</h4>
                          {bid.contractor?.verified && <Shield size={14} className="text-green-600" />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          {bid.contractor?.rating || 0} ({bid.contractor?.review_count || 0})
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1A2F3A]">${bid.amount}</p>
                      {bid.estimated_duration && (
                        <p className="text-xs text-gray-500">{bid.estimated_duration}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{bid.message}</p>

                  {bid.status === 'pending' && job.status === 'open' ? (
                    <button
                      onClick={() => handleAccept(bid)}
                      disabled={accepting === bid.id}
                      className="w-full py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {accepting === bid.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Accept Bid & Hire
                        </>
                      )}
                    </button>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      bid.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {bid.status === 'accepted' ? 'Accepted' : bid.status === 'rejected' ? 'Not Selected' : bid.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobPostForm;
