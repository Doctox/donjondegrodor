import Phaser from "phaser";
import { AUDIO_ASSETS } from "../data/assetKeys";

export type MusicZone = "intro" | "village" | "dungeon" | "combat" | "shop" | "tavern" | "bank";

const STORAGE_KEYS = {
  muted: "grodor.audio.muted",
  volume: "grodor.audio.volume"
} as const;

const DEFAULT_VOLUME = 0.55;
const DEFAULT_FADE_MS = 700;

const MUSIC_BY_ZONE = {
  intro: AUDIO_ASSETS.musicIntro,
  village: AUDIO_ASSETS.musicVillage,
  dungeon: AUDIO_ASSETS.musicDungeon,
  combat: AUDIO_ASSETS.musicCombat,
  shop: AUDIO_ASSETS.musicShop,
  tavern: AUDIO_ASSETS.musicTavern,
  bank: AUDIO_ASSETS.musicBank
} satisfies Record<MusicZone, (typeof AUDIO_ASSETS)[keyof typeof AUDIO_ASSETS]>;

const LOOP_BY_ZONE = {
  intro: false,
  village: true,
  dungeon: true,
  combat: true,
  shop: true,
  tavern: true,
  bank: true
} satisfies Record<MusicZone, boolean>;

const VOLUME_MULTIPLIER_BY_ZONE = {
  intro: 1,
  village: 1,
  dungeon: 1,
  combat: 1,
  shop: 3.1,
  tavern: 3.1,
  bank: 3.1
} satisfies Record<MusicZone, number>;

let player: HTMLAudioElement | undefined;
let audioContext: AudioContext | undefined;
let gainNode: GainNode | undefined;
let sourceNode: MediaElementAudioSourceNode | undefined;
let currentZone: MusicZone | undefined;
let requestedZone: MusicZone | undefined;
let volume = readStoredVolume();
let muted = readStoredMuted();
let listenersReady = false;
let fadeIntervalId: number | undefined;
let lastPlayError: string | undefined;
let transitionId = 0;

export function playZoneMusic(scene: Phaser.Scene, zone: MusicZone, fadeMs = DEFAULT_FADE_MS): void {
  requestedZone = zone;
  ensurePlayer();
  ensureUserAudioUnlock();

  if (!player) {
    publishAudioReport(scene, zone, "no-player");
    return;
  }

  if (currentZone === zone && !player.paused) {
    updateZoneGain();
    fadeTo(getElementVolume(), fadeMs);
    publishAudioReport(scene, zone, "already-playing");
    return;
  }

  const nextTransitionId = transitionId + 1;
  transitionId = nextTransitionId;

  if (player.src && !player.paused && player.volume > 0 && currentZone !== zone && fadeMs > 0) {
    fadeTo(0, fadeMs, () => {
      if (transitionId !== nextTransitionId) {
        return;
      }
      switchToZone(zone);
      requestPlay();
      fadeTo(getElementVolume(), fadeMs);
      publishAudioReport(scene, zone, "transitioned");
    });
  } else {
    switchToZone(zone);
    requestPlay();
    fadeTo(getElementVolume(), fadeMs);
  }

  publishAudioReport(scene, zone, "play-requested");
}

export function stopZoneMusic(scene?: Phaser.Scene, fadeMs = DEFAULT_FADE_MS): void {
  requestedZone = undefined;

  if (!player) {
    publishAudioReport(scene, currentZone, "stop-no-player");
    return;
  }

  const stoppedZone = currentZone;
  const pausePlayer = (): void => {
    if (!player) {
      return;
    }

    player.pause();
    player.currentTime = 0;
    currentZone = undefined;
    publishAudioReport(scene, stoppedZone, "stopped");
  };

  if (player.paused || player.volume <= 0 || fadeMs <= 0) {
    pausePlayer();
    return;
  }

  fadeTo(0, fadeMs, pausePlayer);
  publishAudioReport(scene, stoppedZone, "stop-requested");
}

export function setGlobalMusicMuted(scene: Phaser.Scene | undefined, nextMuted: boolean): void {
  muted = nextMuted;
  writeStorage(STORAGE_KEYS.muted, muted ? "1" : "0");
  fadeTo(getElementVolume(), 160);
  publishAudioReport(scene, currentZone, "muted-updated");
}

export function toggleGlobalMusicMuted(scene?: Phaser.Scene): boolean {
  setGlobalMusicMuted(scene, !muted);
  return muted;
}

export function setGlobalMusicVolume(scene: Phaser.Scene | undefined, nextVolume: number): void {
  volume = Phaser.Math.Clamp(nextVolume, 0, 1);
  writeStorage(STORAGE_KEYS.volume, String(volume));
  fadeTo(getElementVolume(), 160);
  publishAudioReport(scene, currentZone, "volume-updated");
}

export function getGlobalMusicSettings(): { muted: boolean; volume: number; zone?: MusicZone } {
  return { muted, volume, zone: currentZone };
}

