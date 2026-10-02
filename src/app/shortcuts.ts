// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import type { WatchKind } from "./types.ts";

// The keyboard, on a desk. A phone is used with a thumb; a desktop has a
// keyboard under both hands, and an app that lives in a tab all day should
// answer it. The set is deliberately small — the things done several times a
// day — and every key is printed on the control it drives, so nothing has to
// be looked up.
//
//   S      start, hold or carry on — the dial pressed
//   N      a new one on the dial
//   R      the one on the dial back to zero
//   1 / 2  the stopwatch tab / the timer tab
//   ,      settings (the one every desktop app agrees on)
//
// A bare key only. Anything held with it — ⌘, Ctrl, Alt — is the browser's
// or the OS's, and Shift is left out so a capital S is still the same S.
// Whether the press should be honoured at all (a field has focus, a dialog is
// open) is the caller's question: this module maps a key to a command and
// nothing else, which is what keeps it testable.

export type Command =
  /** The dial pressed: start, hold or carry on. */
  | { kind: "toggle" }
  /** A fresh one on the dial. */
  | { kind: "new" }
  /** The one on the dial back to zero. */
  | { kind: "reset" }
  /** One of the main screen's two tabs. */
  | { kind: "mode"; mode: WatchKind }
  | { kind: "settings" };

export type Modifiers = {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
};

/** The key printed on a control, for the hint beside its label. */
export const KEY_HINT = {
  toggle: "S",
  new: "N",
  reset: "R",
  stopwatch: "1",
  timer: "2",
  settings: ",",
} as const;

/** What a key press asks for, or nothing. */
export function commandFor(key: string, mods: Modifiers): Command | null {
  if (mods.alt || mods.ctrl || mods.meta || mods.shift) return null;
  if (key.length !== 1) return null;
  switch (key.toLowerCase()) {
    case "s":
      return { kind: "toggle" };
    case "n":
      return { kind: "new" };
    case "r":
      return { kind: "reset" };
    case "1":
      return { kind: "mode", mode: "stopwatch" };
    case "2":
      return { kind: "mode", mode: "timer" };
    case ",":
      return { kind: "settings" };
    default:
      return null;
  }
}

/** The kind of control a modal's key press landed on. */
export type Focused =
  /** A one-line field: a name, a number, a time. */
  | "field"
  /** Something Enter already does a job in: a button, a link, a textarea, a
   *  select, a contenteditable. */
  | "control"
  /** Nothing in particular — the modal's own card. */
  | "card";

/** Whether a key press inside a modal is asking for it to be saved. */
export function savesModal(key: string, mods: Modifiers, on: Focused): boolean {
  if (key !== "Enter") return false;
  if (mods.alt || mods.ctrl || mods.meta || mods.shift) return false;
  return on !== "control";
}
