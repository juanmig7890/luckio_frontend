export const VIP_LEVELS = [
  { name: 'Bronce', min: 0, color: '#CD7F32', icon: '🥉' },
  { name: 'Plata', min: 5000, color: '#C0C0C0', icon: '🥈' },
  { name: 'Oro', min: 20000, color: '#FFC83D', icon: '🥇' },
  { name: 'VIP LUCK.IO', min: 50000, color: '#D4AF37', icon: '👑' },
];

export const getLevel = (name) => VIP_LEVELS.find((l) => l.name === name) || VIP_LEVELS[0];

export const getProgress = (totalWagered) => {
  const idx = [...VIP_LEVELS].reverse().findIndex((l) => totalWagered >= l.min);
  const currentIndex = VIP_LEVELS.length - 1 - idx;
  const current = VIP_LEVELS[currentIndex];
  const next = VIP_LEVELS[currentIndex + 1];
  if (!next) return { current, next: null, percent: 100, remaining: 0 };
  const percent = ((totalWagered - current.min) / (next.min - current.min)) * 100;
  return { current, next, percent: Math.min(100, Math.max(0, percent)), remaining: next.min - totalWagered };
};

export const formatChips = (n) => Number(n || 0).toLocaleString('es-CO');