---
name: acp-bridge
description: Use acp-bridge as a headless ACP CLI for agent-to-agent communication, including prompt/exec/sessions workflows, session scoping, queueing, permissions, and output formats.
---

# acp-bridge

## When to use this skill

Use this skill when you need to run coding agents through `acp-bridge`, manage persistent ACP sessions, queue prompts, or consume structured agent output from scripts.

## What acp-bridge is

`acp-bridge` is a headless, scriptable CLI client for the Agent Client Protocol (ACP). It is built for agent-to-agent communication over the command line and avoids PTY scraping.

Core capabilities:

- Persistent multi-turn sessions per repo/cwd
- One-shot execution mode (`exec`)
- Named parallel sessions (`-s/--session`)
- Queue-aware prompt submission with optional fire-and-forget (`--no-wait`)
- Cooperative cancel command (`cancel`) for in-flight turns
- Graceful cancellation via ACP `session/cancel` on interrupt
- Session control methods (`set-mode`, `set <key> <value>`)
- Agent reconnect/resume after dead subprocess detection
- Prompt input via stdin or `--file`
- Config files with global+project merge and `config show|init`
- Session metadata/history inspection (`sessions show`, `sessions history`)
- Local agent process checks via `status`
- Stable ACP client methods for filesystem and terminal requests
- Stable ACP `authenticate` handshake via env/config credentials
- Structured streaming output (`text`, `json`, `quiet`) with optional `--suppress-reads`
- Built-in agent registry plus raw `--agent` escape hatch

## Install

```bash
npm i -g acp-bridge
```

For normal session reuse, prefer a global install over `npx`.

## Command model

`prompt` is the default verb.

```bash
acp-bridge [global_options] [prompt_text...]
acp-bridge [global_options] prompt [prompt_options] [prompt_text...]
acp-bridge [global_options] exec [prompt_options] [prompt_text...]
acp-bridge [global_options] cancel [-s <name>]
acp-bridge [global_options] set-mode <mode> [-s <name>]
acp-bridge [global_options] set <key> <value> [-s <name>]
acp-bridge [global_options] status [-s <name>]
acp-bridge [global_options] sessions [list | new [--name <name>] | close [name] | show [name] | history [name] [--limit <count>]]
acp-bridge [global_options] config [show | init]

acp-bridge [global_options] <agent> [prompt_options] [prompt_text...]
acp-bridge [global_options] <agent> prompt [prompt_options] [prompt_text...]
acp-bridge [global_options] <agent> exec [prompt_options] [prompt_text...]
acp-bridge [global_options] <agent> cancel [-s <name>]
acp-bridge [global_options] <agent> set-mode <mode> [-s <name>]
acp-bridge [global_options] <agent> set <key> <value> [-s <name>]
acp-bridge [global_options] <agent> status [-s <name>]
acp-bridge [global_options] <agent> sessions [list | new [--name <name>] | close [name] | show [name] | history [name] [--limit <count>]]
```

If prompt text is omitted and stdin is piped, `acp-bridge` reads prompt text from stdin.

## Built-in agent registry

Friendly agent names resolve to commands:

- `pi` -> `npx pi-acp`
- `codex` -> `npx @zed-industries/codex-acp`
- `claude` -> `npx -y @agentclientprotocol/claude-agent-acp`
- `gemini` -> `gemini --acp`
- `cursor` -> `cursor-agent acp`
- `copilot` -> `copilot --acp --stdio`
- `droid` -> `droid exec --output-format acp` (`factory-droid` and `factorydroid` also resolve to `droid`)
- `iflow` -> `iflow --experimental-acp`
- `kilocode` -> `npx -y @kilocode/cli acp`
- `kimi` -> `kimi acp`
- `kiro` -> `kiro-cli-chat acp`
- `opencode` -> `npx -y opencode-ai acp`
- `qoder` -> `qodercli --acp`
  Forwards Qoder-native `--allowed-tools` and `--max-turns` startup flags from session options.
- `qwen` -> `qwen --acp`
- `trae` -> `traecli acp serve`

Rules:

- Default agent is `codex` for top-level `prompt`, `exec`, and `sessions`.
- Unknown positional agent tokens are treated as raw agent commands.
- `--agent <command>` explicitly sets a raw ACP adapter command.
- Do not combine a positional agent and `--agent` in the same command.

## Commands

