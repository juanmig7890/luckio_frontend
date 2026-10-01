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

const PAIRS_LABEL = {
  mixed: 'Par mixto (colores distintos)',
  colored: 'Par del mismo color',
  perfect: 'Par perfecto (mismo palo)',
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
  const [pairsEnabled, setPairsEnabled] = useState(false);
  const [pairsBet, setPairsBet] = useState(20);
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

  const start = () =>
    run(() =>
      api.post('/blackjack/start', {
        amount: Number(amount),
        pairsBet: pairsEnabled ? Number(pairsBet) || 0 : 0,
      })
    );
  const action = (name) => run(() => api.post(`/blackjack/${game.id}/${name}`));

  const active = game?.status === 'active';
  const finished = game?.status === 'finished';

  return (
    <div className="game-page">
      <h1>🃏 Blackjack</h1>
      <p className="muted">
        Llega a 21 sin pasarte. El crupier se planta en 17. Blackjack paga 3 a 2. Apuesta opcional a Perfect Pairs sobre
        tus primeras 2 cartas.
      </p>

      {game ? (
        <div className="bj-table">
          <Hand title="Crupier" cards={game.dealerCards} score={game.dealerScore} />
          <Hand title="Tú" cards={game.playerCards} score={game.playerScore} />
          <p className="center muted small">Apuesta en juego: 🪙 {formatChips(game.bet)}</p>
        </div>
      ) : (
        <div className="bj-table empty center muted">Haz tu apuesta para repartir las cartas</div>
      )}

      {game?.pairsBet > 0 && (
        game.pairsType ? (
          <div className="alert alert-success center">
            🂡 Perfect Pairs — {PAIRS_LABEL[game.pairsType]}: +{formatChips(game.pairsPayout)} fichas
          </div>
        ) : (
          <div className="alert center muted small">Perfect Pairs: sin pareja esta vez (-{formatChips(game.pairsBet)} fichas)</div>
        )
      )}

      {finished && (
        <div className={`alert alert-${RESULT_TEXT[game.result].type} center`}>
          {game.isHistoricBlackjack
            ? '🂡♠️ ¡BLACKJACK HISTÓRICO! As de Picas + Jota negra — el origen real del nombre del juego. Paga 10 a 1.'
            : RESULT_TEXT[game.result].text}
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

          <label className="side-bet-toggle">
            <input
              type="checkbox"
              checked={pairsEnabled}
              disabled={busy}
              onChange={(e) => setPairsEnabled(e.target.checked)}
            />
            <span>
              Apostar a <strong className="gold">Perfect Pairs</strong> (mixto 6x · mismo color 12x · mismo palo 25x)
            </span>
          </label>
          {pairsEnabled && (
            <input
              className="bet-input"
              type="number"
              min="10"
              max="100000"
              value={pairsBet}
              disabled={busy}
              onChange={(e) => setPairsBet(e.target.value)}
              placeholder="Monto de Perfect Pairs"
            />
          )}

          <button className="btn btn-gold btn-block" onClick={start} disabled={busy}>
            {busy ? 'Repartiendo...' : finished ? 'Nueva mano' : 'Repartir'} · {formatChips(amount)} fichas
          </button>
        </>
      )}
    </div>
  );
}
