# Stopwatch

> Local-first stopwatches and timers, drawn on a chronograph watch face. Run as many as you like at once, name them, and set timers that count down on the same dial. No account, no server.

[![ci](https://github.com/niclaslindstedt/stopwatch/actions/workflows/ci.yml/badge.svg)](https://github.com/niclaslindstedt/stopwatch/actions/workflows/ci.yml)
[![pages](https://github.com/niclaslindstedt/stopwatch/actions/workflows/pages.yml/badge.svg)](https://github.com/niclaslindstedt/stopwatch/actions/workflows/pages.yml)
[![license](https://img.shields.io/badge/license-PolyForm--Noncommercial--1.0.0-blue.svg)](LICENSE)

## What

**Stopwatch** is a stopwatch and a kitchen timer that run entirely in your
browser. The main screen is a chronograph: the big hand from the centre counts
the seconds against a scale numbered 5 to 60, the small dial at three counts
the minutes and the one at nine the hours. Press the watch and it starts;
press it again and it holds; press it once more and it carries on. A light
behind the case beats while it counts.

Two tabs over the dial choose between the **stopwatch** and the **timer**. A
timer is set in hours and minutes under the dial — with a row of the lengths
a timer is most often set to, one minute to an hour — and counts down on the
same face: the hands go backwards, the bezel runs out in the accent colour,
and the line under the dial says when it will ring. When it runs out the
light turns the warning colour, a notice says so, and a chime and a buzz come
with it where the device has them.

Several can run at once. **New** puts a fresh one on the dial and leaves the
others going, and everything still out is listed under the controls, where
any of them can be held, carried on, reset, put away or brought up onto the
dial. **Put away** takes one off the main screen and onto its page — the
**Stopwatches** page or the **Timers** page — which lists every one you have,
running or put away. That is where they are named, started again and deleted.

Nothing about a reading is stored: the document holds, for each stopwatch and
timer, the time banked and the moment the current stretch started, and every
figure is derived from those at read time. A stopwatch started on the phone is
the same stopwatch, at the same reading, the moment the document reaches the
laptop.

The same app ships to the **App Store** and **Google Play** through a thin
native wrapper in [`native/`](native/README.md) — the whole web build packed
inside the download and served from the device, so it runs with no network at
all. On a phone that gains one thing a browser cannot: **iCloud**, as an
option beside Dropbox, keeping the document in your own container under
Files → iCloud Drive → Stopwatch. There is a desktop download for Windows,
macOS and Linux too ([`tauri/`](tauri/README.md)).

It is built on [`@niclaslindstedt/oss-framework`](https://github.com/niclaslindstedt/oss-framework),
the shared React/Preact surface behind the sibling
[time](https://github.com/niclaslindstedt/time),
[contacts](https://github.com/niclaslindstedt/contacts) and
[period](https://github.com/niclaslindstedt/period) apps — same storage
adapters, same theme engine, same PWA update lifecycle.

## Why

- **It stays on your device.** Your stopwatches and timers live in your
  browser's localStorage, and leave the device only if you connect **your
  own** iCloud or Dropbox — to a folder you can open, in a JSON file you can
  read — or your own [storage server](https://github.com/niclaslindstedt/storage),
  end-to-end encrypted so the server cannot read it. No analytics, no
  telemetry, no third-party requests at runtime — not even for the chime,
  which the browser makes on the spot.
- **One press.** The whole watch is the button. Nothing to find, nothing to
  aim at with a thumb while the other hand is busy.
- **A watch worth looking at.** Nine dials, or one of your own put together
  piece by piece: eight faces, nine typefaces, nine marker styles, two rings,
  two sets of hands, three movements, and a light behind the case.
- **Works offline, installs as an app.** A PWA with a self-updating service
  worker; the network is never on the critical path.

## Prerequisites

- Node.js ≥ 22 (CI pins 24 — see `.nvmrc`), npm ≥ 10
- A GitHub personal access token with `read:packages` in `~/.npmrc` — the
  `@niclaslindstedt/oss-framework` dependency resolves from GitHub Packages

## Install

```sh
npm config set //npm.pkg.github.com/:_authToken <your-token>
git clone https://github.com/niclaslindstedt/stopwatch.git
cd stopwatch
npm install
```

Or just open the hosted app at
[stopwatch.niclaslindstedt.se](https://stopwatch.niclaslindstedt.se/) and install it
from your browser's "Add to Home Screen" / install prompt — it is a PWA and
works fully offline.

## Quick start

```sh
npm run dev
```

Open the printed URL. The app opens on the **Watch**: press the dial and a
stopwatch starts, named "Stopwatch 1". Press it again to hold it, and once
more to carry on. Switch to the **Timer** tab, set it for five minutes with
the steppers or the **5m** chip, and press the dial; the timer counts down on
the same face and rings when it gets there. The **Stopwatches** and
**Timers** pages list every one you have made.

To open it on a demo instead — an afternoon with a few things on the go, held
in memory and never written to the browser — run `make demo`
(`VITE_SEED=demo`).

To try the production build the way it deploys:

```sh
npm run build && npm run preview
```

The commands a contributor uses:

```sh
make build        # production build
make demo         # dev server on the in-memory demo document
make test         # the test suite (vitest)
make lint         # eslint + tsc --noEmit
make fmt          # prettier --write (fmt-check verifies)
make icons        # regenerate the PWA icons, favicon and og image
make shots        # build, then photograph the dial in a few states into shots/
```

The native wrapper is a separate project with its own dependencies — a root
`npm install` does not touch it:

```sh
make native-install      # install the wrapper's dependencies
make native-bundle       # build the web app into native/assets/webroot.zip
make native-typecheck
```

See [`native/README.md`](native/README.md) for running it on a device, and
[`native/RELEASING.md`](native/RELEASING.md) for a store build. The desktop
shell has its own Rust toolchain: `make tauri` builds the site into it and
runs it — see [`tauri/README.md`](tauri/README.md).

## Usage

Three places to be. On a phone held upright they are the bottom bar — swipe
left or right to move between them; laid on its side they go to the top,
leaving the height to the watch; on a desk (a window 1024px or wider) they are
tabs on the top bar, and Settings slides in over the right-hand edge.

| Tab             | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Watch**       | The chronograph, with two tabs over it — **Stopwatch** and **Timer**, each with its glyph. The big hand is the seconds, the register at three the minutes and the register at nine the hours (both sweep with the reading, frame by frame). The whole watch is the switch: press it to start the one on the dial, again to hold it, again to carry on; on a fresh one, the press is what makes it. A light behind the case beats while it runs. Under the dial, the reading, its name and its state — or, for a running timer, when it will ring. Under that, the controls: **New** (a fresh one on the dial, leaving the others running), **Reset** (back to zero, or to the top of a timer) and **Put away** (held and off this screen, onto its page). On the Timer tab, while a timer is fresh or reset, an hours and a minutes stepper and the quick lengths 1m, 3m, 5m, 10m, 15m, 30m and 1h set it. A timer that runs out turns the light and its row the warning colour; pressing the dial or **Put away** silences it. Below the controls, the ones still out — a scroll down on a phone, the right-hand column on a wide screen: press a name to put it on the dial. The dial carries the app's name under twelve, the movement's word under that, and the Settings cog in a window above six. |
| **Stopwatches** | Every stopwatch you have: the active ones first, then the ones put away — which appear only here, and are started again from here, from zero. Each row has its name as a field, so a name is edited in place; its reading, ticking while it runs; and its buttons — start or hold, reset, put away, delete (with a confirmation, because it is removed from every device it syncs to).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Timers**      | The same page for timers, each row with the time it has left and what it was set for. A timer started again from here starts from the top of its time.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

…and one button for the screen you visit and leave — on the dial over the
Watch, and on the top bar everywhere else:

| Button | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **⚙**  | Settings: theme; the dial (nine presets, or a custom face, markers, numerals and their size and placement, ring, hands and movement, each face with a backlight of its own) and its size; reflections on its metal as you tilt the device; the clock a timer's ringing time is told on (12- or 24-hour, following the device's region unless you choose); what a timer does when it runs out (chime, vibrate); cloud sync (Dropbox, your own storage server, and iCloud in the app-store build); backup / restore / delete; developer tools; and the build. |

On a phone laid on its side and left alone on the watch, everything but the
watch fades out after a few seconds, and the first touch brings it back.

### Keyboard shortcuts

On a desk, a bare key (no ⌘, Ctrl, Alt or Shift) reaches the watch. They
stand down while a field or a dialog has the keyboard.

| Key     | Does                                    |
| ------- | --------------------------------------- |
| `S`     | Press the dial: start, hold or carry on |
| `N`     | A fresh one on the dial                 |
| `R`     | Reset the one on the dial               |
| `1`/`2` | The Stopwatch tab / the Timer tab       |
| `,`     | Settings                                |
| `Enter` | In a dialog, save it (`Escape` cancels) |

## Configuration

The app needs no configuration to run. These are read at build time; leaving
the Dropbox key unset simply hides that provider:

| Variable                  | Effect                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `VITE_DROPBOX_APP_KEY`    | Enables the Dropbox backend. A public PKCE client id — there is no secret to protect.                        |
| `VITE_DROPBOX_APP_FOLDER` | Folder name the document is filed under (default `stopwatch`).                                               |
| `VITE_BASE`               | Deploy base path (default `/`).                                                                              |
| `VITE_EDITION`            | `store` for the build sold in the App Store, which carries no link back to the source. Default: the website. |
| `APP_DISPLAY_NAME`        | An app build's name, shown in the app: the listing's. The website always says `Stopwatch`.                   |
| `VITE_SEED`               | `demo` boots onto the in-memory demo document (`make demo`, the store screenshots). Never set for a release. |

iCloud takes no variable at all: it is offered by the native wrapper's host,
so it appears in the app-store build and nowhere else.

See [`docs/configuration.md`](docs/configuration.md) for the details, the
runtime settings and the storage keys.

## Examples

A stopwatch is a pure value — the time banked, and when the current stretch
started — and every reading is a function of it and a moment, so it runs
anywhere, no DOM required:

```ts
import {
  elapsed,
  newTimer,
  pause,
  remaining,
  start,
  timerState,
} from "./src/app/watch.ts";

const at = (minutes: number) => Date.UTC(2026, 0, 1, 12, minutes);
const stamp = (ms: number) => new Date(ms).toISOString();

// A five-minute timer, started at noon.
let pasta = newTimer("t1", "Pasta", 5 * 60_000, at(0), stamp(at(0)));
remaining(pasta, at(2)); // → 180000 — three minutes left

pasta = pause(pasta, at(2), stamp(at(2))); // the phone rang
remaining(pasta, at(30)); // → 180000 — held, so still three
pasta = start(pasta, at(30), stamp(at(30)));
timerState(pasta, at(33)); // → "done"
elapsed(pasta, at(33)); // → 300000
```

Nothing here reads the clock — `now` is always passed in, which is what lets
the tests pin real moments and what makes a stopwatch started on another
device read right the moment the document arrives. See
[`docs/architecture.md`](docs/architecture.md).

## Troubleshooting

| Symptom                                      | Fix                                                                                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm install` fails with `401 Unauthorized`  | The framework comes from GitHub Packages — see Prerequisites.                                                                      |
| A timer ran out and made no sound            | A browser plays sound only after the page has been touched, and only while it is open. Check **Settings → When a timer runs out**. |
| A stopwatch is missing from the Watch screen | It was put away. It is on the **Stopwatches** page, under **Put away**, where it can be started again.                             |
| The timer steppers are gone                  | A timer is set while it is fresh or reset. Press **Reset**, or **New** for another one.                                            |
| Cloud sync shows "Reconnect needed"          | The provider's session lapsed. Tap the sync glyph → Reconnect.                                                                     |

More in [`docs/troubleshooting.md`](docs/troubleshooting.md).

## Documentation

- [Getting started](docs/getting-started.md)
- [The watch](docs/features/watch.md) — the main screen, the dial and its controls
- [Stopwatches](docs/features/stopwatches.md) and [Timers](docs/features/timers.md) — the two pages, and what a timer does when it runs out
- [Themes and the dial](docs/features/themes.md)
- [Configuration](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [Sync](docs/sync.md) and [cloud sync, for a reader](docs/features/cloud-sync.md)
- [The app on a phone](docs/features/native-app.md) — the native wrapper and iCloud
- [The desktop app](docs/features/desktop-app.md)
- [Troubleshooting](docs/troubleshooting.md)
- [`AGENTS.md`](AGENTS.md) — conventions for humans and coding agents

## Contributing

Bugs and feature requests go to
[Issues](https://github.com/niclaslindstedt/stopwatch/issues); open-ended
questions to [Discussions](https://github.com/niclaslindstedt/stopwatch/discussions).
See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow, and
[`SECURITY.md`](SECURITY.md) for private vulnerability reporting.

## License

[PolyForm Noncommercial 1.0.0](LICENSE) © Niclas Lindstedt.
