// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Reconciling two copies of the document — the phone's and the cloud's.
//
// Stopwatches and timers are keyed by id, and each carries the timestamp of
// its last edit, so two copies merge record by record with the later edit
// winning. Nobody is asked which side to keep: a stopwatch started on the
// phone and a timer renamed on the laptop both survive.
//
// A removed one is a tombstone rather than an absence (`remove` in
// `watch.ts`), so it stays removed: an absence from one copy would read as
// "not synced yet" and the other copy would bring it back.
//
// Pure and total: same inputs, same output, no clock, no storage.

import { DOC_VERSION, type AppData } from "./types.ts";

function newer<T extends { updatedAt: string }>(a: T, b: T): T {
  return b.updatedAt > a.updatedAt ? b : a;
}

function mergeRecords<T extends { updatedAt: string }>(
  local: Record<string, T>,
  remote: Record<string, T>,
): Record<string, T> {
  const out: Record<string, T> = { ...local };
  for (const [key, value] of Object.entries(remote)) {
    const mine = out[key];
    out[key] = mine ? newer(mine, value) : value;
  }
  return out;
}

/** Merge two documents record by record, last edit winning. */
export function mergeDocs(local: AppData, remote: AppData): AppData {
  return {
    version: DOC_VERSION,
    stopwatches: mergeRecords(local.stopwatches, remote.stopwatches),
    timers: mergeRecords(local.timers, remote.timers),
  };
}
