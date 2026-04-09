import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeIn, AnimatedCounter, StaggerChildren } from '@/components/motion';

const stats = [
  { number: 200, suffix: '+', label: 'Properties', desc: 'Premium listings across Vancouver' },
  { number: 100, suffix: '%', label: 'Happy Clients', desc: 'Satisfaction guaranteed' },
  { number: 900, suffix: 'K', label: 'Square Feet', desc: 'Managed properties' },
  { number: 50, suffix: '+', label: 'Contractors', desc: 'Verified professionals' },
];

const StatsSection = () => {
  return (
    <section className="section-lg bg-white dark:bg-[#151B22]" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left Content */}
          <FadeIn direction="left">
            <div>
              <h2
                className="display-lg text-gradient mb-6"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Architecture<br />in Motion
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Your complete real estate platform - from finding your perfect home to managing
                properties and connecting with trusted contractors. We bring innovation to every
                aspect of real estate.
              </p>
              <Link
                to="/about"
                className="flex items-center gap-2 text-[#1A2F3A] dark:text-[#C4A962] font-medium hover:gap-4 transition-all group"
              >
                <span className="text-sm tracking-wider uppercase">Our Services</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </FadeIn>

          {/* Stats Grid */}
          <StaggerChildren staggerDelay={0.1} className="grid grid-cols-2 gap-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="stat-card group p-4 rounded-2xl hover:bg-[#F5F5F0] dark:hover:bg-[#1A2332] transition-colors"
              >
                <p className="stat-number">
                  <AnimatedCounter target={stat.number} suffix={stat.suffix} />
                </p>
                <p className="text-sm font-semibold text-[#1A2F3A] dark:text-white uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.desc}</p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
