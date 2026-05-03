# AGENTS.md — acp-bridge

## Purpose

This file is for contributors and coding agents working in this repository.
Keep it focused on how to develop, validate, and ship `acp-bridge`.

Use these files for the other concerns:

- [`README.md`](README.md) for user-facing install and usage
- [`docs/CLI.md`](docs/CLI.md) for CLI reference
- [`VISION.md`](VISION.md) for product direction and boundaries
- [`CONTRIBUTING.md`](CONTRIBUTING.md) for PR expectations
- [`skills/acp-bridge/SKILL.md`](skills/acp-bridge/SKILL.md) for agent-usage guidance

When you need implementation detail, prefer the in-repo references below
instead of expanding this file into a full technical spec.

## Repo

- GitHub: `https://github.com/Dallionking/acp-bridge`
- npm: `https://www.npmjs.com/package/acp-bridge`
- Default branch: `main`
- Runtime: Node.js `>=22.12.0`
- Package manager: `pnpm@10.33.2`

## Product Direction

- `acp-bridge` should be the smallest useful ACP client: a lightweight CLI that lets one
  agent talk to another agent through the Agent Client Protocol without PTY
  scraping or adapter-specific glue.
- The goal is not to build a giant orchestration layer. The goal is to make ACP
  practical, robust, and easy to compose in real workflows.
- The primary user is another agent, orchestrator, or harness. Human usability
  still matters, but it is a secondary constraint.
- `acp-bridge` should not try to do too many things at once.
- If a feature does not make `acp-bridge` a better ACP client or backend, it probably
  does not belong in core.
- In `acp-bridge`, data models, config keys, keywords, flags, output shapes, and naming
  conventions are part of the product surface.
- They should be scrutinized multiple times before being added or changed.
  Convenience is not enough. Every new convention creates long-term compatibility
  cost.
- The default stance should be to add fewer conventions, make them clearer, and
  keep them stable.
- Read [`VISION.md`](VISION.md) before changing user-visible behavior or conventions.

## Setup

Install dependencies:

```bash
pnpm install
```

Run the CLI from source:

```bash
pnpm run dev -- --help
```

Build the distributable CLI:

```bash
pnpm run build
node dist/cli.js --help
```

Published install/use:

```bash
npm install -g acp-bridge@latest
# or
npx acp-bridge@latest --help
```

## Local Workflow

1. Make changes in `src/`, `test/`, docs, or workflow files.
2. Use `pnpm run dev -- ...` for quick manual checks.
3. Run the smallest relevant validation command while iterating.
4. Before opening or updating a PR, run the full checks for the scope you changed.

## Documentation Policy

Example ordering policy:

1. `pi`
2. `codex`
3. `claude`
4. `gemini`
5. `cursor`
6. `copilot`

This ordering is mandatory whenever multiple built-in agents appear in the same example set.

Main landing documentation policy:

1. Main landing docs such as `README.md` and `docs/CLI.md` MUST remain impartial.
2. `codex` and `claude` are the primary citizens for examples.
3. The only main-landing exceptions are the neutral built-in agents table in `README.md` and
   the neutral built-in agents list in `agents/README.md`. Those lists MAY include every
   supported built-in harness, but they MUST remain exhaustive, factual, and non-promotional.
4. Harness-specific docs for supported agents MUST live under `agents/` and MUST use
   capitalized filenames, for example `agents/Cursor.md` and `agents/Copilot.md`.
5. Documentation MUST NOT include adapter package version specifiers or semver ranges.
   Keep documentation generic. Keep actual adapter pinning in code, config, or release logic.

Harness documentation synchronization policy:

1. Any PR that adds, removes, renames, or materially changes a built-in harness agent
   MUST update [`skills/acp-bridge/SKILL.md`](skills/acp-bridge/SKILL.md) in the same change.
2. The same PR MUST also update the matching harness doc under `agents/`.
3. If a harness-specific doc does not exist yet, create `agents/{Agent}.md` as part of the
   same change.

## Common Commands

