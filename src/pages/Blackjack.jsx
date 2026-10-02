import { useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';

const DEAL_DELAY = 450; // ms entre cada carta que se revela, para que no se vea todo de golpe
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RESULT_TEXT = {
  blackjack: { type: 'success', text: '🎉 ¡BLACKJACK! Pagas 3 a 2' },
  win: { type: 'success', text: '🎉 ¡Ganaste la mano!' },
  push: { type: 'success', text: '🤝 Empate: te devolvemos tu apuesta' },
  lose: { type: 'error', text: 'Perdiste esta mano' },
  surrender: { type: 'error', text: '🏳️ Te retiraste: recuperas la mitad de tu apuesta' },
};

const PAIRS_LABEL = {
  mixed: 'Par mixto (colores distintos)',
  colored: 'Par del mismo color',
  perfect: 'Par perfecto (mismo palo)',
};

// Solo para mostrar el puntaje en vivo mientras se revelan las cartas; el resultado real siempre lo decide el servidor
const cardValue = (v) => {
  if (v === 'ACE') return 11;
  if (['KING', 'QUEEN', 'JACK'].includes(v)) return 10;
  return Number(v);
};
const handScore = (cards) => {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (!c || c.hidden) continue;
    total += cardValue(c.value);
    if (c.value === 'ACE') aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
};

function Hand({ title, cards }) {
  return (
    <div className="bj-hand">
      <div className="bj-title"><span>{title}</span><strong className="gold">{handScore(cards)}</strong></div>
      <div className="bj-cards">
        {cards.map((c, i) => (
          <img
            key={c.hidden ? `hidden-${i}` : c.code}
            src={c.image}
            alt={c.hidden ? 'Carta oculta' : c.code}
            className="bj-card"
          />
        ))}
      </div>
    </div>
  );
}

export default function Blackjack() {
  const { setUser } = useAuth();
  const [game, setGame] = useState(null);
  const [playerShown, setPlayerShown] = useState([]);
  const [dealerShown, setDealerShown] = useState([]);
  const [amount, setAmount] = useState(100);
  const [pairsEnabled, setPairsEnabled] = useState(false);
  const [pairsBet, setPairsBet] = useState(20);
  const [busy, setBusy] = useState(false);
  const [dealing, setDealing] = useState(false);
  const [error, setError] = useState('');
  const shownRef = useRef({ player: [], dealer: [] });

  useEffect(() => {
    api.get('/blackjack/active').then(({ data }) => {
      if (data.game) {
        setGame(data.game);
        setPlayerShown(data.game.playerCards);
        setDealerShown(data.game.dealerCards);
        shownRef.current = { player: data.game.playerCards, dealer: data.game.dealerCards };
      }
    }).catch(() => {});
  }, []);

  // Revela las cartas nuevas de a una (jugador primero, luego el dealer: voltea su carta oculta y recién
  // después reparte las que le falten), en vez de pintar el estado final del servidor de golpe.
  const revealSequence = async (nextGame, { reset = false } = {}) => {
    setDealing(true);

    let fromPlayer = reset ? [] : shownRef.current.player;
    let fromDealer = reset ? [] : shownRef.current.dealer;
    if (reset) {
      setPlayerShown([]);
      setDealerShown([]);
      await sleep(150);
    }

    for (let i = fromPlayer.length; i < nextGame.playerCards.length; i++) {
      await sleep(DEAL_DELAY);
      setPlayerShown(nextGame.playerCards.slice(0, i + 1));
    }

    // Primero voltear la carta oculta del dealer (si corresponde) sin agregar cartas nuevas todavía
    if (fromDealer[1]?.hidden && !nextGame.dealerCards[1]?.hidden) {
      await sleep(DEAL_DELAY);
      fromDealer = [nextGame.dealerCards[0], nextGame.dealerCards[1]];
      setDealerShown(fromDealer);
    }

    for (let i = fromDealer.length; i < nextGame.dealerCards.length; i++) {
      await sleep(DEAL_DELAY);
      setDealerShown(nextGame.dealerCards.slice(0, i + 1));
    }

    setPlayerShown(nextGame.playerCards);
    setDealerShown(nextGame.dealerCards);
    shownRef.current = { player: nextGame.playerCards, dealer: nextGame.dealerCards };

    setGame(nextGame);
    setDealing(false);
  };

  const run = async (request, { reset = false } = {}) => {
    setError('');
    setBusy(true);
    try {
      const { data } = await request();
      await revealSequence(data.game, { reset });
      setUser(data.user);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    run(
      () => api.post('/blackjack/start', { amount: Number(amount), pairsBet: pairsEnabled ? Number(pairsBet) || 0 : 0 }),
      { reset: true }
    );
  const action = (name) => run(() => api.post(`/blackjack/${game.id}/${name}`));

  const active = game?.status === 'active';
  const finished = game?.status === 'finished';
  const busyOrDealing = busy || dealing;

  return (
    <div className="game-page">
      <h1>🃏 Blackjack</h1>
      <p className="muted">
        Llega a 21 sin pasarte. El crupier se planta en 17. Blackjack paga 3 a 2. Apuesta opcional a Perfect Pairs sobre
        tus primeras 2 cartas, o retirate y recuperá la mitad si no te gusta tu mano.
      </p>

      {playerShown.length > 0 || dealerShown.length > 0 ? (
        <div className="bj-table">
          <Hand title="Crupier" cards={dealerShown} />
          <Hand title="Tú" cards={playerShown} />
          <p className="center muted small">Apuesta en juego: 🪙 {formatChips(game?.bet ?? amount)}</p>
        </div>
      ) : (
        <div className="bj-table empty center muted">Haz tu apuesta para repartir las cartas</div>
      )}

      {!dealing && game?.pairsBet > 0 && (
        game.pairsType ? (
          <div className="alert alert-success center">
            🂡 Perfect Pairs — {PAIRS_LABEL[game.pairsType]}: +{formatChips(game.pairsPayout)} fichas
          </div>
        ) : (
          <div className="alert center muted small">Perfect Pairs: sin pareja esta vez (-{formatChips(game.pairsBet)} fichas)</div>
        )
      )}

      {!dealing && finished && (
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
          <button className="btn btn-gold" disabled={busyOrDealing} onClick={() => action('hit')}>Pedir carta</button>
          <button className="btn btn-ghost" disabled={busyOrDealing} onClick={() => action('stand')}>Plantarse</button>
          <button className="btn btn-ghost" disabled={busyOrDealing || !game.canDouble} onClick={() => action('double')}>Doblar</button>
          <button className="btn btn-ghost btn-danger" disabled={busyOrDealing || !game.canSurrender} onClick={() => action('surrender')}>
            Retirarse
          </button>
        </div>
      ) : (
        <>
          <BetControl amount={amount} setAmount={setAmount} disabled={busyOrDealing} />

          <label className="side-bet-toggle">
            <input
              type="checkbox"
              checked={pairsEnabled}
              disabled={busyOrDealing}
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
              disabled={busyOrDealing}
              onChange={(e) => setPairsBet(e.target.value)}
              placeholder="Monto de Perfect Pairs"
            />
          )}

          <button className="btn btn-gold btn-block" onClick={start} disabled={busyOrDealing}>
            {dealing ? 'Repartiendo...' : busy ? 'Procesando...' : finished ? 'Nueva mano' : 'Repartir'} · {formatChips(amount)} fichas
          </button>
        </>
      )}
    </div>
  );
}
