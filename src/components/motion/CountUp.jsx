import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';

// Número que "cuenta" hasta su nuevo valor (se usa en el saldo para que subir o bajar se note).
export default function CountUp({ value, format = (n) => String(Math.round(n)), duration = 0.9 }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, duration, mv]);
  return <motion.span>{text}</motion.span>;
}
