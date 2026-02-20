import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Package, Calendar, MapPin, DollarSign, Clock, CheckCircle, Info, ChevronDown, ChevronUp, Plus, Minus, Sparkles, Lightbulb, ListChecks, MessageSquare, Loader2, Brain } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MovingQuote = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [pricingInfo, setPricingInfo] = useState(null);
  const [quote, setQuote] = useState(null);
  const [aiTips, setAiTips] = useState(null);
  const [showAITips, setShowAITips] = useState(false);
  const [formData, setFormData] = useState({
    origin_address: '',
    destination_address: '',
    move_date: '',
    home_size: '2br',
    has_elevator_origin: false,
    has_elevator_destination: false,
    floor_origin: 1,
    floor_destination: 1,
    special_items: [],
    packing_service: false,
    storage_needed: false,
    storage_duration_months: 1
  });
  const [showSpecialItems, setShowSpecialItems] = useState(false);

  useEffect(() => {
    fetchPricingInfo();
  }, []);

  const fetchPricingInfo = async () => {
    try {
      const response = await axios.get(`${API}/moving/pricing-info`);
      setPricingInfo(response.data);
    } catch (error) {
      console.error('Error fetching pricing info:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleSpecialItem = (item) => {
    setFormData(prev => ({
      ...prev,
      special_items: prev.special_items.includes(item)
        ? prev.special_items.filter(i => i !== item)
        : [...prev.special_items, item]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/moving/quote?include_ai_tips=true`, formData);
      setQuote(response.data);
      if (response.data.ai_tips) {
        setAiTips(response.data.ai_tips);
      }
      setStep(3);
    } catch (error) {
      console.error('Error getting quote:', error);
    }
    setLoading(false);
  };

  const fetchAITips = async () => {
    if (!quote?.id) return;
    setLoadingAI(true);
    try {
      const response = await axios.post(`${API}/moving/quote/${quote.id}/ai-tips`);
      setAiTips(response.data);
    } catch (error) {
      console.error('Error getting AI tips:', error);
    }
    setLoadingAI(false);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        Moving Details
      </h2>
      
      {/* Origin Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin size={14} className="inline mr-1" />
          Moving From
        </label>
        <input
          type="text"
          name="origin_address"
          value={formData.origin_address}
          onChange={handleInputChange}
          placeholder="Enter your current address"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
          data-testid="origin-address-input"
        />
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Floor</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, floor_origin: Math.max(1, p.floor_origin - 1) }))}
                className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center">{formData.floor_origin}</span>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, floor_origin: p.floor_origin + 1 }))}
                className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="has_elevator_origin"
              checked={formData.has_elevator_origin}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Has elevator</span>
          </label>
        </div>
      </div>

      {/* Destination Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin size={14} className="inline mr-1" />
          Moving To
        </label>
        <input
          type="text"
          name="destination_address"
          value={formData.destination_address}
          onChange={handleInputChange}
          placeholder="Enter your new address"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
          data-testid="destination-address-input"
        />
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Floor</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, floor_destination: Math.max(1, p.floor_destination - 1) }))}
                className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center">{formData.floor_destination}</span>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, floor_destination: p.floor_destination + 1 }))}
                className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="has_elevator_destination"
              checked={formData.has_elevator_destination}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Has elevator</span>
          </label>
        </div>
      </div>

      {/* Move Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar size={14} className="inline mr-1" />
          Move Date
        </label>
        <input
          type="date"
          name="move_date"
          value={formData.move_date}
          onChange={handleInputChange}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
          data-testid="move-date-input"
        />
      </div>

      {/* Home Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Home Size
        </label>
        <div className="grid grid-cols-3 gap-3">
          {pricingInfo?.home_sizes?.map(size => (
            <button
              key={size.value}
              type="button"
              onClick={() => setFormData(p => ({ ...p, home_size: size.value }))}
              className={`py-3 px-4 rounded-xl border-2 transition-all text-sm ${
                formData.home_size === size.value
                  ? 'border-[#1A2F3A] bg-[#1A2F3A]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid={`home-size-${size.value}`}
            >
              <div className="font-medium">{size.label}</div>
              <div className="text-xs text-gray-500">~{size.estimated_hours} hrs</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!formData.origin_address || !formData.destination_address || !formData.move_date}
        className="w-full py-4 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="next-step-btn"
      >
        Continue to Services
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        Additional Services
      </h2>

      {/* Special Items */}
      <div>
        <button
          onClick={() => setShowSpecialItems(!showSpecialItems)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl"
        >
          <span className="font-medium text-[#1A2F3A]">Special Items</span>
          <div className="flex items-center gap-2">
            {formData.special_items.length > 0 && (
              <span className="px-2 py-1 bg-[#1A2F3A] text-white text-xs rounded-full">
                {formData.special_items.length} selected
              </span>
            )}
            {showSpecialItems ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>
        
        {showSpecialItems && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {pricingInfo?.special_items?.map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => toggleSpecialItem(item.value)}
                className={`p-3 rounded-xl border text-left transition-all text-sm ${
                  formData.special_items.includes(item.value)
                    ? 'border-[#1A2F3A] bg-[#1A2F3A]/5'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {formData.special_items.includes(item.value) && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">+${item.surcharge}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Packing Service */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="packing_service"
            checked={formData.packing_service}
            onChange={handleInputChange}
            className="w-5 h-5 rounded border-gray-300 mt-0.5"
          />
          <div>
            <div className="font-medium text-[#1A2F3A]">Full Packing Service</div>
            <p className="text-sm text-gray-500">We'll pack all your belongings professionally</p>
            <p className="text-xs text-[#1A2F3A] mt-1">Adds ~40% to base cost</p>
          </div>
        </label>
      </div>

      {/* Storage */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="storage_needed"
            checked={formData.storage_needed}
            onChange={handleInputChange}
            className="w-5 h-5 rounded border-gray-300 mt-0.5"
          />
          <div className="flex-1">
            <div className="font-medium text-[#1A2F3A]">Storage Required</div>
            <p className="text-sm text-gray-500">Need temporary storage before moving in?</p>
            {formData.storage_needed && (
              <div className="mt-3">
                <label className="text-xs text-gray-500">Duration (months)</label>
                <input
                  type="number"
                  name="storage_duration_months"
                  value={formData.storage_duration_months}
                  onChange={handleInputChange}
                  min="1"
                  max="12"
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm mt-1"
                />
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-4 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          data-testid="get-quote-btn"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <DollarSign size={18} />
              Get Your Quote
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-500" size={32} />
        </div>
        <h2 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Your Moving Quote
        </h2>
        <p className="text-gray-500">Valid for 7 days</p>
      </div>

      {/* Price Display */}
      <div className="bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-6 text-white text-center">
        <p className="text-white/70 text-sm mb-2">Estimated Cost</p>
        <p className="text-4xl font-bold">
          ${quote?.estimated_cost_low?.toLocaleString()} - ${quote?.estimated_cost_high?.toLocaleString()}
        </p>
        <p className="text-white/70 text-sm mt-2">CAD</p>
      </div>

      {/* Quote Details */}
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Distance</span>
          <span className="font-medium">{quote?.distance_km} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Estimated Time</span>
          <span className="font-medium">{quote?.estimated_hours} hours</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Truck Size</span>
          <span className="font-medium capitalize">{quote?.truck_size}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Moving Crew</span>
          <span className="font-medium">{quote?.crew_size} professionals</span>
        </div>
        {quote?.includes_packing && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Packing Service</span>
            <span className="font-medium text-green-600">Included</span>
          </div>
        )}
        {quote?.includes_storage && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Storage (monthly)</span>
            <span className="font-medium">${quote?.storage_monthly_cost}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {quote?.notes?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="text-amber-600 flex-shrink-0" size={18} />
            <ul className="text-sm text-amber-800 space-y-1">
              {quote.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AI Tips Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl overflow-hidden">
        <button
          onClick={() => {
            if (!aiTips && !loadingAI) {
              fetchAITips();
            }
            setShowAITips(!showAITips);
          }}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Brain className="text-white" size={20} />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-[#1A2F3A]">AI Moving Assistant</h4>
              <p className="text-xs text-gray-500">Personalized tips for your move</p>
            </div>
          </div>
          {loadingAI ? (
            <Loader2 className="animate-spin text-purple-500" size={20} />
          ) : (
            <ChevronDown className={`text-gray-400 transition-transform ${showAITips ? 'rotate-180' : ''}`} size={20} />
          )}
        </button>
        
        {showAITips && aiTips && (
          <div className="px-4 pb-4 space-y-4">
            {/* Summary */}
            {aiTips.summary && (
              <div className="p-3 bg-white rounded-xl">
                <p className="text-sm text-gray-700">{aiTips.summary}</p>
              </div>
            )}
            
            {/* Money Saving Tips */}
            {aiTips.money_saving_tips?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                  <DollarSign size={14} /> Money-Saving Tips
                </h5>
                <div className="space-y-2">
                  {aiTips.money_saving_tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg">
                      <Sparkles size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Preparation Checklist */}
            {aiTips.preparation_checklist?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <ListChecks size={14} /> Pre-Move Checklist
                </h5>
                <div className="bg-white rounded-xl p-3">
                  <ul className="space-y-2">
                    {aiTips.preparation_checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Moving Day Tips */}
            {aiTips.moving_day_tips?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-2">
                  <Truck size={14} /> Moving Day Tips
                </h5>
                <div className="space-y-2">
                  {aiTips.moving_day_tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg">
                      <Lightbulb size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Neighborhood Info */}
            {aiTips.neighborhood_info && (
              <div className="p-3 bg-white rounded-xl">
                <h5 className="text-sm font-medium text-purple-700 mb-1 flex items-center gap-2">
                  <MapPin size={14} /> About Your New Area
                </h5>
                <p className="text-sm text-gray-600">{aiTips.neighborhood_info}</p>
              </div>
            )}
            
            {/* Timing Advice */}
            {aiTips.timing_advice && (
              <div className="p-3 bg-white rounded-xl">
                <h5 className="text-sm font-medium text-teal-700 mb-1 flex items-center gap-2">
                  <Clock size={14} /> Best Time to Move
                </h5>
                <p className="text-sm text-gray-600">{aiTips.timing_advice}</p>
              </div>
            )}
          </div>
        )}
        
        {showAITips && !aiTips && !loadingAI && (
          <div className="px-4 pb-4">
            <button
              onClick={fetchAITips}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-indigo-600"
              data-testid="get-ai-tips-btn"
            >
              Get Personalized Tips
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setQuote(null);
            setAiTips(null);
            setShowAITips(false);
            setStep(1);
            setFormData({
              origin_address: '',
              destination_address: '',
              move_date: '',
              home_size: '2br',
              has_elevator_origin: false,
              has_elevator_destination: false,
              floor_origin: 1,
              floor_destination: 1,
              special_items: [],
              packing_service: false,
              storage_needed: false,
              storage_duration_months: 1
            });
          }}
          className="px-6 py-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          New Quote
        </button>
        <button
          className="flex-1 py-4 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors"
          data-testid="book-moving-btn"
        >
          Book This Move
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#1A2F3A] text-white px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-white/70 hover:text-white">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
              <Truck size={24} />
              <div>
                <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Moving Quote
                </h1>
                <p className="text-sm text-white/70">Get an instant estimate for your move</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s ? <CheckCircle size={16} /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 rounded ${step > s ? 'bg-[#1A2F3A]' : 'bg-gray-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Details</span>
            <span>Services</span>
            <span>Quote</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </main>
    </div>
  );
};

export default MovingQuote;
