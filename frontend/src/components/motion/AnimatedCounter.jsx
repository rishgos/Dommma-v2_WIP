import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

const AnimatedCounter = ({
  target,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  const numericTarget = typeof target === 'string'
    ? parseFloat(target.replace(/[^0-9.]/g, ''))
    : target;

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(numericTarget);
    }
  }, [isInView, numericTarget, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [springValue]);

  if (shouldReduceMotion) {
    const formatted = decimals > 0
      ? numericTarget.toFixed(decimals)
      : Math.round(numericTarget).toLocaleString();
    return <span ref={ref} className={className}>{prefix}{formatted}{suffix}</span>;
  }

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
};

export default AnimatedCounter;
