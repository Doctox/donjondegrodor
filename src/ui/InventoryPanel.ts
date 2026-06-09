import Phaser from "phaser";
import { IMAGE_ASSETS, INVENTORY_ITEM_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { getItemDefinition } from "../data/itemDefinitions";
import { createItemDescriptionBubble } from "./itemDescriptionBubble";
import { createNineSlicePanel } from "./nineSlicePanel";

const PANEL_DEPTH = 92;

type InventoryPanelReport = {
  empty: boolean;
  inventory: string[];
  itemNames: string[];
  itemIconKeys: (string | null)[];
};

type InventoryPanelItem = {
  id: string;
  name: string;
  description: string;
  iconKey?: string;
};

export class InventoryPanel {
  private readonly blocker: Phaser.GameObjects.Rectangle;
  private readonly container: Phaser.GameObjects.Container;
  private readonly panelBlocker: Phaser.GameObjects.Zone;
  private itemDescriptionBubble?: Phaser.GameObjects.Container;
  private readonly handleEscape: (event: KeyboardEvent) => void;

  constructor(
    private readonly scene: Phaser.Scene,
    inventory: string[],
    private readonly onClose: () => void
  ) {
    const items = [...inventory];
    const panelItems = items.map((itemId) => {
      const asset = INVENTORY_ITEM_ASSETS[itemId as keyof typeof INVENTORY_ITEM_ASSETS];
      return {
        id: itemId,
        name: getItemDefinition(itemId)?.name ?? GAME_TEXTS.inventory.unknownItem(itemId),
        description: getItemDefinition(itemId)?.description ?? GAME_TEXTS.inventory.descriptionFallback,
        iconKey: asset?.key
      } satisfies InventoryPanelItem;
    });
    const itemNames = panelItems.map((item) => item.name);

    this.blocker = scene.add
      .rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x050403, 0.54)
      .setOrigin(0)
      .setDepth(PANEL_DEPTH)
      .setInteractive({ useHandCursor: false });
    this.blocker.on("pointerdown", () => this.onClose());

    const panelWidth = 760;
    const panelHeight = panelItems.length > 0 ? 470 : 340;
    const panelX = WORLD_WIDTH / 2;
    const panelY = WORLD_HEIGHT / 2;
    this.container = scene.add.container(panelX, panelY).setDepth(PANEL_DEPTH + 2);

    const background = createNineSlicePanel(
      scene,
      IMAGE_ASSETS.frameStory.key,
      0,
      0,
      panelWidth,
      panelHeight,
      { left: 142, right: 142, top: 88, bottom: 88 }
    );

    this.panelBlocker = scene.add
      .zone(panelX, panelY, panelWidth, panelHeight)
      .setDepth(PANEL_DEPTH + 1)
      .setInteractive({ useHandCursor: false });

    const title = scene.add
      .text(0, -panelHeight / 2 + 74, GAME_TEXTS.inventory.title, {
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [background, title];

    if (panelItems.length === 0) {
      children.push(
        scene.add
          .text(0, -10, GAME_TEXTS.inventory.empty, {
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: "26px",
            color: "#f9dfaa",
            align: "center",
            wordWrap: { width: 500 }
          })
          .setOrigin(0.5)
      );
    } else {
      children.push(...this.createItemGrid(panelItems));
    }

    const closeButton = scene.add
      .text(0, panelHeight / 2 - 72, GAME_TEXTS.common.close, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "24px",
        color: "#1b100b",
        backgroundColor: "#f0c071",
        padding: { x: 24, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeButton.on("pointerdown", () => this.onClose());
    children.push(closeButton);

    this.container.add(children);

    this.handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        this.onClose();
      }
    };
    scene.input.keyboard?.on("keydown", this.handleEscape);

    (window as unknown as { __inventoryPanelReport?: InventoryPanelReport }).__inventoryPanelReport = {
      empty: items.length === 0,
      inventory: items,
      itemNames,
      itemIconKeys: panelItems.map((item) => item.iconKey ?? null)
    };
  }

  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.handleEscape);
    this.itemDescriptionBubble?.destroy();
    this.panelBlocker.destroy();
    this.container.destroy(true);
    this.blocker.destroy();
  }

  private createItemGrid(items: InventoryPanelItem[]): Phaser.GameObjects.GameObject[] {
    const children: Phaser.GameObjects.GameObject[] = [];
    const columns = 4;
    const slotSize = 118;
    const gap = 22;
    const startX = -((columns - 1) * (slotSize + gap)) / 2;
    const startY = -46;

    items.forEach((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + column * (slotSize + gap);
      const y = startY + row * (slotSize + gap);
      const slot = this.scene.add.container(x, y);
      const background = this.scene.add.rectangle(0, 0, slotSize, slotSize, 0x140e09, 0.78).setOrigin(0.5);
      background.setStrokeStyle(2, 0xf0c071, 0.82);
      slot.add(background);

      if (item.iconKey && this.scene.textures.exists(item.iconKey)) {
        const icon = this.scene.add.image(0, 0, item.iconKey);
        const scale = Math.min(92 / icon.width, 92 / icon.height, 1);
        icon.setScale(scale);
        slot.add(icon);
      } else {
        slot.add(
          this.scene.add
            .text(0, 0, item.name, {
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "18px",
              color: "#f9dfaa",
              align: "center",
              wordWrap: { width: 92 }
            })
            .setOrigin(0.5)
        );
      }

      slot.setSize(slotSize, slotSize);
      slot.setInteractive(new Phaser.Geom.Rectangle(-slotSize / 2, -slotSize / 2, slotSize, slotSize), Phaser.Geom.Rectangle.Contains);
      slot.on("pointerdown", () => this.showItemDescription(item.name, item.description, x, y - slotSize / 2 - 54));
      children.push(slot);
    });

    return children;
  }

  private showItemDescription(itemName: string, itemDescription: string, x: number, y: number): void {
    this.itemDescriptionBubble?.destroy();
    this.itemDescriptionBubble = createItemDescriptionBubble(this.scene, x, y, itemName, itemDescription);
    this.container.add(this.itemDescriptionBubble);
    this.container.bringToTop(this.itemDescriptionBubble);
  }
}
