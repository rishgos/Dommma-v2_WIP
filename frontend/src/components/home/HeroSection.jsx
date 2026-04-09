import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TextReveal, GradientOrbs } from '@/components/motion';

const HeroSection = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden"
      data-testid="hero-section"
    >
      {/* Video Background with Parallax */}
      <motion.div
        className="absolute inset-0 bg-[#1A2F3A]"
        style={{ y: shouldReduceMotion ? 0 : videoY }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
          poster="https://customer-assets.emergentagent.com/job_property-ai-hub-3/artifacts/8ejxvmv4_1.jpg"
          style={{ filter: 'brightness(0.75)' }}
          ref={(el) => {
            if (el && !el._initialized) {
              el._initialized = true;
              el.addEventListener('timeupdate', function () {
                const timeLeft = this.duration - this.currentTime;
                if (timeLeft <= 0.8 && timeLeft > 0) this.style.opacity = timeLeft / 0.8;
                else if (this.currentTime < 0.8) this.style.opacity = Math.min(1, this.currentTime / 0.8);
                else this.style.opacity = 1;
              });
            }
          }}
        >
          <source src="/videos/hero-vancouver.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A2F3A]/95 via-[#1A2F3A]/70 to-[#1A2F3A]/30" />
      </motion.div>

      {/* Ambient orbs */}
      <GradientOrbs
        orbs={[
          { color: 'rgba(196, 169, 98, 0.15)', size: 500, x: '60%', y: '20%', delay: 0 },
          { color: 'rgba(44, 74, 82, 0.2)', size: 400, x: '20%', y: '70%', delay: 3 },
        ]}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-28"
        style={{ y: shouldReduceMotion ? 0 : textY, opacity: shouldReduceMotion ? 1 : opacity }}
      >
        <div className="max-w-2xl">
          <TextReveal
            text={t('hero.title')}
            as="h1"
            className="display-xl text-white mb-6 uppercase"
            staggerDelay={0.06}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-lg text-white/70 mb-10 max-w-md leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex items-center gap-6"
          >
            <Link
              to="/browse"
              className="group px-8 py-4 bg-white text-[#1A2F3A] rounded-full text-sm font-medium
                         hover:bg-white/90 transition-all hover:shadow-xl hover:shadow-white/20
                         hover:-translate-y-0.5"
              data-testid="hero-cta"
            >
              {t('hero.browseProperties')}
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 border border-white/30 text-white rounded-full text-sm font-medium
                         hover:bg-white/10 transition-all"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F5F5F0] dark:from-[#0F1419] to-transparent z-10" />
    </section>
  );
};

export default HeroSection;
