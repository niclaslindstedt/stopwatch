# Agent guidance for stopwatch

This file is the canonical source of truth for AI coding agents working in this
repo. `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `GEMINI.md`, and
`.github/copilot-instructions.md` are symlinks to this file.

Fleet guidelines: APP_GUIDELINES 1.2.0

## What this app is, and the one rule that follows from it

Stopwatch keeps stopwatches and timers — what somebody is timing, named by
them, and when they started it. Small as that is, the whole design premise is
that it never leaves the device unless its owner explicitly connects their own
cloud account.

**So: never add a network call that isn't the user's own cloud backend.** No
analytics, no error reporting service, no font CDN, no "anonymous" telemetry,
no third-party script — not behind a flag, not in dev only. If a change would
send a byte of the document, or a byte _about_ the document, anywhere the user
did not choose, it is the wrong change however useful the feature is. This is
the constraint the README and the privacy copy promise; it outranks
convenience.

## Build and test commands

```sh
make install       # npm install (needs GitHub Packages auth — see below)
make build         # production build (vite build)
make demo          # dev server on the in-memory demo document (VITE_SEED=demo)
make test          # full test suite (vitest)
make lint          # eslint + tsc --noEmit
make fmt           # prettier --write
make fmt-check     # verify formatting (CI)
make icons         # regenerate the PWA icons, favicon, and og image
make shots         # build + photograph the dial in a few states into shots/, with a contact sheet (ARGS="…" for options)

make native-install    # install the native wrapper's own dependencies
make native-bundle     # build the web app into native/assets/webroot.zip
make native-typecheck  # tsc over native/
make native-prebuild   # regenerate native/ios + native/android from the config
```

The desktop shell in `tauri/` is a Rust project with its own toolchain; `make
test` and `make lint` stop at its edge:

```sh
make tauri                # bundle the site into the shell and run the desktop app
make tauri-test           # its decision layer (cargo test -p stopwatch-shell — no GUI libs)
make tauri-lint           # clippy at zero warnings, both crates
make tauri-fmt            # rustfmt in place (tauri-fmt-check verifies)
make tauri-package        # this machine's installers
make tauri-package-debug  # …debug profile: minutes faster, much bigger
```

It is a **thin** wrapper: a window, the built site served from a private
`stopwatch://` scheme, and one capability a page cannot have — the loopback listener
that lets Dropbox sign in (`tauri/shell/src/oauth.rs`,
`tauri/src-tauri/src/loopback.rs`). **The page is never told it is inside it**
— no injected global, no Tauri command. `tauri/shell/` holds every decision and
needs no GUI toolkit; `tauri/src-tauri/` holds every effect. One seam reaches
back into this tree, `VITE_SHELL_BUILD`, set by the shell's site build — and
by the phone wrapper's, which is the same shape of thing — which switches off
the service-worker half of `appPwa` and — through `__SHELL_BUILD__` — the
in-app update prompt. A desktop or phone build updates by being replaced, and
both bundle scripts refuse a webroot holding `sw.js`. The desktop build, and
the phone wrapper's store edition (`VITE_EDITION=store`),
are builds that are not the website: they carry no link back to the source
(by owner decision) — no Open Graph tags naming the web edition, no `CNAME`
and no `og.png` (`websiteOnly` in `vite.config.ts`) — and both bundle scripts
refuse a webroot that still contains `niclaslindstedt`. The package's name and identifier come from `APP_DISPLAY_NAME` and
`APP_BUNDLE_ID` at packaging time (`tauri/scripts/package.mjs`), like the phone
app's. See [`tauri/README.md`](tauri/README.md).

The `@niclaslindstedt/oss-framework` dependency comes from the **GitHub
Packages** npm registry (see `.npmrc`). GitHub Packages requires auth even for
public packages, so local installs need a `read:packages` token in `~/.npmrc`
(`//npm.pkg.github.com/:_authToken=<token>`); CI authenticates with the
workflow's `GITHUB_TOKEN`.

### Dependency install in web sessions

Claude Code on the web runs `.claude/hooks/session-start.sh` on `SessionStart`
(wired up in `.claude/settings.json`), so **dependencies install automatically
in the background** — an agent shouldn't run `make install` by hand first. The
hook resolves a GitHub Packages token from the environment
(`NODE_AUTH_TOKEN` / `GITHUB_PAT` / `GH_TOKEN` / `GITHUB_TOKEN`, first wins),
writes it to `~/.npmrc`, and runs `npm install` — the committed project
`.npmrc` stays token-free. It runs in **async** mode, so `node_modules` may
still be populating for a moment after the session opens; if a `make` target
fails on a missing dependency, wait and retry. The hook is a no-op outside the
web environment (`CLAUDE_CODE_REMOTE`), so it never touches a local developer's
npm config.

## Commit and PR conventions

