// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// How the app writes a time: a stopwatch's reading, a timer's time left, how
// long a timer was set for, and the moment on the wall clock a timer will go
// off at. Pure — every function takes the number it prints.

import { currentHourCycle, type HourCycle } from "./locale.ts";
import type { Millis } from "./types.ts";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "12:34.5" / "1:02:03.4" — a stopwatch's reading, to the tenth. Under an
 * hour the hour is left off, the way a stopwatch's own display leaves it off;
 * from an hour on it is unpadded, because a leading zero in a figure that big
 * reads as part of it. Rounded down: a stopwatch never shows a tenth that has
 * not passed.
 */
export function formatElapsed(ms: Millis, tenths = true): string {
  const total = Math.floor(Math.max(0, ms) / 100);
  const t = total % 10;
  const s = Math.floor(total / 10);
  const h = Math.floor(s / 3600);
  const body =
    h > 0
      ? `${h}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
      : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  return tenths ? `${body}.${t}` : body;
}

/**
 * "8:12" / "1:04:59" — a timer's time left, to the second. Rounded *up*: a
 * timer reads 0:01 for the whole of its last second and 0:00 only once it has
 * gone off, which is how every kitchen timer reads.
 */
export function formatRemaining(ms: Millis): string {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  const h = Math.floor(s / 3600);
  return h > 0
    ? `${h}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
    : `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/** "1h 30m" / "45m" / "2h" — how long a timer was set for. */
export function formatDuration(ms: Millis): string {
  const minutes = Math.round(Math.max(0, ms) / 60_000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${pad(m)}m`;
}

/** The space inside "7:26 PM": a no-break space, so a time never breaks
 *  across a line. */
const NBSP = " ";

/**
 * "18:42" / "6:42 PM" — a moment on the wall clock, the way the reader's clock
 * shows it (`locale.ts` says which; the device's locale unless Settings
 * chose). What a timer prints for when it will go off.
 */
export function formatClock(
  at: Millis,
  cycle: HourCycle = currentHourCycle(),
): string {
  const date = new Date(at);
  const h = date.getHours();
  const m = pad(date.getMinutes());
  if (cycle === "24") return `${pad(h)}:${m}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${m}${NBSP}${h < 12 ? "AM" : "PM"}`;
}
