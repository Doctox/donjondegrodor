import { EquipmentSlotId, getEquipmentSlot, getItemDefinition } from "../data/itemDefinitions";
import { getMaxStartingEquipmentCount as getPermanentMaxStartingEquipmentCount } from "./permanentUpgrades";

const DISCOVERED_SHOP_ITEMS_STORAGE_KEY = "grodor_discovered_shop_items";
const OWNED_ITEMS_STORAGE_KEY = "grodor_owned_items";
const OWNED_ITEM_COUNTS_STORAGE_KEY = "grodor_owned_item_counts";
const STARTING_LOADOUT_STORAGE_KEY = "grodor_starting_loadout";

export type OwnedItemCounts = Record<string, number>;
export type StartingLoadout = Partial<Record<EquipmentSlotId, string>>;
export type StartingLoadoutResult = {
  ok: boolean;
  reason?: "not_owned" | "not_equipment" | "limit_reached" | "empty_slot";
  itemId?: string;
  slot?: EquipmentSlotId;
  loadout: StartingLoadout;
  ownedItemCounts: OwnedItemCounts;
};

let discoveredShopItems = loadDiscoveredShopItems();
let ownedItemCounts = loadOwnedItemCounts();
let startingLoadout = loadStartingLoadout();

export function getDiscoveredShopItems(): string[] {
  return [...discoveredShopItems];
}

export function discoverShopItems(itemIds: string[]): string[] {
  discoveredShopItems = [...new Set([...discoveredShopItems, ...itemIds.filter(Boolean)])];
  saveDiscoveredShopItems(discoveredShopItems);
  return getDiscoveredShopItems();
}

export function isShopItemDiscovered(itemId: string): boolean {
  return discoveredShopItems.includes(itemId);
}

export function getOwnedItemCounts(): OwnedItemCounts {
  return { ...ownedItemCounts };
}

export function getOwnedItemCount(itemId: string): number {
  return ownedItemCounts[itemId] ?? 0;
}

export function addOwnedItem(itemId: string, amount = 1): OwnedItemCounts {
  const count = Math.max(0, Math.trunc(amount));
  if (!itemId || count <= 0) {
    return getOwnedItemCounts();
  }

  ownedItemCounts = {
    ...ownedItemCounts,
    [itemId]: getOwnedItemCount(itemId) + count
  };
  saveOwnedItemCounts(ownedItemCounts);
  return getOwnedItemCounts();
}

export function removeOwnedItem(itemId: string, amount = 1): OwnedItemCounts {
  const count = Math.max(0, Math.trunc(amount));
  if (!itemId || count <= 0) {
    return getOwnedItemCounts();
  }

  const nextCount = Math.max(0, getOwnedItemCount(itemId) - count);
  ownedItemCounts = Object.fromEntries(
    Object.entries({
      ...ownedItemCounts,
      [itemId]: nextCount
    }).filter(([, value]) => value > 0)
  );
  saveOwnedItemCounts(ownedItemCounts);
  return getOwnedItemCounts();
}

export function hasOwnedItem(itemId: string): boolean {
  return getOwnedItemCount(itemId) > 0;
}

export function getOwnedItems(): string[] {
  return Object.keys(ownedItemCounts).filter((itemId) => getOwnedItemCount(itemId) > 0);
}

export function getStartingLoadout(): StartingLoadout {
  return { ...startingLoadout };
}

export function getStartingLoadoutCount(): number {
  return Object.keys(startingLoadout).length;
}

export function getMaxStartingEquipmentCount(): number {
  return getPermanentMaxStartingEquipmentCount();
}

export function equipStartingItem(itemId: string): StartingLoadoutResult {
  const definition = getItemDefinition(itemId);
  const slot = getEquipmentSlot(itemId);
  if (!definition || definition.kind !== "equipment" || !slot) {
    return createStartingLoadoutResult(false, "not_equipment", itemId);
  }

  if (getOwnedItemCount(itemId) <= 0) {
    return createStartingLoadoutResult(false, "not_owned", itemId, slot);
  }

  const currentItemId = startingLoadout[slot];
  if (!currentItemId && getStartingLoadoutCount() >= getMaxStartingEquipmentCount()) {
    return createStartingLoadoutResult(false, "limit_reached", itemId, slot);
  }

  ownedItemCounts = decrementOwnedItemCount(ownedItemCounts, itemId, 1);
  if (currentItemId) {
    ownedItemCounts = incrementOwnedItemCount(ownedItemCounts, currentItemId, 1);
  }

  startingLoadout = {
    ...startingLoadout,
    [slot]: itemId
  };
  saveOwnedItemCounts(ownedItemCounts);
  saveStartingLoadout(startingLoadout);

  return createStartingLoadoutResult(true, undefined, itemId, slot);
}

export function unequipStartingSlot(slot: EquipmentSlotId): StartingLoadoutResult {
  const currentItemId = startingLoadout[slot];
  if (!currentItemId) {
    return createStartingLoadoutResult(false, "empty_slot", undefined, slot);
  }

  const { [slot]: _removed, ...nextLoadout } = startingLoadout;
  startingLoadout = nextLoadout;
  ownedItemCounts = incrementOwnedItemCount(ownedItemCounts, currentItemId, 1);
  saveOwnedItemCounts(ownedItemCounts);
  saveStartingLoadout(startingLoadout);

  return createStartingLoadoutResult(true, undefined, currentItemId, slot);
}

