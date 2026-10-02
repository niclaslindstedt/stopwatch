// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// guidelines:allow-large-file: split when next touched; known deviation by owner decision
// The geometry of the stopwatch's dial: a chronograph face, read the way a
// stopwatch is read. The big hand from the centre is the seconds, once round
// a minute against the scale on the rim; the register at three counts the
// minutes, once round an hour; the register at nine counts the hours, once
// round twelve. Pure arithmetic over seconds and angles so the face can be
// tested without an SVG renderer.
//
// What the dial shows is a *reading* — a stopwatch's elapsed time counting up,
// or a timer's time left counting down — rather than the time of day, so the
// hands here are a function of a number of seconds and a direction, never of
// the clock on the wall.

import {
  DIAL_FONT,
  DIAL_MARKERS,
  DIAL_RING,
  DIAL_SCALE,
  ROMAN_WIDTH,
  type DialConfig,
  type DialPlacement,
  type Marker,
} from "./look.ts";
import type { Millis } from "./types.ts";

/** A length of time on the dial, in seconds. */
export type Seconds = number;

/** One turn of a twelve-part circle — what the arcs on the bezel are drawn
 *  against: a fraction of a turn is that fraction of this. */
export const DIAL_SECONDS: Seconds = 12 * 3600;

/** The face's radius in the 240-unit box `WatchFace` draws in, and the
 *  bezel round it. Here rather than in the component because what has to fit
 *  inside them is arithmetic, and arithmetic is testable. */
export const DIAL_R = 117;
export const BEZEL_R = 118.5;
export const BEZEL_WIDTH = 3;

/** The twelve marks of the dial, in the order the dial reads them, starting
 *  at the top: the five-second marks a stopwatch's scale is numbered at. The
 *  index is the position, as on a clock — 3 is a quarter of the way round. */
export const DIAL_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/** What a numeral at each position says: the seconds, 60 at the top, 5 one
 *  step on. A stopwatch's scale counts to sixty where a clock's counts to
 *  twelve, and sixty is printed where zero would be because that is the
 *  second the minute ends on. */
export function secondsLabel(position: number): number {
  const p = ((position % 12) + 12) % 12;
  return p === 0 ? 60 : p * 5;
}

/** The same in Roman numerals, indexed by position — XV at the quarter. The
 *  widest of them (XXXV, LV) are four capitals like the clock's VIII, which is
 *  what `ROMAN_WIDTH` in `look.ts` is measured against. */
export const ROMAN_HOURS = [
  "LX",
  "V",
  "X",
  "XV",
  "XX",
  "XXV",
  "XXX",
  "XXXV",
  "XL",
  "XLV",
  "L",
  "LV",
] as const;

// ── The rim, the dial's ring, and where the markers sit ──

/**
 * A thin margin of face just inside the bezel, which nothing is drawn in. The
 * time report this dial was drawn from kept the day on a track here; a
 * stopwatch has no day to draw, but the watch keeps the proportions it was
 * measured off, so the margin stays and the dial is laid out inside it.
 */
export const EDGE_RESERVE = 4.4;

/** The radius the watch itself is laid out inside. Every number below is
 *  measured from this rather than from `DIAL_R`. */
export const FACE_R = DIAL_R - EDGE_RESERVE;

/** The dial's own ring, which the markers are placed against and the hands
 *  are read to: a faint groove, or the printed chapter ring. The day used to
 *  be drawn on it and is not any more (see `EDGE_RESERVE`), so what it carries
 *  now is the minutes — or, on a groove, nothing but the track itself. */
export const RING_BAND = 12;
export const RING_EDGE = 2.5;
/**
 * The rim, between the ring's outer edge and the edge of the face: where the
 * minute track's ticks are — on the styles that print one.
 *
 * On a dial that prints nothing there *and* keeps its markers inside the
 * ring, there is no rim at all: the ring comes right out to meet the edge. A
 * rim is room left for something, and a dial with nothing to put in it wore a
 * band of bare face between its ring and its day, which reads as a gap rather
 * than as a margin.
 *
 * Markers placed outside or over the ring are the exception, because then
 * they are the outermost thing on the watch and the rim is their margin off
 * the edge of the face — give it back and an hour marker ends up against the
 * case. So the rim a dial gets is the room whatever reaches furthest out
 * actually needs.
 */
const RIM = 5;
const RIM_BARE = 0;
/** The ticks' outer end. */
export const TRACK_R = FACE_R - 1;
/** Air between the ring and a marker beside it. */
const MARKER_GAP = 4;
/** The groove is painted a little wider than it measures, so no seam
 *  of bare face shows where it meets the ring under it. Inward only — the
 *  groove is the faintest thing on the dial and laps harmlessly onto the ring,
 *  where outward it would lap onto the case. The bands themselves are painted
 *  to the track exactly, since they are opaque and would eat the ring.
 *  `Dial.tsx` paints with this number. */
