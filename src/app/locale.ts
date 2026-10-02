// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The one convention a stopwatch is read by that is the reader's rather than
// the app's: which clock a moment is told on. An American reads "7:26 PM" and
// a Swede reads "19:26", and neither should have to go looking for a setting
// to be shown their own — it matters here where a timer says when it will
// ring.
//
// So it follows the device's locale unless Settings says otherwise
// (`useAppSettings.ts`'s `hourClock`, "auto" by default). The reading here is
// pure over a locale tag, so the tests can walk "en-US" and "sv-SE" on a
// machine set to either; `App.tsx` resolves it once per render and hands it to
// `setLocalePrefs` below, which is what the formatters in `format.ts` read.

/** Which clock a time of day is told on. */
export type HourCycle = "12" | "24";

/** A setting that may follow the device instead of naming a value. */
export type Auto<T> = T | "auto";

/**
 * The clock a locale tells the time on: "12" where a time reads "7:26 AM",
 * "24" where it reads "07:26". Read off `Intl` rather than a table of
 * countries, so it is the browser's own answer for the tag; `undefined` is
 * the device's locale.
 */
export function hourCycleOf(locale?: string): HourCycle {
  try {
    const cycle = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
    }).resolvedOptions().hourCycle;
    return cycle === "h11" || cycle === "h12" ? "12" : "24";
  } catch {
    return "24";
  }
}

/** A clock setting, resolved against a locale. */
export function resolveHourCycle(
  setting: Auto<HourCycle>,
  locale?: string,
): HourCycle {
  return setting === "auto" ? hourCycleOf(locale) : setting;
}

// ── What the app is showing now ─────────────────────────────────────────────
// The resolved value, for the presentation code that is called from
// everywhere and would otherwise need it threaded through every screen. Only
// `App.tsx` writes it, before it renders a screen; nothing in `watch.ts` reads
// it.

let current: { hourCycle: HourCycle } = { hourCycle: hourCycleOf() };

/** Set the clock the screens are shown in. */
export function setLocalePrefs(next: { hourCycle: HourCycle }): void {
  current = next;
}

/** The clock the screens tell the time on. */
export function currentHourCycle(): HourCycle {
  return current.hourCycle;
}
