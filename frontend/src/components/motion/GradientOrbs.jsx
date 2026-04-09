import { motion, useReducedMotion } from 'framer-motion';

const defaultOrbs = [
  { color: 'rgba(26, 47, 58, 0.3)', size: 400, x: '10%', y: '20%', delay: 0 },
  { color: 'rgba(196, 169, 98, 0.2)', size: 350, x: '70%', y: '60%', delay: 2 },
  { color: 'rgba(44, 74, 82, 0.25)', size: 300, x: '50%', y: '10%', delay: 4 },
];

const GradientOrbs = ({
  orbs = defaultOrbs,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            left: orb.x,
            top: orb.y,
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
};

export default GradientOrbs;
