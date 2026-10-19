import Chip from './Chip';

const VALUES = [10, 50, 100, 500, 1000, 5000, 25000];

// Bandeja de fichas: eliges el valor y luego tocas una casilla del tapete para apostarlo.
export default function ChipTray({ value, onChange, disabled, label = 'Elige una ficha y toca la mesa' }) {
  return (
    <div className="chip-tray">
      <span className="muted small">{label}</span>
      <div className="chips-row">
        {VALUES.map((v) => (
          <Chip key={v} value={v} size={54} selected={value === v} disabled={disabled} onClick={() => onChange(v)} />
        ))}
      </div>
    </div>
  );
}
