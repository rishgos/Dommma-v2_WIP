import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, TrendingUp, Calendar, Heart, Search, Home, 
  BarChart2, Target, Clock, CheckCircle, AlertCircle, 
  Sparkles, MapPin, DollarSign, ChevronRight, Lightbulb,
  Volume2, Settings
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NovaInsights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [voiceSettings, setVoiceSettings] = useState(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchInsights();
    fetchVoiceSettings();
    fetchVoices();
  }, [user, navigate]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/nova/insights/${user.id}`);
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
    setLoading(false);
  };

  const fetchVoiceSettings = async () => {
    try {
      const response = await axios.get(`${API}/nova/tts/preferences/${user.id}`);
      setVoiceSettings(response.data);
    } catch (error) {
      console.error('Error fetching voice settings:', error);
    }
  };

  const fetchVoices = async () => {
    try {
      const response = await axios.get(`${API}/nova/tts/voices`);
      setAvailableVoices(response.data.voices || []);
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  };

  const updateVoiceSetting = async (key, value) => {
    try {
      await axios.post(`${API}/nova/tts/preferences/${user.id}`, {
        [key]: value
      });
      fetchVoiceSettings();
    } catch (error) {
      console.error('Error updating voice setting:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'timeline', label: 'Moving Timeline', icon: Clock },
    { id: 'matches', label: 'Property Matches', icon: Target },
    { id: 'trends', label: 'Market Trends', icon: TrendingUp },
    { id: 'settings', label: 'Nova Settings', icon: Settings },
  ];

  const getPhaseColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#1A2F3A] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] text-white px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white/70 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Nova Insights
                  </h1>
                  <p className="text-sm text-white/70">Your personalized analytics dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#1A2F3A] text-[#1A2F3A]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Search className="text-blue-600" size={20} />
                  </div>
                  <span className="text-gray-500 text-sm">Searches</span>
                </div>
                <p className="text-3xl font-bold text-[#1A2F3A]">
                  {insights?.activity_summary?.total_interactions || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {insights?.activity_summary?.this_week || 0} this week
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Heart className="text-red-500" size={20} />
                  </div>
                  <span className="text-gray-500 text-sm">Saved</span>
                </div>
                <p className="text-3xl font-bold text-[#1A2F3A]">
                  {insights?.activity_summary?.favorites_saved || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Properties saved</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Calendar className="text-purple-600" size={20} />
                  </div>
                  <span className="text-gray-500 text-sm">Viewings</span>
                </div>
                <p className="text-3xl font-bold text-[#1A2F3A]">
                  {insights?.activity_summary?.viewings_scheduled || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Scheduled</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Target className="text-green-600" size={20} />
                  </div>
                  <span className="text-gray-500 text-sm">Match Score</span>
                </div>
                <p className="text-3xl font-bold text-[#1A2F3A]">
                  {Math.round(insights?.property_match_scores?.average_score || 0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Average match</p>
              </div>
            </div>

            {/* Profile Completeness */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#1A2F3A] mb-4">Profile Completeness</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] rounded-full transition-all"
                      style={{ width: `${insights?.preference_evolution?.preference_completeness || 0}%` }}
                    />
                  </div>
                </div>
                <span className="font-bold text-[#1A2F3A]">
                  {insights?.preference_evolution?.preference_completeness || 0}%
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Complete your profile for better property recommendations
              </p>
            </div>

            {/* Recommendations */}
            {insights?.recommendations?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                  <Lightbulb className="text-yellow-500" size={18} />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {insights.recommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-xl flex items-start gap-3 ${
                        rec.priority === 'high' ? 'bg-blue-50' :
                        rec.priority === 'medium' ? 'bg-amber-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        rec.priority === 'high' ? 'bg-blue-500' :
                        rec.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium text-[#1A2F3A]">{rec.title}</p>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-[#1A2F3A]">Your Moving Journey</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  insights?.moving_timeline?.activity_level === 'High' ? 'bg-green-100 text-green-700' :
                  insights?.moving_timeline?.activity_level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {insights?.moving_timeline?.activity_level} Activity
                </span>
              </div>

              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">Current Phase</p>
                <p className="text-2xl font-bold text-[#1A2F3A]">
                  {insights?.moving_timeline?.current_phase || 'Getting Started'}
                </p>
              </div>

              {/* Timeline Phases */}
              <div className="space-y-4">
                {insights?.moving_timeline?.phases?.map((phase, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPhaseColor(phase.status)}`}>
                        {phase.status === 'completed' ? (
                          <CheckCircle size={16} className="text-white" />
                        ) : phase.status === 'in_progress' ? (
                          <Clock size={16} className="text-white" />
                        ) : (
                          <span className="text-white text-sm">{idx + 1}</span>
                        )}
                      </div>
                      {idx < (insights?.moving_timeline?.phases?.length || 0) - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <h4 className="font-semibold text-[#1A2F3A]">{phase.name}</h4>
                      <p className="text-sm text-gray-500">{phase.description}</p>
                      {phase.tasks && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {phase.tasks.map((task, tIdx) => (
                            <span key={tIdx} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                              {task}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tasks */}
            {insights?.moving_timeline?.upcoming_tasks?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-[#1A2F3A] mb-4">Upcoming Tasks</h3>
                <div className="space-y-3">
                  {insights.moving_timeline.upcoming_tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar size={16} className="text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-[#1A2F3A]">{task.task}</p>
                        <p className="text-xs text-gray-500">
                          {task.date && new Date(task.date).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#1A2F3A] mb-4">Property Match Scores</h3>
              
              {insights?.property_match_scores?.matches?.length > 0 ? (
                <div className="space-y-4">
                  {insights.property_match_scores.matches.map((match, idx) => (
                    <div key={idx} className="p-4 border border-gray-100 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-[#1A2F3A]">{match.title}</h4>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          match.score >= 80 ? 'bg-green-100 text-green-700' :
                          match.score >= 60 ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {match.score}% match
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">${match.price}/month</p>
                      <div className="flex flex-wrap gap-2">
                        {match.match_reasons?.map((reason, rIdx) => (
                          <span key={rIdx} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-gray-500">Save some properties to see match scores</p>
                  <Link to="/browse" className="text-[#1A2F3A] underline text-sm mt-2 block">
                    Browse properties
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#1A2F3A] mb-4">Market Trends for You</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Average Price</p>
                  <p className="text-2xl font-bold text-[#1A2F3A]">
                    ${Math.round(insights?.market_trends?.average_price || 0).toLocaleString()}/mo
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Matching Listings</p>
                  <p className="text-2xl font-bold text-[#1A2F3A]">
                    {insights?.market_trends?.total_matching_listings || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Availability</p>
                  <p className="text-2xl font-bold text-[#1A2F3A]">
                    {insights?.market_trends?.availability || 'Unknown'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Competition</p>
                  <p className="text-2xl font-bold text-[#1A2F3A]">
                    {insights?.market_trends?.competition_level || 'Unknown'}
                  </p>
                </div>
              </div>

              {insights?.market_trends?.insight && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-800">{insights.market_trends.insight}</p>
                </div>
              )}

              {insights?.market_trends?.best_value_areas?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-[#1A2F3A] mb-3">Best Value Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {insights.market_trends.best_value_areas.map((area, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                        <MapPin size={12} />
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                <Volume2 size={18} />
                Voice Settings
              </h3>
              
              {/* Voice Enabled Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
                <div>
                  <p className="font-medium text-[#1A2F3A]">Enable Voice Responses</p>
                  <p className="text-sm text-gray-500">Nova will speak responses aloud</p>
                </div>
                <button
                  onClick={() => updateVoiceSetting('enabled', !voiceSettings?.enabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    voiceSettings?.enabled ? 'bg-[#1A2F3A]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    voiceSettings?.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Voice Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableVoices.map(voice => (
                    <button
                      key={voice.id}
                      onClick={() => updateVoiceSetting('voice', voice.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        voiceSettings?.voice === voice.id
                          ? 'border-[#1A2F3A] bg-[#1A2F3A]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-[#1A2F3A]">{voice.name}</p>
                      <p className="text-xs text-gray-500">{voice.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speech Speed: {voiceSettings?.speed || 1.0}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings?.speed || 1.0}
                  onChange={(e) => updateVoiceSetting('speed', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Slower</span>
                  <span>Normal</span>
                  <span>Faster</span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#1A2F3A] mb-4">Your Preferences</h3>
              <div className="space-y-3">
                {Object.entries(insights?.preference_evolution?.current_preferences || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-[#1A2F3A]">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NovaInsights;
