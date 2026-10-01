import { useState, useRef, useEffect } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';

const JACKPOT_SYMBOL = '🎰';
const SYMS = ['🍒', '🍋', '🔔', '💎', '7️⃣', JACKPOT_SYMBOL];
const rand = () => SYMS[Math.floor(Math.random() * SYMS.length)];
const randomGrid = () => Array.from({ length: 3 }, () => Array.from({ length: 3 }, rand));

export default function Slots() {
  const { setUser } = useAuth();
  const [grid, setGrid] = useState(randomGrid);
  const [amount, setAmount] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [winCells, setWinCells] = useState([]);
  const [message, setMessage] = useState(null);
  const [jackpot, setJackpot] = useState(null);
  const timer = useRef(null);

  const refreshJackpot = () => api.get('/slots/jackpot').then(({ data }) => setJackpot(data.amount)).catch(() => {});

  useEffect(() => {
    refreshJackpot();
  }, []);

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

      const scatterCells = [];
      if (data.jackpotWon > 0) {
        data.grid.forEach((row, r) => row.forEach((s, c) => { if (s === JACKPOT_SYMBOL) scatterCells.push(`${r}-${c}`); }));
      }
      setWinCells([...data.winningCells, ...scatterCells]);
      setUser(data.user);
      refreshJackpot();

      if (data.jackpotWon > 0) {
        setMessage({ type: 'success', text: `🎰🎉 ¡JACKPOT! Ganaste el pozo completo: ${formatChips(data.jackpotWon)} fichas!` });
      } else if (data.winAmount > 0) {
        setMessage({ type: 'success', text: `🎉 ¡Ganaste ${formatChips(data.winAmount)} fichas!` });
      } else {
        setMessage({ type: 'error', text: 'Sin premio esta vez. ¡Intenta de nuevo!' });
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
      <h1>🎰 Tragamonedas</h1>
      <p className="muted">5 líneas: 3 filas y 2 diagonales. Tres símbolos iguales pagan.</p>

      <div className="jackpot-banner">
        <span>Pozo acumulado</span>
        <strong>🪙 {jackpot === null ? '...' : formatChips(jackpot)}</strong>
      </div>

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
        <span>🎰🎰🎰 en cualquier parte = JACKPOT</span>
      </div>
    </div>
  );
}
