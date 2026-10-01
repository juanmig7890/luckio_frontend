import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';

export const GAMES = [
  { id: 'blackjack', name: 'Blackjack', emoji: '🃏', description: 'Llega a 21 y vence al crupier.', colors: ['#0f3d2e', '#1b6b4f'], available: true },
  { id: 'slots', name: 'Tragamonedas', emoji: '🎰', description: 'Alinea los símbolos y multiplica tu apuesta.', colors: ['#4a1a5e', '#8e2de2'], available: true },
  { id: 'roulette', name: 'Ruleta', emoji: '🎡', description: 'Número, color o par/impar. Tú eliges.', colors: ['#5e1a1a', '#c0392b'], available: true },
  { id: 'sports', name: 'Apuestas Deportivas', emoji: '⚽', description: 'Cuotas reales de los próximos partidos.', colors: ['#12365e', '#2980b9'], available: true },
];

export default function Lobby() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero">
        <h1>
          Bienvenido, <span className="gold">{user.username}</span>
        </h1>
        <p className="muted">Elige un juego y que la suerte te acompañe.</p>
      </section>

      <section className="games-grid">
        {GAMES.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </section>
    </>
  );
}