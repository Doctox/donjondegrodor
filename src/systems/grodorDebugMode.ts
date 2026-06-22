import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";

export type GrodorDebugMode = "sprite" | "rigV3";

const GRODOR_DEBUG_MODE_STORAGE_KEY = "grodor-debug-mode";

export function getGrodorDebugMode(): GrodorDebugMode {
  if (!IS_DEBUG_TOOLS_ENABLED) {
    return "sprite";
  }

  try {
    return localStorage.getItem(GRODOR_DEBUG_MODE_STORAGE_KEY) === "rigV3" ? "rigV3" : "sprite";
  } catch {
    return "sprite";
  }
}

export function setGrodorDebugMode(mode: GrodorDebugMode): GrodorDebugMode {
  if (!IS_DEBUG_TOOLS_ENABLED) {
    return "sprite";
  }

  try {
    localStorage.setItem(GRODOR_DEBUG_MODE_STORAGE_KEY, mode);
  } catch {
    // Debug setting remains session-only if storage is blocked.
  }

  return mode;
}
