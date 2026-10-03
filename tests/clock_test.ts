// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  DIAL_HOURS,
  DIAL_R,
  DIAL_SECONDS,
  FACE_R,
  GLIDE_AFTER,
  ROMAN_HOURS,
  SIGNATURE,
  SIGNATURE_REACH,
  TRACK_R,
  angleOf,
  arcPath,
  chapterMarks,
  chapterTracks,
  chronoTurns,
  dialLayout,
  faceMarks,
  glidePlan,
  glideTurns,
  heldAt,
  MINUTE_INK,
  NAME_LOCKUP_MAX,
  NAME_MARK,
  NAME_TRACKING,
  nameLockup,
  RING_BLEED,
  HANDS,
  handPoint,
  placementOf,
  polar,
  readingAt,
  registerLabels,
  registers,
  secondsLabel,
  easeInOutSine,
  easeOutBack,
  onBeat,
} from "../src/app/clock.ts";
import {
  DIAL_FONT,
  DIAL_FONTS,
  DIAL_MARKERS,
  DIAL_MARKER_STYLES,
  DIAL_PLACEMENTS,
  DIAL_HANDS,
  DIAL_HAND_SETS,
  DIAL_RING,
  DIAL_RINGS,
  DIAL_SCALE,
  DIAL_SCALES,
  ROMAN_WIDTH,
  isNumeral,
  type DialConfig,
} from "../src/app/look.ts";

/** Hours and minutes, as seconds. */
const h = (hours: number, minutes = 0) => hours * 3600 + minutes * 60;

describe("the scale", () => {
  it("numbers the twelve marks in seconds, sixty at the top", () => {
    expect(DIAL_HOURS.map(secondsLabel)).toEqual([
      60, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
    ]);
  });

  it("writes the same in Roman numerals, subtractive the way Rome wrote them", () => {
    expect(ROMAN_HOURS).toHaveLength(DIAL_HOURS.length);
    const value = (r: string) => {
      const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };
      let n = 0;
      for (let i = 0; i < r.length; i += 1) {
        const a = v[r[i]!]!;
        const b = v[r[i + 1] ?? ""] ?? 0;
        n += a < b ? -a : a;
      }
      return n;
    };
    expect(DIAL_HOURS.map((p) => value(ROMAN_HOURS[p % 12]!))).toEqual(
      DIAL_HOURS.map(secondsLabel),
    );
  });

  it("is never wider than four capitals, which is what ROMAN_WIDTH is set for", () => {
    for (const r of ROMAN_HOURS) expect(r.length).toBeLessThanOrEqual(4);
  });
});

describe("angleOf", () => {
  it("puts three o'clock at 90° and wraps at twelve", () => {
    expect(angleOf(h(3))).toBe(90);
    expect(angleOf(h(15))).toBe(90);
    expect(angleOf(0)).toBe(0);
    expect(angleOf(h(12))).toBe(0);
  });
});

describe("polar", () => {
  it("measures clockwise from twelve", () => {
    const [x, y] = polar(50, 50, 10, 90);
    expect(x).toBeCloseTo(60);
    expect(y).toBeCloseTo(50);
    const [tx, ty] = polar(50, 50, 10, 0);
    expect(tx).toBeCloseTo(50);
    expect(ty).toBeCloseTo(40);
  });
});

describe("arcPath", () => {
  it("is null for an empty span", () => {
    expect(arcPath(50, 50, 40, h(9), h(9))).toBeNull();
  });

  it("draws a short arc with the small-arc flag", () => {
    const d = arcPath(50, 50, 40, h(12), h(15))!;
    expect(d.startsWith("M 50 10 A 40 40 0 0 1 ")).toBe(true);
  });

  it("draws a long arc with the large-arc flag", () => {
    const d = arcPath(50, 50, 40, h(8), h(17))!;
    expect(d).toContain("A 40 40 0 1 1");
  });

  it("draws a whole ring for a span of a full turn or more", () => {
    const d = arcPath(50, 50, 40, 0, DIAL_SECONDS)!;
    expect(d.split("A")).toHaveLength(3);
  });
});

