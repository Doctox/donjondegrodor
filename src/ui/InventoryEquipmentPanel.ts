import Phaser from "phaser";
import { GrodorActor } from "../actors/GrodorActor";
import { RiggedGrodorActor } from "../actors/RiggedGrodorActor";
import { IMAGE_ASSETS, INVENTORY_ITEM_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GrodorEquipmentId } from "../data/equipmentDefinitions";
import { GAME_TEXTS } from "../data/gameTexts";
import { EquipmentSlotId, getEquipmentSlot, getItemDefinition } from "../data/itemDefinitions";
import {
  ATTACK_ONE_RIG_PROJECT_SAVE_PATH,
  ATTACK_ONE_RIG_STORAGE_KEY,
  FRONT_RIG_PROJECT_SAVE_PATH,
  FRONT_RIG_STORAGE_KEY,
  HURT_RIG_PROJECT_SAVE_PATH,
  HURT_RIG_STORAGE_KEY,
  SIDE_RIG_PROJECT_SAVE_PATH,
  SIDE_RIG_STORAGE_KEY,
  VICTORY_RIG_PROJECT_SAVE_PATH,
  VICTORY_RIG_STORAGE_KEY
} from "../rig/grodorRigDefinitions";
import type { GrodorRigPresetInput } from "../rig/grodorRig";
import { getGrodorDebugMode } from "../systems/grodorDebugMode";
import {
  getCowardReflexCancelPercent,
  getDoorReadingPercent,
  getMaxStartingEquipmentCount,
  getPermanentUpgrades,
  getTragicCardioPercent,
  PermanentUpgradeId
} from "../systems/permanentUpgrades";
import { assetPath } from "../utils/assetPath";
import { createItemDescriptionBubble } from "./itemDescriptionBubble";

const PANEL_DEPTH = 92;
const PANEL_SOURCE = {
  width: 1206,
  height: 971,
  displayWidth: 1206,
  displayHeight: 971
};

const EQUIPMENT_SLOT_POSITIONS = [
  { x: 214, y: 250 },
  { x: 444, y: 198 },
  { x: 674, y: 250 },
  { x: 214, y: 473 },
  { x: 674, y: 473 },
  { x: 214, y: 746 },
  { x: 444, y: 746 },
  { x: 674, y: 746 }
];

const EQUIPMENT_SLOTS = {
  weapon: { x: 214, y: 250 },
  helmet: { x: 444, y: 198 },
  amulet: { x: 674, y: 746 },
  cape: { x: 674, y: 250 },
  gloves: { x: 214, y: 473 },
  belt: { x: 214, y: 746 },
  object: { x: 444, y: 746 },
  boots: { x: 674, y: 473 }
} satisfies Record<EquipmentSlotId, { x: number; y: number }>;

const EQUIPMENT_SLOT_IDS = ["weapon", "helmet", "cape", "gloves", "boots", "belt", "object", "amulet"] satisfies EquipmentSlotId[];

const KEY_SLOT_POSITIONS = [
  { x: 901, y: 201 },
  { x: 901, y: 392 },
  { x: 901, y: 583 },
  { x: 901, y: 774 }
];

const PASSIVE_SLOT_POSITIONS = [
  { x: 1066, y: 161 },
  { x: 1066, y: 279 },
  { x: 1066, y: 397 },
  { x: 1066, y: 515 }
];

const CLOSE_BUTTON = { x: 1144, y: 55, hitSize: 94 };
const INVENTORY_GRODOR_PREVIEW = {
  x: WORLD_WIDTH / 2 - 154,
  y: WORLD_HEIGHT / 2 + 142,
  spriteScale: 1.08,
  rigIdleScale: 0.4,
  rigWalkScale: 0.51
};

type InventoryGrodorPreview = GrodorActor | RiggedGrodorActor;

type EquippedItem = {
  id: GrodorEquipmentId;
  name: string;
  description: string;
  slot: EquipmentSlotId;
};

type PassiveInventoryItem = {
  id: PermanentUpgradeId;
  name: string;
  description: string;
  level: number;
  iconKey: string;
};

export class InventoryEquipmentPanel {
  private readonly blocker: Phaser.GameObjects.Rectangle;
  private readonly panelBlocker: Phaser.GameObjects.Zone;
  private readonly container: Phaser.GameObjects.Container;
  private readonly grodor: InventoryGrodorPreview;
  private itemDescriptionBubble?: Phaser.GameObjects.Container;
  private activeDescriptionKey?: string;
  private readonly handleEscape: (event: KeyboardEvent) => void;
  private readonly updateRiggedGrodorPreview = (time: number): void => {
    if (this.grodor instanceof RiggedGrodorActor) {
      this.grodor.update(time / 1000);
    }
  };

