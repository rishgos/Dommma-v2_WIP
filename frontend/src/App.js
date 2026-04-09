import "@/index.css";
import "@/App.css";
import "./i18n"; // i18n initialization
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ScrollProgressBar from "@/components/layout/ScrollProgressBar";
import { PageTransition } from "@/components/motion";

// Pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Properties from "@/pages/Properties";
import Services from "@/pages/Services";
import Contact from "@/pages/Contact";
import Browse from "@/pages/Browse";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Payments from "@/pages/Payments";
import Documents from "@/pages/Documents";
import Messages from "@/pages/Messages";
import Applications from "@/pages/Applications";
import Maintenance from "@/pages/Maintenance";
import Jobs from "@/pages/Jobs";
import MyProperties from "@/pages/MyProperties";
import ContractorMarketplace from "@/pages/ContractorMarketplace";
import ContractorProfile from "@/pages/ContractorProfile";
import SmartIssueReporter from "@/pages/SmartIssueReporter";
import DocumentAnalyzer from "@/pages/DocumentAnalyzer";
import CommuteOptimizer from "@/pages/CommuteOptimizer";
import Offers from "@/pages/Offers";
import Favorites from "@/pages/Favorites";
import Compare from "@/pages/Compare";
import RoommateFinder from "@/pages/RoommateFinder";
import MovingQuote from "@/pages/MovingQuote";
import CalendarPage from "@/pages/CalendarPage";
import ContractorPortfolio from "@/pages/ContractorPortfolio";
import NovaInsights from "@/pages/NovaInsights";
import MyResume from "@/pages/MyResume";
import ApplicantRanking from "@/pages/ApplicantRanking";
import LeaseAssignments from "@/pages/LeaseAssignments";
import ESign from "@/pages/ESign";
import ListingSyndication from "@/pages/ListingSyndication";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import ListingOptimizer from "@/pages/ListingOptimizer";
import SettingsPage from "@/pages/SettingsPage";
import VerifyEmail from "@/pages/VerifyEmail";
import ClaimListing from "@/pages/ClaimListing";
import DocumentBuilder from "@/pages/DocumentBuilder";
import ServiceRequestWizard from "@/pages/ServiceRequestWizard";
import Financing from "@/pages/Financing";
import FindTenants from "@/pages/FindTenants";
import RentAgreements from "@/pages/RentAgreements";
import TenantDocReview from "@/pages/TenantDocReview";
import PropertyValuation from "@/pages/PropertyValuation";
import NeighborhoodComparison from "@/pages/NeighborhoodComparison";
import PaymentHistory from "@/pages/PaymentHistory";
import SmartRentPricing from "@/pages/SmartRentPricing";
import LandlordEarnings from "@/pages/LandlordEarnings";
import PropertyChatbot from "@/pages/PropertyChatbot";
import CreditCheck from "@/pages/CreditCheck";
import VirtualStaging from "@/pages/VirtualStaging";
import CampaignDashboard from "@/pages/CampaignDashboard";

// Layout
import DashboardLayout from "@/components/layout/DashboardLayout";

// Firebase Analytics
import { initializeFirebase, trackPageView, trackLogin } from "@/lib/firebase";

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Analytics wrapper component
function AnalyticsTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname, document.title);
  }, [location]);
  
  return null;
}

