import { motion } from 'motion/react';
import WinBurst from './WinBurst';

// Cartel de resultado: entra con un resorte y, si ganaste, suelta chispas.
export default function ResultBanner({ tone = 'push', children, className = '' }) {
  return (
    <motion.div
      className={`result-banner ${tone} ${className}`}
      initial={{ opacity: 0, scale: 0.78, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 19 }}
    >
      {tone === 'win' && <WinBurst />}
      {children}
    </motion.div>
  );
}
