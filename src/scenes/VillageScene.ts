import Phaser from "phaser";
import { GrodorActor } from "../actors/GrodorActor";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { IMAGE_ASSETS, INVENTORY_ITEM_ASSETS, JSON_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { CombatResult } from "../data/combatResults";
import {
  publishGrodorHouseReport,
  publishVillageCombatDebugReport,
  publishVillageMiniGameDebugReport,
  publishVillageMovementReport,
  publishVillagePanelReport,
  publishVillageReport,
  publishVillageReturnReport
} from "../debug/debugReports";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  EquipmentSlotId,
  getEquipmentSlot,
  getItemDefinition
} from "../data/itemDefinitions";
import { MonsterId } from "../data/monsterDefinitions";
import {
  addDungeonGoldForDebug,
  addDungeonGoldReward,
  addDungeonInventoryItem,
  adjustDungeonLifeForDebug,
  applyHeartLossWithCowardReflex,
  applyDungeonRunDebugOverrides,
  decreaseRunMaxLife,
  forceDungeonRunDeath,
  getDungeonRunState,
  increaseRunMaxLife,
  loseCarriedGold,
  removeDungeonEquipmentItem,
  resolveDoorEvent,
  setDungeonEquipmentForDebug
} from "../systems/dungeonRunState";
import { resetAllLocalProgressDebug } from "../systems/fullProgressReset";
import { calculateGrodorScore, getGrodorStats } from "../systems/grodorStats";
import {
  addOwnedItem,
  discoverShopItems,
  equipStartingItem,
  getDiscoveredShopItems,
  getMaxStartingEquipmentCount,
  getOwnedItemCount,
  getOwnedItemCounts,
  getOwnedItems,
  getStartingLoadout,
  getStartingLoadoutCount,
  unequipStartingSlot
} from "../systems/metaProgression";
import { getPermanentUpgrades } from "../systems/permanentUpgrades";
import { getInteractiveZones, getPathPoints, getSpawnPoint, TiledPoint, TiledZone } from "../systems/tiledMap";
import { markVillageDiscovered } from "../systems/villageDiscovery";
import { setLetterboxBackdrop } from "../ui/letterboxBackdrop";
import { createNineSlicePanel } from "../ui/nineSlicePanel";
import { setHudVisible } from "../ui/hud";
import { InventoryEquipmentPanel } from "../ui/InventoryEquipmentPanel";
import { DungeonDebugMenu } from "../ui/DungeonDebugMenu";
import { createItemDescriptionBubble } from "../ui/itemDescriptionBubble";
import { VillageBankPanel } from "../ui/village/VillageBankPanel";
import { VillageShopPanel } from "../ui/village/VillageShopPanel";
import { MiniGameResult } from "./MiniGameScene";

type VillageBuildingId = "bank" | "shop" | "tavern" | "board" | "grodor_house";

type VillageSceneData = {
  fromDungeon?: boolean;
  fromTavern?: boolean;
};

const BUILDINGS: VillageBuildingId[] = ["bank", "shop", "tavern", "board", "grodor_house"];
const BUILDING_TEXT = {
  bank: GAME_TEXTS.village.bank,
  shop: GAME_TEXTS.village.shop,
  tavern: GAME_TEXTS.village.tavern,
  board: GAME_TEXTS.village.board,
  grodor_house: GAME_TEXTS.village.grodorHouse
} satisfies Record<VillageBuildingId, { label: string; title: string; message: string; effectLabel: string }>;

const HOUSE_EQUIPMENT_PANEL = {
  width: 1116,
  height: 971,
  displayWidth: 862,
  displayHeight: 750,
  x: -320,
  y: 6,
  grodor: { x: 452, y: 628 },
  allSlots: [
    { x: 214, y: 250 },
    { x: 444, y: 198 },
    { x: 674, y: 250 },
    { x: 214, y: 473 },
    { x: 674, y: 473 },
    { x: 214, y: 746 },
    { x: 444, y: 746 },
    { x: 674, y: 746 }
  ],
  keySlots: [
    { x: 901, y: 201 },
    { x: 901, y: 392 },
    { x: 901, y: 583 },
    { x: 901, y: 774 }
  ],
  loadoutCounter: { x: 214, y: 122 },
  closeButton: { x: 1054, y: 55, hitSize: 94 },
  extraLabels: [{ x: 674, y: 250, label: GAME_TEXTS.inventory.equipmentSlotLabels.cape }],
  slots: {
    weapon: { x: 214, y: 250 },
    helmet: { x: 444, y: 198 },
    amulet: { x: 674, y: 746 },
    gloves: { x: 214, y: 473 },
    object: { x: 444, y: 746 },
    boots: { x: 674, y: 473 }
  } satisfies Record<EquipmentSlotId, { x: number; y: number }>
};

const HOUSE_EQUIPMENT_SLOT_IDS = ["weapon", "helmet", "amulet", "gloves", "object", "boots"] satisfies EquipmentSlotId[];

const HOUSE_CHEST_PANEL = {
  width: 407,
  height: 612,
  displayWidth: 488,
  displayHeight: 734,
  x: 548,
  y: 8,
  slots: [
    { x: 70, y: 101 },
    { x: 136, y: 101 },
    { x: 202, y: 101 },
    { x: 268, y: 101 },
    { x: 334, y: 101 },
    { x: 70, y: 185 },
    { x: 136, y: 185 },
    { x: 202, y: 185 },
    { x: 268, y: 185 },
    { x: 334, y: 185 },
    { x: 70, y: 269 },
    { x: 136, y: 269 },
    { x: 202, y: 269 },
    { x: 268, y: 269 },
    { x: 334, y: 269 },
    { x: 70, y: 353 },
    { x: 136, y: 353 },
    { x: 202, y: 353 },
    { x: 268, y: 353 },
    { x: 334, y: 353 },
    { x: 70, y: 437 },
    { x: 136, y: 437 },
    { x: 202, y: 437 },
    { x: 268, y: 437 },
    { x: 334, y: 437 },
    { x: 70, y: 521 },
    { x: 136, y: 521 },
    { x: 202, y: 521 },
    { x: 268, y: 521 },
    { x: 334, y: 521 }
  ]
};

