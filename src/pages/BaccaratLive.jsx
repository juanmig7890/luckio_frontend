import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import { sleep } from '../utils/helpers';
import BcHand from '../components/BcHand';
import BetSpot from '../components/BetSpot';
import ChipTray from '../components/ChipTray';
import HelpPanel from '../components/HelpPanel';
import ModeTabs from '../components/ModeTabs';
import LiveBar from '../components/LiveBar';
import ResultBanner from '../components/motion/ResultBanner';
import useLiveTable from '../hooks/useLiveTable';

const EMPTY = { player: 0, banker: 0, tie: 0, playerPair: 0, bankerPair: 0 };
const WINNER_TEXT = { player: 'Gana el Punto', banker: 'Gana la Banca', tie: 'Empate' };
const MAX_BET = 100000;
const sum = (o) => Object.values(o).reduce((s, v) => s + v, 0);

// Bacará en vivo: una sola mano de Punto y Banca para toda la mesa, con apuestas individuales.
export default function BaccaratLive() {
  const { user } = useAuth();
  const [chip, setChip] = useState(50);
  const [draft, setDraft] = useState(EMPTY);
  const [placed, setPlaced] = useState(EMPTY);
  const [hands, setHands] = useState({ p: [], b: [] });
  const [round, setRound] = useState(null); // resultado de la ronda (público)
  const [dealt, setDealt] = useState(false); // ya terminó el reparto animado
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const runRef = useRef(0);

  const onResolving = useCallback(async (snap, { late } = {}) => {
    const r = snap.result;
    const run = ++runRef.current;
    setRound(r);
    setDealt(false);
    setHands({ p: [], b: [] });
    if (late) { // entraste a mitad de la ronda: se muestran las cartas ya repartidas
      setHands({ p: r.playerCards.map((card) => ({ card, down: false })), b: r.bankerCards.map((card) => ({ card, down: false })) });
      setDealt(true);
      return;
    }
    // Orden real: Punto, Banca, Punto, Banca y luego las terceras cartas (primero la del Punto)
    const order = [['p', 0], ['b', 0], ['p', 1], ['b', 1]];
    if (r.playerCards[2]) order.push(['p', 2]);
    if (r.bankerCards[2]) order.push(['b', 2]);
    for (const [who, i] of order) {
      const card = (who === 'p' ? r.playerCards : r.bankerCards)[i];
      await sleep(i === 2 ? 800 : 340);
      if (runRef.current !== run) return;
      setHands((h) => ({ ...h, [who]: [...h[who], { card, down: true }] }));
      await sleep(280);
      if (runRef.current !== run) return;
      setHands((h) => ({ ...h, [who]: h[who].map((c, idx) => (idx === i ? { ...c, down: false } : c)) }));
    }
    setDealt(true);
  }, []);

  const onOutcome = useCallback((o) => setOutcome(o), []);
  const live = useLiveTable('baccarat', { onResolving, onOutcome });
  const { state } = live;
  const phase = state?.phase;
  const betting = phase === 'betting' && live.status === 'online';

  // Cada ronda nueva empieza limpia (las cartas anteriores se quitan de la mesa)
  useEffect(() => {
    if (phase === 'betting') {
      runRef.current++;
      setPlaced(EMPTY); setDraft(EMPTY); setOutcome(null); setError(''); setRound(null); setDealt(false); setHands({ p: [], b: [] });
    }
  }, [state?.round, phase]);

  // En bacará real no se apuesta a Punto Y a Banca en la misma mano: una vez que apuestas de un lado
  // (ya confirmado o todavía en el borrador), el otro se bloquea hasta que limpies esa apuesta.
  const sideBlocked = (k) => (k === 'player' && draft.banker + placed.banker > 0) || (k === 'banker' && draft.player + placed.player > 0);
  const add = (k) => betting && !sideBlocked(k) && setDraft((b) => ({ ...b, [k]: Math.min(MAX_BET, b[k] + chip) }));
  const clearOne = (k) => setDraft((b) => ({ ...b, [k]: 0 }));

  const confirm = async () => {
    if (sum(draft) < 10 || sending) return;
    setSending(true);
    setError('');
    try {
      await live.placeBets(Object.fromEntries(Object.entries(draft).filter(([, v]) => v > 0)));
      setPlaced((p) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, p[k] + draft[k]])));
      setDraft(EMPTY);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const spot = (key, label, sub, extra = {}) => (
    <BetSpot key={key} label={label} sub={sub} amount={draft[key] + placed[key]} disabled={!betting || sideBlocked(key)} shape="rect"
      size={key === 'tie' || key === 'player' || key === 'banker' ? 118 : 96}
      onClick={() => add(key)} onClear={() => clearOne(key)} {...extra} />
  );
  const showOutcome = dealt && outcome && outcome.totalBet > 0;
  const won = (k) => showOutcome && outcome.payouts[k] > 0;
  const net = showOutcome ? outcome.totalWin - outcome.totalBet : 0;
  const extra = round ? [round.playerPair && 'pareja del Punto', round.bankerPair && 'pareja de la Banca'].filter(Boolean).join(' y ') : '';

  return (
    <div className="game-page wide">
      <div className="page-head">
        <h1>Bacará en vivo</h1>
        <ModeTabs current="live" soloTo="/game/baccarat" liveTo="/game/baccarat-live" />
        <HelpPanel game="baccaratLive" />
      </div>

      <LiveBar live={live} myName={user.username} />

      <div className="felt bc-felt">
        <div className="table-banner">
          <strong>Punto Banco · mesa compartida</strong>
          <span>Banca paga 1 a 1 (comisión 5%) · Empate 8 a 1 · Pares 11 a 1</span>
        </div>

        <div className="bc-hands">
          <BcHand title="Punto" list={hands.p} win={dealt && round?.winner === 'player'} />
          <BcHand title="Banca" list={hands.b} win={dealt && round?.winner === 'banker'} />
        </div>

        {dealt && round && (
          <ResultBanner tone={showOutcome ? (net > 0 ? 'win' : net === 0 ? 'push' : 'lose') : 'push'}>
            <strong>
              {WINNER_TEXT[round.winner]} {round.playerTotal} a {round.bankerTotal}{extra ? ` · ${extra}` : ''}.
              {showOutcome ? ` ${outcome.totalWin > 0 ? `Recibes ${formatChips(outcome.totalWin)} fichas` : 'No acertaste esta ronda'} (neto ${net >= 0 ? '+' : '−'}${formatChips(Math.abs(net))}).` : ''}
            </strong>
          </ResultBanner>
        )}

        <div className="bc-zones">
          {spot('playerPair', 'Pareja Punto', '11 a 1', { win: won('playerPair') })}
          {spot('player', 'Punto', '1 a 1', { win: won('player') })}
          {spot('tie', 'Empate', '8 a 1', { win: won('tie') })}
          {spot('banker', 'Banca', '1 a 1 · −5%', { win: won('banker') })}
          {spot('bankerPair', 'Pareja Banca', '11 a 1', { win: won('bankerPair') })}
        </div>
        {(draft.player + placed.player > 0 || draft.banker + placed.banker > 0) && (
          <p className="felt-note">No puedes apostar a Punto y a Banca en la misma mano (no se hace en una mesa real).</p>
        )}
      </div>

      <div className="scoreboard" aria-label="Marcador de la mesa">
        <span className="muted small">Marcador de la mesa</span>
        <div className="road">
          {[...(state?.history || [])].reverse().map((r, i) => (
            <span key={i} className={`dot ${r.winner}`} title={`${WINNER_TEXT[r.winner]} ${r.playerTotal} a ${r.bankerTotal}`}>
              {r.playerPair && <i className="pp" />}
              {r.bankerPair && <i className="bp" />}
            </span>
          ))}
          {!(state?.history || []).length && <span className="muted small">Aún no hay rondas</span>}
        </div>
        <div className="legend small muted"><span className="dot player" /> Punto <span className="dot banker" /> Banca <span className="dot tie" /> Empate</div>
      </div>

      {error && <div className="alert alert-error center">{error}</div>}

      <ChipTray value={chip} onChange={setChip} disabled={!betting} />
      <div className="action-bar">
        <button className="btn btn-ghost" onClick={() => setDraft(EMPTY)} disabled={!betting || sum(draft) === 0}>Limpiar</button>
        <button className="btn btn-gold deal-btn" onClick={confirm} disabled={!betting || sum(draft) < 10 || sending}>
          {sending ? 'Enviando…' : `Apostar · ${formatChips(sum(draft))} fichas`}
        </button>
      </div>
      {sum(placed) > 0 && <p className="muted small center">Ya apostaste {formatChips(sum(placed))} fichas en esta ronda.</p>}
    </div>
  );
}
