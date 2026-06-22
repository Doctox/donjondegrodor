import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";

export type GrodorDebugMode = "sprite" | "rigV3";

const GRODOR_DEBUG_MODE_STORAGE_KEY = "grodor-debug-mode";
const DEFAULT_GRODOR_MODE: GrodorDebugMode = "rigV3";

export function getGrodorDebugMode(): GrodorDebugMode {
  if (!IS_DEBUG_TOOLS_ENABLED) {
    return DEFAULT_GRODOR_MODE;
  }

  try {
    return localStorage.getItem(GRODOR_DEBUG_MODE_STORAGE_KEY) === "sprite" ? "sprite" : DEFAULT_GRODOR_MODE;
  } catch {
    return DEFAULT_GRODOR_MODE;
  }
}

export function setGrodorDebugMode(mode: GrodorDebugMode): GrodorDebugMode {
  if (!IS_DEBUG_TOOLS_ENABLED) {
    return DEFAULT_GRODOR_MODE;
  }

  try {
    localStorage.setItem(GRODOR_DEBUG_MODE_STORAGE_KEY, mode);
  } catch {
    // Debug setting remains session-only if storage is blocked.
  }

  return mode;
}
