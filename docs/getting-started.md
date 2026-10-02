# Getting started

Stopwatch is a local-first stopwatch and timer. There is nothing to sign up
for and nothing to install beyond the app itself.

## Use the hosted app

Open [stopwatch.niclaslindstedt.se](https://stopwatch.niclaslindstedt.se/). On a phone,
use the browser's **Add to Home Screen** / install prompt: the app then opens
full-screen like a native one and works with no network at all.

## Run it locally

```sh
npm config set //npm.pkg.github.com/:_authToken <your-token>
git clone https://github.com/niclaslindstedt/stopwatch.git
cd stopwatch
npm install
npm run dev
```

The token needs the `read:packages` scope — the
`@niclaslindstedt/oss-framework` dependency comes from GitHub Packages, which
requires authentication even for public packages.

## Your first stopwatch

1. The app opens on the **Watch**, on the **Stopwatch** tab. The dial is at
   zero and the line under it says to press it.
2. Press the dial. A stopwatch starts — "Stopwatch 1" — the big hand sweeping
   the seconds and the light behind the case beating.
3. Press it again to hold it, and again to carry on. **Reset** puts a held one
   back to zero.
4. **New** puts a fresh dial up and leaves the first one running. Press the
   dial again and "Stopwatch 2" starts; the first is listed under the
   controls, still counting. Press its name to bring it back onto the dial.
5. **Put away** holds the one on the dial and takes it off this screen. It is
   on the **Stopwatches** page now, under **Put away**, where it can be
   renamed, started again or deleted.

## Your first timer

1. Switch to the **Timer** tab. Under the dial, set the hours and minutes with
   the steppers, or press one of the quick lengths — **5m**, say. The app
   remembers the last length you set.
2. Press the dial. The timer counts down on the same face: the hands go
   backwards, the bezel empties in the accent colour, and the line under the
   dial says when it will ring.
3. When it runs out, the light turns the warning colour, a notice says so, and
   a chime and a buzz come with it if the device has them and the app is
   open. Press the dial — or **Put away** — to silence it.

A timer can be held and carried on like a stopwatch. One put away is on the
**Timers** page, where starting it again starts it from the top.

## Where the data lives

In your browser's localStorage, on this device. **Settings → Your data**
downloads a JSON backup or restores one. To keep a copy in your own Dropbox,
iCloud or storage server and to sync between devices, see
[`features/cloud-sync.md`](features/cloud-sync.md).
