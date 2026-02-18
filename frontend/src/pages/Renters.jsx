import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Mic, Globe, Search, MessageSquare, Map, Calendar, Bell, FileText, BarChart3, Calculator, Heart, Video, Brain, ArrowRight } from 'lucide-react';

const features = [
  {
    num: '01',
    icon: Bot,
    title: 'Nova AI Chatbot',
    desc: 'Chat naturally with Nova to find properties. Just say "I need a 2-bedroom near downtown with a gym" and Nova does the rest.',
    tags: ['Natural Language', '24/7 Available', 'Instant Results']
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'Smart Match Scores',
    desc: 'Every property gets a personalized match score based on YOUR preferences. See at a glance which listings are worth your time.',
    tags: ['Personalized', 'Time-Saving', 'Data-Driven']
  },
  {
    num: '03',
    icon: Mic,
    title: 'Voice Search',
    desc: 'Too busy to type? Just speak naturally and Nova will find what you are looking for. Perfect for searching on the go.',
    tags: ['Hands-Free', 'Quick', 'Convenient']
  },
  {
    num: '04',
    icon: Globe,
    title: 'Multi-Language Support',
    desc: 'Search and chat in English, French, Mandarin, Cantonese, Punjabi, Hindi, Korean, or Spanish.',
    tags: ['8 Languages', 'Inclusive', 'Accessible']
  },
  {
    num: '05',
    icon: Search,
    title: 'Honest Listing Analysis',
    desc: 'Nova gives you unbiased insights on every listing - the good, the bad, and everything in between.',
    tags: ['Transparent', 'Unbiased', 'Detailed']
  },
  {
    num: '06',
    icon: MessageSquare,
    title: 'Rent Negotiation Coach',
    desc: 'Get AI-powered tips on how to negotiate better rental terms. Know what to ask for and when.',
    tags: ['Save Money', 'Expert Tips', 'Confidence']
  },
  {
    num: '07',
    icon: Map,
    title: 'Neighborhood Explorer',
    desc: 'Learn everything about a neighborhood before you visit - transit, schools, safety, restaurants, and more.',
    tags: ['Local Insights', 'Safety Scores', 'Amenities']
  },
  {
    num: '08',
    icon: Calendar,
    title: 'AI Move Planner',
    desc: 'From viewing to moving day, Nova creates a personalized timeline and checklist for your move.',
    tags: ['Organized', 'Step-by-Step', 'Stress-Free']
  },
  {
    num: '09',
    icon: Bell,
    title: 'Smart Alerts',
    desc: 'Get notified instantly when new listings match your criteria. Never miss your dream home again.',
    tags: ['Real-Time', 'Customizable', 'Proactive']
  },
  {
    num: '10',
    icon: FileText,
    title: 'Application Helper',
    desc: 'Nova helps you create compelling rental applications that stand out from the crowd.',
    tags: ['Templates', 'Tips', 'Stand Out']
  },
  {
    num: '11',
    icon: BarChart3,
    title: 'Property Comparison',
    desc: 'Compare multiple properties side by side. See all the details that matter in one view.',
    tags: ['Side-by-Side', 'Detailed', 'Easy']
  },
  {
    num: '12',
    icon: Calculator,
    title: 'Budget Calculator',
    desc: 'Know exactly what you can afford. Factor in all costs including utilities, parking, and more.',
    tags: ['Comprehensive', 'Realistic', 'Planning']
  },
  {
    num: '13',
    icon: Heart,
    title: 'Smart Favorites',
    desc: 'Save and organize your favorite listings. Nova will track changes and notify you of updates.',
    tags: ['Organized', 'Tracking', 'Updates']
  },
  {
    num: '14',
    icon: Video,
    title: 'Virtual Viewing Assistant',
    desc: 'During virtual tours, Nova provides real-time insights and suggests questions to ask.',
    tags: ['Real-Time', 'Interactive', 'Informed']
  },
  {
    num: '15',
    icon: Brain,
    title: 'AI Memory System',
    desc: 'Nova remembers your preferences and past searches to get smarter over time. The more you use it, the better it gets.',
    tags: ['Learns', 'Personalized', 'Improves']
  },
];

const Renters = () => {
  return (
    <div>
      {/* Hero Section */}
      <section 
        className="min-h-[60vh] flex items-center section-padding pt-32"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4fd1c5 100%)' }}
        data-testid="renters-hero"
      >
        <div className="max-w-7xl mx-auto w-full text-center">
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
            data-testid="renters-title"
          >
            15 AI TOOLS TO FIND<br />YOUR PERFECT HOME
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Free forever. No credit card required.
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-[#667eea] font-bold text-lg hover:scale-105 transition-transform shadow-xl"
            data-testid="renters-cta"
          >
            Start Searching Free
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features List */}
      <section className="section-padding bg-white" data-testid="renters-features">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="grid grid-cols-[80px_1fr] gap-6 p-8 rounded-2xl border border-gray-100 transition-all duration-300 hover:border-[#667eea] hover:translate-x-2"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
              >
                {/* Number */}
                <div className="relative">
                  <span 
                    className="text-7xl font-bold opacity-20"
                    style={{ fontFamily: 'Playfair Display, serif', color: '#667eea' }}
                  >
                    {feature.num}
                  </span>
                </div>
                
                {/* Content */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                      <feature.icon className="text-white" size={20} />
                    </div>
                    <h3 
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Playfair Display, serif', color: '#1a202c' }}
                    >
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">{feature.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.tags.map((tag, j) => (
                      <span 
                        key={j}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-[#f7fafc] text-[#667eea]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="section-padding text-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        data-testid="renters-cta-section"
      >
        <div className="max-w-3xl mx-auto">
          <h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            READY TO FIND YOUR HOME?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            All 15 features are completely free for renters. Start searching with Nova today.
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-[#667eea] font-bold text-lg hover:scale-105 transition-transform shadow-xl"
            data-testid="renters-bottom-cta"
          >
            Start Searching with Nova
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Renters;
