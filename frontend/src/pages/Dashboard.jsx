import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Building2, Users, Wrench, FileText, DollarSign, 
  Search, Plus, Calendar, TrendingUp,
  ChevronRight, Heart, MapPin, Clock, Sparkles, 
  Briefcase, BarChart2, MessageSquare
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';
import PendingReviews from '../components/reviews/PendingReviews';
import NotificationPrompt from '../components/notifications/NotificationPrompt';
import UserRatingCard from '../components/ratings/UserRatingCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Renter Dashboard
const RenterDashboard = ({ userId }) => {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await axios.get(`${API}/listings`);
        setListings(response.data.slice(0, 4));
      } catch (err) {
        console.error(err);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="space-y-8" data-testid="renter-dashboard">
      {/* Pending Reviews */}
      <PendingReviews userId={userId} />
      
      {/* Pay Rent Card - Primary Action */}
      <div className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-1">Rent Payment</h3>
            <p className="text-white/70 text-sm">Next payment due: March 1, 2026</p>
            <p className="text-2xl font-bold mt-2">$2,400.00</p>
          </div>
          <Link 
            to="/payments" 
            className="flex items-center gap-2 px-6 py-3 bg-white text-[#1A2F3A] rounded-full font-medium hover:bg-gray-100 transition-colors"
            data-testid="pay-rent-btn"
          >
            <DollarSign size={18} />
            Pay Rent
          </Link>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
              <Search size={20} className="text-[#1A2F3A]" />
            </div>
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">12</p>
          <p className="text-sm text-gray-500">Saved Searches</p>
        </div>
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
              <Heart size={20} className="text-[#1A2F3A]" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">8</p>
          <p className="text-sm text-gray-500">Favorites</p>
        </div>
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
              <FileText size={20} className="text-[#1A2F3A]" />
            </div>
            <span className="text-xs text-green-500">Pending</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">3</p>
          <p className="text-sm text-gray-500">Applications</p>
        </div>
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
              <Calendar size={20} className="text-[#1A2F3A]" />
            </div>
            <span className="text-xs text-gray-500">Upcoming</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">2</p>
          <p className="text-sm text-gray-500">Viewings</p>
        </div>
      </div>

      {/* Recent Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Recommended Properties
          </h2>
          <Link to="/browse" className="text-sm text-[#1A2F3A] flex items-center gap-1 hover:gap-2 transition-all">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <Link 
              key={listing.id} 
              to={`/browse?listing=${listing.id}`}
              className="bg-white rounded-2xl overflow-hidden flex hover:shadow-lg transition-shadow cursor-pointer"
              data-testid={`recommended-listing-${listing.id}`}
            >
              <img 
                src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'}
                alt={listing.title}
                className="w-32 h-32 object-cover"
              />
              <div className="p-4 flex-1">
                <h3 className="font-semibold text-[#1A2F3A] mb-1">{listing.title}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin size={12} /> {listing.city}
                </p>
                <p className="text-lg font-semibold text-[#1A2F3A]">${listing.price?.toLocaleString()}/mo</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Your Rating Section */}
      <UserRatingCard userId={userId} showReviews={true} limit={3} />
    </div>
  );
};

// Landlord Dashboard
const LandlordDashboard = ({ userId }) => {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
              <Building2 size={20} className="text-[#1A2F3A]" />
            </div>
            <span className="text-xs text-green-500">+2 this month</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">12</p>
          <p className="text-sm text-gray-500">Properties</p>
        </div>
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
              <Users size={20} className="text-[#1A2F3A]" />
            </div>
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">24</p>
          <p className="text-sm text-gray-500">Tenants</p>
        </div>
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <span className="text-xs text-green-500">+12%</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">$34,500</p>
          <p className="text-sm text-gray-500">Monthly Revenue</p>
        </div>
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Wrench size={20} className="text-orange-600" />
            </div>
            <span className="text-xs text-orange-500">3 pending</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">7</p>
          <p className="text-sm text-gray-500">Maintenance</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[#1A2F3A] mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[
            { icon: DollarSign, text: 'Rent payment received from Unit 204', time: '2 hours ago', color: 'green' },
            { icon: FileText, text: 'New application for Ocean Wave Condo', time: '5 hours ago', color: 'blue' },
            { icon: Wrench, text: 'Maintenance request completed', time: '1 day ago', color: 'orange' },
            { icon: MessageSquare, text: 'New message from tenant John D.', time: '2 days ago', color: 'purple' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className={`w-10 h-10 rounded-xl bg-${item.color}-100 flex items-center justify-center`}>
                <item.icon size={18} className={`text-${item.color}-600`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#1A2F3A]">{item.text}</p>
                <p className="text-xs text-gray-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Your Rating Section */}
      <UserRatingCard userId={userId} showReviews={true} limit={3} />
    </div>
  );
};

// Contractor Dashboard
const ContractorDashboard = ({ userId }) => {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
              <Wrench size={20} className="text-[#1A2F3A]" />
            </div>
            <span className="text-xs text-green-500">Active</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">5</p>
          <p className="text-sm text-gray-500">Current Jobs</p>
        </div>
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <span className="text-xs text-blue-500">New</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">12</p>
          <p className="text-sm text-gray-500">Job Requests</p>
        </div>
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <span className="text-xs text-green-500">+8%</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">$12,400</p>
          <p className="text-sm text-gray-500">This Month</p>
        </div>
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-yellow-600" />
            </div>
            <span className="text-xs text-yellow-600">4.9/5</span>
          </div>
          <p className="text-2xl font-semibold text-[#1A2F3A]">98%</p>
          <p className="text-sm text-gray-500">Satisfaction</p>
        </div>
      </div>

      {/* Job Requests */}
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            New Job Requests
          </h2>
          <button className="text-sm text-[#1A2F3A] flex items-center gap-1">
            View All <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-4">
          {[
            { title: 'Plumbing Repair', location: 'Downtown Vancouver', budget: '$200-400', urgent: true },
            { title: 'Electrical Work', location: 'Kitsilano', budget: '$500-800', urgent: false },
            { title: 'HVAC Maintenance', location: 'Yaletown', budget: '$300-500', urgent: false },
          ].map((job, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#1A2F3A]">{job.title}</h3>
                  {job.urgent && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Urgent</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={12} /> {job.location}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#1A2F3A]">{job.budget}</p>
                <button className="text-sm text-[#1A2F3A] hover:underline">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Your Rating Section */}
      <UserRatingCard userId={userId} showReviews={true} limit={3} />
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="space-y-8" data-testid="dashboard-content">
      {/* Notification Prompt for new users */}
      <NotificationPrompt userId={user.id} />
      
      {user.user_type === 'renter' && <RenterDashboard userId={user.id} />}
      {user.user_type === 'landlord' && <LandlordDashboard userId={user.id} />}
      {user.user_type === 'contractor' && <ContractorDashboard userId={user.id} />}
    </div>
  );
};

export default Dashboard;
