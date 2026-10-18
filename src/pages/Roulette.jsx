import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import { sleep } from '../utils/helpers';
import Chip from '../components/Chip';
import ChipTray from '../components/ChipTray';
import HelpPanel from '../components/HelpPanel';

const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const colorOf = (n) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

// Orden real de la rueda europea (no es el orden numérico de la mesa)
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
];
const SEG = 360 / WHEEL_ORDER.length;
const SPIN_MS = 5200;
const MAX_DISTINCT_BETS = 20;
const FILL = { red: '#b3302b', black: '#15181a', green: '#1d7a4e' };

const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [150 + r * Math.sin(a), 150 - r * Math.cos(a)];
};
const sector = (i, r1, r2) => {
  const [x1, y1] = polar(r2, i * SEG);
  const [x2, y2] = polar(r2, (i + 1) * SEG);
  const [x3, y3] = polar(r1, (i + 1) * SEG);
  const [x4, y4] = polar(r1, i * SEG);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
};

const short = (n) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : String(n));
const DENOMS = [1000, 500, 100, 50, 10];
const topChip = (amount) => DENOMS.find((d) => amount >= d) || 10;

const describe = ({ betType, selection }) => {
  switch (betType) {
    case 'straight': return `Número ${selection}`;
    case 'color': return selection === 'red' ? 'Rojo' : 'Negro';
    case 'parity': return selection === 'even' ? 'Par' : 'Impar';
    case 'half': return selection === 'low' ? '1-18' : '19-36';
    case 'dozen': return `${selection}ª docena`;
    case 'column': return `Columna ${selection}`;
    default: return '';
  }
};

