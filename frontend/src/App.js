import "@/index.css";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingLayout from "@/components/layout/LandingLayout";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Renters from "@/pages/Renters";
import Landlords from "@/pages/Landlords";
import Contractors from "@/pages/Contractors";
import Pricing from "@/pages/Pricing";
import Browse from "@/pages/Browse";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Pages with Layout */}
        <Route path="/" element={<LandingLayout><Home /></LandingLayout>} />
        <Route path="/about" element={<LandingLayout><About /></LandingLayout>} />
        <Route path="/renters" element={<LandingLayout><Renters /></LandingLayout>} />
        <Route path="/landlords" element={<LandingLayout><Landlords /></LandingLayout>} />
        <Route path="/contractors" element={<LandingLayout><Contractors /></LandingLayout>} />
        <Route path="/pricing" element={<LandingLayout><Pricing /></LandingLayout>} />
        
        {/* Browse Page (No Landing Layout) */}
        <Route path="/browse" element={<Browse />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
