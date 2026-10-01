import { useEffect, useState, useCallback } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';

const STATUS = { pending: '⏳ Pendiente', won: '✅ Ganada', lost: '❌ Perdida' };

export default function Sports() {
  const { setUser } = useAuth();
  const [tab, setTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(100);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const loadBets = useCallback(() => api.get('/sports/bets').then(({ data }) => setBets(data.bets)), []);

  useEffect(() => {
    api.get('/sports/events')
      .then(({ data }) => setEvents(data.events))
      .catch((err) => setMessage({ type: 'error', text: getErrorMessage(err) }))
      .finally(() => setLoading(false));
    loadBets().catch(() => {});
  }, [loadBets]);

  const place = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await api.post('/sports/bet', { eventId: selected.event.id, pick: selected.pick, amount: Number(amount) });
      setUser(data.user);
      setMessage({ type: 'success', text: `Apuesta creada. Ganancia potencial: ${formatChips(data.bet.potentialWin)} fichas` });
      setSelected(null);
      loadBets();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const settle = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await api.post('/sports/settle');
      setUser(data.user);
      setMessage({ type: 'success', text: data.message });
      loadBets();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const potential = selected ? Math.floor(Number(amount) * selected.price) : 0;

  return (
    <div className="game-page wide">
      <h1>⚽ Apuestas Deportivas</h1>
      <p className="muted">Cuotas reales de los próximos eventos. Tus apuestas se liquidan con los resultados oficiales.</p>

      <div className="tabs">
        <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>Partidos</button>
        <button className={tab === 'bets' ? 'active' : ''} onClick={() => setTab('bets')}>Mis apuestas ({bets.length})</button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {tab === 'events' && (
        <>
          {loading ? (
            <p className="muted">Cargando partidos...</p>
          ) : events.length === 0 ? (
            <p className="muted">No hay partidos disponibles por ahora.</p>
          ) : (
            <div className="events-list">
              {events.map((ev) => (
                <div key={ev.id} className="event-card">
                  <div className="event-head">
                    <span className="tag">{ev.sportTitle}</span>
                    <span className="muted small">{new Date(ev.commenceTime).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="event-teams">{ev.homeTeam} <span className="muted">vs</span> {ev.awayTeam}</div>
                  <div className="odds-row">
                    {ev.odds.map((o) => (
                      <button
                        key={o.name}
                        className={`odd-btn ${selected?.event.id === ev.id && selected.pick === o.name ? 'sel' : ''}`}
                        onClick={() => setSelected({ event: ev, pick: o.name, price: o.price })}
                      >
                        <span>{o.name === 'Draw' ? 'Empate' : o.name}</span>
                        <strong>{o.price.toFixed(2)}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="bet-slip">
              <div>
                <strong>{selected.pick === 'Draw' ? 'Empate' : selected.pick}</strong>
                <p className="muted small">{selected.event.homeTeam} vs {selected.event.awayTeam} · cuota {selected.price.toFixed(2)}</p>
              </div>
              <BetControl amount={amount} setAmount={setAmount} disabled={busy} />
              <p className="center">Ganancia potencial: <strong className="gold">🪙 {formatChips(potential)}</strong></p>
              <div className="bj-actions">
                <button className="btn btn-gold" onClick={place} disabled={busy}>{busy ? 'Procesando...' : 'Confirmar apuesta'}</button>
                <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'bets' && (
        <div className="panel">
          <button className="btn btn-gold" onClick={settle} disabled={busy}>
            {busy ? 'Revisando...' : '🔄 Revisar resultados'}
          </button>
          {bets.length === 0 ? (
            <p className="muted">Aún no has apostado.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Partido</th><th>Pick</th><th>Cuota</th><th>Apuesta</th><th>Premio</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {bets.map((b) => (
                    <tr key={b._id}>
                      <td>{b.homeTeam} vs {b.awayTeam}</td>
                      <td>{b.pick === 'Draw' ? 'Empate' : b.pick}</td>
                      <td>{b.odds.toFixed(2)}</td>
                      <td>{formatChips(b.amount)}</td>
                      <td>{formatChips(b.potentialWin)}</td>
                      <td>{STATUS[b.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}