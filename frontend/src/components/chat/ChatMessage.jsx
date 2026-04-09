import { motion } from 'framer-motion';

const ChatMessage = ({ message, isUser = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 5 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-1`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-[#1A2F3A] text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-white/10 text-[#1A2F3A] dark:text-white rounded-bl-md'
        }`}
      >
        {typeof message === 'string' ? (
          <p className="whitespace-pre-wrap">{message}</p>
        ) : (
          message
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
