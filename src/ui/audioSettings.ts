import {
  getGlobalMusicSettings,
  setGlobalMusicMuted,
  setGlobalMusicVolume,
  toggleGlobalMusicMuted
} from "../systems/audioManager";
import { getSfxSettings, playSfx, setSfxMuted, setSfxVolume, toggleSfxMuted } from "../systems/sfxManager";

const CANVAS_MARGIN = 14;
const BUTTON_SIZE = 34;

export function setupAudioSettingsButton(): void {
  const shell = document.getElementById("game-shell");
  if (!shell || document.getElementById("audio-settings-root")) {
    return;
  }

  const root = document.createElement("div");
  root.id = "audio-settings-root";
  root.className = "audio-settings";

  const button = document.createElement("button");
  button.className = "audio-settings-button";
  button.type = "button";
  button.innerHTML = "&#9881;";
  button.setAttribute("aria-label", "Parametres audio");

  const panel = document.createElement("section");
  panel.className = "audio-settings-panel";
  panel.hidden = true;

  const muteButton = document.createElement("button");
  muteButton.className = "audio-settings-mute";
  muteButton.type = "button";
  muteButton.setAttribute("aria-label", "Couper ou activer la musique");

  const volumeRow = document.createElement("div");
  volumeRow.className = "audio-settings-volume";

  const musicLabel = document.createElement("span");
  musicLabel.className = "audio-settings-label";
  musicLabel.textContent = "Music";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.step = "1";
  slider.setAttribute("aria-label", "Volume musique");

  const sfxMuteButton = document.createElement("button");
  sfxMuteButton.className = "audio-settings-mute";
  sfxMuteButton.type = "button";
  sfxMuteButton.setAttribute("aria-label", "Couper ou activer les bruitages");

  const sfxVolumeRow = document.createElement("div");
  sfxVolumeRow.className = "audio-settings-volume";

  const sfxLabel = document.createElement("span");
  sfxLabel.className = "audio-settings-label";
  sfxLabel.textContent = "Bruitage";

  const sfxSlider = document.createElement("input");
  sfxSlider.type = "range";
  sfxSlider.min = "0";
  sfxSlider.max = "100";
  sfxSlider.step = "1";
  sfxSlider.setAttribute("aria-label", "Volume bruitages");

  volumeRow.append(musicLabel, slider);
  sfxVolumeRow.append(sfxLabel, sfxSlider);
  panel.append(muteButton, volumeRow, sfxMuteButton, sfxVolumeRow);
  root.append(button, panel);
  shell.appendChild(root);

  const stopMenuPointerEvent = (event: Event): void => {
    event.stopPropagation();
  };
  ["pointerdown", "pointerup", "click", "mousedown", "mouseup", "touchstart", "touchend"].forEach((eventName) => {
    root.addEventListener(eventName, stopMenuPointerEvent);
  });

  const alignToCanvas = (): void => {
    const canvas = document.querySelector<HTMLCanvasElement>("#game-root canvas");
    if (!canvas) {
      window.requestAnimationFrame(alignToCanvas);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    root.style.left = `${Math.round(rect.left + CANVAS_MARGIN)}px`;
    root.style.top = `${Math.round(rect.bottom - CANVAS_MARGIN - BUTTON_SIZE)}px`;
  };

  const refresh = (): void => {
    const settings = getGlobalMusicSettings();
    const sfxSettings = getSfxSettings();
    slider.value = String(Math.round(settings.volume * 100));
    muteButton.innerHTML = settings.muted ? "&#128263;" : "&#128266;";
    muteButton.classList.toggle("is-muted", settings.muted);
    sfxSlider.value = String(Math.round(sfxSettings.volume * 100));
    sfxMuteButton.innerHTML = sfxSettings.muted ? "&#128263;" : "&#128266;";
    sfxMuteButton.classList.toggle("is-muted", sfxSettings.muted);
  };

  button.addEventListener("click", (event) => {
    playSfx("uiClick");
    panel.hidden = !panel.hidden;
    alignToCanvas();
    refresh();
  });

  muteButton.addEventListener("click", (event) => {
    playSfx("uiClick");
    toggleGlobalMusicMuted();
    refresh();
  });

  sfxMuteButton.addEventListener("click", (event) => {
    const muted = toggleSfxMuted();
    if (!muted) {
      playSfx("uiClick");
    }
    refresh();
  });

  slider.addEventListener("input", () => {
    const nextVolume = Number(slider.value) / 100;
    setGlobalMusicVolume(undefined, nextVolume);
    if (nextVolume > 0) {
      setGlobalMusicMuted(undefined, false);
    }
    refresh();
  });

  sfxSlider.addEventListener("input", () => {
    const nextVolume = Number(sfxSlider.value) / 100;
    setSfxVolume(nextVolume);
    if (nextVolume > 0) {
      setSfxMuted(false);
    }
    refresh();
  });

  sfxSlider.addEventListener("change", () => {
    playSfx("uiClick");
  });

  document.addEventListener("pointerdown", (event) => {
    if (!root.contains(event.target as Node)) {
      panel.hidden = true;
    }
  });

  refresh();
  alignToCanvas();
  window.addEventListener("resize", alignToCanvas);
  window.addEventListener("orientationchange", alignToCanvas);
}
