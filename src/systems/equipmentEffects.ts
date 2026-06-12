import { GAME_TEXTS } from "../data/gameTexts";
import { getItemDefinition } from "../data/itemDefinitions";
import type { DungeonRunState, HeartLossContext } from "./dungeonRunState";

const BASE_MAX_LIFE = 3;
const RUN_MAX_LIFE_CAP = 12;
const DISPLAY_BREAK_CHANCES: Record<string, number> = {
  axe: 50,
  tiny_helmet: 50,
  panic_sandals: 50,
  almost_hero_medallion: 100
};

export type HeartLossEquipmentResult = {
  state: DungeonRunState;
  remainingLoss: number;
  effectMessages: string[];
  brokenItems: string[];
};

export type PostHeartLossEquipmentResult = {
  state: DungeonRunState;
  effectMessages: string[];
  brokenItems: string[];
};

export type MonsterDamageEquipmentResult = {
  state: DungeonRunState;
  damage: number;
  effectMessages: string[];
  brokenItems: string[];
};

export type GoldGainEquipmentResult = {
  bonusGold: number;
  effectMessages: string[];
};

export type FloorDeltaEquipmentResult = {
  state: DungeonRunState;
  floorDelta: number;
  effectMessages: string[];
  brokenItems: string[];
};

export function applyPreHeartLossEquipmentEffects(
  sourceState: DungeonRunState,
  amount: number,
  context: HeartLossContext,
  random: () => number
): HeartLossEquipmentResult {
  const effectMessages: string[] = [];
  const brokenItems: string[] = [];
  let state = sourceState;
  let remainingLoss = Math.max(0, Math.trunc(amount));

  const specializedItem =
    context === "combat"
      ? "tiny_helmet"
      : context === "dungeon_event" || context === "final_door" || context === "debug"
        ? "panic_sandals"
        : undefined;

  if (specializedItem && remainingLoss > 0 && isEquipmentActive(state, specializedItem)) {
    remainingLoss = Math.max(0, remainingLoss - 1);
    effectMessages.push(specializedItem === "tiny_helmet" ? GAME_TEXTS.itemEffects.tinyHelmetBlock : GAME_TEXTS.itemEffects.panicSandalsBlock);
    const breakResult = maybeBreakEquipment(state, specializedItem, 0.5, random);
    state = breakResult.state;
    brokenItems.push(...breakResult.brokenItems);
    appendBrokenItemMessages(effectMessages, breakResult.brokenItems);
  }

  return {
    state,
    remainingLoss,
    effectMessages,
    brokenItems
  };
}

export function applyPostHeartLossEquipmentEffects(
  sourceState: DungeonRunState,
  finalLoss: number,
  random: () => number
): PostHeartLossEquipmentResult {
  const effectMessages: string[] = [];
  const brokenItems: string[] = [];
  let state = sourceState;

  if (finalLoss > 0 && state.life > 0 && state.life < state.maxLife && isEquipmentActive(state, "emotional_pebble") && random() < 0.5) {
    state = {
      ...state,
      life: Math.min(state.maxLife, state.life + 1)
    };
    effectMessages.push(GAME_TEXTS.itemEffects.emotionalPebbleHeal);
  }

  if (finalLoss > 0 && state.life <= 0 && isEquipmentActive(state, "almost_hero_medallion")) {
    state = {
      ...state,
      life: 1
    };
    effectMessages.push(GAME_TEXTS.itemEffects.almostHeroMedallionSave);
    const breakResult = breakEquipment(state, "almost_hero_medallion");
    state = breakResult.state;
    brokenItems.push(...breakResult.brokenItems);
    appendBrokenItemMessages(effectMessages, breakResult.brokenItems);
  }

  return {
    state,
    effectMessages,
    brokenItems
  };
}

