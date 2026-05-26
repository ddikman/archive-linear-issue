# archive-linear-issue

A tiny CLI that archives Linear issues in bulk via Linear's GraphQL API.

Linear's free plan caps a workspace at 250 issues, and its automatic archiver takes months to recycle old ones. This script uses the GraphQL API to archive issues on demand, freeing up slots within the cap well before that.

> Built with Claude — run and tested manually.

## Requirements

- Node.js ≥ 18
- A Linear personal API key (Linear settings → API → create a personal key, format `lin_api_...`)

## Usage

Directly with node:

```
node bin/archive-linear-issue.js --api-key lin_api_xxx ENG-1 ENG-2 ENG-3
```

After `npm link` (registers `archive-linear-issue` as a global binary):

```
npm link
archive-linear-issue --api-key lin_api_xxx ENG-1
```

With `npx` against this directory (no link required):

```
npx . --api-key lin_api_xxx ENG-1
```

The API key can also be supplied via the `LINEAR_API_KEY` environment variable, which is used as a fallback when `--api-key` is omitted:

```
export LINEAR_API_KEY=lin_api_xxx
archive-linear-issue ENG-1 ENG-2
```

Each positional argument can be a human-readable identifier (`ENG-1`) or a UUID — identifiers are resolved to UUIDs automatically before archiving. The CLI prints `✓` / `✗` per issue and a final `N archived, M failed` summary. A failed lookup aborts the run; a failed archive of an individual issue is reported but does not stop the rest.
