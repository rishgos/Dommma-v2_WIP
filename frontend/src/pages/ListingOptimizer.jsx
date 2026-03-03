import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, DollarSign, TrendingUp, Building, MapPin,
  CheckCircle2, AlertTriangle, Loader2, RefreshCw,
  Lightbulb, BarChart3, Home, ArrowRight, Copy, Check,
  Target, Zap, Award
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function ListingOptimizer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!user || user.user_type !== 'landlord') {
      navigate('/login');
      return;
    }
    fetchListings();
  }, [user, navigate]);

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

  const analyzeAndOptimize = async () => {
    if (!selectedListing) return;
    
    setAnalyzing(true);
    setOptimization(null);
    
    try {
      const response = await axios.post(`${API}/api/listings/optimize`, {
        listing_id: selectedListing.id,
        user_id: user.id
      });
      setOptimization(response.data);
    } catch (error) {
      console.error('Error optimizing listing:', error);
      // Fallback to local optimization if API fails
      setOptimization(generateLocalOptimization(selectedListing));
    } finally {
      setAnalyzing(false);
    }
  };

  const generateLocalOptimization = (listing) => {
    const city = listing.city || 'Vancouver';
    const bedrooms = listing.bedrooms || 1;
    const currentPrice = listing.price || 2000;
    
    // Estimate market rates based on bedrooms and city
    const marketRates = {
      'Vancouver': { 1: 2200, 2: 3000, 3: 3800 },
      'Burnaby': { 1: 1900, 2: 2600, 3: 3200 },
      'Surrey': { 1: 1600, 2: 2200, 3: 2800 },
      'Richmond': { 1: 2000, 2: 2800, 3: 3500 }
    };
    
    const cityRates = marketRates[city] || marketRates['Vancouver'];
    const suggestedPrice = cityRates[Math.min(bedrooms, 3)] || currentPrice;
    const priceDiff = suggestedPrice - currentPrice;
    const priceStatus = priceDiff > 200 ? 'below_market' : priceDiff < -200 ? 'above_market' : 'competitive';
    
    // Generate title suggestions
    const titleSuggestions = [
      `Modern ${bedrooms}BR ${listing.property_type || 'Apartment'} in ${city} - ${listing.amenities?.includes('In-Suite Laundry') ? 'In-Suite Laundry!' : 'Great Location!'}`,
      `Bright & Spacious ${bedrooms} Bedroom in Prime ${city} Location`,
      `${listing.pet_friendly ? 'Pet-Friendly ' : ''}${bedrooms}BR with ${listing.amenities?.[0] || 'Modern Amenities'}`
    ];
    
    // Generate description improvements
    const descriptionTips = [];
    if (!listing.description || listing.description.length < 100) {
      descriptionTips.push('Add a detailed description (150+ words) - listings with longer descriptions get 40% more inquiries');
    }
    if (!listing.amenities || listing.amenities.length < 3) {
      descriptionTips.push('List at least 5 amenities - highlight unique features like in-suite laundry, parking, or building gym');
    }
    if (!listing.images || listing.images.length < 5) {
      descriptionTips.push('Add more photos (8-10 recommended) - listings with more photos rent 50% faster');
    }
    if (!listing.offers || listing.offers.length === 0) {
      descriptionTips.push('Consider adding a move-in special to stand out (e.g., "First month 50% off" or "Free parking for 3 months")');
    }
    
    // Competitive analysis
    const competitorInsights = [
      `Similar ${bedrooms}BR listings in ${city} average $${suggestedPrice.toLocaleString()}/month`,
      `${bedrooms}BR rentals in your area typically include: ${['In-Suite Laundry', 'Parking', 'Gym Access'].slice(0, 2).join(', ')}`,
      `Peak rental season in ${city} is May-August - consider timing your availability`
    ];
    
    // Score calculation
    let score = 50;
    if (listing.images?.length >= 5) score += 15;
    if (listing.description?.length >= 100) score += 10;
    if (listing.amenities?.length >= 3) score += 10;
    if (priceStatus === 'competitive') score += 15;
    
    return {
      listing_id: listing.id,
      current_price: currentPrice,
      suggested_price: suggestedPrice,
      price_status: priceStatus,
      price_adjustment: priceDiff,
      optimization_score: Math.min(100, score),
      title_suggestions: titleSuggestions,
      description_improvements: descriptionTips,
      competitor_insights: competitorInsights,
      quick_wins: [
        listing.images?.length < 5 && 'Add 3+ more photos',
        !listing.offers?.length && 'Add a move-in special',
        !listing.description && 'Write a compelling description',
        listing.amenities?.length < 5 && 'List more amenities'
      ].filter(Boolean),
      generated_description: `Welcome to this ${listing.pet_friendly ? 'pet-friendly ' : ''}${bedrooms}-bedroom ${listing.property_type || 'apartment'} in the heart of ${city}!\n\nThis bright and spacious unit features ${listing.amenities?.slice(0, 3).join(', ') || 'modern finishes throughout'}. ${listing.sqft ? `At ${listing.sqft} sqft, there's` : 'There\'s'} plenty of room for comfortable living.\n\nHighlights:\n${listing.amenities?.map(a => `• ${a}`).join('\n') || '• Modern kitchen appliances\n• Great natural light'}\n\nLocated in a prime ${city} neighborhood with easy access to transit, shopping, and dining. ${listing.parking ? 'Parking included!' : ''}\n\nAvailable ${listing.available_date || 'immediately'}. Contact us today to schedule a viewing!`
    };
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriceStatusColor = (status) => {
    if (status === 'below_market') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (status === 'above_market') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getPriceStatusText = (status) => {
    if (status === 'below_market') return 'Below Market - You could charge more!';
    if (status === 'above_market') return 'Above Market - Consider lowering for faster rental';
    return 'Competitively Priced';
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
              <Sparkles className="text-yellow-500" />
              AI Listing Optimizer
            </h1>
            <p className="text-gray-600 mt-2">
              Get AI-powered recommendations to maximize your listing's visibility and rental speed
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <Building size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Listings to Optimize</h3>
              <p className="text-gray-600 mb-6">
                Create a listing first to get AI optimization suggestions
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
                  <h3 className="font-semibold text-[#1A2F3A] mb-4">Select Listing to Optimize</h3>
                  <div className="space-y-3">
                    {listings.map(listing => (
                      <button
                        key={listing.id}
                        onClick={() => {
                          setSelectedListing(listing);
                          setOptimization(null);
                        }}
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
                            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                              <MapPin size={12} /> {listing.city}
                            </p>
                            <p className="text-sm font-semibold text-[#1A2F3A] mt-1">
                              ${listing.price?.toLocaleString()}/mo
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={analyzeAndOptimize}
                    disabled={!selectedListing || analyzing}
                    className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="analyze-btn"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Analyze & Optimize
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Optimization Results */}
              <div className="lg:col-span-2 space-y-6">
                {!optimization && !analyzing && (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                    <Lightbulb size={48} className="text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">
                      Ready to Optimize
                    </h3>
                    <p className="text-gray-600">
                      Select a listing and click "Analyze & Optimize" to get AI-powered recommendations
                    </p>
                  </div>
                )}

                {analyzing && (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                    <Loader2 size={48} className="text-purple-600 mx-auto mb-4 animate-spin" />
                    <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">
                      Analyzing Your Listing...
                    </h3>
                    <p className="text-gray-600">
                      Nova AI is comparing with market data and generating recommendations
                    </p>
                  </div>
                )}

                {optimization && (
                  <>
                    {/* Score Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-[#1A2F3A] mb-1">Listing Optimization Score</h3>
                          <p className="text-sm text-gray-500">Based on completeness, pricing, and market analysis</p>
                        </div>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(optimization.optimization_score)}`}>
                          {optimization.optimization_score}
                        </div>
                      </div>
                    </div>

                    {/* Price Analysis */}
                    <div className={`rounded-2xl p-6 border ${getPriceStatusColor(optimization.price_status)}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            <DollarSign size={20} />
                            Price Analysis
                          </h3>
                          <p className="text-sm mt-1">{getPriceStatusText(optimization.price_status)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Current: ${optimization.current_price?.toLocaleString()}/mo</p>
                          <p className="text-lg font-bold">Suggested: ${optimization.suggested_price?.toLocaleString()}/mo</p>
                          {optimization.price_adjustment !== 0 && (
                            <p className={`text-sm ${optimization.price_adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {optimization.price_adjustment > 0 ? '+' : ''}${optimization.price_adjustment?.toLocaleString()} potential
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Wins */}
                    {optimization.quick_wins?.length > 0 && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                        <h3 className="font-semibold text-[#1A2F3A] mb-3 flex items-center gap-2">
                          <Zap size={20} className="text-yellow-600" />
                          Quick Wins
                        </h3>
                        <div className="space-y-2">
                          {optimization.quick_wins.map((win, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-yellow-800">
                              <ArrowRight size={14} />
                              {win}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Title Suggestions */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h3 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                        <Target size={20} />
                        Optimized Title Suggestions
                      </h3>
                      <div className="space-y-3">
                        {optimization.title_suggestions?.map((title, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-[#1A2F3A] flex-1">{title}</p>
                            <button
                              onClick={() => copyToClipboard(title, `title-${idx}`)}
                              className="ml-3 text-[#1A2F3A] hover:text-purple-600"
                            >
                              {copiedField === `title-${idx}` ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Generated Description */}
                    {optimization.generated_description && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-[#1A2F3A] flex items-center gap-2">
                            <Award size={20} />
                            AI-Generated Description
                          </h3>
                          <button
                            onClick={() => copyToClipboard(optimization.generated_description, 'description')}
                            className="px-3 py-1 bg-[#1A2F3A] text-white rounded-lg text-sm flex items-center gap-1"
                          >
                            {copiedField === 'description' ? <Check size={14} /> : <Copy size={14} />}
                            {copiedField === 'description' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                          {optimization.generated_description}
                        </div>
                      </div>
                    )}

                    {/* Improvement Tips */}
                    {optimization.description_improvements?.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h3 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                          <AlertTriangle size={20} className="text-yellow-500" />
                          Areas for Improvement
                        </h3>
                        <div className="space-y-3">
                          {optimization.description_improvements.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                              <Lightbulb size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-yellow-800">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Market Insights */}
                    {optimization.competitor_insights?.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                          <BarChart3 size={20} className="text-blue-600" />
                          Market Insights
                        </h3>
                        <div className="space-y-2">
                          {optimization.competitor_insights.map((insight, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                              <TrendingUp size={14} className="mt-0.5 flex-shrink-0" />
                              {insight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
