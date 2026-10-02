// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { DEFAULT_BACKLIGHT, DIAL_PRESET } from "../src/app/look.ts";
import { DEFAULT_SETTINGS, parseSettings } from "../src/app/useAppSettings.ts";

// The settings store's parser: what comes back from localStorage is clamped
// field by field, so a value from an older build, or a hand-edited one, can
// never pick a dial that does not exist.

describe("parseSettings", () => {
  it("falls back to the defaults for bytes that are not settings", () => {
    expect(parseSettings("null")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("[1]")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("{}")).toEqual(DEFAULT_SETTINGS);
  });

  it("boots on the default dial, large", () => {
    expect(DEFAULT_SETTINGS.clockPreset).toBe("uptown");
    expect(DEFAULT_SETTINGS.clock).toEqual(DIAL_PRESET.uptown);
    expect(DEFAULT_SETTINGS.clockSize).toBe("large");
  });

  it("keeps a preset choice and a custom dial", () => {
    const s = parseSettings(
      JSON.stringify({
        clockPreset: "abyss",
        clock: { ...DIAL_PRESET.harvest, movement: "sweep" },
        clockSize: "small",
      }),
    );
    expect(s.clockPreset).toBe("abyss");
    expect(s.clock).toEqual({ ...DIAL_PRESET.harvest, movement: "sweep" });
    expect(s.clockSize).toBe("small");
  });

  it("keeps Custom as a choice of its own", () => {
    expect(parseSettings('{"clockPreset":"custom"}').clockPreset).toBe(
      "custom",
    );
  });

  it("clamps an unknown preset, size or dial field to the default", () => {
    const s = parseSettings(
      JSON.stringify({
        clockPreset: "nautilus",
        clockSize: "huge",
        clock: {
          face: "purple",
          font: "comic",
          markers: "diamonds",
          scale: 12,
          placement: "under",
          ring: "halo",
          movement: "steam",
          hands: "feathers",
        },
      }),
    );
    expect(s.clockPreset).toBe(DEFAULT_SETTINGS.clockPreset);
    expect(s.clockSize).toBe(DEFAULT_SETTINGS.clockSize);
    expect(s.clock).toEqual(DEFAULT_SETTINGS.clock);
  });

  it("gives a dial stored before the ring was a choice the groove", () => {
    const s = parseSettings(
      JSON.stringify({
        clockPreset: "custom",
        clock: { ...DIAL_PRESET.abyss, ring: undefined },
      }),
    );
    expect(s.clock.ring).toBe("groove");
    expect(parseSettings('{"clock":{"ring":"chapter"}}').clock.ring).toBe(
      "chapter",
    );
  });

  it("gives a dial stored before the hands were a choice the bar", () => {
    const s = parseSettings(
      JSON.stringify({
        clockPreset: "custom",
        clock: { ...DIAL_PRESET.abyss, hands: undefined },
      }),
    );
    expect(s.clock.hands).toBe("bar");
    expect(parseSettings('{"clock":{"hands":"tapered"}}').clock.hands).toBe(
      "tapered",
    );
  });

  it("keeps the light on the metal still until it is asked for", () => {
    expect(DEFAULT_SETTINGS.reflect).toBe(false);
    // A device that stored its settings before there was anything to move
    // the light with, and one that stored an answer that is not an answer.
    expect(parseSettings("{}").reflect).toBe(false);
    expect(parseSettings('{"reflect":"yes"}').reflect).toBe(false);
    expect(parseSettings('{"reflect":true}').reflect).toBe(true);
  });

  it("clamps each dial field on its own, not all of them together", () => {
    const s = parseSettings(
      JSON.stringify({
        clock: { face: "blue", scale: "3", movement: "warp" },
      }),
    );
    expect(s.clock.face).toBe("blue");
    expect(s.clock.scale).toBe(3);
    expect(s.clock.movement).toBe(DEFAULT_SETTINGS.clock.movement);
  });

  it("drops the settings an older build kept for its dial", () => {
    const s = parseSettings(
      JSON.stringify({ clockLook: "bold", clockFont: "roman", theme: "dark" }),
    );
    expect(s).not.toHaveProperty("clockLook");
    expect(s).not.toHaveProperty("clockFont");
    expect(s.theme).toBe("dark");
    expect(s.clockPreset).toBe(DEFAULT_SETTINGS.clockPreset);
  });
});

