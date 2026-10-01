import { useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatChips } from '../utils/vip';

const QUICK_AMOUNTS = [500, 1000, 5000, 10000];

export default function RechargeModal({ onClose }) {
  const { setUser } = useAuth();
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/recharge', { amount: Number(amount) });
      setUser(data.user);
      setSuccess(data.message);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Recargar Fichas</h2>
        <p className="muted">Recarga simulada: las fichas no tienen valor real.</p>

        <div className="quick-amounts">
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              className={`chip-btn ${Number(amount) === v ? 'active' : ''}`}
              onClick={() => setAmount(v)}
            >
              🪙 {formatChips(v)}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Otro monto (100 - 100,000)</span>
          <input
            type="number"
            min="100"
            max="100000"
            step="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button className="btn btn-gold btn-block" onClick={submit} disabled={loading}>
          {loading ? 'Procesando...' : `Recargar ${formatChips(amount)} fichas`}
        </button>
      </div>
    </div>
  );
}