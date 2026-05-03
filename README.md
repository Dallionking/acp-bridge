# acp-bridge

[![npm version](https://img.shields.io/npm/v/acp-bridge.svg)](https://www.npmjs.com/package/acp-bridge)
[![npm downloads](https://img.shields.io/npm/dm/acp-bridge.svg)](https://www.npmjs.com/package/acp-bridge)
[![CI](https://github.com/Dallionking/acp-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/Dallionking/acp-bridge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/node/v/acp-bridge.svg)](https://nodejs.org)

> ⚠️ `acp-bridge` is in alpha and the CLI/runtime interfaces are likely to change. Anything you build downstream of this might break until it stabilizes.

> ACP coverage status: see [ACP Spec Coverage Roadmap](docs/2026-02-19-acp-coverage-roadmap.md).

`acp-bridge` is a headless CLI client for the [Agent Client Protocol (ACP)](https://agentclientprotocol.com), so AI agents and callers can talk to coding agents over a structured protocol instead of PTY scraping.

One command surface for Codex, Claude, Pi, and other ACP-compatible agents. Built for agent-to-agent communication over the command line.

- **Persistent sessions**: multi-turn conversations that survive across invocations, scoped per repo
- **Named sessions**: run parallel workstreams in the same repo (`-s backend`, `-s frontend`)
- **Prompt queueing**: submit prompts while one is already running, they execute in order
- **Cooperative cancel command**: `cancel` sends ACP `session/cancel` via queue IPC without tearing down session state
- **Soft-close lifecycle**: close sessions without deleting history from disk
- **Queue owner TTL**: keep queue owners alive briefly for follow-up prompts (`--ttl`)
- **Fire-and-forget**: `--no-wait` queues a prompt and returns immediately
- **Graceful cancel**: `Ctrl+C` sends ACP `session/cancel` before force-kill fallback
- **Session controls**: `set-mode` and `set <key> <value>` for `session/set_mode` and `session/set_config_option`
- **Crash reconnect**: dead agent processes are detected and sessions are reloaded automatically
- **Prompt from file/stdin**: `--file <path>` or piped stdin for prompt content
- **Config files**: global + project JSON config with `acp-bridge config show|init`
- **Session inspect/history**: `sessions show` and `sessions history --limit <n>`
- **Local status checks**: `status` reports running/idle/dead/no-session, pid, uptime, last prompt
- **Client methods**: stable `fs/*` and `terminal/*` handlers with permission controls and cwd sandboxing
- **Auth handshake**: stable `authenticate` support via env/config credentials
- **Structured output**: typed ACP messages (thinking, tool calls, diffs) instead of ANSI scraping
- **Any ACP agent**: built-in registry + `--agent` escape hatch for custom servers
- **One-shot mode**: `exec` for stateless fire-and-forget tasks
- **Experimental flows**: `flow run <file>` for TypeScript workflow modules over multiple prompts
- **Runtime-owned flow actions**: shell-backed action steps can prepare workspaces and other deterministic mechanics outside the agent turn
- **Flow workspace isolation**: `acp` nodes can target an explicit per-step cwd, so flows can keep agent work inside disposable worktrees

```bash
$ acp-bridge codex sessions new
$ acp-bridge codex "find the flaky test and fix it"

[thinking] Investigating test suite for flaky failures

[tool] Run npm test -- --reporter=verbose (running)
[tool] Run npm test -- --reporter=verbose (completed)
  output:
    ✓ auth.login (0.8s)
    ✗ checkout.submit (timed out after 5000ms)
    ✓ cart.add (0.3s)

[thinking] Found it — checkout.submit has a race condition in the async setup

[tool] Edit src/checkout.test.ts (completed)
  output:
    Success. Updated 1 file.

[tool] Run npm test -- checkout.submit (completed)
  output:
    ✓ checkout.submit (0.4s)

Fixed: added `await` to the setup hook in checkout.submit. The test was
reading stale state from the previous run.

[done] end_turn
```

## Quick setup — tell your agent about acp-bridge

Copy the block below and paste it into your AI agent (Claude Code, Codex, etc.). It will install acp-bridge, read the skill reference, and know how to use ACP for all future coding agent tasks.

```text
I want you to use acp-bridge to run coding agents over the Agent Client Protocol
(ACP) instead of scraping PTY sessions. Please do the following:

1. Install acp-bridge globally (recommended) or use npx:
   npm install -g acp-bridge@latest

   Or without installing:
   npx acp-bridge@latest

2. Install the acp-bridge skill so you have the full reference available:
   npx acp-bridge@latest --skill install acp-bridge

3. Read the acp-bridge skill reference so you know every command, flag, and
   workflow pattern:
   https://raw.githubusercontent.com/Dallionking/acp-bridge/main/skills/acp-bridge/SKILL.md

4. If you need the full CLI reference with all options and examples:
   https://raw.githubusercontent.com/Dallionking/acp-bridge/main/docs/CLI.md

From now on, when you need to delegate work to a coding agent, use acp-bridge
instead of spawning raw terminal sessions. For example:
  npx acp-bridge@latest codex "fix the failing tests"
  npx acp-bridge@latest claude "refactor the auth module"
  npx acp-bridge@latest codex exec "one-shot: summarize this repo"
```

## Install

```bash
npm install -g acp-bridge@latest
```

Or run without installing:

```bash
npx acp-bridge@latest codex "fix the tests"
```

Session state lives in `~/.acp-bridge/` either way. Global install is a little faster, but `npx acp-bridge@latest` works fine.

## Agent prerequisites

`acp-bridge` auto-downloads ACP adapters with `npx` on first use. You do not need to install adapter packages manually.

The only prerequisite is the underlying coding agent you want to use:

- `acp-bridge pi` -> Pi Coding Agent: https://github.com/mariozechner/pi
- `acp-bridge codex` -> Codex CLI: https://codex.openai.com
- `acp-bridge claude` -> Claude Code: https://claude.ai/code

Additional built-in agent docs live in [agents/README.md](agents/README.md).

## Usage examples

```bash
acp-bridge codex sessions new                        # create a session (explicit) for this project dir
acp-bridge codex 'fix the tests'                     # implicit prompt (routes via directory-walk)
acp-bridge codex prompt 'fix the tests'              # explicit prompt subcommand
echo 'fix flaky tests' | acp-bridge codex            # prompt from stdin
acp-bridge codex --file prompt.md                    # prompt from file
acp-bridge codex --file - "extra context"            # explicit stdin + appended args
acp-bridge codex --no-wait 'draft test migration plan' # enqueue without waiting if session is busy
acp-bridge codex cancel                               # cooperative cancel of in-flight prompt
acp-bridge codex set-mode auto                        # session/set_mode (adapter-defined mode id)
acp-bridge codex set thought_level high               # codex compatibility alias -> reasoning_effort
acp-bridge exec 'summarize this repo'                # default agent shortcut (codex)
acp-bridge codex exec 'what does this repo do?'      # one-shot, no saved session

acp-bridge codex sessions new --name api              # create named session
acp-bridge codex -s api 'implement token pagination'  # prompt in named session
acp-bridge codex sessions new --name docs             # create another named session
acp-bridge codex -s docs 'rewrite API docs'           # parallel work in another named session

acp-bridge codex sessions              # list sessions for codex command
acp-bridge codex sessions list         # explicit list
acp-bridge codex sessions show         # inspect cwd session metadata
acp-bridge codex sessions history      # show recent turn history
acp-bridge codex sessions new          # create fresh cwd-scoped default session
acp-bridge codex sessions new --name api # create fresh named session
acp-bridge codex sessions ensure       # return existing scoped session or create one
acp-bridge codex sessions ensure --name api # ensure named scoped session
acp-bridge codex sessions close        # close cwd-scoped default session
acp-bridge codex sessions close api    # close cwd-scoped named session
acp-bridge codex status                # local process status for current session

acp-bridge config show                 # show resolved config (global + project)
acp-bridge config init                 # create ~/.acp-bridge/config.json template
```

Main landing agent examples:

```bash
acp-bridge pi 'review recent changes'
acp-bridge codex 'fix the failing typecheck'
acp-bridge claude 'refactor auth middleware'
```

Additional supported agents and their specific notes are documented in [agents/README.md](agents/README.md).

```bash
acp-bridge my-agent 'review this patch'                      # unknown name -> raw command
acp-bridge --agent './bin/dev-acp --profile ci' 'run checks' # --agent escape hatch
```

## Practical scenarios

```bash
# Review a PR in a dedicated session and auto-approve permissions
acp-bridge --cwd ~/repos/shop --approve-all codex -s pr-842 \
  'Review PR #842 for regressions and propose a minimal fix'

# Keep parallel streams for the same repo
acp-bridge codex -s bugfix 'isolate flaky checkout test'
acp-bridge codex -s release 'draft release notes from recent commits'
```

## Global options in practice

```bash
acp-bridge --approve-all codex 'apply the patch and run tests'
acp-bridge --approve-reads codex 'inspect repo structure and suggest plan' # default mode
acp-bridge --deny-all codex 'explain what you can do without tool access'
acp-bridge --non-interactive-permissions fail codex 'fail instead of deny in non-TTY'

acp-bridge --cwd ~/repos/backend codex 'review recent auth changes'
acp-bridge --format text codex 'summarize your findings'
acp-bridge --format json codex exec 'review changed files'
acp-bridge --format json --json-strict codex exec 'machine-safe JSON only'
acp-bridge flow run ./my-flow.ts --input-file ./flow-input.json
acp-bridge --timeout 1800 flow run ./my-flow.ts
acp-bridge --format quiet codex 'final recommendation only'
acp-bridge --suppress-reads codex exec 'show tool activity without dumping file bodies'

acp-bridge --timeout 90 codex 'investigate intermittent test timeout'
acp-bridge --ttl 30 codex 'keep queue owner alive for quick follow-ups'
acp-bridge --verbose codex 'debug why adapter startup is failing'
```

## Flows

`acp-bridge flow run <file>` executes a TypeScript flow module through the `acp-bridge/flows`
runtime and persists run state under `~/.acp-bridge/flows/runs/`.

Flows are for multi-step ACP work where one prompt is not enough:

- `acp` steps keep model-shaped work in ACP
- `action` steps handle deterministic mechanics like shell commands or GitHub calls
- `compute` steps do local routing or shaping
- `checkpoint` steps pause for something outside the runtime

The source tree includes flow examples under [examples/flows/README.md](examples/flows/README.md):

- small examples such as `echo`, `branch`, `shell`, `workdir`, and `two-turn`
- a larger PR-triage example under [examples/flows/pr-triage/README.md](examples/flows/pr-triage/README.md)
- a replay viewer under [examples/flows/replay-viewer/README.md](examples/flows/replay-viewer/README.md) for inspecting saved run bundles in the browser

Example runs:

```bash
acp-bridge flow run ./my-flow.ts --input-file ./flow-input.json

acp-bridge flow run examples/flows/branch.flow.ts \
  --input-json '{"task":"FIX: add a regression test for the reconnect bug"}'

acp-bridge flow run examples/flows/pr-triage/pr-triage.flow.ts \
  --input-json '{"repo":"Dallionking/acp-bridge","prNumber":150}'
```

The PR-triage example is only an example workflow. It can comment on or close
real GitHub PRs if you run it against a live repository.

## Configuration files

`acp-bridge` reads config in this order (later wins):

1. global: `~/.acp-bridge/config.json`
2. project: `<cwd>/.acp-bridgerc.json`

CLI flags always win over config values.

Supported keys:

```json
{
  "defaultAgent": "codex",
  "defaultPermissions": "approve-all",
  "nonInteractivePermissions": "deny",
  "authPolicy": "skip",
  "ttl": 300,
  "timeout": null,
  "format": "text",
  "agents": {
    "my-custom": { "command": "./bin/my-acp-server", "args": ["acp"] }
  },
  "auth": {
    "my_auth_method_id": "credential-value"
  }
}
```

Use `acp-bridge config show` to inspect the resolved result and `acp-bridge config init` to create the global template.

For ACP `authenticate` handshakes, use either config `auth` entries or explicit
`ACP_BRIDGE_AUTH_<METHOD_ID>` environment variables such as `ACP_BRIDGE_AUTH_OPENAI_API_KEY`.
Ambient provider env vars such as `OPENAI_API_KEY` are still passed through to
child agents, but they do not trigger ACP auth-method selection on their own.

## Output formats

```bash
# text (default): human-readable stream with tool updates
acp-bridge codex 'review this PR'

# json: NDJSON events, useful for automation
acp-bridge --format json codex exec 'review this PR' \
  | jq -r 'select(.type=="tool_call") | [.status, .title] | @tsv'

# json-strict: suppresses non-JSON stderr output (requires --format json)
acp-bridge --format json --json-strict codex exec 'review this PR'

# quiet: final assistant text only
acp-bridge --format quiet codex 'give me a 3-line summary'

# suppress read payloads while keeping the selected output format
acp-bridge --suppress-reads codex exec 'inspect the repo and report tool usage'
```

- `text`: human-readable stream with assistant text and tool updates
- `json`: raw ACP NDJSON stream for automation
- `quiet`: final assistant text only
- `--suppress-reads`: replace raw read-file contents with `[read output suppressed]` in `text` and `json` output

JSON events include a stable envelope for correlation:

```json
{
  "eventVersion": 1,
  "sessionId": "abc123",
  "requestId": "req-42",
  "seq": 7,
  "stream": "prompt",
  "type": "tool_call"
}
```

Session-control JSON payloads (`sessions new|ensure`, `status`) always include
`acpBridgeRecordId` and `acpBridgeSessionId`. They include `agentSessionId` only when the
adapter exposes a provider-native session ID. The text/quiet session id is the
local acp-bridge record id; do not assume it can be passed to the native provider CLI
unless `agentSessionId` is present.

## Built-in agents and custom servers

Built-ins:

| Agent      | Adapter                                                                     | Wraps                                                                                                           |
| ---------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pi`       | [pi-acp](https://github.com/svkozak/pi-acp)                                 | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `codex`    | [codex-acp](https://github.com/zed-industries/codex-acp)                    | [Codex CLI](https://codex.openai.com)                                                                           |
| `claude`   | [claude-agent-acp](https://github.com/agentclientprotocol/claude-agent-acp) | [Claude Code](https://claude.ai/code)                                                                           |
| `gemini`   | native (`gemini --acp`)                                                     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `cursor`   | native (`cursor-agent acp`)                                                 | [Cursor CLI](https://cursor.com/docs/cli/acp)                                                                   |
| `copilot`  | native (`copilot --acp --stdio`)                                            | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `droid`    | native (`droid exec --output-format acp`)                                   | [Factory Droid](https://www.factory.ai)                                                                         |
| `iflow`    | native (`iflow --experimental-acp`)                                         | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode` | `npx -y @kilocode/cli acp`                                                  | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`     | native (`kimi acp`)                                                         | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`     | native (`kiro-cli-chat acp`)                                                | [Kiro CLI](https://kiro.dev)                                                                                    |
| `opencode` | `npx -y opencode-ai acp`                                                    | [OpenCode](https://opencode.ai)                                                                                 |
| `qoder`    | native (`qodercli --acp`)                                                   | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`     | native (`qwen --acp`)                                                       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`     | native (`traecli acp serve`)                                                | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` and `factorydroid` also resolve to the built-in `droid` adapter.

Additional built-in agent docs live in [agents/README.md](agents/README.md).

Use `--agent` as an escape hatch for custom ACP servers:

```bash
acp-bridge --agent ./my-custom-acp-server 'do something'
```

## Session behavior

- Prompt commands require an existing saved session record (created via `sessions new` or `sessions ensure`).
- Prompts route by walking up from `cwd` (or `--cwd`) to the nearest git root (inclusive) and selecting the nearest active session matching `(agent command, dir, optional name)`.
- If no git root is found, prompts only match an exact `cwd` session (no parent-directory walk).
- `-s <name>` selects a parallel named session during that directory walk.
- `sessions new [--name <name>]` creates a fresh session for that scope and soft-closes the prior one.
- `sessions ensure [--name <name>]` is idempotent: it returns an existing scoped session or creates one when missing.
- `sessions close [name]` soft-closes the session: queue owner/processes are terminated, record is kept with `closed: true`.
- Auto-resume for cwd scope skips sessions marked closed.
- Prompt submissions are queue-aware per session. If a prompt is already running, new prompts are queued and drained by the running `acp-bridge` process.
- Queue owners use an idle TTL (default 300s). `--ttl <seconds>` overrides it; `--ttl 0` keeps owners alive indefinitely.
- `--no-wait` submits to that queue and returns immediately.
- `cancel` sends cooperative `session/cancel` to the running queue owner process and returns success when no prompt is running (`nothing to cancel`).
- `set-mode` and `set` route through queue-owner IPC when active, otherwise they reconnect directly to apply `session/set_mode` and `session/set_config_option`.
- `<mode>` values for `set-mode` are adapter-defined; unsupported values are rejected by the adapter (commonly `Invalid params`).
- `exec` is always one-shot and does not reuse saved sessions.
- Session metadata is stored under `~/.acp-bridge/sessions/`.
- Each successful prompt appends lightweight turn history previews (`role`, `timestamp`, `textPreview`) to session metadata.
- `Ctrl+C` during a running turn sends ACP `session/cancel` and waits briefly for `stopReason=cancelled` before force-killing if needed.
- If a saved session pid is dead on the next prompt, `acp-bridge` respawns the agent, attempts `session/load`, and transparently falls back to `session/new` if loading fails.

## Full CLI reference

See [docs/CLI.md](docs/CLI.md).

## License

MIT
