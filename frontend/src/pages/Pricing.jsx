import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const renterFeatures = [
  'Nova AI Chatbot',
  'Smart Match Scores',
  'Voice Search',
  'Multi-Language Support',
  'Neighborhood Explorer',
  'Budget Calculator',
  'Smart Favorites',
  'All 15 AI Features'
];

const landlordPlans = [
  {
    name: 'Starter',
    monthlyPrice: 49,
    yearlyPrice: 470,
    limit: 'Up to 5 properties',
    features: [
      'Smart listing creation',
      'Basic tenant screening',
      'Rent collection',
      'Maintenance tracking',
      'Document storage',
      'Email support'
    ],
    popular: false
  },
  {
    name: 'Professional',
    monthlyPrice: 99,
    yearlyPrice: 950,
    limit: 'Up to 20 properties',
    features: [
      'Everything in Starter',
      'Advanced tenant screening',
      'Financial reporting',
      'Multi-property dashboard',
      'Priority support',
      'API access',
      'Custom branding',
      'Team accounts'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    yearlyPrice: null,
    limit: 'Unlimited properties',
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'On-site training',
      'White-label options',
      'Advanced analytics',
      'Phone support'
    ],
    popular: false
  },
];

const contractorFeatures = [
  'Direct property owner access',
  'Job management tools',
  'Profile and reviews',
  'Smart job notifications',
  'Mobile app access',
  'Scheduling tools',
  'Invoice generation',
  'No commission fees'
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="min-h-[40vh] flex items-center section-padding pt-32"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4fd1c5 100%)' }}
        data-testid="pricing-hero"
      >
        <div className="max-w-7xl mx-auto w-full text-center">
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
            data-testid="pricing-title"
          >
            SIMPLE TRANSPARENT<br />PRICING
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Choose the plan that's right for you. No hidden fees. Cancel anytime.
          </p>
        </div>
      </section>

      {/* For Renters */}
      <section className="section-padding bg-white" data-testid="pricing-renters">
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            FOR RENTERS
          </h2>
          <p className="text-gray-600 mb-12">All AI features. Always free.</p>
          
          <div 
            className="p-10 rounded-3xl bg-white border-2 border-[#4fd1c5] max-w-md mx-auto"
            style={{ boxShadow: '0 10px 40px rgba(79, 209, 197, 0.2)' }}
          >
            <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold bg-[#4fd1c5]/20 text-[#4fd1c5] mb-4">
              FREE FOREVER
            </span>
            <div className="mb-6">
              <span className="text-6xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}>$0</span>
              <span className="text-gray-500">/forever</span>
            </div>
            <p className="text-[#667eea] font-semibold mb-6">Everything free for renters!</p>
            <ul className="space-y-3 mb-8 text-left">
              {renterFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-600">
                  <Check className="text-[#4fd1c5]" size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/browse"
              className="block w-full py-4 rounded-full font-bold text-white text-center transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              data-testid="renter-plan-cta"
            >
              Start Searching
            </Link>
          </div>
        </div>
      </section>

      {/* For Landlords */}
      <section className="section-padding bg-[#f7fafc]" data-testid="pricing-landlords">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
            >
              FOR LANDLORDS
            </h2>
            <p className="text-gray-600 mb-8">Professional property management tools</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`font-medium ${!isYearly ? 'text-[#1a202c]' : 'text-gray-400'}`}>Monthly</span>
              <button 
                onClick={() => setIsYearly(!isYearly)}
                className="relative w-14 h-7 rounded-full transition-colors"
                style={{ background: isYearly ? '#667eea' : '#d1d5db' }}
                data-testid="billing-toggle"
              >
                <span 
                  className="absolute top-1 w-5 h-5 rounded-full bg-white transition-transform"
                  style={{ left: isYearly ? '32px' : '4px' }}
                />
              </button>
              <span className={`font-medium ${isYearly ? 'text-[#1a202c]' : 'text-gray-400'}`}>Yearly</span>
              {isYearly && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#4fd1c5]/20 text-[#4fd1c5]">
                  Save 20%
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {landlordPlans.map((plan, i) => (
              <div 
                key={i}
                className={`relative p-8 rounded-3xl bg-white border-2 transition-all ${
                  plan.popular ? 'border-[#667eea] scale-105' : 'border-gray-100'
                }`}
                style={{ boxShadow: plan.popular ? '0 10px 40px rgba(102, 126, 234, 0.2)' : '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                {plan.popular && (
                  <span 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    Most Popular
                  </span>
                )}
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
                >
                  {plan.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">{plan.limit}</p>
                <div className="mb-6">
                  {plan.monthlyPrice ? (
                    <>
                      <span className="text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}>
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-gray-500">/{isYearly ? 'year' : 'mo'}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}>
                      Custom
                    </span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-gray-600 text-sm">
                      <Check className="text-[#4fd1c5]" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-full font-bold transition-all hover:scale-105 ${
                    plan.popular 
                      ? 'text-white' 
                      : 'border-2 border-[#667eea] text-[#667eea] hover:bg-[#667eea] hover:text-white'
                  }`}
                  style={plan.popular ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
                  data-testid={`landlord-plan-${plan.name.toLowerCase()}-cta`}
                >
                  {plan.monthlyPrice ? 'Start Free Trial' : 'Contact Sales'}
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-center text-gray-500 mt-8">
            All plans include a 14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* For Contractors */}
      <section className="section-padding bg-white" data-testid="pricing-contractors">
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            FOR CONTRACTORS
          </h2>
          <p className="text-gray-600 mb-12">Grow your business with no commissions</p>
          
          <div 
            className="p-10 rounded-3xl bg-white border-2 border-[#667eea] max-w-md mx-auto"
            style={{ boxShadow: '0 10px 40px rgba(102, 126, 234, 0.2)' }}
          >
            <h3 
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
            >
              Contractor Membership
            </h3>
            <div className="mb-4">
              <span className="text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}>
                ${isYearly ? 470 : 49}
              </span>
              <span className="text-gray-500">/{isYearly ? 'year' : 'mo'}</span>
            </div>
            <p className="text-[#4fd1c5] font-semibold mb-6">No commission fees on jobs!</p>
            <ul className="space-y-3 mb-8 text-left">
              {contractorFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-600">
                  <Check className="text-[#4fd1c5]" size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-4 rounded-full font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              data-testid="contractor-plan-cta"
            >
              Start Free Trial
            </button>
          </div>
          
          <p className="text-gray-500 mt-6">
            14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="section-padding text-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        data-testid="pricing-cta-section"
      >
        <div className="max-w-3xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            READY TO GET STARTED?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            No credit card required
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-[#667eea] font-bold text-lg hover:scale-105 transition-transform shadow-xl"
            data-testid="pricing-bottom-cta"
          >
            Start Your Free Trial
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
