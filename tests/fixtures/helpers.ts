// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Fixtures the domain tests share. Not a test file itself — no `_test` suffix
// — so Vitest never tries to run it.

import type { Millis, Stopwatch, Timer } from "../../src/app/types.ts";

export const STAMP = "2026-03-02T09:00:00.000Z";
export const LATER = "2026-03-02T10:00:00.000Z";

/** A moment to pin tests to: 2 March 2026, 09:00 UTC. */
export const T0: Millis = Date.parse(STAMP);

export const s = (seconds: number): Millis => seconds * 1000;
export const m = (minutes: number): Millis => minutes * 60_000;
export const h = (hours: number): Millis => hours * 3_600_000;

/** A stopwatch held at zero, made at `T0`. */
export function stopwatch(patch: Partial<Stopwatch> = {}): Stopwatch {
  return {
    id: "sw1",
    name: "Stopwatch 1",
    startedAt: null,
    banked: 0,
    stopped: false,
    createdAt: T0,
    updatedAt: STAMP,
    ...patch,
  };
}

/** A timer set to five minutes and held at the top, made at `T0`. */
export function timer(patch: Partial<Timer> = {}): Timer {
  return {
    ...stopwatch({ id: "t1", name: "Timer 1" }),
    duration: m(5),
    ...patch,
  };
}
