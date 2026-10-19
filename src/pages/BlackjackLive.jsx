import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import PlayingCard from '../components/PlayingCard';
import ChipStack from '../components/ChipStack';
import ChipTray from '../components/ChipTray';
import HelpPanel from '../components/HelpPanel';
import ModeTabs from '../components/ModeTabs';
import ResultBanner from '../components/motion/ResultBanner';
import useLiveBlackjack from '../hooks/useLiveBlackjack';
import { useCountdown } from '../hooks/useLiveTable';

const MAX_BET = 100000;
const CARD_STAGGER = 190; // ms entre cada carta del reparto inicial
const SEAT_COUNT = 6;

// Orden del reparto inicial: TODAS las sillas primero (sus 2 cartas, por rondas, en orden de silla) y el
// crupier al final — como pidió el usuario, en vez de que cada silla reparta sus cartas en paralelo.
// Lo que llega después (pedir, dividir, el crupier completando su mano) no entra en este reparto: ya pasa
// en tiempo real, cada cosa en su propio momento; si llegan varias cartas juntas (el crupier pidiendo
// varias veces de un tirón) se escalonan entre ellas para que no aparezcan todas de golpe.
function dealOrder(seats) {
  const dealt = seats.map((d, i) => (d && d.hands.length > 0 ? i : null)).filter((i) => i !== null);
  const seatSlot = (seatIndex) => dealt.indexOf(seatIndex);
  const forHand = (seatIndex, hand, cardIndex) => {
    if (cardIndex >= 2) return (cardIndex - 2) * CARD_STAGGER;
    if (hand.fromSplit) return 0; // una mano dividida nace a mitad de la partida, no es parte del reparto inicial
    return (cardIndex * dealt.length + seatSlot(seatIndex)) * CARD_STAGGER;
  };
  const forDealer = (cardIndex) => (cardIndex >= 2 ? (cardIndex - 2) * CARD_STAGGER : (2 * dealt.length + cardIndex) * CARD_STAGGER);
  return { forHand, forDealer };
}

const PHASE_LABEL = {
  idle: 'Mesa en pausa',
  betting: 'Apuestas abiertas',
  dealing: 'Repartiendo…',
  insurance: 'El crupier muestra un As',
  playing: 'En juego',
  dealer: 'Juega el crupier…',
  results: 'Resultado de la ronda',
};
const RESULT_TAG = { blackjack: 'Blackjack', win: 'Ganó', push: 'Empate', lose: 'Perdió', surrender: 'Retirada' };
const PAIRS_LABEL = { mixed: 'mixto', colored: 'color', perfect: 'perfecto' };
const BET_FIELD = { main: 'mainBet', pairs: 'pairsBet', three: 'threeBet' };

// Casilla de apuesta con una pila compacta de fichas (como máximo 4, de colores distintos) en vez de un
// solo ícono o una fila que se amontona con muchos clics.
function StackSpot({ label, sub, amount, locked, disabled, size = 92, className = '', win = false, onClick, onClear }) {
  return (
    <div className={`spot spot-rect ${amount > 0 ? 'has' : ''} ${win ? 'win' : ''} ${locked ? 'locked' : ''} ${className}`} style={{ '--s': `${size}px` }}>
      <button type="button" className="spot-btn" onClick={onClick} disabled={disabled} aria-label={`Apostar en ${label}`}>
        <span className="spot-label">{label}</span>
        {sub && <span className="spot-sub">{sub}</span>}
        {amount > 0 && (
          <span className="spot-chip">
            <ChipStack amount={amount} size={Math.round(size * 0.44)} />
          </span>
        )}
      </button>
      {amount > 0 && <span className="spot-amount">{formatChips(amount)}</span>}
      {amount > 0 && !locked && !disabled && (
        <button type="button" className="spot-clear" onClick={onClear} aria-label={`Quitar apuesta de ${label}`}>
          ✕
        </button>
      )}
    </div>
  );
}

function HandView({ hand, small, getDelay }) {
  return (
    <div className={`bj-hand ${hand.active ? 'active' : ''} ${small ? 'small' : ''}`}>
      <div className="bj-cards">
        {hand.cards.map((c, i) => (
          <PlayingCard key={i} card={c} width={small ? 58 : 76} delay={getDelay(i)} />
        ))}
      </div>
      <div className={`score-bubble inline ${hand.score > 21 ? 'bust' : ''} ${hand.score === 21 ? 'top' : ''}`}>{hand.score}</div>
      {hand.bet > 0 && <span className="hand-bet">{formatChips(hand.bet)}</span>}
      {hand.done && hand.result && (
        <span className={`hand-tag ${hand.result === 'lose' ? 'lose' : hand.result === 'push' ? 'push' : 'win'}`}>
          {hand.charlie ? 'Charlie' : RESULT_TAG[hand.result]}
          {hand.payout > 0 ? ` +${formatChips(hand.payout)}` : ''}
        </span>
      )}
    </div>
  );
}

