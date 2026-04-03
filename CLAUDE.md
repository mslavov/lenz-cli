# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm run build          # TypeScript -> dist/
npm run dev            # Run via tsx (no build needed)
npx tsx src/index.ts   # Run directly during development
```

## Architecture

CLI + Claude Code skill for the Lenz fact-checking API (https://lenz.io/api/v1/).

**Three source files:**
- `src/client.ts` — REST API client using native `fetch`. All Lenz API endpoints are methods on `LenzClient`. Public endpoints (claims, domains, podcasts) don't require auth; authenticated endpoints (submit, my-claims, chat) do.
- `src/formatters.ts` — Chalk-based pretty-print formatters. Score-based coloring (green=true, red=untrue, yellow=mixed). Each CLI command maps to a formatter function.
- `src/index.ts` — CLI entry point. Uses `skillflag` (must be at top before commander), then `commander` for subcommands. Token resolution: `--token` flag > `LENZ_TOKEN` env > `~/.config/lenz-cli/config.json`.

**Skill definition:** `skills/lenz/SKILL.md` — Claude Code skill with `allowed-tools` frontmatter. Teaches the AI fact-checking workflows.

## Key Patterns

- Mirrors the structure of [lenny-skill](https://github.com/mslavov/lenny-skill) — same tooling (skillflag, commander, chalk)
- `createClient()` for public commands (token optional), `createAuthClient()` for authenticated commands (token required, exits if missing)
- Every command respects `--json` global flag for machine-readable output
- Package publishes `dist/` and `skills/` via `files` field; bin entries are `lenz` and `lenz-cli`
