import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// El socket vive en el mismo servidor que la API (se quita el "/api" final de la dirección)
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

// Conecta con una mesa en vivo ('roulette' | 'baccarat').
//  state:   estado de la mesa (fase, hora de cierre, historial, resultado)
//  players: jugadores sentados y lo que apostó cada uno
//  status:  'connecting' | 'online' | 'offline' | 'error'
//  placeBets(bets): envía las apuestas; devuelve una promesa
// onResolving(snapshot) se llama cuando el servidor sortea el resultado; onOutcome(datos) cuando llegan TUS pagos.
export default function useLiveTable(table, { onResolving, onOutcome } = {}) {
  const { setUser } = useAuth();
  const [state, setState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0); // diferencia entre el reloj del servidor y el nuestro
  const socketRef = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onResolving, onOutcome };

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('luckio_token') } });
    socketRef.current = socket;

    const take = (snap) => {
      setOffset(snap.serverNow - Date.now());
      setState(snap);
      setPlayers(snap.players);
    };

    socket.on('connect', () => {
      setStatus('online');
      setError('');
      socket.emit('table:join', { table }, (res) => {
        if (!res.ok) { setStatus('error'); setError(res.message); return; }
        take(res.state);
        if (res.state.phase === 'resolving') callbacks.current.onResolving?.(res.state, { late: true });
      });
    });
    socket.on('disconnect', () => setStatus('offline'));
    socket.on('connect_error', (e) => { setStatus('error'); setError(e.message === 'No autorizado' ? 'Tu sesión venció, vuelve a iniciar sesión.' : 'No se pudo conectar con la mesa.'); });

    socket.on('table:state', (snap) => snap.table === table && take(snap));
    socket.on('table:resolving', (snap) => {
      if (snap.table !== table) return;
      take(snap);
      callbacks.current.onResolving?.(snap, { late: false });
    });
    socket.on('table:players', (p) => p.table === table && setPlayers(p.players));
    socket.on('table:outcome', (o) => {
      if (o.table !== table) return;
      if (o.user) setUser(o.user);
      callbacks.current.onOutcome?.(o);
    });

    return () => {
      socket.emit('table:leave', { table });
      socket.close();
    };
  }, [table, setUser]);

  const placeBets = useCallback(
    (bets) =>
      new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket?.connected) return reject(new Error('Sin conexión con la mesa'));
        socket.emit('table:bet', { table, bets }, (res) => {
          if (!res?.ok) return reject(new Error(res?.message || 'No se pudo apostar'));
          if (res.user) setUser(res.user);
          resolve(res);
        });
      }),
    [table, setUser]
  );

  return { state, players, status, error, offset, placeBets };
}

// Segundos que faltan para que termine la fase actual (usa el reloj del servidor)
export function useCountdown(endsAt, offset) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!endsAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [endsAt]);
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt - (now + offset)) / 1000));
}