function Seat({ seat, data, isMine, isTurn, canSit, sitting, onSit, forHand }) {
  if (!data) {
    return (
      <div className="bjl-seat empty">
        <span className="seat-no">Silla {seat + 1}</span>
        {canSit ? (
          <button type="button" className="btn btn-ghost" disabled={sitting} onClick={() => onSit(seat)}>
            {sitting ? 'Sentando…' : 'Sentarse'}
          </button>
        ) : (
          <span className="muted small">Vacía</span>
        )}
      </div>
    );
  }
  return (
    <div className={`bjl-seat ${isMine ? 'mine' : ''} ${isTurn ? 'turn' : ''}`}>
      <div className="bjl-seat-head">
        <span className="avatar">{(data.name || '?').slice(0, 1).toUpperCase()}</span>
        <span className="pname">{isMine ? 'Tú' : data.name}</span>
        <span className="seat-no">#{seat + 1}</span>
      </div>
      {data.hands.length === 0 ? (
        <p className="muted small center">{data.sitting ? 'Sin apuesta esta ronda' : ''}</p>
      ) : (
        <div className="bjl-hands">
          {data.hands.map((h, i) => (
            <HandView key={i} hand={h} small={data.hands.length > 1} getDelay={(cardIndex) => forHand(seat, h, cardIndex)} />
          ))}
        </div>
      )}
      {data.pairsBet > 0 && (
        <p className={`side-note ${data.pairsType ? 'ok' : ''}`}>
          PP: {data.pairsType ? `${PAIRS_LABEL[data.pairsType]} +${formatChips(data.pairsPayout)}` : `sin par`}
        </p>
      )}
      {data.threeBet > 0 && <p className={`side-note ${data.threeType ? 'ok' : ''}`}>21+3: {data.threeType ? `+${formatChips(data.threePayout)}` : 'sin jugada'}</p>}
      {data.insurance === 'taken' && <p className="side-note">Seguro: {data.insurancePayout > 0 ? `+${formatChips(data.insurancePayout)}` : `-${formatChips(data.insuranceBet)}`}</p>}
    </div>
  );
}