export const RING_BLEED = 0.5;
/** The dial's printing, as radii from the centre: the name under twelve,
 *  the movement's word under the name, and the window above six — the
 *  Settings cog, where a date would be. Fixed rather than laid out per
 *  dial, because a signature sits where it sits on a watch and the markers
 *  are what move; what has to hold is that none of it reaches the ring on
 *  any dial, and `tests/clock_test.ts` walks every one to say so. */
export const SIGNATURE = {
  /** The lockup's centre line, and the letters' height. */
  name: 54,
  nameSize: 9,
  /** The movement's word, in small capitals under the name. */
  line: 43,
  lineSize: 4.2,
  /** The window's centre, and its width and height. */
  window: 52,
  windowWidth: 21,
  windowHeight: 14,
} as const;

/**
 * The advance of each capital in the name's face (Jost 500), in ems, as a
 * browser lays it — measured, rather than guessed from an average, so the
 * lockup below comes out the width the letters actually are. A character
 * not listed is taken at a typical capital's width; the text is pinned to
 * the width reckoned here (`textLength`), so a guess costs a hair of letter
 * spacing and never the centring.
 */
const NAME_ADVANCE: Readonly<Record<string, number>> = {
  A: 0.69,
  B: 0.6,
  C: 0.69,
  D: 0.7,
  E: 0.57,
  F: 0.52,
  G: 0.79,
  H: 0.74,
  I: 0.28,
  J: 0.28,
  K: 0.62,
  L: 0.48,
  M: 0.84,
  N: 0.78,
  O: 0.8,
  P: 0.58,
  Q: 0.82,
  R: 0.6,
  S: 0.58,
  T: 0.5,
  U: 0.66,
  V: 0.69,
  W: 1.02,
  X: 0.61,
  Y: 0.6,
  Z: 0.58,
  " ": 0.3,
  "-": 0.22,
  ".": 0.31,
  "'": 0.29,
  "&": 0.71,
};
const NAME_ADVANCE_OTHER = 0.62;
/** The name's letter spacing, in ems: wide, the way a maker's name is. */
export const NAME_TRACKING = 0.2;
/** The app's mark beside the name: its drawn width, stroke included, and the
 *  air between the two. `Dial.tsx` draws the mark on a 100-unit grid at
 *  `NAME_MARK_SCALE`, its ring 10 units in from the grid's edge. */
export const NAME_MARK = 6.4;
const NAME_MARK_GAP = 3;
export const NAME_MARK_SCALE = 0.08;
/**
 * The widest the mark and the name may stand together. Under twelve the
 * lockup has the hours at eleven and one either side of it, and wider than
 * this it reaches them on a dial with the largest numerals set inside the
 * ring (`tests/clock_test.ts` walks every dial); a longer name is set
 * smaller instead, on the same line.
 */
export const NAME_LOCKUP_MAX = 48;

/** Where the mark and the name stand under twelve, centred on the dial. */
export type NameLockup = {
  /** The name as printed: in capitals. */
  text: string;
  /** The letters' size, which a long name brings down from `nameSize`, and
   *  the mark's with them (a share of its own size, 1 at `nameSize`). */
  size: number;
  scale: number;
  /** The letter spacing, in the same units. */
  tracking: number;
  /** The mark's left edge and the text's start, from the centre line. */
  markX: number;
  textX: number;
  /** The text's advance, trailing spacing included — its `textLength`. */
  textLength: number;
  /** From the mark's left edge to the last letter's right edge. */
  width: number;
};

/**
 * The lockup of the app's mark and its name under twelve: centred as one
 * group, at `SIGNATURE.nameSize` when that fits in `NAME_LOCKUP_MAX` and
 * smaller when it does not. The name is whatever the build is called (the
 * listing's, in an app build), so it is laid out rather than placed. Pure.
 */
export function nameLockup(name: string): NameLockup {
  const text = name.toLocaleUpperCase();
  const chars = [...text];
  const glyphs = chars.reduce(
    (sum, ch) => sum + (NAME_ADVANCE[ch] ?? NAME_ADVANCE_OTHER),
    0,
  );
  // The ink runs to the last letter; the spacing after it is advance only.
  const inkEms = glyphs + NAME_TRACKING * Math.max(0, chars.length - 1);
  const natural = NAME_MARK + NAME_MARK_GAP + inkEms * SIGNATURE.nameSize;
  const scale = natural > NAME_LOCKUP_MAX ? NAME_LOCKUP_MAX / natural : 1;
  const size = SIGNATURE.nameSize * scale;
  const markW = NAME_MARK * scale;
  const gap = NAME_MARK_GAP * scale;
  const ink = inkEms * size;
  const width = markW + gap + ink;
  const markX = -width / 2;
  return {
    text,
    size,
    scale,
    tracking: NAME_TRACKING * size,
    markX,
    textX: markX + markW + gap,
    textLength: ink + NAME_TRACKING * size,
    width,
  };
}

/** How far the printing reaches from the centre: the top of the name, and
 *  the foot of the window. What a ring has to stay outside of. */
export const SIGNATURE_REACH = Math.max(
  SIGNATURE.name + SIGNATURE.nameSize / 2,
  SIGNATURE.window + SIGNATURE.windowHeight / 2,
);