describe("handPoint", () => {
  const tapered = DIAL_HANDS.tapered;
  /** The hands of the dial the tapered set is on, at the lengths
   *  `dialLayout` gives them there. */
  const uptown = dialLayout({
    markers: "blocks",
    font: "light",
    scale: 7,
    placement: "inside",
    ring: "chapter",
  });

  it("closes the sides at the set's own bevel, whatever the hand", () => {
    for (const hand of ["hour", "minute"] as const) {
      const width = HANDS[hand];
      const reg =
        hand === "hour" ? uptown.registers.hours : uptown.registers.minutes;
      const run = handPoint(tapered, width, reg.hand);
      // The angle off the axis is what was measured, so it is what has to
      // come back out: the sides drop from half the base to half the tip
      // over the run, and the arctangent of that is the bevel.
      const drop = (width * (tapered.base - tapered.tip)) / 2;
      expect((Math.atan(drop / run) * 180) / Math.PI, hand).toBeCloseTo(
        tapered.bevel,
        6,
      );
    }
  });

  it("gives the broader hand the longer point, and neither a spear", () => {
    const hours = uptown.registers.hours.hand;
    const minutes = uptown.registers.minutes.hand;
    const hour = handPoint(tapered, HANDS.hour, hours);
    const minute = handPoint(tapered, HANDS.minute, minutes);
    // The hour hand is the broader of the two and the shorter, so it carries
    // the longer point and much the greater share of itself.
    expect(hour).toBeGreaterThan(minute);
    expect(hour / hours).toBeGreaterThan(minute / minutes);
    // And neither is a spear: a register's hand is short, so its point is a
    // larger share of it than a centre hand's — but well under a third.
    expect(minute / minutes).toBeLessThan(0.3);
    expect(hour / hours).toBeLessThan(0.3);
  });

  it("leaves a flat at the tip rather than a needle", () => {
    expect(tapered.tip).toBeGreaterThan(0);
    expect(tapered.tip).toBeLessThan(tapered.base);
  });

  it("is nothing at all for a set with no bevel, and never past the hand", () => {
    expect(handPoint(DIAL_HANDS.bar, HANDS.minute, 90)).toBe(0);
    for (const id of DIAL_HAND_SETS) {
      const set = DIAL_HANDS[id];
      // A hand as wide as it is long, or a bevel laid nearly flat, cannot
      // put the shoulder behind the axle.
      expect(handPoint(set, 40, 6), id).toBeLessThanOrEqual(6);
      expect(handPoint({ ...set, bevel: 1 }, 40, 6), id).toBeLessThanOrEqual(6);
    }
  });
});

