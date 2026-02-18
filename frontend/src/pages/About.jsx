import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

const stats = [
  { number: '200+', label: 'Properties' },
  { number: '100%', label: 'Happy Clients' },
  { number: '900K', label: 'Sq Ft Managed' },
  { number: '50+', label: 'Contractors' },
];

const values = [
  { title: 'Innovation', desc: 'We bring cutting-edge technology to simplify real estate for everyone.' },
  { title: 'Transparency', desc: 'No hidden fees, no surprises. Just honest service you can trust.' },
  { title: 'Excellence', desc: 'We strive for perfection in every property and every interaction.' },
  { title: 'Community', desc: 'Building lasting relationships between renters, landlords, and contractors.' },
];

const team = [
  { name: 'Cameron Williamson', role: 'CEO', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { name: 'Albert Flores', role: 'CFO', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
  { name: 'Bessie Cooper', role: 'Head of Design', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { name: 'Annette Black', role: 'Customer Success', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200' },
];

const About = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section 
        className="relative min-h-[70vh] flex items-center"
        data-testid="about-hero"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2F3A]/90 via-[#1A2F3A]/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-2xl">
            <p className="text-xs text-white/70 uppercase tracking-widest mb-4">About Us</p>
            <h1 
              className="display-xl text-white mb-6"
            >
              Building the<br />Future of<br />Real Estate
            </h1>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="stat-number">{stat.number}</p>
                <p className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-lg bg-[#F5F5F0]" data-testid="story-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Our Story</p>
              <h2 
                className="display-lg text-[#1A2F3A] mb-6"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Architecture<br />in Motion
              </h2>
            </div>
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                DOMMMA was founded with a simple vision: to create a complete real estate ecosystem that serves everyone - from first-time renters to property moguls, from solo landlords to professional contractors.
              </p>
              <p>
                We believe that finding a home, managing properties, or growing a contracting business shouldn't be complicated. That's why we've built Nova, our AI assistant, to guide you through every step of your real estate journey.
              </p>
              <p>
                Today, DOMMMA connects thousands of renters with their perfect homes, helps landlords manage properties efficiently, and enables contractors to grow their businesses - all in one seamless platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-lg bg-white" data-testid="values-section">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Our Values</p>
          <h2 
            className="display-lg text-[#1A2F3A] mb-12"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            What We<br />Stand For
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, i) => (
              <div key={i} className="p-8 bg-[#F5F5F0] rounded-2xl">
                <h3 className="text-xl font-semibold text-[#1A2F3A] mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-lg bg-[#1A2F3A]" data-testid="team-section">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Our Team</p>
          <h2 
            className="display-lg text-white mb-12"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Meet the<br />Leaders
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {team.map((member, i) => (
              <div key={i} className="text-center">
                <img 
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-2xl mx-auto mb-4 object-cover"
                />
                <h3 className="text-white font-semibold">{member.name}</h3>
                <p className="text-white/50 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default About;
