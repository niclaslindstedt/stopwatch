# Architecture

A frontend-only PWA. No server, no API, no build-time data source. Everything
below runs in the browser tab.

```
index.html
  └── src/main.tsx            mounts <App> inside the i18n LanguageRoot, imports the bundled fonts
       └── src/App.tsx        theme, store, sync, the alarm, tab switch, chrome
            ├── TopBar            mark + wordmark, the desk's tabs, sync glyph, cog — the dial carries the wordmark and the cog over the watch
            ├── WatchScreen       the two tabs, the dial, the controls, the timer setter, the ones still out
            ├── ListScreen        the Stopwatches page and the Timers page: active, then put away
            ├── SettingsScreen    settings, sync controls, backup, about
            ├── SidePanel         Settings on the desk, over the right-hand edge
            └── BottomNav         the three destinations, on the phone — at the foot upright, at the top laid down

src/app/
  types.ts          the model: Run, Stopwatch, Timer, AppData
  watch.ts          a run + a moment → its reading and state; the edits a run can take   (pure, clock-free)
  clock.ts          the chronograph's geometry: the scale, the registers, the hands, the beat, the glide   (pure)
  look.ts           the theme, and the dial's faces, fonts, markers, rings, hands, movements, presets, backlight
  sheen.ts          where the light is, and what it does to the dial's steel   (pure)
  format.ts         a stopwatch's reading, a timer's time left, a duration, a moment on the wall clock
  locale.ts         the reader's clock (12- or 24-hour), read off Intl
  appName.ts        the name the app shows: the listing's in an app build, Stopwatch on the website
  merge.ts          two documents → one, record by record   (pure)
  migrations.ts     bytes ⇄ AppData, with validation
  ids.ts            fresh ids
  useDocStore.ts    the document in state, persisted to localStorage, over a DocBackend seam
  useWatches.ts     the edits the screens make, in one place, and which one the dial shows
  useAlarm.ts       a timer that runs out: the notice, the chime, the buzz
  useSyncEngine.ts  the cloud copy: pull on open, debounced push on edit
  useAppSettings.ts the settings blob: the dial, the focus, the timer's last length, the alarm
  useNow.ts         the one place the clock is read
  useHands.ts       the hands: the movement's beat, the fly-back and the wind, off the render loop
  useTilt.ts        the device's orientation, turned into the light on the metal
  shape.ts          phone, stand or desk — the two edges the shell is cut at
  useShape.ts       the same, live: useDesk / useStand / useWide
  useFocus.ts       focus mode: the stand left alone, where everything but the watch fades out
  shortcuts.ts      key → command, and whether Enter saves a modal   (pure)
  useShortcuts.ts   the window's keydown, turned into those commands
  useModalSave.ts   a modal's Save: Enter, the press, and when it may look dead
  useLongPress.ts   a control held rather than tapped, and the right button
  backup.ts         export / restore a JSON file
  cloudHost.ts      the seam a host fills to offer a document store of its own (iCloud)
  selfHosted.ts     the reader's own storage server: pairing codes, device name, which namespace (pure)
  useSelfHosted.ts  the same, live: restore the pairing, open the namespace, retry when unreachable
  SelfHostedConnectModal.tsx  pairing a device: the code, the first device's keys and recovery key, approval
  SelfHostedSettings.tsx      the server in Settings: add a device (QR), approvals, recovery key, unpair
  Dial.tsx          the watch face, drawn: bezel, scale, ring, markers, registers, printing, hands — shared by the watch and Settings
  WatchFace.tsx     the dial on the main screen: the switch, the cog, and the light behind the case
  WatchRow.tsx      one stopwatch or timer as a row: its mark, name, reading and buttons
  DialPicker.tsx    the presets and the custom pickers in Settings
  ModalHeader.tsx   a dialog's top bar: cancel, the title, save — and Enter / Escape
  icons.tsx         the app's own glyphs
  log.ts            the in-app log store
  pwa.ts            the service worker's cache id per deploy base
  dev/              the demo document (VITE_SEED=demo, and the Settings switch): an in-memory DocBackend
  i18n/             the catalog and the runtime

native/             the thin Expo wrapper — a separate npm project (see below)
  App.tsx           a WebView over the bundled build, and nothing else
  src/local-server.ts   unpacks the packed build and serves it on a fixed loopback port
  src/injected.ts   the theme reporter, and the service-worker teardown
  src/icloudBridge.ts   the store host it installs into the page   (pure)
  src/icloud.ts     answers the page's store requests
  src/authSessionBridge.ts  the sign-in provider it installs into the page   (pure)
  src/authSession.ts    opens a Dropbox sign-in in an authentication session
  src/saveFileBridge.ts / saveFile.ts   a backup handed to the share sheet
  src/scanQrBridge.ts / QrScanner.tsx   the camera, for one pairing code
  modules/icloud-store/ list / read / write / remove in the app's iCloud container

tauri/              the thin desktop shell — its own Rust toolchain (see tauri/README.md)
```

