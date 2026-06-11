import Phaser from "phaser";
import { ANIMATION_KEYS, IMAGE_ASSETS, JSON_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  MiniGameController,
  MiniGameHost,
  MiniGameResult
} from "./miniGameTypes";
import { playSfx } from "../systems/sfxManager";

const RUN_SPEED = 600;
const GRAVITY = 1720;
const JUMP_VELOCITY = 645;
const LANDING_SNAP = 8;
const FLOOR_MARGIN = 28;
const FALL_LIMIT_Y = WORLD_HEIGHT + 120;
const SUCCESS_GOLD = 10;
const GRODOR_SCALE = 0.74;
const GRODOR_RUN_FRAME_RATE = 9;
const JUMP_AIR_DELAY_MS = 120;
const JUMP_RESUME_DELAY_MS = 190;
const JUMP_BUTTON_Y = 930;
const JUMP_BUTTON_SIZE = 230;
const COUNTDOWN_VALUES = [3, 2, 1, 0];
const COUNTDOWN_INTERVAL_MS = 650;
const RETRY_DELAY_MS = 720;
const EXIT_HINT_MS = 4000;
const VICTORY_X_OFFSET = -44;
const HEART_PANEL = {
  x: 300,
  y: 96,
  minWidth: 276,
  frameAspect: 356 / 147,
  paddingX: 34,
  heartSize: 42,
  heartGap: 54
};
const JUMP_UI_ASSETS = [
  IMAGE_ASSETS.dungeonHudHeartFrame,
  IMAGE_ASSETS.heartFull,
  IMAGE_ASSETS.heartEmpty,
  IMAGE_ASSETS.heartBrake,
  IMAGE_ASSETS.jumpButton
];
const JUMP_GRODOR_ASSETS = [
  IMAGE_ASSETS.grodorRun1,
  IMAGE_ASSETS.grodorRun2,
  IMAGE_ASSETS.grodorRun3,
  IMAGE_ASSETS.grodorJump2,
  IMAGE_ASSETS.grodorJump3,
  IMAGE_ASSETS.grodorJump5,
  IMAGE_ASSETS.grodorIdle,
  IMAGE_ASSETS.grodorDeath1,
  IMAGE_ASSETS.grodorDeath2,
  IMAGE_ASSETS.grodorVictory
];

type JumpPhase = "countdown" | "running" | "landing" | "finishing" | "retrying" | "success" | "failure";
type JumpPose = "run" | "takeoff" | "air" | "landing" | "death" | "victory";

type RectRegion = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PointMarker = {
  name: string;
  x: number;
  y: number;
};

export class JumpMiniGame implements MiniGameController {
  private background?: Phaser.GameObjects.Image;
  private grodor?: Phaser.GameObjects.Sprite;
  private jumpButton?: Phaser.GameObjects.Image;
  private countdownText?: Phaser.GameObjects.Text;
  private lifePanel?: Phaser.GameObjects.Image;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private floors: RectRegion[] = [];
  private markers: PointMarker[] = [];
  private deathZone?: RectRegion;
  private leftSafeFloor?: RectRegion;
  private rightSafeFloor?: RectRegion;
  private spawnStart?: PointMarker;
  private segmentEnd?: PointMarker;
  private phase: JumpPhase = "countdown";
  private jumpPose: JumpPose = "run";
  private position = { x: 0, y: 0 };
  private verticalVelocity = 0;
  private isGrounded = true;
  private jumpUsed = false;
  private jumpCleared = false;
  private startingLife = 1;
  private attemptsLost = 0;
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

