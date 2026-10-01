import { useState, useRef } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';

const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const colorOf = (n) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

export default function Roulette() {
  const { setUser } = useAuth();
  const [amount, setAmount] = useState(100);
  const [choice, setChoice] = useState({ type: 'color', value: 'red' });
  const [display, setDisplay] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const timer = useRef(null);

  const isSel = (type, value) => choice.type === type && String(choice.value) === String(value);

  const spin = async () => {
    setMessage(null);
    setSpinning(true);
    timer.current = setInterval(() => setDisplay(Math.floor(Math.random() * 37)), 70);
    try {
      const [{ data }] = await Promise.all([
        api.post('/roulette/spin', { amount: Number(amount), ...choice }),
        new Promise((r) => setTimeout(r, 2000)),
      ]);
      clearInterval(timer.current);
      setDisplay(data.number);
      setHistory((h) => [data.number, ...h].slice(0, 12));
      setUser(data.user);
      setMessage(
        data.won
          ? { type: 'success', text: `🎉 Salió el ${data.number}. ¡Ganaste ${formatChips(data.payout)} fichas!` }
          : { type: 'error', text: `Salió el ${data.number}. Perdiste ${formatChips(data.bet)} fichas.` }
      );
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
      <p className="muted">Número exacto paga 35 a 1. Color y par/impar pagan 1 a 1. El 0 pierde en color y par/impar.</p>

      <div className="roulette-display">
        <div className={`roulette-ball ${display === null ? 'green' : colorOf(display)} ${spinning ? 'spinning' : ''}`}>
          {display === null ? '?' : display}
        </div>
      </div>

      <div className="history-row">
        {history.map((n, i) => <span key={i} className={`mini-num ${colorOf(n)}`}>{n}</span>)}
      </div>

      {message && <div className={`alert alert-${message.type} center`}>{message.text}</div>}

      <div className="bet-options">
        <button disabled={spinning} className={`opt red ${isSel('color', 'red') ? 'sel' : ''}`} onClick={() => setChoice({ type: 'color', value: 'red' })}>Rojo x2</button>
        <button disabled={spinning} className={`opt black ${isSel('color', 'black') ? 'sel' : ''}`} onClick={() => setChoice({ type: 'color', value: 'black' })}>Negro x2</button>
        <button disabled={spinning} className={`opt ${isSel('parity', 'even') ? 'sel' : ''}`} onClick={() => setChoice({ type: 'parity', value: 'even' })}>Par x2</button>
        <button disabled={spinning} className={`opt ${isSel('parity', 'odd') ? 'sel' : ''}`} onClick={() => setChoice({ type: 'parity', value: 'odd' })}>Impar x2</button>
      </div>

      <div className="number-grid">
        {Array.from({ length: 37 }, (_, n) => (
          <button
            key={n}
            disabled={spinning}
            className={`num ${colorOf(n)} ${isSel('number', n) ? 'sel' : ''}`}
            onClick={() => setChoice({ type: 'number', value: n })}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="center muted small">
        Tu selección: <strong className="gold">
          {choice.type === 'number' ? `Número ${choice.value}` : choice.value === 'red' ? 'Rojo' : choice.value === 'black' ? 'Negro' : choice.value === 'even' ? 'Par' : 'Impar'}
        </strong>
      </p>

      <BetControl amount={amount} setAmount={setAmount} disabled={spinning} />
      <button className="btn btn-gold btn-block" onClick={spin} disabled={spinning}>
        {spinning ? 'Girando...' : `GIRAR · ${formatChips(amount)} fichas`}
      </button>
    </div>
  );
}