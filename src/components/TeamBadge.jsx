// Escudo generado para cada equipo: iniciales (o la sigla típica de los más conocidos) sobre un color propio,
// siempre el mismo para el mismo equipo. No usamos los escudos reales (son marcas registradas de cada club;
// mostrarlos requeriría una licencia), así que esto es un distintivo propio de LUCK.IO por equipo.
const PALETTE = [
  '#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', '#16a085', '#2c3e50', '#b5541f',
  '#1f6f78', '#a82f2c', '#5b3a8c', '#1d6b4f', '#0f766e', '#7a1f3d', '#4a1a5e', '#1a5c8a',
];

// Equipos muy conocidos: su sigla habitual en vez de solo las iniciales del nombre
const KNOWN = {
  'Real Madrid': 'RMA',
  'Barcelona': 'FCB',
  'Atletico Madrid': 'ATM',
  'Manchester United': 'MUN',
  'Manchester City': 'MCI',
  'Liverpool': 'LIV',
  'Chelsea': 'CHE',
  'Arsenal': 'ARS',
  'Tottenham Hotspur': 'TOT',
  'Bayern Munich': 'FCB',
  'Borussia Dortmund': 'BVB',
  'Paris Saint Germain': 'PSG',
  'Juventus': 'JUV',
  'Inter Milan': 'INT',
  'AC Milan': 'ACM',
  'Napoli': 'NAP',
};

const hash = (s) => {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};

const initials = (name) => {
  const words = name.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name.slice(0, 2) || '??').toUpperCase();
};

export default function TeamBadge({ name, size = 30 }) {
  const label = KNOWN[name] || initials(name);
  const color = PALETTE[hash(name || '') % PALETTE.length];
  return (
    <span className="team-badge" style={{ width: size, height: size, background: color, fontSize: size * 0.4 }} title={name} aria-hidden="true">
      {label}
    </span>
  );
}
