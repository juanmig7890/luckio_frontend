import { motion } from 'motion/react';
import { useCountdown } from '../hooks/useLiveTable';

const PHASE_TEXT = { betting: 'Apuestas abiertas', resolving: 'Sorteando…', results: 'Resultado', idle: 'Mesa en pausa' };

// Barra superior de una mesa en vivo: fase, cuenta regresiva, estado de la conexión y jugadores sentados.
export default function LiveBar({ live, myName }) {
  const { state, players, status, error, offset } = live;
  const seconds = useCountdown(state?.endsAt, offset);
  const phase = state?.phase || 'idle';
  const total = (state?.phaseMs || 20000) / 1000;

  return (
    <div className="live-bar" role="status">
      <div className={`live-clock phase-${phase}`}>
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="19" className="track" />
          <motion.circle cx="22" cy="22" r="19" className="arc" strokeDasharray={119.4}
            animate={{ strokeDashoffset: 119.4 * (1 - Math.min(1, seconds / total)) }} transition={{ duration: 0.25, ease: 'linear' }} />
        </svg>
        <b>{phase === 'idle' ? '–' : seconds}</b>
      </div>
      <div className="live-info">
        <strong>{status === 'online' ? PHASE_TEXT[phase] : status === 'connecting' ? 'Conectando a la mesa…' : status === 'offline' ? 'Sin conexión, reintentando…' : error || 'No se pudo conectar'}</strong>
        <span className="muted small">Ronda {state?.round ?? '–'} · {players.length} {players.length === 1 ? 'jugador' : 'jugadores'} en la mesa</span>
      </div>
      <ul className="live-players" aria-label="Jugadores en la mesa">
        {players.slice(0, 8).map((p) => (
          <li key={p.id} className={p.name === myName ? 'me' : ''} title={p.bet ? `Apostó ${p.bet}` : 'Sin apuesta aún'}>
            <span className="avatar">{p.name.slice(0, 1).toUpperCase()}</span>
            <span className="pname">{p.name === myName ? 'Tú' : p.name}</span>
            {p.bet > 0 && <i className="pbet" aria-label="Ya apostó" />}
          </li>
        ))}
        {players.length > 8 && <li className="more">+{players.length - 8}</li>}
      </ul>
    </div>
  );
}
