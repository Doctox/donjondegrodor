import Phaser from "phaser";
import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { resetDungeonAttemptCounter, resetDungeonRunState } from "../systems/dungeonRunState";
import { calculateCurrentGrodorRunScore, getCurrentGrodorRunStats, GrodorScore } from "../systems/grodorStats";
import { playZoneMusic, stopZoneMusic } from "../systems/audioManager";
import { playSfx } from "../systems/sfxManager";
import { hasDiscoveredVillage } from "../systems/villageDiscovery";
import { createNineSlicePanel } from "../ui/nineSlicePanel";
import { setHudVisible } from "../ui/hud";

type ResultSceneData = {
  kind?: "defeat" | "victory";
  mode?: "defeat" | "victory";
  scoreDelta?: number;
  scoreGain?: number;
};

const SCORE_FRAME_TEXTURE_KEY = "result-score-frame-cropped";
const SCORE_FRAME_CROP = {
  x: 735,
  y: 634,
  width: 450,
  height: 207
};
const DEFEAT_SCORE_PANEL = {
  x: WORLD_WIDTH / 2,
  y: 272,
  width: 655,
  height: 494
};
const DEFEAT_SECONDARY_BUTTON = {
  x: 304,
  y: 906,
  width: 447,
  height: 217
};
const DEFEAT_PRIMARY_BUTTON = {
  x: 1616,
  y: 904,
  width: 445,
  height: 216
};
const VICTORY_SCORE_PANEL = {
  x: WORLD_WIDTH / 2,
  y: 274,
  width: 655,
  height: 494
};
const VICTORY_BUTTON = {
  x: 1518,
  y: 884,
  width: 447,
  height: 217
};

export class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  create(data: ResultSceneData = {}): void {
    setHudVisible(false);

    const mode = data.mode ?? data.kind ?? "defeat";
    const runScore = calculateCurrentGrodorRunScore();
    const scoreGain = Math.max(0, Math.trunc(data.scoreGain ?? data.scoreDelta ?? runScore.total));
    const villageDiscovered = hasDiscoveredVillage();
    const runStats = getCurrentGrodorRunStats();

    if (mode === "victory") {
      playZoneMusic(this, "village");
      playSfx("miniGameSuccess");
      this.createVictoryLayout(runScore, runStats);
    } else {
      stopZoneMusic(this);
      this.createDefeatLayout(runScore, villageDiscovered);
    }

