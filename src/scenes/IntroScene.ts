import Phaser from "phaser";
import { IMAGE_ASSETS, PRELOAD_IMAGES, PRELOAD_JSON, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { playZoneMusic } from "../systems/audioManager";
import { resetGameState } from "../systems/gameState";
import { setHudVisible } from "../ui/hud";
import { setLetterboxBackdrop } from "../ui/letterboxBackdrop";
import { CellScene } from "./CellScene";

const HALF_WIDTH = WORLD_WIDTH / 2;
const LOGO_REVEAL_DURATION = 3000;
const OPEN_DURATION = 3000;

export class IntroScene extends Phaser.Scene {
  private background?: Phaser.GameObjects.Image;
  private logo?: Phaser.GameObjects.Image;
  private loadingText?: Phaser.GameObjects.Text;
  private opening = false;
  private ready = false;
  private gameplayAssetsReady = false;
  private openWhenReady = false;
  private readonly handlePointerDown = (): void => this.openIntro();
  private readonly handleWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Enter" || event.code === "Space") {
      this.openIntro();
    }
  };

  constructor() {
    super("IntroScene");
  }

  create(): void {
    setHudVisible(false);
    setLetterboxBackdrop(IMAGE_ASSETS.introBackground.path);
    resetGameState();
    this.opening = false;
    this.ready = false;
    this.gameplayAssetsReady = false;
    this.openWhenReady = false;

    this.background = this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, IMAGE_ASSETS.introBackground.key, "__BASE")
      .setOrigin(0.5)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);

    this.logo = this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, IMAGE_ASSETS.introLogo.key, "__BASE")
      .setOrigin(0.5)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setScale(0.08);

    this.tweens.add({
      targets: this.logo,
      scaleX: 1,
      scaleY: 1,
      duration: LOGO_REVEAL_DURATION,
      ease: "Cubic.easeOut",
      onComplete: () => this.enableStartInput()
    });
    this.loadGameplayAssetsInBackground();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("pointerdown", this.handlePointerDown);
      window.removeEventListener("keydown", this.handleWindowKeyDown);
    });
  }

  private enableStartInput(): void {
    if (!this.logo) {
      return;
    }

    this.ready = true;
    this.logo.setInteractive({ useHandCursor: true });
    this.logo.once("pointerdown", () => this.openIntro());
    this.input.on("pointerdown", this.handlePointerDown);
    this.input.keyboard?.once("keydown-ENTER", () => this.openIntro());
    this.input.keyboard?.once("keydown-SPACE", () => this.openIntro());
    window.addEventListener("keydown", this.handleWindowKeyDown);
  }

  private openIntro(): void {
    if (!this.ready || this.opening) {
      return;
    }

    if (!this.gameplayAssetsReady) {
      this.openWhenReady = true;
      this.showLoadingText();
      return;
    }

    this.opening = true;
    playZoneMusic(this, "intro", 0);
    this.startOpeningTransition();
  }

  private startOpeningTransition(): void {
    this.ready = false;
    this.logo?.disableInteractive();
    this.input.off("pointerdown", this.handlePointerDown);
    window.removeEventListener("keydown", this.handleWindowKeyDown);

    this.background?.destroy();
    this.logo?.destroy();
    this.background = undefined;
    this.logo = undefined;
    this.loadingText?.destroy();
    this.loadingText = undefined;

    this.scene.launch("CellScene", { introOverlayActive: true });
    this.scene.bringToTop("IntroScene");
    this.createSplitFrames();

    const backgroundLeft = this.createHalf(IMAGE_ASSETS.introBackground.key, "left", 0);
    const backgroundRight = this.createHalf(IMAGE_ASSETS.introBackground.key, "right", HALF_WIDTH);
    const logoLeft = this.createHalf(IMAGE_ASSETS.introLogo.key, "left", 0);
    const logoRight = this.createHalf(IMAGE_ASSETS.introLogo.key, "right", HALF_WIDTH);

    this.tweens.add({
      targets: [backgroundLeft, logoLeft],
      x: -HALF_WIDTH,
      duration: OPEN_DURATION,
      ease: "Cubic.easeInOut"
    });

    this.tweens.add({
      targets: [backgroundRight, logoRight],
      x: WORLD_WIDTH,
      duration: OPEN_DURATION,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        const cellScene = this.scene.get("CellScene");
        if (cellScene instanceof CellScene) {
          cellScene.completeIntroOverlay();
        }
        this.scene.stop("IntroScene");
      }
    });

    (window as unknown as { __introReport?: unknown }).__introReport = {
      status: "opening",
      destination: "CellScene"
    };
  }

  private createHalf(textureKey: string, side: "left" | "right", x: number): Phaser.GameObjects.Image {
    return this.add
      .image(x, 0, textureKey, this.getFrameName(textureKey, side))
      .setOrigin(0)
      .setDisplaySize(HALF_WIDTH, WORLD_HEIGHT);
  }

  private createSplitFrames(): void {
    this.ensureFrame(IMAGE_ASSETS.introBackground.key, "left", 0);
    this.ensureFrame(IMAGE_ASSETS.introBackground.key, "right", HALF_WIDTH);
    this.ensureFrame(IMAGE_ASSETS.introLogo.key, "left", 0);
    this.ensureFrame(IMAGE_ASSETS.introLogo.key, "right", HALF_WIDTH);
  }

  private ensureFrame(textureKey: string, side: "left" | "right", cropX: number): void {
    const texture = this.textures.get(textureKey);
    const frameName = this.getFrameName(textureKey, side);
    if (texture.has(frameName)) {
      return;
    }

    texture.add(frameName, 0, cropX, 0, HALF_WIDTH, WORLD_HEIGHT);
  }

  private getFrameName(textureKey: string, side: "left" | "right"): string {
    return `${textureKey}-${side}`;
  }

  private loadGameplayAssetsInBackground(): void {
    let queuedAssets = 0;
    PRELOAD_IMAGES.forEach((asset) => {
      if (this.textures.exists(asset.key)) {
        return;
      }
      this.load.image(asset.key, asset.path);
      queuedAssets += 1;
    });
    PRELOAD_JSON.forEach((asset) => {
      if (this.cache.tilemap.exists(asset.key)) {
        return;
      }
      this.load.tilemapTiledJSON(asset.key, asset.path);
      queuedAssets += 1;
    });
    if (queuedAssets <= 0) {
      this.markGameplayAssetsReady();
      return;
    }

    this.load.on("progress", (progress: number) => {
      if (this.loadingText) {
        this.loadingText.setText(GAME_TEXTS.common.loadingProgress(Math.round(progress * 100)));
      }
    });
    this.load.once("complete", () => this.markGameplayAssetsReady());
    this.load.start();
  }

  private markGameplayAssetsReady(): void {
    this.gameplayAssetsReady = true;
    if (this.loadingText) {
      this.loadingText.setText(GAME_TEXTS.common.clickToStart);
    }
    if (this.openWhenReady) {
      this.openIntro();
    }
  }

  private showLoadingText(): void {
    if (this.loadingText) {
      return;
    }

    this.loadingText = this.add
      .text(WORLD_WIDTH / 2, WORLD_HEIGHT - 118, GAME_TEXTS.common.loading, {
        fontFamily: "Georgia, serif",
        fontSize: "36px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 6
      })
      .setOrigin(0.5);
  }
}
