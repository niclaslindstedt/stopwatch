// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  commandFor,
  KEY_HINT,
  savesModal,
  type Modifiers,
} from "../src/app/shortcuts.ts";

const bare: Modifiers = { alt: false, ctrl: false, meta: false, shift: false };

describe("commandFor", () => {
  it("maps S to the dial, in either case", () => {
    expect(commandFor("s", bare)).toEqual({ kind: "toggle" });
    expect(commandFor("S", bare)).toEqual({ kind: "toggle" });
  });

  it("maps N to a new one and R to a reset", () => {
    expect(commandFor("n", bare)).toEqual({ kind: "new" });
    expect(commandFor("r", bare)).toEqual({ kind: "reset" });
  });

  it("maps 1 and 2 to the two tabs, and nothing else among the digits", () => {
    expect(commandFor("1", bare)).toEqual({ kind: "mode", mode: "stopwatch" });
    expect(commandFor("2", bare)).toEqual({ kind: "mode", mode: "timer" });
    expect(commandFor("3", bare)).toBeNull();
    expect(commandFor("0", bare)).toBeNull();
  });

  it("maps the comma to settings", () => {
    expect(commandFor(",", bare)).toEqual({ kind: "settings" });
  });

  it("leaves a key held with a modifier to the browser", () => {
    for (const mod of ["alt", "ctrl", "meta", "shift"] as const) {
      expect(commandFor("s", { ...bare, [mod]: true })).toBeNull();
    }
  });

  it("ignores named keys and everything unmapped", () => {
    expect(commandFor("Enter", bare)).toBeNull();
    expect(commandFor("x", bare)).toBeNull();
  });

  it("prints the key each command is on", () => {
    expect(KEY_HINT.toggle).toBe("S");
    expect(commandFor(KEY_HINT.new, bare)).toEqual({ kind: "new" });
    expect(commandFor(KEY_HINT.reset, bare)).toEqual({ kind: "reset" });
    expect(commandFor(KEY_HINT.settings, bare)).toEqual({ kind: "settings" });
  });
});

describe("savesModal", () => {
  it("saves on a bare Enter from a field", () => {
    expect(savesModal("Enter", bare, "field")).toBe(true);
  });

  it("saves on a bare Enter from the card itself", () => {
    expect(savesModal("Enter", bare, "card")).toBe(true);
  });

  it("leaves Enter to a control that already answers it", () => {
    expect(savesModal("Enter", bare, "control")).toBe(false);
  });

  it("stands down under any modifier", () => {
    expect(savesModal("Enter", { ...bare, meta: true }, "field")).toBe(false);
    expect(savesModal("Enter", { ...bare, ctrl: true }, "field")).toBe(false);
    expect(savesModal("Enter", { ...bare, alt: true }, "field")).toBe(false);
    expect(savesModal("Enter", { ...bare, shift: true }, "field")).toBe(false);
  });

  it("is Enter and nothing else — Escape is the modal's own", () => {
    expect(savesModal("Escape", bare, "field")).toBe(false);
    expect(savesModal(" ", bare, "field")).toBe(false);
    expect(savesModal("Return", bare, "field")).toBe(false);
    expect(savesModal("s", bare, "field")).toBe(false);
  });
});
