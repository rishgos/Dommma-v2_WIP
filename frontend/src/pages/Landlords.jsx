import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, DollarSign, Wrench, FileText, BarChart3, Check, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Smart Listings',
    desc: 'AI-powered listing creation that highlights your property\'s best features and attracts qualified tenants.',
    benefits: ['Auto-generated descriptions', 'Optimal pricing suggestions', 'Photo enhancement tips']
  },
  {
    icon: Users,
    title: 'Tenant Screening',
    desc: 'Comprehensive background checks and AI-powered tenant matching to find reliable renters.',
    benefits: ['Credit & background checks', 'Income verification', 'Reference analysis']
  },
  {
    icon: DollarSign,
    title: 'Rent Collection',
    desc: 'Automated rent collection with multiple payment options and late payment reminders.',
    benefits: ['Auto-pay setup', 'Payment tracking', 'Receipt generation']
  },
  {
    icon: Wrench,
    title: 'Maintenance Tracking',
    desc: 'Streamlined maintenance requests with contractor matching and expense tracking.',
    benefits: ['Online requests', 'Contractor network', 'Cost tracking']
  },
  {
    icon: FileText,
    title: 'Document Management',
    desc: 'Store and manage all lease documents, receipts, and important files in one secure place.',
    benefits: ['Digital leases', 'E-signatures', 'Secure storage']
  },
  {
    icon: BarChart3,
    title: 'Multi-Property Dashboard',
    desc: 'See all your properties at a glance. Track income, expenses, and occupancy in real-time.',
    benefits: ['Portfolio overview', 'Financial reports', 'Performance metrics']
  },
];

const Landlords = () => {
  return (
    <div>
      {/* Hero Section */}
      <section 
        className="min-h-[60vh] flex items-center section-padding pt-32"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4fd1c5 100%)' }}
        data-testid="landlords-hero"
      >
        <div className="max-w-7xl mx-auto w-full text-center">
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
            data-testid="landlords-title"
          >
            MANAGE PROPERTIES<br />WITH AI
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Automate tenant screening, rent collection, maintenance tracking, and more. All in one platform.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-[#667eea] font-bold text-lg hover:scale-105 transition-transform shadow-xl"
            data-testid="landlords-cta"
          >
            Start Free Trial
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-white" data-testid="landlords-features">
        <div className="max-w-7xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            EVERYTHING YOU NEED
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="p-8 rounded-2xl bg-white border border-gray-100 card-hover"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <feature.icon className="text-white" size={28} />
                </div>
                <h3 
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
                >
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{feature.desc}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="text-[#4fd1c5]" size={16} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="section-padding text-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        data-testid="landlords-cta-section"
      >
        <div className="max-w-3xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            READY TO GET STARTED?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            14-day free trial • No credit card required
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-[#667eea] font-bold text-lg hover:scale-105 transition-transform shadow-xl"
            data-testid="landlords-bottom-cta"
          >
            View Pricing
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landlords;
