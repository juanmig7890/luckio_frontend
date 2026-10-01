import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import VipBadge from './VipBadge';
import RechargeModal from './RechargeModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showRecharge, setShowRecharge] = useState(false);

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="logo">
            LUCK<span>.IO</span>
          </Link>

          <nav className="nav-links">
            <NavLink to="/" end>Lobby</NavLink>
            <NavLink to="/profile">Perfil</NavLink>
          </nav>

          <div className="nav-right">
            <VipBadge level={user.vipLevel} />
            <div className="balance">
              <span className="balance-label">Saldo</span>
              <strong>🪙 {formatChips(user.balance)}</strong>
            </div>
            <button className="btn btn-gold" onClick={() => setShowRecharge(true)}>
              + Recargar Fichas
            </button>
            <button className="btn btn-ghost" onClick={logout} title="Cerrar sesión">
              Salir
            </button>
          </div>
        </div>
      </header>

      {showRecharge && <RechargeModal onClose={() => setShowRecharge(false)} />}
    </>
  );
}