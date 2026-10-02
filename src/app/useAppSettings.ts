// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback } from "react";

import { useLocalStorageState } from "@niclaslindstedt/oss-framework/hooks";

import type { Auto, HourCycle } from "./locale.ts";
import {
  CLOCK_SIZE,
  DEFAULT_BACKLIGHT,
  DEFAULT_DIAL_PRESET,
  DIAL_FACE,
  DIAL_FONT,
  DIAL_HANDS,
  DIAL_MARKERS,
  DIAL_MOVEMENT,
  DIAL_PLACEMENTS,
  DIAL_PRESET,
  DIAL_RING,
  DIAL_SCALE,
  clampBacklight,
  type Backlight,
  type ClockSize,
  type DialConfig,
  type DialPreset,
} from "./look.ts";
import { TIMER_HOURS, TIMER_MINUTES } from "./watch.ts";
import { WATCH_KINDS, type WatchKind } from "./types.ts";

// The app's own (non-document) settings: which of the two themes is active,
// what the dial looks like, which stopwatch and which timer it is showing,
// what a new timer is set to, and the developer knobs. Per device on purpose —
// the watch you have on the dial is not a fact about your stopwatches, so it
// does not sync — and persisted to localStorage so a reload keeps your
// choices.

/** The theme choice. Deliberately three values and no more — one light, one
 *  dark, and "follow the device". */
export type ThemeChoice = "light" | "dark" | "system";

/** Which watch the main screen's dial shows, per kind: one by id, `"new"` for
 *  a fresh one waiting to be started, or null for "whichever is newest" —
 *  what a first run and a watch put away fall back to. */
export type Focus = string | "new" | null;

export type AppSettings = {
  theme: ThemeChoice;
  /** The clock a moment is told on — "7:26 PM" or "19:26" — where a timer
   *  says when it will ring. "auto" is the device's locale's. */
  hourClock: Auto<HourCycle>;
  /** Which dial is drawn: one of the presets, or the custom one below, piece
   *  by piece. Both are kept, so going back to a preset and then to "Custom"
   *  again finds the custom dial as it was left. See `look.ts`. */
  clockPreset: DialPreset | "custom";
  clock: DialConfig;
  /** How much of the screen the dial takes. Per device rather than part of
   *  a preset: a size suits a screen, not a dial. */
  clockSize: ClockSize;
  /** The light behind the dial while it runs: its colour, its beat and how
   *  bright. Per device, like the size — a light suits a room. */
  backlight: Backlight;
  /** Whether the light on the dial's metal follows the device: tilt the
   *  phone and the reflection slides across the markers and hands, the way
   *  it does on a watch. Off until it is asked for, because on iOS the
   *  sensor needs the user's permission and the tap that turns this on is
   *  what asks for it (`useTilt.ts`). */
  reflect: boolean;
  /** Which of the main screen's two tabs is showing. */
  mode: WatchKind;
  /** Which stopwatch and which timer the dial shows (see `Focus`). Per
   *  device: the phone and the laptop can each be looking at their own. */
  focusStopwatch: Focus;
  focusTimer: Focus;
  /** What a new timer is set to: the last hours and minutes set, so the
   *  pasta is one press away the next evening too. */
  timerHours: number;
  timerMinutes: number;
  /** What a timer does when it runs out, besides the light and the word on
   *  the screen: a chime, and a buzz where the device has one. */
  alarmSound: boolean;
  alarmVibrate: boolean;
  /** Surface the developer affordances in Settings. */
  devMode: boolean;
  /** Mirror console output into the in-app log buffer. */
  captureLogs: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  hourClock: "auto",
  clockPreset: DEFAULT_DIAL_PRESET,
  clock: DIAL_PRESET[DEFAULT_DIAL_PRESET],
  clockSize: "large",
  backlight: DEFAULT_BACKLIGHT,
  reflect: false,
  mode: "stopwatch",
  focusStopwatch: null,
  focusTimer: null,
  timerHours: 0,
  timerMinutes: 5,
  alarmSound: true,
  alarmVibrate: true,
  devMode: false,
  captureLogs: false,
};