export class VillageScene extends Phaser.Scene {
  private map?: Phaser.Tilemaps.Tilemap;
  private grodor?: GrodorActor;
  private villageSpawn?: TiledPoint;
  private fromDungeon = false;
  private fromTavern = false;
  private hasEnteredVillage = true;
  private moving = false;
  private activeBuilding?: VillageBuildingId;
  private panel?: Phaser.GameObjects.Container;
  private statusText?: Phaser.GameObjects.Text;
  private villagePouchOverlay?: Phaser.GameObjects.Image;
  private villageInventoryOverlay?: Phaser.GameObjects.Image;
  private villageGoldBubble?: Phaser.GameObjects.Ellipse;
  private villageGoldText?: Phaser.GameObjects.Text;
  private villageBankGoldBubble?: Phaser.GameObjects.Ellipse;
  private villageBankGoldText?: Phaser.GameObjects.Text;
  private inventoryHitZone?: Phaser.GameObjects.Zone;
  private inventoryPanel?: InventoryEquipmentPanel;
  private debugMenu?: DungeonDebugMenu;
  private shopPanel?: VillageShopPanel;
  private itemDescriptionBubble?: Phaser.GameObjects.Container;
  private readonly importedCarriedShopItems = new Set<string>();
  private readonly zones = new Map<VillageBuildingId, Phaser.GameObjects.Zone>();

  constructor() {
    super("VillageScene");
  }

  create(data: VillageSceneData = {}): void {
    this.resetSceneRuntime();
    setHudVisible(false);
    setLetterboxBackdrop(IMAGE_ASSETS.villageBackground.path);
    this.fromDungeon = Boolean(data.fromDungeon) || new URLSearchParams(window.location.search).get("fromDungeon") === "1";
    this.fromTavern = Boolean(data.fromTavern);
    const params = new URLSearchParams(window.location.search);
    if (IS_DEBUG_TOOLS_ENABLED && params.get("scene") === "village") {
      applyDungeonRunDebugOverrides(params);
    }
    if (this.fromDungeon) {
      markVillageDiscovered();
    }
    this.hasEnteredVillage = !this.fromDungeon;
    this.map = this.make.tilemap({ key: JSON_ASSETS.villageMap.key });
    this.add.image(0, 0, IMAGE_ASSETS.villageBackground.key).setOrigin(0).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.createVillageHudOverlays();

    this.villageSpawn = this.findSpawn(["spawn_grodor_village"]);
    const dungeonSpawn = this.findSpawn(["spawn_dungeon", "spawn_grodor_from_dungeon", "spawn_from_dungeon"]);
    const tavernSpawn = this.findSpawn(["spawn_from_tavern"]);
    const start = this.fromDungeon ? dungeonSpawn ?? this.villageSpawn : this.fromTavern ? tavernSpawn ?? this.villageSpawn : this.villageSpawn;

    if (start) {
      this.grodor = new GrodorActor(this, start.x, start.y);
      this.grodor.container.setDepth(20);
      this.grodor.setEquipment(this.getVillageDisplayedEquipment());
      this.grodor.playIdle();
    }

    this.createInteractives();
    this.createStatusPanel();
    if (IS_DEBUG_TOOLS_ENABLED) {
      this.createDebugMenu();
    }
    this.updateVillageHudOverlays();
    this.setStatus(this.fromDungeon ? GAME_TEXTS.village.arrivedFromDungeon : GAME_TEXTS.village.chooseBuilding);
    this.publishReport();
  }

  private resetSceneRuntime(): void {
    this.shopPanel?.destroy();
    if (!this.shopPanel) {
      this.panel?.destroy();
    }
    this.inventoryPanel?.destroy();
    this.itemDescriptionBubble?.destroy();
    this.map = undefined;
    this.grodor = undefined;
    this.villageSpawn = undefined;
    this.moving = false;
    this.activeBuilding = undefined;
    this.fromTavern = false;
    this.panel = undefined;
    this.statusText = undefined;
    this.villagePouchOverlay = undefined;
    this.villageInventoryOverlay = undefined;
    this.villageGoldBubble = undefined;
    this.villageGoldText = undefined;
    this.villageBankGoldBubble = undefined;
    this.villageBankGoldText = undefined;
    this.inventoryHitZone = undefined;
    this.inventoryPanel = undefined;
    this.debugMenu = undefined;
    this.shopPanel = undefined;
    this.itemDescriptionBubble = undefined;
    this.importedCarriedShopItems.clear();
    this.zones.clear();
  }

