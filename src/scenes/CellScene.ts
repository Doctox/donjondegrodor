import Phaser from "phaser";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { CELL_PRELOAD_IMAGES, CELL_PRELOAD_JSON, IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { addGrodorStat } from "../systems/grodorStats";
import { playZoneMusic } from "../systems/audioManager";
import { playSfx } from "../systems/sfxManager";
import { preloadImages, preloadTilemaps } from "../systems/scenePreload";
import { DungeonScene } from "./DungeonScene";

type CellSceneData = {
  preserveRunState?: boolean;
  fromCell?: boolean;
  resultOverlay?: "defeat" | "victory";
  introOverlayActive?: boolean;
  wakeMessage?: string;
};

const CELL_ZONE = {
  x: 1080,
  y: 494,
  width: 120,
  height: 180
};

export class CellScene extends DungeonScene {
  private transitioning = false;
  private dungeonStarted = false;
  private introOverlayLocked = false;
  private startTimeoutId?: number;
  private readonly handleCellPointerDown = (): void => {
    this.leaveCell();
  };
  private readonly handleWindowPointerDown = (event: PointerEvent): void => {
    if (this.isClientPointInsideCanvas(event.clientX, event.clientY)) {
      this.leaveCell();
    }
  };
  private readonly handleWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Enter" || event.code === "Space") {
      this.leaveCell();
    }
  };

  constructor() {
    super("CellScene", false, {
      doorInteractions: false,
      spawnGrodor: false,
      debugMenu: false,
      combatDebugRoute: false,
      summaryMode: "cell"
    });
  }

  preload(): void {
    preloadImages(this, CELL_PRELOAD_IMAGES);
    preloadTilemaps(this, CELL_PRELOAD_JSON);
  }

  create(data: CellSceneData = {}): void {
    const introOverlayActive = data.introOverlayActive === true;
    this.scene.stop("ResultScene");
    this.scene.stop("CombatScene");
    this.scene.stop("MiniGameScene");
    super.create({ fromCell: data.preserveRunState, suppressMusic: true });
    this.input.enabled = true;
    this.input.manager.enabled = true;
    this.transitioning = false;
    this.dungeonStarted = false;
    this.introOverlayLocked = introOverlayActive;

    this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, IMAGE_ASSETS.dungeonGeole.key)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(18);

    if (data.wakeMessage) {
      this.setInfoPanelMessageOnly(data.wakeMessage);
    }

    const cellZone = this.add
      .zone(CELL_ZONE.x, CELL_ZONE.y, CELL_ZONE.width, CELL_ZONE.height)
      .setDepth(80)
      .setInteractive({ useHandCursor: true });
    cellZone.on("pointerdown", () => this.leaveCell());
    this.input.on("pointerdown", this.handleCellPointerDown);

    if (this.isDebugEnabled()) {
      this.add
        .rectangle(CELL_ZONE.x, CELL_ZONE.y, CELL_ZONE.width, CELL_ZONE.height, 0x47a7ff, 0.26)
        .setDepth(81)
        .setStrokeStyle(3, 0xffd25f, 0.9);
    }

    this.input.keyboard?.once("keydown-ENTER", () => this.leaveCell());
    this.input.keyboard?.once("keydown-SPACE", () => this.leaveCell());
    window.addEventListener("pointerdown", this.handleWindowPointerDown, true);
    window.addEventListener("keydown", this.handleWindowKeyDown);
    if (introOverlayActive) {
      this.input.enabled = false;
    }
    this.time.delayedCall(0, () => {
      if (!introOverlayActive) {
        this.input.enabled = true;
        this.input.manager.enabled = true;
      }
      (window as unknown as { __cellSceneReport?: unknown }).__cellSceneReport = {
        status: introOverlayActive ? "intro-locked" : "ready",
        introOverlayActive,
        inputEnabled: this.input.enabled,
        inputManagerEnabled: this.input.manager.enabled,
        activeScenes: this.scene.manager.getScenes(true).map((scene) => scene.scene.key),
        zone: CELL_ZONE
      };
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("pointerdown", this.handleWindowPointerDown, true);
      window.removeEventListener("keydown", this.handleWindowKeyDown);
      this.input.off("pointerdown", this.handleCellPointerDown);
      if (this.startTimeoutId !== undefined) {
        window.clearTimeout(this.startTimeoutId);
        this.startTimeoutId = undefined;
      }
    });
  }

  public completeIntroOverlay(): void {
    this.introOverlayLocked = false;
    this.input.enabled = true;
  }

  private leaveCell(): void {
    if (this.transitioning || this.introOverlayLocked) {
      return;
    }

    this.transitioning = true;
    playSfx("cellDoorOpen");
    playZoneMusic(this, "dungeon");
    this.input.enabled = true;
    this.input.manager.enabled = true;
    window.removeEventListener("pointerdown", this.handleWindowPointerDown, true);
    window.removeEventListener("keydown", this.handleWindowKeyDown);

    const pulse = this.add
      .rectangle(CELL_ZONE.x, CELL_ZONE.y, CELL_ZONE.width, CELL_ZONE.height, 0xfff1b8, 0.18)
      .setDepth(82)
      .setStrokeStyle(4, 0xffd25f, 0.9);

    this.tweens.add({
      targets: pulse,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0,
      duration: 220,
      ease: "Sine.easeOut"
    });

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.startDungeonScene());
    this.startTimeoutId = window.setTimeout(() => this.startDungeonScene(), 540);

    (window as unknown as { __cellSceneReport?: unknown }).__cellSceneReport = {
      status: "leaving",
      destination: "DungeonScene",
      zone: CELL_ZONE
    };
  }

  private isDebugEnabled(): boolean {
    return IS_DEBUG_TOOLS_ENABLED && new URLSearchParams(window.location.search).get("cellDebug") === "1";
  }

  private startDungeonScene(): void {
    if (this.dungeonStarted) {
      return;
    }

    this.dungeonStarted = true;
    if (this.startTimeoutId !== undefined) {
      window.clearTimeout(this.startTimeoutId);
      this.startTimeoutId = undefined;
    }
    (window as unknown as { __cellStartDungeonReport?: unknown }).__cellStartDungeonReport = {
      status: "starting",
      fromScene: this.scene.key
    };
    addGrodorStat("runsTotal");
    this.scene.stop("ResultScene");
    this.scene.stop("CombatScene");
    this.scene.stop("MiniGameScene");
    this.scene.stop("DungeonScene");
    this.scene.start("DungeonScene", { fromCell: true });
  }

  private isInsideCellZone(x: number, y: number): boolean {
    return (
      x >= CELL_ZONE.x - CELL_ZONE.width / 2 &&
      x <= CELL_ZONE.x + CELL_ZONE.width / 2 &&
      y >= CELL_ZONE.y - CELL_ZONE.height / 2 &&
      y <= CELL_ZONE.y + CELL_ZONE.height / 2
    );
  }

  private isClientPointInsideCanvas(clientX: number, clientY: number): boolean {
    const canvas = this.game.canvas;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return false;
    }

    const x = (clientX - bounds.left) * (WORLD_WIDTH / bounds.width);
    const y = (clientY - bounds.top) * (WORLD_HEIGHT / bounds.height);
    const matched = x >= 0 && x <= WORLD_WIDTH && y >= 0 && y <= WORLD_HEIGHT;
    (window as unknown as { __cellWindowPointerReport?: unknown }).__cellWindowPointerReport = {
      matched,
      client: { x: clientX, y: clientY },
      game: { x, y },
      bounds: {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height
      },
      zone: CELL_ZONE
    };
    return matched;
  }
}
