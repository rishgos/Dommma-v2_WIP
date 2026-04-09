import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Building2, FileText, Wrench, MapPin, Bed, Bath, ArrowRight, Star, Users } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  {
    id: 'rentals',
    label: 'Rentals',
    subtitle: 'Find your next home',
    icon: Home,
    filterType: 'rent',
    link: '/browse?type=rent',
    gradient: 'from-emerald-400/20 to-teal-500/20',
    accent: '#10B981',
  },
  {
    id: 'buy_sell',
    label: 'Buy & Sell',
    subtitle: 'Own your dream property',
    icon: Building2,
    filterType: 'sale',
    link: '/browse?type=sale',
    gradient: 'from-blue-400/20 to-indigo-500/20',
    accent: '#6366F1',
  },
  {
    id: 'lease',
    label: 'Lease',
    subtitle: 'Flexible lease terms',
    icon: FileText,
    filterType: 'lease',
    link: '/browse?type=lease_takeover',
    gradient: 'from-amber-400/20 to-orange-500/20',
    accent: '#F59E0B',
  },
  {
    id: 'services',
    label: 'Services',
    subtitle: 'Trusted professionals',
    icon: Wrench,
    filterType: 'services',
    link: '/contractors',
    gradient: 'from-rose-400/20 to-pink-500/20',
    accent: '#F43F5E',
  },
];

function TiltCard({ children, className = '', style = {} }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    card.style.setProperty('--glare-x', `${glareX}%`);
    card.style.setProperty('--glare-y', `${glareY}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-all duration-200 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform', ...style }}
    >
      {children}
    </div>
  );
}

function ListingMiniCard({ item, type }) {
  if (type === 'services') {
    return (
      <Link to="/contractors" className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.14] transition-colors cursor-pointer overflow-hidden">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <Users size={16} className="text-white/70" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{item.business_name || item.title}</p>
          <p className="text-xs text-white/50 truncate">{item.specialties?.slice(0, 2).join(', ') || 'Professional Service'}</p>
        </div>
        {item.rating > 0 && (
          <div className="flex items-center gap-1 text-amber-400 text-xs flex-shrink-0">
            <Star size={12} fill="currentColor" />
            {item.rating?.toFixed(1)}
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link to={`/browse?property=${item.id}`} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.14] transition-colors cursor-pointer overflow-hidden">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home size={16} className="text-white/40" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-white truncate">{item.title}</p>
        <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
          {item.bedrooms != null && <span className="flex items-center gap-0.5"><Bed size={10} />{item.bedrooms}</span>}
          {item.bathrooms != null && <span className="flex items-center gap-0.5"><Bath size={10} />{item.bathrooms}</span>}
          {item.city && <span className="flex items-center gap-0.5 truncate"><MapPin size={10} />{item.city}</span>}
        </div>
      </div>
      <p className="text-xs sm:text-sm font-bold text-white flex-shrink-0">
        ${item.price?.toLocaleString()}
        <span className="text-[10px] font-normal text-white/40">{item.listing_type !== 'sale' ? '/mo' : ''}</span>
      </p>
    </Link>
  );
}

export default function ServiceShowcase() {
  const [data, setData] = useState({ rentals: [], buy_sell: [], lease: [], services: [] });
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rentals, sales, leases, contractors] = await Promise.all([
          axios.get(`${API}/listings?listing_type=rent&limit=5`).then(r => r.data).catch(() => []),
          axios.get(`${API}/listings?listing_type=sale&limit=5`).then(r => r.data).catch(() => []),
          axios.get(`${API}/listings?limit=5`).then(r => r.data).catch(() => []),
          axios.get(`${API}/contractors/search?limit=5`).then(r => r.data).catch(() => []),
        ]);
        setData({
          rentals: rentals.length ? rentals : leases.slice(0, 5),
          buy_sell: sales.length ? sales : leases.slice(0, 5),
          lease: leases.slice(0, 5),
          services: contractors,
        });
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const getCategoryItems = (catId) => data[catId] || [];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F1A1E 0%, #1A2F3A 40%, #162530 100%)' }}
      data-testid="service-showcase"
    >
      {/* Subtle grain texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

      {/* Ambient glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/[0.06] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/[0.06] rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs text-white/40 uppercase tracking-[0.3em] mb-3">What We Offer</p>
          <h2
            className="text-3xl md:text-4xl text-white mb-3"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Everything Real Estate, One Platform
          </h2>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            From finding your next rental to hiring trusted contractors — DOMMMA has you covered.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {CATEGORIES.map((cat, idx) => {
            const items = getCategoryItems(cat.id);
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                className={`transition-all duration-700 ${
                  visible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${idx * 120}ms` }}
              >
              <TiltCard>
                <div
                  className="relative rounded-2xl overflow-hidden h-full"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Glare overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.08) 0%, transparent 60%)',
                    }}
                  />

                  <div className="relative z-10 p-5">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${cat.accent}20`, color: cat.accent }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base">{cat.label}</h3>
                        <p className="text-white/40 text-xs">{cat.subtitle}</p>
                      </div>
                    </div>

                    {/* Listings */}
                    <div className="flex flex-col gap-3 mb-4">
                      {items.length > 0 ? (
                        items.slice(0, 4).map((item, i) => (
                          <div
                            key={item.id || i}
                            className={`transition-all duration-500 ${
                              visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                            }`}
                            style={{ transitionDelay: `${idx * 120 + i * 80 + 300}ms` }}
                          >
                            <ListingMiniCard item={item} type={cat.filterType === 'services' ? 'services' : 'listing'} />
                          </div>
                        ))
                      ) : (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
                        ))
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      to={cat.link}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:gap-3"
                      style={{
                        background: `${cat.accent}15`,
                        color: cat.accent,
                        border: `1px solid ${cat.accent}30`,
                      }}
                      data-testid={`showcase-cta-${cat.id}`}
                    >
                      <span>Browse {cat.label}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </TiltCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
