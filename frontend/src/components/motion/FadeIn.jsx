import { motion, useReducedMotion } from 'framer-motion';
import { duration, easing } from '@/lib/motion';

const directionOffset = {
  up: { y: 30 },
  down: { y: -30 },
  left: { x: -30 },
  right: { x: 30 },
  none: {},
};

const FadeIn = ({
  children,
  direction = 'up',
  delay = 0,
  distance,
  once = true,
  className = '',
  as = 'div',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  const offset = distance
    ? direction === 'up' ? { y: distance } :
      direction === 'down' ? { y: -distance } :
      direction === 'left' ? { x: -distance } :
      direction === 'right' ? { x: distance } : {}
    : directionOffset[direction] || {};

  if (shouldReduceMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <Component
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-50px' }}
      transition={{
        duration: duration.slow,
        ease: easing.easeOut,
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
};

export default FadeIn;
