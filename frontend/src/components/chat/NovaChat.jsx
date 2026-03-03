import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Loader2, Bot, User, Sparkles, Calculator, Home, 
  MapPin, DollarSign, FileText, Briefcase, Heart, Lightbulb,
  Settings, ChevronDown, ChevronUp, Building2, Mic, MicOff, 
  Image, Bell, Camera, Volume2, VolumeX, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const NovaChat = ({ isOpenProp = false, onClose = null, initialQuery = '' }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(isOpenProp);
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
  
  // Voice input state - using Web Speech API for real-time transcription
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Image analysis state
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  // TTS state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  
  // Memory state
  const [userMemory, setUserMemory] = useState(null);
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  
  const messagesEndRef = useRef(null);
  const pendingQueryRef = useRef(initialQuery);

  // Sync with external control
  useEffect(() => {
    setIsOpen(isOpenProp);
  }, [isOpenProp]);

  // Store pending query for later execution
  useEffect(() => {
    if (initialQuery) {
      pendingQueryRef.current = initialQuery;
    }
  }, [initialQuery]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user memory when chat opens
  const fetchUserMemory = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API}/nova/memory/${user.id}`);
      if (response.data.has_preferences) {
        setUserMemory(response.data);
        setMemoryLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching user memory:', error);
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // First, try to fetch user memory
      if (user?.id) {
        fetchUserMemory();
        fetchProactiveSuggestions();
        fetchVoicePreference();
      }
      
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm Nova, your AI real estate assistant. I can help you with:\n\n🏠 **Property Search** - Find your perfect home\n💰 **Financial Advice** - Budget calculators & negotiation tips\n📄 **Application Help** - Rental resumes & cover letters\n🏘️ **Neighborhood Intel** - Safety, amenities & vibes\n🎤 **Voice Input** - Just click the mic and talk to me!\n📷 **Image Analysis** - Upload property photos for instant insights\n\nWhat can I help you with today?",
        suggestions: ['Find apartments near SkyTrain', 'Calculate my budget', 'Help with application']
      }]);
    }
  }, [isOpen, messages.length, user]);

  // Process pending query from homepage after welcome message is shown
  useEffect(() => {
    if (isOpen && messages.length === 1 && pendingQueryRef.current) {
      const query = pendingQueryRef.current;
      pendingQueryRef.current = ''; // Clear it so it doesn't run again
      
      // Small delay to let the welcome message render
      const timer = setTimeout(() => {
        if (query.trim()) {
          // Directly add user message and call API
          setInput('');
          setShowQuickActions(false);
          setMessages(prev => [...prev, { role: 'user', content: query.trim() }]);
          setIsLoading(true);
          setSuggestions([]);
          
          axios.post(`${API}/chat`, {
            session_id: sessionId,
            message: query.trim(),
            user_id: user?.id || null,
            user_context: null
          }).then(response => {
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
          }).catch(error => {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: "I'm having a moment! Try asking about:\n• Apartments in Vancouver\n• Budget advice\n• Rental application tips\n• Neighborhood recommendations" 
            }]);
          }).finally(() => {
            setIsLoading(false);
          });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, sessionId, user?.id]);

  const fetchVoicePreference = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API}/nova/tts/preferences/${user.id}`);
      setVoiceEnabled(response.data.enabled || false);
      setSelectedVoice(response.data.voice || 'nova');
    } catch (error) {
      console.error('Error fetching voice preferences:', error);
    }
  };

  const speakResponse = async (text) => {
    if (!voiceEnabled || !text) return;
    
    // Strip markdown and limit length
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n/g, ' ')
      .slice(0, 500);
    
    try {
      setIsSpeaking(true);
      const response = await axios.post(`${API}/nova/tts`, {
        text: cleanText,
        voice: selectedVoice,
        speed: 1.0
      });
      
      if (response.data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${response.data.audio}`);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const toggleVoice = async () => {
    const newEnabled = !voiceEnabled;
    setVoiceEnabled(newEnabled);
    if (user?.id) {
      try {
        await axios.post(`${API}/nova/tts/preferences/${user.id}`, {
          enabled: newEnabled
        });
      } catch (error) {
        console.error('Error updating voice preference:', error);
      }
    }
  };

  const fetchProactiveSuggestions = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API}/nova/suggestions/${user.id}`);
      setProactiveSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Voice recording functions - Using Web Speech API for real-time transcription
  const startRecording = async () => {
    // Check if Web Speech API is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      // Use Web Speech API for real-time transcription
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = i18n.language === 'fr' ? 'fr-CA' : 'en-US';
        
        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }
          
          // Update input field in real-time
          if (final) {
            setInput(prev => prev + final);
            setInterimTranscript('');
          } else {
            setInterimTranscript(interim);
          }
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setInterimTranscript('');
          if (event.error === 'not-allowed') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: i18n.language === 'fr' 
                ? "Je n'ai pas pu accéder à votre microphone. Veuillez vérifier les permissions."
                : "I couldn't access your microphone. Please check your browser permissions."
            }]);
          }
        };
        
        recognition.onend = () => {
          setIsRecording(false);
          setInterimTranscript('');
        };
        
        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        // Fallback to MediaRecorder
        startMediaRecording();
      }
    } else {
      // Fallback to MediaRecorder + Whisper API
      startMediaRecording();
    }
  };
  
  const startMediaRecording = async () => {
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
        content: i18n.language === 'fr'
          ? "Je n'ai pas pu accéder à votre microphone. Veuillez vérifier les permissions."
          : "I couldn't access your microphone. Please check your browser permissions and try again."
      }]);
    }
  };

  const stopRecording = () => {
    // Stop Web Speech API
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // Stop MediaRecorder
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setInterimTranscript('');
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
          language: i18n.language === 'fr' ? 'fr' : 'en'
        });
        
        if (response.data.text) {
          setInput(response.data.text);
        }
        setIsTranscribing(false);
      };
    } catch (error) {
      console.error('Transcription error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: i18n.language === 'fr'
          ? "J'ai eu du mal à comprendre. Pourriez-vous réessayer ou taper votre message?"
          : "I had trouble understanding that. Could you try again or type your message?"
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

      // Use the new AI Concierge endpoint with tool calling
      const response = await axios.post(`${API}/ai/concierge`, {
        session_id: sessionId,
        message: userMessage,
        user_id: user?.id || null,
        user_context: Object.keys(contextToSend).length > 0 ? contextToSend : null
      });

      setSessionId(response.data.session_id);
      
      // Build the assistant message with tool results
      const assistantMessage = { 
        role: 'assistant', 
        content: response.data.response,
        listings: response.data.listings || [],
        contractors: response.data.contractors || [],
        suggestions: response.data.suggestions,
        toolResults: response.data.tool_results
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.data.suggestions?.length > 0) {
        setSuggestions(response.data.suggestions);
      }
      
      // Speak the response if voice is enabled
      if (voiceEnabled && response.data.response) {
        speakResponse(response.data.response);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback to original endpoint if concierge fails
      try {
        const fallbackResponse = await axios.post(`${API}/chat`, {
          session_id: sessionId,
          message: userMessage,
          user_id: user?.id || null
        });
        
        setSessionId(fallbackResponse.data.session_id);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: fallbackResponse.data.response,
          listings: fallbackResponse.data.listings,
          suggestions: fallbackResponse.data.suggestions
        }]);
      } catch (fallbackError) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm having a moment! Try asking about:\n• Apartments in Vancouver\n• Budget advice\n• Rental application tips\n• Neighborhood recommendations" 
        }]);
      }
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
    // Parse property links like [Property Name](property:ID)
    // and contractor links like [Contractor Name](contractor:ID)
    const parseLinks = (text) => {
      // Combined regex for both property and contractor links
      const linkRegex = /\[([^\]]+)\]\((property|contractor):([^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(text)) !== null) {
        // Add text before the link
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index));
        }
        
        const linkText = match[1];
        const linkType = match[2];
        const linkId = match[3];
        
        // Add the link component based on type
        if (linkType === 'property') {
          parts.push(
            <Link
              key={`${linkType}-${match.index}`}
              to={`/browse?property=${linkId}`}
              className="text-blue-600 hover:text-blue-800 underline font-medium inline-flex items-center gap-1"
              onClick={handleClose}
            >
              🏠 {linkText}
              <ExternalLink size={12} />
            </Link>
          );
        } else if (linkType === 'contractor') {
          parts.push(
            <Link
              key={`${linkType}-${match.index}`}
              to={`/contractors/${linkId}`}
              className="text-emerald-600 hover:text-emerald-800 underline font-medium inline-flex items-center gap-1"
              onClick={handleClose}
            >
              🔧 {linkText}
              <ExternalLink size={12} />
            </Link>
          );
        }
        
        lastIndex = match.index + match[0].length;
      }
      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }
      return parts.length > 0 ? parts : text;
    };

    // Basic markdown-like formatting
    return content.split('\n').map((line, i) => {
      // Bold text
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Parse for property and contractor links
      const parsedContent = parseLinks(formattedLine);
      
      if (Array.isArray(parsedContent)) {
        return (
          <span key={i} className="block">
            {parsedContent.map((part, j) => 
              typeof part === 'string' 
                ? <span key={j} dangerouslySetInnerHTML={{ __html: part }} />
                : part
            )}
          </span>
        );
      }
      
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
      {/* Floating Chat Button - Always Visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-full text-white font-medium shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_50px_rgba(26,47,58,0.5)] group"
        style={{ 
          background: 'linear-gradient(135deg, #1A2F3A 0%, #2C4A52 100%)',
        }}
        data-testid="nova-chat-button"
      >
        <div className="relative">
          <Bot size={22} />
          <Sparkles size={10} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
        </div>
        <span className="text-sm tracking-wide">Ask Nova AI</span>
        {/* Pulse ring animation */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] opacity-30 animate-ping group-hover:opacity-0" />
      </button>

      {/* Action hint tooltip - shows on hover */}
      <div className="fixed bottom-24 right-8 z-40 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-white rounded-xl shadow-lg px-4 py-3 text-xs text-gray-600 max-w-[200px]">
          <p className="font-medium text-[#1A2F3A] mb-1">I can help you:</p>
          <ul className="space-y-0.5">
            <li>🏠 Search & list properties</li>
            <li>🔧 Find contractors</li>
            <li>📋 Submit maintenance</li>
            <li>💰 Calculate budget</li>
          </ul>
        </div>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-8" data-testid="nova-chat-modal">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
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
                  <p className="text-xs text-white/70">
                    {memoryLoaded ? '✨ Picking up where we left off...' : 'Your Smart Real Estate Assistant'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Stop Speaking Button - appears when TTS is active */}
                {isSpeaking && (
                  <button 
                    onClick={stopSpeaking}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-medium animate-pulse transition-colors"
                    title="Stop speaking"
                    data-testid="nova-stop-speaking-button"
                  >
                    <VolumeX size={14} />
                    Stop
                  </button>
                )}
                <button 
                  onClick={toggleVoice}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    voiceEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={voiceEnabled ? 'Voice enabled - click to disable' : 'Enable voice responses'}
                  data-testid="nova-voice-toggle"
                >
                  {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button 
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Preferences"
                  data-testid="nova-preferences-button"
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  data-testid="nova-close-button"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Memory Indicator - Shows saved preferences */}
            {memoryLoaded && userMemory?.preferences && (
              <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                <p className="text-xs text-blue-700 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span className="font-medium">Your preferences:</span>
                  <span className="text-blue-600">
                    {[
                      userMemory.preferences.max_budget && `$${userMemory.preferences.max_budget}/mo`,
                      userMemory.preferences.bedrooms && `${userMemory.preferences.bedrooms}bd`,
                      userMemory.preferences.pet_friendly && 'Pet-friendly',
                      userMemory.preferences.preferred_areas?.slice(0, 2).join(', ')
                    ].filter(Boolean).join(' • ') || 'Learning your preferences...'}
                  </span>
                </p>
              </div>
            )}

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
                        <p className="text-xs text-gray-500 font-medium">📍 Matching Properties:</p>
                        {msg.listings.slice(0, 3).map((listing, idx) => (
                          <Link 
                            key={idx}
                            to={`/browse?property=${listing.id}`}
                            onClick={handleClose}
                            className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200"
                          >
                            <img 
                              src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100'}
                              alt={listing.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1A2F3A] text-sm truncate">{listing.title}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={10} /> {listing.address}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm font-semibold text-[#1A2F3A]">
                                  ${listing.price?.toLocaleString()}/mo
                                </p>
                                <span className="text-xs text-gray-400">
                                  {listing.bedrooms}bd • {listing.bathrooms}ba
                                </span>
                              </div>
                              {listing.special_offers?.length > 0 && (
                                <span className="text-xs text-green-600 font-medium">🎁 {listing.special_offers[0]}</span>
                              )}
                            </div>
                            <ExternalLink size={16} className="text-gray-400 flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Contractor Cards */}
                    {msg.contractors?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-500 font-medium">🔧 Recommended Contractors:</p>
                        {msg.contractors.slice(0, 3).map((contractor, idx) => (
                          <Link 
                            key={idx}
                            to={`/contractors/${contractor.id}`}
                            onClick={handleClose}
                            className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-200"
                          >
                            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                              {contractor.business_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1A2F3A] text-sm truncate">{contractor.business_name}</p>
                              <p className="text-xs text-gray-500">
                                {contractor.specialties?.join(', ')}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-yellow-600">⭐ {contractor.rating || 'New'}</span>
                                <span className="text-xs text-gray-400">${contractor.hourly_rate}/hr</span>
                                {contractor.verified && <span className="text-xs text-green-600">✓ Verified</span>}
                              </div>
                            </div>
                            <ExternalLink size={16} className="text-gray-400 flex-shrink-0" />
                          </Link>
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
              
              {/* Floating Stop Speaking Button */}
              {isSpeaking && (
                <div className="sticky bottom-2 flex justify-center">
                  <button 
                    onClick={stopSpeaking}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-lg animate-pulse transition-all hover:scale-105"
                    data-testid="nova-stop-speaking-floating"
                  >
                    <VolumeX size={18} />
                    Stop Speaking
                  </button>
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

            {/* Proactive Suggestions */}
            {proactiveSuggestions.length > 0 && messages.length <= 1 && (
              <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Bell size={12} className="text-blue-500" />
                  Updates for you
                </p>
                <div className="space-y-1">
                  {proactiveSuggestions.slice(0, 3).map((suggestion, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg text-xs ${
                        suggestion.priority === 'high' ? 'bg-blue-100 text-blue-800' :
                        suggestion.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {suggestion.message}
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

            {/* Hidden file input for image upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                {/* Voice button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isTranscribing || analyzingImage}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50`}
                  data-testid="nova-voice-button"
                  title={isRecording 
                    ? (i18n.language === 'fr' ? 'Arrêter' : 'Stop recording') 
                    : (i18n.language === 'fr' ? 'Parler' : 'Voice input')}
                >
                  {isTranscribing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isRecording ? (
                    <MicOff size={18} />
                  ) : (
                    <Mic size={18} />
                  )}
                </button>

                {/* Image upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || analyzingImage}
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50"
                  data-testid="nova-image-button"
                  title={i18n.language === 'fr' ? 'Télécharger une image' : 'Upload property image'}
                >
                  {analyzingImage ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input + interimTranscript}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isRecording 
                      ? (i18n.language === 'fr' ? "Écoute en cours..." : "Listening...") 
                      : (i18n.language === 'fr' ? "Demandez à propos de propriétés, budgets..." : "Ask about properties, budgets, neighborhoods...")}
                    className={`w-full px-4 py-3 rounded-xl border focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none transition-all text-sm ${
                      isRecording ? 'border-red-400 bg-red-50 animate-pulse' : 'border-gray-200'
                    }`}
                    data-testid="nova-input"
                    disabled={isLoading || isTranscribing}
                  />
                  {interimTranscript && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      {i18n.language === 'fr' ? 'en train d\'écouter...' : 'listening...'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!(input.trim() || interimTranscript.trim()) || isLoading}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-50 bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] hover:shadow-lg"
                  data-testid="nova-send-button"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                🎤 {i18n.language === 'fr' ? 'Voix' : 'Voice'} • 📷 Images • {i18n.language === 'fr' ? 'Propulsé par' : 'Powered by'} Claude AI
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
