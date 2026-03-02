import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, Send, Check, Clock, Download, 
  Trash2, Eye, PenTool, Users, AlertCircle, Plus,
  ChevronRight, Calendar, Mail, Building, User
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// BC Government Rental Forms
const BC_FORMS = [
  {
    id: 'rtb-1',
    name: 'RTB-1: Residential Tenancy Agreement',
    description: 'Standard BC rental agreement form',
    category: 'agreement'
  },
  {
    id: 'rtb-7',
    name: 'RTB-7: Notice to End Tenancy (Landlord)',
    description: 'For ending tenancy by landlord',
    category: 'notice'
  },
  {
    id: 'rtb-26',
    name: 'RTB-26: Condition Inspection Report',
    description: 'Move-in/move-out property condition',
    category: 'inspection'
  },
  {
    id: 'rtb-30',
    name: 'RTB-30: Notice of Rent Increase',
    description: 'Official rent increase notice',
    category: 'notice'
  }
];

export default function ESign() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // New document form state
  const [newDoc, setNewDoc] = useState({
    title: '',
    form_type: '',
    recipient_email: '',
    recipient_name: '',
    property_address: '',
    notes: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDocuments();
  }, [user, navigate]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/api/esign/documents?user_id=${user.id}`);
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Demo data
      setDocuments([
        {
          id: '1',
          title: 'Lease Agreement - 123 Main St',
          form_type: 'rtb-1',
          status: 'pending',
          created_at: '2026-02-28',
          recipient_name: 'John Tenant',
          recipient_email: 'john@email.com',
          property_address: '123 Main St, Vancouver'
        },
        {
          id: '2',
          title: 'Move-in Inspection - 456 Oak Ave',
          form_type: 'rtb-26',
          status: 'signed',
          created_at: '2026-02-25',
          signed_at: '2026-02-26',
          recipient_name: 'Jane Renter',
          recipient_email: 'jane@email.com',
          property_address: '456 Oak Ave, Burnaby'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      const response = await axios.post(`${API}/api/esign/documents`, {
        ...newDoc,
        creator_id: user.id,
        creator_name: user.name,
        creator_email: user.email
      });
      setDocuments(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setNewDoc({
        title: '',
        form_type: '',
        recipient_email: '',
        recipient_name: '',
        property_address: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleSign = async (docId, signature) => {
    try {
      await axios.post(`${API}/api/esign/documents/${docId}/sign`, {
        signature_data: signature,
        signer_id: user.id,
        signer_name: user.name
      });
      setDocuments(prev => prev.map(d => 
        d.id === docId ? { ...d, status: 'signed', signed_at: new Date().toISOString() } : d
      ));
      setShowSignModal(false);
      setSelectedDoc(null);
    } catch (error) {
      console.error('Error signing document:', error);
    }
  };

  const handleSendReminder = async (docId) => {
    try {
      await axios.post(`${API}/api/esign/documents/${docId}/remind`);
      alert('Reminder sent successfully!');
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: FileText, label: 'Draft' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Awaiting Signature' },
      signed: { color: 'bg-green-100 text-green-700', icon: Check, label: 'Signed' },
      expired: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Expired' }
    };
    return badges[status] || badges.draft;
  };

  const pendingDocs = documents.filter(d => d.status === 'pending');
  const signedDocs = documents.filter(d => d.status === 'signed');

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                <PenTool className="text-[#1A2F3A]" />
                E-Sign Documents
              </h1>
              <p className="text-gray-600 mt-2">
                Create, send, and sign rental documents digitally
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#1A2F3A] text-white rounded-lg font-medium hover:bg-[#2C4A52] transition-colors flex items-center gap-2"
              data-testid="create-document-btn"
            >
              <Plus size={18} /> New Document
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#1A2F3A]">{documents.length}</p>
                  <p className="text-sm text-gray-500">Total Documents</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#1A2F3A]">{pendingDocs.length}</p>
                  <p className="text-sm text-gray-500">Awaiting Signature</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#1A2F3A]">{signedDocs.length}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'documents', label: 'All Documents' },
              { id: 'pending', label: 'Pending' },
              { id: 'templates', label: 'BC Forms' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[#1A2F3A] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'templates' ? (
            <div className="grid md:grid-cols-2 gap-4">
              {BC_FORMS.map(form => (
                <div 
                  key={form.id}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setNewDoc(prev => ({ ...prev, form_type: form.id, title: form.name }));
                    setShowCreateModal(true);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#1A2F3A]/10 flex items-center justify-center">
                      <FileText size={24} className="text-[#1A2F3A]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1A2F3A]">{form.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{form.description}</p>
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 capitalize">
                        {form.category}
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2F3A] mx-auto"></div>
                </div>
              ) : (activeTab === 'pending' ? pendingDocs : documents).length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Documents Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first document to get started
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-[#1A2F3A] text-white rounded-lg font-medium"
                  >
                    Create Document
                  </button>
                </div>
              ) : (
                (activeTab === 'pending' ? pendingDocs : documents).map((doc, index) => {
                  const badge = getStatusBadge(doc.status);
                  return (
                    <div 
                      key={doc.id}
                      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      data-testid={`document-card-${index}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#1A2F3A]/10 flex items-center justify-center flex-shrink-0">
                          <FileText size={24} className="text-[#1A2F3A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-[#1A2F3A] truncate">{doc.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
                              <badge.icon size={12} />
                              {badge.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p className="flex items-center gap-2">
                              <Building size={14} /> {doc.property_address}
                            </p>
                            <p className="flex items-center gap-2">
                              <User size={14} /> {doc.recipient_name} ({doc.recipient_email})
                            </p>
                            <p className="flex items-center gap-2">
                              <Calendar size={14} /> Created: {new Date(doc.created_at).toLocaleDateString()}
                              {doc.signed_at && ` • Signed: ${new Date(doc.signed_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {doc.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setShowSignModal(true);
                                }}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                              >
                                <PenTool size={14} /> Sign
                              </button>
                              <button
                                onClick={() => handleSendReminder(doc.id)}
                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"
                              >
                                <Mail size={14} /> Remind
                              </button>
                            </>
                          )}
                          {doc.status === 'signed' && (
                            <button
                              className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200 flex items-center gap-1"
                            >
                              <Download size={14} /> Download
                            </button>
                          )}
                          <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Create Document Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Create New Document
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Document Type</label>
                  <select
                    value={newDoc.form_type}
                    onChange={(e) => setNewDoc(prev => ({ ...prev, form_type: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                  >
                    <option value="">Select a form type</option>
                    {BC_FORMS.map(form => (
                      <option key={form.id} value={form.id}>{form.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-1">Document Title</label>
                  <input
                    type="text"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Lease Agreement - 123 Main St"
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-1">Property Address</label>
                  <input
                    type="text"
                    value={newDoc.property_address}
                    onChange={(e) => setNewDoc(prev => ({ ...prev, property_address: e.target.value }))}
                    placeholder="123 Main St, Vancouver, BC"
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={newDoc.recipient_name}
                      onChange={(e) => setNewDoc(prev => ({ ...prev, recipient_name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Recipient Email</label>
                    <input
                      type="email"
                      value={newDoc.recipient_email}
                      onChange={(e) => setNewDoc(prev => ({ ...prev, recipient_email: e.target.value }))}
                      placeholder="john@email.com"
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-1">Notes (Optional)</label>
                  <textarea
                    value={newDoc.notes}
                    onChange={(e) => setNewDoc(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes for the recipient..."
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDocument}
                  disabled={!newDoc.title || !newDoc.recipient_email}
                  className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={16} /> Send for Signature
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sign Modal */}
        {showSignModal && selectedDoc && (
          <SignatureModal
            document={selectedDoc}
            onClose={() => {
              setShowSignModal(false);
              setSelectedDoc(null);
            }}
            onSign={(signature) => handleSign(selectedDoc.id, signature)}
          />
        )}
      </div>
    </MainLayout>
  );
}

// Signature Modal Component
function SignatureModal({ document, onClose, onSign }) {
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-[#1A2F3A]">Sign Document</h2>
          <p className="text-sm text-gray-500 mt-1">{document.title}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              By signing this document, you agree to the terms and conditions contained within. 
              This digital signature is legally binding under BC law.
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Type your full legal name to sign</label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Your Full Name"
              className="w-full px-4 py-3 border-2 border-dashed rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none text-center text-xl"
              style={{ fontFamily: 'cursive' }}
            />
            {signature && (
              <div className="mt-4 p-4 border rounded-lg bg-white">
                <p className="text-xs text-gray-400 mb-1">Signature Preview:</p>
                <p className="text-2xl text-[#1A2F3A]" style={{ fontFamily: 'cursive' }}>{signature}</p>
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-gray-600">
              I understand that this is a legally binding electronic signature and I agree to the terms of this document.
            </span>
          </label>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSign(signature)}
            disabled={!signature || !agreed}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <PenTool size={16} /> Sign Document
          </button>
        </div>
      </div>
    </div>
  );
}
