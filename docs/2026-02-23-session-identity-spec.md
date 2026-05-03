# 2026-02-23 Session Identity Specification

Status: Draft
Owner: acp-bridge
Last updated: 2026-02-25

## Context

`acp-bridge` currently exposes overlapping session identifiers (`id` and `sessionId`) and an optional runtime/provider identifier (`runtimeSessionId`).

This naming is ambiguous for orchestrators and users who need to reason about:

- stable local record identity
- ACP wire/session identity
- inner harness/provider identity

## Problem Statement

Current naming causes confusion and duplicate-looking values in downstream UX.

When reconnect or fallback creates a new ACP session for an existing local record, the distinction is real, but not clearly named.

## Goals

1. Define explicit, unambiguous identifier names.
2. Keep behavior deterministic when inner harness id is unavailable.
3. Preserve resilience flows (load/reconnect/fallback) without identity confusion.
4. Keep adapter integration harness-agnostic.

## Non-Goals

1. Inventing an inner harness id when adapter does not expose one.
2. Requiring ACP spec changes.
3. Changing session lifecycle semantics.

## Canonical Identity Model

### SessionRecord fields

- `acp-bridgeRecordId: string`
- `acp-bridgeSessionId: string`
- `agentSessionId?: string`

Semantics:

- `acp-bridgeRecordId`: stable acp-bridge local record key.
- `acp-bridgeSessionId`: ACP session id used for ACP method calls.
- `agentSessionId`: inner provider/harness session id (Codex/Claude/etc.) when exposed via adapter metadata.

### Stability rules

1. `acp-bridgeRecordId` SHOULD remain stable for the life of the local record.
2. `acp-bridgeSessionId` SHOULD remain stable while ACP `session/load` succeeds.
3. `acp-bridgeSessionId` MAY change if acp-bridge must create a fresh ACP session after load/reconnect failure.
4. `agentSessionId` is optional and MUST NOT be synthesized.

## Output JSON Contract

JSON outputs should use canonical names:

- `sessions new --format json`
- `sessions ensure --format json`
- `status --format json`
- `sessions show --format json`

Rules:

1. Always include `acp-bridgeRecordId` and `acp-bridgeSessionId`.
2. Include `agentSessionId` only when known.
3. Do not emit null placeholders for unknown optional ids.

## Source of Truth for agentSessionId

acp-bridge should extract `agentSessionId` from ACP `_meta` on session setup responses:

- `newSession` response `_meta`
- `loadSession` response `_meta` for reconciliation (when available)

### Metadata key

Use exactly one key:

1. `_meta.agentSessionId`

Notes:

- acp-bridge does not read adapter-specific alias keys for this field.

## Behavioral Requirements

1. acp-bridge MUST persist `acp-bridgeRecordId` and `acp-bridgeSessionId`.
2. acp-bridge MUST persist `agentSessionId` when discovered.
3. acp-bridge MUST NOT fail session creation/loading if `agentSessionId` is absent.
4. acp-bridge SHOULD update stored `agentSessionId` on later attach if newly discovered.
5. acp-bridge SHOULD preserve existing non-empty `agentSessionId` unless replaced by a new non-empty value.

## Implementation Plan (acp-bridge)

1. Types
   - Rename session identity fields to canonical names in types and persistence interfaces.

2. Client layer
   - Return structured session identity with canonical names.
   - Normalize `_meta` keys into `agentSessionId`.

3. Session runtime
   - Persist canonical fields during create/load/reconnect flows.
   - Keep record/session divergence behavior explicit and intentional.

4. CLI JSON output
   - Emit `acp-bridgeRecordId`, `acp-bridgeSessionId`, optional `agentSessionId`.
   - Remove ambiguous `id`/`sessionId` naming from JSON outputs.

5. Persistence migration
   - Read legacy files (`id`, `sessionId`, `runtimeSessionId`) and normalize in-memory.
   - Write canonical fields on next save.

## Test Plan

1. Unit: metadata parsing
   - precedence order resolves to `agentSessionId`.
   - empty/non-string values are ignored.

2. Unit: persistence and migration
   - legacy files load and normalize correctly.
   - canonical fields write correctly.

3. CLI tests (json mode)
   - `sessions new` emits canonical identity fields.
   - `sessions ensure` emits canonical identity fields.
   - `status` emits canonical identity fields from stored record.

4. Regression
   - fallback/reconnect flows still work when `acp-bridgeSessionId` changes and `acp-bridgeRecordId` remains stable.
   - behavior remains correct when `agentSessionId` is absent.

## Embedding Consumer Impact

Embedding applications should consume:

- `acpBridgeRecordId` as backend/local acp-bridge identity
- `acpBridgeSessionId` as ACP wire/session identity
- `agentSessionId` as inner harness identity when present

If `agentSessionId` is absent, UX should avoid implying a distinct inner session id.

## Rollout

1. Implement canonical naming in acp-bridge internals and JSON outputs.
2. Add legacy-read compatibility for existing session files.
3. Update any runtime parser to read canonical fields.
4. Remove legacy field usage from tests/docs after transition is complete.

## Risks

1. Adapter metadata key mismatch.
   - Mitigation: require adapters to emit `_meta.agentSessionId`.

2. Downstream consumers pinned to old JSON field names.
   - Mitigation: short compatibility window with documented migration.

3. False confidence when adapter provides no inner id.
   - Mitigation: optional semantics; no synthetic ids.
