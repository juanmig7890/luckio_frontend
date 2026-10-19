import { useEffect, useMemo, useState, useCallback } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';
import BetControl from '../components/BetControl';
import TeamBadge from '../components/TeamBadge';

const STATUS = { pending: '⏳ Pendiente', won: '✅ Ganada', lost: '❌ Perdida', push: '➖ Empujó (devuelta)' };

// Las competiciones más conocidas aparecen primero; el resto, alfabético.
const POPULAR = [
  'UEFA Champions League', 'EPL', 'La Liga - Spain', 'Serie A - Italy', 'Bundesliga - Germany',
  'Ligue 1 - France', 'UEFA Europa League', 'UEFA Europa Conference League', 'MLS', 'Liga MX',
];

const describeSelection = (s) => {
  if (s.market === 'totals') return `${s.pick === 'Over' ? 'Más' : 'Menos'} de ${s.point} goles`;
  return s.pick === 'Draw' ? 'Empate' : s.pick;
};
const matchLabel = (s) => `${s.homeTeam} vs ${s.awayTeam}`;

export default function Sports() {
  const { setUser } = useAuth();
  const [tab, setTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [league, setLeague] = useState('Todas');
  const [bets, setBets] = useState([]);
  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slip, setSlip] = useState([]); // selecciones activas (como máximo una por partido)
  const [mode, setMode] = useState('single'); // 'single' | 'combo'
  const [singleAmounts, setSingleAmounts] = useState({}); // eventId -> monto (modo sencillas)
  const [comboAmount, setComboAmount] = useState(100); // monto único (modo combinada)
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const loadBets = useCallback(() =>
    api.get('/sports/bets').then(({ data }) => { setBets(data.bets); setParlays(data.parlays || []); }), []);

  useEffect(() => {
    api.get('/sports/events')
      .then(({ data }) => setEvents(data.events))
      .catch((err) => setMessage({ type: 'error', text: getErrorMessage(err) }))
      .finally(() => setLoading(false));
    loadBets().catch(() => {});
  }, [loadBets]);

  const leagues = useMemo(() => {
    const set = [...new Set(events.map((e) => e.sportTitle))];
    set.sort((a, b) => {
      const pa = POPULAR.indexOf(a);
      const pb = POPULAR.indexOf(b);
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb);
      return a.localeCompare(b);
    });
    return set;
  }, [events]);
  const shownEvents = league === 'Todas' ? events : events.filter((e) => e.sportTitle === league);

  const toggleSelection = (event, sel) => {
    setMessage(null);
    setSlip((prev) => {
      const existing = prev.find((s) => s.eventId === event.id);
      const same = existing && existing.market === sel.market && existing.pick === sel.pick && (existing.point ?? null) === (sel.point ?? null);
      // Clic sobre la misma selección: se quita. Clic sobre otra del mismo partido: la reemplaza
      // (solo se puede tener UNA selección activa por partido, igual que exige el servidor en las combinadas).
      const rest = prev.filter((s) => s.eventId !== event.id);
      if (same) return rest;
      return [...rest, { eventId: event.id, sportTitle: event.sportTitle, homeTeam: event.homeTeam, awayTeam: event.awayTeam, ...sel }];
    });
  };
  const removeSelection = (eventId) => setSlip((prev) => prev.filter((s) => s.eventId !== eventId));
  const clearSlip = () => { setSlip([]); setSingleAmounts({}); };

  const isSelected = (eventId, sel) => {
    const s = slip.find((x) => x.eventId === eventId);
    return Boolean(s && s.market === sel.market && s.pick === sel.pick && (s.point ?? null) === (sel.point ?? null));
  };

  const confirmSingles = async () => {
    setBusy(true);
    setMessage(null);
    try {
      let lastUser = null;
      let count = 0;
      for (const s of slip) {
        const amount = Number(singleAmounts[s.eventId]);
        if (!amount || amount < 10) continue;
        const { data } = await api.post('/sports/bet', { eventId: s.eventId, market: s.market, pick: s.pick, point: s.point ?? undefined, amount });
        lastUser = data.user;
        count++;
      }
      if (count === 0) throw new Error('Pon un monto de al menos 10 fichas en alguna selección');
      if (lastUser) setUser(lastUser);
      setMessage({ type: 'success', text: `${count} apuesta${count === 1 ? '' : 's'} realizada${count === 1 ? '' : 's'}.` });
      clearSlip();
      loadBets();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const confirmCombo = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const legs = slip.map((s) => ({ eventId: s.eventId, market: s.market, pick: s.pick, point: s.point ?? undefined }));
      const { data } = await api.post('/sports/parlay', { legs, amount: Number(comboAmount) });
      setUser(data.user);
      setMessage({ type: 'success', text: `Combinada creada: cuota total ${data.bet.combinedOdds.toFixed(2)} · ganancia potencial ${formatChips(data.bet.potentialWin)} fichas.` });
      clearSlip();
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

  const comboOdds = slip.reduce((p, s) => p * s.price, 1);

  return (
    <div className="game-page wide">
      <h1>⚽ Apuestas Deportivas</h1>
      <p className="muted">Cuotas reales de los próximos partidos de más de 45 ligas y copas. Arma apuestas sencillas o combina varias selecciones en una combinada.</p>

      <div className="tabs">
        <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>Partidos</button>
        <button className={tab === 'bets' ? 'active' : ''} onClick={() => setTab('bets')}>Mis apuestas ({bets.length + parlays.length})</button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {tab === 'events' && (
        <>
          {loading ? (
            <p className="muted">Cargando partidos...</p>
          ) : events.length === 0 ? (
            <p className="muted">No hay partidos disponibles por ahora.</p>
          ) : (
            <>
              <div className="league-row">
                <button className={`league-pill ${league === 'Todas' ? 'active' : ''}`} onClick={() => setLeague('Todas')}>Todas</button>
                {leagues.map((l) => (
                  <button key={l} className={`league-pill ${league === l ? 'active' : ''}`} onClick={() => setLeague(l)}>{l}</button>
                ))}
              </div>

              <div className="events-list">
                {shownEvents.map((ev) => (
                  <div key={ev.id} className="event-card">
                    <div className="event-head">
                      <span className="tag">{ev.sportTitle}</span>
                      <span className="muted small">{new Date(ev.commenceTime).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="event-teams">
                      <span className="team-name"><TeamBadge name={ev.homeTeam} /> {ev.homeTeam}</span>
                      <span className="muted vs">vs</span>
                      <span className="team-name"><TeamBadge name={ev.awayTeam} /> {ev.awayTeam}</span>
                    </div>

                    <span className="market-label">Resultado del partido (1X2)</span>
                    <div className="odds-row">
                      {ev.odds.map((o) => (
                        <button
                          key={o.name}
                          className={`odd-btn ${isSelected(ev.id, { market: 'h2h', pick: o.name }) ? 'sel' : ''}`}
                          onClick={() => toggleSelection(ev, { market: 'h2h', pick: o.name, price: o.price })}
                        >
                          <span>{o.name === 'Draw' ? 'Empate' : o.name}</span>
                          <strong>{o.price.toFixed(2)}</strong>
                        </button>
                      ))}
                    </div>

                    {ev.totals?.length === 2 && (
                      <>
                        <span className="market-label">Total de goles (línea {ev.totals[0].point})</span>
                        <div className="odds-row">
                          {ev.totals.map((o) => (
                            <button
                              key={o.name}
                              className={`odd-btn ${isSelected(ev.id, { market: 'totals', pick: o.name, point: o.point }) ? 'sel' : ''}`}
                              onClick={() => toggleSelection(ev, { market: 'totals', pick: o.name, point: o.point, price: o.price })}
                            >
                              <span>{o.name === 'Over' ? 'Más de' : 'Menos de'} {o.point}</span>
                              <strong>{o.price.toFixed(2)}</strong>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {slip.length > 0 && (
            <div className="bet-slip">
              <div className="bet-slip-head">
                <span>
                  {slip.length} selección{slip.length === 1 ? '' : 'es'}
                  {slip.length >= 2 && ` · cuota combinada ${comboOdds.toFixed(2)}`}
                </span>
                <button className="btn btn-ghost" onClick={clearSlip} disabled={busy}>Limpiar</button>
              </div>

              {slip.length >= 2 && (
                <div className="tabs small">
                  <button className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>Sencillas</button>
                  <button className={mode === 'combo' ? 'active' : ''} onClick={() => setMode('combo')}>Combinada</button>
                </div>
              )}

              <div className="bet-slip-list" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                {slip.map((s) => (
                  <div key={s.eventId} className="slip-row">
                    <div className="slip-row-info">
                      <strong>{describeSelection(s)}</strong>
                      <span className="muted small">{matchLabel(s)} · cuota {s.price.toFixed(2)}</span>
                    </div>
                    {mode === 'single' && (
                      <input
                        className="bet-input slip-amount"
                        type="number"
                        min="10"
                        max="100000"
                        placeholder="Monto"
                        value={singleAmounts[s.eventId] || ''}
                        onChange={(e) => setSingleAmounts((a) => ({ ...a, [s.eventId]: e.target.value }))}
                        disabled={busy}
                      />
                    )}
                    <button className="spot-clear" onClick={() => removeSelection(s.eventId)} aria-label="Quitar selección">✕</button>
                  </div>
                ))}
              </div>

              {mode === 'combo' ? (
                <>
                  <BetControl amount={comboAmount} setAmount={setComboAmount} disabled={busy} label="Monto de la combinada" />
                  <p className="center muted small">
                    Ganancia potencial: <strong className="gold">🪙 {formatChips(Math.floor(Number(comboAmount) * comboOdds))}</strong>
                  </p>
                  <button className="btn btn-gold btn-block" onClick={confirmCombo} disabled={busy || slip.length < 2}>
                    {busy ? 'Procesando...' : 'Confirmar combinada'}
                  </button>
                </>
              ) : (
                <button className="btn btn-gold btn-block" onClick={confirmSingles} disabled={busy}>
                  {busy ? 'Procesando...' : 'Confirmar apuesta(s)'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'bets' && (
        <div className="panel">
          <button className="btn btn-gold" onClick={settle} disabled={busy}>
            {busy ? 'Revisando...' : '🔄 Revisar resultados'}
          </button>

          {bets.length === 0 && parlays.length === 0 ? (
            <p className="muted">Aún no has apostado.</p>
          ) : (
            <>
              {bets.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Partido</th><th>Selección</th><th>Cuota</th><th>Apuesta</th><th>Premio</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                      {bets.map((b) => (
                        <tr key={b._id}>
                          <td>{b.homeTeam} vs {b.awayTeam}</td>
                          <td>{describeSelection(b)}</td>
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

              {parlays.length > 0 && (
                <>
                  <p className="muted small" style={{ marginTop: 14 }}>Combinadas</p>
                  <div className="events-list">
                    {parlays.map((p) => (
                      <div key={p._id} className="event-card">
                        <div className="event-head">
                          <span className="tag">{p.legs.length} selecciones · cuota {p.combinedOdds.toFixed(2)}</span>
                          <span className="muted small">{STATUS[p.status]}</span>
                        </div>
                        <ul className="parlay-legs">
                          {p.legs.map((leg, i) => (
                            <li key={i} className={leg.status}>
                              {describeSelection(leg)} — {leg.homeTeam} vs {leg.awayTeam}
                              {leg.status !== 'pending' && <span className="muted small"> ({STATUS[leg.status]})</span>}
                            </li>
                          ))}
                        </ul>
                        <span className="muted small">Apuesta {formatChips(p.amount)} · Premio {formatChips(p.potentialWin)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
