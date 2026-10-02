import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';

const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const colorOf = (n) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

// Orden real de la rueda europea (no es el orden numérico de la mesa)
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
];
const SEG = 360 / WHEEL_ORDER.length;
const SPIN_MS = 3200;

const WHEEL_HEX = { red: '#c0392b', black: '#1c1c1c', green: '#1e8449' };
const WHEEL_GRADIENT = WHEEL_ORDER.map((n, i) => {
  const c = WHEEL_HEX[colorOf(n)];
  return `${c} ${(i * SEG).toFixed(3)}deg ${((i + 1) * SEG).toFixed(3)}deg`;
}).join(', ');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BET_OPTIONS = [
  { betType: 'color', selection: 'red', label: 'Rojo', mult: '2x', cls: 'red' },
  { betType: 'color', selection: 'black', label: 'Negro', mult: '2x', cls: 'black' },
  { betType: 'parity', selection: 'even', label: 'Par', mult: '2x' },
  { betType: 'parity', selection: 'odd', label: 'Impar', mult: '2x' },
  { betType: 'half', selection: 'low', label: '1-18', mult: '2x' },
  { betType: 'half', selection: 'high', label: '19-36', mult: '2x' },
  { betType: 'dozen', selection: 1, label: '1ª Docena', mult: '3x' },
  { betType: 'dozen', selection: 2, label: '2ª Docena', mult: '3x' },
  { betType: 'dozen', selection: 3, label: '3ª Docena', mult: '3x' },
  { betType: 'column', selection: 1, label: 'Columna 1', mult: '3x' },
  { betType: 'column', selection: 2, label: 'Columna 2', mult: '3x' },
  { betType: 'column', selection: 3, label: 'Columna 3', mult: '3x' },
];

const describeChoice = ({ betType, selection }) => {
  switch (betType) {
    case 'straight': return `Número ${selection}`;
    case 'color': return selection === 'red' ? 'Rojo' : 'Negro';
    case 'parity': return selection === 'even' ? 'Par' : 'Impar';
    case 'half': return selection === 'low' ? 'Bajo (1-18)' : 'Alto (19-36)';
    case 'dozen': return `${selection}ª Docena`;
    case 'column': return `Columna ${selection}`;
    default: return '';
  }
};