### Prompt (default, persistent session)

Implicit:

```bash
acp-bridge codex 'fix flaky tests'
```

Explicit:

```bash
acp-bridge codex prompt 'fix flaky tests'
acp-bridge prompt 'fix flaky tests'   # defaults to codex
```

Behavior:

- Uses a saved session for the session scope key
- Auto-resumes prior session when one exists for that scope
- If no session exists for the scope, exits with `NO_SESSION` and prompts for `sessions new`
- Is queue-aware when another prompt is already running for the same session
- On interrupt during an active turn, sends ACP `session/cancel` before force-kill fallback

Prompt options:

- `-s, --session <name>`: use a named session within the same cwd
- `--no-wait`: enqueue and return immediately when session is already busy
- `-f, --file <path>`: read prompt text from file (`-` means stdin)

### Exec (one-shot)

```bash
acp-bridge exec 'summarize this repo'
acp-bridge codex exec 'summarize this repo'
```

Behavior:

- Runs a single prompt in a temporary ACP session
- Does not reuse or save persistent session state

### Cancel / Mode / Config / Model

```bash
acp-bridge codex cancel
acp-bridge codex set-mode auto
acp-bridge codex set thought_level high
acp-bridge codex set model gpt-5.4
```

Behavior:

- `cancel`: sends cooperative `session/cancel` through queue-owner IPC.
- `set-mode`: calls ACP `session/set_mode`.
- `set-mode` mode ids are adapter-defined; unsupported values are rejected by the adapter (often `Invalid params`).
- `set`: calls ACP `session/set_config_option`.
- For codex, `thought_level` is accepted as a compatibility alias for codex-acp `reasoning_effort`.
- `--model <id>`: Claude-compatible adapters may consume session creation metadata; other agents must advertise ACP models and support `session/set_model`, otherwise `acp-bridge` fails clearly instead of silently falling back.
- `set model <id>`: calls `session/set_model`. This is the generic ACP method for mid-session model switching.
- `set-mode`/`set` route through queue-owner IPC when active, otherwise reconnect directly.

### Sessions

```bash
acp-bridge sessions
acp-bridge sessions list
acp-bridge sessions new
acp-bridge sessions new --name backend
acp-bridge sessions close
acp-bridge sessions close backend
acp-bridge sessions show
acp-bridge sessions history --limit 20
acp-bridge status

acp-bridge codex sessions
acp-bridge codex sessions new --name backend
acp-bridge codex sessions close backend
acp-bridge codex sessions show backend
acp-bridge codex sessions history backend --limit 20
acp-bridge codex status
```

Behavior:

- `sessions` and `sessions list` are equivalent
- `new` creates a fresh session for the current `(agentCommand, cwd, optional name)` scope
- `new --name <name>` targets a named session scope
- when `new` replaces an existing open session in that scope, the old one is soft-closed
- `close` targets current cwd default session
- `close <name>` targets current cwd named session
- `show [name]` prints stored metadata for that scoped session
- `history [name]` prints stored turn history previews (default 20, use `--limit`)

## Global options

- `--agent <command>`: raw ACP agent command (escape hatch)
- `--cwd <dir>`: working directory for session scope (default: current directory)
- `--approve-all`: auto-approve all permission requests
- `--approve-reads`: auto-approve reads/searches, prompt for writes (default mode)
- `--deny-all`: deny all permission requests
- `--format <fmt>`: output format (`text`, `json`, `quiet`)
- `--suppress-reads`: suppress raw read-file contents while preserving the selected format
- `--timeout <seconds>`: max wait time (positive number)
- `--ttl <seconds>`: queue owner idle TTL before shutdown (default `300`, `0` disables TTL)
- `--model <id>`: request an agent model during session creation; non-Claude agents must advertise ACP models and support `session/set_model`
- `--verbose`: verbose ACP/debug logs to stderr

Permission flags are mutually exclusive.

## Config files

Config files are merged in this order (later wins):

- global: `~/.acp-bridge/config.json`
- project: `<cwd>/.acp-bridgerc.json`

Supported keys:

- `defaultAgent`
- `defaultPermissions` (`approve-all`, `approve-reads`, `deny-all`)
- `ttl` (seconds)
- `timeout` (seconds or `null`)
- `format` (`text`, `json`, `quiet`)
- `agents` map (`name -> { command, args? }`)
- `auth` map (`authMethodId -> credential`)