describe("dialLayout", () => {
  type Dial = Pick<
    DialConfig,
    "placement" | "markers" | "font" | "scale" | "ring"
  >;
  const every: Dial[] = [];
  for (const placement of DIAL_PLACEMENTS)
    for (const markers of DIAL_MARKER_STYLES)
      for (const font of DIAL_FONTS)
        for (const scale of DIAL_SCALES)
          for (const ring of DIAL_RINGS)
            every.push({ placement, markers, font, scale, ring });

  /** How far the widest thing a style draws reaches either side of the
   *  marker's own radius, the way the layout measures it — half a numeral's
   *  width, or half the applied marker's length, which is what a style that
   *  runs its hours out to the ring stretches. */
  const reachOf = (
    dial: Pick<DialConfig, "markers" | "font">,
    l: ReturnType<typeof dialLayout>,
  ) => {
    const kinds = DIAL_HOURS.map((hour) =>
      DIAL_MARKERS[dial.markers].at(hour % 12),
    );
    const roman = kinds.includes("roman");
    const numerals = kinds.some(isNumeral);
    return numerals
      ? l.numeralSize *
          DIAL_FONT[dial.font].widthFactor *
          (roman ? ROMAN_WIDTH : 1)
      : l.markerLength / 2;
  };

  it("keeps every marker clear of the ring and on the face, whatever the dial", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const reach = reachOf(dial, l);
      const where = JSON.stringify(dial);
      const outer = l.markerR + reach;
      const inner = l.markerR - reach;
      // On the face: inside the minute track where the style prints one on
      // the rim, and inside the day's own track where it does not — a style
      // with nothing to put in its rim has its ring out at the day's edge,
      // and its markers out with it.
      expect(outer, `${where} runs off the face`).toBeLessThanOrEqual(
        DIAL_MARKERS[dial.markers].minuteTrack ? TRACK_R - 4 : FACE_R,
      );
      if (placementOf(dial) === "inside") {
        if (DIAL_MARKERS[dial.markers].reachesRing) {
          // These hours are meant to meet the ring: on its inner edge, not
          // short of it and not over it.
          expect(outer, `${where} does not reach the ring`).toBeCloseTo(
            l.ringInner,
            6,
          );
        } else {
          expect(outer, `${where} runs into the ring`).toBeLessThanOrEqual(
            l.ringInner,
          );
        }
        expect(inner, `${where} leaves no dial`).toBeGreaterThan(40);
      } else if (placementOf(dial) === "outside") {
        expect(inner, `${where} runs into the ring`).toBeGreaterThanOrEqual(
          l.ringOuter,
        );
      } else {
        // Over the ring: centred on the band.
        expect(l.markerR).toBeCloseTo(l.bandR, 6);
      }
      // The ring itself is a ring, not a dot.
      expect(l.ringInner, `${where} has no ring`).toBeGreaterThan(50);
      expect(l.ringOuter).toBeLessThan(DIAL_R);
    }
  });

  it("keeps the printing — the name, the word and the window — inside the ring on every dial", () => {
    // The reach is the further of the two ends: the top of the name under
    // twelve, and the foot of the window above six.
    expect(SIGNATURE_REACH).toBe(
      Math.max(
        SIGNATURE.name + SIGNATURE.nameSize / 2,
        SIGNATURE.window + SIGNATURE.windowHeight / 2,
      ),
    );
    for (const dial of every) {
      const l = dialLayout(dial);
      const where = JSON.stringify(dial);
      expect(l.ringInner, `${where} prints over the ring`).toBeGreaterThan(
        SIGNATURE_REACH,
      );
      // Inside the ring the markers hang under it at twelve; the name has
      // to clear them too, on every size.
      if (placementOf(dial) === "inside") {
        const reach = reachOf(dial, l);
        expect(
          l.markerR - reach,
          `${where} prints over twelve`,
        ).toBeGreaterThan(SIGNATURE.name + SIGNATURE.nameSize / 2);
      }
    }
    // The word sits between the name and the centre, the window below it.
    expect(SIGNATURE.line + SIGNATURE.lineSize / 2).toBeLessThan(
      SIGNATURE.name - SIGNATURE.nameSize / 2,
    );
    expect(SIGNATURE.window - SIGNATURE.windowHeight / 2).toBeGreaterThan(20);
  });

  it("keeps the widest name the lockup allows clear of eleven and one", () => {
    // The name is the build's (the listing's, in an app build), so its width
    // is not known here: the widest lockup `nameLockup` will set is. Its top
    // corners are the nearest it comes to the hours either side of twelve.
    const corner = {
      x: NAME_LOCKUP_MAX / 2,
      y: SIGNATURE.name + SIGNATURE.nameSize / 2,
    };
    for (const dial of every) {
      const l = dialLayout(dial);
      const reach = reachOf(dial, l);
      const one = {
        x: l.markerR * Math.sin(Math.PI / 6),
        y: l.markerR * Math.cos(Math.PI / 6),
      };
      expect(
        Math.hypot(one.x - corner.x, one.y - corner.y),
        `${JSON.stringify(dial)} prints the name into one o'clock`,
      ).toBeGreaterThan(reach);
    }
  });

  it("prints a chapter ring's ticks inside it, and the face's under it", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const tracks = chapterTracks(l.ringInner);
      const where = JSON.stringify(dial);
      // The ring's own ticks stand on its inner edge and stay on the ring.
      expect(
        tracks.ring.inner,
        `${where}: the ring's ticks start inside the ring`,
      ).toBeGreaterThanOrEqual(l.ringInner);
      expect(
        tracks.ring.outer,
        `${where}: the ring's ticks run off the ring`,
      ).toBeLessThan(l.ringOuter);
      // The face's hang under it, on the face, and never touch it.
      expect(
        tracks.face.outer,
        `${where}: the face's track is on the ring`,
      ).toBeLessThan(l.ringInner);
      expect(tracks.face.inner).toBeLessThan(tracks.face.outer);
      // The two halves of the one track are the same length, so the ring's
      // edge runs through the middle of a minute rather than between two.
      expect(
        tracks.face.outer - tracks.face.inner,
        `${where}: the face's minutes are not the ring's length`,
      ).toBeCloseTo(tracks.ring.outer - tracks.ring.inner, 6);
      // And the thirds of a minute hang from the same edge, not half as far.
      expect(tracks.fine.outer).toBeCloseTo(tracks.face.outer, 6);
      expect(tracks.fine.inner).toBeGreaterThan(tracks.face.inner);
      expect(tracks.fine.outer - tracks.fine.inner).toBeLessThan(
        (tracks.face.outer - tracks.face.inner) / 2,
      );
      // And where the markers are inside the ring and stop short of it, the
      // track stops short of them too: a tick that reached a marker would
      // foul the largest hour size. The hours that run out to the ring are
      // the exception — they cross the track, which is what puts them
      // against the ring rather than against a row of stray ticks.
      if (
        placementOf(dial) === "inside" &&
        !DIAL_MARKERS[dial.markers].reachesRing
      ) {
        expect(
          tracks.face.inner,
          `${where}: the face's track runs into the markers`,
        ).toBeGreaterThan(l.markerR + reachOf(dial, l));
      }
    }
  });

  it("stops the hands at whatever the dial is read against", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const tracks = chapterTracks(l.ringInner);
      const where = JSON.stringify(dial);
      if (DIAL_RING[dial.ring].printed) {
        // Read against the print: the seconds hand goes on to the ring and
        // stops a hair onto the near end of its ticks — touching the mark it
        // points at without lying along it, and nowhere near the ring's
        // outer edge.
        expect(l.hands.second, where).toBeGreaterThan(tracks.ring.inner);
        expect(l.hands.second, where).toBeLessThan(
          tracks.ring.inner + (tracks.ring.outer - tracks.ring.inner) / 4,
        );
      } else {
        expect(l.hands.second, where).toBeCloseTo(l.ringOuter, 6);
      }
      // Either way each register's hand stays inside its register, and the
      // hour hand is the shorter of the two.
      for (const reg of [l.registers.minutes, l.registers.hours]) {
        expect(reg.hand, where).toBeLessThan(reg.r);
      }
      expect(l.registers.hours.hand, where).toBeLessThan(
        l.registers.minutes.hand,
      );
    }
  });

  it("puts the hours inside a printed ring, whatever the placement says", () => {
    // A chapter ring is the scale the hours are read against, and a scale is
    // read from the outside in: over it, every hour would land on one of the
    // numerals, and outside it the watch would read inside out.
    const base = {
      markers: "batons",
      font: "grotesque",
      scale: 4,
    } as const;
    const inside = dialLayout({
      ...base,
      placement: "inside",
      ring: "chapter",
    });
    for (const placement of DIAL_PLACEMENTS) {
      const dial = { ...base, placement, ring: "chapter" } as const;
      expect(placementOf(dial), placement).toBe("inside");
      // And the layout follows, rather than the override being cosmetic.
      expect(dialLayout(dial)).toEqual(inside);
    }
    // A groove is only a track, so it takes the hours where they were put.
    for (const placement of DIAL_PLACEMENTS) {
      expect(placementOf({ placement, ring: "groove" })).toBe(placement);
    }
  });

  it("keeps a placement it is not using, so a ring swapped back is the dial it was", () => {
    // The override is read at layout time and nothing rewrites the setting.
    const dial = {
      ...{ markers: "batons", font: "grotesque", scale: 4 },
      placement: "outside",
    } as const;
    expect(placementOf({ ...dial, ring: "chapter" })).toBe("inside");
    expect(placementOf({ ...dial, ring: "groove" })).toBe("outside");
  });

  it("pulls the ring in to make room for markers outside it", () => {
    const base = {
      markers: "numerals",
      font: "grotesque",
      scale: 4,
      ring: "groove",
    } as const;
    const inside = dialLayout({ ...base, placement: "inside" });
    const over = dialLayout({ ...base, placement: "over" });
    const outside = dialLayout({ ...base, placement: "outside" });
    // Over the ring, a marker this size wants a little room too — but far
    // less than a marker beside it.
    expect(over.ringOuter).toBeLessThanOrEqual(inside.ringOuter);
    expect(outside.ringOuter).toBeLessThan(over.ringOuter);
    expect(outside.markerR).toBeGreaterThan(outside.ringOuter);
    expect(inside.markerR).toBeLessThan(inside.ringInner);
  });

  it("grows the numerals step by step where there is room", () => {
    let last = 0;
    for (const scale of DIAL_SCALES) {
      const l = dialLayout({
        placement: "inside",
        markers: "numerals",
        font: "grotesque",
        scale,
        ring: "groove",
      });
      expect(l.numeralSize).toBeGreaterThan(last);
      last = l.numeralSize;
    }
    // The top of the scale asks for more than a dial with the day's own
    // track outside the markers has to give, so what is drawn there is what
    // the room allows — most of what was asked, and the same for every dial
    // that reaches it.
    const wanted = DIAL_SCALE[8] * DIAL_FONT.grotesque.scale;
    expect(last).toBeLessThanOrEqual(wanted);
    expect(last).toBeGreaterThan(wanted * 0.85);
  });

  it("sets a numeral smaller rather than let it run off the face", () => {
    // VIII in the widest face, at the biggest step, over the ring: the size
    // the step asks for cannot fit, and the one drawn is what does. Roman
    // prints no track on the rim, so what it has to stay clear of is the
    // day's own track.
    const l = dialLayout({
      placement: "over",
      markers: "roman",
      font: "inscribed",
      scale: 8,
      ring: "groove",
    });
    expect(l.numeralSize).toBeLessThan(DIAL_SCALE[8]);
    const reach = reachOf({ markers: "roman", font: "inscribed" }, l);
    expect(l.markerR + reach).toBeLessThanOrEqual(FACE_R);
  });

  it("runs a dress dial's blocks out to the ring, and finishes them with a plot on it", () => {
    for (const scale of DIAL_SCALES) {
      const dial = {
        placement: "inside",
        markers: "blocks",
        font: "light",
        scale,
        ring: "chapter",
      } as const;
      const l = dialLayout(dial);
      // A plain marker of the same size to measure against: wedges rather
      // than batons, because a style that prints a track on the rim is laid
      // out against a rim and this one is not — the two would be measured
      // from different rings.
      const plain = dialLayout({ ...dial, markers: "wedges" });
      // The block ends on the ring's inner edge — where the plain marker of
      // the same size stops short of it, by the air a marker is given. The
      // ring is painted to exactly that radius on its inner side, so the two
      // meet rather than the hour lapping onto the ring.
      expect(l.markerR + l.markerLength / 2).toBeCloseTo(l.ringInner, 6);
      expect(RING_BLEED).toBeGreaterThan(0);
      expect(plain.markerR + plain.markerLength / 2).toBeLessThan(
        l.ringInner - 1,
      );
      // What it gives back it gives back at the inner end: the outer end is
      // the one that has to meet the ring, so the hour starts further out
      // than the baton of the same size would have, not shorter of the ring.
      const run = l.ringInner - (plain.markerR - plain.markerLength / 2);
      expect(l.markerLength).toBeLessThan(run);
      expect(l.markerLength).toBeGreaterThan(run * 0.7);
      expect(l.markerR - l.markerLength / 2).toBeGreaterThan(
        plain.markerR - plain.markerLength / 2,
      );
      // And it is a block rather than a baton: half as wide again, which is
      // the whole of what the two words mean on a dial.
      expect(l.markerWidth).toBeCloseTo(
        plain.markerWidth * DIAL_MARKERS.blocks.width,
        6,
      );
      expect(DIAL_MARKERS.blocks.width).toBeGreaterThan(1);
      // And it crosses the face's track on the way, which is the stray tick
      // the arrangement is rid of.
      expect(l.markerR + l.markerLength / 2).toBeGreaterThan(
        chapterTracks(l.ringInner).face.outer,
      );
      // The plot sits on the ring, in the room the ring's own ticks take —
      // which at an hour is room the minutes are not using, because every
      // hour is a place the chapter ring prints a numeral.
      const track = chapterTracks(l.ringInner).ring;
      expect(l.pip).not.toBeNull();
      const pip = l.pip;
      if (!pip) throw new Error("no plot");
      // Centred on the ticks' own track, so the two read as one row.
      expect(pip.r).toBeCloseTo((track.inner + track.outer) / 2, 6);
      // A block rather than a dot: shorter along the radius than the tick it
      // stands in the place of, and well over twice as wide across it.
      const tick = track.outer - track.inner;
      expect(pip.length).toBeLessThan(tick);
      expect(pip.length).toBeGreaterThan(tick * 0.75);
      expect(pip.width).toBeGreaterThan(MINUTE_INK * 2);
      expect(pip.width).toBeLessThan(pip.length);
      // And it stays on the ring, both ends.
      expect(pip.r - pip.length / 2).toBeGreaterThanOrEqual(l.ringInner);
      expect(pip.r + pip.length / 2).toBeLessThan(l.ringOuter);
      expect(
        chapterMarks().filter((m) => m.kind === "tick" && m.angle % 30 === 0),
      ).toHaveLength(0);
    }
  });

  it("leaves the hours where they were on every other dial, and outside the ring", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const reaches =
        DIAL_MARKERS[dial.markers].reachesRing &&
        placementOf(dial) === "inside";
      // Only a reaching style inside the ring has a plot; nothing else grows
      // one, and a block placed over or outside the ring has no gap to close.
      expect(l.pip === null, JSON.stringify(dial)).toBe(!reaches);
      if (DIAL_MARKERS[dial.markers].reachesRing && !reaches) {
        expect(l.markerLength).toBeCloseTo(
          dialLayout({ ...dial, markers: "batons" }).markerLength,
          6,
        );
      }
    }
  });

  it("scales the applied markers with the step", () => {
    const small = dialLayout({
      placement: "inside",
      markers: "batons",
      font: "grotesque",
      scale: 1,
      ring: "groove",
    });
    const large = dialLayout({
      placement: "inside",
      markers: "batons",
      font: "grotesque",
      scale: 8,
      ring: "groove",
    });
    expect(large.markerLength).toBeGreaterThan(small.markerLength);
    expect(large.markerWidth).toBeGreaterThan(small.markerWidth);
  });
});

