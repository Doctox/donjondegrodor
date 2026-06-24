import Phaser from "phaser";
import { JSON_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { BatonnetsSandboxGameplay, type BatonnetsSandboxSnapshot } from "./batonnetsSandboxGameplay";
import { MiniGameController, MiniGameHost, MiniGameResult } from "./miniGameTypes";
import { WorkshopLayerRuntime, type WorkshopLayerId } from "./workshopLayerRuntime";

const BATONNET_ID_PREFIX = "batonnet_";
const TAKE_LAYER_IDS = {
  1: "button_take_1",
  2: "button_take_2",
  3: "button_take_3"
} as const satisfies Record<1 | 2 | 3, WorkshopLayerId>;
const TOTAL_RANGE = { min: 19, max: 21 };
const ENEMY_TAKE_DELAY_MS = 2000;
const TAKE_HALO_DURATION_MS = 760;
const EXIT_UNLOCK_DELAY_MS = 1200;
const EXIT_HINT_MS = 4000;
const GOLD_RESULT_RANGE = { min: 3, max: 8 };

export class BatonnetsMiniGame implements MiniGameController {
  private readonly gameplay = new BatonnetsSandboxGameplay({
    totalRange: TOTAL_RANGE,
    randomStartingTurn: true
  });
  private runtime?: WorkshopLayerRuntime;
  private enemyTimer?: Phaser.Time.TimerEvent;
  private exitHintTimer?: Phaser.Time.TimerEvent;
  private exitHint?: Phaser.GameObjects.Text;
  private exitHitZone?: Phaser.GameObjects.Zone;
  private readonly takeHalos: Phaser.GameObjects.Rectangle[] = [];
  private assetsReady = false;

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    if (!this.assetsReady) {
      if (this.ensureAssetsLoaded()) {
        return;
      }
      this.assetsReady = true;
    }

    this.host.setStep(0);
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.host.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());

    const terrainSave = this.host.scene.cache.json.get(JSON_ASSETS.batonnetsTerrain.key);
    this.runtime = new WorkshopLayerRuntime(this.host.scene, terrainSave, {
      depthStart: 3,
      fitToLayer: {
        layerId: "background",
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT
      }
    });
    ([1, 2, 3] as const).forEach((count) => {
      this.runtime?.setLayerInteractive(TAKE_LAYER_IDS[count], () => this.playerTake(count));
    });

    this.refresh(this.gameplay.snapshot());
    this.scheduleEnemyTakeIfNeeded();
    this.host.publishMiniGameReport();
  }

  private ensureAssetsLoaded(): boolean {
    const scene = this.host.scene;
    if (scene.cache.json.exists(JSON_ASSETS.batonnetsTerrain.key)) {
      return false;
    }

    this.host.getStatusText()?.setText(GAME_TEXTS.common.loading);
    scene.load.json(JSON_ASSETS.batonnetsTerrain.key, JSON_ASSETS.batonnetsTerrain.path);
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.assetsReady = true;
      this.start();
    });
    scene.load.start();
    return true;
  }

  getReportState(): Record<string, unknown> {
    const snapshot = this.gameplay.snapshot();
    return {
      remaining: snapshot.remaining,
      total: snapshot.total,
      turn: snapshot.turn,
      lastActor: snapshot.lastActor,
      lastTake: snapshot.lastTake,
      outcome: snapshot.outcome
    };
  }

  private playerTake(count: 1 | 2 | 3): void {
    const before = this.gameplay.snapshot();
    const snapshot = this.gameplay.playerTake(count);
    this.refresh(snapshot);
    this.showTakeHalo("player", before.remaining, snapshot.remaining);
    this.resolveOrSchedule(snapshot);
  }

  private resolveOrSchedule(snapshot: BatonnetsSandboxSnapshot): void {
    if (snapshot.outcome) {
      this.finish(snapshot);
      return;
    }
    this.scheduleEnemyTakeIfNeeded(snapshot);
  }

  private scheduleEnemyTakeIfNeeded(snapshot = this.gameplay.snapshot()): void {
    if (snapshot.turn !== "enemy") {
      return;
    }

    this.enemyTimer?.remove(false);
    this.enemyTimer = this.host.scene.time.delayedCall(ENEMY_TAKE_DELAY_MS, () => {
      const before = this.gameplay.snapshot();
      const nextSnapshot = this.gameplay.enemyTake();
      this.refresh(nextSnapshot);
      this.showTakeHalo("enemy", before.remaining, nextSnapshot.remaining);
      this.resolveOrSchedule(nextSnapshot);
    });
  }

  private refresh(snapshot: BatonnetsSandboxSnapshot): void {
    this.runtime?.layerIdsByPrefix(BATONNET_ID_PREFIX).forEach((layerId) => {
      const index = Number(layerId.slice(BATONNET_ID_PREFIX.length));
      this.runtime?.setLayerVisible(layerId, Number.isFinite(index) && index <= snapshot.remaining);
    });

    ([1, 2, 3] as const).forEach((count) => {
      const enabled = snapshot.turn === "player" && !snapshot.outcome && snapshot.remaining >= count;
      this.runtime?.setLayerAlpha(TAKE_LAYER_IDS[count], enabled ? 1 : 0.48);
      this.runtime?.setLayerInteractionEnabled(TAKE_LAYER_IDS[count], enabled);
    });
  }

  private finish(snapshot: BatonnetsSandboxSnapshot): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.host.setCompleted(true);
    this.disableTakeButtons();
    const goldAmount = Phaser.Math.Between(GOLD_RESULT_RANGE.min, GOLD_RESULT_RANGE.max);
    const result: MiniGameResult =
      snapshot.outcome === "player_win"
        ? { type: "batonnets", outcome: "success", goldDelta: goldAmount }
        : { type: "batonnets", outcome: "failure", goldLoss: Math.min(goldAmount, this.host.getCarriedGold()) };
    this.host.setResult(result);
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.host.scene.time.delayedCall(EXIT_UNLOCK_DELAY_MS, () => this.createExitHitZone(result));
    this.exitHintTimer = this.host.scene.time.delayedCall(EXIT_HINT_MS, () => this.showExitHint());
    this.host.publishMiniGameReport();
  }

  private showTakeHalo(actor: "player" | "enemy", beforeRemaining: number, afterRemaining: number): void {
    if (beforeRemaining <= afterRemaining) {
      return;
    }

    this.clearTakeHalos();
    const color = actor === "player" ? 0x39ff7a : 0xff4d4d;
    const firstRemovedIndex = afterRemaining + 1;
    const bounds = Array.from({ length: beforeRemaining - afterRemaining }, (_unused, index) =>
      this.runtime?.getLayerBounds(this.batonnetLayerId(firstRemovedIndex + index))
    ).filter((bound): bound is Phaser.Geom.Rectangle => Boolean(bound));
    if (bounds.length <= 0) {
      return;
    }

    const minX = Math.min(...bounds.map((bound) => bound.left));
    const minY = Math.min(...bounds.map((bound) => bound.top));
    const maxX = Math.max(...bounds.map((bound) => bound.right));
    const maxY = Math.max(...bounds.map((bound) => bound.bottom));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const baseWidth = maxX - minX + 44;
    const baseHeight = maxY - minY + 44;
    const haloLayers = [
      { grow: 42, alpha: 0.12 },
      { grow: 28, alpha: 0.18 },
      { grow: 14, alpha: 0.27 },
      { grow: 0, alpha: 0.34 }
    ];

    this.takeHalos.push(
      ...haloLayers.map(({ grow, alpha }) =>
        this.host.scene.add
          .rectangle(centerX, centerY, baseWidth + grow, baseHeight + grow, color, alpha)
          .setStrokeStyle(grow === 0 ? 3 : 0, color, grow === 0 ? 0.58 : 0)
          .setDepth(96)
      )
    );
    this.host.scene.tweens.add({
      targets: this.takeHalos,
      alpha: { from: 0.46, to: 0.22 },
      scaleX: { from: 1.02, to: 1.06 },
      scaleY: { from: 1.02, to: 1.06 },
      yoyo: true,
      repeat: 1,
      duration: 210
    });
    this.host.scene.time.delayedCall(TAKE_HALO_DURATION_MS, () => this.clearTakeHalos());
  }

  private disableTakeButtons(): void {
    ([1, 2, 3] as const).forEach((count) => {
      this.runtime?.setLayerAlpha(TAKE_LAYER_IDS[count], 0.48);
      this.runtime?.setLayerInteractionEnabled(TAKE_LAYER_IDS[count], false);
    });
  }

  private createExitHitZone(result: MiniGameResult): void {
    if (this.exitHitZone) {
      return;
    }

    this.exitHitZone = this.host.scene.add
      .zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(99)
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
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.miniGames.batonnets.exitHint, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "30px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(98);
  }

  private clearTakeHalos(): void {
    this.takeHalos.splice(0).forEach((halo) => halo.destroy());
  }

  private batonnetLayerId(index: number): WorkshopLayerId {
    return `${BATONNET_ID_PREFIX}${String(index).padStart(2, "0")}`;
  }

  private destroy(): void {
    this.enemyTimer?.remove(false);
    this.exitHintTimer?.remove(false);
    this.clearTakeHalos();
    this.exitHitZone?.destroy();
    this.exitHint?.destroy();
    this.runtime?.destroy();
  }
}
