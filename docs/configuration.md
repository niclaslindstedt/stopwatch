# Configuration

The app runs with no configuration at all. What follows is what a _deploy_ can
set at build time, what a _user_ can set at runtime, and where the app keeps
its state.

## Build-time variables

Read by Vite at build time through `import.meta.env` (declared in
`src/vite-env.d.ts`) or by `vite.config.ts` from the environment. All
optional.

| Variable                  | Effect                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_DROPBOX_APP_KEY`    | The Dropbox app key (a PKCE public client). Unset hides the Dropbox backend in Settings → Cloud sync.                                                                                                                                                                                                                                                       |
| `VITE_DROPBOX_APP_FOLDER` | The Dropbox app-folder name (`Apps/<name>/`), fixed by your Dropbox app's configuration. Default `stopwatch`.                                                                                                                                                                                                                                               |
| `VITE_BASE`               | The deploy base path. `pages.yml` sets `/` for the release and `/preview/` for the rolling main build.                                                                                                                                                                                                                                                      |
| `VITE_PWA_IGNORE_PATHS`   | Sibling deploy paths the root service worker must disown (`/preview/`). Only the root release sets it.                                                                                                                                                                                                                                                      |
| `VITE_EDITION`            | Which build this is. `store` for the one sold in the App Store, which — like the desktop build — carries no link back to the source: no Open Graph tags naming the website, no `CNAME` and no `og.png` (`websiteOnly` in `vite.config.ts`). Anything else, including unset, is the website.                                                                 |
| `VITE_SHELL_BUILD`        | `on` when the desktop or phone shell builds the site to bundle it: no service worker is emitted and the in-app update prompt is off, because a build inside a binary updates by being replaced. Set by the shells' bundle scripts, never by hand.                                                                                                           |
| `APP_DISPLAY_NAME`        | The name the app shows — on the watch, the bar and in the sentences that name it — in an **app build** only (the phone's store edition and the desktop shell): the listing's name, the same one under the icon. `native/scripts/bundle-web.mjs` passes it from the environment or `native/.env`; the website, and a build nobody named, say `Stopwatch` (see `src/app/appName.ts`). |
| `VITE_SEED`               | `demo` boots the app onto the demo document — an afternoon with a few stopwatches and timers on the go, built for the moment it opens and held in memory — before the first render, with sync paused and backend changes refused (see `src/app/dev/`). `make demo` and the store screenshots set it; a release never does, and the check folds away in any other build. |

The Dropbox identifier is public by design: the flow is PKCE, so there is no
client secret anywhere in the pipeline.

The Dropbox app must list every redirect URI the app signs in through, under
**Settings → OAuth 2 → Redirect URIs** in the Dropbox App Console: the
deployed URL for the website, `http://127.0.0.1:53682/`, `:53683/` and
`:53684/` for the desktop app, and **`se.agilator.stopwatch://oauth`** for the
phone app — its URL scheme is the
bundle id, and it signs in through an in-app authentication session (see
[`../native/README.md`](../native/README.md#signing-in-to-dropbox)). The
native build passes the same two variables to the bundle it ships.

In CI, `VITE_DROPBOX_APP_KEY` and `VITE_DROPBOX_APP_FOLDER` come from repository
**secrets** of the same names — every setting the workflows read is a secret,
and the repository keeps no Actions variables. Being public, they need not be
secret; keeping them there means one place to look for everything a deploy is
configured with.

## The native wrapper's variables

`native/` is a separate project with a build of its own; these are read there,
never by the web app. See
[`../native/.env.example`](../native/.env.example) and
[`../native/RELEASING.md`](../native/RELEASING.md).

| Variable               | Effect                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_TIME_URL` | Point the wrapper's WebView at a deployed slot instead of the copy bundled inside it. **Debugging only** — never a store build. |
| `EAS_PROJECT_ID`       | The EAS project a build runs under. `eas init` prints it but cannot write it into a dynamic config, so it is passed in.         |
| `EXPO_TOKEN`           | An Expo access token, so CI can drive EAS with no interactive login. A repository secret; treat it as a password.               |

## Runtime settings

Under the **⚙** — on the dial over the watch, on the top bar everywhere else.
Persisted per device in localStorage (`stopwatch:settings`), never synced.

| Setting                | Values                                       | Default   |
| ---------------------- | -------------------------------------------- | --------- |
| Theme                  | Light / Dark / Device                        | Device    |
| Dial                   | nine presets / Custom                        | Uptown    |
| Size                   | Small / Medium / Large                       | Large     |
| Reflections            | on / off (where the device has the sensors)  | off       |
| Times of day           | Automatic / 7:26 PM / 19:26                  | Automatic |
| Chime                  | on / off                                     | on        |
| Vibrate                | on / off                                     | on        |
| Developer mode         | on / off                                     | off       |
| Capture console output | on / off (developer mode)                    | off       |

**Automatic** is the device's region, read through the browser's `Intl`
(`src/app/locale.ts`): a twelve-hour clock in the United States, the 24-hour
clock in the Nordics and most of Europe. It reaches the one moment the app
prints — when a running timer will ring.

The same blob holds what the main screen was last left on, which is why it is
per device: which tab is open, which stopwatch and which timer the dial shows,
and the hours and minutes a new timer is set to — the last length set, so the
pasta is one press away the next evening too. Custom's own dial and the
backlight's colour, beat, brightness and spread are kept here as well (see
[`features/themes.md`](features/themes.md)).

The stopwatches and timers themselves — their names, their runs, whether they
are put away — are data in the document, not settings, so they sync and back
up.

## Storage keys

| Key                             | Holds                                                           |
| ------------------------------- | --------------------------------------------------------------- |
| `stopwatch:doc`                 | The document: stopwatches and timers (see `architecture.md`)    |
| `stopwatch:doc:unreadable`      | A quarantined copy of a document this build could not parse     |
| `stopwatch:settings`            | The runtime settings above                                      |
| `stopwatch:sync:backend`        | Which backend is active (`local`, `icloud`, `dropbox`, `selfhosted`) |
| `stopwatch:sync:dropbox`        | Dropbox tokens                                                  |
| `stopwatch:sync:selfhosted`     | Which namespace on the paired storage server holds the document |
| `stopwatch:logs`                | The in-app log buffer                                           |
| `stopwatch:language`            | The language choice (English only today)                        |
| `oss:cache:<backend>:stopwatch` | The framework's offline cache of the cloud copy                 |

iCloud has no key of its own beyond `stopwatch:sync:backend`: there is nothing
to store. The container belongs to the device's iCloud account, so choosing
the backend is the whole of connecting to it. A paired storage server's keys
are not in localStorage at all: they are in the framework's key vault
(non-extractable keys in IndexedDB in a browser).
