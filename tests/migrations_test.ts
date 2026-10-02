// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  NAME_MAX,
  normalizeDoc,
  parseDoc,
  serializeDoc,
} from "../src/app/migrations.ts";
import { DOC_VERSION, emptyDoc } from "../src/app/types.ts";
import { remove } from "../src/app/watch.ts";
import { LATER, T0, m, stopwatch, timer } from "./fixtures/helpers.ts";

describe("the document pipeline", () => {
  it("round-trips a document unchanged", () => {
    const doc = {
      ...emptyDoc(),
      stopwatches: {
        sw1: stopwatch({ startedAt: T0, banked: 1234 }),
        gone: remove(stopwatch({ id: "gone" }), LATER),
      },
      timers: { t1: timer({ stopped: true, banked: m(5) }) },
    };
    expect(parseDoc(serializeDoc(doc))).toEqual(doc);
  });

  it("writes the same bytes for the same watches, whatever order they came in", () => {
    const a = {
      ...emptyDoc(),
      stopwatches: { b: stopwatch({ id: "b" }), a: stopwatch({ id: "a" }) },
    };
    const b = {
      ...emptyDoc(),
      stopwatches: { a: stopwatch({ id: "a" }), b: stopwatch({ id: "b" }) },
    };
    expect(serializeDoc(a)).toBe(serializeDoc(b));
  });

  it("reads anything that is not a document as an empty one", () => {
    expect(normalizeDoc(null)).toEqual(emptyDoc());
    expect(normalizeDoc([1, 2])).toEqual(emptyDoc());
    expect(normalizeDoc({ version: 0 })).toEqual(emptyDoc());
  });

  it("throws on bytes that are not JSON, so the caller can keep them", () => {
    expect(() => parseDoc("{not json")).toThrow();
  });

  it("stamps the current version", () => {
    expect(normalizeDoc({}).version).toBe(DOC_VERSION);
  });
});

describe("a stored run", () => {
  it("takes its id from its key when it has none", () => {
    const doc = normalizeDoc({ stopwatches: { k: { name: "A", banked: 5 } } });
    expect(doc.stopwatches.k!.id).toBe("k");
  });

  it("reads absent or nonsense fields as their plain meaning", () => {
    const doc = normalizeDoc({
      stopwatches: {
        a: {
          id: "a",
          startedAt: "soon",
          banked: -4,
          stopped: "yes",
          createdAt: null,
        },
      },
    });
    expect(doc.stopwatches.a).toMatchObject({
      startedAt: null,
      banked: 0,
      stopped: false,
      createdAt: 0,
      name: "",
    });
  });

  it("cuts a name down to what a row can hold", () => {
    const doc = normalizeDoc({
      stopwatches: { a: { id: "a", name: "x".repeat(200) } },
    });
    expect(doc.stopwatches.a!.name).toHaveLength(NAME_MAX);
  });

  it("drops a timer set to nothing, but keeps a timer's tombstone", () => {
    const doc = normalizeDoc({
      timers: {
        zero: { id: "zero", duration: 0 },
        gone: { id: "gone", deleted: true },
        ok: { id: "ok", duration: 60_000 },
      },
    });
    expect(Object.keys(doc.timers).sort()).toEqual(["gone", "ok"]);
  });
});
