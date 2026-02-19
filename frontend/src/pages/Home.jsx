import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Search, Sparkles, Bot, MapPin, Bed, Bath, Star, Shield, Trophy } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const featuredProperties = [
  {
    id: 1,
    title: 'Modern Downtown Condo',
    location: 'Vancouver, BC',
    type: 'Condo',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',
    price: 2800,
    beds: 2,
    baths: 2,
    sqft: 950
  },
  {
    id: 2,
    title: 'Cozy Kitsilano Character',
    location: 'Kitsilano, Vancouver',
    type: 'House',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600',
    price: 3200,
    beds: 3,
    baths: 1.5,
    sqft: 1400
  },
  {
    id: 3,
    title: 'Yaletown Luxury Loft',
    location: 'Yaletown, Vancouver',
    type: 'Loft',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
    price: 3500,
    beds: 1,
    baths: 1,
    sqft: 850
  },
  {
    id: 4,
    title: 'Mount Pleasant Studio',
    location: 'Mt Pleasant, Vancouver',
    type: 'Studio',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
    price: 1650,
    beds: 0,
    baths: 1,
    sqft: 450
  },
  {
    id: 5,
    title: 'West End High-Rise',
    location: 'West End, Vancouver',
    type: 'Apartment',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
    price: 2400,
    beds: 1,
    baths: 1,
    sqft: 650
  },
  {
    id: 6,
    title: 'Coal Harbour Penthouse',
    location: 'Coal Harbour, Vancouver',
    type: 'Penthouse',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600',
    price: 5500,
    beds: 3,
    baths: 2.5,
    sqft: 2200
  },
  {
    id: 7,
    title: 'Gastown Heritage Suite',
    location: 'Gastown, Vancouver',
    type: 'Suite',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    price: 2200,
    beds: 1,
    baths: 1,
    sqft: 720
  },
  {
    id: 8,
    title: 'Fairview Slopes Duplex',
    location: 'Fairview, Vancouver',
    type: 'Duplex',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600',
    price: 3800,
    beds: 2,
    baths: 2,
    sqft: 1100
  },
  {
    id: 9,
    title: 'Olympic Village Modern',
    location: 'Olympic Village, Vancouver',
    type: 'Condo',
    image: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=600',
    price: 2950,
    beds: 2,
    baths: 2,
    sqft: 980
  },
  {
    id: 10,
    title: 'South Granville Classic',
    location: 'South Granville, Vancouver',
    type: 'Apartment',
    image: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600',
    price: 2100,
    beds: 1,
    baths: 1,
    sqft: 600
  },
  {
    id: 11,
    title: 'Main Street Townhouse',
    location: 'Main St, Vancouver',
    type: 'Townhouse',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600',
    price: 3400,
    beds: 3,
    baths: 2,
    sqft: 1500
  },
  {
    id: 12,
    title: 'Commercial Drive Gem',
    location: 'Commercial Dr, Vancouver',
    type: 'Apartment',
    image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600',
    price: 1900,
    beds: 1,
    baths: 1,
    sqft: 550
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [topContractors, setTopContractors] = useState([]);

  useEffect(() => {
    axios.get(`${API}/contractors/search`).then(res => {
      const sorted = (res.data || []).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
      setTopContractors(sorted);
    }).catch(() => {});
  }, []);

  const handleNovaSearch = async (query) => {
    const searchText = query || searchQuery;
    if (!searchText.trim()) return;
    
    setIsSearching(true);
    // Navigate to browse with the search query for Nova
    navigate(`/browse?nova=${encodeURIComponent(searchText)}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNovaSearch();
    }
  };

  return (
    <MainLayout hideNovaButton={true}>
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center"
        data-testid="hero-section"
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://customer-assets.emergentagent.com/job_property-ai-hub-3/artifacts/8ejxvmv4_1.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2F3A]/90 via-[#1A2F3A]/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-2xl">
            <h1 
              className="display-xl text-white mb-6 uppercase"
              data-testid="hero-title"
            >
              Home Made<br />Simple
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-md leading-relaxed">
              Complete real estate marketplace for renting, buying, property management, and finding trusted contractors.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/about"
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
                data-testid="hero-cta"
              >
                <span className="text-sm tracking-wider">Our Story</span>
                <ArrowRight size={16} />
              </Link>
              <button className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <Play size={16} fill="white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Nova AI Search Bar Section */}
      <section className="relative -mt-24 z-20 px-6" data-testid="nova-search-section">
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
                placeholder="Ask Nova AI: Find apartments, calculate budget, get neighborhood tips..."
                className="w-full py-4 px-2 text-lg text-[#1A2F3A] placeholder-gray-400 outline-none bg-transparent"
                data-testid="nova-search-input"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50">
                  <p className="px-4 text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Sparkles size={12} /> Try asking
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

      {/* Featured Properties Grid */}
      <section className="section-lg bg-[#F5F5F0] pt-20" data-testid="featured-properties">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Featured Listings</p>
              <h2 
                className="text-3xl md:text-4xl text-[#1A2F3A]"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Discover Your Next Home
              </h2>
            </div>
            <Link 
              to="/browse"
              className="hidden md:flex items-center gap-2 text-[#1A2F3A] font-medium hover:gap-3 transition-all"
            >
              <span className="text-sm">View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Property Grid - 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProperties.map((property) => (
              <Link
                key={property.id}
                to="/browse"
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                data-testid={`property-card-${property.id}`}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#1A2F3A]">
                      {property.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-[#1A2F3A] rounded-full text-xs font-medium text-white">
                      ${property.price.toLocaleString()}/mo
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-[#1A2F3A] mb-1 group-hover:text-[#2C4A52] transition-colors line-clamp-1">
                    {property.title}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    <MapPin size={12} />
                    {property.location}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Bed size={14} />
                      {property.beds === 0 ? 'Studio' : `${property.beds} bed`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath size={14} />
                      {property.baths} bath
                    </span>
                    <span>{property.sqft} sqft</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile View All Button */}
          <div className="mt-8 text-center md:hidden">
            <Link 
              to="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-full"
            >
              View All Properties
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture in Motion */}
      <section className="section-lg bg-white" data-testid="about-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left Content */}
            <div>
              <h2 
                className="display-lg text-[#1A2F3A] mb-6"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Architecture<br />in Motion
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your complete real estate platform - from finding your perfect home to managing properties and connecting with trusted contractors. We bring innovation to every aspect of real estate.
              </p>
              <Link 
                to="/about"
                className="flex items-center gap-2 text-[#1A2F3A] font-medium hover:gap-4 transition-all"
              >
                <span className="text-sm tracking-wider uppercase">Our Services</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="stat-card">
                  <p className="stat-number">{stat.number}</p>
                  <p className="text-sm font-semibold text-[#1A2F3A] uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <p className="text-sm text-gray-500">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contractor Services Section */}
      <section className="section-md bg-white" data-testid="contractors-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Home Services</p>
              <h2 className="text-4xl text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Trusted Contractors
              </h2>
              <p className="text-gray-500 mt-2">Find verified professionals for every job</p>
            </div>
            <Link to="/contractors" className="flex items-center gap-2 text-[#1A2F3A] font-medium hover:gap-4 transition-all text-sm uppercase tracking-wider">
              Browse All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Plumbing', icon: '🔧' },
              { name: 'Electrical', icon: '⚡' },
              { name: 'Painting', icon: '🎨' },
              { name: 'Renovation', icon: '🏗' },
              { name: 'Landscaping', icon: '🌿' },
              { name: 'Cleaning', icon: '✨' },
            ].map((svc, i) => (
              <Link key={i} to={`/contractors?category=${svc.name.toLowerCase()}`}
                className="bg-[#F5F5F0] rounded-2xl p-6 text-center hover:bg-[#1A2F3A] hover:text-white transition-all group cursor-pointer">
                <p className="text-3xl mb-3">{svc.icon}</p>
                <p className="font-medium text-sm group-hover:text-white text-[#1A2F3A]">{svc.name}</p>
              </Link>
            ))}
          </div>
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
      <section className="section-md bg-[#1A2F3A]" data-testid="ai-tools-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Powered by AI</p>
            <h2 className="text-4xl text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Smart Tools for Smarter Living
            </h2>
            <p className="text-white/60 mt-2">Nova AI helps you at every step of your journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/report-issue" className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Issue Reporter</h3>
              <p className="text-white/60 text-sm">Upload a photo of any issue — our AI identifies the problem and matches you with the right contractor instantly.</p>
            </Link>
            <Link to="/document-analyzer" className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Lease Analyzer</h3>
              <p className="text-white/60 text-sm">Paste your lease agreement and get an instant fairness score, red flags, and negotiation tips powered by AI.</p>
            </Link>
            <Link to="/commute-optimizer" className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                <span className="text-2xl">🚇</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Commute Optimizer</h3>
              <p className="text-white/60 text-sm">Enter your workplace addresses and find properties ranked by commute time. No more guessing.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-md bg-[#F5F5F0]" data-testid="team-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Our Team</p>
              <div className="space-y-0">
                {team.map((member, i) => (
                  <div key={i} className="team-card">
                    <img src={member.image} alt={member.name} />
                    <div className="flex-1">
                      <p className="font-semibold text-[#1A2F3A]">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-400 text-xs">in</span>
                      <span className="text-gray-400 text-xs">tw</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div 
              className="relative rounded-3xl overflow-hidden h-[500px] img-overlay"
            >
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"
                alt="Architecture"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 p-8 z-10">
                <h3 
                  className="text-4xl text-white uppercase mb-2"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  Home Made<br />Simple
                </h3>
                <p className="text-white/70 text-sm mb-4">Your complete real estate solution</p>
                <Link 
                  to="/about"
                  className="flex items-center gap-2 text-white text-sm"
                >
                  Our Story <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