Use `acp-bridge config show` to inspect the resolved config and `acp-bridge config init` to create the global template.

For ACP `authenticate` handshakes, use either config `auth` entries or explicit
`ACP_BRIDGE_AUTH_<METHOD_ID>` environment variables such as `ACP_BRIDGE_AUTH_OPENAI_API_KEY`.
Ambient provider env vars such as `OPENAI_API_KEY` are still passed through to
child agents, but they do not trigger ACP auth-method selection on their own.

## Session behavior

Persistent prompt sessions are scoped by:

- `agentCommand`
- absolute `cwd`
- optional session `name`

Persistence:

- Session records are stored in `~/.acp-bridge/sessions/*.json`.
- `-s/--session` creates parallel named conversations in the same repo.
- Changing `--cwd` changes scope and therefore session lookup.
- closed sessions are retained on disk with `closed: true` and `closedAt`.
- auto-resume by scope skips closed sessions.

Resume behavior:

- Prompt mode attempts to reconnect to saved session.
- If adapter-side session is invalid/not found, `acp-bridge` creates a fresh session and updates the saved record.
- explicitly selected session records can still be resumed via `loadSession` even if previously closed.
- dead saved PIDs are detected and reconnected on the next prompt.
- each completed prompt stores lightweight turn history previews in the session record.

## Prompt queueing and `--no-wait`

Queueing is per persistent session.

- The active `acp-bridge` process for a running prompt becomes the queue owner.
- Other invocations submit prompts over local IPC.
- On Unix-like systems, queue IPC uses a Unix socket under `~/.acp-bridge/queues/<hash>.sock`.
- Ownership is coordinated with a lock file under `~/.acp-bridge/queues/<hash>.lock`.
- On Windows, named pipes are used instead of Unix sockets.
- after the queue drains, owner shutdown is governed by TTL (default 300s, configurable with `--ttl`).

Submission behavior:

- Default: enqueue and wait for queued prompt completion, streaming updates back.
- `--no-wait`: enqueue and return after queue acknowledgement.
- `Ctrl+C` during an active turn sends ACP `session/cancel`, waits briefly, then force-kills only if cancellation does not finish in time.
- `cancel` sends the same cooperative cancellation without requiring terminal signals.

## Output formats

Use `--format <fmt>`:

- `text` (default): human-readable stream with updates/tool status and done line
- `json`: NDJSON event stream (good for automation)
- `quiet`: final assistant text only
- `--suppress-reads`: replace raw read-file contents with `[read output suppressed]` in `text` and `json` output

Example automation:

```bash
acp-bridge --format json codex exec 'review changed files' \
  | jq -r 'select(.type=="tool_call") | [.status, .title] | @tsv'
```

## Permission modes

- `--approve-all`: no interactive permission prompts
- `--approve-reads` (default): approve reads/searches, prompt for writes
- `--deny-all`: deny all permission requests

If every permission request is denied/cancelled and none approved, `acp-bridge` exits with permission-denied status.

## Practical workflows

Persistent repo assistant:

```bash
acp-bridge codex 'inspect failing tests and propose a fix plan'
acp-bridge codex 'apply the smallest safe fix and run tests'
```

Parallel named streams:

```bash
acp-bridge codex -s backend 'fix API pagination bug'
acp-bridge codex -s docs 'draft changelog entry for release'
```

Queue follow-up without waiting:

```bash
acp-bridge codex 'run full test suite and investigate failures'
acp-bridge codex --no-wait 'after tests, summarize root causes and next steps'
```

One-shot script step:

```bash
acp-bridge --format quiet exec 'summarize repo purpose in 3 lines'
```

Machine-readable output for orchestration:

```bash
acp-bridge --format json codex 'review current branch changes' > events.ndjson
```

Raw custom adapter command:

```bash
acp-bridge --agent './bin/custom-acp-server --profile ci' 'run validation checks'
```

Flow run:

```bash
acp-bridge flow run ./my-flow.ts --input-file ./flow-input.json
acp-bridge flow run examples/flows/branch.flow.ts --input-json '{"task":"FIX: add a regression test"}'
```

Repo-scoped review with permissive mode:

```bash
acp-bridge --cwd ~/repos/shop --approve-all codex -s pr-842 \
  'review PR #842 for regressions and propose minimal patch'
```
