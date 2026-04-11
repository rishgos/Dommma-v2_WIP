import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Bed, Bath, MapPin, Heart, X, SlidersHorizontal, ArrowLeft, Grid, List, Bot, FileText, MessageSquare, DollarSign, Home, Building2, CalendarCheck, Star, Share2 } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import axios from 'axios';
import NovaChat from '../components/chat/NovaChat';
import ViewingScheduler from '../components/scheduling/ViewingScheduler';
import MatterportViewer from '../components/MatterportViewer';
import ShareListingModal from '../components/ShareListingModal';
import ListingDetailModal from '../components/listings/ListingDetailModal';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const GOOGLE_MAPS_API_KEY = 'AIzaSyBs_zxHIzIvin-zrYtr1Py1AuxxcFICggM';

const defaultCenter = { lat: 49.2827, lng: -123.1207 };

const Browse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const novaQuery = searchParams.get('nova');
  const typeParam = searchParams.get('type'); // Get type from URL (sale or rent)
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [shareModalListing, setShareModalListing] = useState(null);
  const [hoveredListing, setHoveredListing] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [showNovaChat, setShowNovaChat] = useState(!!novaQuery);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    bedrooms: '',
    bathrooms: '',
    minPrice: '',
    maxPrice: '',
    petFriendly: false,
    parking: false,
    storage: false,
    propertyType: '',
    listingType: typeParam || 'rent', // Use URL param or default to rent
    leaseDuration: '',
    hasOffers: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showViewingScheduler, setShowViewingScheduler] = useState(false);
  const [leaseAssignments, setLeaseAssignments] = useState([]);
  
  const propertyTypes = ['House', 'Apartment', 'Townhouse', 'Condo', 'Studio', 'Duplex', 'Penthouse'];
  const leaseDurations = [
    { value: 'month-to-month', label: 'Month to Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '9', label: '9 Months' },
    { value: '12', label: '12 Months' },
    { value: 'flexible', label: 'Flexible' },
  ];

  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  // Update listingType when URL param changes
  useEffect(() => {
    if (typeParam) {
      setFilters(prev => ({ ...prev, listingType: typeParam }));
    }
  }, [typeParam]);

  useEffect(() => {
    if (filters.listingType === 'lease_takeover') {
      fetchLeaseAssignments();
    } else {
      fetchListings();
    }
    seedData();
    if (user) fetchFavoriteIds();
  }, []);

  const seedData = async () => {
    try { await axios.post(`${API}/seed`); } catch (error) {}
  };

  const fetchFavoriteIds = async () => {
    try {
      const response = await axios.get(`${API}/favorites/${user.id}/ids`);
      setFavoriteIds(response.data || []);
    } catch (error) {
      console.error('Error fetching favorite IDs:', error);
    }
  };

  const toggleFavorite = async (listingId, e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.post(`${API}/favorites?user_id=${user.id}&listing_id=${listingId}`);
      if (response.data.favorited) {
        setFavoriteIds([...favoriteIds, listingId]);
      } else {
        setFavoriteIds(favoriteIds.filter(id => id !== listingId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const fetchLeaseAssignments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/lease-assignments`);
      const mapped = (res.data || []).map(a => ({
        id: a.id,
        title: a.title || `Lease Takeover - ${a.address}`,
        address: a.address || '',
        city: a.city || 'Vancouver',
        price: a.current_rent || a.monthly_rent || 0,
        bedrooms: a.bedrooms || 0,
        bathrooms: a.bathrooms || 1,
        sqft: a.sqft || 0,
        property_type: a.property_type || 'Apartment',
        listing_type: 'lease_takeover',
        images: a.images || [],
        pet_friendly: a.pet_friendly || false,
        lat: a.lat || 49.2827,
        lng: a.lng || -123.1207,
        lease_end: a.lease_end_date,
        savings: a.savings || 0,
        description: a.description || '',
        amenities: a.amenities || [],
        original_id: a.id,
        is_lease_takeover: true
      }));
      setLeaseAssignments(mapped);
      setListings(mapped);
    } catch (error) {
      console.error('Error fetching lease assignments:', error);
      setListings([]);
    } finally { setLoading(false); }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.listingType) params.append('listing_type', filters.listingType);
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
      if (filters.bathrooms) params.append('bathrooms', filters.bathrooms);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      if (filters.petFriendly) params.append('pet_friendly', 'true');
      if (filters.parking) params.append('parking', 'true');
      if (filters.propertyType) params.append('property_type', filters.propertyType);
      if (filters.search) params.append('q', filters.search);
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
      if (filters.listingType === 'lease_takeover') {
        fetchLeaseAssignments();
      } else {
        fetchListings();
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [filters]);

  const createPriceLabel = (price, listingType) => {
    if (listingType === 'sale' || price > 100000) return `$${(price / 1000).toFixed(0)}k`;
    return `$${(price / 1000).toFixed(1)}k`;
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0F1419]">
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
            <div className="flex items-center gap-3">
              <div className="flex bg-white/10 rounded-full p-0.5">
                <button onClick={() => setFilters({...filters, listingType: 'rent'})}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${filters.listingType === 'rent' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                  data-testid="filter-rent">Rent</button>
                <button onClick={() => setFilters({...filters, listingType: 'sale'})}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${filters.listingType === 'sale' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                  data-testid="filter-buy">Buy</button>
                <button onClick={() => setFilters({...filters, listingType: 'lease_takeover'})}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${filters.listingType === 'lease_takeover' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                  data-testid="filter-lease-takeover">Lease Takeover</button>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={filters.listingType === 'sale' ? "Search properties for sale..." : filters.listingType === 'lease_takeover' ? "Search lease takeovers..." : "Search rental properties..."}
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-12 pr-4 py-2.5 rounded-full bg-white/10 border border-white/10 text-white placeholder-gray-400 focus:bg-white/20 focus:outline-none text-sm"
                  data-testid="search-input"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/favorites"
              className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              data-testid="favorites-link"
            >
              <Heart size={18} />
              {favoriteIds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {favoriteIds.length}
                </span>
              )}
            </Link>
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
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3">
              <select value={filters.propertyType} onChange={(e) => setFilters({...filters, propertyType: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" data-testid="filter-property-type">
                <option value="">All Types</option>
                {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filters.bedrooms} onChange={(e) => setFilters({...filters, bedrooms: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" data-testid="filter-bedrooms">
                <option value="">Bedrooms</option>
                <option value="0">Studio</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
              <select value={filters.bathrooms} onChange={(e) => setFilters({...filters, bathrooms: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" data-testid="filter-bathrooms">
                <option value="">Bathrooms</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
              <select value={filters.leaseDuration} onChange={(e) => setFilters({...filters, leaseDuration: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" data-testid="filter-lease-duration">
                <option value="">Lease Term</option>
                {leaseDurations.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <input type="number" placeholder={filters.listingType === 'sale' ? 'Min ($)' : 'Min $/mo'} value={filters.minPrice} onChange={(e) => setFilters({...filters, minPrice: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-400 text-sm" data-testid="filter-min-price" />
              <input type="number" placeholder={filters.listingType === 'sale' ? 'Max ($)' : 'Max $/mo'} value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-400 text-sm" data-testid="filter-max-price" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.petFriendly} onChange={(e) => setFilters({...filters, petFriendly: e.target.checked})} className="w-4 h-4 rounded" data-testid="filter-pet-friendly" />
                <span className="text-sm">Pets OK</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.parking} onChange={(e) => setFilters({...filters, parking: e.target.checked})} className="w-4 h-4 rounded" data-testid="filter-parking" />
                <span className="text-sm">Parking</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.storage} onChange={(e) => setFilters({...filters, storage: e.target.checked})} className="w-4 h-4 rounded" data-testid="filter-storage" />
                <span className="text-sm">Storage</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.hasOffers} onChange={(e) => setFilters({...filters, hasOffers: e.target.checked})} className="w-4 h-4 rounded" data-testid="filter-has-offers" />
                <span className="text-sm">Has Offers</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />)}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => setSelectedListing(listing)}
                    onMouseEnter={() => { setHoveredListing(listing); setActiveMarker(listing.id); }}
                    onMouseLeave={() => { setHoveredListing(null); setActiveMarker(null); }}
                    className={`bg-white rounded-2xl overflow-hidden cursor-pointer transition-all border-2 hover:shadow-lg ${hoveredListing?.id === listing.id ? 'border-[#1A2F3A]' : listing.featured ? 'border-yellow-400' : 'border-transparent'}`}
                    data-testid={`listing-card-${listing.id}`}
                  >
                    <div className="flex flex-col">
                      <div className="w-full h-40 relative">
                        <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'} alt={listing.title} className="w-full h-full object-cover" />
                        <button 
                          className={`absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full transition-colors ${favoriteIds.includes(listing.id) ? 'text-red-500' : 'text-gray-400'}`} 
                          onClick={(e) => toggleFavorite(listing.id, e)}
                          data-testid={`favorite-btn-${listing.id}`}
                        >
                          <Heart size={16} fill={favoriteIds.includes(listing.id) ? 'currentColor' : 'none'} />
                        </button>
                        <div className="absolute top-2 left-2 flex gap-1">
                          {listing.featured && (
                            <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
                              <Star size={10} className="fill-white" /> Featured
                            </span>
                          )}
                          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#1A2F3A]">{listing.property_type}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-[#1A2F3A] mb-1 truncate" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{listing.title}</h3>
                        <p className="text-gray-500 text-xs mb-2 flex items-center gap-1 truncate"><MapPin size={10} />{listing.address}, {listing.city}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                          <span className="flex items-center gap-1"><Bed size={12} /> {listing.bedrooms === 0 ? 'Studio' : listing.bedrooms}</span>
                          <span className="flex items-center gap-1"><Bath size={12} /> {listing.bathrooms}</span>
                          <span>{listing.sqft} sqft</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-[#1A2F3A]">
                            ${listing.price?.toLocaleString()}
                            <span className="text-xs font-normal text-gray-500">{listing.listing_type === 'sale' ? '' : '/mo'}</span>
                          </p>
                          {listing.pet_friendly && <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700">Pets</span>}
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
              {mapLoaded ? (
                  <Map
                    style={{ width: '100%', height: '100%' }}
                    defaultCenter={defaultCenter}
                    defaultZoom={12}
                    mapId="dommma-browse-map"
                    disableDefaultUI={false}
                    zoomControl={true}
                    streetViewControl={false}
                    mapTypeControl={false}
                    fullscreenControl={true}
                  >
                    {listings.map((listing) => (
                      <AdvancedMarker
                        key={listing.id}
                        position={{ lat: listing.lat, lng: listing.lng }}
                        onClick={() => { setActiveMarker(listing.id); setHoveredListing(listing); }}
                      >
                        <div
                          className="px-3 py-1.5 rounded-full text-white text-xs font-bold cursor-pointer shadow-md whitespace-nowrap"
                          style={{ backgroundColor: activeMarker === listing.id ? '#2C4A52' : '#1A2F3A' }}
                        >
                          {createPriceLabel(listing.price, listing.listing_type)}
                        </div>
                      </AdvancedMarker>
                    ))}
                    {activeMarker && hoveredListing && (
                      <InfoWindow position={{ lat: hoveredListing.lat, lng: hoveredListing.lng }} onCloseClick={() => setActiveMarker(null)}>
                        <div className="p-2 min-w-[200px]">
                          <img src={hoveredListing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300'} alt={hoveredListing.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                          <h3 className="font-semibold text-[#1A2F3A]">{hoveredListing.title}</h3>
                          <p className="text-sm text-gray-500">{hoveredListing.address}</p>
                          <p className="text-lg font-semibold text-[#1A2F3A] mt-1">${hoveredListing.price?.toLocaleString()}{hoveredListing.listing_type === 'sale' ? '' : '/mo'}</p>
                          <button onClick={() => setSelectedListing(hoveredListing)} className="mt-2 w-full py-2 rounded-full text-sm font-medium text-white bg-[#1A2F3A]">View Details</button>
                        </div>
                      </InfoWindow>
                    )}
                  </Map>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2F3A]"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Listing Detail Modal — with Street View, Commute, Neighborhood, Nearby tabs */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onShare={() => setShareModalListing(selectedListing)}
          onScheduleViewing={() => setShowViewingScheduler(true)}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
          user={user}
        />
      )}

      {/* Viewing Scheduler Modal */}
      {showViewingScheduler && selectedListing && (
        <ViewingScheduler
          listing={selectedListing}
          onClose={() => setShowViewingScheduler(false)}
          onScheduled={() => {
            // Optionally show a toast or notification
          }}
        />
      )}

      <NovaChat />
      <ShareListingModal listing={shareModalListing} isOpen={!!shareModalListing} onClose={() => setShareModalListing(null)} />
    </div>
    </APIProvider>
  );
};

export default Browse;
