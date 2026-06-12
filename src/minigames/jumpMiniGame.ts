import Phaser from "phaser";
import { ANIMATION_KEYS, AssetDefinition, IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  MiniGameController,
  MiniGameHost,
  MiniGameResult
} from "./miniGameTypes";
import { playSfx } from "../systems/sfxManager";
import { isJumpHitboxDebugEnabled } from "./jumpDebugConfig";
import { applyHeartLossWithCowardReflex, getDungeonRunState } from "../systems/dungeonRunState";
import { showFloatingEffectSequence } from "../ui/floatingEffectText";
import {
  createGeneratedJumpSegment,
  GeneratedJumpSegment,
  GeneratedJumpSprite,
  JUMP_GENERATED_ASSETS
} from "./jumpSegmentGenerator";

const RUN_SPEED = 660;
const ANKLE_BALL_RUN_SPEED_MULTIPLIER = 0.88;
const GRAVITY = 1720;
const JUMP_VELOCITY = 610;
const LANDING_SNAP = 8;
const FLOOR_EDGE_MARGIN = 0;
const HAZARD_EDGE_MARGIN = 28;
const HAZARD_TRIGGER_DEPTH_RATIO = 0.68;
const WATER_SLIDE_SPEED = 820;
const TIMED_SPIKE_INTERVAL_MS = 760;
const TIMED_SPIKE_REVEAL_DISTANCE = 400;
const FALL_LIMIT_Y = WORLD_HEIGHT + 120;
const SUCCESS_GOLD = 10;
const GRODOR_SCALE = 1.1;
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

type JumpSegmentAsset = {
  image: AssetDefinition;
  map?: AssetDefinition;
  spikeCover?: AssetDefinition;
  generated?: GeneratedJumpSegment;
};

const GENERATED_SEGMENT_MIN = 1;
const GENERATED_SEGMENT_MAX = 4;

