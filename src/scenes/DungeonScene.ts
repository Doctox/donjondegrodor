import Phaser from "phaser";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { ANIMATION_KEYS, IMAGE_ASSETS, JSON_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import {
  addDungeonInventoryItem,
  addDungeonGoldReward,
  applyHeartLossWithCowardReflex,
  continueToNextFloor,
  decreaseRunMaxLife,
  FinalDoorOutcome,
  FinalDoorOutcomeId,
  forceDungeonRunDeath,
  getDungeonRunState,
  increaseRunMaxLife,
  loseCarriedGold,
  pickRandomDoorEventId,
  resetDungeonRunState,
  replaceDungeonEquipmentItem,
  resolveDoorEvent,
  resolveFinalDoorOutcome,
  resolveRandomDoorEvent,
  setDungeonLifeForCombat,
  DungeonRunEvent
} from "../systems/dungeonRunState";
import { CombatResult } from "../data/combatResults";
import {
  publishDoorReadingReport,
  publishDungeonCombatPanelReport,
  publishDungeonCombatReport,
  publishDungeonCombatResultReport,
  publishDungeonContinueReport,
  publishDungeonDeathResetReport,
  publishDungeonEventReport,
  publishDungeonExitReport,
  publishDungeonFinalDoorReport,
  publishDungeonFinalDoorRetryReport,
  publishDungeonMiniGameReport,
  publishDungeonMiniGameResultReport,
  publishDungeonSceneReport,
  publishEquipmentReplacementReport,
  publishGrodorPoseReport,
  publishShopDiscoveryReport,
  publishTiledDebugReport,
  publishTiledMovementReport
} from "../debug/debugReports";
import { DungeonEventDefinition, DungeonEventId, getDungeonEventDefinition } from "../data/dungeonEvents";
import { GAME_TEXTS } from "../data/gameTexts";
import { getEquipmentSlot, getItemDefinition } from "../data/itemDefinitions";
import { addGrodorStat } from "../systems/grodorStats";
import { discoverShopItems, getDiscoveredShopItems } from "../systems/metaProgression";
import { shouldRevealDoorReadingHint } from "../systems/permanentUpgrades";
import { getDoorPathPoints, getInteractiveZones, getSpawnPoint, TiledPoint } from "../systems/tiledMap";
import { setHudVisible } from "../ui/hud";
import { createNineSlicePanel } from "../ui/nineSlicePanel";
import { DungeonHud } from "../ui/DungeonHud";
import { InventoryPanel } from "../ui/InventoryPanel";
import { InventoryEquipmentPanel } from "../ui/InventoryEquipmentPanel";
import { GrodorActor } from "../actors/GrodorActor";
import { setLetterboxBackdrop } from "../ui/letterboxBackdrop";
import { DungeonDebugController } from "./dungeon/DungeonDebugController";
import { DungeonPanelFactory } from "./dungeon/DungeonPanelFactory";
import { MiniGameResult } from "./MiniGameScene";

type DebugLayerKind = "collisions" | "interactives" | "spawns" | "paths";

type DebugEntry = {
  layer: string;
  kind: DebugLayerKind;
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  point: boolean;
};

type DungeonSceneOptions = {
  doorInteractions: boolean;
  spawnGrodor: boolean;
  debugMenu: boolean;
  combatDebugRoute: boolean;
  summaryMode: "dungeon" | "cell";
};

type DungeonSceneData = {
  fromCell?: boolean;
  resultOverlay?: "defeat" | "victory";
};

const DEFAULT_DUNGEON_OPTIONS: DungeonSceneOptions = {
  doorInteractions: true,
  spawnGrodor: true,
  debugMenu: true,
  combatDebugRoute: true,
  summaryMode: "dungeon"
};

const DEBUG_STYLE: Record<DebugLayerKind, { fill: number; stroke: number; alpha: number }> = {
  collisions: { fill: 0xff2b2b, stroke: 0xff7777, alpha: 0.28 },
  interactives: { fill: 0x2d7dff, stroke: 0x9bc4ff, alpha: 0.32 },
  spawns: { fill: 0x18cc62, stroke: 0x95ffbf, alpha: 0.86 },
  paths: { fill: 0xffd833, stroke: 0xfff0a0, alpha: 0.9 }
};

const LAYER_ALIASES: Record<DebugLayerKind, string[]> = {
  collisions: ["walkable"],
  interactives: ["interactives"],
  spawns: ["spawns"],
  paths: ["paths"]
};

export class DungeonScene extends Phaser.Scene {
  protected readonly debugMode: boolean;
  protected readonly options: DungeonSceneOptions;
  private debugEntries: DebugEntry[] = [];
  private map?: Phaser.Tilemaps.Tilemap;
  private grodor?: GrodorActor;
  private spawn?: TiledPoint;
  private infoPanel?: Phaser.GameObjects.NineSlice;
  private infoText?: Phaser.GameObjects.Text;
  private infoLines: string[] = [];
  private statusMessage = "";
  private dungeonHud?: DungeonHud;
  private inventoryPanel?: InventoryPanel | InventoryEquipmentPanel;
  private debugController?: DungeonDebugController;
  private eventPanel?: Phaser.GameObjects.Container;
  private moving = false;
  private awaitingContinue = false;
  private pendingCombatEvent = false;
  private pendingMiniGameEvent = false;
  private combatInputLocked = false;
  private doorSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private doorHitZones = new Map<string, Phaser.GameObjects.Zone>();
  private preparedDoorEventIds = new Map<string, DungeonEventId>();
  private doorReadingHintTexts: Phaser.GameObjects.Text[] = [];
  private readonly handleDoorPointerDown = (pointer: Phaser.Input.Pointer): void => this.handleDoorPointer(pointer);

  constructor(sceneKey = "DungeonScene", debugMode = false, options: Partial<DungeonSceneOptions> = {}) {
    super(sceneKey);
    this.debugMode = debugMode && IS_DEBUG_TOOLS_ENABLED;
    this.options = {
      ...DEFAULT_DUNGEON_OPTIONS,
      ...options,
      debugMenu: Boolean((options.debugMenu ?? DEFAULT_DUNGEON_OPTIONS.debugMenu) && IS_DEBUG_TOOLS_ENABLED),
      combatDebugRoute: Boolean((options.combatDebugRoute ?? DEFAULT_DUNGEON_OPTIONS.combatDebugRoute) && IS_DEBUG_TOOLS_ENABLED)
    };
  }

  create(data: DungeonSceneData = {}): void {
    this.resetSceneRuntime();
    setHudVisible(false);
    setLetterboxBackdrop(IMAGE_ASSETS.dungeonInterior.path);
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    const params = new URLSearchParams(window.location.search);
    const startedFromCell = Boolean(data.fromCell);
    if (!startedFromCell) {
      resetDungeonRunState();
    }
    DungeonDebugController.applyDebugOverridesIfEnabled(this.scene.key, params, startedFromCell);
    publishDungeonSceneReport({
      sceneKey: this.scene.key,
      options: this.options
    });

    const map = this.make.tilemap({ key: JSON_ASSETS.dungeonMap.key });
    this.map = map;
    this.add.image(0, 0, IMAGE_ASSETS.dungeonInterior.key).setOrigin(0, 0).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const graphics = this.add.graphics().setDepth(20);
    this.debugEntries = this.collectDebugEntries(map);
    if (this.debugMode) {
      this.debugEntries.filter((entry) => entry.kind !== "interactives").forEach((entry) => this.drawDebugEntry(graphics, entry));
    }
    this.createDoors();
    if (this.options.doorInteractions) {
      this.input.on("pointerdown", this.handleDoorPointerDown);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.off("pointerdown", this.handleDoorPointerDown);
      });
    }

    const spawn = this.findSpawn();
    if (spawn && this.options.spawnGrodor) {
      this.spawn = spawn;
      this.grodor = new GrodorActor(this, spawn.x, spawn.y);
      this.syncGrodorEquipment();
    }

    this.addSummary(map, spawn);
    this.createRunHud();
    this.updateRunHud();
    if (this.options.debugMenu || this.options.combatDebugRoute) {
      this.createDebugController();
    }
    if (this.options.debugMenu) {
      this.debugController?.createMenu();
    }
    this.publishReport(map, spawn);
    if (this.options.combatDebugRoute && !startedFromCell) {
      this.debugController?.launchCombatDebugRoute();
    }
    if (data.resultOverlay) {
      const mode = data.resultOverlay;
      this.time.delayedCall(0, () => this.launchResultOverlay(mode));
    }
  }

  private resetSceneRuntime(): void {
    this.debugEntries = [];
    this.map = undefined;
    this.grodor = undefined;
    this.spawn = undefined;
    this.infoPanel = undefined;
    this.infoText = undefined;
    this.infoLines = [];
    this.statusMessage = "";
    this.dungeonHud = undefined;
    this.inventoryPanel = undefined;
    this.debugController = undefined;
    this.eventPanel = undefined;
    this.moving = false;
    this.awaitingContinue = false;
    this.pendingCombatEvent = false;
    this.pendingMiniGameEvent = false;
    this.combatInputLocked = false;
    this.doorSprites.clear();
    this.doorHitZones.clear();
    this.preparedDoorEventIds.clear();
    this.doorReadingHintTexts = [];
  }

  private collectDebugEntries(map: Phaser.Tilemaps.Tilemap): DebugEntry[] {
    return (Object.keys(LAYER_ALIASES) as DebugLayerKind[]).flatMap((kind) => {
      const layer = LAYER_ALIASES[kind].map((name) => map.getObjectLayer(name)).find(Boolean);
      if (!layer) {
        return [];
      }

      return layer.objects.map((object) => ({
        layer: layer.name,
        kind,
        id: object.id ?? 0,
        name: object.name || GAME_TEXTS.debug.unnamedObject,
        type: object.type || "",
        x: object.x ?? 0,
        y: object.y ?? 0,
        width: object.width ?? 0,
        height: object.height ?? 0,
        point: Boolean(object.point)
      }));
    });
  }

  private createDoors(): void {
    const doors = getInteractiveZones(this.map!)
      .filter((door) => /^door_[123]$/.test(door.name))
      .sort((left, right) => left.name.localeCompare(right.name));

    this.prepareDoorChoices(doors);
    doors
      .forEach((door) => {
        const doorSprite = this.add
          .sprite(door.x, door.y, this.getDoorTextureKey(door.name, "closed"))
          .setOrigin(0, 0)
          .setDisplaySize(door.width, door.height)
          .setDepth(9);
        this.doorSprites.set(door.name, doorSprite);

        if (!this.options.doorInteractions) {
          return;
        }

        const hitZone = this.add
          .zone(door.x + door.width / 2, door.y + door.height / 2, door.width, door.height)
          .setDepth(50)
          .setInteractive({ useHandCursor: true });
        this.doorHitZones.set(door.name, hitZone);

        hitZone.on("pointerover", () => doorSprite.setAlpha(0.82));
        hitZone.on("pointerout", () => {
          if (!this.moving) {
            doorSprite.setAlpha(1);
          }
        });
        hitZone.on("pointerdown", () => this.walkDoorPath(door.name, doorSprite));
      });
  }

  private handleDoorPointer(pointer: Phaser.Input.Pointer): void {
    if (this.combatInputLocked) {
      return;
    }

    (window as unknown as { __tiledLastPointer?: unknown }).__tiledLastPointer = {
      x: pointer.x,
      y: pointer.y,
      worldX: pointer.worldX,
      worldY: pointer.worldY
    };

    const door = this.debugEntries.find(
      (entry) =>
        entry.kind === "interactives" &&
        /^door_[123]$/.test(entry.name) &&
        pointer.worldX >= entry.x &&
        pointer.worldX <= entry.x + entry.width &&
        pointer.worldY >= entry.y &&
        pointer.worldY <= entry.y + entry.height
    );

    const doorSprite = door ? this.doorSprites.get(door.name) : undefined;
    if (door && doorSprite) {
      this.walkDoorPath(door.name, doorSprite);
    }
  }

  private walkDoorPath(doorName: string, doorSprite: Phaser.GameObjects.Sprite): void {
    if (!this.map || !this.grodor || this.moving || this.awaitingContinue || this.combatInputLocked) {
      return;
    }

    const path = this.getDoorPath(doorName);
    if (path.length === 0) {
      this.setStatus(GAME_TEXTS.dungeon.pathMissing(doorName));
      return;
    }

    this.moving = true;
    this.clearDoorReadingHints();
    doorSprite.setAlpha(1);
    this.setStatus(GAME_TEXTS.dungeon.pathInProgress(doorName));
    this.grodor.playWalk();
    this.publishMovementReport(doorName, "moving", path);
    this.walkPathSegment(path, 0, doorName, doorSprite);
  }

  private walkPathSegment(
    path: TiledPoint[],
    index: number,
    doorName: string,
    doorSprite: Phaser.GameObjects.Sprite
  ): void {
    if (!this.grodor) {
      return;
    }

    const point = path[index];
    const distance = Phaser.Math.Distance.Between(this.grodor.x, this.grodor.y, point.x, point.y);
    this.grodor.setFlipX(point.x < this.grodor.x);

    this.tweens.add({
      targets: this.grodor.container,
      x: point.x,
      y: point.y,
      duration: Phaser.Math.Clamp(distance * 2.4, 260, 850),
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (index < path.length - 1) {
          this.walkPathSegment(path, index + 1, doorName, doorSprite);
          return;
        }

        this.grodor?.playIdle();
        this.grodor?.setFlipX(false);
        doorSprite.setTexture(this.getDoorTextureKey(doorName, "open"));
        this.moving = false;
        if (getDungeonRunState().currentFloor === 1) {
          const finalOutcome = this.resolveFinalDoorOutcomeForScene();
          this.awaitingContinue = true;
          this.updateRunHud();
          this.setStatus(GAME_TEXTS.dungeon.doorReached(doorName.replace("door_", "")));
          this.handleFinalDoorOutcome(finalOutcome);
          this.publishMovementReport(doorName, "reached", path);
          return;
        }

        const event = this.resolveDoorEventForScene(doorName);
        this.awaitingContinue = true;
        this.syncGrodorEquipment();
        this.updateRunHud();
        this.setStatus(GAME_TEXTS.dungeon.doorReached(doorName.replace("door_", "")));
        if (event.kind === "combat") {
          this.launchCombatEvent(event);
        } else if (event.kind === "minigame") {
          this.launchMiniGameEvent(event);
        } else {
          this.playEventPose(event);
          if (event.state.life <= 0) {
            this.handleDoorEventDeath(event);
          } else {
            this.showEventPanel(doorName, event);
          }
        }
        this.publishMovementReport(doorName, "reached", path);
      }
    });
  }

  private getDoorPath(doorName: string): TiledPoint[] {
    return this.map ? getDoorPathPoints(this.map, doorName.replace("door_", "")) : [];
  }

  private getDoorTextureKey(doorName: string, state: "closed" | "open"): string {
    const doorIndex = doorName.replace("door_", "") as "1" | "2" | "3";
    const keyByDoor = {
      "1": state === "closed" ? IMAGE_ASSETS.door1Closed.key : IMAGE_ASSETS.door1Open.key,
      "2": state === "closed" ? IMAGE_ASSETS.door2Closed.key : IMAGE_ASSETS.door2Open.key,
      "3": state === "closed" ? IMAGE_ASSETS.door3Closed.key : IMAGE_ASSETS.door3Open.key
    };

    return keyByDoor[doorIndex];
  }

  private drawDebugEntry(graphics: Phaser.GameObjects.Graphics, entry: DebugEntry): void {
    const style = DEBUG_STYLE[entry.kind];
    graphics.fillStyle(style.fill, style.alpha);
    graphics.lineStyle(3, style.stroke, 0.95);

    if (entry.point || entry.width === 0 || entry.height === 0) {
      graphics.fillCircle(entry.x, entry.y, entry.kind === "spawns" ? 12 : 8);
      graphics.strokeCircle(entry.x, entry.y, entry.kind === "spawns" ? 16 : 12);
      this.addLabel(entry.name, entry.x + 12, entry.y - 24, style.stroke);
      return;
    }

    graphics.fillRect(entry.x, entry.y, entry.width, entry.height);
    graphics.strokeRect(entry.x, entry.y, entry.width, entry.height);
    this.addLabel(entry.name, entry.x, entry.y - 24, style.stroke);
  }

  private addLabel(text: string, x: number, y: number, color: number): void {
    this.add
      .text(x, y, text, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "22px",
        color: `#${color.toString(16).padStart(6, "0")}`,
        stroke: "#070402",
        strokeThickness: 5
      })
      .setDepth(30);
  }

  private findSpawn(): DebugEntry | undefined {
    const spawn = this.map ? getSpawnPoint(this.map, "spawn_grodor_start") : undefined;
    return spawn
      ? {
          ...spawn,
          layer: "spawns",
          kind: "spawns",
          id: 0,
          type: "",
          width: 0,
          height: 0,
          point: true
        }
      : undefined;
  }

  private addSummary(map: Phaser.Tilemaps.Tilemap, spawn: DebugEntry | undefined): void {
    const counts = this.debugEntries.reduce<Record<DebugLayerKind, number>>(
      (acc, entry) => {
        acc[entry.kind] += 1;
        return acc;
      },
      { collisions: 0, interactives: 0, spawns: 0, paths: 0 }
    );

    const lines = [
      this.debugMode ? GAME_TEXTS.debug.tiledTitle : GAME_TEXTS.dungeon.title,
      this.debugMode
        ? GAME_TEXTS.debug.tiledCounts(counts.collisions, counts.interactives, counts.spawns, counts.paths)
        : this.options.summaryMode === "cell"
          ? GAME_TEXTS.cell.imprisoned
          : GAME_TEXTS.dungeon.chooseDoor,
      this.options.summaryMode === "cell"
        ? GAME_TEXTS.cell.behindBars
        : spawn
          ? GAME_TEXTS.dungeon.grodorSpawn(Math.round(spawn.x), Math.round(spawn.y))
          : GAME_TEXTS.dungeon.spawnMissing
    ];

    if (this.debugMode) {
      lines.splice(1, 0, GAME_TEXTS.debug.tiledRatio(map.widthInPixels, map.heightInPixels));
      lines.push(GAME_TEXTS.debug.tiledLegend);
    }

    this.infoLines = lines;
    this.statusMessage =
      this.options.summaryMode === "cell"
        ? GAME_TEXTS.cell.clickToStart
        : GAME_TEXTS.dungeon.chooseDoorStatus;

    const panelWidth = 520;
    const panelHeight = this.debugMode ? 260 : 220;
    const panelX = WORLD_WIDTH - 304;
    const panelY = WORLD_HEIGHT - 152;
    this.infoPanel = createNineSlicePanel(this, IMAGE_ASSETS.frameStory.key, panelX, panelY, panelWidth, panelHeight, {
      left: 36,
      right: 36,
      top: 36,
      bottom: 36
    }).setDepth(40);

    this.infoText = this.add
      .text(panelX, panelY, "", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "24px",
        color: "#fff1c2",
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: panelWidth - 76 }
      })
      .setOrigin(0.5)
      .setDepth(41);
    this.renderInfoPanel();
  }

  protected setStatus(message: string): void {
    this.statusMessage = message;
    this.renderInfoPanel();
  }

  protected setInfoPanelMessageOnly(message: string): void {
    this.infoLines = message.split("\n");
    this.statusMessage = "";
    this.renderInfoPanel();
  }

  private renderInfoPanel(): void {
    const lines = this.statusMessage ? [...this.infoLines, "", this.statusMessage] : this.infoLines;
    this.infoText?.setText(lines.join("\n"));
  }

  private createRunHud(): void {
    this.dungeonHud = new DungeonHud(this);
    if (this.scene.key === "DungeonScene") {
      this.dungeonHud.setInventoryClickHandler(() => this.openInventoryPanel());
    }
  }

  private updateRunHud(): void {
    const state = getDungeonRunState();
    this.dungeonHud?.updateHud(state);
    this.debugController?.update();
  }

  private createDebugController(): void {
    this.debugController = new DungeonDebugController(this, {
      addDeathStats: () => this.addDeathStats(),
      launchMiniGameEvent: (event) => this.launchMiniGameEvent(event),
      playDeath: () => this.grodor?.playDeath(),
      playIdle: () => this.grodor?.playIdle(),
      restoreDungeonOverlaysWhenCombatCloses: () => this.restoreDungeonOverlaysWhenCombatCloses(),
      setAwaitingContinue: (awaitingContinue) => {
        this.awaitingContinue = awaitingContinue;
      },
      setDungeonCombatLock: (locked) => this.setDungeonCombatLock(locked),
      setDungeonOverlaysVisible: (visible) => this.setDungeonOverlaysVisible(visible),
      setStatus: (message) => this.setStatus(message),
      showDefeatResult: () => this.showDefeatResult(),
      syncGrodorEquipment: () => this.syncGrodorEquipment(),
      updateRunHud: () => this.updateRunHud()
    });
  }

  private launchCombatEvent(event: DungeonRunEvent): void {
    if (this.scene.isActive("CombatScene")) {
      return;
    }

    this.pendingCombatEvent = true;
    this.setDungeonOverlaysVisible(false);
    this.setDungeonCombatLock(true);
    this.scene.launch("CombatScene", {
      monsterId: event.monsterId ?? "rat",
      debugDirect: false
    });
    this.restoreDungeonOverlaysWhenCombatCloses();
    publishDungeonCombatReport({
      status: "launched",
      eventId: event.id,
      monsterId: event.monsterId ?? "rat",
      state: event.state
    });
  }

  private launchMiniGameEvent(event: DungeonRunEvent): void {
    if (this.scene.isActive("MiniGameScene")) {
      return;
    }

    this.pendingMiniGameEvent = true;
    this.setDungeonOverlaysVisible(false);
    this.setDungeonCombatLock(true);
    const miniGameType =
      event.id === "coin_flip" || event.id === "bonneteau" || event.id === "slot_machine" || event.id === "dodge_chest" || event.id === "jump"
        ? event.id
        : "loot_chest";
    this.scene.launch("MiniGameScene", {
      type: miniGameType,
      ownedInventory: getDungeonRunState().inventory,
      carriedGold: getDungeonRunState().carriedGold,
      maxLife: getDungeonRunState().maxLife
    });
    this.scene.bringToTop("MiniGameScene");
    this.restoreDungeonOverlaysWhenMiniGameCloses();
    publishDungeonMiniGameReport({
      status: "launched",
      eventId: event.id,
      state: event.state
    });
  }

  private setDungeonOverlaysVisible(visible: boolean): void {
    if (!visible) {
      this.closeInventoryPanel({ preserveLock: true });
    }
    this.dungeonHud?.setVisible(visible);
    this.debugController?.setVisible(visible);
    this.infoPanel?.setVisible(visible);
    this.infoText?.setVisible(visible);
  }

  private openInventoryPanel(): void {
    if (
      this.scene.key !== "DungeonScene" ||
      this.inventoryPanel ||
      this.combatInputLocked ||
      this.scene.isActive("CombatScene") ||
      this.scene.isActive("ResultScene")
    ) {
      return;
    }

    this.setDungeonCombatLock(true);
    this.inventoryPanel = new InventoryEquipmentPanel(this, getDungeonRunState().equipment, () => this.closeInventoryPanel());
  }

  private closeInventoryPanel(options: { preserveLock?: boolean } = {}): void {
    if (!this.inventoryPanel) {
      return;
    }

    this.inventoryPanel.destroy();
    this.inventoryPanel = undefined;
    if (!options.preserveLock) {
      this.time.delayedCall(0, () => {
        if (!this.inventoryPanel && !this.scene.isActive("CombatScene") && !this.scene.isActive("ResultScene")) {
          this.setDungeonCombatLock(false);
        }
      });
    }
  }

  private setDungeonCombatLock(locked: boolean): void {
    this.combatInputLocked = locked;
    this.doorHitZones.forEach((zone) => {
      if (locked) {
        zone.disableInteractive();
      } else {
        zone.setInteractive({ useHandCursor: true });
      }
    });
  }

  private restoreDungeonOverlaysWhenCombatCloses(): void {
    const combatScene = this.scene.get("CombatScene");
    let restored = false;
    const restore = (combatResult?: CombatResult) => {
      if (restored) {
        return;
      }

      restored = true;
      this.events.off("combat-closed", restore);
      combatScene.events.off(Phaser.Scenes.Events.SHUTDOWN, restore);
      this.setDungeonOverlaysVisible(true);
      this.setDungeonCombatLock(false);
      if (combatResult) {
        setDungeonLifeForCombat(combatResult.grodorLife);
      }
      this.updateRunHud();
      if (combatResult) {
        this.pendingCombatEvent = false;
        this.handleCombatResult(combatResult);
      } else if (this.pendingCombatEvent) {
        this.pendingCombatEvent = false;
        this.continueRun();
      }

      publishDungeonCombatResultReport({
        result: combatResult,
        state: getDungeonRunState()
      });
    };

    this.events.once("combat-closed", restore);
    combatScene.events.once(Phaser.Scenes.Events.SHUTDOWN, restore);
  }

  private restoreDungeonOverlaysWhenMiniGameCloses(): void {
    const miniGameScene = this.scene.get("MiniGameScene");
    let restored = false;
    const restore = (miniGameResult?: MiniGameResult) => {
      if (restored) {
        return;
      }

      restored = true;
      this.events.off("minigame-closed", restore);
      miniGameScene.events.off(Phaser.Scenes.Events.SHUTDOWN, restore);
      this.setDungeonOverlaysVisible(true);
      this.setDungeonCombatLock(false);

      if (miniGameResult) {
        this.pendingMiniGameEvent = false;
        this.handleMiniGameResult(miniGameResult);
      } else if (this.pendingMiniGameEvent) {
        this.pendingMiniGameEvent = false;
        this.continueRun();
      }

      publishDungeonMiniGameResultReport({
        result: miniGameResult,
        state: getDungeonRunState()
      });
    };

    this.events.once("minigame-closed", restore);
    miniGameScene.events.once(Phaser.Scenes.Events.SHUTDOWN, restore);
  }

  private handleMiniGameResult(result: MiniGameResult): void {
    const effectMessages: string[] = [];
    if (result.outcome === "success") {
      addGrodorStat("miniJeuxReussis");
    }
    if (result.instantDeath) {
      forceDungeonRunDeath();
    }
    if (result.goldDelta) {
      const goldResult = addDungeonGoldReward(result.goldDelta);
      effectMessages.push(...goldResult.effectMessages);
    }
    if (result.goldLoss) {
      loseCarriedGold(result.goldLoss);
    }
    if (result.maxLifeLoss) {
      decreaseRunMaxLife(result.maxLifeLoss);
    }
    if (result.maxLifeDelta) {
      increaseRunMaxLife(result.maxLifeDelta);
    }
    if ((result.lifeDelta ?? 0) < 0) {
      const lossResult = applyHeartLossWithCowardReflex(Math.abs(result.lifeDelta ?? 0), "dungeon_event");
      effectMessages.push(...lossResult.effectMessages);
    }
    if (result.itemId) {
      const conflictItemId = this.getEquipmentConflictItem(result.itemId);
      if (conflictItemId === result.itemId) {
        this.syncGrodorEquipment();
        this.updateRunHud();
        this.grodor?.playIdle();
        this.setStatus(GAME_TEXTS.miniGames.lootChest.duplicateFallback);
        this.continueRun();
        return;
      }
      if (conflictItemId) {
        this.showEquipmentReplacementPanel(conflictItemId, result.itemId);
        return;
      }

      addDungeonInventoryItem(result.itemId);
    }

    this.syncGrodorEquipment();
    this.updateRunHud();
    if (getDungeonRunState().life <= 0) {
      this.awaitingContinue = true;
      this.setDungeonCombatLock(true);
      this.grodor?.playDeath();
      this.addDeathStats();
      this.showDefeatResult();
      return;
    }
    if (result.followUpMiniGame) {
      this.launchMiniGameEvent(resolveDoorEvent(result.followUpMiniGame));
      return;
    }
    this.grodor?.playVictory();
    this.continueRun(effectMessages);
  }

  private getEquipmentConflictItem(itemId: string): string | undefined {
    const slot = getEquipmentSlot(itemId);
    if (!slot) {
      return undefined;
    }

    const state = getDungeonRunState();
    return state.equipment.find((equipmentId) => equipmentId === itemId || getEquipmentSlot(equipmentId) === slot);
  }

  private showEquipmentReplacementPanel(currentItemId: string, nextItemId: string): void {
    this.eventPanel?.destroy();
    this.setDungeonCombatLock(true);

    const text = GAME_TEXTS.miniGames.lootChest.replacementChoice;
    const currentName = getItemDefinition(currentItemId)?.name ?? GAME_TEXTS.inventory.unknownItem(currentItemId);
    const nextName = getItemDefinition(nextItemId)?.name ?? GAME_TEXTS.inventory.unknownItem(nextItemId);
    this.eventPanel = new DungeonPanelFactory(this).createEquipmentReplacementPanel({
      currentItemId,
      nextItemId,
      currentName,
      nextName,
      onKeep: () => this.finishEquipmentReplacementChoice(text.keepResult),
      onReplace: () => {
        replaceDungeonEquipmentItem(currentItemId, nextItemId);
        this.finishEquipmentReplacementChoice(text.replaceResult(nextName));
      }
    });
    publishEquipmentReplacementReport({
      currentItemId,
      nextItemId,
      state: getDungeonRunState()
    });
  }

  private finishEquipmentReplacementChoice(message: string): void {
    this.syncGrodorEquipment();
    this.updateRunHud();
    this.grodor?.playVictory();
    this.setStatus(message);
    this.setDungeonCombatLock(false);
    this.continueRun();
  }

  private handleCombatResult(result: CombatResult): void {
    if (result.outcome === "victory") {
      addGrodorStat("combatsGagnes");
      const goldResult = addDungeonGoldReward(result.goldReward);
      this.updateRunHud();
      this.awaitingContinue = true;
      this.grodor?.playIdle();
      this.showCombatResultPanel(result, true, goldResult.effectMessages);
      this.setStatus(GAME_TEXTS.dungeon.combatWonStatus);
      return;
    }

    this.awaitingContinue = true;
    this.setDungeonCombatLock(true);
    this.grodor?.playDeath();
    this.setStatus(GAME_TEXTS.dungeon.runEndedStatus);
    this.addDeathStats();
    publishDungeonDeathResetReport({
      result,
      nextScene: "ResultScene",
      state: getDungeonRunState()
    });
    this.showDefeatResult();
  }

  private navigateToNewCellRun(): void {
    const url = new URL(window.location.href);
    url.searchParams.set("scene", "cell");
    ["event", "monster", "arena", "life", "maxLife", "gold", "inventory", "equipment", "floor", "currentFloor", "totalFloors"].forEach((key) => {
      url.searchParams.delete(key);
    });
    window.location.href = url.toString();
  }

  private showDefeatResult(): void {
    this.launchResultOverlay("defeat");
  }

  private showVictoryResult(): void {
    this.launchResultOverlay("victory");
  }

  private launchResultOverlay(mode: "defeat" | "victory"): void {
    this.eventPanel?.destroy();
    this.eventPanel = undefined;
    if (mode === "victory") {
      this.discoverRunShopItems();
    }
    this.setDungeonOverlaysVisible(false);
    this.setDungeonCombatLock(true);
    if (this.scene.isActive("ResultScene")) {
      this.scene.stop("ResultScene");
    }
    this.scene.launch("ResultScene", { mode });
    this.scene.bringToTop("ResultScene");
  }

  private discoverRunShopItems(): void {
    const beforeDiscovery = getDiscoveredShopItems();
    const extractedItems = getDungeonRunState().inventory.filter((itemId) => Boolean(getItemDefinition(itemId)?.shopDiscoverable));
    const discoveredShopItems = discoverShopItems(extractedItems);

    publishShopDiscoveryReport({
      extractedItems,
      newlyDiscoveredItems: discoveredShopItems.filter((itemId) => !beforeDiscovery.includes(itemId)),
      discoveredShopItems,
      carriedItemsKeptOnGrodor: extractedItems
    });
  }

  private resolveDoorEventForScene(doorName?: string): DungeonRunEvent {
    const forcedEventId = this.getForcedEventId();
    const preparedEventId = doorName ? this.preparedDoorEventIds.get(doorName) : undefined;
    return forcedEventId ? resolveDoorEvent(forcedEventId) : preparedEventId ? resolveDoorEvent(preparedEventId) : resolveRandomDoorEvent();
  }

  private resolveFinalDoorOutcomeForScene(): FinalDoorOutcome {
    return resolveFinalDoorOutcome(getDungeonRunState(), this.getForcedFinalDoorOutcome());
  }

  private getForcedEventId(): string | undefined {
    if (!IS_DEBUG_TOOLS_ENABLED) {
      return undefined;
    }

    const eventParam = new URLSearchParams(window.location.search).get("event");
    return eventParam && getDungeonEventDefinition(eventParam) ? eventParam : undefined;
  }

  private getForcedFinalDoorOutcome(): FinalDoorOutcomeId | undefined {
    if (!IS_DEBUG_TOOLS_ENABLED) {
      return undefined;
    }

    const outcome = new URLSearchParams(window.location.search).get("finalDoorOutcome");
    return outcome === "escape" || outcome === "bruise" || outcome === "trap" ? outcome : undefined;
  }

  private syncGrodorEquipment(): void {
    this.grodor?.setEquipment(getDungeonRunState().equipment);
  }

  private playEventPose(event: DungeonRunEvent): void {
    if (!this.grodor) {
      return;
    }

    if (event.state.life <= 0) {
      this.grodor.playDeath();
      this.publishPoseReport(event.kind, ANIMATION_KEYS.grodorDeath);
      return;
    }

    if ((event.goldDelta ?? 0) > 0 || (event.lifeDelta ?? 0) > 0) {
      this.grodor.playVictory();
      this.publishPoseReport(event.id, ANIMATION_KEYS.grodorVictory);
      this.returnToIdleAfterPose(event.id);
    } else if ((event.lifeDelta ?? 0) < 0) {
      this.grodor.playHurt();
      this.publishPoseReport(event.id, ANIMATION_KEYS.grodorHurt);
      this.returnToIdleAfterPose(event.id);
    } else {
      this.grodor.playIdle();
      this.publishPoseReport(event.id, ANIMATION_KEYS.grodorIdle);
    }
  }

  private returnToIdleAfterPose(eventId: string): void {
    this.time.delayedCall(850, () => {
      if (!this.grodor || getDungeonRunState().life <= 0) {
        return;
      }

      this.grodor.playIdle();
      this.publishPoseReport(eventId, ANIMATION_KEYS.grodorIdle);
    });
  }

  private publishPoseReport(eventId: string, animation: string): void {
    publishGrodorPoseReport({
      eventId,
      animation,
      state: getDungeonRunState()
    });
  }

  private handleDoorEventDeath(event: DungeonRunEvent): void {
    this.awaitingContinue = true;
    this.setDungeonCombatLock(true);
    this.grodor?.playDeath();
    this.setStatus(GAME_TEXTS.dungeon.runEndedStatus);
    this.addDeathStats();
    publishDungeonDeathResetReport({
      result: event,
      nextScene: "ResultScene",
      state: getDungeonRunState()
    });
    this.time.delayedCall(650, () => this.showDefeatResult());
  }

  private handleFinalDoorOutcome(outcome: FinalDoorOutcome): void {
    this.syncGrodorEquipment();
    this.updateRunHud();

    if (outcome.victory) {
      addGrodorStat("sortiesReussies");
      this.grodor?.playVictory();
      this.setDungeonCombatLock(true);
      this.showVictoryResult();
    } else if (outcome.defeated) {
      this.grodor?.playDeath();
      this.setDungeonCombatLock(true);
      this.setStatus(GAME_TEXTS.dungeon.runEndedStatus);
      this.addDeathStats();
      publishDungeonDeathResetReport({
        result: outcome,
        nextScene: "ResultScene",
        state: getDungeonRunState()
      });
      this.time.delayedCall(650, () => this.showDefeatResult());
    } else {
      this.grodor?.playHurt();
      this.showFinalDoorPanel(outcome, () => this.retryFinalDoor());
    }

    publishDungeonFinalDoorReport({
      outcome,
      state: getDungeonRunState()
    });
  }

  private retryFinalDoor(): void {
    this.eventPanel?.destroy();
    this.eventPanel = undefined;
    this.awaitingContinue = false;
    this.resetDoorVisuals();
    this.resetGrodorToSpawn();
    this.grodor?.playIdle();
    this.updateRunHud();
    this.setStatus(GAME_TEXTS.dungeon.nextFloorStatus(getDungeonRunState().currentFloor));
    publishDungeonFinalDoorRetryReport({
      state: getDungeonRunState(),
      grodor: this.grodor ? { x: this.grodor.x, y: this.grodor.y, animation: this.grodor.currentAnimation } : undefined
    });
  }

  private showFinalDoorPanel(outcome: FinalDoorOutcome, onContinue: () => void): void {
    this.eventPanel?.destroy();
    this.eventPanel = new DungeonPanelFactory(this).createFinalDoorPanel(outcome, onContinue);
  }

  private showEventPanel(doorName: string, event: DungeonRunEvent): void {
    this.eventPanel?.destroy();
    this.eventPanel = new DungeonPanelFactory(this).createEventPanel(event, () => this.continueRun());

    publishDungeonEventReport({
      doorName,
      event,
      openedDoorLabel: GAME_TEXTS.dungeon.doorOpened(doorName.replace("door_", "")),
      state: event.state
    });
  }

  private showCombatResultPanel(result: CombatResult, canContinue: boolean, effectMessages: string[] = []): void {
    this.eventPanel?.destroy();
    this.eventPanel = new DungeonPanelFactory(this).createCombatResultPanel(result, canContinue, effectMessages, () => this.continueRun());

    publishDungeonCombatPanelReport({
      result,
      effectMessages,
      canContinue,
      state: getDungeonRunState()
    });
  }

  private continueRun(effectMessages: string[] = []): void {
    this.eventPanel?.destroy();
    this.eventPanel = undefined;
    this.awaitingContinue = false;
    const state = continueToNextFloor();

    // TODO: remplacer ce panneau temporaire par la vraie derniere porte/sortie quand le flow V1 sera porte.
    if (state.currentFloor <= 0) {
      this.awaitingContinue = true;
      this.setDungeonCombatLock(true);
      this.updateRunHud();
      this.setStatus(GAME_TEXTS.dungeon.exitReachedStatus);
      this.showRunExitPanel();
      return;
    }

    this.resetDoorVisuals();
    this.resetGrodorToSpawn();
    this.updateRunHud();
    this.setStatus(GAME_TEXTS.itemEffects.combined([GAME_TEXTS.dungeon.nextFloorStatus(state.currentFloor), ...effectMessages]));

    publishDungeonContinueReport({
      state,
      effectMessages,
      grodor: this.grodor ? { x: this.grodor.x, y: this.grodor.y } : undefined
    });
  }

  private showRunExitPanel(): void {
    this.eventPanel?.destroy();
    addGrodorStat("sortiesReussies");

    publishDungeonExitReport({
      state: getDungeonRunState()
    });
    this.showVictoryResult();
  }

  private resetDoorVisuals(): void {
    this.doorSprites.forEach((doorSprite, doorName) => {
      doorSprite.setTexture(this.getDoorTextureKey(doorName, "closed"));
      doorSprite.setAlpha(1);
    });
    this.prepareDoorChoicesFromCurrentDoors();
  }

  private prepareDoorChoicesFromCurrentDoors(): void {
    const doors = this.debugEntries
      .filter((entry) => entry.kind === "interactives" && /^door_[123]$/.test(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name));
    this.prepareDoorChoices(doors);
  }

  private prepareDoorChoices(doors: Array<Pick<DebugEntry, "name" | "x" | "y" | "width" | "height">>): void {
    this.clearDoorReadingHints();
    this.preparedDoorEventIds.clear();

    if (!this.options.doorInteractions) {
      return;
    }

    const forcedEventId = this.getForcedEventId();
    const finalDoor = getDungeonRunState().currentFloor === 1;
    const report: Array<{ doorName: string; eventId?: DungeonEventId; hint?: string }> = [];

    doors.forEach((door) => {
      const revealHint = shouldRevealDoorReadingHint();
      const eventId = !finalDoor && revealHint ? ((forcedEventId as DungeonEventId | undefined) ?? pickRandomDoorEventId()) : undefined;
      if (eventId) {
        this.preparedDoorEventIds.set(door.name, eventId);
      }

      const hint = revealHint
        ? finalDoor
          ? GAME_TEXTS.doorHints.exit
          : this.getDoorReadingHintLabel(eventId ? getDungeonEventDefinition(eventId) : undefined)
        : undefined;

      if (hint) {
        this.createDoorReadingHint(door, hint);
      }
      report.push({ doorName: door.name, eventId, hint });
    });

    publishDoorReadingReport({
      finalDoor,
      choices: report
    });
  }

  private createDoorReadingHint(door: Pick<DebugEntry, "x" | "y" | "width">, label: string): void {
    const hint = this.add
      .text(door.x + door.width / 2, door.y - 10, label, {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#fff1c2",
        align: "center",
        stroke: "#070402",
        strokeThickness: 5,
        shadow: { offsetX: 1, offsetY: 1, color: "#000000", blur: 2, fill: true }
      })
      .setOrigin(0.5, 1)
      .setDepth(52);
    this.doorReadingHintTexts.push(hint);
  }

  private clearDoorReadingHints(): void {
    this.doorReadingHintTexts.forEach((hint) => hint.destroy());
    this.doorReadingHintTexts = [];
  }

  private getDoorReadingHintLabel(definition: DungeonEventDefinition | undefined): string {
    if (!definition) {
      return GAME_TEXTS.doorHints.calm;
    }

    if (definition.kind === "combat") {
      return GAME_TEXTS.doorHints.combat;
    }
    if (definition.kind === "minigame") {
      return GAME_TEXTS.doorHints.minigame;
    }
    if (definition.kind === "life_loss") {
      return GAME_TEXTS.doorHints.danger;
    }
    if (definition.kind === "gold" || definition.kind === "life_gain" || definition.kind === "item") {
      return GAME_TEXTS.doorHints.gain;
    }

    return GAME_TEXTS.doorHints.calm;
  }

  private addDeathStats(): void {
    addGrodorStat("humiliations");
    addGrodorStat("mortsRidicules");
  }

  private resetGrodorToSpawn(): void {
    if (!this.grodor || !this.spawn) {
      return;
    }

    this.grodor.setPosition(this.spawn.x, this.spawn.y);
    this.grodor.playIdle();
    this.grodor.setFlipX(false);
  }

  private publishMovementReport(doorName: string, status: "moving" | "reached", path: TiledPoint[]): void {
    publishTiledMovementReport({
      doorName,
      status,
      path: path.map((point) => point.name),
      grodor: this.grodor
        ? {
            x: this.grodor.x,
            y: this.grodor.y,
            animation: this.grodor.currentAnimation
        }
        : undefined
    });
  }

  private publishReport(map: Phaser.Tilemaps.Tilemap, spawn: DebugEntry | undefined): void {
    const doors = this.debugEntries
      .filter((entry) => entry.kind === "interactives" && /^door_[123]$/.test(entry.name))
      .map((door) => ({
        name: door.name,
        path: this.getDoorPath(door.name).map((point) => point.name)
      }));

    publishTiledDebugReport({
      map: {
        width: map.width,
        height: map.height,
        tileWidth: map.tileWidth,
        tileHeight: map.tileHeight,
        widthInPixels: map.widthInPixels,
        heightInPixels: map.heightInPixels
      },
      spawn,
      doors,
      objects: this.debugEntries
    });
  }

}