export function applyMonsterDamageEquipmentEffects(
  sourceState: DungeonRunState,
  baseDamage: number,
  random: () => number
): MonsterDamageEquipmentResult {
  const damage = Math.max(0, Math.trunc(baseDamage));
  const effectMessages: string[] = [];
  const brokenItems: string[] = [];
  let state = sourceState;
  let finalDamage = damage;

  if (damage > 0 && isEquipmentActive(state, "axe")) {
    finalDamage += 1;
    effectMessages.push(GAME_TEXTS.itemEffects.axeDamage);
    const breakResult = maybeBreakEquipment(state, "axe", 0.5, random);
    state = breakResult.state;
    brokenItems.push(...breakResult.brokenItems);
    appendBrokenItemMessages(effectMessages, breakResult.brokenItems);
  }

  return {
    state,
    damage: finalDamage,
    effectMessages,
    brokenItems
  };
}

export function applyGoldGainEquipmentEffects(
  sourceState: DungeonRunState,
  baseGold: number,
  random: () => number
): GoldGainEquipmentResult {
  if (baseGold <= 0 || !isEquipmentActive(sourceState, "sticky_gloves") || random() >= 0.5) {
    return { bonusGold: 0, effectMessages: [] };
  }

  const bonusGold = randomIntWithRandom(1, baseGold, random);
  return {
    bonusGold,
    effectMessages: [GAME_TEXTS.itemEffects.stickyGlovesGold(bonusGold)]
  };
}

export function applyFloorDeltaEquipmentEffects(
  sourceState: DungeonRunState,
  floorDelta: number,
  _random: () => number
): FloorDeltaEquipmentResult {
  return { state: sourceState, floorDelta, effectMessages: [], brokenItems: [] };
}

export function applyEquipmentMaxLifeToState(source: DungeonRunState, previousEquipment: string[]): DungeonRunState {
  const previousHadSlip = previousEquipment.includes("war_underwear");
  const nextHadSlip = source.equipment.includes("war_underwear");
  const baseMaxLife = Math.max(BASE_MAX_LIFE, source.maxLife - (previousHadSlip ? 1 : 0));
  const maxLife = Math.min(RUN_MAX_LIFE_CAP, baseMaxLife + (nextHadSlip ? 1 : 0));
  return {
    ...source,
    maxLife,
    life: Math.min(source.life, maxLife)
  };
}

export function combineEffectMessages(messages: string[]): string {
  return GAME_TEXTS.itemEffects.combined(messages.filter(Boolean));
}

export function getEquipmentBreakChancePercent(itemId: string): number {
  return DISPLAY_BREAK_CHANCES[itemId] ?? 0;
}

function maybeBreakEquipment(
  sourceState: DungeonRunState,
  itemId: string,
  baseChance: number,
  random: () => number
): { state: DungeonRunState; brokenItems: string[] } {
  const chance = getEffectiveBreakChance(sourceState, itemId, baseChance);
  return random() < chance ? breakEquipment(sourceState, itemId) : { state: sourceState, brokenItems: [] };
}

function getEffectiveBreakChance(sourceState: DungeonRunState, itemId: string, baseChance: number): number {
  if (baseChance === 0.5 && itemId !== "too_long_cape" && isEquipmentActive(sourceState, "too_long_cape")) {
    return 0.35;
  }

  return baseChance;
}

function breakEquipment(sourceState: DungeonRunState, itemId: string): { state: DungeonRunState; brokenItems: string[] } {
  if (!isEquipmentActive(sourceState, itemId)) {
    return { state: sourceState, brokenItems: [] };
  }

  const nextState = {
    ...sourceState,
    equipment: sourceState.equipment.filter((equippedItem) => equippedItem !== itemId),
    inventory: sourceState.inventory.filter((inventoryItem) => inventoryItem !== itemId)
  };

  return {
    state: applyEquipmentMaxLifeToState(nextState, sourceState.equipment),
    brokenItems: [itemId]
  };
}

function isEquipmentActive(sourceState: DungeonRunState, itemId: string): boolean {
  return sourceState.equipment.includes(itemId);
}

function getItemName(itemId: string): string {
  return getItemDefinition(itemId)?.name ?? GAME_TEXTS.inventory.unknownItem(itemId);
}

function appendBrokenItemMessages(messages: string[], brokenItems: string[]): void {
  brokenItems.forEach((itemId) => {
    messages.push(GAME_TEXTS.itemEffects.itemBroke(getItemName(itemId)));
  });
}

function randomIntWithRandom(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
