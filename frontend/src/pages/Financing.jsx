import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DollarSign, Calculator, Home, TrendingUp, Shield, 
  CheckCircle, Clock, FileText, ArrowRight, Percent,
  Building, Key, Wallet, PiggyBank, CreditCard, HelpCircle,
  ChevronRight, Star, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Financing Options
const FINANCING_OPTIONS = [
  {
    id: 'rent-to-own',
    title: 'Rent-to-Own',
    icon: Key,
    description: 'Build equity while renting with an option to purchase',
    features: [
      'Portion of rent goes toward down payment',
      'Lock in purchase price today',
      'Build credit while renting',
      'Flexible timeline (2-5 years)'
    ],
    color: 'blue',
    eligibility: ['Credit score 550+', '12 months employment', '3 months rent saved']
  },
  {
    id: 'deposit-financing',
    title: 'Deposit Financing',
    icon: PiggyBank,
    description: 'Spread your deposit over monthly payments',
    features: [
      'Pay deposit in 3-6 monthly installments',
      'No credit impact',
      'Move in with less upfront',
      '0% interest option available'
    ],
    color: 'green',
    eligibility: ['Valid ID', 'Proof of income', 'First month rent']
  },
  {
    id: 'first-month-free',
    title: 'First Month Free',
    icon: Wallet,
    description: 'Qualifying properties with first month waived',
    features: [
      'No rent for first month',
      'Landlord-sponsored program',
      'Limited availability',
      'Standard lease terms apply'
    ],
    color: 'purple',
    eligibility: ['Credit check required', 'Income verification', 'Background check']
  }
];

