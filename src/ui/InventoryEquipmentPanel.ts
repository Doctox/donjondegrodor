import Phaser from "phaser";
import { GrodorActor } from "../actors/GrodorActor";
import { IMAGE_ASSETS, INVENTORY_ITEM_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GrodorEquipmentId } from "../data/equipmentDefinitions";
import { GAME_TEXTS } from "../data/gameTexts";
import { EquipmentSlotId, getEquipmentSlot, getItemDefinition } from "../data/itemDefinitions";
import { createItemDescriptionBubble } from "./itemDescriptionBubble";

const PANEL_DEPTH = 92;
const PANEL_SOURCE = {
  width: 1116,
  height: 971,
  displayWidth: 1116,
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
  gloves: { x: 214, y: 473 },
  object: { x: 444, y: 746 },
  boots: { x: 674, y: 473 }
} satisfies Record<EquipmentSlotId, { x: number; y: number }>;

const EQUIPMENT_SLOT_IDS = ["weapon", "helmet", "amulet", "gloves", "object", "boots"] satisfies EquipmentSlotId[];
const EXTRA_SLOT_LABELS = [{ x: 674, y: 250, label: GAME_TEXTS.inventory.equipmentSlotLabels.cape }];

const KEY_SLOT_POSITIONS = [
  { x: 901, y: 201 },
  { x: 901, y: 392 },
  { x: 901, y: 583 },
  { x: 901, y: 774 }
];

const CLOSE_BUTTON = { x: 1054, y: 55, hitSize: 94 };

type EquippedItem = {
  id: GrodorEquipmentId;
  name: string;
  description: string;
  slot: EquipmentSlotId;
};

export class InventoryEquipmentPanel {
  private readonly blocker: Phaser.GameObjects.Rectangle;
  private readonly panelBlocker: Phaser.GameObjects.Zone;
  private readonly container: Phaser.GameObjects.Container;
  private readonly grodor: GrodorActor;
  private itemDescriptionBubble?: Phaser.GameObjects.Container;
  private readonly handleEscape: (event: KeyboardEvent) => void;

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

    this.grodor = new GrodorActor(scene, WORLD_WIDTH / 2 - 106, WORLD_HEIGHT / 2 + 142);
    this.grodor.container.setDepth(PANEL_DEPTH + 3);
    this.grodor.container.setScale(1.08);
    this.grodor.setEquipment(equipment);
    this.grodor.playIdle();

    this.container.add([
      background,
      ...this.createEquipmentSlotFrames(),
      ...this.createKeySlotFrames(),
      closeButton,
      closeHitZone,
      ...this.createSlotItems(equippedItems)
    ]);

    this.handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        this.onClose();
      }
    };
    scene.input.keyboard?.on("keydown", this.handleEscape);

    (window as unknown as { __inventoryEquipmentPanelReport?: unknown }).__inventoryEquipmentPanelReport = {
      equipment,
      equippedItems: equippedItems.map((item) => ({ id: item.id, name: item.name, slot: item.slot }))
    };
  }

  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.handleEscape);
    this.grodor.container.destroy(true);
    this.itemDescriptionBubble?.destroy();
    this.panelBlocker.destroy();
    this.container.destroy(true);
    this.blocker.destroy();
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

    EXTRA_SLOT_LABELS.forEach((slot) => {
      children.push(
        this.scene.add
          .text(this.toPanelX(slot.x), this.toPanelY(slot.y) + 42, slot.label, {
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#fff1c2",
            align: "center",
            stroke: "#120d0a",
            strokeThickness: 4
          })
          .setOrigin(0.5)
      );
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

  private showItemDescription(x: number, y: number, itemName: string, itemDescription: string): void {
    this.itemDescriptionBubble?.destroy();
    this.itemDescriptionBubble = createItemDescriptionBubble(this.scene, x, y + 112, itemName, itemDescription);
    this.container.add(this.itemDescriptionBubble);
  }

  private toPanelX(sourceX: number): number {
    return (sourceX - PANEL_SOURCE.width / 2) * (PANEL_SOURCE.displayWidth / PANEL_SOURCE.width);
  }

  private toPanelY(sourceY: number): number {
    return (sourceY - PANEL_SOURCE.height / 2) * (PANEL_SOURCE.displayHeight / PANEL_SOURCE.height);
  }
}
