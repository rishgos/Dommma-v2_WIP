import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Bed, Bath, MapPin, DollarSign, Calendar, Car, PawPrint, Ruler, Building2, Home } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Compare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      fetchListings(ids.split(','));
    } else {
      navigate('/favorites');
    }
  }, [searchParams]);

  const fetchListings = async (ids) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/compare`, ids);
      setListings(response.data || []);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      // Fallback: fetch individual listings
      try {
        const listingsData = await Promise.all(
          ids.map(id => axios.get(`${API}/listings/${id}`).then(res => res.data).catch(() => null))
        );
        setListings(listingsData.filter(Boolean));
      } catch (e) {
        console.error('Fallback fetch failed:', e);
      }
    }
    setLoading(false);
  };

  const formatPrice = (price, listingType) => {
    if (listingType === 'sale') {
      return `$${price?.toLocaleString()}`;
    }
    return `$${price?.toLocaleString()}/mo`;
  };

  const getLowestPrice = () => {
    if (listings.length === 0) return null;
    return Math.min(...listings.map(l => l.price));
  };

  const getLargestSqft = () => {
    if (listings.length === 0) return null;
    return Math.max(...listings.map(l => l.sqft));
  };

  const getMostBedrooms = () => {
    if (listings.length === 0) return null;
    return Math.max(...listings.map(l => l.bedrooms));
  };

  const comparisonRows = [
    {
      label: 'Price',
      icon: DollarSign,
      getValue: (l) => formatPrice(l.price, l.listing_type),
      highlight: (l) => l.price === getLowestPrice(),
    },
    {
      label: 'Type',
      icon: Building2,
      getValue: (l) => l.property_type,
    },
    {
      label: 'Listing',
      icon: Home,
      getValue: (l) => l.listing_type === 'sale' ? 'For Sale' : 'For Rent',
    },
    {
      label: 'Bedrooms',
      icon: Bed,
      getValue: (l) => l.bedrooms === 0 ? 'Studio' : l.bedrooms,
      highlight: (l) => l.bedrooms === getMostBedrooms(),
    },
    {
      label: 'Bathrooms',
      icon: Bath,
      getValue: (l) => l.bathrooms,
    },
    {
      label: 'Square Feet',
      icon: Ruler,
      getValue: (l) => `${l.sqft?.toLocaleString()} sqft`,
      highlight: (l) => l.sqft === getLargestSqft(),
    },
    {
      label: 'Location',
      icon: MapPin,
      getValue: (l) => `${l.city}, ${l.province}`,
    },
    {
      label: 'Pet Friendly',
      icon: PawPrint,
      getValue: (l) => l.pet_friendly ? <Check className="text-green-500" size={20} /> : <X className="text-red-400" size={20} />,
    },
    {
      label: 'Parking',
      icon: Car,
      getValue: (l) => l.parking ? <Check className="text-green-500" size={20} /> : <X className="text-red-400" size={20} />,
    },
    {
      label: 'Available',
      icon: Calendar,
      getValue: (l) => l.available_date || 'Immediately',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#1A2F3A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#1A2F3A] text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/favorites" className="text-white/70 hover:text-white">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Compare Properties
              </h1>
              <p className="text-sm text-white/70">Side-by-side comparison of {listings.length} properties</p>
            </div>
          </div>
        </div>
      </header>

      {/* Comparison Table */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {listings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center">
            <Building2 className="mx-auto mb-4 text-gray-300" size={64} />
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-2">No Properties to Compare</h2>
            <p className="text-gray-500 mb-6">Select properties from your favorites to compare</p>
            <Link
              to="/favorites"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-xl"
            >
              Go to Favorites
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            {/* Property Headers */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}>
              <div className="p-6 bg-[#F5F5F0]" />
              {listings.map((listing) => (
                <div key={listing.id} className="p-4 border-l border-gray-100" data-testid={`compare-header-${listing.id}`}>
                  <div className="relative h-40 rounded-xl overflow-hidden mb-4">
                    <img
                      src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        listing.listing_type === 'sale' ? 'bg-blue-500 text-white' : 'bg-white/90 text-[#1A2F3A]'
                      }`}>
                        {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-[#1A2F3A] line-clamp-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {listing.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{listing.address}</p>
                </div>
              ))}
            </div>

            {/* Comparison Rows */}
            {comparisonRows.map((row, index) => (
              <div
                key={row.label}
                className={`grid ${index % 2 === 0 ? 'bg-[#F5F5F0]/50' : 'bg-white'}`}
                style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}
              >
                <div className="p-4 flex items-center gap-3 font-medium text-[#1A2F3A]">
                  <row.icon size={18} className="text-gray-400" />
                  {row.label}
                </div>
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className={`p-4 border-l border-gray-100 flex items-center ${
                      row.highlight && row.highlight(listing) ? 'bg-green-50 font-semibold text-green-700' : ''
                    }`}
                    data-testid={`compare-${row.label.toLowerCase().replace(' ', '-')}-${listing.id}`}
                  >
                    {row.getValue(listing)}
                  </div>
                ))}
              </div>
            ))}

            {/* Amenities Row */}
            <div
              className="grid bg-[#F5F5F0]/50"
              style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}
            >
              <div className="p-4 flex items-center gap-3 font-medium text-[#1A2F3A]">
                <Check size={18} className="text-gray-400" />
                Amenities
              </div>
              {listings.map((listing) => (
                <div key={listing.id} className="p-4 border-l border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {listing.amenities?.slice(0, 5).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-1 bg-white rounded-full text-xs text-gray-600"
                      >
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities?.length > 5 && (
                      <span className="px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-500">
                        +{listing.amenities.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Row */}
            <div
              className="grid bg-white border-t border-gray-100"
              style={{ gridTemplateColumns: `200px repeat(${listings.length}, 1fr)` }}
            >
              <div className="p-4" />
              {listings.map((listing) => (
                <div key={listing.id} className="p-4 border-l border-gray-100">
                  <Link
                    to="/browse"
                    className="block w-full py-3 bg-[#1A2F3A] text-white text-center rounded-xl hover:bg-[#2C4A52] transition-colors text-sm font-medium"
                    data-testid={`view-listing-${listing.id}`}
                  >
                    View Full Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        {listings.length > 0 && (
          <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100" />
              <span>Best value in category</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Compare;