/**
 * How far a marker may extend either side of its own radius, per placement.
 * A numeral that would reach further is set smaller.
 *
 * Inside and outside answer to the same number, from the two ends: inside,
 * the marker sits under the ring and has to stop short of the printing;
 * outside, it takes the rim and pushes the ring down onto the printing
 * instead. Either way what is left after the rim, the ring and the air
 * beside it has to hold twice the reach and still clear the app's name —
 * which is the arithmetic below, and the reason the margin taken
 * out of `FACE_R` sets the largest hours a step smaller rather than running
 * the ring over the printing. Over the ring a marker is centred on the band
 * itself and starts far enough in that only the bezel is in its way.
 * `SIGNATURE_CLEAR` is the air left over either way, a unit at each end, so
 * the two cases are the one number rather than two that nearly agree.
 */
const SIGNATURE_CLEAR = 2;
// Reckoned on the full rim, which is the tighter case: a style that gives its
// rim back moves its ring and its markers outward, away from the printing.

const PLACEMENT_REACH =
  (FACE_R -
    RIM -
    RING_EDGE -
    RING_BAND -
    MARKER_GAP -
    SIGNATURE_REACH -
    SIGNATURE_CLEAR) /
  2;

const MAX_REACH: Record<DialPlacement, number> = {
  outside: PLACEMENT_REACH,
  over: 20,
  inside: PLACEMENT_REACH,
};

/** An applied marker's length as a share of the numeral size it stands in
 *  for, and its width across the radius as a share of that length — before
 *  the style's own `width`, which is what tells a block from a baton. */
const MARKER_SHARE = 1;
const MARKER_WIDTH = 0.22;

/** How much of the run from a block's own inner end out to the ring the
 *  block actually takes. One would have it filling the whole run, which
 *  reaches further into the dial than an applied hour does on the watch this
 *  is drawn after. What it gives back comes off the *inner* end, because the
 *  outer end is the one that has to meet the ring. */
const BLOCK_LENGTH = 0.8;

/** How far a hand's tip goes past the mark it is read against, where there
 *  is one. A tip that stops exactly on a tick reads as short of it; a tip
 *  that crosses it reads as pointing at it. */
const HAND_PAST = 1;
/** The second hand takes half of that, because what it is read on is the
 *  ring's own ticks: a hair that ran along one would cover the mark it is
 *  pointing at instead of marking it. */
const SECOND_PAST = HAND_PAST / 2;

/** The hands' widths, the big hand's tail past the centre, and the caps over
 *  the axles. The seconds hand is a stopwatch's: long, and a touch heavier
 *  than a wrist watch's hair, because it is the hand the dial is read by. The
 *  registers' hands are the hour and minute hands of a small watch — steel,
 *  the hour's the broader of the two. */
export const HANDS = {
  hour: 2.4,
  minute: 1.8,
  second: 1.3,
  tail: 12,
  cap: 3.4,
  registerCap: 2,
} as const;

/**
 * How long the point at the end of a hand is: the run from the shoulder,
 * where the sides stop running straight, out to the flat the two bevels end
 * on. `width` is the hand's own width and `set` says what it is finished
 * like — `base` and `tip` as shares of that width, and `bevel` as the angle
 * the sides close at, off the hand's axis (see `DIAL_HANDS` in `look.ts`).
 *
 * The angle is the thing that is fixed, not the length: a hand is finished
 * at the bevel it is finished at, and the broader the hand the further back
 * the shoulder has to sit to close at it. So the hour hand carries a longer
 * point than the minute hand without either of them being told to, and a
 * hand drawn three times as fine does not grow a needle three times as long.
 *
 * Zero for a set with no point at all, and never more than the hand has left
 * to give: the point is capped at `length`, so nothing can put a shoulder
 * behind the axle however wide the hand or however shallow the bevel.
 */
export function handPoint(
  set: { base: number; tip: number; bevel: number },
  width: number,
  length: number,
): number {
  if (set.bevel <= 0) return 0;
  const drop = (width * (set.base - set.tip)) / 2;
  return Math.min(length, drop / Math.tan((set.bevel * Math.PI) / 180));
}

export type DialLayout = {
  /** The dial's ring: the band's centre line, its inner and outer edges, and
   *  the thin line's centre. The day is not drawn here any more — that is
   *  the bezel — but the markers are still placed
   *  against this ring and the hands are still read to it. */
  bandR: number;
  ringInner: number;
  ringOuter: number;
  edgeR: number;
  /** Where a marker or numeral is centred. */
  markerR: number;
  /** The numerals' font size, after the placement's clamp. */
  numeralSize: number;
  /** An applied marker's length along the radius, and its width across it. */
  markerLength: number;
  markerWidth: number;
  /** The lumed plot at the end of an hour that runs out to the ring: where
   *  its centre sits, how far it reaches along the radius and how wide it is
   *  across — a block of lume rather than a dot, which is why it has two
   *  numbers. Null on every other dial, which is most of them — an hour that
   *  stops short of the ring has nothing on the ring to finish it with. */
  pip: { r: number; length: number; width: number } | null;
  /** The big hand's tip from the centre: the seconds. */
  hands: { second: number };
  /** The two registers, sized to the room the markers leave them. */
  registers: Registers;
};

