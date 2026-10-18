import { Link } from 'react-router-dom';
import GameArt from './GameArt';

export default function GameCard({ game }) {
  const content = (
    <div className={`gc ${game.available ? '' : 'off'}`} style={{ '--g1': game.colors[0], '--g2': game.colors[1] }}>
      <div className="gc-art">
        <GameArt id={game.id} />
        {!game.available && <span className="soon-tag">Próximamente</span>}
      </div>
      <div className="gc-body">
        <h3>{game.name}</h3>
        <p>{game.description}</p>
        <span className="gc-cta">{game.available ? 'Jugar ahora' : 'En desarrollo'}</span>
      </div>
    </div>
  );

  return game.available ? <Link to={`/game/${game.id}`} className="gc-link">{content}</Link> : content;
}
