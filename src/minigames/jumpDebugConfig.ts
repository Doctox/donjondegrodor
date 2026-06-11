import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";

const JUMP_HITBOX_DEBUG_STORAGE_KEY = "grodor_jump_hitbox_debug";

export function isJumpHitboxDebugEnabled(): boolean {
  if (!IS_DEBUG_TOOLS_ENABLED) {
    return false;
  }

  try {
    return window.localStorage.getItem(JUMP_HITBOX_DEBUG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setJumpHitboxDebugEnabled(enabled: boolean): void {
  if (!IS_DEBUG_TOOLS_ENABLED) {
    return;
  }

  try {
    window.localStorage.setItem(JUMP_HITBOX_DEBUG_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore storage failures: debug stays optional and non-blocking.
  }
}

export function toggleJumpHitboxDebug(): boolean {
  const enabled = !isJumpHitboxDebugEnabled();
  setJumpHitboxDebugEnabled(enabled);
  return enabled;
}