## The framework's share

[`@niclaslindstedt/oss-framework`](https://github.com/niclaslindstedt/oss-framework)
supplies the UI kit (modals, buttons, segmented controls, labelled fields, the
settings layout, the toast viewport, the confirmation dialog), the bottom bar
and the swipe that pages it, the theme engine, the storage adapters and the
local cache around them, the migration runner, the i18n runtime, the log store
and viewer, `saveFile`, and the PWA update state machine. The app imports only
published subpaths.

The renderer is **Preact** through `preact/compat`: the framework is built
against React, and `@preact/preset-vite` plus `tsconfig.json`'s `paths` alias
`react` onto Preact for the bundle and the type-checker alike.

## The native wrapper's share

`native/` ships the same web app to the App Store and Google Play. It is a
**separate npm project** — its own `package.json`, lockfile and
`node_modules`, reached with `--prefix native` — and it is thin on purpose: a
loopback HTTP server serving the packed web build, a `WebView` over it, and
one thing the browser cannot do, which is reach the device's **iCloud**.

Nothing in `src/` knows it exists. iCloud reaches the app the same way any
other capability would: `cloudHost.ts` looks for a document store on `window`
and the wrapper installs one, so the browser shows no native-shaped hole and a
second host would light the same backend up.

Dropbox sign-in works the same way. The page's redirect cannot come back into
a WebView on a loopback origin, so the wrapper offers an authentication
session at `window.__ossAuthSession` — the framework's name — and the page's
`connectDropboxAuthSession` uses it when `getAuthSessionHost()` finds one. The
sheet returns on `<bundle id>://oauth` (`se.agilator.stopwatch://oauth` in the
store build), the redirect URI the Dropbox app must list.

See [`features/native-app.md`](features/native-app.md) and
[`../native/README.md`](../native/README.md).

## The shape of the data

One document (`stopwatch:doc` in localStorage):

```ts
type AppData = {
  version: 1;
  stopwatches: Record<string, Stopwatch>;
  timers: Record<string, Timer>;
};

type Run = {
  id: string;
  name: string; // "Stopwatch 3" until the reader renames it
  startedAt: number | null; // epoch ms the current stretch started; null while held
  banked: number; // ms banked from the stretches before this one
  stopped: boolean; // put away: on its page only, not on the main screen
  createdAt: number; // epoch ms — the lists are newest first
  updatedAt: string; // ISO — the merge tiebreak
  deleted?: true; // a tombstone, so a sync does not bring it back
};

type Stopwatch = Run;
type Timer = Run & { duration: number }; // ms it counts down from
```

A run is the whole of a stopwatch: banked time plus, while it is going, the
moment it was started. Pausing banks what has run since that moment and
clears it; starting again sets a new one. A timer is a run measured against a
duration — its time left is the duration less the elapsed time, and it has
gone off when that reaches nothing.

Moments are milliseconds since the Unix epoch, on purpose: a stopwatch started
on the phone has to be the same stopwatch on the laptop, whatever zone either
is set to.

Nothing derived is stored. The elapsed time, the time left, the state
(`running`, `paused`, `idle`, `done`, `stopped`) and the moment a timer will
ring are recomputed from the run and the moment on render — see `watch.ts`. A
document that syncs while a stopwatch runs means the same on every device the
moment it lands, and a timer that ran out while the tab was closed reads as
run out when it opens.

Which stopwatch and which timer the dial shows, which tab is open and what a
new timer is set to are **settings**, per device and never synced: the phone
and the laptop can each be looking at their own (`useAppSettings.ts`).

## The document pipeline

Every read goes through `migrations.ts`: localStorage, the cloud copy, a
restored backup. `normalizeDoc` runs the framework's migrator (one step so
far: stamping an unversioned document as v1), then coerces every stopwatch
and timer into the shape above — dropping a record with no id and a timer
with no duration, clamping a negative bank to nothing, and trimming a name to
60 characters. `serializeDoc` writes keys in sorted order so equal documents
are equal bytes, which keeps cloud revisions from churning.

A document this build cannot read — not JSON at all, or written by a
**newer** build — is refused rather than emptied: the store quarantines the
bytes under `stopwatch:doc:unreadable` and boots empty without writing over
the stored copy, so the document comes back once the update applies.

## The service worker

`pwa-plugin.ts` emits `sw.js`, `version.json`, `precache-manifest.json` and
the web manifest at build time — a "prompt to update" worker that precaches
the build, parks in `waiting`, and applies on the framework's `UpdateToast`.
Per deploy base (`/`, `/preview/`) the cache id (`src/app/pwa.ts`) and the
manifest identity differ, so the channels install as separate apps.

Only the website has one. The desktop and phone builds are shell builds
(`VITE_SHELL_BUILD=on`): the site ships inside the binary, so they emit no
worker and show no update prompt, and both bundle scripts refuse a webroot
that holds `sw.js`.
