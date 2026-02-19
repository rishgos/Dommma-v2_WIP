import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Loader2, Bot, User, Sparkles, Calculator, Home, 
  MapPin, DollarSign, FileText, Briefcase, Heart, Lightbulb,
  Settings, ChevronDown, ChevronUp, Building2, Mic, MicOff, 
  Image, Bell, Camera, Volume2, VolumeX
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Quick action prompts for different categories
const quickActions = [
  {
    category: 'Property Search',
    icon: Home,
    color: 'bg-blue-500',
    actions: [
      { label: 'Find pet-friendly apartments', prompt: 'Show me pet-friendly apartments in Vancouver under $2500/month' },
      { label: 'Near transit', prompt: 'Find apartments within walking distance of SkyTrain stations' },
      { label: 'Work from home', prompt: "I work from home and need a place with good natural light and a spare room for an office" },
    ]
  },
  {
    category: 'Financial Help',
    icon: DollarSign,
    color: 'bg-green-500',
    actions: [
      { label: 'Budget calculator', prompt: 'Can I afford $2500/month rent on a $80,000 salary?' },
      { label: 'Hidden costs', prompt: 'What are the hidden costs of renting in Vancouver I should know about?' },
      { label: 'Negotiation tips', prompt: 'How can I negotiate lower rent with my landlord?' },
    ]
  },
  {
    category: 'Application Help',
    icon: FileText,
    color: 'bg-purple-500',
    actions: [
      { label: 'Rental resume', prompt: 'Help me create a strong rental resume' },
      { label: 'Cover letter', prompt: 'Write a compelling rental application cover letter for me' },
      { label: 'Application tips', prompt: 'How can I make my rental application stand out?' },
    ]
  },
  {
    category: 'Neighborhood',
    icon: MapPin,
    color: 'bg-orange-500',
    actions: [
      { label: 'Best for families', prompt: 'What are the best neighborhoods in Vancouver for families?' },
      { label: 'Coffee & nightlife', prompt: 'Which neighborhoods have the best coffee shops and nightlife?' },
      { label: 'Safety info', prompt: 'What are the safest neighborhoods in Vancouver?' },
    ]
  },
];

// User preferences form fields
const preferenceFields = [
  { key: 'budget', label: 'Monthly Budget', icon: DollarSign, type: 'number', placeholder: '2500' },
  { key: 'occupation', label: 'Occupation', icon: Briefcase, type: 'text', placeholder: 'Software Engineer' },
  { key: 'has_pets', label: 'Have Pets?', icon: Heart, type: 'select', options: ['No', 'Yes - Dog', 'Yes - Cat', 'Yes - Other'] },
  { key: 'commute_location', label: 'Commute To', icon: MapPin, type: 'text', placeholder: 'Downtown Vancouver' },
];

const NovaChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [userContext, setUserContext] = useState({
    budget: '',
    occupation: '',
    has_pets: 'No',
    commute_location: '',
    preferences: ''
  });
  const [suggestions, setSuggestions] = useState([]);
  const [proactiveSuggestions, setProactiveSuggestions] = useState([]);
  
  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Image analysis state
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm Nova, your AI real estate assistant. I can help you with:\n\n🏠 **Property Search** - Find your perfect home\n💰 **Financial Advice** - Budget calculators & negotiation tips\n📄 **Application Help** - Rental resumes & cover letters\n🏘️ **Neighborhood Intel** - Safety, amenities & vibes\n🎤 **Voice Input** - Just click the mic and talk to me!\n📷 **Image Analysis** - Upload property photos for instant insights\n\nWhat can I help you with today?",
        suggestions: ['Find apartments near SkyTrain', 'Calculate my budget', 'Help with application']
      }]);
      
      // Fetch proactive suggestions if user is logged in
      if (user?.id) {
        fetchProactiveSuggestions();
      }
    }
  }, [isOpen, messages.length, user]);

  const fetchProactiveSuggestions = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API}/nova/suggestions/${user.id}`);
      setProactiveSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I couldn't access your microphone. Please check your browser permissions and try again."
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        const response = await axios.post(`${API}/nova/transcribe`, {
          audio_data: base64Audio,
          language: 'en'
        });
        
        if (response.data.text) {
          setInput(response.data.text);
          // Auto-send after transcription
          sendMessage(response.data.text);
        }
        setIsTranscribing(false);
      };
    } catch (error) {
      console.error('Transcription error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I had trouble understanding that. Could you try again or type your message?"
      }]);
      setIsTranscribing(false);
    }
  };

  // Image analysis functions
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setAnalyzingImage(true);
    setShowImageUpload(false);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        setMessages(prev => [...prev, {
          role: 'user',
          content: '📷 [Uploaded property image for analysis]',
          imagePreview: base64Image
        }]);

        const response = await axios.post(`${API}/nova/analyze-image`, {
          image_data: base64Image,
          analysis_type: 'general'
        });

        const analysis = response.data.results;
        let analysisText = "**Property Image Analysis**\n\n";
        
        if (analysis.room_type) analysisText += `🏠 **Room Type:** ${analysis.room_type}\n`;
        if (analysis.estimated_room_size) analysisText += `📐 **Size:** ${analysis.estimated_room_size}\n`;
        if (analysis.natural_light) analysisText += `☀️ **Natural Light:** ${analysis.natural_light}\n`;
        if (analysis.condition) analysisText += `🔧 **Condition:** ${analysis.condition}\n`;
        if (analysis.overall_impression) analysisText += `⭐ **Overall Score:** ${analysis.overall_impression}/10\n`;
        if (analysis.notable_features) analysisText += `\n✨ **Notable Features:**\n${Array.isArray(analysis.notable_features) ? analysis.notable_features.map(f => `• ${f}`).join('\n') : analysis.notable_features}\n`;
        if (analysis.potential_concerns) analysisText += `\n⚠️ **Potential Concerns:**\n${Array.isArray(analysis.potential_concerns) ? analysis.potential_concerns.map(c => `• ${c}`).join('\n') : analysis.potential_concerns}\n`;

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: analysisText || "I've analyzed the image. It appears to be a property photo, but I couldn't extract detailed information. Would you like me to try a different analysis type?"
        }]);
        
        setAnalyzingImage(false);
      };
    } catch (error) {
      console.error('Image analysis error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I had trouble analyzing that image. Please try again with a clearer photo of the property."
      }]);
      setAnalyzingImage(false);
    }
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    setInput('');
    setShowQuickActions(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setSuggestions([]);

    try {
      // Build user context for personalization
      const contextToSend = {};
      if (userContext.budget) contextToSend.budget = userContext.budget;
      if (userContext.occupation) contextToSend.occupation = userContext.occupation;
      if (userContext.has_pets && userContext.has_pets !== 'No') contextToSend.has_pets = userContext.has_pets;
      if (userContext.commute_location) contextToSend.commute_location = userContext.commute_location;
      if (userContext.preferences) contextToSend.preferences = userContext.preferences;

      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: userMessage,
        user_context: Object.keys(contextToSend).length > 0 ? contextToSend : null
      });

      setSessionId(response.data.session_id);
      
      const assistantMessage = { 
        role: 'assistant', 
        content: response.data.response,
        listings: response.data.listings,
        suggestions: response.data.suggestions
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.data.suggestions?.length > 0) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having a moment! Try asking about:\n• Apartments in Vancouver\n• Budget advice\n• Rental application tips\n• Neighborhood recommendations" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (prompt) => {
    setInput(prompt);
    sendMessage(prompt);
  };

  const renderMessageContent = (content) => {
    // Basic markdown-like formatting
    return content.split('\n').map((line, i) => {
      // Bold text
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <span 
          key={i} 
          dangerouslySetInnerHTML={{ __html: formattedLine }}
          className="block"
        />
      );
    });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-full text-white font-medium shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_50px_rgba(26,47,58,0.5)]"
        style={{ 
          background: 'linear-gradient(135deg, #1A2F3A 0%, #2C4A52 100%)',
        }}
        data-testid="nova-chat-button"
      >
        <div className="relative">
          <Bot size={22} />
          <Sparkles size={10} className="absolute -top-1 -right-1 text-yellow-300" />
        </div>
        <span className="text-sm tracking-wide">Ask Nova AI</span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-8" data-testid="nova-chat-modal">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div 
            className="relative w-full max-w-lg h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{ animation: 'fadeInUp 0.3s ease' }}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center relative">
                  <Bot size={24} />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1A2F3A]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Nova AI
                    <Sparkles size={14} className="text-yellow-300" />
                  </h3>
                  <p className="text-xs text-white/70">Your Smart Real Estate Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Preferences"
                  data-testid="nova-preferences-button"
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  data-testid="nova-close-button"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Preferences Panel */}
            {showPreferences && (
              <div className="px-4 py-3 bg-[#F5F5F0] border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#1A2F3A]">Personalize Your Search</p>
                  <button 
                    onClick={() => setShowPreferences(false)}
                    className="text-xs text-[#1A2F3A] hover:underline"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {preferenceFields.map(field => (
                    <div key={field.key}>
                      <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <field.icon size={10} />
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={userContext[field.key]}
                          onChange={(e) => setUserContext({...userContext, [field.key]: e.target.value})}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-[#1A2F3A] outline-none"
                        >
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={userContext[field.key]}
                          onChange={(e) => setUserContext({...userContext, [field.key]: e.target.value})}
                          placeholder={field.placeholder}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-[#1A2F3A] outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F5F0]" data-testid="nova-messages-container">
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' 
                        ? 'bg-[#1A2F3A] text-white' 
                        : 'bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] text-white'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
                    <div 
                      className={`px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-[#1A2F3A] text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                    
                    {/* Listing Cards */}
                    {msg.listings?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.listings.slice(0, 3).map((listing, idx) => (
                          <div 
                            key={idx}
                            className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <img 
                              src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100'}
                              alt={listing.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-[#1A2F3A] text-sm">{listing.title}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={10} /> {listing.city}
                              </p>
                              <p className="text-sm font-semibold text-[#1A2F3A] mt-1">
                                ${listing.price?.toLocaleString()}/mo
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Suggestions */}
                    {msg.suggestions?.length > 0 && i === messages.length - 1 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickAction(suggestion.replace(/^[💡🐾🚇]\s*/, ''))}
                            className="px-3 py-1.5 text-xs bg-white rounded-full text-[#1A2F3A] border border-[#1A2F3A]/20 hover:border-[#1A2F3A] hover:bg-[#1A2F3A]/5 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] flex items-center justify-center text-white">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#1A2F3A]" />
                      <span className="text-sm text-gray-500">Nova is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {showQuickActions && messages.length <= 1 && (
              <div className="px-4 py-3 bg-white border-t border-gray-100 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Lightbulb size={12} />
                  Quick Actions
                </p>
                <div className="space-y-3">
                  {quickActions.map((category, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                        <category.icon size={12} className={`${category.color.replace('bg-', 'text-')}`} />
                        {category.category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {category.actions.map((action, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleQuickAction(action.prompt)}
                            className="px-2.5 py-1 text-xs bg-[#F5F5F0] rounded-full text-[#1A2F3A] hover:bg-[#1A2F3A] hover:text-white transition-colors"
                            data-testid={`quick-action-${category.category.toLowerCase().replace(' ', '-')}-${aIdx}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Suggestions */}
            {suggestions.length > 0 && !showQuickActions && (
              <div className="px-4 py-2 bg-white border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction(suggestion.replace(/^[💡🐾🚇]\s*/, ''))}
                      className="px-3 py-1.5 text-xs bg-[#F5F5F0] rounded-full text-[#1A2F3A] hover:bg-[#1A2F3A] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={10} />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about properties, budgets, neighborhoods..."
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none transition-all text-sm"
                  data-testid="nova-input"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-50 bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] hover:shadow-lg"
                  data-testid="nova-send-button"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Powered by Claude AI • DOMMMA
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default NovaChat;
