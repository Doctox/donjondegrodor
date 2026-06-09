import Phaser from "phaser";
import { GAME_TEXTS } from "../../../data/gameTexts";
import {
  getPassiveBuyState,
  getPassiveRowStatus,
  PassiveShopEntry,
  PassiveShopEntryId,
  PassiveUpgradeId
} from "./shopSelectors";

export const SHOP_PASSIVES_ROWS_PER_PAGE = 8;

export type ShopPassivesViewAssets = {
  backgroundKey: string;
  windowFrameKey: string;
  rowNormalKey: string;
  rowHoverKey: string;
  rowSelectedKey: string;
  detailIconFrameKey: string;
  nameRibbonKey: string;
  buyButtonNormalKey: string;
  buyButtonHoverKey: string;
  buyButtonDisabledKey: string;
  pageArrowLeftKey: string;
  pageArrowRightKey: string;
  closeButtonKey: string;
};

export type ShopPassivesViewCallbacks = {
  onBack: () => void;
  onBuyPassive: (upgradeId: PassiveUpgradeId) => void;
  onPageChange: (page: number) => void;
  onSelectPassive: (passiveId: PassiveShopEntryId) => void;
};

export type ShopPassivesViewOptions = {
  assets: ShopPassivesViewAssets;
  bankGold: number;
  callbacks: ShopPassivesViewCallbacks;
  entries: PassiveShopEntry[];
  feedback?: string;
  page: number;
  selectedPassiveId: PassiveShopEntryId;
  totalPages: number;
  worldHeight: number;
  worldWidth: number;
};

const SHOP_PASSIVES_PANEL = {
  width: 1246,
  height: 1061,
  displayWidth: 1246,
  displayHeight: 1061
};

const PASSIVE_ROW_POSITIONS = [
  { x: 307, y: 221 },
  { x: 307, y: 304 },
  { x: 307, y: 387 },
  { x: 307, y: 470 },
  { x: 307, y: 553 },
  { x: 307, y: 636 },
  { x: 307, y: 719 },
  { x: 307, y: 802 }
];

const PASSIVE_DETAIL_LAYOUT = {
  x: 846,
  buttonX: 856,
  iconY: 319,
  ribbonY: 526,
  textY: 628,
  buttonY: 914
};

const PASSIVE_PAGINATION_LAYOUT = {
  y: 932,
  leftX: 154,
  textX: 306,
  rightX: 456
};

