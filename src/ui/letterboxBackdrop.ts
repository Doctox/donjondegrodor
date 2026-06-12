import { assetPath } from "../utils/assetPath";

const DEFAULT_BACKDROP = assetPath("/assets/backgrounds/intro/intro_background.webp");

export function setLetterboxBackdrop(imagePath: string = DEFAULT_BACKDROP): void {
  document.documentElement.style.setProperty("--letterbox-backdrop", `url("${imagePath}")`);
}
