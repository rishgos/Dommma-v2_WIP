import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Users, Heart, MapPin, DollarSign, Calendar,
  Sun, Moon, Music, Coffee, Dog, Cigarette, Send, X, Plus, Filter
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const lifestyleOptions = [
  { id: 'early_bird', label: 'Early Bird', icon: Sun },
  { id: 'night_owl', label: 'Night Owl', icon: Moon },
  { id: 'quiet', label: 'Quiet', icon: Coffee },
  { id: 'social', label: 'Social', icon: Music },
  { id: 'clean', label: 'Very Clean', icon: Coffee },
  { id: 'active', label: 'Active', icon: Heart },
  { id: 'cook', label: 'Loves Cooking', icon: Coffee },
  { id: 'remote_work', label: 'Work from Home', icon: Coffee },
];

const areaOptions = ['Downtown', 'Kitsilano', 'Mount Pleasant', 'Yaletown', 'East Vancouver', 'West End', 'Fairview', 'Cambie', 'Commercial Drive', 'North Vancouver'];

const RoommateFinder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [form, setForm] = useState({
    name: '', age: '', gender: '', occupation: '', budget_min: 800, budget_max: 1800,
    move_in_date: '', preferred_areas: [], lifestyle: [], pets: false, smoking: false, bio: ''
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profRes, searchRes, connRes] = await Promise.all([
        axios.get(`${API}/roommates/profile/${user.id}`).catch(() => null),
        axios.get(`${API}/roommates/search?user_id=${user.id}`).catch(() => ({ data: [] })),
        axios.get(`${API}/roommates/connections/${user.id}`).catch(() => ({ data: [] }))
      ]);
      if (profRes?.data) {
        setMyProfile(profRes.data);
        setForm({
          name: profRes.data.name || '', age: profRes.data.age || '', gender: profRes.data.gender || '',
          occupation: profRes.data.occupation || '', budget_min: profRes.data.budget_min || 800,
          budget_max: profRes.data.budget_max || 1800, move_in_date: profRes.data.move_in_date || '',
          preferred_areas: profRes.data.preferred_areas || [], lifestyle: profRes.data.lifestyle || [],
          pets: profRes.data.pets || false, smoking: profRes.data.smoking || false, bio: profRes.data.bio || ''
        });
      }
      setProfiles(searchRes?.data || []);
      setConnections(connRes?.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, age: form.age ? parseInt(form.age) : null };
      await axios.post(`${API}/roommates/profile?user_id=${user.id}`, data);
      setShowProfile(false);
      fetchAll();
    } catch (e) { console.error(e); alert('Failed to save.'); }
  };

  const handleConnect = async (profileId) => {
    try {
      await axios.post(`${API}/roommates/${profileId}/connect?user_id=${user.id}&message=${encodeURIComponent(connectMessage)}`);
      setSelectedProfile(null);
      setConnectMessage('');
      fetchAll();
      alert('Connection request sent!');
    } catch (e) { alert('Failed to send request.'); }
  };

  const toggleLifestyle = (id) => setForm(prev => ({ ...prev, lifestyle: prev.lifestyle.includes(id) ? prev.lifestyle.filter(l => l !== id) : [...prev.lifestyle, id] }));
  const toggleArea = (a) => setForm(prev => ({ ...prev, preferred_areas: prev.preferred_areas.includes(a) ? prev.preferred_areas.filter(x => x !== a) : [...prev.preferred_areas, a] }));

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-[#1A2F3A] text-white px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white/70 hover:text-white"><ArrowLeft size={18} /></Link>
              <div>
                <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Roommate Finder</h1>
                <p className="text-sm text-white/70">Find your perfect roommate match</p>
              </div>
            </div>
            <button onClick={() => setShowProfile(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm" data-testid="edit-roommate-profile">
              {myProfile ? 'Edit Profile' : 'Create Profile'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6">
          <button onClick={() => setActiveTab('browse')} className={`flex-1 py-2.5 rounded-lg text-sm ${activeTab === 'browse' ? 'bg-[#1A2F3A] text-white' : 'text-gray-500'}`}>Browse ({profiles.length})</button>
          <button onClick={() => setActiveTab('connections')} className={`flex-1 py-2.5 rounded-lg text-sm ${activeTab === 'connections' ? 'bg-[#1A2F3A] text-white' : 'text-gray-500'}`}>Connections ({connections.length})</button>
        </div>

        {activeTab === 'browse' && (
          <div>
            {!myProfile && (
              <div className="bg-blue-50 rounded-2xl p-6 mb-6 text-center">
                <Users className="mx-auto mb-3 text-blue-400" size={32} />
                <p className="text-blue-700 font-medium">Create your roommate profile first to get matched!</p>
                <button onClick={() => setShowProfile(true)} className="mt-3 px-6 py-2 bg-[#1A2F3A] text-white rounded-xl text-sm">Create Profile</button>
              </div>
            )}
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>)}</div>
            ) : profiles.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Users className="mx-auto mb-4 text-gray-300" size={64} />
                <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Roommates Found</h3>
                <p className="text-gray-500">Be the first to create a profile!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {profiles.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProfile(p)} data-testid={`roommate-${p.id}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] flex items-center justify-center text-white text-xl font-bold">
                        {p.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1A2F3A]">{p.name}</h3>
                        <p className="text-sm text-gray-500">{p.age ? `${p.age} · ` : ''}{p.occupation || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1"><DollarSign size={14} />${p.budget_min}-${p.budget_max}/mo</span>
                      {p.move_in_date && <span className="flex items-center gap-1"><Calendar size={14} />{p.move_in_date}</span>}
                    </div>
                    {p.preferred_areas?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">{p.preferred_areas.slice(0, 3).map(a => <span key={a} className="px-2 py-0.5 bg-[#F5F5F0] text-gray-600 rounded text-xs">{a}</span>)}</div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {p.lifestyle?.slice(0, 4).map(l => <span key={l} className="px-2 py-0.5 bg-[#1A2F3A]/10 text-[#1A2F3A] rounded text-xs capitalize">{l.replace('_', ' ')}</span>)}
                      {p.pets && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Has Pets</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div>
            {connections.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Heart className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="text-gray-500">No connections yet. Browse profiles to connect!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1A2F3A] flex items-center justify-center text-white font-bold">{c.other_profile?.name?.charAt(0) || '?'}</div>
                      <div>
                        <h4 className="font-medium text-[#1A2F3A]">{c.other_profile?.name || 'User'}</h4>
                        <p className="text-xs text-gray-500">${c.other_profile?.budget_min}-${c.other_profile?.budget_max}/mo</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Roommate Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" required data-testid="roommate-name" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Age</label><input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">Gender</label><select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"><option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-binary</option></select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Occupation</label><input type="text" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="Student, Engineer..." /></div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Budget Range ($/mo)</label>
                <div className="flex items-center gap-3">
                  <input type="number" value={form.budget_min} onChange={e => setForm({...form, budget_min: parseInt(e.target.value)})} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                  <span className="text-gray-400">to</span>
                  <input type="number" value={form.budget_max} onChange={e => setForm({...form, budget_max: parseInt(e.target.value)})} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                </div>
              </div>
              <div><label className="block text-sm text-gray-600 mb-1">Move-in Date</label><input type="date" value={form.move_in_date} onChange={e => setForm({...form, move_in_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" /></div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Preferred Areas</label>
                <div className="flex flex-wrap gap-2">{areaOptions.map(a => <button key={a} type="button" onClick={() => toggleArea(a)} className={`px-3 py-1.5 rounded-full text-xs ${form.preferred_areas.includes(a) ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600'}`}>{a}</button>)}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Lifestyle</label>
                <div className="flex flex-wrap gap-2">{lifestyleOptions.map(l => <button key={l.id} type="button" onClick={() => toggleLifestyle(l.id)} className={`px-3 py-1.5 rounded-full text-xs ${form.lifestyle.includes(l.id) ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600'}`}>{l.label}</button>)}</div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.pets} onChange={e => setForm({...form, pets: e.target.checked})} className="w-4 h-4" /><span className="text-sm">I have pets</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.smoking} onChange={e => setForm({...form, smoking: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Smoker</span></label>
              </div>
              <div><label className="block text-sm text-gray-600 mb-1">About You</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none" rows={3} placeholder="Tell potential roommates about yourself..." /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProfile(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52]" data-testid="save-roommate-profile">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Detail + Connect Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProfile(null)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] flex items-center justify-center text-white text-2xl font-bold">{selectedProfile.name?.charAt(0)}</div>
              <div>
                <h2 className="text-xl font-semibold text-[#1A2F3A]">{selectedProfile.name}</h2>
                <p className="text-gray-500">{selectedProfile.age ? `${selectedProfile.age} · ` : ''}{selectedProfile.occupation}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[#F5F5F0] p-3 rounded-xl"><p className="text-xs text-gray-500">Budget</p><p className="font-semibold text-[#1A2F3A]">${selectedProfile.budget_min}-${selectedProfile.budget_max}/mo</p></div>
              <div className="bg-[#F5F5F0] p-3 rounded-xl"><p className="text-xs text-gray-500">Move-in</p><p className="font-semibold text-[#1A2F3A]">{selectedProfile.move_in_date || 'Flexible'}</p></div>
            </div>
            {selectedProfile.bio && <p className="text-gray-600 mb-4">{selectedProfile.bio}</p>}
            <div className="flex flex-wrap gap-1 mb-4">{selectedProfile.lifestyle?.map(l => <span key={l} className="px-2 py-1 bg-[#1A2F3A]/10 text-[#1A2F3A] rounded-full text-xs capitalize">{l.replace('_', ' ')}</span>)}</div>
            <div className="flex flex-wrap gap-1 mb-6">{selectedProfile.preferred_areas?.map(a => <span key={a} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{a}</span>)}</div>
            <textarea value={connectMessage} onChange={e => setConnectMessage(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none mb-3" rows={2} placeholder="Send a message with your request..." />
            <button onClick={() => handleConnect(selectedProfile.id)} className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] flex items-center justify-center gap-2" data-testid="connect-roommate">
              <Send size={16} /> Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoommateFinder;
