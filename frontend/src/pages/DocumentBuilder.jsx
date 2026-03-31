import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Download, Send, Save, Eye, Edit, 
  ChevronLeft, ChevronRight, Plus, Trash2, User, 
  Home, Calendar, DollarSign, Check, Loader2, Printer,
  Sparkles, Bot, Lightbulb, X
} from 'lucide-react';
import { useAuth } from '../App';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// BC Residential Tenancy Agreement (RTB-1) Form Template
const RTB1_TEMPLATE = {
  id: 'rtb-1',
  name: 'Residential Tenancy Agreement (RTB-1)',
  description: 'Standard BC residential tenancy agreement',
  sections: [
    {
      title: 'Parties',
      fields: [
        { id: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
        { id: 'landlord_address', label: 'Landlord Address', type: 'text', required: true },
        { id: 'landlord_phone', label: 'Landlord Phone', type: 'tel' },
        { id: 'landlord_email', label: 'Landlord Email', type: 'email' },
        { id: 'tenant_name', label: 'Tenant Name(s)', type: 'text', required: true },
        { id: 'tenant_phone', label: 'Tenant Phone', type: 'tel' },
        { id: 'tenant_email', label: 'Tenant Email', type: 'email', required: true },
      ]
    },
    {
      title: 'Rental Property',
      fields: [
        { id: 'property_address', label: 'Property Address', type: 'text', required: true },
        { id: 'property_city', label: 'City', type: 'text', required: true },
        { id: 'property_postal', label: 'Postal Code', type: 'text', required: true },
        { id: 'property_type', label: 'Type of Unit', type: 'select', options: ['Apartment', 'House', 'Condo', 'Townhouse', 'Suite', 'Room', 'Other'], required: true },
        { id: 'num_bedrooms', label: 'Number of Bedrooms', type: 'number', required: true },
        { id: 'parking_included', label: 'Parking Included', type: 'checkbox' },
        { id: 'storage_included', label: 'Storage Included', type: 'checkbox' },
      ]
    },
    {
      title: 'Tenancy Terms',
      fields: [
        { id: 'tenancy_type', label: 'Tenancy Type', type: 'select', options: ['Month-to-Month', 'Fixed Term'], required: true },
        { id: 'start_date', label: 'Tenancy Start Date', type: 'date', required: true },
        { id: 'end_date', label: 'Fixed Term End Date', type: 'date' },
        { id: 'monthly_rent', label: 'Monthly Rent ($)', type: 'number', required: true },
        { id: 'rent_due_day', label: 'Rent Due Day of Month', type: 'number', min: 1, max: 31, required: true },
        { id: 'payment_method', label: 'Payment Method', type: 'select', options: ['E-Transfer', 'Cheque', 'Post-Dated Cheques', 'Direct Deposit', 'Cash'] },
      ]
    },
    {
      title: 'Security Deposit',
      fields: [
        { id: 'security_deposit', label: 'Security Deposit Amount ($)', type: 'number', required: true },
        { id: 'pet_deposit', label: 'Pet Damage Deposit ($)', type: 'number' },
        { id: 'deposit_date', label: 'Deposit Paid Date', type: 'date' },
      ]
    },
    {
      title: 'Utilities & Services',
      fields: [
        { id: 'hydro_included', label: 'Electricity (BC Hydro) Included', type: 'checkbox' },
        { id: 'gas_included', label: 'Gas (FortisBC) Included', type: 'checkbox' },
        { id: 'water_included', label: 'Water/Sewer Included', type: 'checkbox' },
        { id: 'internet_included', label: 'Internet Included', type: 'checkbox' },
        { id: 'laundry_included', label: 'Laundry Included', type: 'checkbox' },
      ]
    },
    {
      title: 'Pet Policy',
      fields: [
        { id: 'pets_allowed', label: 'Pets Allowed', type: 'checkbox' },
        { id: 'pet_restrictions', label: 'Pet Restrictions (if any)', type: 'textarea' },
      ]
    },
    {
      title: 'Additional Terms',
      fields: [
        { id: 'smoking_policy', label: 'Smoking Policy', type: 'select', options: ['No Smoking', 'Outdoor Only', 'Designated Areas Only'] },
        { id: 'additional_terms', label: 'Additional Terms & Conditions', type: 'textarea' },
        { id: 'move_in_inspection', label: 'Move-in Inspection Scheduled', type: 'date' },
      ]
    }
  ]
};

// More templates
const TEMPLATES = [
  RTB1_TEMPLATE,
  {
    id: 'rtb-7',
    name: 'Notice to End Tenancy (RTB-7)',
    description: 'Landlord notice to end tenancy',
    sections: [
      {
        title: 'Tenant Information',
        fields: [
          { id: 'tenant_name', label: 'Tenant Name(s)', type: 'text', required: true },
          { id: 'property_address', label: 'Rental Property Address', type: 'text', required: true },
        ]
      },
      {
        title: 'Notice Details',
        fields: [
          { id: 'end_date', label: 'Tenancy End Date', type: 'date', required: true },
          { id: 'reason', label: 'Reason for Ending Tenancy', type: 'select', options: [
            'Non-payment of rent',
            'Cause (breach of agreement)',
            'Landlord use of property',
            'Demolition/renovation',
            'End of employment',
            'Conversion to strata',
            'Other'
          ], required: true },
          { id: 'details', label: 'Additional Details', type: 'textarea' },
        ]
      }
    ]
  },
  {
    id: 'rtb-26',
    name: 'Condition Inspection Report (RTB-26)',
    description: 'Move-in/move-out property condition documentation',
    sections: [
      {
        title: 'Property Information',
        fields: [
          { id: 'property_address', label: 'Property Address', type: 'text', required: true },
          { id: 'inspection_type', label: 'Inspection Type', type: 'select', options: ['Move-In', 'Move-Out'], required: true },
          { id: 'inspection_date', label: 'Inspection Date', type: 'date', required: true },
        ]
      },
      {
        title: 'Room Conditions',
        fields: [
          { id: 'living_room', label: 'Living Room Condition', type: 'textarea' },
          { id: 'kitchen', label: 'Kitchen Condition', type: 'textarea' },
          { id: 'bathroom', label: 'Bathroom Condition', type: 'textarea' },
          { id: 'bedroom1', label: 'Bedroom 1 Condition', type: 'textarea' },
          { id: 'bedroom2', label: 'Bedroom 2 Condition', type: 'textarea' },
          { id: 'other_areas', label: 'Other Areas', type: 'textarea' },
        ]
      }
    ]
  },
  {
    id: 'rtb-30',
    name: 'Notice of Rent Increase (RTB-30)',
    description: 'Official rent increase notification',
    sections: [
      {
        title: 'Tenant & Property',
        fields: [
          { id: 'tenant_name', label: 'Tenant Name(s)', type: 'text', required: true },
          { id: 'property_address', label: 'Property Address', type: 'text', required: true },
        ]
      },
      {
        title: 'Rent Increase Details',
        fields: [
          { id: 'current_rent', label: 'Current Monthly Rent ($)', type: 'number', required: true },
          { id: 'new_rent', label: 'New Monthly Rent ($)', type: 'number', required: true },
          { id: 'effective_date', label: 'Effective Date', type: 'date', required: true },
          { id: 'increase_percent', label: 'Increase Percentage', type: 'text', readonly: true },
        ]
      }
    ]
  }
];

function FormField({ field, value, onChange }) {
  const baseInputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A] transition-colors";
  
  switch (field.type) {
    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={baseInputClass}
          required={field.required}
        >
          <option value="">Select...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={`${baseInputClass} min-h-[80px]`}
          required={field.required}
          placeholder={field.placeholder}
        />
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(field.id, e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-[#1A2F3A] focus:ring-[#1A2F3A]"
          />
          <span className="text-gray-600">Yes</span>
        </label>
      );
    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={baseInputClass}
          required={field.required}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={baseInputClass}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.step || 1}
        />
      );
    default:
      return (
        <input
          type={field.type || 'text'}
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={baseInputClass}
          required={field.required}
          placeholder={field.placeholder}
          readOnly={field.readonly}
        />
      );
  }
}

