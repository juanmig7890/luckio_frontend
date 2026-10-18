import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import ChipTray from '../components/ChipTray';
import HelpPanel from '../components/HelpPanel';
import ModeTabs from '../components/ModeTabs';
import { Wheel, RouletteBoard } from '../components/roulette/RouletteParts';
import { MAX_DISTINCT_BETS, addChip, colorOf, describe } from '../components/roulette/rouletteUtils';
import useWheel from '../hooks/useWheel';

export default function Roulette() {
  const { setUser } = useAuth();
  const wheel = useWheel();
  const [chip, setChip] = useState(50);
  const [bets, setBets] = useState([]);
  const [stack, setStack] = useState([]);
  const [lastBets, setLastBets] = useState([]);
  const [busy, setBusy] = useState(false);
  const [resultNumber, setResultNumber] = useState(null);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const [hotNumbers, setHotNumbers] = useState([]);

  useEffect(() => {
    api.get('/roulette/hot-numbers').then(({ data }) => setHotNumbers(data.hotNumbers)).catch(() => {});
  }, []);

  const spinning = busy || wheel.spinning;
  const isHot = (n) => hotNumbers.some((h) => h.number === n);
  const totalBet = bets.reduce((s, b) => s + b.amount, 0);
  const amountOf = (betType, selection) => bets.find((b) => b.key === `${betType}:${selection}`)?.amount || 0;

  const addBet = (betType, selection) => {
    if (spinning) return;
    const key = `${betType}:${selection}`;
    if (!bets.some((b) => b.key === key) && bets.length >= MAX_DISTINCT_BETS) {
      setMessage({ type: 'error', text: `Máximo ${MAX_DISTINCT_BETS} apuestas distintas por tirada` });
      return;
    }
    setMessage(null);
    setBets((prev) => addChip(prev, betType, selection, chip));
    setStack((s) => [...s, { key, amount: chip }]);
  };

  const undo = () => {
    const last = stack[stack.length - 1];
    if (!last || spinning) return;
    setStack((s) => s.slice(0, -1));
    setBets((prev) => prev.flatMap((b) => (b.key !== last.key ? [b] : b.amount - last.amount > 0 ? [{ ...b, amount: b.amount - last.amount }] : [])));
  };
  const clear = () => { setBets([]); setStack([]); };
  const rebet = () => { setBets(lastBets); setStack(lastBets.map((b) => ({ key: b.key, amount: b.amount }))); };

  const spin = async () => {
    if (!bets.length || spinning) return;
    setMessage(null);
    setResults([]);
    setBusy(true);
    try {
      const { data } = await api.post('/roulette/spin', { bets: bets.map(({ betType, selection, amount }) => ({ betType, selection, amount })) });
      await wheel.spinTo(data.number);

      setResultNumber(data.number);
      setHistory((h) => [data.number, ...h].slice(0, 14));
      setHotNumbers(data.hotNumbers);
      setResults(data.results);
      setLastBets(bets);
      setUser(data.user);
      setBets([]);
      setStack([]);

      const won = data.results.some((r) => r.won);
      const hot = data.results.some((r) => r.won && r.isHot);
      const partage = data.results.reduce((s, r) => s + r.laPartage, 0);
      if (won) setMessage({ type: 'success', text: `Salió el ${data.number}${hot ? ' (¡número caliente!)' : ''}. Ganaste ${formatChips(data.totalWin)} fichas.` });
      else if (partage > 0) setMessage({ type: 'success', text: `Salió el 0. La Partage te devuelve ${formatChips(partage)} fichas.` });
      else setMessage({ type: 'error', text: `Salió el ${data.number}. Perdiste ${formatChips(data.totalBet)} fichas.` });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  // Propiedades comunes de cada casilla del tapete
  const cp = (betType, selection) => ({
    betType,
    selection,
    amount: amountOf(betType, selection),
    disabled: spinning,
    onBet: addBet,
    hit: betType === 'straight' && resultNumber === selection && !spinning,
  });

  return (
    <div className="game-page wide">
      <div className="page-head">
        <h1>Ruleta</h1>
        <ModeTabs current="solo" soloTo="/game/roulette" liveTo="/game/roulette-live" />
        <HelpPanel game="roulette" />
      </div>

      <div className="rl-layout">
        <div className="rl-side">
          <Wheel rotation={wheel.rotation} ball={wheel.ball} spinning={wheel.spinning} number={resultNumber} />
          <div className="history-row">
            {history.map((n, i) => <span key={i} className={`mini-num ${colorOf(n)}`}>{n}</span>)}
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
          <p className="felt-note">Pleno 35 a 1 · Docenas y columnas 2 a 1 · Rojo/Negro, Par/Impar, 1-18/19-36 1 a 1 · En el 0, las apuestas simples recuperan la mitad</p>
        </div>
      </div>

      {message && <div className={`alert alert-${message.type} center`}>{message.text}</div>}

      {results.length > 0 && (
        <div className="bet-slip-list center">
          {results.map((r, i) => (
            <span key={i} className={`bet-chip ${r.won ? 'win' : r.laPartage > 0 ? 'push' : 'lose'}`}>
              {describe(r)}: {r.won ? `+${formatChips(r.winAmount)}${r.isHot ? ' (caliente)' : ''}` : r.laPartage > 0 ? `+${formatChips(r.laPartage)} (La Partage)` : `-${formatChips(r.amount)}`}
            </span>
          ))}
        </div>
      )}

      <ChipTray value={chip} onChange={setChip} disabled={spinning} />
      <div className="action-bar">
        <button className="btn btn-ghost" onClick={undo} disabled={spinning || stack.length === 0}>Deshacer</button>
        <button className="btn btn-ghost" onClick={clear} disabled={spinning || bets.length === 0}>Limpiar</button>
        <button className="btn btn-ghost" onClick={rebet} disabled={spinning || bets.length > 0 || lastBets.length === 0}>Repetir apuesta</button>
        <button className="btn btn-gold deal-btn" onClick={spin} disabled={spinning || bets.length === 0}>
          {spinning ? 'Girando…' : `Girar · ${formatChips(totalBet)} fichas`}
        </button>
      </div>
    </div>
  );
}