function App() {
  const [user, setUser] = useState(null);

  // Initialize Firebase and PWA on app load
  useEffect(() => {
    initializeFirebase();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
    
    // Restore user from localStorage
    const savedUser = localStorage.getItem('dommma_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('dommma_user');
      }
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('dommma_user', JSON.stringify(userData));
    // Track login event
    trackLogin('email', userData.user_type);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dommma_user');
  };

  return (
    <ThemeProvider>
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <ScrollProgressBar />
        <AnalyticsTracker />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          
          {/* Public Browse - no sidebar (for non-logged in users) */}
          <Route path="/browse" element={<Browse />} />
          
          {/* Public Contractor Pages */}
          <Route path="/contractors" element={<ContractorMarketplace />} />
          <Route path="/portfolio/:contractorId" element={<ContractorPortfolio />} />
          
          {/* Lease Assignment Marketplace - Public */}
          <Route path="/lease-assignments" element={<LeaseAssignments />} />
          
          {/* Email Verification - Public */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Claim Listing - Public */}
          <Route path="/claim-listing" element={<ClaimListing />} />
          
          {/* Financing - Public */}
          <Route path="/financing" element={<Financing />} />
          
          {/* Dashboard Routes - All with persistent sidebar */}
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/payments" element={<DashboardLayout><Payments /></DashboardLayout>} />
          <Route path="/documents" element={<DashboardLayout><Documents /></DashboardLayout>} />
          <Route path="/messages" element={<DashboardLayout><Messages /></DashboardLayout>} />
          <Route path="/applications" element={<DashboardLayout><Applications /></DashboardLayout>} />
          <Route path="/maintenance" element={<DashboardLayout><Maintenance /></DashboardLayout>} />
          <Route path="/jobs" element={<DashboardLayout><Jobs /></DashboardLayout>} />
          <Route path="/my-properties" element={<DashboardLayout><MyProperties /></DashboardLayout>} />
          <Route path="/contractor-profile" element={<DashboardLayout><ContractorProfile /></DashboardLayout>} />
          <Route path="/report-issue" element={<DashboardLayout><SmartIssueReporter /></DashboardLayout>} />
          <Route path="/document-analyzer" element={<DashboardLayout><DocumentAnalyzer /></DashboardLayout>} />
          <Route path="/commute-optimizer" element={<DashboardLayout><CommuteOptimizer /></DashboardLayout>} />
          <Route path="/offers" element={<DashboardLayout><Offers /></DashboardLayout>} />
          <Route path="/favorites" element={<DashboardLayout><Favorites /></DashboardLayout>} />
          <Route path="/compare" element={<DashboardLayout><Compare /></DashboardLayout>} />
          <Route path="/roommates" element={<DashboardLayout><RoommateFinder /></DashboardLayout>} />
          <Route path="/moving-quote" element={<DashboardLayout><MovingQuote /></DashboardLayout>} />
          <Route path="/calendar" element={<DashboardLayout><CalendarPage /></DashboardLayout>} />
          <Route path="/portfolio" element={<DashboardLayout><ContractorPortfolio /></DashboardLayout>} />
          <Route path="/nova-insights" element={<DashboardLayout><NovaInsights /></DashboardLayout>} />
          <Route path="/my-resume" element={<DashboardLayout><MyResume /></DashboardLayout>} />
          <Route path="/applicant-ranking" element={<DashboardLayout><ApplicantRanking /></DashboardLayout>} />
          <Route path="/esign" element={<DashboardLayout><ESign /></DashboardLayout>} />
          <Route path="/document-builder" element={<DocumentBuilder />} />
          <Route path="/syndication" element={<DashboardLayout><ListingSyndication /></DashboardLayout>} />
          <Route path="/analytics" element={<DashboardLayout><AnalyticsDashboard /></DashboardLayout>} />
          <Route path="/listing-optimizer" element={<DashboardLayout><ListingOptimizer /></DashboardLayout>} />
          <Route path="/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
          <Route path="/find-tenants" element={<DashboardLayout><FindTenants /></DashboardLayout>} />
          <Route path="/rent-agreements" element={<RentAgreements />} />
          <Route path="/document-review" element={<DashboardLayout><TenantDocReview /></DashboardLayout>} />
          <Route path="/property-valuation" element={<DashboardLayout><PropertyValuation /></DashboardLayout>} />
          <Route path="/neighborhood-compare" element={<DashboardLayout><NeighborhoodComparison /></DashboardLayout>} />
          <Route path="/payment-history" element={<DashboardLayout><PaymentHistory /></DashboardLayout>} />
          <Route path="/smart-pricing" element={<DashboardLayout><SmartRentPricing /></DashboardLayout>} />
          <Route path="/earnings" element={<DashboardLayout><LandlordEarnings /></DashboardLayout>} />
          <Route path="/property-search" element={<PropertyChatbot />} />
          <Route path="/credit-check" element={<DashboardLayout><CreditCheck /></DashboardLayout>} />
          <Route path="/virtual-staging" element={<DashboardLayout><VirtualStaging /></DashboardLayout>} />
          <Route path="/campaigns" element={<DashboardLayout><CampaignDashboard /></DashboardLayout>} />
          
          {/* Legacy routes - redirect to new paths */}
          <Route path="/dashboard/payments" element={<DashboardLayout><Payments /></DashboardLayout>} />
          <Route path="/dashboard/documents" element={<DashboardLayout><Documents /></DashboardLayout>} />
          <Route path="/dashboard/messages" element={<DashboardLayout><Messages /></DashboardLayout>} />
          <Route path="/dashboard/applications" element={<DashboardLayout><Applications /></DashboardLayout>} />
          <Route path="/dashboard/maintenance" element={<DashboardLayout><Maintenance /></DashboardLayout>} />
          <Route path="/dashboard/jobs" element={<DashboardLayout><Jobs /></DashboardLayout>} />
          <Route path="/dashboard/my-properties" element={<DashboardLayout><MyProperties /></DashboardLayout>} />
          <Route path="/dashboard/contractor-profile" element={<DashboardLayout><ContractorProfile /></DashboardLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
