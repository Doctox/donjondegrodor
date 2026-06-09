import { GAME_TEXTS } from "../../../data/gameTexts";
import { ITEM_DEFINITIONS, ItemDefinition, getItemDefinition, getItemShopPrice } from "../../../data/itemDefinitions";

export type PassiveUpgradeId = "dressing" | "cowardReflex" | "tragicCardio" | "doorReading";
export type PassiveShopEntryId =
  | "dressing"
  | "cowardReflex"
  | "tragicCardio"
  | "almostReliableInstinct"
  | "doorReading";

export type ShopGridItem = {
  itemId: string;
  locked: boolean;
};

export type ShopItemsPage = {
  allItems: ShopGridItem[];
  pageItems: ShopGridItem[];
  allItemIds: string[];
  selectedItemId?: string;
  page: number;
  totalPages: number;
};

export type ShopSlotPriceModel =
  | { kind: "locked" }
  | { kind: "unavailable" }
  | { kind: "price"; price: number };

export type ShopBuyState = {
  disabled: boolean;
  canBuy: boolean;
  label: string;
};

export type ShopItemDetailModel = {
  itemId?: string;
  item?: ItemDefinition;
  price?: number;
  ownedCount: number;
  breakChance: number;
  buyState: ShopBuyState;
  slotPrice: ShopSlotPriceModel;
};

export type PassiveShopEntry = {
  id: PassiveShopEntryId;
  name: string;
  iconKey: string;
  level: number;
  maxLevel: number;
  currentEffect: string;
  nextEffect: string;
  nextCost?: number;
  purchasable: boolean;
};

export type PassiveShopSnapshot = {
  iconKeys: {
    dressing: string;
    cowardReflex: string;
    tragicCardio: string;
    almostReliableInstinct: string;
    doorReading: string;
  };
  levels: {
    dressing: number;
    cowardReflex: number;
    tragicCardio: number;
    doorReading: number;
  };
  nextCosts: {
    dressing?: number;
    cowardReflex?: number;
    tragicCardio?: number;
    doorReading?: number;
  };
  effects: {
    maxStartingEquipmentCount: number;
    cowardReflexCancelPercent: number;
    tragicCardioPercent: number;
    doorReadingPercent: number;
  };
};

export type PassiveRowStatus = {
  label: string;
  color: string;
};

export type PassiveBuyState = {
  disabled: boolean;
  canBuy: boolean;
  label: string;
};

export function getDisplayableShopItems(discoveredItemIds: Iterable<string>): ShopGridItem[] {
  const discoveredSet = new Set(discoveredItemIds);
  return Object.keys(ITEM_DEFINITIONS)
    .filter((itemId) => Boolean(getItemDefinition(itemId)?.shopDiscoverable))
    .map((itemId) => ({
      itemId,
      locked: !discoveredSet.has(itemId)
    }));
}

export function getShopItemsPage(
  allItems: ShopGridItem[],
  currentPage: number,
  itemsPerPage: number,
  selectedItemId?: string
): ShopItemsPage {
  const totalPages = Math.max(1, Math.ceil(allItems.length / itemsPerPage));
  const page = Math.min(totalPages - 1, Math.max(0, Math.trunc(currentPage)));
  const pageStart = page * itemsPerPage;
  const pageItems = allItems.slice(pageStart, pageStart + itemsPerPage);
  const allItemIds = allItems.map((item) => item.itemId);
  let nextSelectedItemId = selectedItemId;

  if (!nextSelectedItemId || !allItemIds.includes(nextSelectedItemId)) {
    nextSelectedItemId = pageItems[0]?.itemId;
  }
  if (nextSelectedItemId && !pageItems.some((item) => item.itemId === nextSelectedItemId)) {
    nextSelectedItemId = pageItems[0]?.itemId;
  }

  return {
    allItems,
    pageItems,
    allItemIds,
    selectedItemId: nextSelectedItemId,
    page,
    totalPages
  };
}

export function getShopSlotPriceModel(price: number | undefined, locked: boolean): ShopSlotPriceModel {
  if (locked) {
    return { kind: "locked" };
  }
  if (!price) {
    return { kind: "unavailable" };
  }

  return { kind: "price", price };
}

export function getShopItemPrice(itemId: string | undefined): number | undefined {
  return itemId ? getItemShopPrice(itemId) : undefined;
}

export function getShopBuyState(itemId: string | undefined, price: number | undefined, bankGold: number, locked = false): ShopBuyState {
  const text = GAME_TEXTS.village.shop;
  const disabled = locked || !itemId || !price || bankGold < price;
  return {
    disabled,
    canBuy: Boolean(!disabled && itemId && price),
    label: locked ? text.locked : !itemId || !price ? text.unavailable : disabled ? text.tooExpensive : text.buyButton
  };
}

