// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { SIGNATURE, type Reading } from "./clock.ts";
import { DIAL_BOX, Dial } from "./Dial.tsx";
import { useT } from "./i18n/index.ts";
import {
  BACKLIGHT_COLOR,
  CLOCK_SIZE,
  glowAlpha,
  glowGeometry,
  type Backlight,
  type ClockSize,
  type DialConfig,
} from "./look.ts";
import { useTilt } from "./useTilt.ts";

// The main screen's watch: the dial, the light behind it, and the switch.
//
// The whole watch is the button. Pressing it starts the stopwatch or the timer
// on the dial, pressing it again holds it, and pressing it once more carries
// on — the way a stopwatch's crown does, and there is no other start button on
// the screen. A timer that has run out is silenced by the same press.
//
// Behind the case is the backlight: the glow that says the watch is counting,
// in the colour, beat and strength the settings chose (`look.ts`), off while
// it is held, and beating fast in the flag colour while a timer rings.
//
// The dial carries the app's name and the Settings cog too, printed where a
// watch prints its maker and its date (see `Dial.tsx`), so the screen needs
// no bar over it for either: the cog's button is laid over the window here,
// above the switch.
//
// The light needs room. It is a disc inflated past the case by the spread,
// and on a phone held upright the case sits near the top of a screen that
// clips at its edge — so the face keeps that much clear above the dial, as a
// share of its own width, and the halo is whole rather than cut flat where
// the screen begins. Anywhere the dial is centred in a row with air round it
// — the desk, and the same phone laid on its side — the row keeps the room
// and the spacer goes (`wide:`, see `shape.ts`).

/** What the light behind the case is doing: on and beating, ringing, or
 *  off. */
export type GlowState = "running" | "done" | "off";

type Props = {
  reading: Reading;
  glow: GlowState;
  dial: DialConfig;
  size: ClockSize;
  backlight: Backlight;
  /** Whether the light on the metal follows the device: the dial the app is
   *  actually held in front of, rather than the still one in Settings. */
  reflect: boolean;
  /** A timer's share still to run, for the bezel. */
  progress?: number;
  /** What a press does, said: the button's name. */
  label: string;
  pressed: boolean;
  /** The accessible description of the dial. */
  desc: string;
  onToggle: () => void;
  /** The cog in the window above six. */
  onOpenSettings: () => void;
  /** Whether Settings is open — the desk's panel — which lights the cog. */
  settingsOpen?: boolean;
};

export function WatchFace({
  reading,
  glow,
  dial,
  size,
  backlight,
  reflect,
  progress,
  label,
  pressed,
  desc,
  onToggle,
  onOpenSettings,
  settingsOpen = false,
}: Props) {
  const t = useT();
  const sizing = CLOCK_SIZE[size];
  const halo = glowGeometry(backlight.spread);
  // The light the metal is drawn under: the room's, read off the device, or
  // the still one a drawn watch is lit by when that is switched off.
  const light = useTilt(reflect);
  const color =
    glow === "done" ? "var(--color-flag)" : BACKLIGHT_COLOR[backlight.color];

  return (
    <div className={`mx-auto w-full ${sizing.maxWidth} wide:max-w-none`}>
      {/* The light's room above the case: the same share of the dial's
          width the disc is inflated by, so however far the spread reaches
          the halo is not cut flat at the top of the screen. */}
      <div
        aria-hidden="true"
        className="wide:hidden"
        style={{ paddingTop: `${halo.inset}%` }}
      />
      <div className="relative w-full">
        {/* The light behind the case. Drawn first so everything else sits
            over it; its colour, beat, strength and reach are the settings'. */}
        <div
          aria-hidden="true"
          data-state={glow}
          data-beat={backlight.hz > 0 ? "on" : "off"}
          className="app-glow"
          style={
            {
              "--glow-color": color,
              "--glow-alpha": glowAlpha(
                glow === "done"
                  ? Math.max(60, backlight.intensity)
                  : backlight.intensity,
              ),
              "--glow-period": backlight.hz > 0 ? `${1 / backlight.hz}s` : "1s",
              "--glow-inset": `${halo.inset}%`,
              "--glow-hold": `${halo.hold}%`,
              "--glow-fade": `${halo.fade}%`,
              "--glow-blur": `${halo.blur}px`,
            } as Record<string, string | number>
          }
        />

        <Dial
          id="watch"
          dial={dial}
          reading={reading}
          progress={progress}
          light={light}
          live
          className="app-clock relative block h-auto w-full"
        >
          <title>{t("watch.clockLabel")}</title>
          <desc>{desc}</desc>
        </Dial>

        {/* The watch is the button. It sits over the drawing rather than
            around it so the cog below stays on top of it. */}
        <button
          type="button"
          aria-label={label}
          aria-pressed={pressed}
          title={label}
          onClick={onToggle}
          className="absolute inset-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />

        {/* The cog, over the window the dial paints it in. A real button in
            rem rather than a hit area scaled with the drawing, so it is a
            thumb's target on a small dial too. */}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t("nav.settings")}
          aria-expanded={settingsOpen}
          title={t("nav.settings")}
          style={{
            left: "50%",
            top: `${((DIAL_BOX / 2 + SIGNATURE.window) / DIAL_BOX) * 100}%`,
          }}
          className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>
    </div>
  );
}
