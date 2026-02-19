import "@/index.css";
import "@/App.css";
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

  // Initialize Firebase on app load
  useEffect(() => {
    initializeFirebase();
    
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
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/payments" element={<Payments />} />
          <Route path="/dashboard/documents" element={<Documents />} />
          <Route path="/dashboard/messages" element={<Messages />} />
          <Route path="/dashboard/applications" element={<Applications />} />
          <Route path="/dashboard/maintenance" element={<Maintenance />} />
          <Route path="/dashboard/jobs" element={<Jobs />} />
          <Route path="/dashboard/my-properties" element={<MyProperties />} />
          <Route path="/dashboard/contractor-profile" element={<ContractorProfile />} />
          <Route path="/contractors" element={<ContractorMarketplace />} />
          <Route path="/report-issue" element={<SmartIssueReporter />} />
          <Route path="/document-analyzer" element={<DocumentAnalyzer />} />
          <Route path="/commute-optimizer" element={<CommuteOptimizer />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/roommates" element={<RoommateFinder />} />
          <Route path="/moving-quote" element={<MovingQuote />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/portfolio" element={<ContractorPortfolio />} />
          <Route path="/portfolio/:contractorId" element={<ContractorPortfolio />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
