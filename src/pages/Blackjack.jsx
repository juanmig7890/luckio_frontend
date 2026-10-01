import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';

const RESULT_TEXT = {
  blackjack: { type: 'success', text: '🎉 ¡BLACKJACK! Pagas 3 a 2' },
  win: { type: 'success', text: '🎉 ¡Ganaste la mano!' },
  push: { type: 'success', text: '🤝 Empate: te devolvemos tu apuesta' },
  lose: { type: 'error', text: 'Perdiste esta mano' },
};

function Hand({ title, cards, score }) {
  return (
    <div className="bj-hand">
      <div className="bj-title"><span>{title}</span><strong className="gold">{score}</strong></div>
      <div className="bj-cards">
        {cards.map((c, i) => (
          <img key={i} src={c.image} alt={c.hidden ? 'Carta oculta' : c.code} className="bj-card" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function Blackjack() {
  const { setUser } = useAuth();
  const [game, setGame] = useState(null);
  const [amount, setAmount] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/blackjack/active').then(({ data }) => setGame(data.game)).catch(() => {});
  }, []);

  const run = async (request) => {
    setError('');
    setBusy(true);
    try {
      const { data } = await request();
      setGame(data.game);
      setUser(data.user);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const start = () => run(() => api.post('/blackjack/start', { amount: Number(amount) }));
  const action = (name) => run(() => api.post(`/blackjack/${game.id}/${name}`));

  const active = game?.status === 'active';
  const finished = game?.status === 'finished';

  return (
    <div className="game-page">
      <h1>🃏 Blackjack</h1>
      <p className="muted">Llega a 21 sin pasarte. El crupier se planta en 17. Blackjack paga 3 a 2.</p>

      {game ? (
        <div className="bj-table">
          <Hand title="Crupier" cards={game.dealerCards} score={game.dealerScore} />
          <Hand title="Tú" cards={game.playerCards} score={game.playerScore} />
          <p className="center muted small">Apuesta en juego: 🪙 {formatChips(game.bet)}</p>
        </div>
      ) : (
        <div className="bj-table empty center muted">Haz tu apuesta para repartir las cartas</div>
      )}

      {finished && (
        <div className={`alert alert-${RESULT_TEXT[game.result].type} center`}>
          {RESULT_TEXT[game.result].text}
          {game.payout > 0 && ` · +${formatChips(game.payout)} fichas`}
        </div>
      )}
      {error && <div className="alert alert-error center">{error}</div>}

      {active ? (
        <div className="bj-actions">
          <button className="btn btn-gold" disabled={busy} onClick={() => action('hit')}>Pedir carta</button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => action('stand')}>Plantarse</button>
          <button className="btn btn-ghost" disabled={busy || !game.canDouble} onClick={() => action('double')}>Doblar</button>
        </div>
      ) : (
        <>
          <BetControl amount={amount} setAmount={setAmount} disabled={busy} />
          <button className="btn btn-gold btn-block" onClick={start} disabled={busy}>
            {busy ? 'Repartiendo...' : finished ? 'Nueva mano' : 'Repartir'} · {formatChips(amount)} fichas
          </button>
        </>
      )}
    </div>
  );
}