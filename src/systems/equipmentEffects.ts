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
const SURVIVAL_GROUP = ["tiny_helmet", "almost_hero_medallion", "war_underwear", "emotional_pebble"] as const;

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
    if (specializedItem === "tiny_helmet" && hasSurvivalCombo(state)) {
      effectMessages.push(getSurvivalComboMessage(state, "noBreak"));
    } else {
      const breakResult = maybeBreakEquipment(state, specializedItem, 0.5, random);
      state = breakResult.state;
      brokenItems.push(...breakResult.brokenItems);
      appendBrokenItemMessages(effectMessages, breakResult.brokenItems);
    }
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

  if (
    finalLoss > 0 &&
    state.life > 0 &&
    state.life < state.maxLife &&
    isEquipmentActive(state, "emotional_pebble") &&
    (hasSurvivalCombo(state) || random() < 0.5)
  ) {
    state = {
      ...state,
      life: Math.min(state.maxLife, state.life + 1)
    };
    effectMessages.push(GAME_TEXTS.itemEffects.emotionalPebbleHeal);
    if (hasSurvivalCombo(state)) {
      effectMessages.push(getSurvivalComboMessage(state, "heal"));
    }
  }

  if (finalLoss > 0 && state.life <= 0 && isEquipmentActive(state, "almost_hero_medallion")) {
    state = {
      ...state,
      life: 1
    };
    effectMessages.push(GAME_TEXTS.itemEffects.almostHeroMedallionSave);
    if (hasSurvivalCombo(state)) {
      effectMessages.push(getSurvivalComboMessage(state, "survive"));
      if (isEquipmentActive(state, "emotional_pebble") && state.life < state.maxLife) {
        state = {
          ...state,
          life: Math.min(state.maxLife, state.life + 1)
        };
        effectMessages.push(GAME_TEXTS.itemEffects.emotionalPebbleHeal);
        effectMessages.push(getSurvivalComboMessage(state, "heal"));
      }
    } else {
      const breakResult = breakEquipment(state, "almost_hero_medallion");
      state = breakResult.state;
      brokenItems.push(...breakResult.brokenItems);
      appendBrokenItemMessages(effectMessages, breakResult.brokenItems);
    }
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
  const previousBonus = getWarUnderwearMaxLifeBonus(previousEquipment);
  const nextBonus = getWarUnderwearMaxLifeBonus(source.equipment);
  const baseMaxLife = Math.max(BASE_MAX_LIFE, source.maxLife - previousBonus);
  const maxLife = Math.min(RUN_MAX_LIFE_CAP, baseMaxLife + nextBonus);
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

function getWarUnderwearMaxLifeBonus(equipment: string[]): number {
  if (!equipment.includes("war_underwear")) {
    return 0;
  }

  return getSurvivalGroupCount(equipment) >= 2 ? 2 : 1;
}

function hasSurvivalCombo(sourceState: DungeonRunState): boolean {
  return getSurvivalGroupCount(sourceState.equipment) >= 2;
}

function hasSurvivalMegaCombo(sourceState: DungeonRunState): boolean {
  return getSurvivalGroupCount(sourceState.equipment) >= SURVIVAL_GROUP.length;
}

function getSurvivalGroupCount(equipment: string[]): number {
  return SURVIVAL_GROUP.filter((itemId) => equipment.includes(itemId)).length;
}

function getSurvivalComboMessage(sourceState: DungeonRunState, effect: "heal" | "noBreak" | "survive"): string {
  if (hasSurvivalMegaCombo(sourceState)) {
    if (effect === "survive") {
      return GAME_TEXTS.itemEffects.megaComboSurvive;
    }
    return effect === "heal" ? GAME_TEXTS.itemEffects.megaComboHeal : GAME_TEXTS.itemEffects.megaComboNoBreak;
  }

  return effect === "heal" ? GAME_TEXTS.itemEffects.comboHeal : GAME_TEXTS.itemEffects.comboNoBreak;
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
