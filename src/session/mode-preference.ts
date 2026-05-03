import type { SessionModelState } from "@agentclientprotocol/sdk";
import type { SessionAcpBridgeState, SessionRecord } from "../types.js";

function ensureAcpBridgeState(state: SessionAcpBridgeState | undefined): SessionAcpBridgeState {
  return state ?? {};
}

export function normalizeModeId(modeId: string | undefined): string | undefined {
  if (typeof modeId !== "string") {
    return undefined;
  }
  const trimmed = modeId.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeModelId(modelId: string | undefined): string | undefined {
  if (typeof modelId !== "string") {
    return undefined;
  }
  const trimmed = modelId.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getDesiredModeId(state: SessionAcpBridgeState | undefined): string | undefined {
  return normalizeModeId(state?.desired_mode_id);
}

export function getDesiredConfigOptions(
  state: SessionAcpBridgeState | undefined,
): Record<string, string> {
  const desired = state?.desired_config_options;
  if (!desired) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(desired).flatMap(([configId, value]) => {
      const normalizedConfigId = normalizeModeId(configId);
      return normalizedConfigId && typeof value === "string" ? [[normalizedConfigId, value]] : [];
    }),
  );
}

export function setDesiredModeId(record: SessionRecord, modeId: string | undefined): void {
  const acp-bridge = ensureAcpBridgeState(record.acp-bridge);
  const normalized = normalizeModeId(modeId);

  if (normalized) {
    acp-bridge.desired_mode_id = normalized;
  } else {
    delete acp-bridge.desired_mode_id;
  }

  record.acp-bridge = acp-bridge;
}

export function setDesiredConfigOption(
  record: SessionRecord,
  configId: string,
  value: string | undefined,
): void {
  const normalizedConfigId = normalizeModeId(configId);
  if (!normalizedConfigId || normalizedConfigId === "mode" || normalizedConfigId === "model") {
    return;
  }

  const acp-bridge = ensureAcpBridgeState(record.acp-bridge);
  const desired = { ...acp-bridge.desired_config_options };

  if (typeof value === "string") {
    desired[normalizedConfigId] = value;
  } else {
    delete desired[normalizedConfigId];
  }

  if (Object.keys(desired).length > 0) {
    acp-bridge.desired_config_options = desired;
  } else {
    delete acp-bridge.desired_config_options;
  }

  record.acp-bridge = acp-bridge;
}

export function getDesiredModelId(state: SessionAcpBridgeState | undefined): string | undefined {
  return normalizeModelId(state?.session_options?.model);
}

export function setDesiredModelId(record: SessionRecord, modelId: string | undefined): void {
  const acp-bridge = ensureAcpBridgeState(record.acp-bridge);
  const normalized = normalizeModelId(modelId);
  const sessionOptions = { ...acp-bridge.session_options };

  if (normalized) {
    sessionOptions.model = normalized;
  } else {
    delete sessionOptions.model;
  }

  if (
    typeof sessionOptions.model === "string" ||
    Array.isArray(sessionOptions.allowed_tools) ||
    typeof sessionOptions.max_turns === "number" ||
    sessionOptions.system_prompt !== undefined
  ) {
    acp-bridge.session_options = sessionOptions;
  } else {
    delete acp-bridge.session_options;
  }

  record.acp-bridge = acp-bridge;
}

export function setCurrentModelId(record: SessionRecord, modelId: string | undefined): void {
  const acp-bridge = ensureAcpBridgeState(record.acp-bridge);
  const normalized = normalizeModelId(modelId);

  if (normalized) {
    acp-bridge.current_model_id = normalized;
  } else {
    delete acp-bridge.current_model_id;
  }

  record.acp-bridge = acp-bridge;
}

export function syncAdvertisedModelState(
  record: SessionRecord,
  models: SessionModelState | undefined,
): void {
  if (!models) {
    return;
  }

  const acp-bridge = ensureAcpBridgeState(record.acp-bridge);
  acp-bridge.current_model_id = models.currentModelId;
  acp-bridge.available_models = models.availableModels.map((model) => model.modelId);
  record.acp-bridge = acp-bridge;
}