  private createVillageHudOverlays(): void {
    this.villagePouchOverlay = this.add
      .image(0, 0, IMAGE_ASSETS.villagePouchEmpty.key)
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(55);
    this.villageGoldBubble = this.add.ellipse(126, 214, 62, 42, 0x090604, 0.82).setDepth(57);
    this.villageGoldBubble.setStrokeStyle(2, 0xf0c071, 0.95);
    this.villageGoldText = this.add
      .text(126, 212, "0", {
        fontFamily: "Georgia, serif",
        fontSize: "27px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(58);
    this.villageBankGoldBubble = this.add.ellipse(602, 477, 74, 48, 0x090604, 0.84).setDepth(57);
    this.villageBankGoldBubble.setStrokeStyle(2, 0xf0c071, 0.95);
    this.villageBankGoldText = this.add
      .text(602, 475, "0", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(58);
    this.villageInventoryOverlay = this.add
      .image(0, 0, IMAGE_ASSETS.villageInventoryEmpty.key)
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(56);
    this.inventoryHitZone = this.add
      .zone(338, 140, 150, 150)
      .setDepth(59)
      .setInteractive({ useHandCursor: true });
    this.inventoryHitZone.on("pointerdown", () => this.openInventoryPanel());
  }

  private updateVillageHudOverlays(): void {
    const state = getDungeonRunState();
    const hasCarriedEquipment = this.getVillageDisplayedEquipment().length > 0;
    this.villagePouchOverlay?.setTexture(
      state.carriedGold > 0 ? IMAGE_ASSETS.villagePouchFull.key : IMAGE_ASSETS.villagePouchEmpty.key
    );
    this.villageGoldBubble?.setVisible(state.carriedGold > 0);
    this.villageGoldText?.setVisible(state.carriedGold > 0);
    this.villageGoldText?.setText(String(state.carriedGold));
    this.villageBankGoldBubble?.setVisible(state.bankGold > 0);
    this.villageBankGoldText?.setVisible(state.bankGold > 0);
    this.villageBankGoldText?.setText(String(state.bankGold));
    this.villageInventoryOverlay?.setTexture(
      state.inventory.length > 0 || hasCarriedEquipment ? IMAGE_ASSETS.villageInventoryFull.key : IMAGE_ASSETS.villageInventoryEmpty.key
    );
    this.updateVillageDebugMenu();
  }

  private openInventoryPanel(): void {
    if (this.inventoryPanel || this.panel || this.moving) {
      return;
    }

    this.setInputsEnabled(false);
    this.inventoryPanel = new InventoryEquipmentPanel(this, this.getVillageDisplayedEquipment(), () => this.closeInventoryPanel());
  }

  private closeInventoryPanel(): void {
    if (!this.inventoryPanel) {
      return;
    }

    this.inventoryPanel.destroy();
    this.inventoryPanel = undefined;
    this.setInputsEnabled(true);
    this.updateVillageHudOverlays();
  }

  private createDebugMenu(): void {
    this.debugMenu = new DungeonDebugMenu(
      this,
      (items) => {
        const state = setDungeonEquipmentForDebug(items);
        this.grodor?.setEquipment(state.equipment);
        this.grodor?.playIdle();
        this.updateVillageHudOverlays();
        this.setStatus(state.lastEvent);
      },
      (monsterId) => this.launchCombatDebug(monsterId),
      (eventId) => this.launchMiniGameDebug(eventId),
      (delta) => {
        const state = adjustDungeonLifeForDebug(delta);
        this.grodor?.setEquipment(state.equipment);
        this.grodor?.playIdle();
        this.updateVillageHudOverlays();
        this.setStatus(state.lastEvent);
      },
      () => {
        const state = addDungeonGoldForDebug(10);
        this.updateVillageHudOverlays();
        this.setStatus(state.lastEvent);
      },
      () => {
        resetAllLocalProgressDebug();
        this.reloadGameFromStart();
      },
      () => this.setStatus(GAME_TEXTS.village.chooseBuilding)
    );
    this.updateVillageDebugMenu();
  }

  private reloadGameFromStart(): void {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    window.location.href = url.toString();
  }

  private updateVillageDebugMenu(): void {
    this.debugMenu?.update(getDungeonRunState());
  }

  private getVillageDisplayedEquipment(): string[] {
    return Object.values(this.getVillageDisplayedEquipmentBySlot()).filter(Boolean);
  }

  private getVillageDisplayedEquipmentBySlot(): Partial<Record<EquipmentSlotId, string>> {
    const displayedEquipment: Partial<Record<EquipmentSlotId, string>> = {};
    getDungeonRunState().equipment.forEach((itemId) => {
      const slot = getEquipmentSlot(itemId);
      if (slot) {
        displayedEquipment[slot] = itemId;
      }
    });

    const startingLoadout = getStartingLoadout();
    (Object.keys(startingLoadout) as EquipmentSlotId[]).forEach((slot) => {
      const itemId = startingLoadout[slot];
      if (itemId) {
        displayedEquipment[slot] = itemId;
      }
    });

    return displayedEquipment;
  }

  private updateVillageGrodorEquipment(): void {
    this.grodor?.setEquipment(this.getVillageDisplayedEquipment());
    this.grodor?.playIdle();
  }

  private launchCombatDebug(monsterId: MonsterId): void {
    if (this.scene.isActive("CombatScene")) {
      return;
    }

    this.setVillageOverlaysVisible(false);
    this.scene.launch("CombatScene", {
      monsterId,
      debugDirect: false
    });
    this.scene.bringToTop("CombatScene");
    this.restoreVillageOverlaysWhenCombatCloses(monsterId);
  }

  private launchMiniGameDebug(eventId: "loot_chest" | "coin_flip" | "bonneteau" | "slot_machine" | "dodge_chest" | "jump"): void {
    if (this.scene.isActive("MiniGameScene")) {
      return;
    }

    const event = resolveDoorEvent(eventId);
    this.setVillageOverlaysVisible(false);
    this.scene.launch("MiniGameScene", {
      type: eventId,
      ownedInventory: getDungeonRunState().inventory,
      carriedGold: getDungeonRunState().carriedGold,
      maxLife: getDungeonRunState().maxLife
    });
    this.scene.bringToTop("MiniGameScene");
    this.restoreVillageOverlaysWhenMiniGameCloses(event.id);
  }

  private setVillageOverlaysVisible(visible: boolean): void {
    if (!visible) {
      this.closeInventoryPanel();
    }
    this.villagePouchOverlay?.setVisible(visible);
    this.villageInventoryOverlay?.setVisible(visible);
    this.villageGoldBubble?.setVisible(visible && getDungeonRunState().carriedGold > 0);
    this.villageGoldText?.setVisible(visible && getDungeonRunState().carriedGold > 0);
    this.villageBankGoldBubble?.setVisible(visible && getDungeonRunState().bankGold > 0);
    this.villageBankGoldText?.setVisible(visible && getDungeonRunState().bankGold > 0);
    this.statusText?.setVisible(visible);
    this.debugMenu?.setVisible(visible);
    this.setInputsEnabled(visible);
    if (visible) {
      this.inventoryHitZone?.setInteractive({ useHandCursor: true });
    } else {
      this.inventoryHitZone?.disableInteractive();
    }
  }

  private restoreVillageOverlaysWhenCombatCloses(monsterId: MonsterId): void {
    const combatScene = this.scene.get("CombatScene");
    let restored = false;
    const restore = (combatResult?: CombatResult) => {
      if (restored) {
        return;
      }

      restored = true;
      this.events.off("combat-closed", restore);
      combatScene.events.off(Phaser.Scenes.Events.SHUTDOWN, restore);
      this.setVillageOverlaysVisible(true);
      this.grodor?.setEquipment(getDungeonRunState().equipment);
      this.updateVillageHudOverlays();
      this.setStatus(
        combatResult
          ? combatResult.outcome === "death"
            ? GAME_TEXTS.dungeon.runEndedStatus
            : GAME_TEXTS.dungeon.combatWonStatus
          : GAME_TEXTS.dungeon.combatDebugStatus(monsterId)
      );
      publishVillageCombatDebugReport({
        monsterId,
        result: combatResult,
        state: getDungeonRunState()
      });
    };

    this.events.once("combat-closed", restore);
    combatScene.events.once(Phaser.Scenes.Events.SHUTDOWN, restore);
  }

  private restoreVillageOverlaysWhenMiniGameCloses(eventId: string): void {
    const miniGameScene = this.scene.get("MiniGameScene");
    let restored = false;
    const restore = (miniGameResult?: MiniGameResult) => {
      if (restored) {
        return;
      }

      restored = true;
      this.events.off("minigame-closed", restore);
      miniGameScene.events.off(Phaser.Scenes.Events.SHUTDOWN, restore);
      if (miniGameResult?.goldDelta) {
        addDungeonGoldReward(miniGameResult.goldDelta);
      }
      if (miniGameResult?.goldLoss) {
        loseCarriedGold(miniGameResult.goldLoss);
      }
      if (miniGameResult?.instantDeath) {
        forceDungeonRunDeath();
      }
      if (miniGameResult?.maxLifeLoss) {
        decreaseRunMaxLife(miniGameResult.maxLifeLoss);
      }
      if (miniGameResult?.maxLifeDelta) {
        increaseRunMaxLife(miniGameResult.maxLifeDelta);
      }
      if ((miniGameResult?.lifeDelta ?? 0) < 0) {
        applyHeartLossWithCowardReflex(Math.abs(miniGameResult?.lifeDelta ?? 0), "dungeon_event");
      }
      if (miniGameResult?.itemId) {
        addDungeonInventoryItem(miniGameResult.itemId);
      }
      if (miniGameResult?.followUpMiniGame) {
        this.scene.launch("MiniGameScene", {
          type: miniGameResult.followUpMiniGame,
          ownedInventory: getDungeonRunState().inventory,
          carriedGold: getDungeonRunState().carriedGold,
          maxLife: getDungeonRunState().maxLife
        });
        this.scene.bringToTop("MiniGameScene");
        this.restoreVillageOverlaysWhenMiniGameCloses(miniGameResult.followUpMiniGame);
        return;
      }
      this.setVillageOverlaysVisible(true);
      this.grodor?.setEquipment(getDungeonRunState().equipment);
      this.grodor?.playIdle();
      this.updateVillageHudOverlays();
      this.setStatus(GAME_TEXTS.village.chooseBuilding);
      publishVillageMiniGameDebugReport({
        eventId,
        result: miniGameResult,
        state: getDungeonRunState()
      });
    };

    this.events.once("minigame-closed", restore);
    miniGameScene.events.once(Phaser.Scenes.Events.SHUTDOWN, restore);
  }

  private findSpawn(names: string[]): TiledPoint | undefined {
    return names.map((name) => (this.map ? getSpawnPoint(this.map, name) : undefined)).find(Boolean);
  }

  private createInteractives(): void {
    if (!this.map) {
      return;
    }

    const zones = getInteractiveZones(this.map);
    BUILDINGS.forEach((building) => {
      const zone = zones.find((candidate) => candidate.name === building);
      if (!zone) {
        return;
      }

      const hitZone = this.add
        .zone(zone.x + zone.width / 2, zone.y + zone.height / 2, zone.width, zone.height)
        .setInteractive({ useHandCursor: true })
        .setDepth(40);
      hitZone.on("pointerdown", () => this.walkToBuilding(building, zone));
      this.zones.set(building, hitZone);
    });
  }

  private walkToBuilding(building: VillageBuildingId, zone: TiledZone): void {
    if (!this.map || !this.grodor || this.moving || this.panel) {
      return;
    }

    const entryPath = this.hasEnteredVillage ? [] : getPathPoints(this.map, "path_from_dungeon_");
    const buildingPath = getPathPoints(this.map, `path_${building}_`);
    const path = [...entryPath, ...buildingPath];

    if (path.length === 0) {
      this.setStatus(GAME_TEXTS.village.missingPath(building));
      return;
    }

    this.activeBuilding = building;
    this.hasEnteredVillage = true;
    this.publishReport();
    this.setInputsEnabled(false);
    this.setStatus(GAME_TEXTS.village.movingTo(BUILDING_TEXT[building].label));
    this.walkPath(path, () => {
      this.grodor?.playIdle();
      this.grodor?.setFlipX(false);
      this.showBuildingPanel(building);
      this.publishMovementReport(building, zone, "arrived", path);
    });
    this.publishMovementReport(building, zone, "moving", path);
  }

  private walkPath(path: TiledPoint[], onComplete: () => void): void {
    if (!this.grodor) {
      return;
    }

    this.moving = true;
    this.grodor.playWalk();

    const walkSegment = (index: number) => {
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
        duration: Phaser.Math.Clamp(distance * 2.1, 240, 820),
        ease: "Sine.easeInOut",
        onComplete: () => {
          if (index < path.length - 1) {
            walkSegment(index + 1);
            return;
          }

          this.moving = false;
          onComplete();
        }
      });
    };

    walkSegment(0);
  }

  private showBuildingPanel(building: VillageBuildingId): void {
    if (building === "bank") {
      this.showBankPanel();
      return;
    }

    if (building === "board") {
      this.showBoardPanel();
      return;
    }

    if (building === "shop") {
      this.showShopPanel();
      return;
    }

    if (building === "grodor_house") {
      this.showGrodorHousePanel();
      return;
    }

    if (building === "tavern") {
      this.scene.start("TavernScene");
      return;
    }
  }

  private showBankPanel(): void {
    const bankPanel = new VillageBankPanel(this, {
      onClose: () => this.closePanelAndReturnToCenter(),
      onHudRefresh: () => this.updateVillageHudOverlays(),
      onPublishReport: () => this.publishPanelReport("bank"),
      onStatus: (message) => this.setStatus(message)
    });
    this.panel = bankPanel.open();
  }

  private showShopPanel(): void {
    this.shopPanel?.destroy();
    this.shopPanel = new VillageShopPanel(this, {
      onClose: () => this.closePanelAndReturnToCenter(),
      onHudRefresh: () => this.updateVillageHudOverlays(),
      onPublishReport: () => this.publishPanelReport("shop")
    });
    this.panel = this.shopPanel.open();
  }

  private createOutsideCloseZones(panelWidth: number, panelHeight: number): Phaser.GameObjects.Zone[] {
    const sideWidth = Math.max(0, (WORLD_WIDTH - panelWidth) / 2);
    const topHeight = Math.max(0, (WORLD_HEIGHT - panelHeight) / 2);
    const zones = [
      this.add.zone(-(panelWidth + sideWidth) / 2, 0, sideWidth, WORLD_HEIGHT),
      this.add.zone((panelWidth + sideWidth) / 2, 0, sideWidth, WORLD_HEIGHT),
      this.add.zone(0, -(panelHeight + topHeight) / 2, panelWidth, topHeight),
      this.add.zone(0, (panelHeight + topHeight) / 2, panelWidth, topHeight)
    ];

    zones.forEach((zone) => {
      zone.setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => this.closePanelAndReturnToCenter());
    });

    return zones;
  }

