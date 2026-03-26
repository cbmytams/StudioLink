import { useCallback, useRef } from 'react';

export function useRateLimit(limitMs = 2000) {
  const lastCall = useRef<number>(0);
  const pending = useRef(false);

  const throttle = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      const now = Date.now();
      if (pending.current || now - lastCall.current < limitMs) {
        return null;
      }

      pending.current = true;
      lastCall.current = now;

      try {
        return await fn();
      } finally {
        pending.current = false;
      }
    },
    [limitMs],
  );

  return throttle;
}