export class ShopPassivesView {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: ShopPassivesViewOptions
  ) {}

  create(): Phaser.GameObjects.Container {
    const { assets, bankGold, entries, feedback, page, selectedPassiveId, totalPages, worldHeight, worldWidth } = this.options;
    const text = GAME_TEXTS.village.shop;
    const pageEntries = entries.slice(page * SHOP_PASSIVES_ROWS_PER_PAGE, (page + 1) * SHOP_PASSIVES_ROWS_PER_PAGE);
    const selectedEntry = entries.find((entry) => entry.id === selectedPassiveId) ?? entries[0];
    const container = this.scene.add.container(worldWidth / 2, worldHeight / 2).setDepth(80);
    const shopBackground = this.scene.add.image(0, 0, assets.backgroundKey).setDisplaySize(worldWidth, worldHeight);
    const overlay = this.scene.add.rectangle(0, 0, worldWidth, worldHeight, 0x050403, 0.24).setOrigin(0.5);
    const background = this.scene.add
      .image(0, 0, assets.windowFrameKey)
      .setDisplaySize(SHOP_PASSIVES_PANEL.displayWidth, SHOP_PASSIVES_PANEL.displayHeight);
    const title = this.scene.add
      .text(this.shopPassivesX(624), this.shopPassivesY(88), text.passiveShopTitle, {
        fontFamily: "Georgia, serif",
        fontSize: "36px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 7,
        shadow: { offsetX: 2, offsetY: 3, color: "#000000", blur: 3, fill: true }
      })
      .setOrigin(0.5);
    const goldText = this.scene.add
      .text(this.shopPassivesX(249), this.shopPassivesY(139), text.goldAmount(bankGold), {
        fontFamily: "Georgia, serif",
        fontSize: "36px",
        color: "#ffe6aa",
        align: "center",
        stroke: "#120906",
        strokeThickness: 6,
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true }
      })
      .setOrigin(0.5);
    const effectMessage = feedback && feedback !== text.bankGold(bankGold) ? feedback : "";
    const effect = this.scene.add
      .text(this.shopPassivesX(PASSIVE_DETAIL_LAYOUT.x), this.shopPassivesY(814), effectMessage, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "21px",
        color: "#f9dfaa",
        align: "center",
        stroke: "#070402",
        strokeThickness: 4,
        wordWrap: { width: 520 }
      })
      .setOrigin(0.5);

    container.add([
      shopBackground,
      overlay,
      background,
      title,
      goldText,
      ...this.createPassiveRows(pageEntries),
      ...this.createPassiveDetail(selectedEntry, bankGold),
      ...this.createPassivePagination(totalPages),
      this.createCloseButton(),
      effect
    ]);
    return container;
  }

  private createPassiveRows(entries: PassiveShopEntry[]): Phaser.GameObjects.GameObject[] {
    return PASSIVE_ROW_POSITIONS.flatMap((position, index) => this.createPassiveRow(entries[index], position));
  }

  private createPassiveRow(entry: PassiveShopEntry | undefined, position: { x: number; y: number }): Phaser.GameObjects.GameObject[] {
    const text = GAME_TEXTS.village.shop;
    const selected = entry?.id === this.options.selectedPassiveId;
    const x = this.shopPassivesX(position.x);
    const y = this.shopPassivesY(position.y);
    const row = this.scene.add
      .image(x, y, selected ? this.options.assets.rowSelectedKey : this.options.assets.rowNormalKey)
      .setDisplaySize(415, 74);

    if (!entry) {
      row.setAlpha(0.72);
      return [row];
    }

    const rowStatus = getPassiveRowStatus(entry);
    const icon = this.scene.add.image(x - 162, y, entry.iconKey).setDisplaySize(34, 34);
    const name = this.scene.add
      .text(x - 104, y - 11, entry.name, {
        fontFamily: "Georgia, serif",
        fontSize: "17px",
        color: "#fff1c2",
        stroke: "#070402",
        strokeThickness: 4,
        wordWrap: { width: 194 }
      })
      .setOrigin(0, 0.5);
    const level = this.scene.add
      .text(x - 104, y + 13, text.dressingLevel(entry.level).replace("/3", `/${entry.maxLevel}`), {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "13px",
        color: "#e8c98b",
        stroke: "#070402",
        strokeThickness: 3
      })
      .setOrigin(0, 0.5);
    const cost = this.scene.add
      .text(x + 152, y + 1, rowStatus.label, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: rowStatus.label.length > 6 ? "11px" : "15px",
        color: rowStatus.color,
        align: "center",
        stroke: "#070402",
        strokeThickness: 3,
        wordWrap: { width: 62 }
      })
      .setOrigin(0.5);
    const hitZone = this.scene.add.zone(x, y, 415, 74).setInteractive({ useHandCursor: true });
    hitZone.on("pointerover", () => {
      if (entry.id !== this.options.selectedPassiveId) {
        row.setTexture(this.options.assets.rowHoverKey).setDisplaySize(415, 74);
      }
    });
    hitZone.on("pointerout", () => {
      if (entry.id !== this.options.selectedPassiveId) {
        row.setTexture(this.options.assets.rowNormalKey).setDisplaySize(415, 74);
      }
    });
    hitZone.on("pointerdown", () => this.options.callbacks.onSelectPassive(entry.id));
    return [row, icon, name, level, cost, hitZone];
  }

  private createPassiveDetail(entry: PassiveShopEntry | undefined, bankGold: number): Phaser.GameObjects.GameObject[] {
    if (!entry) {
      return [];
    }

    const text = GAME_TEXTS.village.shop;
    const x = this.shopPassivesX(PASSIVE_DETAIL_LAYOUT.x);
    const children: Phaser.GameObjects.GameObject[] = [];
    const iconFrame = this.scene.add
      .image(x, this.shopPassivesY(PASSIVE_DETAIL_LAYOUT.iconY), this.options.assets.detailIconFrameKey)
      .setDisplaySize(298, 280);
    const icon = this.scene.add.image(x, this.shopPassivesY(PASSIVE_DETAIL_LAYOUT.iconY), entry.iconKey);
    icon.setScale(Math.min(178 / icon.width, 178 / icon.height));
    const ribbon = this.scene.add
      .image(x, this.shopPassivesY(PASSIVE_DETAIL_LAYOUT.ribbonY), this.options.assets.nameRibbonKey)
      .setDisplaySize(611, 112);
    const name = this.scene.add
      .text(x, this.shopPassivesY(PASSIVE_DETAIL_LAYOUT.ribbonY - 1), entry.name, {
        fontFamily: "Georgia, serif",
        fontSize: "31px",
        color: "#fff1c2",
        align: "center",
        stroke: "#070402",
        strokeThickness: 6,
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true }
      })
      .setOrigin(0.5);
    const detailLines = [
      text.passiveCurrentEffect(entry.currentEffect),
      entry.nextCost === undefined ? text.passiveNoNextEffect : text.passiveNextEffect(entry.nextEffect),
      entry.nextCost === undefined ? text.maxLevel : text.passiveCost(entry.nextCost)
    ];
    const details = this.scene.add
      .text(x, this.shopPassivesY(PASSIVE_DETAIL_LAYOUT.textY), detailLines.join("\n"), {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "23px",
        color: "#f9dfaa",
        align: "center",
        lineSpacing: 18,
        stroke: "#070402",
        strokeThickness: 4,
        wordWrap: { width: 470 }
      })
      .setOrigin(0.5, 0);
    children.push(iconFrame, icon, ribbon, name, details, ...this.createPassiveBuyButton(entry, bankGold));
    return children;
  }

  private createPassiveBuyButton(entry: PassiveShopEntry, bankGold: number): Phaser.GameObjects.GameObject[] {
    const x = this.shopPassivesX(PASSIVE_DETAIL_LAYOUT.buttonX);
    const y = this.shopPassivesY(PASSIVE_DETAIL_LAYOUT.buttonY);
    const buyState = getPassiveBuyState(entry, bankGold);
    const buttonImage = this.scene.add
      .image(x, y, buyState.disabled ? this.options.assets.buyButtonDisabledKey : this.options.assets.buyButtonNormalKey)
      .setDisplaySize(552, 91);
    const label = this.scene.add
      .text(x, y - 1, buyState.label, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "32px",
        color: buyState.disabled ? "#d8c7a2" : "#fff1c2",
        align: "center",
        stroke: "#1d1109",
        strokeThickness: 6,
        shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 2, fill: true }
      })
      .setOrigin(0.5);

    const upgradeId = entry.id;
    if (buyState.disabled || !isPassiveUpgradeId(upgradeId)) {
      return [buttonImage, label];
    }

    const hitZone = this.scene.add.zone(x, y, 552, 91).setInteractive({ useHandCursor: true });
    hitZone.on("pointerover", () => buttonImage.setTexture(this.options.assets.buyButtonHoverKey).setDisplaySize(552, 91));
    hitZone.on("pointerout", () => buttonImage.setTexture(this.options.assets.buyButtonNormalKey).setDisplaySize(552, 91));
    hitZone.on("pointerdown", () => this.options.callbacks.onBuyPassive(upgradeId));
    return [buttonImage, label, hitZone];
  }

  private createPassivePagination(totalPages: number): Phaser.GameObjects.GameObject[] {
    const text = GAME_TEXTS.village.shop;
    const y = this.shopPassivesY(PASSIVE_PAGINATION_LAYOUT.y);
    const pageText = this.scene.add
      .text(this.shopPassivesX(PASSIVE_PAGINATION_LAYOUT.textX), y, text.page(this.options.page + 1, totalPages), {
        fontFamily: "Georgia, serif",
        fontSize: "25px",
        color: "#ffe6aa",
        align: "center",
        stroke: "#070402",
        strokeThickness: 5
      })
      .setOrigin(0.5);
    const leftArrow = this.scene.add
      .image(this.shopPassivesX(PASSIVE_PAGINATION_LAYOUT.leftX), y, this.options.assets.pageArrowLeftKey)
      .setDisplaySize(43, 47);
    const rightArrow = this.scene.add
      .image(this.shopPassivesX(PASSIVE_PAGINATION_LAYOUT.rightX), y, this.options.assets.pageArrowRightKey)
      .setDisplaySize(45, 47);
    const children: Phaser.GameObjects.GameObject[] = [leftArrow, rightArrow, pageText];

    if (this.options.page > 0) {
      const leftZone = this.scene.add
        .zone(this.shopPassivesX(PASSIVE_PAGINATION_LAYOUT.leftX), y, 84, 74)
        .setInteractive({ useHandCursor: true });
      leftZone.on("pointerdown", () => this.options.callbacks.onPageChange(Math.max(0, this.options.page - 1)));
      children.push(leftZone);
    } else {
      leftArrow.setAlpha(0.35);
    }

    if (this.options.page < totalPages - 1) {
      const rightZone = this.scene.add
        .zone(this.shopPassivesX(PASSIVE_PAGINATION_LAYOUT.rightX), y, 84, 74)
        .setInteractive({ useHandCursor: true });
      rightZone.on("pointerdown", () => this.options.callbacks.onPageChange(Math.min(totalPages - 1, this.options.page + 1)));
      children.push(rightZone);
    } else {
      rightArrow.setAlpha(0.35);
    }

    return children;
  }

  private createCloseButton(): Phaser.GameObjects.Container {
    const button = this.scene.add.container(this.shopPassivesX(1102), this.shopPassivesY(165));
    const icon = this.scene.add.image(0, 0, this.options.assets.closeButtonKey).setDisplaySize(111, 109);
    button.add(icon);
    button.setInteractive(new Phaser.Geom.Rectangle(-62, -62, 124, 124), Phaser.Geom.Rectangle.Contains);
    button.on("pointerover", () => icon.setDisplaySize(118, 116));
    button.on("pointerout", () => icon.setDisplaySize(111, 109));
    button.on("pointerdown", () => this.options.callbacks.onBack());
    return button;
  }

  private shopPassivesX(sourceX: number): number {
    return (sourceX - SHOP_PASSIVES_PANEL.width / 2) * (SHOP_PASSIVES_PANEL.displayWidth / SHOP_PASSIVES_PANEL.width);
  }

  private shopPassivesY(sourceY: number): number {
    return (sourceY - SHOP_PASSIVES_PANEL.height / 2) * (SHOP_PASSIVES_PANEL.displayHeight / SHOP_PASSIVES_PANEL.height);
  }
}

function isPassiveUpgradeId(passiveId: PassiveShopEntryId): passiveId is PassiveUpgradeId {
  return passiveId === "dressing" || passiveId === "cowardReflex" || passiveId === "tragicCardio" || passiveId === "doorReading";
}
