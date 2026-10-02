// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// guidelines:allow-large-file: split when next touched; known deviation by owner decision
import type { ReactNode } from "react";

import {
  BEZEL_R,
  BEZEL_WIDTH,
  DIAL_HOURS,
  DIAL_R,
  DIAL_SECONDS,
  HANDS,
  handPoint,
  RING_BAND,
  RING_EDGE,
  ROMAN_HOURS,
  SIGNATURE,
  TRACK_R,
  arcPath,
  chapterMarks,
  chapterTracks,
  chronoTurns,
  dialLayout,
  faceMarks,
  MINUTE_INK,
  NAME_MARK_SCALE,
  nameLockup,
  readingAt,
  registerLabels,
  secondsLabel,
  polar,
  type Reading,
  type Register,
} from "./clock.ts";
import { useT } from "./i18n/index.ts";
import {
  DIAL_FACE,
  DIAL_FONT,
  DIAL_HANDS,
  DIAL_MARKERS,
  DIAL_MOVEMENT,
  DIAL_RING,
  isNumeral,
  type DialConfig,
  type DialFaceSpec,
  type DialFontSpec,
  type DialHandsSpec,
} from "./look.ts";
import {
  AMBIENT,
  domeSheen,
  facetTone,
  sheenTurn,
  steelTone,
  type Dome,
  type Light,
} from "./sheen.ts";
import { useHands } from "./useHands.ts";

// The dial, drawn: a stopwatch's face.
//
// This is the paint and nothing else. What it shows comes in as a `reading` —
// a number of seconds and which way it is moving — so the same picture serves
// the main screen (a stopwatch counting up, a timer counting down) and the
// settings' preset cards (a reading held still). What a stopwatch or a timer
// *means* stays in `WatchFace`; the geometry is in `clock.ts`, where it is
// tested.
//
// From the back forward: the bezel, the face (a radial gradient, because a
// sunburst finish is one), the track on the rim, the dial's own ring — a faint
// groove, or the printed chapter ring of 05 to 60 that a stopwatch reads its
// seconds off — the lume the marks of a dial whose blocks run out to the ring
// are finished with, the markers at every five seconds, the printing, the two
// registers, and the hands over everything with a shadow under them — the one
// thing that makes a flat drawing read as a watch rather than a chart.
//
// The registers are small dials of their own, sunk a step into the face the
// way a chronograph's are, with the fine circular graining of a turned
// counter: the minutes at three, once round an hour and numbered at the
// quarters, and the hours at nine, once round twelve. Each has its own steel
// hand. The big hand from the centre is the seconds, a hair in the face's
// ink rather than polished — too fine to carry a facet, and dark on a light
// dial the way the time report's is.
//
// The printing is what a dial carries besides its scale: the maker's name
// under twelve, with the mark beside it, the movement's word in small
// capitals under that, and a window above six. Here the name is the app's,
// the word is the movement the settings chose, and the window holds the
// Settings cog where a date would be. It is paint: `WatchFace` lays the
// button over the window, the way it lays the switch over the face.
//
// The bezel is a timer's time left. From twelve, clockwise, it is drawn in
// the accent for the share of the timer still to run, and shrinks as it runs
// down. A dial handed no `progress` — a stopwatch, the previews in Settings —
// keeps a plain bezel.
//
// The hands do not move here. Each is a group whose rotation `useHands` owns
// — a frame loop rather than a CSS transition, because a movement is a rate
// (one beat a second, or eight, or none at all) and a rate wants a clock, not
// a render. This component only gives the loop somewhere to write, and draws
// the reading it was handed for the first paint. A dial that is not `live` —
// the previews in Settings — has no loop and simply is where it is.
//
// What they are *shaped* like is the set the settings chose: a domed bar, or
// the tapered hand of a dress watch, drawn as a shape rather than a stroke and
// split down its ridge into a lit half and a shaded one, so a polished hand
// carries its own light round its register as it turns.

export const DIAL_BOX = 240;
const C = DIAL_BOX / 2;

