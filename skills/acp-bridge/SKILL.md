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

Or without installing:

```bash
npx acp-bridge@latest --help
```

## Install this skill

```bash
npx acp-bridge@latest --skill install acp-bridge
```

## Read the full CLI reference

```bash
# From GitHub raw:
https://raw.githubusercontent.com/Dallionking/acp-bridge/main/skills/acp-bridge/SKILL.md

# CLI reference doc:
https://raw.githubusercontent.com/Dallionking/acp-bridge/main/docs/CLI.md
```

## Core commands

```bash
# Session lifecycle
acp-bridge codex sessions new               # create a session for this repo/cwd
acp-bridge codex sessions new --name api    # create a named session
acp-bridge codex sessions ensure            # idempotent: create or reuse
acp-bridge codex sessions list              # list sessions for this agent
acp-bridge codex sessions close             # soft-close current session
acp-bridge codex sessions show              # inspect session metadata
acp-bridge codex sessions history           # show recent turns

# Prompting
acp-bridge codex 'fix the flaky test'       # prompt (routes via cwd walk)
acp-bridge codex prompt 'fix the test'      # explicit prompt subcommand
acp-bridge codex exec 'summarize this repo' # one-shot, no saved session
acp-bridge exec 'summarize this repo'       # defaults to codex
echo 'fix tests' | acp-bridge codex         # prompt from stdin
acp-bridge codex --file prompt.md           # prompt from file
acp-bridge codex --no-wait 'queue this'     # fire-and-forget

# Session control
acp-bridge codex cancel                     # cooperative cancel
acp-bridge codex set-mode auto              # set mode (adapter-defined)
acp-bridge codex set thought_level high     # set config option
acp-bridge codex status                     # local process status

# Named sessions (parallel workstreams)
acp-bridge codex -s backend 'fix the API'
acp-bridge codex -s docs 'rewrite README'

# Config
acp-bridge config show                      # resolved config
acp-bridge config init                      # create global config template
```

## Built-in agents

| Agent      | Command                                    |
| ---------- | ------------------------------------------ |
| `pi`       | `npx pi-acp`                               |
| `codex`    | `npx @zed-industries/codex-acp`            |
| `claude`   | `npx -y @agentclientprotocol/claude-agent-acp` |
| `gemini`   | `gemini --acp`                             |
| `cursor`   | `cursor-agent acp`                         |
| `copilot`  | `copilot --acp --stdio`                    |
| `droid`    | `droid exec --output-format acp`           |
| `iflow`    | `iflow --experimental-acp`                 |
| `kilocode` | `npx -y @kilocode/cli acp`                 |
| `kimi`     | `kimi acp`                                 |
| `kiro`     | `kiro-cli-chat acp`                        |
| `opencode` | `npx -y opencode-ai acp`                   |
| `qoder`    | `qodercli --acp`                           |
| `qwen`     | `qwen --acp`                               |
| `trae`     | `traecli acp serve`                        |

Custom agent via escape hatch:

```bash
acp-bridge --agent ./my-custom-acp-server 'do something'
```

## Output formats

```bash
acp-bridge --format text codex 'review this'       # default: human-readable
acp-bridge --format json codex exec 'review this'  # NDJSON for automation
acp-bridge --format quiet codex 'give summary'     # assistant text only
acp-bridge --suppress-reads codex exec 'inspect'   # mask file read bodies
```

## Global options quick reference

```bash
--approve-all          # auto-approve all permissions
--approve-reads        # auto-approve reads (default)
--deny-all             # deny all permissions
--cwd <dir>            # working directory
--timeout <seconds>    # max wait for agent response
--ttl <seconds>        # queue owner idle TTL (default 300, 0=infinite)
--model <id>           # model selection (Claude-compatible adapters)
--verbose              # print ACP debug details to stderr
--no-terminal          # disable ACP terminal capability
--suppress-reads       # mask raw file-read payloads
--no-wait              # queue and return immediately
```

## Config file

Global: `~/.acp-bridge/config.json`
Project: `<cwd>/.acp-bridgerc.json`

```json
{
  "defaultAgent": "codex",
  "defaultPermissions": "approve-all",
  "ttl": 300,
  "format": "text",
  "agents": {
    "my-agent": { "command": "./bin/my-acp-server" }
  }
}
```

## Flows

```bash
acp-bridge flow run ./my-flow.ts --input-json '{"task":"fix the bug"}'
acp-bridge --approve-all flow run examples/flows/pr-triage/pr-triage.flow.ts \
  --input-json '{"repo":"Dallionking/acp-bridge","prNumber":42}'
```

Flow state is stored under `~/.acp-bridge/flows/runs/`.

## Session storage

All session metadata lives under `~/.acp-bridge/sessions/`. Each session is scoped by `(agentCommand, cwd, optionalName)`.

## Auth

ACP auth handshake via env vars or config `auth` entries:

```bash
export ACP_BRIDGE_AUTH_OPENAI_API_KEY="sk-..."
```

Or in config:

```json
{
  "auth": {
    "openai_api_key": "sk-..."
  }
}
```
