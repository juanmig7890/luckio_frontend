// Datos y funciones de la ruleta europea que comparten la mesa individual y la mesa en vivo.
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const colorOf = (n) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

// Orden real de la rueda europea (no es el orden numérico de la mesa)
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
];
export const SEG = 360 / WHEEL_ORDER.length;
export const SPIN_MS = 5200;
export const MAX_DISTINCT_BETS = 20;
export const FILL = { red: '#b3302b', black: '#15181a', green: '#1d7a4e' };

export const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [150 + r * Math.sin(a), 150 - r * Math.cos(a)];
};
export const sector = (i, r1, r2) => {
  const [x1, y1] = polar(r2, i * SEG);
  const [x2, y2] = polar(r2, (i + 1) * SEG);
  const [x3, y3] = polar(r1, (i + 1) * SEG);
  const [x4, y4] = polar(r1, i * SEG);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
};

export const short = (n) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : String(n));
const DENOMS = [1000, 500, 100, 50, 10];
export const topChip = (amount) => DENOMS.find((d) => amount >= d) || 10;

export const describe = ({ betType, selection }) => {
  switch (betType) {
    case 'straight': return `Número ${selection}`;
    case 'color': return selection === 'red' ? 'Rojo' : 'Negro';
    case 'parity': return selection === 'even' ? 'Par' : 'Impar';
    case 'half': return selection === 'low' ? '1-18' : '19-36';
    case 'dozen': return `${selection}ª docena`;
    case 'column': return `Columna ${selection}`;
    default: return '';
  }
};

// Agrega una ficha a la lista de apuestas (misma casilla = se suma) y devuelve la lista nueva
export const addChip = (bets, betType, selection, amount) => {
  const key = `${betType}:${selection}`;
  const found = bets.find((b) => b.key === key);
  if (found) return bets.map((b) => (b.key === key ? { ...b, amount: b.amount + amount } : b));
  return [...bets, { key, betType, selection, amount }];
};
