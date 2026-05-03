# Contributing to acp-bridge

`acp-bridge` is an open-source CLI client for the [Agent Client Protocol (ACP)](https://agentclientprotocol.com). Contributions — bug reports, fixes, new agent adapters, docs improvements — are welcome.

## Quick links

- **GitHub:** https://github.com/Dallionking/acp-bridge
- **Issues:** https://github.com/Dallionking/acp-bridge/issues
- **Discussions:** https://github.com/Dallionking/acp-bridge/discussions
- **Vision:** [`VISION.md`](VISION.md)

---

## Setup

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/acp-bridge.git
cd acp-bridge

# 2. Install dependencies (requires Node.js >=22.12.0 and pnpm)
pnpm install

# 3. Build
pnpm build

# 4. Run tests
pnpm test
```

Verify your build is clean before making changes:

```bash
pnpm run check   # format + typecheck + lint + build + test
```

---

## Branch naming

| Prefix | When to use |
| ------ | ----------- |
| `feat/` | New feature or agent adapter |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `chore/` | Tooling, deps, config — no behavior change |
| `refactor/` | Internal restructure — no behavior change |
| `test/` | Test additions or corrections |

Examples: `feat/gemini-adapter`, `fix/session-reconnect-race`, `docs/flows-readme`.

---

## Commit message format

This project follows [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

Valid types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`.

- Keep the subject line under 72 characters.
- Use imperative mood: "add adapter" not "added adapter".
- One logical change per commit.
- Group changelog updates with the PR that introduces the user-facing change.

---

## Opening a PR

For **bugs and small fixes** — open a PR directly.

For **new features or architecture changes** — open a [GitHub Discussion](https://github.com/Dallionking/acp-bridge/discussions) or issue first so we can agree on scope before you build it.

### PR checklist

- [ ] Branch is off `main` and is up to date
- [ ] Tests added or updated for the change
- [ ] `pnpm run check` passes locally
- [ ] PR description explains what changed and why
- [ ] Built-in agent docs, examples, and links are consistent with the change

### Review process

PRs require **one maintainer approval** before merge. The maintainer may request changes or ask clarifying questions via review comments.

If a review bot leaves conversations on your PR, you own the follow-through:

- Resolve a conversation yourself once the concern is fully addressed.
- Reply and leave it open only when you need maintainer judgment.
- Do not leave unresolved bot conversations for maintainers to clean up.

---

## Code style

- **TypeScript strict mode.** All code compiles with `strict: true`. Do not use `any` — use `unknown` with narrowing, or define a type.
- **No `console.log` in shipped code.** Use the structured logging path in `src/`.
- Formatter and linter run on commit via `lint-staged`. Run `pnpm run lint:fix` to auto-fix before committing.
- The project uses [oxlint](https://oxc.rs/docs/guide/usage/linter) and [oxfmt](https://github.com/nicolo-ribaudo/oxidize-fmt) — no Prettier or ESLint.

---

## Test requirements

Every PR that changes behavior must add or update tests. Coverage thresholds are enforced by CI:

- Line coverage: 83%
- Branch coverage: 76%
- Function coverage: 86%

Run tests with coverage locally:

```bash
pnpm test:coverage
```

If you add a new agent adapter, add at minimum one unit test for the adapter's session lifecycle (new, prompt, close).

---

## AI-assisted PRs

Built with Codex, Claude, or another AI tool? Welcome — just note it in the PR description and indicate the degree of testing you did on the output.

---

## Reporting a vulnerability

Report security issues via [GitHub Security Advisories](https://github.com/Dallionking/acp-bridge/security/advisories) — not via a public issue.

Include: title, severity, impact, affected component, reproduction steps, demonstrated impact, and remediation advice.