describe("chapterMarks", () => {
  const marks = chapterMarks();

  it("prints sixty marks: a numeral every five minutes, a tick between", () => {
    expect(marks).toHaveLength(60);
    const numerals = marks.filter((m) => m.kind === "numeral");
    expect(numerals).toHaveLength(12);
    expect(numerals.map((m) => m.label)).toEqual([
      "60",
      "05",
      "10",
      "15",
      "20",
      "25",
      "30",
      "35",
      "40",
      "45",
      "50",
      "55",
    ]);
    expect(marks.filter((m) => m.kind === "tick")).toHaveLength(48);
  });

  it("lays a mark at every six degrees, clockwise from twelve", () => {
    marks.forEach((m, i) => expect(m.angle).toBe(i * 6));
  });

  it("turns a numeral along the ring, and the lower half the other way up", () => {
    const at = (minute: number) => {
      const m = marks.find((x) => x.kind === "numeral" && x.minute === minute);
      if (!m || m.kind !== "numeral")
        throw new Error(`no numeral at ${minute}`);
      return m.turn;
    };
    expect(at(60)).toBe(0);
    expect(at(5)).toBe(30);
    expect(at(15)).toBe(90);
    // Past three the numerals would hang upside down, so they are flipped.
    expect(at(20)).toBe(300);
    expect(at(30)).toBe(0);
    expect(at(40)).toBe(60);
    // And right again from nine.
    expect(at(45)).toBe(270);
    expect(at(55)).toBe(330);
  });
});

