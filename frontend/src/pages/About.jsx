import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Heart, Eye, Lightbulb, Brain, Check, ArrowRight } from 'lucide-react';

const stats = [
  { number: '15', label: 'AI Features' },
  { number: '8', label: 'Languages' },
  { number: '24/7', label: 'Available' },
  { number: '$0', label: 'For Renters' },
];

const values = [
  { icon: Brain, title: 'AI-First', desc: 'We believe artificial intelligence can make finding a home easier and more transparent for everyone.' },
  { icon: Eye, title: 'Transparency', desc: 'No hidden fees, no biased recommendations. Just honest insights to help you make informed decisions.' },
  { icon: Heart, title: 'Accessibility', desc: 'Real estate tools should be available to everyone, regardless of budget or background.' },
  { icon: Lightbulb, title: 'Innovation', desc: 'We are constantly pushing boundaries to create the best rental experience possible.' },
];

const workCards = [
  { title: 'Technology', desc: 'We use cutting-edge AI to analyze thousands of listings and match you with properties that truly fit your needs.' },
  { title: 'Mission', desc: 'To democratize real estate by making professional-grade tools accessible to everyone at no cost to renters.' },
  { title: 'Vision', desc: 'A world where finding the perfect home is as simple as having a conversation with a trusted friend.' },
];

const novaFeatures = [
  'Natural language property search',
  '8 language support',
  'Honest listing analysis',
  'Personalized recommendations',
  'Market insights and trends',
  'Move planning assistance',
];

const About = () => {
  return (
    <div>
      {/* Hero Section */}
      <section 
        className="min-h-[70vh] flex items-center section-padding pt-32"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4fd1c5 100%)' }}
        data-testid="about-hero"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
              About Us
            </span>
            <h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-8"
              style={{ fontFamily: 'Playfair Display, serif' }}
              data-testid="about-title"
            >
              BUILDING THE FUTURE OF REAL ESTATE
            </h1>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm">
                <p className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {stat.number}
                </p>
                <p className="text-white/80 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding bg-white" data-testid="story-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <h2 
                className="text-4xl md:text-5xl font-bold"
                style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
              >
                OUR STORY
              </h2>
            </div>
            <div className="lg:col-span-2 space-y-6 text-lg text-gray-600 leading-relaxed">
              <p>
                DOMMMA was born from a simple frustration: finding a rental shouldn't feel like a full-time job. As renters ourselves, we experienced the endless scrolling, misleading listings, and overwhelming process firsthand.
              </p>
              <p>
                We asked ourselves: what if finding a home was as easy as telling a friend what you're looking for? That question led us to Nova, our AI assistant who understands natural language and actually knows what makes a good home.
              </p>
              <p>
                Today, DOMMMA is more than just a listing platform. We're building tools that level the playing field - giving renters access to insights that were once only available to real estate professionals, completely free of charge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-[#f7fafc]" data-testid="values-section">
        <div className="max-w-7xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            OUR VALUES
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, i) => (
              <div 
                key={i}
                className="p-8 rounded-2xl bg-white border border-gray-100 card-hover"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <value.icon className="text-white" size={28} />
                </div>
                <h3 
                  className="text-2xl font-bold mb-3"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
                >
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="section-padding bg-white" data-testid="how-we-work-section">
        <div className="max-w-7xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
          >
            HOW WE WORK
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {workCards.map((card, i) => (
              <div 
                key={i}
                className="p-8 rounded-2xl border-2 border-gray-100 hover:border-[#667eea] transition-colors"
              >
                <h3 
                  className="text-xl font-bold mb-4"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
                >
                  {card.title}
                </h3>
                <p className="text-gray-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Nova Section */}
      <section 
        className="section-padding"
        style={{ background: '#1a202c' }}
        data-testid="meet-nova-section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 
                className="text-4xl md:text-5xl font-bold text-white mb-8"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                MEET NOVA
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Nova is the AI heart of DOMMMA. Built to understand not just what you say, but what you mean.
              </p>
              <ul className="space-y-4 mb-10">
                {novaFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="text-[#4fd1c5]" size={20} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)' }}
                onClick={() => document.querySelector('[data-testid="nova-chat-button"]')?.click()}
                data-testid="about-chat-nova-btn"
              >
                <Bot size={20} />
                Chat with Nova
              </button>
            </div>
            <div className="flex items-center justify-center">
              <div 
                className="w-72 h-72 rounded-full flex items-center justify-center text-9xl"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)' }}
              >
                🤖
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="section-padding text-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        data-testid="about-cta-section"
      >
        <div className="max-w-3xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-white mb-8"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            READY TO GET STARTED?
          </h2>
          <Link
            to="/browse"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-[#667eea] font-bold text-lg hover:scale-105 transition-transform shadow-xl"
            data-testid="about-cta-btn"
          >
            Start Searching
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
