import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, Users, Home, DollarSign, FileText, Briefcase,
  TrendingUp, TrendingDown, Activity, Clock, RefreshCw,
  ArrowUpRight, ArrowDownRight, Building, CheckCircle2, Star,
  Heart, Send, MessageSquare, Wrench, Award, Target, ChevronRight
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Simple chart component using CSS
function SimpleBarChart({ data, valueKey, labelKey, color = "#1A2F3A", maxItems = 10 }) {
  const displayData = data.slice(0, maxItems);
  const maxValue = Math.max(...displayData.map(d => d[valueKey] || 0));
  
  return (
    <div className="space-y-2">
      {displayData.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600 truncate">{item[labelKey]}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0}%`,
                backgroundColor: color 
              }}
            />
          </div>
          <div className="w-12 text-sm font-medium text-right">{item[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, changeType, subtext, color = "blue", onClick }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    teal: "bg-teal-100 text-teal-600",
    red: "bg-red-100 text-red-600"
  };
  
  return (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      data-testid="stat-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${changeType === 'up' ? 'text-green-600' : changeType === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
            {changeType === 'up' ? <ArrowUpRight size={16} /> : changeType === 'down' ? <ArrowDownRight size={16} /> : null}
            {change}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-[#1A2F3A] mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "#1A2F3A", label }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-sm"><span className="text-gray-600">{label}</span><span className="font-medium">{value}%</span></div>}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ========== RENTER DASHBOARD ==========
function RenterDashboard({ data, loading }) {
  const navigate = useNavigate();
  
  if (loading) return <LoadingState />;
  if (!data) return <EmptyState message="No analytics data available" />;
  
  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Saved Properties" value={data.favorites_count || 0} color="red" onClick={() => navigate('/favorites')} />
        <StatCard icon={FileText} label="Applications" value={data.applications?.total || 0} color="blue" onClick={() => navigate('/applications')} />
        <StatCard icon={CheckCircle2} label="Approved" value={data.applications?.approved || 0} color="green" />
        <StatCard icon={MessageSquare} label="Messages" value={(data.messages?.sent || 0) + (data.messages?.received || 0)} color="purple" onClick={() => navigate('/messages')} />
      </div>
      
      {/* Application Funnel */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
            <Target size={20} /> Application Status
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Pending Review', value: data.applications?.pending || 0, color: '#F59E0B' },
              { label: 'Approved', value: data.applications?.approved || 0, color: '#10B981' },
              { label: 'Rejected', value: data.applications?.rejected || 0, color: '#EF4444' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <span className="font-semibold text-[#1A2F3A]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
            <FileText size={20} /> Renter Profile
          </h3>
          <ProgressBar value={data.resume_completion || 0} label="Profile Completion" color="#1A2F3A" />
          <p className="text-sm text-gray-500 mt-4">
            {data.resume_completion < 50 
              ? 'Complete your renter profile to increase your approval chances!' 
              : data.resume_completion < 100 
                ? 'Almost there! Add more details to stand out.' 
                : 'Great! Your profile is complete.'}
          </p>
          <Link to="/my-resume" className="mt-4 inline-flex items-center gap-2 text-[#1A2F3A] font-medium hover:underline">
            Update Profile <ChevronRight size={16} />
          </Link>
        </div>
      </div>
      
      {/* Recent Favorites */}
      {data.recent_favorites?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
            <Heart size={20} /> Recently Saved
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recent_favorites.slice(0, 3).map((listing, i) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                  {listing.images?.[0] && <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#1A2F3A] truncate">{listing.title}</p>
                  <p className="text-sm text-gray-500">{listing.city}</p>
                  <p className="text-sm font-semibold text-[#1A2F3A]">${listing.price?.toLocaleString()}/mo</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== LANDLORD DASHBOARD ==========
function LandlordDashboard({ data, loading }) {
  const navigate = useNavigate();
  
  if (loading) return <LoadingState />;
  if (!data) return <EmptyState message="No analytics data available" />;
  
  const formatCurrency = (amount) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
  
  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building} label="Properties" value={data.properties?.total || 0} subtext={`${data.properties?.active || 0} active`} color="blue" onClick={() => navigate('/my-properties')} />
        <StatCard icon={DollarSign} label="Monthly Potential" value={formatCurrency(data.monthly_potential_revenue || 0)} color="green" />
        <StatCard icon={FileText} label="Applications" value={data.applications?.total || 0} subtext={`${data.applications?.pending || 0} pending`} color="purple" onClick={() => navigate('/applicant-ranking')} />
        <StatCard icon={Wrench} label="Maintenance" value={data.maintenance?.open || 0} subtext="open requests" color="yellow" onClick={() => navigate('/maintenance')} />
      </div>
      
      {/* Revenue & Applications */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <div className="space-y-4">
            <div>
              <p className="text-white/70 text-sm">Monthly Potential</p>
              <p className="text-3xl font-bold">{formatCurrency(data.monthly_potential_revenue || 0)}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Total Collected</p>
              <p className="text-2xl font-semibold">{formatCurrency(data.total_collected || 0)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
            <Target size={20} /> Application Funnel
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Total Received', value: data.applications?.total || 0, color: '#3B82F6' },
              { label: 'Under Review', value: data.applications?.pending || 0, color: '#F59E0B' },
              { label: 'Approved', value: data.applications?.approved || 0, color: '#10B981' },
              { label: 'Rejected', value: data.applications?.rejected || 0, color: '#EF4444' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-600">{item.label}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(item.value / (data.applications?.total || 1)) * 100}%`, backgroundColor: item.color }} />
                </div>
                <div className="w-8 text-sm font-medium text-right">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Top Performing Listings */}
      {data.listing_performance?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Top Performing Listings
          </h3>
          <div className="space-y-3">
            {data.listing_performance.map((listing, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-[#1A2F3A]">{listing.title}</p>
                  <p className="text-sm text-gray-500">${listing.price?.toLocaleString()}/mo</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#1A2F3A]">{listing.applications} applications</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {listing.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== CONTRACTOR DASHBOARD ==========
function ContractorDashboard({ data, loading }) {
  const navigate = useNavigate();
  
  if (loading) return <LoadingState />;
  if (!data) return <EmptyState message="No analytics data available" />;
  
  const formatCurrency = (amount) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
  
  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Jobs Completed" value={data.jobs?.completed || 0} color="green" />
        <StatCard icon={DollarSign} label="Total Earnings" value={formatCurrency(data.earnings?.total || 0)} color="purple" />
        <StatCard icon={Star} label="Average Rating" value={data.ratings?.average?.toFixed(1) || '0.0'} subtext={`${data.ratings?.total_reviews || 0} reviews`} color="yellow" />
        <StatCard icon={Target} label="Bid Win Rate" value={`${data.bids?.win_rate || 0}%`} subtext={`${data.bids?.won || 0} of ${data.bids?.total || 0}`} color="blue" />
      </div>
      
      {/* Earnings & Rating */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Earnings Overview</h3>
          <div className="space-y-4">
            <div>
              <p className="text-white/70 text-sm">Total Earnings</p>
              <p className="text-3xl font-bold">{formatCurrency(data.earnings?.total || 0)}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Pending Jobs</p>
              <p className="text-2xl font-semibold">{data.jobs?.pending || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
            <Star size={20} /> Rating Distribution
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-3">
                <div className="w-12 flex items-center gap-1 text-sm text-gray-600">
                  {rating} <Star size={12} className="text-yellow-500 fill-yellow-500" />
                </div>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${((data.ratings?.distribution?.[rating] || 0) / (data.ratings?.total_reviews || 1)) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-sm text-right">{data.ratings?.distribution?.[rating] || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Reviews */}
      {data.recent_reviews?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
            <MessageSquare size={20} /> Recent Reviews
          </h3>
          <div className="space-y-4">
            {data.recent_reviews.map((review, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-[#1A2F3A]">{review.customer_name}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className={j < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.review || 'No comment'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== PLATFORM DASHBOARD (Admin/Default) ==========
function PlatformDashboard({ overview, activity, listingsPerf, loading }) {
  const formatCurrency = (amount) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  
  if (loading) return <LoadingState />;
  
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={overview?.users?.total || 0} change={`+${overview?.users?.new_last_7_days || 0} this week`} changeType={overview?.users?.new_last_7_days > 0 ? 'up' : 'neutral'} color="blue" />
        <StatCard icon={Home} label="Active Listings" value={overview?.listings?.total_active || 0} change={`+${overview?.listings?.new_last_7_days || 0} this week`} changeType={overview?.listings?.new_last_7_days > 0 ? 'up' : 'neutral'} color="green" />
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(overview?.transactions?.total_revenue || 0)} subtext={`${overview?.transactions?.successful || 0} transactions`} color="purple" />
        <StatCard icon={Briefcase} label="Contractors" value={overview?.contractors?.total || 0} subtext={`${overview?.contractors?.verification_rate || 0}% verified`} color="yellow" />
        <StatCard icon={FileText} label="Documents" value={overview?.documents?.total || 0} subtext={`${overview?.documents?.completion_rate || 0}% signed`} color="teal" />
      </div>
      
      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
            <Users size={20} /> Users by Type
          </h3>
          {overview?.users?.by_type && Object.keys(overview.users.by_type).length > 0 ? (
            <SimpleBarChart 
              data={Object.entries(overview.users.by_type).map(([type, count]) => ({
                type: type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown',
                count
              }))}
              labelKey="type"
              valueKey="count"
              color="#3B82F6"
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No user data available</p>
          )}
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
            <Building size={20} /> Listings by City
          </h3>
          {overview?.listings?.by_city && Object.keys(overview.listings.by_city).length > 0 ? (
            <SimpleBarChart 
              data={Object.entries(overview.listings.by_city).map(([city, count]) => ({
                city: city || 'Unknown',
                count
              }))}
              labelKey="city"
              valueKey="count"
              color="#10B981"
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No listing data available</p>
          )}
        </div>
      </div>
      
      {/* Activity Feed */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1A2F3A] flex items-center gap-2">
            <Activity size={20} /> Recent Activity
          </h3>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} /> Live feed
          </span>
        </div>
        {activity?.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <Activity size={16} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1A2F3A]">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2F3A] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-20">
      <BarChart3 className="mx-auto text-gray-300 mb-4" size={48} />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [listingsPerf, setListingsPerf] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('role'); // 'role' or 'platform'
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [user, navigate]);
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch role-specific data
      const roleEndpoint = {
        renter: `/api/analytics/renter/${user.id}`,
        landlord: `/api/analytics/landlord/${user.id}`,
        contractor: `/api/analytics/contractor/${user.id}`,
      }[user.user_type];
      
      if (roleEndpoint) {
        const roleRes = await axios.get(`${API}${roleEndpoint}`);
        setRoleData(roleRes.data);
      }
      
      // Fetch platform data (for admins or platform view)
      const [overviewRes, activityRes, listingsRes] = await Promise.all([
        axios.get(`${API}/api/analytics/overview`),
        axios.get(`${API}/api/analytics/activity?limit=10`),
        axios.get(`${API}/api/analytics/listings-performance`)
      ]);
      
      setOverview(overviewRes.data);
      setActivity(activityRes.data);
      setListingsPerf(listingsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };
  
  const getRoleTitle = () => {
    const titles = {
      renter: 'Renter Analytics',
      landlord: 'Landlord Analytics',
      contractor: 'Contractor Analytics',
    };
    return titles[user?.user_type] || 'Analytics Dashboard';
  };
  
  const getRoleDescription = () => {
    const descriptions = {
      renter: 'Track your property search, applications, and saved listings',
      landlord: 'Monitor your properties, applications, and revenue',
      contractor: 'View your jobs, earnings, and customer reviews',
    };
    return descriptions[user?.user_type] || 'Platform performance and insights';
  };
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                <BarChart3 className="text-[#1A2F3A]" />
                {viewMode === 'role' ? getRoleTitle() : 'Platform Analytics'}
              </h1>
              <p className="text-gray-600 mt-2">
                {viewMode === 'role' ? getRoleDescription() : 'Platform-wide performance metrics'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="bg-white rounded-lg p-1 shadow-sm flex">
                <button
                  onClick={() => setViewMode('role')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'role' ? 'bg-[#1A2F3A] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  data-testid="view-role"
                >
                  My Analytics
                </button>
                <button
                  onClick={() => setViewMode('platform')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'platform' ? 'bg-[#1A2F3A] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  data-testid="view-platform"
                >
                  Platform
                </button>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-[#1A2F3A]"
                data-testid="refresh-analytics"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Content */}
          {viewMode === 'role' ? (
            <>
              {user?.user_type === 'renter' && <RenterDashboard data={roleData} loading={loading} />}
              {user?.user_type === 'landlord' && <LandlordDashboard data={roleData} loading={loading} />}
              {user?.user_type === 'contractor' && <ContractorDashboard data={roleData} loading={loading} />}
              {!['renter', 'landlord', 'contractor'].includes(user?.user_type) && (
                <PlatformDashboard overview={overview} activity={activity} listingsPerf={listingsPerf} loading={loading} />
              )}
            </>
          ) : (
            <PlatformDashboard overview={overview} activity={activity} listingsPerf={listingsPerf} loading={loading} />
          )}
          
          {/* Last Updated */}
          <p className="text-xs text-gray-400 text-center mt-8">
            Last updated: {roleData?.generated_at ? new Date(roleData.generated_at).toLocaleString() : overview?.generated_at ? new Date(overview.generated_at).toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
