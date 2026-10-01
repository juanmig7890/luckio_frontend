import { Link } from 'react-router-dom';

export default function GameCard({ game }) {
  const content = (
    <div className={`game-card ${game.available ? '' : 'disabled'}`} style={{ '--g1': game.colors[0], '--g2': game.colors[1] }}>
      <div className="game-visual">
        <span className="game-emoji">{game.emoji}</span>
        {!game.available && <span className="soon-tag">Próximamente</span>}
      </div>
      <div className="game-info">
        <h3>{game.name}</h3>
        <p>{game.description}</p>
        <span className="game-cta">{game.available ? 'Jugar ahora →' : 'En desarrollo'}</span>
      </div>
    </div>
  );

  return game.available ? <Link to={`/game/${game.id}`}>{content}</Link> : content;
}