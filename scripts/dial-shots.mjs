#!/usr/bin/env node
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
//
// Screenshots of the watch face, for iterating on its look.
//
// The dial is drawn from a stopwatch or a timer, the settings and the clock,
// and a change to how it draws is judged by eye — so this puts the production
// build in a headless browser, seeds a watch in one of a few states, pins the
// clock, and takes a picture of the dial for each combination asked for —
// and, when there is more than one, lays them out on a contact sheet,
// `sheet.png`, a row per dial and a column per state, so a change is read
// across the states at a glance. Run it after `make build`, or through
// `make shots`, which builds first.
//
//   node scripts/dial-shots.mjs                          the default dial, running, phone, dark
//   node scripts/dial-shots.mjs --preset all             every preset
//   node scripts/dial-shots.mjs --preset uptown --state fresh,running,paused,timer,done
//   node scripts/dial-shots.mjs --dial '{"face":"black","ring":"chapter"}'
//   node scripts/dial-shots.mjs --shell phone,stand,desk --theme dark,light
//   node scripts/dial-shots.mjs --preset abyss --settings
//   node scripts/dial-shots.mjs --preset uptown --tilt '0,0/25,0/0,-25/20,20'
//
// Options (each list is comma-separated):
//   --preset  <ids|all>   a preset id from look.ts (default: the default preset)
//   --dial    <json>      a custom dial instead, as fields over the default preset
//   --state   <list>      fresh | running | paused | timer | done (default: running)
//   --shell   <list>      phone | stand | desk                  (default: phone)
//   --theme   <list>      dark | light                          (default: dark)
//   --size    <id>        small | medium | large                (default: large)
//   --backlight <json>    backlight fields over the default (colour, hz, intensity, spread)
//   --tilt    <leans>     lean the device and let the light move: "beta,gamma",
//                         "/" between leans — one picture each, named by the pair
//   --at      <H:MM:SS>   the reading the hands show            (default: 1:12:41)
//                         a stopwatch's elapsed time, or a timer's time left
//   --settings            a picture of Settings' dial section too, opened from the dial
//   --full                the whole screen rather than the dial and its light
//   --no-sheet            the pictures only, without the contact sheet
//   --out     <dir>       where the pictures go                 (default: shots/)
//   --url     <url>       a running server to use               (default: http://localhost:4173/)
//   --browser <path>      a Chromium to run; otherwise Playwright's own
//
// Playwright is not a dependency of the app — nothing shipped needs it — so
// it is installed on demand and outside the lockfile:
//
//   npm install --no-save playwright && npx playwright install chromium
//
// A Chromium already on the machine is used instead with --browser or the
// PLAYWRIGHT_CHROMIUM variable; Claude Code on the web has one at
// /opt/pw-browsers/chromium, and the script looks there by itself.
//
// Nothing here reaches the network: the page is the local build, served by
// vite preview, which the script starts if nothing answers at --url.

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

import {
  DEFAULT_BACKLIGHT,
  DEFAULT_DIAL_PRESET,
  DIAL_PRESET,
  DIAL_PRESETS,
} from "../src/app/look.ts";

const STATES = ["fresh", "running", "paused", "timer", "done"];
const SHELLS = {
  phone: { width: 393, height: 852 },
  // The same phone laid on its side: the stand (see `shape.ts`), where the
  // watch's controls stand beside the dial and the dial is sized by the height
  // there is rather than the width. Worth `--full` more than the others are,
  // since what changed there is the screen round the watch.
  stand: { width: 852, height: 393 },
  desk: { width: 1280, height: 800 },
};
const THEMES = ["dark", "light"];
const H = 3600;
const M = 60;

const args = parseArgs(process.argv.slice(2));
const url = args.url ?? "http://localhost:4173/";
const out = resolve(args.out ?? "shots");
const at = parseTime(args.at ?? "1:12:41");
/** The moment the clock is pinned to while the pictures are taken. */
const NOW = new Date("2026-06-01T12:00:00Z").getTime();
const states = list(args.state, ["running"], STATES);
const shells = list(args.shell, ["phone"], Object.keys(SHELLS));
const themes = list(args.theme, ["dark"], THEMES);
const size = args.size ?? "large";
const backlight = { ...DEFAULT_BACKLIGHT, ...json(args.backlight) };
/** Leans to photograph the dial at, as the two angles a device reports:
 *  `beta,gamma` a pair, `/` between pairs. Each one is held on the page long
 *  enough for the light to settle there. */
const leans = args.tilt
  ? String(args.tilt)
      .split("/")
      .map((pair) => pair.split(",").map(Number))
  : [];

/** The dials to draw: presets by id, or one custom dial. */
const dials = args.dial
  ? [
      {
        name: "custom",
        preset: "custom",
        clock: { ...DIAL_PRESET[DEFAULT_DIAL_PRESET], ...json(args.dial) },
      },
    ]
  : list(args.preset, [DEFAULT_DIAL_PRESET], DIAL_PRESETS, "all").map((id) => ({
      name: id,
      preset: id,
      clock: DIAL_PRESET[id],
    }));

