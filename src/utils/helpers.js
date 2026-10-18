export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Solo para MOSTRAR el puntaje mientras se reparten las cartas; el resultado real siempre lo decide el servidor.
const cardValue = (v) => {
  if (v === 'ACE') return 11;
  if (['KING', 'QUEEN', 'JACK'].includes(v)) return 10;
  return Number(v);
};

export const blackjackScore = (cards) => {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (!c || c.hidden) continue;
    total += cardValue(c.value);
    if (c.value === 'ACE') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
};

export const baccaratPoints = (card) => {
  if (!card) return 0;
  if (card.value === 'ACE') return 1;
  if (['10', 'JACK', 'QUEEN', 'KING'].includes(card.value)) return 0;
  return Number(card.value);
};
