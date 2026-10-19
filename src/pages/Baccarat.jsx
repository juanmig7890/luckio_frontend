import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import { sleep } from '../utils/helpers';
import BcHand from '../components/BcHand';
import ModeTabs from '../components/ModeTabs';
import BetSpot from '../components/BetSpot';
import ChipTray from '../components/ChipTray';
import HelpPanel from '../components/HelpPanel';

const EMPTY = { player: 0, banker: 0, tie: 0, playerPair: 0, bankerPair: 0 };
const WINNER_TEXT = { player: 'Gana el Punto', banker: 'Gana la Banca', tie: 'Empate' };
const MAX_BET = 100000;

export default function Baccarat() {
  const { setUser } = useAuth();
  const [chip, setChip] = useState(50);
  const [bets, setBets] = useState(EMPTY);
  const [lastBets, setLastBets] = useState(null);
  const [hands, setHands] = useState({ p: [], b: [] });
  const [round, setRound] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/baccarat/history').then(({ data }) => setHistory([...data.rounds].reverse())).catch(() => {});
  }, []);

  const stake = Object.values(bets).reduce((s, v) => s + v, 0);
  // En bacará real no se apuesta a Punto Y a Banca en la misma mano: una vez que apuestas de un lado,
  // el otro se bloquea hasta que limpies la apuesta.
  const sideBlocked = (k) => (k === 'player' && bets.banker > 0) || (k === 'banker' && bets.player > 0);
  const add = (k) => !busy && !sideBlocked(k) && setBets((b) => ({ ...b, [k]: Math.min(MAX_BET, b[k] + chip) }));
  const clearOne = (k) => setBets((b) => ({ ...b, [k]: 0 }));

  const deal = async () => {
    setMessage(null);
    setRound(null);
    setHands({ p: [], b: [] });
    setBusy(true);
    try {
      const { data } = await api.post('/baccarat/play', { bets: Object.fromEntries(Object.entries(bets).filter(([, v]) => v > 0)) });
      setLastBets(bets);

      // Orden real: Punto, Banca, Punto, Banca y luego las terceras cartas (primero la del Punto)
      const order = [['p', 0], ['b', 0], ['p', 1], ['b', 1]];
      if (data.playerCards[2]) order.push(['p', 2]);
      if (data.bankerCards[2]) order.push(['b', 2]);

      for (const [who, i] of order) {
        const card = (who === 'p' ? data.playerCards : data.bankerCards)[i];
        await sleep(i === 2 ? 900 : 380);
        setHands((h) => ({ ...h, [who]: [...h[who], { card, down: true }] }));
        await sleep(320);
        setHands((h) => ({ ...h, [who]: h[who].map((c, idx) => (idx === i ? { ...c, down: false } : c)) }));
      }
      await sleep(500);

      setRound(data);
      setHistory((h) => [...h, { winner: data.winner, playerPair: data.playerPair, bankerPair: data.bankerPair }].slice(-60));
      const net = data.totalWin - data.totalBet;
      const extra = [data.playerPair && 'pareja del Punto', data.bankerPair && 'pareja de la Banca'].filter(Boolean).join(' y ');
      setMessage({
        type: net > 0 ? 'success' : net === 0 ? 'push' : 'error',
        text: `${WINNER_TEXT[data.winner]} ${data.playerTotal} a ${data.bankerTotal}${extra ? ` · ${extra}` : ''}. ${
          data.totalWin > 0 ? `Recibes ${formatChips(data.totalWin)} fichas` : 'No acertaste esta ronda'
        } (neto ${net >= 0 ? '+' : '−'}${formatChips(Math.abs(net))}).`,
      });
      setUser(data.user);
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const spot = (key, label, sub, extra = {}) => (
    <BetSpot key={key} label={label} sub={sub} amount={bets[key]} disabled={busy || sideBlocked(key)} shape="rect" size={key === 'tie' || key === 'player' || key === 'banker' ? 118 : 96}
      onClick={() => add(key)} onClear={() => clearOne(key)} {...extra} />
  );
  const won = (k) => !busy && round && round.payouts[k] > 0;

  return (
    <div className="game-page wide">
      <div className="page-head">
        <h1>Bacará</h1>
        <ModeTabs current="solo" soloTo="/game/baccarat" liveTo="/game/baccarat-live" />
        <HelpPanel game="baccarat" />
      </div>

      <div className="felt bc-felt">
        <div className="table-banner">
          <strong>Punto Banco</strong>
          <span>Banca paga 1 a 1 (comisión 5%) · Empate 8 a 1 · Pares 11 a 1</span>
        </div>

        <div className="bc-hands">
          <BcHand title="Punto" list={hands.p} win={!busy && round?.winner === 'player'} />
          <BcHand title="Banca" list={hands.b} win={!busy && round?.winner === 'banker'} />
        </div>

        {message && <div className={`result-banner ${message.type === 'success' ? 'win' : message.type === 'push' ? 'push' : 'lose'}`}><strong>{message.text}</strong></div>}

        <div className="bc-zones">
          {spot('playerPair', 'Pareja Punto', '11 a 1', { win: won('playerPair') })}
          {spot('player', 'Punto', '1 a 1', { win: won('player') })}
          {spot('tie', 'Empate', '8 a 1', { win: won('tie') })}
          {spot('banker', 'Banca', '1 a 1 · −5%', { win: won('banker') })}
          {spot('bankerPair', 'Pareja Banca', '11 a 1', { win: won('bankerPair') })}
        </div>
        {(bets.player > 0 || bets.banker > 0) && (
          <p className="felt-note">No puedes apostar a Punto y a Banca en la misma mano (no se hace en una mesa real).</p>
        )}
      </div>

      <div className="scoreboard" aria-label="Marcador de las últimas rondas">
        <span className="muted small">Marcador</span>
        <div className="road">
          {history.map((r, i) => (
            <span key={i} className={`dot ${r.winner}`} title={`${WINNER_TEXT[r.winner]} ${r.playerTotal ?? ''}${r.bankerTotal != null ? ` a ${r.bankerTotal}` : ''}`}>
              {r.playerPair && <i className="pp" />}
              {r.bankerPair && <i className="bp" />}
            </span>
          ))}
          {history.length === 0 && <span className="muted small">Aún no hay rondas</span>}
        </div>
        <div className="legend small muted"><span className="dot player" /> Punto <span className="dot banker" /> Banca <span className="dot tie" /> Empate</div>
      </div>

      <ChipTray value={chip} onChange={setChip} disabled={busy} />
      <div className="action-bar">
        <button className="btn btn-ghost" onClick={() => setBets(EMPTY)} disabled={busy || stake === 0}>Limpiar</button>
        <button className="btn btn-ghost" onClick={() => setBets(lastBets)} disabled={busy || stake > 0 || !lastBets}>Repetir apuesta</button>
        <button className="btn btn-gold deal-btn" onClick={deal} disabled={busy || stake < 10}>
          {busy ? 'Repartiendo…' : `Repartir · ${formatChips(stake)} fichas`}
        </button>
      </div>
    </div>
  );
}
