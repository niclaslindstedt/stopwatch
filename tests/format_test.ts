// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { afterEach, describe, expect, it } from "vitest";

import {
  formatClock,
  formatDuration,
  formatElapsed,
  formatRemaining,
} from "../src/app/format.ts";
import { hourCycleOf, setLocalePrefs } from "../src/app/locale.ts";

afterEach(() => setLocalePrefs({ hourCycle: hourCycleOf() }));

describe("formatElapsed", () => {
  it("reads minutes, seconds and tenths under an hour", () => {
    expect(formatElapsed(0)).toBe("00:00.0");
    expect(formatElapsed(83_450)).toBe("01:23.4");
  });

  it("puts the hours in front from an hour on, unpadded", () => {
    expect(formatElapsed(3_723_400)).toBe("1:02:03.4");
  });

  it("never shows a tenth that has not passed", () => {
    expect(formatElapsed(999)).toBe("00:00.9");
  });

  it("can leave the tenths off", () => {
    expect(formatElapsed(83_450, false)).toBe("01:23");
  });
});

describe("formatRemaining", () => {
  it("rounds up, the way a kitchen timer reads", () => {
    expect(formatRemaining(1)).toBe("0:01");
    expect(formatRemaining(0)).toBe("0:00");
    expect(formatRemaining(491_200)).toBe("8:12");
    expect(formatRemaining(3_899_000)).toBe("1:04:59");
  });
});

describe("formatDuration", () => {
  it("says how long a timer is set for", () => {
    expect(formatDuration(45 * 60_000)).toBe("45m");
    expect(formatDuration(2 * 3_600_000)).toBe("2h");
    expect(formatDuration(90 * 60_000)).toBe("1h 30m");
  });
});

describe("formatClock", () => {
  const at = new Date(2026, 2, 2, 18, 42).getTime();

  it("tells a moment on either clock", () => {
    expect(formatClock(at, "24")).toBe("18:42");
    expect(formatClock(at, "12")).toBe("6:42 PM");
  });

  it("follows the clock the app was set to", () => {
    setLocalePrefs({ hourCycle: "12" });
    expect(formatClock(new Date(2026, 2, 2, 0, 5).getTime())).toBe("12:05 AM");
  });
});
