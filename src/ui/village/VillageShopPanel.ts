import Phaser from "phaser";
import { IMAGE_ASSETS, INVENTORY_ITEM_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../../data/assetKeys";
import {
  getShopPassiveInputReport,
  publishShopPassiveInputReport,
  publishShopReport,
  publishVillageShopMenuReport,
  publishVillageShopPassiveReport
} from "../../debug/debugReports";
import { GAME_TEXTS } from "../../data/gameTexts";
import { getItemDefinition } from "../../data/itemDefinitions";
import {
  getDungeonRunState,
  spendBankGold
} from "../../systems/dungeonRunState";
import { getEquipmentBreakChancePercent } from "../../systems/equipmentEffects";
import {
  addOwnedItem,
  discoverShopItems,
  getDiscoveredShopItems,
  getMaxStartingEquipmentCount,
  getOwnedItemCount,
  getOwnedItemCounts,
  getOwnedItems
} from "../../systems/metaProgression";
import {
  buyCowardReflexUpgrade as buyPermanentCowardReflexUpgrade,
  buyDoorReadingUpgrade as buyPermanentDoorReadingUpgrade,
  buyDressingUpgrade as buyPermanentDressingUpgrade,
  buyTragicCardioUpgrade as buyPermanentTragicCardioUpgrade,
  getCowardReflexCancelPercent,
  getCowardReflexLevel,
  getDoorReadingLevel,
  getDoorReadingPercent,
  getNextCowardReflexUpgradeCost,
  getNextDoorReadingUpgradeCost,
  getDressingLevel,
  getNextDressingUpgradeCost,
  getNextTragicCardioUpgradeCost,
  getPermanentUpgrades,
  getTragicCardioLevel,
  getTragicCardioPercent
} from "../../systems/permanentUpgrades";
import {
  getDisplayableShopItems,
  getPassiveShopEntries as selectPassiveShopEntries,
  getPassiveUpgradeCost as selectPassiveUpgradeCost,
  getShopItemsPage,
  PassiveShopEntry,
  PassiveShopEntryId,
  PassiveUpgradeId
} from "./shop/shopSelectors";
import { ShopMenuView } from "./shop/ShopMenuView";
import { ShopItemsView, SHOP_ITEMS_PER_PAGE } from "./shop/ShopItemsView";
import { ShopPassivesView, SHOP_PASSIVES_ROWS_PER_PAGE } from "./shop/ShopPassivesView";

export type VillageShopPanelCallbacks = {
  onClose: () => void;
  onHudRefresh: () => void;
  onPublishReport: () => void;
};

export class VillageShopPanel {
  private container?: Phaser.GameObjects.Container;
  private shopItemsPage = 0;
  private selectedShopItemId?: string;
  private passivePage = 0;
  private selectedPassiveId: PassiveShopEntryId = "dressing";

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: VillageShopPanelCallbacks
  ) {}

  open(feedback?: string): Phaser.GameObjects.Container {
    this.showShopMenuPanel(feedback);
    return this.container!;
  }

  destroy(): void {
    this.clearPassivePanelInput();
    this.container?.destroy();
    this.container = undefined;
  }

  private replaceContainer(nextContainer: Phaser.GameObjects.Container): void {
    this.container?.destroy();
    this.container = nextContainer;
  }

  private showShopMenuPanel(feedback?: string): void {
    this.clearPassivePanelInput();
    const text = GAME_TEXTS.village.shop;
    const state = getDungeonRunState();
    const container = new ShopMenuView(this.scene, {
      assets: {
        backgroundKey: IMAGE_ASSETS.shopMarcelBackground.key,
        titleSignKey: IMAGE_ASSETS.shopTitleSignEmpty.key,
        categoryPanelKey: IMAGE_ASSETS.shopCategoryPanelEmpty.key,
        objectsIconKey: IMAGE_ASSETS.shopCategoryObjectsIcon.key,
        passivesIconKey: IMAGE_ASSETS.shopCategoryPassivesIcon.key,
        resellIconKey: IMAGE_ASSETS.shopCategoryResellIcon.key,
        closeButtonKey: IMAGE_ASSETS.shopCloseButton.key
      },
      callbacks: {
        onObjects: () => this.refreshShopPanel(),
        onPassives: () => this.refreshShopPassivePanel(),
        onResell: () => this.showShopMenuPanel(text.soon),
        onClose: () => this.callbacks.onClose()
      },
      texts: {
        title: text.marcelResellerTitle,
        objectsButton: text.objectsButton,
        passivesButton: text.passivesButton,
        resellButton: text.resellButton,
        message: feedback ?? text.bankGold(state.bankGold)
      },
      worldHeight: WORLD_HEIGHT,
      worldWidth: WORLD_WIDTH
    }).create();
    this.replaceContainer(container);
    this.callbacks.onPublishReport();
    publishVillageShopMenuReport({
      bankGold: state.bankGold,
      permanentUpgrades: getPermanentUpgrades(),
      maxStartingEquipmentCount: getMaxStartingEquipmentCount(),
      feedback,
      layout: "composed_shop_home"
    });
  }

  private showShopPanel(feedback?: string): void {
    const state = getDungeonRunState();
    const discoveredShopItems = this.discoverCurrentCarriedShopItems(state);
    const shopPage = getShopItemsPage(
      getDisplayableShopItems(discoveredShopItems),
      this.shopItemsPage,
      SHOP_ITEMS_PER_PAGE,
      this.selectedShopItemId
    );
    this.shopItemsPage = shopPage.page;
    this.selectedShopItemId = shopPage.selectedItemId;
    const container = new ShopItemsView(this.scene, {
      assets: {
        backgroundKey: IMAGE_ASSETS.shopMarcelBackground.key,
        windowFrameKey: IMAGE_ASSETS.shopItemsWindowFrame.key,
        itemSlotEmptyKey: IMAGE_ASSETS.shopItemSlotEmpty.key,
        itemSlotHoverKey: IMAGE_ASSETS.shopItemSlotHover.key,
        itemSlotSelectedKey: IMAGE_ASSETS.shopItemSlotSelected.key,
        nameRibbonKey: IMAGE_ASSETS.shopItemNameRibbonEmpty.key,
        buyButtonNormalKey: IMAGE_ASSETS.shopBuyButtonNormal.key,
        buyButtonHoverKey: IMAGE_ASSETS.shopBuyButtonHover.key,
        buyButtonDisabledKey: IMAGE_ASSETS.shopBuyButtonDisabled.key,
        pageArrowLeftKey: IMAGE_ASSETS.shopPageArrowLeft.key,
        pageArrowRightKey: IMAGE_ASSETS.shopPageArrowRight.key,
        closeButtonKey: IMAGE_ASSETS.shopCloseButton.key,
        goldKey: IMAGE_ASSETS.gold.key,
        rarityTextures: {
          common: IMAGE_ASSETS.lootChestRarityCommon.key,
          rare: IMAGE_ASSETS.lootChestRarityRare.key,
          epic: IMAGE_ASSETS.lootChestRarityEpic.key,
          legendary: IMAGE_ASSETS.lootChestRarityLegendary.key
        },
        inventoryItemAssets: INVENTORY_ITEM_ASSETS
      },
      bankGold: state.bankGold,
      callbacks: {
        getBreakChance: (itemId) => getEquipmentBreakChancePercent(itemId),
        getOwnedCount: (itemId) => getOwnedItemCount(itemId),
        onBack: () => this.returnToShopMenu(),
        onBuyItem: (itemId, price) => this.buyShopItem(itemId, price),
        onPageChange: (page) => {
          this.shopItemsPage = page;
          this.selectedShopItemId = undefined;
          this.refreshShopPanel();
        },
        onSelectItem: (itemId) => {
          this.selectedShopItemId = itemId;
          this.refreshShopPanel();
        }
      },
      empty: shopPage.allItems.length === 0,
      feedback,
      page: this.shopItemsPage,
      pageItems: shopPage.pageItems,
      selectedItemId: this.selectedShopItemId,
      totalPages: shopPage.totalPages,
      worldHeight: WORLD_HEIGHT,
      worldWidth: WORLD_WIDTH
    }).create();
    this.replaceContainer(container);
    this.callbacks.onPublishReport();
    publishShopReport({
      discoveredShopItems,
      pageItems: shopPage.pageItems,
      allShopItemIds: shopPage.allItemIds,
      page: this.shopItemsPage + 1,
      totalPages: shopPage.totalPages,
      selectedShopItemId: this.selectedShopItemId,
      ownedItems: getOwnedItems(),
      ownedItemCounts: getOwnedItemCounts(),
      permanentUpgrades: getPermanentUpgrades(),
      maxStartingEquipmentCount: getMaxStartingEquipmentCount(),
      feedback,
      bankGold: state.bankGold
    });
  }

  private discoverCurrentCarriedShopItems(state = getDungeonRunState()): string[] {
    const discoverableItems = [...new Set([...state.inventory, ...state.equipment])].filter((itemId) =>
      Boolean(getItemDefinition(itemId)?.shopDiscoverable)
    );
    if (discoverableItems.length > 0) {
      return discoverShopItems(discoverableItems);
    }

    return getDiscoveredShopItems();
  }

  private showShopPassivePanel(feedback?: string): void {
    this.clearPassivePanelInput();
    const state = getDungeonRunState();
    const entries = this.getPassiveShopEntries();
    const totalPages = Math.max(1, Math.ceil(entries.length / SHOP_PASSIVES_ROWS_PER_PAGE));
    this.passivePage = Phaser.Math.Clamp(this.passivePage, 0, totalPages - 1);
    if (!entries.some((entry) => entry.id === this.selectedPassiveId)) {
      this.selectedPassiveId = entries[0]?.id ?? "dressing";
    }
    const selectedEntry = entries.find((entry) => entry.id === this.selectedPassiveId) ?? entries[0];
    const container = new ShopPassivesView(this.scene, {
      assets: {
        backgroundKey: IMAGE_ASSETS.shopMarcelBackground.key,
        windowFrameKey: IMAGE_ASSETS.shopPassivesWindowFrame.key,
        rowNormalKey: IMAGE_ASSETS.shopPassiveRowNormal.key,
        rowHoverKey: IMAGE_ASSETS.shopPassiveRowHover.key,
        rowSelectedKey: IMAGE_ASSETS.shopPassiveRowSelected.key,
        detailIconFrameKey: IMAGE_ASSETS.shopPassiveDetailIconFrame.key,
        nameRibbonKey: IMAGE_ASSETS.shopPassiveNameRibbonEmpty.key,
        buyButtonNormalKey: IMAGE_ASSETS.shopBuyButtonNormal.key,
        buyButtonHoverKey: IMAGE_ASSETS.shopBuyButtonHover.key,
        buyButtonDisabledKey: IMAGE_ASSETS.shopBuyButtonDisabled.key,
        pageArrowLeftKey: IMAGE_ASSETS.shopPageArrowLeft.key,
        pageArrowRightKey: IMAGE_ASSETS.shopPageArrowRight.key,
        closeButtonKey: IMAGE_ASSETS.shopCloseButton.key
      },
      bankGold: state.bankGold,
      callbacks: {
        onBack: () => this.returnToShopMenu(),
        onBuyPassive: (upgradeId) => this.buyPassiveUpgrade(upgradeId),
        onPageChange: (page) => {
          this.passivePage = page;
          this.refreshShopPassivePanel();
        },
        onSelectPassive: (passiveId) => {
          this.selectedPassiveId = passiveId;
          this.refreshShopPassivePanel();
        }
      },
      entries,
      feedback,
      page: this.passivePage,
      selectedPassiveId: this.selectedPassiveId,
      totalPages,
      worldHeight: WORLD_HEIGHT,
      worldWidth: WORLD_WIDTH
    }).create();
    this.replaceContainer(container);
    this.callbacks.onPublishReport();
    publishVillageShopPassiveReport({
      bankGold: state.bankGold,
      entries: entries.map((entry) => ({
        id: entry.id,
        level: entry.level,
        nextCost: entry.nextCost,
        purchasable: entry.purchasable
      })),
      selectedPassiveId: selectedEntry?.id,
      page: this.passivePage + 1,
      totalPages,
      cowardReflexCancelPercent: getCowardReflexCancelPercent(),
      maxStartingEquipmentCount: getMaxStartingEquipmentCount(),
      permanentUpgrades: getPermanentUpgrades(),
      feedback
    });
    this.updateShopPassiveInputReport({ shown: true, panelExists: Boolean(this.container), lastAction: "shown" });
  }

  private getPassiveShopEntries(): PassiveShopEntry[] {
    return selectPassiveShopEntries({
      iconKeys: {
        dressing: IMAGE_ASSETS.passiveSurvivalDressing.key,
        cowardReflex: IMAGE_ASSETS.passiveCowardReflexes.key,
        tragicCardio: IMAGE_ASSETS.passiveTragicCardio.key,
        almostReliableInstinct: IMAGE_ASSETS.passiveAlmostReliableInstinct.key,
        doorReading: IMAGE_ASSETS.passiveDoorReading.key
      },
      levels: {
        dressing: getDressingLevel(),
        cowardReflex: getCowardReflexLevel(),
        tragicCardio: getTragicCardioLevel(),
        doorReading: getDoorReadingLevel()
      },
      nextCosts: {
        dressing: getNextDressingUpgradeCost(),
        cowardReflex: getNextCowardReflexUpgradeCost(),
        tragicCardio: getNextTragicCardioUpgradeCost(),
        doorReading: getNextDoorReadingUpgradeCost()
      },
      effects: {
        maxStartingEquipmentCount: getMaxStartingEquipmentCount(),
        cowardReflexCancelPercent: getCowardReflexCancelPercent(),
        tragicCardioPercent: getTragicCardioPercent(),
        doorReadingPercent: getDoorReadingPercent()
      }
    });
  }

  private buyShopItem(itemId: string, price: number): void {
    const item = getItemDefinition(itemId);
    const updatedState = spendBankGold(price);
    if (!updatedState) {
      this.refreshShopPanel(GAME_TEXTS.village.shop.notEnoughGold);
      return;
    }

    addOwnedItem(itemId);
    this.callbacks.onHudRefresh();
    this.refreshShopPanel(GAME_TEXTS.village.shop.buySuccess(item?.name ?? GAME_TEXTS.inventory.unknownItem(itemId)));
  }

  private buyPassiveUpgrade(upgradeId: PassiveUpgradeId): void {
    const currentPrice = this.getPassiveUpgradeCost(upgradeId);
    if (currentPrice === undefined) {
      this.refreshShopPassivePanel(GAME_TEXTS.village.shop.dressingMax);
      return;
    }

    const updatedState = spendBankGold(currentPrice);
    if (!updatedState) {
      this.refreshShopPassivePanel(GAME_TEXTS.village.shop.notEnoughGold);
      return;
    }

    const result = this.buyPermanentPassiveUpgrade(upgradeId);
    if (!result.ok) {
      this.refreshShopPassivePanel(GAME_TEXTS.village.shop.dressingMax);
      return;
    }

    this.callbacks.onHudRefresh();
    this.refreshShopPassivePanel(this.getPassiveBuySuccessText(upgradeId));
  }

  private getPassiveUpgradeCost(upgradeId: PassiveUpgradeId): number | undefined {
    return selectPassiveUpgradeCost(upgradeId, this.getPassiveShopEntries());
  }

  private buyPermanentPassiveUpgrade(upgradeId: PassiveUpgradeId): ReturnType<typeof buyPermanentDressingUpgrade> {
    if (upgradeId === "dressing") {
      return buyPermanentDressingUpgrade();
    }
    if (upgradeId === "cowardReflex") {
      return buyPermanentCowardReflexUpgrade();
    }
    if (upgradeId === "tragicCardio") {
      return buyPermanentTragicCardioUpgrade();
    }

    return buyPermanentDoorReadingUpgrade();
  }

  private getPassiveBuySuccessText(upgradeId: PassiveUpgradeId): string {
    if (upgradeId === "dressing") {
      return GAME_TEXTS.village.shop.dressingBuySuccess(getDressingLevel(), getMaxStartingEquipmentCount());
    }
    if (upgradeId === "cowardReflex") {
      return GAME_TEXTS.village.shop.cowardReflexBuySuccess(getCowardReflexLevel(), getCowardReflexCancelPercent());
    }
    if (upgradeId === "tragicCardio") {
      return GAME_TEXTS.village.shop.tragicCardioBuySuccess(getTragicCardioLevel(), getTragicCardioPercent());
    }

    return GAME_TEXTS.village.shop.doorReadingBuySuccess(getDoorReadingLevel(), getDoorReadingPercent());
  }

  private refreshShopPanel(feedback?: string): void {
    this.showShopPanel(feedback);
  }

  private refreshShopPassivePanel(feedback?: string): void {
    this.clearPassivePanelInput();
    this.showShopPassivePanel(feedback);
  }

  private returnToShopMenu(): void {
    this.updateShopPassiveInputReport({ lastAction: "back" });
    this.clearPassivePanelInput();
    this.showShopMenuPanel(GAME_TEXTS.village.shop.backToMarcel);
  }

  private clearPassivePanelInput(): void {}

  private updateShopPassiveInputReport(
    patch: Partial<{
      shown: boolean;
      panelExists: boolean;
      pointerReceived: boolean;
      pointerX: number;
      pointerY: number;
      inBack: boolean;
      inBuy: boolean;
      inClose: boolean;
      lastAction: string;
    }>
  ): void {
    const state = getDungeonRunState();
    const previous = getShopPassiveInputReport() ?? {};
    publishShopPassiveInputReport({
      ...previous,
      ...patch,
      panelExists: patch.panelExists ?? Boolean(this.container),
      dressingLevel: getDressingLevel(),
      nextCost: getNextDressingUpgradeCost(),
      bankGold: state.bankGold
    });
  }
}
