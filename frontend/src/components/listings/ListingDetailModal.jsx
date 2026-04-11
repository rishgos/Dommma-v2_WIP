import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Share2, MapPin, Bed, Bath, Heart, FileText, DollarSign, MessageSquare, CalendarCheck, Eye, Navigation, Globe, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MatterportViewer from '../MatterportViewer';
import StreetViewPreview from './StreetViewPreview';
import CommuteDirections from './CommuteDirections';
import NeighborhoodFlyover from './NeighborhoodFlyover';
import NearbyPlaces from './NearbyPlaces';

const tabs = [
  { id: 'street', label: 'Street View', icon: Eye },
  { id: 'commute', label: 'Commute', icon: Navigation },
  { id: 'neighborhood', label: 'Neighborhood', icon: Globe },
  { id: 'nearby', label: 'Nearby', icon: Map },
];

const ListingDetailModal = ({
  listing,
  onClose,
  onShare,
  onScheduleViewing,
  favoriteIds = [],
  toggleFavorite,
  user,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null);

  if (!listing) return null;

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4" data-testid="listing-modal">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white dark:bg-[#1A2332] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Close & Share buttons */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50" data-testid="close-modal-btn">
          <X size={20} />
        </button>
        <button onClick={onShare} className="absolute top-4 right-16 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 text-[#1A2F3A]" data-testid="share-listing-btn">
          <Share2 size={18} />
        </button>

        {/* Hero Image */}
        <img
          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'}
          alt={listing.title}
          className="w-full h-64 object-cover"
        />

        <div className="p-8">
          {/* Header Info */}
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {listing.property_type} · {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
          </span>
          <h2 className="text-3xl font-semibold text-[#1A2F3A] dark:text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {listing.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-4">
            <MapPin size={16} />
            {listing.address}, {listing.city}, {listing.province}
          </p>

          {/* Price */}
          <p className="text-3xl font-semibold text-[#1A2F3A] dark:text-white mb-2">
            ${listing.price?.toLocaleString()}
            {listing.listing_type !== 'sale' && <span className="text-lg font-normal text-gray-500">/month</span>}
          </p>

          {/* Flexible Pricing */}
          {listing.pricing_tiers?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2" data-testid="flexible-pricing">
              {listing.pricing_tiers.map((tier, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800">
                  {tier.label}: ${tier.monthly_price?.toLocaleString()}/mo
                </span>
              ))}
            </div>
          )}

          <div className="mb-6" />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="text-center p-4 bg-[#F5F5F0] dark:bg-white/5 rounded-xl">
              <Bed className="mx-auto mb-1 text-[#1A2F3A] dark:text-[#C4A962]" size={24} />
              <p className="font-semibold dark:text-white">{listing.bedrooms === 0 ? 'Studio' : listing.bedrooms}</p>
              <p className="text-xs text-gray-500">Beds</p>
            </div>
            <div className="text-center p-4 bg-[#F5F5F0] dark:bg-white/5 rounded-xl">
              <Bath className="mx-auto mb-1 text-[#1A2F3A] dark:text-[#C4A962]" size={24} />
              <p className="font-semibold dark:text-white">{listing.bathrooms}</p>
              <p className="text-xs text-gray-500">Baths</p>
            </div>
            <div className="text-center p-4 bg-[#F5F5F0] dark:bg-white/5 rounded-xl">
              <p className="text-xl mb-1">{'\u25a2'}</p>
              <p className="font-semibold dark:text-white">{listing.sqft}</p>
              <p className="text-xs text-gray-500">Sq Ft</p>
            </div>
            <div className="text-center p-4 bg-[#F5F5F0] dark:bg-white/5 rounded-xl">
              <p className="text-xl mb-1">{listing.pet_friendly ? '\ud83d\udc3e' : '\ud83d\udeab'}</p>
              <p className="font-semibold text-sm dark:text-white">{listing.pet_friendly ? 'Yes' : 'No'}</p>
              <p className="text-xs text-gray-500">Pets</p>
            </div>
          </div>

          {/* Sale-specific stats */}
          {listing.listing_type === 'sale' && (listing.year_built || listing.lot_size) && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {listing.year_built && <div className="text-center p-3 bg-[#F5F5F0] dark:bg-white/5 rounded-xl"><p className="font-semibold text-[#1A2F3A] dark:text-white">{listing.year_built}</p><p className="text-xs text-gray-500">Year Built</p></div>}
              {listing.lot_size > 0 && <div className="text-center p-3 bg-[#F5F5F0] dark:bg-white/5 rounded-xl"><p className="font-semibold text-[#1A2F3A] dark:text-white">{listing.lot_size?.toLocaleString()}</p><p className="text-xs text-gray-500">Lot (sqft)</p></div>}
              {listing.garage > 0 && <div className="text-center p-3 bg-[#F5F5F0] dark:bg-white/5 rounded-xl"><p className="font-semibold text-[#1A2F3A] dark:text-white">{listing.garage}</p><p className="text-xs text-gray-500">Garage</p></div>}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold dark:text-white mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{listing.description}</p>
          </div>

          {/* Amenities */}
          {listing.amenities?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold dark:text-white mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#F5F5F0] dark:bg-white/10 text-gray-700 dark:text-gray-300 text-sm">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Matterport */}
          {listing.matterport_id && (
            <div className="mb-6">
              <MatterportViewer matterportId={listing.matterport_id} title={listing.title} />
            </div>
          )}

          {/* ===== EXPLORE TABS ===== */}
          <div className="mb-6">
            <h3 className="font-semibold dark:text-white mb-3">Explore this location</h3>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#1A2F3A] text-white shadow-lg'
                        : 'bg-[#F5F5F0] dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {activeTab && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'street' && (
                    <StreetViewPreview lat={listing.lat} lng={listing.lng} />
                  )}
                  {activeTab === 'commute' && (
                    <CommuteDirections lat={listing.lat} lng={listing.lng} address={`${listing.address}, ${listing.city}`} />
                  )}
                  {activeTab === 'neighborhood' && (
                    <NeighborhoodFlyover lat={listing.lat} lng={listing.lng} title={listing.title} />
                  )}
                  {activeTab === 'nearby' && (
                    <NearbyPlaces lat={listing.lat} lng={listing.lng} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {listing.listing_type === 'sale' ? (
              <>
                <button onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  navigate(`/offers?listing_id=${listing.id}&listing_title=${encodeURIComponent(listing.title)}&price=${listing.price}`);
                }} className="flex-1 py-4 rounded-full font-medium text-white bg-[#1A2F3A] hover:bg-[#2C4A52] transition-colors flex items-center justify-center gap-2" data-testid="make-offer-btn">
                  <DollarSign size={18} /> Make an Offer
                </button>
                <button onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  onScheduleViewing?.();
                }} className="px-6 py-4 rounded-full border-2 border-[#1A2F3A] text-[#1A2F3A] dark:text-white dark:border-white/20 hover:bg-[#1A2F3A] hover:text-white transition-colors flex items-center gap-2" data-testid="schedule-viewing-btn">
                  <CalendarCheck size={18} /> Schedule Viewing
                </button>
                <button onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  navigate(`/dashboard/messages?to=${listing.landlord_id || ''}&listing=${listing.id}`);
                }} className="px-6 py-4 rounded-full border-2 border-[#1A2F3A] text-[#1A2F3A] dark:text-white dark:border-white/20 hover:bg-[#1A2F3A] hover:text-white transition-colors flex items-center gap-2" data-testid="message-seller-btn">
                  <MessageSquare size={18} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  navigate(`/dashboard/applications?listing_id=${listing.id}&listing_title=${encodeURIComponent(listing.title)}`);
                }} className="flex-1 py-4 rounded-full font-medium text-white bg-[#1A2F3A] hover:bg-[#2C4A52] transition-colors flex items-center justify-center gap-2" data-testid="apply-now-btn">
                  <FileText size={18} /> Apply Now
                </button>
                <button onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  onScheduleViewing?.();
                }} className="px-6 py-4 rounded-full border-2 border-[#1A2F3A] text-[#1A2F3A] dark:text-white dark:border-white/20 hover:bg-[#1A2F3A] hover:text-white transition-colors flex items-center gap-2" data-testid="schedule-viewing-btn">
                  <CalendarCheck size={18} /> Schedule Viewing
                </button>
                <button onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  navigate(`/dashboard/messages?to=${listing.landlord_id || ''}&listing=${listing.id}`);
                }} className="px-6 py-4 rounded-full border-2 border-[#1A2F3A] text-[#1A2F3A] dark:text-white dark:border-white/20 hover:bg-[#1A2F3A] hover:text-white transition-colors flex items-center gap-2" data-testid="message-landlord-btn">
                  <MessageSquare size={18} />
                </button>
              </>
            )}
            <button
              onClick={(e) => toggleFavorite?.(listing.id, e)}
              className={`px-6 py-4 rounded-full border-2 border-[#1A2F3A] transition-colors ${
                favoriteIds.includes(listing.id)
                  ? 'bg-red-50 text-red-500 border-red-200'
                  : 'text-[#1A2F3A] dark:text-white dark:border-white/20 hover:bg-[#1A2F3A] hover:text-white'
              }`}
              data-testid="save-listing-btn"
            >
              <Heart size={20} fill={favoriteIds.includes(listing.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ListingDetailModal;