- All commits follow [Conventional Commits](https://www.conventionalcommits.org/).
- PRs are squash-merged; the **PR title** becomes the single commit on `main`,
  so it must follow conventional-commit format.
- Breaking changes use `<type>!:` or a `BREAKING CHANGE:` footer.

### Watching a PR after you open it

Don't babysit a PR with polling. **Do not** schedule `send_later`, cron jobs,
`ScheduleWakeup`, or timed self-check-ins to re-check CI or merge state — those
just burn turns. Open the PR, confirm the checks you can see are green, then
stop. CI failures and review comments are delivered to the session as webhook
events, so you'll be woken when there's actually something to act on.

## Architecture summary

This is a **frontend-only, local-first PWA** — there is no server. It is built
on [`oss-framework`](https://github.com/niclaslindstedt/oss-framework), the
same shared surface behind the sibling `contacts` and `period` apps.

The framework owns the UI kit and the generic mechanics: modals, form
primitives, the theme engine, the charts, the bottom bar and the tab-paging
swipe, the storage adapters (localStorage / Dropbox / a self-hosted
storage server's encrypted namespaces), the i18n
runtime, logging, the toast store, and the PWA update state machine. What
stays here is the vocabulary — what a stopwatch and a timer are, what a press
on the dial does, and how a chronograph face is drawn.

The app was born from the sibling `time` app (a time report) and keeps its
shell, its watch faces, its wrappers and its sync whole; what it dropped is
the day — projects, breaks, kinds of work, the log, the report and the
exports.

### The renderer is Preact

`preact` is the only renderer dependency — **never add `react` or `react-dom`
back.** `@preact/preset-vite` compiles JSX against `preact/jsx-runtime` and
aliases `react` / `react-dom` (and their `/jsx-runtime` + `/client` subpaths)
onto `preact/compat`; `tsconfig.json` `paths` and `package.json` `overrides`
mirror that for `tsc` and npm, so the framework — which is built against React
— resolves to Preact too. App code keeps importing hooks and types from
`"react"`, which is the supported compat path; only `src/main.tsx` uses
Preact's own `render`. Two differences bite in new code: use `e.currentTarget`
rather than `e.target` in event handlers, and spell string-valued attributes
like SVG's `focusable` as `"false"` rather than a JSX boolean.

### The app owns the domain ("store stays in the app")

- `src/app/types.ts` — the model. A `Run` is banked time plus, while it is
  going, the moment it was started (`startedAt`, **epoch milliseconds** — a
  stopwatch started on the phone has to be the same stopwatch on the laptop,
  whatever zone either is set to), a name, whether it has been put away
  (`stopped`) and an optional tombstone (`deleted`). A `Stopwatch` is a run; a
  `Timer` is a run with a `duration`. The document is `stopwatches` and
  `timers`, keyed by id, and nothing else.
- `src/app/watch.ts` — what a run reads and the edits made to it. Readings:
  `elapsed` (bank + the stretch under way), `remaining`, `isDone`, `endsAt`,
  the states (`stopwatchState`: running / paused / idle / stopped;
  `timerState` adds done), `timerLeft` (the bezel's share), the lists
  (`listOf`, `activeOf` — newest first, a tombstone never shown) and
  `focusedOf`, which one of a kind the dial shows. Edits, each a run in and a
  run out with the timestamp handed in: `start`, `pause`, `toggle`, `reset`,
  `stop` (put away), `restart`, `rename`, `setDuration`, `remove` (a
  tombstone). A timer that has run out starts again from the top, and banks
  no more than its duration. **Pure and clock-free** — `now` is a parameter.
- `src/app/clock.ts` — the chronograph's geometry: the scale numbered in
  seconds (`secondsLabel`, `ROMAN_HOURS` — 60 at the top, V to LX in Roman),
  `FACE_R` (the face less a thin margin, `EDGE_RESERVE`, which the time report
  this was drawn from kept its day on), `placementOf` — where a dial's markers
  _actually_ sit, which is inside a printed ring whatever the setting says —
  `dialLayout` — where the ring, the markers, the big hand and the two
  **registers** sit for a given dial — `registers`, which sizes the minute
  register at three and the hour register at nine to the room the markers and
  the ring leave, and hides the marker on their axis when one would reach it
  (`hidden`), `chapterTracks` and `chapterMarks` (the printed seconds ring),
  and `handPoint`, the point at the end of a hand as an _angle_. Also how the
  hands **move**: a `Reading` is a number of seconds, the moment it was taken
  and a rate (+1 a stopwatch, −1 a timer, 0 held), `readingAt` is where it is
  now, `chronoTurns` is the three hands for it — the seconds stepped to the
  movement's beat (down while counting up, up while counting down, so a
  timer's hand reads the second its figure does) and landed with
  `easeOutBack`, the minute register jumping a minute at a time, the hour
  register creeping — and `glidePlan` / `glideTurns` are the fly-back of a
  reset and the wind after a sleeping tab: each hand travels the way the
  reading went, never more than a turn, on `easeInOutSine`. Pure.
- `src/app/look.ts` — the app's two themes, and the dial's vocabulary: the
  eight faces (each with its own `chrono` colour for the seconds hand), nine
  typefaces, nine marker styles, eight marker sizes, three placements, two
  rings (a groove, or the printed seconds ring), two shapes of hand, three
  movements, and the nine presets they combine into. Also `STEEL`,
  `markerProfile`, and the backlight: `BACKLIGHT_CEILING`, `glowAlpha`,
  `FACE_BACKLIGHT` and `resolveBacklight`. Every option is an id and a spec,
  so the settings can validate and the tests can walk them.
- `src/app/sheen.ts` — where the light is, and what it does to the dial's
  metal (`facetTone`, `domeSheen`, `steelTone`, `sheenTurn`). Pure.
  `useTilt.ts` is what moves the light.
- `src/app/format.ts` — a stopwatch's reading to the tenth (`formatElapsed`,
  rounded down), a timer's time left (`formatRemaining`, rounded _up_, the
  way a kitchen timer reads), how long a timer is set for (`formatDuration`)
  and when it rings on the reader's clock (`formatClock`).
- `src/app/locale.ts` — the reader's clock (`hourCycleOf`), resolved against
  the "auto" setting; `App.tsx` hands it to `setLocalePrefs` once a render.
- `src/app/appName.ts` — the name the app shows: the listing's
  (`APP_DISPLAY_NAME`, handed in as `__APP_NAME__`) in an app build,
  `Stopwatch` on the website. `clock.ts`'s `nameLockup` sets it under twelve.
- `src/app/merge.ts` — the per-record, last-edit-wins document merge that
  both cloud sync and backup restore run through. A removed one is a
  tombstone, so a sync never brings it back.
- `src/app/migrations.ts` — parse / normalise / serialize; the only module
  that trusts stored bytes.
- `src/app/useDocStore.ts` — the document store, over a `DocBackend` seam
  rather than `localStorage` directly (which is what demo data swaps).
- `src/app/useWatches.ts` — the edits the screens make, in one place: the
  dial's press (`press` — start a fresh one, hold, carry on, or silence a
  timer that has run out, which puts it away), the rows' buttons, rename,
  remove, and setting a timer. Each is one of `watch.ts`'s edits handed the
  moment of the press. A fresh stopwatch or timer is **not a record until it
  is started**: the dial draws it at zero (or at the time it is set for) and
  the press that starts it is the press that makes it.
- `src/app/useAlarm.ts` — a timer that runs out says so whichever screen is
  open: a notice, a chime made on the spot with Web Audio (no file, no
  fetch), and a buzz. Once per run, and only for one that ran out within the
  last minute (`justRung`, tested), so a reload the next day is quiet.
- `src/app/cloudHost.ts` — the seam a **host** fills to offer the app a
  document store of its own, which today means iCloud. The question it asks
  is about **capability, not identity**. `createCloudHostAdapter` turns a
  host into an ordinary `StorageAdapter`; validates every host before
  trusting it.
- `src/app/selfHosted.ts` / `useSelfHosted.ts` — the reader's **own storage
  server** as a fourth backend: pairing codes (pasted, scanned in the phone
  app, or the `#oss=` app link), the device's name, and which namespace holds
  `stopwatch.json`. The keys stay in the framework's key vault — never add
  them to localStorage, logs or a backup — and the server only ever gets
  ciphertext. The sheets are `SelfHostedConnectModal.tsx` and
  `SelfHostedSettings.tsx`.
- `src/app/useSyncEngine.ts` — the sync engine over the framework's storage
  adapters (debounced push, conflict / auth / throttle handling). Suspended
  wholesale while demo data has taken over storage.
- `src/app/useTilt.ts` — the one place the device's orientation is read.
  **The readings never leave the frame they are drawn in.**
- `src/app/useNow.ts` — the one place the clock is read: `useNow(ms)` ticks
  at the rate a screen asks for and re-reads on focus; `nowExact` is the
  moment for the hands' frame loop and for an edit's timestamp.
- `src/app/useHands.ts` — the frames behind `clock.ts`'s hands. A
  `requestAnimationFrame` loop reads the clock, works out the reading and the
  three rotations, and writes them straight onto the elements — the hands are
  off the render loop entirely, because a movement is a rate and a rate
  chased by a CSS transition hesitates. The reading comes in through a ref, so
  a new one (paused, reset, another one on the dial) reaches the running loop
  on its next frame; a jump becomes a glide, and the shadow under the hands
  comes off while they travel.
- `src/app/dev/` — the developer "Demo data" switch: an invented afternoon
  (`demoData.ts`, pure, every moment an offset from the one it opens at), the
  in-memory `DocBackend` that serves it, and the never-persisted flag. Behind
  `import()`, so a production user never downloads it.
- `src/app/WatchScreen.tsx`, `ListScreen.tsx`, `SettingsScreen.tsx` — the
  screens. The **watch** is the main screen: two tabs with glyphs over the
  dial (stopwatch, timer), the controls under it (New, Reset, Put away, and a
  timer's hours and minutes while it is fresh or idle), and below them the
  ones still out — a scroll down on a phone, the right-hand column on a wide
  screen. `ListScreen` is both pages, every stopwatch and every timer: the
  ones out first, then the ones put away, which are listed only there and are
  started again from there; it is where they are named. Settings is reached
  from the cog — on the dial over the watch, and on the top bar everywhere
  else.
- `src/app/WatchFace.tsx` — the dial on the main screen, and the switch: the
  whole watch is the button. Behind the case is the backlight — beating while
  the watch on the dial runs, off while it is held, beating fast in the flag
  colour while a timer rings. The window above six is the cog.
- `src/app/Dial.tsx` — the watch face, drawn: bezel (a timer's time left, in
  the accent), face, track, the dial's own ring, markers (the one on a
  register's axis left off when `registers` says so), the printing — the
  app's mark and name under twelve, the movement's word under them, and a
  window above six with the cog — the two registers (a sunken floor with a
  turned finish, their marks and numbers, and a steel hand each), and the big
  seconds hand in the face's `chrono` colour. Paint only, so the same drawing
  serves the main screen and the preset cards in Settings.
- `src/app/WatchRow.tsx` — one stopwatch or timer as a row, shared by the
  running list and the two pages; `LiveReading` ticks its own figure at the
  rate it needs, so the screen around it is never re-rendered for a digit.
- `src/app/shortcuts.ts` — key → command, pure and tested: `S` the dial, `N`
  a new one, `R` reset, `1` / `2` the two tabs, `,` settings.
  `useShortcuts.ts` binds it to the window and stands down while a field or a
  dialog has the keyboard. It also holds `savesModal`, which `useModalSave.ts`
  binds for `ModalHeader`.
- `src/app/shape.ts` / `useShape.ts` — what shape the window is: a `phone`,
  a `stand` (the phone laid on its side) or a `desk`. `useWide` is the pair
  of shapes that stand the watch's controls beside the dial.
- `src/app/useFocus.ts` — focus mode, the stand's alone: the phone propped up
  on the watch and left untouched, where everything but the dial fades out and
  the first press brings it back. `[data-focus="on"]` in `styles.css` is what
  fades.
- `src/app/SidePanel.tsx` — Settings on the desk, over the right-hand edge,
  so the dial changes live as a face is picked.
- `src/app/DialPicker.tsx` — Settings' dial picker: the nine preset cards,
  each a `Dial` of its own held at a reading, and the pickers under Custom.
- `src/app/TopBar.tsx`, `BottomNav.tsx` — the shell's two bars. Over the
  watch the dial carries the wordmark and the cog, so the bar draws neither,
  and on the phone — where that leaves it empty unless there is a cloud to
  show — `App.tsx` leaves it out (`topBarNeeded`).
- `src/app/ModalHeader.tsx` — the top bar of every modal that is saved or
  abandoned.
- `src/app/i18n/en.ts` — every user-facing string.
- `src/output.ts` — the central output module; no bare `console.*` outside it
  and the log store.
- `pwa-plugin.ts` — emits the service worker + version/precache manifests the
  framework's `usePwaUpdate` consumes.

Dependency direction: screens → stores → framework. Nothing imports from the
framework's internals — only its published subpaths.

### Derive, don't store

Nothing about a reading is persisted — not the elapsed time, not the time
left, not whether a timer has gone off. The document holds runs and only runs;
everything else is recomputed from `watch.ts` at the moment it is shown. That
is why a stopwatch started on one device reads right on another the moment the
document lands, and why there is no ticking counter to drift or to sync.
**Adding a derived field to `AppData` is almost always the wrong fix** — the
right one is a function in `watch.ts`.

### One reading, every screen

The dial, the line under it, the running list, the pages and the window's
title are renderings of the _same_ `elapsed` / `remaining`. Do not add a
second counter for any of them — a list that says 1:02 under a dial whose
hands say 1:03 is the one failure this arrangement exists to make impossible.

### Keep the readings clock-free

`watch.ts` and `clock.ts` never call `Date.now()` or `new Date()`. `now` is a
parameter, supplied by `useNow` (which refreshes on focus) or `nowExact` (the
frame loop, and the moment of an edit). Keep it that way: it is what lets the
tests pin real times without fake timers.

### Which watch is on the dial is a setting, not data

Which stopwatch and which timer the dial shows is per device
(`focusStopwatch` / `focusTimer` in `useAppSettings.ts`), and so is which tab
is open; the runs themselves are in the document, so they sync and back up. A
focus that points at one put away or removed falls back to the newest one
still out (`focusedOf`), and `"new"` is a fresh one waiting for its first
press.

## The native wrapper (`native/`)

`native/` is a **thin** Expo / React Native shell that ships this web app to
the App Store and Google Play. It is a **separate npm project** with its own
`package.json`, its own lockfile and its own `node_modules` — `npm ci` at the
root does not touch it, and neither does `make install`. Reach it with
`--prefix native` (or the `make native-*` targets).

**Thin is a constraint, not an aspiration.** The wrapper does seven things:

1. packs the built web app into `assets/webroot.zip` and serves it from a
   loopback HTTP server (`src/local-server.ts`);
2. points a `WebView` at that origin and otherwise gets out of the way;
3. injects four scripts into the page — `src/injected.ts`, which reports the
   resolved theme colours so the native chrome follows them and unregisters
   the service worker, `src/icloudBridge.ts`, which offers the page a
   document store, `src/authSessionBridge.ts`, which offers it an
   authentication session for signing in to Dropbox, and
   `src/saveFileBridge.ts`'s descriptor, which tells the framework's
   `saveFile` the shell can take a file (and `src/scanQrBridge.ts`'s, which
   tells its `scanQrCode` the shell can scan a QR code);
4. answers those store requests against the app's own iCloud container
   (`src/icloud.ts` → `modules/icloud-store`);
5. opens a sign-in in an authentication session when the page asks
   (`src/authSession.ts` → `expo-web-browser`) and hands the redirect back.
   The page — the framework's `connectDropboxAuthSession`, reached through
   `getAuthSessionHost()` — keeps the PKCE verifier and makes the exchange;
6. hands an export to the share sheet when the page's `saveFile` sends one
   (`src/saveFile.ts` → `expo-sharing`). Every file `src/` hands the reader
   goes through `saveFile` — never `downloadBlob`, `downloadText` or a
   hand-clicked `download` link, which save nothing inside a WebView;
   `tests/save_file_test.ts` keeps them out;
7. opens the camera to read one pairing code when the page's `scanQrCode`
   asks (`src/QrScanner.tsx` → `expo-camera`) — only for the bundled page's
   own origin, only then (never at launch), keeping no frame and logging no
   code. The pairing sheet shows **Scan** only where `canScanQrCode()` is
   true, and keeps the paste field.

### The two native-only features, and why there have to be two

**Being self-contained and iCloud are the only features the wrapper adds.**
Everything else a reader sees is the web app, unchanged.

They are also the reason the wrapper is shippable at all. **App Store
guideline 4.2 (minimum functionality) rejects a build that is only a viewer
for a website**, so this app has to do things the browser cannot, and be seen
to: it serves the app from inside the download (no network at all,
ever), and it keeps the document in the reader's own iCloud container, which
no browser can reach. A change that removes a native-only feature does not
just lose the feature — it weakens the 4.2 case for the whole listing. A
change that _adds_ one is not forbidden, but it has to clear both rules below
and it has to be worth its own row here.

- **Nothing in `src/` may learn that the wrapper exists.** No `window.__native`
  feature detection, no native-only branch, no build flag. The wrapper reads
  the shipped app from the outside, the way a second reader would.

  A native-only feature that the web app has to _offer_ — iCloud is the first
  — is done as a **capability the host may offer**, never as a check for this
  wrapper. `src/app/cloudHost.ts` asks whether a document store is present on
  `window`; it never asks what it is running inside. A browser offers none, so
  the backend is simply absent there, and a second host offering the same five
  methods would light it up with no change to `src/`. If a change seems to need
  the web app to know it is native, the change is wrong; if it needs a
  capability the host can offer, name the capability.

- **The wrapper may not reimplement the domain.** It moves bytes: a file in, a
  file out. What a stopwatch reads, when a timer rings, and how two
  devices' copies reconcile are `watch.ts` and `merge.ts`'s, and a
  Swift copy of any of that would drift the first week it existed. That is
  also why the store is file-shaped — `list` / `read` / `write` / `remove`, the
  framework's own `FileStore` — rather than something that understands a stopwatch:
  the whole document goes through the app's ordinary per-record merge with no
  iCloud-shaped special case anywhere.

### What breaks quietly

- **The iCloud bridge is three strings that must agree with `src/`**: the
  property the host installs itself on (`window.__stopwatchCloudHost`), the
  announcement event (`stopwatch:cloud-host`), and the provider's name
  (`icloud`) — plus the five method names. None of them fails loudly on a
  mismatch: the backend simply never appears in the storage picker, on a
  device where the reader can see nothing wrong. `tests/native_icloud_test.ts`
  pins all of them against the app's own constants.
- **The auth-session bridge's names are the framework's**
  (`AUTH_SESSION_HOST_PROPERTY`, `AUTH_SESSION_HOST_EVENT`), spelled again in
  `native/src/authSessionBridge.ts`; `tests/native_auth_session_test.ts` runs
  the injected script against `getAuthSessionHost` to pin them. A drift is
  silent: the page finds no host and Dropbox opens in Safari again.
- **The URL scheme is the bundle id**, and the Dropbox sign-in returns on
  `<scheme>://oauth` — `se.agilator.stopwatch://oauth` in the store build, which
  the Dropbox app must list as a redirect URI (`native/RELEASING.md`). The
  scheme follows `APP_BUNDLE_ID` (`native/identifiers.js`) and is never
  committed; changing the bundle id breaks phone sign-in until the App
  Console follows.
- **Nothing the root `tsc` can reach may import `expo`** (or any other
  `native/`-only dependency). The root config type-checks `tests/`, and
  `tests/native_icloud_test.ts` imports `native/src/icloudBridge.ts` — but a
  root `npm ci` does not install `native/`'s dependencies, so such an import
  passes on a fully-installed machine and fails only in CI. A **type-only**
  import is still an import here. That is why the wire shapes live in
  `native/src/icloudWire.ts` and the script escaping in
  `native/src/scriptText.ts`, which import nothing at all, why neither bridge
  imports anything from `expo`, and why only `native/src/icloud.ts` and
  `native/src/authSession.ts` reach for native modules. `tsc` cannot guard
  this locally, so `tests/native_icloud_test.ts` reads the two files' import
  lines instead — crudely, and on purpose, because that fails where it helps.
- **A failure crosses the bridge as DATA, never as a rejection.** The only
  channel back into the page is an injected script, and an exception thrown
  there is swallowed by the WebView rather than reaching the promise. So
  `src/icloud.ts` answers `{ ok: false, kind }` and `cloudHost.ts` turns the
  kind back into the right framework error. Getting the three kinds apart
  matters: `offline` is what keeps the local copy in play, and collapsing it
  into `error` is how an unreachable container becomes an empty one and the
  user's stopwatches get pushed over.
- **A file iCloud has listed is not a file iCloud has downloaded.** The Swift
  side waits for the bytes and reports a timeout as a failure, never as an
  empty document — an empty document is a valid one and would be merged as
  such.
- **The iCloud container id is pinned in three files that must agree**:
  `app.config.js` (all three iCloud entitlements),
  `modules/icloud-store/index.ts`, and `modules/icloud-store/ios/
ICloudStoreModule.swift`. Changing it after release strands every document
  already synced under the old one.
- **The loopback port is fixed** (`src/local-server.ts`). A web origin is
  scheme + host + port and `localStorage` is keyed by origin, so a random port
  hands the WebView an empty store on every launch — every stopwatch the user
  made appears to vanish. The ladder falls back to another _deterministic_ port, and
  never to `0`.
- **`localhost`, never `127.0.0.1`.** App Transport Security blocks the literal
  address from `WKWebView` even with exception domains declared; the failure
  mode is a silent blank page on iOS.
- **There is no service worker, and any old one is unregistered.** The phone
  build is a shell build (`VITE_SHELL_BUILD=on`, `native/scripts/web-build.mts`),
  so its webroot carries no `sw.js` — `bundle-web.mjs` refuses one — and
  `src/injected.ts` still unregisters a worker an older build may have left.
  The origin is stable across app updates, so such a worker would keep
  answering from its precache after a store update has already unpacked the
  new one — an App Store update that changes nothing until the app is deleted.
- **`native/ios` and `native/android` are prebuild output.** Regenerated from
  `app.config.js` by `expo prebuild --clean`, gitignored, and the source of
  truth for nothing. A fix made there survives until the next build; make it
  in the config instead.
- **`native/tsconfig.json` must not `extend` Expo's base.** `native/` is not
  installed by a root `npm ci`, so `expo/tsconfig.base` is absent in CI, and
  Vite resolves the nearest tsconfig for the root test that imports
  `native/src/icloudBridge.ts` — an unresolvable `extends` turns a
  fully-installed machine green and CI red. The base is inlined instead;
  re-check it against `node_modules/expo/tsconfig.base.json` when expo is
  upgraded.

Native builds run on **EAS** and are dispatch-only
(`.github/workflows/native.yml`) — every run costs build credits. CI's `native`
job only type-checks and runs `npx expo-doctor`. See `native/README.md` and `native/RELEASING.md`.

## Where new code goes

| Change                                             | Goes in                                                                                                                                                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A new thing a stopwatch or timer holds             | `src/app/types.ts` (model) + `watch.ts` (what it reads, the edit) + the validation in `migrations.ts` (a step only if it is not purely additive) — and ask what it feeds                                  |
| A new reading                                      | `src/app/watch.ts`, with tests at real times in `tests/watch_test.ts`                                                                                                                                     |
| A change to what a button or the dial does         | `src/app/watch.ts` (the edit, tested) + `useWatches.ts` (which edit a press makes) — never a second copy of the edit in a screen                                                                          |
| A change to how the dial draws                     | `src/app/clock.ts` (geometry, tested), `sheen.ts` (the light on the metal, tested) or `Dial.tsx` (paint) — `WatchFace.tsx` for what a press on it does                                                    |
| A change to the registers                          | `src/app/clock.ts` (`registers`, `registerLabels`, and where `dialLayout` measures the room — walked for every dial by `tests/clock_test.ts`) + `Dial.tsx` (`RegisterDial`) — never a second set of radii |
| A dial option that only makes sense with another   | `src/app/clock.ts` (let the geometry decide, the way `placementOf` and `registers().hidden` do) + `DialPicker.tsx` (drop the control rather than offer a choice that cannot look right)                   |
| A change to how the hands move                     | `src/app/clock.ts` (`chronoTurns`, the beat and the glide, tested) or `useHands.ts` (the frames) — never a CSS transition                                                                                 |
| A change to the shape of a hand                    | `src/app/look.ts` (`DIAL_HANDS`) + `clock.ts` (`handPoint`) + `Dial.tsx` (paint) — the tip is an angle, never a share of the hand's length                                                                |
| What happens when a timer runs out                 | `src/app/useAlarm.ts` (`justRung`, tested in `tests/alarm_test.ts`) — local only: a sound is made by the browser, never fetched                                                                           |
| A new keyboard shortcut                            | `src/app/shortcuts.ts` (the key and the command, tested in `tests/shortcuts_test.ts`) + the screen that answers the command                                                                               |
| Something only the desk does                       | Behind `useDesk()` in `App.tsx`, or a `lg:` class / `@media (min-width: 64rem)` rule — the phone shell stays as it is                                                                                     |
| Something the desk and a phone on its side share   | Behind `useWide()`, or a `wide:` class / the paired `@media` list in `styles.css` — never `lg:` alone; the edges are `shape.ts`'s                                                                         |
| Something the phone laid down does when left alone | `src/app/useFocus.ts` (when) + `[data-focus="on"]` in `styles.css` (what) — fade it and take the press off it, never `display: none` or a layout that moves the watch                                     |
| A change to the light behind the case              | `src/app/look.ts` (`FACE_BACKLIGHT`, `resolveBacklight` — walked by `tests/look_test.ts`) + `DialPicker.tsx`; never a second backlight table                                                              |
| A new face, marker, typeface, ring, hand or preset | Run the `add-watch-face` skill (`.agents/skills/add-watch-face/`): `src/app/look.ts` (id + spec), a string in `en.ts`, `main.tsx` for a bundled `@fontsource` family, and `make shots` to look at it      |
| A control that answers being held                  | `src/app/useLongPress.ts` — spread its handlers on the button; never a second timer in a screen                                                                                                           |
| A modal's save / cancel                            | `src/app/ModalHeader.tsx` — one top bar; Enter and Escape are that bar's, not a form's                                                                                                                    |
| A new screen                                       | `src/app/<Name>Screen.tsx` + a tab in `src/app/BottomNav.tsx`, or a button in `src/app/TopBar.tsx` if it is an action rather than a place                                                                 |
| A new setting                                      | `src/app/useAppSettings.ts` (shape + clamping, tested in `tests/settings_test.ts`) + a `Section` in `SettingsScreen.tsx`                                                                                  |
| A new developer-only affordance                    | `src/app/dev/`, revealed behind `settings.devMode` in `SettingsScreen.tsx`                                                                                                                                |
| A change to what the demo shows                    | `src/app/dev/demoData.ts` (offsets from the moment it opens, never fixed dates), with tests in `tests/demo_test.ts`, which opens it across a year at hours round the clock                                |
| A new storage backend                              | The framework, not here — this app only wires adapters up in `useSyncEngine.ts`                                                                                                                           |
| A backend only some hosts can offer                | `src/app/cloudHost.ts` (the capability, tested in `tests/cloudHost_test.ts`) + a row in `useSyncEngine.ts`'s `PROVIDER_NAMES` and its `available` — never a check for the wrapper                         |
| Anything in the native wrapper                     | `native/...` — and read "The native wrapper" above first                                                                                                                                                  |
| Any user-facing string                             | `src/app/i18n/en.ts`, never inline in a component                                                                                                                                                         |
| A shared UI primitive                              | The framework, if it is domain-free; `src/app/` only if it is specific to stopwatches                                                                                                                     |

## Test conventions

Tests live in `tests/` with a `_test` suffix and run under Vitest in the `node`
environment — they cover the pure modules (`watch`, `clock`, `sheen`, `look`,
`format`, `locale`, `merge`, `migrations`, `demoData`, `shortcuts`,
`useAlarm`'s `justRung`, `cloudHost`, the settings parser), which is where the
app's real logic is. `native_icloud_test.ts` is the one that reaches outside
`src/`: it pins the strings the wrapper and the app have to agree on, and
guards the import discipline that lets it import from `native/` at all — see
"The native wrapper" above. `native_save_file_test.ts` does the same for the
save-file bridge, and `native_scan_qr_test.ts` for the scan-qr bridge. No DOM,
no testing-library, no mocked clock: where a test must meet a browser's
download or the phone app's WebView, `tests/fixtures/shell.ts` stands in for
exactly that boundary and nothing more. `tests/fixtures/helpers.ts` holds the
shared fixtures (a stopwatch, a timer, and a pinned moment `T0`).

`make test` runs them all; run one file with `npx vitest run tests/watch_test.ts`.
Use the Node `.nvmrc` pins (from nvm).

A change to a reading without a test that pins the new behaviour to real
moments is not finished. UI changes should keep the boot smoke path working:
`npm run build && npm run preview`, press the dial, check that the light comes
up and the running list shows the stopwatch; set a one-minute timer and let it
ring.

## Source file size

Non-test source files stay under **1000 physical lines**; prefer splitting by
concern over relaxing the cap. A file may opt out with
`guidelines:allow-large-file: <reason>` in a comment in its first 20 lines, and
the reason must be real. The files marked "split when next touched" are known
deviations: whoever next changes one splits it.

## Changelog and feature docs

`CHANGELOG.md`'s released sections are **generated** — never hand-edit them.
Every user-visible change adds a fragment under `.changes/unreleased/`:

```
.changes/unreleased/$(date +%s)-short-slug.md
---
type: Added        # Added | Changed | Fixed | Removed | Security | Deprecated
title: Short bold title
breaking: true     # optional — forces a major release
---

One sentence a user will read in the changelog.
```

A fragment for a substantial feature links to its doc under `docs/features/`
with `[Learn more](feature:<slug>)`.

## Documentation sync points

| If you change…                      | Update…                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `watch.ts`                          | `docs/features/watch.md`, `docs/features/stopwatches.md`, `docs/features/timers.md`                                                                                            |
| The `Run` / `Timer` shape           | `docs/architecture.md`'s data shape and the validation in `migrations.ts` — a purely additive optional field needs the validation rather than a step                           |
| How the dial draws or the registers | `docs/features/themes.md` and the README's Usage table                                                                                                                         |
| The sync engine or the merge        | `docs/sync.md`                                                                                                                                                                 |
| `cloudHost.ts` or the bridge        | `docs/sync.md`, `docs/features/cloud-sync.md`, `docs/features/native-app.md`, `native/README.md`, and `tests/native_icloud_test.ts` — which pins the strings both halves share |
| Anything under `native/`            | `docs/features/native-app.md`, `native/README.md`, `native/RELEASING.md`                                                                                                       |
| A `VITE_*` variable                 | `docs/configuration.md`, `src/vite-env.d.ts`, the README's Configuration table, and the workflows that pass it                                                                 |
| A screen's behaviour                | The matching `docs/features/*.md` and the README's Usage table                                                                                                                 |
| The navigation (nav or top bar)     | `docs/architecture.md`'s tree and the README's Usage tables                                                                                                                    |
| Module layout                       | The "Where new code goes" table above and `docs/architecture.md`                                                                                                               |
| A make target or script             | `CONTRIBUTING.md`, the README's Quick start, and this file's command list                                                                                                      |

## Parity and cross-cutting rules

- **Every string goes through `t()`.** English is the only catalog today; the
  runtime is in place so adding a language is one `loaders` entry. The name a
  new stopwatch or timer starts with ("Stopwatch 3") is translated once at
  creation and then lives in the document as the user's own word.
- **Two themes only** — one light, one dark, plus "follow the device". The
  one deliberate exception is the watch **face** (`DIAL_FACE` in `look.ts`):
  a watch face has a colour the way an object does, not the way a theme does —
  a black dial is black on the light theme — and so has its seconds hand
  (`chrono`). Its ink, bezel, gradient and hand never reach the UI around it;
  what the theme puts on the dial is a timer's time left on the bezel, in the
  accent. Everything else about the dial is shape, not colour; the applied
  parts are `STEEL`, lit by `sheen.ts`.
- **Three destinations, no sidebar, no drawer.** On the phone held upright
  they are the bottom bar — Watch, Stopwatches, Timers — in a fixed order a
  swipe moves along; laid down they go to the _top_, the watch in the left
  corner and the two pages in the right, floating over the watch where there
  is no bar to sit above; on the desk they are tabs on the top bar. Things you
  do and leave belong on the top bar, which is where Settings is. A new
  _action_ is a top-bar button, not a tab.
- **The two kinds are tabs on the watch, not destinations.** Stopwatch and
  timer share one dial and one screen; the main screen's tabs switch which
  kind it shows, and the pages are where each kind is listed whole.
- **The watch is the switch.** Starting, holding and carrying on is a press
  on the dial, and a timer that has run out is silenced by the same press.
  Do not add a start button back beside it — the rows' buttons are for the
  ones _not_ on the dial.
- **Several at once.** New puts a fresh one on the dial and leaves the others
  running; nothing ever stops one watch because another started.
- **Put away is not deleted.** A stopwatch or timer put away leaves the main
  screen for its page and keeps its reading, and is started again from there.
  Deleting is the page's, behind a confirmation, and leaves a tombstone.
- **The watch is centred, and it does not move.** Where the dial is sized by
  the height its row has left over — the desk and the stand — the words under
  it keep their room whatever is on (`.app-dial-note`), and the same room is
  left empty above the dial (`--dial-gap`, `styles.css`).
- **No dependency creep.** The framework, Preact, a font, and workbox-window.
  A new runtime dependency needs a reason that the framework can't serve. The
  faces the app ships are `@fontsource` packages, imported in `main.tsx` a
  weight and a subset at a time, and bundled from this origin. A font — or a
  sound — is never reached for over the network.

## Website staleness

The app _is_ the website — `pages.yml` builds it and deploys `dist/`. There is
no separate marketing site to drift out of date, but the `<head>` copy does:
when the app's description changes, update `index.html`'s title/description/OG
and the manifest copy in `pwa-plugin.ts` together.

The website is unlisted: it is a testing surface, and people install the app
from its store listing. Every page it emits carries a robots `noindex`, and it
ships no sitemap, structured data, `llms.txt`, SEO or Lighthouse workflow, and
no page-weight or chunk budget.

## Maintenance skills

Skills live under `.agents/skills/`; `.claude/skills` is a symlink into that
tree. Each has a `SKILL.md` with its discovery process, its source→output
mapping, and a `.last-updated` marker.

| Skill             | Runs when                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maintenance`     | The registry and run order for every other skill — start here                                                                                              |
| `write-changeset` | Any user-visible change, before opening the PR                                                                                                             |
| `update-docs`     | `src/app/` changed in a way a `docs/` topic describes                                                                                                      |
| `update-readme`   | Commands, configuration, or the feature set changed                                                                                                        |
| `add-watch-face`  | A new dial, preset, marker style, typeface or ring is asked for — often from a photograph of a stopwatch; keeps makers' names and trademarked features out |
