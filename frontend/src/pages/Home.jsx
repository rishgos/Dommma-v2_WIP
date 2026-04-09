import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Sparkles, Bot, MapPin, Bed, Bath, Star, Shield, Trophy, Square, Building2, DollarSign, FileText, Briefcase, Users, Image, TrendingUp, Zap, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/layout/MainLayout';
import ServiceShowcase from '../components/ServiceShowcase';
import NovaChat from '../components/chat/NovaChat';
import { useAuth } from '../App';
import axios from 'axios';
import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import FeaturedGrid from '../components/home/FeaturedGrid';
import { FadeIn, ScrollReveal, StaggerChildren, TiltCard, GradientOrbs } from '../components/motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sample properties shown when database is empty (fallback demo data)
const sampleFeaturedProperties = [
  {
    id: 'sample-1',
    title: 'Modern Downtown Condo',
    address: 'Downtown',
    city: 'Vancouver, BC',
    property_type: 'Condo',
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600'],
    price: 2800,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 950,
    isSample: true
  },
  {
    id: 'sample-2',
    title: 'Cozy Kitsilano Character',
    address: 'Kitsilano',
    city: 'Vancouver',
    property_type: 'House',
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600'],
    price: 3200,
    bedrooms: 3,
    bathrooms: 1.5,
    sqft: 1400,
    isSample: true
  },
  {
    id: 'sample-3',
    title: 'Yaletown Luxury Loft',
    address: 'Yaletown',
    city: 'Vancouver',
    property_type: 'Loft',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'],
    price: 3500,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 850,
    isSample: true
  },
  {
    id: 'sample-4',
    title: 'Mount Pleasant Studio',
    address: 'Mt Pleasant',
    city: 'Vancouver',
    property_type: 'Studio',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'],
    price: 1650,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 450,
    isSample: true
  },
  {
    id: 'sample-5',
    title: 'West End High-Rise',
    address: 'West End',
    city: 'Vancouver',
    property_type: 'Apartment',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'],
    price: 2400,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    isSample: true
  },
  {
    id: 'sample-6',
    title: 'Coal Harbour Penthouse',
    address: 'Coal Harbour',
    city: 'Vancouver',
    property_type: 'Penthouse',
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600'],
    price: 5500,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 2200,
    isSample: true
  },
  {
    id: 'sample-7',
    title: 'Gastown Heritage Suite',
    address: 'Gastown',
    city: 'Vancouver',
    property_type: 'Suite',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],
    price: 2200,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 720,
    isSample: true
  },
  {
    id: 'sample-8',
    title: 'Fairview Slopes Duplex',
    address: 'Fairview',
    city: 'Vancouver',
    property_type: 'Duplex',
    images: ['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600'],
    price: 3800,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    isSample: true
  },
];

const stats = [
  { number: '200+', label: 'Properties', desc: 'Premium listings across Vancouver' },
  { number: '100%', label: 'Happy Clients', desc: 'Satisfaction guaranteed' },
  { number: '900K', label: 'Square Feet', desc: 'Managed properties' },
  { number: '50+', label: 'Contractors', desc: 'Verified professionals' },
];