// Calculator Component
function FinancingCalculator() {
  const [calc, setCalc] = useState({
    monthlyRent: 2500,
    depositAmount: 2500,
    rentToOwnYears: 3,
    depositInstallments: 6
  });
  
  const [results, setResults] = useState(null);
  
  const calculate = () => {
    // Rent-to-Own calculation (assuming 20% of rent goes to equity)
    const equityPerMonth = calc.monthlyRent * 0.20;
    const totalEquity = equityPerMonth * calc.rentToOwnYears * 12;
    
    // Deposit financing
    const depositMonthly = calc.depositAmount / calc.depositInstallments;
    
    setResults({
      rentToOwn: {
        equityPerMonth,
        totalEquity,
        estimatedDownPayment: totalEquity
      },
      depositFinancing: {
        monthlyPayment: depositMonthly,
        totalMonths: calc.depositInstallments,
        moveInCost: calc.monthlyRent + depositMonthly
      }
    });
  };
  
  useEffect(() => {
    calculate();
  }, [calc]);
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#1A2F3A] mb-6 flex items-center gap-2">
        <Calculator size={20} />
        Financing Calculator
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Monthly Rent</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={calc.monthlyRent}
                onChange={(e) => setCalc({ ...calc, monthlyRent: parseInt(e.target.value) || 0 })}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Security Deposit</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={calc.depositAmount}
                onChange={(e) => setCalc({ ...calc, depositAmount: parseInt(e.target.value) || 0 })}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Rent-to-Own Duration (Years)</label>
            <select
              value={calc.rentToOwnYears}
              onChange={(e) => setCalc({ ...calc, rentToOwnYears: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
            >
              <option value={2}>2 Years</option>
              <option value={3}>3 Years</option>
              <option value={4}>4 Years</option>
              <option value={5}>5 Years</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Deposit Installments</label>
            <select
              value={calc.depositInstallments}
              onChange={(e) => setCalc({ ...calc, depositInstallments: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
            >
              <option value={3}>3 Months</option>
              <option value={4}>4 Months</option>
              <option value={6}>6 Months</option>
            </select>
          </div>
        </div>
        
        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 mb-2">Rent-to-Own Projection</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Equity per month:</span>
                  <span className="font-semibold text-blue-900">${results.rentToOwn.equityPerMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Total equity in {calc.rentToOwnYears} years:</span>
                  <span className="font-semibold text-blue-900">${results.rentToOwn.totalEquity.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-medium text-green-900 mb-2">Deposit Financing</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Monthly payment:</span>
                  <span className="font-semibold text-green-900">${results.depositFinancing.monthlyPayment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Move-in cost (1st month):</span>
                  <span className="font-semibold text-green-900">${results.depositFinancing.moveInCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              * Calculations are estimates. Actual terms vary by property and eligibility.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Application Form
function ApplicationForm({ option, onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
    monthly_income: '',
    employment_status: 'employed',
    credit_score_range: '600-650',
    property_interest: '',
    message: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/api/financing/applications`, {
        ...form,
        financing_type: option.id,
        user_id: user?.id
      });
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };
  
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">Application Submitted!</h3>
          <p className="text-gray-600 mb-6">
            We'll review your {option.title} application and contact you within 2 business days.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#1A2F3A] text-white rounded-xl font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-[#1A2F3A]">Apply for {option.title}</h3>
          <p className="text-sm text-gray-500">{option.description}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Monthly Income</label>
              <input
                type="number"
                value={form.monthly_income}
                onChange={(e) => setForm({ ...form, monthly_income: e.target.value })}
                placeholder="$"
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Employment Status</label>
              <select
                value={form.employment_status}
                onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              >
                <option value="employed">Employed Full-Time</option>
                <option value="part-time">Employed Part-Time</option>
                <option value="self-employed">Self-Employed</option>
                <option value="retired">Retired</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Credit Score Range</label>
              <select
                value={form.credit_score_range}
                onChange={(e) => setForm({ ...form, credit_score_range: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              >
                <option value="750+">Excellent (750+)</option>
                <option value="700-749">Good (700-749)</option>
                <option value="650-699">Fair (650-699)</option>
                <option value="600-649">Below Average (600-649)</option>
                <option value="below-600">Poor (Below 600)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Property of Interest (optional)</label>
            <input
              type="text"
              value={form.property_interest}
              onChange={(e) => setForm({ ...form, property_interest: e.target.value })}
              placeholder="Address or listing URL"
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Additional Information</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              placeholder="Tell us about your situation..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#1A2F3A] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Financing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [showApplication, setShowApplication] = useState(false);
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0]">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] text-white py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
              <Link to="/" className="hover:text-white">Home</Link>
              <ChevronRight size={14} />
              <span>Financing Options</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif mb-4">
              Flexible Financing Options
            </h1>
            <p className="text-xl text-white/80 max-w-2xl">
              Make your dream home more accessible with our innovative financing solutions designed for renters.
            </p>
          </div>
        </section>
        
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
          {/* Financing Options */}
          <section>
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6">Choose Your Path</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {FINANCING_OPTIONS.map((option) => {
                const Icon = option.icon;
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600',
                  purple: 'bg-purple-100 text-purple-600'
                };
                
                return (
                  <div 
                    key={option.id}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedOption(option)}
                    data-testid={`financing-option-${option.id}`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${colorClasses[option.color]}`}>
                      <Icon size={28} />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">{option.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                    
                    <ul className="space-y-2 mb-6">
                      {option.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <button 
                      className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#2C4A52] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOption(option);
                        setShowApplication(true);
                      }}
                    >
                      Apply Now <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
          
          {/* Calculator */}
          <FinancingCalculator />
          
          {/* How It Works */}
          <section className="bg-white rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: 1, title: 'Choose Option', desc: 'Select the financing option that fits your needs', icon: FileText },
                { step: 2, title: 'Apply Online', desc: 'Complete our simple application in minutes', icon: CreditCard },
                { step: 3, title: 'Get Approved', desc: 'Quick review and approval within 48 hours', icon: CheckCircle },
                { step: 4, title: 'Move In', desc: 'Start enjoying your new home', icon: Home }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1A2F3A] text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-[#1A2F3A] mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
          
          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'What credit score do I need?', a: 'Requirements vary by program. Rent-to-Own typically requires 550+, while Deposit Financing has no minimum.' },
                { q: 'How long does approval take?', a: 'Most applications are reviewed within 24-48 business hours.' },
                { q: 'Can I use financing on any property?', a: 'Financing options are available on qualifying properties. Check with the listing or ask Nova AI.' },
                { q: 'Is there a fee for applying?', a: 'No, all applications are free with no obligation.' }
              ].map((faq, i) => (
                <div key={i} className="bg-white rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <HelpCircle size={20} className="text-[#1A2F3A] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-[#1A2F3A] mb-1">{faq.q}</h4>
                      <p className="text-sm text-gray-600">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* CTA */}
          <section className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Our team is here to help you find the right financing solution for your situation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/browse"
                className="px-6 py-3 bg-white text-[#1A2F3A] rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Browse Properties
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 border border-white/30 rounded-full font-medium hover:bg-white/10 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
      
      {/* Application Modal */}
      {showApplication && selectedOption && (
        <ApplicationForm 
          option={selectedOption} 
          onClose={() => {
            setShowApplication(false);
            setSelectedOption(null);
          }} 
        />
      )}
    </MainLayout>
  );
}
