import Phaser from "phaser";
import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  MiniGameController,
  MiniGameHost,
  MiniGameResult
} from "./miniGameTypes";

const DISPLAY = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT
};
const COUNTDOWN_VALUES = [3, 2, 1, 0];
const COUNTDOWN_INTERVAL_MS = 520;
const GAME_DURATION_MS = 5200;
const VISUAL_TICK_MS = 115;
const PLAYER_WIN_THRESHOLD = 100;
const ENEMY_WIN_THRESHOLD = -100;
const EXIT_UNLOCK_DELAY_MS = 2000;
const EXIT_HINT_MS = 4000;
const TAP_BUTTON = {
  x: WORLD_WIDTH / 2,
  y: 904,
  size: 248
};
const ARM_WRESTLING_ASSETS = [
  IMAGE_ASSETS.armWrestlingIdle,
  IMAGE_ASSETS.armWrestlingPlayer1,
  IMAGE_ASSETS.armWrestlingPlayer2,
  IMAGE_ASSETS.armWrestlingPlayerWin,
  IMAGE_ASSETS.armWrestlingEnemy1,
  IMAGE_ASSETS.armWrestlingEnemy2,
  IMAGE_ASSETS.armWrestlingPlayerLose,
  IMAGE_ASSETS.tapButton
];

type ArmWrestlingPhase = "loading" | "countdown" | "running" | "success" | "failure";
type ArmWrestlingDifficulty = "easy" | "medium" | "hard";
type ArmWrestlingDifficultyConfig = {
  tapPower: number;
  enemyPressurePerSecond: number;
  enemyTap: {
    minIntervalMs: number;
    maxIntervalMs: number;
    minPower: number;
    maxPower: number;
    comebackBonus: number;
  };
  finalSuccessGauge: number;
};

const DIFFICULTY_CONFIGS = {
  easy: {
    tapPower: 10,
    enemyPressurePerSecond: 8,
    enemyTap: {
      minIntervalMs: 165,
      maxIntervalMs: 350,
      minPower: 6,
      maxPower: 12,
      comebackBonus: 4
    },
    finalSuccessGauge: 20
  },
  medium: {
    tapPower: 9,
    enemyPressurePerSecond: 9,
    enemyTap: {
      minIntervalMs: 145,
      maxIntervalMs: 320,
      minPower: 7,
      maxPower: 13,
      comebackBonus: 5
    },
    finalSuccessGauge: 26
  },
  hard: {
    tapPower: 8,
    enemyPressurePerSecond: 10,
    enemyTap: {
      minIntervalMs: 130,
      maxIntervalMs: 290,
      minPower: 8,
      maxPower: 14,
      comebackBonus: 6
    },
    finalSuccessGauge: 32
  }
} satisfies Record<ArmWrestlingDifficulty, ArmWrestlingDifficultyConfig>;
const DIFFICULTIES = Object.keys(DIFFICULTY_CONFIGS) as ArmWrestlingDifficulty[];

export class ArmWrestlingMiniGame implements MiniGameController {
  private background?: Phaser.GameObjects.Image;
  private tapButton?: Phaser.GameObjects.Image;
  private tapHitZone?: Phaser.GameObjects.Zone;
  private countdownText?: Phaser.GameObjects.Text;
  private phase: ArmWrestlingPhase = "loading";
  private gauge = 0;
  private taps = 0;
  private enemyTaps = 0;
  private elapsedMs = 0;
  private visualElapsedMs = 0;
  private nextEnemyTapMs = 0;
  private difficulty: ArmWrestlingDifficulty = "medium";
  private currentFrame = IMAGE_ASSETS.armWrestlingIdle.key;
  private assetsReady = false;
  private exitHitZone?: Phaser.GameObjects.Zone;
  private exitHint?: Phaser.GameObjects.Text;
  private exitHintTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    if (!this.assetsReady) {
      if (this.ensureAssetsLoaded()) {
        return;
      }
      this.assetsReady = true;
    }

