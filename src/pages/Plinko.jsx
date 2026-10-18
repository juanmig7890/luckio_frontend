import { useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';
import HelpPanel from '../components/HelpPanel';

const ROWS = 12;
const S = 44; // separación horizontal entre clavijas
const ROW_H = 34;
const TOP = 46;
const W = (ROWS + 2) * S;
const BIN_Y = TOP + ROWS * ROW_H + 8;
const H = BIN_Y + 54;
const CX = W / 2;

// Respaldo por si el servidor aún no respondió; el servidor es la fuente de verdad (GET /plinko/config)
const FALLBACK = {
  low: [5.6, 2.1, 1.6, 1.3, 1.0, 1.0, 0.6, 1.0, 1.0, 1.3, 1.6, 2.1, 5.6],
  medium: [18, 7, 2, 1.8, 0.9, 0.8, 0.6, 0.8, 0.9, 1.8, 2, 7, 18],
  high: [250, 14, 3, 2, 0.8, 0.5, 0.3, 0.5, 0.8, 2, 3, 14, 250],
};
const RISK_LABEL = { low: 'Bajo', medium: 'Medio', high: 'Alto' };

const pegs = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: r + 1 }, (_, j) => ({ x: CX + (j - r / 2) * S, y: TOP + r * ROW_H, key: `${r}-${j}` }))
).flat();

const tone = (m) => (m >= 5 ? 'hot' : m >= 1.5 ? 'warm' : m >= 1 ? 'mid' : 'cold');
const fmt = (m) => (m >= 100 ? String(m) : String(+m.toFixed(1)));

// Puntos por los que pasa la bola: la bola cae sobre una clavija y rebota a la izquierda (0) o a la derecha (1)
const waypoints = (path) => {
  const pts = [{ x: CX, y: TOP - 30 }];
  let off = 0;
  path.forEach((step, r) => {
    off += step ? S / 2 : -S / 2;
    pts.push({ x: CX + off, y: r < ROWS - 1 ? TOP + (r + 1) * ROW_H - 15 : BIN_Y + 24 });
  });
  return pts;
};

export default function Plinko() {
  const { setUser } = useAuth();
  const [amount, setAmount] = useState(100);
  const [risk, setRisk] = useState('medium');
  const [tables, setTables] = useState(FALLBACK);
  const [busy, setBusy] = useState(false);
  const [landed, setLanded] = useState(null);
  const [recent, setRecent] = useState([]);
  const [message, setMessage] = useState(null);
  const ballRef = useRef(null);

  useEffect(() => {
    api.get('/plinko/config').then(({ data }) => setTables(data.multipliers)).catch(() => {});
  }, []);

  const drop = async () => {
    setMessage(null);
    setLanded(null);
    setBusy(true);
    try {
      const { data } = await api.post('/plinko/drop', { amount: Number(amount), risk });
      const pts = waypoints(data.path);
      const ball = ballRef.current;
      ball.getAnimations().forEach((a) => a.cancel());
      ball.style.opacity = 1;
      ball.style.transform = `translate(${pts[0].x}px, ${pts[0].y}px)`;
      for (let i = 1; i < pts.length; i++) {
        // Cada tramo: cae con aceleración y se desplaza lateralmente (rebote en la clavija)
        await ball.animate(
          [{ transform: `translate(${pts[i - 1].x}px, ${pts[i - 1].y}px)` }, { transform: `translate(${pts[i].x}px, ${pts[i].y}px)` }],
          { duration: 230, easing: 'cubic-bezier(0.35, 0, 0.7, 1)', fill: 'forwards' }
        ).finished;
      }
      setLanded(data.slot);
      await ball.animate([{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 700, fill: 'forwards' }).finished;
      setRecent((r) => [{ m: data.multiplier, win: data.winAmount }, ...r].slice(0, 8));
      setUser(data.user);
      setMessage({
        type: data.winAmount >= data.bet ? 'success' : 'error',
        text: `x${fmt(data.multiplier)} · ${data.winAmount >= data.bet ? 'ganaste' : 'recuperas'} ${formatChips(data.winAmount)} fichas`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const mults = tables[risk];

  return (
    <div className="game-page">
      <div className="page-head">
        <h1>Plinko</h1>
        <HelpPanel game="plinko" />
      </div>

      <div className="plinko-card">
        <svg viewBox={`0 0 ${W} ${H}`} className="plinko-svg" role="img" aria-label="Tablero de Plinko">
          {pegs.map((p) => <circle key={p.key} cx={p.x} cy={p.y} r="3.6" className="peg" />)}
          {mults.map((m, k) => {
            const x = CX + (k - ROWS / 2) * S;
            return (
              <g key={k} className={`bin ${tone(m)} ${landed === k ? 'landed' : ''}`}>
                <rect x={x - S / 2 + 2} y={BIN_Y} width={S - 4} height="38" rx="7" />
                <text x={x} y={BIN_Y + 20} textAnchor="middle" dominantBaseline="central">{fmt(m)}x</text>
              </g>
            );
          })}
          <circle ref={ballRef} r="8" className="plinko-ball" style={{ opacity: 0 }} />
        </svg>
      </div>

      <div className="risk-row" role="radiogroup" aria-label="Nivel de riesgo">
        {Object.keys(RISK_LABEL).map((k) => (
          <button key={k} role="radio" aria-checked={risk === k} className={`btn ${risk === k ? 'btn-gold' : 'btn-ghost'}`} disabled={busy} onClick={() => setRisk(k)}>
            Riesgo {RISK_LABEL[k].toLowerCase()}
          </button>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="history-row">
          {recent.map((r, i) => <span key={i} className={`pill ${tone(r.m)}`}>x{fmt(r.m)}</span>)}
        </div>
      )}
      {message && <div className={`alert alert-${message.type} center`}>{message.text}</div>}

      <BetControl amount={amount} setAmount={setAmount} disabled={busy} />
      <button className="btn btn-gold btn-block deal-btn" onClick={drop} disabled={busy}>
        {busy ? 'Cayendo…' : `Soltar bola · ${formatChips(amount)} fichas`}
      </button>
    </div>
  );
}
