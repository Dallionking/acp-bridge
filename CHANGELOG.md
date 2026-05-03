# Changelog

<!-- markdownlint-disable MD024 -->

Repo: https://github.com/Dallionking/acp-bridge

## Unreleased

### Changes

### Breaking

### Fixes

- CLI/models: fail clearly when `--model` targets a non-Claude ACP agent that does not advertise ACP model support, and reject model ids outside an adapter's advertised `availableModels` instead of silently falling back to the adapter default.

## 2026.4.25 (v0.6.0)

### Changes

- CLI/claude: add `--system-prompt <text>` and `--append-system-prompt <text>` global flags that forward through ACP `_meta.systemPrompt` on `session/new`, letting callers replace or append to the Claude Code system prompt without dropping out of persistent sessions. The value is persisted in `session_options.system_prompt` so ensure/reuse flows keep the override. Codex and other agents ignore the field. (#229)
- CLI/sessions: add `sessions prune` with `--dry-run`, age filters, and `--include-history` so closed session records and optional event streams can be cleaned up explicitly. (#227)
- Runtime/embedding: add `startTurn(...)` turn handles so embedders can observe live runtime events separately from terminal completion, cancel a turn, or close only the event stream while preserving `runTurn(...)` compatibility. (#262)
- CLI/ACP: add `--no-terminal` to disable advertised ACP terminal capability for new agent clients. (#155)
- Agents/built-ins: bump the default `@agentclientprotocol/claude-agent-acp`, `@zed-industries/codex-acp`, and `pi-acp` package ranges so fresh built-in launches pick up the latest adapter releases. (#253, #275)
- Conformance/ACP: add a post-success drain case that catches late tool updates emitted after `session/prompt` resolves. (#252)
- Docs/session identity: clarify when CLI output shows runtime session IDs versus backend agent session IDs.
- Dependencies/CI: update ACP SDK, runtime dependencies, TypeScript-native tooling, formatter/lint tooling, and workflow actions.

### Breaking

### Fixes

- CLI/runtime: persist non-mode `session/set_config_option` values and replay them on fresh adapter sessions, so options such as Codex `reasoning_effort` survive session fallback/reuse. (#138)
- CLI/prompt: honor `--model` when sending prompts to existing persistent sessions, including queued owner paths. (#211)
- Runtime/persistent sessions: keep reusable persistent ACP clients warm across turns and close pooled clients during runtime close. (#265)
- Runtime/ACP: drain late post-success session updates before closing prompt turns so adapters that resolve `session/prompt` before final updates do not drop assistant output. (#251)
- Runtime/embedding: reuse the saved persistent session when sending runtime controls instead of creating a new backend session for control operations.
- CLI/sessions: persist the submitted prompt at turn start so `sessions history` and `sessions read` no longer report `No history` while an active prompt is already running. (#157)
- Runtime/WSL: translate session cwd with `wslpath` when running under WSL and spawning Windows `.exe` ACP agents, so `session/new` and `session/load` receive paths the agent can access. (#232)
- Client/auth: require explicit `ACP_BRIDGE_AUTH_*` env vars or config `auth` entries for ACP auth-method selection, so ambient provider env like `OPENAI_API_KEY` no longer triggers unintended login flows in adapters such as `codex-acp`.
- Config/agents: honor custom agent `args` arrays from config instead of silently dropping required adapter subcommands. (#199)
- CLI/queue: tighten persistent queue and IPC socket directories to owner-only permissions, including previously-created permissive directories. (#216)
- CLI/queue: use cryptographically random owner generation IDs so rapid queue owner restarts cannot reuse a stale generation token. (#207)
- Output/errors: add text-mode remediation hints for auth-required, missing-session, ACP session failures, timeouts, provider rate limits, and invalid model names while keeping JSON error payloads stable. (#256)
- CLI/quiet output: emit final token usage and cost metadata to stderr when adapters include it in the ACP prompt result, while keeping quiet stdout as assistant text only. (#257)
- CLI/status: report resumable persistent sessions as `idle` when no queue owner is running, instead of marking pre-prompt or TTL-expired sessions as dead. (#185)
- Client/ACP: use the locked ACP SDK close API path so session closing stays compatible with the current SDK.
- Runtime/doctor: guarantee `doctor().details` contains strings even when probe failures include Error or object values. (#267)
- Replay viewer: protect run-bundle file reads from run-id boundary escapes.

## 2026.4.8 (v0.5.3)

### Changes

- Dependencies: upgrade Vite to 8.0.7. (#231)

### Breaking

### Fixes

## 2026.4.7 (v0.5.2)

### Changes

### Breaking

### Fixes

- Sessions/reset: close the live backend session when discarding persistent state so reset flows start a fresh ACP session instead of silently reopening the old one. (#228)

## 2026.4.6 (v0.5.1)

### Changes

### Breaking

### Fixes

- Runtime/processes: own built-in adapter launches so child processes are managed consistently. (#226)

## 2026.4.6 (v0.5.0)

### Changes

- Flows: validate flow definitions and require `defineFlow`. (#219)
- Runtime/embedding: add a supported `acp-bridge/runtime` API for embedding session lifecycle, turn execution, status/control, and file-backed runtime storage. (#220)
- Runtime/prompt turns: stabilize runtime prompt turn handling. (#222)

### Breaking

### Fixes

## 2026.4.4 (v0.4.1)

### Changes

- Flows/replay viewer: keep recent runs and the active recent-run view live over a WebSocket snapshot/patch transport so in-progress runs update without manual refresh while rewind stays available. (#205)
- Agents/built-ins: bump the default pinned `@zed-industries/codex-acp` and `@agentclientprotocol/claude-agent-acp` package ranges. (#215)
- Dependencies: update ACP SDK, TypeScript, and TypeScript-native dev tooling. (#200, #202, #203)

### Breaking

### Fixes

## 2026.3.29 (v0.4.0)

### Changes

- Flows/workflows: add an initial `flow run` command, an `acp-bridge/flows` runtime surface, and file-backed flow run state under `~/.acp-bridge/flows/runs` for user-authored workflow modules. (#179)
- Flows/replay: store flow runs as trace bundles with `manifest.json`, `flow.json`, `trace.ndjson`, projections, bundled session replay data, and per-attempt ACP/action receipts for later inspection. (#181)
- Flows/replay viewer: add a React Flow-based replay viewer example that replays saved run bundles and shows the bundled ACP session beside the graph. (#183)
- Flows/permissions: let flows declare explicit required permission modes, fail fast when a flow requires an explicit `--approve-all` grant, and preserve the granted mode through persistent ACP queue-owner paths. (#186)
- Flows/workspaces: let ACP validation choose PR test plans and broaden PR-triage refactor judgment. (#189, #190)
- Flows/titles: add a flow run title API. (#197)
- Agents/trae: add built-in Trae agent support backed by `trae-cli`. (#171)
- Agents/qoder: add built-in Qoder CLI ACP support. (#178)
- Agents/codex: support `--model` for Codex sessions. (#192)
- Models: add generic model selection via ACP `session/set_model`. (#150)
- Output: add `--suppress-reads` to mask raw file-read bodies in text and JSON output while keeping normal tool activity visible. (#193)
- CLI/prompts: add `--prompt-retries` to retry transient prompt failures with exponential backoff. (#196)
- Dependencies: update ACP SDK, workflow actions, TypeScript-native tooling, and development dependencies.

### Breaking

### Fixes

- Sessions/load: fall back to a fresh ACP session when adapters reject `session/load` with JSON-RPC `-32601` or `-32602`. (#174)
- Flows/runtime: finalize interrupted `flow run` bundles as failed instead of leaving them stuck at `running` when the process receives `SIGHUP`, `SIGINT`, or `SIGTERM`. (#188)
- Windows/process spawning: enable shell mode for terminal spawn on Windows. (#173)
- Client/startup: add connection timeout and max buffer size limits. (#168)
- Output/thinking: preserve line breaks in text-mode `[thinking]` output instead of flattening multi-line thought chunks into one line. (#194)
- Agents/cursor: recognize Cursor's `Session "..." not found` `session/load` error format so reconnects fall back to `session/new` instead of failing. (#195)
- Agents/kiro: use `kiro-cli-chat acp` for the built-in Kiro adapter command to avoid orphan child processes. (#129)

## 2026.3.18 (v0.3.1)

### Changes

- Conformance/ACP: add a data-driven ACP core v1 conformance suite with CI smoke coverage, nightly coverage, and a hardened runner that reports startup failures cleanly. (#130)
- Agents/droid: add `factory-droid` and `factorydroid` aliases for the built-in Factory Droid adapter and sync the built-in docs. (#156)

### Breaking

### Fixes

## 2026.3.12 (v0.3.0)

### Changes

- Agents/built-ins: add Factory Droid and iFlow as built-in ACP agents and document their built-in commands. (#112, #109)
- Dependencies: update TypeScript-native and tsdown development tooling.

### Breaking

### Fixes

- Codex/session config: treat `thought_level` as a compatibility alias for codex-acp `reasoning_effort`. (#127)
- Session control/errors: surface actionable `set-mode` and `set` error messages when adapters reject unsupported session control params. (#123)
- Sessions/load fallback: suppress recoverable `session/load` error payloads during first-run prompt recovery. (#122)
- Permissions/stats: track client permission denials in permission stats. (#120)
- Agents/gemini: default to `--acp` for Gemini CLI and fall back to `--experimental-acp` for pre-0.33 releases. (#113)
- Images/prompt validation: validate structured image prompt block MIME types and base64 payloads. (#110)
- Windows/process spawning: detect PATH-resolved batch wrappers such as `npx` on Windows and enable shell mode only for those commands. (#102)

## 2026.3.10 (v0.2.0)

### Changes

- Docs/changelog: add missing changelog entries and clean up duplicate ACP and queue helpers.

### Breaking

### Fixes

- ACP/prompt blocks: preserve structured ACP prompt blocks instead of flattening them during prompt handling to support images and non-text. (#103)

## 2026.3.10 (v0.1.16)

### Changes

- Tooling: align tooling stack.
- Docs/contributors: sync contributor guidance, add the vision doc, and refocus the agent contributor guide.
- ACP/set-mode: clarify that `set-mode` mode IDs are adapter-defined.
- Tests/coverage: expand CLI, adapter, and session-runtime coverage and keep the coverage lane on Node 22.
- Agents/built-ins: add built-in agent support for Copilot, Cursor, Kimi CLI, Kiro CLI, kilocode, and qwen.
- Sessions/read: add a `sessions read` command.
- Config/exec: add a `disableExec` config option.
- Claude/session options: add CLI passthrough flags for Claude session options.
- Sessions/resume: add `--resume-session` to attach to an existing agent session.
- ACP/config: pass `mcpServers` through ACP session setup.
- Docs/registry: sync the agent registry documentation with the live built-in registry.
- Runtime/perf: improve runtime performance and queue coordination, tighten perf capture, reuse warm queue-owner ACP clients, and lazy-load CLI startup modules.
- Repo/maintenance: add Dependabot configuration and pin ACP adapter package ranges.
- Dependencies: batch pending dependency upgrades.

### Breaking

### Fixes

- Queue/runtime: stabilize queue sockets and related runtime coordination paths.
- Gemini/ACP startup: harden Gemini ACP startup and reconnect handling.
- Claude/ACP startup: harden Claude ACP session creation stalls.
- Windows/process spawning: use `cross-spawn` for Windows compatibility.

## 2026.3.1 (v0.1.15)

### Changes

### Breaking

### Fixes

- CLI/version: restore `--version` behavior and staged adapter shutdown fallback.

## 2026.3.1 (v0.1.14)

### Changes

- ACP/session model: land the ACP session model work and define the ACP-only JSON stream contract.
- Queue/owner: make the queue owner self-spawn through the CLI entrypoint.
- Tests/queue owner: stabilize queue-owner integration teardown with additional tests.

### Breaking

### Fixes

- Gemini/session restore: recognize Gemini CLI `Invalid session identifier` failures as session-not-found reconnect cases.
- Sessions/output: suppress replayed `loadSession` updates from user-facing output.

## 2026.2.26 (v0.1.13)

### Changes

### Breaking

### Fixes

- CLI/version env: ignore foreign `npm_package_version` values in `npx` contexts when resolving the CLI version.

## 2026.2.26 (v0.1.12)

### Changes

- CLI/version: add dynamic `--version` resolution at runtime.

### Breaking

### Fixes

## 2026.2.25 (v0.1.11)

### Changes

- Runtime/owners: detach warm session owners from prompt callers and run the `opencode` adapter in ACP mode.

### Breaking

### Fixes

## 2026.2.25 (v0.1.10)

### Changes

### Breaking

### Fixes

- ACP/reconnect: fall back cleanly when a persisted ACP session is no longer found.

## 2026.2.25 (v0.1.9)

### Changes

- Docs/session identity: clarify the ACP session identity model and current coverage status.

### Breaking

### Fixes

## 2026.2.24 (v0.1.8)

### Changes

- Docs/runtime: specify runtime session id passthrough from ACP metadata.
- Metadata/repo: update repository metadata.

### Breaking

### Fixes

## 2026.2.23 (v0.1.7)

### Changes

- Docs/install: restore global install instructions, badges, and skillflag guidance.
- Runtime/ACP: add ACP integration runtime and CLI primitives.

### Breaking

### Fixes

## 2026.2.20 (v0.1.6)

### Changes

- Docs/readme: add badges, skillflag 0.1.4 guidance, and simplified setup.

### Breaking

### Fixes

## 2026.2.20 (v0.1.5)

### Changes

- Docs/install: clarify `npx` usage and use `@latest` in install commands.
- Runtime/session UX: implement high-priority runtime, config, and session UX features.
- Tests/integration: add mock ACP agent and integration tests.

### Breaking

### Fixes

- Startup/cancel: cancel prompts during startup correctly.

## 2026.2.18 (v0.1.4)

### Changes

- Docs/setup: add quick-setup guidance for agent skill install.
- Sessions/prompts: require explicit sessions and route prompts by directory walk.

### Breaking

### Fixes

## 2026.2.18 (v0.1.3)

### Changes

- CI/tests: align CI and test setup, expand coverage.

### Breaking

### Fixes

- Release: align release workflow with the skillflag in-memory bump pattern.

## 2026.2.18 (v0.1.2)

### Changes

- Initial public release of the ACP CLI client, including npm-first docs, agent-first prompt/exec/session commands, async prompt queueing, the initial agent registry, CI, trusted publishing, and MIT licensing.

### Breaking

### Fixes
