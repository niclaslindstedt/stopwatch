// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// What a stopwatch or a timer reads, and the edits that can be made to one.
//
// Everything here is a pure function of a run and a moment: the elapsed time
// is banked time plus whatever has run since the current stretch started, and
// a timer's time left is its duration less that. Nothing is ticked, nothing is
// counted up in a loop, and nothing reads the clock — `now` is a parameter
// (supplied by `useNow`), which is what lets the tests pin real times and what
// makes a stopwatch that was started on another device read right the moment
// the document arrives.
//
// The edits are pure too: a run in, a new run out, with the edit's timestamp
// handed in (`stamp`) rather than read, the way ids are.

import type { Reading } from "./clock.ts";
import type {
  AppData,
  Millis,
  Run,
  Stopwatch,
  Timer,
  WatchKind,
} from "./types.ts";

// ── Reading ─────────────────────────────────────────────────────────────────

/** How long a run has run, at `now`: the bank, and the stretch under way. A
 *  stretch that claims to have started in the future — another device's clock
 *  ahead of this one — counts for nothing rather than for less than nothing. */
export function elapsed(run: Run, now: Millis): Millis {
  const live = run.startedAt === null ? 0 : Math.max(0, now - run.startedAt);
  return run.banked + live;
}

export function isRunning(run: Run): boolean {
  return run.startedAt !== null;
}

/** A timer's time left, at `now`: never below nothing. */
export function remaining(timer: Timer, now: Millis): Millis {
  return Math.max(0, timer.duration - elapsed(timer, now));
}

/** Whether a timer has run out — the moment it goes off. */
export function isDone(timer: Timer, now: Millis): boolean {
  return timer.duration > 0 && elapsed(timer, now) >= timer.duration;
}

/** The moment a running timer runs out, or null while it is not running. */
export function endsAt(timer: Timer): Millis | null {
  if (timer.startedAt === null) return null;
  return timer.startedAt + (timer.duration - timer.banked);
}

/**
 * Where a stopwatch is, in one word:
 *
 * - `running` — counting;
 * - `paused` — held, with time on it, and still on the main screen;
 * - `idle` — at zero and not counting: a fresh one, or one just reset;
 * - `stopped` — put away, on its page only.
 */
export type StopwatchState = "running" | "paused" | "idle" | "stopped";

export function stopwatchState(sw: Stopwatch): StopwatchState {
  if (sw.stopped) return "stopped";
  if (isRunning(sw)) return "running";
  return sw.banked > 0 ? "paused" : "idle";
}

/**
 * Where a timer is: the same four, and `done` — run out and not yet put away,
 * which is when it rings.
 */
export type TimerState = "running" | "paused" | "idle" | "done" | "stopped";

export function timerState(timer: Timer, now: Millis): TimerState {
  if (timer.stopped) return "stopped";
  if (isDone(timer, now)) return "done";
  if (isRunning(timer)) return "running";
  return timer.banked > 0 ? "paused" : "idle";
}

/** A fraction of a timer still to run, 1 when it is set and 0 when it has run
 *  out — what the bezel draws. */
export function timerLeft(timer: Timer, now: Millis): number {
  if (timer.duration <= 0) return 0;
  return remaining(timer, now) / timer.duration;
}

/**
 * What the dial is handed for a run: its reading as a value at a moment and a
 * rate. A running one is anchored at the moment its stretch started — the
 * bank at `startedAt`, moving from there — never at the moment a screen last
 * ticked. A screen that ticks once a second reads `now` up to a second before
 * the press that started the run, and a reading anchored there runs ahead of
 * the run by that much until the next tick pulls it back: the hand steps
 * early, then steps back, then steps again. Held — paused, idle, put away, or
 * a timer that has run out — it is simply what the run reads at `now`.
 */
export function dialReading(
  run: Run | Timer,
  kind: WatchKind,
  now: Millis,
): Reading {
  if (kind === "stopwatch") {
    if (run.startedAt !== null) {
      return { value: run.banked / 1000, at: run.startedAt, rate: 1 };
    }
    return { value: elapsed(run, now) / 1000, at: 0, rate: 0 };
  }
  const t = run as Timer;
  if (timerState(t, now) === "running" && t.startedAt !== null) {
    return {
      value: Math.max(0, t.duration - t.banked) / 1000,
      at: t.startedAt,
      rate: -1,
    };
  }
  return { value: remaining(t, now) / 1000, at: 0, rate: 0 };
}

/** Every one of a kind that has not been removed, newest first. */
export function listOf<R extends Run>(records: Record<string, R>): R[] {
  return Object.values(records)
    .filter((r) => !r.deleted)
    .sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? -1 : 1));
}

/** The ones on the main screen: everything not put away, newest first. */
export function activeOf<R extends Run>(records: Record<string, R>): R[] {
  return listOf(records).filter((r) => !r.stopped);
}

/** The records of a kind, out of the document. */
export function recordsOf(
  data: AppData,
  kind: WatchKind,
): Record<string, Run | Timer> {
  return kind === "stopwatch" ? data.stopwatches : data.timers;
}

/**
 * The name a new one gets: the kind's word and the lowest number no other one
 * of that kind is called — so a reader who removes "Stopwatch 2" gets it back
 * rather than a count that only ever climbs.
 */
export function nextName(records: Record<string, Run>, word: string): string {
  const taken = new Set(listOf(records).map((r) => r.name));
  for (let n = 1; ; n += 1) {
    const name = `${word} ${n}`;
    if (!taken.has(name)) return name;
  }
}

