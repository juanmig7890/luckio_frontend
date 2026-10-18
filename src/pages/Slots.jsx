import { useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import { sleep } from '../utils/helpers';
import BetControl from '../components/BetControl';
import HelpPanel from '../components/HelpPanel';

const JACKPOT_SYMBOL = '🎰';
const SYMS = ['🍒', '🍋', '🔔', '💎', '7️⃣', JACKPOT_SYMBOL];
const rand = () => SYMS[Math.floor(Math.random() * SYMS.length)];
const randomGrid = () => Array.from({ length: 3 }, () => Array.from({ length: 3 }, rand));

// Las 5 líneas de pago del backend (fila, columna), en el mismo orden
const LINES = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[2, 0], [1, 1], [0, 2]],
];

function Reel({ col, grid, spinning, winCells, stopping }) {
  const strip = useMemo(() => Array.from({ length: 14 }, rand), []);
  if (spinning) {
    return (
      <div className="reel">
        <div className="reel-strip">
          {[...strip, ...strip].map((s, i) => <div key={i} className="reel-cell blur">{s}</div>)}
        </div>
      </div>
    );
  }
  return (
    <div className={`reel ${stopping ? 'stop' : ''}`}>
      {[0, 1, 2].map((r) => (
        <div key={r} className={`reel-cell ${winCells.includes(`${r}-${col}`) ? 'win' : ''}`}>{grid[r][col]}</div>
      ))}
    </div>
  );
}

export default function Slots() {
  const { setUser } = useAuth();
  const [grid, setGrid] = useState(randomGrid);
  const [amount, setAmount] = useState(100);
  const [reels, setReels] = useState([false, false, false]);
  const [stopped, setStopped] = useState([false, false, false]);
  const [winCells, setWinCells] = useState([]);
  const [winLines, setWinLines] = useState([]);
  const [message, setMessage] = useState(null);
  const [jackpot, setJackpot] = useState(null);
  const spinning = reels.some(Boolean);

  const refreshJackpot = () => api.get('/slots/jackpot').then(({ data }) => setJackpot(data.amount)).catch(() => {});
  useEffect(() => { refreshJackpot(); }, []);

  const spin = async () => {
    setMessage(null);
    setWinCells([]);
    setWinLines([]);
    setStopped([false, false, false]);
    setReels([true, true, true]);
    try {
      const [{ data }] = await Promise.all([api.post('/slots/spin', { amount: Number(amount) }), sleep(1100)]);
      setGrid(data.grid);
      for (let c = 0; c < 3; c++) {
        if (c > 0) await sleep(420);
        setReels((r) => r.map((x, i) => (i === c ? false : x)));
        setStopped((s) => s.map((x, i) => (i === c ? true : x)));
      }
      await sleep(250);

      const scatter = [];
      if (data.jackpotWon > 0) data.grid.forEach((row, r) => row.forEach((s, c) => { if (s === JACKPOT_SYMBOL) scatter.push(`${r}-${c}`); }));
      setWinCells([...data.winningCells, ...scatter]);
      setWinLines(data.winningLines.map((l) => l.line));
      setUser(data.user);
      refreshJackpot();

      if (data.jackpotWon > 0) setMessage({ type: 'success', text: `¡JACKPOT! Ganaste el pozo completo: ${formatChips(data.jackpotWon)} fichas.` });
      else if (data.winAmount > 0) setMessage({ type: 'success', text: `¡Ganaste ${formatChips(data.winAmount)} fichas!` });
      else setMessage({ type: 'error', text: 'Sin premio esta vez. ¡Intenta de nuevo!' });
    } catch (err) {
      setReels([false, false, false]);
      setMessage({ type: 'error', text: getErrorMessage(err) });
    }
  };

  return (
    <div className="game-page">
      <div className="page-head">
        <h1>Tragamonedas</h1>
        <HelpPanel game="slots" />
      </div>

      <div className="jackpot-banner">
        <span>Pozo acumulado</span>
        <strong>{jackpot === null ? '…' : formatChips(jackpot)}</strong>
      </div>

      <div className="slot-machine">
        <div className="reels">
          {[0, 1, 2].map((c) => (
            <Reel key={c} col={c} grid={grid} spinning={reels[c]} stopping={stopped[c]} winCells={winCells} />
          ))}
          <svg className="payline-overlay" viewBox="0 0 3 3" preserveAspectRatio="none" aria-hidden="true">
            {winLines.map((i) => (
              <polyline key={i} points={LINES[i].map(([r, c]) => `${c + 0.5},${r + 0.5}`).join(' ')} />
            ))}
          </svg>
        </div>
      </div>

      {message && <div className={`alert alert-${message.type} center`}>{message.text}</div>}

      <BetControl amount={amount} setAmount={setAmount} disabled={spinning} />
      <button className="btn btn-gold btn-block deal-btn" onClick={spin} disabled={spinning}>
        {spinning ? 'Girando…' : `Girar · ${formatChips(amount)} fichas`}
      </button>

      <div className="paytable">
        <span>🍒🍒🍒 x8</span><span>🍋🍋🍋 x12</span><span>🔔🔔🔔 x25</span><span>💎💎💎 x60</span><span>7️⃣7️⃣7️⃣ x200</span>
        <span>3 × 🎰 en cualquier parte = jackpot</span>
      </div>
    </div>
  );
}
