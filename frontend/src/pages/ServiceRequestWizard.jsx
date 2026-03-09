import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, ChevronRight, X, Check, Loader2, ArrowLeft,
  Wrench, Zap, Droplets, Paintbrush, Hammer, Leaf, Sparkles, 
  Home, Building2, Store, HelpCircle, Settings, RefreshCw, Package,
  Mail, Phone, User, Clock
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';

const API = process.env.REACT_APP_BACKEND_URL;

// Service categories with their icons and sub-services
const serviceCategories = {
  plumbing: {
    icon: Droplets,
    label: 'Plumbing',
    services: [
      'General Plumbing',
      'Bathroom & Shower Plumbing', 
      'Bathroom Repair',
      'Washing Machine Repair',
      'Taps & Fixtures Installation',
      'Water Heater Repair or Maintenance',
      'Boiler Installation or Replacement',
      'Drain Cleaning',
      'Pipe Repair or Replacement',
      'Toilet Repair or Installation'
    ]
  },
  electrical: {
    icon: Zap,
    label: 'Electrical',
    services: [
      'General Electrical',
      'Electrical Wiring',
      'Light Fixture Installation',
      'Outlet Installation or Repair',
      'Panel Upgrade',
      'EV Charger Installation',
      'Smart Home Wiring',
      'Electrical Safety Inspection',
      'Generator Installation'
    ]
  },
  painting: {
    icon: Paintbrush,
    label: 'Painting',
    services: [
      'Interior Painting',
      'Exterior Painting',
      'Cabinet Painting',
      'Deck Staining',
      'Wallpaper Installation',
      'Wallpaper Removal',
      'Pressure Washing',
      'Drywall Repair'
    ]
  },
  renovation: {
    icon: Hammer,
    label: 'Renovation',
    services: [
      'Kitchen Renovation',
      'Bathroom Renovation',
      'Basement Finishing',
      'Room Addition',
      'Flooring Installation',
      'Tile Installation',
      'Window Replacement',
      'Door Installation'
    ]
  },
  landscaping: {
    icon: Leaf,
    label: 'Landscaping',
    services: [
      'Lawn Care',
      'Garden Design',
      'Tree Trimming',
      'Tree Removal',
      'Fence Installation',
      'Deck Building',
      'Patio Installation',
      'Irrigation System'
    ]
  },
  cleaning: {
    icon: Sparkles,
    label: 'Cleaning',
    services: [
      'House Cleaning',
      'Deep Cleaning',
      'Move-in/Move-out Cleaning',
      'Carpet Cleaning',
      'Window Cleaning',
      'Post-Construction Cleaning',
      'Office Cleaning'
    ]
  }
};

// Question flows per category
const questionFlows = {
  plumbing: [
    {
      id: 'property_type',
      question: 'What is the type of property?',
      type: 'radio',
      options: ['Flat or Apartment', 'House', 'Commercial Property', 'Other']
    },
    {
      id: 'work_type',
      question: 'What type of work do you need?',
      type: 'radio',
      options: ['Install', 'Repair or replace', 'Maintenance', 'As recommended by professional', 'Other']
    },
    {
      id: 'materials',
      question: 'Will you provide all necessary materials and parts?',
      type: 'radio',
      options: [
        'Yes, I will provide the materials and parts',
        'Yes, but I will need guidance from the professional',
        'No, I will need the professional to provide materials and parts',
        'Other'
      ]
    },
    {
      id: 'quantity',
      question: 'How many taps/fixtures?',
      type: 'number_select',
      options: ['1', '2', '3', '4', '5+']
    }
  ],
  electrical: [
    {
      id: 'property_type',
      question: 'What is the type of property?',
      type: 'radio',
      options: ['Flat or Apartment', 'House', 'Commercial Property', 'Other']
    },
    {
      id: 'work_type',
      question: 'What type of work do you need?',
      type: 'radio',
      options: ['Install new', 'Repair existing', 'Upgrade/Replace', 'Safety inspection', 'Other']
    },
    {
      id: 'outlets_count',
      question: 'How many outlets/fixtures need work?',
      type: 'number_select',
      options: ['1-2', '3-5', '6-10', '10+']
    }
  ],
  painting: [
    {
      id: 'property_type',
      question: 'What is the type of property?',
      type: 'radio',
      options: ['Flat or Apartment', 'House', 'Commercial Property', 'Other']
    },
    {
      id: 'area_type',
      question: 'What area needs painting?',
      type: 'radio',
      options: ['Interior walls', 'Exterior walls', 'Ceiling', 'Trim/Doors', 'Cabinets', 'Other']
    },
    {
      id: 'rooms_count',
      question: 'How many rooms/areas?',
      type: 'number_select',
      options: ['1', '2-3', '4-5', '6+', 'Whole house']
    }
  ],
  renovation: [
    {
      id: 'property_type',
      question: 'What is the type of property?',
      type: 'radio',
      options: ['Flat or Apartment', 'House', 'Commercial Property', 'Other']
    },
    {
      id: 'scope',
      question: 'What is the scope of the renovation?',
      type: 'radio',
      options: ['Minor updates', 'Partial renovation', 'Full renovation', 'Not sure - need assessment']
    },
    {
      id: 'permits',
      question: 'Will permits be required?',
      type: 'radio',
      options: ['Yes, already obtained', 'Yes, need help obtaining', 'No', 'Not sure']
    }
  ],
  landscaping: [
    {
      id: 'property_type',
      question: 'What is the type of property?',
      type: 'radio',
      options: ['Residential', 'Commercial', 'Rental Property', 'Other']
    },
    {
      id: 'area_size',
      question: 'What is the approximate area size?',
      type: 'radio',
      options: ['Small (under 500 sq ft)', 'Medium (500-2000 sq ft)', 'Large (2000+ sq ft)', 'Not sure']
    }
  ],
  cleaning: [
    {
      id: 'property_type',
      question: 'What is the type of property?',
      type: 'radio',
      options: ['Flat or Apartment', 'House', 'Office', 'Commercial Space', 'Other']
    },
    {
      id: 'frequency',
      question: 'How often do you need cleaning?',
      type: 'radio',
      options: ['One-time', 'Weekly', 'Bi-weekly', 'Monthly', 'Other']
    },
    {
      id: 'bedrooms',
      question: 'How many bedrooms?',
      type: 'number_select',
      options: ['Studio', '1', '2', '3', '4+']
    }
  ],
  default: [
    {
      id: 'property_type',
      question: 'What is the type of property?',
      type: 'radio',
      options: ['Flat or Apartment', 'House', 'Commercial Property', 'Other']
    },
    {
      id: 'work_type',
      question: 'What type of work do you need?',
      type: 'radio',
      options: ['Install', 'Repair', 'Maintenance', 'Consultation', 'Other']
    }
  ]
};

