import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Mail, Phone, MapPin, Send, Check, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${BACKEND_URL}/api/contact`, formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again or email us directly.');
      console.error('Contact form error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] py-16 px-4" data-testid="contact-hero">
        <div className="max-w-6xl mx-auto text-center text-white">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Contact</p>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Get In Touch</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">Have questions? We'd love to hear from you.</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-lg bg-[#F5F5F0]" data-testid="contact-form-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl text-[#1A2F3A] mb-8" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center"><Mail className="text-[#1A2F3A]" size={20} /></div>
                  <div><p className="font-medium text-[#1A2F3A]">Email</p><a href="mailto:hello@dommma.com" className="text-gray-600 hover:text-[#1A2F3A]">hello@dommma.com</a></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center"><Phone className="text-[#1A2F3A]" size={20} /></div>
                  <div><p className="font-medium text-[#1A2F3A]">Phone</p><a href="tel:+16041234567" className="text-gray-600 hover:text-[#1A2F3A]">+1 604 123 4567</a></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1A2F3A]/10 flex items-center justify-center"><MapPin className="text-[#1A2F3A]" size={20} /></div>
                  <div><p className="font-medium text-[#1A2F3A]">Office</p><p className="text-gray-600">123 West Georgia St<br />Vancouver, BC V6B 1J5</p></div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white p-8 rounded-2xl">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Check size={32} className="text-green-600" /></div>
                  <h3 className="text-2xl text-[#1A2F3A] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Message Sent!</h3>
                  <p className="text-gray-600 mb-4">Thank you for reaching out to us.</p>
                  <p className="text-gray-500 text-sm">Our team is reviewing your request and will get back to you within 3-5 business days.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-2">Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="John Doe" data-testid="contact-name" /></div>
                    <div><label className="block text-sm text-gray-600 mb-2">Email</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="you@example.com" data-testid="contact-email" /></div>
                  </div>
                  <div><label className="block text-sm text-gray-600 mb-2">Subject</label><input type="text" required value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="How can we help?" data-testid="contact-subject" /></div>
                  <div><label className="block text-sm text-gray-600 mb-2">Message</label><textarea required rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none" placeholder="Your message..." data-testid="contact-message" /></div>
                  <button type="submit" disabled={loading} className="btn-dark w-full flex items-center justify-center gap-2 disabled:opacity-50" data-testid="contact-submit">
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Send Message <Send size={16} /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Contact;
