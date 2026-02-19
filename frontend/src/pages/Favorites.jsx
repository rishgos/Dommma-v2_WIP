import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Bed, Bath, MapPin, Trash2, Scale, X, Check, Building2 } from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState([]);
  const [showCompareBar, setShowCompareBar] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/favorites/${user.id}`);
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
    setLoading(false);
  };

  const handleRemoveFavorite = async (listingId) => {
    try {
      await axios.post(`${API}/favorites?user_id=${user.id}&listing_id=${listingId}`);
      setFavorites(favorites.filter(f => f.id !== listingId));
      setCompareList(compareList.filter(id => id !== listingId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const toggleCompare = (listingId) => {
    if (compareList.includes(listingId)) {
      setCompareList(compareList.filter(id => id !== listingId));
    } else if (compareList.length < 4) {
      setCompareList([...compareList, listingId]);
    }
    setShowCompareBar(true);
  };

  const handleCompare = () => {
    if (compareList.length >= 2) {
      navigate(`/compare?ids=${compareList.join(',')}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#1A2F3A] text-white px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white/70 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Saved Properties
                </h1>
                <p className="text-sm text-white/70">Your favorite listings</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="text-red-400" size={20} fill="currentColor" />
              <span className="text-lg font-semibold">{favorites.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center">
            <Heart className="mx-auto mb-4 text-gray-300" size={64} />
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              No Saved Properties
            </h2>
            <p className="text-gray-500 mb-6">Start saving properties you love while browsing</p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] transition-colors"
              data-testid="browse-properties-btn"
            >
              <Building2 size={18} />
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((listing) => (
              <div
                key={listing.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all ${
                  compareList.includes(listing.id) ? 'ring-2 ring-[#1A2F3A]' : ''
                }`}
                data-testid={`favorite-${listing.id}`}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      listing.listing_type === 'sale' ? 'bg-blue-500 text-white' : 'bg-white/90 text-[#1A2F3A]'
                    }`}>
                      {listing.listing_type === 'sale' ? 'For Sale' : listing.property_type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => toggleCompare(listing.id)}
                      className={`p-2 rounded-full transition-colors ${
                        compareList.includes(listing.id)
                          ? 'bg-[#1A2F3A] text-white'
                          : 'bg-white/90 text-gray-600 hover:bg-white'
                      }`}
                      title="Add to compare"
                      data-testid={`compare-toggle-${listing.id}`}
                    >
                      <Scale size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(listing.id)}
                      className="p-2 rounded-full bg-white/90 text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove from favorites"
                      data-testid={`remove-favorite-${listing.id}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-[#1A2F3A] mb-1 line-clamp-1">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    <MapPin size={12} />
                    {listing.address}, {listing.city}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Bed size={14} />
                      {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath size={14} />
                      {listing.bathrooms} bath
                    </span>
                    <span>{listing.sqft} sqft</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold text-[#1A2F3A]">
                      ${listing.price?.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">
                        {listing.listing_type === 'sale' ? '' : '/mo'}
                      </span>
                    </p>
                    <Link
                      to={`/browse`}
                      className="text-sm text-[#1A2F3A] hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Compare Bar */}
      {showCompareBar && compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1A2F3A] text-white px-6 py-4 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {compareList.map((id) => {
                  const listing = favorites.find(f => f.id === id);
                  return (
                    <div
                      key={id}
                      className="w-10 h-10 rounded-full border-2 border-[#1A2F3A] overflow-hidden"
                    >
                      <img
                        src={listing?.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
              <span className="text-sm">
                {compareList.length} {compareList.length === 1 ? 'property' : 'properties'} selected
                <span className="text-white/60 ml-1">(select 2-4 to compare)</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCompareList([]);
                  setShowCompareBar(false);
                }}
                className="px-4 py-2 text-sm text-white/70 hover:text-white"
              >
                Clear
              </button>
              <button
                onClick={handleCompare}
                disabled={compareList.length < 2}
                className="px-6 py-2 bg-white text-[#1A2F3A] rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                data-testid="compare-btn"
              >
                <Scale size={16} />
                Compare {compareList.length > 1 && `(${compareList.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;