- `pnpm run build` — build the distributable CLI
- `pnpm run test` — local test run without coverage gate
- `pnpm run test:coverage` — CI-equivalent test run with coverage thresholds
- `pnpm run typecheck` — TypeScript typecheck
- `pnpm run lint` — source linting plus persisted-key casing checks
- `pnpm run format:check` — formatting check
- `pnpm run check` — format, typecheck, lint, build, and coverage tests
- `pnpm run check:docs` — docs format and markdown lint
- `pnpm run perf:report` — performance reporting helper

## Testing And Changelog Guidelines

- Run `pnpm run test` or `pnpm run test:coverage` before pushing when you touch
  runtime logic.
- Changelog entries should cover user-facing changes only.
- Changelog placement: add new entries under [`CHANGELOG.md`](CHANGELOG.md)
  `## Unreleased`, appending to the end of the target section.
- Pure test-only changes generally do not need a changelog entry unless they
  change user-visible behavior or the maintainer explicitly wants one.

## Commit And Pull Request Guidelines

- Pull request titles MUST use conventional prefixes such as `feat:`, `fix:`,
  `docs:`, `chore:`, `refactor:`, or `test:` and should summarize the actual
  change directly.
- Use concise, action-oriented commit messages and keep unrelated refactors out
  of the same commit when possible.

## Fundamental acp-bridge Calls

Use these examples when you need the most basic `acp-bridge` flows while developing
or validating the CLI:

```bash
acp-bridge codex sessions new
acp-bridge codex 'fix the failing test'
acp-bridge codex prompt 'rewrite AGENTS.md for contributors'
acp-bridge codex exec 'summarize this repo'
acp-bridge exec 'summarize this repo'                  # defaults to codex
acp-bridge codex sessions list
acp-bridge codex sessions show
acp-bridge codex status
acp-bridge codex cancel
acp-bridge codex sessions new --name docs
acp-bridge codex -s docs 'rewrite CLI docs'
acp-bridge config show
acp-bridge config init
acp-bridge --format json codex exec 'review changed files'
```

## When To Run Checks

- Docs-only changes in `docs/**`, [`README.md`](README.md), or [`CONTRIBUTING.md`](CONTRIBUTING.md):
  run `pnpm run check:docs`
- Code changes in `src/**`, `test/**`, `scripts/**`, `package.json`, or workflow files:
  run `pnpm run check`
- Code plus docs changes:
  run both `pnpm run check` and `pnpm run check:docs`
- Quick iteration on runtime or test changes:
  use `pnpm run test` first, then `pnpm run check` before pushing

## CI

CI lives in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

- Pull requests and pushes run against `main`
- CI first detects change scope
- Docs-only changes skip the code matrix
- Non-doc changes run: format, typecheck, lint, build, test:coverage

## Release / CD

Release automation lives in [`.github/workflows/release.yml`](.github/workflows/release.yml).

- Releases run when a `vX.Y.Z` tag is pushed
- It validates that the tag matches `package.json` version and that the tagged commit is on `main`
- It runs `pnpm run lint`, `pnpm run typecheck`, and `pnpm run build`
- It publishes directly to npm with trusted publishing and provenance

## Key Areas

- [`src/`](src) — CLI and runtime implementation
- [`test/`](test) — Node test suite
- [`scripts/`](scripts) — repo maintenance and perf helpers
- [`README.md`](README.md) — install and usage docs
- [`docs/CLI.md`](docs/CLI.md) — full CLI reference
- [`VISION.md`](VISION.md) — product boundaries
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution workflow

## Technical References

- [`src/cli-core.ts`](src/cli-core.ts) — top-level CLI entrypoint and output policy handling
- [`src/acp/client.ts`](src/acp/client.ts) — ACP client integration
- [`src/cli/config.ts`](src/cli/config.ts) — config loading and defaults
- [`src/agent-registry.ts`](src/agent-registry.ts) — built-in agent names and commands
- [`src/cli/session/runtime.ts`](src/cli/session/runtime.ts) and [`src/cli/session/`](src/cli/session) — CLI session lifecycle and runtime behavior
- [`src/cli/queue/ipc.ts`](src/cli/queue/ipc.ts) and [`src/cli/queue/ipc-server.ts`](src/cli/queue/ipc-server.ts) — queue IPC behavior
- [`test/integration.test.ts`](test/integration.test.ts) — end-to-end CLI expectations
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — CI behavior
- [`.github/workflows/release.yml`](.github/workflows/release.yml) — release workflow
