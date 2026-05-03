import type { AcpRuntimeHandle } from "./contract.js";
import type { AcpBridgeHandleState } from "./shared.js";
import { asOptionalString } from "./shared.js";

const ACP_BRIDGE_RUNTIME_HANDLE_PREFIX = "acp-bridge:v2:";

export function encodeAcpBridgeRuntimeHandleState(state: AcpBridgeHandleState): string {
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  return `${ACP_BRIDGE_RUNTIME_HANDLE_PREFIX}${payload}`;
}

export function decodeAcpBridgeRuntimeHandleState(runtimeSessionName: string): AcpBridgeHandleState | null {
  const trimmed = runtimeSessionName.trim();
  if (!trimmed.startsWith(ACP_BRIDGE_RUNTIME_HANDLE_PREFIX)) {
    return null;
  }
  try {
    const raw = Buffer.from(trimmed.slice(ACP_BRIDGE_RUNTIME_HANDLE_PREFIX.length), "base64url").toString(
      "utf8",
    );
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const name = asOptionalString(parsed.name);
    const agent = asOptionalString(parsed.agent);
    const cwd = asOptionalString(parsed.cwd);
    const mode = asOptionalString(parsed.mode);
    if (!name || !agent || !cwd || (mode !== "persistent" && mode !== "oneshot")) {
      return null;
    }
    return {
      name,
      agent,
      cwd,
      mode,
      acp-bridgeRecordId: asOptionalString(parsed.acp-bridgeRecordId),
      backendSessionId: asOptionalString(parsed.backendSessionId),
      agentSessionId: asOptionalString(parsed.agentSessionId),
    };
  } catch {
    return null;
  }
}

export function writeHandleState(handle: AcpRuntimeHandle, state: AcpBridgeHandleState): void {
  handle.runtimeSessionName = encodeAcpBridgeRuntimeHandleState(state);
  handle.cwd = state.cwd;
  handle.acp-bridgeRecordId = state.acp-bridgeRecordId;
  handle.backendSessionId = state.backendSessionId;
  handle.agentSessionId = state.agentSessionId;
}
