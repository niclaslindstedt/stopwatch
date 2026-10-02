// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, type ReactNode } from "react";

import {
  BottomNav as NavBar,
  stepDirection,
} from "@niclaslindstedt/oss-framework/components";

import { DialIcon, HourglassIcon, StopwatchIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";

// The phone's bottom bar: the three places the app has. The watch — the dial,
// with its stopwatch and timer tabs — and the two pages, every stopwatch and
// every timer. Settings is not one of them: it is a thing you do and leave,
// reached from the cog on the dial and the top bar (see `TopBar.tsx`).

/** Every screen the shell can show. */
export type Tab = "watch" | "stopwatches" | "timers" | "settings";

/** The screens that are *destinations* — the ones the bottom bar carries and
 *  a swipe moves between. */
export type NavTab = "watch" | "stopwatches" | "timers";

export const TABS: NavTab[] = ["watch", "stopwatches", "timers"];

export function isNavTab(tab: Tab): tab is NavTab {
  return (TABS as Tab[]).includes(tab);
}

export type ScreenEnter = "forward" | "back" | "none";

/** How a move from one screen to another should animate: in from the side
 *  the bar's order puts it on, or a fade for Settings, which is off the bar. */
export function screenEnter(from: Tab, to: Tab): ScreenEnter {
  return stepDirection(TABS, from as NavTab, to as NavTab);
}

/** The glyph for each destination — the bottom bar's, and the desk's top
 *  tabs', so a place is one shape on both shells. */
export const NAV_ICONS: Record<
  NavTab,
  (props: { className?: string }) => ReactNode
> = {
  watch: DialIcon,
  stopwatches: StopwatchIcon,
  timers: HourglassIcon,
};

export function BottomNav({
  active,
  onSelect,
  bare = false,
}: {
  active: Tab;
  onSelect: (tab: NavTab) => void;
  /** Whether the screen under it has no bar of its own — over the watch,
   *  which is where the strip may float rather than take a row. */
  bare?: boolean;
}) {
  const t = useT();
  const items = useMemo(
    () =>
      TABS.map((tab) => ({
        id: tab,
        label: t(`nav.${tab}` as const),
        icon: NAV_ICONS[tab],
      })),
    [t],
  );
  return (
    <NavBar
      items={items}
      active={active}
      onSelect={onSelect}
      label={t("app.name")}
      className={`app-bottom-nav${bare ? " app-nav-floating" : ""}`}
    />
  );
}
