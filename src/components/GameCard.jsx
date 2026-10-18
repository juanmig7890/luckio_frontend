import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import GameArt from './GameArt';

export default function GameCard({ game }) {
  const content = (
    <div className={`gc ${game.available ? '' : 'off'}`} style={{ '--g1': game.colors[0], '--g2': game.colors[1] }}>
      <div className="gc-art">
        <GameArt id={game.art || game.id} />
        {game.live && <span className="live-tag"><i /> EN VIVO</span>}
        {!game.available && <span className="soon-tag">Próximamente</span>}
      </div>
      <div className="gc-body">
        <h3>{game.name}</h3>
        <p>{game.description}</p>
        <span className="gc-cta">{game.available ? 'Jugar ahora' : 'En desarrollo'}</span>
      </div>
    </div>
  );

  const item = {
    hidden: { opacity: 0, y: 26, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 210, damping: 22 } },
  };
  return (
    <motion.div variants={item} whileTap={game.available ? { scale: 0.97 } : undefined}>
      {game.available ? <Link to={game.to || `/game/${game.id}`} className="gc-link">{content}</Link> : content}
    </motion.div>
  );
}
