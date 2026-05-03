# Contributing to acp-bridge

Welcome! `acp-bridge` is an open-source CLI client for the Agent Client Protocol (ACP).

## Quick Links

- **GitHub:** https://github.com/Dallionking/acp-bridge
- **Vision:** [`VISION.md`](VISION.md)
- **Issues:** https://github.com/Dallionking/acp-bridge/issues

## How to Contribute

1. **Bugs & small fixes** → Open a PR!
2. **New features / architecture** → Open a [GitHub Discussion](https://github.com/Dallionking/acp-bridge/discussions) or file an issue first
3. **Questions** → Open a GitHub issue with the `question` label

## Before You PR

- Test locally with your ACP agent of choice
- Run tests: `pnpm build && pnpm check && pnpm test:coverage`
- Ensure CI checks pass
- Keep PRs focused (one thing per PR; do not mix unrelated concerns)
- Keep built-in agent docs, examples, and links consistent with the existing docs structure
- Describe what & why in the PR description

## Review Conversations Are Author-Owned

If a review bot leaves review conversations on your PR, you are expected to handle the follow-through:

- Resolve the conversation yourself once the code or explanation fully addresses the concern
- Reply and leave it open only when you need maintainer judgment
- Do not leave "fixed" bot review conversations for maintainers to clean up

## AI/Vibe-Coded PRs Welcome! 🤖

Built with Codex, Claude, or other AI tools? Just mark it in the PR description and note the degree of testing.

## Commit Guidelines

- Use conventional prefix: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- Keep commits focused — one logical change per commit
- Group changelog updates with the PR that introduces the user-facing change

## Report a Vulnerability

Report security vulnerabilities via GitHub Security Advisories:
https://github.com/Dallionking/acp-bridge/security/advisories

Include: title, severity, impact, affected component, reproduction steps, demonstrated impact, remediation advice.