export default function BlackjackLive() {
  const { user } = useAuth();
  const [chip, setChip] = useState(50);
  const [draft, setDraft] = useState({ main: 0, pairs: 0, three: 0 }); // borrador de apuesta (aún no confirmada)
  const [sending, setSending] = useState(false);
  const [sitting, setSitting] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [resetRound, setResetRound] = useState(null); // última ronda para la que ya se limpió el borrador local

  const onOutcome = useCallback((o) => setOutcome(o), []);
  const live = useLiveBlackjack({ onOutcome });
  const { state, mySeat, offset } = live;
  const seconds = useCountdown(state?.endsAt, offset);
  const phase = state?.phase || 'idle';
  const online = live.status === 'online';
  const betting = phase === 'betting' && online;
  const mySeatData = mySeat != null ? state?.seats?.[mySeat] : null;
  const myTurn = Boolean(state?.turn && mySeat != null && state.turn.seat === mySeat);
  const myHand = myTurn ? mySeatData?.hands?.[state.turn.hand] : null;
  const alreadyBet = Boolean(mySeatData?.mainBet > 0);
  const needsInsurance = phase === 'insurance' && mySeatData?.insurance === 'offered';
  const canSitSomewhere = mySeat == null && ['betting', 'results', 'idle'].includes(phase);
  const canStandUp = mySeat != null && ['betting', 'results', 'idle'].includes(phase) && !alreadyBet;
  const seats = state?.seats || Array(SEAT_COUNT).fill(null);
  const { forHand, forDealer } = dealOrder(seats);
  const draftTotal = draft.main + draft.pairs + draft.three;
  const net = outcome ? outcome.totalWin - outcome.totalBet : 0;

  // Lo que se ve en cada casilla: mientras se arma la apuesta es el borrador local; si ya se confirmó pero
  // la página se acaba de cargar (no hay borrador local), se muestra el monto real del servidor.
  const amountFor = (key) => draft[key] || mySeatData?.[BET_FIELD[key]] || 0;

  // Cada ronda nueva empieza con el borrador limpio (ajuste de estado durante el render, sin efecto: ver
  // "You Might Not Need an Effect" en react.dev para este patrón de resetear al cambiar una ronda).
  if (phase === 'betting' && state?.round != null && state.round !== resetRound) {
    setResetRound(state.round);
    setDraft({ main: 0, pairs: 0, three: 0 });
    setOutcome(null);
    setError('');
  }

  const sitAt = async (seat) => {
    setSitting(true);
    setError('');
    try {
      await live.sit(seat);
    } catch (err) {
      setError(err.message);
    } finally {
      setSitting(false);
    }
  };

  const standUp = async () => {
    setError('');
    try {
      await live.standUp();
    } catch (err) {
      setError(err.message);
    }
  };

  const addChip = (key) => betting && !alreadyBet && draft[key] + chip <= MAX_BET && setDraft((d) => ({ ...d, [key]: d[key] + chip }));
  const clearChip = (key) => setDraft((d) => ({ ...d, [key]: 0 }));
  const clearAll = () => setDraft({ main: 0, pairs: 0, three: 0 });

  const confirmBet = async () => {
    if (draft.main < 10 || sending || mySeat == null) return;
    setSending(true);
    setError('');
    try {
      await live.bet(mySeat, draft);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const act = async (type) => {
    if (mySeat == null || sending) return;
    setSending(true);
    setError('');
    try {
      await live.act(mySeat, type);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const decideInsurance = async (take) => {
    if (mySeat == null || sending) return;
    setSending(true);
    setError('');
    try {
      await live.insurance(mySeat, take);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const phaseClock = phase === 'results' ? 'results' : phase === 'dealer' || phase === 'insurance' || phase === 'dealing' ? 'resolving' : '';
  const totalMs = Math.max(1, (state?.phaseMs || 20000) / 1000);

  return (
    <div className="game-page wide">
      <div className="page-head">
        <h1>Blackjack en vivo</h1>
        <ModeTabs current="live" soloTo="/game/blackjack" liveTo="/game/blackjack-live" />
        <HelpPanel game="blackjackLive" />
      </div>

      <div className="live-bar" role="status">
        <div className={`live-clock phase-${phaseClock}`}>
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="19" className="track" />
            <circle
              cx="22" cy="22" r="19" className="arc" strokeDasharray={119.4}
              style={{ strokeDashoffset: 119.4 * (1 - Math.min(1, seconds / totalMs)), transition: 'stroke-dashoffset 0.25s linear' }}
            />
          </svg>
          <b>{phase === 'idle' ? '–' : seconds}</b>
        </div>
        <div className="live-info">
          <strong>
            {online
              ? myTurn
                ? '¡Es tu turno!'
                : PHASE_LABEL[phase]
              : live.status === 'connecting'
              ? 'Conectando a la mesa…'
              : live.status === 'offline'
              ? 'Sin conexión, reintentando…'
              : live.error || 'No se pudo conectar'}
          </strong>
          <span className="muted small">
            {!online && (live.status === 'connecting' || live.status === 'offline')
              ? 'Puede tardar hasta un minuto si el servidor estaba dormido.'
              : `Ronda ${state?.round ?? '–'} · ${seats.filter(Boolean).length}/${SEAT_COUNT} sillas ocupadas${state?.shoe ? ` · Zapato: ${state.shoe.remaining}/${state.shoe.size} cartas` : ''}`}
          </span>
        </div>
      </div>

      <div className="felt bjl-felt">
        <div className="table-banner">
          <strong>Blackjack en vivo · 6 sillas independientes</strong>
          <span>Blackjack paga 3 a 2 · El crupier se planta en 17</span>
          <em>Un mismo crupier para toda la mesa · cada silla juega su propia mano</em>
        </div>

        <div className="bjl-dealer">
          <span className="zone-name">Crupier</span>
          <div className="bj-hand">
            <div className="bj-cards">
              {(state?.dealer?.cards || []).map((c, i) => (
                <PlayingCard key={i} card={c} width={88} delay={forDealer(i)} />
              ))}
              {!state?.dealer?.cards?.length && <div className="bj-slot" aria-hidden="true" />}
            </div>
            {state?.dealer?.cards?.length > 0 && <div className="score-bubble">{state.dealer.score}</div>}
          </div>
        </div>

        {needsInsurance && (
          <div className="insurance-box">
            <p>
              El crupier muestra un <strong>As</strong>. ¿Quieres el seguro?
            </p>
            <p className="muted small">Cuesta la mitad de tu apuesta y paga 2 a 1 si el crupier tiene blackjack.</p>
            <div className="row">
              <button type="button" className="btn btn-gold" disabled={sending} onClick={() => decideInsurance(true)}>
                Sí, asegurar
              </button>
              <button type="button" className="btn btn-ghost" disabled={sending} onClick={() => decideInsurance(false)}>
                No, gracias
              </button>
            </div>
          </div>
        )}

        <div className="bjl-seats">
          {seats.map((data, i) => (
            <Seat key={i} seat={i} data={data} isMine={i === mySeat} isTurn={state?.turn?.seat === i} canSit={canSitSomewhere} sitting={sitting} onSit={sitAt} forHand={forHand} />
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error center">{error}</div>}

      {outcome && (
        <ResultBanner tone={net > 0 ? 'win' : net === 0 ? 'push' : 'lose'}>
          <strong>
            Ronda {outcome.round}: {outcome.totalWin > 0 ? `recibiste ${formatChips(outcome.totalWin)} fichas` : 'no ganaste esta ronda'} (neto{' '}
            {net >= 0 ? '+' : '−'}
            {formatChips(Math.abs(net))}).
          </strong>
        </ResultBanner>
      )}

      {mySeat != null && !needsInsurance && myTurn && myHand && (
        <div className="action-bar">
          <button type="button" className="btn btn-gold" disabled={sending || !myHand.canHit} onClick={() => act('hit')}>
            Pedir carta
          </button>
          <button type="button" className="btn btn-ghost" disabled={sending} onClick={() => act('stand')}>
            Plantarse
          </button>
          <button type="button" className="btn btn-ghost" disabled={sending || !myHand.canDouble} onClick={() => act('double')}>
            Doblar
          </button>
          <button type="button" className="btn btn-ghost" disabled={sending || !myHand.canSplit} onClick={() => act('split')}>
            Dividir
          </button>
          <button type="button" className="btn btn-ghost btn-danger" disabled={sending || !myHand.canSurrender} onClick={() => act('surrender')}>
            Retirarse
          </button>
        </div>
      )}

      {mySeat != null && betting && (
        <>
          <div className="spots-row">
            <StackSpot label="Perfect Pairs" sub="6 · 12 · 25 a 1" size={90} amount={amountFor('pairs')} locked={alreadyBet} disabled={!betting || alreadyBet} onClick={() => addChip('pairs')} onClear={() => clearChip('pairs')} />
            <StackSpot label="Apuesta" sub="principal" size={110} amount={amountFor('main')} locked={alreadyBet} disabled={!betting || alreadyBet} className="main-spot" onClick={() => addChip('main')} onClear={() => clearChip('main')} />
            <StackSpot label="21 + 3" sub="hasta 100 a 1" size={90} amount={amountFor('three')} locked={alreadyBet} disabled={!betting || alreadyBet} onClick={() => addChip('three')} onClear={() => clearChip('three')} />
          </div>
          {!alreadyBet ? (
            <>
              <ChipTray value={chip} onChange={setChip} disabled={!betting} />
              <div className="action-bar">
                <button type="button" className="btn btn-ghost" onClick={clearAll} disabled={sending || draftTotal === 0}>
                  Limpiar
                </button>
                <button type="button" className="btn btn-gold deal-btn" onClick={confirmBet} disabled={sending || draft.main < 10}>
                  {sending ? 'Enviando…' : `Apostar · ${formatChips(draftTotal)} fichas`}
                </button>
              </div>
              {draft.main > 0 && draft.main < 10 && <p className="muted small center">La apuesta principal mínima es 10 fichas.</p>}
            </>
          ) : (
            <p className="muted center small">
              Ya apostaste {formatChips(mySeatData.mainBet + mySeatData.pairsBet + mySeatData.threeBet)} fichas. Esperando a que reparta el crupier…
            </p>
          )}
        </>
      )}

      {mySeat != null && canStandUp && (
        <button type="button" className="btn btn-ghost btn-block" onClick={standUp}>
          Levantarse de la silla
        </button>
      )}

      {mySeat == null && !canSitSomewhere && <p className="muted center small">Espera a que termine la ronda para sentarte en una silla libre.</p>}
      {mySeat == null && canSitSomewhere && <p className="muted center small">Elige una silla libre para empezar a jugar, {user.username}.</p>}
    </div>
  );
}
