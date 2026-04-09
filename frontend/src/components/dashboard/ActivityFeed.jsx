import { motion, AnimatePresence } from 'framer-motion';
import { stagger, duration, easing } from '@/lib/motion';

const colorMap = {
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-l-green-500' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-l-blue-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-l-orange-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-l-purple-500' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-l-red-500' },
};

const ActivityFeed = ({ items = [], title = 'Recent Activity' }) => {
  return (
    <div className="bg-white dark:bg-[#1A2332] rounded-2xl p-6">
      <h2
        className="text-xl font-semibold text-[#1A2F3A] dark:text-white mb-4"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        {title}
      </h2>
      <div className="space-y-1">
        <AnimatePresence>
          {items.map((item, i) => {
            const colors = colorMap[item.color] || colorMap.blue;
            return (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * stagger.normal, duration: duration.normal, ease: easing.easeOut }}
                className={`flex items-center gap-4 py-3 px-3 border-l-2 ${colors.border} rounded-r-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors`}
              >
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  <item.icon size={18} className={colors.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A2F3A] dark:text-white truncate">{item.text}</p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityFeed;
