// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The persistence pipeline: raw JSON in, a validated `AppData` out, and back.
// Every read — from localStorage, from a cloud backend, from a restored
// backup — goes through `parseDoc`, so no other module has to trust the bytes
// it was handed.
//
// The framework owns the migration *runner* (`createMigrator`); this module
// owns the step table and the shape validation. A schema change means bumping
// `DOC_VERSION` in `types.ts` and appending one step here — never editing an
// existing step, which would silently rewrite documents that already migrated
// through it.
//
// A *purely additive optional* field is the one change that needs no step:
// absent is a thing this module can read, and it is the validation below,
// rather than a step, that says what such a record looks like.

import {
  createMigrator,
  type Versioned,
} from "@niclaslindstedt/oss-framework/storage";

import {
  DOC_VERSION,
  emptyDoc,
  type AppData,
  type Run,
  type Timer,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const EPOCH = new Date(0).toISOString();

/** The longest name kept: a name is a label on a row, not a note. */
export const NAME_MAX = 60;

function finite(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

/** One stored run, or null when it is not one. A run with no id is not
 *  addressable and is dropped; every other field has a reading for absent. */
function parseRun(key: string, value: unknown): Run | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === "string" && value.id ? value.id : key;
  if (!id) return null;
  const startedAt = finite(value.startedAt);
  const banked = finite(value.banked);
  const createdAt = finite(value.createdAt);
  const name =
    typeof value.name === "string" ? value.name.trim().slice(0, NAME_MAX) : "";
  const run: Run = {
    id,
    name,
    startedAt: startedAt !== null && startedAt >= 0 ? startedAt : null,
    banked: banked !== null && banked > 0 ? banked : 0,
    stopped: value.stopped === true,
    createdAt: createdAt !== null && createdAt >= 0 ? createdAt : 0,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : EPOCH,
  };
  if (value.deleted === true) run.deleted = true;
  return run;
}

function parseTimer(key: string, value: unknown): Timer | null {
  const run = parseRun(key, value);
  if (!run || !isRecord(value)) return null;
  const duration = finite(value.duration);
  // A timer that counts down from nothing is not a timer — unless it is a
  // tombstone, which only has to say that it went.
  if ((duration === null || duration <= 0) && !run.deleted) return null;
  return { ...run, duration: duration !== null && duration > 0 ? duration : 0 };
}

function parseAll<R>(
  value: unknown,
  parse: (key: string, raw: unknown) => R | null,
  idOf: (r: R) => string,
): Record<string, R> {
  const out: Record<string, R> = {};
  if (!isRecord(value)) return out;
  for (const [key, raw] of Object.entries(value)) {
    const record = parse(key, raw);
    if (record) out[idOf(record)] = record;
  }
  return out;
}

// Step `n` migrates a document from version `n` to `n + 1`. v0 is a document
// that predates versioning (the framework's runner reads a missing `version`
// as 0); v1 is the first published shape. Existing steps are never edited.
const migrator = createMigrator({
  latestVersion: DOC_VERSION,
  migrations: {
    0: (doc: Versioned) => ({ ...doc, version: 1 }),
  },
});

/** Validate and normalise an arbitrary parsed value into an `AppData`. */
export function normalizeDoc(value: unknown): AppData {
  if (!isRecord(value)) return emptyDoc();
  const { data } = migrator.migrate(value);
  const migrated = data as unknown as Record<string, unknown>;
  return {
    version: DOC_VERSION,
    stopwatches: parseAll(migrated.stopwatches, parseRun, (r) => r.id),
    timers: parseAll(migrated.timers, parseTimer, (r) => r.id),
  };
}

/** Parse serialized document bytes. Throws on malformed JSON so the caller
 *  can decide whether to quarantine the stored copy — a *shape* problem is
 *  recoverable (unknown fields are dropped), a *syntax* problem is not. */
export function parseDoc(raw: string): AppData {
  return normalizeDoc(JSON.parse(raw) as unknown);
}

function sorted<R>(records: Record<string, R>): Record<string, R> {
  const out: Record<string, R> = {};
  for (const id of Object.keys(records).sort()) out[id] = records[id]!;
  return out;
}

/** Serialize a document for storage. Keys are emitted in sorted order so the
 *  bytes are stable — two devices holding the same watches produce the same
 *  string, which keeps cloud revisions from churning on no-op saves. */
export function serializeDoc(data: AppData): string {
  return JSON.stringify({
    version: DOC_VERSION,
    stopwatches: sorted(data.stopwatches),
    timers: sorted(data.timers),
  });
}