// ── Durations ───────────────────────────────────────────────────────────────

/** How a timer is set: hours and minutes, the way a kitchen timer is. */
export const TIMER_HOURS = { min: 0, max: 99 } as const;
export const TIMER_MINUTES = { min: 0, max: 59 } as const;

/** A duration out of hours and minutes, each clamped into range. */
export function durationOf(hours: number, minutes: number): Millis {
  const h = clampInt(hours, TIMER_HOURS.min, TIMER_HOURS.max);
  const m = clampInt(minutes, TIMER_MINUTES.min, TIMER_MINUTES.max);
  return (h * 60 + m) * 60_000;
}

/** A duration back into hours and minutes, for the controls that set it. */
export function partsOf(duration: Millis): { hours: number; minutes: number } {
  const total = Math.max(0, Math.round(duration / 60_000));
  return {
    hours: Math.min(TIMER_HOURS.max, Math.floor(total / 60)),
    minutes: total % 60,
  };
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

// ── Editing ─────────────────────────────────────────────────────────────────

/** A new stopwatch, started at `now` or held at zero. */
export function newStopwatch(
  id: string,
  name: string,
  now: Millis,
  stamp: string,
  running = true,
): Stopwatch {
  return {
    id,
    name,
    startedAt: running ? now : null,
    banked: 0,
    stopped: false,
    createdAt: now,
    updatedAt: stamp,
  };
}

/** A new timer, set to `duration` and started at `now`. */
export function newTimer(
  id: string,
  name: string,
  duration: Millis,
  now: Millis,
  stamp: string,
  running = true,
): Timer {
  return { ...newStopwatch(id, name, now, stamp, running), duration };
}

/** Start or carry on: a run that is already going is left as it is. A timer
 *  that has run out starts again from the top, since carrying on from nothing
 *  left would ring at once. Starting takes a run off the shelf too. */
export function start<R extends Run>(run: R, now: Millis, stamp: string): R {
  if (run.startedAt !== null && !run.stopped) return run;
  const spent = isTimer(run) && run.banked >= run.duration;
  return {
    ...run,
    banked: spent ? 0 : run.banked,
    startedAt: now,
    stopped: false,
    updatedAt: stamp,
  };
}

/** Hold: bank what has run and stop the stretch. A timer banks no more than
 *  its duration, so a paused timer that ran out reads as run out. */
export function pause<R extends Run>(run: R, now: Millis, stamp: string): R {
  if (run.startedAt === null) return run;
  const ran = elapsed(run, now);
  return {
    ...run,
    banked: isTimer(run) ? Math.min(ran, run.duration) : ran,
    startedAt: null,
    updatedAt: stamp,
  };
}

/** The dial pressed: start a run that is held, hold one that is going. */
export function toggle<R extends Run>(run: R, now: Millis, stamp: string): R {
  return run.startedAt === null
    ? start(run, now, stamp)
    : pause(run, now, stamp);
}

/** Back to zero — or, for a timer, back to the top — and held there. */
export function reset<R extends Run>(run: R, stamp: string): R {
  if (run.startedAt === null && run.banked === 0) return run;
  return { ...run, banked: 0, startedAt: null, updatedAt: stamp };
}

/** Put away: held where it is and off the main screen. */
export function stop<R extends Run>(run: R, now: Millis, stamp: string): R {
  return { ...pause(run, now, stamp), stopped: true, updatedAt: stamp };
}

/** Off the shelf and going again from zero (from the top, for a timer). */
export function restart<R extends Run>(run: R, now: Millis, stamp: string): R {
  return {
    ...run,
    banked: 0,
    startedAt: now,
    stopped: false,
    updatedAt: stamp,
  };
}

/** A new name. Blank is not a name, so a blank one keeps the old. */
export function rename<R extends Run>(run: R, name: string, stamp: string): R {
  const next = name.trim();
  if (!next || next === run.name) return run;
  return { ...run, name: next, updatedAt: stamp };
}

/** A timer set to a new duration — only while it is not running, and held at
 *  the top of it. */
export function setDuration(
  timer: Timer,
  duration: Millis,
  stamp: string,
): Timer {
  if (timer.startedAt !== null || duration <= 0) return timer;
  if (duration === timer.duration && timer.banked === 0) return timer;
  return { ...timer, duration, banked: 0, updatedAt: stamp };
}

/** Removed, as a tombstone: the id and the stamp, so a sync knows it went. */
export function remove<R extends Run>(run: R, stamp: string): R {
  return {
    ...run,
    startedAt: null,
    banked: 0,
    stopped: true,
    deleted: true,
    updatedAt: stamp,
  };
}

function isTimer(run: Run): run is Timer {
  return typeof (run as Partial<Timer>).duration === "number";
}

// ── The dial ────────────────────────────────────────────────────────────────

/**
 * Which one of a kind the dial shows, for a focus the settings hold (see
 * `Focus` in `useAppSettings.ts`): the one asked for while it is still out,
 * none for a fresh one waiting to be started, and otherwise the newest that is
 * out — so putting the one on the dial away brings the next one up rather than
 * an empty dial while others run.
 */
export function focusedOf<R extends Run>(
  records: Record<string, R>,
  focus: string | null,
): R | null {
  if (focus === "new") return null;
  const asked = focus === null ? undefined : records[focus];
  if (asked && !asked.deleted && !asked.stopped) return asked;
  return activeOf(records)[0] ?? null;
}
