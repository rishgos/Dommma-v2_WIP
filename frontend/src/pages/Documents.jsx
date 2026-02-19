import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, Download, Trash2, ArrowLeft, Search, 
  Filter, Check, Clock, AlertCircle, Eye, Edit, X, FolderOpen
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const documentTypes = [
  { id: 'lease', label: 'Lease Agreement', color: 'bg-blue-100 text-blue-700' },
  { id: 'application', label: 'Application', color: 'bg-green-100 text-green-700' },
  { id: 'receipt', label: 'Receipt', color: 'bg-purple-100 text-purple-700' },
  { id: 'id', label: 'ID Document', color: 'bg-orange-100 text-orange-700' },
  { id: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'other',
    file: null
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
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedType) params.append('doc_type', selectedType);
      
      const response = await axios.get(`${API}/documents/${user.id}?${params.toString()}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file: file,
        name: uploadForm.name || file.name.replace(/\.[^/.]+$/, '')
      });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);

      const response = await axios.post(
        `${API}/documents/upload?user_id=${user.id}&name=${encodeURIComponent(uploadForm.name)}&doc_type=${uploadForm.type}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setShowUploadModal(false);
      setUploadForm({ name: '', type: 'other', file: null });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await axios.delete(`${API}/documents/${docId}`);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document.');
    }
  };

  const handleSign = async (docId) => {
    try {
      await axios.post(`${API}/documents/sign/${docId}?user_id=${user.id}`);
      fetchDocuments();
      setSelectedDoc(null);
    } catch (error) {
      console.error('Error signing document:', error);
      alert('Failed to sign document.');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(`${API}/documents/download/${doc.id}`);
      if (response.data.content) {
        // Decode base64 and download
        const link = document.createElement('a');
        link.href = `data:application/octet-stream;base64,${response.data.content}`;
        link.download = doc.name;
        link.click();
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document.');
    }
  };

  const getTypeConfig = (type) => {
    return documentTypes.find(t => t.id === type) || documentTypes[4];
  };

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedType || doc.type === selectedType)
  );

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
              <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Documents</h1>
              <p className="text-sm text-white/70">Manage your documents and agreements</p>
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
            data-testid="upload-document-btn"
          >
            <Upload size={16} />
            Upload Document
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none"
              data-testid="search-documents-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none text-sm"
              data-testid="filter-type-select"
            >
              <option value="">All Types</option>
              {documentTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Document Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-[#1A2F3A]">{documents.length}</p>
            <p className="text-sm text-gray-500">Total Documents</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-green-600">{documents.filter(d => d.signed).length}</p>
            <p className="text-sm text-gray-500">Signed</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-yellow-600">{documents.filter(d => !d.signed && d.type === 'lease').length}</p>
            <p className="text-sm text-gray-500">Pending Signature</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-blue-600">{documents.filter(d => d.type === 'lease').length}</p>
            <p className="text-sm text-gray-500">Lease Agreements</p>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <FolderOpen className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Documents Found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedType 
                ? 'Try adjusting your search or filters'
                : 'Upload your first document to get started'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-[#1A2F3A] text-white rounded-full hover:bg-[#2C4A52] transition-colors"
            >
              Upload Document
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => {
              const typeConfig = getTypeConfig(doc.type);
              return (
                <div 
                  key={doc.id}
                  className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedDoc(doc)}
                  data-testid={`document-card-${doc.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center">
                      <FileText size={24} className="text-[#1A2F3A]" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-[#1A2F3A] mb-1 truncate">{doc.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {new Date(doc.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>

                  <div className="flex items-center justify-between">
                    {doc.signed ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check size={14} />
                        Signed
                      </span>
                    ) : doc.type === 'lease' ? (
                      <span className="flex items-center gap-1 text-yellow-600 text-sm">
                        <Clock size={14} />
                        Pending
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Download"
                      >
                        <Download size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        className="p-2 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="upload-modal">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-8">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>

            <h2 
              className="text-2xl font-semibold text-[#1A2F3A] mb-6"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Upload Document
            </h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              {/* File Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#1A2F3A]/30 transition-colors cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  data-testid="file-input"
                />
                {uploadForm.file ? (
                  <div>
                    <FileText className="mx-auto mb-2 text-[#1A2F3A]" size={32} />
                    <p className="font-medium text-[#1A2F3A]">{uploadForm.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-gray-500">Click to select a file</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG</p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Document Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none"
                  placeholder="e.g., Lease Agreement 2025"
                  required
                  data-testid="document-name-input"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Document Type</label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({...uploadForm, type: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  data-testid="document-type-select"
                >
                  {documentTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!uploadForm.file || uploading}
                className="w-full px-4 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="submit-upload-btn"
              >
                {uploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload Document
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="document-preview-modal">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedDoc(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#1A2F3A]/10 flex items-center justify-center">
                <FileText size={32} className="text-[#1A2F3A]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {selectedDoc.name}
                </h2>
                <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${getTypeConfig(selectedDoc.type).color}`}>
                  {getTypeConfig(selectedDoc.type).label}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Uploaded</span>
                <span className="text-[#1A2F3A]">
                  {new Date(selectedDoc.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                <span className={selectedDoc.signed ? 'text-green-600' : 'text-yellow-600'}>
                  {selectedDoc.signed ? 'Signed' : 'Pending'}
                </span>
              </div>
              {selectedDoc.signed && selectedDoc.signed_at && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Signed On</span>
                  <span className="text-[#1A2F3A]">
                    {new Date(selectedDoc.signed_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDownload(selectedDoc)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-[#1A2F3A] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
              {!selectedDoc.signed && selectedDoc.type === 'lease' && (
                <button
                  onClick={() => handleSign(selectedDoc.id)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52] transition-colors flex items-center justify-center gap-2"
                  data-testid="sign-document-btn"
                >
                  <Edit size={16} />
                  Sign Document
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
