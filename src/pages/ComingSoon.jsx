import { Link } from 'react-router-dom';

export default function ComingSoon() {
  return (
    <div className="panel center">
      <h2>🚧 Este juego está en desarrollo</h2>
      <p className="muted">Muy pronto podrás jugarlo.</p>
      <Link to="/" className="btn btn-gold">Volver al lobby</Link>
    </div>
  );
}