/**
 * Where everything sits for one dial: the ring's radius follows the markers'
 * placement, and the markers' size follows what that placement can fit.
 *
 * Inside, the ring is at the rim and the markers are measured in from it;
 * outside, the markers take the rim and the ring is measured in from them;
 * over, the ring is at the rim until a marker centred on it would reach the
 * minute track, and then comes in just far enough. Either way the widest thing the style draws — two digits, VIII, or a
 * baton's length — is what has to clear, halved into a `reach` either side
 * of the marker's own radius, and clamped to what the placement leaves room
 * for.
 *
 * The hands stop at whatever the dial gives them to be read against. On a
 * groove that is the ring itself: the minute hand on the band, the second
 * hand at its outer edge, the hour hand well short of both. On a printed
 * ring it is the print — the minute hand crosses the tips of the track under
 * the ring and stops there, and the second hand goes on to the ring itself
 * and stops the width of a print onto the near end of its ticks, where a
 * dark hair over a white one is the contrast that makes it readable. Onto
 * them and barely: a second hand running the length of the marks it is read
 * against would cover the very thing it is pointing at.
 *
 * A style that `reachesRing` is the exception, and only inside the ring,
 * where there is a gap to close: the block's outer end is taken out to the
 * ring's inner edge, so the hour runs into the edge of the face rather than
 * stopping short of it behind a stray tick. It does not fill the whole run
 * out from where a baton of the same size would have started — it gives a
 * fifth of it back at the inner end (`BLOCK_LENGTH`), because an applied
 * hour reaches nothing like that far into the dial. The ring is painted to
 * exactly the radius the block ends at on its inner side (`RING_BLEED`), so
 * the hour and the ring meet rather than the hour lapping onto it. What finishes it is a
 * lumed plot on the ring, centred on the ring's own ticks — the hours are the twelve places a chapter ring prints a
 * numeral rather than a tick, so the plot lands in room the minutes are not
 * using — standing on the same track as the ticks, a shade shorter than one
 * and more than twice as wide.
 */
/**
 * Where a dial's hours actually sit, which is not always where the setting
 * says.
 *
 * A printed ring is the outermost track on the watch by definition: its
 * minutes are the scale the hours are read against, and a scale is read from
 * the outside in. So the hours go *inside* it whatever the placement says.
 * Put them over it and every hour lands on a numeral — the twelve hours and
 * the twelve numerals are the same twelve positions — and put them outside it
 * and the watch reads inside out, with the hours further from the centre than
 * the minutes they are measured against.
 *
 * A groove is only a track, so it takes the hours wherever they were put. The
 * setting is kept rather than corrected either way, so a dial that goes to
 * the minute ring and back is the dial it was.
 */
export function placementOf(
  dial: Pick<DialConfig, "placement" | "ring">,
): DialPlacement {
  return DIAL_RING[dial.ring].printed ? "inside" : dial.placement;
}

