# Security policy for stopwatch

## Supported versions

The latest release line on `main` receives security fixes. Older lines are
considered end-of-life.

## Reporting a vulnerability

**Do not open public GitHub issues for security problems.**

Instead, please report privately via [GitHub Security Advisories](https://github.com/niclaslindstedt/stopwatch/security/advisories/new),
or by email to `niclas@agilator.se`.

## Response

We aim to acknowledge reports within 72 hours and provide a triage update
within 7 days.

## Disclosure

We follow coordinated disclosure: we will agree on a release window with the
reporter and credit them in the release notes (unless they request otherwise).

## Scope

In scope: any vulnerability in the published release of stopwatch. This app
holds what somebody is timing, named in their own words, and when they started
it, so the paths that decide who can read it are the ones that matter most —
the OAuth token handling for the cloud backends (`src/app/useSyncEngine.ts`),
the pairing and keys of a self-hosted storage server (`src/app/selfHosted.ts`),
what the synced document contains, and anything that could leak a stopwatch
off the device or into a log, a URL, or a third party. A finding that the app sends data anywhere it does not say it does is
always in scope.

Out of scope: vulnerabilities in third-party dependencies (please report those
upstream).
