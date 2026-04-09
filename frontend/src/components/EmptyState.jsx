import { motion } from 'framer-motion';
import { FadeIn } from '@/components/motion';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className = '',
}) => {
  return (
    <FadeIn className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {Icon && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-2xl bg-[#1A2F3A]/5 dark:bg-white/5 flex items-center justify-center mb-6"
        >
          <Icon size={36} className="text-[#1A2F3A]/40 dark:text-white/40" />
        </motion.div>
      )}
      <h3 className="text-lg font-semibold text-[#1A2F3A] dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action}
          className="px-6 py-3 bg-[#1A2F3A] text-white rounded-full text-sm font-medium hover:bg-[#2C4A52] transition-colors"
        >
          {actionLabel || 'Get Started'}
        </button>
      )}
    </FadeIn>
  );
};

export default EmptyState;
