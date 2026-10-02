// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  SpinnerIcon,
  ToastViewport,
  createToastStore,
} from "@niclaslindstedt/oss-framework/components";
import { useSwipeNav } from "@niclaslindstedt/oss-framework/hooks";
import { LogViewer } from "@niclaslindstedt/oss-framework/logging";
import { UpdateToast, usePwaUpdate } from "@niclaslindstedt/oss-framework/pwa";
import {
  SyncDetailsModal,
  SyncStatus,
} from "@niclaslindstedt/oss-framework/sync";
import { useApplyTheme } from "@niclaslindstedt/oss-framework/theme";

import {
  BottomNav,
  isNavTab,
  screenEnter,
  TABS,
  type NavTab,
  type ScreenEnter,
  type Tab,
} from "./app/BottomNav.tsx";
import { demoBackendModule, useDemoData } from "./app/dev/useDemoData.ts";
import { useT } from "./app/i18n/index.ts";
import { ListScreen } from "./app/ListScreen.tsx";
import { appearanceFor, resolveBacklight, resolveDial } from "./app/look.ts";
import { logStore } from "./app/log.ts";
import { cacheIdForBase } from "./app/pwa.ts";
import { SelfHostedConnectModal } from "./app/SelfHostedConnectModal.tsx";
import { SettingsScreen } from "./app/SettingsScreen.tsx";
import { SidePanel } from "./app/SidePanel.tsx";
import { TopBar, topBarNeeded } from "./app/TopBar.tsx";
import { useAlarm } from "./app/useAlarm.ts";
import { useAppSettings } from "./app/useAppSettings.ts";
import { useFocus } from "./app/useFocus.ts";
import { resolveHourCycle, setLocalePrefs } from "./app/locale.ts";
import { useDesk, useStand, useWide } from "./app/useShape.ts";
import { localDocBackend, useDocStore } from "./app/useDocStore.ts";
import { useShortcuts } from "./app/useShortcuts.ts";
import { useSyncEngine } from "./app/useSyncEngine.ts";
import { useWatches } from "./app/useWatches.ts";
import { WatchScreen } from "./app/WatchScreen.tsx";
import { status } from "./output.ts";

// Local-first stopwatches and timers, built from the framework's shared
// surface. The app owns the document store, the readings (`watch.ts`) and the
// four screens; the framework supplies the theme engine, the storage adapters
// behind sync, the bottom bar, and the PWA update lifecycle.
//
// Everything hangs off one document in localStorage. There is no server:
// cloud sync, when connected, is a copy of that same document in the user's
// own Dropbox, iCloud or storage server.
//
// Two shells over the same screens. On a phone the three destinations sit on
// the bottom bar; on a desk (`useDesk`) they sit on the top bar, Settings
// slides in over the right-hand edge (`SidePanel.tsx`) so the dial is still
// in view while a watch face is picked, and the keyboard reaches the lot
// (`shortcuts.ts`). The screens themselves know nothing of either shell.
//
// Three *shapes* of window, though, and the third is the phone laid on its
// side — the stand (`shape.ts`). It keeps the phone's shell down to the last
// habit, bottom bar and swipe included, and changes only the watch screen,
// which has no height to stack in and stands its controls beside the dial
// the way the desk does. `useWide` is that pair of shapes and nothing more;
// everything it guards here is layout.
//
// That shape is also the one meant to be left alone, so it has a mode of its
// own: propped up and untouched on the watch, everything but the dial fades
// out and the first touch brings it back (`useFocus.ts`, and
// `[data-focus="on"]` in `styles.css`). The shell says when; nothing under it
// knows, and nothing moves.

// Module-scoped so the identity stays stable across renders (the framework's
// `useToasts` keys its subscription on the store object).
const toasts = createToastStore();