  constructor(
    private readonly scene: Phaser.Scene,
    equipment: string[],
    private readonly onClose: () => void
  ) {
    const equippedItems = this.getEquippedItems(equipment);
    this.blocker = scene.add
      .rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x050403, 0.58)
      .setOrigin(0)
      .setDepth(PANEL_DEPTH)
      .setInteractive({ useHandCursor: false });

    this.container = scene.add.container(WORLD_WIDTH / 2, WORLD_HEIGHT / 2).setDepth(PANEL_DEPTH + 2);
    this.panelBlocker = scene.add
      .zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, PANEL_SOURCE.displayWidth, PANEL_SOURCE.displayHeight)
      .setDepth(PANEL_DEPTH + 1)
      .setInteractive({ useHandCursor: false });

    const background = scene.add
      .image(0, 0, IMAGE_ASSETS.inventoryWindowFrameEmpty.key)
      .setDisplaySize(PANEL_SOURCE.displayWidth, PANEL_SOURCE.displayHeight);
    const closeButton = scene.add
      .image(this.toPanelX(CLOSE_BUTTON.x), this.toPanelY(CLOSE_BUTTON.y), IMAGE_ASSETS.inventoryCloseButton.key)
      .setDisplaySize(71, 69)
      .setInteractive({ useHandCursor: true });
    closeButton.on("pointerdown", () => this.onClose());
    const closeHitZone = scene.add
      .zone(this.toPanelX(CLOSE_BUTTON.x), this.toPanelY(CLOSE_BUTTON.y), CLOSE_BUTTON.hitSize, CLOSE_BUTTON.hitSize)
      .setInteractive({ useHandCursor: true });
    closeHitZone.on("pointerdown", () => this.onClose());

    this.grodor = this.createGrodorPreview(equipment);
    this.grodor.container.setDepth(PANEL_DEPTH + 3);

    this.container.add([
      background,
      ...this.createEquipmentSlotFrames(),
      ...this.createKeySlotFrames(),
      closeButton,
      closeHitZone,
      ...this.createSlotItems(equippedItems),
      ...this.createPassiveItems()
    ]);

    this.handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        this.onClose();
      }
    };
    scene.input.keyboard?.on("keydown", this.handleEscape);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateRiggedGrodorPreview);

    (window as unknown as { __inventoryEquipmentPanelReport?: unknown }).__inventoryEquipmentPanelReport = {
      equipment,
      equippedItems: equippedItems.map((item) => ({ id: item.id, name: item.name, slot: item.slot }))
    };
  }

  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.handleEscape);
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateRiggedGrodorPreview);
    this.grodor.destroy();
    this.itemDescriptionBubble?.destroy();
    this.panelBlocker.destroy();
    this.container.destroy(true);
    this.blocker.destroy();
  }

  private createGrodorPreview(equipment: string[]): InventoryGrodorPreview {
    if (getGrodorDebugMode() !== "rigV3") {
      const actor = new GrodorActor(
        this.scene,
        INVENTORY_GRODOR_PREVIEW.x,
        INVENTORY_GRODOR_PREVIEW.y
      );
      actor.container.setScale(INVENTORY_GRODOR_PREVIEW.spriteScale);
      actor.setEquipment(equipment);
      actor.playIdle();
      return actor;
    }

    const actor = new RiggedGrodorActor(this.scene, {
      x: INVENTORY_GRODOR_PREVIEW.x,
      y: INVENTORY_GRODOR_PREVIEW.y,
      depth: PANEL_DEPTH + 3,
      idleScale: INVENTORY_GRODOR_PREVIEW.rigIdleScale,
      walkScale: INVENTORY_GRODOR_PREVIEW.rigWalkScale
    });
    actor.setEquipment(equipment);
    actor.playIdle();
    void this.loadRiggedGrodorPresets(actor, equipment);
    return actor;
  }

  private async loadRiggedGrodorPresets(actor: RiggedGrodorActor, equipment: string[]): Promise<void> {
    const [idlePreset, walkPreset, victoryPreset, hurtPreset, attackOnePreset] = await Promise.all([
      this.loadRigPreset(FRONT_RIG_STORAGE_KEY, FRONT_RIG_PROJECT_SAVE_PATH),
      this.loadRigPreset(SIDE_RIG_STORAGE_KEY, SIDE_RIG_PROJECT_SAVE_PATH),
      this.loadRigPreset(VICTORY_RIG_STORAGE_KEY, VICTORY_RIG_PROJECT_SAVE_PATH),
      this.loadRigPreset(HURT_RIG_STORAGE_KEY, HURT_RIG_PROJECT_SAVE_PATH),
      this.loadRigPreset(ATTACK_ONE_RIG_STORAGE_KEY, ATTACK_ONE_RIG_PROJECT_SAVE_PATH)
    ]);

    if (this.grodor !== actor) {
      return;
    }

    if (idlePreset) {
      actor.applyIdlePreset(idlePreset);
    }
    if (walkPreset) {
      actor.applyWalkPreset(walkPreset);
    }
    if (victoryPreset) {
      actor.applyVictoryPreset(victoryPreset);
    }
    if (hurtPreset) {
      actor.applyHurtPreset(hurtPreset);
    }
    if (attackOnePreset) {
      actor.applyAttackOnePreset(attackOnePreset);
    }

    actor.setEquipment(equipment);
    actor.playIdle();
  }

  private async loadRigPreset(storageKey: string, projectPath: string): Promise<GrodorRigPresetInput | null> {
    try {
      const response = await fetch(`${assetPath(projectPath)}?v=${Date.now()}`);
      return response.ok ? ((await response.json()) as GrodorRigPresetInput) : null;
    } catch {
      // Local editor storage remains a fallback for temporary work-in-progress presets.
    }

    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as GrodorRigPresetInput) : null;
    } catch {
      return null;
    }
  }

  private getEquippedItems(equipment: string[]): EquippedItem[] {
    const usedSlots = new Set<EquipmentSlotId>();
    return equipment.flatMap((itemId) => {
      const slot = getEquipmentSlot(itemId);
      if (!slot || usedSlots.has(slot)) {
        return [];
      }

      usedSlots.add(slot);
      return [
        {
          id: itemId as GrodorEquipmentId,
          name: getItemDefinition(itemId)?.name ?? GAME_TEXTS.inventory.unknownItem(itemId),
          description: getItemDefinition(itemId)?.description ?? GAME_TEXTS.inventory.descriptionFallback,
          slot
        }
      ];
    });
  }

  private createSlotItems(items: EquippedItem[]): Phaser.GameObjects.GameObject[] {
    return items.flatMap((item) => {
      const slot = EQUIPMENT_SLOTS[item.slot];
      const x = this.toPanelX(slot.x);
      const y = this.toPanelY(slot.y);
      const asset = INVENTORY_ITEM_ASSETS[item.id as keyof typeof INVENTORY_ITEM_ASSETS];
      const children: Phaser.GameObjects.GameObject[] = [];

      if (asset && this.scene.textures.exists(asset.key)) {
        const icon = this.scene.add.image(x, y - 28, asset.key);
        const iconScale = Math.min(74 / icon.width, 74 / icon.height);
        icon.setScale(iconScale);
        children.push(icon);
      } else {
        children.push(
          this.scene.add
            .text(x, y, item.name, {
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "18px",
              color: "#fff1c2",
              align: "center",
              stroke: "#070402",
              strokeThickness: 4,
              wordWrap: { width: 112 }
            })
            .setOrigin(0.5)
        );
      }

      const hitZone = this.scene.add.zone(x, y, 150, 150).setInteractive({ useHandCursor: true });
      hitZone.on("pointerdown", () => this.showItemDescription(x, y, item.name, item.description));
      children.push(hitZone);
      return children;
    });
  }

  private createEquipmentSlotFrames(): Phaser.GameObjects.GameObject[] {
    const children: Phaser.GameObjects.GameObject[] = EQUIPMENT_SLOT_POSITIONS.map((slot) =>
      this.scene.add
        .image(this.toPanelX(slot.x), this.toPanelY(slot.y), IMAGE_ASSETS.inventoryEquipmentSlotEmpty.key)
        .setDisplaySize(185, 195)
    );

    EQUIPMENT_SLOT_IDS.forEach((slotId) => {
      const slot = EQUIPMENT_SLOTS[slotId];
      const x = this.toPanelX(slot.x);
      const y = this.toPanelY(slot.y);
      const label = this.scene.add
        .text(x, y + 42, GAME_TEXTS.inventory.equipmentSlotLabels[slotId], {
          fontFamily: "Georgia, serif",
          fontSize: "22px",
          color: "#fff1c2",
          align: "center",
          stroke: "#120d0a",
          strokeThickness: 4
        })
        .setOrigin(0.5);

      children.push(label);
    });

    return children;
  }

  private createKeySlotFrames(): Phaser.GameObjects.Image[] {
    return KEY_SLOT_POSITIONS.map((slot) =>
      this.scene.add
        .image(this.toPanelX(slot.x), this.toPanelY(slot.y), IMAGE_ASSETS.inventoryKeySlotEmpty.key)
        .setDisplaySize(185, 169)
    );
  }

  private createPassiveItems(): Phaser.GameObjects.GameObject[] {
    return this.getPassiveItems().flatMap((passive, index) => {
      const slot = PASSIVE_SLOT_POSITIONS[index];
      if (!slot) {
        return [];
      }

      const x = this.toPanelX(slot.x);
      const y = this.toPanelY(slot.y);
      const children: Phaser.GameObjects.GameObject[] = [];

      if (this.scene.textures.exists(passive.iconKey)) {
        const icon = this.scene.add.image(x, y, passive.iconKey);
        const iconScale = Math.min(82 / icon.width, 82 / icon.height);
        icon.setScale(iconScale);
        children.push(icon);
      }

      const hitZone = this.scene.add.zone(x, y, 108, 108).setInteractive({ useHandCursor: true });
      hitZone.on("pointerdown", () => this.showItemDescription(x, y, passive.name, passive.description));
      children.push(hitZone);

      return children;
    });
  }

  private getPassiveItems(): PassiveInventoryItem[] {
    const text = GAME_TEXTS.village.shop;
    const upgrades = getPermanentUpgrades();
    const passives: PassiveInventoryItem[] = [];

    if (upgrades.dressingLevel > 0) {
      passives.push({
        id: "dressing",
        name: text.dressingName,
        description: text.dressingEffect(getMaxStartingEquipmentCount()),
        level: upgrades.dressingLevel,
        iconKey: IMAGE_ASSETS.passiveSurvivalDressing.key
      });
    }
    if (upgrades.cowardReflexLevel > 0) {
      passives.push({
        id: "cowardReflex",
        name: text.cowardReflexName,
        description: text.cowardReflexEffect(getCowardReflexCancelPercent()),
        level: upgrades.cowardReflexLevel,
        iconKey: IMAGE_ASSETS.passiveCowardReflexes.key
      });
    }
    if (upgrades.tragicCardioLevel > 0) {
      passives.push({
        id: "tragicCardio",
        name: text.tragicCardioName,
        description: text.tragicCardioEffect(getTragicCardioPercent()),
        level: upgrades.tragicCardioLevel,
        iconKey: IMAGE_ASSETS.passiveTragicCardio.key
      });
    }
    if (upgrades.doorReadingLevel > 0) {
      passives.push({
        id: "doorReading",
        name: text.doorReadingName,
        description: text.doorReadingEffect(getDoorReadingPercent()),
        level: upgrades.doorReadingLevel,
        iconKey: IMAGE_ASSETS.passiveDoorReading.key
      });
    }

    return passives;
  }

  private showItemDescription(x: number, y: number, itemName: string, itemDescription: string): void {
    const descriptionKey = `${itemName}:${itemDescription}`;
    if (this.activeDescriptionKey === descriptionKey && this.itemDescriptionBubble) {
      this.itemDescriptionBubble.destroy();
      this.itemDescriptionBubble = undefined;
      this.activeDescriptionKey = undefined;
      return;
    }

    this.itemDescriptionBubble?.destroy();
    this.itemDescriptionBubble = createItemDescriptionBubble(
      this.scene,
      this.container.x + x,
      this.container.y + y + 112,
      itemName,
      itemDescription
    ).setDepth(PANEL_DEPTH + 4);
    this.activeDescriptionKey = descriptionKey;
  }

  private toPanelX(sourceX: number): number {
    return (sourceX - PANEL_SOURCE.width / 2) * (PANEL_SOURCE.displayWidth / PANEL_SOURCE.width);
  }

  private toPanelY(sourceY: number): number {
    return (sourceY - PANEL_SOURCE.height / 2) * (PANEL_SOURCE.displayHeight / PANEL_SOURCE.height);
  }
}
