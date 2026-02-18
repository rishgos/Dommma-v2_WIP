import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Mail, Phone, MapPin, Send, Check } from 'lucide-react';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-[#1A2F3A]" data-testid="contact-hero">
        <div className="max-w-7xl mx-auto px-6 py-32">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Contact</p>
          <h1 className="display-xl text-white mb-6">Get In<br />Touch</h1>
          <p className="text-lg text-white/70 max-w-md">Have questions? We'd love to hear from you.</p>
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
                  <p className="text-gray-600">We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-2">Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="John Doe" data-testid="contact-name" /></div>
                    <div><label className="block text-sm text-gray-600 mb-2">Email</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="you@example.com" data-testid="contact-email" /></div>
                  </div>
                  <div><label className="block text-sm text-gray-600 mb-2">Subject</label><input type="text" required value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="How can we help?" data-testid="contact-subject" /></div>
                  <div><label className="block text-sm text-gray-600 mb-2">Message</label><textarea required rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none" placeholder="Your message..." data-testid="contact-message" /></div>
                  <button type="submit" className="btn-dark w-full flex items-center justify-center gap-2" data-testid="contact-submit">Send Message <Send size={16} /></button>
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