type Props = {
  dial: DialConfig;
  /** What the hands show: a number of seconds, and which way it is moving. */
  reading: Reading;
  /** The hands move between renders — the main screen's dial. A preview
   *  leaves it off and gets a still. */
  live?: boolean;
  /** Distinct per dial on the page, because the gradient is referenced by
   *  id and two dials with one id would share one face. */
  id: string;
  /** A timer's time left, as a share of what it was set to, drawn on the
   *  bezel. Left out, the bezel is only a bezel. */
  progress?: number;
  /** Where the light on the metal comes from. Left out, the dial is lit the
   *  way a photographed watch is — over the left shoulder. */
  light?: Light;
  className?: string;
  /** The accessible name and description, as `<title>` / `<desc>` children,
   *  or nothing for a dial that is decoration. */
  children?: ReactNode;
  ariaHidden?: boolean;
};

export function Dial({
  dial,
  reading,
  live = false,
  id,
  progress,
  light = AMBIENT,
  className,
  children,
  ariaHidden,
}: Props) {
  const t = useT();
  const face = DIAL_FACE[dial.face];
  const font = DIAL_FONT[dial.font];
  const style = DIAL_MARKERS[dial.markers];
  const ring = DIAL_RING[dial.ring];
  const handSet = DIAL_HANDS[dial.hands];
  const layout = dialLayout(dial);
  const lockup = nameLockup(t("app.name"));
  const regs = layout.registers;
  const beats = DIAL_MOVEMENT[dial.movement].beats;

  const hands = useHands(reading, live, beats);
  const turns = hands.turns;
  // The facet along an applied marker and a hand: a lighter line down a dark
  // one, a darker line down a light one, so they read as metal with an edge
  // rather than as print.
  const facet = face.dark ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.4)";
  // The line round an applied part, where the metal meets the dial: dark
  // whatever the face, because it is a shadow rather than an ink — this is
  // what holds a polished marker on a pale dial.
  const metalEdge = "rgba(0,0,0,0.38)";
  // The window's recess, and the registers': a shade off the face, the way a
  // date disc or a counter sits a step below the dial.
  const recess = face.dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
  const faceId = `${id}-face`;
  const sheenId = `${id}-sheen`;
  const shadowId = `${id}-shadow`;

  const ticks = style.minuteTrack
    ? Array.from({ length: 60 }, (_, i) => {
        const five = i % 5 === 0;
        const length = five ? 4.5 : 2.5;
        const [x1, y1] = polar(C, C, TRACK_R - length, i * 6);
        const [x2, y2] = polar(C, C, TRACK_R, i * 6);
        return { x1, y1, x2, y2, five };
      })
    : [];

  // The printed ring's two tracks, and where its numerals sit in what the
  // ticks leave of the ring.
  const tracks = chapterTracks(layout.ringInner);
  const numeralR = (tracks.ring.outer + layout.ringOuter) / 2;
  const faceTrack = ring.printed
    ? faceMarks().map((m) => {
        const inner = m.minute ? tracks.face.inner : tracks.fine.inner;
        const [x1, y1] = polar(C, C, inner, m.angle);
        const [x2, y2] = polar(C, C, tracks.face.outer, m.angle);
        return { x1, y1, x2, y2, minute: m.minute };
      })
    : [];

  const left = progress === undefined ? 0 : Math.max(0, Math.min(1, progress));
  const leftArc = arcPath(C, C, BEZEL_R, 0, left * DIAL_SECONDS);

  // Where the hands point, for the light on them. The rotations the loop
  // writes are not React's to read, and they do not need to be: the light on
  // a hand turns as slowly as the hand does, so the reading this render was
  // handed is near enough, and a preview is exact.
  const bearing = chronoTurns(
    readingAt(reading, reading.at),
    beats,
    reading.rate < 0 ? -1 : 1,
  );

  const markers = DIAL_HOURS.map((hour) => ({
    hour,
    angle: (hour % 12) * 30,
    kind: style.at(hour % 12),
  })).filter((m) => !regs.hidden.includes(m.hour % 12));
  // The lume at the end of a mark that runs out to the ring, if this dial
  // has one. Out of the layout, so the dial does not decide it twice.
  const pip = layout.pip;

  return (
    <svg
      viewBox={`0 0 ${DIAL_BOX} ${DIAL_BOX}`}
      className={className}
      role={ariaHidden ? undefined : "img"}
      aria-hidden={ariaHidden ? "true" : undefined}
    >
      {children}
      <defs>
        <radialGradient id={faceId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={face.dial} />
          <stop offset="70%" stopColor={face.dial} />
          <stop offset="100%" stopColor={face.edge} />
        </radialGradient>
        <linearGradient
          id={sheenId}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          gradientTransform={`rotate(${sheenTurn(light)} 0.5 0.5)`}
        >
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1"
            floodColor="#000"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      {/* The case: the bezel, and the step down onto the face. */}
      <circle
        cx={C}
        cy={C}
        r={BEZEL_R}
        fill="none"
        stroke={face.bezel}
        strokeWidth={BEZEL_WIDTH}
      />
      {leftArc && (
        <path
          d={leftArc}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={BEZEL_WIDTH}
          strokeLinecap="round"
        />
      )}
      <circle cx={C} cy={C} r={DIAL_R} fill={`url(#${faceId})`} />
      <circle cx={C} cy={C} r={DIAL_R} fill={`url(#${sheenId})`} />
      <circle
        cx={C}
        cy={C}
        r={DIAL_R}
        fill="none"
        stroke={face.ink}
        strokeWidth={0.75}
        opacity={0.18}
      />

      {ticks.map((tick, i) => (
        <line
          key={`t${i}`}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={face.ink}
          strokeWidth={tick.five ? 1.4 : 0.8}
          opacity={tick.five ? 0.75 : 0.45}
        />
      ))}

      {/* The dial's own ring: the printed chapter ring in its own colour, or
          the faint groove a plainer face wears in its place. */}
      {ring.printed ? (
        <circle
          cx={C}
          cy={C}
          r={(layout.ringInner + layout.ringOuter) / 2}
          fill="none"
          stroke={ring.fill ?? face.ink}
          strokeWidth={layout.ringOuter - layout.ringInner}
        />
      ) : (
        <>
          <circle
            cx={C}
            cy={C}
            r={layout.bandR}
            fill="none"
            stroke={face.ink}
            strokeWidth={RING_BAND}
            opacity={0.07}
          />
          <circle
            cx={C}
            cy={C}
            r={layout.edgeR}
            fill="none"
            stroke={face.ink}
            strokeWidth={RING_EDGE}
            opacity={0.14}
          />
        </>
      )}

      {/* And the other half of that track, on the face: a second of the
          ring's own length hanging below it and growing inward, with two
          finer marks between each pair, for the big hand to be read to.
          Printed in the ring's own colour rather than the face's ink, so the
          track is one mark carried across the ring's edge rather than two
          that happen to line up. */}
      {ring.printed &&
        faceTrack.map((tick, i) => (
          <line
            key={`f${i}`}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={ring.fill ?? face.ink}
            strokeWidth={tick.minute ? 0.9 : 0.5}
            opacity={tick.minute ? 0.95 : 0.75}
          />
        ))}

      {/* The seconds, printed on the ring. Its ticks stand on the ring's inner
          edge and grow outward across it, with the numerals in the room that
          leaves — turned to lie along the ring, and the lower half turned the
          other way so a 30 at six is not read upside down. */}
      {ring.printed &&
        chapterMarks().map((m) => {
          if (m.kind === "tick") {
            const [x1, y1] = polar(C, C, tracks.ring.inner, m.angle);
            const [x2, y2] = polar(C, C, tracks.ring.outer, m.angle);
            return (
              <line
                key={`m${m.minute}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={ring.ink ?? face.ink}
                strokeWidth={MINUTE_INK}
                opacity={0.85}
              />
            );
          }
          const [x, y] = polar(C, C, numeralR, m.angle);
          return (
            <text
              key={`m${m.minute}`}
              x={x}
              y={y}
              dy="0.36em"
              textAnchor="middle"
              transform={`rotate(${m.turn} ${x} ${y})`}
              fill={ring.ink ?? face.ink}
              style={{
                fontSize: "7.4px",
                fontFamily: font.family,
                fontWeight: font.weight,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {m.label}
            </text>
          );
        })}

      {/* The lume at the end of the marks, where a dial's blocks run out to
          the ring: a filled plot printed on the ring at each one, in the
          ring's own ink, standing in the room the seconds leave. */}
      {pip &&
        markers.map(({ hour, angle }) => (
          <rect
            key={`p${hour}`}
            x={C - pip.width / 2}
            y={C - pip.r - pip.length / 2}
            width={pip.width}
            height={pip.length}
            rx={pip.width * 0.3}
            transform={`rotate(${angle} ${C} ${C})`}
            fill={ring.ink ?? face.ink}
          />
        ))}

      {markers.map(({ hour, angle, kind }) => {
        if (isNumeral(kind)) {
          const [x, y] = polar(C, C, layout.markerR, angle);
          return (
            <text
              key={hour}
              x={x}
              y={y}
              dy="0.36em"
              textAnchor="middle"
              fill={face.ink}
              style={{
                fontSize: `${layout.numeralSize}px`,
                fontFamily: font.family,
                fontWeight: font.weight,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {kind === "roman" ? ROMAN_HOURS[hour % 12] : secondsLabel(hour)}
            </text>
          );
        }
        return (
          <g key={hour} transform={`rotate(${angle} ${C} ${C})`}>
            <Marker
              kind={kind}
              r={layout.markerR}
              length={layout.markerLength}
              width={layout.markerWidth}
              ink={face.ink}
              edge={metalEdge}
              light={light}
              axis={angle}
              gradient={`${id}-m${hour}`}
            />
          </g>
        );
      })}

      {/* The printing: the mark and the name under twelve, the movement's
          word under them, and the window above six with the cog in it. The
          name is set in the geometric face — wide, spaced capitals, the way
          a maker's name is — and the word in the light one, whatever the
          seconds are set in. */}
      <g aria-hidden="true">
        <g
          transform={`translate(${C + lockup.markX - 10 * NAME_MARK_SCALE * lockup.scale} ${C - SIGNATURE.name - 50 * NAME_MARK_SCALE * lockup.scale}) scale(${NAME_MARK_SCALE * lockup.scale})`}
          fill="none"
          stroke={face.ink}
          strokeWidth={20}
        >
          <circle cx="50" cy="54" r="27" />
          <rect
            x="42"
            y="5"
            width="16"
            height="13"
            rx="3"
            fill={face.ink}
            stroke="none"
          />
        </g>
        <text
          x={C + lockup.textX}
          y={C - SIGNATURE.name}
          dy="0.36em"
          fill={face.ink}
          textLength={lockup.textLength}
          lengthAdjust="spacing"
          style={{
            fontSize: `${lockup.size}px`,
            fontFamily: DIAL_FONT.geometric.family,
            fontWeight: DIAL_FONT.geometric.weight,
            letterSpacing: `${lockup.tracking}px`,
          }}
        >
          {lockup.text}
        </text>
        <text
          x={C}
          y={C - SIGNATURE.line}
          dy="0.36em"
          textAnchor="middle"
          fill={face.ink}
          opacity={0.85}
          style={{
            fontSize: `${SIGNATURE.lineSize}px`,
            fontFamily: DIAL_FONT.light.family,
            fontWeight: 400,
            letterSpacing: "0.24em",
          }}
        >
          {t(`watch.calibre.${dial.movement}` as const).toLocaleUpperCase()}
        </text>
        <rect
          x={C - SIGNATURE.windowWidth / 2}
          y={C + SIGNATURE.window - SIGNATURE.windowHeight / 2}
          width={SIGNATURE.windowWidth}
          height={SIGNATURE.windowHeight}
          rx={1.4}
          fill={recess}
          stroke={face.ink}
          strokeWidth={0.9}
        />
        <rect
          x={C - SIGNATURE.windowWidth / 2 + 1.1}
          y={C + SIGNATURE.window - SIGNATURE.windowHeight / 2 + 1.1}
          width={SIGNATURE.windowWidth - 2.2}
          height={SIGNATURE.windowHeight - 2.2}
          rx={0.8}
          fill="none"
          stroke={facet}
          strokeWidth={0.6}
        />
        {/* The framework's cog, on its 24-unit grid, at ten units. */}
        <g
          transform={`translate(${C - 5} ${C + SIGNATURE.window - 5}) scale(${10 / 24})`}
          fill="none"
          stroke={face.ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </g>
      </g>

      {/* The two registers: the minutes at three, the hours at nine. */}
      <RegisterDial
        reg={regs.minutes}
        face={face}
        font={font}
        recess={recess}
        id={`${id}-min`}
      />
      <RegisterDial
        reg={regs.hours}
        face={face}
        font={font}
        recess={recess}
        id={`${id}-hr`}
      />

      <g
        filter={hands.winding ? undefined : `url(#${shadowId})`}
        data-winding={hands.winding ? "" : undefined}
      >
        <g
          data-hand="minute"
          ref={hands.minute}
          style={about(turns.minute, C + regs.minutes.cx, C + regs.minutes.cy)}
        >
          <Hand
            set={handSet}
            cx={C + regs.minutes.cx}
            cy={C + regs.minutes.cy}
            length={regs.minutes.hand}
            width={HANDS.minute}
            edge={metalEdge}
            light={light}
            axis={bearing.minute}
            gradient={`${id}-minute`}
          />
        </g>
        <circle
          cx={C + regs.minutes.cx}
          cy={C + regs.minutes.cy}
          r={HANDS.registerCap}
          fill={face.ink}
        />
        <g
          data-hand="hour"
          ref={hands.hour}
          style={about(turns.hour, C + regs.hours.cx, C + regs.hours.cy)}
        >
          <Hand
            set={handSet}
            cx={C + regs.hours.cx}
            cy={C + regs.hours.cy}
            length={regs.hours.hand}
            width={HANDS.hour}
            edge={metalEdge}
            light={light}
            axis={bearing.hour}
            gradient={`${id}-hour`}
          />
        </g>
        <circle
          cx={C + regs.hours.cx}
          cy={C + regs.hours.cy}
          r={HANDS.registerCap}
          fill={face.ink}
        />
        <g
          data-hand="second"
          ref={hands.second}
          style={about(turns.second, C, C)}
        >
          <SecondHand
            set={handSet}
            length={layout.hands.second}
            width={HANDS.second}
            ink={face.ink}
          />
        </g>
        <circle cx={C} cy={C} r={HANDS.cap} fill={face.ink} />
        <circle cx={C} cy={C} r={1.2} fill={face.dial} />
      </g>
    </svg>
  );
}

/** A hand's rotation, about its own axle. The origin is in user units of the
 *  viewBox, which is what an SVG element's transform origin is measured in. */
function about(degrees: number, x: number, y: number) {
  return {
    transform: `rotate(${degrees}deg)`,
    transformOrigin: `${x}px ${y}px`,
  };
}

/**
 * A register: a small dial sunk into the face. Its floor a step below the
 * dial with the fine rings of a turned counter on it, a rim in the face's
 * ink, a mark at every unit it counts — longer at the numbered ones — and the
 * numbers inside them, upright, in the dial's own typeface.
 */
function RegisterDial({
  reg,
  face,
  font,
  recess,
  id,
}: {
  reg: Register;
  face: DialFaceSpec;
  font: DialFontSpec;
  recess: string;
  id: string;
}) {
  const cx = C + reg.cx;
  const cy = C + reg.cy;
  const long = reg.r * 0.2;
  const short = reg.marks > 12 ? reg.r * 0.09 : reg.r * 0.14;
  const fine = reg.marks > 12;
  const labelR = reg.r - long - reg.r * 0.2;
  const size = reg.r * 0.26;
  return (
    <g aria-hidden="true" data-register={id}>
      <circle cx={cx} cy={cy} r={reg.r} fill={recess} />
      {[0.25, 0.42, 0.59, 0.76].map((k) => (
        <circle
          key={k}
          cx={cx}
          cy={cy}
          r={reg.r * k}
          fill="none"
          stroke={face.ink}
          strokeWidth={0.25}
          opacity={0.12}
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r={reg.r}
        fill="none"
        stroke={face.ink}
        strokeWidth={0.7}
        opacity={0.55}
      />
      {Array.from({ length: reg.marks }, (_, i) => {
        const numbered = i % reg.every === 0;
        const mid = !numbered && fine && i % 5 === 0;
        const length = numbered ? long : mid ? (long + short) / 2 : short;
        const angle = (i / reg.marks) * 360;
        const [x1, y1] = polar(cx, cy, reg.r - 0.6 - length, angle);
        const [x2, y2] = polar(cx, cy, reg.r - 0.6, angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={face.ink}
            strokeWidth={numbered ? 0.8 : 0.45}
            opacity={numbered ? 0.9 : 0.6}
          />
        );
      })}
      {registerLabels(reg).map(({ label, angle }) => {
        const [x, y] = polar(cx, cy, labelR, angle);
        return (
          <text
            key={label}
            x={x}
            y={y}
            dy="0.36em"
            textAnchor="middle"
            fill={face.ink}
            opacity={0.9}
            style={{
              fontSize: `${size}px`,
              fontFamily: font.family,
              fontWeight: font.weight,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}

/** One marker, drawn at twelve o'clock — the caller rotates it. `r` is the
 *  marker's centre, `length` its extent along the radius and `width` across
 *  it; `axis` is the bearing it stands at and `light` where the light is.
 *
 *  What it is drawn as is its profile (`markerProfile`). A roof is a plate
 *  with a ridge: two facets, each one flat tone, and the ridge down the
 *  middle where they meet. A dome is a turned plot, painted through a
 *  gradient so the light lands as a band across it. Print is the ink's.
 */
function Marker({
  kind,
  r,
  length,
  width,
  ink,
  edge,
  light,
  axis,
  gradient,
}: {
  kind:
    | "baton"
    | "doubleBaton"
    | "twinBaton"
    | "dot"
    | "triangle"
    | "wedge"
    | "tick";
  r: number;
  length: number;
  width: number;
  ink: string;
  edge: string;
  light: Light;
  axis: number;
  gradient: string;
}) {
  const top = C - r - length / 2;
  const bottom = C - r + length / 2;
  // The two faces of every roof on this marker: one tone each, and which is
  // the bright one is the light's business.
  const lit = steelTone(facetTone(axis, -1, light));
  const shade = steelTone(facetTone(axis, 1, light));
  const roof = (x: number, w: number) => (
    <Roof
      key={x}
      {...plate(x, w, top, bottom)}
      lit={lit}
      shade={shade}
      edge={edge}
    />
  );
  switch (kind) {
    case "baton":
      return roof(C, width);
    case "doubleBaton":
      return (
        <>
          {roof(C - width * 0.9, width)}
          {roof(C + width * 0.9, width)}
        </>
      );
    // Twelve, on a dial whose hours are blocks: two of them side by side,
    // which is what the dial does instead of one broad one. They meet in the
    // middle and the hairline round each is the join.
    case "twinBaton":
      return (
        <>
          {roof(C - width / 2, width)}
          {roof(C + width / 2, width)}
        </>
      );
    case "triangle":
      return (
        <Roof
          {...wedge(length * 0.48, top, bottom)}
          lit={lit}
          shade={shade}
          edge={edge}
        />
      );
    case "wedge":
      return (
        <Roof
          {...wedge(width * 0.9, top, bottom)}
          lit={lit}
          shade={shade}
          edge={edge}
        />
      );
    case "dot":
      return (
        <>
          <Steel id={gradient} dome={domeSheen(axis, light)} />
          <circle
            cx={C}
            cy={C - r}
            r={length * 0.32}
            fill={`url(#${gradient})`}
            stroke={edge}
            strokeWidth={0.4}
          />
        </>
      );
    case "tick":
      return (
        <rect
          x={C - width * 0.3}
          y={top}
          width={width * 0.6}
          height={length * 0.55}
          fill={ink}
        />
      );
  }
}

/** A plate with a ridge down it: the face to the left of the ridge, the face
 *  to the right, and the hairline of shadow round the pair where the metal
 *  meets the dial. The caller knows the shape; this knows what the light
 *  does with it. */
function Roof({
  left,
  right,
  outline,
  lit,
  shade,
  edge,
}: {
  left: string;
  right: string;
  outline: string;
  lit: string;
  shade: string;
  edge: string;
}) {
  return (
    <>
      <polygon points={left} fill={lit} />
      <polygon points={right} fill={shade} />
      <polygon
        points={outline}
        fill="none"
        stroke={edge}
        strokeWidth={0.4}
        strokeLinejoin="round"
      />
    </>
  );
}

/** A straight block, `w` across and centred on `x`: its two faces and its
 *  outline, as polygon points. */
function plate(x: number, w: number, top: number, bottom: number) {
  const half = w / 2;
  return {
    left: `${x - half},${top} ${x},${top} ${x},${bottom} ${x - half},${bottom}`,
    right: `${x},${top} ${x + half},${top} ${x + half},${bottom} ${x},${bottom}`,
    outline: `${x - half},${top} ${x + half},${top} ${x + half},${bottom} ${x - half},${bottom}`,
  };
}

/** A block that narrows to a point at the inner end — a wedge, or the
 *  triangle at twelve — `half` across at its wide end. */
function wedge(half: number, top: number, bottom: number) {
  return {
    left: `${C - half},${top} ${C},${top} ${C},${bottom}`,
    right: `${C},${top} ${C + half},${top} ${C},${bottom}`,
    outline: `${C - half},${top} ${C + half},${top} ${C},${bottom}`,
  };
}

/** The gradient a polished part is filled through: the band where the light
 *  comes back off the curve, and the two shoulders either side of it. Across
 *  the shape's own width, so it turns with whatever group rotates the part —
 *  which is why the band is in the same place on the drawing and the light is
 *  in the same place on the dial. */
function Steel({ id, dome }: { id: string; dome: Dome }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={steelTone(dome.left)} />
        <stop
          offset={`${Math.round(dome.crest * 100)}%`}
          stopColor={steelTone(dome.peak)}
        />
        <stop offset="100%" stopColor={steelTone(dome.right)} />
      </linearGradient>
    </defs>
  );
}

/** A register's hand, drawn at twelve o'clock on its own axle — the caller's
 *  group rotates it. `length` is its tip from the centre, `width` the width the
 *  geometry gives it, `axis` where it is pointing on the dial and `light`
 *  where the light is.
 *
 *  Both sets are steel, because a hand is. A bar is one domed bar, lit across
 *  its width the way an applied marker is. A pointed hand is a shape with a
 *  ridge down it: sides dead straight from the cap up to its shoulder and
 *  then closing at the set's own bevel onto the small flat it ends on, drawn
 *  as the two flat facets either side of that ridge — so which half is the
 *  bright one depends on where the hand is pointing, and changes as it
 *  sweeps. Either way a hairline of shadow round it holds it on a pale face.
 */
function Hand({
  set,
  cx = C,
  cy = C,
  length,
  width,
  edge,
  light,
  axis,
  gradient,
}: {
  set: DialHandsSpec;
  /** The axle it turns on: the dial's centre, or a register's. */
  cx?: number;
  cy?: number;
  length: number;
  width: number;
  edge: string;
  light: Light;
  axis: number;
  gradient: string;
}) {
  const top = cy - length;
  // A register's hand is a small one, and carries a small tail.
  const bottom = cy + set.boss * (cx === C && cy === C ? 1 : 0.4);
  if (!set.taper) {
    return (
      <>
        <Steel id={gradient} dome={domeSheen(axis, light)} />
        <rect
          x={cx - width / 2}
          y={top}
          width={width}
          height={bottom - top}
          rx={width / 2}
          fill={`url(#${gradient})`}
          stroke={edge}
          strokeWidth={0.35}
        />
      </>
    );
  }
  const base = (width * set.base) / 2;
  const tip = (width * set.tip) / 2;
  // Where the sides stop running straight and start closing on the tip. The
  // run is the bevel's, reckoned from how wide this hand is (`clock.ts`), so
  // the hour and the minute hand are finished at the same angle rather than
  // over the same share of two very different lengths.
  const shoulder = top + handPoint(set, width, length);
  return (
    <Roof
      left={`${cx - base},${bottom} ${cx - base},${shoulder} ${cx - tip},${top} ${cx},${top} ${cx},${bottom}`}
      right={`${cx},${bottom} ${cx},${top} ${cx + tip},${top} ${cx + base},${shoulder} ${cx + base},${bottom}`}
      outline={`${cx - base},${bottom} ${cx - base},${shoulder} ${cx - tip},${top} ${cx + tip},${top} ${cx + base},${shoulder} ${cx + base},${bottom}`}
      lit={steelTone(facetTone(axis, -1, light))}
      shade={steelTone(facetTone(axis, 1, light))}
      edge={edge}
    />
  );
}

/** The seconds hand: one line from the axle to its tip, and whatever balances
 *  it past the axle — the disc of a sports hand on a stub of the same hair,
 *  or the blade of a dress watch, which leaves the hub as the same hair and
 *  widens as it goes, so the weight is out at the end of it. Painted in the
 *  face's ink whatever the rest of the set is made of: a hair that fine has
 *  no surface to polish. */
function SecondHand({
  set,
  length,
  width,
  ink,
}: {
  set: DialHandsSpec;
  length: number;
  width: number;
  ink: string;
}) {
  const blade = set.counterweight === "blade";
  const tail = C + HANDS.tail * set.tail;
  const flare = (width * set.tailWidth) / 2;
  return (
    <>
      <line
        x1={C}
        y1={blade ? C : tail}
        x2={C}
        y2={C - length}
        stroke={ink}
        strokeWidth={width}
        strokeLinecap="round"
      />
      {blade ? (
        <polygon
          points={`${C - width / 2},${C} ${C + width / 2},${C} ${C + flare},${tail} ${C - flare},${tail}`}
          fill={ink}
        />
      ) : (
        <circle cx={C} cy={C + HANDS.tail * 0.7} r={2.2} fill={ink} />
      )}
    </>
  );
}
