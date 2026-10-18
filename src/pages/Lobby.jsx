import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';

export const GAMES = [
  { id: 'blackjack', name: 'Blackjack', description: 'Llega a 21 y vence al crupier.', colors: ['#0d3a2b', '#145a43'], available: true },
  { id: 'roulette', name: 'Ruleta', description: 'Ruleta europea: número, color, docena y más.', colors: ['#4a1717', '#8d2a22'], available: true },
  { id: 'slots', name: 'Tragamonedas', description: 'Alinea símbolos y persigue el jackpot.', colors: ['#2f1b45', '#5b2f8a'], available: true },
  { id: 'sports', name: 'Apuestas Deportivas', description: 'Cuotas de los próximos partidos.', colors: ['#10304f', '#1f5f94'], available: true },
  { id: 'baccarat', name: 'Bacará', description: 'Punto, Banca o Empate, con apuestas de pares.', colors: ['#0f3340', '#1a5668'], available: true },
  { id: 'plinko', name: 'Plinko', description: 'Suelta la bola y mira dónde cae.', colors: ['#3d2a0e', '#7a5617'], available: true },
  { id: 'roulette-live', art: 'roulette', live: true, name: 'Ruleta en vivo', description: 'Mesa compartida: todos ven el mismo giro al mismo tiempo.', colors: ['#3d1212', '#a3302a'], available: true },
  { id: 'baccarat-live', art: 'baccarat', live: true, name: 'Bacará en vivo', description: 'Una mano para toda la mesa, con apuestas de cada jugador.', colors: ['#0b2c38', '#1f7184'], available: true },
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

      <motion.section className="games-grid" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
        {GAMES.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </motion.section>
    </>
  );
}
