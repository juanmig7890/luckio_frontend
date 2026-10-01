import { formatChips } from '../utils/vip';

const PRESETS = [10, 50, 100, 500, 1000];

export default function BetControl({ amount, setAmount, disabled, label = 'Tu apuesta' }) {
  return (
    <div className="bet-control">
      <span className="muted small">{label}</span>
      <div className="bet-presets">
        {PRESETS.map((v) => (
          <button
            key={v}
            type="button"
            disabled={disabled}
            className={`chip-btn ${Number(amount) === v ? 'active' : ''}`}
            onClick={() => setAmount(v)}
          >
            {formatChips(v)}
          </button>
        ))}
      </div>
      <input
        className="bet-input"
        type="number"
        min="10"
        max="100000"
        value={amount}
        disabled={disabled}
        onChange={(e) => setAmount(e.target.value)}
      />
    </div>
  );
}