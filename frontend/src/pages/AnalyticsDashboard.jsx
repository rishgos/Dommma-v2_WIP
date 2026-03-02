import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Users, Home, DollarSign, FileText, Briefcase,
  TrendingUp, TrendingDown, Activity, Clock, RefreshCw,
  ArrowUpRight, ArrowDownRight, Building, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Simple chart component using CSS
function SimpleBarChart({ data, valueKey, labelKey, color = "#1A2F3A" }) {
  const maxValue = Math.max(...data.map(d => d[valueKey] || 0));
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
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

function StatCard({ icon: Icon, label, value, change, changeType, subtext, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    teal: "bg-teal-100 text-teal-600"
  };
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow" data-testid="stat-card">
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

function ActivityItem({ type, title, description, timestamp, icon }) {
  const iconMap = {
    user: Users,
    home: Home,
    dollar: DollarSign,
    document: FileText
  };
  const IconComponent = iconMap[icon] || Activity;
  
  const typeColors = {
    user_signup: "bg-blue-100 text-blue-600",
    new_listing: "bg-green-100 text-green-600",
    payment: "bg-purple-100 text-purple-600"
  };
  
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[type] || 'bg-gray-100 text-gray-600'}`}>
        <IconComponent size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A2F3A]">{title}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
      <div className="text-xs text-gray-400 flex-shrink-0">{formatTime(timestamp)}</div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [listingsPerf, setListingsPerf] = useState(null);
  const [revenuePeriod, setRevenuePeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  
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
      const [overviewRes, activityRes, revenueRes, listingsRes] = await Promise.all([
        axios.get(`${API}/api/analytics/overview`),
        axios.get(`${API}/api/analytics/activity?limit=10`),
        axios.get(`${API}/api/analytics/revenue?period=${revenuePeriod}`),
        axios.get(`${API}/api/analytics/listings-performance`)
      ]);
      
      setOverview(overviewRes.data);
      setActivity(activityRes.data);
      setRevenueData(revenueRes.data);
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
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2F3A] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                <BarChart3 className="text-[#1A2F3A]" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Platform performance and insights
              </p>
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
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            <StatCard 
              icon={Users}
              label="Total Users"
              value={overview?.users?.total || 0}
              change={`+${overview?.users?.new_last_7_days || 0} this week`}
              changeType={overview?.users?.new_last_7_days > 0 ? 'up' : 'neutral'}
              color="blue"
            />
            <StatCard 
              icon={Home}
              label="Active Listings"
              value={overview?.listings?.total_active || 0}
              change={`+${overview?.listings?.new_last_7_days || 0} this week`}
              changeType={overview?.listings?.new_last_7_days > 0 ? 'up' : 'neutral'}
              color="green"
            />
            <StatCard 
              icon={DollarSign}
              label="Total Revenue"
              value={formatCurrency(overview?.transactions?.total_revenue || 0)}
              subtext={`${overview?.transactions?.successful || 0} transactions`}
              color="purple"
            />
            <StatCard 
              icon={Briefcase}
              label="Contractors"
              value={overview?.contractors?.total || 0}
              subtext={`${overview?.contractors?.verification_rate || 0}% verified`}
              color="yellow"
            />
            <StatCard 
              icon={FileText}
              label="Documents"
              value={overview?.documents?.total || 0}
              subtext={`${overview?.documents?.completion_rate || 0}% signed`}
              color="teal"
            />
          </div>
          
          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* User Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                <Users size={20} />
                Users by Type
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
            
            {/* Listings by City */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                <Building size={20} />
                Listings by City
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
          
          {/* Listings Performance */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Price Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Price Distribution (Rentals)
              </h3>
              {listingsPerf?.price_distribution && listingsPerf.price_distribution.length > 0 ? (
                <SimpleBarChart 
                  data={listingsPerf.price_distribution}
                  labelKey="range"
                  valueKey="count"
                  color="#8B5CF6"
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No price data available</p>
              )}
            </div>
            
            {/* Property Types */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                <Home size={20} />
                Property Types
              </h3>
              {listingsPerf?.property_types && listingsPerf.property_types.length > 0 ? (
                <SimpleBarChart 
                  data={listingsPerf.property_types}
                  labelKey="type"
                  valueKey="count"
                  color="#F59E0B"
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No property type data available</p>
              )}
            </div>
          </div>
          
          {/* Activity Feed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1A2F3A] flex items-center gap-2">
                <Activity size={20} />
                Recent Activity
              </h3>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                Live feed
              </span>
            </div>
            
            {activity.length > 0 ? (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {activity.map((item, index) => (
                  <ActivityItem 
                    key={index}
                    type={item.type}
                    title={item.title}
                    description={item.description}
                    timestamp={item.timestamp}
                    icon={item.icon}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
          
          {/* Quick Stats Footer */}
          <div className="mt-8 bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-6 text-white">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{overview?.transactions?.success_rate || 0}%</div>
                <div className="text-sm text-white/70">Payment Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{overview?.contractors?.verification_rate || 0}%</div>
                <div className="text-sm text-white/70">Contractor Verification</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{overview?.documents?.completion_rate || 0}%</div>
                <div className="text-sm text-white/70">Document Completion</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{overview?.lease_assignments?.active || 0}</div>
                <div className="text-sm text-white/70">Active Lease Assignments</div>
              </div>
            </div>
          </div>
          
          {/* Last Updated */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Last updated: {overview?.generated_at ? new Date(overview.generated_at).toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
