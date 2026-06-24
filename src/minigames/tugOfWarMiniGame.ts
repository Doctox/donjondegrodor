import Phaser from "phaser";
import { IMAGE_ASSETS, JSON_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { MiniGameController, MiniGameHost, MiniGameResult } from "./miniGameTypes";
import { TugOfWarSandboxGameplay, type TugOfWarSandboxFeedback, type TugOfWarSandboxSnapshot } from "./tugOfWarSandboxGameplay";
import {
  TugOfWarTerrainRuntime,
  areTugOfWarTerrainTexturesReady,
  preloadTugOfWarTerrainRuntimeAssets
} from "./tugOfWarTerrainRuntime";

type TugOfWarPhase = "loading" | "countdown" | "running" | "success" | "failure";

type TimingNote = {
  marker: Phaser.GameObjects.Arc;
  halo: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
};

type TimingGhostNote = TimingNote & {
  targetTimeMs: number;
  hit: boolean;
};

const COUNTDOWN_VALUES = [3, 2, 1, 0];
const COUNTDOWN_INTERVAL_MS = 520;
const EXIT_UNLOCK_DELAY_MS = 1200;
const EXIT_HINT_MS = 4000;
const GOLD_RESULT_RANGE = { min: 3, max: 8 };
const STAGE_X = WORLD_WIDTH / 2;
const STAGE_WIDTH = 1660;
const TIMING_VISUAL_SCALE = 1.18;
const TIMING_TARGET_SCALE = 1.06;
const TIMING_TARGET_X = STAGE_X;
const TIMING_TARGET_Y = 232;
const TIMING_START_X = STAGE_X - STAGE_WIDTH / 2;
const TIMING_END_X = STAGE_X + 720;
const TIMING_SPACING = 220;
const TIMING_NOTE_LEAD_MS = 2500;
const TIMING_NOTE_FADE_MS = 1300;
const TIMING_NOTE_GROW_DISTANCE = 260;
const TIMING_NOTE_SHRINK_SCALE = 0.28;
const TIMING_TARGET_RADIUS = 66 * TIMING_TARGET_SCALE;
const TIMING_NOTE_RADIUS = 28 * TIMING_VISUAL_SCALE;
const TIMING_HALO_RADIUS = 42 * TIMING_VISUAL_SCALE;
const TIMING_VALID_CENTER_RADIUS = TIMING_TARGET_RADIUS - TIMING_NOTE_RADIUS;
const TIMING_HIT_EARLY_MS = Math.floor(TIMING_VALID_CENTER_RADIUS / ((TIMING_TARGET_X - TIMING_START_X) / TIMING_NOTE_LEAD_MS));
const TIMING_HIT_LATE_MS = Math.floor(TIMING_VALID_CENTER_RADIUS / ((TIMING_END_X - TIMING_TARGET_X) / TIMING_NOTE_FADE_MS));
const TIMING_ORANGE = 0xffa43a;
const TIMING_GREEN = 0x8cff8c;
const TIMING_RED = 0xff5f4d;
const TAP_BUTTON = {
  x: STAGE_X,
  y: 835,
  size: 248
};

export class TugOfWarMiniGame implements MiniGameController {
  private readonly gameplay = new TugOfWarSandboxGameplay({
    firstBeatDelayMs: TIMING_NOTE_LEAD_MS,
    hitWindowEarlyMs: TIMING_HIT_EARLY_MS,
    hitWindowLateMs: TIMING_HIT_LATE_MS
  });
  private phase: TugOfWarPhase = "loading";
  private assetsReady = false;
  private terrain?: TugOfWarTerrainRuntime;
  private countdownText?: Phaser.GameObjects.Text;
  private targetHalo?: Phaser.GameObjects.Arc;
  private targetOuter?: Phaser.GameObjects.Arc;
  private targetInner?: Phaser.GameObjects.Arc;
  private targetFeedbackUntilMs = 0;
  private targetFeedbackColor = TIMING_ORANGE;
  private tapButton?: Phaser.GameObjects.Image;
  private tapHitZone?: Phaser.GameObjects.Zone;
  private exitHitZone?: Phaser.GameObjects.Zone;
  private exitHint?: Phaser.GameObjects.Text;
  private exitHintTimer?: Phaser.Time.TimerEvent;
  private readonly beatNotes: TimingNote[] = [];
  private readonly ghostNotes: TimingGhostNote[] = [];
  private lastVisibleBeatMs = 0;
  private lastVisibleBeatHit = false;
  private lastFeedback: TugOfWarSandboxFeedback = "ready";

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    if (!this.assetsReady) {
      if (this.ensureAssetsLoaded()) {
        return;
      }
      this.assetsReady = true;
    }

    this.phase = "countdown";
    this.host.setStep(0);
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.terrain = new TugOfWarTerrainRuntime(this.host.scene, 3);
    this.createTimingUi();
    this.createTapButton();
    this.setTapButtonEnabled(false);
    this.host.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.host.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.startCountdown();
    this.host.publishMiniGameReport();
  }

  getReportState(): Record<string, unknown> {
    const snapshot = this.gameplay.snapshot();
    return {
      phase: this.phase,
      tension: Math.round(snapshot.tension),
      normalizedTension: Number(snapshot.normalizedTension.toFixed(2)),
      feedback: snapshot.feedback,
      streak: snapshot.streak,
      nextBeatMs: Math.round(snapshot.nextBeatMs),
      elapsedMs: Math.round(snapshot.elapsedMs)
    };
  }

  private ensureAssetsLoaded(): boolean {
    const scene = this.host.scene;
    const ready =
      scene.textures.exists(IMAGE_ASSETS.tugOfWarBackground.key) &&
      areTugOfWarTerrainTexturesReady(scene) &&
      scene.textures.exists(IMAGE_ASSETS.tapButton.key) &&
      scene.textures.exists("tug-of-war-boss-dos") &&
      scene.textures.exists("tug-of-war-grodor-underwear") &&
      scene.cache.json.exists(JSON_ASSETS.tugOfWarTerrain.key) &&
      scene.cache.json.exists(JSON_ASSETS.tugOfWarGrodor.key) &&
      scene.cache.json.exists(JSON_ASSETS.tugOfWarBoss.key);

    if (ready) {
      return false;
    }

    preloadTugOfWarTerrainRuntimeAssets(scene);
    scene.load.image(IMAGE_ASSETS.tapButton.key, IMAGE_ASSETS.tapButton.path);
    this.host.getStatusText()?.setText(GAME_TEXTS.common.loading);
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.assetsReady = true;
      this.start();
    });
    scene.load.start();
    return true;
  }

  private createTimingUi(): void {
    this.targetHalo = this.host.scene.add
      .circle(TIMING_TARGET_X, TIMING_TARGET_Y, TIMING_TARGET_RADIUS + 8 * TIMING_VISUAL_SCALE, TIMING_ORANGE, 0)
      .setStrokeStyle(8 * TIMING_VISUAL_SCALE, TIMING_ORANGE, 0)
      .setDepth(89);
    this.targetOuter = this.host.scene.add
      .circle(TIMING_TARGET_X, TIMING_TARGET_Y, TIMING_TARGET_RADIUS, TIMING_ORANGE, 0.22)
      .setStrokeStyle(7 * TIMING_VISUAL_SCALE, TIMING_ORANGE, 0.95)
      .setDepth(90);
    this.targetInner = this.host.scene.add.circle(TIMING_TARGET_X, TIMING_TARGET_Y, 29 * TIMING_VISUAL_SCALE, TIMING_ORANGE, 0.22).setDepth(90);
    for (let index = 0; index < 7; index += 1) {
      this.beatNotes.push(this.createTimingNote(TIMING_START_X - index * TIMING_SPACING, TIMING_TARGET_Y, 91));
    }
    this.countdownText = this.host.scene.add
      .text(TIMING_TARGET_X, TIMING_TARGET_Y + 6, "", {
        fontFamily: "Georgia, serif",
        fontSize: "72px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 9
      })
      .setOrigin(0.5)
      .setDepth(94);
  }

  private createTimingNote(x: number, y: number, depth: number): TimingNote {
    const halo = this.host.scene.add
      .circle(x, y, TIMING_HALO_RADIUS, TIMING_GREEN, 0)
      .setStrokeStyle(7 * TIMING_VISUAL_SCALE, TIMING_GREEN, 0)
      .setDepth(depth - 1);
    const marker = this.host.scene.add
      .circle(x, y, TIMING_NOTE_RADIUS, 0xffd36a, 1)
      .setStrokeStyle(4 * TIMING_VISUAL_SCALE, 0x1b120d, 1)
      .setDepth(depth);
    const label = this.host.scene.add
      .text(marker.x, marker.y, "Tap", {
        fontFamily: "Georgia, serif",
        fontSize: `${Math.round(18 * TIMING_VISUAL_SCALE)}px`,
        color: "#1b120d",
        stroke: "#fff1c2",
        strokeThickness: 3 * TIMING_VISUAL_SCALE
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);
    return { marker, halo, label };
  }

  private createTapButton(): void {
    this.tapButton = this.host.scene.add
      .image(TAP_BUTTON.x, TAP_BUTTON.y, IMAGE_ASSETS.tapButton.key)
      .setDisplaySize(TAP_BUTTON.size, TAP_BUTTON.size)
      .setDepth(92);
    this.tapHitZone = this.host.scene.add
      .zone(TAP_BUTTON.x, TAP_BUTTON.y, TAP_BUTTON.size * 1.1, TAP_BUTTON.size * 1.1)
      .setDepth(93);
    this.tapHitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.tap();
    });
  }

  private setTapButtonEnabled(enabled: boolean): void {
    if (!this.tapButton || !this.tapHitZone) {
      return;
    }
    this.tapButton.setDisplaySize(TAP_BUTTON.size, TAP_BUTTON.size).setAlpha(enabled ? 1 : 0.45);
    if (enabled) {
      this.tapButton.setInteractive({ useHandCursor: true });
      this.tapHitZone.setInteractive({ useHandCursor: true });
    } else {
      this.tapButton.disableInteractive();
      this.tapHitZone.disableInteractive();
    }
  }

  private startCountdown(): void {
    let index = 0;
    const tick = (): void => {
      const value = COUNTDOWN_VALUES[index];
      this.host.setStep(index);
      this.countdownText?.setText(GAME_TEXTS.miniGames.tugOfWar.countdown(value));
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
    this.gameplay.reset();
    this.lastVisibleBeatMs = 0;
    this.lastVisibleBeatHit = false;
    this.lastFeedback = "ready";
    this.countdownText?.destroy();
    this.countdownText = undefined;
    this.setTapButtonEnabled(true);
    this.host.setStep(1);
    this.host.publishMiniGameReport();
  }

  private update(time: number, delta: number): void {
    const timeSeconds = time / 1000;
    if (this.phase === "running" && !this.host.getCompleted()) {
      const snapshot = this.gameplay.update(delta);
      this.refreshGameplay(snapshot);
      if (snapshot.phase === "won") {
        this.finish(true);
      } else if (snapshot.phase === "lost") {
        this.finish(false);
      }
      return;
    }
    this.terrain?.update(timeSeconds, this.gameplay.snapshot());
  }

  private tap(): void {
    if (this.phase !== "running" || this.host.getCompleted()) {
      return;
    }
    this.pulseTapButton();
    const snapshot = this.gameplay.pull();
    if (snapshot.feedback === "miss") {
      this.flashTapMiss();
    }
    this.refreshGameplay(snapshot);
    if (snapshot.phase === "won") {
      this.finish(true);
    } else if (snapshot.phase === "lost") {
      this.finish(false);
    }
  }

  private refreshGameplay(snapshot: TugOfWarSandboxSnapshot): void {
    this.updateFeedbackTriggers(snapshot);
    this.refreshTargetFeedback();
    this.spawnResolvedGhostIfNeeded(snapshot);
    this.refreshGhostNotes(snapshot.elapsedMs);
    this.refreshBeatNotes(snapshot);
    this.terrain?.update(this.host.scene.time.now / 1000, snapshot);
    this.lastVisibleBeatMs = snapshot.nextBeatMs;
    this.lastVisibleBeatHit = snapshot.currentBeatHit;
    this.host.publishMiniGameReport();
  }

  private updateFeedbackTriggers(snapshot: TugOfWarSandboxSnapshot): void {
    if (snapshot.feedback === this.lastFeedback) {
      return;
    }
    if (snapshot.feedback === "hit") {
      this.flashTarget(TIMING_GREEN);
      this.terrain?.registerHitFeedback();
    } else if (snapshot.feedback === "miss" || snapshot.feedback === "wait") {
      this.flashTarget(TIMING_RED);
      this.terrain?.registerBossPullFeedback();
    }
    this.lastFeedback = snapshot.feedback;
  }

  private refreshBeatNotes(snapshot: TugOfWarSandboxSnapshot): void {
    const noteTravel = TIMING_TARGET_X - TIMING_START_X;
    let beatTimeMs = snapshot.nextBeatMs;
    this.beatNotes.forEach((note, index) => {
      if (index > 0) {
        beatTimeMs += snapshot.upcomingBeatIntervalsMs[index - 1] ?? snapshot.currentBeatIntervalMs;
      }
      const timeUntilTargetMs = beatTimeMs - snapshot.elapsedMs;
      const passedTargetMs = Math.max(0, -timeUntilTargetMs);
      const x =
        timeUntilTargetMs >= 0
          ? TIMING_TARGET_X - (timeUntilTargetMs / TIMING_NOTE_LEAD_MS) * noteTravel
          : TIMING_TARGET_X + (passedTargetMs / TIMING_NOTE_FADE_MS) * (TIMING_END_X - TIMING_TARGET_X);
      const fadeRatio = Phaser.Math.Clamp(1 - passedTargetMs / TIMING_NOTE_FADE_MS, 0, 1);
      const enterRatio = Phaser.Math.Clamp((x - TIMING_START_X) / TIMING_NOTE_GROW_DISTANCE, 0, 1);
      const visible = x >= TIMING_START_X && x < TIMING_END_X + 30 && fadeRatio > 0;
      const alpha = Math.max(0.26, 1 - index * 0.1) * fadeRatio * enterRatio;
      const baseScale = Math.max(0.58, 1 - index * 0.055);
      const scale = baseScale * Phaser.Math.Linear(0.32, 1, enterRatio) * Phaser.Math.Linear(TIMING_NOTE_SHRINK_SCALE, 1, fadeRatio);
      const hitActiveNote = index === 0 && snapshot.currentBeatHit;
      note.halo
        .setPosition(x, TIMING_TARGET_Y)
        .setFillStyle(TIMING_GREEN, visible && hitActiveNote ? 0.62 : 0)
        .setStrokeStyle(7 * TIMING_VISUAL_SCALE, TIMING_GREEN, visible && hitActiveNote ? 0.82 : 0)
        .setScale(hitActiveNote ? 1 + Math.sin(this.host.scene.time.now * 0.018) * 0.08 : 1);
      note.marker
        .setPosition(x, TIMING_TARGET_Y)
        .setFillStyle(hitActiveNote ? TIMING_GREEN : 0xffd36a, 1)
        .setAlpha(visible ? alpha : 0)
        .setScale(scale);
      note.label
        .setPosition(x, TIMING_TARGET_Y)
        .setAlpha(visible ? alpha : 0)
        .setScale(scale);
    });
  }

  private spawnResolvedGhostIfNeeded(snapshot: TugOfWarSandboxSnapshot): void {
    if (this.lastVisibleBeatMs <= 0 || snapshot.nextBeatMs === this.lastVisibleBeatMs) {
      return;
    }
    const note = this.createTimingNote(TIMING_TARGET_X, TIMING_TARGET_Y, 91);
    this.ghostNotes.push({
      targetTimeMs: this.lastVisibleBeatMs,
      hit: this.lastVisibleBeatHit,
      ...note
    });
    if (!this.lastVisibleBeatHit) {
      this.flashTarget(TIMING_RED);
      this.terrain?.registerBossPullFeedback();
    }
  }

  private refreshGhostNotes(elapsedMs: number): void {
    for (let index = this.ghostNotes.length - 1; index >= 0; index -= 1) {
      const note = this.ghostNotes[index];
      const passedTargetMs = elapsedMs - note.targetTimeMs;
      const fadeRatio = Phaser.Math.Clamp(1 - passedTargetMs / TIMING_NOTE_FADE_MS, 0, 1);
      const x = TIMING_TARGET_X + (Math.max(0, passedTargetMs) / TIMING_NOTE_FADE_MS) * (TIMING_END_X - TIMING_TARGET_X);
      const color = note.hit ? TIMING_GREEN : TIMING_RED;
      const scale = Phaser.Math.Linear(TIMING_NOTE_SHRINK_SCALE, 1, fadeRatio);
      note.halo
        .setPosition(x, TIMING_TARGET_Y)
        .setFillStyle(color, 0.46 * fadeRatio)
        .setStrokeStyle(7 * TIMING_VISUAL_SCALE, color, 0.68 * fadeRatio)
        .setScale(scale);
      note.marker.setPosition(x, TIMING_TARGET_Y).setFillStyle(color, 1).setAlpha(fadeRatio).setScale(scale);
      note.label.setPosition(x, TIMING_TARGET_Y).setAlpha(fadeRatio).setScale(scale);
      if (fadeRatio <= 0 || x >= TIMING_END_X) {
        note.halo.destroy();
        note.marker.destroy();
        note.label.destroy();
        this.ghostNotes.splice(index, 1);
      }
    }
  }

  private flashTarget(color: number): void {
    this.targetFeedbackColor = color;
    this.targetFeedbackUntilMs = this.host.scene.time.now + 360;
    this.refreshTargetFeedback();
  }

  private refreshTargetFeedback(): void {
    const active = this.host.scene.time.now < this.targetFeedbackUntilMs;
    const color = active ? this.targetFeedbackColor : TIMING_ORANGE;
    this.targetOuter?.setFillStyle(color, active ? 0.32 : 0.22).setStrokeStyle(7 * TIMING_VISUAL_SCALE, color, 0.95);
    this.targetInner?.setFillStyle(color, active ? 0.42 : 0.22);
    this.targetHalo
      ?.setFillStyle(color, active ? 0.3 : 0)
      .setStrokeStyle(8 * TIMING_VISUAL_SCALE, color, active ? 0.55 : 0)
      .setScale(active ? 1 + Math.sin(this.host.scene.time.now * 0.02) * 0.07 : 1);
  }

  private pulseTapButton(): void {
    if (!this.tapButton) {
      return;
    }
    this.tapButton.setDisplaySize(TAP_BUTTON.size * 0.94, TAP_BUTTON.size * 0.94);
    this.host.scene.tweens.add({
      targets: this.tapButton,
      displayWidth: TAP_BUTTON.size,
      displayHeight: TAP_BUTTON.size,
      duration: 90,
      ease: "Back.Out"
    });
  }

  private flashTapMiss(): void {
    if (!this.tapButton) {
      return;
    }
    const originalX = this.tapButton.x;
    this.tapButton.setTint(0xff5f4d);
    this.host.scene.tweens.add({
      targets: this.tapButton,
      x: { from: originalX - 9, to: originalX + 9 },
      yoyo: true,
      repeat: 2,
      duration: 34,
      onComplete: () => {
        this.tapButton?.clearTint();
        this.tapButton?.setX(originalX);
      }
    });
  }

  private finish(won: boolean): void {
    if (this.host.getCompleted()) {
      return;
    }
    this.phase = won ? "success" : "failure";
    this.host.setCompleted(true);
    this.setTapButtonEnabled(false);
    this.tapButton?.setVisible(false);
    this.tapHitZone?.disableInteractive();
    const goldAmount = Phaser.Math.Between(GOLD_RESULT_RANGE.min, GOLD_RESULT_RANGE.max);
    const goldLoss = Math.min(goldAmount, this.host.getCarriedGold());
    const result: MiniGameResult = won
      ? {
          type: "tug_of_war",
          outcome: "success",
          goldDelta: goldAmount
        }
      : {
          type: "tug_of_war",
          outcome: "failure",
          ...(goldLoss > 0 ? { goldLoss } : {})
        };
    this.host.setResult(result);
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
      .setDepth(100)
      .setInteractive({ useHandCursor: true });
    this.exitHitZone.once("pointerdown", () => {
      this.exitHintTimer?.remove(false);
      this.host.finishMiniGame(result);
    });
  }

  private showExitHint(): void {
    if (this.exitHint) {
      return;
    }
    this.exitHint = this.host.scene.add
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.miniGames.tugOfWar.exitHint, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "30px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(99);
  }

  private destroy(): void {
    this.host.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.terrain?.destroy();
    this.beatNotes.forEach((note) => {
      note.halo.destroy();
      note.marker.destroy();
      note.label.destroy();
    });
    this.ghostNotes.forEach((note) => {
      note.halo.destroy();
      note.marker.destroy();
      note.label.destroy();
    });
    this.targetHalo?.destroy();
    this.targetOuter?.destroy();
    this.targetInner?.destroy();
    this.countdownText?.destroy();
    this.tapButton?.destroy();
    this.tapHitZone?.destroy();
    this.exitHitZone?.destroy();
    this.exitHint?.destroy();
  }
}
