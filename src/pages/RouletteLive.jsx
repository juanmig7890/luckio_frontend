import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import ChipTray from '../components/ChipTray';
import HelpPanel from '../components/HelpPanel';
import ModeTabs from '../components/ModeTabs';
import LiveBar from '../components/LiveBar';
import ResultBanner from '../components/motion/ResultBanner';
import { Wheel, RouletteBoard } from '../components/roulette/RouletteParts';
import { MAX_DISTINCT_BETS, addChip, colorOf, describe } from '../components/roulette/rouletteUtils';
import useWheel from '../hooks/useWheel';
import useLiveTable from '../hooks/useLiveTable';

// Ruleta en vivo: una sola mesa compartida. Todos ven el mismo giro; cada quien apuesta y cobra lo suyo.
export default function RouletteLive() {
  const { user } = useAuth();
  const wheel = useWheel();
  const [chip, setChip] = useState(50);
  const [draft, setDraft] = useState([]); // fichas puestas en el tapete pero aún no enviadas
  const [stack, setStack] = useState([]);
  const [placed, setPlaced] = useState([]); // apuestas ya confirmadas (cobradas) en esta ronda
  const [resultNumber, setResultNumber] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [hotNumbers, setHotNumbers] = useState([]);

  const onResolving = useCallback((snap, { late } = {}) => {
    setHotNumbers(snap.result.hotNumbers || []);
    if (late) { setResultNumber(snap.result.number); return; } // entraste a mitad del giro: solo mostramos el número
    wheel.spinTo(snap.result.number).then(() => setResultNumber(snap.result.number));
  }, [wheel.spinTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const onOutcome = useCallback((o) => setOutcome(o), []);
  const live = useLiveTable('roulette', { onResolving, onOutcome });
  const { state } = live;
  const phase = state?.phase;
  const round = state?.round;
  const betting = phase === 'betting' && live.status === 'online';

  useEffect(() => {
    api.get('/roulette/hot-numbers').then(({ data }) => setHotNumbers(data.hotNumbers)).catch(() => {});
  }, []);

  // Cada ronda nueva empieza limpia
  useEffect(() => {
    if (phase === 'betting') { setPlaced([]); setOutcome(null); setError(''); }
  }, [round, phase]);

  const isHot = (n) => hotNumbers.some((h) => h.number === n);
  const draftTotal = draft.reduce((s, b) => s + b.amount, 0);
  const placedTotal = placed.reduce((s, b) => s + b.amount, 0);
  const amountOf = (list, key) => list.find((b) => b.key === key)?.amount || 0;

  const addBet = (betType, selection) => {
    if (!betting) return;
    const key = `${betType}:${selection}`;
    const known = new Set([...draft, ...placed].map((b) => b.key));
    if (!known.has(key) && known.size >= MAX_DISTINCT_BETS) { setError(`Máximo ${MAX_DISTINCT_BETS} apuestas distintas por ronda`); return; }
    setError('');
    setDraft((prev) => addChip(prev, betType, selection, chip));
    setStack((s) => [...s, { key, amount: chip }]);
  };
  const undo = () => {
    const last = stack[stack.length - 1];
    if (!last) return;
    setStack((s) => s.slice(0, -1));
    setDraft((prev) => prev.flatMap((b) => (b.key !== last.key ? [b] : b.amount - last.amount > 0 ? [{ ...b, amount: b.amount - last.amount }] : [])));
  };
  const clear = () => { setDraft([]); setStack([]); };

  const confirm = async () => {
    if (!draft.length || sending) return;
    setSending(true);
    setError('');
    try {
      await live.placeBets(draft.map(({ betType, selection, amount }) => ({ betType, selection, amount })));
      setPlaced((prev) => draft.reduce((acc, b) => addChip(acc, b.betType, b.selection, b.amount), prev));
      setDraft([]);
      setStack([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const cp = (betType, selection) => {
    const key = `${betType}:${selection}`;
    return {
      betType,
      selection,
      amount: amountOf(draft, key) + amountOf(placed, key),
      placed: amountOf(placed, key) > 0,
      disabled: !betting,
      onBet: addBet,
      hit: betType === 'straight' && resultNumber === selection && !wheel.spinning && phase !== 'betting',
    };
  };

  const mine = outcome && outcome.totalBet > 0 ? outcome : null;
  const won = mine?.results?.some((r) => r.won);
  const partage = mine?.results?.reduce((s, r) => s + r.laPartage, 0) || 0;

  return (
    <div className="game-page wide">
      <div className="page-head">
        <h1>Ruleta en vivo</h1>
        <ModeTabs current="live" soloTo="/game/roulette" liveTo="/game/roulette-live" />
        <HelpPanel game="rouletteLive" />
      </div>

      <LiveBar live={live} myName={user.username} />

      <div className="rl-layout">
        <div className="rl-side">
          <Wheel rotation={wheel.rotation} ball={wheel.ball} spinning={wheel.spinning} number={resultNumber} />
          <div className="history-row">
            {(state?.history || []).slice(0, 14).map((h, i) => <span key={i} className={`mini-num ${h.color}`}>{h.number}</span>)}
          </div>
          {hotNumbers.length > 0 && (
            <p className="hot-numbers-row">
              Calientes:
              {hotNumbers.map((h) => (
                <span key={h.number} className={`mini-num ${colorOf(h.number)}`} title={`${h.hits} veces recientes`}>{h.number}</span>
              ))}
            </p>
          )}
        </div>

        <div className="felt rl-felt">
          <RouletteBoard cp={cp} isHot={isHot} />
          <p className="felt-note">Las fichas con borde dorado ya están apostadas y cobradas. Las demás se envían al pulsar «Apostar».</p>
        </div>
      </div>

      {error && <div className="alert alert-error center">{error}</div>}

      {mine && (
        <ResultBanner tone={won ? 'win' : partage > 0 ? 'push' : 'lose'}>
          <strong>
            Salió el {mine.number}.{' '}
            {won ? `Ganaste ${formatChips(mine.totalWin)} fichas` : partage > 0 ? `La Partage te devuelve ${formatChips(partage)}` : `Perdiste ${formatChips(mine.totalBet)} fichas`}
          </strong>
        </ResultBanner>
      )}
      {mine && (
        <div className="bet-slip-list center">
          {mine.results.map((r, i) => (
            <span key={i} className={`bet-chip ${r.won ? 'win' : r.laPartage > 0 ? 'push' : 'lose'}`}>
              {describe(r)}: {r.won ? `+${formatChips(r.winAmount)}${r.isHot ? ' (caliente)' : ''}` : r.laPartage > 0 ? `+${formatChips(r.laPartage)} (La Partage)` : `-${formatChips(r.amount)}`}
            </span>
          ))}
        </div>
      )}
      {!mine && outcome && <p className="muted center small">Esta ronda no apostaste. ¡La siguiente empieza enseguida!</p>}

      <ChipTray value={chip} onChange={setChip} disabled={!betting} />
      <div className="action-bar">
        <button className="btn btn-ghost" onClick={undo} disabled={!betting || stack.length === 0}>Deshacer</button>
        <button className="btn btn-ghost" onClick={clear} disabled={!betting || draft.length === 0}>Limpiar</button>
        <button className="btn btn-gold deal-btn" onClick={confirm} disabled={!betting || draft.length === 0 || sending}>
          {sending ? 'Enviando…' : `Apostar · ${formatChips(draftTotal)} fichas`}
        </button>
      </div>
      {placedTotal > 0 && <p className="muted small center">Ya apostaste {formatChips(placedTotal)} fichas en esta ronda.</p>}
    </div>
  );
}
