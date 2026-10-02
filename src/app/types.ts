// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The app's data model: the stopwatches and the timers, and nothing else.
// What a dial shows, what a row in a list reads and whether a timer has gone
// off are all derived from these at read time (see `watch.ts`) — nothing about
// an elapsed time or a time left is stored, so a document that syncs while a
// stopwatch runs means the same on every device the moment it lands.
//
// Both are the same shape underneath: a *run*. A run is banked time plus,
// while it is going, the moment it was started. Pausing banks what has run
// since that moment and clears it; starting again sets a new one. That is the
// whole of a stopwatch, and a timer is a run measured against a duration.

/** A moment, as milliseconds since the Unix epoch. Absolute rather than
 *  local, unlike a time report's: a stopwatch started on the phone has to be
 *  the same stopwatch on the laptop, whatever zone either is set to. */
export type Millis = number;

/** What a stopwatch and a timer have in common: a name, and the run. */
export type Run = {
  id: string;
  /** What the reader called it. A fresh one is numbered ("Stopwatch 3") and
   *  can be renamed on its page. */
  name: string;
  /** When the current stretch started, or null while it is not running. */
  startedAt: Millis | null;
  /** Time banked from the stretches before this one. */
  banked: Millis;
  /** Put away: it is no longer on the main screen, only on its page, where
   *  it can be started again. */
  stopped: boolean;
  /** When it was made — the order the lists are in, newest first. */
  createdAt: Millis;
  /** ISO timestamp of the last edit: the tiebreak when two devices changed
   *  the same one between syncs (see `merge.ts`). */
  updatedAt: string;
  /** Removed. Kept as a tombstone so a sync does not bring it back from a
   *  device that still has it (see `merge.ts`); never shown. */
  deleted?: true;
};

export type Stopwatch = Run;

export type Timer = Run & {
  /** How long it counts down from, set in hours and minutes. */
  duration: Millis;
};

/** The persisted document — the whole app state, one JSON blob. */
export type AppData = {
  /** Schema version; bumped by a migration step in `migrations.ts`. */
  version: number;
  stopwatches: Record<string, Stopwatch>;
  timers: Record<string, Timer>;
};

/** The current document schema version. */
export const DOC_VERSION = 1;

/** The document a first run starts from. */
export function emptyDoc(): AppData {
  return { version: DOC_VERSION, stopwatches: {}, timers: {} };
}

/** The two kinds of watch the app keeps — the main screen's two tabs. */
export type WatchKind = "stopwatch" | "timer";

export const WATCH_KINDS: WatchKind[] = ["stopwatch", "timer"];
