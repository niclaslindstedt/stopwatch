// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback, useMemo } from "react";

import { useT } from "./i18n/index.ts";
import { makeId } from "./ids.ts";
import type { Stopwatch, Timer, WatchKind } from "./types.ts";
import type { AppSettings, Focus } from "./useAppSettings.ts";
import type { DocStore } from "./useDocStore.ts";
import { nowExact } from "./useNow.ts";
import {
  activeOf,
  durationOf,
  focusedOf,
  isDone,
  listOf,
  newStopwatch,
  newTimer,
  nextName,
  remove,
  rename,
  reset,
  restart,
  setDuration,
  stop,
  toggle,
} from "./watch.ts";

// The edits the screens make to a stopwatch or a timer, in one place: the
// main screen's dial and controls, the running list under it and the two
// pages all press the same buttons, so they go through the same door. Each is
// one of `watch.ts`'s pure edits, handed the moment of the press (read once,
// here, through `nowExact`) and its timestamp, and saved.
//
// What the dial shows is here too, because it is the one decision two screens
// share: the one the settings focus on while it is out, else the newest that
// is (`focusedOf`). A fresh stopwatch or timer is not a record until it is
// started — the dial draws it at zero, or at the time it is set for, and the
// press that starts it is the press that makes it.

export type Watches = {
  stopwatches: Stopwatch[];
  timers: Timer[];
  activeStopwatches: Stopwatch[];
  activeTimers: Timer[];
  /** The one on the dial, per kind, or null for a fresh one. */
  focusedStopwatch: Stopwatch | null;
  focusedTimer: Timer | null;
  /** What a fresh timer is set to. */
  draftDuration: number;
  /** Put one on the dial — or a fresh one, with `"new"`. */
  focus: (kind: WatchKind, focus: Focus) => void;
  /** The dial pressed: start a fresh one, hold the one going, carry on with
   *  one held, or silence a timer that has run out (which puts it away). */
  press: (kind: WatchKind) => void;
  /** The same, for one in a list rather than on the dial. */
  toggleOne: (kind: WatchKind, id: string) => void;
  resetOne: (kind: WatchKind, id: string) => void;
  stopOne: (kind: WatchKind, id: string) => void;
  restartOne: (kind: WatchKind, id: string) => void;
  renameOne: (kind: WatchKind, id: string, name: string) => void;
  removeOne: (kind: WatchKind, id: string) => void;
  /** Set what a fresh timer — or the idle one on the dial — counts down
   *  from. */
  setTimer: (hours: number, minutes: number) => void;
};

export function useWatches(
  store: DocStore,
  settings: AppSettings,
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void,
): Watches {
  const t = useT();
  const { data, saveStopwatch, saveTimer } = store;
  const draftDuration = durationOf(settings.timerHours, settings.timerMinutes);

  const lists = useMemo(
    () => ({
      stopwatches: listOf(data.stopwatches),
      timers: listOf(data.timers),
      activeStopwatches: activeOf(data.stopwatches),
      activeTimers: activeOf(data.timers),
      focusedStopwatch: focusedOf(data.stopwatches, settings.focusStopwatch),
      focusedTimer: focusedOf(data.timers, settings.focusTimer),
    }),
    [data, settings.focusStopwatch, settings.focusTimer],
  );

  const focus = useCallback(
    (kind: WatchKind, next: Focus) =>
      update(kind === "stopwatch" ? "focusStopwatch" : "focusTimer", next),
    [update],
  );

  /** One edit to one record: read it, change it, save it. */
  const edit = useCallback(
    (
      kind: WatchKind,
      id: string,
      change: <R extends Stopwatch | Timer>(
        r: R,
        now: number,
        stamp: string,
      ) => R,
    ) => {
      const now = nowExact();
      const stamp = new Date(now).toISOString();
      if (kind === "stopwatch") {
        const sw = data.stopwatches[id];
        if (sw) saveStopwatch(change(sw, now, stamp));
      } else {
        const timer = data.timers[id];
        if (timer) saveTimer(change(timer, now, stamp));
      }
    },
    [data, saveStopwatch, saveTimer],
  );

  const press = useCallback(
    (kind: WatchKind) => {
      const now = nowExact();
      const stamp = new Date(now).toISOString();
      if (kind === "stopwatch") {
        const sw = lists.focusedStopwatch;
        if (sw) {
          saveStopwatch(toggle(sw, now, stamp));
          return;
        }
        const id = makeId();
        const name = nextName(data.stopwatches, t("watch.stopwatchWord"));
        saveStopwatch(newStopwatch(id, name, now, stamp));
        focus("stopwatch", id);
        return;
      }
      const timer = lists.focusedTimer;
      if (timer) {
        saveTimer(
          isDone(timer, now)
            ? stop(timer, now, stamp)
            : toggle(timer, now, stamp),
        );
        return;
      }
      const id = makeId();
      const name = nextName(data.timers, t("watch.timerWord"));
      saveTimer(newTimer(id, name, draftDuration, now, stamp));
      focus("timer", id);
    },
    [lists, data, draftDuration, focus, saveStopwatch, saveTimer, t],
  );

  const toggleOne = useCallback(
    (kind: WatchKind, id: string) =>
      edit(kind, id, (r, now, stamp) =>
        "duration" in r && isDone(r as Timer, now)
          ? stop(r, now, stamp)
          : toggle(r, now, stamp),
      ),
    [edit],
  );

  const resetOne = useCallback(
    (kind: WatchKind, id: string) =>
      edit(kind, id, (r, _now, stamp) => reset(r, stamp)),
    [edit],
  );

  const stopOne = useCallback(
    (kind: WatchKind, id: string) => edit(kind, id, stop),
    [edit],
  );

  const restartOne = useCallback(
    (kind: WatchKind, id: string) => {
      edit(kind, id, restart);
      focus(kind, id);
    },
    [edit, focus],
  );

  const renameOne = useCallback(
    (kind: WatchKind, id: string, name: string) =>
      edit(kind, id, (r, _now, stamp) => rename(r, name, stamp)),
    [edit],
  );

  const removeOne = useCallback(
    (kind: WatchKind, id: string) =>
      edit(kind, id, (r, _now, stamp) => remove(r, stamp)),
    [edit],
  );

  const setTimer = useCallback(
    (hours: number, minutes: number) => {
      const duration = durationOf(hours, minutes);
      if (duration <= 0) return;
      update("timerHours", Math.floor(duration / 3_600_000));
      update("timerMinutes", Math.floor(duration / 60_000) % 60);
      const timer = lists.focusedTimer;
      if (timer && timer.startedAt === null && timer.banked === 0) {
        saveTimer(
          setDuration(timer, duration, new Date(nowExact()).toISOString()),
        );
      }
    },
    [lists.focusedTimer, saveTimer, update],
  );

  return {
    ...lists,
    draftDuration,
    focus,
    press,
    toggleOne,
    resetOne,
    stopOne,
    restartOne,
    renameOne,
    removeOne,
    setTimer,
  };
}