describe("parseSettings – the backlight", () => {
  it("boots on the theme's accent, a slow beat, and a mid light", () => {
    expect(DEFAULT_SETTINGS.backlight).toEqual(DEFAULT_BACKLIGHT);
    expect(parseSettings("{}").backlight).toEqual(DEFAULT_BACKLIGHT);
  });

  it("keeps a choice within range", () => {
    const s = parseSettings(
      JSON.stringify({
        backlight: { color: "violet", hz: 1, intensity: 35, spread: 20 },
      }),
    );
    expect(s.backlight).toEqual({
      color: "violet",
      hz: 1,
      intensity: 35,
      spread: 20,
    });
  });

  it("clamps a beat, a brightness and a spread that are out of range", () => {
    const s = parseSettings(
      JSON.stringify({
        backlight: { color: "amber", hz: 9, intensity: -4, spread: 300 },
      }),
    );
    expect(s.backlight).toEqual({
      color: "amber",
      hz: 2,
      intensity: 0,
      spread: 100,
    });
  });

  it("falls back field by field on a colour or a number that is not one", () => {
    const s = parseSettings(
      JSON.stringify({
        backlight: {
          color: "plaid",
          hz: "fast",
          intensity: "bright",
          spread: "wide",
        },
      }),
    );
    expect(s.backlight).toEqual(DEFAULT_BACKLIGHT);
    expect(parseSettings('{"backlight":7}').backlight).toEqual(
      DEFAULT_BACKLIGHT,
    );
  });

  it("gives a device that stored a backlight before the spread the default", () => {
    const s = parseSettings(
      JSON.stringify({ backlight: { color: "teal", hz: 0, intensity: 80 } }),
    );
    expect(s.backlight.spread).toBe(DEFAULT_BACKLIGHT.spread);
  });
});

describe("the clock", () => {
  it("follows the device until a choice is made", () => {
    expect(DEFAULT_SETTINGS.hourClock).toBe("auto");
    expect(parseSettings("{}").hourClock).toBe("auto");
  });

  it("keeps a choice, and clamps one that is not", () => {
    expect(parseSettings(JSON.stringify({ hourClock: "12" })).hourClock).toBe(
      "12",
    );
    expect(parseSettings(JSON.stringify({ hourClock: 12 })).hourClock).toBe(
      "auto",
    );
  });
});

describe("the watch on the dial", () => {
  it("boots on the stopwatch tab, with the newest of each on the dial", () => {
    const s = parseSettings("{}");
    expect(s.mode).toBe("stopwatch");
    expect(s.focusStopwatch).toBeNull();
    expect(s.focusTimer).toBeNull();
  });

  it("keeps a tab, an id and a fresh one, and drops what is neither", () => {
    const s = parseSettings(
      JSON.stringify({
        mode: "timer",
        focusStopwatch: "abc",
        focusTimer: "new",
      }),
    );
    expect(s).toMatchObject({
      mode: "timer",
      focusStopwatch: "abc",
      focusTimer: "new",
    });
    const bad = parseSettings(JSON.stringify({ mode: "alarm", focusTimer: 4 }));
    expect(bad.mode).toBe("stopwatch");
    expect(bad.focusTimer).toBeNull();
  });
});

describe("what a new timer is set to", () => {
  it("boots on five minutes", () => {
    expect(DEFAULT_SETTINGS.timerHours).toBe(0);
    expect(DEFAULT_SETTINGS.timerMinutes).toBe(5);
  });

  it("clamps the hours and the minutes into range", () => {
    const s = parseSettings(
      JSON.stringify({ timerHours: 120, timerMinutes: 75 }),
    );
    expect(s.timerHours).toBe(99);
    expect(s.timerMinutes).toBe(59);
  });

  it("never keeps a timer set to nothing", () => {
    const s = parseSettings(JSON.stringify({ timerHours: 0, timerMinutes: 0 }));
    expect(s.timerMinutes).toBe(DEFAULT_SETTINGS.timerMinutes);
  });

  it("chimes and buzzes unless told not to", () => {
    expect(parseSettings("{}")).toMatchObject({
      alarmSound: true,
      alarmVibrate: true,
    });
    expect(
      parseSettings(JSON.stringify({ alarmSound: false, alarmVibrate: false })),
    ).toMatchObject({ alarmSound: false, alarmVibrate: false });
  });
});