  private showGrodorHousePanel(feedback?: string): void {
    const text = GAME_TEXTS.village.grodorHouse;
    const carriedItems = this.collectCurrentRunShopItems();
    if (carriedItems.length > 0) {
      discoverShopItems(carriedItems);
    }
    const ownedItems = getOwnedItems();
    const startingLoadout = getStartingLoadout();
    const displayedEquipment = this.getVillageDisplayedEquipmentBySlot();
    const displayedEquipmentCount = Object.values(displayedEquipment).filter(Boolean).length;
    const maxStartingEquipmentCount = getMaxStartingEquipmentCount();
    const loadoutCountColor =
      displayedEquipmentCount > maxStartingEquipmentCount ? "#ff5d5d" : displayedEquipmentCount === maxStartingEquipmentCount ? "#7dff8f" : "#fff1c2";
    const container = this.add.container(WORLD_WIDTH / 2, WORLD_HEIGHT / 2).setDepth(80);
    const overlay = this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x050403, 0.5).setOrigin(0.5);
    const equipmentPanel = this.add
      .image(HOUSE_EQUIPMENT_PANEL.x, HOUSE_EQUIPMENT_PANEL.y, IMAGE_ASSETS.inventoryWindowFrameEmpty.key)
      .setDisplaySize(HOUSE_EQUIPMENT_PANEL.displayWidth, HOUSE_EQUIPMENT_PANEL.displayHeight);
    const chestPanel = this.add
      .image(HOUSE_CHEST_PANEL.x, HOUSE_CHEST_PANEL.y, IMAGE_ASSETS.grodorHouseChestPanel.key)
      .setDisplaySize(HOUSE_CHEST_PANEL.displayWidth, HOUSE_CHEST_PANEL.displayHeight);
    const grodorPreview = new GrodorActor(
      this,
      this.houseEquipmentX(HOUSE_EQUIPMENT_PANEL.grodor.x),
      this.houseEquipmentY(HOUSE_EQUIPMENT_PANEL.grodor.y)
    );
    grodorPreview.container.setScale(0.82);
    grodorPreview.setEquipment(this.getVillageDisplayedEquipment());
    grodorPreview.playIdle();
    const title = this.add
      .text(0, -476, text.title, {
        fontFamily: "Georgia, serif",
        fontSize: "38px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 6
      })
      .setOrigin(0.5);
    const loadoutTitle = this.add
      .text(
        this.houseEquipmentX(HOUSE_EQUIPMENT_PANEL.loadoutCounter.x),
        this.houseEquipmentY(HOUSE_EQUIPMENT_PANEL.loadoutCounter.y),
        text.startLimit(displayedEquipmentCount, maxStartingEquipmentCount),
        {
          fontFamily: "Georgia, serif",
          fontSize: "34px",
          color: loadoutCountColor,
          stroke: "#120d0a",
          strokeThickness: 5,
          shadow: { offsetX: 1, offsetY: 2, color: "#000000", blur: 3, fill: true }
        }
      )
      .setOrigin(0.5);
    const closeButton = this.add
      .image(
        this.houseEquipmentX(HOUSE_EQUIPMENT_PANEL.closeButton.x),
        this.houseEquipmentY(HOUSE_EQUIPMENT_PANEL.closeButton.y),
        IMAGE_ASSETS.inventoryCloseButton.key
      )
      .setDisplaySize(this.houseEquipmentSizeX(71), this.houseEquipmentSizeY(69));
    const closeButtonHitZone = this.add
      .zone(
        closeButton.x,
        closeButton.y,
        this.houseEquipmentSizeX(HOUSE_EQUIPMENT_PANEL.closeButton.hitSize),
        this.houseEquipmentSizeY(HOUSE_EQUIPMENT_PANEL.closeButton.hitSize)
      )
      .setInteractive({ useHandCursor: true });
    closeButtonHitZone.on("pointerdown", () => this.closePanelAndReturnToCenter());
    const feedbackText = this.add
      .text(108, 450, feedback ?? (ownedItems.length > 0 ? text.selectedItemFallback : text.empty), {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "22px",
        color: "#f9dfaa",
        align: "center",
        stroke: "#070402",
        strokeThickness: 4,
        wordWrap: { width: 1020 }
      })
      .setOrigin(0.5);
    container.add([
      overlay,
      title,
      equipmentPanel,
      ...this.createGrodorHouseEquipmentFrames(),
      chestPanel,
      grodorPreview.container,
      loadoutTitle,
      closeButton,
      closeButtonHitZone,
      ...this.createGrodorHouseLoadoutSlots(displayedEquipment, startingLoadout),
      ...this.createGrodorHouseChestGrid(ownedItems),
      feedbackText
    ]);
    this.panel = container;
    this.publishPanelReport("grodor_house");
    publishGrodorHouseReport({
      ownedItems,
      ownedItemCounts: getOwnedItemCounts(),
      discoveredCarriedItems: carriedItems,
      startingLoadout,
      displayedEquipment,
      displayedEquipmentCount,
      startingLoadoutCount: getStartingLoadoutCount(),
      maxStartingEquipmentCount,
      permanentUpgrades: getPermanentUpgrades()
    });
  }

  private createGrodorHouseLoadoutSlots(
    displayedEquipment: Partial<Record<EquipmentSlotId, string>>,
    startingLoadout: Partial<Record<EquipmentSlotId, string>>
  ): Phaser.GameObjects.GameObject[] {
    return (Object.keys(HOUSE_EQUIPMENT_PANEL.slots) as EquipmentSlotId[]).flatMap((slotId) => {
      const itemId = displayedEquipment[slotId];
      if (!itemId) {
        return [];
      }

      const slot = HOUSE_EQUIPMENT_PANEL.slots[slotId];
      const x = this.houseEquipmentX(slot.x);
      const y = this.houseEquipmentY(slot.y);
      const itemName = this.getItemName(itemId);
      const itemDescription = getItemDefinition(itemId)?.description ?? GAME_TEXTS.inventory.descriptionFallback;
      const asset = INVENTORY_ITEM_ASSETS[itemId as keyof typeof INVENTORY_ITEM_ASSETS];
      const children: Phaser.GameObjects.GameObject[] = [];

      if (asset && this.textures.exists(asset.key)) {
        const icon = this.add.image(x, y - 22, asset.key);
        icon.setScale(Math.min(58 / icon.width, 58 / icon.height));
        children.push(icon);
      } else {
        children.push(
          this.add
            .text(x, y, itemName, {
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "15px",
              color: "#fff1c2",
              align: "center",
              stroke: "#070402",
              strokeThickness: 4,
              wordWrap: { width: 100 }
            })
            .setOrigin(0.5)
        );
      }

      const hitZone = this.add.zone(x, y, 116, 116).setInteractive({ useHandCursor: true });
      const isStartingLoadoutItem = startingLoadout[slotId] === itemId;
      this.bindHouseItemInteraction(hitZone, x, y, itemName, itemDescription, () => {
        if (isStartingLoadoutItem) {
          this.handleUnequipStartingSlot(slotId, itemName);
          return;
        }
        this.handleDepositCarriedEquipment(itemId, itemName);
      });
      children.push(hitZone);
      return children;
    });
  }

  private createGrodorHouseEquipmentFrames(): Phaser.GameObjects.GameObject[] {
    const children: Phaser.GameObjects.GameObject[] = HOUSE_EQUIPMENT_PANEL.allSlots.map((slot) =>
      this.add
        .image(this.houseEquipmentX(slot.x), this.houseEquipmentY(slot.y), IMAGE_ASSETS.inventoryEquipmentSlotEmpty.key)
        .setDisplaySize(this.houseEquipmentSizeX(185), this.houseEquipmentSizeY(195))
    );

    HOUSE_EQUIPMENT_SLOT_IDS.forEach((slotId) => {
      const slot = HOUSE_EQUIPMENT_PANEL.slots[slotId];
      children.push(this.createHouseEquipmentLabel(slot.x, slot.y, GAME_TEXTS.inventory.equipmentSlotLabels[slotId]));
    });

    HOUSE_EQUIPMENT_PANEL.extraLabels.forEach((slot) => {
      children.push(this.createHouseEquipmentLabel(slot.x, slot.y, slot.label));
    });

    HOUSE_EQUIPMENT_PANEL.keySlots.forEach((slot) => {
      children.push(
        this.add
          .image(this.houseEquipmentX(slot.x), this.houseEquipmentY(slot.y), IMAGE_ASSETS.inventoryKeySlotEmpty.key)
          .setDisplaySize(this.houseEquipmentSizeX(185), this.houseEquipmentSizeY(169))
      );
    });

    return children;
  }

  private createHouseEquipmentLabel(sourceX: number, sourceY: number, label: string): Phaser.GameObjects.Text {
    return this.add
      .text(this.houseEquipmentX(sourceX), this.houseEquipmentY(sourceY) + this.houseEquipmentSizeY(42), label, {
        fontFamily: "Georgia, serif",
        fontSize: "17px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 4
      })
      .setOrigin(0.5);
  }

  private createGrodorHouseChestGrid(itemIds: string[]): Phaser.GameObjects.GameObject[] {
    const scaleX = HOUSE_CHEST_PANEL.displayWidth / HOUSE_CHEST_PANEL.width;
    const scaleY = HOUSE_CHEST_PANEL.displayHeight / HOUSE_CHEST_PANEL.height;

    return itemIds.slice(0, HOUSE_CHEST_PANEL.slots.length).flatMap((itemId, index) => {
      const slot = HOUSE_CHEST_PANEL.slots[index];
      const x = HOUSE_CHEST_PANEL.x + (slot.x - HOUSE_CHEST_PANEL.width / 2) * scaleX;
      const y = HOUSE_CHEST_PANEL.y + (slot.y - HOUSE_CHEST_PANEL.height / 2) * scaleY;
      const itemName = this.getItemName(itemId);
      const itemDescription = getItemDefinition(itemId)?.description ?? GAME_TEXTS.inventory.descriptionFallback;
      const asset = INVENTORY_ITEM_ASSETS[itemId as keyof typeof INVENTORY_ITEM_ASSETS];
      const children: Phaser.GameObjects.GameObject[] = [];

      if (asset && this.textures.exists(asset.key)) {
        const icon = this.add.image(x, y, asset.key);
        icon.setScale(Math.min(48 / icon.width, 48 / icon.height));
        children.push(icon);
      } else {
        children.push(
          this.add
            .text(x, y, itemName, {
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "14px",
              color: "#fff1c2",
              align: "center",
              stroke: "#070402",
              strokeThickness: 4,
              wordWrap: { width: 94 }
            })
            .setOrigin(0.5)
        );
      }

      const count = getOwnedItemCount(itemId);
      if (count > 1) {
        children.push(
          this.add
            .text(x + 35, y + 35, GAME_TEXTS.village.shop.countBadge(count), {
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "16px",
              color: "#fff1c2",
              align: "center",
              stroke: "#070402",
              strokeThickness: 4
            })
            .setOrigin(0.5)
        );
      }

      const hitZone = this.add.zone(x, y, 104, 104).setInteractive({ useHandCursor: true });
      this.bindHouseItemInteraction(hitZone, x, y, itemName, itemDescription, () => this.handleEquipStartingItem(itemId));
      children.push(hitZone);
      return children;
    });
  }

  private houseEquipmentX(sourceX: number): number {
    return HOUSE_EQUIPMENT_PANEL.x + (sourceX - HOUSE_EQUIPMENT_PANEL.width / 2) * (HOUSE_EQUIPMENT_PANEL.displayWidth / HOUSE_EQUIPMENT_PANEL.width);
  }

  private houseEquipmentY(sourceY: number): number {
    return HOUSE_EQUIPMENT_PANEL.y + (sourceY - HOUSE_EQUIPMENT_PANEL.height / 2) * (HOUSE_EQUIPMENT_PANEL.displayHeight / HOUSE_EQUIPMENT_PANEL.height);
  }

  private houseEquipmentSizeX(sourceWidth: number): number {
    return sourceWidth * (HOUSE_EQUIPMENT_PANEL.displayWidth / HOUSE_EQUIPMENT_PANEL.width);
  }

  private houseEquipmentSizeY(sourceHeight: number): number {
    return sourceHeight * (HOUSE_EQUIPMENT_PANEL.displayHeight / HOUSE_EQUIPMENT_PANEL.height);
  }

  private bindHouseItemInteraction(
    hitZone: Phaser.GameObjects.Zone,
    x: number,
    y: number,
    itemName: string,
    itemDescription: string,
    onDoubleTap: () => void
  ): void {
    let lastTapAt = 0;
    hitZone.on("pointerdown", () => {
      const now = this.time.now;
      if (now - lastTapAt <= 320) {
        lastTapAt = 0;
        this.itemDescriptionBubble?.destroy();
        this.itemDescriptionBubble = undefined;
        onDoubleTap();
        return;
      }

      lastTapAt = now;
      this.showHouseItemDescription(x, y, itemName, itemDescription);
    });
  }

  private showHouseItemDescription(x: number, y: number, itemName: string, itemDescription: string): void {
    this.showPanelItemDescription(x, y + 82, itemName, itemDescription);
  }

  private showPanelItemDescription(x: number, y: number, itemName: string, itemDescription: string): void {
    this.itemDescriptionBubble?.destroy();
    this.itemDescriptionBubble = createItemDescriptionBubble(this, x, y, itemName, itemDescription);
    this.panel?.add(this.itemDescriptionBubble);
    if (this.itemDescriptionBubble) {
      this.panel?.bringToTop(this.itemDescriptionBubble);
    }
  }

  private handleEquipStartingItem(itemId: string): void {
    const itemName = this.getItemName(itemId);
    const result = equipStartingItem(itemId);
    const text = GAME_TEXTS.village.grodorHouse;
    const feedback = result.ok ? text.addedToLoadout(itemName) : this.getStartingLoadoutFailureText(result.reason);
    this.updateVillageGrodorEquipment();
    this.refreshGrodorHousePanel(feedback);
  }

  private handleUnequipStartingSlot(slot: EquipmentSlotId, itemName: string): void {
    const result = unequipStartingSlot(slot);
    const text = GAME_TEXTS.village.grodorHouse;
    const feedback = result.ok ? text.removedFromLoadout(itemName) : text.selectedItemFallback;
    this.updateVillageGrodorEquipment();
    this.refreshGrodorHousePanel(feedback);
  }

  private handleDepositCarriedEquipment(itemId: string, itemName: string): void {
    removeDungeonEquipmentItem(itemId);
    addOwnedItem(itemId, 1);
    this.updateVillageHudOverlays();
    this.updateVillageGrodorEquipment();
    this.refreshGrodorHousePanel(GAME_TEXTS.village.grodorHouse.depositedCarriedEquipment(itemName));
  }

  private refreshGrodorHousePanel(feedback: string): void {
    this.itemDescriptionBubble?.destroy();
    this.itemDescriptionBubble = undefined;
    this.panel?.destroy();
    this.panel = undefined;
    this.showGrodorHousePanel(feedback);
  }

  private getStartingLoadoutFailureText(reason: string | undefined): string {
    const text = GAME_TEXTS.village.grodorHouse;
    if (reason === "limit_reached") {
      return text.limitReached;
    }
    if (reason === "not_owned") {
      return text.notEnoughCopies;
    }
    if (reason === "not_equipment") {
      return text.notEquipment;
    }
    return text.selectedItemFallback;
  }

  private getItemName(itemId: string): string {
    return getItemDefinition(itemId)?.name ?? GAME_TEXTS.inventory.unknownItem(itemId);
  }

  private showBoardPanel(): void {
    const text = GAME_TEXTS.village.board;
    const stats = getGrodorStats();
    const score = calculateGrodorScore(stats);
    const labels = text.statLabels;
    const lines = [
      `${labels.sortiesReussies}: ${stats.sortiesReussies}`,
      `${labels.combatsGagnes}: ${stats.combatsGagnes}`,
      `${labels.miniJeuxReussis}: ${stats.miniJeuxReussis}`,
      `${labels.humiliations}: ${stats.humiliations}`,
      `${labels.degatsSubis}: ${stats.degatsSubis}`,
      `${labels.mortsRidicules}: ${stats.mortsRidicules}`,
      `${labels.poGagnes}: ${stats.poGagnes}`,
      `${labels.objetsRamasses}: ${stats.objetsRamasses}`,
      `${labels.runsTotal}: ${stats.runsTotal}`,
      `${labels.etagesVisites}: ${stats.etagesVisites}`,
      `${labels.scoreGrodorienTotal}: ${score.total}`
    ];

    const container = this.add.container(WORLD_WIDTH / 2, WORLD_HEIGHT / 2).setDepth(80);
    const background = createNineSlicePanel(this, IMAGE_ASSETS.frameStory.key, 0, 0, 760, 560, {
      left: 142,
      right: 142,
      top: 88,
      bottom: 88
    });
    const title = this.add
      .text(0, -220, text.title, {
        fontFamily: "Georgia, serif",
        fontSize: "30px",
        color: "#fff1c2"
      })
      .setOrigin(0.5);
    const message = this.add
      .text(0, -176, text.message, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "21px",
        color: "#f9dfaa",
        align: "center",
        wordWrap: { width: 560 }
      })
      .setOrigin(0.5);
    const statsText = this.add
      .text(0, -4, lines.join("\n"), {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "21px",
        color: "#fff1c2",
        align: "left",
        lineSpacing: 6,
        wordWrap: { width: 560 }
      })
      .setOrigin(0.5);
    const effect = this.add
      .text(0, 188, text.effectLabel, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "21px",
        color: "#f9dfaa",
        align: "center"
      })
      .setOrigin(0.5);
    const continueButton = this.add
      .text(0, 236, GAME_TEXTS.common.continue, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "24px",
        color: "#1b100b",
        backgroundColor: "#f0c071",
        padding: { x: 22, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    continueButton.on("pointerdown", () => this.closePanelAndReturnToCenter());
    container.add([background, title, message, statsText, effect, continueButton]);
    this.panel = container;
    this.publishPanelReport("board");
  }

  private closePanelAndReturnToCenter(): void {
    this.shopPanel?.destroy();
    this.shopPanel = undefined;
    this.itemDescriptionBubble?.destroy();
    this.itemDescriptionBubble = undefined;
    this.panel?.destroy();
    this.panel = undefined;

    const building = this.activeBuilding;
    if (!this.map || !building) {
      this.resetToCenterFallback();
      return;
    }

    const path = getPathPoints(this.map, `path_${building}_`, { reverse: true });
    if (path.length === 0) {
      this.resetToCenterFallback();
      return;
    }

    const returnPath = this.villageSpawn ? [...path, this.villageSpawn] : path;
    this.walkPath(returnPath, () => {
      this.updateVillageGrodorEquipment();
      this.grodor?.setFlipX(false);
      this.setInputsEnabled(true);
      this.setStatus(GAME_TEXTS.village.chooseBuilding);
      this.activeBuilding = undefined;
      this.publishReturnReport(returnPath);
    });
  }

  private resetToCenterFallback(): void {
    if (this.grodor && this.villageSpawn) {
      this.grodor.setPosition(this.villageSpawn.x, this.villageSpawn.y);
      this.updateVillageGrodorEquipment();
      this.grodor.setFlipX(false);
    }

    this.activeBuilding = undefined;
    this.setInputsEnabled(true);
    this.setStatus(GAME_TEXTS.village.chooseBuilding);
  }

  private createStatusPanel(): void {
    const panelX = WORLD_WIDTH - 304;
    const panelY = WORLD_HEIGHT - 152;
    createNineSlicePanel(this, IMAGE_ASSETS.frameStory.key, panelX, panelY, 520, 220, {
      left: 36,
      right: 36,
      top: 36,
      bottom: 36
    }).setDepth(50);
    this.statusText = this.add
      .text(panelX, panelY, "", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "24px",
        color: "#fff1c2",
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: 444 }
      })
      .setOrigin(0.5)
      .setDepth(51);
  }

  private setStatus(message: string): void {
    const runState = getDungeonRunState();
    this.updateVillageHudOverlays();
    this.statusText?.setText(
      [
        GAME_TEXTS.village.title,
        GAME_TEXTS.village.bank.carriedGold(runState.carriedGold),
        GAME_TEXTS.village.bank.bankGold(runState.bankGold),
        "",
        message
      ].join("\n")
    );
  }

  private setInputsEnabled(enabled: boolean): void {
    this.zones.forEach((zone) => {
      if (enabled) {
        zone.setInteractive({ useHandCursor: true });
      } else {
        zone.disableInteractive();
      }
    });
  }

  private publishReport(): void {
    publishVillageReport({
      fromDungeon: this.fromDungeon,
      hasEnteredVillage: this.hasEnteredVillage,
      spawn: this.grodor ? { x: this.grodor.x, y: this.grodor.y } : undefined,
      zones: [...this.zones.keys()],
      villageHud: {
        pouchTexture: this.villagePouchOverlay?.texture.key,
        inventoryTexture: this.villageInventoryOverlay?.texture.key,
        goldText: this.villageGoldText?.text
      },
      spawns: this.map?.getObjectLayer("spawns")?.objects.map((object) => object.name) ?? [],
      paths: this.map?.getObjectLayer("paths")?.objects.map((object) => object.name).filter(Boolean) ?? []
    });
  }

  private publishMovementReport(
    building: VillageBuildingId,
    zone: TiledZone,
    status: "moving" | "arrived",
    path: TiledPoint[]
  ): void {
    publishVillageMovementReport({
      building,
      status,
      zone,
      path: path.map((point) => point.name),
      grodor: this.grodor ? { x: this.grodor.x, y: this.grodor.y, animation: this.grodor.currentAnimation } : undefined
    });
  }

  private publishPanelReport(building: VillageBuildingId): void {
    const stats = getGrodorStats();
    publishVillagePanelReport({
      building,
      state: getDungeonRunState(),
      discoveredShopItems: getDiscoveredShopItems(),
      ownedItems: getOwnedItems(),
      ownedItemCounts: getOwnedItemCounts(),
      permanentUpgrades: getPermanentUpgrades(),
      maxStartingEquipmentCount: getMaxStartingEquipmentCount(),
      villageHud: {
        pouchTexture: this.villagePouchOverlay?.texture.key,
        inventoryTexture: this.villageInventoryOverlay?.texture.key
      },
      stats,
      score: calculateGrodorScore(stats)
    });
  }

  private collectCurrentRunShopItems(): string[] {
    if (this.fromDungeon) {
      return [];
    }

    const state = getDungeonRunState();
    return [
      ...new Set(
        [...state.inventory, ...state.equipment].filter((itemId) => Boolean(getItemDefinition(itemId)?.shopDiscoverable))
      )
    ].filter((itemId) => {
      if (this.importedCarriedShopItems.has(itemId)) {
        return false;
      }

      this.importedCarriedShopItems.add(itemId);
      return true;
    });
  }

  private publishReturnReport(path: TiledPoint[]): void {
    publishVillageReturnReport({
      path: path.map((point) => point.name),
      grodor: this.grodor ? { x: this.grodor.x, y: this.grodor.y, animation: this.grodor.currentAnimation } : undefined
    });
  }

}