describe("faceMarks", () => {
  const marks = faceMarks();
  const minutes = marks.filter((m) => m.minute);
  const thirds = marks.filter((m) => !m.minute);
  /** The finer marks in the gap that runs from `minute` to the next. */
  const between = (minute: number) =>
    thirds
      .map((m) => m.angle)
      .filter((a) => a > minute * 6 && a < minute * 6 + 6)
      .map((a) => a - minute * 6);

  it("divides a minute into thirds, and counts only the minutes", () => {
    expect(minutes).toHaveLength(60);
    expect(minutes.map((m) => m.angle)).toEqual(
      chapterMarks().map((m) => m.angle),
    );
    // Two thirds in a gap between two plain minutes, all the way round.
    for (const minute of [1, 2, 3, 16, 17, 43, 57]) {
      expect(between(minute), `minute ${minute}`).toEqual([2, 4]);
    }
  });

  it("drops the third an hour's marker stands over", () => {
    // Beside an hour, one mark rather than two — and it is the far one, so
    // the rhythm of thirds carries on through the gap rather than shifting.
    expect(between(4)).toEqual([2]);
    expect(between(5)).toEqual([4]);
    expect(between(29)).toEqual([2]);
    expect(between(30)).toEqual([4]);
  });

  it("leaves the gaps either side of twelve bare", () => {
    // Twelve carries the widest hour of every marker style, and stands over
    // both thirds rather than one.
    expect(between(0)).toEqual([]);
    expect(between(59)).toEqual([]);
    // The minute at twelve itself stays: the track meets it squarely.
    expect(minutes.map((m) => m.angle)).toContain(0);
  });

  it("lays them in order, clockwise from twelve, within one turn", () => {
    const angles = marks.map((m) => m.angle);
    expect(angles).toEqual([...angles].sort((a, b) => a - b));
    expect(Math.min(...angles)).toBe(0);
    expect(Math.max(...angles)).toBeLessThan(360);
    // 120 thirds, less the one each of the eleven plain hours stands over on
    // either side, less both of twelve's two gaps.
    expect(thirds).toHaveLength(120 - 11 * 2 - 4);
  });
});

