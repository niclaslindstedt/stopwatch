# Troubleshooting

## Install and build

**`npm install` fails with `401 Unauthorized` for `@niclaslindstedt/oss-framework`.**
The package comes from GitHub Packages, which requires a token even for public
packages. Put one with the `read:packages` scope in `~/.npmrc`:
`//npm.pkg.github.com/:_authToken=<token>`. The project's own `.npmrc` only
maps the scope to the registry and carries no token.

**`make lint` fails on types from `react`.** The app runs on Preact;
`tsconfig.json`'s `paths` point `react` at `preact/compat`. Don't add
`@types/react` — see `AGENTS.md`.

## The watch

**A stopwatch has disappeared from the Watch screen.** It was put away. The
main screen shows only the ones still out; the **Stopwatches** page lists
every one, with the put-away ones under **Put away**, where the play button
starts it again from zero.

**The timer's steppers are gone.** A timer is set while it is fresh or reset
to the top of its time — not while it is running, held part way, or ringing.
Press **Reset** on a held one, or **New** for another.

**Reset is greyed out.** There is nothing to reset: the one on the dial is
running (hold it first), already at zero, or ringing (silence it instead).

**The dial shows a different stopwatch on the laptop than on the phone.**
Which one the dial shows is a setting of each device, and is not synced. Both
devices have the same stopwatches; press a name under the controls to put it
on the dial.

**A stopwatch reads a little differently on two devices.** The reading is
worked out from the moment it was started, on each device's own clock. Two
clocks a few seconds apart give readings a few seconds apart; a stretch that
seems to have started in the future counts for nothing rather than for less.

## When a timer runs out

**It made no sound.** The chime is made by the browser, and a browser plays
sound only once the page has been touched, and only while it is open — a tab
that has been closed, or a phone app that has been swiped away, cannot ring.
Check **Settings → When a timer runs out**, and the device's own volume.

**It did not vibrate.** Not every browser lets a page vibrate the device —
Safari on iOS does not. The light and the notice still say it.

**It rang once and then went quiet, but the light is still the warning colour.** A timer rings
once, the moment it runs out. It stays run out until it is silenced: press
the dial, or **Put away**.

**I opened the app long after a timer ran out and it did not ring.** Only a
timer that ran out within the last minute is announced; one that ran out
while the app was closed simply reads as run out.

## Cloud sync

**"Reconnect needed".** The provider's session lapsed. Tap the sync glyph on
the top bar, then **Reconnect**.

**My stopwatches are not on the other device.** Both devices must be connected
to the same account and the same provider, and the first device must have
pushed (the glyph reads "saved"). Tap the glyph → **Save now** on the first
device, then **Reload** on the second.

## Recovery

**The app opened empty after an update.** A document a newer build wrote can
be unreadable to an older one still cached by the service worker. The app
leaves the stored copy untouched and quarantines a copy under
`stopwatch:doc:unreadable`; reload once the update has applied and it comes
back.
