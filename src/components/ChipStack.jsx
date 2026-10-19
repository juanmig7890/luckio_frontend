import { motion } from 'motion/react';
import Chip from './Chip';

const OFFSET = 6; // px que sube cada ficha nueva sobre la anterior
const TILT = 6; // leve giro alterno para que la pila no se vea perfectamente alineada
const MAX_SHOWN = 10;

// Pila de fichas de casino: cada clic agrega una ficha ARRIBA de las anteriores (como apilar fichas de
// verdad), en vez de solo cambiar el número. Las fichas ya puestas no se vuelven a animar: motion solo
// anima la ficha recién montada (misma clave = mismo nodo del DOM).
export default function ChipStack({ chips, size = 48 }) {
  const shown = chips.slice(-MAX_SHOWN);
  const hidden = chips.length - shown.length;
  return (
    <div className="chip-stack" style={{ width: size, height: size + Math.max(0, shown.length - 1) * OFFSET }}>
      {shown.map((value, i) => (
        <motion.div
          key={i}
          className="chip-stack-layer"
          style={{ bottom: i * OFFSET, zIndex: i }}
          initial={{ y: -48, opacity: 0, scale: 1.3, rotate: i % 2 === 0 ? -TILT * 2 : TILT * 2 }}
          animate={{ y: 0, opacity: 1, scale: 1, rotate: i % 2 === 0 ? -TILT : TILT }}
          transition={{ type: 'spring', stiffness: 480, damping: 19 }}
        >
          <Chip value={value} size={size} />
        </motion.div>
      ))}
      {hidden > 0 && <span className="chip-stack-more">+{hidden}</span>}
    </div>
  );
}
