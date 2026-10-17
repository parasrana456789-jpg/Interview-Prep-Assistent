import { useEffect, useRef, useState, useCallback } from 'react';

/** Countdown timer. start(seconds, onExpire) begins; stop() halts. */
export default function useTimer() {
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const onEnd = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && left <= 0) {
      setRunning(false);
      onEnd.current?.();
    }
  }, [left, running]);

  const start = useCallback((seconds, cb) => { onEnd.current = cb; setLeft(seconds); setRunning(true); }, []);
  const stop = useCallback(() => setRunning(false), []);
  return { left: Math.max(0, left), running, start, stop };
}
