// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The demo document is what the App Store screenshots are taken of, so these
// hold it to three things: the app's own document format, moments that are
// all relative to the one it opens at, and each frame's premise — with every
// reading taken through the app's own code (`watch.ts`), never stated by the
// data.
import { describe, expect, it } from "vitest";

import { buildDemoData } from "../src/app/dev/demoData.ts";
import { parseDoc, serializeDoc } from "../src/app/migrations.ts";
import type { Timer } from "../src/app/types.ts";
import {
  activeOf,
  elapsed,
  focusedOf,
  isDone,
  listOf,
  stopwatchState,
  timerState,
} from "../src/app/watch.ts";

/** The moment the store frames are shot. */
const FRAME = new Date("2026-09-24T17:41:00");

describe("the demo document", () => {
  it("is deterministic for a moment", () => {
    expect(serializeDoc(buildDemoData(FRAME))).toBe(
      serializeDoc(buildDemoData(new Date(FRAME))),
    );
  });

  it("survives the document pipeline unchanged", () => {
    const doc = buildDemoData(FRAME);
    expect(parseDoc(serializeDoc(doc))).toEqual(doc);
  });

  it("reads the same at any moment it is opened, at any hour of any day", () => {
    const at = FRAME.getTime();
    const readings = (d: Date) => {
      const doc = buildDemoData(d);
      const now = d.getTime();
      return [
        ...listOf(doc.stopwatches).map((r) => [r.id, elapsed(r, now)]),
        ...listOf(doc.timers).map((r) => [r.id, elapsed(r, now)]),
      ];
    };
    const base = readings(FRAME);
    for (let day = 0; day < 366; day += 7) {
      for (const hour of [0.02, 6, 12, 23.98]) {
        const d = new Date(at + day * 86_400_000 + hour * 3_600_000);
        expect(readings(d)).toEqual(base);
      }
    }
  });

  it("opens with a stopwatch running on the dial and another one held", () => {
    const doc = buildDemoData(FRAME);
    const on = focusedOf(doc.stopwatches, null);
    expect(on && stopwatchState(on)).toBe("running");
    const states = activeOf(doc.stopwatches).map(stopwatchState);
    expect(states).toContain("paused");
    expect(listOf(doc.stopwatches).some((r) => r.stopped)).toBe(true);
  });

  it("opens with timers counting down, none of them ringing, and some put away", () => {
    const doc = buildDemoData(FRAME);
    const now = FRAME.getTime();
    const active = activeOf<Timer>(doc.timers);
    expect(active.length).toBeGreaterThanOrEqual(2);
    for (const t of active) {
      expect(isDone(t, now)).toBe(false);
      expect(timerState(t, now)).toBe("running");
    }
    expect(listOf(doc.timers).filter((t) => t.stopped).length).toBeGreaterThan(
      0,
    );
  });
});
