import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  AcpRuntimeError,
  AcpBridgeRuntime,
  createAcpRuntime,
  createAgentRegistry,
  createFileSessionStore,
  createRuntimeStore,
  decodeAcpBridgeRuntimeHandleState,
  encodeAcpBridgeRuntimeHandleState,
  type AcpRuntimeEvent,
  type AcpSessionRecord,
} from "../src/runtime.js";

function createSessionRecord(overrides: Partial<AcpSessionRecord> = {}): AcpSessionRecord {
  return {
    schema: "acp-bridge.session.v1",
    acp-bridgeRecordId: "agent:codex:acp:test",
    acpSessionId: "sid-1",
    agentSessionId: "inner-1",
    agentCommand: "codex --acp",
    cwd: "/tmp/acp-bridge",
    name: "agent:codex:acp:test",
    createdAt: "2026-04-05T00:00:00.000Z",
    lastUsedAt: "2026-04-05T00:00:00.000Z",
    lastSeq: 0,
    eventLog: {
      active_path: "",
      segment_count: 0,
      max_segment_bytes: 0,
      max_segments: 0,
      last_write_at: undefined,
      last_write_error: null,
    },
    closed: false,
    messages: [],
    updated_at: "2026-04-05T00:00:00.000Z",
    cumulative_token_usage: {},
    request_token_usage: {},
    acp-bridge: {},
    ...overrides,
  };
}

function emptyRuntimeEvents(): AsyncIterable<AcpRuntimeEvent> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<AcpRuntimeEvent> {
      return {
        async next() {
          return { done: true, value: undefined };
        },
      };
    },
  };
}

test("AcpBridgeRuntime delegates session lifecycle to the runtime manager", async () => {
  const encoded = encodeAcpBridgeRuntimeHandleState({
    name: "agent:codex:acp:test",
    agent: "codex",
    cwd: "/tmp/acp-bridge",
    mode: "persistent",
    acp-bridgeRecordId: "agent:codex:acp:test",
    backendSessionId: "sid-1",
    agentSessionId: "inner-1",
  });

  assert.deepEqual(decodeAcpBridgeRuntimeHandleState(encoded), {
    name: "agent:codex:acp:test",
    agent: "codex",
    cwd: "/tmp/acp-bridge",
    mode: "persistent",
    acp-bridgeRecordId: "agent:codex:acp:test",
    backendSessionId: "sid-1",
    agentSessionId: "inner-1",
  });

  const record = createSessionRecord();
  let ensuredMode: string | undefined;
  let turnMode: string | undefined;
  let turnSessionMode: string | undefined;
  let turnTimeoutMs: number | undefined;
  let closedStreamRequestId: string | undefined;
  let cancelCalls = 0;
  let managerCancelCalls = 0;
  let closeDiscardPersistentState: boolean | undefined;
  const manager = {
    ensureSession: async (input: { mode: string }) => {
      ensuredMode = input.mode;
      return record;
    },
    startTurn(input: { mode: string; sessionMode: string; timeoutMs?: number; requestId: string }) {
      turnMode = input.mode;
      turnSessionMode = input.sessionMode;
      turnTimeoutMs = input.timeoutMs;
      return {
        requestId: input.requestId,
        events: (async function* () {
          yield { type: "text_delta" as const, text: "hello", stream: "output" as const };
        })(),
        result: Promise.resolve({
          status: "completed" as const,
          stopReason: "end_turn",
        }),
        cancel: async () => {
          cancelCalls += 1;
        },
        closeStream: async (_input?: { reason?: string }) => {
          closedStreamRequestId = input.requestId;
        },
      };
    },
    async *runTurn(input: {
      mode: string;
      sessionMode: string;
      timeoutMs?: number;
      requestId: string;
    }) {
      turnMode = input.mode;
      turnSessionMode = input.sessionMode;
      turnTimeoutMs = input.timeoutMs;
      yield { type: "text_delta" as const, text: "hello", stream: "output" as const };
      yield { type: "done" as const, stopReason: "end_turn" };
    },
    getStatus: async () => ({
      summary: "status=ok",
      acp-bridgeRecordId: record.acp-bridgeRecordId,
    }),
    setMode: async () => {},
    setConfigOption: async () => {},
    cancel: async () => {
      managerCancelCalls += 1;
    },
    close: async (_handle: unknown, options?: { discardPersistentState?: boolean }) => {
      closeDiscardPersistentState = options?.discardPersistentState;
    },
  };

  const runtime = new AcpBridgeRuntime(
    {
      cwd: "/tmp/acp-bridge",
      sessionStore: createFileSessionStore({ stateDir: "/tmp/acp-bridge-state" }),
      agentRegistry: createAgentRegistry(),
      permissionMode: "approve-reads",
    },
    {
      managerFactory: () => manager as never,
    },
  );

  const handle = await runtime.ensureSession({
    sessionKey: "agent:codex:acp:test",
    agent: "codex",
    mode: "oneshot",
  });

  assert.equal(ensuredMode, "oneshot");
  assert.equal(handle.acp-bridgeRecordId, "agent:codex:acp:test");
  assert.equal(handle.backendSessionId, "sid-1");
  assert.equal(handle.agentSessionId, "inner-1");

  const turn = runtime.startTurn({
    handle,
    text: "hello",
    mode: "steer",
    requestId: "req-1",
    timeoutMs: 42,
  });
  const events = [];
  for await (const event of turn.events) {
    events.push(event);
  }
  const result = await turn.result;

  assert.equal(turnMode, "steer");
  assert.equal(turnSessionMode, "oneshot");
  assert.equal(turnTimeoutMs, 42);
  assert.deepEqual(events, [{ type: "text_delta", text: "hello", stream: "output" }]);
  assert.deepEqual(result, { status: "completed", stopReason: "end_turn" });

  const legacyEvents: AcpRuntimeEvent[] = [];
  for await (const event of runtime.runTurn({
    handle,
    text: "legacy",
    mode: "prompt",
    requestId: "req-legacy",
  })) {
    legacyEvents.push(event);
  }
  assert.deepEqual(legacyEvents, [
    { type: "text_delta", text: "hello", stream: "output" },
    { type: "done", stopReason: "end_turn" },
  ]);

  await runtime.getStatus({ handle });
  await runtime.setMode({ handle, mode: "architect" });
  await runtime.setConfigOption({ handle, key: "approval", value: "manual" });
  await runtime.cancel({ handle, reason: "legacy cancel" });
  await turn.closeStream({ reason: "observer closed stream" });
  await turn.cancel();
  await runtime.close({ handle, reason: "test", discardPersistentState: true });
  assert.equal(closedStreamRequestId, "req-1");
  assert.equal(cancelCalls, 1);
  assert.equal(managerCancelCalls, 1);
  assert.equal(closeDiscardPersistentState, true);
});

