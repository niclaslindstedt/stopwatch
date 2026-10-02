// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useRef, useState } from "react";

import { TrashIcon } from "@niclaslindstedt/oss-framework/components";

import { formatDuration, formatElapsed, formatRemaining } from "./format.ts";
import { useT } from "./i18n/index.ts";
import {
  BellIcon,
  HourglassIcon,
  PauseIcon,
  PlayIcon,
  ResetIcon,
  StopIcon,
  StopwatchIcon,
} from "./icons.tsx";
import type { Millis, Stopwatch, Timer, WatchKind } from "./types.ts";
import { useNow } from "./useNow.ts";
import {
  elapsed,
  isRunning,
  remaining,
  stopwatchState,
  timerState,
  type TimerState,
} from "./watch.ts";

// One stopwatch or one timer as a row: its mark, its name, what it reads and
// the buttons a row may carry. The main screen's running list and the two
// pages draw the same row, so a stopwatch looks the same wherever it is listed
// — the pages add the name field and the buttons that only make sense there.
//
// What it reads is ticked by the row itself (`LiveReading`), at the rate the
// reading needs — tenths for a stopwatch, seconds for a timer — and only while
// it is running, so a list of held ones is still and the screen around it is
// never re-rendered for a digit.

/** What a row's reading ticks at: a tenth for a stopwatch, a second for a
 *  timer, and not at all for one that is held. */
function tickFor(kind: WatchKind, running: boolean): number {
  if (!running) return 60_000;
  return kind === "stopwatch" ? 100 : 250;
}

/** A stopwatch's or a timer's reading, ticking while it runs. */
export function LiveReading({
  kind,
  run,
  className,
}: {
  kind: WatchKind;
  run: Stopwatch | Timer;
  className?: string;
}) {
  const now = useNow(tickFor(kind, isRunning(run)));
  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      {readingText(kind, run, now)}
    </span>
  );
}

/** The figure a row and the line under the dial print. */
export function readingText(
  kind: WatchKind,
  run: Stopwatch | Timer,
  now: Millis,
): string {
  return kind === "stopwatch"
    ? formatElapsed(elapsed(run, now))
    : formatRemaining(remaining(run as Timer, now));
}

type Props = {
  kind: WatchKind;
  run: Stopwatch | Timer;
  /** The moment the row's state is read at — the screen's, once a second. */
  now: Millis;
  /** Whether it is the one on the dial, which the row says. */
  onDial?: boolean;
  /** Pressing the row's body: put it on the dial. */
  onShow?: () => void;
  onToggle: () => void;
  onReset?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
};

export function WatchRow({
  kind,
  run,
  now,
  onDial = false,
  onShow,
  onToggle,
  onReset,
  onStop,
  onRestart,
  onRename,
  onDelete,
}: Props) {
  const t = useT();
  const state: TimerState =
    kind === "stopwatch" ? stopwatchState(run) : timerState(run as Timer, now);
  const running = state === "running";
  const done = state === "done";
  const Mark = kind === "stopwatch" ? StopwatchIcon : HourglassIcon;
  const name = run.name || t(`watch.${kind}Word` as const);

  return (
    <li
      className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
        done
          ? "border-flag/60 bg-flag/10"
          : onDial
            ? "border-accent/50 bg-accent/5"
            : "border-line bg-surface"
      }`}
    >
      <span
        aria-hidden="true"
        className={`shrink-0 ${
          done ? "text-flag" : running ? "text-accent" : "text-muted"
        }`}
      >
        {done ? <BellIcon className="h-5 w-5" /> : <Mark className="h-5 w-5" />}
      </span>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {onRename ? (
          <NameField
            value={run.name}
            label={t("list.renameLabel", { name })}
            onCommit={onRename}
          />
        ) : onShow ? (
          <button
            type="button"
            onClick={onShow}
            title={t("watch.show", { name })}
            className="truncate text-left text-sm font-semibold text-fg-bright hover:underline"
          >
            {name}
          </button>
        ) : (
          <span className="truncate text-sm font-semibold text-fg-bright">
            {name}
          </span>
        )}
        <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
          <LiveReading
            kind={kind}
            run={run}
            className={`text-base font-semibold ${
              done ? "text-flag" : running ? "text-fg" : "text-muted"
            }`}
          />
          <span className={done ? "font-semibold text-flag" : ""}>
            {t(`watch.state.${state}` as const)}
          </span>
          {kind === "timer" && (
            <span>
              {t("watch.setFor", {
                duration: formatDuration((run as Timer).duration),
              })}
            </span>
          )}
          {onDial && <span className="text-accent">{t("watch.onDial")}</span>}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {state === "stopped" ? (
          <>
            {onRestart && (
              <RowButton
                label={t("watch.restart")}
                onClick={onRestart}
                tone="accent"
              >
                <PlayIcon className="h-4 w-4" />
              </RowButton>
            )}
          </>
        ) : (
          <>
            {onReset && !running && !done && state !== "idle" && (
              <RowButton label={t("watch.reset")} onClick={onReset}>
                <ResetIcon className="h-4 w-4" />
              </RowButton>
            )}
            {onStop && (
              <RowButton
                label={
                  done ? t("watch.dismissName", { name }) : t("watch.stop")
                }
                onClick={onStop}
                tone={done ? "flag" : undefined}
              >
                <StopIcon className="h-4 w-4" />
              </RowButton>
            )}
            {!done && (
              <RowButton
                label={
                  running
                    ? t("watch.pauseName", { name })
                    : state === "idle"
                      ? t("watch.startName", { name })
                      : t("watch.resumeName", { name })
                }
                onClick={onToggle}
                tone="accent"
                pressed={running}
              >
                {running ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </RowButton>
            )}
          </>
        )}
        {onDelete && (
          <RowButton
            label={t("common.delete")}
            onClick={onDelete}
            tone="danger"
          >
            <TrashIcon className="h-4 w-4" />
          </RowButton>
        )}
      </div>
    </li>
  );
}

function RowButton({
  label,
  onClick,
  tone,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "accent" | "flag" | "danger";
  pressed?: boolean;
  children: React.ReactNode;
}) {
  const colour =
    tone === "accent"
      ? "text-accent"
      : tone === "flag"
        ? "text-flag"
        : tone === "danger"
          ? "text-muted hover:text-danger"
          : "text-muted hover:text-fg";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-surface-2 ${colour}`}
    >
      {children}
    </button>
  );
}

/** A name, edited in place: typed into, and kept when the field is left or
 *  Enter is pressed. A blank one is not a name, and puts the old one back. */
function NameField({
  value,
  label,
  onCommit,
}: {
  value: string;
  label: string;
  onCommit: (name: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const editing = useRef(false);
  /** Escape leaves the field without keeping what was typed. */
  const cancelled = useRef(false);
  useEffect(() => {
    if (!editing.current) setDraft(value);
  }, [value]);
  const commit = (typed: string) => {
    editing.current = false;
    const keep = !cancelled.current && typed.trim() && typed.trim() !== value;
    cancelled.current = false;
    if (keep) onCommit(typed);
    else setDraft(value);
  };
  return (
    <input
      type="text"
      value={draft}
      aria-label={label}
      maxLength={60}
      onFocus={() => {
        editing.current = true;
      }}
      onInput={(e) => setDraft(e.currentTarget.value)}
      onBlur={(e) => commit(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      className="-mx-1 w-full truncate rounded-sm border border-transparent bg-transparent px-1 text-sm font-semibold text-fg-bright hover:border-line focus:border-accent focus:outline-none"
    />
  );
}