const { chromium } = await loadPlaywright();
const server = (await answers(url)) ? null : await startPreview(url);
mkdirSync(out, { recursive: true });

/** Every picture taken, for the sheet. */
const taken = [];

try {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  for (const dial of dials)
    for (const state of states)
      for (const shell of shells)
        for (const theme of themes) {
          const name = `${dial.name}-${state}-${shell}-${theme}`;
          const context = await browser.newContext({
            viewport: SHELLS[shell],
            deviceScaleFactor: 2,
            colorScheme: theme,
          });
          const page = await context.newPage();
          // The clock stands still, so a picture is the same picture twice
          // and the hands do not wind while it is taken.
          await page.clock.setFixedTime(NOW);
          await page.addInitScript(seed, {
            at,
            now: NOW,
            state,
            settings: {
              theme,
              clockPreset: dial.preset,
              clock: dial.clock,
              clockSize: size,
              backlight,
              reflect: leans.length > 0,
            },
          });
          await page.goto(url);
          // The fonts, and the light's fade-up. The callback runs in the page.
          // eslint-disable-next-line no-undef
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(900);
          for (const [beta, gamma] of leans.length ? leans : [[null, null]]) {
            // The light is eased towards rather than taken, so a lean is
            // held for a few dozen readings before the picture.
            if (beta !== null) await lean(page, beta, gamma);
            const lit = beta === null ? name : `${name}-tilt${beta}_${gamma}`;
            await page.screenshot({
              path: `${out}/${lit}.png`,
              clip: args.full ? undefined : await dialClip(page, SHELLS[shell]),
            });
            console.log(`${lit}.png`);
            taken.push({
              file: `${out}/${lit}.png`,
              dial: dial.name,
              state: beta === null ? state : `${beta}° / ${gamma}°`,
              shell,
              theme,
            });
          }

          if (args.settings) {
            await page
              .getByRole("button", { name: "Settings" })
              .first()
              .click();
            // The pickers under Custom when there are any, else the cards.
            const movement = page.getByText("Movement", { exact: true });
            const anchor = (await movement.count())
              ? movement.first()
              : page.getByText("The dial", { exact: true }).first();
            await anchor.scrollIntoViewIfNeeded();
            await page.waitForTimeout(400);
            await page.screenshot({ path: `${out}/${name}-settings.png` });
            console.log(`${name}-settings.png`);
          }
          await context.close();
        }
  if (taken.length > 1 && !args["no-sheet"]) {
    await sheet(browser, taken, `${out}/sheet.png`);
    console.log("sheet.png");
  }
  await browser.close();
} finally {
  server?.kill();
}

/** The pictures on one page: a row for each dial, shell and theme, a column
 *  for each state, every cell labelled — the same page in the same browser,
 *  with the pictures inlined, so it needs nothing the shots did not. */
async function sheet(browser, shots, file) {
  const columns = states.filter((s) => shots.some((x) => x.state === s));
  const rows = [];
  for (const shot of shots) {
    const key = `${shot.dial} · ${shot.shell} · ${shot.theme}`;
    let row = rows.find((r) => r.key === key);
    if (!row) rows.push((row = { key, cells: {} }));
    row.cells[shot.state] = shot.file;
  }
  const cell = 340;
  const html = `<!doctype html><meta charset="utf-8">
<style>
  body { margin: 0; padding: 24px; background: #15171a; color: #d7dae0;
         font: 13px/1.4 system-ui, sans-serif; }
  h1 { font-size: 15px; font-weight: 600; margin: 0 0 16px; color: #f2f3f5; }
  table { border-collapse: separate; border-spacing: 12px; }
  th { text-align: left; font-weight: 600; color: #f2f3f5; white-space: nowrap;
       vertical-align: top; padding-top: 6px; }
  thead th { text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px;
             color: #9aa0a8; padding: 0 0 4px; }
  td { width: ${cell}px; vertical-align: top; background: #0b0c0e;
       border-radius: 12px; padding: 8px; }
  img { display: block; width: ${cell}px; height: auto; border-radius: 8px; }
</style>
<h1>${escape(`Dial shots · reading ${args.at ?? "1:12:41"}`)}</h1>
<table>
  <thead><tr><th></th>${columns.map((c) => `<th>${escape(c)}</th>`).join("")}</tr></thead>
  <tbody>${rows
    .map(
      (r) =>
        `<tr><th>${escape(r.key)}</th>${columns
          .map((c) =>
            r.cells[c]
              ? `<td><img src="${dataUri(r.cells[c])}"></td>`
              : "<td></td>",
          )
          .join("")}</tr>`,
    )
    .join("")}</tbody>
</table>`;
  const page = await browser.newPage({
    viewport: { width: 220 + columns.length * (cell + 28) + 48, height: 800 },
  });
  await page.setContent(html);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
}

