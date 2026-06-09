import Phaser from "phaser";
import { AssetDefinition } from "../../../data/assetKeys";
import { GAME_TEXTS } from "../../../data/gameTexts";
import { ItemRarity } from "../../../data/itemDefinitions";
import {
  getShopItemDetailModel,
  getShopItemPrice,
  getShopSlotPriceModel,
  ShopGridItem
} from "./shopSelectors";

export const SHOP_ITEMS_PER_PAGE = 12;

export type ShopItemsViewAssets = {
  backgroundKey: string;
  windowFrameKey: string;
  itemSlotEmptyKey: string;
  itemSlotHoverKey: string;
  itemSlotSelectedKey: string;
  nameRibbonKey: string;
  buyButtonNormalKey: string;
  buyButtonHoverKey: string;
  buyButtonDisabledKey: string;
  pageArrowLeftKey: string;
  pageArrowRightKey: string;
  closeButtonKey: string;
  goldKey: string;
  rarityTextures: Record<ItemRarity, string>;
  inventoryItemAssets: Record<string, AssetDefinition>;
};

export type ShopItemsViewCallbacks = {
  getBreakChance: (itemId: string) => number;
  getOwnedCount: (itemId: string) => number;
  onBack: () => void;
  onBuyItem: (itemId: string, price: number) => void;
  onPageChange: (page: number) => void;
  onSelectItem: (itemId: string) => void;
};

export type ShopItemsViewOptions = {
  assets: ShopItemsViewAssets;
  bankGold: number;
  callbacks: ShopItemsViewCallbacks;
  empty: boolean;
  feedback?: string;
  page: number;
  pageItems: ShopGridItem[];
  selectedItemId?: string;
  totalPages: number;
  worldHeight: number;
  worldWidth: number;
};

const SHOP_ITEMS_PANEL = {
  width: 1672,
  height: 941,
  displayWidth: 1600,
  displayHeight: 901,
  slots: [
    { x: 203, y: 283 },
    { x: 425, y: 283 },
    { x: 646, y: 283 },
    { x: 868, y: 283 },
    { x: 203, y: 476 },
    { x: 425, y: 476 },
    { x: 646, y: 476 },
    { x: 868, y: 476 },
    { x: 203, y: 668 },
    { x: 425, y: 668 },
    { x: 646, y: 668 },
    { x: 868, y: 668 }
  ]
};

