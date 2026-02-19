import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wrench, ArrowLeft, Clock, Check, AlertTriangle, Plus,
  Home, Droplets, Zap, Fan, Bug, HardHat, Settings, User,
  Calendar, Camera, MessageSquare, ChevronRight
} from 'lucide-react';
import { useAuth } from '../App';
import { trackFeatureEngagement } from '../lib/firebase';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categoryIcons = {
  plumbing: Droplets,
  electrical: Zap,
  appliance: Settings,
  hvac: Fan,
  structural: HardHat,
  pest: Bug,
  other: Wrench
};

const categoryColors = {
  plumbing: 'bg-blue-100 text-blue-700',
  electrical: 'bg-yellow-100 text-yellow-700',
  appliance: 'bg-purple-100 text-purple-700',
  hvac: 'bg-cyan-100 text-cyan-700',
  structural: 'bg-orange-100 text-orange-700',
  pest: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700'
};

const Maintenance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    property_id: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchRequests();
    trackFeatureEngagement('maintenance_page');
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = user.user_type === 'landlord'
        ? `/maintenance/landlord/${user.id}`
        : `/maintenance/user/${user.id}`;
      const response = await axios.get(`${API}${endpoint}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/maintenance?user_id=${user.id}`, form);
      setShowModal(false);
      setForm({ title: '', description: '', category: 'other', priority: 'medium', property_id: '' });
      fetchRequests();
      alert('Maintenance request submitted successfully!');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await axios.put(`${API}/maintenance/${requestId}`, { status: newStatus });
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress' },
      scheduled: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Scheduled' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled' }
    };
    const config = configs[status] || configs.open;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const isLandlord = user?.user_type === 'landlord';
  const isContractor = user?.user_type === 'contractor';

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
              <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Maintenance
              </h1>
              <p className="text-sm text-white/70">
                {isLandlord ? 'Manage property maintenance requests' : 'Report and track maintenance issues'}
              </p>
            </div>
          </div>
          {!isContractor && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
              data-testid="new-request-btn"
            >
              <Plus size={16} />
              New Request
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-[#1A2F3A]">{requests.length}</p>
            <p className="text-sm text-gray-500">Total Requests</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-blue-600">
              {requests.filter(r => r.status === 'open').length}
            </p>
            <p className="text-sm text-gray-500">Open</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-yellow-600">
              {requests.filter(r => r.status === 'in_progress').length}
            </p>
            <p className="text-sm text-gray-500">In Progress</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-green-600">
              {requests.filter(r => r.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </div>

        {/* Categories Quick Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(categoryIcons).map(cat => {
            const Icon = categoryIcons[cat];
            return (
              <button
                key={cat}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm capitalize ${categoryColors[cat]} hover:opacity-80`}
              >
                <Icon size={16} />
                {cat}
              </button>
            );
          })}
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Wrench className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Maintenance Requests</h3>
            <p className="text-gray-500 mb-4">
              {isLandlord 
                ? 'Maintenance requests from tenants will appear here' 
                : 'Need something fixed? Submit a maintenance request'}
            </p>
            {!isContractor && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-full hover:bg-[#2C4A52]"
              >
                <Plus size={16} />
                New Request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => {
              const CategoryIcon = categoryIcons[req.category] || Wrench;
              return (
                <div 
                  key={req.id}
                  className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedRequest(req)}
                  data-testid={`maintenance-request-${req.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[req.category]}`}>
                        <CategoryIcon size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1A2F3A] mb-1">{req.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{req.description}</p>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs capitalize ${priorityColors[req.priority]}`}>
                            {req.priority}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {/* Landlord Actions */}
                  {isLandlord && req.status === 'open' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, 'in_progress'); }}
                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm hover:bg-yellow-200"
                      >
                        Start Work
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); /* Open job creation modal */ }}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                      >
                        Hire Contractor
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              New Maintenance Request
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Issue Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  placeholder="e.g., Leaky faucet in bathroom"
                  required
                  data-testid="maintenance-title-input"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(categoryIcons).map(cat => {
                    const Icon = categoryIcons[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({...form, category: cat})}
                        className={`p-3 rounded-xl border-2 transition-colors ${
                          form.category === cat 
                            ? 'border-[#1A2F3A] bg-[#1A2F3A]/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={20} className={form.category === cat ? 'text-[#1A2F3A] mx-auto' : 'text-gray-400 mx-auto'} />
                        <p className={`text-xs mt-1 capitalize ${form.category === cat ? 'text-[#1A2F3A]' : 'text-gray-500'}`}>
                          {cat}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({...form, priority: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                >
                  <option value="low">Low - Not urgent</option>
                  <option value="medium">Medium - Needs attention soon</option>
                  <option value="high">High - Urgent issue</option>
                  <option value="emergency">Emergency - Immediate attention needed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none"
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  required
                  data-testid="maintenance-description-input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52]"
                  data-testid="submit-maintenance-btn"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedRequest(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${categoryColors[selectedRequest.category]}`}>
                {React.createElement(categoryIcons[selectedRequest.category] || Wrench, { size: 28 })}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {selectedRequest.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(selectedRequest.status)}
                  <span className={`px-2 py-0.5 rounded text-xs capitalize ${priorityColors[selectedRequest.priority]}`}>
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-[#1A2F3A]">{selectedRequest.description}</p>
              </div>
              
              <div className="flex justify-between items-center py-3 border-t border-gray-100">
                <span className="text-gray-500">Submitted</span>
                <span className="text-[#1A2F3A]">
                  {new Date(selectedRequest.created_at).toLocaleDateString()}
                </span>
              </div>

              {selectedRequest.scheduled_date && (
                <div className="flex justify-between items-center py-3 border-t border-gray-100">
                  <span className="text-gray-500">Scheduled</span>
                  <span className="text-[#1A2F3A]">{selectedRequest.scheduled_date}</span>
                </div>
              )}

              {selectedRequest.cost && (
                <div className="flex justify-between items-center py-3 border-t border-gray-100">
                  <span className="text-gray-500">Cost</span>
                  <span className="text-[#1A2F3A]">${selectedRequest.cost}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedRequest(null)}
              className="w-full mt-6 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
