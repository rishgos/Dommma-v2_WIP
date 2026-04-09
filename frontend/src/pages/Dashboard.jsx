import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, Building2, Users, Wrench, FileText, DollarSign,
  Search, Plus, Calendar, TrendingUp,
  ChevronRight, Heart, MapPin, Clock, Sparkles,
  Briefcase, BarChart2, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import axios from 'axios';
import PendingReviews from '../components/reviews/PendingReviews';
import NotificationPrompt from '../components/notifications/NotificationPrompt';
import UserRatingCard from '../components/ratings/UserRatingCard';
import AnimatedStatCard from '../components/dashboard/AnimatedStatCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { FadeIn } from '../components/motion';

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
      
      {/* Quick Stats — Animated */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStatCard icon={Search} label="Saved Searches" value={12} badge="Active" index={0} />
        <AnimatedStatCard icon={Heart} label="Favorites" value={8} badge="Total" index={1} />
        <AnimatedStatCard icon={FileText} label="Applications" value={3} badge="Pending" badgeColor="text-green-500" index={2} />
        <AnimatedStatCard icon={Calendar} label="Viewings" value={2} badge="Upcoming" index={3} />
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
      {/* Quick Stats — Animated */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStatCard icon={Building2} label="Properties" value={12} badge="+2 this month" badgeColor="text-green-500" index={0} />
        <AnimatedStatCard icon={Users} label="Tenants" value={24} badge="Active" index={1} />
        <AnimatedStatCard icon={DollarSign} label="Monthly Revenue" value={34500} prefix="$" badge="+12%" badgeColor="text-green-500" iconBg="bg-green-100" iconColor="text-green-600" index={2} />
        <AnimatedStatCard icon={Wrench} label="Maintenance" value={7} badge="3 pending" badgeColor="text-orange-500" iconBg="bg-orange-100" iconColor="text-orange-600" index={3} />
      </div>

      {/* Recent Activity — Animated Feed */}
      <ActivityFeed
        title="Recent Activity"
        items={[
          { icon: DollarSign, text: 'Rent payment received from Unit 204', time: '2 hours ago', color: 'green' },
          { icon: FileText, text: 'New application for Ocean Wave Condo', time: '5 hours ago', color: 'blue' },
          { icon: Wrench, text: 'Maintenance request completed', time: '1 day ago', color: 'orange' },
          { icon: MessageSquare, text: 'New message from tenant John D.', time: '2 days ago', color: 'purple' },
        ]}
      />
      
      {/* Your Rating Section */}
      <UserRatingCard userId={userId} showReviews={true} limit={3} />
    </div>
  );
};

// Contractor Dashboard
const ContractorDashboard = ({ userId }) => {
  return (
    <div className="space-y-8">
      {/* Quick Stats — Animated */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStatCard icon={Wrench} label="Current Jobs" value={5} badge="Active" badgeColor="text-green-500" index={0} />
        <AnimatedStatCard icon={FileText} label="Job Requests" value={12} badge="New" badgeColor="text-blue-500" iconBg="bg-blue-100" iconColor="text-blue-600" index={1} />
        <AnimatedStatCard icon={DollarSign} label="This Month" value={12400} prefix="$" badge="+8%" badgeColor="text-green-500" iconBg="bg-green-100" iconColor="text-green-600" index={2} />
        <AnimatedStatCard icon={TrendingUp} label="Satisfaction" value={98} suffix="%" badge="4.9/5" badgeColor="text-yellow-600" iconBg="bg-yellow-100" iconColor="text-yellow-600" index={3} />
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
