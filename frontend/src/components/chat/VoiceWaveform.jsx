import { motion } from 'framer-motion';

const VoiceWaveform = ({ isRecording = false, className = '' }) => {
  const bars = 12;

  return (
    <div className={`flex items-center justify-center gap-0.5 h-8 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-[#1A2F3A] dark:bg-[#C4A962]"
          animate={
            isRecording
              ? {
                  height: [4, Math.random() * 24 + 8, 4],
                }
              : { height: 4 }
          }
          transition={
            isRecording
              ? {
                  duration: 0.4 + Math.random() * 0.3,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
};

export default VoiceWaveform;
