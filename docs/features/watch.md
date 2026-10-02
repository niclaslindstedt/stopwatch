# The watch

The main screen, and the one the app opens on. It is a stopwatch — a
chronograph face — with two tabs over it, a few controls under it, and the
ones still running below those.

## The two tabs

**Stopwatch** and **Timer**, each with its glyph, over the dial. They switch
which kind the screen shows; the dial is drawn as a stopwatch either way, and
each tab keeps its own watch on the dial. `1` and `2` pick them on a keyboard.
Which tab is open is remembered per device.

## The dial

The big hand from the centre is the seconds, round a scale numbered 5 to 60.
The small dial at three is the minutes, once round an hour; the small dial at
nine is the hours, once round twelve. Both hands sweep with the reading on
every frame rather than stepping, so each is read off where it stands between
its marks. A stopwatch's hands count up; a timer's count down, and
for a timer the bezel is drawn too — from twelve, clockwise, in the accent,
for the share of the timer still to run, shrinking as it runs. How the dial
looks — its face, markers, numerals, ring, hands and movement — is chosen in
Settings; see [`themes.md`](themes.md).

**The whole watch is the button.** Pressing it starts the one on the dial,
pressing it again holds it, and pressing it once more carries on from where it
was held. There is no other start button on the screen. `S` does the same on a
keyboard.

On a fresh dial — the first time, or after **New** — there is nothing yet: the
stopwatch reads zero, or the timer reads the time it is set for, and the press
that starts it is the press that makes it. A new one is named for its kind and
the lowest number nobody else of that kind has — "Stopwatch 1", "Timer 3" —
so removing "Stopwatch 2" gives that name back rather than counting on for
ever. It is renamed on its page.

Behind the case is a light that beats while the watch on the dial runs and is
off while it is held. When a timer runs out it turns the flag colour and
beats fast until the timer is silenced — see [`timers.md`](timers.md).

The dial carries the app's mark and name under twelve, the movement's word
under that (AUTOMATIC, QUARTZ or GLIDE), and a window above six where a date
would be, holding the Settings cog — so on a phone held upright there is no
bar over the watch at all.

## Under the dial

First the reading — a stopwatch to the tenth of a second, a timer to the
second, rounded up the way a kitchen timer reads, so it says 0:01 for the
whole of its last second — and under it the one on the dial's name and its
state: **Running**, **Paused**, **Ready**, or **Time's up**. A running timer
says when it will ring instead, on the device's clock or the one Settings
chose. Before there is one on the dial, the line says what to do: press the
dial, or set the time and then press it.

The words keep their room whether there is one line of them or two, so the
watch does not change size when something starts.

Then the controls:

- **New** puts a fresh one on the dial and leaves the one that was there — and
  every other — running. `N` on a keyboard.
- **Reset** puts the one on the dial back to zero, or a timer back to the top
  of its time, and holds it there. It is offered only while the one on the
  dial is held with time on it; hold a running one first. `R` on a keyboard.
- **Put away** holds the one on the dial and takes it off this screen, onto
  its page, where it keeps its reading and can be started again. The next one
  still out comes up onto the dial in its place. On a timer that has run out,
  the same button silences it.

On the Timer tab, while the timer on the dial is fresh or reset to the top,
the controls start with the **setter**: an hours and a minutes stepper — the
minutes step by one, the hours by sixty minutes, from one minute up to 99
hours and 59 minutes — and a row of the lengths a timer is most often set to:
1m, 3m, 5m, 10m, 15m, 30m and 1h. The last length set is remembered, so the
next fresh timer starts there. Steppers rather than a field, because a timer
is set with a thumb while the other hand is busy.

## The ones still running

Below the controls is every stopwatch — or every timer, on the Timer tab — that
has not been put away, newest first: a scroll down from the watch on a phone,
the right-hand column where the window is wide. Each is a row with its glyph,
its name, its reading ticking while it runs, its state, and — for a timer —
what it was set for. The one on the dial is marked **On the dial**.

Press a name to put that one on the dial; on a phone the screen scrolls back
up to it. The row's own buttons hold or carry on, reset, and put away, without
touching the dial. A link at the foot goes to the page that lists all of them.

## The window's title

While something on the dial runs, the browser tab's title is its reading and
its name — "12:34 · Stopwatch 1 — Stopwatch" — so a tab in the background
still tells the time, and says "Time's up" when a timer rings.

## Wide windows, and a phone laid down

Where the window is wide — a desk laid wide, or a phone on its side — the tabs
and the controls stand to the left of the dial and the running list to its
right, so the watch keeps the middle and nothing is below a fold. A phone laid
on its side and left alone on the watch fades everything but the watch after
a few seconds; the first touch brings it back, and is spent on bringing it
back rather than on the dial under the finger.
