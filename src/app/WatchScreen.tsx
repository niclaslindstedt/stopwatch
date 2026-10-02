// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  PlusIcon,
  SegmentedControl,
} from "@niclaslindstedt/oss-framework/components";

import { heldAt, type Reading } from "./clock.ts";
import { formatClock, formatDuration } from "./format.ts";
import { useT } from "./i18n/index.ts";
import {
  HourglassIcon,
  MinusIcon,
  ResetIcon,
  StopIcon,
  StopwatchIcon,
} from "./icons.tsx";
import {
  CLOCK_SIZE,
  type Backlight,
  type ClockSize,
  type DialConfig,
} from "./look.ts";
import { KEY_HINT, type Command } from "./shortcuts.ts";
import type { Stopwatch, Timer, WatchKind } from "./types.ts";
import type { AppSettings } from "./useAppSettings.ts";
import { useNow } from "./useNow.ts";
import { useShortcuts } from "./useShortcuts.ts";
import type { Watches } from "./useWatches.ts";
import { WatchFace, type GlowState } from "./WatchFace.tsx";
import { LiveReading, WatchRow, readingText } from "./WatchRow.tsx";
import {
  TIMER_HOURS,
  TIMER_MINUTES,
  elapsed,
  endsAt,
  isRunning,
  partsOf,
  remaining,
  stopwatchState,
  timerLeft,
  timerState,
  type TimerState,
} from "./watch.ts";

// The main screen: the watch.
//
// Two tabs over the dial — the stopwatch and the timer, each with its glyph —
// and one dial under them, drawn as a stopwatch whichever tab is showing. The
// whole watch is the switch: pressed, it starts the one on the dial, holds it,
// or carries on; on a fresh one it is the press that makes it. A timer is set
// in hours and minutes under the dial before it is started, and counts down on
// the same face, the hands going backwards and the bezel running out.
//
// Several can run at once. "New" puts a fresh one on the dial and leaves the
// others going, and everything not put away is listed under the controls — a
// scroll down from the watch — where any of them can be held, carried on, put
// away or brought up onto the dial. One put away leaves this screen for its
// page, which is where it is started again.
//
// Where the window is wide — a desk, a phone laid on its side — the tabs and
// the controls stand to the left of the dial and the running list to its
// right, so the watch keeps the middle and nothing is below a fold (see
// `.app-today` in `styles.css`).

type Props = {
  watches: Watches;
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  dial: DialConfig;
  clockSize: ClockSize;
  backlight: Backlight;
  reflect: boolean;
  onOpenSettings: () => void;
  settingsOpen?: boolean;
  /** Open the page listing every one of a kind. */
  onOpenList: (kind: WatchKind) => void;
};

