import Phaser from "phaser";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { ANIMATION_KEYS, IMAGE_ASSETS, JSON_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import {
  addDungeonInventoryItem,
  applyDungeonFloorDelta,
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
  type DungeonRunEvent,
  type DungeonRunState
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
import { playZoneMusic } from "../systems/audioManager";
import { playSfx } from "../systems/sfxManager";
import { addGrodorStat } from "../systems/grodorStats";
import { discoverShopItems, getDiscoveredShopItems } from "../systems/metaProgression";
import { shouldRevealDoorReadingHint } from "../systems/permanentUpgrades";
import { getDoorPathPoints, getInteractiveZones, getSpawnPoint, TiledPoint } from "../systems/tiledMap";
import { setHudVisible } from "../ui/hud";
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
  suppressMusic?: boolean;
};

const DEFAULT_DUNGEON_OPTIONS: DungeonSceneOptions = {
  doorInteractions: true,
  spawnGrodor: true,
  debugMenu: true,
  combatDebugRoute: true,
  summaryMode: "dungeon"
};

const COIN_FLIP_GOLD_TRANSFER = {
  pouch: { x: 1588, y: 276 },
  chest: { x: 842, y: 786 },
  chestWidth: 95,
  chestHeight: 84,
  coinWidth: 118,
  coinHeight: 78,
  maxVisibleCoins: 12,
  coinStaggerMs: 180,
  openMs: 140,
  travelMs: 1500,
  closeMs: 170,
  depthChest: 66,
  depthCoin: 92,
  amountText: { x: 1649, y: 338 }
};

const MINI_GAME_HEART_TRANSFER = {
  hudHeart: { x: 1669, y: 121 },
  heartWidth: 58,
  heartHeight: 54,
  maxVisibleHearts: 6,
  heartStaggerMs: 120,
  travelMs: 1400,
  depthHeart: 93,
  textLift: 78
};

const MINI_GAME_EFFECT_TEXT_COLORS = {
  positive: "#53e86d",
  neutral: "#ffffff",
  negative: "#ff4f4f"
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
  private pendingMiniGameReturnPath: TiledPoint[] = [];
  private pendingMiniGameDoorName?: string;
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
    if (!data.suppressMusic) {
      playZoneMusic(this, "dungeon");
    }
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
    this.pendingMiniGameReturnPath = [];
    this.pendingMiniGameDoorName = undefined;
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
    doorSprite.setTexture(this.getDoorTextureKey(doorName, "open"));
    playSfx("dungeonDoorOpen");
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
          this.pendingMiniGameReturnPath = [...path].reverse();
          this.pendingMiniGameDoorName = doorName;
          this.launchCombatEvent(event);
        } else if (event.kind === "minigame") {
          this.pendingMiniGameReturnPath = [...path].reverse();
          this.pendingMiniGameDoorName = doorName;
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
    // Persistent bottom-right story frame intentionally removed.
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

  private renderRunHudState(state: DungeonRunState): void {
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
    this.scene.bringToTop("CombatScene");
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
      event.id === "coin_flip" ||
      event.id === "bonneteau" ||
      event.id === "slot_machine" ||
      event.id === "dodge_chest" ||
      event.id === "jump" ||
      event.id === "arm_wrestling" ||
      event.id === "elevator"
        ? event.id
        : "loot_chest";
    this.scene.launch("MiniGameScene", {
      type: miniGameType,
      ownedInventory: getDungeonRunState().inventory,
      carriedGold: getDungeonRunState().carriedGold,
      life: getDungeonRunState().life,
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
      playZoneMusic(this, "dungeon");
      this.setDungeonOverlaysVisible(true);
      this.setDungeonCombatLock(false);
      if (combatResult) {
        setDungeonLifeForCombat(combatResult.grodorLife);
      }
      this.updateRunHud();
      if (combatResult) {
        this.pendingCombatEvent = false;
        if (combatResult.outcome === "death") {
          this.pendingMiniGameReturnPath = [];
          this.pendingMiniGameDoorName = undefined;
          this.handleCombatResult(combatResult);
        } else {
          this.returnFromMiniGameToSpawn(() => this.handleCombatResult(combatResult));
        }
      } else if (this.pendingCombatEvent) {
        this.pendingCombatEvent = false;
        this.returnFromMiniGameToSpawn(() => this.continueRun());
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
      playZoneMusic(this, "dungeon");
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
    if (this.isMiniGameResultFatal(result)) {
      this.pendingMiniGameReturnPath = [];
      this.pendingMiniGameDoorName = undefined;
      this.applyMiniGameResult(result);
      return;
    }

    this.returnFromMiniGameToSpawn(() => this.applyMiniGameResult(result));
  }

  private isMiniGameResultFatal(result: MiniGameResult): boolean {
    if (result.instantDeath) {
      return true;
    }

    const lifeLoss = Math.max(0, Math.abs(Math.min(0, Math.trunc(result.lifeDelta ?? 0))));
    return lifeLoss > 0 && getDungeonRunState().life - lifeLoss <= 0;
  }

  private returnFromMiniGameToSpawn(onComplete: () => void): void {
    const returnPath = [...this.pendingMiniGameReturnPath];
    const doorName = this.pendingMiniGameDoorName;
    this.pendingMiniGameReturnPath = [];
    this.pendingMiniGameDoorName = undefined;

    if (!this.grodor || returnPath.length === 0) {
      this.resetGrodorToSpawn();
      onComplete();
      return;
    }

    this.awaitingContinue = true;
    this.setDungeonCombatLock(true);
    this.moving = true;
    this.grodor.playWalk();
    this.setStatus(GAME_TEXTS.dungeon.returningToSpawn);
    this.walkMiniGameReturnPath(returnPath, 0, () => {
      this.moving = false;
      this.resetGrodorToSpawn();
      if (doorName) {
        this.publishMovementReport(doorName, "returned", returnPath);
      }
      onComplete();
    });
  }

  private walkMiniGameReturnPath(path: TiledPoint[], index: number, onComplete: () => void): void {
    if (!this.grodor) {
      onComplete();
      return;
    }

    const point = path[index];
    const distance = Phaser.Math.Distance.Between(this.grodor.x, this.grodor.y, point.x, point.y);
    this.grodor.setFlipX(point.x < this.grodor.x);

    this.tweens.add({
      targets: this.grodor.container,
      x: point.x,
      y: point.y,
      duration: Phaser.Math.Clamp(distance * 2.4, 180, 760),
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (index < path.length - 1) {
          this.walkMiniGameReturnPath(path, index + 1, onComplete);
          return;
        }

        onComplete();
      }
    });
  }

  private applyMiniGameResult(result: MiniGameResult): void {
    const effectMessages: string[] = [];
    const beforeState = getDungeonRunState();
    if (result.outcome === "success") {
      addGrodorStat("miniJeuxReussis");
      playSfx("miniGameSuccess");
    } else if (result.outcome === "failure") {
      playSfx("miniGameFail");
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
    if (result.floorDelta) {
      const floorResult = applyDungeonFloorDelta(result.floorDelta);
      effectMessages.push(...floorResult.effectMessages);
    }
    if (result.maxLifeLoss) {
      decreaseRunMaxLife(result.maxLifeLoss);
    }
    if (result.maxLifeDelta) {
      increaseRunMaxLife(result.maxLifeDelta);
    }
    if ((result.lifeDelta ?? 0) < 0) {
      if (result.type !== "jump") {
        playSfx("grodorHurt");
      }
      const lossResult = applyHeartLossWithCowardReflex(Math.abs(result.lifeDelta ?? 0), "dungeon_event");
      effectMessages.push(...lossResult.effectMessages);
      this.playItemBreakSfx(lossResult.brokenItems);
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
      playSfx("itemPickup");
    }

    this.syncGrodorEquipment();
    const afterState = getDungeonRunState();
    const heartDelta = result.type === "jump" ? 0 : this.getMiniGameHeartDelta(beforeState, afterState);
    const hasGoldTransfer = this.hasMiniGameGoldTransfer(result);
    const hasFloorTransfer = this.hasMiniGameFloorTransfer(result);
    if (heartDelta > 0) {
      this.renderRunHudState(beforeState);
    } else {
      this.updateRunHud();
    }
    if (getDungeonRunState().life <= 0) {
      const showDefeat = () => {
        this.awaitingContinue = true;
        this.setDungeonCombatLock(true);
        this.grodor?.playDeath();
        playSfx("grodorDeath");
        this.addDeathStats();
        this.showDefeatResult();
      };
      if (heartDelta < 0) {
        this.awaitingContinue = true;
        this.setDungeonCombatLock(true);
        this.grodor?.playHurt();
        this.playMiniGameHeartTransfer(heartDelta, showDefeat);
        return;
      }

      showDefeat();
      return;
    }
    if (hasFloorTransfer && !hasGoldTransfer && heartDelta === 0 && !result.followUpMiniGame) {
      this.awaitingContinue = true;
      this.setDungeonCombatLock(true);
      this.continueRun(effectMessages);
      this.awaitingContinue = true;
      this.setDungeonCombatLock(true);
      if ((result.floorDelta ?? 0) < 0) {
        this.grodor?.playVictory();
      } else {
        this.grodor?.playHurt();
      }
      this.time.delayedCall(80, () => {
        this.playMiniGameFloorTransfer(result, () => {
          this.awaitingContinue = false;
          this.setDungeonCombatLock(false);
        });
      });
      return;
    }
    if (result.followUpMiniGame) {
      if (hasGoldTransfer || heartDelta !== 0 || hasFloorTransfer) {
        this.awaitingContinue = true;
        this.setDungeonCombatLock(true);
        if (heartDelta > 0) {
          this.grodor?.playVictory();
        } else if (heartDelta < 0) {
          this.grodor?.playHurt();
        } else if ((result.floorDelta ?? 0) < 0) {
          this.grodor?.playVictory();
        } else if ((result.floorDelta ?? 0) > 0) {
          this.grodor?.playHurt();
        }
        this.playMiniGameResultTransfers(result, heartDelta, () => this.launchMiniGameEvent(resolveDoorEvent(result.followUpMiniGame!)));
        return;
      }

      this.launchMiniGameEvent(resolveDoorEvent(result.followUpMiniGame));
      return;
    }
    if (hasGoldTransfer || heartDelta !== 0 || hasFloorTransfer) {
      this.awaitingContinue = true;
      this.setDungeonCombatLock(true);
      if (heartDelta > 0) {
        this.grodor?.playVictory();
      } else if (heartDelta < 0) {
        this.grodor?.playHurt();
      } else if ((result.floorDelta ?? 0) < 0) {
        this.grodor?.playVictory();
      } else if ((result.floorDelta ?? 0) > 0) {
        this.grodor?.playHurt();
      }
      this.playMiniGameResultTransfers(result, heartDelta, () => this.continueRun(effectMessages));
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
      this.setDungeonCombatLock(true);
      this.grodor?.playIdle();
      this.setStatus(GAME_TEXTS.dungeon.combatWonStatus);
      if (result.goldReward > 0) {
        this.grodor?.playVictory();
        this.playMiniGameResultTransfers(
          {
            type: "loot_chest",
            outcome: "success",
            goldDelta: result.goldReward
          },
          0,
          () => this.continueRun(goldResult.effectMessages)
        );
        return;
      }

      this.continueRun(goldResult.effectMessages);
      return;
    }

    this.awaitingContinue = true;
    this.setDungeonCombatLock(true);
    this.grodor?.playDeath();
    playSfx("grodorDeath");
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

  private playItemBreakSfx(brokenItems: string[] = []): void {
    if (brokenItems.length > 0) {
      playSfx("itemBreak");
    }
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
      this.awaitingContinue = true;
      this.setDungeonCombatLock(true);
      this.grodor?.playHurt();
      if (outcome.lifeDelta < 0) {
        playSfx("grodorHurt");
      }
      this.setStatus(outcome.message);
      this.playMiniGameHeartTransfer(outcome.lifeDelta, () => this.retryFinalDoor());
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
    this.setDungeonCombatLock(false);
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

  private getMiniGameHeartDelta(before: DungeonRunState, after: DungeonRunState): number {
    const maxLifeDelta = after.maxLife - before.maxLife;
    if (maxLifeDelta !== 0) {
      return maxLifeDelta;
    }

    return after.life - before.life;
  }

  private hasMiniGameGoldTransfer(result: MiniGameResult): boolean {
    return result.goldDelta !== undefined || result.goldLoss !== undefined;
  }

  private hasMiniGameFloorTransfer(result: MiniGameResult): boolean {
    return result.floorDelta !== undefined && result.floorDelta !== 0;
  }

  private playMiniGameResultTransfers(result: MiniGameResult, heartDelta: number, onComplete: () => void): void {
    const complete = () => {
      if (heartDelta > 0) {
        this.updateRunHud();
      }
      onComplete();
    };
    const playFloorTransfer = () => {
      if (this.hasMiniGameFloorTransfer(result)) {
        this.playMiniGameFloorTransfer(result, complete);
        return;
      }

      complete();
    };
    const playHeartTransfer = () => {
      if (heartDelta !== 0) {
        this.playMiniGameHeartTransfer(heartDelta, playFloorTransfer);
        return;
      }

      playFloorTransfer();
    };

    if (this.hasMiniGameGoldTransfer(result)) {
      this.playCoinFlipGoldTransfer(result, playHeartTransfer);
      return;
    }

    playHeartTransfer();
  }

  private playMiniGameFloorTransfer(result: MiniGameResult, onComplete: () => void): void {
    const floorDelta = Math.trunc(result.floorDelta ?? 0);
    if (floorDelta === 0) {
      onComplete();
      return;
    }

    const x = this.grodor?.x ?? WORLD_WIDTH / 2;
    const y = (this.grodor?.y ?? WORLD_HEIGHT / 2) - 150;
    const isDown = floorDelta < 0;
    const amountText = this.add
      .text(x, y, isDown ? GAME_TEXTS.miniGames.elevator.resultFloorDown : GAME_TEXTS.miniGames.elevator.resultFloorUp, {
        fontFamily: "Georgia, serif",
        fontSize: "52px",
        color: this.getMiniGameEffectTextColor(isDown ? 1 : -1),
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(COIN_FLIP_GOLD_TRANSFER.depthCoin + 2)
      .setAlpha(0)
      .setScale(0.82);

    this.tweens.add({
      targets: amountText,
      alpha: 1,
      y: y - 38,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 260,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: amountText,
          alpha: 0,
          y: y - 92,
          delay: 720,
          duration: 380,
          ease: "Sine.easeIn",
          onComplete: () => {
            amountText.destroy();
            onComplete();
          }
        });
      }
    });
  }

  private playMiniGameHeartTransfer(delta: number, onComplete: () => void): void {
    const amount = Math.abs(Math.trunc(delta));
    if (amount <= 0) {
      onComplete();
      return;
    }

    const isGain = delta > 0;
    const visibleHearts = Math.min(amount, MINI_GAME_HEART_TRANSFER.maxVisibleHearts);
    const grodorPoint = {
      x: this.grodor?.x ?? WORLD_WIDTH / 2,
      y: (this.grodor?.y ?? WORLD_HEIGHT / 2) - 118
    };
    const hudPoint = MINI_GAME_HEART_TRANSFER.hudHeart;
    const from = isGain ? grodorPoint : hudPoint;
    const to = isGain ? hudPoint : grodorPoint;

    this.showMiniGameGrodorPvText(delta);

    let completedHearts = 0;
    for (let index = 0; index < visibleHearts; index += 1) {
      this.time.delayedCall(index * MINI_GAME_HEART_TRANSFER.heartStaggerMs, () => {
        this.createMiniGameTransferHeart(index, visibleHearts, isGain, from, to, () => {
          completedHearts += 1;
          if (completedHearts >= visibleHearts) {
            this.time.delayedCall(120, onComplete);
          }
        });
      });
    }
  }

  private showMiniGameGrodorPvText(delta: number): void {
    const x = this.grodor?.x ?? WORLD_WIDTH / 2;
    const y = (this.grodor?.y ?? WORLD_HEIGHT / 2) - 170;
    const amountText = this.add
      .text(x, y, GAME_TEXTS.dungeon.pvDelta(delta), {
        fontFamily: "Georgia, serif",
        fontSize: "48px",
        color: this.getMiniGameEffectTextColor(delta),
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(MINI_GAME_HEART_TRANSFER.depthHeart + 2)
      .setAlpha(0)
      .setScale(0.82);

    this.tweens.add({
      targets: amountText,
      alpha: 1,
      y: y - MINI_GAME_HEART_TRANSFER.textLift * 0.45,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 260,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: amountText,
          alpha: 0,
          y: y - MINI_GAME_HEART_TRANSFER.textLift,
          delay: 620,
          duration: 360,
          ease: "Sine.easeIn",
          onComplete: () => amountText.destroy()
        });
      }
    });
  }

  private createMiniGameTransferHeart(
    index: number,
    total: number,
    isGain: boolean,
    from: { x: number; y: number },
    to: { x: number; y: number },
    onComplete: () => void
  ): void {
    const spread = (index - (total - 1) / 2) * 18;
    const start = { x: from.x + spread, y: from.y + Math.sin(index) * 9 };
    const end = { x: to.x + spread * 0.22, y: to.y + Math.cos(index) * 8 };
    const mid = {
      x: (start.x + end.x) / 2,
      y: Math.min(start.y, end.y) - 132 - (index % 3) * 18
    };
    const heart = this.add
      .image(start.x, start.y, isGain ? IMAGE_ASSETS.heartFull.key : IMAGE_ASSETS.heartBrake.key)
      .setDisplaySize(MINI_GAME_HEART_TRANSFER.heartWidth, MINI_GAME_HEART_TRANSFER.heartHeight)
      .setDepth(MINI_GAME_HEART_TRANSFER.depthHeart)
      .setAlpha(0);
    const heartScaleX = heart.scaleX;
    const heartScaleY = heart.scaleY;
    heart.setScale(heartScaleX * 0.78, heartScaleY * 0.78);
    const progress = { value: 0 };

    this.tweens.add({
      targets: heart,
      alpha: 1,
      scaleX: heartScaleX,
      scaleY: heartScaleY,
      duration: 120,
      ease: "Back.easeOut"
    });
    this.tweens.add({
      targets: progress,
      value: 1,
      duration: MINI_GAME_HEART_TRANSFER.travelMs + index * 20,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const t = progress.value;
        const inv = 1 - t;
        const x = inv * inv * start.x + 2 * inv * t * mid.x + t * t * end.x;
        const y = inv * inv * start.y + 2 * inv * t * mid.y + t * t * end.y;
        heart.setPosition(x, y);
        heart.setAngle((isGain ? 22 : -34) * Math.sin(t * Math.PI * 2));
        if (t > 0.8) {
          const fade = Math.max(0, (1 - t) / 0.2);
          heart.setAlpha(fade);
        }
      },
      onComplete: () => {
        heart.destroy();
        onComplete();
      }
    });
  }

  private getMiniGameEffectTextColor(delta: number): string {
    if (delta > 0) {
      return MINI_GAME_EFFECT_TEXT_COLORS.positive;
    }
    if (delta < 0) {
      return MINI_GAME_EFFECT_TEXT_COLORS.negative;
    }

    return MINI_GAME_EFFECT_TEXT_COLORS.neutral;
  }

  private playCoinFlipGoldTransfer(result: MiniGameResult, onComplete: () => void): void {
    const direction =
      (result.goldDelta ?? 0) > 0 ? "chest-to-pouch" : (result.goldLoss ?? 0) > 0 ? "pouch-to-chest" : undefined;
    if (!direction) {
      this.showCoinFlipNeutralGoldText(result, onComplete);
      return;
    }

    const amount = Math.max(1, Math.trunc(result.goldDelta ?? result.goldLoss ?? 1));
    const visibleCoins = Math.min(amount, COIN_FLIP_GOLD_TRANSFER.maxVisibleCoins);
    const from = direction === "chest-to-pouch" ? COIN_FLIP_GOLD_TRANSFER.chest : COIN_FLIP_GOLD_TRANSFER.pouch;
    const to = direction === "chest-to-pouch" ? COIN_FLIP_GOLD_TRANSFER.pouch : COIN_FLIP_GOLD_TRANSFER.chest;
    const chest = this.add
      .image(COIN_FLIP_GOLD_TRANSFER.chest.x, COIN_FLIP_GOLD_TRANSFER.chest.y, IMAGE_ASSETS.dungeonChestOpen.key)
      .setDisplaySize(COIN_FLIP_GOLD_TRANSFER.chestWidth, COIN_FLIP_GOLD_TRANSFER.chestHeight)
      .setDepth(COIN_FLIP_GOLD_TRANSFER.depthChest)
      .setAlpha(0);
    const amountText = this.add
      .text(
        COIN_FLIP_GOLD_TRANSFER.amountText.x,
        COIN_FLIP_GOLD_TRANSFER.amountText.y,
        GAME_TEXTS.dungeon.poDelta(amount, direction === "chest-to-pouch" ? "+" : "-"),
        {
          fontFamily: "Georgia, serif",
          fontSize: "42px",
          color: this.getMiniGameEffectTextColor(direction === "chest-to-pouch" ? amount : -amount),
          align: "center",
          stroke: "#120d0a",
          strokeThickness: 7
        }
      )
      .setOrigin(0.5)
      .setDepth(COIN_FLIP_GOLD_TRANSFER.depthCoin + 1)
      .setAlpha(0);
    this.showCoinFlipGrodorAmountText(direction, amount);

    this.tweens.add({
      targets: chest,
      alpha: 1,
      duration: COIN_FLIP_GOLD_TRANSFER.openMs,
      onComplete: () => {
        playSfx(direction === "chest-to-pouch" ? "goldGain" : "goldLoss");
        this.tweens.add({
          targets: amountText,
          alpha: 1,
          y: COIN_FLIP_GOLD_TRANSFER.amountText.y - 18,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 220,
          yoyo: true,
          hold: 420,
          onComplete: () => {
            amountText.destroy();
          }
        });

        let completedCoins = 0;
        for (let index = 0; index < visibleCoins; index += 1) {
          this.time.delayedCall(index * COIN_FLIP_GOLD_TRANSFER.coinStaggerMs, () => {
            this.createCoinFlipTransferCoin(index, visibleCoins, direction, from, to, () => {
              completedCoins += 1;
              if (completedCoins >= visibleCoins) {
                this.tweens.add({
                  targets: chest,
                  alpha: 0,
                  delay: 120,
                  duration: COIN_FLIP_GOLD_TRANSFER.closeMs,
                  onComplete: () => {
                    chest.destroy();
                    onComplete();
                  }
                });
              }
            });
          });
        }
      }
    });
  }

  private showCoinFlipNeutralGoldText(result: MiniGameResult, onComplete: () => void): void {
    const sign: "+" | "-" = result.goldLoss !== undefined ? "-" : "+";
    const amount = Math.max(0, Math.trunc(result.goldDelta ?? result.goldLoss ?? 0));
    const x = this.grodor?.x ?? WORLD_WIDTH / 2;
    const y = (this.grodor?.y ?? WORLD_HEIGHT / 2) - 150;
    const amountText = this.add
      .text(x, y, GAME_TEXTS.dungeon.poDelta(amount, sign), {
        fontFamily: "Georgia, serif",
        fontSize: "46px",
        color: this.getMiniGameEffectTextColor(0),
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(COIN_FLIP_GOLD_TRANSFER.depthCoin + 2)
      .setAlpha(0)
      .setScale(0.82);

    this.tweens.add({
      targets: amountText,
      alpha: 1,
      y: y - 34,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 260,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: amountText,
          alpha: 0,
          y: y - 78,
          delay: 620,
          duration: 360,
          ease: "Sine.easeIn",
          onComplete: () => {
            amountText.destroy();
            onComplete();
          }
        });
      }
    });
  }

  private showCoinFlipGrodorAmountText(direction: "chest-to-pouch" | "pouch-to-chest", amount: number): void {
    const x = this.grodor?.x ?? WORLD_WIDTH / 2;
    const y = (this.grodor?.y ?? WORLD_HEIGHT / 2) - 150;
    const amountText = this.add
      .text(x, y, GAME_TEXTS.dungeon.poDelta(amount, direction === "chest-to-pouch" ? "+" : "-"), {
        fontFamily: "Georgia, serif",
        fontSize: "46px",
        color: this.getMiniGameEffectTextColor(direction === "chest-to-pouch" ? amount : -amount),
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(COIN_FLIP_GOLD_TRANSFER.depthCoin + 2)
      .setAlpha(0)
      .setScale(0.82);

    this.tweens.add({
      targets: amountText,
      alpha: 1,
      y: y - 34,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 260,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: amountText,
          alpha: 0,
          y: y - 78,
          delay: 620,
          duration: 360,
          ease: "Sine.easeIn",
          onComplete: () => amountText.destroy()
        });
      }
    });
  }

  private createCoinFlipTransferCoin(
    index: number,
    total: number,
    direction: "chest-to-pouch" | "pouch-to-chest",
    from: { x: number; y: number },
    to: { x: number; y: number },
    onComplete: () => void
  ): void {
    const spread = (index - (total - 1) / 2) * 14;
    const start = { x: from.x + spread, y: from.y + Math.sin(index) * 10 };
    const end = { x: to.x + spread * 0.24, y: to.y + Math.cos(index) * 8 };
    const mid = {
      x: (start.x + end.x) / 2,
      y: Math.min(start.y, end.y) - 150 - (index % 3) * 24
    };
    const coin = this.add
      .image(start.x, start.y, IMAGE_ASSETS.gold.key)
      .setDisplaySize(COIN_FLIP_GOLD_TRANSFER.coinWidth, COIN_FLIP_GOLD_TRANSFER.coinHeight)
      .setDepth(COIN_FLIP_GOLD_TRANSFER.depthCoin)
      .setAlpha(0);
    const progress = { value: 0 };

    this.tweens.add({
      targets: coin,
      alpha: 1,
      duration: 80
    });
    this.tweens.add({
      targets: progress,
      value: 1,
      duration: COIN_FLIP_GOLD_TRANSFER.travelMs + index * 18,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const t = progress.value;
        const inv = 1 - t;
        const x = inv * inv * start.x + 2 * inv * t * mid.x + t * t * end.x;
        const y = inv * inv * start.y + 2 * inv * t * mid.y + t * t * end.y;
        coin.setPosition(x, y);
        coin.setAngle((direction === "chest-to-pouch" ? 420 : -420) * t);
        if (t > 0.78) {
          const fade = Math.max(0, (1 - t) / 0.22);
          coin.setAlpha(fade);
        }
      },
      onComplete: () => {
        coin.destroy();
        onComplete();
      }
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
    this.setDungeonCombatLock(false);
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

  private publishMovementReport(doorName: string, status: "moving" | "reached" | "returned", path: TiledPoint[]): void {
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