export function dialLayout(
  dial: Pick<DialConfig, "placement" | "markers" | "font" | "scale" | "ring">,
): DialLayout {
  const placement = placementOf(dial);
  const style = DIAL_MARKERS[dial.markers];
  const font = DIAL_FONT[dial.font];
  const kinds = DIAL_HOURS.map((h) => style.at(h % 12));
  const roman = kinds.includes("roman");
  const numerals = roman || kinds.includes("arabic");
  // Half the widest thing on the dial, as a share of the size.
  const share = numerals
    ? font.widthFactor * (roman ? ROMAN_WIDTH : 1)
    : MARKER_SHARE / 2;
  const wanted = DIAL_SCALE[dial.scale] * font.scale;
  const size = Math.min(wanted, MAX_REACH[placement] / share);
  const reach = size * share;

  // The rim this dial asks for. Room for the marks where the style prints a
  // track on it; a margin off the edge of the face where the markers themselves
  // are out here, which is every placement but `inside`; and nothing at all
  // where the ring is the outermost thing on the watch — there is then
  // nothing to leave room for, and an empty band of face is a gap rather
  // than a margin.
  const rim = style.minuteTrack || placement !== "inside" ? RIM : RIM_BARE;
  const markerOuter = FACE_R - rim - 1;
  let ringOuter: number;
  let markerR: number;
  if (placement === "outside") {
    markerR = markerOuter - reach;
    ringOuter = markerR - reach - MARKER_GAP;
  } else if (placement === "over") {
    ringOuter = Math.min(
      FACE_R - rim,
      markerOuter - reach + RING_EDGE + RING_BAND / 2,
    );
    markerR = ringOuter - RING_EDGE - RING_BAND / 2;
  } else {
    ringOuter = FACE_R - rim;
    markerR = ringOuter - RING_EDGE - RING_BAND - MARKER_GAP - reach;
  }
  const edgeR = ringOuter - RING_EDGE / 2;
  const bandR = ringOuter - RING_EDGE - RING_BAND / 2;
  const ringInner = ringOuter - RING_EDGE - RING_BAND;

  const tracks = chapterTracks(ringInner);

  let markerLength = size * MARKER_SHARE;
  let pip: DialLayout["pip"] = null;
  if (style.reachesRing && placement === "inside") {
    const innerEnd = markerR - markerLength / 2;
    markerLength = (ringInner - innerEnd) * BLOCK_LENGTH;
    markerR = ringInner - markerLength / 2;
    pip = {
      r: (tracks.ring.inner + tracks.ring.outer) / 2,
      length: (tracks.ring.outer - tracks.ring.inner) * PLOT_LENGTH,
      width: MINUTE_INK * PLOT_WIDTH,
    };
  }

  const printed = DIAL_RING[dial.ring].printed;

  // How far in the dial's own furniture comes, which is what the registers
  // have to stay clear of: the ring (and the track printed under it), and,
  // where the hours sit inside the ring, the inner end of an hour. At the
  // diagonals a numeral is read upright, so half its height or half its width
  // is in the way, whichever is more; at three and nine it is the width.
  const ringFloor = printed ? tracks.face.inner : ringInner;
  const innerOf = (kind: Marker, across: boolean): number => {
    if (placement !== "inside") return ringFloor;
    if (kind === "arabic" || kind === "roman") {
      const half =
        size * font.widthFactor * (kind === "roman" ? ROMAN_WIDTH : 1);
      return markerR - (across ? half : Math.max(half, size * 0.5));
    }
    return markerR - markerLength / 2;
  };
  const diagonal = Math.min(
    ringFloor,
    ...[2, 4, 8, 10].map((p) => innerOf(style.at(p), false)),
  );
  const across = Math.min(
    ringFloor,
    innerOf(style.at(3), true),
    innerOf(style.at(9), true),
  );

  return {
    bandR,
    ringInner,
    ringOuter,
    edgeR,
    markerR,
    numeralSize: size,
    markerLength,
    markerWidth: size * MARKER_WIDTH * style.width,
    pip,
    hands: {
      second: printed ? tracks.ring.inner + SECOND_PAST : ringOuter,
    },
    registers: registers(diagonal, across, ringFloor),
  };
}

/**
 * The minute tracks a printed ring is read against, as radii from the centre,
 * for a ring whose inner edge is at `ringInner`.
 *
 * A chapter ring's own ticks stand on its *inner* edge and grow outward
 * across it, with the numerals in the room that leaves above them — which is
 * the way round a dial of this kind is printed, and the opposite of where a
 * rim track goes. Under the ring, on the face itself, the dial wears the
 * other half of the same track: a tick a minute of the ring's own length,
 * hanging just below the ring and growing inward, so the two read as one
 * minute track with the ring's edge running through it.
 *
 * Between one minute and the next the face's track carries two finer marks —
 * thirds of a minute, which is what a track this long is divided into on a
 * dial of this kind — reaching less than half as far in, so the minutes stay
 * the marks that are counted.
 *
 * The face's track has to fit in the air the markers are clamped to leave
 * (`MARKER_GAP`), because a tick that reached past it would run into the
 * marker at twelve on the largest hour size — so its length is the ring's,
 * clamped to what that air has room for. `tests/clock_test.ts` says so.
 * The one dial that crosses it does so on purpose: a style that `reachesRing`
 * takes its blocks out over the track, and the twelve ticks under them are
 * the twelve the hours stand on anyway.
 */
export type ChapterTracks = {
  /** Where each track begins and ends: `inner` nearer the centre. */
  ring: { inner: number; outer: number };
  face: { inner: number; outer: number };
  /** The finer marks that divide a minute: the same outer edge as the
   *  minutes, and not nearly as far in. */
  fine: { inner: number; outer: number };
};

/** Air between the ring's inner edge and the track hanging under it, and
 *  between that track's tips and the markers inside them. */
const FACE_TRACK_GAP = 0.4;
const FACE_TRACK_CLEAR = 0.2;
/** A minute's tick, on either side of the ring's edge: the one length the
 *  two halves of the track share, which is all the air the markers leave. */
const MINUTE_TICK = MARKER_GAP - FACE_TRACK_GAP - FACE_TRACK_CLEAR;
/** How much of that a third of a minute gets. */
const FINE_TICK_SHARE = 0.44;
/** How thick the ring's own minute ticks are printed. The plot at an hour is
 *  measured against this, so the two move together. */
export const MINUTE_INK = 0.7;
/** The plot an hour is finished with, against the minute tick it stands in
 *  the place of: a little shorter along the radius, and well over twice as
 *  thick across it. A minute is a line; an hour's lume is a block, and that
 *  difference is most of what makes the twelve hours findable on a ring of
 *  sixty marks. Measured off a photograph of the dial this one is drawn
 *  after, where the plot runs about seven-eighths of a tick's length at
 *  nearly two and a half times its width. */
const PLOT_LENGTH = 0.86;
const PLOT_WIDTH = 2.4;

