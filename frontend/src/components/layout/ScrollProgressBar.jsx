import { motion, useScroll, useReducedMotion } from 'framer-motion';

const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left"
      style={{
        scaleX: scrollYProgress,
        background: 'linear-gradient(90deg, #1A2F3A 0%, #2C4A52 50%, #C4A962 100%)',
      }}
    />
  );
};

export default ScrollProgressBar;
