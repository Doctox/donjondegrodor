import { GameState, subscribeGameState } from "../systems/gameState";
import { IMAGE_ASSETS } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";

let unsubscribe: (() => void) | undefined;

export function mountHud(rootId = "hud-root"): void {
  const root = document.getElementById(rootId);
  if (!root) {
    return;
  }

  root.classList.add("hud-hidden");
  root.setAttribute("aria-hidden", "true");
  unsubscribe?.();
  unsubscribe = subscribeGameState((state) => renderHud(root, state));
}

export function setHudVisible(visible: boolean, rootId = "hud-root"): void {
  const root = document.getElementById(rootId);
  if (root) {
    root.classList.toggle("hud-hidden", !visible);
    root.setAttribute("aria-hidden", String(!visible));
  }
}

function renderHud(root: HTMLElement, state: GameState): void {
  root.innerHTML = `
    <section class="hud-panel">
      <div class="hud-card hud-life">
        <img src="${IMAGE_ASSETS.hudLife.path}" alt="" />
        <span>${GAME_TEXTS.hud.life}</span>
        <strong>${state.life}</strong>
      </div>
      <div class="hud-card">
        <img src="${IMAGE_ASSETS.gold.path}" alt="" />
        <span>${GAME_TEXTS.hud.gold}</span>
        <strong>${state.gold}</strong>
      </div>
      <div class="hud-card">
        <img src="${IMAGE_ASSETS.hudAttempt.path}" alt="" />
        <span>${GAME_TEXTS.hud.attempt}</span>
        <strong>${state.attempt}</strong>
      </div>
      <div class="hud-card">
        <img src="${IMAGE_ASSETS.hudFloor.path}" alt="" />
        <span>${GAME_TEXTS.hud.floor}</span>
        <strong>${state.floor}</strong>
      </div>
    </section>
    <p class="hud-event">${state.lastEvent}</p>
  `;
}
