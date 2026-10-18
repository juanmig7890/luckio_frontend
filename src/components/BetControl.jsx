import { formatChips } from '../utils/vip';
import Chip from './Chip';

const PRESETS = [10, 50, 100, 500, 1000];

export default function BetControl({ amount, setAmount, disabled, label = 'Tu apuesta' }) {
  return (
    <div className="bet-control">
      <span className="muted small">{label}</span>
      <div className="bet-presets chips-row">
        {PRESETS.map((v) => (
          <Chip
            key={v}
            value={v}
            size={52}
            disabled={disabled}
            selected={Number(amount) === v}
            onClick={() => setAmount(v)}
            title={`${formatChips(v)} fichas`}
          />
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