function ensurePlayer(): void {
  if (player) {
    return;
  }

  player = new Audio();
  player.loop = true;
  player.preload = "auto";
  player.volume = 0;
  ensureAudioGraph();
}

function switchToZone(zone: MusicZone): void {
  if (!player) {
    return;
  }

  const asset = MUSIC_BY_ZONE[zone];
  if (player.src.endsWith(asset.path)) {
    currentZone = zone;
    updateZoneGain();
    return;
  }

  cancelFade();
  player.pause();
  player.src = asset.path;
  player.loop = LOOP_BY_ZONE[zone];
  player.preload = "auto";
  player.currentTime = 0;
  player.volume = 0;
  player.load();
  currentZone = zone;
  updateZoneGain();
}

function ensureUserAudioUnlock(): void {
  if (listenersReady) {
    return;
  }

  listenersReady = true;
  const unlock = (): void => {
    if (!requestedZone) {
      return;
    }

    ensurePlayer();
    if (player && currentZone !== requestedZone) {
      const asset = MUSIC_BY_ZONE[requestedZone];
      player.src = asset.path;
      player.loop = LOOP_BY_ZONE[requestedZone];
      player.preload = "auto";
      player.volume = 0;
      currentZone = requestedZone;
    }
    void audioContext?.resume();
    requestPlay();
    fadeTo(getElementVolume(), 160);
  };

  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("pointerup", unlock, true);
  window.addEventListener("keydown", unlock, true);
}

function requestPlay(): void {
  if (!player) {
    return;
  }

  const playResult = player.play();
  if (playResult) {
    playResult
      .then(() => {
        lastPlayError = undefined;
      })
      .catch((error: unknown) => {
        lastPlayError = error instanceof Error ? error.message : String(error);
      // Autoplay can be rejected until a gesture arrives; persistent unlock listeners retry.
      });
  }
}

function fadeTo(targetVolume: number, durationMs: number, onComplete?: () => void): void {
  if (!player) {
    return;
  }

  cancelFade();
  const fromVolume = player.volume;
  const toVolume = Phaser.Math.Clamp(targetVolume, 0, 1);
  if (durationMs <= 0) {
    player.volume = toVolume;
    onComplete?.();
    return;
  }

  const startedAt = window.performance.now();
  fadeIntervalId = window.setInterval(() => {
    if (!player) {
      cancelFade();
      return;
    }

    const progress = Phaser.Math.Clamp((window.performance.now() - startedAt) / durationMs, 0, 1);
    const easedProgress = Phaser.Math.Easing.Sine.InOut(progress);
    player.volume = Phaser.Math.Clamp(Phaser.Math.Linear(fromVolume, toVolume, easedProgress), 0, 1);
    if (progress >= 1) {
      cancelFade();
      player.volume = toVolume;
      onComplete?.();
    }
  }, 33);
}

function cancelFade(): void {
  if (fadeIntervalId === undefined) {
    return;
  }

  window.clearInterval(fadeIntervalId);
  fadeIntervalId = undefined;
}

function ensureAudioGraph(): void {
  if (!player || sourceNode || gainNode) {
    return;
  }

  try {
    const AudioContextConstructor = window.AudioContext;
    audioContext = audioContext ?? new AudioContextConstructor();
    sourceNode = audioContext.createMediaElementSource(player);
    gainNode = audioContext.createGain();
    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    updateZoneGain();
  } catch (error) {
    lastPlayError = error instanceof Error ? error.message : String(error);
  }
}

function updateZoneGain(): void {
  if (!gainNode) {
    return;
  }

  gainNode.gain.value = currentZone ? VOLUME_MULTIPLIER_BY_ZONE[currentZone] : 1;
}

function getElementVolume(): number {
  if (muted) {
    return 0;
  }

  return Phaser.Math.Clamp(volume, 0, 1);
}

function getEffectiveVolume(): number {
  const zoneMultiplier = currentZone ? VOLUME_MULTIPLIER_BY_ZONE[currentZone] : 1;
  return getElementVolume() * zoneMultiplier;
}

function readStoredMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.muted) === "1";
  } catch {
    return false;
  }
}

function readStoredVolume(): number {
  try {
    const storedVolume = Number(window.localStorage.getItem(STORAGE_KEYS.volume));
    return Number.isFinite(storedVolume) && storedVolume > 0 ? Phaser.Math.Clamp(storedVolume, 0, 1) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private contexts; audio should still work for the session.
  }
}

function publishAudioReport(scene: Phaser.Scene | undefined, zone: MusicZone | undefined, status: string): void {
  (window as unknown as { __audioReport?: unknown }).__audioReport = {
    status,
    zone,
    requestedZone,
    muted,
    volume,
    effectiveVolume: getEffectiveVolume(),
    src: player?.currentSrc || player?.src,
    paused: player?.paused ?? true,
    currentTime: player?.currentTime ?? 0,
    duration: player?.duration ?? 0,
    lastPlayError,
    phaserSoundLocked: scene?.sound.locked
  };
}
