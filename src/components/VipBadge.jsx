import { getLevel } from '../utils/vip';

export default function VipBadge({ level, large = false }) {
  const info = getLevel(level);
  const isTop = level === 'VIP LUCK.IO';
  return (
    <span
      className={`vip-badge ${isTop ? 'vip-top' : ''} ${large ? 'vip-large' : ''}`}
      style={{ '--vip-color': info.color }}
    >
      <span>{info.icon}</span>
      {info.name}
    </span>
  );
}