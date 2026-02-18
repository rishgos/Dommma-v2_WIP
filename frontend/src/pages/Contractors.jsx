import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Briefcase, Star, DollarSign, Smartphone, Bell, ArrowRight, Users } from 'lucide-react';

const benefits = [
  {
    icon: Target,
    title: 'Direct Access to Property Owners',
    desc: 'Connect directly with landlords and property managers who need your services.',
    stat: '500+ Active Landlords'
  },
  {
    icon: Briefcase,
    title: 'Job Management Tools',
    desc: 'Track jobs, manage schedules, and communicate with clients all in one place.',
    stat: 'Save 5+ hrs/week'
  },
  {
    icon: Star,
    title: 'Build Your Reputation',
    desc: 'Collect reviews and build your profile to attract more clients over time.',
    stat: 'Avg 4.8★ Rating'
  },
  {
    icon: DollarSign,
    title: 'Fair Pricing',
    desc: 'No commission fees on jobs. You keep 100% of what you earn.',
    stat: 'No Commission Fees'
  },
  {
    icon: Smartphone,
    title: 'Mobile App',
    desc: 'Manage your business on the go with our mobile app.',
    stat: 'Coming Soon'
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    desc: 'Get instant alerts for new job requests that match your services and area.',
    stat: 'Real-Time Alerts'
  },
];

const services = [
  'Plumbing', 'Electrical', 'HVAC', 'Landscaping', 'Cleaning', 'Painting',
  'Carpentry', 'Roofing', 'Flooring', 'Appliance Repair', 'Pest Control', 'Moving'
];

const Contractors = () => {
  return (
    <div>
      {/* Hero Section */}
      <section 
        className="min-h-[60vh] flex items-center section-padding pt-32"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4fd1c5 100%)' }}
        data-testid="contractors-hero"
      >
        <div className="max-w-7xl mx-auto w-full text-center">
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
            data-testid="contractors-title"
          >
            GROW YOUR BUSINESS<br />WITH DOMMMA
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-6">
            Connect with property owners who need your services. No commissions. Just results.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-[#667eea] font-bold text-lg hover:scale-105 transition-transform shadow-xl mb-4"
            data-testid="contractors-cta"
          >
            Join the Network
            <ArrowRight size={20} />
          </Link>
          <p className="text-white/60 flex items-center justify-center gap-2">
            <Users size={16} />
            Join 1,000+ contractors already on DOMMMA
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-white" data-testid="contractors-benefits">
        <div className="max-w-7xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            WHY JOIN DOMMMA?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div 
                key={i}
                className="p-8 rounded-2xl bg-white border border-gray-100 card-hover"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <benefit.icon className="text-white" size={28} />
                </div>
                <h3 
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
                >
                  {benefit.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{benefit.desc}</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#667eea]/10 text-[#667eea]">
                  {benefit.stat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-[#f7fafc]" data-testid="contractors-services">
        <div className="max-w-7xl mx-auto text-center">
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            SERVICES WE CONNECT
          </h2>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            We connect property owners with trusted contractors across all trades
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {services.map((service, i) => (
              <span 
                key={i}
                className="px-5 py-2 rounded-full bg-white text-gray-700 font-medium border border-gray-200 hover:border-[#667eea] hover:text-[#667eea] transition-colors cursor-pointer"
              >
                {service}
              </span>
            ))}
          </div>
          <p className="text-gray-500 text-sm">
            Don't see your service? Contact us - we're always adding more!
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="section-padding text-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        data-testid="contractors-cta-section"
      >
        <div className="max-w-3xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            READY TO GROW?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            14-day free trial • No credit card required
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-[#667eea] font-bold text-lg hover:scale-105 transition-transform shadow-xl"
            data-testid="contractors-bottom-cta"
          >
            Join the Network
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Contractors;
