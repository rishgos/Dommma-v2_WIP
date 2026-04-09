import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/motion';

const AnimatedStatCard = ({
  icon: Icon,
  iconColor = 'text-[#1A2F3A]',
  iconBg = 'bg-[#1A2F3A]/10',
  label,
  value,
  badge,
  badgeColor = 'text-gray-500',
  prefix = '',
  suffix = '',
  index = 0,
}) => {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  const isNumeric = !isNaN(numericValue) && numericValue > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
      className="bg-white dark:bg-[#1A2332] p-6 rounded-2xl transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        {badge && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className={`text-xs ${badgeColor}`}
          >
            {badge}
          </motion.span>
        )}
      </div>
      <p className="text-2xl font-semibold text-[#1A2F3A] dark:text-white">
        {isNumeric ? (
          <AnimatedCounter target={numericValue} prefix={prefix} suffix={suffix} />
        ) : (
          `${prefix}${value}${suffix}`
        )}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </motion.div>
  );
};

export default AnimatedStatCard;
