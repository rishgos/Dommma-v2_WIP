import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('no-token');
      setMessage('No verification token provided.');
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail(data.email);
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    
    setResending(true);
    setResendMessage('');
    
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail })
      });
      const data = await response.json();
      
      if (response.ok) {
        setResendMessage(data.message);
      } else {
        setResendMessage(data.detail || 'Failed to resend verification email');
      }
    } catch (error) {
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#1A2F3A] p-6 text-center">
            <h1 className="text-2xl text-white font-serif">DOMMMA</h1>
            <p className="text-white/70 text-sm mt-1">Email Verification</p>
          </div>
          
          {/* Content */}
          <div className="p-8">
            {status === 'verifying' && (
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-[#1A2F3A] animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#1A2F3A] mb-2">Verifying your email...</h2>
                <p className="text-gray-500">Please wait while we verify your email address.</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#1A2F3A] mb-2">Email Verified!</h2>
                <p className="text-gray-500 mb-6">{message}</p>
                <p className="text-sm text-gray-400 mb-4">Redirecting to login...</p>
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-full hover:bg-[#2C4A52] transition-colors"
                >
                  Go to Login <ArrowRight size={18} />
                </Link>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-center">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#1A2F3A] mb-2">Verification Failed</h2>
                <p className="text-gray-500 mb-6">{message}</p>
                
                {/* Resend verification form */}
                <div className="bg-gray-50 rounded-xl p-4 mt-6">
                  <p className="text-sm text-gray-600 mb-3">Need a new verification link?</p>
                  <form onSubmit={handleResendVerification} className="space-y-3">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
                      required
                    />
                    <button
                      type="submit"
                      disabled={resending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] disabled:opacity-50 transition-colors"
                    >
                      {resending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail size={18} />
                      )}
                      Resend Verification Email
                    </button>
                  </form>
                  {resendMessage && (
                    <p className="text-sm text-green-600 mt-2">{resendMessage}</p>
                  )}
                </div>
              </div>
            )}
            
            {status === 'no-token' && (
              <div className="text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Verification Token</h2>
                <p className="text-gray-500 mb-6">{message}</p>
                
                {/* Resend verification form */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-3">Enter your email to receive a verification link:</p>
                  <form onSubmit={handleResendVerification} className="space-y-3">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
                      required
                    />
                    <button
                      type="submit"
                      disabled={resending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] disabled:opacity-50 transition-colors"
                    >
                      {resending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail size={18} />
                      )}
                      Send Verification Email
                    </button>
                  </form>
                  {resendMessage && (
                    <p className="text-sm text-green-600 mt-2">{resendMessage}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <Link to="/login" className="text-sm text-[#1A2F3A] hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