const STORAGE_KEY = "stopwatch:settings";

/** One of a table's keys, or the fallback: what every stored choice is
 *  clamped to, so a value from an older build (or a hand-edited one) can
 *  never pick a dial that does not exist. */
function oneOf<K extends string>(
  table: Record<K, unknown>,
  value: unknown,
  fallback: K,
): K {
  return typeof value === "string" && value in table ? (value as K) : fallback;
}

/** A custom dial, field by field, against the default preset. */
function parseDial(value: unknown): DialConfig {
  const base = DIAL_PRESET[DEFAULT_DIAL_PRESET];
  const raw = (
    typeof value === "object" && value !== null ? value : {}
  ) as Partial<Record<keyof DialConfig, unknown>>;
  const scale = Math.round(Number(raw.scale));
  return {
    face: oneOf(DIAL_FACE, raw.face, base.face),
    font: oneOf(DIAL_FONT, raw.font, base.font),
    markers: oneOf(DIAL_MARKERS, raw.markers, base.markers),
    scale: (scale in DIAL_SCALE ? scale : base.scale) as DialConfig["scale"],
    placement: DIAL_PLACEMENTS.includes(
      raw.placement as DialConfig["placement"],
    )
      ? (raw.placement as DialConfig["placement"])
      : base.placement,
    ring: oneOf(DIAL_RING, raw.ring ?? "groove", base.ring),
    movement: oneOf(DIAL_MOVEMENT, raw.movement, base.movement),
    hands: oneOf(DIAL_HANDS, raw.hands ?? "bar", base.hands),
  };
}

function parseFocus(value: unknown): Focus {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function clampWhole(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Stored bytes → settings, every field clamped. Exported for the tests;
 *  the app reads it through `useAppSettings`. */
export function parseSettings(raw: string): AppSettings {
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return DEFAULT_SETTINGS;
  }
  const merged = { ...DEFAULT_SETTINGS, ...(parsed as object) } as AppSettings;
  let timerHours = clampWhole(
    merged.timerHours,
    TIMER_HOURS.min,
    TIMER_HOURS.max,
    DEFAULT_SETTINGS.timerHours,
  );
  let timerMinutes = clampWhole(
    merged.timerMinutes,
    TIMER_MINUTES.min,
    TIMER_MINUTES.max,
    DEFAULT_SETTINGS.timerMinutes,
  );
  // A timer set to nothing is not a timer: back to the default rather than a
  // dial that cannot be started.
  if (timerHours === 0 && timerMinutes === 0) {
    timerHours = DEFAULT_SETTINGS.timerHours;
    timerMinutes = DEFAULT_SETTINGS.timerMinutes;
  }
  return {
    theme:
      merged.theme === "light" || merged.theme === "dark"
        ? merged.theme
        : "system",
    hourClock:
      merged.hourClock === "12" || merged.hourClock === "24"
        ? merged.hourClock
        : "auto",
    clockPreset:
      merged.clockPreset === "custom"
        ? "custom"
        : oneOf(DIAL_PRESET, merged.clockPreset, DEFAULT_DIAL_PRESET),
    clock: parseDial(merged.clock),
    clockSize: oneOf(CLOCK_SIZE, merged.clockSize, DEFAULT_SETTINGS.clockSize),
    backlight: clampBacklight(merged.backlight),
    reflect: merged.reflect === true,
    mode: WATCH_KINDS.includes(merged.mode) ? merged.mode : "stopwatch",
    focusStopwatch: parseFocus(merged.focusStopwatch),
    focusTimer: parseFocus(merged.focusTimer),
    timerHours,
    timerMinutes,
    alarmSound: merged.alarmSound !== false,
    alarmVibrate: merged.alarmVibrate !== false,
    devMode: merged.devMode === true,
    captureLogs: merged.captureLogs === true,
  };
}

export function useAppSettings() {
  const [settings, setSettings] = useLocalStorageState<AppSettings>(
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    { parse: parseSettings },
  );

  const update = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
      setSettings((prev) => ({ ...prev, [key]: value })),
    [setSettings],
  );

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [setSettings]);

  return { settings, update, reset, setSettings };
}
