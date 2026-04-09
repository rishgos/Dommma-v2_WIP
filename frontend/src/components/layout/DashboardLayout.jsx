import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Building2, Users, Wrench, FileText, DollarSign, MessageSquare,
  Settings, LogOut, Search, Menu, X, Calendar,
  Heart, Sparkles, Scale, Navigation, Users2,
  Truck, Briefcase, Image, BarChart2, ClipboardList, Share2, BarChart3, Zap, CreditCard, Shield,
  TrendingUp, MapPin, Receipt, Calculator, Wand2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../App';
import NotificationCenter from '../NotificationCenter';
import ThemeToggle from '../ui/ThemeToggle';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const navItems = {
    renter: [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Search, label: 'Browse Properties', path: '/browse' },
      { icon: Heart, label: 'Saved Properties', path: '/favorites' },
      { icon: CreditCard, label: 'Rent Agreements', path: '/rent-agreements' },
      { icon: Receipt, label: 'Payment History', path: '/payment-history' },
      { icon: DollarSign, label: 'Pay & Invoices', path: '/payments' },
      { icon: ClipboardList, label: 'My Resume', path: '/my-resume' },
      { icon: Users2, label: 'Roommate Finder', path: '/roommates' },
      { icon: Calendar, label: 'My Calendar', path: '/calendar' },
      { icon: BarChart2, label: 'Nova Insights', path: '/nova-insights' },
      { icon: FileText, label: 'Applications', path: '/applications' },
      { icon: TrendingUp, label: 'Property Valuation', path: '/property-valuation' },
      { icon: MapPin, label: 'Compare Neighborhoods', path: '/neighborhood-compare' },
      { icon: Truck, label: 'Moving Quote', path: '/moving-quote' },
      { icon: Wrench, label: 'Find Contractors', path: '/contractors' },
      { icon: Sparkles, label: 'Report Issue', path: '/report-issue' },
      { icon: Scale, label: 'Lease Analyzer', path: '/document-analyzer' },
      { icon: Shield, label: 'AI Doc Review', path: '/document-review' },
      { icon: Navigation, label: 'Commute Search', path: '/commute-optimizer' },
      { icon: BarChart3, label: 'Analytics & Export', path: '/analytics' },
      { icon: MessageSquare, label: 'Messages', path: '/messages' },
    ],
    landlord: [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Building2, label: 'My Properties', path: '/my-properties' },
      { icon: BarChart3, label: 'Earnings', path: '/earnings' },
      { icon: CreditCard, label: 'Rent Agreements', path: '/rent-agreements' },
      { icon: Receipt, label: 'Payment History', path: '/payment-history' },
      { icon: DollarSign, label: 'Pay & Invoices', path: '/payments' },
      { icon: Calculator, label: 'Smart Pricing', path: '/smart-pricing' },
      { icon: TrendingUp, label: 'Property Valuation', path: '/property-valuation' },
      { icon: MapPin, label: 'Compare Neighborhoods', path: '/neighborhood-compare' },
      { icon: Shield, label: 'Credit Check', path: '/credit-check' },
      { icon: Wand2, label: 'Virtual Staging', path: '/virtual-staging' },
      { icon: Zap, label: 'Promote Listings', path: '/campaigns' },
      { icon: BarChart2, label: 'Analytics & Export', path: '/analytics' },
      { icon: FileText, label: 'Document Builder', path: '/document-builder' },
      { icon: Share2, label: 'Syndication', path: '/syndication' },
      { icon: Zap, label: 'AI Optimizer', path: '/listing-optimizer' },
      { icon: Users, label: 'Applications', path: '/applications' },
      { icon: Sparkles, label: 'AI Ranking', path: '/applicant-ranking' },
      { icon: FileText, label: 'E-Sign', path: '/esign' },
      { icon: Calendar, label: 'My Calendar', path: '/calendar' },
      { icon: BarChart2, label: 'Nova Insights', path: '/nova-insights' },
      { icon: Users2, label: 'Find Tenants', path: '/find-tenants' },
      { icon: Wrench, label: 'Find Contractors', path: '/contractors' },
      { icon: MessageSquare, label: 'Messages', path: '/messages' },
    ],
    contractor: [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'My Profile', path: '/contractor-profile' },
      { icon: DollarSign, label: 'Pay & Invoices', path: '/payments' },
      { icon: Image, label: 'Portfolio', path: '/portfolio' },
      { icon: Briefcase, label: 'Jobs', path: '/jobs' },
      { icon: Calendar, label: 'My Calendar', path: '/calendar' },
      { icon: BarChart2, label: 'Nova Insights', path: '/nova-insights' },
      { icon: BarChart3, label: 'Analytics & Export', path: '/analytics' },
      { icon: MessageSquare, label: 'Messages', path: '/messages' },
    ],
  };

  const currentNav = navItems[user.user_type] || navItems.renter;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0F1419] flex transition-colors">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1A2F3A] text-white transform transition-transform lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        data-testid="dashboard-sidebar"
      >
        <div className="p-6">
          <Link 
            to="/"
            className="text-2xl"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            DOMMMA
          </Link>
        </div>

        <nav className="px-4 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
          {currentNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActivePath(item.path)
                  ? 'text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {isActivePath(item.path) && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-white/20 rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <item.icon size={20} />
                <span className="text-sm">{item.label}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 space-y-2">
          <Link
            to="/settings"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActivePath('/settings')
                ? 'bg-white/20 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
            data-testid="settings-link"
          >
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </Link>
          <div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              data-testid="logout-btn"
            >
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-[#151B22] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              data-testid="mobile-menu-toggle"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h1
                className="text-xl lg:text-2xl text-[#1A2F3A] dark:text-white"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Welcome back, {user.name}!
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.user_type} Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="text-[#1A2F3A] dark:text-white" />
            <NotificationCenter userId={user.id} />
            <div className="w-10 h-10 rounded-full bg-[#1A2F3A] flex items-center justify-center text-white font-medium">
              {user.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
