import { useState, useRef } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';

const SYMS = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
const rand = () => SYMS[Math.floor(Math.random() * SYMS.length)];
const randomGrid = () => Array.from({ length: 3 }, () => Array.from({ length: 3 }, rand));

export default function Slots() {
  const { setUser } = useAuth();
  const [grid, setGrid] = useState(randomGrid);
  const [amount, setAmount] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [winCells, setWinCells] = useState([]);
  const [message, setMessage] = useState(null);
  const timer = useRef(null);

  const spin = async () => {
    setMessage(null);
    setWinCells([]);
    setSpinning(true);
    timer.current = setInterval(() => setGrid(randomGrid()), 90);
    try {
      const [{ data }] = await Promise.all([
        api.post('/slots/spin', { amount: Number(amount) }),
        new Promise((r) => setTimeout(r, 1300)),
      ]);
      clearInterval(timer.current);
      setGrid(data.grid);
      setWinCells(data.winningCells);
      setUser(data.user);
      setMessage(
        data.winAmount > 0
          ? { type: 'success', text: `🎉 ¡Ganaste ${formatChips(data.winAmount)} fichas!` }
          : { type: 'error', text: 'Sin premio esta vez. ¡Intenta de nuevo!' }
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
      <h1>🎰 Tragamonedas</h1>
      <p className="muted">5 líneas: 3 filas y 2 diagonales. Tres símbolos iguales pagan.</p>

      <div className="slot-machine">
        <div className="slot-grid">
          {grid.map((row, r) =>
            row.map((sym, c) => (
              <div key={`${r}-${c}`} className={`slot-cell ${spinning ? 'spinning' : ''} ${winCells.includes(`${r}-${c}`) ? 'win' : ''}`}>
                {sym}
              </div>
            ))
          )}
        </div>
      </div>

      {message && <div className={`alert alert-${message.type} center`}>{message.text}</div>}

      <BetControl amount={amount} setAmount={setAmount} disabled={spinning} />
      <button className="btn btn-gold btn-block" onClick={spin} disabled={spinning}>
        {spinning ? 'Girando...' : `GIRAR · ${formatChips(amount)} fichas`}
      </button>

      <div className="paytable">
        <span>🍒🍒🍒 x8</span><span>🍋🍋🍋 x12</span><span>🔔🔔🔔 x25</span><span>💎💎💎 x60</span><span>7️⃣7️⃣7️⃣ x200</span>
      </div>
    </div>
  );
}