describe("easeInOutSine", () => {
  it("starts and ends at rest, fastest in the middle", () => {
    expect(easeInOutSine(0)).toBe(0);
    expect(easeInOutSine(1)).toBe(1);
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 10);
    // The speed is half a sine wave: nothing at either end, most in the
    // middle. Sampled as differences over the same small step.
    const step = 0.01;
    const speed = (t: number) => easeInOutSine(t + step) - easeInOutSine(t);
    expect(speed(0.5)).toBeGreaterThan(speed(0.2));
    expect(speed(0.2)).toBeGreaterThan(speed(0.02));
    expect(speed(0.5)).toBeGreaterThan(speed(0.8));
  });

  it("is clamped outside the run, so a late frame does not overshoot", () => {
    expect(easeInOutSine(-3)).toBe(0);
    expect(easeInOutSine(4)).toBe(1);
  });
});

describe("easeOutBack", () => {
  it("lands on the mark, having gone a little past it", () => {
    expect(easeOutBack(0)).toBe(0);
    expect(easeOutBack(1)).toBe(1);
    expect(easeOutBack(-1)).toBe(0);
    expect(easeOutBack(2)).toBe(1);
    const most = Math.max(
      ...Array.from({ length: 101 }, (_, i) => easeOutBack(i / 100)),
    );
    expect(most).toBeGreaterThan(1);
    expect(most).toBeLessThan(1.2);
  });
});

describe("onBeat", () => {
  it("rounds the moment down to the movement's beat", () => {
    // A quartz steps once a second, a calibre at 28 800 vph eight times, a
    // glide wheel not at all.
    expect(onBeat(10.9, 1)).toBe(10);
    expect(onBeat(10.9, 8)).toBe(10.875);
    expect(onBeat(10.9, null)).toBe(10.9);
    expect(onBeat(10.4, 8)).toBe(10.375);
  });

  it("is the clock rounded, not a count of beats, so it cannot drift", () => {
    // Whatever the loop's frame rate, the same moment is the same beat — a
    // late frame catches up rather than pushing the rate along.
    for (const beats of [1, 8]) {
      const gap = 1 / beats;
      for (const at of [0, 0.5, h(9) + 17.3, h(23, 59) + 59.99]) {
        const beat = onBeat(at, beats);
        expect(at - beat).toBeGreaterThanOrEqual(0);
        expect(at - beat).toBeLessThan(gap + 1e-9);
        // The beat sits on the rate's own grid.
        expect(Math.abs(beat * beats - Math.round(beat * beats))).toBeLessThan(
          1e-6,
        );
      }
    }
  });
});

describe("nameLockup", () => {
  it("sets a short name at full size, centred with its mark", () => {
    const l = nameLockup("Laps");
    expect(l.text).toBe("LAPS");
    expect(l.size).toBe(SIGNATURE.nameSize);
    expect(l.scale).toBe(1);
    expect(l.tracking).toBeCloseTo(NAME_TRACKING * SIGNATURE.nameSize);
    // Centred: the mark's left edge is half the lockup left of the centre.
    expect(l.markX).toBeCloseTo(-l.width / 2);
    expect(l.textX).toBeGreaterThan(l.markX + NAME_MARK);
    expect(l.width).toBeLessThan(NAME_LOCKUP_MAX);
  });

  it("sets a longer name smaller, to the widest the dial allows", () => {
    const short = nameLockup("Laps");
    const l = nameLockup("Stopwatch");
    expect(l.text).toBe("STOPWATCH");
    expect(l.width).toBeCloseTo(NAME_LOCKUP_MAX);
    expect(l.size).toBeLessThan(short.size);
    expect(l.markX).toBeCloseTo(-NAME_LOCKUP_MAX / 2);
    // The text runs from its start to the lockup's right edge, and its
    // advance is that plus the spacing after the last letter.
    expect(l.textX + l.textLength - l.tracking).toBeCloseTo(l.width / 2);
  });

  it("takes a character it has no width for at a typical capital's", () => {
    const l = nameLockup("Tid & Tår");
    expect(l.text).toBe("TID & TÅR");
    expect(Number.isFinite(l.width)).toBe(true);
    expect(l.width).toBeLessThanOrEqual(NAME_LOCKUP_MAX + 1e-9);
  });
});