    this.startingLife = Math.max(1, this.host.getLife());
    this.attemptsLost = 0;
    this.ensureGrodorAnimations();
    this.background = this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, IMAGE_ASSETS.jumpRunnerScene.key)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(3);
    this.createLifeDisplay();

    const map = this.host.scene.make.tilemap({ key: JSON_ASSETS.jumpRunnerSegment.key });
    this.markers = this.readPointLayer(map, "markers");
    this.floors = this.readRectLayer(map, "collision");
    this.deathZone = this.readRectLayer(map, "hazards").find((region) => region.name.includes("death_zone"));
    this.leftSafeFloor = this.getLeftSafeFloor();
    this.rightSafeFloor = this.getRightSafeFloor();
    this.spawnStart = this.getMarker("spawn_grodor");
    this.segmentEnd = this.getMarker("segment_end");

    const start = this.pickStartPosition();
    this.position = start;
    this.grodor = this.host.scene.add
      .sprite(start.x, start.y, IMAGE_ASSETS.grodorRun1.key)
      .setOrigin(0.5, 1)
      .setScale(GRODOR_SCALE)
      .setDepth(12);
    this.grodor.setFlipX(false);
    this.playIdle();

    this.jumpButton = this.createJumpButton();

    this.host.setStep(0);
    this.startCountdown();
    this.host.getRarityText()?.setText("");
    this.host.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.host.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.host.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    });
    this.host.publishMiniGameReport();
  }

  private ensureAssetsLoaded(): boolean {
    const missingImage = !this.host.scene.textures.exists(IMAGE_ASSETS.jumpRunnerScene.key);
    const missingMap = !this.host.scene.cache.tilemap.exists(JSON_ASSETS.jumpRunnerSegment.key);
    const missingGrodorAssets = JUMP_GRODOR_ASSETS.filter((asset) => !this.host.scene.textures.exists(asset.key));
    const missingUiAssets = JUMP_UI_ASSETS.filter((asset) => !this.host.scene.textures.exists(asset.key));

    if (!missingImage && !missingMap && missingGrodorAssets.length === 0 && missingUiAssets.length === 0) {
      return false;
    }

    if (missingImage) {
      this.host.scene.load.image(IMAGE_ASSETS.jumpRunnerScene.key, IMAGE_ASSETS.jumpRunnerScene.path);
    }
    if (missingMap) {
      this.host.scene.load.tilemapTiledJSON(JSON_ASSETS.jumpRunnerSegment.key, JSON_ASSETS.jumpRunnerSegment.path);
    }
    missingGrodorAssets.forEach((asset) => {
      this.host.scene.load.image(asset.key, asset.path);
    });
    missingUiAssets.forEach((asset) => {
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

  getReportState(): Record<string, unknown> {
    return {
      phase: this.phase,
      jumpUsed: this.jumpUsed,
      startingLife: this.startingLife,
      attemptsLost: this.attemptsLost,
      chancesLeft: this.getChancesLeft(),
      isGrounded: this.isGrounded,
      jumpPose: this.jumpPose,
      spawnGrodor: this.spawnStart ? { x: Math.round(this.spawnStart.x), y: Math.round(this.spawnStart.y) } : undefined,
      segmentEnd: this.segmentEnd ? { x: Math.round(this.segmentEnd.x), y: Math.round(this.segmentEnd.y) } : undefined,
      grodor: {
        x: Math.round(this.position.x),
        y: Math.round(this.position.y)
      },
      verticalVelocity: Math.round(this.verticalVelocity)
    };
  }

  private createJumpButton(): Phaser.GameObjects.Image {
    const button = this.host.scene.add
      .image(WORLD_WIDTH / 2, JUMP_BUTTON_Y, IMAGE_ASSETS.jumpButton.key)
      .setDisplaySize(JUMP_BUTTON_SIZE, JUMP_BUTTON_SIZE)
      .setDepth(8);

    button.on("pointerover", () => {
      if (button.input?.enabled) {
        button.setDisplaySize(JUMP_BUTTON_SIZE * 1.06, JUMP_BUTTON_SIZE * 1.06);
      }
    });
    button.on("pointerout", () => button.setDisplaySize(JUMP_BUTTON_SIZE, JUMP_BUTTON_SIZE));
    button.on("pointerdown", () => this.jump());
    button.setAlpha(0.48);
    button.disableInteractive();
    return button;
  }

  private setJumpButtonEnabled(enabled: boolean): void {
    if (!this.jumpButton) {
      return;
    }

    this.jumpButton.setDisplaySize(JUMP_BUTTON_SIZE, JUMP_BUTTON_SIZE);
    this.jumpButton.setAlpha(enabled ? 1 : 0.48);
    if (enabled) {
      this.jumpButton.setInteractive({ useHandCursor: true });
    } else {
      this.jumpButton.disableInteractive();
    }
  }

  private startCountdown(): void {
    this.phase = "countdown";
    this.setJumpButtonEnabled(false);
    this.playIdle();
    this.host.getStatusText()?.setText("");

    this.countdownText?.destroy();
    this.countdownText = this.host.scene.add
      .text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, GAME_TEXTS.miniGames.jump.countdown(COUNTDOWN_VALUES[0]), {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "150px",
        color: "#ffe0a0",
        stroke: "#2c1308",
        strokeThickness: 12,
        shadow: { offsetX: 0, offsetY: 6, color: "#000000", blur: 16, fill: true }
      })
      .setOrigin(0.5)
      .setDepth(24);

    this.playCountdownStep(0);
  }

  private playCountdownStep(index: number): void {
    if (this.host.getCompleted() || this.phase !== "countdown") {
      return;
    }

    const value = COUNTDOWN_VALUES[index];
    this.countdownText?.setText(GAME_TEXTS.miniGames.jump.countdown(value));
    this.countdownText?.setScale(0.72);
    this.host.scene.tweens.add({
      targets: this.countdownText,
      scale: 1,
      alpha: 1,
      duration: 190,
      ease: "Back.Out"
    });

    if (index < COUNTDOWN_VALUES.length - 1) {
      this.host.scene.time.delayedCall(COUNTDOWN_INTERVAL_MS, () => this.playCountdownStep(index + 1));
      return;
    }

    this.host.scene.time.delayedCall(COUNTDOWN_INTERVAL_MS, () => this.finishCountdown());
  }

  private finishCountdown(): void {
    if (this.host.getCompleted() || this.phase !== "countdown") {
      return;
    }

    this.countdownText?.destroy();
    this.countdownText = undefined;
    this.phase = "running";
    this.setJumpButtonEnabled(true);
    this.playRun();
    this.host.getStatusText()?.setText("");
    this.host.publishMiniGameReport();
  }

  private update(_: number, delta: number): void {
    if (this.host.getCompleted() || (this.phase !== "running" && this.phase !== "finishing") || !this.grodor) {
      return;
    }

    const deltaSeconds = Math.min(delta, 40) / 1000;
    this.position.x += RUN_SPEED * deltaSeconds;

    if (!this.isGrounded) {
      this.verticalVelocity += GRAVITY * deltaSeconds;
      this.position.y += this.verticalVelocity * deltaSeconds;
    }

    const wasGrounded = this.isGrounded;
    const landingFloor = this.findLandingFloor(this.position.x, this.position.y);
    if (landingFloor && this.verticalVelocity >= 0) {
      this.position.y = landingFloor.y;
      this.verticalVelocity = 0;
      this.isGrounded = true;
      if (!wasGrounded && this.jumpUsed && this.jumpPose !== "landing") {
        this.startLandingSequence(landingFloor);
        return;
      }
      this.playRun();
    } else if (!this.isSupportedByFloor(this.position.x)) {
      this.isGrounded = false;
    }

    this.grodor.setPosition(this.position.x, this.position.y);

    if (this.phase === "finishing" && this.hasReachedSegmentEnd()) {
      this.succeed();
      return;
    }

    if (this.hasEnteredDeathZone() || this.position.y >= FALL_LIMIT_Y || this.position.x > WORLD_WIDTH + 120) {
      this.fail();
    }
  }

  private jump(): void {
    if (this.host.getCompleted() || this.phase !== "running" || !this.isGrounded || this.jumpUsed) {
      return;
    }

    this.isGrounded = false;
    this.jumpUsed = true;
    this.verticalVelocity = -JUMP_VELOCITY;
    this.setJumpButtonEnabled(false);
    this.playJumpTakeoff();
    this.host.scene.time.delayedCall(JUMP_AIR_DELAY_MS, () => this.playJumpAir());
    this.host.setStep(1);
    this.host.getStatusText()?.setText("");
    this.host.publishMiniGameReport();
  }

  private succeed(): void {
    const result: MiniGameResult = {
      type: "jump",
      outcome: "success",
      goldDelta: SUCCESS_GOLD,
      lifeDelta: this.attemptsLost > 0 ? -this.attemptsLost : undefined
    };
    this.finish(result, "success");
  }

  private fail(): void {
    if (this.host.getCompleted() || this.phase !== "running") {
      return;
    }

    this.attemptsLost += 1;
    this.playHeartLossEffect(Math.min(this.startingLife - 1, this.attemptsLost - 1));
    this.updateLifeDisplay();
    if (this.getChancesLeft() > 0) {
      this.retry();
      return;
    }

    const result: MiniGameResult = {
      type: "jump",
      outcome: "failure",
      lifeDelta: -this.attemptsLost
    };
    this.finish(result, "failure");
  }

  private retry(): void {
    this.phase = "retrying";
    this.host.setStep(this.attemptsLost);
    this.setJumpButtonEnabled(false);
    this.playDeath();
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.host.publishMiniGameReport();

    this.host.scene.time.delayedCall(RETRY_DELAY_MS, () => this.resetAttempt());
  }

  private resetAttempt(): void {
    if (this.host.getCompleted() || !this.grodor) {
      return;
    }

    const start = this.pickStartPosition();
    this.position = start;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.jumpUsed = false;
    this.jumpCleared = false;
    this.grodor.setPosition(start.x, start.y);
    this.grodor.setFlipX(false);
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.startCountdown();
    this.host.publishMiniGameReport();
  }

  private startLandingSequence(landingFloor: RectRegion): void {
    this.phase = "landing";
    this.jumpCleared = landingFloor === this.rightSafeFloor;
    this.grodor?.setPosition(this.position.x, this.position.y);
    this.playJumpLanding();
    this.host.publishMiniGameReport();

    this.host.scene.time.delayedCall(JUMP_RESUME_DELAY_MS, () => {
      if (this.host.getCompleted() || this.phase !== "landing") {
        return;
      }
      this.phase = this.jumpCleared ? "finishing" : "running";
      this.jumpUsed = false;
      this.playRun();
      this.setJumpButtonEnabled(!this.jumpCleared);
      this.host.publishMiniGameReport();
    });
  }

  private finish(result: MiniGameResult, phase: JumpPhase): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.phase = phase;
    this.host.setCompleted(true);
    this.host.setResult(result);
    this.host.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.countdownText?.destroy();
    this.countdownText = undefined;
    this.jumpButton?.destroy();
    this.jumpButton = undefined;

    if (phase === "success") {
      this.playVictory();
    } else {
      this.playDeath();
    }

    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.createExitHitZone(result);
    this.exitHintTimer = this.host.scene.time.delayedCall(EXIT_HINT_MS, () => this.showExitHint());
    this.host.publishMiniGameReport();
  }

  private getChancesLeft(): number {
    return Math.max(0, this.startingLife - this.attemptsLost);
  }

  private createExitHitZone(result: MiniGameResult): void {
    if (this.exitHitZone) {
      return;
    }

    this.exitHitZone = this.host.scene.add
      .zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(30)
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
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.miniGames.jump.exitHint, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "30px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(29);
  }

  private createLifeDisplay(): void {
    const width = Math.max(HEART_PANEL.minWidth, HEART_PANEL.paddingX * 2 + this.startingLife * HEART_PANEL.heartGap);
    const height = width / HEART_PANEL.frameAspect;
    this.lifePanel = this.host.scene.add
      .image(HEART_PANEL.x, HEART_PANEL.y, IMAGE_ASSETS.dungeonHudHeartFrame.key)
      .setDisplaySize(width, height)
      .setDepth(6);

    const firstHeartX = HEART_PANEL.x - ((this.startingLife - 1) * HEART_PANEL.heartGap) / 2;
    this.heartIcons = Array.from({ length: this.startingLife }, (_, index) =>
      this.host.scene.add
        .image(firstHeartX + index * HEART_PANEL.heartGap, HEART_PANEL.y, IMAGE_ASSETS.heartFull.key)
        .setDisplaySize(HEART_PANEL.heartSize, HEART_PANEL.heartSize)
        .setDepth(8)
    );
    this.updateLifeDisplay();
  }

  private playHeartLossEffect(heartIndex: number): void {
    const sourceHeart = this.heartIcons[heartIndex];
    if (!sourceHeart) {
      return;
    }

    playSfx("grodorHurt");
    const start = { x: sourceHeart.x, y: sourceHeart.y };
    const end = {
      x: this.grodor?.x ?? this.position.x,
      y: (this.grodor?.y ?? this.position.y) - 118
    };
    const mid = {
      x: (start.x + end.x) / 2,
      y: Math.min(start.y, end.y) - 96
    };
    const heart = this.host.scene.add
      .image(start.x, start.y, IMAGE_ASSETS.heartBrake.key)
      .setDisplaySize(58, 54)
      .setDepth(26)
      .setAlpha(0);
    const heartScaleX = heart.scaleX;
    const heartScaleY = heart.scaleY;
    heart.setScale(heartScaleX * 0.78, heartScaleY * 0.78);
    const progress = { value: 0 };

    this.host.scene.tweens.add({
      targets: heart,
      alpha: 1,
      scaleX: heartScaleX,
      scaleY: heartScaleY,
      duration: 120,
      ease: "Back.easeOut"
    });
    this.host.scene.tweens.add({
      targets: progress,
      value: 1,
      duration: 1400,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const t = progress.value;
        const inv = 1 - t;
        heart.setPosition(
          inv * inv * start.x + 2 * inv * t * mid.x + t * t * end.x,
          inv * inv * start.y + 2 * inv * t * mid.y + t * t * end.y
        );
        heart.setAngle(-34 * Math.sin(t * Math.PI * 2));
        if (t > 0.8) {
          heart.setAlpha(Math.max(0, (1 - t) / 0.2));
        }
      },
      onComplete: () => heart.destroy()
    });
  }

  private updateLifeDisplay(): void {
    const chancesLeft = this.getChancesLeft();
    this.heartIcons.forEach((heart, index) => {
      heart.setTexture(index < chancesLeft ? IMAGE_ASSETS.heartFull.key : IMAGE_ASSETS.heartEmpty.key);
    });
  }

  private ensureGrodorAnimations(): void {
    this.createOrReplaceAnimation({
      key: ANIMATION_KEYS.grodorRun,
      frames: [{ key: IMAGE_ASSETS.grodorRun1.key }, { key: IMAGE_ASSETS.grodorRun2.key }, { key: IMAGE_ASSETS.grodorRun3.key }],
      frameRate: GRODOR_RUN_FRAME_RATE,
      repeat: -1
    });
    this.createAnimationIfMissing({
      key: ANIMATION_KEYS.grodorIdle,
      frames: [{ key: IMAGE_ASSETS.grodorIdle.key }],
      frameRate: 1,
      repeat: -1
    });
    this.createAnimationIfMissing({
      key: ANIMATION_KEYS.grodorDeath,
      frames: [{ key: IMAGE_ASSETS.grodorDeath1.key }, { key: IMAGE_ASSETS.grodorDeath2.key }],
      frameRate: 3,
      repeat: 0
    });
    this.createAnimationIfMissing({
      key: ANIMATION_KEYS.grodorVictory,
      frames: [{ key: IMAGE_ASSETS.grodorVictory.key }],
      frameRate: 1,
      repeat: -1
    });
  }

  private createAnimationIfMissing(config: Phaser.Types.Animations.Animation & { key: string }): void {
    if (!this.host.scene.anims.exists(config.key)) {
      this.host.scene.anims.create(config);
    }
  }

  private createOrReplaceAnimation(config: Phaser.Types.Animations.Animation & { key: string }): void {
    if (this.host.scene.anims.exists(config.key)) {
      this.host.scene.anims.remove(config.key);
    }
    this.host.scene.anims.create(config);
  }

  private playRun(): void {
    this.jumpPose = "run";
    this.grodor?.play(ANIMATION_KEYS.grodorRun, true);
  }

  private playIdle(): void {
    this.grodor?.play(ANIMATION_KEYS.grodorIdle);
  }

  private playJumpTakeoff(): void {
    this.jumpPose = "takeoff";
    this.grodor?.stop();
    this.grodor?.setTexture(IMAGE_ASSETS.grodorJump2.key);
  }

  private playJumpAir(): void {
    if (this.phase !== "running" || this.isGrounded || this.jumpPose !== "takeoff") {
      return;
    }
    this.jumpPose = "air";
    this.grodor?.setTexture(IMAGE_ASSETS.grodorJump3.key);
  }

  private playJumpLanding(): void {
    this.jumpPose = "landing";
    this.grodor?.stop();
    this.grodor?.setTexture(IMAGE_ASSETS.grodorJump5.key);
  }

  private playDeath(): void {
    this.jumpPose = "death";
    this.grodor?.play(ANIMATION_KEYS.grodorDeath);
  }

  private playVictory(): void {
    this.jumpPose = "victory";
    if (this.grodor) {
      this.grodor.setX(this.grodor.x + VICTORY_X_OFFSET);
    }
    this.grodor?.play(ANIMATION_KEYS.grodorVictory);
  }

  private readRectLayer(map: Phaser.Tilemaps.Tilemap, layerName: string): RectRegion[] {
    const layer = map.objects.find((entry) => entry.name === layerName);
    return (layer?.objects ?? [])
      .filter(
        (
          entry
        ): entry is Phaser.Types.Tilemaps.TiledObject & { x: number; y: number; width: number; height: number } =>
          typeof entry.x === "number" &&
          typeof entry.y === "number" &&
          typeof entry.width === "number" &&
          typeof entry.height === "number"
      )
      .map((entry) => ({
        name: entry.name ?? "",
        x: entry.x,
        y: entry.y,
        width: entry.width,
        height: entry.height
      }))
      .sort((first, second) => first.x - second.x);
  }

  private readPointLayer(map: Phaser.Tilemaps.Tilemap, layerName: string): PointMarker[] {
    const layer = map.objects.find((entry) => entry.name === layerName);
    return (layer?.objects ?? [])
      .filter(
        (
          entry
        ): entry is Phaser.Types.Tilemaps.TiledObject & { x: number; y: number } =>
          Boolean(entry.point) && typeof entry.x === "number" && typeof entry.y === "number"
      )
      .map((entry) => ({
        name: entry.name ?? "",
        x: entry.x,
        y: entry.y
      }))
      .sort((first, second) => first.x - second.x);
  }

  private pickStartPosition(): { x: number; y: number } {
    if (this.spawnStart) {
      return {
        x: this.spawnStart.x,
        y: this.spawnStart.y
      };
    }

    const startFloor = this.leftSafeFloor ?? this.floors[0];
    if (!startFloor) {
      return {
        x: 120,
        y: 765
      };
    }

    return {
      x: startFloor.x + FLOOR_MARGIN + 8,
      y: startFloor.y
    };
  }

  private getLeftSafeFloor(): RectRegion | undefined {
    if (this.floors.length === 0) {
      return undefined;
    }

    return [...this.floors].sort((first, second) => first.x - second.x)[0];
  }

  private getRightSafeFloor(): RectRegion | undefined {
    if (this.floors.length === 0) {
      return undefined;
    }

    return [...this.floors].sort((first, second) => second.x - first.x)[0];
  }

  private getMarker(name: string): PointMarker | undefined {
    return this.markers.find((marker) => marker.name === name);
  }

  private findLandingFloor(x: number, y: number): RectRegion | undefined {
    return this.floors.find(
      (floor) =>
        this.isWithinFloorX(x, floor) &&
        y >= floor.y - LANDING_SNAP &&
        y <= floor.y + LANDING_SNAP
    );
  }

  private isSupportedByFloor(x: number): boolean {
    return this.floors.some((floor) => this.isWithinFloorX(x, floor));
  }

  private isWithinFloorX(x: number, floor: RectRegion): boolean {
    return x >= floor.x + FLOOR_MARGIN && x <= floor.x + floor.width - FLOOR_MARGIN;
  }

  private hasEnteredDeathZone(): boolean {
    if (!this.deathZone) {
      return false;
    }

    return (
      this.position.x >= this.deathZone.x + FLOOR_MARGIN &&
      this.position.x <= this.deathZone.x + this.deathZone.width - FLOOR_MARGIN &&
      this.position.y >= this.deathZone.y - 8
    );
  }

  private isBeyondGap(): boolean {
    if (!this.deathZone) {
      return false;
    }

    return this.position.x >= this.deathZone.x + this.deathZone.width + 40;
  }

  private hasReachedSegmentEnd(): boolean {
    return this.position.x >= (this.segmentEnd?.x ?? WORLD_WIDTH - 80);
  }
}