export function App() {
  const t = useT();
  const { settings, update } = useAppSettings();
  // The clock and the week every screen is shown in: the device's locale's,
  // unless Settings chose (`locale.ts`). Set before any screen renders, so
  // the formatters they call read this render's answer.
  setLocalePrefs({ hourCycle: resolveHourCycle(settings.hourClock) });
  useApplyTheme(useMemo(() => appearanceFor(settings.theme), [settings.theme]));

  // Developer "Demo data" takeover: while the toggle is on, an in-memory
  // backend seeded with an invented afternoon replaces the real localStorage
  // one for the session (see `useDemoData`).
  const demo = useDemoData();
  const backend = useMemo(() => {
    const module = demoBackendModule();
    if (demo.on && module) return module.createDemoBackend();
    return localDocBackend;
  }, [demo.on]);
  const store = useDocStore(backend);
  const sync = useSyncEngine(store, demo.on);

  const watches = useWatches(store, settings, update);

  const desk = useDesk();
  const stand = useStand();
  // Whether the watch screen stands its controls beside the dial: the desk,
  // and a phone laid on its side (see `shape.ts`). Layout only — the stand
  // keeps every one of the phone shell's habits, bottom bar and swipe
  // included.
  const wide = useWide();
  const [tab, setTab] = useState<Tab>("watch");
  // Where the bottom nav was left, so closing Settings comes back to it.
  const [home, setHome] = useState<NavTab>("watch");
  const [enter, setEnter] = useState<ScreenEnter>("none");
  // The desk's Settings panel. Kept apart from `tab` on purpose: on the
  // desk Settings is over the screen rather than in place of it, and a
  // window that narrows to the phone shell with the panel open simply drops
  // it and shows whatever tab was left.
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Focus mode: the phone laid down on the watch and left alone, where
  // everything but the dial fades out until the screen is touched again (see
  // `useFocus.ts`). The stand and the watch together, because the thing left
  // showing has to be worth leaving showing — the other screens are lists,
  // and a list nobody is reading is nothing to look at.
  const focus = useFocus(stand && tab === "watch");

  const show = useCallback(
    (next: Tab) => {
      setEnter(screenEnter(tab, next));
      if (isNavTab(next)) setHome(next);
      setTab(next);
    },
    [tab],
  );
  const toggleSettings = useCallback(() => {
    if (desk) {
      setSettingsOpen((open) => !open);
      return;
    }
    const target: Tab = tab === "settings" ? home : "settings";
    setEnter(screenEnter(tab, target));
    setTab(target);
  }, [desk, tab, home]);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  // A window widened into the desk while on the Settings tab: the desk has
  // no such tab, so the screen goes back to where the bar was and Settings
  // carries on as the panel.
  useEffect(() => {
    if (!desk || tab !== "settings") return;
    setTab(home);
    setSettingsOpen(true);
  }, [desk, tab, home]);

  // The desk's keys for the shell; the watch's own keys are the watch
  // screen's (see `shortcuts.ts`). A key for the watch pressed on one of the
  // pages brings the watch up first.
  useShortcuts(
    useCallback(
      (command) => {
        if (!desk) return false;
        if (command.kind === "settings") {
          toggleSettings();
          return true;
        }
        if (command.kind === "mode" && tab !== "watch") {
          update("mode", command.mode);
          show("watch");
          return true;
        }
        return false;
      },
      [desk, toggleSettings, show, tab, update],
    ),
  );

  // A swipe moves one tab along the bar and stops at its ends; from Settings
  // it goes back to the tab it was opened from.
  const main = useRef<HTMLElement>(null);
  const swipe = useCallback(
    (direction: 1 | -1) => {
      if (!isNavTab(tab)) {
        setEnter(screenEnter(tab, home));
        setTab(home);
        return;
      }
      const next = TABS[TABS.indexOf(tab) + direction];
      if (next !== undefined) show(next);
    },
    [tab, home, show],
  );
  // A mouse drag across the desk is a selection, not a page turn.
  useSwipeNav(main, swipe, { enabled: !desk });

  const [syncDetailsOpen, setSyncDetailsOpen] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    logStore.setCaptureEnabled(settings.captureLogs);
  }, [settings.captureLogs]);

  const notice = useCallback((message: string) => {
    toasts.clear();
    toasts.push({ message, kind: "success", durationMs: 2500 });
  }, []);

  // A refused write: the document did not reach the disk, and nothing on the
  // screen would show it otherwise.
  useEffect(() => {
    if (store.writeFailures === 0) return;
    toasts.clear();
    toasts.push({
      message: t("settings.importFailed"),
      kind: "danger",
      durationMs: 8000,
    });
  }, [store.writeFailures, t]);

  const pwa = usePwaUpdate({
    base: import.meta.env.BASE_URL,
    cacheId: cacheIdForBase(import.meta.env.BASE_URL),
    enabled: !import.meta.env.DEV && !__SHELL_BUILD__,
  });
  useEffect(() => {
    if (pwa.needRefresh) status(`Update ready: ${pwa.incomingVersion ?? "?"}`);
  }, [pwa.needRefresh, pwa.incomingVersion]);

  // A timer that runs out says so whichever screen is open.
  useAlarm(
    watches.activeTimers,
    { sound: settings.alarmSound, vibrate: settings.alarmVibrate },
    notice,
  );

  const watchScreen = (
    <WatchScreen
      watches={watches}
      settings={settings}
      update={update}
      dial={resolveDial(settings.clockPreset, settings.clock)}
      clockSize={settings.clockSize}
      backlight={resolveBacklight(settings.clockPreset, settings.backlight)}
      reflect={settings.reflect}
      onOpenSettings={toggleSettings}
      settingsOpen={desk && settingsOpen}
      onOpenList={(kind) =>
        show(kind === "stopwatch" ? "stopwatches" : "timers")
      }
    />
  );
  const listScreen = (kind: "stopwatch" | "timer") => (
    <ListScreen
      kind={kind}
      watches={watches}
      onShow={(id) => {
        watches.focus(kind, id);
        update("mode", kind);
        show("watch");
      }}
      onNotice={notice}
    />
  );
  const settingsScreen = (
    <SettingsScreen
      settings={settings}
      update={update}
      store={store}
      sync={sync}
      demoData={demo}
      onNotice={notice}
    />
  );

  // The top bar, and whether there is one. The watch carries the app's name
  // and the cog itself (see `Dial.tsx`), so over it the bar has neither; on
  // the phone that leaves it empty unless there is a cloud to show, and an
  // empty bar is not drawn — the watch is the top of the screen, and the
  // screen pads down from the status bar itself (`.app-bare`).
  const bar = {
    watch: tab === "watch",
    onSelect: desk ? show : undefined,
    syncSlot:
      sync.backend !== "local" ? (
        <SyncStatus
          providerName={sync.providerName}
          status={sync.status}
          dirty={sync.dirty}
          offline={sync.offline}
          onOpenDetails={() => setSyncDetailsOpen(true)}
          labels={{ syncedTo: (name) => t("sync.syncedTo", { name }) }}
        />
      ) : undefined,
  };
  const bare = !topBarNeeded(bar);

  return (
    <div
      data-focus={focus ? "on" : undefined}
      className="flex h-full flex-col bg-page text-fg"
    >
      {!bare && (
        <TopBar
          active={tab}
          onOpenSettings={toggleSettings}
          settingsOpen={desk && settingsOpen}
          {...bar}
        />
      )}

      {/* The content area. It is the frame rather than the scroller: the
          screen inside it scrolls, and so does the desk's settings panel,
          but the area itself never does. `relative` is what the panel and
          the `sr-only` inputs are positioned against, and `overflow-clip`
          rather than `hidden` on purpose — `clip` is not a scroll container,
          so this box has a height of its own for the panel to be measured
          against. Positioned inside a *scrolling* box the panel took the
          height of the settings page instead, and the page behind it grew by
          the whole of it. It also clips the arriving screen's slide and the
          backlight's spill. See the sibling cycle app for the long
          version. */}
      <main
        ref={main}
        className="app-main relative min-h-0 flex-1 overflow-clip"
      >
        {/* The one scrolling region — except on the desk's watch screen,
            which is laid out to the height of the window on purpose (see
            `.app-today` in `styles.css`). There the glow behind the dial
            reaches past the bottom of the screen, and a decoration is not
            something to scroll to: the screen holds still and the light is
            clipped at the edge of the content area. */}
        <div
          className={`h-full overflow-y-auto overflow-x-hidden ${
            wide && tab === "watch" ? "wide:overflow-hidden" : ""
          }`}
        >
          <div
            key={tab}
            data-enter={enter}
            className={`app-screen mx-auto flex min-h-full max-w-2xl flex-col ${
              desk ? "lg:max-w-3xl" : ""
            } ${wide && tab === "watch" ? "wide:h-full wide:max-w-none" : ""} ${
              bare ? "app-bare" : ""
            }`}
          >
            {tab === "watch" && watchScreen}
            {tab === "stopwatches" && listScreen("stopwatch")}
            {tab === "timers" && listScreen("timer")}
            {tab === "settings" && settingsScreen}
          </div>
        </div>

        {desk && settingsOpen && (
          <SidePanel title={t("nav.settings")} onClose={closeSettings}>
            {settingsScreen}
          </SidePanel>
        )}
      </main>

      {/* The update prompt, anchored above the bar rather than over it — the
          bottom of the screen is the navigation here. */}
      <div className="app-update-slot relative z-[60]">
        {pwa.needRefresh && reloading ? (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-x-3 bottom-3 mx-auto flex max-w-md items-center gap-3 rounded-sm border border-line bg-surface px-3 py-2.5 text-fg shadow-md"
          >
            <SpinnerIcon className="h-5 w-5 animate-spin text-accent" />
            <span className="text-sm font-medium">{t("update.reload")}</span>
          </div>
        ) : (
          <UpdateToast
            needRefresh={pwa.needRefresh}
            incomingVersion={pwa.incomingVersion}
            onReload={() => {
              setReloading(true);
              pwa.reload();
            }}
            onDismiss={() => pwa.dismiss()}
            labels={{
              ready: t("update.available"),
              action: t("update.reload"),
              dismiss: t("common.close"),
            }}
          />
        )}
      </div>

      {!desk && <BottomNav active={tab} onSelect={show} bare={bare} />}

      <SyncDetailsModal
        open={syncDetailsOpen}
        providerName={sync.providerName}
        backendKind="cloud"
        location={sync.location}
        status={sync.status}
        statusDetail={sync.statusDetail}
        dirty={sync.dirty}
        offline={sync.offline}
        onSaveNow={sync.saveNow}
        onReload={() => void sync.reload()}
        onReconnect={sync.reconnect}
        onCheckConnection={sync.checkConnection}
        logPanel={settings.devMode ? <LogViewer store={logStore} /> : undefined}
        onClose={() => setSyncDetailsOpen(false)}
      />

      {/* Pairing with the reader's own server — asked for by the storage
          picker, or by a pairing QR the phone's camera opened the app with. */}
      {sync.selfHosted.connectRequest && (
        <SelfHostedConnectModal
          selfHosted={sync.selfHosted}
          initialPayload={sync.selfHosted.connectRequest.payload}
          onConnected={sync.adoptSelfHosted}
          onClose={sync.selfHosted.closeConnect}
        />
      )}

      {/* Top, not the framework's default bottom: a toast at the bottom
          lands on the bar under the thumb. */}
      <ToastViewport
        store={toasts}
        labels={{ dismiss: t("common.close") }}
        className="app-toasts pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      />
    </div>
  );
}
