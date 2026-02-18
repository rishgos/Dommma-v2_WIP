import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Building2, HardHat, DollarSign, Map, Twitter, Facebook, Instagram, Mail, Phone } from 'lucide-react';
import NovaChat from '../chat/NovaChat';

const navLinks = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/about', label: 'About', icon: Users },
  { path: '/renters', label: 'For Renters', icon: Users },
  { path: '/landlords', label: 'For Landlords', icon: Building2 },
  { path: '/contractors', label: 'Contractors', icon: HardHat },
  { path: '/pricing', label: 'Pricing', icon: DollarSign },
];

const footerLinks = {
  pages: [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/renters', label: 'For Renters' },
    { path: '/landlords', label: 'For Landlords' },
    { path: '/contractors', label: 'Contractors' },
    { path: '/pricing', label: 'Pricing' },
  ],
  legal: [
    { path: '#', label: 'Terms of Service' },
    { path: '#', label: 'Privacy Policy' },
  ]
};

const LandingLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6" data-testid="main-navigation">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-bold text-white tracking-tight"
            data-testid="nav-logo"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            DOMMMA<sup className="text-xs">®</sup>
          </Link>

          {/* Nav Pill */}
          <div 
            className="hidden md:flex items-center gap-1 px-2 py-2 rounded-full"
            style={{ background: 'rgba(26, 32, 44, 0.95)' }}
            data-testid="nav-pill"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  location.pathname === link.path
                    ? 'bg-white/20 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Social Icons */}
          <div className="hidden md:flex items-center gap-3">
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              data-testid="social-twitter"
            >
              <Twitter size={18} />
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              data-testid="social-facebook"
            >
              <Facebook size={18} />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              data-testid="social-instagram"
            >
              <Instagram size={18} />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <Link
            to="/browse"
            className="md:hidden px-4 py-2 rounded-full text-sm font-medium text-white bg-white/20"
            data-testid="mobile-browse-btn"
          >
            Browse
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Nova Chat Button */}
      <NovaChat />

      {/* Footer */}
      <footer>
        {/* CTA Section */}
        <section 
          className="bg-white py-20 px-8 text-center"
          style={{ borderTopLeftRadius: '50px', borderTopRightRadius: '50px' }}
          data-testid="footer-cta-section"
        >
          <h2 
            className="text-4xl md:text-5xl font-bold mb-8"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            Curious about what we can do for you?
          </h2>
          <a 
            href="mailto:hello@dommma.com"
            className="inline-block px-10 py-4 rounded-full font-bold text-white text-lg transition-all duration-300 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            data-testid="footer-cta-btn"
          >
            GET IN TOUCH
          </a>
        </section>

        {/* Main Footer */}
        <section 
          className="py-16 px-8"
          style={{ background: '#1a202c' }}
          data-testid="footer-main"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              {/* Brand Column */}
              <div>
                <h3 
                  className="text-2xl font-bold text-white mb-6"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  DOMMMA<sup className="text-xs">®</sup>
                </h3>
                <div className="space-y-3 text-gray-400">
                  <a href="mailto:hello@dommma.com" className="flex items-center gap-3 hover:text-white transition-colors">
                    <Mail size={18} />
                    hello@dommma.com
                  </a>
                  <a href="tel:+16041234567" className="flex items-center gap-3 hover:text-white transition-colors">
                    <Phone size={18} />
                    +1 604 123 4567
                  </a>
                </div>
              </div>

              {/* Pages Column */}
              <div>
                <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Pages</h4>
                <ul className="space-y-3">
                  {footerLinks.pages.map((link) => (
                    <li key={link.path}>
                      <Link 
                        to={link.path} 
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal Column */}
              <div>
                <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Legal</h4>
                <ul className="space-y-3">
                  {footerLinks.legal.map((link, i) => (
                    <li key={i}>
                      <Link 
                        to={link.path} 
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
              © 2026 DOMMMA. Powered by Nova AI.
            </div>
          </div>
        </section>
      </footer>
    </div>
  );
};

export default LandingLayout;
