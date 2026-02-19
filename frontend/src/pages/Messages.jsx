import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Send, ArrowLeft, Search, Check, CheckCheck,
  User, Building2, Wrench, MoreVertical, Phone, Video, Info
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const [users, setUsers] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConversations();
    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, [user, navigate]);

  const connectWebSocket = useCallback(() => {
    if (!user) return;

    const websocket = new WebSocket(`${WS_URL}/ws/${user.id}`);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message]);
        fetchConversations();
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    setWs(websocket);
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/messages/conversations/${user.id}`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const response = await axios.get(`${API}/messages/${user.id}?other_user_id=${otherUserId}`);
      setMessages(response.data.reverse());
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    fetchMessages(conv.user_id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Send via WebSocket if connected
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        recipient_id: selectedConversation.user_id,
        content: messageContent
      }));
      
      // Optimistically add message to UI
      const optimisticMessage = {
        id: Date.now().toString(),
        sender_id: user.id,
        recipient_id: selectedConversation.user_id,
        content: messageContent,
        created_at: new Date().toISOString(),
        read: false
      };
      setMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();
    } else {
      // Fallback to REST API
      try {
        await axios.post(`${API}/messages/send?sender_id=${user.id}`, {
          recipient_id: selectedConversation.user_id,
          content: messageContent
        });
        fetchMessages(selectedConversation.user_id);
      } catch (error) {
        console.error('Error sending message:', error);
        setNewMessage(messageContent);
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getUserIcon = (userId) => {
    // Placeholder for user type detection
    const icons = [User, Building2, Wrench];
    return icons[userId?.charCodeAt(0) % 3 || 0];
  };

  // Demo contacts for when there are no conversations
  const demoContacts = [
    { user_id: 'landlord-1', name: 'John Smith', role: 'Landlord', last_message: 'Hello! I saw your application.', last_time: new Date().toISOString(), unread: 1 },
    { user_id: 'landlord-2', name: 'Sarah Johnson', role: 'Landlord', last_message: 'The apartment is still available.', last_time: new Date(Date.now() - 86400000).toISOString(), unread: 0 },
    { user_id: 'contractor-1', name: 'Mike Wilson', role: 'Contractor', last_message: 'I can fix that next week.', last_time: new Date(Date.now() - 172800000).toISOString(), unread: 0 },
  ];

  const displayConversations = conversations.length > 0 ? conversations : demoContacts;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#1A2F3A] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-white/70 hover:text-white">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Messages</h1>
              <p className="text-sm text-white/70">Chat with landlords, tenants, and contractors</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none text-sm"
                    data-testid="search-conversations-input"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="mx-auto mb-4 text-gray-300" size={48} />
                    <p className="text-gray-500">No conversations yet</p>
                  </div>
                ) : (
                  displayConversations.map(conv => {
                    const UserIcon = getUserIcon(conv.user_id);
                    return (
                      <button
                        key={conv.user_id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          selectedConversation?.user_id === conv.user_id ? 'bg-[#F5F5F0]' : ''
                        }`}
                        data-testid={`conversation-${conv.user_id}`}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-[#1A2F3A] flex items-center justify-center text-white">
                            <UserIcon size={20} />
                          </div>
                          {conv.unread > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-[#1A2F3A]">{conv.name || `User ${conv.user_id.slice(-4)}`}</p>
                            <span className="text-xs text-gray-400">
                              {formatDate(conv.last_time)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-1 flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1A2F3A] flex items-center justify-center text-white">
                        {React.createElement(getUserIcon(selectedConversation.user_id), { size: 18 })}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A2F3A]">
                          {selectedConversation.name || `User ${selectedConversation.user_id.slice(-4)}`}
                        </p>
                        <p className="text-xs text-gray-500">{selectedConversation.role || 'Online'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Phone size={18} className="text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Video size={18} className="text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Info size={18} className="text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F5F5F0]/50" data-testid="messages-container">
                    {messages.map((msg, index) => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div
                          key={msg.id || index}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                            <div
                              className={`px-4 py-3 rounded-2xl ${
                                isOwn 
                                  ? 'bg-[#1A2F3A] text-white rounded-tr-sm' 
                                  : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                              <span className="text-xs text-gray-400">
                                {formatTime(msg.created_at)}
                              </span>
                              {isOwn && (
                                msg.read ? (
                                  <CheckCheck size={14} className="text-blue-500" />
                                ) : (
                                  <Check size={14} className="text-gray-400" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none"
                        data-testid="message-input"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-12 h-12 rounded-xl bg-[#1A2F3A] text-white flex items-center justify-center hover:bg-[#2C4A52] transition-colors disabled:opacity-50"
                        data-testid="send-message-btn"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-[#F5F5F0]/50">
                  <div className="text-center">
                    <MessageSquare className="mx-auto mb-4 text-gray-300" size={64} />
                    <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">Select a Conversation</h3>
                    <p className="text-gray-500">Choose from your existing conversations<br />or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