function dataUri(file) {
  return `data:image/png;base64,${readFileSync(file).toString("base64")}`;
}

function escape(text) {
  return String(text).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

/** The watch and the settings a state is drawn from, written into
 *  localStorage before the app boots. Runs in the page. `at` is the reading,
 *  in seconds, and `now` the pinned clock. */
function seed({ at, now, state, settings }) {
  const stamp = new Date(now).toISOString();
  const run = (patch) => ({
    id: "w1",
    name: "Stopwatch 1",
    startedAt: null,
    banked: 0,
    stopped: false,
    createdAt: now - 3_600_000,
    updatedAt: stamp,
    ...patch,
  });
  const ms = at * 1000;
  const stopwatches = {
    // A fresh one: nothing in the document, the dial at zero.
    fresh: {},
    running: { w1: run({ startedAt: now - ms }) },
    paused: { w1: run({ banked: ms }) },
  };
  // A timer with `at` left of half as long again, and one run out.
  const timers = {
    timer: {
      w1: run({
        name: "Timer 1",
        duration: ms * 1.5,
        startedAt: now - ms * 0.5,
      }),
    },
    done: {
      w1: run({ name: "Timer 1", duration: ms, startedAt: now - ms - 5000 }),
    },
  };
  const isTimer = state in timers;
  localStorage.setItem(
    "timer:doc",
    JSON.stringify({
      version: 1,
      stopwatches: isTimer ? {} : stopwatches[state],
      timers: isTimer ? timers[state] : {},
    }),
  );
  localStorage.setItem(
    "timer:settings",
    JSON.stringify({ ...settings, mode: isTimer ? "timer" : "stopwatch" }),
  );
}

/** Lean the device: fifty readings of the same angles, which is enough for
 *  the eased light to arrive at them, and a moment for the paint. */
async function lean(page, beta, gamma) {
  await page.evaluate(
    ([b, g]) => {
      for (let i = 0; i < 50; i += 1) {
        const event = new Event("deviceorientation");
        Object.defineProperty(event, "beta", { value: b });
        Object.defineProperty(event, "gamma", { value: g });
        Object.defineProperty(event, "alpha", { value: 0 });
        // eslint-disable-next-line no-undef
        window.dispatchEvent(event);
      }
    },
    [beta, gamma],
  );
  await page.waitForTimeout(150);
}

/** The dial and the light round it, as a clip inside the viewport. */
async function dialClip(page, viewport) {
  const box = await page.locator('[data-area="dial"]').boundingBox();
  if (!box) return undefined;
  const pad = 24;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  return {
    x,
    y,
    width: Math.min(viewport.width - x, box.width + 2 * pad),
    height: Math.min(viewport.height - y, box.height + 2 * pad),
  };
}

// ── The machinery ──

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) fail(`unexpected argument: ${arg}`);
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (
      key === "settings" ||
      key === "full" ||
      next === undefined ||
      next.startsWith("--")
    ) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

/** A comma-separated list, checked against what is on offer. */
function list(value, fallback, offered, all) {
  if (value === undefined || value === true) return fallback;
  if (all && value === all) return [...offered];
  const items = String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const item of items) {
    if (!offered.includes(item))
      fail(`unknown value "${item}"; one of ${offered.join(", ")}`);
  }
  return items;
}

function json(value) {
  if (value === undefined || value === true) return {};
  try {
    return JSON.parse(value);
  } catch {
    return fail(`not JSON: ${value}`);
  }
}

/** H:MM:SS (or MM:SS) to seconds. */
function parseTime(text) {
  const m = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/.exec(text);
  if (!m) fail(`--at wants H:MM:SS or MM:SS, not "${text}"`);
  return Number(m[1] ?? 0) * H + Number(m[2]) * M + Number(m[3]);
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return fail(
      "playwright is not installed. It is not a dependency of the app, so install it outside the lockfile:\n" +
        "  npm install --no-save playwright && npx playwright install chromium",
    );
  }
}

/** A Chromium to run: the one named, the one Claude Code on the web keeps,
 *  or Playwright's own. */
function chromiumPath() {
  const named = args.browser ?? process.env.PLAYWRIGHT_CHROMIUM;
  if (named) return named;
  const web = "/opt/pw-browsers/chromium";
  return existsSync(web) ? web : undefined;
}

async function answers(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

/** `vite preview` on the port --url names, serving dist/. */
async function startPreview(url) {
  if (!existsSync(resolve("dist/index.html"))) {
    fail(
      `nothing answers at ${url} and there is no dist/ to serve — run \`make build\` first`,
    );
  }
  const port = new URL(url).port || "4173";
  const child = spawn(
    "npx",
    ["vite", "preview", "--port", port, "--strictPort"],
    {
      stdio: "ignore",
    },
  );
  for (let i = 0; i < 40; i++) {
    if (await answers(url)) return child;
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  return fail(`vite preview did not come up at ${url}`);
}

function fail(message) {
  console.error(message);
  process.exit(2);
}
