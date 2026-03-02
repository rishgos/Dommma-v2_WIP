import "@/index.css";
import "@/App.css";
import "./i18n"; // i18n initialization
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";

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
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
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
          <Route path="/settings" element={<DashboardLayout><div className="p-6"><h1 className="text-2xl font-semibold">Settings</h1><p className="text-gray-500 mt-2">Settings page coming soon...</p></div></DashboardLayout>} />
          
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
  );
}

export default App;
