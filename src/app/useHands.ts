// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useRef, useState, type MutableRefObject } from "react";

import {
  chronoTurns,
  glidePlan,
  glideTurns,
  readingAt,
  type GlidePlan,
  type Reading,
  type Seconds,
  type Turns,
} from "./clock.ts";
import { nowExact } from "./useNow.ts";

// The hands of a live dial, driven frame by frame.
//
// Everything else on the screen redraws at the rate a screen asks for. The
// hands are not that. A mechanical calibre beats eight times a second and a
// glide wheel does not stop at all, and neither rate survives being chased by
// a CSS transition off a `setInterval`: the interval drifts, a render lands
// late, and the transition it was meant to start in time for starts late too
// — which the eye reads as the seconds hand hesitating and then hurrying. So
// the hands come off the render loop entirely. This is a
// `requestAnimationFrame` loop that reads the clock, works out the reading
// (`readingAt`), where each hand belongs for it (`chronoTurns`), and writes
// the three rotations straight onto the elements.
//
// Two things follow. The dial keeps rendering the rotations it had at mount,
// so React never writes a transform again and never fights the loop. And a
// hand that has not moved is not written, so a quartz dial touches the DOM
// once a second and a held one not at all, however often the loop runs.
//
// The reading itself comes in through a ref, so a new one — the stopwatch
// paused, reset, or another one put on the dial — reaches the loop on its
// next frame without restarting it. When the new reading is a jump rather
// than a tick, the hands glide to it (`glidePlan`): a reset flies back, a
// woken tab winds forward, and while they travel the shadow under them comes
// off, because an SVG filter over a moving group is re-rastered every frame.
//
// A dial that is not `live` — the previews in Settings — runs none of this
// and simply draws the reading it was handed.

export type Hands = {
  /** The rotations to render. Frozen at mount for a live dial; the loop has
   *  the hands from the first frame. */
  turns: Turns;
  /** True while the hands glide to a reading that jumped. */
  winding: boolean;
  /** Put these on the three hand groups. */
  hour: HandRef;
  minute: HandRef;
  second: HandRef;
};

type HandRef = MutableRefObject<SVGGElement | null>;

export function useHands(
  reading: Reading,
  live: boolean,
  beats: number | null,
): Hands {
  const hour = useRef<SVGGElement | null>(null);
  const minute = useRef<SVGGElement | null>(null);
  const second = useRef<SVGGElement | null>(null);

  const dirOf = (r: Reading): 1 | -1 => (r.rate < 0 ? -1 : 1);

  /** What the dial paints, and what the loop last wrote. They start as the
   *  same thing — the reading at mount — and then part company, the first
   *  never changing again so that React has nothing to write. */
  const painted = useRef<Turns>(
    chronoTurns(readingAt(reading, nowExact()), beats, dirOf(reading)),
  );
  const written = useRef<Turns>({ ...painted.current });

  /** The reading the loop works from. A ref, so a new one is picked up on the
   *  next frame by the loop that is already running. */
  const current = useRef(reading);
  current.current = reading;

  const [winding, setWinding] = useState(false);

  useEffect(() => {
    if (!live) return;
    const hands = { hour, minute, second };
    /** The value the hands last kept time at, outside a glide. */
    let kept: Seconds | null = null;
    let glide: { plan: GlidePlan; started: number } | null = null;
    let frame = 0;

    const step = () => {
      frame = requestAnimationFrame(step);
      const r = current.current;
      const value = readingAt(r, nowExact());
      const target = chronoTurns(value, beats, dirOf(r));

      if (glide) {
        const elapsed = performance.now() - glide.started;
        if (elapsed < glide.plan.ms) {
          put(hands, written, glideTurns(glide.plan, target, elapsed));
          return;
        }
        glide = null;
        setWinding(false);
      } else if (kept !== null && !reducedMotion()) {
        const plan = glidePlan(kept, value, { ...written.current });
        if (plan) {
          glide = { plan, started: performance.now() };
          setWinding(true);
          put(hands, written, glideTurns(plan, target, 0));
          kept = value;
          return;
        }
      }

      kept = value;
      put(hands, written, target);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [live, beats]);

  return {
    turns: live
      ? painted.current
      : chronoTurns(readingAt(reading, 0), beats, dirOf(reading)),
    winding,
    hour,
    minute,
    second,
  };
}

/** Write the hands, skipping any that are where they already were. */
function put(
  hands: { hour: HandRef; minute: HandRef; second: HandRef },
  written: MutableRefObject<Turns>,
  to: Turns,
) {
  for (const hand of ["hour", "minute", "second"] as const) {
    const at = onDial(to[hand]);
    if (at === written.current[hand]) continue;
    written.current[hand] = at;
    const el = hands[hand].current;
    if (el) el.style.transform = `rotate(${at}deg)`;
  }
}

/** A rotation as it goes to the DOM: one turn, three decimals. A browser
 *  keeps six significant figures of a CSS number, and rounding to a
 *  thousandth of a degree is also what makes "has it moved?" a question with
 *  an answer, rather than one the last digit of a float decides. */
function onDial(degrees: number): number {
  const turn = ((degrees % 360) + 360) % 360;
  return Math.round(turn * 1000) / 1000;
}

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