export function WatchScreen({
  watches,
  settings,
  update,
  dial,
  clockSize,
  backlight,
  reflect,
  onOpenSettings,
  settingsOpen,
  onOpenList,
}: Props) {
  const t = useT();
  const now = useNow(1000);
  const top = useRef<HTMLDivElement>(null);
  const mode = settings.mode;
  const stopwatch = mode === "stopwatch";
  const run: Stopwatch | Timer | null = stopwatch
    ? watches.focusedStopwatch
    : watches.focusedTimer;
  const active: (Stopwatch | Timer)[] = stopwatch
    ? watches.activeStopwatches
    : watches.activeTimers;

  const state: TimerState = run
    ? stopwatch
      ? stopwatchState(run)
      : timerState(run as Timer, now)
    : "idle";
  const running = state === "running";
  const done = state === "done";

  // What the dial is handed. A fresh stopwatch is at zero and a fresh timer
  // at what it is set to, both held; one that is out reads what it reads, and
  // moves while it runs — up for a stopwatch, down for a timer, until a timer
  // reaches nothing.
  const reading = useMemo<Reading>(() => {
    if (!run) {
      return heldAt(stopwatch ? 0 : watches.draftDuration / 1000);
    }
    if (stopwatch) {
      return {
        value: elapsed(run, now) / 1000,
        at: now,
        rate: isRunning(run) ? 1 : 0,
      };
    }
    return {
      value: remaining(run as Timer, now) / 1000,
      at: now,
      rate: running ? -1 : 0,
    };
  }, [run, stopwatch, now, running, watches.draftDuration]);

  const glow: GlowState = done ? "done" : running ? "running" : "off";
  const progress = !stopwatch && run ? timerLeft(run as Timer, now) : undefined;
  const name = run ? run.name : null;

  const label = done
    ? t("watch.dismissName", { name: name ?? "" })
    : !run
      ? t("watch.start")
      : running
        ? t("watch.pauseName", { name: run.name })
        : state === "idle"
          ? t("watch.startName", { name: run.name })
          : t("watch.resumeName", { name: run.name });

  const toTop = () =>
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });

  // The keyboard, on a desk: the dial, a new one, a reset, the two tabs.
  const keys = useRef<(command: Command) => boolean>(() => false);
  keys.current = (command) => {
    switch (command.kind) {
      case "toggle":
        watches.press(mode);
        return true;
      case "new":
        watches.focus(mode, "new");
        return true;
      case "reset":
        if (run) watches.resetOne(mode, run.id);
        return true;
      case "mode":
        update("mode", command.mode);
        return true;
      default:
        return false;
    }
  };
  useShortcuts(useCallback((command: Command) => keys.current(command), []));

  // The window's title says what is running, so a tab in the background still
  // tells the time.
  const titleReading = run
    ? readingText(mode, run, now).replace(/\.\d$/, "")
    : "";
  useEffect(() => {
    if (!run || state === "idle" || state === "stopped") return;
    return setWindowTitle(
      t("watch.tabTitle", {
        reading: done ? t("watch.ringing") : titleReading,
        name: run.name,
        app: t("app.name"),
      }),
    );
  }, [run, state, done, titleReading, t]);

  const timerParts = partsOf(
    run && !stopwatch ? (run as Timer).duration : watches.draftDuration,
  );
  /** A timer can be set while it is fresh, or idle at the top of its time. */
  const settable = !stopwatch && (!run || state === "idle");
  const ringsAt = !stopwatch && run && running ? endsAt(run as Timer) : null;

  return (
    <div ref={top} className="app-today flex flex-1 flex-col gap-3 px-3 py-3">
      <div data-area="tabs" className="flex justify-center">
        <div className="w-full max-w-sm">
          <SegmentedControl<WatchKind>
            value={mode}
            options={[
              {
                value: "stopwatch",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <StopwatchIcon className="h-4 w-4" />
                    {t("watch.stopwatch")}
                  </span>
                ),
              },
              {
                value: "timer",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <HourglassIcon className="h-4 w-4" />
                    {t("watch.timer")}
                  </span>
                ),
              },
            ]}
            onChange={(next) => update("mode", next)}
            ariaLabel={t("watch.tabs")}
            fullWidth
          />
        </div>
      </div>

      <div data-area="dial" className="flex flex-col items-center gap-2">
        <div
          className="app-dial-slot w-full"
          style={
            { "--dial-share": CLOCK_SIZE[clockSize].share } as Record<
              string,
              number
            >
          }
        >
          <WatchFace
            reading={reading}
            glow={glow}
            dial={dial}
            size={clockSize}
            backlight={backlight}
            reflect={reflect}
            progress={progress}
            label={label}
            pressed={running}
            desc={t(stopwatch ? "watch.clockDesc" : "watch.timerDesc")}
            onToggle={() => watches.press(mode)}
            onOpenSettings={onOpenSettings}
            settingsOpen={settingsOpen}
          />
        </div>
        {/* The words under the dial, in a block of their own with the room
            for both lines held whatever is on, so the watch does not change
            size when one starts (`.app-dial-note`). */}
        <div className="app-dial-note flex flex-col items-center gap-0.5">
          {run ? (
            <LiveReading
              kind={mode}
              run={run}
              className={`text-2xl font-semibold ${
                done ? "text-flag" : running ? "text-fg-bright" : "text-muted"
              }`}
            />
          ) : (
            <span className="text-2xl font-semibold text-muted tabular-nums">
              {stopwatch ? "00:00.0" : formatDuration(watches.draftDuration)}
            </span>
          )}
          <p
            className={`text-xs font-bold tracking-wide uppercase ${
              done ? "text-flag" : running ? "text-accent" : "text-muted"
            }`}
          >
            {run ? (
              <>
                {run.name}
                {" · "}
                {done
                  ? t("watch.ringing")
                  : ringsAt !== null
                    ? t("watch.rings", { time: formatClock(ringsAt) })
                    : t(`watch.state.${state}` as const)}
              </>
            ) : (
              t(stopwatch ? "watch.hintStopwatch" : "watch.hintTimer")
            )}
          </p>
        </div>
      </div>

      <div data-area="controls" className="flex flex-col items-center gap-3">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {settable && (
            <TimerSetter
              hours={timerParts.hours}
              minutes={timerParts.minutes}
              onChange={(h, m) => watches.setTimer(h, m)}
            />
          )}
          <div className="flex justify-center gap-2 wide:flex-col">
            <ControlButton
              label={t(stopwatch ? "watch.newStopwatch" : "watch.newTimer")}
              hint={KEY_HINT.new}
              disabled={!run}
              onClick={() => watches.focus(mode, "new")}
            >
              <PlusIcon className="h-4 w-4" />
              {t("watch.new")}
            </ControlButton>
            <ControlButton
              label={t("watch.reset")}
              hint={KEY_HINT.reset}
              disabled={!run || running || done || state === "idle"}
              onClick={() => run && watches.resetOne(mode, run.id)}
            >
              <ResetIcon className="h-4 w-4" />
              {t("watch.reset")}
            </ControlButton>
            <ControlButton
              label={
                done
                  ? t("watch.dismissName", { name: name ?? "" })
                  : t("watch.stop")
              }
              disabled={!run}
              tone={done ? "flag" : undefined}
              onClick={() => run && watches.stopOne(mode, run.id)}
            >
              <StopIcon className="h-4 w-4" />
              {t("watch.stop")}
            </ControlButton>
          </div>
        </div>
      </div>

      {/* Everything still out, below the watch: a scroll down on a phone, the
          right-hand column on a wide screen. */}
      <section
        data-area="list"
        aria-label={t(
          stopwatch ? "watch.activeStopwatches" : "watch.activeTimers",
        )}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-bold tracking-wide text-muted uppercase">
            {t(stopwatch ? "watch.activeStopwatches" : "watch.activeTimers")}
          </h2>
          {active.length === 0 ||
          (active.length === 1 && active[0]!.id === run?.id) ? (
            <p className="px-1 text-sm text-muted">
              {t(
                stopwatch
                  ? "watch.noneActiveStopwatches"
                  : "watch.noneActiveTimers",
              )}
            </p>
          ) : null}
          <ul className="flex flex-col gap-2">
            {active.map((r) => (
              <WatchRow
                key={r.id}
                kind={mode}
                run={r}
                now={now}
                onDial={r.id === run?.id}
                onShow={() => {
                  watches.focus(mode, r.id);
                  toTop();
                }}
                onToggle={() => watches.toggleOne(mode, r.id)}
                onReset={() => watches.resetOne(mode, r.id)}
                onStop={() => watches.stopOne(mode, r.id)}
              />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onOpenList(mode)}
            className="self-start rounded-md px-1 py-1 text-sm font-medium text-accent hover:underline"
          >
            {t(stopwatch ? "watch.allStopwatches" : "watch.allTimers")} →
          </button>
        </div>
      </section>
    </div>
  );
}

