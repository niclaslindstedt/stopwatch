// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { hourCycleOf, resolveHourCycle } from "../src/app/locale.ts";

// The clock follows the reader's locale unless Settings chose. Walked with
// explicit tags, so the answers do not depend on the machine the tests run
// on.

describe("hourCycleOf", () => {
  it("tells the time on the twelve-hour clock in the US", () => {
    expect(hourCycleOf("en-US")).toBe("12");
    expect(hourCycleOf("en-CA")).toBe("12");
  });

  it("keeps the 24-hour clock where it is the custom", () => {
    expect(hourCycleOf("sv-SE")).toBe("24");
    expect(hourCycleOf("en-GB")).toBe("24");
    expect(hourCycleOf("de-DE")).toBe("24");
    expect(hourCycleOf("nb-NO")).toBe("24");
  });

  it("falls back to the 24-hour clock for a tag that is not one", () => {
    expect(hourCycleOf("not a tag!")).toBe("24");
  });
});

describe("resolveHourCycle", () => {
  it("follows the locale on auto, and the setting otherwise", () => {
    expect(resolveHourCycle("auto", "en-US")).toBe("12");
    expect(resolveHourCycle("auto", "sv-SE")).toBe("24");
    expect(resolveHourCycle("24", "en-US")).toBe("24");
    expect(resolveHourCycle("12", "sv-SE")).toBe("12");
  });
});
