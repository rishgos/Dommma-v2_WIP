import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Shield, FileText, AlertTriangle, CheckCircle, Loader2,
  DollarSign, ChevronDown, ChevronUp, Scale, Info,
  ArrowLeft, Upload, Sparkles
} from 'lucide-react';
import { useAuth } from '../App';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RiskBadge = ({ score }) => {
  const colors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
    unknown: 'bg-gray-100 text-gray-600 border-gray-200'
  };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${colors[score] || colors.unknown}`} data-testid="risk-badge">
      <Shield size={14} />{(score || 'unknown').toUpperCase()} RISK
    </span>
  );
};

export default function TenantDocReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [review, setReview] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    highlights: true, concerns: true, checklist: true, obligations: true
  });

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
    const docId = searchParams.get('doc');
    if (docId) handleReviewDoc(docId);
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const [esignRes, builderRes] = await Promise.all([
        axios.get(`${API}/esign/documents?user_id=${user.id}`).catch(() => ({ data: [] })),
        axios.get(`${API}/document-builder/documents?user_id=${user.id}`).catch(() => ({ data: [] }))
      ]);
      const allDocs = [
        ...(esignRes.data || []).map(d => ({ ...d, source: 'esign' })),
        ...(builderRes.data || []).map(d => ({ ...d, source: 'builder' }))
      ];
      setDocuments(allDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally { setLoading(false); }
  };

  const handleReviewDoc = async (docId) => {
    setReviewLoading(true);
    setSelectedDoc(docId);
    try {
      const [reviewRes, compRes] = await Promise.all([
        axios.post(`${API}/ai/tenant-document-review?document_id=${docId}&tenant_id=${user.id}`),
        axios.get(`${API}/ai/lease-comparison?tenant_id=${user.id}&document_id=${docId}`).catch(() => null)
      ]);
      setReview(reviewRes.data);
      if (compRes) setComparison(compRes.data);
    } catch (error) {
      console.error('Review error:', error);
    } finally { setReviewLoading(false); }
  };

  const handleManualReview = async () => {
    if (!manualContent.trim()) return;
    setReviewLoading(true);
    try {
      const res = await axios.post(`${API}/ai/tenant-document-review?content=${encodeURIComponent(manualContent)}&tenant_id=${user.id}`);
      setReview(res.data);
      setSelectedDoc('manual');
    } catch (error) {
      console.error('Review error:', error);
    } finally { setReviewLoading(false); }
  };

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="tenant-doc-review">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1A2F3A] mb-4">
            <ArrowLeft size={16} />Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }} data-testid="page-title">
                AI Document Intelligence
              </h1>
              <p className="text-gray-500 mt-1">AI-powered review of your lease documents highlighting key terms and risks</p>
            </div>
            <RiskBadge score={review?.risk_score} />
          </div>
        </div>

        {!review && !reviewLoading && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="document-list">
              <h2 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                <FileText size={18} />Your Documents
              </h2>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
              ) : documents.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {documents.map(doc => (
                    <button key={doc.id} onClick={() => handleReviewDoc(doc.id)}
                      className="w-full p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                      data-testid={`doc-item-${doc.id}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#1A2F3A]">{doc.title || doc.template_type || 'Document'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {doc.source === 'esign' ? 'E-Signed' : 'Builder'} - {new Date(doc.created_at || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                        <Sparkles size={16} className="text-purple-500" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No documents found</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="manual-input">
              <h2 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
                <Upload size={18} />Paste Lease Text
              </h2>
              <p className="text-sm text-gray-500 mb-3">Don't have a digital copy? Paste the key terms from your lease for AI review.</p>
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Paste your lease terms here... Include rent amount, deposit, late fees, pet policy, move-in date, etc."
                className="w-full h-48 px-4 py-3 rounded-xl border border-gray-200 resize-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 text-sm"
                data-testid="manual-content-input"
              />
              <button onClick={handleManualReview} disabled={!manualContent.trim() || reviewLoading}
                className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="review-manual-btn">
                <Sparkles size={16} />Review with AI
              </button>
            </div>
          </div>
        )}

        {reviewLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <Loader2 size={40} className="animate-spin text-purple-600 mx-auto mb-4" />
            <p className="font-medium text-[#1A2F3A]">AI is analyzing your document...</p>
            <p className="text-sm text-gray-500 mt-1">Checking against BC Residential Tenancy Act</p>
          </div>
        )}

        {review && !reviewLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => { setReview(null); setComparison(null); setSelectedDoc(null); }}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800" data-testid="back-to-docs-btn">
                <ArrowLeft size={14} />Review Another Document
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-sm" data-testid="review-summary">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Shield size={24} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="font-semibold text-[#1A2F3A]">Document Review Summary</h2>
                    <RiskBadge score={review.risk_score} />
                  </div>
                  <p className="text-gray-600">{review.summary}</p>
                  {review.risk_explanation && (
                    <p className="text-sm text-gray-500 mt-2 italic">{review.risk_explanation}</p>
                  )}
                </div>
              </div>
            </div>

            {review.monthly_obligations && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="obligations-section">
                <button onClick={() => toggleSection('obligations')} className="w-full flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#1A2F3A] flex items-center gap-2"><DollarSign size={18} />Monthly Obligations</h3>
                  {expandedSections.obligations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.obligations && (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-blue-800">{review.monthly_obligations.rent}</p>
                      <p className="text-xs text-blue-600 mt-1">Monthly Rent</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl text-center">
                      <p className="text-lg font-bold text-orange-800">{review.monthly_obligations.late_fee}</p>
                      <p className="text-xs text-orange-600 mt-1">Late Fee</p>
                    </div>
                    {review.monthly_obligations.other_fees?.length > 0 && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">Other Fees</p>
                        {review.monthly_obligations.other_fees.map((fee, i) => (
                          <p key={i} className="text-sm text-gray-700">{fee}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {review.highlights?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="highlights-section">
                <button onClick={() => toggleSection('highlights')} className="w-full flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#1A2F3A] flex items-center gap-2"><Info size={18} />Key Highlights ({review.highlights.length})</h3>
                  {expandedSections.highlights ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.highlights && (
                  <div className="space-y-3">
                    {review.highlights.map((h, i) => (
                      <div key={i} className={`p-4 rounded-xl ${h.type === 'alert' ? 'bg-red-50 border border-red-200' : h.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="flex items-start gap-3">
                          {h.type === 'alert' ? <AlertTriangle size={18} className="text-red-500 mt-0.5" /> : h.type === 'warning' ? <AlertTriangle size={18} className="text-yellow-500 mt-0.5" /> : <Info size={18} className="text-blue-500 mt-0.5" />}
                          <div>
                            <p className="font-medium text-sm">{h.title}</p>
                            {h.clause && <p className="text-xs text-gray-600 mt-1 bg-white/60 p-2 rounded italic">"{h.clause}"</p>}
                            <p className="text-sm text-gray-700 mt-1">{h.explanation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {review.concerns?.length > 0 && (
              <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm" data-testid="concerns-section">
                <button onClick={() => toggleSection('concerns')} className="w-full flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-red-700 flex items-center gap-2"><AlertTriangle size={18} />Concerns ({review.concerns.length})</h3>
                  {expandedSections.concerns ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.concerns && (
                  <div className="space-y-3">
                    {review.concerns.map((c, i) => (
                      <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${c.severity === 'high' ? 'bg-red-200 text-red-800' : c.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-700'}`}>{c.severity}</span>
                          <div>
                            <p className="font-medium text-sm text-red-800">{c.issue}</p>
                            {c.legal_reference && <p className="text-xs text-gray-600 mt-1">Legal: {c.legal_reference}</p>}
                            {c.recommendation && <p className="text-xs text-green-700 mt-1 font-medium">Recommendation: {c.recommendation}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {review.tenant_checklist?.length > 0 && (
              <div className="bg-white rounded-2xl border border-green-100 p-6 shadow-sm" data-testid="checklist-section">
                <button onClick={() => toggleSection('checklist')} className="w-full flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-green-700 flex items-center gap-2"><CheckCircle size={18} />Tenant Checklist</h3>
                  {expandedSections.checklist ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.checklist && (
                  <div className="space-y-2">
                    {review.tenant_checklist.map((item, i) => (
                      <label key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100">
                        <input type="checkbox" className="mt-0.5 rounded border-green-300 text-green-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {comparison && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="comparison-section">
                <h3 className="font-semibold text-[#1A2F3A] flex items-center gap-2 mb-4"><Scale size={18} />BC Standards Comparison</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Deposit Analysis</p>
                    <p className="text-lg font-semibold mt-1">${comparison.deposit_analysis?.amount}</p>
                    <p className="text-xs text-gray-500">Max allowed: ${comparison.deposit_analysis?.max_allowed}</p>
                    <p className={`text-xs mt-1 font-medium ${comparison.deposit_analysis?.compliant ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.deposit_analysis?.compliant ? 'Compliant' : 'Exceeds BC RTA limit!'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{comparison.deposit_analysis?.note}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Rent Analysis</p>
                    <p className="text-lg font-semibold mt-1">${comparison.rent_analysis?.amount}/mo</p>
                    <p className="text-xs text-gray-500">{comparison.rent_analysis?.market_comparison}</p>
                  </div>
                  <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-700 mb-2">BC RTA Compliance</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {comparison.bc_rta_compliance && Object.entries(comparison.bc_rta_compliance).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          {v ? <CheckCircle size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                          <span className="text-xs text-gray-600">{k.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
