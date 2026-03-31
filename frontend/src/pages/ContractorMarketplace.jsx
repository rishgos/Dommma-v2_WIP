import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Star, MapPin, Clock, DollarSign, Shield,
  Phone, Mail, ChevronRight, Filter, Wrench, Zap, Droplets,
  Paintbrush, Hammer, Leaf, Sparkles, Calendar, Send, X, MessageSquare, Plus, Briefcase,
  ArrowLeft, Loader2, Check, User, AlertCircle, Navigation, Truck, Home, TreePine, Bug,
  Key, Snowflake, Trash2, Sofa
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';
import ContractorReviews from '../components/reviews/ContractorReviews';
import ContractorLeaderboard from '../components/reviews/ContractorLeaderboard';
import MainLayout from '../components/layout/MainLayout';
import AddressAutocomplete from '../components/ui/AddressAutocomplete';
import PostalCodeAutocomplete from '../components/ui/PostalCodeAutocomplete';
import { JobCard, JobBidForm, BidsList } from '../components/jobs/JobComponents';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categoryIcons = {
  plumbing: Droplets, electrical: Zap, painting: Paintbrush,
  renovation: Hammer, carpentry: Hammer, landscaping: Leaf,
  cleaning: Sparkles, general: Wrench, moving: Truck,
  housekeeping: Home, security: Shield, yardwork: TreePine,
  pestcontrol: Bug, appliance: Wrench, locksmith: Key,
  snowremoval: Snowflake, junkremoval: Trash2, homestaging: Sofa
};

// Service categories with their icons and sub-services
const serviceCategories = {
  plumbing: {
    icon: Droplets,
    label: 'Plumbing',
    services: [
      'General Plumbing', 'Bathroom & Shower Plumbing', 'Bathroom Repair',
      'Taps & Fixtures Installation', 'Water Heater Repair', 'Boiler Installation',
      'Drain Cleaning', 'Pipe Repair', 'Toilet Repair'
    ]
  },
  electrical: {
    icon: Zap,
    label: 'Electrical',
    services: [
      'General Electrical', 'Electrical Wiring', 'Light Fixture Installation',
      'Outlet Installation', 'Panel Upgrade', 'EV Charger Installation',
      'Smart Home Wiring', 'Electrical Inspection'
    ]
  },
  painting: {
    icon: Paintbrush,
    label: 'Painting',
    services: [
      'Interior Painting', 'Exterior Painting', 'Cabinet Painting',
      'Deck Staining', 'Wallpaper Installation', 'Pressure Washing'
    ]
  },
  renovation: {
    icon: Hammer,
    label: 'Renovation',
    services: [
      'Kitchen Renovation', 'Bathroom Renovation', 'Basement Finishing',
      'Flooring Installation', 'Tile Installation', 'Window Replacement'
    ]
  },
  landscaping: {
    icon: Leaf,
    label: 'Landscaping',
    services: [
      'Lawn Care', 'Garden Design', 'Tree Trimming', 'Tree Removal',
      'Fence Installation', 'Deck Building', 'Patio Installation'
    ]
  },
  cleaning: {
    icon: Sparkles,
    label: 'Cleaning',
    services: [
      'House Cleaning', 'Deep Cleaning', 'Move-in/Move-out Cleaning',
      'Carpet Cleaning', 'Window Cleaning', 'Office Cleaning'
    ]
  },
  moving: {
    icon: Truck,
    label: 'Moving Services',
    services: [
      'Local Moving', 'Long Distance Moving', 'Furniture Moving',
      'Piano Moving', 'Packing Services', 'Storage Services',
      'Office Relocation', 'Senior Moving'
    ]
  },
  housekeeping: {
    icon: Home,
    label: 'Housekeeping',
    services: [
      'Regular Housekeeping', 'Laundry Services', 'Ironing Services',
      'Organizing Services', 'Meal Preparation', 'Grocery Shopping',
      'Pet Sitting', 'House Sitting'
    ]
  },
  security: {
    icon: Shield,
    label: 'Security Services',
    services: [
      'Security System Installation', 'Camera Installation', 'Alarm Systems',
      'Smart Lock Installation', 'Security Patrol', 'Access Control Systems',
      'Intercom Installation', 'Security Consultation'
    ]
  },
  yardwork: {
    icon: TreePine,
    label: 'Yard Work',
    services: [
      'Lawn Mowing', 'Hedge Trimming', 'Leaf Removal', 'Weed Control',
      'Mulching', 'Spring/Fall Cleanup', 'Irrigation Systems', 'Sod Installation'
    ]
  },
  pestcontrol: {
    icon: Bug,
    label: 'Pest Control',
    services: [
      'General Pest Control', 'Rodent Control', 'Insect Extermination',
      'Bed Bug Treatment', 'Termite Control', 'Wildlife Removal',
      'Preventive Treatment', 'Commercial Pest Control'
    ]
  },
  appliance: {
    icon: Wrench,
    label: 'Appliance Repair',
    services: [
      'Refrigerator Repair', 'Washer/Dryer Repair', 'Dishwasher Repair',
      'Oven/Stove Repair', 'Microwave Repair', 'HVAC Repair',
      'Garbage Disposal Repair', 'Appliance Installation'
    ]
  },
  locksmith: {
    icon: Key,
    label: 'Locksmith',
    services: [
      'Lock Installation', 'Lock Repair', 'Key Duplication',
      'Lockout Services', 'Rekeying', 'Safe Services',
      'Car Key Replacement', 'Master Key Systems'
    ]
  },
  snowremoval: {
    icon: Snowflake,
    label: 'Snow Removal',
    services: [
      'Driveway Snow Removal', 'Sidewalk Clearing', 'Roof Snow Removal',
      'Ice Control', 'Salting Services', 'Commercial Snow Removal',
      'Emergency Snow Removal', 'Seasonal Contracts'
    ]
  },
  junkremoval: {
    icon: Trash2,
    label: 'Junk Removal',
    services: [
      'Furniture Removal', 'Appliance Disposal', 'Construction Debris',
      'Estate Cleanouts', 'Garage Cleanouts', 'Yard Waste Removal',
      'E-Waste Disposal', 'Donation Pickup'
    ]
  },
  homestaging: {
    icon: Sofa,
    label: 'Home Staging',
    services: [
      'Full Home Staging', 'Partial Staging', 'Virtual Staging',
      'Furniture Rental', 'Consultation', 'Occupied Home Staging',
      'Vacant Home Staging', 'Model Home Design'
    ]
  }
};

