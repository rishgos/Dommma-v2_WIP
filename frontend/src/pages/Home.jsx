import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, ChevronRight } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

const featuredProperties = [
  {
    id: 1,
    title: 'OCEAN',
    subtitle: 'WAVE',
    location: 'Vancouver, BC',
    type: 'Residential',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
    price: '$3,200/mo',
    beds: 2,
    baths: 2
  },
  {
    id: 2,
    title: 'PUZZLE',
    subtitle: 'TOWER',
    location: 'Downtown, Vancouver',
    type: 'Commercial',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    price: '$4,500/mo',
    beds: 3,
    baths: 2
  },
  {
    id: 3,
    title: 'HONEY',
    subtitle: 'COMB',
    location: 'Kitsilano, Vancouver',
    type: 'Residential',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
    price: '$2,800/mo',
    beds: 1,
    baths: 1
  },
  {
    id: 4,
    title: 'YELLOW',
    subtitle: 'SUITES',
    location: 'Yaletown, Vancouver',
    type: 'Luxury',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    price: '$5,200/mo',
    beds: 3,
    baths: 3
  },
];

const stats = [
  { number: '200+', label: 'Properties', desc: 'Premium listings across Vancouver' },
  { number: '100%', label: 'Happy Clients', desc: 'Satisfaction guaranteed' },
  { number: '900K', label: 'Square Feet', desc: 'Managed properties' },
  { number: '50+', label: 'Contractors', desc: 'Verified professionals' },
];

const team = [
  { name: 'Jayraj Panchal', role: 'Founder', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { name: 'Monika Aggarwal', role: 'Founder', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { name: 'Geoffrey Routledge', role: 'Founder', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
  { name: 'Rishabh Goswami', role: 'Founder', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200' },
];

const Home = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center"
        data-testid="hero-section"
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://customer-assets.emergentagent.com/job_property-ai-hub-3/artifacts/8ejxvmv4_1.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2F3A]/90 via-[#1A2F3A]/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-2xl">
            <h1 
              className="display-xl text-white mb-6 uppercase"
              data-testid="hero-title"
            >
              Home Made<br />Simple
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-md leading-relaxed">
              Complete real estate marketplace for renting, buying, property management, and finding trusted contractors.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/about"
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
                data-testid="hero-cta"
              >
                <span className="text-sm tracking-wider">Our Story</span>
                <ArrowRight size={16} />
              </Link>
              <button className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <Play size={16} fill="white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="section-lg bg-[#F5F5F0]" data-testid="featured-properties">
        <div className="max-w-7xl mx-auto px-6">
          {featuredProperties.map((property, index) => (
            <div 
              key={property.id}
              className={`relative rounded-3xl overflow-hidden mb-8 h-[500px] property-card ${
                index % 2 === 0 ? 'bg-[#C8E3E8]' : index % 3 === 0 ? 'bg-[#D7C8D7]' : 'bg-[#2C4A52]'
              }`}
            >
              <img 
                src={property.image}
                alt={property.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-12 z-10">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs text-white/70 uppercase tracking-widest">{property.type}</span>
                  <span className="text-xs text-white/70">•</span>
                  <span className="text-xs text-white/70 uppercase tracking-widest">{property.location}</span>
                </div>
                <h2 
                  className="display-lg text-white uppercase leading-none mb-6"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {property.title}<br />{property.subtitle}
                </h2>
                <p className="text-white/70 mb-6 max-w-md">
                  {property.beds} Bedrooms • {property.baths} Bathrooms • {property.price}
                </p>
                <div className="flex items-center gap-4">
                  <Link 
                    to="/browse"
                    className="btn-outline text-white border-white/50 hover:bg-white hover:text-[#1A2F3A]"
                  >
                    Explore
                  </Link>
                  <Link 
                    to={`/browse`}
                    className="btn-outline text-white border-white/50 hover:bg-white hover:text-[#1A2F3A]"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture in Motion */}
      <section className="section-lg bg-white" data-testid="about-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left Content */}
            <div>
              <h2 
                className="display-lg text-[#1A2F3A] mb-6"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Architecture<br />in Motion
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your complete real estate platform - from finding your perfect home to managing properties and connecting with trusted contractors. We bring innovation to every aspect of real estate.
              </p>
              <Link 
                to="/about"
                className="flex items-center gap-2 text-[#1A2F3A] font-medium hover:gap-4 transition-all"
              >
                <span className="text-sm tracking-wider uppercase">Our Services</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="stat-card">
                  <p className="stat-number">{stat.number}</p>
                  <p className="text-sm font-semibold text-[#1A2F3A] uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <p className="text-sm text-gray-500">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-md bg-[#F5F5F0]" data-testid="team-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Our Team</p>
              <div className="space-y-0">
                {team.map((member, i) => (
                  <div key={i} className="team-card">
                    <img src={member.image} alt={member.name} />
                    <div className="flex-1">
                      <p className="font-semibold text-[#1A2F3A]">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-400 text-xs">in</span>
                      <span className="text-gray-400 text-xs">tw</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div 
              className="relative rounded-3xl overflow-hidden h-[500px] img-overlay"
            >
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"
                alt="Architecture"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 p-8 z-10">
                <h3 
                  className="text-4xl text-white uppercase mb-2"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  Innovative<br />Design
                </h3>
                <p className="text-white/70 text-sm mb-4">Lorem ipsum dolor sit amet</p>
                <Link 
                  to="/about"
                  className="flex items-center gap-2 text-white text-sm"
                >
                  Our Story <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
