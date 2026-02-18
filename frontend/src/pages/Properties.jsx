import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const properties = [
  {
    id: 1,
    title: 'Ocean Wave',
    location: 'Vancouver, BC',
    type: 'Residential',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
    price: '$3,200/mo'
  },
  {
    id: 2,
    title: 'Puzzle Tower',
    location: 'Downtown',
    type: 'Commercial',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    price: '$4,500/mo'
  },
  {
    id: 3,
    title: 'Honey Comb',
    location: 'Kitsilano',
    type: 'Residential',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    price: '$2,800/mo'
  },
  {
    id: 4,
    title: 'Yellow Suites',
    location: 'Yaletown',
    type: 'Luxury',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
    price: '$5,200/mo'
  },
];

const Properties = () => {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-[#1A2F3A]" data-testid="properties-hero">
        <div className="max-w-7xl mx-auto px-6 py-32 w-full">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Properties</p>
          <h1 className="display-xl text-white mb-8">Featured<br />Listings</h1>
          <Link to="/browse" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#1A2F3A] font-medium hover:bg-gray-100 transition-colors">
            <Search size={18} />
            Browse All Properties
          </Link>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="section-lg bg-[#F5F5F0]" data-testid="properties-grid">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {properties.map((property) => (
              <Link
                key={property.id}
                to="/browse"
                className="relative rounded-3xl overflow-hidden h-[400px] property-card group"
              >
                <img 
                  src={property.image}
                  alt={property.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="property-card-content">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-white/70 uppercase tracking-widest">{property.type}</span>
                    <span className="text-xs text-white/50">•</span>
                    <span className="text-xs text-white/70">{property.location}</span>
                  </div>
                  <h2 className="text-4xl text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {property.title}
                  </h2>
                  <p className="text-white/80 text-lg">{property.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Properties;
