import Phaser from "phaser";
import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { getDungeonRunState } from "../systems/dungeonRunState";
import { MiniGameController, MiniGameHost, MiniGameResult } from "./miniGameTypes";

const DISPLAY = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT
};
const COUNTDOWN_VALUES = [3, 2, 1, 0];
const COUNTDOWN_INTERVAL_MS = 520;
const EXIT_UNLOCK_DELAY_MS = 1200;
const EXIT_HINT_MS = 4000;
const TAP_BUTTON = {
  x: WORLD_WIDTH / 2,
  y: 930,
  size: 210
};
const GAUGE = {
  x: 235,
  y: 540,
  width: 205,
  height: 615,
  trackTopOffset: 78,
  trackBottomOffset: 78
};
const CURSOR = {
  xOffset: -126,
  width: 82,
  height: 79
};
const CURSOR_SPEED = 5.2;
const ANKLE_BALL_CURSOR_SPEED_MULTIPLIER = 0.62;
const RESULT_FLASHES = 6;
const RESULT_FLASH_INTERVAL_MS = 150;
const PAINTED_ZONE_RATIOS = {
  top: 0.074,
  greenEnd: 0.305,
  orangeEnd: 0.587,
  bottom: 0.908
};
const PLAYABLE_TRACK_RATIOS = {
  top: GAUGE.trackTopOffset / GAUGE.height,
  bottom: 1 - GAUGE.trackBottomOffset / GAUGE.height
};
const GREEN_LIMIT = (PAINTED_ZONE_RATIOS.greenEnd - PLAYABLE_TRACK_RATIOS.top) / (PLAYABLE_TRACK_RATIOS.bottom - PLAYABLE_TRACK_RATIOS.top);
const ORANGE_LIMIT = (PAINTED_ZONE_RATIOS.orangeEnd - PLAYABLE_TRACK_RATIOS.top) / (PLAYABLE_TRACK_RATIOS.bottom - PLAYABLE_TRACK_RATIOS.top);
const RESULT_ZONE_HALO = {
  xInset: 48,
  radius: 16,
  lineWidth: 8,
  fillAlpha: 0.42,
  strokeAlpha: 0.96
};

const ELEVATOR_ASSETS = [
  IMAGE_ASSETS.elevatorIdle,
  IMAGE_ASSETS.elevatorWin,
  IMAGE_ASSETS.elevatorNeutral,
  IMAGE_ASSETS.elevatorLose,
  IMAGE_ASSETS.elevatorGauge,
  IMAGE_ASSETS.elevatorCursor,
  IMAGE_ASSETS.elevatorArrowDownGreen,
  IMAGE_ASSETS.elevatorArrowUpRed,
  IMAGE_ASSETS.tapButton
];

type ElevatorPhase = "loading" | "countdown" | "running" | "success" | "neutral" | "failure";

export class ElevatorMiniGame implements MiniGameController {
  private background?: Phaser.GameObjects.Image;
  private gauge?: Phaser.GameObjects.Image;
  private cursor?: Phaser.GameObjects.Image;
  private tapButton?: Phaser.GameObjects.Image;
  private tapHitZone?: Phaser.GameObjects.Zone;
  private countdownText?: Phaser.GameObjects.Text;
  private resultArrow?: Phaser.GameObjects.Image;
  private resultHalo?: Phaser.GameObjects.Graphics;
  private exitHitZone?: Phaser.GameObjects.Zone;
  private exitHint?: Phaser.GameObjects.Text;
  private phase: ElevatorPhase = "loading";
  private cursorPosition = 0;
  private cursorDirection = 1;
  private assetsReady = false;
  private result?: MiniGameResult;

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    if (!this.assetsReady) {
      if (this.ensureAssetsLoaded()) {
        return;
      }
      this.assetsReady = true;
    }

