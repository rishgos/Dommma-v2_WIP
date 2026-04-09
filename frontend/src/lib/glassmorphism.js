// Glassmorphism style presets for inline styles
export const glassLight = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
};

export const glassDark = {
  background: 'rgba(15, 20, 25, 0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

export const glassSubtle = {
  background: 'rgba(255, 255, 255, 0.4)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
};

// Tailwind class strings
export const glassClasses = {
  light: 'bg-white/70 backdrop-blur-xl border border-white/30',
  dark: 'bg-[#0F1419]/70 backdrop-blur-xl border border-white/10',
  subtle: 'bg-white/40 backdrop-blur-md border border-white/20',
  card: 'bg-white/80 backdrop-blur-lg border border-white/30 shadow-lg',
};
