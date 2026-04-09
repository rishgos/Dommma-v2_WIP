import { motion, useReducedMotion } from 'framer-motion';
import { stagger, duration, easing } from '@/lib/motion';

const StaggerChildren = ({
  children,
  staggerDelay = stagger.normal,
  once = true,
  className = '',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.normal, ease: easing.easeOut },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-30px' }}
      className={className}
      {...props}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={child?.key || i} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
};

export default StaggerChildren;
