import { GAME_TEXTS } from "../data/gameTexts";

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

export function setupMobileFullscreenButton(): void {
  const shell = document.getElementById("game-shell");
  if (!shell || !shell.requestFullscreen || document.getElementById("mobile-fullscreen-button")) {
    return;
  }

  const button = document.createElement("button");
  button.id = "mobile-fullscreen-button";
  button.className = "mobile-fullscreen-button";
  button.type = "button";
  button.textContent = GAME_TEXTS.mobile.fullscreenButton;
  button.setAttribute("aria-label", GAME_TEXTS.mobile.fullscreenButton);

  const syncButtonState = () => {
    button.hidden = document.fullscreenElement === shell;
  };

  button.addEventListener("click", () => {
    void openMobileFullscreen(shell);
  });
  document.addEventListener("fullscreenchange", syncButtonState);

  shell.appendChild(button);
  syncButtonState();
}

async function openMobileFullscreen(shell: HTMLElement): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await shell.requestFullscreen({ navigationUI: "hide" });
    }
  } catch {
    return;
  }

  const orientation = screen.orientation as LockableScreenOrientation | undefined;
  if (!orientation?.lock) {
    return;
  }

  try {
    await orientation.lock("landscape");
  } catch {
    // Browsers may reject orientation lock outside installed/fullscreen contexts.
  }
}
