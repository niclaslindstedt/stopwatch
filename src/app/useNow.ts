// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useState } from "react";

import type { Millis } from "./types.ts";

// The one place the app reads the clock. Every reading takes `now` as a
// parameter (see `watch.ts`); this hook is where that parameter comes from,
// ticking at whatever rate a screen needs — ten times a second for a
// stopwatch's tenths, once a second for a list — and re-read on focus so a
// phone that was asleep does not show the time it dozed off at.

/**
 * The moment to the millisecond, for the one thing that cannot wait for a
 * render: the loop that moves the dial's hands (see `useHands.ts`). A reading
 * must never take this — it is not a parameter, it is a reading — but a second
 * hand beating eight times a second cannot be told the time in whole seconds.
 * Here rather than in the loop so the clock is still read in one file.
 */
export function nowExact(): Millis {
  return Date.now();
}

export function useNow(intervalMs: number): Millis {
  const [now, setNow] = useState<Millis>(nowExact);
  useEffect(() => {
    const refresh = () => setNow(nowExact());
    const timer = setInterval(refresh, intervalMs);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [intervalMs]);
  return now;
}
