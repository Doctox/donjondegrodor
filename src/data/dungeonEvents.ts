import { ItemId } from "./itemDefinitions";
import { MonsterId } from "./monsterDefinitions";
import { GAME_TEXTS } from "./gameTexts";

export type DungeonEventKind = "gold" | "life_loss" | "life_gain" | "floor" | "nothing" | "item" | "combat" | "minigame";
export type DungeonEventId =
  | "gain_gold_random"
  | "lose_heart"
  | "heal_heart"
  | "nothing_gag"
  | "floor_up"
  | "floor_down"
  | "gain_gold"
  | "lose_life"
  | "nothing"
  | "combat"
  | "combat_rat"
  | "combat_skeleton"
  | "combat_guard"
  | "gain_axe"
  | "gain_war_underwear"
  | "gain_weird_stone_test"
  | "gain_too_long_cape"
  | "gain_panic_sandals"
  | "gain_almost_hero_medallion"
  | "gain_ankle_ball"
  | "gain_tiny_helmet"
  | "gain_sticky_gloves"
  | "gain_emotional_pebble"
  | "gain_gold_coin_test"
  | "loot_chest"
  | "coin_flip"
  | "bonneteau"
  | "slot_machine"
  | "dodge_chest"
  | "jump"
  | "arm_wrestling"
  | "tug_of_war"
  | "elevator"
  | "batonnets";

export type DungeonEventDefinition = {
  id: DungeonEventId;
  weight: number;
  title: string;
  message: string;
  effectLabel: string;
  kind: DungeonEventKind;
  itemId?: ItemId;
  monsterId?: MonsterId;
  goldDelta?: number;
  randomGoldRange?: { min: number; max: number };
  lifeDelta?: number;
  floorDelta?: number;
};

