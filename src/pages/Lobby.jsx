import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';

export const GAMES = [
  { id: 'blackjack', name: 'Blackjack', description: 'Llega a 21 y vence al crupier.', colors: ['#0d3a2b', '#145a43'], available: true },
  { id: 'roulette', name: 'Ruleta', description: 'Ruleta europea: número, color, docena y más.', colors: ['#4a1717', '#8d2a22'], available: true },
  { id: 'slots', name: 'Tragamonedas', description: 'Alinea símbolos y persigue el jackpot.', colors: ['#2f1b45', '#5b2f8a'], available: true },
  { id: 'sports', name: 'Apuestas Deportivas', description: 'Cuotas de los próximos partidos.', colors: ['#10304f', '#1f5f94'], available: true },
  { id: 'baccarat', name: 'Bacará', description: 'Punto, Banca o Empate, con apuestas de pares.', colors: ['#0f3340', '#1a5668'], available: false },
  { id: 'plinko', name: 'Plinko', description: 'Suelta la bola y mira dónde cae.', colors: ['#3d2a0e', '#7a5617'], available: false },
];

export default function Lobby() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Lobby</p>
        <h1>
          Bienvenido, <span className="gold">{user.username}</span>
        </h1>
        <p className="muted">Elige una mesa y que la suerte te acompañe.</p>
      </section>

      <section className="games-grid">
        {GAMES.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </section>
    </>
  );
}
