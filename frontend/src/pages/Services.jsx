import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Users, Wrench, FileText, DollarSign, Shield, Layers, MessageSquare, Check } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

const services = [
  {
    icon: Building2,
    title: 'Property Listings',
    desc: 'Browse thousands of verified rental properties with detailed information and virtual tours.',
    features: ['AI-powered search', 'Virtual tours', 'Neighborhood insights', 'Price comparisons']
  },
  {
    icon: FileText,
    title: 'Lease Management',
    desc: 'Digital lease signing, document storage, and automated reminders for important dates.',
    features: ['E-signatures', 'Document vault', 'Renewal reminders', 'Compliance checks']
  },
  {
    icon: DollarSign,
    title: 'Rent Payments',
    desc: 'Secure online rent payments with automatic scheduling and receipt generation.',
    features: ['Auto-pay setup', 'Payment history', 'Late fee management', 'Split payments']
  },
  {
    icon: Layers,
    title: 'Strata Management',
    desc: 'Complete strata management including meetings, documents, and financial reporting.',
    features: ['Meeting management', 'Bylaw tracking', 'Reserve fund', 'Owner portal']
  },
  {
    icon: Wrench,
    title: 'Contractor Network',
    desc: 'Connect with verified contractors for repairs, renovations, and maintenance.',
    features: ['Verified pros', 'Instant quotes', 'Job tracking', 'Reviews & ratings']
  },
  {
    icon: MessageSquare,
    title: 'Communication Hub',
    desc: 'Centralized messaging between tenants, landlords, and service providers.',
    features: ['Instant messaging', 'Notifications', 'Request tracking', 'History log']
  },
];

const Services = () => {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center bg-[#1A2F3A]" data-testid="services-hero">
        <div className="max-w-7xl mx-auto px-6 py-32">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Our Services</p>
          <h1 className="display-xl text-white mb-6">
            Complete<br />Real Estate<br />Solutions
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Everything you need to rent, manage, and grow in one powerful platform.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-lg bg-[#F5F5F0]" data-testid="services-grid">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl card-hover">
                <div className="w-14 h-14 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center mb-6">
                  <service.icon size={28} className="text-[#1A2F3A]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A2F3A] mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6">{service.desc}</p>
                <ul className="space-y-2">
                  {service.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-500">
                      <Check size={14} className="text-green-500" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-lg bg-[#1A2F3A] text-center" data-testid="services-cta">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="display-lg text-white mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Ready to get started?
          </h2>
          <p className="text-white/70 mb-8">
            Join thousands of renters, landlords, and contractors already using DOMMMA.
          </p>
          <Link to="/login" className="inline-block px-8 py-4 rounded-full bg-white text-[#1A2F3A] font-medium hover:bg-gray-100 transition-colors">
            Create Free Account
          </Link>
        </div>
      </section>
    </MainLayout>
  );
};

export default Services;
