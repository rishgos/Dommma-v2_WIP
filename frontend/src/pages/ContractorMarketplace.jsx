import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Star, MapPin, Clock, DollarSign, Shield,
  Phone, Mail, ChevronRight, Filter, Wrench, Zap, Droplets,
  Paintbrush, Hammer, Leaf, Sparkles, Calendar, Send, X, MessageSquare, Plus, Briefcase
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';
import ContractorReviews from '../components/reviews/ContractorReviews';
import ContractorLeaderboard from '../components/reviews/ContractorLeaderboard';
import MainLayout from '../components/layout/MainLayout';
import AddressAutocomplete from '../components/ui/AddressAutocomplete';
import { JobPostForm, JobCard, JobBidForm, BidsList } from '../components/jobs/JobComponents';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categoryIcons = {
  plumbing: Droplets, electrical: Zap, painting: Paintbrush,
  renovation: Hammer, carpentry: Hammer, landscaping: Leaf,
  cleaning: Sparkles, general: Wrench
};

const ContractorMarketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contractors, setContractors] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Job posting states
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [activeTab, setActiveTab] = useState('contractors'); // 'contractors' or 'jobs'
  const [selectedJobForBid, setSelectedJobForBid] = useState(null);
  const [selectedJobForBids, setSelectedJobForBids] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [contractorServices, setContractorServices] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingService, setBookingService] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    title: '', description: '', preferred_date: '', preferred_time: '', address: '', notes: ''
  });

  const categories = ['plumbing', 'electrical', 'painting', 'renovation', 'landscaping', 'cleaning'];

  useEffect(() => { 
    fetchContractors();
    fetchJobs();
  }, [searchQuery, selectedCategory]);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('specialty', selectedCategory);
      const res = await axios.get(`${API}/contractors/search?${params}`);
      setContractors(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      const res = await axios.get(`${API}/jobs?${params}`);
      setJobs(res.data);
    } catch (e) { console.error(e); } finally { setLoadingJobs(false); }
  };

  const handleJobViewBids = (job) => {
    if (user?.user_type === 'contractor') {
      setSelectedJobForBid(job);
    } else if (job.user_id === user?.id) {
      setSelectedJobForBids(job);
    } else {
      // Non-owner, non-contractor - redirect to login or show info
      if (!user) {
        navigate('/login');
      }
    }
  };

  const viewContractor = async (contractor) => {
    setSelectedContractor(contractor);
    try {
      const res = await axios.get(`${API}/contractors/${contractor.user_id}/services`);
      setContractorServices(res.data);
    } catch (e) { setContractorServices([]); }
  };

  const openBooking = (service, contractor) => {
    if (!user) { navigate('/login'); return; }
    setBookingService(service);
    setBookingForm({
      title: service?.title || '', description: '', preferred_date: '', preferred_time: '',
      address: '', notes: ''
    });
    setShowBooking(true);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      const contractor = selectedContractor;
      await axios.post(`${API}/bookings?customer_id=${user.id}`, {
        contractor_id: contractor.user_id,
        service_id: bookingService?.id || null,
        ...bookingForm
      });
      setShowBooking(false);
      alert('Booking request sent! The contractor will respond shortly.');
    } catch (e) {
      console.error(e);
      alert('Failed to submit booking.');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
    ));
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0]">
        {/* Page Header */}
        <header className="bg-[#1A2F3A] text-white px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {activeTab === 'contractors' ? 'Find Contractors' : 'Browse Jobs'}
                </h1>
                <p className="text-lg text-white/80">
                  {activeTab === 'contractors' ? 'Verified professionals for every job' : 'Open jobs waiting for your bid'}
                </p>
              </div>
              {user && user.user_type !== 'contractor' && (
                <button
                  onClick={() => setShowJobForm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#1A2F3A] rounded-full font-medium hover:bg-gray-100 transition-colors"
                  data-testid="post-job-btn"
                >
                  <Plus size={18} />
                  Post a Job
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('contractors')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'contractors' 
                    ? 'bg-white text-[#1A2F3A]' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Wrench size={16} />
                Find Contractors
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'jobs' 
                    ? 'bg-white text-[#1A2F3A]' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Briefcase size={16} />
                Browse Jobs
                {jobs.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-400 text-[#1A2F3A] rounded-full">{jobs.length}</span>
                )}
              </button>
            </div>

            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'contractors' ? 'Search contractors by name, specialty...' : 'Search jobs...'}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:bg-white/20 outline-none"
                data-testid="contractor-search-input"
              />
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Leaderboard Sidebar on larger screens */}
          <div className="lg:hidden mb-6">
            <ContractorLeaderboard limit={3} compact={false} />
          </div>

        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedCategory('')} className={`px-4 py-2 rounded-full text-sm transition-colors ${!selectedCategory ? 'bg-[#1A2F3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            All
          </button>
          {categories.map(cat => {
            const Icon = categoryIcons[cat] || Wrench;
            return (
              <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm capitalize transition-colors ${
                  selectedCategory === cat ? 'bg-[#1A2F3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`} data-testid={`category-${cat}`}>
                <Icon size={14} /> {cat}
              </button>
            );
          })}
        </div>

        {/* Results based on active tab */}
        {activeTab === 'contractors' ? (
          <>
            {/* Contractors Results */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-24 bg-gray-200 rounded-xl mb-4" /><div className="h-4 bg-gray-200 rounded w-2/3" /></div>)}
              </div>
            ) : contractors.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Wrench className="mx-auto mb-4 text-gray-300" size={64} />
                <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Contractors Found</h3>
                <p className="text-gray-500">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contractors.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => viewContractor(c)} data-testid={`contractor-card-${c.id}`}>
                    <div className="h-32 bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] relative p-5">
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        {c.verified && <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs"><Shield size={10} /> Verified</span>}
                        {c.insurance && <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">Insured</span>}
                      </div>
                      <div className="absolute bottom-0 left-5 translate-y-1/2">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-2xl font-bold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          {c.business_name?.charAt(0)}
                        </div>
                      </div>
                    </div>
                    <div className="pt-10 px-5 pb-5">
                      <h3 className="font-semibold text-[#1A2F3A] text-lg mb-1">{c.business_name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">{renderStars(c.rating)}</div>
                        <span className="text-sm text-gray-500">({c.review_count || 0})</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{c.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {c.specialties?.slice(0, 3).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-[#F5F5F0] text-gray-600 rounded text-xs capitalize">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1"><MapPin size={12} />{c.service_areas?.[0]}</span>
                        {c.hourly_rate && <span className="font-semibold text-[#1A2F3A]">${c.hourly_rate}/hr</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Jobs Results */}
            {loadingJobs ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-24 bg-gray-200 rounded-xl mb-4" /><div className="h-4 bg-gray-200 rounded w-2/3" /></div>)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Briefcase className="mx-auto mb-4 text-gray-300" size={64} />
                <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Jobs Posted Yet</h3>
                <p className="text-gray-500">
                  {user?.user_type === 'contractor' 
                    ? 'Check back later for new job opportunities' 
                    : 'Be the first to post a job and receive quotes from contractors'}
                </p>
                {user && user.user_type !== 'contractor' && (
                  <button
                    onClick={() => setShowJobForm(true)}
                    className="mt-4 px-6 py-2 bg-[#1A2F3A] text-white rounded-full font-medium hover:bg-[#2C4A52] transition-colors inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Post Your First Job
                  </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {jobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onViewBids={handleJobViewBids}
                    isOwner={job.user_id === user?.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
          </div>

          {/* Leaderboard Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8">
              <ContractorLeaderboard limit={5} />
            </div>
          </div>
        </div>
      </main>

      {/* Contractor Detail Modal */}
      {selectedContractor && !showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedContractor(null)} />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="h-40 bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] relative">
              <button onClick={() => setSelectedContractor(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
                <X size={20} />
              </button>
            </div>
            <div className="px-8 pb-8">
              <div className="-mt-12 mb-6">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center text-4xl font-bold text-[#1A2F3A] border-4 border-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {selectedContractor.business_name?.charAt(0)}
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {selectedContractor.business_name}
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">{renderStars(selectedContractor.rating)}<span className="text-sm text-gray-500 ml-1">{selectedContractor.rating} ({selectedContractor.review_count} reviews)</span></div>
                {selectedContractor.verified && <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"><Shield size={10} />Verified</span>}
              </div>
              <p className="text-gray-600 mb-6">{selectedContractor.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[#F5F5F0] rounded-xl p-4 text-center">
                  <p className="text-2xl font-semibold text-[#1A2F3A]">{selectedContractor.years_experience}</p>
                  <p className="text-xs text-gray-500">Years Exp.</p>
                </div>
                <div className="bg-[#F5F5F0] rounded-xl p-4 text-center">
                  <p className="text-2xl font-semibold text-[#1A2F3A]">{selectedContractor.completed_jobs || 0}</p>
                  <p className="text-xs text-gray-500">Jobs Done</p>
                </div>
                <div className="bg-[#F5F5F0] rounded-xl p-4 text-center">
                  <p className="text-2xl font-semibold text-[#1A2F3A]">${selectedContractor.hourly_rate}/hr</p>
                  <p className="text-xs text-gray-500">Rate</p>
                </div>
              </div>

              {selectedContractor.phone && (
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className="flex items-center gap-2 text-gray-600"><Phone size={14} />{selectedContractor.phone}</span>
                  {selectedContractor.email && <span className="flex items-center gap-2 text-gray-600"><Mail size={14} />{selectedContractor.email}</span>}
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.specialties?.map(s => (
                    <span key={s} className="px-3 py-1 bg-[#1A2F3A]/10 text-[#1A2F3A] rounded-full text-sm capitalize">{s}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Service Areas</p>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.service_areas?.map(a => (
                    <span key={a} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{a}</span>
                  ))}
                </div>
              </div>

              {contractorServices.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Services Offered</p>
                  <div className="space-y-3">
                    {contractorServices.map(svc => (
                      <div key={svc.id} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-xl">
                        <div>
                          <h4 className="font-medium text-[#1A2F3A]">{svc.title}</h4>
                          <p className="text-xs text-gray-500">{svc.duration_estimate}</p>
                        </div>
                        <div className="text-right">
                          {svc.price && <p className="font-semibold text-[#1A2F3A]">${svc.price}</p>}
                          <button onClick={() => openBooking(svc, selectedContractor)} className="text-xs text-[#1A2F3A] hover:underline mt-1" data-testid={`book-service-${svc.id}`}>
                            Book Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <MessageSquare size={14} /> Customer Reviews
                </p>
                <ContractorReviews 
                  contractorId={selectedContractor.user_id}
                  rating={selectedContractor.rating}
                  reviewCount={selectedContractor.review_count}
                />
              </div>

              <button onClick={() => openBooking(null, selectedContractor)} className="w-full py-4 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] flex items-center justify-center gap-2" data-testid="book-contractor-btn">
                <Calendar size={18} /> Request Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && selectedContractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBooking(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Book {selectedContractor.business_name}
            </h2>
            {bookingService && <p className="text-gray-500 mb-4">{bookingService.title} - ${bookingService.price}</p>}

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Service Needed</label>
                <input type="text" value={bookingForm.title} onChange={e => setBookingForm({ ...bookingForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="e.g., Kitchen sink repair" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Description</label>
                <textarea value={bookingForm.description} onChange={e => setBookingForm({ ...bookingForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none" rows={3} placeholder="Describe the work needed..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Preferred Date</label>
                  <input type="date" value={bookingForm.preferred_date} onChange={e => setBookingForm({ ...bookingForm, preferred_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Preferred Time</label>
                  <select value={bookingForm.preferred_time} onChange={e => setBookingForm({ ...bookingForm, preferred_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none">
                    <option value="">Select time</option>
                    <option value="morning">Morning (8-12)</option>
                    <option value="afternoon">Afternoon (12-5)</option>
                    <option value="evening">Evening (5-8)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Address</label>
                <AddressAutocomplete 
                  value={bookingForm.address} 
                  onChange={(val) => setBookingForm({ ...bookingForm, address: val })}
                  onSelect={(data) => setBookingForm({ ...bookingForm, address: data.formatted_address })}
                  placeholder="Service address" 
                  testId="booking-address-input"
                  showIcon={false}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBooking(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52] flex items-center justify-center gap-2" data-testid="confirm-booking-btn">
                  <Send size={16} /> Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Post Form Modal */}
      <JobPostForm
        isOpen={showJobForm}
        onClose={() => setShowJobForm(false)}
        onSuccess={() => {
          fetchJobs();
          setActiveTab('jobs');
        }}
        userId={user?.id}
      />

      {/* Job Bid Form Modal (for contractors) */}
      <JobBidForm
        job={selectedJobForBid}
        isOpen={!!selectedJobForBid}
        onClose={() => setSelectedJobForBid(null)}
        onSuccess={() => {
          fetchJobs();
          setSelectedJobForBid(null);
        }}
        contractorId={user?.id}
      />

      {/* Bids List Modal (for job owners) */}
      <BidsList
        job={selectedJobForBids}
        isOpen={!!selectedJobForBids}
        onClose={() => setSelectedJobForBids(null)}
        onAcceptBid={() => {
          fetchJobs();
          setSelectedJobForBids(null);
        }}
        userId={user?.id}
      />
      </div>
    </MainLayout>
  );
};

export default ContractorMarketplace;
