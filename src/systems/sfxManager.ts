import { SFX_ASSETS } from "../data/assetKeys";

export type SfxId = keyof typeof SFX_ASSETS;

const DEFAULT_VOLUME = 0.7;
const MIN_REPEAT_MS = 45;
const STORAGE_MUTE_KEY = "grodor.sfx.muted";
const STORAGE_VOLUME_KEY = "grodor.sfx.volume";

let volume = readStoredVolume();
let muted = readStoredMuted();
const lastPlayedAt = new Map<SfxId, number>();

function readStoredMuted(): boolean {
  return window.localStorage.getItem(STORAGE_MUTE_KEY) === "1";
}

function readStoredVolume(): number {
  const storedValue = Number(window.localStorage.getItem(STORAGE_VOLUME_KEY));
  return Number.isFinite(storedValue) && storedValue >= 0 && storedValue <= 1 ? storedValue : DEFAULT_VOLUME;
}

export function playSfx(id: SfxId, options: { volume?: number; cooldownMs?: number } = {}): void {
  if (muted) {
    return;
  }

  const now = window.performance.now();
  const cooldownMs = options.cooldownMs ?? MIN_REPEAT_MS;
  const lastTime = lastPlayedAt.get(id) ?? 0;
  if (now - lastTime < cooldownMs) {
    return;
  }
  lastPlayedAt.set(id, now);

  const asset = SFX_ASSETS[id];
  const audio = new Audio(asset.path);
  audio.volume = Math.max(0, Math.min(1, volume * (options.volume ?? 1)));
  audio.play().catch(() => {
    // SFX may be rejected before the first user gesture; later interactions will work normally.
  });
}

export function setSfxMuted(nextMuted: boolean): void {
  muted = nextMuted;
  window.localStorage.setItem(STORAGE_MUTE_KEY, nextMuted ? "1" : "0");
}

export function setSfxVolume(nextVolume: number): void {
  volume = Math.max(0, Math.min(1, nextVolume));
  window.localStorage.setItem(STORAGE_VOLUME_KEY, String(volume));
}

export function toggleSfxMuted(): boolean {
  setSfxMuted(!muted);
  return muted;
}

export function getSfxSettings(): { muted: boolean; volume: number } {
  return { muted, volume };
}
