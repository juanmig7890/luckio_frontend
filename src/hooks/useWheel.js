import { useCallback, useState } from 'react';
import { SEG, SPIN_MS, WHEEL_ORDER } from '../components/roulette/rouletteUtils';
import { sleep } from '../utils/helpers';

// Controla la rueda: spinTo(número) hace girar la rueda y la bola hasta que cae en ese número.
export default function useWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [ball, setBall] = useState({ rot: 0, r: 134, anim: false });

  const spinTo = useCallback(async (number) => {
    setSpinning(true);
    // 1) La bola sale al carril exterior sin animación; 2) en el siguiente instante gira y cae en la casilla ganadora
    setBall((b) => ({ rot: b.rot, r: 134, anim: false }));
    await sleep(40);
    const theta = WHEEL_ORDER.indexOf(number) * SEG + SEG / 2;
    setRotation((prev) => {
      const cur = ((prev % 360) + 360) % 360;
      const target = ((-theta % 360) + 360) % 360;
      let delta = target - cur;
      if (delta <= 0) delta += 360;
      return prev + delta + 360 * 5;
    });
    setBall((b) => ({ rot: b.rot - 360 * 4, r: 110, anim: true }));
    await sleep(SPIN_MS + 250);
    setSpinning(false);
  }, []);

  return { rotation, ball, spinning, spinTo };
}
