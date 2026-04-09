import { motion, useReducedMotion } from 'framer-motion';
import { fadeInUp } from '@/lib/motion';

const ScrollReveal = ({
  children,
  variants = fadeInUp,
  once = true,
  className = '',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-60px' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
