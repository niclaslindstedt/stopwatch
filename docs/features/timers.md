# Timers

A timer is a stopwatch measured against a length of time: set in hours and
minutes, it counts down on the same chronograph face, and it rings when it
gets to nothing.

## Setting and starting one

On the [watch](watch.md)'s **Timer** tab, while the timer on the dial is
fresh — or has been reset to the top of its time — the controls under the
dial start with the setter: an hours and a minutes stepper, and the quick
lengths 1m, 3m, 5m, 10m, 15m, 30m and 1h. A timer runs from one minute to 99
hours and 59 minutes. The last length set is remembered on the device, so the
next fresh timer starts there.

Press the dial and it starts. The hands count down — the big hand the seconds
left, the register at three the minutes, the one at nine the hours — and the
bezel, drawn in the accent from twelve, shrinks with the share still to run.
The line under the dial says when it will ring, on the device's clock (or the
one chosen under **Settings → Clock**).

A timer is held and carried on like a stopwatch: press the dial. Its length
cannot be changed while it is running or held part way; reset it to the top,
and the setter comes back.

## When it runs out

The moment a timer runs out:

- the light behind the case turns the flag colour and beats fast — on the
  dial, if it is the one there — and its row turns the same colour, with a
  bell for its glyph;
- the line under the dial, and the browser tab's title, say **Time's up**;
- a notice says so — "Pasta: time's up" — whichever screen is open;
- a short chime plays, made by the browser on the spot: three notes, no sound
  file, nothing fetched;
- the device buzzes, where it can.

The chime and the buzz are switched under **Settings → When a timer runs
out**, both on by default. A browser plays sound only once the page has been
touched, and only while it is open, and not every browser lets a page buzz
(Safari on iOS does not); where either cannot happen, the light and the
notice still say it.

It rings **once per run**: a timer started again rings again when it next runs
out, but a reload does not ring for one that has already been announced. Only
a timer that ran out within the last minute is news — open the app hours after
one ran out and it simply reads as run out, without a chime about it.

A timer that has run out stays that way until it is **silenced**: press the
dial, or **Put away**, or the row's own button. Silencing puts it away, onto
the Timers page. Started again from there, it starts from the top.

## The Timers page

The **Timers** page is the [Stopwatches](stopwatches.md) page for timers:
every timer you have, the active ones first and then the ones put away —
which are listed only there — each newest first. A row has the timer's name
as a field to rename it in place, the time it has left, its state, and what it
was set for ("Set for 1h 30m"). Its buttons start, hold, carry on, reset, put
away and silence it; a timer put away has **Start again**, which starts it
from the top of its time and puts it on the dial. **Delete** asks first, and
removes it from every device it syncs to.

## On another device

A running timer is a moment it was started and a length, so a device that
receives it by sync reads the same time left — and, if it is open when the
timer runs out, rings for it too. Which timer each device has on its dial is
that device's own.
