import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../App';
import NovaChat from '../chat/NovaChat';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ui/ThemeToggle';
import { openCookieSettings } from '@/lib/consent';

const MainLayout = ({ children, hideNovaButton = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Only the home page has a dark hero video behind the nav — other pages
  // should always show the frosted/solid state so nav is readable.
  const hasHero = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll(); // set initial state
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Nav is "transparent" only when we're on the home page AND near the top.
  // Anywhere else (scrolled, or non-hero page), it's frosted glass.
  const isTransparent = hasHero && !scrolled;

  const navWrapClass = isTransparent
    ? 'bg-transparent text-white'
    : 'bg-white/70 dark:bg-[#0D0D0D]/70 backdrop-blur-xl border-b border-black/5 dark:border-white/10 text-[#1A2F3A] dark:text-white';

  const linkActiveColor = isTransparent ? 'text-white' : 'text-[#1A2F3A] dark:text-white';
  const linkInactiveColor = isTransparent ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400';
  const iconColor = isTransparent ? 'text-gray-200 hover:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-[#1A2F3A] dark:hover:text-white';
  const btnOutline = isTransparent
    ? 'border border-white/70 text-white hover:bg-white/10'
    : 'border border-[#1A2F3A]/30 dark:border-white/30 text-[#1A2F3A] dark:text-white hover:bg-[#1A2F3A]/5 dark:hover:bg-white/10';

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
      { path: '/privacy', label: t('footer.privacy') },
      { path: '/security', label: 'Security' },
      { path: '/login', label: t('nav.login') },
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0] dark:bg-[#0F1419] transition-colors">
      {/* Navigation — glassmorphism. Transparent over hero, frosted on scroll / non-hero pages. */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${navWrapClass}`} data-testid="main-navigation">
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
                  className={`text-sm tracking-wider transition-colors ${
                    location.pathname === link.path ? linkActiveColor : linkInactiveColor
                  } hover:${isTransparent ? 'text-white' : 'text-[#1A2F3A] dark:text-white'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Button + Language Toggle + Theme */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle className={iconColor} />
              <LanguageToggle className={iconColor} />
              {user ? (
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-full text-xs tracking-wider transition-colors ${btnOutline}`}
                  data-testid="dashboard-btn"
                >
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-full text-xs tracking-wider transition-colors ${btnOutline}`}
                  data-testid="login-btn"
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 ${isTransparent ? 'text-white' : 'text-[#1A2F3A] dark:text-white'}`}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${isTransparent ? 'bg-[#0D0D0D]/90 backdrop-blur-xl border-white/10' : 'bg-white/90 dark:bg-[#0D0D0D]/90 backdrop-blur-xl border-black/5 dark:border-white/10'}`}>
            <div className="px-6 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block ${isTransparent ? 'text-gray-300 hover:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-[#1A2F3A] dark:hover:text-white'}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to={user ? "/dashboard" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className={`block font-medium ${isTransparent ? 'text-white' : 'text-[#1A2F3A] dark:text-white'}`}
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
                <li>
                  <button
                    type="button"
                    onClick={() => openCookieSettings()}
                    className="text-gray-400 hover:text-white text-sm"
                    data-testid="footer-cookie-preferences"
                  >
                    Cookie Preferences
                  </button>
                </li>
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
