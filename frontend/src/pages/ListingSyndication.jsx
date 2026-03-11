import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Share2, Copy, ExternalLink, Check, Facebook, 
  Building, MapPin, DollarSign, Bed, Bath, 
  CheckCircle2, AlertCircle, RefreshCw, Image,
  Globe, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Platform configurations
const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook Marketplace',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Reach local buyers on Facebook',
    deepLinkSupport: true
  },
  {
    id: 'craigslist',
    name: 'Craigslist',
    icon: Globe,
    color: 'bg-purple-600',
    description: 'Classic classifieds platform',
    deepLinkSupport: true
  },
  {
    id: 'kijiji',
    name: 'Kijiji',
    icon: Globe,
    color: 'bg-green-600',
    description: 'Canada\'s largest classifieds site',
    deepLinkSupport: true
  }
];

export default function ListingSyndication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [expandedPlatform, setExpandedPlatform] = useState('facebook');
  const [syndicationHistory, setSyndicationHistory] = useState({});
  
  // AI-generated content state
  const [aiContent, setAiContent] = useState({});
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    if (!user || user.user_type !== 'landlord') {
      navigate('/login');
      return;
    }
    fetchListings();
  }, [user, navigate]);
  
  // Generate AI content when listing is selected
  useEffect(() => {
    if (selectedListing && !aiContent[selectedListing.id]) {
      generateAIContent(selectedListing);
    }
  }, [selectedListing]);

  const fetchListings = async () => {
    try {
      const response = await axios.get(`${API}/api/listings?owner_id=${user.id}`);
      const activeListings = (response.data || []).filter(l => l.status === 'active');
      setListings(activeListings);
      if (activeListings.length > 0) {
        setSelectedListing(activeListings[0]);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const generateAIContent = async (listing) => {
    if (!listing) return;
    
    setGeneratingAI(true);
    try {
      const response = await axios.post(`${API}/api/syndication/generate-description`, {
        listing_id: listing.id,
        listing_data: listing
      });
      
      setAiContent(prev => ({
        ...prev,
        [listing.id]: response.data
      }));
    } catch (error) {
      console.error('Error generating AI content:', error);
      // Fallback to basic content
      setAiContent(prev => ({
        ...prev,
        [listing.id]: { generated: false }
      }));
    } finally {
      setGeneratingAI(false);
    }
  };
  
  const regenerateAIContent = () => {
    if (selectedListing) {
      setAiContent(prev => {
        const newContent = { ...prev };
        delete newContent[selectedListing.id];
        return newContent;
      });
      generateAIContent(selectedListing);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateListingContent = (listing, platform) => {
    const title = listing.title || `${listing.bedrooms}BR ${listing.property_type || 'Apartment'} for Rent`;
    const price = listing.price || 0;
    const address = `${listing.address || ''}, ${listing.city || 'Vancouver'}`;
    const beds = listing.bedrooms || 0;
    const baths = listing.bathrooms || 1;
    const sqft = listing.sqft ? `${listing.sqft} sqft` : '';
    const amenities = listing.amenities || [];
    const petFriendly = listing.pet_friendly ? 'Pet Friendly' : 'No Pets';
    const offers = listing.offers || [];
    
    // Check if we have AI-generated content for this listing
    const ai = aiContent[listing.id];
    const aiDescription = ai?.description || '';
    const aiHighlights = ai?.highlights || [];
    const aiNeighborhood = ai?.neighborhood || '';
    
    // Platform-specific formatting with AI enhancement
    if (platform === 'facebook') {
      return {
        title: `🏠 ${title} - $${price.toLocaleString()}/month`,
        body: `📍 ${address}

💰 $${price.toLocaleString()}/month
🛏️ ${beds} Bedroom${beds !== 1 ? 's' : ''} | 🛁 ${baths} Bath${baths !== 1 ? 's' : ''}
${sqft ? `📐 ${sqft}\n` : ''}
${aiDescription ? `\n${aiDescription}\n` : ''}
${aiNeighborhood ? `\n🏘️ Neighborhood: ${aiNeighborhood}\n` : ''}
✨ Features:
${aiHighlights.length > 0 ? aiHighlights.map(h => `• ${h}`).join('\n') : (amenities.length > 0 ? amenities.map(a => `• ${a}`).join('\n') : '• Modern finishes')}
${petFriendly === 'Pet Friendly' ? '\n🐾 Pet Friendly!' : ''}

${offers.length > 0 ? `🎁 SPECIAL OFFER: ${offers[0]}\n` : ''}
📱 Contact for viewing!

#VancouverRentals #ForRent #${listing.city?.replace(/\s/g, '') || 'Vancouver'} #Apartment`,
        hashtags: `#VancouverRentals #ForRent #${listing.city?.replace(/\s/g, '') || 'Vancouver'}`
      };
    }
    
    if (platform === 'craigslist') {
      return {
        title: `${title} - $${price}/month (${listing.city || 'Vancouver'})`,
        body: `${title}

RENT: $${price.toLocaleString()}/month
LOCATION: ${address}
BEDROOMS: ${beds}
BATHROOMS: ${baths}
${sqft ? `SIZE: ${sqft}\n` : ''}
PETS: ${petFriendly}

DESCRIPTION:
${aiDescription || listing.description || 'Beautiful rental unit available now.'}

${aiNeighborhood ? `NEIGHBORHOOD:\n${aiNeighborhood}\n` : ''}
AMENITIES:
${aiHighlights.length > 0 ? aiHighlights.map(a => `- ${a}`).join('\n') : (amenities.length > 0 ? amenities.map(a => `- ${a}`).join('\n') : '- Modern appliances\n- Great location')}

${offers.length > 0 ? `SPECIAL OFFER: ${offers[0]}\n` : ''}
Available: ${listing.available_date || 'Immediately'}

Contact for more information and to schedule a viewing.

Posted via DOMMMA - Vancouver's AI-Powered Rental Platform`,
        hashtags: ''
      };
    }
    
    if (platform === 'kijiji') {
      return {
        title: `${beds}BR ${listing.property_type || 'Apartment'} - ${listing.city || 'Vancouver'} $${price}`,
        body: `${title}

Monthly Rent: $${price.toLocaleString()}
Location: ${address}
Bedrooms: ${beds}
Bathrooms: ${baths}
${sqft ? `Square Feet: ${sqft}\n` : ''}
Pet Policy: ${petFriendly}

${aiDescription || listing.description || 'Wonderful rental opportunity in a great location.'}

${aiNeighborhood ? `About the Area:\n${aiNeighborhood}\n` : ''}
Features & Amenities:
${aiHighlights.length > 0 ? aiHighlights.map(a => `✓ ${a}`).join('\n') : (amenities.length > 0 ? amenities.map(a => `✓ ${a}`).join('\n') : '✓ Modern finishes\n✓ Great location')}

${offers.length > 0 ? `★ MOVE-IN SPECIAL: ${offers[0]}\n` : ''}
Available: ${listing.available_date || 'Immediately'}

Contact us today to arrange a viewing!`,
        hashtags: ''
      };
    }
    
    return { title: '', body: '', hashtags: '' };
  };

  const getDeepLink = (listing, platform) => {
    const content = generateListingContent(listing, platform);
    const encodedTitle = encodeURIComponent(content.title);
    const encodedBody = encodeURIComponent(content.body);
    const price = listing.price || 0;
    
    if (platform === 'facebook') {
      // Facebook Marketplace doesn't have a direct post URL, but we can use share dialog
      // For marketplace, users need to go to marketplace and create listing
      return `https://www.facebook.com/marketplace/create/rental`;
    }
    
    if (platform === 'craigslist') {
      // Craigslist Vancouver housing/apartments
      const city = (listing.city || 'vancouver').toLowerCase();
      return `https://${city === 'vancouver' ? 'vancouver' : 'vancouver'}.craigslist.org/post/apa`;
    }
    
    if (platform === 'kijiji') {
      // Kijiji post ad page
      return `https://www.kijiji.ca/p-post-ad.html?categoryId=37`;
    }
    
    return '#';
  };

  const trackSyndication = async (listingId, platform) => {
    try {
      await axios.post(`${API}/api/syndication/track`, {
        listing_id: listingId,
        platform,
        user_id: user.id,
        timestamp: new Date().toISOString()
      });
      setSyndicationHistory(prev => ({
        ...prev,
        [`${listingId}-${platform}`]: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error tracking syndication:', error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2F3A]"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              <Share2 className="text-[#1A2F3A]" />
              Listing Syndication
            </h1>
            <p className="text-gray-600 mt-2">
              Post your listings to Facebook Marketplace, Craigslist, and Kijiji with one click
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <Building size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Active Listings</h3>
              <p className="text-gray-600 mb-6">
                Create a listing first before syndicating to other platforms
              </p>
              <button
                onClick={() => navigate('/my-properties')}
                className="px-6 py-3 bg-[#1A2F3A] text-white rounded-lg font-medium"
              >
                Create Listing
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Listing Selector */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
                  <h3 className="font-semibold text-[#1A2F3A] mb-4">Select Listing</h3>
                  <div className="space-y-3">
                    {listings.map(listing => (
                      <button
                        key={listing.id}
                        onClick={() => setSelectedListing(listing)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedListing?.id === listing.id
                            ? 'border-[#1A2F3A] bg-[#1A2F3A]/5'
                            : 'border-gray-200 hover:border-[#1A2F3A]/50'
                        }`}
                        data-testid={`listing-select-${listing.id}`}
                      >
                        <div className="flex items-start gap-3">
                          {listing.images?.[0] ? (
                            <img 
                              src={listing.images[0]} 
                              alt={listing.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Building size={24} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1A2F3A] truncate">
                              {listing.title || `${listing.bedrooms}BR ${listing.property_type}`}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {listing.address}
                            </p>
                            <p className="text-sm font-semibold text-[#1A2F3A] mt-1">
                              ${listing.price?.toLocaleString()}/mo
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Syndication Options */}
              <div className="lg:col-span-2 space-y-4">
                {selectedListing && PLATFORMS.map(platform => {
                  const content = generateListingContent(selectedListing, platform.id);
                  const deepLink = getDeepLink(selectedListing, platform.id);
                  const isExpanded = expandedPlatform === platform.id;
                  const wasSyndicated = syndicationHistory[`${selectedListing.id}-${platform.id}`];
                  
                  return (
                    <div 
                      key={platform.id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden"
                      data-testid={`platform-${platform.id}`}
                    >
                      {/* Platform Header */}
                      <button
                        onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center`}>
                            <platform.icon size={24} className="text-white" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-[#1A2F3A] flex items-center gap-2">
                              {platform.name}
                              {wasSyndicated && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 size={10} /> Posted
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500">{platform.description}</p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-100">
                          {/* Quick Actions */}
                          <div className="flex gap-3 mt-4 mb-6">
                            <a
                              href={deepLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => trackSyndication(selectedListing.id, platform.id)}
                              className={`flex-1 py-3 ${platform.color} text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                            >
                              <ExternalLink size={18} />
                              Post to {platform.name}
                            </a>
                            <button
                              onClick={() => {
                                copyToClipboard(`${content.title}\n\n${content.body}`, `${platform.id}-all`);
                                trackSyndication(selectedListing.id, platform.id);
                              }}
                              className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              {copiedField === `${platform.id}-all` ? (
                                <><Check size={18} className="text-green-600" /> Copied!</>
                              ) : (
                                <><Copy size={18} /> Copy All</>
                              )}
                            </button>
                          </div>

                          {/* Title Section */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700">Title</label>
                              <button
                                onClick={() => copyToClipboard(content.title, `${platform.id}-title`)}
                                className="text-sm text-[#1A2F3A] hover:underline flex items-center gap-1"
                              >
                                {copiedField === `${platform.id}-title` ? (
                                  <><Check size={14} className="text-green-600" /> Copied</>
                                ) : (
                                  <><Copy size={14} /> Copy</>
                                )}
                              </button>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 font-medium text-[#1A2F3A]">
                              {content.title}
                            </div>
                          </div>

                          {/* Description Section */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Description</label>
                                {generatingAI ? (
                                  <span className="text-xs text-blue-600 flex items-center gap-1">
                                    <RefreshCw size={12} className="animate-spin" /> Generating AI content...
                                  </span>
                                ) : aiContent[selectedListing?.id]?.generated !== false && (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <Sparkles size={12} /> AI Enhanced
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={regenerateAIContent}
                                  disabled={generatingAI}
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                                  title="Regenerate AI content"
                                >
                                  <RefreshCw size={14} className={generatingAI ? 'animate-spin' : ''} /> Regenerate
                                </button>
                                <button
                                  onClick={() => copyToClipboard(content.body, `${platform.id}-body`)}
                                  className="text-sm text-[#1A2F3A] hover:underline flex items-center gap-1"
                                >
                                  {copiedField === `${platform.id}-body` ? (
                                    <><Check size={14} className="text-green-600" /> Copied</>
                                  ) : (
                                    <><Copy size={14} /> Copy</>
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {generatingAI ? (
                                <div className="flex items-center justify-center py-8">
                                  <RefreshCw size={24} className="animate-spin text-blue-500" />
                                </div>
                              ) : (
                                content.body
                              )}
                            </div>
                          </div>

                          {/* Images Section */}
                          {selectedListing.images?.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-2">
                                Images to Upload ({selectedListing.images.length})
                              </label>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {selectedListing.images.slice(0, 5).map((img, idx) => (
                                  <img 
                                    key={idx}
                                    src={img} 
                                    alt={`Listing ${idx + 1}`}
                                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Tip: Download images and upload them to {platform.name} for best results
                              </p>
                            </div>
                          )}

                          {/* Platform-specific tips */}
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800 flex items-start gap-2">
                              <Sparkles size={16} className="flex-shrink-0 mt-0.5" />
                              {platform.id === 'facebook' && (
                                <span>
                                  <strong>Tip:</strong> Click "Post to Facebook" to open Marketplace. 
                                  Then paste the copied title and description. Add your photos for 3x more engagement!
                                </span>
                              )}
                              {platform.id === 'craigslist' && (
                                <span>
                                  <strong>Tip:</strong> Select "Housing → Apartments/Housing for Rent" category. 
                                  Include neighborhood in title for better visibility.
                                </span>
                              )}
                              {platform.id === 'kijiji' && (
                                <span>
                                  <strong>Tip:</strong> Choose "Real Estate → Apartments & Condos for Rent". 
                                  Kijiji allows free listings with up to 10 photos.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Syndication Stats */}
                {Object.keys(syndicationHistory).length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <h4 className="font-semibold text-[#1A2F3A] mb-2 flex items-center gap-2">
                      <CheckCircle2 className="text-green-600" size={20} />
                      Syndication Activity
                    </h4>
                    <p className="text-sm text-gray-600">
                      You've syndicated to {Object.keys(syndicationHistory).length} platform(s) this session. 
                      More exposure means faster rentals!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
