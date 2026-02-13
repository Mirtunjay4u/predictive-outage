import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/dashboard';

export function useAnimatedNumber(value: number, duration = 300) {
  const [animated, setAnimated] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setAnimated(value);
      previous.current = value;
      return;
    }

    const start = previous.current;
    const delta = value - start;
    if (delta === 0) return;

    const startAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(start + delta * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previous.current = value;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return Math.round(animated);
}
