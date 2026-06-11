import { GrodorEquipmentId } from "./equipmentDefinitions";
import { GAME_TEXTS } from "./gameTexts";

export type ItemKind = "equipment" | "item";
export type ItemId = GrodorEquipmentId | "gold_coin_test" | "weird_stone_test";
export type ItemRarity = "common" | "rare" | "epic" | "legendary";
export type EquipmentSlotId = "weapon" | "helmet" | "amulet" | "gloves" | "boots" | "object" | "cape";

export type ItemDefinition = {
  id: ItemId;
  name: string;
  kind: ItemKind;
  equipmentId?: GrodorEquipmentId;
  equipmentSlot?: EquipmentSlotId;
  rarity?: ItemRarity;
  lootable?: true;
  shopDiscoverable?: true;
  description?: string;
};

export type LootableItemDefinition = ItemDefinition & {
  rarity: ItemRarity;
  lootable: true;
};

export const ITEM_RARITY_PRICES = {
  common: 20,
  rare: 45,
  epic: 90,
  legendary: 160
} satisfies Record<ItemRarity, number>;

export const ITEM_DEFINITIONS = {
  gold_coin_test: {
    id: "gold_coin_test",
    name: GAME_TEXTS.items.goldCoinTest,
    kind: "item"
  },
  weird_stone_test: {
    id: "weird_stone_test",
    name: GAME_TEXTS.items.weirdStoneTest,
    kind: "item"
  },
  too_long_cape: {
    id: "too_long_cape",
    name: GAME_TEXTS.items.tooLongCape,
    kind: "equipment",
    equipmentId: "too_long_cape",
    equipmentSlot: "cape",
    rarity: "common",
    lootable: true,
    shopDiscoverable: true,
    description: GAME_TEXTS.items.descriptions.tooLongCape
  },
  war_underwear: {
    id: "war_underwear",
    name: GAME_TEXTS.items.warUnderwear,
    kind: "equipment",
    equipmentId: "war_underwear",
    equipmentSlot: "object",
    rarity: "epic",
    lootable: true,
    shopDiscoverable: true,
    description: GAME_TEXTS.items.descriptions.warUnderwear
  },
  panic_sandals: {
    id: "panic_sandals",
    name: GAME_TEXTS.items.panicSandals,
    kind: "equipment",
    equipmentId: "panic_sandals",
    equipmentSlot: "boots",
    rarity: "epic",
    lootable: true,
    shopDiscoverable: true,
    description: GAME_TEXTS.items.descriptions.panicSandals
  },
  almost_hero_medallion: {
    id: "almost_hero_medallion",
    name: GAME_TEXTS.items.almostHeroMedallion,
    kind: "equipment",
    equipmentId: "almost_hero_medallion",
    equipmentSlot: "amulet",
    rarity: "rare",
    lootable: true,
    shopDiscoverable: true,
    description: GAME_TEXTS.items.descriptions.almostHeroMedallion
  },
  tiny_helmet: {
    id: "tiny_helmet",
    name: GAME_TEXTS.items.tinyHelmet,
    kind: "equipment",
    equipmentId: "tiny_helmet",
    equipmentSlot: "helmet",
    rarity: "common",
    lootable: true,
    shopDiscoverable: true,
    description: GAME_TEXTS.items.descriptions.tinyHelmet
  },
  ankle_ball: {
    id: "ankle_ball",
    name: GAME_TEXTS.items.ankleBall,
    kind: "equipment",
    equipmentId: "ankle_ball",
    equipmentSlot: "object",
    rarity: "rare",
    lootable: true,
    shopDiscoverable: true,
    description: GAME_TEXTS.items.descriptions.ankleBall
  },
  axe: {
    id: "axe",
    name: GAME_TEXTS.items.axe,
    kind: "equipment",
    equipmentId: "axe",
    equipmentSlot: "weapon",
    rarity: "common",
    lootable: true,
    shopDiscoverable: true,
    description: GAME_TEXTS.items.descriptions.axe
  },
  sticky_gloves: {
    id: "sticky_gloves",
    name: GAME_TEXTS.items.stickyGloves,
    kind: "equipment",
    equipmentId: "sticky_gloves",
    equipmentSlot: "gloves",
    rarity: "legendary",
    lootable: true,
    shopDiscoverable: true,
    description: GAME_TEXTS.items.descriptions.stickyGloves
  },
  emotional_pebble: {
    id: "emotional_pebble",
    name: GAME_TEXTS.items.emotionalPebble,
    kind: "equipment",
    equipmentId: "emotional_pebble",
    equipmentSlot: "object",
    rarity: "legendary",
    lootable: true,
    shopDiscoverable: true,
    description: GAME_TEXTS.items.descriptions.emotionalPebble
  }
} satisfies Record<ItemId, ItemDefinition>;

export const LOOTABLE_ITEM_DEFINITIONS = (Object.values(ITEM_DEFINITIONS) as ItemDefinition[]).filter(
  (definition): definition is LootableItemDefinition => Boolean(definition.lootable && definition.rarity)
);

export function getItemDefinition(id: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS[id as ItemId];
}

export function getItemShopPrice(id: string): number | undefined {
  const rarity = getItemDefinition(id)?.rarity;
  return rarity ? ITEM_RARITY_PRICES[rarity] : undefined;
}

export function getEquipmentSlot(itemId: string): EquipmentSlotId | undefined {
  return getItemDefinition(itemId)?.equipmentSlot;
}

export function isItemId(id: string): id is ItemId {
  return id in ITEM_DEFINITIONS;
}
