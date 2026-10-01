import { useState, useRef, useEffect } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';

const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const colorOf = (n) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

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
  const [amount, setAmount] = useState(100);
  const [choice, setChoice] = useState({ betType: 'color', selection: 'red' });
  const [display, setDisplay] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const [hotNumbers, setHotNumbers] = useState([]);
  const timer = useRef(null);

  useEffect(() => {
    api.get('/roulette/hot-numbers').then(({ data }) => setHotNumbers(data.hotNumbers)).catch(() => {});
  }, []);

  const isSel = (betType, selection) => choice.betType === betType && String(choice.selection) === String(selection);
  const isHotNumber = (n) => hotNumbers.some((h) => h.number === n);

  const spin = async () => {
    setMessage(null);
    setSpinning(true);
    timer.current = setInterval(() => setDisplay(Math.floor(Math.random() * 37)), 70);
    try {
      const [{ data }] = await Promise.all([
        api.post('/roulette/spin', { amount: Number(amount), betType: choice.betType, selection: choice.selection }),
        new Promise((r) => setTimeout(r, 2000)),
      ]);
      clearInterval(timer.current);
      setDisplay(data.number);
      setHistory((h) => [data.number, ...h].slice(0, 12));
      setHotNumbers(data.hotNumbers);
      setUser(data.user);

      if (data.won) {
        setMessage({
          type: 'success',
          text: `🎉 Salió el ${data.number}${data.isHot ? ' 🔥 ¡número caliente, +50% de pago!' : ''}. ¡Ganaste ${formatChips(data.winAmount)} fichas!`,
        });
      } else if (data.laPartage > 0) {
        setMessage({
          type: 'success',
          text: `Salió el 0. La Partage: te devolvemos la mitad de tu apuesta (${formatChips(data.laPartage)} fichas).`,
        });
      } else {
        setMessage({ type: 'error', text: `Salió el ${data.number}. Perdiste ${formatChips(data.bet)} fichas.` });
      }
    } catch (err) {
      clearInterval(timer.current);
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="game-page">
      <h1>🎡 Ruleta</h1>
      <p className="muted">
        Número exacto paga 35 a 1, columnas y docenas 3 a 1, color/par-impar/mitad 2 a 1. El 0 solo pierde ahí, pero las
        apuestas simples recuperan la mitad (La Partage). Los números calientes 🔥 pagan 50% extra si salen.
      </p>

      <div className="roulette-display">
        <div className={`roulette-ball ${display === null ? 'green' : colorOf(display)} ${spinning ? 'spinning' : ''}`}>
          {display === null ? '?' : display}
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

      <div className="bet-options">
        {BET_OPTIONS.map((o) => (
          <button
            key={`${o.betType}-${o.selection}`}
            disabled={spinning}
            className={`opt ${o.cls || ''} ${isSel(o.betType, o.selection) ? 'sel' : ''}`}
            onClick={() => setChoice({ betType: o.betType, selection: o.selection })}
          >
            {o.label} {o.mult}
          </button>
        ))}
      </div>

      <div className="number-grid">
        {Array.from({ length: 37 }, (_, n) => (
          <button
            key={n}
            disabled={spinning}
            className={`num ${colorOf(n)} ${isSel('straight', n) ? 'sel' : ''} ${isHotNumber(n) ? 'hot' : ''}`}
            onClick={() => setChoice({ betType: 'straight', selection: n })}
          >
            {n}
            {isHotNumber(n) && <span className="hot-flame">🔥</span>}
          </button>
        ))}
      </div>

      <p className="center muted small">
        Tu selección: <strong className="gold">{describeChoice(choice)}</strong>
      </p>

      <BetControl amount={amount} setAmount={setAmount} disabled={spinning} />
      <button className="btn btn-gold btn-block" onClick={spin} disabled={spinning}>
        {spinning ? 'Girando...' : `GIRAR · ${formatChips(amount)} fichas`}
      </button>
    </div>
  );
}