    this.phase = "countdown";
    this.background = this.host.scene.add
      .image(DISPLAY.x, DISPLAY.y, IMAGE_ASSETS.armWrestlingIdle.key)
      .setDisplaySize(DISPLAY.width, DISPLAY.height)
      .setDepth(3);
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
      gauge: Math.round(this.gauge),
      taps: this.taps,
      enemyTaps: this.enemyTaps,
      nextEnemyTapMs: Math.round(this.nextEnemyTapMs),
      difficulty: this.difficulty,
      elapsedMs: Math.round(this.elapsedMs),
      currentFrame: this.currentFrame
    };
  }

  private ensureAssetsLoaded(): boolean {
    const missingAssets = ARM_WRESTLING_ASSETS.filter((asset) => !this.host.scene.textures.exists(asset.key));

    if (missingAssets.length === 0) {
      return false;
    }

    missingAssets.forEach((asset) => {
      this.host.scene.load.image(asset.key, asset.path);
    });
    this.host.getStatusText()?.setText(GAME_TEXTS.common.loading);
    this.host.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.assetsReady = true;
      this.start();
    });
    this.host.scene.load.start();
    return true;
  }

  private createTapButton(): Phaser.GameObjects.Image {
    const button = this.host.scene.add
      .image(TAP_BUTTON.x, TAP_BUTTON.y, IMAGE_ASSETS.tapButton.key)
      .setDisplaySize(TAP_BUTTON.size, TAP_BUTTON.size)
      .setDepth(8);

    button.on("pointerover", () => {
      if (button.input?.enabled) {
        button.setDisplaySize(TAP_BUTTON.size * 1.015, TAP_BUTTON.size * 1.015);
      }
    });
    button.on("pointerout", () => button.setDisplaySize(TAP_BUTTON.size, TAP_BUTTON.size));
    button.on("pointerdown", () => this.tap());
    return button;
  }

  private createTapHitZone(): Phaser.GameObjects.Zone {
    const hitSize = TAP_BUTTON.size * 1.1;
    const hitZone = this.host.scene.add
      .zone(TAP_BUTTON.x, TAP_BUTTON.y, hitSize, hitSize)
      .setDepth(9);

    hitZone.on("pointerdown", () => this.tap());
    return hitZone;
  }

  private setTapButtonEnabled(enabled: boolean): void {
    if (!this.tapButton || !this.tapHitZone) {
      return;
    }

    this.tapButton.setDisplaySize(TAP_BUTTON.size, TAP_BUTTON.size);
    this.tapButton.setAlpha(enabled ? 1 : 0.45);
    if (enabled) {
      this.tapButton.setInteractive({ useHandCursor: true });
      this.tapHitZone.setInteractive({ useHandCursor: true });
    } else {
      this.tapButton.disableInteractive();
      this.tapHitZone.disableInteractive();
    }
  }

  private startCountdown(): void {
    this.countdownText = this.host.scene.add
      .text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "", {
        fontFamily: "Georgia, serif",
        fontSize: "126px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setDepth(9);

    let index = 0;
    const tick = (): void => {
      const value = COUNTDOWN_VALUES[index];
      this.host.setStep(index);
      this.countdownText?.setText(GAME_TEXTS.miniGames.armWrestling.countdown(value));
      this.host.publishMiniGameReport();
      index += 1;

      if (index < COUNTDOWN_VALUES.length) {
        this.host.scene.time.delayedCall(COUNTDOWN_INTERVAL_MS, tick);
        return;
      }

      this.host.scene.time.delayedCall(COUNTDOWN_INTERVAL_MS, () => this.startFight());
    };

    tick();
  }

  private startFight(): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.phase = "running";
    this.gauge = 0;
    this.taps = 0;
    this.enemyTaps = 0;
    this.elapsedMs = 0;
    this.visualElapsedMs = 0;
    this.difficulty = this.pickDifficulty();
    this.nextEnemyTapMs = this.pickNextEnemyTapDelay();
    this.countdownText?.destroy();
    this.countdownText = undefined;
    this.setTapButtonEnabled(true);
    this.host.setStep(1);
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.setFrame(IMAGE_ASSETS.armWrestlingIdle.key);
    this.host.publishMiniGameReport();
  }

  private update(_time: number, delta: number): void {
    if (this.phase !== "running" || this.host.getCompleted()) {
      return;
    }

    this.elapsedMs += delta;
    this.visualElapsedMs += delta;
    const difficultyConfig = this.getDifficultyConfig();
    this.gauge = Phaser.Math.Clamp(
      this.gauge - (difficultyConfig.enemyPressurePerSecond * delta) / 1000,
      ENEMY_WIN_THRESHOLD,
      PLAYER_WIN_THRESHOLD
    );
    this.nextEnemyTapMs -= delta;

    if (this.nextEnemyTapMs <= 0) {
      this.enemyTap();
    }

    if (this.visualElapsedMs >= VISUAL_TICK_MS) {
      this.visualElapsedMs = 0;
      this.updateEffortFrame();
      this.host.publishMiniGameReport();
    }

    if (this.gauge <= ENEMY_WIN_THRESHOLD || this.elapsedMs >= GAME_DURATION_MS) {
      this.finish(this.gauge >= difficultyConfig.finalSuccessGauge);
    }
  }

  private tap(): void {
    if (this.phase !== "running" || this.host.getCompleted()) {
      return;
    }

    this.taps += 1;
    this.gauge = Phaser.Math.Clamp(this.gauge + this.getDifficultyConfig().tapPower, ENEMY_WIN_THRESHOLD, PLAYER_WIN_THRESHOLD);
    this.host.scene.tweens.add({
      targets: this.tapButton,
      displayWidth: TAP_BUTTON.size * 1.025,
      displayHeight: TAP_BUTTON.size * 1.025,
      duration: 55,
      yoyo: true
    });
    this.updateEffortFrame();
    this.host.publishMiniGameReport();
  }

  private enemyTap(): void {
    this.enemyTaps += 1;
    const enemyTap = this.getDifficultyConfig().enemyTap;
    const comebackPower = this.gauge > 50 ? enemyTap.comebackBonus : 0;
    const power = Phaser.Math.Between(enemyTap.minPower, enemyTap.maxPower) + comebackPower;
    this.gauge = Phaser.Math.Clamp(this.gauge - power, ENEMY_WIN_THRESHOLD, PLAYER_WIN_THRESHOLD);
    this.nextEnemyTapMs = this.pickNextEnemyTapDelay();
    this.updateEffortFrame();
  }

  private pickNextEnemyTapDelay(): number {
    const comebackDelay = this.gauge > 50 ? -55 : 0;
    const enemyTap = this.getDifficultyConfig().enemyTap;
    return Phaser.Math.Between(enemyTap.minIntervalMs, enemyTap.maxIntervalMs) + comebackDelay;
  }

  private pickDifficulty(): ArmWrestlingDifficulty {
    return DIFFICULTIES[Phaser.Math.Between(0, DIFFICULTIES.length - 1)];
  }

  private getDifficultyConfig(): ArmWrestlingDifficultyConfig {
    return DIFFICULTY_CONFIGS[this.difficulty];
  }

  private updateEffortFrame(): void {
    if (this.gauge >= 70) {
      this.setFrame(this.pickSuspenseFrame([IMAGE_ASSETS.armWrestlingPlayer2.key, IMAGE_ASSETS.armWrestlingPlayer1.key]));
      return;
    }
    if (this.gauge >= 38) {
      this.setFrame(
        this.pickSuspenseFrame([
          IMAGE_ASSETS.armWrestlingPlayer1.key,
          IMAGE_ASSETS.armWrestlingPlayer2.key,
          IMAGE_ASSETS.armWrestlingPlayer1.key,
          IMAGE_ASSETS.armWrestlingIdle.key
        ])
      );
      return;
    }
    if (this.gauge >= 18) {
      this.setFrame(this.pickSuspenseFrame([IMAGE_ASSETS.armWrestlingPlayer1.key, IMAGE_ASSETS.armWrestlingIdle.key]));
      return;
    }
    if (this.gauge <= -70) {
      this.setFrame(this.pickSuspenseFrame([IMAGE_ASSETS.armWrestlingEnemy2.key, IMAGE_ASSETS.armWrestlingEnemy1.key]));
      return;
    }
    if (this.gauge <= -38) {
      this.setFrame(
        this.pickSuspenseFrame([
          IMAGE_ASSETS.armWrestlingEnemy1.key,
          IMAGE_ASSETS.armWrestlingEnemy2.key,
          IMAGE_ASSETS.armWrestlingEnemy1.key,
          IMAGE_ASSETS.armWrestlingIdle.key
        ])
      );
      return;
    }
    if (this.gauge <= -18) {
      this.setFrame(this.pickSuspenseFrame([IMAGE_ASSETS.armWrestlingEnemy1.key, IMAGE_ASSETS.armWrestlingIdle.key]));
      return;
    }

    this.setFrame(
      this.pickSuspenseFrame([IMAGE_ASSETS.armWrestlingPlayer1.key, IMAGE_ASSETS.armWrestlingIdle.key, IMAGE_ASSETS.armWrestlingEnemy1.key])
    );
  }

  private pickSuspenseFrame(frames: string[]): string {
    const frameIndex = Math.floor(this.elapsedMs / VISUAL_TICK_MS) % frames.length;
    return frames[frameIndex];
  }

  private setFrame(textureKey: string): void {
    this.currentFrame = textureKey;
    this.background?.setTexture(textureKey);
  }

  private finish(won: boolean): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.phase = won ? "success" : "failure";
    this.host.setCompleted(true);
    this.clearTapButton();
    const result: MiniGameResult = won
      ? { type: "arm_wrestling", outcome: "success", maxLifeDelta: 1 }
      : { type: "arm_wrestling", outcome: "failure", maxLifeLoss: 1 };

    this.setFrame(won ? IMAGE_ASSETS.armWrestlingPlayerWin.key : IMAGE_ASSETS.armWrestlingPlayerLose.key);
    this.host.setResult(result);
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.host.scene.time.delayedCall(EXIT_UNLOCK_DELAY_MS, () => this.createExitHitZone(result));
    this.exitHintTimer = this.host.scene.time.delayedCall(EXIT_HINT_MS, () => this.showExitHint());
    this.host.publishMiniGameReport();
  }

  private createExitHitZone(result: MiniGameResult): void {
    if (this.exitHitZone) {
      return;
    }

    this.exitHitZone = this.host.scene.add
      .zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });
    this.exitHitZone.once("pointerdown", () => {
      this.exitHintTimer?.remove(false);
      this.exitHintTimer = undefined;
      this.exitHint?.destroy();
      this.exitHint = undefined;
      this.host.finishMiniGame(result);
    });
  }

  private showExitHint(): void {
    if (this.exitHint) {
      return;
    }

    this.exitHint = this.host.scene.add
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.miniGames.armWrestling.exitHint, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "30px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private clearTapButton(): void {
    this.tapButton?.destroy();
    this.tapButton = undefined;
    this.tapHitZone?.destroy();
    this.tapHitZone = undefined;
  }
}
