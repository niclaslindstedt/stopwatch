// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useRef } from "react";

import { useT } from "./i18n/index.ts";
import type { Millis, Timer } from "./types.ts";
import { useNow } from "./useNow.ts";
import { endsAt, isDone } from "./watch.ts";

// A timer going off.
//
// Whichever screen is open, once a second the timers still out are read, and
// one that has just run out is announced: a notice, a chime made on the spot
// by the browser's own audio (no file, no fetch — nothing leaves the device to
// make a sound), and a buzz where the device has one. The dial's own light
// turns the flag colour on its own; this is the part that reaches somebody who
// is not looking.
//
// Once per timer per run: the moment it ran out is the key, so a timer started
// again rings again, and a page reloaded long after one ran out does not
// suddenly chime about it — only one that ran out within the last minute is
// news.

/** How recently a timer must have run out for its going off to be news. */
export const RING_WINDOW: Millis = 60_000;

/** The timers that have just gone off, at `now`, that `rung` has not rung
 *  for yet — and the keys to remember them by. Pure, for the tests. */
export function justRung(
  timers: Timer[],
  now: Millis,
  rung: ReadonlySet<string>,
): { timer: Timer; key: string }[] {
  const out: { timer: Timer; key: string }[] = [];
  for (const timer of timers) {
    if (timer.stopped || timer.deleted || !isDone(timer, now)) continue;
    const end = endsAt(timer);
    if (end === null || now - end > RING_WINDOW) continue;
    const key = `${timer.id}@${end}`;
    if (!rung.has(key)) out.push({ timer, key });
  }
  return out;
}

export function useAlarm(
  timers: Timer[],
  options: { sound: boolean; vibrate: boolean },
  onNotice: (message: string) => void,
): void {
  const t = useT();
  const now = useNow(1000);
  const rung = useRef(new Set<string>());

  useEffect(() => {
    const fresh = justRung(timers, now, rung.current);
    if (fresh.length === 0) return;
    for (const { timer, key } of fresh) {
      rung.current.add(key);
      onNotice(t("watch.doneNotice", { name: timer.name }));
    }
    if (options.sound) chime();
    if (options.vibrate) buzz();
  }, [timers, now, options.sound, options.vibrate, onNotice, t]);
}

/** Three short notes, made by the browser. Quietly nothing where there is no
 *  audio, or where it has not been allowed yet. */
function chime(): void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const start = ctx.currentTime + 0.02;
    [0, 0.28, 0.56].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 2 ? 1320 : 880;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + offset);
      osc.stop(start + offset + 0.26);
    });
    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    // No sound to be had: the light and the notice still say it.
  }
}

/** A buzz, where the device has one to give. */
function buzz(): void {
  try {
    navigator.vibrate?.([220, 120, 220, 120, 420]);
  } catch {
    // Not every browser lets a page buzz; the rest still say it.
  }
}
