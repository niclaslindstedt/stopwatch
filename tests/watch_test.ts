// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// What a stopwatch and a timer read, and the edits the screens make to them —
// every one a pure function of a run and a moment, pinned here to real ones.
import { describe, expect, it } from "vitest";

import {
  activeOf,
  durationOf,
  elapsed,
  endsAt,
  focusedOf,
  isDone,
  listOf,
  newStopwatch,
  newTimer,
  nextName,
  partsOf,
  pause,
  remaining,
  remove,
  rename,
  reset,
  restart,
  setDuration,
  start,
  stop,
  stopwatchState,
  timerLeft,
  timerState,
  toggle,
} from "../src/app/watch.ts";
import {
  LATER,
  STAMP,
  T0,
  h,
  m,
  s,
  stopwatch,
  timer,
} from "./fixtures/helpers.ts";

describe("elapsed", () => {
  it("is the bank while held, and the bank plus the stretch while running", () => {
    expect(elapsed(stopwatch({ banked: s(12) }), T0 + h(1))).toBe(s(12));
    expect(
      elapsed(stopwatch({ banked: s(12), startedAt: T0 }), T0 + s(30)),
    ).toBe(s(42));
  });

  it("counts a stretch from another device's future clock as nothing", () => {
    expect(elapsed(stopwatch({ startedAt: T0 + s(5) }), T0)).toBe(0);
  });
});

describe("a stopwatch", () => {
  it("starts, holds, carries on and adds the stretches up", () => {
    let sw = newStopwatch("a", "Run", T0, STAMP);
    expect(stopwatchState(sw)).toBe("running");
    sw = pause(sw, T0 + s(90), LATER);
    expect(stopwatchState(sw)).toBe("paused");
    expect(elapsed(sw, T0 + h(5))).toBe(s(90));
    sw = start(sw, T0 + m(10), LATER);
    expect(elapsed(sw, T0 + m(10) + s(30))).toBe(s(120));
  });

  it("toggles between going and held", () => {
    const sw = stopwatch();
    const going = toggle(sw, T0, LATER);
    expect(going.startedAt).toBe(T0);
    const held = toggle(going, T0 + s(3), LATER);
    expect(held.startedAt).toBeNull();
    expect(held.banked).toBe(s(3));
  });

  it("can be made held at zero, which reads as ready", () => {
    expect(stopwatchState(newStopwatch("a", "A", T0, STAMP, false))).toBe(
      "idle",
    );
  });

  it("resets to zero and holds", () => {
    const sw = reset(stopwatch({ banked: s(40), startedAt: T0 }), LATER);
    expect(sw).toMatchObject({ banked: 0, startedAt: null, updatedAt: LATER });
    expect(stopwatchState(sw)).toBe("idle");
  });

  it("is put away held where it was, and started again from zero", () => {
    const put = stop(stopwatch({ startedAt: T0 }), T0 + s(61), LATER);
    expect(put).toMatchObject({
      stopped: true,
      startedAt: null,
      banked: s(61),
    });
    expect(stopwatchState(put)).toBe("stopped");
    const again = restart(put, T0 + h(1), LATER);
    expect(again).toMatchObject({
      stopped: false,
      banked: 0,
      startedAt: T0 + h(1),
    });
  });

  it("carries on from where it was put away when started instead", () => {
    const put = stop(stopwatch({ startedAt: T0 }), T0 + s(61), LATER);
    const on = start(put, T0 + h(1), LATER);
    expect(on.stopped).toBe(false);
    expect(elapsed(on, T0 + h(1) + s(1))).toBe(s(62));
  });

  it("leaves an edit that changes nothing as the same object", () => {
    const going = stopwatch({ startedAt: T0 });
    expect(start(going, T0 + s(1), LATER)).toBe(going);
    const held = stopwatch();
    expect(pause(held, T0, LATER)).toBe(held);
    expect(reset(held, LATER)).toBe(held);
  });
});