export const DUNGEON_EVENTS = {
  gain_gold_random: {
    id: "gain_gold_random",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainGoldRandom.title,
    message: GAME_TEXTS.dungeonEvents.gainGoldRandom.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainGoldRandom.effectLabel(1),
    kind: "gold",
    randomGoldRange: { min: 1, max: 5 }
  },
  lose_heart: {
    id: "lose_heart",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.loseHeart.title,
    message: GAME_TEXTS.dungeonEvents.loseHeart.message,
    effectLabel: GAME_TEXTS.dungeonEvents.loseHeart.effectLabel,
    kind: "life_loss",
    lifeDelta: -1
  },
  heal_heart: {
    id: "heal_heart",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.healHeart.title,
    message: GAME_TEXTS.dungeonEvents.healHeart.message,
    effectLabel: GAME_TEXTS.dungeonEvents.healHeart.effectLabel,
    kind: "life_gain",
    lifeDelta: 1
  },
  nothing_gag: {
    id: "nothing_gag",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.nothingGag.title,
    message: GAME_TEXTS.dungeonEvents.nothingGag.message,
    effectLabel: GAME_TEXTS.dungeonEvents.nothingGag.effectLabel,
    kind: "nothing"
  },
  floor_up: {
    id: "floor_up",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.floorUp.title,
    message: GAME_TEXTS.dungeonEvents.floorUp.message,
    effectLabel: GAME_TEXTS.dungeonEvents.floorUp.effectLabel,
    kind: "floor",
    floorDelta: 1
  },
  floor_down: {
    id: "floor_down",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.floorDown.title,
    message: GAME_TEXTS.dungeonEvents.floorDown.message,
    effectLabel: GAME_TEXTS.dungeonEvents.floorDown.effectLabel,
    kind: "floor",
    floorDelta: -1
  },
  gain_gold: {
    id: "gain_gold",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainGold.title,
    message: GAME_TEXTS.dungeonEvents.gainGold.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainGold.effectLabel,
    kind: "gold",
    goldDelta: 1
  },
  lose_life: {
    id: "lose_life",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.loseLife.title,
    message: GAME_TEXTS.dungeonEvents.loseLife.message,
    effectLabel: GAME_TEXTS.dungeonEvents.loseLife.effectLabel,
    kind: "life_loss",
    lifeDelta: -1
  },
  nothing: {
    id: "nothing",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.nothing.title,
    message: GAME_TEXTS.dungeonEvents.nothing.message,
    effectLabel: GAME_TEXTS.dungeonEvents.nothing.effectLabel,
    kind: "nothing"
  },
  combat: {
    id: "combat",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.combatRat.title,
    message: GAME_TEXTS.dungeonEvents.combatRat.message,
    effectLabel: GAME_TEXTS.dungeonEvents.combatRat.effectLabel,
    kind: "combat"
  },
  combat_rat: {
    id: "combat_rat",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.combatRat.title,
    message: GAME_TEXTS.dungeonEvents.combatRat.message,
    effectLabel: GAME_TEXTS.dungeonEvents.combatRat.effectLabel,
    kind: "combat",
    monsterId: "rat"
  },
  combat_skeleton: {
    id: "combat_skeleton",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.combatSkeleton.title,
    message: GAME_TEXTS.dungeonEvents.combatSkeleton.message,
    effectLabel: GAME_TEXTS.dungeonEvents.combatSkeleton.effectLabel,
    kind: "combat",
    monsterId: "skeleton"
  },
  combat_guard: {
    id: "combat_guard",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.combatGuard.title,
    message: GAME_TEXTS.dungeonEvents.combatGuard.message,
    effectLabel: GAME_TEXTS.dungeonEvents.combatGuard.effectLabel,
    kind: "combat",
    monsterId: "guard"
  },
  gain_axe: {
    id: "gain_axe",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainAxe.title,
    message: GAME_TEXTS.dungeonEvents.gainAxe.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainAxe.effectLabel,
    kind: "item",
    itemId: "axe"
  },
  gain_war_underwear: {
    id: "gain_war_underwear",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainWarUnderwear.title,
    message: GAME_TEXTS.dungeonEvents.gainWarUnderwear.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainWarUnderwear.effectLabel,
    kind: "item",
    itemId: "war_underwear"
  },
  gain_weird_stone_test: {
    id: "gain_weird_stone_test",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainWeirdStoneTest.title,
    message: GAME_TEXTS.dungeonEvents.gainWeirdStoneTest.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainWeirdStoneTest.effectLabel,
    kind: "item",
    itemId: "weird_stone_test"
  },
  gain_too_long_cape: {
    id: "gain_too_long_cape",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainTooLongCape.title,
    message: GAME_TEXTS.dungeonEvents.gainTooLongCape.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainTooLongCape.effectLabel,
    kind: "item",
    itemId: "too_long_cape"
  },
  gain_panic_sandals: {
    id: "gain_panic_sandals",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainPanicSandals.title,
    message: GAME_TEXTS.dungeonEvents.gainPanicSandals.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainPanicSandals.effectLabel,
    kind: "item",
    itemId: "panic_sandals"
  },
  gain_almost_hero_medallion: {
    id: "gain_almost_hero_medallion",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainAlmostHeroMedallion.title,
    message: GAME_TEXTS.dungeonEvents.gainAlmostHeroMedallion.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainAlmostHeroMedallion.effectLabel,
    kind: "item",
    itemId: "almost_hero_medallion"
  },
  gain_ankle_ball: {
    id: "gain_ankle_ball",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainAnkleBall.title,
    message: GAME_TEXTS.dungeonEvents.gainAnkleBall.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainAnkleBall.effectLabel,
    kind: "item",
    itemId: "ankle_ball"
  },
  gain_tiny_helmet: {
    id: "gain_tiny_helmet",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainTinyHelmet.title,
    message: GAME_TEXTS.dungeonEvents.gainTinyHelmet.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainTinyHelmet.effectLabel,
    kind: "item",
    itemId: "tiny_helmet"
  },
  gain_sticky_gloves: {
    id: "gain_sticky_gloves",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainStickyGloves.title,
    message: GAME_TEXTS.dungeonEvents.gainStickyGloves.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainStickyGloves.effectLabel,
    kind: "item",
    itemId: "sticky_gloves"
  },
  gain_emotional_pebble: {
    id: "gain_emotional_pebble",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainEmotionalPebble.title,
    message: GAME_TEXTS.dungeonEvents.gainEmotionalPebble.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainEmotionalPebble.effectLabel,
    kind: "item",
    itemId: "emotional_pebble"
  },
  gain_gold_coin_test: {
    id: "gain_gold_coin_test",
    weight: 0,
    title: GAME_TEXTS.dungeonEvents.gainGoldCoinTest.title,
    message: GAME_TEXTS.dungeonEvents.gainGoldCoinTest.message,
    effectLabel: GAME_TEXTS.dungeonEvents.gainGoldCoinTest.effectLabel,
    kind: "item",
    itemId: "gold_coin_test"
  },
  loot_chest: {
    id: "loot_chest",
    weight: 1,
    title: GAME_TEXTS.dungeonEvents.lootChest.title,
    message: GAME_TEXTS.dungeonEvents.lootChest.message,
    effectLabel: GAME_TEXTS.dungeonEvents.lootChest.effectLabel,
    kind: "minigame"
  },
  coin_flip: {
    id: "coin_flip",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.coinFlip.title,
    message: GAME_TEXTS.dungeonEvents.coinFlip.message,
    effectLabel: GAME_TEXTS.dungeonEvents.coinFlip.effectLabel,
    kind: "minigame"
  },
  bonneteau: {
    id: "bonneteau",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.bonneteau.title,
    message: GAME_TEXTS.dungeonEvents.bonneteau.message,
    effectLabel: GAME_TEXTS.dungeonEvents.bonneteau.effectLabel,
    kind: "minigame"
  },
  slot_machine: {
    id: "slot_machine",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.slotMachine.title,
    message: GAME_TEXTS.dungeonEvents.slotMachine.message,
    effectLabel: GAME_TEXTS.dungeonEvents.slotMachine.effectLabel,
    kind: "minigame"
  },
  dodge_chest: {
    id: "dodge_chest",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.dodgeChest.title,
    message: GAME_TEXTS.dungeonEvents.dodgeChest.message,
    effectLabel: GAME_TEXTS.dungeonEvents.dodgeChest.effectLabel,
    kind: "minigame"
  },
  jump: {
    id: "jump",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.jump.title,
    message: GAME_TEXTS.dungeonEvents.jump.message,
    effectLabel: GAME_TEXTS.dungeonEvents.jump.effectLabel,
    kind: "minigame"
  },
  arm_wrestling: {
    id: "arm_wrestling",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.armWrestling.title,
    message: GAME_TEXTS.dungeonEvents.armWrestling.message,
    effectLabel: GAME_TEXTS.dungeonEvents.armWrestling.effectLabel,
    kind: "minigame"
  },
  tug_of_war: {
    id: "tug_of_war",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.tugOfWar.title,
    message: GAME_TEXTS.dungeonEvents.tugOfWar.message,
    effectLabel: GAME_TEXTS.dungeonEvents.tugOfWar.effectLabel,
    kind: "minigame"
  },
  elevator: {
    id: "elevator",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.elevator.title,
    message: GAME_TEXTS.dungeonEvents.elevator.message,
    effectLabel: GAME_TEXTS.dungeonEvents.elevator.effectLabel,
    kind: "minigame"
  },
  batonnets: {
    id: "batonnets",
    weight: 2,
    title: GAME_TEXTS.dungeonEvents.batonnets.title,
    message: GAME_TEXTS.dungeonEvents.batonnets.message,
    effectLabel: GAME_TEXTS.dungeonEvents.batonnets.effectLabel,
    kind: "minigame"
  }
} satisfies Record<DungeonEventId, DungeonEventDefinition>;

export const DUNGEON_EVENT_LIST = Object.values(DUNGEON_EVENTS);

export const DUNGEON_EVENT_ALIASES: Record<string, DungeonEventId> = {
  gold: "gain_gold_random",
  life_loss: "lose_heart",
  gain_gold: "gain_gold_random",
  lose_life: "lose_heart",
  nothing: "nothing_gag"
};

export function getDungeonEventDefinition(id: string): DungeonEventDefinition | undefined {
  const eventId = isDungeonEventId(id) ? id : DUNGEON_EVENT_ALIASES[id];
  return eventId ? DUNGEON_EVENTS[eventId] : undefined;
}

export function isDungeonEventId(id: string): id is DungeonEventId {
  return id in DUNGEON_EVENTS;
}