export default function ServiceRequestWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const searchInputRef = useRef(null);
  
  // Wizard state
  const [step, setStep] = useState('search'); // search, questions, contact, complete
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [postcode, setPostcode] = useState('');
  
  // Selected service
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  
  // Question flow
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [additionalDetails, setAdditionalDetails] = useState('');
  
  // Contact info
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    name: user?.name || '',
    phone: ''
  });
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState(null);

  // Get filtered suggestions
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
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
    if (!selectedCategory) return questionFlows.default;
    return questionFlows[selectedCategory] || questionFlows.default;
  };
  
  const questions = getQuestions();
  const currentQuestion = questions[currentQuestionIndex];
  const totalSteps = questions.length + 3; // questions + details + postcode + contact
  const currentProgress = step === 'search' ? 0 : 
    step === 'questions' ? ((currentQuestionIndex + 1) / totalSteps) * 100 :
    step === 'contact' ? 90 : 100;

  // Handle service selection from search
  const handleSelectService = (suggestion) => {
    setSelectedCategory(suggestion.category);
    setSelectedService(suggestion.service);
    setSearchQuery(suggestion.service);
    setShowSuggestions(false);
    setStep('questions');
    setCurrentQuestionIndex(0);
  };

  // Handle answer selection
  const handleAnswer = (answer) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
    
    // Move to next question or step
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Show additional details step, then contact
      if (!answers.additional_details) {
        setAnswers({ ...answers, [currentQuestion.id]: answer, additional_details: '' });
        setCurrentQuestionIndex(currentQuestionIndex + 1); // This triggers the details step
      }
    }
  };

  // Handle back button
  const handleBack = () => {
    if (step === 'contact') {
      setCurrentQuestionIndex(questions.length - 1);
      setStep('questions');
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setStep('search');
      setSelectedService('');
      setSelectedCategory(null);
    }
  };

  // Continue to contact step
  const handleContinueToContact = () => {
    setStep('contact');
  };

  // Submit the job request
  const handleSubmit = async () => {
    if (!contactInfo.email || !contactInfo.name) {
      setError('Please provide your email and name');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Build job data
      const jobData = {
        title: selectedService,
        category: selectedCategory,
        description: `Service: ${selectedService}\n${Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n')}\n${additionalDetails ? `Additional details: ${additionalDetails}` : ''}`,
        address: postcode,
        urgency: 'flexible',
        contact_email: contactInfo.email,
        contact_name: contactInfo.name,
        contact_phone: contactInfo.phone,
        answers: answers
      };

      // If user is logged in, use their ID. Otherwise create as guest
      const userId = user?.id || 'guest';
      
      const res = await axios.post(`${API}/api/jobs?user_id=${userId}`, jobData);
      setJobId(res.data.id);
      setStep('complete');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if we're past the dynamic questions
  const showDetailsStep = currentQuestionIndex >= questions.length;
  const showPostcodeStep = currentQuestionIndex >= questions.length + 1;

  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        {/* Hero Section - Search */}
        {step === 'search' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
            <div className="max-w-2xl w-full text-center">
              <h1 
                className="text-4xl md:text-5xl font-bold text-[#1A2F3A] mb-4"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Find the best professionals
              </h1>
              <p className="text-lg text-gray-500 mb-8">Get free quotes within minutes</p>
              
              {/* Search Box */}
              <div className="relative z-10">
                <div className="flex items-stretch bg-white rounded-lg border-2 border-gray-200 focus-within:border-[#1A2F3A] transition-colors">
                  <div className="flex-1 relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="What service are you looking for?"
                      className="w-full px-4 py-4 text-lg border-none outline-none rounded-l-lg"
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
                              onClick={() => handleSelectService(s)}
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
                  
                  <div className="flex items-center border-l border-gray-200">
                    <MapPin size={18} className="text-gray-400 ml-3" />
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="Postal code"
                      className="w-40 px-3 py-4 text-lg border-none outline-none"
                      data-testid="postcode-input"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      if (searchQuery && suggestions.length > 0) {
                        handleSelectService(suggestions[0]);
                      }
                    }}
                    disabled={!searchQuery}
                    className="px-8 bg-[#1A2F3A] text-white font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50"
                    data-testid="search-btn"
                  >
                    Search
                  </button>
                </div>
              </div>
              
              {/* Popular Services */}
              <div className="mt-6 text-sm text-gray-400">
                <span>Popular: </span>
                {['House Cleaning', 'Plumber', 'Electrician'].map((service, i) => (
                  <button
                    key={service}
                    onClick={() => {
                      setSearchQuery(service);
                      setShowSuggestions(true);
                    }}
                    className="text-gray-500 hover:text-[#1A2F3A] underline mx-1"
                  >
                    {service}
                  </button>
                ))}
              </div>
              
              {/* Category Quick Links */}
              <div className="mt-12 grid grid-cols-3 md:grid-cols-6 gap-4">
                {Object.entries(serviceCategories).map(([key, data]) => {
                  const Icon = data.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSearchQuery(data.label);
                        setShowSuggestions(true);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1A2F3A]/10 flex items-center justify-center">
                        <Icon size={24} className="text-[#1A2F3A]" />
                      </div>
                      <span className="text-sm text-gray-600">{data.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Question Modal */}
        {(step === 'questions' || step === 'contact') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
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
                    onClick={() => {
                      setStep('search');
                      setSelectedService('');
                      setSelectedCategory(null);
                      setCurrentQuestionIndex(0);
                      setAnswers({});
                    }}
                    className="ml-4 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'questions' && !showDetailsStep && !showPostcodeStep && currentQuestion && (
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
                          data-testid={`option-${i}`}
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
                {step === 'questions' && showDetailsStep && !showPostcodeStep && (
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
                      data-testid="additional-details"
                    />
                    <button
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                      className="mt-6 w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors"
                    >
                      Continue
                    </button>
                  </>
                )}

                {/* Postcode Step */}
                {step === 'questions' && showPostcodeStep && (
                  <>
                    <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6 text-center">
                      What is your postcode?
                    </h2>
                    <p className="text-gray-500 text-center mb-4">
                      So we can find professionals near you
                    </p>
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="Enter your postal code"
                      className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#1A2F3A] focus:outline-none text-center text-lg"
                      data-testid="postcode-step-input"
                    />
                    <button
                      onClick={handleContinueToContact}
                      disabled={!postcode.trim()}
                      className="mt-6 w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </>
                )}

                {/* Contact Info Step */}
                {step === 'contact' && (
                  <>
                    <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-2 text-center">
                      Almost done!
                    </h2>
                    <p className="text-gray-500 text-center mb-6">
                      Enter your details so contractors can reach you
                    </p>
                    
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
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
                            data-testid="email-input"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">We'll never share your email with anyone</p>
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
                            data-testid="name-input"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Phone number (optional)</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                            placeholder="Your phone number"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1A2F3A] focus:outline-none"
                            data-testid="phone-input"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !contactInfo.email || !contactInfo.name}
                      className="mt-6 w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      data-testid="submit-request-btn"
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
                {step !== 'search' && !showDetailsStep && currentQuestionIndex > 0 && (
                  <button
                    onClick={handleBack}
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
        {step === 'complete' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              
              <p className="text-green-600 font-medium mb-2">We've posted your request</p>
              
              <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-4">
                Professionals will contact you soon
              </h2>
              
              <p className="text-gray-500 mb-6">
                We've notified local {selectedCategory} professionals about your request. 
                You'll receive quotes directly to your email.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Service:</strong> {selectedService}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Location:</strong> {postcode}
                </p>
              </div>
              
              <div className="space-y-3">
                {!user && (
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors"
                  >
                    Create Account to Track Requests
                  </button>
                )}
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/')}
                  className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  {user ? 'Go to Dashboard' : 'Back to Home'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
