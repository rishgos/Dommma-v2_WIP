import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, Loader2, Home, Bot,
  DollarSign, MapPin, ArrowRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PropertyChatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState([
    "Show me 2BR apartments under $2500",
    "Pet-friendly places in Kitsilano",
    "What's the average rent downtown?"
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/ai/property-chat`, {
        message: text,
        session_id: sessionId,
        user_id: user?.id
      });
      setSessionId(res.data.session_id);
      setSuggestions(res.data.suggestions || []);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        listings: res.data.listings || []
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that. Please try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8" data-testid="property-chatbot-page">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm mb-3">
            <Sparkles size={16} />AI Property Search
          </div>
          <h1 className="text-3xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Find Your Perfect Home
          </h1>
          <p className="text-gray-500 mt-2">Ask me anything about properties, neighborhoods, or the rental market</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: '500px' }}>
          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto" data-testid="chat-messages">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 mb-6">Start a conversation to search properties</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)}
                      className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600 hover:bg-gray-200" data-testid={`suggestion-${i}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user'
                  ? 'bg-[#1A2F3A] text-white rounded-2xl rounded-br-md px-4 py-3'
                  : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.listings?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.listings.slice(0, 3).map((l, li) => (
                        <a key={li} href={`/property/${l.id}`}
                          className="block p-3 bg-white/90 rounded-xl border border-gray-200 hover:border-[#1A2F3A]/30 transition-all"
                          data-testid={`listing-card-${li}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-[#1A2F3A] text-sm">{l.title}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{l.address}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-700 text-sm">${l.price?.toLocaleString()}{l.listing_type === 'rent' ? '/mo' : ''}</p>
                              <p className="text-xs text-gray-400">{l.bedrooms}BR {l.bathrooms}BA</p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Searching properties...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {messages.length > 0 && suggestions.length > 0 && (
            <div className="px-6 pb-2 flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-100">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-gray-100">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about properties, neighborhoods, prices..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                data-testid="chat-input" disabled={loading} />
              <button type="submit" disabled={loading || !input.trim()}
                className="px-5 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50"
                data-testid="chat-send-btn">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
