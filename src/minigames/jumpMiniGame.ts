import Phaser from "phaser";
import { GrodorActor } from "../actors/GrodorActor";
import { IMAGE_ASSETS, JSON_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  MiniGameController,
  MiniGameHost,
  MiniGameResult
} from "./miniGameTypes";

const RUN_SPEED = 420;
const GRAVITY = 1720;
const JUMP_VELOCITY = 980;
const LANDING_SNAP = 18;
const FLOOR_MARGIN = 28;
const FALL_LIMIT_Y = WORLD_HEIGHT + 120;
const SUCCESS_GOLD = 10;
const GRODOR_SCALE = 0.74;
const JUMP_BUTTON_Y = 862;

type JumpPhase = "running" | "success" | "failure";

type RectRegion = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export class JumpMiniGame implements MiniGameController {
  private background?: Phaser.GameObjects.Image;
  private grodor?: GrodorActor;
  private jumpButton?: Phaser.GameObjects.Text;
  private floors: RectRegion[] = [];
  private deathZone?: RectRegion;
  private leftSafeFloor?: RectRegion;
  private rightSafeFloor?: RectRegion;
  private phase: JumpPhase = "running";
  private position = { x: 0, y: 0 };
  private verticalVelocity = 0;
  private isGrounded = true;
  private jumpUsed = false;
  private assetsReady = false;

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    if (!this.assetsReady) {
      if (this.ensureAssetsLoaded()) {
        return;
      }
      this.assetsReady = true;
    }

    this.background = this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, IMAGE_ASSETS.jumpRunnerScene.key)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(4);

    const map = this.host.scene.make.tilemap({ key: JSON_ASSETS.jumpRunnerSegment.key });
    this.floors = this.readRectLayer(map, "collision");
    this.deathZone = this.readRectLayer(map, "hazards").find((region) => region.name.includes("death_zone"));
    this.leftSafeFloor = this.getLeftSafeFloor();
    this.rightSafeFloor = this.getRightSafeFloor();

    const start = this.pickStartPosition();
    this.position = start;
    this.grodor = new GrodorActor(this.host.scene, start.x, start.y, GRODOR_SCALE);
    this.grodor.setFlipX(false);
    this.grodor.playWalk();

    this.jumpButton = this.host.createMiniGameButton(
      WORLD_WIDTH / 2,
      JUMP_BUTTON_Y,
      GAME_TEXTS.miniGames.jump.jumpButton,
      () => this.jump()
    );

    this.host.setStep(0);
    this.host.getStatusText()?.setText(GAME_TEXTS.miniGames.jump.instruction);
    this.host.getRarityText()?.setText(GAME_TEXTS.miniGames.jump.tip);
    this.host.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.host.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.host.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    });
    this.host.publishMiniGameReport();
  }

  private ensureAssetsLoaded(): boolean {
    const missingImage = !this.host.scene.textures.exists(IMAGE_ASSETS.jumpRunnerScene.key);
    const missingMap = !this.host.scene.cache.tilemap.exists(JSON_ASSETS.jumpRunnerSegment.key);

    if (!missingImage && !missingMap) {
      return false;
    }

    if (missingImage) {
      this.host.scene.load.image(IMAGE_ASSETS.jumpRunnerScene.key, IMAGE_ASSETS.jumpRunnerScene.path);
    }
    if (missingMap) {
      this.host.scene.load.tilemapTiledJSON(JSON_ASSETS.jumpRunnerSegment.key, JSON_ASSETS.jumpRunnerSegment.path);
    }

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
      isGrounded: this.isGrounded,
      grodor: {
        x: Math.round(this.position.x),
        y: Math.round(this.position.y)
      },
      verticalVelocity: Math.round(this.verticalVelocity)
    };
  }

  private update(_: number, delta: number): void {
    if (this.host.getCompleted() || this.phase !== "running" || !this.grodor) {
      return;
    }

    const deltaSeconds = Math.min(delta, 40) / 1000;
    this.position.x += RUN_SPEED * deltaSeconds;

    if (!this.isGrounded) {
      this.verticalVelocity += GRAVITY * deltaSeconds;
      this.position.y += this.verticalVelocity * deltaSeconds;
    }

    const landingFloor = this.findLandingFloor(this.position.x, this.position.y);
    if (landingFloor && this.verticalVelocity >= 0) {
      this.position.y = landingFloor.y;
      this.verticalVelocity = 0;
      this.isGrounded = true;
      this.grodor.playWalk();
      if (this.jumpUsed && landingFloor === this.rightSafeFloor && this.isBeyondGap()) {
        this.succeed();
        return;
      }
    } else if (!this.isSupportedByFloor(this.position.x)) {
      this.isGrounded = false;
    }

    this.grodor.setPosition(this.position.x, this.position.y);

    if (this.hasEnteredDeathZone() || this.position.y >= FALL_LIMIT_Y || this.position.x > WORLD_WIDTH + 120) {
      this.fail();
    }
  }

  private jump(): void {
    if (this.host.getCompleted() || !this.isGrounded) {
      return;
    }

    this.isGrounded = false;
    this.jumpUsed = true;
    this.verticalVelocity = -JUMP_VELOCITY;
    this.grodor?.playIdle();
    this.host.setStep(1);
    this.host.getStatusText()?.setText(GAME_TEXTS.miniGames.jump.jumping);
    this.host.publishMiniGameReport();
  }

  private succeed(): void {
    const result: MiniGameResult = {
      type: "jump",
      outcome: "success",
      goldDelta: SUCCESS_GOLD
    };
    this.finish(result, GAME_TEXTS.miniGames.jump.success, "success");
  }

  private fail(): void {
    const result: MiniGameResult = {
      type: "jump",
      outcome: "failure",
      instantDeath: true
    };
    this.finish(result, GAME_TEXTS.miniGames.jump.failure, "failure");
  }

  private finish(result: MiniGameResult, status: string, phase: JumpPhase): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.phase = phase;
    this.host.setCompleted(true);
    this.host.setResult(result);
    this.host.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.jumpButton?.destroy();
    this.jumpButton = undefined;

    if (phase === "success") {
      this.grodor?.playVictory();
    } else {
      this.grodor?.playDeath();
    }

    this.host.getStatusText()?.setText(status);
    this.host.getRarityText()?.setText(phase === "success" ? GAME_TEXTS.miniGames.jump.successDetail : GAME_TEXTS.miniGames.jump.failureDetail);
    this.host.createContinueButton(result);
    this.host.publishMiniGameReport();
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

  private pickStartPosition(): { x: number; y: number } {
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

  private findLandingFloor(x: number, y: number): RectRegion | undefined {
    return this.floors.find(
      (floor) =>
        this.isWithinFloorX(x, floor) &&
        y >= floor.y - LANDING_SNAP &&
        y <= floor.y + floor.height + LANDING_SNAP
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
}
