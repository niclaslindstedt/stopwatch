// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { mergeDocs } from "../src/app/merge.ts";
import { emptyDoc, type AppData } from "../src/app/types.ts";
import { remove } from "../src/app/watch.ts";
import { LATER, STAMP, stopwatch, timer } from "./fixtures/helpers.ts";

function doc(patch: Partial<AppData>): AppData {
  return { ...emptyDoc(), ...patch };
}

describe("mergeDocs", () => {
  it("keeps what only one side has, on both sides", () => {
    const phone = doc({ stopwatches: { a: stopwatch({ id: "a" }) } });
    const laptop = doc({ timers: { t: timer({ id: "t" }) } });
    const merged = mergeDocs(phone, laptop);
    expect(Object.keys(merged.stopwatches)).toEqual(["a"]);
    expect(Object.keys(merged.timers)).toEqual(["t"]);
  });

  it("takes the later edit of one both sides have", () => {
    const old = stopwatch({ name: "Old", updatedAt: STAMP });
    const renamed = stopwatch({ name: "Laps", updatedAt: LATER });
    expect(
      mergeDocs(
        doc({ stopwatches: { sw1: old } }),
        doc({ stopwatches: { sw1: renamed } }),
      ).stopwatches.sw1!.name,
    ).toBe("Laps");
    expect(
      mergeDocs(
        doc({ stopwatches: { sw1: renamed } }),
        doc({ stopwatches: { sw1: old } }),
      ).stopwatches.sw1!.name,
    ).toBe("Laps");
  });

  it("keeps a removed one removed, whichever side still had it", () => {
    const gone = remove(timer(), LATER);
    const merged = mergeDocs(
      doc({ timers: { t1: timer() } }),
      doc({ timers: { t1: gone } }),
    );
    expect(merged.timers.t1!.deleted).toBe(true);
  });

  it("is the same document whichever way round it is merged", () => {
    const a = doc({ stopwatches: { x: stopwatch({ id: "x" }) } });
    const b = doc({ timers: { y: timer({ id: "y" }) } });
    expect(mergeDocs(a, b)).toEqual(mergeDocs(b, a));
  });
});
