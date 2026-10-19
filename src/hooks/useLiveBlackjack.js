import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

// Conecta con la mesa de Blackjack en vivo: 6 sillas independientes, un solo crupier compartido.
//   state:   estado completo de la mesa (fase, sillas con sus manos, crupier, de quién es el turno...)
//   mySeat:  el número de silla donde estoy sentado (null si solo estoy mirando)
//   sit/standUp/bet/insurance/act: acciones que devuelven una promesa
// onOutcome(datos) se llama cuando llegan TUS pagos de la ronda (gane o no, para saber que ya se liquidó).
export default function useLiveBlackjack({ onOutcome } = {}) {
  const { user, setUser } = useAuth();
  const [state, setState] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const socketRef = useRef(null);
  const callbacks = useRef({});
  useEffect(() => {
    callbacks.current = { onOutcome };
  });

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('luckio_token') } });
    socketRef.current = socket;

    const take = (snap) => {
      setOffset(snap.serverNow - Date.now());
      setState(snap);
    };

    socket.on('connect', () => {
      setStatus('online');
      setError('');
      socket.emit('bj:join', {}, (res) => {
        if (!res?.ok) { setStatus('error'); setError(res?.message || 'No se pudo conectar con la mesa.'); return; }
        take(res.state);
      });
    });
    socket.on('disconnect', () => setStatus('offline'));
    socket.on('connect_error', (e) => { setStatus('error'); setError(e.message === 'No autorizado' ? 'Tu sesión venció, vuelve a iniciar sesión.' : 'No se pudo conectar con la mesa.'); });

    socket.on('bj:state', (snap) => snap.table === 'blackjack' && take(snap));
    socket.on('bj:outcome', (o) => {
      if (o.user) setUser(o.user);
      callbacks.current.onOutcome?.(o);
    });

    return () => {
      socket.emit('bj:leave');
      socket.close();
    };
  }, [setUser]);

  const call = useCallback(
    (ev, payload) =>
      new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket?.connected) return reject(new Error('Sin conexión con la mesa'));
        socket.emit(ev, payload, (res) => {
          if (!res?.ok) return reject(new Error(res?.message || 'No se pudo completar la acción'));
          if (res.user) setUser(res.user);
          resolve(res);
        });
      }),
    [setUser]
  );

  const sit = useCallback((seat) => call('bj:sit', { seat }), [call]);
  const standUp = useCallback(() => call('bj:standUp', {}), [call]);
  const bet = useCallback((seat, payload) => call('bj:bet', { seat, ...payload }), [call]);
  const insurance = useCallback((seat, take) => call('bj:insurance', { seat, take }), [call]);
  const act = useCallback((seat, type) => call('bj:action', { seat, type }), [call]);

  const mySeat = state?.seats?.findIndex((s) => s && user && s.userId === user.id);

  return { state, status, error, offset, mySeat: mySeat >= 0 ? mySeat : null, sit, standUp, bet, insurance, act };
}