export default function DocumentBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('select'); // 'select', 'fill', 'preview', 'send'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [savedDocId, setSavedDocId] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompts, setAiPrompts] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Pre-fill landlord info if available
  useEffect(() => {
    if (user && selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        landlord_name: user.name || '',
        landlord_email: user.email || '',
      }));
    }
  }, [user, selectedTemplate]);

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Auto-calculate rent increase percentage
    if (fieldId === 'current_rent' || fieldId === 'new_rent') {
      const current = parseFloat(fieldId === 'current_rent' ? value : formData.current_rent) || 0;
      const newRent = parseFloat(fieldId === 'new_rent' ? value : formData.new_rent) || 0;
      if (current > 0 && newRent > 0) {
        const increase = ((newRent - current) / current * 100).toFixed(1);
        setFormData(prev => ({ ...prev, increase_percent: `${increase}%` }));
      }
    }
  };

  const fetchAIPrompts = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/api/document-builder/ai-prompts?landlord_id=${user.id}`);
      setAiPrompts(res.data);
    } catch (error) {
      console.error('Error fetching AI prompts:', error);
    } finally { setAiLoading(false); }
  };

  const fetchAIReview = async () => {
    setAiLoading(true);
    try {
      const contentStr = Object.entries(formData).map(([k, v]) => `${k}: ${v}`).join('\n');
      const res = await axios.post(`${API}/api/document-builder/ai-review`, null, {
        params: { content: contentStr, document_type: selectedTemplate?.id || 'lease' }
      });
      setAiReview(res.data);
    } catch (error) {
      console.error('Error getting AI review:', error);
    } finally { setAiLoading(false); }
  };

  const handleSaveDocument = async () => {
    setSaving(true);
    try {
      const docData = {
        user_id: user.id,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        form_data: formData,
        status: 'draft',
        created_at: new Date().toISOString()
      };
      
      const response = await axios.post(`${API}/api/document-builder/save`, docData);
      setSavedDocId(response.data.id);
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save document');
    }
    setSaving(false);
  };

  const handleSendForSignature = async () => {
    if (!recipientEmail) {
      alert('Please enter recipient email');
      return;
    }
    
    setSending(true);
    try {
      const response = await axios.post(`${API}/api/document-builder/send`, {
        user_id: user.id,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        form_data: formData,
        recipient_email: recipientEmail,
        sender_name: user.name,
        sender_email: user.email
      });
      
      alert('Document sent for signature!');
      navigate('/esign');
    } catch (error) {
      console.error('Send error:', error);
      alert('Failed to send document');
    }
    setSending(false);
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.post(`${API}/api/document-builder/pdf`, {
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        form_data: formData
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTemplate.name.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate PDF');
    }
  };

  const calculateProgress = () => {
    if (!selectedTemplate) return 0;
    const allFields = selectedTemplate.sections.flatMap(s => s.fields);
    const requiredFields = allFields.filter(f => f.required);
    const filledRequired = requiredFields.filter(f => formData[f.id]);
    return Math.round((filledRequired.length / requiredFields.length) * 100);
  };

  // Template Selection Step
  if (step === 'select') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6" data-testid="document-builder-page">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }} data-testid="document-builder-title">
              <FileText />
              Document Builder
            </h1>
            <p className="text-gray-600 mt-1" data-testid="document-builder-subtitle">Create and fill official BC tenancy documents</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4" data-testid="templates-grid">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setStep('fill');
                  setCurrentSection(0);
                  setFormData({});
                }}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all text-left group"
                data-testid={`template-${template.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center group-hover:bg-[#1A2F3A] transition-colors">
                    <FileText className="text-[#1A2F3A] group-hover:text-white transition-colors" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A2F3A] mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.description}</p>
                    <p className="text-xs text-gray-400 mt-2">{template.sections.length} sections</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Form Filling Step
  if (step === 'fill') {
    const section = selectedTemplate.sections[currentSection];
    const progress = calculateProgress();
    
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6" data-testid="document-fill-page">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => currentSection === 0 ? setStep('select') : setCurrentSection(c => c - 1)}
                className="flex items-center gap-2 text-gray-600 hover:text-[#1A2F3A] mb-2"
                data-testid="back-button"
              >
                <ChevronLeft size={18} />
                {currentSection === 0 ? 'Back to Templates' : 'Previous Section'}
              </button>
              <h1 className="text-xl font-semibold text-[#1A2F3A]" data-testid="selected-template-name">{selectedTemplate.name}</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1" data-testid="section-progress">Section {currentSection + 1} of {selectedTemplate.sections.length}</p>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1A2F3A] transition-all duration-300"
                  style={{ width: `${((currentSection + 1) / selectedTemplate.sections.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="form-section">
            <h2 className="text-lg font-semibold text-[#1A2F3A] mb-6 flex items-center gap-2" data-testid="section-title">
              {section.title}
            </h2>
            
            <div className="space-y-4">
              {section.fields.map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <FormField
                    field={field}
                    value={formData[field.id]}
                    onChange={handleFieldChange}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSaveDocument}
              disabled={saving}
              className="px-4 py-2 text-gray-600 hover:text-[#1A2F3A] flex items-center gap-2"
              data-testid="save-draft-button"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Draft
            </button>
            
            <div className="flex items-center gap-3">
              {currentSection < selectedTemplate.sections.length - 1 ? (
                <button
                  onClick={() => setCurrentSection(c => c + 1)}
                  className="px-6 py-2.5 bg-[#1A2F3A] text-white rounded-lg font-medium hover:bg-[#2C4A52] flex items-center gap-2"
                  data-testid="next-section-button"
                >
                  Next Section
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setStep('preview')}
                  className="px-6 py-2.5 bg-[#1A2F3A] text-white rounded-lg font-medium hover:bg-[#2C4A52] flex items-center gap-2"
                  data-testid="preview-button"
                >
                  <Eye size={16} />
                  Preview Document
                </button>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Form Completion</span>
              <span className="text-sm font-medium text-[#1A2F3A]">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* AI Assistant Toggle */}
          <button
            onClick={() => { setShowAIPanel(!showAIPanel); if (!aiPrompts) fetchAIPrompts(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all"
            data-testid="ai-assistant-toggle"
          >
            <Sparkles size={18} />
            {showAIPanel ? 'Hide' : 'Show'} AI Assistant
          </button>

          {/* AI Assistant Panel */}
          {showAIPanel && (
            <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden" data-testid="ai-assistant-panel">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-purple-600" />
                  <h3 className="font-semibold text-purple-900">AI Lease Assistant</h3>
                </div>
                <p className="text-sm text-purple-600 mt-1">BC Residential Tenancy Act guidance</p>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {aiLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-purple-600" />
                  </div>
                ) : aiPrompts ? (
                  <>
                    {aiPrompts.required_clauses?.map((clause, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl space-y-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-sm text-[#1A2F3A]">{clause.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{clause.description}</p>
                          </div>
                        </div>
                        {clause.legal_note && (
                          <div className="ml-6 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                              <strong>Legal:</strong> {clause.legal_note}
                            </p>
                          </div>
                        )}
                        {clause.ai_suggestion && (
                          <p className="ml-6 text-xs text-purple-700 italic">{clause.ai_suggestion}</p>
                        )}
                        {clause.options && (
                          <div className="ml-6 flex flex-wrap gap-2">
                            {clause.options.map((opt, oi) => (
                              <button key={oi} type="button" onClick={() => {
                                if (clause.title.includes('Late')) {
                                  handleFieldChange('late_fee_type', opt.type || 'flat');
                                  handleFieldChange('late_fee_amount', opt.amount?.toString() || '');
                                }
                              }} className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200">
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {aiPrompts.ai_tips?.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <h4 className="font-medium text-sm text-blue-900 mb-2">Quick Tips</h4>
                        <ul className="space-y-1">
                          {aiPrompts.ai_tips.map((tip, i) => (
                            <li key={i} className="text-xs text-blue-700 flex items-start gap-2">
                              <Check size={12} className="mt-0.5 flex-shrink-0" />{tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Click to load AI suggestions</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Preview & Send Step
  if (step === 'preview') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6" data-testid="document-preview-page">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => setStep('fill')}
                className="flex items-center gap-2 text-gray-600 hover:text-[#1A2F3A] mb-2"
                data-testid="back-to-edit-button"
              >
                <ChevronLeft size={18} />
                Back to Edit
              </button>
              <h1 className="text-xl font-semibold text-[#1A2F3A]" data-testid="review-title">Review Document</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                data-testid="download-pdf-button"
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                data-testid="print-button"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>

          {/* Document Preview */}
          <div ref={printRef} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#1A2F3A] text-white p-6">
              <h2 className="text-xl font-semibold">{selectedTemplate.name}</h2>
              <p className="text-white/70 text-sm mt-1">Province of British Columbia</p>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedTemplate.sections.map((section, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-6 last:border-0">
                  <h3 className="font-semibold text-[#1A2F3A] mb-4">{section.title}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.fields.map(field => (
                      <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">{field.label}</p>
                        <p className="font-medium text-[#1A2F3A] mt-0.5">
                          {field.type === 'checkbox' 
                            ? (formData[field.id] ? 'Yes' : 'No')
                            : formData[field.id] || '—'
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Send for Signature */}
          <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="send-signature-section">
            <h3 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
              <Send size={18} />
              Send for Signature
            </h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="tenant@email.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20 focus:border-[#1A2F3A]"
                  data-testid="recipient-email-input"
                />
              </div>
              <button
                onClick={handleSendForSignature}
                disabled={sending || !recipientEmail}
                className="px-6 py-2.5 bg-[#1A2F3A] text-white rounded-lg font-medium hover:bg-[#2C4A52] disabled:opacity-50 flex items-center gap-2"
                data-testid="send-document-button"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send Document
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              The recipient will receive an email with a link to review and sign the document.
            </p>
          </div>

          {/* AI Review Button */}
          <button
            onClick={fetchAIReview}
            disabled={aiLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700"
            data-testid="ai-review-btn"
          >
            {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            AI Review Document
          </button>

          {aiReview && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-200" data-testid="ai-review-panel">
              <div className="flex items-center gap-2 mb-4">
                <Bot size={20} className="text-purple-600" />
                <h3 className="font-semibold text-purple-900">AI Document Review</h3>
              </div>
              {aiReview.summary && (
                <p className="text-sm text-gray-700 mb-4 p-3 bg-purple-50 rounded-lg">{aiReview.summary}</p>
              )}
              {aiReview.highlights?.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-[#1A2F3A]">Key Highlights</h4>
                  {aiReview.highlights.map((h, i) => (
                    <div key={i} className={`p-2 rounded-lg text-xs ${h.type === 'alert' ? 'bg-red-50 text-red-800' : h.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-blue-50 text-blue-800'}`}>
                      <p className="font-medium">{h.clause}</p>
                      <p className="mt-1 opacity-80">{h.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
              {aiReview.concerns?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-700">Concerns</h4>
                  {aiReview.concerns.map((c, i) => (
                    <div key={i} className="p-2 bg-red-50 rounded-lg text-xs text-red-800">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mr-2 ${c.severity === 'high' ? 'bg-red-200' : c.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-700'}`}>{c.severity}</span>
                      {c.issue}
                      {c.recommendation && <p className="mt-1 text-red-600">Recommendation: {c.recommendation}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
