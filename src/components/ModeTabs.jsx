import { Link } from 'react-router-dom';

// Pestañas "Individual | En vivo" para pasar de la mesa propia a la mesa compartida.
export default function ModeTabs({ current, soloTo, liveTo }) {
  return (
    <nav className="mode-tabs" aria-label="Modo de juego">
      <Link to={soloTo} className={current === 'solo' ? 'on' : ''} aria-current={current === 'solo' ? 'page' : undefined}>Individual</Link>
      <Link to={liveTo} className={current === 'live' ? 'on' : ''} aria-current={current === 'live' ? 'page' : undefined}>
        <i className="live-dot" /> En vivo
      </Link>
    </nav>
  );
}
