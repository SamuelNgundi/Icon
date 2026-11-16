import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export const REVEAL_ALL_INTERVAL_MS = 620;
const SQUAD_SIZE = 10;

export function useProgressiveReveal(
  revealIndex: number,
  setRevealIndex: Dispatch<SetStateAction<number>>,
  isRevealScreen: boolean,
) {
  const [isRevealingAll, setIsRevealingAll] = useState(false);

  function startRevealAll(): void {
    if (isRevealingAll || revealIndex >= SQUAD_SIZE) return;
    setIsRevealingAll(true);
    setRevealIndex((index) => Math.min(index + 1, SQUAD_SIZE));
  }

  useEffect(() => {
    if (!isRevealingAll) return;
    if (!isRevealScreen || revealIndex >= SQUAD_SIZE) {
      setIsRevealingAll(false);
      return;
    }

    const timeout = window.setTimeout(
      () => setRevealIndex((index) => Math.min(index + 1, SQUAD_SIZE)),
      REVEAL_ALL_INTERVAL_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [isRevealScreen, isRevealingAll, revealIndex, setRevealIndex]);

  return { isRevealingAll, startRevealAll };
}