export function chapterTracks(ringInner: number): ChapterTracks {
  const outer = ringInner - FACE_TRACK_GAP;
  return {
    ring: { inner: ringInner + 0.5, outer: ringInner + 0.5 + MINUTE_TICK },
    face: { inner: outer - MINUTE_TICK, outer },
    fine: { inner: outer - MINUTE_TICK * FINE_TICK_SHARE, outer },
  };
}

/** One mark of the track under a printed ring: a minute, or one of the two
 *  finer marks that divide it. */
export type FaceMark = { angle: number; minute: boolean };

/** Whether a minute is one of the twelve an hour stands at. */
const isHour = (minute: number) => minute % 5 === 0;

/**
 * The marks that track carries: a minute every six degrees, and the gap
 * after it in thirds. `angle` is clockwise from twelve, as `chapterMarks`
 * gives it.
 *
 * Except where an hour is in the way, which is the whole of the difference
 * between a track that is printed and a track that is read. An applied hour
 * is a block of steel standing across the track, and the third of a minute
 * beside it is under that block: on a real dial it is printed and hidden, so
 * what you see beside an hour is one mark rather than two. Here it is simply
 * not drawn — a mark half under a marker reads as a burr on the marker
 * rather than as a mark. Twelve takes both, because twelve is where every
 * style puts its widest hour, and what you see beside twelve is nothing.
 */
export function faceMarks(): FaceMark[] {
  const marks: FaceMark[] = [];
  for (let minute = 0; minute < 60; minute += 1) {
    marks.push({ angle: minute * 6, minute: true });
    const next = (minute + 1) % 60;
    const twelve = minute === 0 || next === 0;
    if (!twelve && !isHour(minute)) {
      marks.push({ angle: minute * 6 + 2, minute: false });
    }
    if (!twelve && !isHour(next)) {
      marks.push({ angle: minute * 6 + 4, minute: false });
    }
  }
  return marks;
}

/** One mark of a chapter ring: a minute tick, or a numeral every five. The
 *  numeral is turned to lie along the ring — and in the lower half turned
 *  the other way, so a 30 at six o'clock is not read upside down. */
export type ChapterMark =
  | { minute: number; angle: number; kind: "tick" }
  | {
      minute: number;
      angle: number;
      kind: "numeral";
      label: string;
      turn: number;
    };

/**
 * The sixty marks a printed minute ring carries: a numeral at every five
 * minutes, 05 round to 60 at the top, and a tick at each minute between.
 * `angle` is clockwise from twelve; `turn` is what the numeral is rotated
 * by to sit along the ring.
 */
export function chapterMarks(): ChapterMark[] {
  return Array.from({ length: 60 }, (_, i) => {
    const angle = i * 6;
    if (i % 5 !== 0) return { minute: i, angle, kind: "tick" as const };
    const minute = i === 0 ? 60 : i;
    const lower = angle > 90 && angle < 270;
    return {
      minute,
      angle,
      kind: "numeral" as const,
      label: String(minute).padStart(2, "0"),
      turn: lower ? (angle + 180) % 360 : angle,
    };
  });
}

/** The dial angle of a moment on a twelve-part turn, in degrees clockwise
 *  from twelve o'clock — what the bezel's arcs are drawn from. */
export function angleOf(at: Seconds): number {
  const turn = ((at % DIAL_SECONDS) + DIAL_SECONDS) % DIAL_SECONDS;
  return (turn / DIAL_SECONDS) * 360;
}

/** The point at `angle` degrees clockwise from twelve, `r` from the centre. */
export function polar(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * An SVG path for the ring segment between two moments, `r` from the
 * centre, as a stroke-able arc. A span that covers a full turn or more is
 * the whole ring — drawn as two half-arcs, since an SVG arc cannot start
 * and end on the same point. Null when the span is empty.
 */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: Seconds,
  end: Seconds,
): string | null {
  if (end <= start) return null;
  if (end - start >= DIAL_SECONDS) {
    const [tx, ty] = polar(cx, cy, r, 0);
    const [bx, by] = polar(cx, cy, r, 180);
    return (
      `M ${round(tx)} ${round(ty)} A ${r} ${r} 0 1 1 ${round(bx)} ${round(by)} ` +
      `A ${r} ${r} 0 1 1 ${round(tx)} ${round(ty)}`
    );
  }
  const a0 = angleOf(start);
  const sweep = ((end - start) / DIAL_SECONDS) * 360;
  const a1 = a0 + sweep;
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = sweep > 180 ? 1 : 0;
  return `M ${round(x0)} ${round(y0)} A ${r} ${r} 0 ${large} 1 ${round(x1)} ${round(y1)}`;
}

// ── The registers ──
//
// The minutes and the hours are each counted on a small dial of their own —
// a *register* — the way a chronograph counts them, so the big hand is free to
// be the seconds and the face reads at a glance: how many hours on the left,
// how many minutes on the right, and the seconds round the rim.
//
// The registers sit at three and nine, on the line across the dial, because
// twelve and six are the app's: the name under twelve and the window with the
// cog above six. How big they are is the room the hours leave them — a dial
// with large numerals inside the ring gets smaller registers rather than
// registers that run into its numerals — and an hour that would land on a
// register is left off the way a chronograph leaves it off (`hidden`).

