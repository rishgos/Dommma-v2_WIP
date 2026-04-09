// DOMMMA Motion Design System
// Centralized animation constants for Framer Motion

// Spring configurations
export const springGentle = { type: "spring", stiffness: 120, damping: 20 };
export const springSnappy = { type: "spring", stiffness: 300, damping: 30 };
export const springBouncy = { type: "spring", stiffness: 400, damping: 25, mass: 0.8 };

// Duration presets (seconds)
export const duration = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.7,
  xslow: 1.0,
};

// Easing presets (cubic bezier arrays)
export const easing = {
  easeOut: [0.16, 1, 0.3, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  overshoot: [0.34, 1.56, 0.64, 1],
};

// Stagger presets
export const stagger = {
  fast: 0.04,
  normal: 0.08,
  slow: 0.12,
};

// Reusable variant sets
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal, ease: easing.easeOut } },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easing.easeOut } },
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easing.easeOut } },
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: easing.easeOut } },
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: easing.easeOut } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.normal, ease: easing.overshoot } },
};

export const staggerContainer = (staggerDelay = stagger.normal) => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
};

// Page transition variants
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easing.easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};