export function getShopItemDetailModel(
  itemId: string | undefined,
  options: {
    bankGold: number;
    locked: boolean;
    ownedCount: number;
    breakChance: number;
  }
): ShopItemDetailModel {
  const price = itemId ? getItemShopPrice(itemId) : undefined;
  return {
    itemId,
    item: itemId ? getItemDefinition(itemId) : undefined,
    price,
    ownedCount: itemId ? options.ownedCount : 0,
    breakChance: itemId ? options.breakChance : 0,
    buyState: getShopBuyState(itemId, price, options.bankGold, options.locked),
    slotPrice: getShopSlotPriceModel(price, options.locked)
  };
}

export function getPassiveShopEntries(snapshot: PassiveShopSnapshot): PassiveShopEntry[] {
  const text = GAME_TEXTS.village.shop;
  return [
    {
      id: "dressing",
      name: text.dressingName,
      iconKey: snapshot.iconKeys.dressing,
      level: snapshot.levels.dressing,
      maxLevel: 3,
      currentEffect: text.dressingEffect(snapshot.effects.maxStartingEquipmentCount),
      nextEffect:
        snapshot.nextCosts.dressing === undefined ? text.maxLevel : text.dressingEffect(Math.min(4, snapshot.effects.maxStartingEquipmentCount + 1)),
      nextCost: snapshot.nextCosts.dressing,
      purchasable: true
    },
    {
      id: "cowardReflex",
      name: text.cowardReflexName,
      iconKey: snapshot.iconKeys.cowardReflex,
      level: snapshot.levels.cowardReflex,
      maxLevel: 3,
      currentEffect: text.cowardReflexEffect(snapshot.effects.cowardReflexCancelPercent),
      nextEffect:
        snapshot.nextCosts.cowardReflex === undefined
          ? text.maxLevel
          : text.cowardReflexEffect(getNextCowardReflexPercent(snapshot.levels.cowardReflex)),
      nextCost: snapshot.nextCosts.cowardReflex,
      purchasable: true
    },
    {
      id: "tragicCardio",
      name: text.tragicCardioName,
      iconKey: snapshot.iconKeys.tragicCardio,
      level: snapshot.levels.tragicCardio,
      maxLevel: 3,
      currentEffect: text.tragicCardioEffect(snapshot.effects.tragicCardioPercent),
      nextEffect:
        snapshot.nextCosts.tragicCardio === undefined
          ? text.maxLevel
          : text.tragicCardioEffect(getNextTragicCardioPercent(snapshot.levels.tragicCardio)),
      nextCost: snapshot.nextCosts.tragicCardio,
      purchasable: true
    },
    {
      id: "almostReliableInstinct",
      name: text.almostReliableInstinctName,
      iconKey: snapshot.iconKeys.almostReliableInstinct,
      level: 0,
      maxLevel: 3,
      currentEffect: text.almostReliableInstinctEffect,
      nextEffect: text.passiveComingSoon,
      purchasable: false
    },
    {
      id: "doorReading",
      name: text.doorReadingName,
      iconKey: snapshot.iconKeys.doorReading,
      level: snapshot.levels.doorReading,
      maxLevel: 3,
      currentEffect: text.doorReadingEffect(snapshot.effects.doorReadingPercent),
      nextEffect:
        snapshot.nextCosts.doorReading === undefined
          ? text.maxLevel
          : text.doorReadingEffect(getNextDoorReadingPercent(snapshot.levels.doorReading)),
      nextCost: snapshot.nextCosts.doorReading,
      purchasable: true
    }
  ];
}

export function getPassiveRowStatus(entry: PassiveShopEntry): PassiveRowStatus {
  const text = GAME_TEXTS.village.shop;
  if (entry.nextCost !== undefined) {
    return { label: text.price(entry.nextCost), color: "#ffe6aa" };
  }

  if (entry.level >= entry.maxLevel) {
    return { label: text.dressingMax, color: "#c7d8a1" };
  }

  return { label: text.soon, color: "#d8c7a2" };
}

export function getPassiveBuyState(entry: PassiveShopEntry, bankGold: number): PassiveBuyState {
  const text = GAME_TEXTS.village.shop;
  const disabled = !entry.purchasable || entry.nextCost === undefined || bankGold < entry.nextCost;
  return {
    disabled,
    canBuy: !disabled,
    label: !entry.purchasable
      ? text.unavailable
      : entry.nextCost === undefined
        ? text.maxLevel
        : disabled
          ? text.tooExpensiveUpgrade
          : text.upgradeButton
  };
}

export function getPassiveUpgradeCost(upgradeId: PassiveUpgradeId, entries: PassiveShopEntry[]): number | undefined {
  return entries.find((entry) => entry.id === upgradeId)?.nextCost;
}

export function getNextCowardReflexPercent(level: number): number {
  if (level <= 0) {
    return 5;
  }
  if (level === 1) {
    return 15;
  }
  return 25;
}

export function getNextTragicCardioPercent(level: number): number {
  if (level <= 0) {
    return 25;
  }
  if (level === 1) {
    return 50;
  }
  return 80;
}

export function getNextDoorReadingPercent(level: number): number {
  if (level <= 0) {
    return 10;
  }
  if (level === 1) {
    return 25;
  }
  return 40;
}