    (window as unknown as { __resultSceneReport?: unknown }).__resultSceneReport = {
      mode,
      kind: mode,
      scoreGain,
      scoreDelta: scoreGain,
      runStats,
      villageDiscovered,
      buttons: {
        cell: mode === "defeat",
        village: mode === "defeat" && villageDiscovered,
        continue: mode === "victory"
      }
    };
  }

  private addFullCanvasOverlay(key: string, depth: number): void {
    this.add.image(0, 0, key).setOrigin(0).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT).setDepth(depth);
  }

  private createDefeatLayout(score: GrodorScore, villageDiscovered: boolean): void {
    this.addFullCanvasOverlay(IMAGE_ASSETS.resultDefeatBackground.key, 0);
    this.createScoreBreakdown(score, DEFEAT_SCORE_PANEL, GAME_TEXTS.result.defeatBreakdownTitle);
    this.createImageButton(
      IMAGE_ASSETS.resultButtonSecondaryEmpty.key,
      DEFEAT_SECONDARY_BUTTON,
      GAME_TEXTS.result.buttons.cell,
      () => this.goToCell()
    );
    if (villageDiscovered) {
      this.createImageButton(
        IMAGE_ASSETS.resultButtonPrimaryEmpty.key,
        DEFEAT_PRIMARY_BUTTON,
        GAME_TEXTS.result.buttons.village,
        () => this.goToVillage()
      );
    }
  }

  private createVictoryLayout(score: GrodorScore, runStats: ReturnType<typeof getCurrentGrodorRunStats>): void {
    this.addFullCanvasOverlay(IMAGE_ASSETS.resultVictoryBackground.key, 0);
    this.createVictoryProps(runStats);
    this.createScoreBreakdown(score, VICTORY_SCORE_PANEL, GAME_TEXTS.result.victoryBreakdownTitle);
    this.createImageButton(
      IMAGE_ASSETS.resultButtonSecondaryEmpty.key,
      VICTORY_BUTTON,
      GAME_TEXTS.result.buttons.village,
      () => this.goToVictoryVillage()
    );
  }

  private createVictoryProps(runStats: ReturnType<typeof getCurrentGrodorRunStats>): void {
    const bagKey = runStats.poGagnes >= 10 ? IMAGE_ASSETS.resultVictoryCoinBagFull.key : IMAGE_ASSETS.resultVictoryCoinBagEmpty.key;
    this.add.image(606, 944, bagKey).setDepth(18).setScale(runStats.poGagnes >= 10 ? 1.1 : 1.16);
    if (runStats.objetsRamasses > 0) {
      this.add.image(324, 936, IMAGE_ASSETS.resultVictoryLootChest.key).setDepth(17).setScale(1.15);
    }
  }

  private createScoreBreakdown(
    score: GrodorScore,
    panelBounds: { x: number; y: number; width: number; height: number },
    title: string
  ): void {
    this.add
      .image(panelBounds.x, panelBounds.y, IMAGE_ASSETS.resultScoreBreakdownPanel.key)
      .setDisplaySize(panelBounds.width, panelBounds.height)
      .setDepth(30);

    this.add
      .text(panelBounds.x, 122, title, this.resultTextStyle(32))
      .setOrigin(0.5)
      .setDepth(31);

    const labels = GAME_TEXTS.result.scoreLabels;
    const rows = [
      { label: labels.gloire, value: score.gloire },
      { label: labels.souffrance, value: score.souffrance },
      { label: labels.avidite, value: score.avidite },
      { label: labels.obstination, value: score.obstination }
    ];
    rows.forEach((row, index) => {
      const y = 180 + index * 48;
      this.add.text(panelBounds.x - 160, y, row.label, this.resultTextStyle(28)).setOrigin(0, 0.5).setDepth(31);
      this.add
        .text(panelBounds.x + 152, y, `+${row.value}`, this.resultTextStyle(28))
        .setOrigin(1, 0.5)
        .setDepth(31);
    });

    this.add
      .text(panelBounds.x - 160, 392, labels.total, this.resultTextStyle(32, "#ffd98b"))
      .setOrigin(0, 0.5)
      .setDepth(31);
    this.add
      .text(panelBounds.x + 152, 392, `+${score.total}`, this.resultTextStyle(34, "#ffd98b"))
      .setOrigin(1, 0.5)
      .setDepth(31);
  }

  private createImageButton(
    textureKey: string,
    bounds: { x: number; y: number; width: number; height: number },
    label: string,
    onClick: () => void
  ): void {
    const button = this.add
      .image(bounds.x, bounds.y, textureKey)
      .setDisplaySize(bounds.width, bounds.height)
      .setDepth(40)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(bounds.x, bounds.y + 2, label, this.resultTextStyle(34, "#fff1c2")).setOrigin(0.5).setDepth(41);
    button.on("pointerover", () => {
      button.setTint(0xffdf91);
      text.setColor("#fff6d2");
    });
    button.on("pointerout", () => {
      button.clearTint();
      text.setColor("#fff1c2");
    });
    button.on("pointerdown", onClick);
  }

  private resultTextStyle(fontSize: number, color = "#fff1c2"): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Georgia, serif",
      fontSize: `${fontSize}px`,
      color,
      stroke: "#130b06",
      strokeThickness: 6,
      shadow: {
        offsetX: 2,
        offsetY: 3,
        color: "#000000",
        blur: 3,
        fill: true
      }
    };
  }

  private createScorePanel(scoreDelta: number): void {
    this.ensureScoreFrameTexture();
    const panel = createNineSlicePanel(this, SCORE_FRAME_TEXTURE_KEY, WORLD_WIDTH / 2, 732, 520, 180, {
      left: 82,
      right: 82,
      top: 56,
      bottom: 56
    }).setDepth(60);
    panel.setAlpha(0.96);

    this.add
      .text(WORLD_WIDTH / 2, 732, GAME_TEXTS.result.score(scoreDelta), {
        fontFamily: "Georgia, serif",
        fontSize: "42px",
        color: "#fff1c2",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(61);
  }

  private createContinueButton(): void {
    this.add
      .text(WORLD_WIDTH / 2, 885, GAME_TEXTS.common.continue, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "32px",
        color: "#1b100b",
        backgroundColor: "#f0c071",
        padding: { x: 34, y: 14 }
      })
      .setOrigin(0.5)
      .setDepth(80)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.goToVictoryVillage());
  }

  private ensureScoreFrameTexture(): void {
    if (this.textures.exists(SCORE_FRAME_TEXTURE_KEY)) {
      return;
    }

    const sourceImage = this.textures.get(IMAGE_ASSETS.resultScoreFrame.key).getSourceImage() as CanvasImageSource;
    const canvas = document.createElement("canvas");
    canvas.width = SCORE_FRAME_CROP.width;
    canvas.height = SCORE_FRAME_CROP.height;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(
      sourceImage,
      SCORE_FRAME_CROP.x,
      SCORE_FRAME_CROP.y,
      SCORE_FRAME_CROP.width,
      SCORE_FRAME_CROP.height,
      0,
      0,
      SCORE_FRAME_CROP.width,
      SCORE_FRAME_CROP.height
    );
    this.textures.addCanvas(SCORE_FRAME_TEXTURE_KEY, canvas);
  }

  private goToCell(): void {
    this.input.enabled = false;
    resetDungeonRunState({ incrementAttempt: true });
    this.scene.stop("CombatScene");
    this.scene.stop("MiniGameScene");
    this.scene.stop("DungeonScene");
    this.time.delayedCall(0, () => this.scene.start("CellScene", { introOverlayActive: false }));
  }

  private goToVillage(): void {
    this.input.enabled = false;
    resetDungeonRunState({ incrementAttempt: true });
    this.scene.stop("CombatScene");
    this.scene.stop("MiniGameScene");
    this.scene.stop("DungeonScene");
    this.time.delayedCall(0, () => this.scene.start("VillageScene", { fromDungeon: true }));
  }

  private goToVictoryVillage(): void {
    this.input.enabled = false;
    resetDungeonAttemptCounter();
    this.scene.stop("CombatScene");
    this.scene.stop("MiniGameScene");
    this.scene.stop("DungeonScene");
    this.time.delayedCall(0, () => this.scene.start("VillageScene", { fromDungeon: true }));
  }
}