/** One of the buttons under the dial: a glyph and a word, and the key it is
 *  on in the tooltip for a desk. */
function ControlButton({
  label,
  hint,
  disabled,
  tone,
  onClick,
  children,
}: {
  label: string;
  hint?: string;
  disabled?: boolean;
  tone?: "flag";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={hint ? `${label} (${hint})` : label}
      className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md border px-2 text-sm whitespace-nowrap font-semibold transition-colors disabled:cursor-default disabled:opacity-40 ${
        tone === "flag"
          ? "border-flag bg-flag/15 text-flag"
          : "border-line bg-surface text-fg enabled:hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

/** The quick lengths a timer is most often set to, in minutes. */
const QUICK = [1, 3, 5, 10, 15, 30, 60] as const;

/**
 * Setting a timer: hours and minutes, each with a step either side of it, and
 * a row of the lengths a timer is most often set to. Steppers rather than a
 * field, because a timer is set with a thumb while the other hand is busy.
 */
function TimerSetter({
  hours,
  minutes,
  onChange,
}: {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
}) {
  const t = useT();
  const total = hours * 60 + minutes;
  const step = (delta: number) => {
    const next = Math.max(
      1,
      Math.min(TIMER_HOURS.max * 60 + TIMER_MINUTES.max, total + delta),
    );
    onChange(Math.floor(next / 60), next % 60);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center gap-3">
        <Stepper
          value={hours}
          unit={t("watch.hoursShort")}
          what={t("watch.hours")}
          onLess={() => step(-60)}
          onMore={() => step(60)}
          lessDisabled={hours === 0}
        />
        <Stepper
          value={minutes}
          pad
          unit={t("watch.minutesShort")}
          what={t("watch.minutes")}
          onLess={() => step(-1)}
          onMore={() => step(1)}
          lessDisabled={total <= 1}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {QUICK.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(Math.floor(m / 60), m % 60)}
            aria-pressed={total === m}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums transition-colors ${
              total === m
                ? "border-accent bg-accent/15 text-fg-bright"
                : "border-line text-muted hover:bg-surface-2"
            }`}
          >
            {formatDuration(m * 60_000)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({
  value,
  unit,
  what,
  pad = false,
  onLess,
  onMore,
  lessDisabled,
}: {
  value: number;
  unit: string;
  what: string;
  pad?: boolean;
  onLess: () => void;
  onMore: () => void;
  lessDisabled?: boolean;
}) {
  const t = useT();
  return (
    <div
      role="group"
      aria-label={what}
      className="flex items-center gap-1 rounded-md border border-line bg-surface px-1 py-1"
    >
      <button
        type="button"
        onClick={onLess}
        disabled={lessDisabled}
        aria-label={t("watch.less", { what })}
        className="flex h-9 w-9 items-center justify-center rounded-md text-fg transition-colors enabled:hover:bg-surface-2 disabled:opacity-40"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span className="min-w-[3.5rem] text-center text-lg font-semibold text-fg-bright tabular-nums">
        {pad ? String(value).padStart(2, "0") : value}
        <span className="ml-0.5 text-xs font-medium text-muted">{unit}</span>
      </span>
      <button
        type="button"
        onClick={onMore}
        aria-label={t("watch.more", { what })}
        className="flex h-9 w-9 items-center justify-center rounded-md text-fg transition-colors hover:bg-surface-2"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/** The window's title, and the way to put it back. */
function setWindowTitle(title: string): () => void {
  const original = document.title;
  document.title = title;
  return () => {
    document.title = original;
  };
}
