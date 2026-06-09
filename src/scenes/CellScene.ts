import Phaser from "phaser";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { addGrodorStat } from "../systems/grodorStats";
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
  private startTimeoutId?: number;
  private readonly handleCellPointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (this.isPointerInsideCellZone(pointer)) {
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

  create(data: CellSceneData = {}): void {
    super.create(data.preserveRunState ? { fromCell: true } : undefined);
    this.input.enabled = true;
    this.input.manager.enabled = true;
    this.transitioning = false;
    this.dungeonStarted = false;

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
    window.addEventListener("keydown", this.handleWindowKeyDown);
    if (data.introOverlayActive) {
      this.input.enabled = false;
    }
    this.time.delayedCall(0, () => {
      if (!data.introOverlayActive) {
        this.input.enabled = true;
        this.input.manager.enabled = true;
      }
      (window as unknown as { __cellSceneReport?: unknown }).__cellSceneReport = {
        status: data.introOverlayActive ? "intro-locked" : "ready",
        inputEnabled: this.input.enabled,
        inputManagerEnabled: this.input.manager.enabled,
        activeScenes: this.scene.manager.getScenes(true).map((scene) => scene.scene.key),
        zone: CELL_ZONE
      };
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("keydown", this.handleWindowKeyDown);
      this.input.off("pointerdown", this.handleCellPointerDown);
      if (this.startTimeoutId !== undefined) {
        window.clearTimeout(this.startTimeoutId);
        this.startTimeoutId = undefined;
      }
    });
  }

  public completeIntroOverlay(): void {
    this.input.enabled = true;
  }

  private leaveCell(): void {
    if (this.transitioning || !this.input.enabled) {
      return;
    }

    this.transitioning = true;
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

  private isPointerInsideCellZone(pointer: Phaser.Input.Pointer): boolean {
    const displayWidth = this.scale.displaySize.width || WORLD_WIDTH;
    const displayHeight = this.scale.displaySize.height || WORLD_HEIGHT;
    const candidates = [
      { x: pointer.worldX, y: pointer.worldY, mode: "world" },
      { x: pointer.x, y: pointer.y, mode: "game" },
      {
        x: pointer.x * (WORLD_WIDTH / displayWidth),
        y: pointer.y * (WORLD_HEIGHT / displayHeight),
        mode: "display-scaled"
      }
    ];
    const matched = candidates.find((candidate) => this.isInsideCellZone(candidate.x, candidate.y));
    (window as unknown as { __cellPointerReport?: unknown }).__cellPointerReport = {
      matched: matched?.mode ?? null,
      candidates,
      zone: CELL_ZONE
    };
    return Boolean(matched);
  }
}
