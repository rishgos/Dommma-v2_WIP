import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Loader2, Home, MapPin, 
  DollarSign, Bed, Bath, Lock, User, ArrowRight
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const ClaimListing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [status, setStatus] = useState('loading'); // loading, found, claiming, success, error
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      fetchListingInfo(token);
    } else {
      setStatus('error');
      setError('No claim token provided.');
    }
  }, [token]);

  const fetchListingInfo = async (claimToken) => {
    try {
      const response = await axios.get(`${API}/api/listings/claim?token=${claimToken}`);
      setListing(response.data);
      setStatus('found');
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.detail || 'Invalid or expired claim link.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setStatus('claiming');
    setError('');

    try {
      const response = await axios.post(`${API}/api/listings/claim`, {
        token,
        password: formData.password,
        name: formData.name
      });

      if (response.data.success) {
        // Auto-login the user
        login(response.data.user);
        setStatus('success');
        
        // Redirect to my properties after 2 seconds
        setTimeout(() => {
          navigate('/my-properties');
        }, 2000);
      }
    } catch (err) {
      setStatus('found');
      setError(err.response?.data?.detail || 'Failed to claim listing. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#1A2F3A] p-6 text-center">
            <Home className="w-12 h-12 text-white mx-auto mb-2" />
            <h1 className="text-2xl text-white font-serif">DOMMMA</h1>
            <p className="text-white/70 text-sm mt-1">Claim Your Listing</p>
          </div>
          
          {/* Content */}
          <div className="p-8">
            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-[#1A2F3A] animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading your listing...</p>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center py-8">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#1A2F3A] mb-2">Claim Failed</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-[#1A2F3A] text-white rounded-full hover:bg-[#2C4A52] transition-colors"
                >
                  Go to Home
                </button>
              </div>
            )}

            {/* Listing Found - Show Form */}
            {status === 'found' && listing && (
              <>
                {/* Listing Preview */}
                <div className="bg-gradient-to-r from-[#1A2F3A]/5 to-[#2C4A52]/5 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-[#1A2F3A] mb-3">Your Listing</h3>
                  <div className="space-y-2">
                    <p className="font-medium text-lg text-[#1A2F3A]">{listing.title}</p>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin size={14} />
                      <span>{listing.address}, {listing.city}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-[#1A2F3A] font-semibold">
                        <DollarSign size={14} />
                        ${listing.price?.toLocaleString()}/mo
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <Bed size={14} />
                        {listing.bedrooms} bed
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <Bath size={14} />
                        {listing.bathrooms} bath
                      </span>
                    </div>
                  </div>
                </div>

                {/* Claim Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Create your landlord account to publish this listing. Your email: 
                      <span className="font-medium text-[#1A2F3A]"> {listing.claim_email}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User size={14} className="inline mr-1" />
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Lock size={14} className="inline mr-1" />
                      Create Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Lock size={14} className="inline mr-1" />
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none"
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] transition-colors flex items-center justify-center gap-2"
                  >
                    Claim & Publish Listing
                    <ArrowRight size={18} />
                  </button>
                </form>
              </>
            )}

            {/* Claiming State */}
            {status === 'claiming' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-[#1A2F3A] animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Creating your account and publishing listing...</p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#1A2F3A] mb-2">Listing Published!</h2>
                <p className="text-gray-600 mb-2">Your account has been created and your listing is now live.</p>
                <p className="text-sm text-gray-400">Redirecting to your properties...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimListing;
