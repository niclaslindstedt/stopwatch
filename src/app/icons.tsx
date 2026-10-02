// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// App-owned glyphs — the marks the framework's set has no vocabulary for
// because they are this app's domain: a stopwatch, an hourglass, the buttons
// a stopwatch has. Everything else (cog, cloud, chevrons, plus, trash) comes from
// `@niclaslindstedt/oss-framework/components`, so the two sets only ever
// differ where the domain does.
//
// Traced on the same Lucide 24×24 grid at the same 2px stroke weight as the
// framework glyphs, and stroked with `currentColor`, so a mark from either
// set sits on the same line without retuning.

import type { CSSProperties, ReactNode } from "react";

export type IconProps = { className?: string };

function Glyph({
  className,
  style,
  children,
}: IconProps & { style?: CSSProperties; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * The app mark — a thick ring with its middle cut out, and the crown a
 * stopwatch is started with standing on top of it: the same shape as the
 * favicon and the install icon, drawn in `currentColor` on nothing.
 *
 * The difference from `public/icons/icon.svg` is the point of it: that file
 * paints the mark green on the dark install surface, because an icon's job is
 * to be found on a home screen next to its sibling apps. This one drops the
 * background and swaps the inks for `currentColor`, so inside the app the mark
 * is whatever the element around it is. Geometry is mirrored by hand into
 * `public/icons/icon.svg`, `scripts/generate-icons.mjs` and the dial's
 * printing in `Dial.tsx`.
 */
export function AppMarkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="54" r="27" stroke="currentColor" strokeWidth="20" />
      <rect x="42" y="5" width="16" height="13" rx="3" fill="currentColor" />
    </svg>
  );
}

/** The main screen — the watch itself: a stopwatch, its crown on top. */
export function StopwatchIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="14" r="8" />
      <path d="M12 14l3-3" />
      <path d="M10 2h4" />
      <path d="M12 2v4" />
    </Glyph>
  );
}

/** Timers — an hourglass, the oldest thing that counts down. */
export function HourglassIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22" />
      <path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2" />
    </Glyph>
  );
}

/** The watch tab — a dial with its two registers, the face the app is. */
export function DialIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="12" r="2" />
      <path d="M12 12V5" />
    </Glyph>
  );
}

/** Start — a play triangle. */
export function PlayIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.87l12-7.5a1 1 0 0 0 0-1.74l-12-7.5A1 1 0 0 0 7 4.5Z" />
    </Glyph>
  );
}

/** Hold — two bars. */
export function PauseIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </Glyph>
  );
}

/** Put away — a square, the way a player stops. */
export function StopIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </Glyph>
  );
}

/** Back to zero — an arrow turning back on itself. */
export function ResetIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </Glyph>
  );
}

/** One less — a minus, the partner of the framework's plus. */
export function MinusIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M5 12h14" />
    </Glyph>
  );
}

/** A timer ringing — a bell. */
export function BellIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Glyph>
  );
}

/**
 * More — the horizontal ellipsis a menu hangs off.
 *
 * Not domain vocabulary, and it would live in the framework's set if the
 * framework had one; it does not, and a menu button drawn out of `MenuIcon`'s
 * hamburger would say "navigation" where this says "and what else can I do
 * with this". Three filled dots rather than three stroked circles, so it
 * holds its weight beside the stroked glyphs at 20px.
 */
export function MoreIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}
