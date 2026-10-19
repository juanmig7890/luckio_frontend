// Ficha de casino dibujada en SVG: escala sin perder nitidez y no depende de imágenes externas.
const STYLES = {
  10: { base: '#d9d4c7', ink: '#1b1b1b', edge: '#ffffff' },
  50: { base: '#a82f2c', ink: '#ffffff', edge: '#f6e8e6' },
  100: { base: '#1d6b4f', ink: '#ffffff', edge: '#e4f1ea' },
  500: { base: '#1a1a1a', ink: '#e7c873', edge: '#e7c873' },
  1000: { base: '#5b3a8c', ink: '#ffffff', edge: '#e9ddf7' },
  5000: { base: '#b5541f', ink: '#ffffff', edge: '#fbddc3' },
  25000: { base: '#0f766e', ink: '#f0fdfa', edge: '#99f6e4' },
};
const FALLBACK = { base: '#9c7a2f', ink: '#ffffff', edge: '#f3e3b8' };

const label = (v) => (v >= 1000 && v % 1000 === 0 ? `${v / 1000}K` : String(v));

// 16 marcas en el borde: la circunferencia de r=44 mide ~276.5, así que 8.64 de trazo + 8.64 de hueco, 16 veces
const DASH = '8.64 8.64';

export default function Chip({ value, size = 56, selected = false, disabled = false, onClick, title }) {
  const s = STYLES[value] || FALLBACK;
  const content = (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill={s.base} />
      <circle cx="50" cy="50" r="44" fill="none" stroke={s.edge} strokeWidth="10" strokeDasharray={DASH} />
      <circle cx="50" cy="50" r="33" fill={s.base} stroke={s.edge} strokeWidth="1.5" strokeOpacity="0.7" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
      <text
        x="50" y="50" textAnchor="middle" dominantBaseline="central"
        fill={s.ink} fontWeight="700" fontSize={label(value).length > 2 ? 22 : 26}
        fontFamily="Sora, Inter, sans-serif"
      >
        {label(value)}
      </text>
    </svg>
  );

  if (!onClick) return <span className="chip" style={{ width: size, height: size }}>{content}</span>;

  return (
    <button
      type="button"
      className={`chip chip-btn2 ${selected ? 'sel' : ''}`}
      style={{ width: size, height: size }}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Ficha de ${value}`}
      title={title}
    >
      {content}
    </button>
  );
}
