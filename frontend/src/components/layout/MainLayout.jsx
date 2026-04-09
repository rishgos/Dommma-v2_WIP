import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../App';
import NovaChat from '../chat/NovaChat';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ui/ThemeToggle';

const MainLayout = ({ children, hideNovaButton = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/about', label: t('nav.about') },
    { path: '/properties', label: t('nav.properties') },
    { path: '/contractors', label: t('nav.pros') },
    { path: '/contact', label: t('nav.contact') },
  ];

  const footerLinks = {
    pages: [
      { path: '/', label: t('nav.home') },
      { path: '/about', label: t('nav.about') },
      { path: '/properties', label: t('nav.properties') },
      { path: '/contractors', label: t('nav.pros') },
      { path: '/services', label: t('nav.services') },
      { path: '/contact', label: t('nav.contact') },
    ],
    services: [
      { path: '/browse', label: t('browse.rent') },
      { path: '/browse?type=sale', label: t('browse.buy') },
      { path: '/contractors', label: t('contractors.title') },
    ],
    utility: [
      { path: '#', label: t('footer.terms') },
      { path: '#', label: t('footer.privacy') },
      { path: '/login', label: t('nav.login') },
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0] dark:bg-[#0F1419] transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D] text-white" data-testid="main-navigation">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to="/" 
              className="text-2xl tracking-wider"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
              data-testid="nav-logo"
            >
              DOMMMA
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`nav-link-${link.label.toLowerCase()}`}
                  className={`text-sm tracking-wider transition-colors hover:text-gray-300 ${
                    location.pathname === link.path ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Button + Language Toggle + Theme */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle className="text-gray-300 hover:text-white" />
              <LanguageToggle className="text-gray-300 hover:text-white" />
              {user ? (
                <Link 
                  to="/dashboard"
                  className="btn-outline text-white border-white text-xs"
                  data-testid="dashboard-btn"
                >
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <Link 
                  to="/login"
                  className="btn-outline text-white border-white text-xs"
                  data-testid="login-btn"
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0D0D0D] border-t border-gray-800">
            <div className="px-6 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-300 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <Link 
                to={user ? "/dashboard" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white font-medium"
              >
                {user ? 'Dashboard' : 'Login'}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Nova Chat - conditionally rendered */}
      {!hideNovaButton && <NovaChat />}

      {/* CTA Section */}
      <section className="bg-white dark:bg-[#151B22] py-20 text-center" data-testid="footer-cta">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">Contact</p>
        <h2
          className="display-lg text-[#1A2F3A] dark:text-white mb-8"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Curious about what we<br />can do for you?
        </h2>
        <Link 
          to="/contact"
          className="btn-dark inline-block"
          data-testid="footer-cta-btn"
        >
          Get In Touch
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D0D0D] text-white py-16 px-6" data-testid="main-footer">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Contact</p>
              <a href="mailto:hello@dommma.com" className="block text-gray-300 hover:text-white mb-2">
                hello@dommma.com
              </a>
              <a href="tel:+16041234567" className="block text-gray-300 hover:text-white mb-4">
                +1 604 123 456 78
              </a>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
                  <Twitter size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
                  <Instagram size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
                  <Linkedin size={14} />
                </a>
              </div>
            </div>

            {/* Pages Column */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Pages</p>
              <ul className="space-y-2">
                {footerLinks.pages.map((link, i) => (
                  <li key={i}>
                    <Link to={link.path} className="text-gray-400 hover:text-white text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Column */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Services</p>
              <ul className="space-y-2">
                {footerLinks.services.map((link, i) => (
                  <li key={i}>
                    <Link to={link.path} className="text-gray-400 hover:text-white text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Utility Column */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Utility Pages</p>
              <ul className="space-y-2">
                {footerLinks.utility.map((link, i) => (
                  <li key={i}>
                    <Link to={link.path} className="text-gray-400 hover:text-white text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 DOMMMA. Powered by Nova AI.
            </p>
            <p className="text-gray-500 text-sm">
              Complete Real Estate Marketplace
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