describe("a timer", () => {
  it("counts down from its duration and is done at nothing", () => {
    const t = newTimer("t", "Pasta", m(11), T0, STAMP);
    expect(remaining(t, T0 + m(3))).toBe(m(8));
    expect(timerState(t, T0 + m(3))).toBe("running");
    expect(endsAt(t)).toBe(T0 + m(11));
    expect(isDone(t, T0 + m(11) - 1)).toBe(false);
    expect(isDone(t, T0 + m(11))).toBe(true);
    expect(timerState(t, T0 + m(12))).toBe("done");
    expect(remaining(t, T0 + h(1))).toBe(0);
  });

  it("rings at the end of what is left once paused and carried on", () => {
    let t = newTimer("t", "Tea", m(4), T0, STAMP);
    t = pause(t, T0 + m(1), LATER);
    expect(endsAt(t)).toBeNull();
    t = start(t, T0 + m(10), LATER);
    expect(endsAt(t)).toBe(T0 + m(13));
  });

  it("banks no more than its duration when held after running out", () => {
    const t = pause(newTimer("t", "Tea", m(4), T0, STAMP), T0 + h(1), LATER);
    expect(t.banked).toBe(m(4));
    expect(timerState(t, T0 + h(2))).toBe("done");
  });

  it("starts again from the top once it has run out", () => {
    const spent = timer({ banked: m(5) });
    const on = start(spent, T0 + h(1), LATER);
    expect(on.banked).toBe(0);
    expect(remaining(on, T0 + h(1) + m(1))).toBe(m(4));
  });

  it("is silenced by being put away, full", () => {
    const t = stop(newTimer("t", "Tea", m(4), T0, STAMP), T0 + m(9), LATER);
    expect(t).toMatchObject({ stopped: true, banked: m(4), startedAt: null });
    expect(timerState(t, T0 + m(9))).toBe("stopped");
  });

  it("draws the share still to run on the bezel", () => {
    const t = newTimer("t", "Oven", m(40), T0, STAMP);
    expect(timerLeft(t, T0)).toBe(1);
    expect(timerLeft(t, T0 + m(10))).toBe(0.75);
    expect(timerLeft(t, T0 + h(1))).toBe(0);
  });

  it("is set to a new duration only while it is held", () => {
    expect(setDuration(timer(), m(7), LATER).duration).toBe(m(7));
    const going = timer({ startedAt: T0 });
    expect(setDuration(going, m(7), LATER)).toBe(going);
    expect(setDuration(timer(), 0, LATER).duration).toBe(m(5));
  });
});

describe("durations", () => {
  it("are set in hours and minutes, each clamped", () => {
    expect(durationOf(1, 30)).toBe(m(90));
    expect(durationOf(0, 75)).toBe(m(59));
    expect(durationOf(150, 0)).toBe(h(99));
    expect(durationOf(-1, Number.NaN)).toBe(0);
  });

  it("read back into hours and minutes", () => {
    expect(partsOf(m(90))).toEqual({ hours: 1, minutes: 30 });
    expect(partsOf(m(5))).toEqual({ hours: 0, minutes: 5 });
  });
});

describe("names", () => {
  it("number a new one with the lowest number free", () => {
    const records = {
      a: stopwatch({ id: "a", name: "Stopwatch 1" }),
      b: stopwatch({ id: "b", name: "Stopwatch 3" }),
    };
    expect(nextName(records, "Stopwatch")).toBe("Stopwatch 2");
    expect(nextName({}, "Timer")).toBe("Timer 1");
  });

  it("does not count a removed one as taken", () => {
    const records = { a: remove(stopwatch({ id: "a" }), LATER) };
    expect(nextName(records, "Stopwatch")).toBe("Stopwatch 1");
  });

  it("are trimmed, and a blank one keeps the old", () => {
    expect(rename(stopwatch(), "  Laps  ", LATER).name).toBe("Laps");
    const sw = stopwatch();
    expect(rename(sw, "   ", LATER)).toBe(sw);
  });
});

describe("the lists", () => {
  const records = {
    old: stopwatch({ id: "old", createdAt: T0 }),
    mid: stopwatch({ id: "mid", createdAt: T0 + m(1), stopped: true }),
    new: stopwatch({ id: "new", createdAt: T0 + m(2) }),
    gone: remove(stopwatch({ id: "gone", createdAt: T0 + m(3) }), LATER),
  };

  it("are newest first, and never show a removed one", () => {
    expect(listOf(records).map((r) => r.id)).toEqual(["new", "mid", "old"]);
  });

  it("put the ones put away on their page only", () => {
    expect(activeOf(records).map((r) => r.id)).toEqual(["new", "old"]);
  });
});

describe("focusedOf", () => {
  const records = {
    a: stopwatch({ id: "a", createdAt: T0 }),
    b: stopwatch({ id: "b", createdAt: T0 + m(1) }),
    c: stopwatch({ id: "c", createdAt: T0 + m(2), stopped: true }),
  };

  it("shows the one asked for while it is out", () => {
    expect(focusedOf(records, "a")?.id).toBe("a");
  });

  it("falls back to the newest out, for none or one put away", () => {
    expect(focusedOf(records, null)?.id).toBe("b");
    expect(focusedOf(records, "c")?.id).toBe("b");
    expect(focusedOf(records, "missing")?.id).toBe("b");
  });

  it("shows a fresh one for new, and when nothing is out", () => {
    expect(focusedOf(records, "new")).toBeNull();
    expect(focusedOf({}, null)).toBeNull();
  });
});
