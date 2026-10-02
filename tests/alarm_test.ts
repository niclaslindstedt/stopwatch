// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { RING_WINDOW, justRung } from "../src/app/useAlarm.ts";
import { T0, m, timer } from "./fixtures/helpers.ts";

describe("justRung", () => {
  const going = timer({ startedAt: T0, duration: m(5) });

  it("is nothing while a timer still has time left", () => {
    expect(justRung([going], T0 + m(4), new Set())).toEqual([]);
  });

  it("is a timer the moment it runs out, once", () => {
    const rung = justRung([going], T0 + m(5), new Set());
    expect(rung.map((r) => r.timer.id)).toEqual(["t1"]);
    expect(
      justRung([going], T0 + m(5) + 1000, new Set([rung[0]!.key])),
    ).toEqual([]);
  });

  it("is not news long after it ran out — a page reloaded the next day is quiet", () => {
    expect(justRung([going], T0 + m(5) + RING_WINDOW + 1, new Set())).toEqual(
      [],
    );
  });

  it("rings again for a timer started again", () => {
    const first = justRung([going], T0 + m(5), new Set());
    const again = timer({ startedAt: T0 + m(20), duration: m(5) });
    const second = justRung([again], T0 + m(25), new Set([first[0]!.key]));
    expect(second).toHaveLength(1);
  });

  it("is never one put away or held", () => {
    expect(
      justRung([{ ...going, stopped: true }], T0 + m(5), new Set()),
    ).toEqual([]);
    expect(justRung([timer({ banked: m(5) })], T0 + m(5), new Set())).toEqual(
      [],
    );
  });
});