export class JumpMiniGame implements MiniGameController {
  private background?: Phaser.GameObjects.Image;
  private spikeCover?: Phaser.GameObjects.Image;
  private generatedSprites: Phaser.GameObjects.Image[] = [];
  private generatedTimedSpikeSprites: Phaser.GameObjects.Image[] = [];
  private generatedTimedSpikeCoverSprites: Phaser.GameObjects.Image[] = [];
  private grodor?: Phaser.GameObjects.Sprite;
  private jumpButton?: Phaser.GameObjects.Image;
  private countdownText?: Phaser.GameObjects.Text;
  private lifePanel?: Phaser.GameObjects.Image;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private floors: RectRegion[] = [];
  private markers: PointMarker[] = [];
  private deathZones: RectRegion[] = [];
  private timedSpikeZones: RectRegion[] = [];
  private waterZones: RectRegion[] = [];
  private leftSafeFloor?: RectRegion;
  private finalSafeFloor?: RectRegion;
  private spawnStart?: PointMarker;
  private segmentEnd?: PointMarker;
  private currentSegmentIndex = 0;
  private runSegments: JumpSegmentAsset[] = [];
  private phase: JumpPhase = "countdown";
  private jumpPose: JumpPose = "run";
  private position = { x: 0, y: 0 };
  private verticalVelocity = 0;
  private isGrounded = true;
  private isWaterSliding = false;
  private timedSpikeElapsedMs = 0;
  private timedSpikesActive = false;
  private jumpUsed = false;
  private jumpCleared = false;
  private startingLife = 1;
  private attemptsLost = 0;
  private assetsReady = false;
  private exitHitZone?: Phaser.GameObjects.Zone;
  private exitHint?: Phaser.GameObjects.Text;
  private exitHintTimer?: Phaser.Time.TimerEvent;
  private debugGraphics?: Phaser.GameObjects.Graphics;

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
    this.runSegments = this.createRunSegments();
    this.currentSegmentIndex = 0;
    this.ensureGrodorAnimations();
    this.background = this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, this.getCurrentSegment().image.key)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(3);
    this.createLifeDisplay();

    this.loadCurrentSegment();

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
    const segmentImages = [...JUMP_GENERATED_ASSETS];
    const missingImages = segmentImages.filter((asset) => !this.host.scene.textures.exists(asset.key));
    const missingGrodorAssets = JUMP_GRODOR_ASSETS.filter((asset) => !this.host.scene.textures.exists(asset.key));
    const missingUiAssets = JUMP_UI_ASSETS.filter((asset) => !this.host.scene.textures.exists(asset.key));

    if (missingImages.length === 0 && missingGrodorAssets.length === 0 && missingUiAssets.length === 0) {
      return false;
    }

    missingImages.forEach((asset) => {
      this.host.scene.load.image(asset.key, asset.path);
    });
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
      segmentIndex: this.currentSegmentIndex,
      segmentCount: this.runSegments.length,
      generated: Boolean(this.getCurrentSegment().generated),
      jumpUsed: this.jumpUsed,
      startingLife: this.startingLife,
      attemptsLost: this.attemptsLost,
      chancesLeft: this.getChancesLeft(),
      isGrounded: this.isGrounded,
      isWaterSliding: this.isWaterSliding,
      ankleBallActive: this.hasAnkleBall(),
      runSpeed: Math.round(this.getRunSpeed()),
      timedSpikesActive: this.timedSpikesActive,
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
    if (this.host.getCompleted() || !this.grodor) {
      return;
    }

    this.updateTimedSpikes(delta);

    if (this.phase !== "running" && this.phase !== "finishing") {
      return;
    }

    const deltaSeconds = Math.min(delta, 40) / 1000;
    this.position.x += (this.isWaterSliding ? WATER_SLIDE_SPEED : this.getRunSpeed()) * deltaSeconds;

    if (!this.isGrounded) {
      this.verticalVelocity += GRAVITY * deltaSeconds;
      this.position.y += this.verticalVelocity * deltaSeconds;
    }

    const wasGrounded = this.isGrounded;
    const landingFloor = this.findLandingFloor(this.position.x, this.position.y);
    const waterZone = this.findWaterZone(this.position.x, this.position.y);
    if (waterZone) {
      this.startWaterSlide(waterZone);
    } else if (this.isWaterSliding) {
      this.isGrounded = true;
      this.verticalVelocity = 0;
      this.setJumpButtonEnabled(false);
      this.playRun();
    } else if (landingFloor && this.verticalVelocity >= 0) {
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
    this.refreshDebugOverlay();

    if (this.phase === "finishing" && this.hasReachedSegmentEnd()) {
      this.completeSegment();
      return;
    }

    if (this.hasEnteredDeathZone() || this.position.y >= FALL_LIMIT_Y || this.position.x > WORLD_WIDTH + 120) {
      this.fail();
    }
  }

  private jump(): void {
    if (this.host.getCompleted() || this.phase !== "running" || !this.isGrounded || this.jumpUsed || this.isWaterSliding) {
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

  private getRunSpeed(): number {
    return this.hasAnkleBall() ? RUN_SPEED * ANKLE_BALL_RUN_SPEED_MULTIPLIER : RUN_SPEED;
  }

  private hasAnkleBall(): boolean {
    return getDungeonRunState().equipment.includes("ankle_ball");
  }

  private succeed(): void {
    const result: MiniGameResult = {
      type: "jump",
      outcome: "success",
      goldDelta: SUCCESS_GOLD
    };
    this.finish(result, "success");
  }

  private fail(): void {
    if (this.host.getCompleted() || this.phase !== "running") {
      return;
    }

    this.attemptsLost += 1;
    const previousLife = getDungeonRunState().life;
    const lossResult = applyHeartLossWithCowardReflex(1, "dungeon_event");
    const currentLife = lossResult.state.life;
    const netLifeLoss = previousLife - currentLife;
    if (netLifeLoss > 0) {
      this.playHeartLossEffect(Math.max(0, Math.min(this.startingLife - 1, previousLife - 1)));
    } else if (lossResult.finalLoss > 0) {
      playSfx("grodorHurt");
    }
    if (lossResult.brokenItems.length > 0) {
      playSfx("itemBreak");
    }
    this.showJumpEffectMessages(lossResult.effectMessages);
    this.updateLifeDisplay();
    if (currentLife > 0) {
      this.retry();
      return;
    }

    const result: MiniGameResult = {
      type: "jump",
      outcome: "failure",
      instantDeath: true
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

    this.placeGrodorAtSegmentStart();
    this.startCountdown();
    this.host.publishMiniGameReport();
  }

  private startNextSegmentRun(): void {
    if (this.host.getCompleted() || !this.grodor) {
      return;
    }

    this.placeGrodorAtSegmentStart();
    this.countdownText?.destroy();
    this.countdownText = undefined;
    this.phase = "running";
    this.playRun();
    this.setJumpButtonEnabled(true);
    this.host.publishMiniGameReport();
  }

  private placeGrodorAtSegmentStart(): void {
    if (!this.grodor) {
      return;
    }

    const start = this.pickStartPosition();
    this.position = start;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isWaterSliding = false;
    this.timedSpikeElapsedMs = 0;
    this.timedSpikesActive = false;
    this.jumpUsed = false;
    this.jumpCleared = false;
    this.grodor.setPosition(start.x, start.y);
    this.grodor.setFlipX(false);
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
  }

  private startLandingSequence(landingFloor: RectRegion): void {
    this.phase = "landing";
    this.jumpCleared = landingFloor === this.finalSafeFloor;
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

  private completeSegment(): void {
    if (this.currentSegmentIndex >= this.runSegments.length - 1) {
      this.succeed();
      return;
    }

    this.currentSegmentIndex += 1;
    this.loadCurrentSegment();
    this.startNextSegmentRun();
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
    return Math.max(0, Math.min(this.startingLife, getDungeonRunState().life));
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

  private showJumpEffectMessages(messages: string[]): void {
    if (messages.length <= 0) {
      return;
    }

    showFloatingEffectSequence(this.host.scene, messages, () => ({
      x: this.grodor?.x ?? this.position.x,
      y: (this.grodor?.y ?? this.position.y) - 188
    }), {
      depth: 30,
      tone: "item",
      fontSize: 36,
      wrapWidth: 620,
      startDelayMs: 420,
      staggerMs: 1500
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
      x: startFloor.x + FLOOR_EDGE_MARGIN + 8,
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

  private loadCurrentSegment(): void {
    const segment = this.getCurrentSegment();
    this.background?.setTexture(segment.image.key);
    this.spikeCover?.setVisible(Boolean(segment.spikeCover));
    this.clearGeneratedSprites();

    if (segment.generated) {
      this.loadGeneratedSegment(segment.generated);
      return;
    }

    if (!segment.map) {
      return;
    }

    const map = this.host.scene.make.tilemap({ key: segment.map.key });
    const hazards = this.readRectLayer(map, "hazards");
    this.markers = this.readPointLayer(map, "markers");
    this.floors = this.readRectLayer(map, "collision");
    this.waterZones = hazards.filter((region) => region.name.includes("water"));
    this.timedSpikeZones = segment.spikeCover
      ? hazards.filter((region) => region.name.includes("death_zone_spike_01"))
      : [];
    this.deathZones = hazards.filter(
      (region) =>
        region.name.includes("death_zone") &&
        !this.waterZones.includes(region) &&
        !this.timedSpikeZones.includes(region)
    );
    this.leftSafeFloor = this.getLeftSafeFloor();
    this.finalSafeFloor = this.getRightSafeFloor();
    this.spawnStart = this.getMarker("spawn_grodor");
    this.segmentEnd = this.getMarker("segment_end");
    this.isWaterSliding = false;
    this.timedSpikeElapsedMs = 0;
    this.timedSpikesActive = false;
    this.updateSpikeCoverVisibility();
    this.refreshDebugOverlay();
  }

  private loadGeneratedSegment(segment: GeneratedJumpSegment): void {
    this.markers = segment.markers.map((marker) => ({ ...marker }));
    this.floors = segment.floors.map((floor) => ({ ...floor }));
    const hazards = segment.hazards.map((hazard) => ({ ...hazard }));
    this.waterZones = hazards.filter((region) => region.name.includes("water"));
    this.timedSpikeZones = hazards.filter((region) => region.name.includes("death_zone_spike_01"));
    this.deathZones = hazards.filter(
      (region) =>
        region.name.includes("death_zone") &&
        !this.waterZones.includes(region) &&
        !this.timedSpikeZones.includes(region)
    );
    this.createGeneratedSprites(segment.sprites);
    this.leftSafeFloor = this.getLeftSafeFloor();
    this.finalSafeFloor = this.getRightSafeFloor();
    this.spawnStart = this.getMarker("spawn_grodor");
    this.segmentEnd = this.getMarker("segment_end");
    this.isWaterSliding = false;
    this.timedSpikeElapsedMs = 0;
    this.timedSpikesActive = false;
    this.updateSpikeCoverVisibility();
    this.refreshDebugOverlay();
  }

  private createGeneratedSprites(sprites: GeneratedJumpSprite[]): void {
    sprites.forEach((spriteConfig) => {
      const sprite = this.host.scene.add
        .image(spriteConfig.x, spriteConfig.y, spriteConfig.asset.key)
        .setOrigin(0, spriteConfig.originY ?? 1)
        .setDisplaySize(spriteConfig.width, spriteConfig.height)
        .setDepth(5);

      this.generatedSprites.push(sprite);
      if (spriteConfig.kind === "timed_spike") {
        this.generatedTimedSpikeSprites.push(sprite);
      } else if (spriteConfig.kind === "timed_spike_cover") {
        this.generatedTimedSpikeCoverSprites.push(sprite);
      }
    });
  }

  private clearGeneratedSprites(): void {
    this.generatedSprites.forEach((sprite) => sprite.destroy());
    this.generatedSprites = [];
    this.generatedTimedSpikeSprites = [];
    this.generatedTimedSpikeCoverSprites = [];
  }

  private getCurrentSegment(): JumpSegmentAsset {
    const segment = this.runSegments[this.currentSegmentIndex] ?? this.runSegments[0];
    if (segment) {
      return segment;
    }

    const generated = createGeneratedJumpSegment();
    return { image: generated.image, generated };
  }

  private createRunSegments(): JumpSegmentAsset[] {
    const segmentCount = Phaser.Math.Between(GENERATED_SEGMENT_MIN, GENERATED_SEGMENT_MAX);
    return Array.from({ length: segmentCount }, () => {
      const generated = createGeneratedJumpSegment();
      return { image: generated.image, generated };
    });
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
    return x >= floor.x + FLOOR_EDGE_MARGIN && x <= floor.x + floor.width - FLOOR_EDGE_MARGIN;
  }

  private hasEnteredDeathZone(): boolean {
    const activeDeathZones = this.timedSpikesActive ? [...this.deathZones, ...this.timedSpikeZones] : this.deathZones;
    if (activeDeathZones.length === 0) {
      return false;
    }

    return activeDeathZones.some(
      (deathZone) =>
        this.position.x >= deathZone.x + HAZARD_EDGE_MARGIN &&
        this.position.x <= deathZone.x + deathZone.width - HAZARD_EDGE_MARGIN &&
        this.position.y >= deathZone.y + deathZone.height * HAZARD_TRIGGER_DEPTH_RATIO &&
        this.position.y <= deathZone.y + deathZone.height + 8
    );
  }

  private findWaterZone(x: number, y: number): RectRegion | undefined {
    return this.waterZones.find(
      (waterZone) =>
        x >= waterZone.x &&
        x <= waterZone.x + waterZone.width &&
        y >= waterZone.y - 12 &&
        y <= waterZone.y + waterZone.height + 18
    );
  }

  private startWaterSlide(waterZone: RectRegion): void {
    this.isWaterSliding = true;
    this.isGrounded = true;
    this.verticalVelocity = 0;
    this.position.y = Math.min(this.position.y, waterZone.y + waterZone.height - 12);
    this.setJumpButtonEnabled(false);
    this.playRun();
  }

  private updateTimedSpikes(delta: number): void {
    if (this.timedSpikeZones.length === 0) {
      this.timedSpikesActive = false;
      this.updateSpikeCoverVisibility();
      return;
    }

    const nextTimedSpike = this.timedSpikeZones.find((zone) => this.position.x <= zone.x + zone.width);
    if (nextTimedSpike && this.position.x < nextTimedSpike.x - TIMED_SPIKE_REVEAL_DISTANCE) {
      this.timedSpikeElapsedMs = 0;
      this.timedSpikesActive = false;
      this.updateSpikeCoverVisibility();
      return;
    }

    this.timedSpikeElapsedMs += delta;
    const nextActive = Math.floor(this.timedSpikeElapsedMs / TIMED_SPIKE_INTERVAL_MS) % 2 === 1;
    if (nextActive !== this.timedSpikesActive) {
      this.timedSpikesActive = nextActive;
      this.updateSpikeCoverVisibility();
    }
  }

  private updateSpikeCoverVisibility(): void {
    if (this.spikeCover) {
      this.spikeCover.setVisible(this.timedSpikeZones.length > 0 && !this.timedSpikesActive && Boolean(this.getCurrentSegment().spikeCover));
    }

    this.generatedTimedSpikeSprites.forEach((sprite) => sprite.setVisible(this.timedSpikeZones.length > 0 && this.timedSpikesActive));
    this.generatedTimedSpikeCoverSprites.forEach((sprite) => sprite.setVisible(this.timedSpikeZones.length > 0 && !this.timedSpikesActive));
  }

  private isBeyondGap(): boolean {
    if (this.deathZones.length === 0) {
      return false;
    }

    const lastDeathZone = [...this.deathZones].sort((first, second) => second.x - first.x)[0];
    return this.position.x >= lastDeathZone.x + lastDeathZone.width + 40;
  }

  private hasReachedSegmentEnd(): boolean {
    return this.position.x >= (this.segmentEnd?.x ?? WORLD_WIDTH - 80);
  }

  private refreshDebugOverlay(): void {
    if (!isJumpHitboxDebugEnabled()) {
      this.debugGraphics?.clear();
      return;
    }

    const graphics = this.getDebugGraphics();
    graphics.clear();

    this.floors.forEach((floor) => {
      graphics.fillStyle(0x47a7ff, 0.18);
      graphics.lineStyle(3, 0x47a7ff, 0.95);
      graphics.fillRect(floor.x, floor.y, floor.width, floor.height);
      graphics.strokeRect(floor.x, floor.y, floor.width, floor.height);
    });

    this.waterZones.forEach((waterZone) => {
      graphics.fillStyle(0x28d7ff, 0.22);
      graphics.lineStyle(3, 0x28d7ff, 0.95);
      graphics.fillRect(waterZone.x, waterZone.y, waterZone.width, waterZone.height);
      graphics.strokeRect(waterZone.x, waterZone.y, waterZone.width, waterZone.height);
    });

    this.deathZones.forEach((deathZone) => {
      const triggerY = deathZone.y + deathZone.height * HAZARD_TRIGGER_DEPTH_RATIO;
      const triggerHeight = Math.max(0, deathZone.y + deathZone.height - triggerY);
      graphics.fillStyle(0xff2b2b, 0.18);
      graphics.lineStyle(3, 0xff2b2b, 0.95);
      graphics.fillRect(deathZone.x, deathZone.y, deathZone.width, deathZone.height);
      graphics.strokeRect(deathZone.x, deathZone.y, deathZone.width, deathZone.height);

      graphics.fillStyle(0xff00ff, 0.22);
      graphics.lineStyle(2, 0xff00ff, 0.95);
      graphics.fillRect(deathZone.x + HAZARD_EDGE_MARGIN, triggerY, Math.max(0, deathZone.width - HAZARD_EDGE_MARGIN * 2), triggerHeight);
      graphics.strokeRect(deathZone.x + HAZARD_EDGE_MARGIN, triggerY, Math.max(0, deathZone.width - HAZARD_EDGE_MARGIN * 2), triggerHeight);
    });

    this.timedSpikeZones.forEach((deathZone) => {
      const triggerY = deathZone.y + deathZone.height * HAZARD_TRIGGER_DEPTH_RATIO;
      const triggerHeight = Math.max(0, deathZone.y + deathZone.height - triggerY);
      graphics.fillStyle(this.timedSpikesActive ? 0xff2b2b : 0x777777, this.timedSpikesActive ? 0.2 : 0.12);
      graphics.lineStyle(3, this.timedSpikesActive ? 0xff2b2b : 0xaaaaaa, 0.95);
      graphics.fillRect(deathZone.x, deathZone.y, deathZone.width, deathZone.height);
      graphics.strokeRect(deathZone.x, deathZone.y, deathZone.width, deathZone.height);

      if (this.timedSpikesActive) {
        graphics.fillStyle(0xff00ff, 0.22);
        graphics.lineStyle(2, 0xff00ff, 0.95);
        graphics.fillRect(deathZone.x + HAZARD_EDGE_MARGIN, triggerY, Math.max(0, deathZone.width - HAZARD_EDGE_MARGIN * 2), triggerHeight);
        graphics.strokeRect(deathZone.x + HAZARD_EDGE_MARGIN, triggerY, Math.max(0, deathZone.width - HAZARD_EDGE_MARGIN * 2), triggerHeight);
      }
    });

    this.markers.forEach((marker) => {
      graphics.fillStyle(0xffe36e, 0.9);
      graphics.lineStyle(2, 0x120d0a, 0.9);
      graphics.fillCircle(marker.x, marker.y, 9);
      graphics.strokeCircle(marker.x, marker.y, 13);
    });

    graphics.fillStyle(0xffffff, 0.98);
    graphics.lineStyle(2, 0x000000, 0.95);
    graphics.fillCircle(this.position.x, this.position.y, 7);
    graphics.strokeCircle(this.position.x, this.position.y, 11);
  }

  private getDebugGraphics(): Phaser.GameObjects.Graphics {
    if (!this.debugGraphics) {
      this.debugGraphics = this.host.scene.add.graphics().setDepth(23);
    }

    return this.debugGraphics;
  }
}
