import { useMemo } from 'react';
import { motion } from 'motion/react';

// Chispas doradas que salen del centro cuando ganas.
export default function WinBurst({ count = 18 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 70 + Math.random() * 90;
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 4 + Math.random() * 6, delay: Math.random() * 0.12 };
      }),
    [count]
  );
  return (
    <span className="burst" aria-hidden="true">
      {dots.map((d, i) => (
        <motion.i
          key={i}
          className="burst-dot"
          style={{ width: d.size, height: d.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: d.x, y: d.y, opacity: 0, scale: 0.2 }}
          transition={{ duration: 1, ease: 'easeOut', delay: d.delay }}
        />
      ))}
    </span>
  );
}
