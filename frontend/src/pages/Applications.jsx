import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Clock, Check, X, AlertCircle, 
  User, Briefcase, Phone, Mail, MapPin, Calendar, Users,
  DollarSign, PawPrint, ChevronRight, Plus, Send
} from 'lucide-react';
import { useAuth } from '../App';
import { trackFeatureEngagement } from '../lib/firebase';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Applications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const listingId = searchParams.get('listing');
  const [listing, setListing] = useState(null);
  
  const [form, setForm] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
    current_address: '',
    move_in_date: '',
    employer: '',
    job_title: '',
    monthly_income: '',
    employment_length: '',
    num_occupants: 1,
    has_pets: false,
    pet_details: '',
    additional_notes: '',
    references: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchApplications();
    
    if (listingId) {
      fetchListing(listingId);
      setShowModal(true);
    }
    
    trackFeatureEngagement('applications_page');
  }, [user, navigate, listingId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const endpoint = user.user_type === 'landlord' 
        ? `/applications/landlord/${user.id}`
        : `/applications/user/${user.id}`;
      const response = await axios.get(`${API}${endpoint}`);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListing = async (id) => {
    try {
      const response = await axios.get(`${API}/listings/${id}`);
      setListing(response.data);
    } catch (error) {
      console.error('Error fetching listing:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/applications?user_id=${user.id}`, {
        listing_id: listingId,
        ...form,
        monthly_income: parseFloat(form.monthly_income) || null
      });
      setShowModal(false);
      fetchApplications();
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      await axios.put(`${API}/applications/${appId}/status?status=${newStatus}&landlord_id=${user.id}`);
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
      under_review: { bg: 'bg-blue-100', text: 'text-blue-700', icon: AlertCircle, label: 'Under Review' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: Check, label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: X, label: 'Rejected' }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const isLandlord = user?.user_type === 'landlord';

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
                {isLandlord ? 'Received Applications' : 'My Applications'}
              </h1>
              <p className="text-sm text-white/70">
                {isLandlord ? 'Review and manage tenant applications' : 'Track your rental applications'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-[#1A2F3A]">{applications.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-yellow-600">
              {applications.filter(a => a.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-blue-600">
              {applications.filter(a => a.status === 'under_review').length}
            </p>
            <p className="text-sm text-gray-500">Under Review</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-green-600">
              {applications.filter(a => a.status === 'approved').length}
            </p>
            <p className="text-sm text-gray-500">Approved</p>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-4">
              {isLandlord 
                ? 'Applications from potential tenants will appear here' 
                : 'Browse properties and submit your first application'}
            </p>
            {!isLandlord && (
              <Link 
                to="/browse"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-full hover:bg-[#2C4A52]"
              >
                Browse Properties
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div 
                key={app.id}
                className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedApp(app)}
                data-testid={`application-${app.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {app.listing?.images?.[0] && (
                      <img 
                        src={app.listing.images[0]} 
                        alt={app.listing.title}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-[#1A2F3A] mb-1">
                        {app.listing?.title || 'Property'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">{app.listing?.address}</p>
                      {isLandlord && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User size={14} /> {app.full_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={14} /> ${app.monthly_income?.toLocaleString()}/mo income
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(app.status)}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Landlord Actions */}
                {isLandlord && app.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app.id, 'under_review'); }}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                    >
                      Review
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app.id, 'approved'); }}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app.id, 'rejected'); }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Application Form Modal */}
      {showModal && listing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowModal(false); navigate('/dashboard/applications'); }}
          />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 my-8">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Apply for {listing.title}
            </h2>
            <p className="text-gray-500 mb-6">{listing.address} • ${listing.price}/mo</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User size={16} /> Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={form.full_name}
                    onChange={(e) => setForm({...form, full_name: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Current Address"
                    value={form.current_address}
                    onChange={(e) => setForm({...form, current_address: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Move-in & Occupants */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Desired Move-in Date</label>
                  <input
                    type="date"
                    value={form.move_in_date}
                    onChange={(e) => setForm({...form, move_in_date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Number of Occupants</label>
                  <input
                    type="number"
                    min="1"
                    value={form.num_occupants}
                    onChange={(e) => setForm({...form, num_occupants: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  />
                </div>
              </div>

              {/* Employment */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Briefcase size={16} /> Employment Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Employer Name"
                    value={form.employer}
                    onChange={(e) => setForm({...form, employer: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={form.job_title}
                    onChange={(e) => setForm({...form, job_title: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Monthly Income ($)"
                    value={form.monthly_income}
                    onChange={(e) => setForm({...form, monthly_income: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Length of Employment"
                    value={form.employment_length}
                    onChange={(e) => setForm({...form, employment_length: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  />
                </div>
              </div>

              {/* Pets */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_pets}
                    onChange={(e) => setForm({...form, has_pets: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-gray-700 flex items-center gap-2">
                    <PawPrint size={16} /> I have pets
                  </span>
                </label>
                {form.has_pets && (
                  <input
                    type="text"
                    placeholder="Pet details (type, breed, size)"
                    value={form.pet_details}
                    onChange={(e) => setForm({...form, pet_details: e.target.value})}
                    className="w-full mt-3 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  />
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Additional Notes</label>
                <textarea
                  value={form.additional_notes}
                  onChange={(e) => setForm({...form, additional_notes: e.target.value})}
                  placeholder="Tell the landlord about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); navigate('/dashboard/applications'); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52] flex items-center justify-center gap-2"
                  data-testid="submit-application-btn"
                >
                  <Send size={16} />
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedApp(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <h2 className="text-xl font-semibold text-[#1A2F3A] mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Application Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                {getStatusBadge(selectedApp.status)}
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Property</span>
                <span className="text-[#1A2F3A]">{selectedApp.listing?.title}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Applicant</span>
                <span className="text-[#1A2F3A]">{selectedApp.full_name}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Email</span>
                <span className="text-[#1A2F3A]">{selectedApp.email}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Phone</span>
                <span className="text-[#1A2F3A]">{selectedApp.phone}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Monthly Income</span>
                <span className="text-[#1A2F3A]">${selectedApp.monthly_income?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Move-in Date</span>
                <span className="text-[#1A2F3A]">{selectedApp.move_in_date}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Occupants</span>
                <span className="text-[#1A2F3A]">{selectedApp.num_occupants}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Has Pets</span>
                <span className="text-[#1A2F3A]">{selectedApp.has_pets ? 'Yes' : 'No'}</span>
              </div>
              {selectedApp.additional_notes && (
                <div>
                  <span className="text-gray-500 text-sm">Additional Notes</span>
                  <p className="text-[#1A2F3A] mt-1">{selectedApp.additional_notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedApp(null)}
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

export default Applications;