export type Register = {
  /** Its centre, from the dial's centre, and its radius. */
  cx: number;
  cy: number;
  r: number;
  /** How many marks round it, and every how many of them is numbered. */
  marks: number;
  every: number;
  /** What one turn is, in seconds: an hour for the minutes, twelve hours for
   *  the hours. */
  turn: Seconds;
  /** How long its hand is, from its own centre. */
  hand: number;
};

export type Registers = {
  minutes: Register;
  hours: Register;
  /** Positions (0–11) whose marker would land on a register, and so are not
   *  drawn. */
  hidden: number[];
};

/** Air between a register and anything the dial draws round it. */
const REGISTER_GAP = 3;
/** How far a register's own inner edge stays off the dial's centre, where the
 *  big hand's cap and its counterweight are. */
const REGISTER_HUB = 22;
/** The largest and smallest a register may be. */
const REGISTER_MAX = 27;
const REGISTER_MIN = 15;
/** The diagonal positions either side of a register — two and four, eight and
 *  ten — sit at 30° off its axis; what has to clear them is how far the
 *  register reaches along theirs. */
const COS_30 = Math.cos(Math.PI / 6);

/**
 * Where the two registers sit, for a dial whose markers come in as far as
 * `inner` from the centre at the diagonals and as far as `across` at three and
 * nine, inside a ring whose inner edge is at `ring`. A register is as big as
 * fits between its hub clearance and both the markers at the diagonals and the
 * ring on its own axis — the ring is all the way round, a marker is not; one
 * that then reaches the marker on its own axis hides it.
 */
export function registers(
  inner: number,
  across: number,
  ring: number,
): Registers {
  const diagonal =
    (inner - REGISTER_GAP - REGISTER_HUB * COS_30) / (1 + COS_30);
  const axis = (ring - REGISTER_GAP - REGISTER_HUB) / 2;
  const r = Math.max(REGISTER_MIN, Math.min(REGISTER_MAX, diagonal, axis));
  const d = r + REGISTER_HUB;
  const reach = d + r + REGISTER_GAP;
  const hidden = reach > across ? [3, 9] : [];
  return {
    minutes: {
      cx: d,
      cy: 0,
      r,
      marks: 60,
      every: 15,
      turn: 3600,
      hand: r * 0.82,
    },
    hours: {
      cx: -d,
      cy: 0,
      r,
      marks: 12,
      every: 3,
      turn: 12 * 3600,
      hand: r * 0.7,
    },
    hidden,
  };
}

/** The numbers round a register, at the marks it numbers: 15, 30, 45 and 60
 *  round the minutes; 3, 6, 9 and 12 round the hours. */
export function registerLabels(
  reg: Pick<Register, "marks" | "every" | "turn">,
): { label: string; angle: number }[] {
  const out: { label: string; angle: number }[] = [];
  const unit = reg.turn / reg.marks;
  for (let i = 0; i < reg.marks; i += reg.every) {
    const value =
      ((i === 0 ? reg.marks : i) * unit) / (reg.turn === 3600 ? 60 : 3600);
    out.push({ label: String(value), angle: (i / reg.marks) * 360 });
  }
  return out;
}

// ── How the hands move ──
//
// A reading is a number of seconds and a direction: a stopwatch counts up
// from nothing, a timer counts down to it, and either may be held. The dial is
// handed one as the value it had at a moment and the rate it is moving at, so
// the frames can work out where it is without the screen re-rendering
// (`readingAt`).
//
// The big hand is the seconds, and it moves the way the movement says: a
// quartz steps once a second, a mechanical calibre beats eight times, a glide
// wheel does not step at all. That is one idea — round the reading to the beat
// — and `chronoTurns` is it, rounding *down* while it counts up and *up* while
// it counts down, so a timer's hand reads the same second its figure does
// (0:01 for the whole of the last second). A step is landed rather than
// arrived at: a stepper drives the hand a little past the mark and back,
// which is most of what tells a quartz apart from a dial that redraws.
//
// The minute register jumps a minute at a time, as a chronograph's does, and
// the hour register creeps — the hours are read off where its hand stands
// between two marks.
//
// And a reading that jumps — a stopwatch reset to zero, another one put on
// the dial, a tab woken after an hour — is not teleported. Each hand travels
// the way the reading went, forward for a reading that grew and back for one
// that shrank, over a moment of easing (`glidePlan`): the fly-back of a
// chronograph's reset button, and the wind of a watch being set.

/** What the dial is handed: the reading at a moment, and how fast it is
 *  moving — one second a second up, one down, or held. */
export type Reading = {
  value: Seconds;
  at: Millis;
  rate: 1 | 0 | -1;
};

/** A held reading — a preview, or a watch that is not running. */
export function heldAt(value: Seconds): Reading {
  return { value, at: 0, rate: 0 };
}