describe("registers", () => {
  type Dial = Pick<
    DialConfig,
    "placement" | "markers" | "font" | "scale" | "ring"
  >;
  const every: Dial[] = [];
  for (const placement of DIAL_PLACEMENTS)
    for (const markers of DIAL_MARKER_STYLES)
      for (const font of DIAL_FONTS)
        for (const scale of DIAL_SCALES)
          for (const ring of DIAL_RINGS)
            every.push({ placement, markers, font, scale, ring });

  it("sit at three and nine, the minutes on the right and the hours on the left", () => {
    const r = registers(80, 80, 90);
    expect(r.minutes.cx).toBeGreaterThan(0);
    expect(r.hours.cx).toBe(-r.minutes.cx);
    expect(r.minutes.cy).toBe(0);
    expect(r.minutes.turn).toBe(3600);
    expect(r.hours.turn).toBe(12 * 3600);
  });

  it("are as big as the room the markers leave, within bounds", () => {
    expect(registers(200, 200, 200).minutes.r).toBe(27);
    expect(registers(10, 10, 10).minutes.r).toBe(15);
    expect(registers(70, 70, 90).minutes.r).toBeLessThan(
      registers(80, 80, 90).minutes.r,
    );
    // The ring is all the way round, so it bounds them on their own axis.
    const ringed = registers(200, 200, 70);
    expect(ringed.minutes.cx + ringed.minutes.r).toBeLessThan(70);
  });

  it("hide the marker on their own axis only when they would reach it", () => {
    expect(registers(80, 120, 120).hidden).toEqual([]);
    expect(registers(80, 60, 120).hidden).toEqual([3, 9]);
  });

  it("stay off the printing, the ring and the hub, on every dial", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const where = JSON.stringify(dial);
      for (const reg of [l.registers.minutes, l.registers.hours]) {
        const far = Math.abs(reg.cx) + reg.r;
        const near = Math.abs(reg.cx) - reg.r;
        expect(far, `${where} reaches the ring`).toBeLessThan(l.ringInner);
        expect(near, `${where} reaches the hub`).toBeGreaterThan(HANDS.cap * 4);
        // The name under twelve and the window above six are on the
        // vertical axis; the register's nearest point to either is its top
        // or bottom edge, out at its own centre.
        expect(reg.r, `${where} reaches the name`).toBeLessThan(
          SIGNATURE.name - SIGNATURE.nameSize,
        );
        expect(near, `${where} reaches the lockup`).toBeGreaterThan(0);
      }
    }
  });

  it("number the minutes at the quarters and the hours at three, six, nine and twelve", () => {
    const r = registers(80, 80, 90);
    expect(registerLabels(r.minutes).map((l) => l.label)).toEqual([
      "60",
      "15",
      "30",
      "45",
    ]);
    expect(registerLabels(r.hours).map((l) => l.label)).toEqual([
      "12",
      "3",
      "6",
      "9",
    ]);
    expect(registerLabels(r.hours).map((l) => l.angle)).toEqual([
      0, 90, 180, 270,
    ]);
  });
});

describe("readings", () => {
  it("move up for a stopwatch, down for a timer, and not at all held", () => {
    expect(readingAt({ value: 10, at: 1000, rate: 1 }, 3500)).toBe(12.5);
    expect(readingAt({ value: 10, at: 1000, rate: -1 }, 3500)).toBe(7.5);
    expect(readingAt(heldAt(10), 99_999)).toBe(10);
  });

  it("never go below nothing", () => {
    expect(readingAt({ value: 2, at: 0, rate: -1 }, 10_000)).toBe(0);
  });

  it("do not move before the moment they were taken at", () => {
    expect(readingAt({ value: 10, at: 5000, rate: 1 }, 4000)).toBe(10);
    expect(readingAt({ value: 10, at: 5000, rate: -1 }, 4000)).toBe(10);
  });
});

