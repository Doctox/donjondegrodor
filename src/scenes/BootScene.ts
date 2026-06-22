import Phaser from "phaser";
import { INTRO_PRELOAD_IMAGES, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { GAME_TEXTS } from "../data/gameTexts";
import { mountHud, setHudVisible } from "../ui/hud";

export class BootScene extends Phaser.Scene {
  private sceneParam: string | null = null;

  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.sceneParam = IS_DEBUG_TOOLS_ENABLED ? new URLSearchParams(window.location.search).get("scene") : null;
    this.createLoadingFeedback();

    INTRO_PRELOAD_IMAGES.forEach((asset) => this.load.image(asset.key, asset.path));
  }

  create(): void {
    mountHud();
    setHudVisible(false);
    document.getElementById("initial-loading")?.remove();
    const sceneParam = this.sceneParam;
    if (sceneParam === "intro") {
      this.scene.start("IntroScene");
    } else if (sceneParam === "cell") {
      this.scene.start("CellScene", { introOverlayActive: false });
    } else if (sceneParam === "tiled" && IS_DEBUG_TOOLS_ENABLED) {
      this.scene.start("TiledDebugScene");
    } else if (sceneParam === "dungeon" || (sceneParam === "combat" && IS_DEBUG_TOOLS_ENABLED)) {
      this.scene.start("DungeonScene");
    } else if (sceneParam === "village") {
      this.scene.start("VillageScene", {
        fromDungeon: new URLSearchParams(window.location.search).get("fromDungeon") === "1"
      });
    } else if (sceneParam === "tavern") {
      this.scene.start("TavernScene");
    } else if (sceneParam === "result" || sceneParam === "defeat" || sceneParam === "victory") {
      this.scene.start("DungeonScene", { resultOverlay: sceneParam === "victory" ? "victory" : "defeat" });
    } else if (sceneParam === "ui") {
      this.scene.start("NineSliceTestScene");
    } else {
      this.scene.start("IntroScene");
    }
  }

  private createLoadingFeedback(): void {
    this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x080504, 0.72).setOrigin(0);
    const label = this.add
      .text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 220, GAME_TEXTS.common.loading, {
        fontFamily: "Georgia, serif",
        fontSize: "42px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 6
      })
      .setOrigin(0.5);

    this.load.on("progress", (progress: number) => {
      label.setText(GAME_TEXTS.common.loadingProgress(Math.round(progress * 100)));
    });
  }
}
