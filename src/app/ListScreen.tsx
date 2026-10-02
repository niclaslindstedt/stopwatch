// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import { ConfirmDialog } from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import type { Stopwatch, Timer, WatchKind } from "./types.ts";
import { useNow } from "./useNow.ts";
import type { Watches } from "./useWatches.ts";
import { WatchRow } from "./WatchRow.tsx";

// The two pages: every stopwatch, and every timer.
//
// One component for both, because they are the same page about two kinds of
// the same thing. The ones still out come first — the same ones the main
// screen lists under the dial — and then the ones put away, which are listed
// here and nowhere else, and are started again from here. This is also where a
// stopwatch is named: the name is a field on its row, kept when it is left.

type Props = {
  kind: WatchKind;
  watches: Watches;
  /** Bring one up onto the main screen's dial, and go there. */
  onShow: (id: string) => void;
  onNotice: (message: string) => void;
};

export function ListScreen({ kind, watches, onShow, onNotice }: Props) {
  const t = useT();
  const now = useNow(1000);
  const [deleting, setDeleting] = useState<Stopwatch | Timer | null>(null);
  const all: (Stopwatch | Timer)[] =
    kind === "stopwatch" ? watches.stopwatches : watches.timers;
  const active = all.filter((r) => !r.stopped);
  const stopped = all.filter((r) => r.stopped);
  const focused =
    kind === "stopwatch" ? watches.focusedStopwatch : watches.focusedTimer;

  const row = (r: Stopwatch | Timer) => (
    <WatchRow
      key={r.id}
      kind={kind}
      run={r}
      now={now}
      onDial={r.id === focused?.id}
      onToggle={() => watches.toggleOne(kind, r.id)}
      onReset={() => watches.resetOne(kind, r.id)}
      onStop={() => watches.stopOne(kind, r.id)}
      onRestart={() => {
        watches.restartOne(kind, r.id);
        onShow(r.id);
      }}
      onRename={(name) => watches.renameOne(kind, r.id, name)}
      onDelete={() => setDeleting(r)}
    />
  );

  return (
    <div className="flex flex-col gap-4 px-3 py-3">
      <p className="px-1 text-sm text-muted">
        {t(kind === "stopwatch" ? "list.stopwatchesIntro" : "list.timersIntro")}
      </p>

      {all.length === 0 && (
        <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
          {t(
            kind === "stopwatch" ? "list.emptyStopwatches" : "list.emptyTimers",
          )}
        </p>
      )}

      {active.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-bold tracking-wide text-muted uppercase">
            {t("list.active")}
          </h2>
          <ul className="flex flex-col gap-2">{active.map(row)}</ul>
        </section>
      )}

      {stopped.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-bold tracking-wide text-muted uppercase">
            {t("list.stopped")}
          </h2>
          <ul className="flex flex-col gap-2">{stopped.map(row)}</ul>
        </section>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t("list.deleteConfirm", { name: deleting?.name ?? "" })}
        description={t("list.deleteHint")}
        confirmLabel={t("common.delete")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          if (deleting) {
            watches.removeOne(kind, deleting.id);
            onNotice(t("list.deleted", { name: deleting.name }));
          }
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
