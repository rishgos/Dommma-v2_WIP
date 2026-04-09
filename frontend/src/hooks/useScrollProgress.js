import { useScroll } from 'framer-motion';

const useScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  return scrollYProgress;
};

export default useScrollProgress;