// Question flows per category
const questionFlows = {
  plumbing: [
    { id: 'property_type', question: 'What is the type of property?', type: 'radio', options: ['Flat or Apartment', 'House', 'Commercial Property', 'Other'] },
    { id: 'work_type', question: 'What type of work do you need?', type: 'radio', options: ['Install', 'Repair or replace', 'Maintenance', 'As recommended by professional', 'Other'] },
    { id: 'materials', question: 'Will you provide all necessary materials?', type: 'radio', options: ['Yes, I will provide', 'Yes, but need guidance', 'No, professional to provide', 'Other'] },
    { id: 'quantity', question: 'How many taps/fixtures?', type: 'number_select', options: ['1', '2', '3', '4', '5+'] }
  ],
  electrical: [
    { id: 'property_type', question: 'What is the type of property?', type: 'radio', options: ['Flat or Apartment', 'House', 'Commercial Property', 'Other'] },
    { id: 'work_type', question: 'What type of work do you need?', type: 'radio', options: ['Install new', 'Repair existing', 'Upgrade/Replace', 'Safety inspection', 'Other'] },
    { id: 'outlets_count', question: 'How many outlets/fixtures need work?', type: 'number_select', options: ['1-2', '3-5', '6-10', '10+'] }
  ],
  painting: [
    { id: 'property_type', question: 'What is the type of property?', type: 'radio', options: ['Flat or Apartment', 'House', 'Commercial Property', 'Other'] },
    { id: 'area_type', question: 'What area needs painting?', type: 'radio', options: ['Interior walls', 'Exterior walls', 'Ceiling', 'Trim/Doors', 'Cabinets', 'Other'] },
    { id: 'rooms_count', question: 'How many rooms/areas?', type: 'number_select', options: ['1', '2-3', '4-5', '6+', 'Whole house'] }
  ],
  default: [
    { id: 'property_type', question: 'What is the type of property?', type: 'radio', options: ['Flat or Apartment', 'House', 'Commercial Property', 'Other'] },
    { id: 'work_type', question: 'What type of work do you need?', type: 'radio', options: ['Install', 'Repair', 'Maintenance', 'Consultation', 'Other'] }
  ]
};

const ContractorMarketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  // Contractor browsing states
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contractorSearchQuery, setContractorSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingService, setBookingService] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    title: '', description: '', preferred_date: '', preferred_time: '', address: '', notes: ''
  });
  
  // Job browsing states
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [activeTab, setActiveTab] = useState('contractors');
  const [selectedJobForBid, setSelectedJobForBid] = useState(null);
  const [selectedJobForBids, setSelectedJobForBids] = useState(null);
  
  // Bark.com-style wizard states
  const [wizardStep, setWizardStep] = useState('search'); // search, questions, contact, complete
  const [serviceQuery, setServiceQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [postcode, setPostcode] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    name: user?.name || '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const categories = [
    'plumbing', 'electrical', 'painting', 'renovation', 'landscaping', 'cleaning',
    'moving', 'housekeeping', 'security', 'yardwork', 'pestcontrol', 'appliance',
    'locksmith', 'snowremoval', 'junkremoval', 'homestaging'
  ];

  // Load saved postal code from localStorage or user profile
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // First try user's saved address
    if (user?.address) {
      // Extract postal code from address if it exists
      const postalMatch = user.address.match(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/i);
      if (postalMatch) {
        setPostcode(postalMatch[0].toUpperCase());
        return;
      }
    }
    // Then try localStorage
    const savedPostcode = localStorage.getItem('dommma_postcode');
    if (savedPostcode) {
      setPostcode(savedPostcode);
    }
  }, [user]);

  // Save postal code to localStorage when it changes
  useEffect(() => {
    if (postcode && postcode.length >= 3) {
      localStorage.setItem('dommma_postcode', postcode);
    }
  }, [postcode]);

  useEffect(() => { 
    fetchContractors();
    fetchJobs();
  }, [contractorSearchQuery, selectedCategory]);
  
  useEffect(() => {
    if (user) {
      setContactInfo(prev => ({
        ...prev,
        email: user.email || prev.email,
        name: user.name || prev.name
      }));
    }
  }, [user]);

  // Detect location using browser geolocation
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use Google Maps Geocoding API to get postal code
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_KEY || ''}`
      );

      if (response.data.results && response.data.results.length > 0) {
        const addressComponents = response.data.results[0].address_components;
        const postalComponent = addressComponents.find(c => c.types.includes('postal_code'));
        if (postalComponent) {
          setPostcode(postalComponent.short_name);
          localStorage.setItem('dommma_postcode', postalComponent.short_name);
        }
      }
    } catch (err) {
      console.log('Location detection failed:', err);
      // Silently fail - user can enter manually
    } finally {
      setDetectingLocation(false);
    }
  };

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (contractorSearchQuery) params.append('q', contractorSearchQuery);
      if (selectedCategory) params.append('specialty', selectedCategory);
      const res = await axios.get(`${API}/contractors/search?${params}`);
      setContractors(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      const res = await axios.get(`${API}/jobs?${params}`);
      setJobs(res.data);
    } catch (e) { console.error(e); } finally { setLoadingJobs(false); }
  };

  // Get filtered suggestions for service search
  const getSuggestions = () => {
    if (!serviceQuery.trim()) return [];
    const query = serviceQuery.toLowerCase();
    const results = [];
    
    Object.entries(serviceCategories).forEach(([category, data]) => {
      data.services.forEach(service => {
        if (service.toLowerCase().includes(query)) {
          results.push({ category, service, icon: data.icon });
        }
      });
    });
    
    return results.slice(0, 8);
  };

  const suggestions = getSuggestions();
  
  // Get questions for current category
  const getQuestions = () => {
    if (!selectedServiceCategory) return questionFlows.default;
    return questionFlows[selectedServiceCategory] || questionFlows.default;
  };
  
  const questions = getQuestions();
  const currentQuestion = questions[currentQuestionIndex];
  const totalSteps = questions.length + 3;
  const currentProgress = wizardStep === 'search' ? 0 : 
    wizardStep === 'questions' ? ((currentQuestionIndex + 1) / totalSteps) * 100 :
    wizardStep === 'contact' ? 90 : 100;

  // Handle service selection from dropdown - fill in the input but stay on search
  const handleSelectSuggestion = (suggestion) => {
    setSelectedServiceCategory(suggestion.category);
    setSelectedService(suggestion.service);
    setServiceQuery(suggestion.service);
    setShowSuggestions(false);
    // Stay on search step - user needs to enter postcode and click Search
  };

  // Handle Search button click - validate and start wizard
  const handleStartWizard = () => {
    if (!serviceQuery.trim()) {
      setError('Please select a service');
      return;
    }
    if (!postcode.trim()) {
      setError('Please enter your postal code');
      return;
    }
    
    // If no category selected from suggestions, try to match
    if (!selectedServiceCategory && serviceQuery) {
      const matchedSuggestion = suggestions[0];
      if (matchedSuggestion) {
        setSelectedServiceCategory(matchedSuggestion.category);
        setSelectedService(matchedSuggestion.service);
      } else {
        // Default to general
        setSelectedServiceCategory('general');
        setSelectedService(serviceQuery);
      }
    }
    
    setError(null);
    setWizardStep('questions');
    setCurrentQuestionIndex(0);
  };

  // Handle answer selection in wizard
  const handleAnswer = (answer) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Move to additional details
      setCurrentQuestionIndex(questions.length);
    }
  };

  // Handle back in wizard
  const handleWizardBack = () => {
    if (wizardStep === 'contact') {
      setCurrentQuestionIndex(questions.length);
      setWizardStep('questions');
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // Back to search
      setWizardStep('search');
      setSelectedService('');
      setSelectedServiceCategory(null);
      setAnswers({});
    }
  };

  // Close wizard
  const handleCloseWizard = () => {
    setWizardStep('search');
    setSelectedService('');
    setSelectedServiceCategory(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setAdditionalDetails('');
    setError(null);
  };

  // Continue to contact step
  const handleContinueToContact = () => {
    setWizardStep('contact');
  };

  // Submit the job request
  const handleSubmitJob = async () => {
    if (!contactInfo.email || !contactInfo.name) {
      setError('Please provide your email and name');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const jobData = {
        title: selectedService,
        category: selectedServiceCategory,
        description: `Service: ${selectedService}\n${Object.entries(answers).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n')}\n${additionalDetails ? `Additional details: ${additionalDetails}` : ''}`,
        address: postcode,
        urgency: 'flexible',
        contact_email: contactInfo.email,
        contact_name: contactInfo.name,
        contact_phone: contactInfo.phone,
        answers: answers
      };

      const userId = user?.id || 'guest';
      const res = await axios.post(`${API}/jobs?user_id=${userId}`, jobData);
      setJobId(res.data.id);
      setWizardStep('complete');
      
      // Refresh jobs list
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const showDetailsStep = currentQuestionIndex >= questions.length;
  const showPostcodeConfirmStep = currentQuestionIndex >= questions.length + 1;

  const handleJobViewBids = (job) => {
    if (user?.user_type === 'contractor') {
      setSelectedJobForBid(job);
    } else if (job.user_id === user?.id) {
      setSelectedJobForBids(job);
    } else if (!user) {
      navigate('/login');
    }
  };

  const viewContractor = (c) => {
    setSelectedContractor(c);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      await axios.post(`${API}/bookings`, {
        customer_id: user.id,
        contractor_id: selectedContractor.user_id,
        title: bookingForm.title || bookingService?.title,
        description: bookingForm.description || bookingService?.description,
        address: bookingForm.address,
        preferred_date: bookingForm.preferred_date,
        preferred_time: bookingForm.preferred_time
      });
      setShowBooking(false);
      setBookingForm({ title: '', description: '', preferred_date: '', preferred_time: '', address: '', notes: '' });
      alert('Booking request sent!');
    } catch (e) {
      console.error(e);
      alert('Failed to submit booking.');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
    ));
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0]">
        {/* Bark.com-style Hero Search Section */}
        <header className="bg-[#1A2F3A] text-white px-6 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 
              className="text-4xl md:text-5xl font-bold mb-3"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Find the best professionals
            </h1>
            <p className="text-lg text-white/70 mb-8">Get free quotes within minutes</p>
            
            {/* Search Box */}
            <div className="relative z-10 max-w-2xl mx-auto">
              {error && wizardStep === 'search' && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              <div className="flex items-stretch bg-white rounded-lg shadow-lg">
                <div className="flex-1 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={serviceQuery}
                    onChange={(e) => {
                      setServiceQuery(e.target.value);
                      setShowSuggestions(true);
                      setSelectedServiceCategory(null);
                      setSelectedService('');
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="What service are you looking for?"
                    className="w-full px-4 py-4 text-gray-800 text-lg border-none outline-none rounded-l-lg"
                    data-testid="service-search-input"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-xl z-50 max-h-80 overflow-y-auto" style={{marginTop: '-2px'}}>
                      {suggestions.map((s, i) => {
                        const Icon = s.icon;
                        return (
                          <button
                            key={i}
                            onClick={() => handleSelectSuggestion(s)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                            data-testid={`suggestion-${i}`}
                          >
                            <Icon size={18} className="text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700">{s.service}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="border-l border-gray-200">
                  <PostalCodeAutocomplete
                    value={postcode}
                    onChange={setPostcode}
                    onDetectLocation={detectLocation}
                    detectingLocation={detectingLocation}
                    placeholder="Postal code"
                  />
                </div>
                
                <button
                  onClick={handleStartWizard}
                  className="px-6 md:px-8 bg-[#2C4A52] text-white font-medium hover:bg-[#3d5c64] transition-colors rounded-r-lg"
                  data-testid="search-btn"
                >
                  Search
                </button>
              </div>
              
              {/* Use my location link */}
              {!postcode && (
                <button
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="mt-3 text-sm text-white/60 hover:text-white underline flex items-center gap-1 mx-auto"
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Detecting location...
                    </>
                  ) : (
                    <>
                      <Navigation size={14} />
                      Use my current location
                    </>
                  )}
                </button>
              )}
              
              {/* Popular Services */}
              <div className="mt-4 text-sm text-white/50">
                <span>Popular: </span>
                {['House Cleaning', 'Plumber', 'Moving', 'Locksmith', 'Snow Removal'].map((service) => (
                  <button
                    key={service}
                    onClick={() => {
                      setServiceQuery(service);
                      setShowSuggestions(true);
                    }}
                    className="text-white/70 hover:text-white underline mx-1"
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Category Quick Links */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {Object.entries(serviceCategories).map(([key, data]) => {
                const Icon = data.icon;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setServiceQuery(data.label);
                      setShowSuggestions(true);
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Icon size={22} className="text-white/80" />
                    </div>
                    <span className="text-sm text-white/70">{data.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Tabs and Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('contractors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'contractors' 
                  ? 'bg-[#1A2F3A] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Wrench size={16} />
              Browse Contractors
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'jobs' 
                  ? 'bg-[#1A2F3A] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Briefcase size={16} />
              Posted Jobs
              {jobs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-400 text-[#1A2F3A] rounded-full">{jobs.length}</span>
              )}
            </button>
          </div>

          <div className="lg:flex gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-full text-sm ${!selectedCategory ? 'bg-[#1A2F3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  All
                </button>
                {categories.map(cat => {
                  const Icon = categoryIcons[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm capitalize ${selectedCategory === cat ? 'bg-[#1A2F3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Icon size={14} /> {cat}
                    </button>
                  );
                })}
              </div>

              {/* Results based on active tab */}
              {activeTab === 'contractors' ? (
                <>
                  {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-24 bg-gray-200 rounded-xl mb-4" /><div className="h-4 bg-gray-200 rounded w-2/3" /></div>)}
                    </div>
                  ) : contractors.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center">
                      <Wrench className="mx-auto mb-4 text-gray-300" size={64} />
                      <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Contractors Found</h3>
                      <p className="text-gray-500">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {contractors.map(c => (
                        <div key={c.id} className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => viewContractor(c)} data-testid={`contractor-card-${c.id}`}>
                          <div className="h-28 bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] relative p-4">
                            <div className="absolute top-3 right-3 flex items-center gap-1">
                              {c.verified && <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs"><Shield size={10} /> Verified</span>}
                            </div>
                            <div className="absolute bottom-0 left-4 translate-y-1/2">
                              <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center text-xl font-bold text-[#1A2F3A]">
                                {c.business_name?.charAt(0)}
                              </div>
                            </div>
                          </div>
                          <div className="pt-9 px-4 pb-4">
                            <h3 className="font-semibold text-[#1A2F3A] mb-1">{c.business_name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center">{renderStars(c.rating)}</div>
                              <span className="text-sm text-gray-500">({c.review_count || 0})</span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{c.description}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {c.specialties?.slice(0, 3).map(s => (
                                <span key={s} className="px-2 py-0.5 bg-[#F5F5F0] text-gray-600 rounded text-xs capitalize">{s}</span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 flex items-center gap-1"><MapPin size={12} />{c.service_areas?.[0]}</span>
                              {c.hourly_rate && <span className="font-semibold text-[#1A2F3A]">${c.hourly_rate}/hr</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {loadingJobs ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-20 bg-gray-200 rounded-xl mb-4" /><div className="h-4 bg-gray-200 rounded w-2/3" /></div>)}
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center">
                      <Briefcase className="mx-auto mb-4 text-gray-300" size={64} />
                      <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Jobs Posted Yet</h3>
                      <p className="text-gray-500 mb-4">
                        {user?.user_type === 'contractor' 
                          ? 'Check back later for new job opportunities' 
                          : 'Use the search above to post a job and receive quotes'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {jobs.map(job => (
                        <JobCard 
                          key={job.id} 
                          job={job} 
                          onViewBids={handleJobViewBids}
                          isOwner={job.user_id === user?.id}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar - Leaderboard */}
            <div className="hidden lg:block w-80">
              <ContractorLeaderboard limit={5} compact={false} />
            </div>
          </div>
        </div>

        {/* Question Wizard Modal */}
        {(wizardStep === 'questions' || wizardStep === 'contact') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Progress Bar */}
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#1A2F3A] transition-all duration-300"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>
                  <button 
                    onClick={handleCloseWizard}
                    className="ml-4 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
                <p className="text-xs text-gray-400">{selectedService} • {postcode}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {wizardStep === 'questions' && !showDetailsStep && currentQuestion && (
                  <>
                    <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6 text-center">
                      {currentQuestion.question}
                    </h2>
                    
                    <div className="space-y-3">
                      {currentQuestion.type === 'radio' && currentQuestion.options.map((option, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(option)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                            answers[currentQuestion.id] === option
                              ? 'border-[#1A2F3A] bg-[#1A2F3A]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            answers[currentQuestion.id] === option
                              ? 'border-[#1A2F3A] bg-[#1A2F3A]'
                              : 'border-gray-300'
                          }`}>
                            {answers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-gray-700">{option}</span>
                        </button>
                      ))}
                      
                      {currentQuestion.type === 'number_select' && (
                        <div className="flex gap-3 justify-center">
                          {currentQuestion.options.map((option, i) => (
                            <button
                              key={i}
                              onClick={() => handleAnswer(option)}
                              className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-lg font-semibold transition-all ${
                                answers[currentQuestion.id] === option
                                  ? 'border-[#1A2F3A] bg-[#1A2F3A] text-white'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Additional Details Step */}
                {wizardStep === 'questions' && showDetailsStep && (
                  <>
                    <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6 text-center">
                      Any additional details?
                    </h2>
                    <textarea
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="Tell us more about what you need (optional)"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1A2F3A] focus:outline-none resize-none"
                    />
                    <button
                      onClick={handleContinueToContact}
                      className="mt-6 w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors"
                    >
                      Continue
                    </button>
                  </>
                )}

                {/* Contact Info Step */}
                {wizardStep === 'contact' && (
                  <>
                    <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-2 text-center">
                      Almost done!
                    </h2>
                    <p className="text-gray-500 text-center mb-6">
                      Enter your details so contractors can reach you
                    </p>
                    
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Email address *</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                            placeholder="your@email.com"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1A2F3A] focus:outline-none"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">We'll never share your email</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Your name *</label>
                        <div className="relative">
                          <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={contactInfo.name}
                            onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                            placeholder="Your full name"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1A2F3A] focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Phone (optional)</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                            placeholder="Your phone number"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1A2F3A] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSubmitJob}
                      disabled={submitting || !contactInfo.email || !contactInfo.name}
                      className="mt-6 w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Get Free Quotes
                          <ChevronRight size={18} />
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* Back Button */}
                {(currentQuestionIndex > 0 || wizardStep === 'contact') && (
                  <button
                    onClick={handleWizardBack}
                    className="mt-4 w-full py-2 text-gray-500 hover:text-[#1A2F3A] flex items-center justify-center gap-1"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {wizardStep === 'complete' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              
              <p className="text-green-600 font-medium mb-2">We've posted your request</p>
              
              <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-4">
                Professionals will contact you soon
              </h2>
              
              <p className="text-gray-500 mb-6">
                We've notified local professionals. You'll receive quotes directly to your email.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-gray-600"><strong>Service:</strong> {selectedService}</p>
                <p className="text-sm text-gray-600"><strong>Location:</strong> {postcode}</p>
              </div>
              
              <button
                onClick={() => {
                  handleCloseWizard();
                  setActiveTab('jobs');
                }}
                className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors"
              >
                View Posted Jobs
              </button>
            </div>
          </div>
        )}

        {/* Contractor Detail Modal */}
        {selectedContractor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              <button onClick={() => setSelectedContractor(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
              <div className="h-32 bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52]" />
              <div className="px-6 pb-6 -mt-12">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-[#1A2F3A] mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {selectedContractor.business_name?.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-[#1A2F3A] mb-1">{selectedContractor.business_name}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">{renderStars(selectedContractor.rating)}</div>
                  <span className="text-sm text-gray-500">({selectedContractor.review_count || 0} reviews)</span>
                  {selectedContractor.verified && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><Shield size={10} /> Verified</span>}
                </div>
                <p className="text-gray-600 mb-4">{selectedContractor.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedContractor.specialties?.map(s => <span key={s} className="px-3 py-1 bg-[#F5F5F0] rounded-full text-sm capitalize">{s}</span>)}
                </div>
                
                <button onClick={() => { setShowBooking(true); }} className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] flex items-center justify-center gap-2">
                  <Calendar size={18} /> Request Quote
                </button>
                
                <div className="mt-6">
                  <ContractorReviews contractorId={selectedContractor.user_id} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {showBooking && selectedContractor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
              <button onClick={() => setShowBooking(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              <h3 className="text-xl font-semibold text-[#1A2F3A] mb-4">Request Quote from {selectedContractor.business_name}</h3>
              <form onSubmit={submitBooking} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Service Title</label>
                  <input type="text" value={bookingForm.title} onChange={e => setBookingForm({...bookingForm, title: e.target.value})} placeholder="Brief description of what you need" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Description</label>
                  <textarea value={bookingForm.description} onChange={e => setBookingForm({...bookingForm, description: e.target.value})} placeholder="Detailed description..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Preferred Date</label>
                    <input type="date" value={bookingForm.preferred_date} onChange={e => setBookingForm({...bookingForm, preferred_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Time</label>
                    <select value={bookingForm.preferred_time} onChange={e => setBookingForm({...bookingForm, preferred_time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20">
                      <option value="">Select...</option>
                      <option value="morning">Morning (8-12)</option>
                      <option value="afternoon">Afternoon (12-5)</option>
                      <option value="evening">Evening (5-8)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Address</label>
                  <AddressAutocomplete 
                    value={bookingForm.address} 
                    onChange={(val) => setBookingForm({ ...bookingForm, address: val })}
                    onSelect={(data) => setBookingForm({ ...bookingForm, address: data.formatted_address })}
                    placeholder="Service address" 
                    showIcon={false}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowBooking(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52] flex items-center justify-center gap-2">
                    <Send size={16} /> Send Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Job Bid Form Modal (for contractors) */}
        <JobBidForm
          job={selectedJobForBid}
          isOpen={!!selectedJobForBid}
          onClose={() => setSelectedJobForBid(null)}
          onSuccess={() => {
            fetchJobs();
            setSelectedJobForBid(null);
          }}
          contractorId={user?.id}
        />

        {/* Bids List Modal (for job owners) */}
        <BidsList
          job={selectedJobForBids}
          isOpen={!!selectedJobForBids}
          onClose={() => setSelectedJobForBids(null)}
          onAcceptBid={() => {
            fetchJobs();
            setSelectedJobForBids(null);
          }}
          userId={user?.id}
        />
      </div>
    </MainLayout>
  );
};

export default ContractorMarketplace;