export default function Roulette() {
  const { setUser } = useAuth();
  const [chip, setChip] = useState(50);
  const [bets, setBets] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultNumber, setResultNumber] = useState(null);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const [hotNumbers, setHotNumbers] = useState([]);

  useEffect(() => {
    api.get('/roulette/hot-numbers').then(({ data }) => setHotNumbers(data.hotNumbers)).catch(() => {});
  }, []);

  const isHotNumber = (n) => hotNumbers.some((h) => h.number === n);
  const totalBet = bets.reduce((s, b) => s + b.amount, 0);

  const addBet = (betType, selection) => {
    if (spinning) return;
    const key = `${betType}:${selection}`;
    setBets((prev) => {
      const existing = prev.find((b) => b.key === key);
      if (existing) return prev.map((b) => (b.key === key ? { ...b, amount: b.amount + Number(chip) } : b));
      return [...prev, { key, betType, selection, amount: Number(chip) }];
    });
  };
  const removeBet = (key) => setBets((prev) => prev.filter((b) => b.key !== key));
  const clearBets = () => setBets([]);

  const rotateWheelTo = (number) => {
    const idx = WHEEL_ORDER.indexOf(number);
    const theta = idx * SEG + SEG / 2;
    setRotation((prev) => {
      const currentMod = ((prev % 360) + 360) % 360;
      const targetMod = ((-theta % 360) + 360) % 360;
      let delta = targetMod - currentMod;
      if (delta <= 0) delta += 360;
      return prev + delta + 360 * 5;
    });
  };

  const spin = async () => {
    if (bets.length === 0 || spinning) return;
    setMessage(null);
    setResults([]);
    setSpinning(true);
    try {
      const payload = { bets: bets.map(({ betType, selection, amount }) => ({ betType, selection, amount })) };
      const { data } = await api.post('/roulette/spin', payload);

      rotateWheelTo(data.number);
      await sleep(SPIN_MS);

      setResultNumber(data.number);
      setHistory((h) => [data.number, ...h].slice(0, 12));
      setHotNumbers(data.hotNumbers);
      setResults(data.results);
      setUser(data.user);
      setBets([]);

      const wonAny = data.results.some((r) => r.won);
      const anyHot = data.results.some((r) => r.won && r.isHot);
      const laPartageTotal = data.results.reduce((s, r) => s + r.laPartage, 0);

      if (wonAny) {
        setMessage({
          type: 'success',
          text: `🎉 Salió el ${data.number}${anyHot ? ' 🔥 ¡número caliente!' : ''}. Ganaste ${formatChips(data.totalWin)} fichas en total.`,
        });
      } else if (laPartageTotal > 0) {
        setMessage({ type: 'success', text: `Salió el 0. La Partage te devuelve ${formatChips(laPartageTotal)} fichas.` });
      } else {
        setMessage({ type: 'error', text: `Salió el ${data.number}. Perdiste ${formatChips(data.totalBet)} fichas.` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="game-page wide">
      <h1>🎡 Ruleta</h1>
      <p className="muted">
        Elegí varios números, colores, docenas o columnas y agregalos a tu apuesta antes de girar — como en una mesa real.
        Número exacto paga 35 a 1, columnas/docenas 3 a 1, el resto 2 a 1. El 0 solo pierde ahí, pero las apuestas
        simples recuperan la mitad (La Partage). Los números calientes 🔥 pagan 50% extra.
      </p>

      <div className="wheel-wrap">
        <div className="wheel-pointer" />
        <div className="wheel" style={{ background: `conic-gradient(${WHEEL_GRADIENT})`, transform: `rotate(${rotation}deg)` }}>
          {WHEEL_ORDER.map((n, i) => {
            const angle = i * SEG + SEG / 2;
            return (
              <span key={n} className="wheel-number" style={{ transform: `rotate(${angle}deg) translateY(-112px) rotate(${-angle}deg)` }}>
                {n}
              </span>
            );
          })}
        </div>
        <div className={`wheel-hub ${resultNumber !== null ? colorOf(resultNumber) : ''}`}>
          {spinning ? '🎲' : resultNumber ?? '?'}
        </div>
      </div>

      <div className="history-row">
        {history.map((n, i) => <span key={i} className={`mini-num ${colorOf(n)}`}>{n}</span>)}
      </div>

      {hotNumbers.length > 0 && (
        <p className="hot-numbers-row">
          🔥 Números calientes:{' '}
          {hotNumbers.map((h) => (
            <span key={h.number} className={`mini-num ${colorOf(h.number)}`} title={`${h.hits} veces recientes`}>
              {h.number}
            </span>
          ))}
        </p>
      )}

      {message && <div className={`alert alert-${message.type} center`}>{message.text}</div>}

      {results.length > 0 && (
        <div className="bet-slip-list center">
          {results.map((r, i) => (
            <span key={i} className={`bet-chip ${r.won ? 'win' : r.laPartage > 0 ? 'push' : 'lose'}`}>
              {describeChoice(r)}:{' '}
              {r.won
                ? `+${formatChips(r.winAmount)}${r.isHot ? ' 🔥' : ''}`
                : r.laPartage > 0
                ? `+${formatChips(r.laPartage)} (La Partage)`
                : `-${formatChips(r.amount)}`}
            </span>
          ))}
        </div>
      )}

      <div className="bet-options">
        {BET_OPTIONS.map((o) => {
          const key = `${o.betType}:${o.selection}`;
          const existing = bets.find((b) => b.key === key);
          return (
            <button
              key={key}
              disabled={spinning}
              className={`opt ${o.cls || ''} ${existing ? 'sel' : ''}`}
              onClick={() => addBet(o.betType, o.selection)}
            >
              {o.label} {o.mult}
              {existing && <span className="bet-mark">{formatChips(existing.amount)}</span>}
            </button>
          );
        })}
      </div>

      <div className="number-grid">
        {Array.from({ length: 37 }, (_, n) => {
          const existing = bets.find((b) => b.key === `straight:${n}`);
          return (
            <button
              key={n}
              disabled={spinning}
              className={`num ${colorOf(n)} ${existing ? 'sel' : ''} ${isHotNumber(n) ? 'hot' : ''}`}
              onClick={() => addBet('straight', n)}
            >
              {n}
              {isHotNumber(n) && <span className="hot-flame">🔥</span>}
              {existing && <span className="bet-mark">{formatChips(existing.amount)}</span>}
            </button>
          );
        })}
      </div>

      <div className="bet-slip-panel">
        <div className="bet-slip-head">
          <span>Mis apuestas{bets.length > 0 && ` · ${formatChips(totalBet)} fichas`}</span>
          {bets.length > 0 && (
            <button className="btn btn-ghost" onClick={clearBets} disabled={spinning}>Limpiar</button>
          )}
        </div>
        {bets.length === 0 ? (
          <p className="muted small center">Tocá números, colores, docenas o columnas para armar tu apuesta.</p>
        ) : (
          <div className="bet-slip-list">
            {bets.map((b) => (
              <span key={b.key} className="bet-chip">
                {describeChoice(b)} · {formatChips(b.amount)}
                <button onClick={() => removeBet(b.key)} disabled={spinning}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <BetControl amount={chip} setAmount={setChip} disabled={spinning} label="Ficha a agregar en cada clic" />
      <button className="btn btn-gold btn-block" onClick={spin} disabled={spinning || bets.length === 0}>
        {spinning ? 'Girando...' : `GIRAR · ${formatChips(totalBet)} fichas en ${bets.length} apuesta${bets.length === 1 ? '' : 's'}`}
      </button>
    </div>
  );
}
