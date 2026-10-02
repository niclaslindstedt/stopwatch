// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Every file the app hands over — the backup is the one — leaves through the
// framework's `saveFile`: a download on the web, the share sheet in the phone
// app. A download link clicked by hand goes nowhere inside the app's WebView,
// so the last test keeps one from coming back.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { SAVE_FILE_RESULT_EVENT } from "@niclaslindstedt/oss-framework/files";

import { backupFileName, saveBackup } from "../src/app/backup.ts";
import { emptyDoc } from "../src/app/types.ts";
import { stopwatch } from "./fixtures/helpers.ts";
import {
  decodeBase64,
  stubBrowser,
  stubWebView,
  type WebViewWindow,
} from "./fixtures/shell.ts";

/** A shell that shares every file it is sent. */
const shares = (message: { id: string }, win: WebViewWindow) =>
  win.dispatchEvent(
    new CustomEvent(SAVE_FILE_RESULT_EVENT, {
      detail: { id: message.id, ok: true },
    }),
  );

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("on the web", () => {
  it("downloads the backup as JSON", async () => {
    const downloads = stubBrowser();
    const sw = stopwatch();
    await saveBackup({ ...emptyDoc(), stopwatches: { [sw.id]: sw } });
    expect(downloads.map((d) => d.filename)).toEqual([backupFileName()]);
    expect(downloads[0]!.blob.type).toBe("application/json;charset=utf-8");
    const restored = JSON.parse(await downloads[0]!.blob.text()) as {
      stopwatches: Record<string, unknown>;
    };
    expect(Object.keys(restored.stopwatches)).toEqual([sw.id]);
  });

  it("stays a download in a WebView whose shell cannot save a file", async () => {
    const downloads = stubBrowser();
    const { posted } = stubWebView(shares, []);
    await expect(saveBackup(emptyDoc())).resolves.toBe("downloaded");
    expect(posted).toHaveLength(0);
    expect(downloads).toHaveLength(1);
  });
});

describe("in the phone app", () => {
  it("hands the backup to the shell as plain application/json", async () => {
    const downloads = stubBrowser();
    const { posted } = stubWebView(shares, ["save-file"]);
    await expect(saveBackup(emptyDoc())).resolves.toBe("shared");
    expect(downloads).toHaveLength(0);
    expect(posted.map((m) => [m.filename, m.mimeType])).toEqual([
      [backupFileName(), "application/json"],
    ]);
    const text = new TextDecoder().decode(decodeBase64(posted[0]!.base64));
    expect(JSON.parse(text)).toMatchObject({ stopwatches: {}, timers: {} });
  });

  it("rejects with the shell's error, so the screen can say so", async () => {
    stubBrowser();
    stubWebView(
      (message, win) =>
        win.dispatchEvent(
          new CustomEvent(SAVE_FILE_RESULT_EVENT, {
            detail: { id: message.id, ok: false, error: "disk full" },
          }),
        ),
      ["save-file"],
    );
    await expect(saveBackup(emptyDoc())).rejects.toThrow("disk full");
  });
});

describe("the exports", () => {
  it("never click a download link of their own", () => {
    // `downloadBlob` / `downloadText` / an anchor's `download` are the web's
    // download and nothing else: in the phone app they save nothing.
    const offenders = sources(join(import.meta.dirname, "..", "src")).filter(
      (file) =>
        /\b(downloadBlob|downloadText|saveDataUrl)\b|\.download\s*=/.test(
          readFileSync(file, "utf8"),
        ),
    );
    expect(offenders).toEqual([]);
  });
});

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}