function Wheel({ rotation, ball, spinning, number }) {
  return (
    <div className="wheel-box">
      <svg viewBox="0 0 300 300" className="wheel-svg" role="img" aria-label="Rueda de la ruleta">
        <defs>
          <radialGradient id="rim" cx="50%" cy="50%" r="50%">
            <stop offset="88%" stopColor="#3a2a1a" />
            <stop offset="100%" stopColor="#1b130b" />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="148" fill="url(#rim)" stroke="#c9a45c" strokeWidth="2" />
        <circle cx="150" cy="150" r="141" fill="#0b0d0c" />
        <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '150px 150px', transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.6, 0.2, 1)` : 'none' }}>
          {WHEEL_ORDER.map((n, i) => (
            <path key={n} d={sector(i, 94, 128)} fill={FILL[colorOf(n)]} stroke="#c9a45c" strokeWidth="0.6" />
          ))}
          {WHEEL_ORDER.map((n, i) => {
            const mid = i * SEG + SEG / 2;
            const [x, y] = polar(112, mid);
            return (
              <text key={n} x={x} y={y} fill="#f3f1ea" fontSize="9.5" fontWeight="700" textAnchor="middle" dominantBaseline="central"
                transform={`rotate(${mid} ${x} ${y})`}>
                {n}
              </text>
            );
          })}
          <circle cx="150" cy="150" r="90" fill="#101412" stroke="#c9a45c" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="64" fill="none" stroke="#2a302d" strokeWidth="1" />
          {[0, 90, 180, 270].map((a) => {
            const [x, y] = polar(60, a);
            return <line key={a} x1="150" y1="150" x2={x} y2={y} stroke="#c9a45c" strokeWidth="3" strokeLinecap="round" />;
          })}
          <circle cx="150" cy="150" r="14" fill="#c9a45c" />
          <circle cx="150" cy="150" r="5" fill="#0b0d0c" />
        </g>
        <g style={{ transform: `rotate(${ball.rot}deg)`, transformOrigin: '150px 150px', transition: ball.anim ? `transform ${SPIN_MS}ms cubic-bezier(0.2, 0.7, 0.25, 1)` : 'none' }}>
          <circle cx="150" cy="150" r="5.5" fill="#f6f3ea" stroke="#9a9484" strokeWidth="0.8"
            style={{ transform: `translateY(-${ball.r}px)`, transition: ball.anim ? `transform 1300ms ease-in ${SPIN_MS - 1600}ms` : 'none' }} />
        </g>
        <path d="M150 4 L144 -6 L156 -6 Z" fill="#c9a45c" transform="translate(0 12)" />
      </svg>
      <div className={`wheel-readout ${number !== null ? colorOf(number) : ''}`}>{spinning ? '…' : number ?? '–'}</div>
    </div>
  );
}

function Cell({ betType, selection, label, className = '', style, hot, amount = 0, hit, disabled, onBet }) {
  return (
    <button type="button" style={style} disabled={disabled} onClick={() => onBet(betType, selection)}
      className={`rl-cell ${className} ${amount ? 'has' : ''} ${hit ? 'hit' : ''}`} aria-label={`Apostar en ${label}`}>
      <span className="rl-label">{label}</span>
      {hot && <span className="rl-hot" title="Número caliente">●</span>}
      {amount > 0 && (
        <span className="rl-chip">
          <Chip value={topChip(amount)} size={32} />
          <b>{short(amount)}</b>
        </span>
      )}
    </button>
  );
}

export default function Roulette() {
  const { setUser } = useAuth();
  const [chip, setChip] = useState(50);
  const [bets, setBets] = useState([]);
  const [stack, setStack] = useState([]);
  const [lastBets, setLastBets] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [ball, setBall] = useState({ rot: 0, r: 134, anim: false });
  const [resultNumber, setResultNumber] = useState(null);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const [hotNumbers, setHotNumbers] = useState([]);

  useEffect(() => {
    api.get('/roulette/hot-numbers').then(({ data }) => setHotNumbers(data.hotNumbers)).catch(() => {});
  }, []);

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
    setBets((prev) => {
      const found = prev.find((b) => b.key === key);
      if (found) return prev.map((b) => (b.key === key ? { ...b, amount: b.amount + chip } : b));
      return [...prev, { key, betType, selection, amount: chip }];
    });
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
    setSpinning(true);
    try {
      const { data } = await api.post('/roulette/spin', { bets: bets.map(({ betType, selection, amount }) => ({ betType, selection, amount })) });

      // 1) La bola sale al carril exterior sin animación; 2) en el siguiente instante gira y cae en la casilla ganadora
      setBall((b) => ({ rot: b.rot, r: 134, anim: false }));
      await sleep(40);
      const theta = WHEEL_ORDER.indexOf(data.number) * SEG + SEG / 2;
      setRotation((prev) => {
        const cur = ((prev % 360) + 360) % 360;
        const target = ((-theta % 360) + 360) % 360;
        let delta = target - cur;
        if (delta <= 0) delta += 360;
        return prev + delta + 360 * 5;
      });
      setBall((b) => ({ rot: b.rot - 360 * 4, r: 110, anim: true }));
      await sleep(SPIN_MS + 250);

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
      setSpinning(false);
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
        <HelpPanel game="roulette" />
      </div>

      <div className="rl-layout">
        <div className="rl-side">
          <Wheel rotation={rotation} ball={ball} spinning={spinning} number={resultNumber} />
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
          <div className="rl-scroll">
            <div className="rl-board">
              <Cell {...cp('straight', 0)} label="0" className="green" style={{ gridRow: '1 / 4', gridColumn: 1 }} hot={isHot(0)} />
              {[0, 1, 2].flatMap((r) =>
                Array.from({ length: 12 }, (_, c) => {
                  const n = 3 * (c + 1) - r;
                  return <Cell key={n} {...cp('straight', n)} label={String(n)} className={colorOf(n)} style={{ gridRow: r + 1, gridColumn: c + 2 }} hot={isHot(n)} />;
                })
              )}
              {[0, 1, 2].map((r) => (
                <Cell key={`col${r}`} {...cp('column', 3 - r)} label="2 a 1" className="outside" style={{ gridRow: r + 1, gridColumn: 14 }} />
              ))}
              {[1, 2, 3].map((d) => (
                <Cell key={`doz${d}`} {...cp('dozen', d)} label={`${d}ª 12`} className="outside" style={{ gridRow: 4, gridColumn: `${2 + 4 * (d - 1)} / span 4` }} />
              ))}
              <Cell {...cp('half', 'low')} label="1-18" className="outside" style={{ gridRow: 5, gridColumn: '2 / span 2' }} />
              <Cell {...cp('parity', 'even')} label="Par" className="outside" style={{ gridRow: 5, gridColumn: '4 / span 2' }} />
              <Cell {...cp('color', 'red')} label="Rojo" className="outside red-spot" style={{ gridRow: 5, gridColumn: '6 / span 2' }} />
              <Cell {...cp('color', 'black')} label="Negro" className="outside black-spot" style={{ gridRow: 5, gridColumn: '8 / span 2' }} />
              <Cell {...cp('parity', 'odd')} label="Impar" className="outside" style={{ gridRow: 5, gridColumn: '10 / span 2' }} />
              <Cell {...cp('half', 'high')} label="19-36" className="outside" style={{ gridRow: 5, gridColumn: '12 / span 2' }} />
            </div>
          </div>
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
