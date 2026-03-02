import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Star, CheckCircle2, XCircle, Clock, DollarSign, 
  Briefcase, Home, PawPrint, Calendar, Mail, Phone,
  ThumbsUp, ThumbsDown, MessageSquare, FileText, 
  TrendingUp, AlertTriangle, Sparkles, Filter, Building
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function ApplicantRanking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, qualified, needs_review

  useEffect(() => {
    if (!user || user.user_type !== 'landlord') {
      navigate('/login');
      return;
    }
    fetchProperties();
  }, [user, navigate]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${API}/api/listings?owner_id=${user.id}`);
      setProperties(response.data || []);
      if (response.data?.length > 0) {
        setSelectedProperty(response.data[0]);
        fetchApplicants(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (propertyId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/applications?listing_id=${propertyId}`);
      const apps = response.data || [];
      
      // Add AI scoring to applicants
      const scoredApplicants = apps.map(app => ({
        ...app,
        ai_score: calculateAIScore(app, selectedProperty),
        ai_analysis: generateAIAnalysis(app, selectedProperty)
      }));
      
      // Sort by AI score
      scoredApplicants.sort((a, b) => b.ai_score - a.ai_score);
      setApplicants(scoredApplicants);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      // Demo data for testing
      setApplicants(generateDemoApplicants());
    } finally {
      setLoading(false);
    }
  };

  const calculateAIScore = (applicant, property) => {
    let score = 0;
    const propertyPrice = property?.price || 2000;
    
    // Income to rent ratio (max 35 points)
    const monthlyIncome = (applicant.annual_income || 0) / 12;
    const rentRatio = monthlyIncome / propertyPrice;
    if (rentRatio >= 3) score += 35;
    else if (rentRatio >= 2.5) score += 28;
    else if (rentRatio >= 2) score += 20;
    else score += Math.max(0, rentRatio * 10);
    
    // Employment stability (max 25 points)
    if (applicant.employment_status === 'employed') score += 20;
    else if (applicant.employment_status === 'self-employed') score += 15;
    else if (applicant.employment_status === 'student') score += 10;
    if (applicant.employer_name) score += 5;
    
    // Rental history (max 25 points)
    if (applicant.years_at_current >= 2) score += 20;
    else if (applicant.years_at_current >= 1) score += 15;
    else score += 5;
    if (applicant.previous_landlord_reference) score += 5;
    
    // Completeness of application (max 15 points)
    let completeness = 0;
    if (applicant.full_name) completeness += 2;
    if (applicant.email) completeness += 2;
    if (applicant.phone) completeness += 2;
    if (applicant.annual_income) completeness += 3;
    if (applicant.employment_status) completeness += 3;
    if (applicant.move_in_date) completeness += 3;
    score += completeness;
    
    return Math.min(100, Math.round(score));
  };

  const generateAIAnalysis = (applicant, property) => {
    const propertyPrice = property?.price || 2000;
    const monthlyIncome = (applicant.annual_income || 0) / 12;
    const rentRatio = monthlyIncome / propertyPrice;
    
    const strengths = [];
    const concerns = [];
    
    if (rentRatio >= 3) {
      strengths.push('Strong income-to-rent ratio (3x+)');
    } else if (rentRatio >= 2) {
      strengths.push('Acceptable income-to-rent ratio');
    } else {
      concerns.push('Income may be tight for this rent level');
    }
    
    if (applicant.employment_status === 'employed' && applicant.employer_name) {
      strengths.push(`Stable employment at ${applicant.employer_name}`);
    }
    
    if (applicant.years_at_current >= 2) {
      strengths.push('Long-term rental history shows stability');
    } else if (applicant.years_at_current < 1) {
      concerns.push('Limited rental history');
    }
    
    if (applicant.previous_landlord_reference) {
      strengths.push('Provided landlord reference');
    } else {
      concerns.push('No landlord reference provided');
    }
    
    if (applicant.has_pets && !property?.pet_friendly) {
      concerns.push('Has pets but property is not pet-friendly');
    }
    
    return { strengths, concerns };
  };

  const generateDemoApplicants = () => {
    return [
      {
        id: '1',
        full_name: 'Sarah Chen',
        email: 'sarah.chen@email.com',
        phone: '604-555-0101',
        employment_status: 'employed',
        employer_name: 'Amazon',
        job_title: 'Product Manager',
        annual_income: 95000,
        years_at_current: 3,
        has_pets: false,
        num_occupants: 1,
        move_in_date: '2026-04-01',
        previous_landlord_reference: true,
        ai_score: 92,
        ai_analysis: {
          strengths: ['Strong income-to-rent ratio (3x+)', 'Stable employment at Amazon', 'Long-term rental history shows stability', 'Provided landlord reference'],
          concerns: []
        },
        status: 'pending',
        applied_at: '2026-02-28'
      },
      {
        id: '2',
        full_name: 'Michael Rodriguez',
        email: 'mrodriguez@gmail.com',
        phone: '778-555-0202',
        employment_status: 'employed',
        employer_name: 'TD Bank',
        job_title: 'Financial Analyst',
        annual_income: 78000,
        years_at_current: 2,
        has_pets: true,
        pet_details: '1 small dog',
        num_occupants: 2,
        move_in_date: '2026-04-15',
        previous_landlord_reference: true,
        ai_score: 85,
        ai_analysis: {
          strengths: ['Acceptable income-to-rent ratio', 'Stable employment at TD Bank', 'Long-term rental history shows stability'],
          concerns: ['Has pets - verify pet policy']
        },
        status: 'pending',
        applied_at: '2026-02-27'
      },
      {
        id: '3',
        full_name: 'Emma Thompson',
        email: 'emma.t@outlook.com',
        phone: '604-555-0303',
        employment_status: 'student',
        employer_name: 'UBC',
        job_title: 'Graduate Student',
        annual_income: 28000,
        years_at_current: 1,
        has_pets: false,
        num_occupants: 1,
        move_in_date: '2026-05-01',
        previous_landlord_reference: false,
        ai_score: 52,
        ai_analysis: {
          strengths: ['Student status verified'],
          concerns: ['Income may be tight for this rent level', 'No landlord reference provided', 'May need co-signer']
        },
        status: 'pending',
        applied_at: '2026-02-25'
      }
    ];
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return { label: 'Highly Qualified', icon: CheckCircle2, color: 'text-green-600' };
    if (score >= 60) return { label: 'Needs Review', icon: AlertTriangle, color: 'text-yellow-600' };
    return { label: 'Low Match', icon: XCircle, color: 'text-red-600' };
  };

  const filteredApplicants = applicants.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'qualified') return app.ai_score >= 80;
    if (filter === 'needs_review') return app.ai_score >= 60 && app.ai_score < 80;
    return true;
  });

  const handleApprove = async (applicantId) => {
    try {
      await axios.patch(`${API}/api/applications/${applicantId}`, { status: 'approved' });
      setApplicants(prev => prev.map(a => 
        a.id === applicantId ? { ...a, status: 'approved' } : a
      ));
    } catch (error) {
      console.error('Error approving applicant:', error);
    }
  };

  const handleReject = async (applicantId) => {
    try {
      await axios.patch(`${API}/api/applications/${applicantId}`, { status: 'rejected' });
      setApplicants(prev => prev.map(a => 
        a.id === applicantId ? { ...a, status: 'rejected' } : a
      ));
    } catch (error) {
      console.error('Error rejecting applicant:', error);
    }
  };

  if (loading && !applicants.length) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2F3A] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applicants...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              <Sparkles className="text-yellow-500" />
              AI Applicant Ranking
            </h1>
            <p className="text-gray-600 mt-2">
              Nova AI analyzes applicants based on income, employment, and rental history
            </p>
          </div>

          {/* Property Selector */}
          {properties.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <label className="text-sm text-gray-500 block mb-2">Select Property</label>
              <div className="flex flex-wrap gap-3">
                {properties.map(prop => (
                  <button
                    key={prop.id}
                    onClick={() => {
                      setSelectedProperty(prop);
                      fetchApplicants(prop.id);
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                      selectedProperty?.id === prop.id 
                        ? 'bg-[#1A2F3A] text-white border-[#1A2F3A]' 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#1A2F3A]'
                    }`}
                  >
                    <Building size={16} />
                    {prop.title || prop.address}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Filter size={18} className="text-gray-500" />
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Applicants' },
                { value: 'qualified', label: 'Highly Qualified' },
                { value: 'needs_review', label: 'Needs Review' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    filter === f.value 
                      ? 'bg-[#1A2F3A] text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-auto">
              {filteredApplicants.length} applicant{filteredApplicants.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Applicants List */}
          {filteredApplicants.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <Users size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Applicants Yet</h3>
              <p className="text-gray-600">
                When tenants apply to your property, they'll appear here with AI-powered ranking.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplicants.map((applicant, index) => {
                const badge = getScoreBadge(applicant.ai_score);
                return (
                  <div 
                    key={applicant.id}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    data-testid={`applicant-card-${index}`}
                  >
                    <div className="flex items-start gap-6">
                      {/* Rank & Score */}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#1A2F3A]">#{index + 1}</div>
                        <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(applicant.ai_score)}`}>
                          {applicant.ai_score}%
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-[#1A2F3A]">{applicant.full_name}</h3>
                          <span className={`flex items-center gap-1 text-sm ${badge.color}`}>
                            <badge.icon size={14} />
                            {badge.label}
                          </span>
                          {applicant.status !== 'pending' && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              applicant.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {applicant.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          )}
                        </div>

                        {/* Contact & Employment */}
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="flex items-center gap-2 text-gray-600">
                              <Mail size={14} /> {applicant.email}
                            </p>
                            <p className="flex items-center gap-2 text-gray-600">
                              <Phone size={14} /> {applicant.phone}
                            </p>
                            <p className="flex items-center gap-2 text-gray-600">
                              <Calendar size={14} /> Move-in: {applicant.move_in_date || 'Flexible'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="flex items-center gap-2 text-gray-600">
                              <Briefcase size={14} /> 
                              {applicant.job_title} at {applicant.employer_name || 'N/A'}
                            </p>
                            <p className="flex items-center gap-2 text-gray-600">
                              <DollarSign size={14} /> 
                              ${applicant.annual_income?.toLocaleString() || 0}/year
                            </p>
                            <p className="flex items-center gap-2 text-gray-600">
                              <Home size={14} /> 
                              {applicant.years_at_current || 0} years at current address
                            </p>
                            {applicant.has_pets && (
                              <p className="flex items-center gap-2 text-gray-600">
                                <PawPrint size={14} /> {applicant.pet_details || 'Has pets'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* AI Analysis */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                          <p className="text-sm font-medium text-[#1A2F3A] mb-2 flex items-center gap-2">
                            <Sparkles size={14} className="text-purple-500" />
                            AI Analysis
                          </p>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-green-700 font-medium mb-1">Strengths</p>
                              <ul className="space-y-1">
                                {applicant.ai_analysis?.strengths?.map((s, i) => (
                                  <li key={i} className="flex items-start gap-2 text-green-600">
                                    <CheckCircle2 size={12} className="mt-1 flex-shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {applicant.ai_analysis?.concerns?.length > 0 && (
                              <div>
                                <p className="text-yellow-700 font-medium mb-1">Considerations</p>
                                <ul className="space-y-1">
                                  {applicant.ai_analysis?.concerns?.map((c, i) => (
                                    <li key={i} className="flex items-start gap-2 text-yellow-600">
                                      <AlertTriangle size={12} className="mt-1 flex-shrink-0" />
                                      {c}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {applicant.status === 'pending' && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleApprove(applicant.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            data-testid={`approve-btn-${index}`}
                          >
                            <ThumbsUp size={16} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(applicant.id)}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                            data-testid={`reject-btn-${index}`}
                          >
                            <ThumbsDown size={16} /> Reject
                          </button>
                          <button
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                          >
                            <MessageSquare size={16} /> Message
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