test("createFileSessionStore persists records inside the provided state directory", async (t) => {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "acp-bridge-runtime-store-"));
  t.after(async () => {
    await fs.rm(stateDir, { recursive: true, force: true });
  });

  const store = createFileSessionStore({ stateDir });
  const record = createSessionRecord({
    acp-bridgeRecordId: "agent:codex:acp:stored",
    acpSessionId: "sid-stored",
  });

  await store.save(record);
  const loaded = await store.load("agent:codex:acp:stored");

  assert.equal(loaded?.acp-bridgeRecordId, "agent:codex:acp:stored");
  assert.equal(loaded?.acpSessionId, "sid-stored");
  assert.equal(
    await fs
      .readFile(path.join(stateDir, "sessions", "agent%3Acodex%3Aacp%3Astored.json"), "utf8")
      .then((payload) => payload.includes('"schema": "acp-bridge.session.v1"')),
    true,
  );
});

test("doctor reports backend unavailable probe failures and agent registry honors overrides", async () => {
  const registry = createAgentRegistry({
    overrides: {
      codex: "codex-override --acp",
    },
  });

  assert.equal(registry.resolve("codex"), "codex-override --acp");

  const runtime = new AcpBridgeRuntime(
    {
      cwd: "/workspace",
      sessionStore: createFileSessionStore({ stateDir: "/tmp/acp-bridge-runtime-doctor" }),
      agentRegistry: registry,
      permissionMode: "approve-reads",
    },
    {
      probeRunner: async () => ({
        ok: false,
        message: "embedded ACP runtime probe failed",
        details: ["agent=codex", "command=codex-override --acp"],
      }),
    },
  );

  const report = await runtime.doctor();
  assert.equal(report.ok, false);
  assert.equal(report.code, "ACP_BACKEND_UNAVAILABLE");
  assert.deepEqual(report.details, ["agent=codex", "command=codex-override --acp"]);
});

test("doctor coerces probe detail values to strings", async () => {
  const circular: Record<string, unknown> = { code: "BROKEN" };
  circular.self = circular;
  const runtime = new AcpBridgeRuntime(
    {
      cwd: "/workspace",
      sessionStore: createFileSessionStore({ stateDir: "/tmp/acp-bridge-runtime-doctor-details" }),
      agentRegistry: createAgentRegistry(),
      permissionMode: "approve-reads",
    },
    {
      probeRunner: async () => ({
        ok: false,
        message: "embedded ACP runtime probe failed",
        details: ["agent=codex", new Error("spawn failed"), circular],
      }),
    },
  );

  const report = await runtime.doctor();
  assert.equal(report.ok, false);
  assert.equal(
    report.details?.every((detail) => typeof detail === "string"),
    true,
  );
  assert.match(report.details?.[1] ?? "", /spawn failed/);
  assert.equal(report.details?.[2], '{"code":"BROKEN","self":"[Circular]"}');
});

