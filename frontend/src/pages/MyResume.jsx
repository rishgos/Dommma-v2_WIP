import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Briefcase, Home, Phone, Mail, DollarSign, 
  Calendar, Users, PawPrint, FileText, CheckCircle2, 
  AlertCircle, Edit2, Save, X, Sparkles, Building,
  Clock, MapPin, Star
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function MyResume() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchResume();
  }, [user, navigate]);

  const fetchResume = async () => {
    try {
      const response = await axios.get(`${API}/api/renter-resume/${user.id}`);
      if (response.data.has_resume) {
        setResume(response.data.resume);
        setEditData(response.data.resume);
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/api/renter-resume`, {
        user_id: user.id,
        ...editData
      });
      setResume(editData);
      setEditing(false);
    } catch (error) {
      console.error('Error saving resume:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section, field, value) => {
    if (section) {
      setEditData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const completenessScore = resume?.completeness_score || 0;
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2F3A]"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-8 text-white mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-semibold">
                  {resume?.full_name?.charAt(0) || user?.name?.charAt(0) || 'R'}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {resume?.full_name || user?.name || 'Your Renter Resume'}
                  </h1>
                  <p className="text-white/70 flex items-center gap-2 mt-1">
                    <Sparkles size={14} />
                    Reusable profile for rental applications
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getScoreColor(completenessScore)}`}>
                  {completenessScore >= 80 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span className="font-medium">{completenessScore}% Complete</span>
                </div>
                <p className="text-white/60 text-sm mt-2">
                  {completenessScore >= 80 ? 'Ready to apply!' : 'Add more details to strengthen your profile'}
                </p>
              </div>
            </div>
          </div>

          {/* No Resume State */}
          {!resume && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="w-20 h-20 rounded-full bg-[#1A2F3A]/10 flex items-center justify-center mx-auto mb-6">
                <FileText size={32} className="text-[#1A2F3A]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Create Your Renter Resume
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Build a reusable profile that makes applying to rentals faster. 
                Include your employment, income, and rental history.
              </p>
              <button
                onClick={() => {
                  setResume({});
                  setEditData({
                    full_name: user?.name || '',
                    email: user?.email || '',
                    employment: {},
                    rental_history: {},
                    household: { num_occupants: 1 },
                    preferences: {}
                  });
                  setEditing(true);
                }}
                className="bg-[#1A2F3A] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2C4A52] transition-colors"
                data-testid="create-resume-btn"
              >
                Create Resume
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Or chat with Nova AI - just say "Help me create a renter resume"
              </p>
            </div>
          )}

          {/* Resume Content */}
          {resume && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                {editing ? (
                  <>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditData(resume);
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-[#1A2F3A] text-white hover:bg-[#2C4A52] flex items-center gap-2 disabled:opacity-50"
                      data-testid="save-resume-btn"
                    >
                      <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 rounded-lg bg-[#1A2F3A] text-white hover:bg-[#2C4A52] flex items-center gap-2"
                    data-testid="edit-resume-btn"
                  >
                    <Edit2 size={16} /> Edit Resume
                  </button>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                  <User size={20} /> Contact Information
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.full_name || ''}
                        onChange={(e) => updateField(null, 'full_name', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        data-testid="resume-name-input"
                      />
                    ) : (
                      <p className="text-[#1A2F3A] font-medium">{resume.full_name || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1 flex items-center gap-1">
                      <Mail size={12} /> Email
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => updateField(null, 'email', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">{resume.email || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1 flex items-center gap-1">
                      <Phone size={12} /> Phone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={editData.phone || ''}
                        onChange={(e) => updateField(null, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">{resume.phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Employment */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                  <Briefcase size={20} /> Employment
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Employment Status</label>
                    {editing ? (
                      <select
                        value={editData.employment?.status || ''}
                        onChange={(e) => updateField('employment', 'status', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                      >
                        <option value="">Select status</option>
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self-Employed</option>
                        <option value="student">Student</option>
                        <option value="retired">Retired</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="text-[#1A2F3A] capitalize">{resume.employment?.status || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Employer Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.employment?.employer || ''}
                        onChange={(e) => updateField('employment', 'employer', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        placeholder="e.g., Google, TD Bank"
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">{resume.employment?.employer || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Job Title</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.employment?.job_title || ''}
                        onChange={(e) => updateField('employment', 'job_title', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        placeholder="e.g., Software Engineer"
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">{resume.employment?.job_title || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1 flex items-center gap-1">
                      <DollarSign size={12} /> Annual Income
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.employment?.annual_income || ''}
                        onChange={(e) => updateField('employment', 'annual_income', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        placeholder="e.g., 75000"
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">
                        {resume.employment?.annual_income 
                          ? `$${resume.employment.annual_income.toLocaleString()}/year` 
                          : 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
                {resume.employment?.annual_income > 0 && !editing && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      Based on your income, you can afford up to <strong>${Math.round(resume.employment.annual_income / 12 * 0.3).toLocaleString()}/month</strong> in rent
                    </p>
                  </div>
                )}
              </div>

              {/* Rental History */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                  <Home size={20} /> Rental History
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 block mb-1 flex items-center gap-1">
                      <MapPin size={12} /> Current Address
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.rental_history?.current_address || ''}
                        onChange={(e) => updateField('rental_history', 'current_address', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        placeholder="e.g., 123 Main St, Vancouver, BC"
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">{resume.rental_history?.current_address || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1 flex items-center gap-1">
                      <Clock size={12} /> Years at Current Address
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.rental_history?.years_at_current || ''}
                        onChange={(e) => updateField('rental_history', 'years_at_current', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        placeholder="e.g., 2"
                        step="0.5"
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">
                        {resume.rental_history?.years_at_current 
                          ? `${resume.rental_history.years_at_current} years` 
                          : 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-[#1A2F3A] mb-3 flex items-center gap-2">
                    <Star size={14} /> Previous Landlord Reference
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Landlord Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={editData.rental_history?.previous_landlord?.name || ''}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            rental_history: {
                              ...prev.rental_history,
                              previous_landlord: {
                                ...prev.rental_history?.previous_landlord,
                                name: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        />
                      ) : (
                        <p className="text-[#1A2F3A]">{resume.rental_history?.previous_landlord?.name || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Landlord Phone</label>
                      {editing ? (
                        <input
                          type="tel"
                          value={editData.rental_history?.previous_landlord?.phone || ''}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            rental_history: {
                              ...prev.rental_history,
                              previous_landlord: {
                                ...prev.rental_history?.previous_landlord,
                                phone: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        />
                      ) : (
                        <p className="text-[#1A2F3A]">{resume.rental_history?.previous_landlord?.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Household */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                  <Users size={20} /> Household Information
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Number of Occupants</label>
                    {editing ? (
                      <input
                        type="number"
                        value={editData.household?.num_occupants || 1}
                        onChange={(e) => updateField('household', 'num_occupants', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        min="1"
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">{resume.household?.num_occupants || 1} person(s)</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1 flex items-center gap-1">
                      <PawPrint size={12} /> Pets
                    </label>
                    {editing ? (
                      <select
                        value={editData.household?.has_pets ? 'yes' : 'no'}
                        onChange={(e) => updateField('household', 'has_pets', e.target.value === 'yes')}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                      >
                        <option value="no">No pets</option>
                        <option value="yes">Yes, I have pets</option>
                      </select>
                    ) : (
                      <p className="text-[#1A2F3A]">{resume.household?.has_pets ? 'Yes' : 'No pets'}</p>
                    )}
                  </div>
                  {(editing ? editData.household?.has_pets : resume.household?.has_pets) && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Pet Details</label>
                      {editing ? (
                        <input
                          type="text"
                          value={editData.household?.pet_details || ''}
                          onChange={(e) => updateField('household', 'pet_details', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                          placeholder="e.g., 1 cat, neutered"
                        />
                      ) : (
                        <p className="text-[#1A2F3A]">{resume.household?.pet_details || 'Not specified'}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Move-in Preferences */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                  <Calendar size={20} /> Move-in Preferences
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Desired Move-in Date</label>
                    {editing ? (
                      <input
                        type="date"
                        value={editData.preferences?.move_in_date || ''}
                        onChange={(e) => updateField('preferences', 'move_in_date', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">{resume.preferences?.move_in_date || 'Flexible'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 block mb-1">Additional Information</label>
                    {editing ? (
                      <textarea
                        value={editData.preferences?.additional_info || ''}
                        onChange={(e) => updateField('preferences', 'additional_info', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                        rows={3}
                        placeholder="Anything else landlords should know about you..."
                      />
                    ) : (
                      <p className="text-[#1A2F3A]">{resume.preferences?.additional_info || 'None provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              {!editing && completenessScore < 80 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-[#1A2F3A] mb-3 flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-600" />
                    Tips to Strengthen Your Profile
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {!resume.employment?.annual_income && (
                      <li className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-yellow-500" />
                        Add your income - landlords want to verify you can afford rent
                      </li>
                    )}
                    {!resume.rental_history?.previous_landlord?.name && (
                      <li className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-yellow-500" />
                        Add a landlord reference to build trust
                      </li>
                    )}
                    {!resume.phone && (
                      <li className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-yellow-500" />
                        Add your phone number for quick contact
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
