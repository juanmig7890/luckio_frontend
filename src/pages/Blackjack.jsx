import { useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import { sleep, blackjackScore } from '../utils/helpers';
import PlayingCard from '../components/PlayingCard';
import BetSpot from '../components/BetSpot';
import ChipTray from '../components/ChipTray';
import HelpPanel from '../components/HelpPanel';

const DEAL_DELAY = 420;
const MAX_BET = 100000;

const RESULT = {
  blackjack: { tone: 'win', text: '¡BLACKJACK! Paga 3 a 2' },
  win: { tone: 'win', text: '¡Ganaste la mano!' },
  push: { tone: 'push', text: 'Empate: te devolvemos tu apuesta' },
  lose: { tone: 'lose', text: 'Perdiste esta mano' },
  surrender: { tone: 'lose', text: 'Te retiraste: recuperas la mitad' },
};
const PAIRS_LABEL = { mixed: 'Par mixto', colored: 'Par del mismo color', perfect: 'Par perfecto' };
const THREE_LABEL = {
  suitedTrips: 'Trío del mismo palo',
  straightFlush: 'Escalera de color',
  threeKind: 'Trío',
  straight: 'Escalera',
  flush: 'Color',
};

function Hand({ who, cards, label }) {
  const score = blackjackScore(cards);
  return (
    <div className={`bj-hand bj-${who}`}>
      <div className="bj-cards">
        {cards.map((c, i) => (
          <PlayingCard key={`${who}-${i}`} card={c} width={96} />
        ))}
        {cards.length === 0 && <div className="bj-slot" aria-hidden="true" />}
      </div>
      {cards.length > 0 && (
        <div className={`score-bubble ${score > 21 ? 'bust' : ''} ${score === 21 ? 'top' : ''}`} aria-label={`${label}: ${score}`}>
          {score}
        </div>
      )}
    </div>
  );
}

export default function Blackjack() {
  const { setUser } = useAuth();
  const [game, setGame] = useState(null);
  const [playerShown, setPlayerShown] = useState([]);
  const [dealerShown, setDealerShown] = useState([]);
  const [chip, setChip] = useState(50);
  const [bets, setBets] = useState({ main: 0, pairs: 0, three: 0 });
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
        setBets({ main: data.game.bet, pairs: data.game.pairsBet, three: data.game.threeBet });
        shownRef.current = { player: data.game.playerCards, dealer: data.game.dealerCards };
      }
    }).catch(() => {});
  }, []);

  // Muestra las cartas nuevas de a una: primero las del jugador, luego voltea la carta oculta del crupier
  // (misma carta, se voltea en 3D) y por último reparte las que le falten.
  const revealSequence = async (next, { reset = false } = {}) => {
    setDealing(true);
    let fromPlayer = reset ? [] : shownRef.current.player;
    let fromDealer = reset ? [] : shownRef.current.dealer;
    if (reset) {
      setPlayerShown([]);
      setDealerShown([]);
      await sleep(200);
    }

    // Reparto inicial: jugador, crupier, jugador, crupier (como en una mesa real)
    if (reset) {
      for (let i = 0; i < 2; i++) {
        await sleep(DEAL_DELAY);
        setPlayerShown(next.playerCards.slice(0, i + 1));
        await sleep(DEAL_DELAY);
        setDealerShown(next.dealerCards.slice(0, i + 1));
      }
      fromPlayer = next.playerCards.slice(0, 2);
      fromDealer = next.dealerCards.slice(0, 2);
    }

    for (let i = fromPlayer.length; i < next.playerCards.length; i++) {
      await sleep(DEAL_DELAY);
      setPlayerShown(next.playerCards.slice(0, i + 1));
    }

    if (fromDealer[1]?.hidden && !next.dealerCards[1]?.hidden) {
      await sleep(DEAL_DELAY + 200);
      fromDealer = [next.dealerCards[0], next.dealerCards[1]];
      setDealerShown(fromDealer);
    }
    for (let i = fromDealer.length; i < next.dealerCards.length; i++) {
      await sleep(DEAL_DELAY + 100);
      setDealerShown(next.dealerCards.slice(0, i + 1));
    }

    shownRef.current = { player: next.playerCards, dealer: next.dealerCards };
    await sleep(250);
    setGame(next);
    setDealing(false);
  };

  const run = async (request, opts) => {
    setError('');
    setBusy(true);
    try {
      const { data } = await request();
      await revealSequence(data.game, opts);
      setUser(data.user);
    } catch (err) {
      setError(getErrorMessage(err));
      setDealing(false);
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    run(() => api.post('/blackjack/start', { amount: bets.main, pairsBet: bets.pairs, threeBet: bets.three }), { reset: true });
  const action = (name) => run(() => api.post(`/blackjack/${game.id}/${name}`));
  const insurance = (take) => run(() => api.post(`/blackjack/${game.id}/insurance`, { take }));

  const active = game?.status === 'active';
  const finished = game?.status === 'finished';
  const locked = busy || dealing;
  const canBet = !active && !locked;
  const stake = bets.main + bets.pairs + bets.three;

  const addBet = (key) => canBet && setBets((b) => ({ ...b, [key]: Math.min(MAX_BET, b[key] + chip) }));
  const clearBet = (key) => setBets((b) => ({ ...b, [key]: 0 }));
  const clearAll = () => setBets({ main: 0, pairs: 0, three: 0 });

  const showResult = !dealing && finished;
  const res = showResult ? RESULT[game.result] : null;

  return (
    <div className="game-page wide bj-page">
      <div className="page-head">
        <h1>Blackjack</h1>
        <HelpPanel game="blackjack" />
      </div>

      <div className="felt bj-felt">
        <div className="table-banner">
          <strong>Blackjack paga 3 a 2</strong>
          <span>El crupier se planta en 17</span>
          <em>Seguro paga 2 a 1</em>
        </div>

        <div className="bj-zone">
          <span className="zone-name">Crupier</span>
          <Hand who="dealer" cards={dealerShown} label="Crupier" />
        </div>

        <div className="bj-middle" aria-live="polite">
          {!dealing && game?.canInsure && (
            <div className="insurance-box">
              <p>El crupier muestra un <strong>As</strong>. ¿Quieres el seguro?</p>
              <p className="muted small">Cuesta {formatChips(Math.floor(game.bet / 2))} fichas y paga 2 a 1 si el crupier tiene blackjack.</p>
              <div className="row">
                <button className="btn btn-gold" disabled={locked} onClick={() => insurance(true)}>Sí, asegurar</button>
                <button className="btn btn-ghost" disabled={locked} onClick={() => insurance(false)}>No, gracias</button>
              </div>
            </div>
          )}
          {res && (
            <div className={`result-banner ${res.tone}`}>
              <strong>{game.isHistoricBlackjack ? '¡BLACKJACK HISTÓRICO! Paga 10 a 1' : res.text}</strong>
              {game.payout > 0 && <span>+{formatChips(game.payout)} fichas</span>}
            </div>
          )}
          {showResult && game.insuranceBet > 0 && (
            <p className="side-note">
              Seguro: {game.insurancePayout > 0 ? `ganaste +${formatChips(game.insurancePayout)}` : `perdiste ${formatChips(game.insuranceBet)}`}
            </p>
          )}
          {!dealing && game?.pairsBet > 0 && (
            <p className={`side-note ${game.pairsType ? 'ok' : ''}`}>
              Perfect Pairs: {game.pairsType ? `${PAIRS_LABEL[game.pairsType]} +${formatChips(game.pairsPayout)}` : 'sin pareja'}
            </p>
          )}
          {!dealing && game?.threeBet > 0 && (
            <p className={`side-note ${game.threeType ? 'ok' : ''}`}>
              21+3: {game.threeType ? `${THREE_LABEL[game.threeType]} +${formatChips(game.threePayout)}` : 'sin combinación'}
            </p>
          )}
          {!res && !game?.canInsure && playerShown.length === 0 && <p className="muted center">Pon tus fichas y reparte</p>}
        </div>

        <div className="bj-zone">
          <Hand who="player" cards={playerShown} label="Tú" />
          <span className="zone-name">Tú</span>
        </div>

        <div className="spots-row">
          <BetSpot label="Perfect Pairs" sub="6 · 12 · 25 a 1" size={96} amount={bets.pairs} disabled={!canBet}
            onClick={() => addBet('pairs')} onClear={() => clearBet('pairs')} win={showResult && !!game.pairsType} />
          <BetSpot label="Apuesta" sub="principal" size={116} amount={bets.main} disabled={!canBet} className="main-spot"
            onClick={() => addBet('main')} onClear={() => clearBet('main')} win={showResult && (game.result === 'win' || game.result === 'blackjack')} />
          <BetSpot label="21 + 3" sub="hasta 100 a 1" size={96} amount={bets.three} disabled={!canBet}
            onClick={() => addBet('three')} onClear={() => clearBet('three')} win={showResult && !!game.threeType} />
        </div>
      </div>

      {error && <div className="alert alert-error center">{error}</div>}

      {active && !game.canInsure ? (
        <div className="action-bar">
          <button className="btn btn-gold" disabled={locked || !game.canHit} onClick={() => action('hit')}>Pedir carta</button>
          <button className="btn btn-ghost" disabled={locked || !game.canHit} onClick={() => action('stand')}>Plantarse</button>
          <button className="btn btn-ghost" disabled={locked || !game.canDouble} onClick={() => action('double')}>Doblar</button>
          <button className="btn btn-ghost btn-danger" disabled={locked || !game.canSurrender} onClick={() => action('surrender')}>Retirarse</button>
        </div>
      ) : !active ? (
        <>
          <ChipTray value={chip} onChange={setChip} disabled={locked} />
          <div className="action-bar">
            <button className="btn btn-ghost" onClick={clearAll} disabled={locked || stake === 0}>Limpiar apuestas</button>
            <button className="btn btn-gold deal-btn" onClick={start} disabled={locked || bets.main < 10}>
              {dealing ? 'Repartiendo…' : busy ? 'Procesando…' : `${finished ? 'Nueva mano' : 'Repartir'} · ${formatChips(stake)} fichas`}
            </button>
          </div>
          {bets.main > 0 && bets.main < 10 && <p className="muted small center">La apuesta mínima es 10 fichas.</p>}
        </>
      ) : null}
    </div>
  );
}