test("AcpBridgeRuntime validates required ensureSession inputs and runtime handles", async () => {
  const runtime = createAcpRuntime({
    cwd: "/workspace",
    sessionStore: createFileSessionStore({ stateDir: "/tmp/acp-bridge-runtime-invalid" }),
    agentRegistry: createAgentRegistry(),
    permissionMode: "approve-reads",
  });

  await assert.rejects(
    async () =>
      await runtime.ensureSession({
        sessionKey: "   ",
        agent: "codex",
        mode: "persistent",
      }),
    (error: unknown) => {
      assert(error instanceof AcpRuntimeError);
      assert.equal(error.code, "ACP_SESSION_INIT_FAILED");
      assert.match(error.message, /session key is required/);
      return true;
    },
  );
  await assert.rejects(
    async () =>
      await runtime.ensureSession({
        sessionKey: "agent:codex:acp:test",
        agent: "   ",
        mode: "persistent",
      }),
    /ACP agent id is required/,
  );
  await assert.rejects(
    async () =>
      await runtime.getStatus({
        handle: {
          sessionKey: "agent:codex:acp:test",
          backend: "acp-bridge",
          runtimeSessionName: "   ",
        },
      }),
    /runtimeSessionName is missing/,
  );
});

test("AcpBridgeRuntime falls back to plain runtimeSessionName handles and reuses a single manager instance", async () => {
  const record = createSessionRecord({
    acp-bridgeRecordId: "session-from-handle",
    acpSessionId: "sid-handle",
    agentSessionId: "inner-handle",
    cwd: "/workspace",
  });
  let managerFactoryCalls = 0;
  const manager = {
    ensureSession: async () => record,
    startTurn(input: { requestId: string }) {
      return {
        requestId: input.requestId,
        events: emptyRuntimeEvents(),
        result: Promise.resolve({
          status: "completed" as const,
          stopReason: "end_turn",
        }),
        cancel: async () => {},
        closeStream: async () => {},
      };
    },
    getStatus: async (handle: { acp-bridgeRecordId?: string; cwd?: string }) => ({
      summary: `status=${handle.acp-bridgeRecordId}`,
      acp-bridgeRecordId: handle.acp-bridgeRecordId,
      details: {
        cwd: handle.cwd,
      },
    }),
    setMode: async () => {},
    setConfigOption: async () => {},
    closeStream: async () => {},
    cancel: async () => {},
    close: async () => {},
  };
  const runtime = new AcpBridgeRuntime(
    {
      cwd: "/workspace",
      sessionStore: createFileSessionStore({ stateDir: "/tmp/acp-bridge-runtime-fallback" }),
      agentRegistry: createAgentRegistry(),
      permissionMode: "approve-reads",
    },
    {
      managerFactory: () => {
        managerFactoryCalls += 1;
        return manager as never;
      },
      probeRunner: async () => ({
        ok: true,
        message: "embedded ACP runtime ready",
      }),
    },
  );

  await runtime.probeAvailability();
  assert.equal(runtime.isHealthy(), true);
  assert.deepEqual(runtime.getCapabilities(), {
    controls: ["session/set_mode", "session/set_config_option", "session/status"],
  });

  const plainHandle = {
    sessionKey: "agent:claude:acp:plain",
    backend: "acp-bridge",
    runtimeSessionName: "plain-session-name",
    cwd: "/workspace/plain",
    acp-bridgeRecordId: "session-from-handle",
  };
  const status = await runtime.getStatus({ handle: plainHandle });
  assert.equal(status.acp-bridgeRecordId, "session-from-handle");
  assert.equal(status.details?.cwd, "/workspace/plain");

  const turn = runtime.startTurn({
    handle: plainHandle,
    text: "hello",
    mode: "prompt",
    requestId: "req-plain",
  });
  const turnEvents = [];
  for await (const event of turn.events) {
    turnEvents.push(event);
  }
  const result = await turn.result;
  assert.deepEqual(turnEvents, []);
  assert.deepEqual(result, { status: "completed", stopReason: "end_turn" });
  assert.equal(managerFactoryCalls, 1);
});

test("createRuntimeStore is an alias for the file-backed session store", async (t) => {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "acp-bridge-runtime-store-alias-"));
  t.after(async () => {
    await fs.rm(stateDir, { recursive: true, force: true });
  });

  const store = createRuntimeStore({ stateDir });
  const record = createSessionRecord({
    acp-bridgeRecordId: "alias-record",
    acpSessionId: "alias-sid",
  });
  await store.save(record);
  const loaded = await store.load("alias-record");

  assert.equal(loaded?.acpSessionId, "alias-sid");
});
