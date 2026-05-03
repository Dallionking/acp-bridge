import assert from "node:assert/strict";
import test from "node:test";
import {
  getDesiredConfigOptions,
  getDesiredModeId,
  normalizeModeId,
  setDesiredConfigOption,
  setDesiredModeId,
} from "../src/session/mode-preference.js";
import type { SessionRecord } from "../src/types.js";

test("normalizeModeId trims valid values and drops blanks", () => {
  assert.equal(normalizeModeId(" plan "), "plan");
  assert.equal(normalizeModeId(""), undefined);
  assert.equal(normalizeModeId("   "), undefined);
  assert.equal(normalizeModeId(undefined), undefined);
});

test("getDesiredModeId reads normalized desired_mode_id", () => {
  assert.equal(getDesiredModeId({ desired_mode_id: " auto " }), "auto");
  assert.equal(getDesiredModeId({ desired_mode_id: "   " }), undefined);
  assert.equal(getDesiredModeId(undefined), undefined);
});

test("setDesiredModeId creates and clears acp-bridge mode preference state", () => {
  const record = makeSessionRecord();

  setDesiredModeId(record, " plan ");
  assert.deepEqual(record.acp-bridge, {
    desired_mode_id: "plan",
  });

  setDesiredModeId(record, "   ");
  assert.deepEqual(record.acp-bridge, {});

  setDesiredModeId(record, undefined);
  assert.deepEqual(record.acp-bridge, {});
});

test("setDesiredConfigOption persists non-mode config option preferences", () => {
  const record = makeSessionRecord();

  setDesiredConfigOption(record, " reasoning_effort ", "high");
  setDesiredConfigOption(record, "mode", "plan");
  setDesiredConfigOption(record, "model", "gpt-5.4");

  assert.deepEqual(record.acp-bridge, {
    desired_config_options: {
      reasoning_effort: "high",
    },
  });
  assert.deepEqual(getDesiredConfigOptions(record.acp-bridge), {
    reasoning_effort: "high",
  });

  setDesiredConfigOption(record, "reasoning_effort", undefined);
  assert.deepEqual(record.acp-bridge, {});
});

function makeSessionRecord(): SessionRecord {
  const timestamp = "2026-01-01T00:00:00.000Z";
  return {
    schema: "acp-bridge.session.v1",
    acp-bridgeRecordId: "mode-record",
    acpSessionId: "mode-session",
    agentCommand: "agent",
    cwd: "/tmp/acp-bridge",
    createdAt: timestamp,
    lastUsedAt: timestamp,
    lastSeq: 0,
    eventLog: {
      active_path: ".stream.ndjson",
      segment_count: 1,
      max_segment_bytes: 1024,
      max_segments: 1,
      last_write_at: timestamp,
      last_write_error: null,
    },
    closed: false,
    title: null,
    messages: [],
    updated_at: timestamp,
    cumulative_token_usage: {},
    request_token_usage: {},
  };
}
