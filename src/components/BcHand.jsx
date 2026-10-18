import PlayingCard from './PlayingCard';
import { baccaratPoints } from '../utils/helpers';

const totalOf = (list) => list.filter((c) => !c.down).reduce((s, c) => s + baccaratPoints(c.card), 0) % 10;

// Mano de Bacará (Punto o Banca) con su total. Las cartas llegan como { card, down }.
export default function BcHand({ title, list, win }) {
  return (
    <div className={`bc-hand ${win ? 'win' : ''}`}>
      <div className="bc-hand-head">
        <span>{title}</span>
        <strong className="score-bubble inline">{list.length ? totalOf(list) : '–'}</strong>
      </div>
      <div className="bj-cards">
        {list.map((c, i) => <PlayingCard key={i} card={c.card} faceDown={c.down} width={88} />)}
        {list.length === 0 && <div className="bj-slot" aria-hidden="true" />}
      </div>
    </div>
  );
}