export class ShopItemsView {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: ShopItemsViewOptions
  ) {}

  create(): Phaser.GameObjects.Container {
    const { assets, bankGold, feedback, pageItems, selectedItemId, totalPages, worldHeight, worldWidth } = this.options;
    const text = GAME_TEXTS.village.shop;
    const selectedShopItem = pageItems.find((item) => item.itemId === selectedItemId);
    const container = this.scene.add.container(worldWidth / 2, worldHeight / 2).setDepth(80);
    const shopBackground = this.scene.add.image(0, 0, assets.backgroundKey).setDisplaySize(worldWidth, worldHeight);
    const overlay = this.scene.add.rectangle(0, 0, worldWidth, worldHeight, 0x050403, 0.24).setOrigin(0.5);
    const background = this.scene.add
      .image(0, 0, assets.windowFrameKey)
      .setDisplaySize(SHOP_ITEMS_PANEL.displayWidth, SHOP_ITEMS_PANEL.displayHeight);
    const title = this.scene.add
      .text(this.shopItemsX(836), this.shopItemsY(101), text.shopTitle, {
        fontFamily: "Georgia, serif",
        fontSize: "54px",
        color: "#ffe6aa",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 6,
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true }
      })
      .setOrigin(0.5);
    const goldText = this.scene.add
      .text(this.shopItemsX(258), this.shopItemsY(112), text.goldAmount(bankGold), {
        fontFamily: "Georgia, serif",
        fontSize: "40px",
        color: "#ffe6aa",
        align: "center",
        stroke: "#120906",
        strokeThickness: 6,
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true }
      })
      .setOrigin(0.5);

    container.add([
      shopBackground,
      overlay,
      background,
      title,
      goldText,
      ...this.createShopItemGrid(pageItems),
      ...this.createPagination(totalPages),
      ...this.createShopItemDetail(selectedItemId, bankGold, Boolean(selectedShopItem?.locked)),
      ...this.createMessage(feedback, this.options.empty),
      this.createCloseButton()
    ]);
    return container;
  }

  private createMessage(feedback: string | undefined, empty: boolean): Phaser.GameObjects.GameObject[] {
    const message = feedback ?? (empty ? GAME_TEXTS.village.shop.emptyDiscoveries : undefined);
    if (!message) {
      return [];
    }

    const panel = this.scene.add
      .rectangle(this.shopItemsX(536), this.shopItemsY(474), 570, 78, 0x120d0a, 0.72)
      .setStrokeStyle(2, 0xd8a84d, 0.72);
    const text = this.scene.add
      .text(this.shopItemsX(536), this.shopItemsY(474), message, {
        fontFamily: "Georgia, serif",
        fontSize: "27px",
        color: "#ffe6aa",
        align: "center",
        stroke: "#070402",
        strokeThickness: 5,
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true },
        wordWrap: { width: 520 }
      })
      .setOrigin(0.5);

    return [panel, text];
  }

  private createShopItemGrid(items: ShopGridItem[]): Phaser.GameObjects.GameObject[] {
    const children: Phaser.GameObjects.GameObject[] = [];
    SHOP_ITEMS_PANEL.slots.forEach((slot, index) => {
      const item = items[index];
      children.push(...this.createShopItemSlot(this.shopItemsX(slot.x), this.shopItemsY(slot.y), item));
    });
    return children;
  }

  private createShopItemSlot(x: number, y: number, shopItem?: ShopGridItem): Phaser.GameObjects.GameObject[] {
    const children: Phaser.GameObjects.GameObject[] = [];
    const itemId = shopItem?.itemId;
    const locked = Boolean(shopItem?.locked);
    const selected = Boolean(itemId && itemId === this.options.selectedItemId);
    const slotWidth = 178;
    const slotHeight = 162;
    const slotImage = this.scene.add
      .image(x, y, selected ? this.options.assets.itemSlotSelectedKey : this.options.assets.itemSlotEmptyKey)
      .setDisplaySize(slotWidth, slotHeight);
    children.push(slotImage);

    if (!itemId) {
      return children;
    }

    const asset = this.options.assets.inventoryItemAssets[itemId];
    if (asset && this.scene.textures.exists(asset.key)) {
      const icon = this.scene.add.image(x, y - 24, asset.key);
      const scale = Math.min(116 / icon.width, 98 / icon.height);
      icon.setScale(scale);
      children.push(icon);
    }

    children.push(...this.createSlotPrice(x, y + 54, getShopSlotPriceModel(getShopItemPrice(itemId), locked)));

    if (locked) {
      const lockOverlay = this.scene.add
        .rectangle(x, y - 10, slotWidth - 18, slotHeight - 28, 0x241032, 0.56)
        .setStrokeStyle(1, 0x5c2d78, 0.35);
      children.push(lockOverlay);
    }

    const itemHitZone = this.scene.add.zone(x, y, slotWidth, slotHeight).setInteractive({ useHandCursor: true });
    itemHitZone.on("pointerover", () => {
      if (itemId !== this.options.selectedItemId) {
        slotImage.setTexture(this.options.assets.itemSlotHoverKey).setDisplaySize(slotWidth, slotHeight);
      }
    });
    itemHitZone.on("pointerout", () => {
      if (itemId !== this.options.selectedItemId) {
        slotImage.setTexture(this.options.assets.itemSlotEmptyKey).setDisplaySize(slotWidth, slotHeight);
      }
    });
    itemHitZone.on("pointerdown", () => this.options.callbacks.onSelectItem(itemId));
    children.push(itemHitZone);

    return children;
  }

  private createShopItemDetail(itemId: string | undefined, bankGold: number, locked: boolean): Phaser.GameObjects.GameObject[] {
    const text = GAME_TEXTS.village.shop;
    const children: Phaser.GameObjects.GameObject[] = [];
    const x = this.shopItemsX(1310);
    const detail = getShopItemDetailModel(itemId, {
      bankGold,
      locked,
      ownedCount: itemId ? this.options.callbacks.getOwnedCount(itemId) : 0,
      breakChance: itemId ? this.options.callbacks.getBreakChance(itemId) : 0
    });
    const item = detail.item;
    const asset = itemId ? this.options.assets.inventoryItemAssets[itemId] : undefined;
    const rarityTexture = item?.rarity ? this.options.assets.rarityTextures[item.rarity] : undefined;

    if (rarityTexture) {
      const rarityBackground = this.scene.add
        .image(x, this.shopItemsY(318), rarityTexture)
        .setDisplaySize(390, 318)
        .setAlpha(0.72);
      children.push(rarityBackground);
    }
    if (asset && this.scene.textures.exists(asset.key)) {
      const icon = this.scene.add.image(x, this.shopItemsY(318), asset.key);
      const scale = Math.min(245 / icon.width, 210 / icon.height);
      icon.setScale(scale);
      children.push(icon);
    }
    if (locked && item) {
      const lockOverlay = this.scene.add
        .rectangle(x, this.shopItemsY(318), 330, 250, 0x241032, 0.56)
        .setStrokeStyle(2, 0x5c2d78, 0.4);
      children.push(lockOverlay);
    }

    const ribbon = this.scene.add.image(x, this.shopItemsY(525), this.options.assets.nameRibbonKey).setDisplaySize(550, 101);
    const name = this.scene.add
      .text(x, this.shopItemsY(523), item?.name ?? text.selectItemPrompt, {
        fontFamily: "Georgia, serif",
        fontSize: "31px",
        color: "#ffe6aa",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5,
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true },
        wordWrap: { width: 460 }
      })
      .setOrigin(0.5);
    children.push(ribbon, name);

    const slotLabel = item?.equipmentSlot ? text.slotLabels[item.equipmentSlot] : text.unavailable;
    if (!locked) {
      const meta = this.scene.add
        .text(x, this.shopItemsY(604), item ? text.itemStats(slotLabel, detail.ownedCount, detail.breakChance) : text.itemStatsUnavailable, {
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "18px",
          color: "#ffe6aa",
          align: "center",
          stroke: "#070402",
          strokeThickness: 4,
          shadow: { offsetX: 1, offsetY: 1, color: "#000000", blur: 1, fill: true },
          wordWrap: { width: 500 }
        })
        .setOrigin(0.5);
      children.push(meta);
    }

    const detailText = this.scene.add
      .text(this.shopItemsX(1095), this.shopItemsY(646), locked ? text.lockedDescription : item?.description ?? GAME_TEXTS.inventory.descriptionFallback, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: locked ? "24px" : "20px",
        color: locked ? "#ffe6aa" : "#f4d6a0",
        align: locked ? "center" : "left",
        stroke: "#070402",
        strokeThickness: 4,
        shadow: { offsetX: 1, offsetY: 1, color: "#000000", blur: 1, fill: true },
        wordWrap: { width: 430 },
        maxLines: locked ? 2 : 3
      })
      .setOrigin(locked ? 0.5 : 0, 0);
    if (locked) {
      detailText.setX(x);
    }
    children.push(detailText);

    children.push(...this.createBuyButton(x, this.shopItemsY(821), itemId, detail.price, detail.buyState.canBuy, detail.buyState.disabled, detail.buyState.label));
    return children;
  }

  private createSlotPrice(
    x: number,
    y: number,
    priceModel: ReturnType<typeof getShopSlotPriceModel>
  ): Phaser.GameObjects.GameObject[] {
    const text = GAME_TEXTS.village.shop;
    if (priceModel.kind !== "price") {
      return [
        this.scene.add
          .text(x, y, priceModel.kind === "locked" ? text.lockedPrice : text.unavailable, {
            fontFamily: "Georgia, serif",
            fontSize: "19px",
            color: "#ffe6aa",
            align: "center",
            stroke: "#070402",
            strokeThickness: 4,
            shadow: { offsetX: 1, offsetY: 1, color: "#000000", blur: 1, fill: true }
          })
          .setOrigin(0.5)
      ];
    }

    const label = this.scene.add
      .text(x - 8, y, `${priceModel.price}`, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#ffe6aa",
        align: "center",
        stroke: "#070402",
        strokeThickness: 4,
        shadow: { offsetX: 1, offsetY: 1, color: "#000000", blur: 1, fill: true }
      })
      .setOrigin(1, 0.5);
    const icon = this.scene.add.image(x + 2, y, this.options.assets.goldKey).setDisplaySize(22, 22);
    return [label, icon];
  }

  private createBuyButton(
    x: number,
    y: number,
    itemId: string | undefined,
    price: number | undefined,
    canBuy: boolean,
    disabled: boolean,
    labelText: string
  ): Phaser.GameObjects.GameObject[] {
    const texture = disabled ? this.options.assets.buyButtonDisabledKey : this.options.assets.buyButtonNormalKey;
    const buttonImage = this.scene.add.image(x, y, texture).setDisplaySize(492, 90);
    const label = this.scene.add
      .text(x, y - 1, labelText, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "34px",
        color: disabled ? "#d8c7a2" : "#fff1c2",
        align: "center",
        stroke: "#1d1109",
        strokeThickness: 6,
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true }
      })
      .setOrigin(0.5);

    if (canBuy && itemId && price) {
      const hitZone = this.scene.add.zone(x, y, 492, 90).setInteractive({ useHandCursor: true });
      hitZone.on("pointerover", () => buttonImage.setTexture(this.options.assets.buyButtonHoverKey).setDisplaySize(492, 90));
      hitZone.on("pointerout", () => buttonImage.setTexture(this.options.assets.buyButtonNormalKey).setDisplaySize(492, 90));
      hitZone.on("pointerdown", () => this.options.callbacks.onBuyItem(itemId, price));
      return [buttonImage, label, hitZone];
    }

    return [buttonImage, label];
  }

  private createPagination(totalPages: number): Phaser.GameObjects.GameObject[] {
    const text = GAME_TEXTS.village.shop;
    const children: Phaser.GameObjects.GameObject[] = [];
    const pageText = this.scene.add
      .text(this.shopItemsX(511), this.shopItemsY(817), text.page(this.options.page + 1, totalPages), {
        fontFamily: "Georgia, serif",
        fontSize: "29px",
        color: "#ffe6aa",
        align: "center",
        stroke: "#070402",
        strokeThickness: 5,
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true }
      })
      .setOrigin(0.5);
    const leftArrow = this.scene.add.image(this.shopItemsX(266), this.shopItemsY(817), this.options.assets.pageArrowLeftKey).setDisplaySize(47, 51);
    const rightArrow = this.scene.add.image(this.shopItemsX(754), this.shopItemsY(817), this.options.assets.pageArrowRightKey).setDisplaySize(49, 51);
    children.push(leftArrow, rightArrow, pageText);

    if (this.options.page > 0) {
      const leftZone = this.scene.add.zone(this.shopItemsX(266), this.shopItemsY(817), 90, 84).setInteractive({ useHandCursor: true });
      leftZone.on("pointerover", () => leftArrow.setDisplaySize(54, 58));
      leftZone.on("pointerout", () => leftArrow.setDisplaySize(47, 51));
      leftZone.on("pointerdown", () => this.options.callbacks.onPageChange(Math.max(0, this.options.page - 1)));
      children.push(leftZone);
    } else {
      leftArrow.setAlpha(0.35);
    }

    if (this.options.page < totalPages - 1) {
      const rightZone = this.scene.add.zone(this.shopItemsX(754), this.shopItemsY(817), 90, 84).setInteractive({ useHandCursor: true });
      rightZone.on("pointerover", () => rightArrow.setDisplaySize(56, 58));
      rightZone.on("pointerout", () => rightArrow.setDisplaySize(49, 51));
      rightZone.on("pointerdown", () => this.options.callbacks.onPageChange(Math.min(totalPages - 1, this.options.page + 1)));
      children.push(rightZone);
    } else {
      rightArrow.setAlpha(0.35);
    }

    return children;
  }

  private createCloseButton(): Phaser.GameObjects.Container {
    const button = this.scene.add.container(this.shopItemsX(1576), this.shopItemsY(111));
    const icon = this.scene.add.image(0, 0, this.options.assets.closeButtonKey).setDisplaySize(111, 109);
    button.add(icon);
    button.setInteractive(new Phaser.Geom.Rectangle(-62, -62, 124, 124), Phaser.Geom.Rectangle.Contains);
    button.on("pointerover", () => icon.setDisplaySize(118, 116));
    button.on("pointerout", () => icon.setDisplaySize(111, 109));
    button.on("pointerdown", () => this.options.callbacks.onBack());
    return button;
  }

  private shopItemsX(nativeX: number): number {
    return (nativeX - SHOP_ITEMS_PANEL.width / 2) * (SHOP_ITEMS_PANEL.displayWidth / SHOP_ITEMS_PANEL.width);
  }

  private shopItemsY(nativeY: number): number {
    return (nativeY - SHOP_ITEMS_PANEL.height / 2) * (SHOP_ITEMS_PANEL.displayHeight / SHOP_ITEMS_PANEL.height);
  }
}
