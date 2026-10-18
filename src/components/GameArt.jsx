// Ilustraciones de línea (SVG) para las tarjetas del lobby: más limpias y livianas que un emoji.
const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
const pegs = [1, 2, 3, 4, 5].flatMap((row) =>
  Array.from({ length: row }, (_, i) => ({ x: 60 + (i - (row - 1) / 2) * 17, y: 18 + row * 14, key: `${row}-${i}` }))
);

const ART = {
  blackjack: (
    <>
      <rect x="24" y="20" width="42" height="60" rx="6" transform="rotate(-10 45 50)" />
      <rect x="50" y="22" width="42" height="60" rx="6" transform="rotate(8 71 52)" />
      <text x="71" y="60" textAnchor="middle" fontSize="26" fontWeight="700" fill="currentColor" stroke="none">A</text>
    </>
  ),
  baccarat: (
    <>
      <rect x="22" y="22" width="38" height="56" rx="5" transform="rotate(-8 41 50)" />
      <rect x="60" y="22" width="38" height="56" rx="5" transform="rotate(8 79 50)" />
      <circle cx="60" cy="50" r="9" />
    </>
  ),
  roulette: (
    <>
      <circle cx="60" cy="50" r="38" />
      <circle cx="60" cy="50" r="26" />
      <circle cx="60" cy="50" r="7" />
      {spokes.map((a) => (
        <line key={a} x1={60 + Math.cos(a) * 7} y1={50 + Math.sin(a) * 7} x2={60 + Math.cos(a) * 26} y2={50 + Math.sin(a) * 26} />
      ))}
      <circle cx="86" cy="26" r="3.5" fill="currentColor" stroke="none" />
    </>
  ),
  slots: (
    <>
      {[16, 44, 72].map((x) => <rect key={x} x={x} y="22" width="32" height="56" rx="6" />)}
      {[32, 60, 88].map((x) => (
        <text key={x} x={x} y="58" textAnchor="middle" fontSize="28" fontWeight="700" fill="currentColor" stroke="none">7</text>
      ))}
    </>
  ),
  plinko: (
    <>
      {pegs.map((p) => <circle key={p.key} cx={p.x} cy={p.y} r="2.6" fill="currentColor" stroke="none" />)}
      <circle cx="68" cy="14" r="6" />
    </>
  ),
  sports: (
    <>
      <circle cx="60" cy="50" r="36" />
      <polygon points="60,34 74,44 69,61 51,61 46,44" />
      <path d="M60 34V16M74 44L90 38M69 61L80 75M51 61L40 75M46 44L30 38" />
    </>
  ),
};

export default function GameArt({ id }) {
  return (
    <svg viewBox="0 0 120 100" className="game-art" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ART[id]}
    </svg>
  );
}
