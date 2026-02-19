import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Plus, ChevronLeft, ChevronRight, Check, X, Trash2, ExternalLink, Users } from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listing');
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewEvent, setShowNewEvent] = useState(!!listingId);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [googleConnected, setGoogleConnected] = useState(false);
  const [listing, setListing] = useState(null);
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'viewing',
    listing_id: listingId || '',
    start_time: '',
    end_time: '',
    location: '',
    reminder_minutes: 30,
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchEvents();
      checkGoogleStatus();
    }
  }, [user]);

  useEffect(() => {
    if (listingId) {
      fetchListingDetails();
    }
  }, [listingId]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/calendar/events/${user.id}`);
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
    setLoading(false);
  };

  const fetchListingDetails = async () => {
    try {
      const response = await axios.get(`${API}/listings/${listingId}`);
      setListing(response.data);
      setNewEvent(prev => ({
        ...prev,
        title: `Viewing: ${response.data.title}`,
        location: `${response.data.address}, ${response.data.city}`,
        listing_id: listingId
      }));
    } catch (error) {
      console.error('Error fetching listing:', error);
    }
  };

  const checkGoogleStatus = async () => {
    try {
      const response = await axios.get(`${API}/calendar/google/status/${user.id}`);
      setGoogleConnected(response.data.connected);
    } catch (error) {
      console.error('Error checking Google status:', error);
    }
  };

  const handleCreateEvent = async () => {
    try {
      await axios.post(`${API}/calendar/events?user_id=${user.id}`, newEvent);
      setShowNewEvent(false);
      setNewEvent({
        title: '',
        description: '',
        event_type: 'viewing',
        listing_id: '',
        start_time: '',
        end_time: '',
        location: '',
        reminder_minutes: 30,
        notes: ''
      });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleCancelEvent = async (eventId) => {
    try {
      await axios.delete(`${API}/calendar/events/${eventId}?user_id=${user.id}`);
      fetchEvents();
    } catch (error) {
      console.error('Error cancelling event:', error);
    }
  };

  const handleSyncToGoogle = async (eventId) => {
    try {
      await axios.post(`${API}/calendar/google/sync/${eventId}?user_id=${user.id}`);
      fetchEvents();
    } catch (error) {
      console.error('Error syncing to Google:', error);
    }
  };

  const connectGoogle = async () => {
    try {
      const response = await axios.get(`${API}/calendar/google/auth-url`, {
        params: {
          redirect_uri: `${window.location.origin}/calendar/callback`,
          state: user.id
        }
      });
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Google auth error:', error);
      // For demo purposes, simulate connection
      await axios.post(`${API}/calendar/google/callback`, null, {
        params: {
          user_id: user.id,
          code: 'demo_code',
          redirect_uri: window.location.origin
        }
      });
      setGoogleConnected(true);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const hasEventsOnDate = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return events.some(e => e.start_time?.startsWith(dateStr));
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.start_time?.startsWith(dateStr));
  };

  const eventTypes = [
    { value: 'viewing', label: 'Property Viewing', color: 'bg-blue-500' },
    { value: 'meeting', label: 'Meeting', color: 'bg-purple-500' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-500' },
    { value: 'moving', label: 'Moving Day', color: 'bg-green-500' }
  ];

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#1A2F3A] text-white px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white/70 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <div className="flex items-center gap-3">
                <CalendarIcon size={24} />
                <div>
                  <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    My Calendar
                  </h1>
                  <p className="text-sm text-white/70">Property viewings & appointments</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {googleConnected ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm">
                  <Check size={14} className="text-green-400" />
                  Google Connected
                </div>
              ) : (
                <button
                  onClick={connectGoogle}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#1A2F3A] rounded-lg text-sm font-medium hover:bg-gray-100"
                  data-testid="connect-google-btn"
                >
                  <ExternalLink size={14} />
                  Connect Google Calendar
                </button>
              )}
              <button
                onClick={() => setShowNewEvent(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                data-testid="new-event-btn"
              >
                <Plus size={16} />
                New Event
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A2F3A]">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1 text-sm text-[#1A2F3A] hover:bg-gray-100 rounded-lg"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentMonth).map((day, index) => (
                <button
                  key={index}
                  onClick={() => day && setSelectedDate(day)}
                  disabled={!day}
                  className={`aspect-square p-1 rounded-lg relative ${
                    day ? 'hover:bg-gray-100' : ''
                  } ${
                    day && selectedDate.toDateString() === day.toDateString()
                      ? 'bg-[#1A2F3A] text-white'
                      : ''
                  } ${
                    day && day.toDateString() === new Date().toDateString() && selectedDate.toDateString() !== day.toDateString()
                      ? 'bg-blue-50 text-blue-600'
                      : ''
                  }`}
                >
                  {day && (
                    <>
                      <span className="text-sm">{day.getDate()}</span>
                      {hasEventsOnDate(day) && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Date Events */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-medium text-[#1A2F3A] mb-4">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500 text-sm">No events scheduled</p>
              ) : (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map(event => {
                    const eventType = eventTypes.find(t => t.value === event.event_type);
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                        data-testid={`event-${event.id}`}
                      >
                        <div className={`w-2 h-2 mt-2 rounded-full ${eventType?.color || 'bg-gray-400'}`} />
                        <div className="flex-1">
                          <p className="font-medium text-[#1A2F3A]">{event.title}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {googleConnected && !event.google_event_id && (
                            <button
                              onClick={() => handleSyncToGoogle(event.id)}
                              className="p-1.5 hover:bg-gray-200 rounded text-gray-400"
                              title="Sync to Google"
                            >
                              <ExternalLink size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelEvent(event.id)}
                            className="p-1.5 hover:bg-red-100 rounded text-red-400"
                            title="Cancel event"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#1A2F3A] mb-4">Upcoming Events</h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : events.filter(e => new Date(e.start_time) > new Date()).length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {events
                    .filter(e => new Date(e.start_time) > new Date())
                    .slice(0, 5)
                    .map(event => {
                      const eventType = eventTypes.find(t => t.value === event.event_type);
                      return (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className={`w-1 h-full min-h-[40px] rounded ${eventType?.color || 'bg-gray-300'}`} />
                          <div>
                            <p className="font-medium text-[#1A2F3A] text-sm">{event.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.start_time).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#1A2F3A] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/browse"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-sm"
                >
                  <MapPin size={16} className="text-gray-400" />
                  Schedule a Property Viewing
                </Link>
                <Link
                  to="/moving-quote"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-sm"
                >
                  <CalendarIcon size={16} className="text-gray-400" />
                  Plan Your Move
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Event Modal */}
      {showNewEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[#1A2F3A]">
                  {listing ? 'Schedule Viewing' : 'New Event'}
                </h3>
                <button onClick={() => setShowNewEvent(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {listing && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Property</p>
                  <p className="font-medium text-[#1A2F3A]">{listing.title}</p>
                  <p className="text-sm text-gray-500">{listing.address}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value }))}
                  placeholder="Enter event title"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  data-testid="event-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {eventTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewEvent(p => ({ ...p, event_type: type.value }))}
                      className={`p-3 rounded-xl border text-sm text-left ${
                        newEvent.event_type === type.value
                          ? 'border-[#1A2F3A] bg-[#1A2F3A]/5'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${type.color}`} />
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent(p => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    data-testid="event-start-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent(p => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    data-testid="event-end-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(p => ({ ...p, location: e.target.value }))}
                  placeholder="Enter location"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Add any notes"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowNewEvent(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!newEvent.title || !newEvent.start_time || !newEvent.end_time}
                className="flex-1 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50"
                data-testid="save-event-btn"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
