# Security Policy

If you believe you have found a security issue in `acp-bridge`, please report it privately.

## Reporting

Report vulnerabilities via GitHub Security Advisories:

- [Dallionking/acp-bridge Security](https://github.com/Dallionking/acp-bridge/security/advisories)

Please include:

1. **Title**
2. **Severity assessment**
3. **Impact**
4. **Affected component**
5. **Technical reproduction**
6. **Demonstrated impact**
7. **Environment**
8. **Remediation advice**

Reports without reproduction steps, demonstrated impact, and remediation advice may be deprioritized.

## Bug Bounties

`acp-bridge` is an open-source tool. There is no bug bounty program. Please disclose responsibly so issues can be fixed quickly. The best way to help the project right now is by sending PRs.

## Maintainers: GHSA Updates via CLI

When patching a GHSA via `gh api`, include `X-GitHub-Api-Version: 2022-11-28` (or newer). Without it, some fields, notably CVSS, may not persist even if the request returns 200.

## Scope

`acp-bridge` is a local, headless CLI client for the Agent Client Protocol (ACP). It runs on a trusted machine, spawns local ACP adapters and agents, and stores session/config state on disk.

Security issues in scope generally include:

- unintended command execution caused by `acp-bridge`
- unsafe handling of local credentials or auth material configured through `acp-bridge`
- path traversal or filesystem boundary bypasses in `acp-bridge` client features
- permission-policy bypasses in `fs/*` or `terminal/*` client method handling
- leakage of sensitive local data through `acp-bridge` session persistence or output modes

## Out of Scope

The following are usually out of scope for this repository:

- vulnerabilities in upstream coding agents, ACP adapters, or third-party CLIs that `acp-bridge` launches
- issues that require prior write access to trusted local state such as `~/.acp-bridge/`, project files, or shell startup files
- prompt injection by itself, unless it demonstrates a concrete `acp-bridge` security boundary bypass
- insecure local machine administration or multi-user host setups where the OS trust boundary is already lost
- use of unrecommended or intentionally unsafe custom agent commands provided through `--agent`

## Trust Boundaries

`acp-bridge` assumes the local machine and user account running it are trusted.

- Global config is stored in `~/.acp-bridge/config.json`.
- Session metadata and history are stored under `~/.acp-bridge/sessions/`.
- Project config may be read from `<cwd>/.acp-bridgerc.json`.
- Spawned adapters and agents run with the privileges of the current user.

If an attacker can already modify those files or the commands that `acp-bridge` launches, they have already crossed the primary trust boundary.

## Operational Guidance

- Keep `acp-bridge`, Node.js, and the underlying coding agents up to date.
- Review any custom commands configured through `--agent` or `config.agents.*.command` before using them.
- Treat `~/.acp-bridge/config.json` as sensitive if it contains auth credentials.
- Do not share session files or command output if they may contain prompts, file paths, or credentials from local work.
- Prefer running `acp-bridge` on a trusted local machine or isolated CI runner.

## Runtime Requirements

`acp-bridge` requires **Node.js 22.12.0 or later**.

Verify your version with:

```bash
node --version
```
