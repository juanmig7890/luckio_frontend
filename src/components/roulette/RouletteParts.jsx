import Chip from '../Chip';
import { FILL, SEG, SPIN_MS, WHEEL_ORDER, colorOf, polar, sector, short, topChip } from './rouletteUtils';

export function Wheel({ rotation, ball, spinning, number }) {
  return (
    <div className="wheel-box">
      <svg viewBox="0 0 300 300" className="wheel-svg" role="img" aria-label="Rueda de la ruleta">
        <defs>
          <radialGradient id="rim" cx="50%" cy="50%" r="50%">
            <stop offset="88%" stopColor="#3a2a1a" />
            <stop offset="100%" stopColor="#1b130b" />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="148" fill="url(#rim)" stroke="#c9a45c" strokeWidth="2" />
        <circle cx="150" cy="150" r="141" fill="#0b0d0c" />
        <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '150px 150px', transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.6, 0.2, 1)` : 'none' }}>
          {WHEEL_ORDER.map((n, i) => (
            <path key={n} d={sector(i, 94, 128)} fill={FILL[colorOf(n)]} stroke="#c9a45c" strokeWidth="0.6" />
          ))}
          {WHEEL_ORDER.map((n, i) => {
            const mid = i * SEG + SEG / 2;
            const [x, y] = polar(112, mid);
            return (
              <text key={n} x={x} y={y} fill="#f3f1ea" fontSize="9.5" fontWeight="700" textAnchor="middle" dominantBaseline="central"
                transform={`rotate(${mid} ${x} ${y})`}>
                {n}
              </text>
            );
          })}
          <circle cx="150" cy="150" r="90" fill="#101412" stroke="#c9a45c" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="64" fill="none" stroke="#2a302d" strokeWidth="1" />
          {[0, 90, 180, 270].map((a) => {
            const [x, y] = polar(60, a);
            return <line key={a} x1="150" y1="150" x2={x} y2={y} stroke="#c9a45c" strokeWidth="3" strokeLinecap="round" />;
          })}
          <circle cx="150" cy="150" r="14" fill="#c9a45c" />
          <circle cx="150" cy="150" r="5" fill="#0b0d0c" />
        </g>
        <g style={{ transform: `rotate(${ball.rot}deg)`, transformOrigin: '150px 150px', transition: ball.anim ? `transform ${SPIN_MS}ms cubic-bezier(0.2, 0.7, 0.25, 1)` : 'none' }}>
          <circle cx="150" cy="150" r="5.5" fill="#f6f3ea" stroke="#9a9484" strokeWidth="0.8"
            style={{ transform: `translateY(-${ball.r}px)`, transition: ball.anim ? `transform 1300ms ease-in ${SPIN_MS - 1600}ms` : 'none' }} />
        </g>
        <path d="M150 4 L144 -6 L156 -6 Z" fill="#c9a45c" transform="translate(0 12)" />
      </svg>
      <div className={`wheel-readout ${number !== null ? colorOf(number) : ''}`}>{spinning ? '…' : number ?? '–'}</div>
    </div>
  );
}

export function Cell({ betType, selection, label, className = '', style, hot, amount = 0, hit, disabled, onBet, placed = false }) {
  return (
    <button type="button" style={style} disabled={disabled} onClick={() => onBet(betType, selection)}
      className={`rl-cell ${className} ${amount ? 'has' : ''} ${placed ? 'placed' : ''} ${hit ? 'hit' : ''}`} aria-label={`Apostar en ${label}`}>
      <span className="rl-label">{label}</span>
      {hot && <span className="rl-hot" title="Número caliente">●</span>}
      {amount > 0 && (
        <span className="rl-chip">
          <Chip value={topChip(amount)} size={32} />
          <b>{short(amount)}</b>
        </span>
      )}
    </button>
  );
}

// Tapete de la ruleta. cp(betType, selection) devuelve las propiedades de cada casilla (monto, si está bloqueada, etc.).
export function RouletteBoard({ cp, isHot }) {
  return (
    <div className="rl-scroll">
      <div className="rl-board">
        <Cell {...cp('straight', 0)} label="0" className="green" style={{ gridRow: '1 / 4', gridColumn: 1 }} hot={isHot(0)} />
        {[0, 1, 2].flatMap((r) =>
          Array.from({ length: 12 }, (_, c) => {
            const n = 3 * (c + 1) - r;
            return <Cell key={n} {...cp('straight', n)} label={String(n)} className={colorOf(n)} style={{ gridRow: r + 1, gridColumn: c + 2 }} hot={isHot(n)} />;
          })
        )}
        {[0, 1, 2].map((r) => (
          <Cell key={`col${r}`} {...cp('column', 3 - r)} label="2 a 1" className="outside" style={{ gridRow: r + 1, gridColumn: 14 }} />
        ))}
        {[1, 2, 3].map((d) => (
          <Cell key={`doz${d}`} {...cp('dozen', d)} label={`${d}ª 12`} className="outside" style={{ gridRow: 4, gridColumn: `${2 + 4 * (d - 1)} / span 4` }} />
        ))}
        <Cell {...cp('half', 'low')} label="1-18" className="outside" style={{ gridRow: 5, gridColumn: '2 / span 2' }} />
        <Cell {...cp('parity', 'even')} label="Par" className="outside" style={{ gridRow: 5, gridColumn: '4 / span 2' }} />
        <Cell {...cp('color', 'red')} label="Rojo" className="outside red-spot" style={{ gridRow: 5, gridColumn: '6 / span 2' }} />
        <Cell {...cp('color', 'black')} label="Negro" className="outside black-spot" style={{ gridRow: 5, gridColumn: '8 / span 2' }} />
        <Cell {...cp('parity', 'odd')} label="Impar" className="outside" style={{ gridRow: 5, gridColumn: '10 / span 2' }} />
        <Cell {...cp('half', 'high')} label="19-36" className="outside" style={{ gridRow: 5, gridColumn: '12 / span 2' }} />
      </div>
    </div>
  );
}