/** Where a reading is at `now`: never below nothing. */
export function readingAt(reading: Reading, now: Millis): Seconds {
  if (reading.rate === 0) return Math.max(0, reading.value);
  return Math.max(
    0,
    reading.value + (reading.rate * (now - reading.at)) / 1000,
  );
}

export type Turns = { hour: number; minute: number; second: number };

/** How long a stepper takes to land a beat, and how much of the beat's own
 *  length it may take — a calibre beating eight times a second cannot spend
 *  a seventh of a second doing it. */
const LANDING_MS = 140;
const LANDING_SHARE = 0.45;

/**
 * A reading, rounded to the movement's beat: a quartz to the second, a
 * mechanical to an eighth of one, a glide wheel not at all (`null`). Down
 * while it counts up, up while it counts down — the beat the hand last landed
 * on either way.
 */
export function onBeat(
  value: Seconds,
  beats: number | null,
  dir: 1 | -1 = 1,
): Seconds {
  if (beats === null) return value;
  const scaled = value * beats;
  // A hair of tolerance, so 7.0000000001 beats is the seventh rather than the
  // eighth on the way down.
  const step = dir > 0 ? Math.floor(scaled + 1e-9) : Math.ceil(scaled - 1e-9);
  return step / beats;
}

/**
 * The three hands for a reading, in degrees clockwise from twelve, each about
 * its own centre: the seconds round the dial, the minutes round the register
 * at three, the hours round the one at nine. `dir` is which way the reading
 * is going, which is which way a step lands from.
 */
export function chronoTurns(
  value: Seconds,
  beats: number | null,
  dir: 1 | -1 = 1,
): Turns {
  const v = Math.max(0, value);
  const beat = onBeat(v, beats, dir);
  let landing = 0;
  if (beats !== null) {
    const span = Math.min(LANDING_MS, (LANDING_SHARE / beats) * 1000);
    const since = Math.abs(v - beat) * 1000;
    landing = (6 / beats) * (1 - easeOutBack(since / span));
  }
  // The register counts whole minutes of the reading the seconds hand shows,
  // so the two never disagree about which minute it is.
  const whole = beats === null ? v : beat;
  return {
    second: (whole % 60) * 6 - dir * landing,
    minute: (Math.floor(whole / 60 + 1e-9) % 60) * 6,
    hour: ((v / 3600) % 12) * 30,
  };
}

/** Past this many seconds of a jump, the hands glide rather than step. */
export const GLIDE_AFTER: Seconds = 2;

/** How long a glide takes: a reset's fly-back is quick, a long way round is a
 *  little longer, and nothing is long enough to wait for. */
const GLIDE_MIN_MS = 360;
const GLIDE_MAX_MS = 900;

export type GlidePlan = {
  /** Where each hand is travelling from, in degrees. */
  from: Turns;
  /** Which way the hands travel: the way the reading went. */
  dir: 1 | -1;
  ms: number;
};

/**
 * Whether a change of reading is a jump — and if so, how the hands travel it.
 * Null when it is a tick and the hands should simply carry on.
 */
export function glidePlan(
  from: Seconds,
  to: Seconds,
  shown: Turns,
): GlidePlan | null {
  const gap = to - from;
  if (Math.abs(gap) <= GLIDE_AFTER) return null;
  const ms = Math.round(
    Math.min(GLIDE_MAX_MS, GLIDE_MIN_MS + Math.log10(1 + Math.abs(gap)) * 140),
  );
  return { from: { ...shown }, dir: gap > 0 ? 1 : -1, ms };
}

/**
 * The hands part way through a glide: each one `elapsed` milliseconds into
 * its travel from where it was to where `to` puts it, the way the reading
 * went and never more than a turn, on the crown's own ease.
 */
export function glideTurns(plan: GlidePlan, to: Turns, elapsed: number): Turns {
  const t = easeInOutSine(elapsed / plan.ms);
  const travel = (from: number, target: number) => {
    const raw = (((target - from) % 360) + 360) % 360;
    const way = plan.dir > 0 ? raw : raw === 0 ? 0 : raw - 360;
    return from + way * t;
  };
  return {
    hour: travel(plan.from.hour, to.hour),
    minute: travel(plan.from.minute, to.minute),
    second: travel(plan.from.second, to.second),
  };
}

/**
 * Sinusoidal ease in and out over `[0, 1]`: the speed is half a sine wave,
 * nothing at either end and fastest in the middle. A crown does not start at
 * full tilt and does not stop dead, and the eye reads a hand that accelerates
 * as a hand being turned rather than a number being replaced.
 */
export function easeInOutSine(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return (1 - Math.cos(Math.PI * t)) / 2;
}

/**
 * Ease out with a little past the mark: what a stepper does to a hand, and
 * what the eye reads as a hand being driven rather than redrawn. Zero at the
 * start, one at the end, about a tenth of a step beyond it in between.
 */
export function easeOutBack(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const back = 1.70158;
  const rest = t - 1;
  return 1 + (back + 1) * rest ** 3 + back * rest ** 2;
}
