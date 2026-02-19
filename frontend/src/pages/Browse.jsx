import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Bed, Bath, MapPin, Heart, X, SlidersHorizontal, ArrowLeft, Grid, List, Bot, FileText, MessageSquare, DollarSign, Home, Building2 } from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import axios from 'axios';
import NovaChat from '../components/chat/NovaChat';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const GOOGLE_MAPS_API_KEY = 'AIzaSyBs_zxHIzIvin-zrYtr1Py1AuxxcFICggM';

const mapContainerStyle = { width: '100%', height: '100%' };
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
  ]
};
const defaultCenter = { lat: 49.2827, lng: -123.1207 };

const Browse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const novaQuery = searchParams.get('nova');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [hoveredListing, setHoveredListing] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [showNovaChat, setShowNovaChat] = useState(!!novaQuery);
  const [filters, setFilters] = useState({
    search: '',
    bedrooms: '',
    bathrooms: '',
    minPrice: '',
    maxPrice: '',
    petFriendly: false,
    parking: false,
    propertyType: '',
    listingType: 'rent'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const propertyTypes = ['Apartment', 'Condo', 'House', 'Townhouse', 'Studio', 'Duplex', 'Penthouse'];

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const onMapLoad = useCallback((mapInstance) => setMap(mapInstance), []);

  useEffect(() => {
    if (map && listings.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      listings.forEach(listing => bounds.extend({ lat: listing.lat, lng: listing.lng }));
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, listings]);

  useEffect(() => {
    fetchListings();
    seedData();
  }, []);

  const seedData = async () => {
    try { await axios.post(`${API}/seed`); } catch (error) {}
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
    const debounce = setTimeout(() => fetchListings(), 500);
    return () => clearTimeout(debounce);
  }, [filters]);

  const createPriceLabel = (price) => `$${Math.floor(price / 1000)}k`;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#0D0D0D] text-white" data-testid="browse-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </Link>
            <span className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>DOMMMA</span>
          </div>
          
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search Vancouver properties..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-12 pr-4 py-2.5 rounded-full bg-white/10 border border-white/10 text-white placeholder-gray-400 focus:bg-white/20 focus:outline-none text-sm"
                data-testid="search-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm"
              data-testid="filters-toggle"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
            <div className="hidden md:flex items-center bg-white/10 rounded-full p-1">
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-white/20' : ''}`}>
                <List size={16} />
              </button>
              <button onClick={() => setViewMode('split')} className={`p-2 rounded-full ${viewMode === 'split' ? 'bg-white/20' : ''}`}>
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="border-t border-white/10 p-4">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
              <select value={filters.bedrooms} onChange={(e) => setFilters({...filters, bedrooms: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" data-testid="filter-bedrooms">
                <option value="">Bedrooms</option>
                <option value="0">Studio</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
              <select value={filters.bathrooms} onChange={(e) => setFilters({...filters, bathrooms: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" data-testid="filter-bathrooms">
                <option value="">Bathrooms</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
              </select>
              <input type="number" placeholder="Min Price" value={filters.minPrice} onChange={(e) => setFilters({...filters, minPrice: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-400 text-sm" data-testid="filter-min-price" />
              <input type="number" placeholder="Max Price" value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-400 text-sm" data-testid="filter-max-price" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.petFriendly} onChange={(e) => setFilters({...filters, petFriendly: e.target.checked})} className="w-4 h-4 rounded" data-testid="filter-pet-friendly" />
                <span className="text-sm">Pet Friendly</span>
              </label>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={`pt-16 ${showFilters ? 'pt-32' : ''}`}>
        <div className={`grid ${viewMode === 'split' ? 'lg:grid-cols-2' : ''}`} style={{ height: 'calc(100vh - 64px)' }}>
          {/* Listings */}
          <div className="overflow-y-auto p-6" data-testid="listings-container">
            <p className="text-sm text-gray-500 mb-4">{loading ? 'Loading...' : `${listings.length} properties found`}</p>
            
            {loading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />)}</div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => setSelectedListing(listing)}
                    onMouseEnter={() => { setHoveredListing(listing); setActiveMarker(listing.id); }}
                    onMouseLeave={() => { setHoveredListing(null); setActiveMarker(null); }}
                    className={`bg-white rounded-2xl overflow-hidden cursor-pointer transition-all border-2 hover:shadow-lg ${hoveredListing?.id === listing.id ? 'border-[#1A2F3A]' : 'border-transparent'}`}
                    data-testid={`listing-card-${listing.id}`}
                  >
                    <div className="flex">
                      <div className="w-40 h-40 flex-shrink-0">
                        <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'} alt={listing.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">{listing.property_type}</span>
                            <h3 className="font-semibold text-lg text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{listing.title}</h3>
                          </div>
                          <button className="p-2 hover:bg-gray-100 rounded-full" onClick={(e) => e.stopPropagation()}>
                            <Heart size={18} className="text-gray-400" />
                          </button>
                        </div>
                        <p className="text-gray-500 text-sm mb-3 flex items-center gap-1"><MapPin size={12} />{listing.address}, {listing.city}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1"><Bed size={14} /> {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}</span>
                          <span className="flex items-center gap-1"><Bath size={14} /> {listing.bathrooms} bath</span>
                          <span>{listing.sqft} sqft</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-semibold text-[#1A2F3A]">${listing.price?.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                          {listing.pet_friendly && <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Pet Friendly</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          {viewMode === 'split' && (
            <div className="hidden lg:block sticky top-0 h-full" data-testid="map-container">
              {isLoaded ? (
                <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={12} options={mapOptions} onLoad={onMapLoad}>
                  {listings.map((listing) => (
                    <MarkerF
                      key={listing.id}
                      position={{ lat: listing.lat, lng: listing.lng }}
                      onClick={() => { setActiveMarker(listing.id); setHoveredListing(listing); }}
                      icon={{
                        url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30"><rect x="0" y="0" width="60" height="30" rx="15" fill="${activeMarker === listing.id ? '#2C4A52' : '#1A2F3A'}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="12">${createPriceLabel(listing.price)}</text></svg>`)}`,
                        scaledSize: new window.google.maps.Size(60, 30),
                        anchor: new window.google.maps.Point(30, 15),
                      }}
                    >
                      {activeMarker === listing.id && (
                        <InfoWindowF position={{ lat: listing.lat, lng: listing.lng }} onCloseClick={() => setActiveMarker(null)}>
                          <div className="p-2 min-w-[200px]">
                            <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300'} alt={listing.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                            <h3 className="font-semibold text-[#1A2F3A]">{listing.title}</h3>
                            <p className="text-sm text-gray-500">{listing.address}</p>
                            <p className="text-lg font-semibold text-[#1A2F3A] mt-1">${listing.price?.toLocaleString()}/mo</p>
                            <button onClick={() => setSelectedListing(listing)} className="mt-2 w-full py-2 rounded-full text-sm font-medium text-white bg-[#1A2F3A]">View Details</button>
                          </div>
                        </InfoWindowF>
                      )}
                    </MarkerF>
                  ))}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2F3A]"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Listing Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4" data-testid="listing-modal">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedListing(null)} />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedListing(null)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50" data-testid="close-modal-btn"><X size={20} /></button>
            <img src={selectedListing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'} alt={selectedListing.title} className="w-full h-64 object-cover" />
            <div className="p-8">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{selectedListing.property_type}</span>
              <h2 className="text-3xl font-semibold text-[#1A2F3A] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{selectedListing.title}</h2>
              <p className="text-gray-500 flex items-center gap-2 mb-4"><MapPin size={16} />{selectedListing.address}, {selectedListing.city}, {selectedListing.province}</p>
              <p className="text-3xl font-semibold text-[#1A2F3A] mb-6">${selectedListing.price?.toLocaleString()}<span className="text-lg font-normal text-gray-500">/month</span></p>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-[#F5F5F0] rounded-xl"><Bed className="mx-auto mb-1 text-[#1A2F3A]" size={24} /><p className="font-semibold">{selectedListing.bedrooms === 0 ? 'Studio' : selectedListing.bedrooms}</p><p className="text-xs text-gray-500">Beds</p></div>
                <div className="text-center p-4 bg-[#F5F5F0] rounded-xl"><Bath className="mx-auto mb-1 text-[#1A2F3A]" size={24} /><p className="font-semibold">{selectedListing.bathrooms}</p><p className="text-xs text-gray-500">Baths</p></div>
                <div className="text-center p-4 bg-[#F5F5F0] rounded-xl"><p className="text-xl mb-1">▢</p><p className="font-semibold">{selectedListing.sqft}</p><p className="text-xs text-gray-500">Sq Ft</p></div>
                <div className="text-center p-4 bg-[#F5F5F0] rounded-xl"><p className="text-xl mb-1">{selectedListing.pet_friendly ? '🐾' : '🚫'}</p><p className="font-semibold text-sm">{selectedListing.pet_friendly ? 'Yes' : 'No'}</p><p className="text-xs text-gray-500">Pets</p></div>
              </div>
              <div className="mb-6"><h3 className="font-semibold mb-2">Description</h3><p className="text-gray-600 leading-relaxed">{selectedListing.description}</p></div>
              {selectedListing.amenities?.length > 0 && (<div className="mb-6"><h3 className="font-semibold mb-2">Amenities</h3><div className="flex flex-wrap gap-2">{selectedListing.amenities.map((a, i) => <span key={i} className="px-3 py-1 rounded-full bg-[#F5F5F0] text-gray-700 text-sm">{a}</span>)}</div></div>)}
              <div className="flex gap-3">
                <button onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  navigate(`/dashboard/applications?listing_id=${selectedListing.id}&listing_title=${encodeURIComponent(selectedListing.title)}`);
                }} className="flex-1 py-4 rounded-full font-medium text-white bg-[#1A2F3A] hover:bg-[#2C4A52] transition-colors flex items-center justify-center gap-2" data-testid="apply-now-btn">
                  <FileText size={18} /> Apply Now
                </button>
                <button onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  navigate(`/dashboard/messages?to=${selectedListing.landlord_id || ''}&listing=${selectedListing.id}`);
                }} className="px-6 py-4 rounded-full border-2 border-[#1A2F3A] text-[#1A2F3A] hover:bg-[#1A2F3A] hover:text-white transition-colors flex items-center gap-2" data-testid="message-landlord-btn">
                  <MessageSquare size={18} /> Message
                </button>
                <button className="px-6 py-4 rounded-full border-2 border-[#1A2F3A] text-[#1A2F3A] hover:bg-[#1A2F3A] hover:text-white transition-colors" data-testid="save-listing-btn"><Heart size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NovaChat />
    </div>
  );
};

export default Browse;