export function clearStartingLoadout(options: { returnItemsToChest?: boolean } = {}): StartingLoadout {
  if (options.returnItemsToChest) {
    Object.values(startingLoadout).forEach((itemId) => {
      if (itemId) {
        ownedItemCounts = incrementOwnedItemCount(ownedItemCounts, itemId, 1);
      }
    });
    saveOwnedItemCounts(ownedItemCounts);
  }

  startingLoadout = {};
  saveStartingLoadout(startingLoadout);
  return getStartingLoadout();
}

export function resetMetaProgressionDebug(): void {
  discoveredShopItems = [];
  ownedItemCounts = {};
  startingLoadout = {};
  saveDiscoveredShopItems(discoveredShopItems);
  saveOwnedItemCounts(ownedItemCounts);
  saveStartingLoadout(startingLoadout);
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(OWNED_ITEMS_STORAGE_KEY);
    }
  } catch {
    // localStorage can be blocked; in-memory meta progression is already reset.
  }
}

function loadDiscoveredShopItems(): string[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }

    const rawValue = window.localStorage.getItem(DISCOVERED_SHOP_ITEMS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      saveDiscoveredShopItems([]);
      return [];
    }

    return [...new Set(parsedValue.filter((itemId): itemId is string => typeof itemId === "string" && itemId.length > 0))];
  } catch {
    return [];
  }
}

function saveDiscoveredShopItems(itemIds: string[]): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(DISCOVERED_SHOP_ITEMS_STORAGE_KEY, JSON.stringify([...new Set(itemIds)]));
  } catch {
    // localStorage can be blocked; keep the in-memory discoveries for this session.
  }
}

function loadOwnedItemCounts(): OwnedItemCounts {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return {};
    }

    const rawValue = window.localStorage.getItem(OWNED_ITEM_COUNTS_STORAGE_KEY);
    if (rawValue) {
      const parsedValue = JSON.parse(rawValue);
      if (isOwnedItemCounts(parsedValue)) {
        return sanitizeOwnedItemCounts(parsedValue);
      }

      saveOwnedItemCounts({});
      return {};
    }

    return migrateOwnedItemsToCounts();
  } catch {
    return {};
  }
}

function migrateOwnedItemsToCounts(): OwnedItemCounts {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return {};
    }

    const rawValue = window.localStorage.getItem(OWNED_ITEMS_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return {};
    }

    const migratedCounts = parsedValue.reduce<OwnedItemCounts>((counts, itemId) => {
      if (typeof itemId === "string" && itemId.length > 0) {
        counts[itemId] = 1;
      }
      return counts;
    }, {});
    saveOwnedItemCounts(migratedCounts);
    return migratedCounts;
  } catch {
    return {};
  }
}

function saveOwnedItemCounts(itemCounts: OwnedItemCounts): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(OWNED_ITEM_COUNTS_STORAGE_KEY, JSON.stringify(sanitizeOwnedItemCounts(itemCounts)));
  } catch {
    // localStorage can be blocked; keep the in-memory owned item counts for this session.
  }
}

function loadStartingLoadout(): StartingLoadout {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return {};
    }

    const rawValue = window.localStorage.getItem(STARTING_LOADOUT_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      saveStartingLoadout({});
      return {};
    }

    const loadedLoadout = sanitizeStartingLoadout(parsedValue as Record<string, unknown>);
    saveStartingLoadout(loadedLoadout);
    return loadedLoadout;
  } catch {
    return {};
  }
}

function saveStartingLoadout(loadout: StartingLoadout): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(STARTING_LOADOUT_STORAGE_KEY, JSON.stringify(sanitizeStartingLoadout(loadout)));
  } catch {
    // localStorage can be blocked; keep the in-memory starting loadout for this session.
  }
}

function isOwnedItemCounts(value: unknown): value is OwnedItemCounts {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeOwnedItemCounts(itemCounts: OwnedItemCounts): OwnedItemCounts {
  return Object.fromEntries(
    Object.entries(itemCounts)
      .map(([itemId, count]) => [itemId, Math.max(0, Math.trunc(Number(count)))] as const)
      .filter(([itemId, count]) => itemId.length > 0 && count > 0)
  );
}

function sanitizeStartingLoadout(value: Record<string, unknown>): StartingLoadout {
  return Object.fromEntries(
    Object.entries(value).flatMap(([, itemId]) => {
      if (typeof itemId !== "string") {
        return [];
      }

      const itemSlot = getEquipmentSlot(itemId);
      if (!itemSlot) {
        return [];
      }

      return [[itemSlot, itemId]];
    })
  ) as StartingLoadout;
}

function incrementOwnedItemCount(itemCounts: OwnedItemCounts, itemId: string, amount: number): OwnedItemCounts {
  return {
    ...itemCounts,
    [itemId]: Math.max(0, Math.trunc(itemCounts[itemId] ?? 0)) + Math.max(0, Math.trunc(amount))
  };
}

function decrementOwnedItemCount(itemCounts: OwnedItemCounts, itemId: string, amount: number): OwnedItemCounts {
  const nextCount = Math.max(0, Math.trunc(itemCounts[itemId] ?? 0) - Math.max(0, Math.trunc(amount)));
  return Object.fromEntries(
    Object.entries({
      ...itemCounts,
      [itemId]: nextCount
    }).filter(([, count]) => count > 0)
  );
}

function createStartingLoadoutResult(
  ok: boolean,
  reason?: StartingLoadoutResult["reason"],
  itemId?: string,
  slot?: EquipmentSlotId
): StartingLoadoutResult {
  return {
    ok,
    reason,
    itemId,
    slot,
    loadout: getStartingLoadout(),
    ownedItemCounts: getOwnedItemCounts()
  };
}
