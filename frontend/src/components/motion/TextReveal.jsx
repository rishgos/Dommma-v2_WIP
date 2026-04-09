import { motion, useReducedMotion } from 'framer-motion';
import { easing } from '@/lib/motion';

const TextReveal = ({
  text,
  as: Tag = 'h1',
  splitBy = 'word',
  className = '',
  staggerDelay = 0.05,
  once = true,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <Tag className={className} {...props}>{text}</Tag>;
  }

  const items = splitBy === 'letter'
    ? text.split('')
    : text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: easing.easeOut },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      className={className}
      aria-label={text}
      {...props}
    >
      <Tag className={className} style={{ margin: 0 }}>
        {items.map((item, i) => (
          <motion.span
            key={i}
            variants={itemVariants}
            style={{ display: 'inline-block', whiteSpace: splitBy === 'word' ? 'pre' : 'normal' }}
          >
            {splitBy === 'word' ? (i < items.length - 1 ? item + ' ' : item) : item}
          </motion.span>
        ))}
      </Tag>
    </motion.div>
  );
};

export default TextReveal;
