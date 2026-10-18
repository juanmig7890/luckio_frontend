import { motion } from 'motion/react';
// Carta dibujada en SVG. Acepta el formato que ya devuelve el backend: { code, value, suit } o { hidden: true }.
// Si "hidden" pasa a false con la misma carta montada, se voltea con una animación 3D (no reaparece).
const RANK = { ACE: 'A', KING: 'K', QUEEN: 'Q', JACK: 'J' };
const rankOf = (v) => RANK[v] || String(v);
const RED = '#c0392b';
const INK = '#16191a';
const SUIT_COLOR = { HEARTS: RED, DIAMONDS: RED, SPADES: INK, CLUBS: INK };
const SUIT_NAME = { HEARTS: 'corazones', DIAMONDS: 'diamantes', SPADES: 'picas', CLUBS: 'tréboles' };

// Cada palo está dibujado en una caja de 24x24
function SuitShape({ suit }) {
  switch (suit) {
    case 'HEARTS':
      return <path d="M12 21C12 21 3 14.5 3 8.5C3 5.5 5.2 3.5 7.8 3.5C9.6 3.5 11.2 4.5 12 6C12.8 4.5 14.4 3.5 16.2 3.5C18.8 3.5 21 5.5 21 8.5C21 14.5 12 21 12 21Z" />;
    case 'DIAMONDS':
      return <path d="M12 2L20.5 12L12 22L3.5 12Z" />;
    case 'SPADES':
      return <path d="M12 2C12 2 3 9.5 3 14.5C3 17.2 5.2 19 7.5 19C9.2 19 10.6 18.2 11.2 17C11 19.5 10.2 21 8.5 22L15.5 22C13.8 21 13 19.5 12.8 17C13.4 18.2 14.8 19 16.5 19C18.8 19 21 17.2 21 14.5C21 9.5 12 2 12 2Z" />;
    case 'CLUBS':
      return (
        <>
          <circle cx="12" cy="7.5" r="4.6" />
          <circle cx="7" cy="14" r="4.6" />
          <circle cx="17" cy="14" r="4.6" />
          <path d="M12 11L14 22L10 22Z" />
        </>
      );
    default:
      return null;
  }
}

function Suit({ suit, x, y, size }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill={SUIT_COLOR[suit]}>
      <SuitShape suit={suit} />
    </svg>
  );
}

function Corner({ rank, suit }) {
  return (
    <>
      <text x="9" y="24" fontSize="21" fontWeight="700" fill={SUIT_COLOR[suit]} fontFamily="Sora, Inter, sans-serif">
        {rank}
      </text>
      <Suit suit={suit} x={7} y={28} size={15} />
    </>
  );
}

function Front({ card }) {
  const rank = rankOf(card.value);
  return (
    <svg viewBox="0 0 100 140" role="img" aria-label={`${rank} de ${SUIT_NAME[card.suit]}`}>
      <rect x="1" y="1" width="98" height="138" rx="9" fill="#fbfaf6" stroke="#d6d0bf" />
      <Corner rank={rank} suit={card.suit} />
      <g transform="rotate(180 50 70)">
        <Corner rank={rank} suit={card.suit} />
      </g>
      <Suit suit={card.suit} x={27} y={46} size={46} />
    </svg>
  );
}

function Back() {
  return (
    <svg viewBox="0 0 100 140" aria-hidden="true">
      <defs>
        <pattern id="lk-back" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="12" height="12" fill="#0f3a2c" />
          <path d="M0 0H12M0 0V12" stroke="#1c5a44" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="98" height="138" rx="9" fill="url(#lk-back)" stroke="#06231a" />
      <rect x="9" y="9" width="82" height="122" rx="5" fill="none" stroke="#c9a45c" strokeWidth="1.2" />
      <path d="M50 52L68 70L50 88L32 70Z" fill="none" stroke="#c9a45c" strokeWidth="1.4" />
      <circle cx="50" cy="70" r="4" fill="#c9a45c" />
    </svg>
  );
}

export default function PlayingCard({ card, width = 92, delay = 0, faceDown }) {
  const down = faceDown ?? Boolean(card?.hidden);
  const known = card && !card.hidden && card.suit && card.value;
  return (
    <motion.div
      className={`pcard ${down ? 'down' : ''}`}
      style={{ width }}
      // La carta sale del zapato (arriba a la derecha) con un resorte y cae en su lugar
      initial={{ opacity: 0, x: 120, y: -130, rotate: 16, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 190, damping: 21, delay: delay / 1000 }}
    >
      <div className="pcard-inner">
        <div className="pcard-face pcard-front">{known && <Front card={card} />}</div>
        <div className="pcard-face pcard-back"><Back /></div>
      </div>
    </motion.div>
  );
}