describe("chronoTurns", () => {
  it("puts the seconds round the dial, the minutes and the hours round their registers", () => {
    const t = chronoTurns(h(1, 12) + 41, null);
    expect(t.second).toBeCloseTo(41 * 6, 6);
    expect(t.minute).toBeCloseTo((12 + 41 / 60) * 6, 6);
    expect(t.hour).toBeCloseTo(((h(1, 12) + 41) / 3600) * 30, 6);
  });

  it("sweeps the registers with the reading, whatever the movement", () => {
    // Half a minute in, the minute hand is half way to the next mark.
    expect(chronoTurns(h(0, 4) + 30, null).minute).toBeCloseTo(4.5 * 6, 6);
    // A quartz's seconds hand waits for the beat; the registers do not.
    const a = chronoTurns(h(1, 4) + 30.3, 1);
    const b = chronoTurns(h(1, 4) + 30.6, 1);
    expect(b.second).toBeCloseTo(a.second, 6);
    expect(b.minute).toBeGreaterThan(a.minute);
    expect(b.hour).toBeGreaterThan(a.hour);
    // And on the way down they fall back between beats, too.
    const c = chronoTurns(h(0, 4) + 30.1, 1, -1);
    const d = chronoTurns(h(0, 4) + 30.0, 1, -1);
    expect(d.minute).toBeLessThan(c.minute);
  });

  it("wraps the minutes at the hour and the hours at twelve", () => {
    expect(chronoTurns(h(2, 0), null).minute).toBe(0);
    expect(chronoTurns(h(13, 0), null).hour).toBeCloseTo(30, 6);
  });

  it("steps a quartz down while it counts up, landed with a little past the mark", () => {
    const landed = chronoTurns(12.5, 1);
    expect(landed.second).toBeCloseTo(72, 6);
    const landing = chronoTurns(12.05, 1);
    expect(landing.second).not.toBeCloseTo(72, 1);
  });

  it("steps up while it counts down, so a timer's hand reads the second its figure does", () => {
    // 7.4 s left reads 0:08 — the hand is on eight until the eighth runs out.
    expect(chronoTurns(7.4, 1, -1).second).toBeCloseTo(8 * 6, 6);
    expect(chronoTurns(6.5, 1, -1).second).toBeCloseTo(7 * 6, 6);
    // And the step is landed from the second before, the way it came.
    expect(chronoTurns(6.95, 1, -1).second).toBeGreaterThan(7 * 6);
  });

  it("lands only on a beat it stepped to, not the one it set out on", () => {
    // Held on a whole second, the hand is on its mark — a quartz's would
    // otherwise sit a whole second short of it.
    expect(chronoTurns(12, 1, 1, 12).second).toBeCloseTo(72, 6);
    expect(chronoTurns(0, 8, 1, 0).second).toBe(0);
    // A timer set to five minutes and just started has not stepped yet.
    expect(chronoTurns(300 - 0.01, 8, -1, 300).second).toBeCloseTo(0, 6);
    expect(chronoTurns(300 - 0.01, 1, -1, 300).second).toBeCloseTo(0, 6);
    // Its first beat is landed from the one it left.
    expect(chronoTurns(300 - 0.13, 8, -1, 300).second).toBeGreaterThan(-0.75);
    expect(chronoTurns(299 - 0.01, 1, -1, 300).second).toBeGreaterThan(-6);
    // And a stopwatch's, from nothing.
    expect(chronoTurns(1.01, 1, 1, 0).second).toBeLessThan(6);
  });

  it("keeps a minute register on the right minute on the way down", () => {
    // 60.5 s left is 1:01: past the one-minute mark, one second round.
    const t = chronoTurns(60.5, 1, -1);
    expect(t.minute).toBeGreaterThan(6);
    expect(t.minute).toBeLessThan(12);
    expect(t.second).toBeCloseTo(6, 6);
  });
});

describe("glides", () => {
  const at = { hour: 40, minute: 120, second: 300 };

  it("are nothing for a tick", () => {
    expect(glidePlan(10, 10 + GLIDE_AFTER, at)).toBeNull();
    expect(glidePlan(10, 10 - 1, at)).toBeNull();
  });

  it("fly back for a reset and wind forward for a jump ahead", () => {
    expect(glidePlan(500, 0, at)?.dir).toBe(-1);
    expect(glidePlan(0, 500, at)?.dir).toBe(1);
  });

  it("start where the hands were and end where the reading puts them", () => {
    const plan = glidePlan(500, 0, at)!;
    const to = chronoTurns(0, null);
    const first = glideTurns(plan, to, 0);
    expect(first).toEqual(at);
    const last = glideTurns(plan, to, plan.ms);
    expect(((last.second % 360) + 360) % 360).toBeCloseTo(to.second, 6);
    expect(((last.minute % 360) + 360) % 360).toBeCloseTo(to.minute, 6);
  });

  it("travel the way the reading went, and never more than a turn", () => {
    const plan = glidePlan(500, 0, at)!;
    const mid = glideTurns(plan, chronoTurns(0, null), plan.ms / 2);
    expect(mid.second).toBeLessThanOrEqual(at.second);
    expect(mid.second).toBeGreaterThan(at.second - 360);
  });

  it("take long enough to see, and not long enough to wait for", () => {
    for (const gap of [3, 60, 3600, 36_000]) {
      const plan = glidePlan(0, gap, at)!;
      expect(plan.ms).toBeGreaterThanOrEqual(360);
      expect(plan.ms).toBeLessThanOrEqual(900);
    }
  });
});
