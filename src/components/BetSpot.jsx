import { motion } from 'motion/react';
import Chip from './Chip';
import { formatChips } from '../utils/vip';

const DENOMS = [1000, 500, 100, 50, 10];
const topChip = (amount) => DENOMS.find((d) => amount >= d) || 10;

// Casilla de apuesta sobre el tapete (círculo o rectángulo). Al hacer clic suma la ficha elegida.
export default function BetSpot({ label, sub, amount = 0, onClick, onClear, disabled, shape = 'circle', size = 92, win = false, className = '' }) {
  return (
    <div className={`spot spot-${shape} ${amount > 0 ? 'has' : ''} ${win ? 'win' : ''} ${className}`} style={{ '--s': `${size}px` }}>
      <button type="button" className="spot-btn" onClick={onClick} disabled={disabled} aria-label={`Apostar en ${label}`}>
        <span className="spot-label">{label}</span>
        {sub && <span className="spot-sub">{sub}</span>}
        {amount > 0 && (
          <motion.span
            key={amount}
            className="spot-chip"
            initial={{ y: -40, scale: 1.35, opacity: 0, rotate: -12 }}
            animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 460, damping: 17 }}
          >
            <Chip value={topChip(amount)} size={Math.round(size * 0.5)} />
          </motion.span>
        )}
      </button>
      {amount > 0 && <span className="spot-amount">{formatChips(amount)}</span>}
      {amount > 0 && !disabled && (
        <button type="button" className="spot-clear" onClick={onClear} aria-label={`Quitar apuesta de ${label}`}>✕</button>
      )}
    </div>
  );
}
