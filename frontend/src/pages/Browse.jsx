import React, { useState, useEffect } from 'react';
import { Search, Bed, Bath, DollarSign, MapPin, Heart, Sparkles, X, SlidersHorizontal, Bot } from 'lucide-react';
import axios from 'axios';
import NovaChat from '../components/chat/NovaChat';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Browse = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    bedrooms: '',
    bathrooms: '',
    minPrice: '',
    maxPrice: '',
    petFriendly: false
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchListings();
    seedData();
  }, []);

  const seedData = async () => {
    try {
      await axios.post(`${API}/seed`);
    } catch (error) {
      console.log('Seed may already exist');
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
      if (filters.bathrooms) params.append('bathrooms', filters.bathrooms);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      if (filters.petFriendly) params.append('pet_friendly', 'true');
      if (filters.search) params.append('city', filters.search);

      const response = await axios.get(`${API}/listings?${params.toString()}`);
      setListings(response.data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchListings();
    }, 500);
    return () => clearTimeout(debounce);
  }, [filters]);

  const getMatchScore = () => Math.floor(Math.random() * 20) + 80;

  return (
    <div className="min-h-screen bg-[#f7fafc]">
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 py-4 px-6"
        style={{ background: 'rgba(102, 126, 234, 0.95)', backdropFilter: 'blur(12px)' }}
        data-testid="browse-header"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a 
            href="/" 
            className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}
            data-testid="browse-logo"
          >
            DOMMMA<sup className="text-xs">®</sup>
          </a>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by city or neighborhood..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-12 pr-4 py-3 rounded-full border-0 focus:ring-2 focus:ring-white/50 outline-none"
                data-testid="search-input"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            data-testid="filters-toggle"
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div 
          className="fixed top-20 left-0 right-0 z-30 p-6 bg-white shadow-xl border-b"
          data-testid="filters-panel"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Bedrooms</label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#667eea] outline-none"
                  data-testid="filter-bedrooms"
                >
                  <option value="">Any</option>
                  <option value="0">Studio</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Bathrooms</label>
                <select
                  value={filters.bathrooms}
                  onChange={(e) => setFilters({...filters, bathrooms: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#667eea] outline-none"
                  data-testid="filter-bathrooms"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Min Price</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#667eea] outline-none"
                  data-testid="filter-min-price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Max Price</label>
                <input
                  type="number"
                  placeholder="No max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#667eea] outline-none"
                  data-testid="filter-max-price"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.petFriendly}
                    onChange={(e) => setFilters({...filters, petFriendly: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-[#667eea] focus:ring-[#667eea]"
                    data-testid="filter-pet-friendly"
                  />
                  <span className="text-gray-700">Pet Friendly</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Listings */}
            <div className="space-y-6" data-testid="listings-container">
              <div className="flex items-center justify-between">
                <h1 
                  className="text-2xl font-bold"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
                >
                  {loading ? 'Loading...' : `${listings.length} Properties Found`}
                </h1>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl">
                  <MapPin className="mx-auto mb-4 text-gray-300" size={48} />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No listings found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search in a different area.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {listings.map((listing) => {
                    const matchScore = getMatchScore();
                    return (
                      <div
                        key={listing.id}
                        onClick={() => setSelectedListing(listing)}
                        className="bg-white rounded-2xl overflow-hidden cursor-pointer card-hover border border-gray-100"
                        data-testid={`listing-card-${listing.id}`}
                      >
                        <div className="flex">
                          <div className="w-40 h-40 flex-shrink-0">
                            <img 
                              src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Sparkles className="text-[#667eea]" size={14} />
                                  <span className="text-sm font-semibold text-[#667eea]">{matchScore}% Match</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800">{listing.title}</h3>
                              </div>
                              <button 
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                onClick={(e) => { e.stopPropagation(); }}
                              >
                                <Heart size={20} className="text-gray-400" />
                              </button>
                            </div>
                            <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
                              <MapPin size={14} />
                              {listing.address}, {listing.city}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <Bed size={14} /> {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bath size={14} /> {listing.bathrooms} bath
                              </span>
                              <span>{listing.sqft} sqft</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xl font-bold text-[#667eea]">
                                ${listing.price.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span>
                              </p>
                              {listing.pet_friendly && (
                                <span className="px-2 py-1 rounded-full text-xs bg-[#4fd1c5]/20 text-[#4fd1c5] font-medium">
                                  Pet Friendly
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Map Placeholder */}
            <div className="hidden lg:block sticky top-24 h-[calc(100vh-8rem)]">
              <div 
                className="w-full h-full rounded-2xl overflow-hidden relative"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1730724655710-5b9bd9c68349?w=1200)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                data-testid="map-container"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-12">
                  <div className="text-center text-white">
                    <MapPin className="mx-auto mb-3" size={40} />
                    <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Interactive Map
                    </h3>
                    <p className="text-white/80">Coming Soon - Explore Vancouver neighborhoods</p>
                  </div>
                </div>
                
                {/* Map Pins Overlay */}
                {listings.slice(0, 6).map((listing, i) => (
                  <div 
                    key={listing.id}
                    className="absolute w-10 h-10 rounded-full bg-[#667eea] text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform shadow-lg"
                    style={{ 
                      top: `${20 + (i * 12)}%`, 
                      left: `${15 + (i * 13)}%`,
                      animation: `fadeInUp 0.5s ease ${i * 0.1}s backwards`
                    }}
                    onClick={() => setSelectedListing(listing)}
                    data-testid={`map-pin-${listing.id}`}
                  >
                    ${Math.floor(listing.price/1000)}k
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-testid="listing-modal"
        >
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedListing(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedListing(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50"
              data-testid="close-modal-btn"
            >
              <X size={20} />
            </button>
            
            <img 
              src={selectedListing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'}
              alt={selectedListing.title}
              className="w-full h-64 object-cover"
            />
            
            <div className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-[#667eea]" size={16} />
                <span className="text-sm font-semibold text-[#667eea]">{getMatchScore()}% Match</span>
              </div>
              
              <h2 
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
              >
                {selectedListing.title}
              </h2>
              
              <p className="text-gray-500 flex items-center gap-2 mb-4">
                <MapPin size={16} />
                {selectedListing.address}, {selectedListing.city}, {selectedListing.province} {selectedListing.postal_code}
              </p>
              
              <p className="text-3xl font-bold text-[#667eea] mb-6">
                ${selectedListing.price.toLocaleString()}<span className="text-lg font-normal text-gray-500">/month</span>
              </p>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Bed className="mx-auto mb-1 text-[#667eea]" size={24} />
                  <p className="font-bold">{selectedListing.bedrooms === 0 ? 'Studio' : selectedListing.bedrooms}</p>
                  <p className="text-xs text-gray-500">Bedrooms</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Bath className="mx-auto mb-1 text-[#667eea]" size={24} />
                  <p className="font-bold">{selectedListing.bathrooms}</p>
                  <p className="text-xs text-gray-500">Bathrooms</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <span className="block text-[#667eea] text-xl mb-1">□</span>
                  <p className="font-bold">{selectedListing.sqft}</p>
                  <p className="text-xs text-gray-500">Sq Ft</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <span className="block text-2xl mb-1">{selectedListing.pet_friendly ? '🐾' : '🚫'}</span>
                  <p className="font-bold text-sm">{selectedListing.pet_friendly ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-gray-500">Pets</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{selectedListing.description}</p>
              </div>
              
              {selectedListing.amenities?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.amenities.map((amenity, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-[#f7fafc] text-gray-700 text-sm">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="font-bold mb-2">Available</h3>
                <p className="text-gray-600">{selectedListing.available_date}</p>
              </div>
              
              <div className="flex gap-4">
                <button 
                  className="flex-1 py-4 rounded-full font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  data-testid="schedule-viewing-btn"
                >
                  Schedule Viewing
                </button>
                <button 
                  className="px-6 py-4 rounded-full border-2 border-[#667eea] text-[#667eea] font-bold hover:bg-[#667eea] hover:text-white transition-all"
                  data-testid="save-listing-btn"
                >
                  <Heart size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nova Chat */}
      <NovaChat />
    </div>
  );
};

export default Browse;
