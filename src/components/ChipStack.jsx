import { AnimatePresence, motion } from 'motion/react';
import Chip from './Chip';

const OFFSET = 7; // px que sube cada ficha sobre la anterior
const TILT = 6; // leve giro alterno para que la pila no se vea perfectamente alineada
const TIERS = [10, 50, 100, 500, 1000, 5000, 25000];
const MAX_LAYERS = 4; // nunca se amontonan más de 4 fichas, sin importar cuántos clics hiciste

// Qué escalones de ficha "alcanzó" un monto (las últimas 4, de menor a mayor): representa la apuesta con
// pocas fichas de colores distintos en vez de una ficha literal por cada clic (así no se amontona si pones,
// por ejemplo, 30 fichas de 1000: se ve una ficha de 1000 y, si llega, una de 5000 y una de 25000 encima).
const tiersFor = (amount) => TIERS.filter((t) => amount >= t).slice(-MAX_LAYERS);

// Pila de fichas de casino: cada ficha representa un escalón de valor alcanzado por el total apostado.
// Al cruzar un escalón nuevo aparece una ficha más (con su propio color) encima; al bajar, desaparece.
export default function ChipStack({ amount, size = 48 }) {
  const layers = tiersFor(amount);
  return (
    <div className="chip-stack" style={{ width: size, height: size + Math.max(0, layers.length - 1) * OFFSET }}>
      <AnimatePresence initial={false}>
        {layers.map((value, i) => (
          <motion.div
            key={value}
            className="chip-stack-layer"
            style={{ bottom: i * OFFSET, zIndex: i }}
            initial={{ y: -48, opacity: 0, scale: 1.3, rotate: i % 2 === 0 ? -TILT * 2 : TILT * 2 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: i % 2 === 0 ? -TILT : TILT }}
            exit={{ y: 30, opacity: 0, scale: 0.7, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 480, damping: 19 }}
          >
            <Chip value={value} size={size} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