const team = [
  { name: 'Jayraj Panchal', role: 'Founder', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { name: 'Monika Aggarwal', role: 'Founder', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { name: 'Geoffrey Routledge', role: 'Founder', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
  { name: 'Rishabh Goswami', role: 'Founder', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200' },
];

const suggestedPrompts = [
  "Pet-friendly apartments under $2500",
  "2 bedroom near SkyTrain",
  "I work from home and need natural light",
  "Best neighborhoods for families"
];

const Home = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [topContractors, setTopContractors] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    // Fetch contractors
    axios.get(`${API}/contractors/search`).then(res => {
      const sorted = (res.data || []).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
      setTopContractors(sorted);
    }).catch(() => {});
    
    // Fetch sale listings
    axios.get(`${API}/listings?listing_type=sale`).then(res => {
      setSaleListings((res.data || []).slice(0, 4));
    }).catch(() => {});

    // Fetch featured rental properties from database
    axios.get(`${API}/listings?listing_type=rent&limit=50&sort=featured`).then(res => {
      const listings = res.data || [];
      if (listings.length > 0) {
        // Use real listings from database (up to 50 for 5x10 grid)
        setFeaturedProperties(listings.slice(0, 50));
      } else {
        // Fallback to sample data if database is empty
        setFeaturedProperties(sampleFeaturedProperties);
      }
      setLoadingListings(false);
    }).catch(() => {
      // On error, use sample data
      setFeaturedProperties(sampleFeaturedProperties);
      setLoadingListings(false);
    });
  }, []);

  const [showNovaChat, setShowNovaChat] = useState(false);
  
  const handleNovaSearch = async (query) => {
    const searchText = query || searchQuery;
    if (!searchText.trim()) return;
    
    setIsSearching(true);
    // Open Nova chat with the query instead of navigating away
    setShowNovaChat(true);
    // Store the initial query to pass to chat
    sessionStorage.setItem('novaInitialQuery', searchText);
    setIsSearching(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNovaSearch();
    }
  };

  return (
    <MainLayout>
      {/* Nova Chat Modal triggered from Homepage Search */}
      {showNovaChat && (
        <NovaChat 
          isOpenProp={true} 
          onClose={() => {
            setShowNovaChat(false);
            sessionStorage.removeItem('novaInitialQuery');
          }}
          initialQuery={sessionStorage.getItem('novaInitialQuery') || searchQuery}
        />
      )}

      {/* Hero Section — Parallax + TextReveal */}
      <HeroSection />

      {/* Nova AI Search Bar Section */}
      <section className="relative -mt-16 z-20 px-6 mb-8" data-testid="nova-search-section">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-full shadow-2xl p-2 flex items-center gap-3">
            {/* Nova Icon */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] flex items-center justify-center ml-1">
              <Bot className="text-white" size={24} />
            </div>
            
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={t('hero.askNova')}
                className="w-full py-4 px-2 text-lg text-[#1A2F3A] placeholder-gray-400 outline-none bg-transparent"
                data-testid="nova-search-input"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50">
                  <p className="px-4 text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Sparkles size={12} /> {i18n.language === 'fr' ? 'Essayez de demander' : 'Try asking'}
                  </p>
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => { setSearchQuery(prompt); handleNovaSearch(prompt); }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-[#F5F5F0] transition-colors text-sm"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <button
              onClick={() => handleNovaSearch()}
              disabled={isSearching || !searchQuery.trim()}
              className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] flex items-center justify-center text-white hover:shadow-lg transition-all disabled:opacity-50 mr-1"
              data-testid="nova-search-button"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search size={20} />
              )}
            </button>
          </div>
          
          {/* Helper Text */}
          <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-[#1A2F3A]" />
            Powered by Nova AI — Ask anything about properties, budgets, or neighborhoods
          </p>
        </div>
      </section>

      {/* Role-Based Quick Actions */}
      {user && (
        <section className="bg-white py-8 border-b border-gray-100" data-testid="role-based-content">
          <div className="max-w-7xl mx-auto px-6">
            {user.user_type === 'landlord' && (
              <div className="grid md:grid-cols-4 gap-4">
                <Link to="/my-properties" className="group p-5 rounded-2xl bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] text-white hover:shadow-lg transition-all">
                  <Building2 className="mb-3" size={24} />
                  <h3 className="font-semibold mb-1">Manage Properties</h3>
                  <p className="text-sm text-white/70">Add, edit, and manage your listings</p>
                </Link>
                <Link to="/campaigns" className="group p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <Zap className="mb-3 text-[#1A2F3A]" size={24} />
                  <h3 className="font-semibold text-[#1A2F3A] mb-1">Promote Listings</h3>
                  <p className="text-sm text-gray-500">Boost visibility and get more leads</p>
                </Link>
                <Link to="/landlord-earnings" className="group p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <DollarSign className="mb-3 text-[#1A2F3A]" size={24} />
                  <h3 className="font-semibold text-[#1A2F3A] mb-1">Earnings Dashboard</h3>
                  <p className="text-sm text-gray-500">Track income, vacancy, and ROI</p>
                </Link>
                <Link to="/virtual-staging" className="group p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <Wand2 className="mb-3 text-[#1A2F3A]" size={24} />
                  <h3 className="font-semibold text-[#1A2F3A] mb-1">Virtual Staging</h3>
                  <p className="text-sm text-gray-500">Stage empty rooms with AI</p>
                </Link>
              </div>
            )}
            {user.user_type === 'renter' && (
              <div className="grid md:grid-cols-4 gap-4">
                <Link to="/browse" className="group p-5 rounded-2xl bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] text-white hover:shadow-lg transition-all">
                  <Search className="mb-3" size={24} />
                  <h3 className="font-semibold mb-1">Find Your Home</h3>
                  <p className="text-sm text-white/70">Browse listings with map view</p>
                </Link>
                <Link to="/applications" className="group p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <FileText className="mb-3 text-[#1A2F3A]" size={24} />
                  <h3 className="font-semibold text-[#1A2F3A] mb-1">My Applications</h3>
                  <p className="text-sm text-gray-500">Track your rental applications</p>
                </Link>
                <Link to="/payments" className="group p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <DollarSign className="mb-3 text-[#1A2F3A]" size={24} />
                  <h3 className="font-semibold text-[#1A2F3A] mb-1">Pay Rent</h3>
                  <p className="text-sm text-gray-500">Manage payments and invoices</p>
                </Link>
                <Link to="/document-review" className="group p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <Sparkles className="mb-3 text-[#1A2F3A]" size={24} />
                  <h3 className="font-semibold text-[#1A2F3A] mb-1">AI Lease Review</h3>
                  <p className="text-sm text-gray-500">Get AI analysis of your lease</p>
                </Link>
              </div>
            )}
            {user.user_type === 'contractor' && (
              <div className="grid md:grid-cols-4 gap-4">
                <Link to="/jobs" className="group p-5 rounded-2xl bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] text-white hover:shadow-lg transition-all">
                  <Briefcase className="mb-3" size={24} />
                  <h3 className="font-semibold mb-1">Browse Jobs</h3>
                  <p className="text-sm text-white/70">Find new service requests</p>
                </Link>
                <Link to="/contractor-profile" className="group p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <Users className="mb-3 text-[#1A2F3A]" size={24} />
                  <h3 className="font-semibold text-[#1A2F3A] mb-1">My Profile</h3>
                  <p className="text-sm text-gray-500">Update your business profile</p>
                </Link>
                <Link to="/portfolio" className="group p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <Image className="mb-3 text-[#1A2F3A]" size={24} />
                  <h3 className="font-semibold text-[#1A2F3A] mb-1">Portfolio</h3>
                  <p className="text-sm text-gray-500">Showcase your best work</p>
                </Link>
                <Link to="/analytics" className="group p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <TrendingUp className="mb-3 text-[#1A2F3A]" size={24} />
                  <h3 className="font-semibold text-[#1A2F3A] mb-1">Analytics</h3>
                  <p className="text-sm text-gray-500">Track your performance</p>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Service Showcase */}
      <ServiceShowcase />

      {/* Featured Properties Grid — Staggered + Shimmer */}
      <FeaturedGrid properties={featuredProperties} loading={loadingListings} />

      {/* Architecture in Motion — Animated Counters */}
      <StatsSection />

      {/* Properties For Sale Section */}
      {saleListings.length > 0 && (
        <section className="section-md bg-white" data-testid="sale-listings-section">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Buy Property</p>
                <h2 className="text-4xl text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Properties For Sale
                </h2>
              </div>
              <Link to="/browse?type=sale" className="flex items-center gap-2 text-[#1A2F3A] font-medium hover:gap-4 transition-all text-sm uppercase tracking-wider">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {saleListings.map(listing => (
                <Link key={listing.id} to="/browse" className="group bg-[#F5F5F0] rounded-2xl overflow-hidden hover:shadow-xl transition-all" data-testid={`sale-card-${listing.id}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">For Sale</span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#1A2F3A]">${listing.price?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#1A2F3A] mb-1 line-clamp-1">{listing.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-3"><MapPin size={12} />{listing.address}, {listing.city}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><Bed size={14} />{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}</span>
                      <span className="flex items-center gap-1"><Bath size={14} />{listing.bathrooms} bath</span>
                      <span>{listing.sqft} sqft</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contractor Services Section */}
      <section className="section-md bg-white dark:bg-[#151B22]" data-testid="contractors-section">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Home Services</p>
                <h2 className="text-4xl text-[#1A2F3A] dark:text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Trusted Contractors
                </h2>
                <p className="text-gray-500 mt-2">Find verified professionals for every job</p>
              </div>
              <Link to="/contractors" className="flex items-center gap-2 text-[#1A2F3A] dark:text-[#C4A962] font-medium hover:gap-4 transition-all text-sm uppercase tracking-wider">
                Browse All <ArrowRight size={16} />
              </Link>
            </div>
          </FadeIn>
          <StaggerChildren staggerDelay={0.06} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Plumbing', icon: '🔧' },
              { name: 'Electrical', icon: '⚡' },
              { name: 'Painting', icon: '🎨' },
              { name: 'Renovation', icon: '🏗' },
              { name: 'Landscaping', icon: '🌿' },
              { name: 'Cleaning', icon: '✨' },
            ].map((svc, i) => (
              <Link key={i} to={`/contractors?category=${svc.name.toLowerCase()}`}
                className="bg-[#F5F5F0] dark:bg-[#1A2332] rounded-2xl p-6 text-center hover:bg-[#1A2F3A] hover:text-white transition-all group cursor-pointer hover:-translate-y-1">
                <p className="text-3xl mb-3">{svc.icon}</p>
                <p className="font-medium text-sm group-hover:text-white text-[#1A2F3A] dark:text-white">{svc.name}</p>
              </Link>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Contractor Leaderboard */}
      {topContractors.length > 0 && (
        <section className="section-md bg-white" data-testid="contractor-leaderboard">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Top Rated</p>
                <h2 className="text-4xl text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Contractor Leaderboard
                </h2>
                <p className="text-gray-500 mt-2">Highest rated professionals on DOMMMA</p>
              </div>
              <Link to="/contractors" className="flex items-center gap-2 text-[#1A2F3A] font-medium hover:gap-4 transition-all text-sm uppercase tracking-wider">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {topContractors.map((c, i) => (
                <Link key={c.id} to="/contractors" className="group relative bg-[#F5F5F0] rounded-2xl p-6 hover:shadow-lg transition-all">
                  {i === 0 && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                      <Trophy size={18} className="text-yellow-900" />
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-[#1A2F3A] flex items-center justify-center text-white text-2xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      {c.business_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A2F3A]">{c.business_name}</h3>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, j) => (
                          <Star key={j} size={12} className={j < Math.round(c.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">{c.rating || 0}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {c.specialties?.slice(0, 2).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-white text-gray-600 rounded text-xs capitalize">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.verified && <Shield size={14} className="text-green-600" />}
                      <span className="text-sm font-semibold text-[#1A2F3A]">${c.hourly_rate}/hr</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Tools Section */}
      <section className="section-md bg-[#1A2F3A] relative overflow-hidden" data-testid="ai-tools-section">
        <GradientOrbs
          orbs={[
            { color: 'rgba(196, 169, 98, 0.1)', size: 400, x: '80%', y: '10%', delay: 0 },
            { color: 'rgba(44, 74, 82, 0.15)', size: 350, x: '10%', y: '80%', delay: 2 },
          ]}
        />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn className="text-center mb-12">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Powered by AI</p>
            <h2 className="text-4xl text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Smart Tools for Smarter Living
            </h2>
            <p className="text-white/60 mt-2">Nova AI helps you at every step of your journey</p>
          </FadeIn>
          <StaggerChildren staggerDelay={0.1} className="grid md:grid-cols-3 gap-6">
            {[
              { to: '/report-issue', icon: '📸', title: 'Smart Issue Reporter', desc: 'Upload a photo of any issue — our AI identifies the problem and matches you with the right contractor instantly.' },
              { to: '/document-analyzer', icon: '📄', title: 'Lease Analyzer', desc: 'Paste your lease agreement and get an instant fairness score, red flags, and negotiation tips powered by AI.' },
              { to: '/commute-optimizer', icon: '🚇', title: 'Commute Optimizer', desc: 'Enter your workplace addresses and find properties ranked by commute time. No more guessing.' },
            ].map((tool, i) => (
              <TiltCard key={i} tiltAmount={8} className="rounded-2xl">
                <Link to={tool.to} className="block bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group h-full">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                    <span className="text-2xl">{tool.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{tool.title}</h3>
                  <p className="text-white/60 text-sm">{tool.desc}</p>
                </Link>
              </TiltCard>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-md bg-[#F5F5F0] dark:bg-[#0F1419]" data-testid="team-section">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Our Team</p>
          </FadeIn>
          <StaggerChildren staggerDelay={0.1} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div key={i} className="bg-white dark:bg-[#1A2332] rounded-xl p-4 text-center hover:shadow-lg hover:-translate-y-1 transition-all">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover ring-2 ring-[#1A2F3A]/10"
                />
                <p className="font-semibold text-[#1A2F3A] dark:text-white">{member.name}</p>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
