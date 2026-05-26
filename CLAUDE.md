# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `README.md` for install, usage, and CLI flag behavior.

## Architecture

Single-file ESM CLI at `bin/archive-linear-issue.js`, wired up as the `archive-linear-issue` binary via the `bin` field in `package.json`. Zero runtime dependencies — uses only Node built-ins (`node:util`'s `parseArgs`, global `fetch`).

The two-step flow matters because Linear's `issueArchive` mutation requires a UUID, but users typically pass human-readable identifiers like `ENG-1`:

1. `resolveUuid()` — runs the `GetIssue` query to translate identifier → UUID + title.
2. `archive()` — runs the `issueArchive` mutation against the UUID.

The lookup step is skipped when the input already looks like a UUID. The detection heuristic is "exactly 4 dashes" (UUIDs are 8-4-4-4-12) — fragile if Linear ever changes identifier formats, but adequate for the current `TEAM-NNN` vs UUID distinction.

All GraphQL traffic goes through `gql()`, which on HTTP error prints the response body and exits non-zero. Per-issue mutation errors are reported but do not abort the run — the script continues processing remaining IDs and prints a final `N archived, M failed` summary.
