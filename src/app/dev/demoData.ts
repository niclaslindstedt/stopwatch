// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The demo document: an ordinary afternoon with a few things on the go. It is
// the live demo (`make demo`), what the App Store screenshots are taken of
// (`VITE_SEED=demo`), and what Settings → Developer → Demo data swaps in — so
// it is written to those pictures rather than to exercise every field.
//
// Somebody cooking while they train: a run on the go and a plank timed
// between sets, the pasta and the oven counting down, a parking ticket with an
// hour left on it, and yesterday's things put away on the pages.
//
// Pure and clock-free: every moment is an offset from the one it is built
// for, so whatever day it is the demo reads the same and nothing ages. Nothing
// here states a reading — every figure the app shows is derived from these
// runs by its own code (`watch.ts`), the same as for anyone's real ones.

import {
  DOC_VERSION,
  type AppData,
  type Millis,
  type Stopwatch,
  type Timer,
} from "../types.ts";

const STAMP = "2026-01-01T00:00:00.000Z";

const S = 1000;
const M = 60 * S;
const H = 60 * M;

/** A run, `ago` milliseconds after it was made: going since `since` before
 *  now with `banked` on it from before, or held with that much on it. */
function run(
  id: string,
  name: string,
  now: Millis,
  made: Millis,
  banked: Millis,
  since: Millis | null,
  stopped = false,
): Stopwatch {
  return {
    id,
    name,
    startedAt: since === null ? null : now - since,
    banked,
    stopped,
    createdAt: now - made,
    updatedAt: STAMP,
  };
}

function timer(r: Stopwatch, duration: Millis): Timer {
  return { ...r, duration };
}

/** The demo, for the moment it is opened. */
export function buildDemoData(at: Date): AppData {
  const now = at.getTime();
  const stopwatches: Stopwatch[] = [
    // The one on the dial: a run, twenty-three minutes in.
    run("demo-run", "Evening run", now, 24 * M, 0, 23 * M + 41 * S + 300),
    // Held between sets.
    run("demo-plank", "Plank", now, 40 * M, 1 * M + 12 * S + 400, null),
    run("demo-call", "Call with Sam", now, 26 * H, 47 * M + 5 * S, null, true),
    run(
      "demo-lap",
      "Track laps",
      now,
      50 * H,
      1 * H + 4 * M + 31 * S,
      null,
      true,
    ),
  ];
  const timers: Timer[] = [
    // The one on the dial: eight minutes left of eleven.
    timer(run("demo-pasta", "Pasta", now, 4 * M, 0, 3 * M + 12 * S), 11 * M),
    timer(run("demo-oven", "Oven", now, 30 * M, 0, 28 * M), 45 * M),
    timer(run("demo-parking", "Parking", now, 2 * H, 0, 55 * M), 2 * H),
    timer(run("demo-tea", "Tea", now, 20 * H, 4 * M, null, true), 4 * M),
    timer(
      run("demo-bread", "Bread rise", now, 30 * H, 0, null, true),
      1 * H + 30 * M,
    ),
  ];
  return {
    version: DOC_VERSION,
    stopwatches: Object.fromEntries(stopwatches.map((s) => [s.id, s])),
    timers: Object.fromEntries(timers.map((t) => [t.id, t])),
  };
}
