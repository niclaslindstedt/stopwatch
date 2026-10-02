# Stopwatches

The **Stopwatches** page lists every stopwatch you have, whether it is running
or has been put away. It is the second of the three destinations — in the
bottom bar on a phone, a tab on the top bar on a desk — and the
[watch](watch.md)'s running list links to it.

## Active, then put away

The page is in two parts, each newest first.

**Active** is every stopwatch not put away: the same ones the main screen
lists under its dial, running or held.

**Put away** is every stopwatch that has been put away — held where it was and
taken off the main screen. They are listed here and nowhere else. A stopwatch
put away keeps its name and its reading, so the page is also a record of what
was timed and for how long.

Before there is any, the page says so, and that the way to make one is to
press the dial on the watch.

## A row

Each stopwatch is a row: its glyph, its name, its reading to the tenth of a
second — ticking while it runs, still while it is held — and its state.

**The name is a field.** Press it and type; the new name is kept when you
leave the field. A blank name is not a name, so clearing the field keeps the
old one. Names are up to 60 characters.

The buttons depend on the state:

- **Running** — hold it, or put it away.
- **Held, with time on it** — carry on, reset it to zero, or put it away.
- **At zero** — start it, or put it away.
- **Put away** — **Start again**, which starts it from zero, takes it off the
  shelf and puts it on the main screen's dial, and goes there.

And on every row, **Delete**.

## Deleting

Delete asks first, because it is removed from every device the document
syncs to — that is what makes it a deletion rather than a local tidy-up. What
is kept is a tombstone: the stopwatch's id and the moment it was deleted,
with nothing running on it, so a device that still has the stopwatch cannot
bring it back on the next sync (see [`../sync.md`](../sync.md)). No screen
shows a tombstone, and its name is free for the next new stopwatch.

To take a stopwatch off the main screen without losing it, put it away
instead.

## Several at once

Nothing on this page, or anywhere else, stops one stopwatch because another
started. Every stopwatch is its own run — the time banked, and the moment the
current stretch started — and its reading is worked out from that whenever it
is shown, so any number of them can run side by side, on this device or on
another one synced to it.
