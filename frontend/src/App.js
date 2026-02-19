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
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
