import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Mic, Globe, Brain, MessageSquare, Calendar, Calculator, Headphones, ArrowRight, Check, Search, Sparkles, Heart, Home as HomeIcon } from 'lucide-react';

const stats = [
  { number: '15', label: 'AI Features' },
  { number: '8', label: 'Languages' },
  { number: '24/7', label: 'Available' },
  { number: '$0', label: 'For Renters' },
];

const aiFeatures = [
  { icon: Brain, title: 'Smart Match', desc: 'AI matches you with perfect properties based on your preferences' },
  { icon: Mic, title: 'Voice Search', desc: 'Just speak naturally - Nova understands what you need' },
  { icon: Globe, title: 'Multi-Language', desc: 'Search and chat in 8 different languages' },
  { icon: Search, title: 'Honest Analysis', desc: 'Get unbiased insights on every listing' },
  { icon: MessageSquare, title: 'Rent Coach', desc: 'Negotiate better deals with AI guidance' },
  { icon: Calendar, title: 'Move Planner', desc: 'AI-powered moving timeline and checklist' },
  { icon: Calculator, title: 'Budget Calculator', desc: 'Know exactly what you can afford' },
  { icon: Headphones, title: 'Virtual Assistant', desc: '24/7 support for all your questions' },
];

const audiences = [
  {
    badge: 'FREE FOREVER',
    title: 'Renters',
    features: ['15 AI-powered search tools', 'Smart property matching', 'Neighborhood insights', 'Application assistance', 'Move planning help'],
    cta: 'Start Searching',
    link: '/browse'
  },
  {
    badge: 'COMING SOON',
    title: 'Buyers',
    features: ['Market analysis tools', 'Price predictions', 'Investment calculator', 'Mortgage comparisons', 'Agent connections'],
    cta: 'Join Waitlist',
    link: '#'
  },
  {
    badge: 'FROM $49/MO',
    title: 'Landlords',
    features: ['Smart listing creation', 'Tenant screening', 'Rent collection', 'Maintenance tracking', 'Multi-property dashboard'],
    cta: 'View Plans',
    link: '/pricing'
  },
  {
    badge: 'NO COMMISSIONS',
    title: 'Contractors',
    features: ['Direct client access', 'Job management tools', 'Review building', 'Scheduling system', 'Payment processing'],
    cta: 'Join Network',
    link: '/contractors'
  },
];

const steps = [
  { num: '01', title: 'Tell Nova', desc: 'Share what you are looking for in natural language' },
  { num: '02', title: 'Get Matches', desc: 'Nova finds properties that match your exact criteria' },
  { num: '03', title: 'Make Decisions', desc: 'Compare listings with AI-powered insights' },
  { num: '04', title: 'Move In', desc: 'Let Nova help you with the entire process' },
];

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section 
        className="min-h-screen flex items-center section-padding pt-32"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4fd1c5 100%)' }}
        data-testid="hero-section"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="fade-in-up">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <span className="w-2 h-2 rounded-full bg-[#4fd1c5] animate-pulse" />
                <span className="text-white text-sm font-medium tracking-wider">INNOVATION</span>
              </div>
              
              <h1 
                className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none mb-8 uppercase"
                style={{ fontFamily: 'Playfair Display, serif' }}
                data-testid="hero-title"
              >
                HOME<br />MADE<br />SIMPLE
              </h1>
              
              <p className="text-xl text-white/80 mb-10 max-w-lg font-light leading-relaxed">
                Find your perfect rental with Nova, our AI-powered assistant. Smart search, honest insights, and zero cost for renters.
              </p>
              
              <Link
                to="/browse"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-[#667eea] font-bold text-lg hover:scale-105 transition-transform shadow-xl"
                data-testid="hero-cta"
              >
                Start Searching
                <ArrowRight size={20} />
              </Link>
            </div>

            {/* Visual Element */}
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* Layered Cards */}
                <div 
                  className="absolute top-8 left-8 w-80 h-48 bg-white rounded-2xl shadow-xl"
                  style={{ transform: 'rotate(-5deg)' }}
                />
                <div 
                  className="absolute top-4 left-4 w-80 h-48 bg-white rounded-2xl shadow-xl"
                  style={{ transform: 'rotate(-2deg)' }}
                />
                <div className="relative w-80 h-48 bg-white rounded-2xl shadow-xl p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                      <HomeIcon className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Modern Condo</p>
                      <p className="text-sm text-gray-500">Downtown Vancouver</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-[#667eea]">$2,800<span className="text-sm font-normal text-gray-500">/mo</span></p>
                    <div className="flex items-center gap-1 text-[#4fd1c5]">
                      <Sparkles size={16} />
                      <span className="text-sm font-medium">95% Match</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-8 bg-white" data-testid="stats-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p 
                  className="text-5xl md:text-6xl lg:text-7xl font-bold mb-2 gradient-text"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {stat.number}
                </p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nova Introduction */}
      <section className="section-padding bg-[#f7fafc]" data-testid="nova-intro-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex items-center justify-center">
              <div 
                className="w-64 h-64 rounded-full flex items-center justify-center text-8xl"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)' }}
              >
                🤖
              </div>
            </div>
            <div>
              <h2 
                className="text-4xl md:text-5xl font-bold mb-6"
                style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
              >
                MEET NOVA
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                Nova is your AI-powered real estate assistant. Ask questions in plain English (or 7 other languages), get personalized property recommendations, and receive honest analysis on every listing. It's like having a real estate expert in your pocket - available 24/7.
              </p>
              <button 
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                data-testid="chat-with-nova-btn"
                onClick={() => document.querySelector('[data-testid="nova-chat-button"]')?.click()}
              >
                <Bot size={20} />
                Chat with Nova
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Grid */}
      <section className="section-padding bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            AI-POWERED FEATURES
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map((feature, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl bg-white border border-gray-100 card-hover"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#1a202c' }}>{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built For Everyone */}
      <section 
        className="section-padding"
        style={{ background: '#1a202c' }}
        data-testid="audience-section"
      >
        <div className="max-w-7xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-white"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            BUILT FOR EVERYONE
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((audience, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:border-[#667eea] hover:-translate-y-2"
              >
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-[#667eea]/20 text-[#667eea]">
                  {audience.badge}
                </span>
                <h3 
                  className="text-2xl font-bold text-white mb-4"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {audience.title}
                </h3>
                <ul className="space-y-3 mb-6">
                  {audience.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-400 text-sm">
                      <Check size={16} className="text-[#4fd1c5] mt-0.5 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  to={audience.link}
                  className="inline-flex items-center gap-2 text-white font-medium hover:text-[#4fd1c5] transition-colors"
                >
                  {audience.cta}
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-white" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            HOW IT WORKS
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <span 
                  className="text-8xl font-bold absolute -top-4 -left-2 opacity-10"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#667eea' }}
                >
                  {step.num}
                </span>
                <div className="relative pt-12">
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