    this.phase = "countdown";
    this.cursorPosition = 0.5;
    this.cursorDirection = Phaser.Math.RND.pick([-1, 1]);
    this.background = this.host.scene.add
      .image(DISPLAY.x, DISPLAY.y, IMAGE_ASSETS.elevatorIdle.key)
      .setDisplaySize(DISPLAY.width, DISPLAY.height)
      .setDepth(3);
    this.gauge = this.host.scene.add
      .image(GAUGE.x, GAUGE.y, IMAGE_ASSETS.elevatorGauge.key)
      .setDisplaySize(GAUGE.width, GAUGE.height)
      .setDepth(5);
    this.cursor = this.host.scene.add
      .image(GAUGE.x + CURSOR.xOffset, this.getCursorY(), IMAGE_ASSETS.elevatorCursor.key)
      .setDisplaySize(CURSOR.width, CURSOR.height)
      .setDepth(7);
    this.tapButton = this.createTapButton();
    this.tapHitZone = this.createTapHitZone();
    this.setTapButtonEnabled(false);
    this.host.setStep(0);
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.host.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.host.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.host.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    });
    this.startCountdown();
    this.host.publishMiniGameReport();
  }

  getReportState(): Record<string, unknown> {
    return {
      phase: this.phase,
      cursorPosition: Number(this.cursorPosition.toFixed(3)),
      cursorDirection: this.cursorDirection,
      ankleBallActive: this.hasAnkleBall(),
      cursorSpeed: Number(this.getCursorSpeed().toFixed(2)),
      result: this.result
    };
  }

  private ensureAssetsLoaded(): boolean {
    const missingAssets = ELEVATOR_ASSETS.filter((asset) => !this.host.scene.textures.exists(asset.key));

    if (missingAssets.length === 0) {
      return false;
    }

    missingAssets.forEach((asset) => this.host.scene.load.image(asset.key, asset.path));
    this.host.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.assetsReady = true;
      this.start();
    });
    this.host.scene.load.start();
    return true;
  }

  private update(_time: number, delta: number): void {
    if (this.phase !== "running") {
      return;
    }

    this.cursorPosition += this.cursorDirection * this.getCursorSpeed() * (delta / 1000);
    if (this.cursorPosition <= 0) {
      this.cursorPosition = 0;
      this.cursorDirection = 1;
    } else if (this.cursorPosition >= 1) {
      this.cursorPosition = 1;
      this.cursorDirection = -1;
    }

    this.cursor?.setY(this.getCursorY());
    this.host.publishMiniGameReport();
  }

  private startCountdown(): void {
    this.host.getStatusText()?.setText("");
    this.countdownText = this.host.scene.add
      .text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "", {
        fontFamily: "Georgia, serif",
        fontSize: "112px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setDepth(12);

    let index = 0;
    const showNext = () => {
      const value = COUNTDOWN_VALUES[index];
      this.countdownText?.setText(GAME_TEXTS.miniGames.elevator.countdown(value));
      this.countdownText?.setScale(0.7).setAlpha(0);
      this.host.scene.tweens.add({
        targets: this.countdownText,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 160,
        yoyo: true,
        hold: 170,
        ease: "Back.easeOut"
      });
      index += 1;

      if (index < COUNTDOWN_VALUES.length) {
        this.host.scene.time.delayedCall(COUNTDOWN_INTERVAL_MS, showNext);
        return;
      }

      this.host.scene.time.delayedCall(COUNTDOWN_INTERVAL_MS, () => {
        this.countdownText?.destroy();
        this.countdownText = undefined;
        this.startRun();
      });
    };

    showNext();
  }

  private startRun(): void {
    this.phase = "running";
    this.host.setStep(1);
    this.host.getStatusText()?.setText("");
    this.setTapButtonEnabled(true);
    this.host.publishMiniGameReport();
  }

  private stopCursor(): void {
    if (this.phase !== "running") {
      return;
    }

    this.setTapButtonEnabled(false);
    if (this.cursorPosition <= GREEN_LIMIT) {
      this.finish({
        type: "elevator",
        outcome: "success",
        floorDelta: -1
      });
      return;
    }

    if (this.cursorPosition <= ORANGE_LIMIT) {
      const maxLoss = Math.min(5, this.host.getCarriedGold());
      const goldLoss = maxLoss > 0 ? Phaser.Math.Between(1, maxLoss) : 0;
      this.finish({
        type: "elevator",
        outcome: "neutral",
        goldLoss
      });
      return;
    }

    this.finish({
      type: "elevator",
      outcome: "failure",
      floorDelta: 2
    });
  }

  private getCursorSpeed(): number {
    return this.hasAnkleBall() ? CURSOR_SPEED * ANKLE_BALL_CURSOR_SPEED_MULTIPLIER : CURSOR_SPEED;
  }

  private hasAnkleBall(): boolean {
    return getDungeonRunState().equipment.includes("ankle_ball");
  }

  private finish(result: MiniGameResult): void {
    this.result = result;
    this.host.setResult(result);
    this.host.setCompleted(true);
    this.phase = result.outcome === "success" ? "success" : result.outcome === "failure" ? "failure" : "neutral";
    this.background?.setTexture(
      result.outcome === "success"
        ? IMAGE_ASSETS.elevatorWin.key
        : result.outcome === "failure"
          ? IMAGE_ASSETS.elevatorLose.key
          : IMAGE_ASSETS.elevatorNeutral.key
    );
    this.cursor?.setVisible(false);
    this.gauge?.setAlpha(0.86);
    this.tapButton?.setVisible(false);
    this.tapHitZone?.disableInteractive();
    this.flashResultZone(result.outcome);

    if (result.outcome === "success") {
      this.host.getStatusText()?.setText("");
      this.flashResultArrow(IMAGE_ASSETS.elevatorArrowDownGreen.key);
    } else if (result.outcome === "failure") {
      this.host.getStatusText()?.setText("");
      this.flashResultArrow(IMAGE_ASSETS.elevatorArrowUpRed.key);
    } else {
      this.host.getStatusText()?.setText("");
    }

    this.host.scene.time.delayedCall(EXIT_UNLOCK_DELAY_MS, () => this.createExitHitZone(result));
    this.host.publishMiniGameReport();
  }

  private flashResultZone(outcome: MiniGameResult["outcome"]): void {
    this.resultHalo?.destroy();
    const zone = this.getResultZoneBounds(outcome);
    const color = outcome === "success" ? 0x46ff77 : outcome === "failure" ? 0xff3d2e : 0xffb336;
    const x = GAUGE.x - GAUGE.width / 2 + RESULT_ZONE_HALO.xInset;
    const width = GAUGE.width - RESULT_ZONE_HALO.xInset * 2;

    this.resultHalo = this.host.scene.add.graphics().setDepth(6);
    this.resultHalo.fillStyle(color, RESULT_ZONE_HALO.fillAlpha);
    this.resultHalo.lineStyle(RESULT_ZONE_HALO.lineWidth, color, RESULT_ZONE_HALO.strokeAlpha);
    this.resultHalo.fillRoundedRect(x, zone.top, width, zone.height, RESULT_ZONE_HALO.radius);
    this.resultHalo.strokeRoundedRect(x, zone.top, width, zone.height, RESULT_ZONE_HALO.radius);

    this.host.scene.tweens.add({
      targets: this.resultHalo,
      alpha: 0.35,
      duration: 170,
      yoyo: true,
      repeat: RESULT_FLASHES,
      ease: "Sine.easeInOut"
    });
  }

  private getResultZoneBounds(outcome: MiniGameResult["outcome"]): { top: number; height: number } {
    const start =
      outcome === "success"
        ? PAINTED_ZONE_RATIOS.top
        : outcome === "neutral"
          ? PAINTED_ZONE_RATIOS.greenEnd
          : PAINTED_ZONE_RATIOS.orangeEnd;
    const end =
      outcome === "success"
        ? PAINTED_ZONE_RATIOS.greenEnd
        : outcome === "neutral"
          ? PAINTED_ZONE_RATIOS.orangeEnd
          : PAINTED_ZONE_RATIOS.bottom;
    const top = this.getGaugeYForImageRatio(start);
    const bottom = this.getGaugeYForImageRatio(end);
    return { top, height: Math.max(24, bottom - top) };
  }

  private flashResultArrow(textureKey: string): void {
    this.resultArrow = this.host.scene.add
      .image(DISPLAY.x, DISPLAY.y, textureKey)
      .setDisplaySize(DISPLAY.width, DISPLAY.height)
      .setDepth(4)
      .setAlpha(0);

    this.host.scene.tweens.add({
      targets: this.resultArrow,
      alpha: 1,
      duration: RESULT_FLASH_INTERVAL_MS,
      yoyo: true,
      repeat: RESULT_FLASHES,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.resultArrow?.destroy();
        this.resultArrow = undefined;
      }
    });
  }

  private createTapButton(): Phaser.GameObjects.Image {
    const button = this.host.scene.add
      .image(TAP_BUTTON.x, TAP_BUTTON.y, IMAGE_ASSETS.tapButton.key)
      .setDisplaySize(TAP_BUTTON.size, TAP_BUTTON.size)
      .setDepth(10)
      .setAlpha(0.96);

    this.host.scene.tweens.add({
      targets: button,
      scaleX: button.scaleX * 1.04,
      scaleY: button.scaleY * 1.04,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    return button;
  }

  private createTapHitZone(): Phaser.GameObjects.Zone {
    const zone = this.host.scene.add
      .zone(TAP_BUTTON.x, TAP_BUTTON.y, TAP_BUTTON.size, TAP_BUTTON.size)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => this.stopCursor());
    return zone;
  }

  private setTapButtonEnabled(enabled: boolean): void {
    this.tapButton?.setAlpha(enabled ? 1 : 0.45);
    if (enabled) {
      this.tapHitZone?.setInteractive({ useHandCursor: true });
    } else {
      this.tapHitZone?.disableInteractive();
    }
  }

  private createExitHitZone(result: MiniGameResult): void {
    this.exitHitZone?.destroy();
    this.exitHitZone = this.host.scene.add
      .zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.exitHitZone.on("pointerdown", () => this.host.finishMiniGame(result));
    this.host.scene.time.delayedCall(EXIT_HINT_MS, () => this.showExitHint());
  }

  private showExitHint(): void {
    if (this.exitHint || !this.exitHitZone) {
      return;
    }

    this.exitHint = this.host.scene.add
      .text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, GAME_TEXTS.miniGames.elevator.exitHint, {
        fontFamily: "Georgia, serif",
        fontSize: "48px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.host.scene.tweens.add({
      targets: this.exitHint,
      alpha: 0.35,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private getCursorY(): number {
    return this.getCursorYForPosition(this.cursorPosition);
  }

  private getCursorYForPosition(position: number): number {
    const top = GAUGE.y - GAUGE.height / 2 + GAUGE.trackTopOffset;
    const bottom = GAUGE.y + GAUGE.height / 2 - GAUGE.trackBottomOffset;
    return Phaser.Math.Linear(top, bottom, Phaser.Math.Clamp(position, 0, 1));
  }

  private getGaugeYForImageRatio(ratio: number): number {
    return GAUGE.y - GAUGE.height / 2 + GAUGE.height * Phaser.Math.Clamp(ratio, 0, 1);
  }
}
