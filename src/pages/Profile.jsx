import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips, getProgress } from '../utils/vip';
import VipBadge from '../components/VipBadge';

const TYPE_LABEL = { recharge: 'Recarga', bet: 'Apuesta', win: 'Premio' };
const GAME_LABEL = { wallet: 'Billetera', blackjack: 'Blackjack', slots: 'Tragamonedas', roulette: 'Ruleta', sports: 'Deportes' };

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser().catch(() => {});
    api
      .get('/wallet/transactions')
      .then(({ data }) => setTransactions(data.transactions))
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const progress = getProgress(user.totalWagered);

  return (
    <>
      <section className={`profile-card ${user.vipLevel === 'VIP LUCK.IO' ? 'profile-gold' : ''}`}>
        <div className="avatar">{user.username[0].toUpperCase()}</div>
        <div className="profile-main">
          <h1>{user.username}</h1>
          <p className="muted">{user.email}</p>
          <VipBadge level={user.vipLevel} large />
        </div>
        <div className="profile-stats">
          <div><span>Saldo</span><strong>🪙 {formatChips(user.balance)}</strong></div>
          <div><span>Total apostado</span><strong>{formatChips(user.totalWagered)}</strong></div>
        </div>
      </section>

      <section className="panel">
        <h2>Progreso VIP</h2>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="muted">
          {progress.next
            ? `Te faltan ${formatChips(progress.remaining)} fichas apostadas para llegar a ${progress.next.name}.`
            : '¡Has alcanzado el máximo rango! 👑'}
        </p>
      </section>

      <section className="panel">
        <h2>Historial de movimientos</h2>
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : transactions.length === 0 ? (
          <p className="muted">Aún no tienes movimientos. ¡Haz tu primera recarga!</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Tipo</th><th>Juego</th><th>Monto</th><th>Saldo</th></tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td>{new Date(t.createdAt).toLocaleString('es-CO')}</td>
                    <td>{TYPE_LABEL[t.type]}</td>
                    <td>{GAME_LABEL[t.game]}</td>
                    <td className={t.amount >= 0 ? 'green' : 'red'}>
                      {t.amount >= 0 ? '+' : ''}{formatChips(t.amount)}
                    </td>
                    <td>{formatChips(t.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}