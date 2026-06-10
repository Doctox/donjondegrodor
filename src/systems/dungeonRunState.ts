import {
  DUNGEON_EVENT_LIST,
  DungeonEventDefinition,
  DungeonEventId,
  getDungeonEventDefinition
} from "../data/dungeonEvents";
import { GrodorEquipmentId, isGrodorEquipmentId } from "../data/equipmentDefinitions";
import { GAME_TEXTS } from "../data/gameTexts";
import { getEquipmentSlot, getItemDefinition } from "../data/itemDefinitions";
import { MonsterId } from "../data/monsterDefinitions";
import {
  applyEquipmentMaxLifeToState,
  applyFloorDeltaEquipmentEffects,
  applyGoldGainEquipmentEffects,
  applyMonsterDamageEquipmentEffects,
  applyPostHeartLossEquipmentEffects,
  applyPreHeartLossEquipmentEffects,
  combineEffectMessages
} from "./equipmentEffects";
import { addGrodorStat, resetCurrentGrodorRunStats } from "./grodorStats";
import { clearStartingLoadout, getStartingLoadout } from "./metaProgression";
import { shouldCowardReflexCancelDamage, shouldTragicCardioIncreaseMaxLife } from "./permanentUpgrades";

export type DungeonRunState = {
  life: number;
  maxLife: number;
  gold: number;
  carriedGold: number;
  bankGold: number;
  wins: number;
  totalFloors: number;
  currentFloor: number;
  // Alias de compatibilite pour le HUD/reports existants: floor === currentFloor.
  floor: number;
  attempt: number;
  inventory: string[];
  equipment: string[];
  lastEvent: string;
};

export type DungeonRunEvent = {
  id: DungeonEventId;
  kind: DungeonEventDefinition["kind"];
  title: string;
  message: string;
  effectLabel: string;
  monsterId?: MonsterId;
  goldDelta?: number;
  lifeDelta?: number;
  floorDelta?: number;
  state: DungeonRunState;
};

export type FinalDoorOutcomeId = "escape" | "bruise" | "trap";

export type FinalDoorOutcome = {
  kind: "final_door";
  outcome: FinalDoorOutcomeId;
  title: string;
  message: string;
  effectLabel: string;
  lifeDelta: number;
  victory: boolean;
  defeated: boolean;
  state: DungeonRunState;
};

export type HeartLossContext = "dungeon_event" | "combat" | "final_door" | "debug";

export type HeartLossResult = {
  requestedLoss: number;
  finalLoss: number;
  passiveTriggered: boolean;
  context: HeartLossContext;
  state: DungeonRunState;
  message?: string;
  effectMessages: string[];
  brokenItems: string[];
};

export type GoldRewardResult = {
  baseGold: number;
  bonusGold: number;
  totalGold: number;
  effectMessages: string[];
  state: DungeonRunState;
};

export type FloorDeltaResult = {
  requestedFloorDelta: number;
  floorDelta: number;
  effectMessages: string[];
  state: DungeonRunState;
};

const BANK_GOLD_STORAGE_KEY = "grodor_bank_gold";
const RUN_MAX_LIFE_CAP = 12;

const initialState: DungeonRunState = {
  life: 3,
  maxLife: 3,
  gold: 0,
  carriedGold: 0,
  bankGold: loadBankGold(),
  wins: 0,
  totalFloors: 5,
  currentFloor: 5,
  floor: 5,
  attempt: 0,
  inventory: [],
  equipment: [],
  lastEvent: GAME_TEXTS.dungeon.initialLastEvent
};

let state: DungeonRunState = cloneState(initialState);

export function getRunFloorRange(wins: number): { min: number; max: number } {
  if (wins < 10) {
    return { min: 5, max: 10 };
  }

  if (wins < 20) {
    return { min: 5, max: 15 };
  }

  if (wins < 30) {
    return { min: 5, max: 20 };
  }

  if (wins < 40) {
    return { min: 5, max: 25 };
  }

  return { min: 5, max: 30 };
}

export function getDungeonRunState(): DungeonRunState {
  return cloneState(state);
}

export function resetDungeonRunState(
  options: {
    incrementAttempt?: boolean;
    preserveInventoryEquipment?: boolean;
    useStartingLoadout?: boolean;
    random?: () => number;
  } = {}
): DungeonRunState {
  const attempt = state.attempt + (options.incrementAttempt ? 1 : 0);
  const startingLoadoutItems = options.useStartingLoadout ? Object.values(getStartingLoadout()).filter(Boolean) : [];
  const preservedInventory = options.preserveInventoryEquipment ? [...state.inventory] : startingLoadoutItems;
  const preservedEquipment = options.preserveInventoryEquipment ? normalizeEquipmentBySlot(state.equipment) : normalizeEquipmentBySlot(startingLoadoutItems);
  resetCurrentGrodorRunStats();
  state = createNewRunState(state.wins, state.bankGold, attempt, options.random);
  if (options.preserveInventoryEquipment || options.useStartingLoadout) {
    const previousEquipment = state.equipment;
    state = {
      ...state,
      inventory: preservedInventory,
      equipment: preservedEquipment
    };
    state = applyEquipmentMaxLifeToState(state, previousEquipment);
  }
  if (options.useStartingLoadout) {
    clearStartingLoadout();
  }
  return getDungeonRunState();
}

export function resetDungeonProgressDebug(): DungeonRunState {
  saveBankGold(0);
  resetCurrentGrodorRunStats();
  state = createNewRunState(0, 0, 0);
  return getDungeonRunState();
}

export function resetDungeonAttemptCounter(): DungeonRunState {
  state = {
    ...state,
    attempt: 0
  };
  return getDungeonRunState();
}

export function applyDungeonRunDebugOverrides(params: URLSearchParams): DungeonRunState {
  const wins = parseNumberParam(params, "wins", state.wins, 0, 999);
  const maxLife = parseNumberParam(params, "maxLife", state.maxLife, 1, 12);
  const life = parseNumberParam(params, "life", state.life, 0, maxLife);
  const range = getRunFloorRange(wins);
  const totalFloorsFallback = params.has("wins") ? randomInt(range.min, range.max) : state.totalFloors;
  const totalFloors = parseNumberParam(params, "totalFloors", totalFloorsFallback, 1, 99);
  const currentFloorFallback =
    params.has("wins") && !params.has("floor") && !params.has("currentFloor")
      ? totalFloors
      : Math.min(state.currentFloor, totalFloors);
  const currentFloor = parseNumberParam(
    params,
    params.has("currentFloor") ? "currentFloor" : "floor",
    currentFloorFallback,
    0,
    totalFloors
  );
  const attempt = parseNumberParam(params, "attempt", state.attempt, 0, 99);
  const carriedGold = parseNumberParam(params, "gold", state.carriedGold, 0, 999);
  const inventoryParam = params.get("inventory");
  const equipmentParam = params.get("equipment");
  const equipment = parseEquipmentParam(equipmentParam, state.equipment);

  state = {
    ...state,
    wins,
    maxLife,
    life: Math.min(life, maxLife),
    totalFloors,
    currentFloor,
    floor: currentFloor,
    attempt,
    gold: carriedGold,
    carriedGold,
    inventory: parseInventoryParam(inventoryParam, equipmentParam, equipment, state.inventory),
    equipment
  };
  state = applyEquipmentMaxLifeToState(state, []);

  return getDungeonRunState();
}

export function resolveRandomDoorEvent(random: () => number = Math.random): DungeonRunEvent {
  return resolveDoorEvent(pickRandomDoorEventId(random), random);
}

export function pickRandomDoorEventId(random: () => number = Math.random): DungeonEventId {
  return pickWeightedDungeonEvent(random).id;
}

export function resolveDoorEvent(id: string, random: () => number = Math.random): DungeonRunEvent {
  const definition = getDungeonEventDefinition(id) ?? getDungeonEventDefinition("nothing")!;
  let goldDelta = getGoldDelta(definition, random);
  let lifeDelta = definition.lifeDelta ?? 0;
  let floorDelta = definition.floorDelta ?? 0;
  let effectLabel =
    definition.id === "gain_gold_random" ? GAME_TEXTS.dungeonEvents.gainGoldRandom.effectLabel(goldDelta) : definition.effectLabel;

  if (goldDelta) {
    const goldResult = applyGoldGainWithEquipment(goldDelta, random);
    goldDelta = goldResult.totalGold;
    if (goldResult.effectMessages.length > 0) {
      effectLabel = combineEffectMessages([effectLabel, ...goldResult.effectMessages]);
    }
  }

  if (lifeDelta < 0) {
    const lossResult = applyHeartLossWithCowardReflex(Math.abs(lifeDelta), "dungeon_event", random);
    lifeDelta = -lossResult.finalLoss;
    if (lossResult.effectMessages.length > 0) {
      effectLabel = combineEffectMessages([effectLabel, ...lossResult.effectMessages]);
    }
  } else if (lifeDelta > 0) {
    state = {
      ...state,
      life: Math.max(0, Math.min(state.maxLife, state.life + lifeDelta))
    };
  }

  if (floorDelta) {
    const originalFloorDelta = floorDelta;
    const floorResult = applyFloorDeltaEquipmentEffects(state, floorDelta, random);
    state = floorResult.state;
    floorDelta = floorResult.floorDelta;
    if (floorResult.effectMessages.length > 0) {
      const baseFloorEffect =
        originalFloorDelta > 0 && floorDelta < 0 ? GAME_TEXTS.dungeonEvents.floorDown.effectLabel : effectLabel;
      effectLabel = combineEffectMessages([baseFloorEffect, ...floorResult.effectMessages]);
    }
    const currentFloor = clampNumber(state.currentFloor + floorDelta, 1, state.totalFloors);
    state = {
      ...state,
      currentFloor,
      floor: currentFloor
    };
  }

  if (definition.itemId) {
    state = addInventoryItem(state, definition.itemId);
  }

  state = { ...state, lastEvent: definition.message };

  return {
    id: definition.id,
    kind: definition.kind,
    title: definition.title,
    message: state.lastEvent,
    effectLabel,
    monsterId: definition.monsterId,
    goldDelta,
    lifeDelta,
    floorDelta,
    state: getDungeonRunState()
  };
}

export function resolveFinalDoorOutcome(
  sourceState: DungeonRunState = getDungeonRunState(),
  forcedOutcome?: FinalDoorOutcomeId,
  roll: number = Math.random()
): FinalDoorOutcome {
  const outcome = forcedOutcome ?? pickFinalDoorOutcome(sourceState.totalFloors, roll);
  let lifeDelta = outcome === "escape" ? 0 : outcome === "bruise" ? -1 : -2;
  const texts = GAME_TEXTS.finalDoor[outcome];
  let effectLabel: string = texts.effectLabel;

  state = {
    ...state,
    currentFloor: 1,
    floor: 1,
    lastEvent: texts.message
  };
  if (lifeDelta < 0) {
    const lossResult = applyHeartLossWithCowardReflex(Math.abs(lifeDelta), "final_door");
    lifeDelta = -lossResult.finalLoss;
    if (lossResult.effectMessages.length > 0) {
      effectLabel = lossResult.message ?? effectLabel;
    }
  }

  return {
    kind: "final_door",
    outcome,
    title: texts.title,
    message: texts.message,
    effectLabel,
    lifeDelta,
    victory: outcome === "escape",
    defeated: state.life <= 0,
    state: getDungeonRunState()
  };
}

export function setDungeonEquipmentForDebug(items: string[]): DungeonRunState {
  const equipment = normalizeEquipmentBySlot(items);
  const previousEquipment = state.equipment;

  state = {
    ...state,
    equipment,
    inventory: equipment,
    lastEvent: GAME_TEXTS.debug.equipmentUpdated
  };
  state = applyEquipmentMaxLifeToState(state, previousEquipment);

  return getDungeonRunState();
}

export function setDungeonLifeForCombat(life: number): DungeonRunState {
  const nextLife = clampNumber(Math.trunc(life), 0, state.maxLife);
  if (nextLife < state.life) {
    return applyHeartLossWithCowardReflex(state.life - nextLife, "combat").state;
  }

  state = {
    ...state,
    life: nextLife,
    lastEvent: life <= 0 ? GAME_TEXTS.combat.stunnedReturn : state.lastEvent
  };

  return getDungeonRunState();
}

export function adjustDungeonLifeForDebug(delta: number): DungeonRunState {
  if (delta < 0) {
    const lossResult = applyHeartLossWithCowardReflex(Math.abs(delta), "debug");
    state = {
      ...state,
      lastEvent:
        lossResult.effectMessages.length > 0
          ? combineEffectMessages([GAME_TEXTS.debug.grodorDamaged, ...lossResult.effectMessages])
          : GAME_TEXTS.debug.grodorDamaged
    };
    return getDungeonRunState();
  }

  const nextLife = clampNumber(state.life + delta, 0, state.maxLife);
  state = {
    ...state,
    life: nextLife,
    lastEvent: delta > 0 ? GAME_TEXTS.debug.grodorRecovered : GAME_TEXTS.debug.grodorDamaged
  };

  return getDungeonRunState();
}

export function applyHeartLossWithCowardReflex(
  amount: number,
  context: HeartLossContext,
  random: () => number = Math.random
): HeartLossResult {
  const requestedLoss = Math.max(0, Math.trunc(amount));
  if (requestedLoss <= 0 || state.life <= 0) {
    return {
      requestedLoss,
      finalLoss: 0,
      passiveTriggered: false,
      context,
      state: getDungeonRunState(),
      effectMessages: [],
      brokenItems: []
    };
  }

  const effectMessages: string[] = [];
  const brokenItems: string[] = [];
  const preLossResult = applyPreHeartLossEquipmentEffects(state, requestedLoss, context, random);
  state = preLossResult.state;
  effectMessages.push(...preLossResult.effectMessages);
  brokenItems.push(...preLossResult.brokenItems);
  let remainingLoss = preLossResult.remainingLoss;

  const passiveTriggered = remainingLoss > 0 && shouldCowardReflexCancelDamage(random);
  if (passiveTriggered) {
    remainingLoss = Math.max(0, remainingLoss - 1);
    effectMessages.push(GAME_TEXTS.dungeon.cowardReflexTriggered);
  }

  const finalLoss = remainingLoss;
  state = {
    ...state,
    life: Math.max(0, state.life - finalLoss)
  };
  if (finalLoss > 0) {
    addGrodorStat("degatsSubis", finalLoss);
  }

  const postLossResult = applyPostHeartLossEquipmentEffects(state, finalLoss, random);
  state = postLossResult.state;
  effectMessages.push(...postLossResult.effectMessages);
  brokenItems.push(...postLossResult.brokenItems);

  return {
    requestedLoss,
    finalLoss,
    passiveTriggered,
    context,
    state: getDungeonRunState(),
    message: effectMessages.length > 0 ? combineEffectMessages(effectMessages) : undefined,
    effectMessages,
    brokenItems
  };
}

export function addDungeonGoldForDebug(amount: number): DungeonRunState {
  const reward = Math.max(0, Math.trunc(amount));
  const goldResult = applyGoldGainWithEquipment(reward);
  state = { ...state, lastEvent: combineEffectMessages([GAME_TEXTS.debug.grodorGoldAdded(goldResult.baseGold), ...goldResult.effectMessages]) };

  return getDungeonRunState();
}

export function addDungeonGoldReward(goldReward: number): GoldRewardResult {
  const goldResult = applyGoldGainWithEquipment(goldReward);

  return {
    ...goldResult,
    state: getDungeonRunState()
  };
}

export function loseCarriedGold(amount: number): DungeonRunState {
  const loss = Math.max(0, Math.trunc(amount));
  if (loss <= 0) {
    return getDungeonRunState();
  }

  const carriedGold = Math.max(0, state.carriedGold - loss);
  state = {
    ...state,
    gold: carriedGold,
    carriedGold
  };

  return getDungeonRunState();
}

export function applyDungeonFloorDelta(floorDelta: number, random: () => number = Math.random): FloorDeltaResult {
  const requestedFloorDelta = Math.trunc(floorDelta);
  if (requestedFloorDelta === 0) {
    return {
      requestedFloorDelta,
      floorDelta: 0,
      effectMessages: [],
      state: getDungeonRunState()
    };
  }

  const floorResult = applyFloorDeltaEquipmentEffects(state, requestedFloorDelta, random);
  state = floorResult.state;
  const appliedFloorDelta = floorResult.floorDelta;
  const currentFloor = clampNumber(state.currentFloor + appliedFloorDelta, 1, state.totalFloors);
  state = {
    ...state,
    currentFloor,
    floor: currentFloor
  };

  return {
    requestedFloorDelta,
    floorDelta: appliedFloorDelta,
    effectMessages: floorResult.effectMessages,
    state: getDungeonRunState()
  };
}

export function increaseRunMaxLife(amount: number): DungeonRunState {
  const gain = Math.max(0, Math.trunc(amount));
  if (gain <= 0 || state.maxLife >= RUN_MAX_LIFE_CAP) {
    return getDungeonRunState();
  }

  const maxLife = Math.min(RUN_MAX_LIFE_CAP, state.maxLife + gain);
  state = {
    ...state,
    maxLife,
    life: Math.min(maxLife, state.life + (maxLife > state.maxLife ? 1 : 0))
  };

  return getDungeonRunState();
}

export function decreaseRunMaxLife(amount: number): DungeonRunState {
  const loss = Math.max(0, Math.trunc(amount));
  if (loss <= 0 || state.maxLife <= 1) {
    return getDungeonRunState();
  }

  const maxLife = Math.max(1, state.maxLife - loss);
  state = {
    ...state,
    maxLife,
    life: Math.min(state.life, maxLife)
  };

  return getDungeonRunState();
}

export function forceDungeonRunDeath(): DungeonRunState {
  state = {
    ...state,
    life: 0,
    lastEvent: GAME_TEXTS.dungeon.runEndedStatus
  };

  return getDungeonRunState();
}

export function depositCarriedGoldInBank(): DungeonRunState {
  if (state.carriedGold <= 0) {
    return getDungeonRunState();
  }

  const bankGold = state.bankGold + state.carriedGold;
  state = {
    ...state,
    bankGold,
    gold: 0,
    carriedGold: 0
  };
  saveBankGold(bankGold);

  return getDungeonRunState();
}

export function applyMonsterDamageWithEquipment(baseDamage: number, random: () => number = Math.random): {
  damage: number;
  effectMessages: string[];
  brokenItems: string[];
  state: DungeonRunState;
} {
  const damageResult = applyMonsterDamageEquipmentEffects(state, baseDamage, random);
  state = damageResult.state;

  return {
    damage: damageResult.damage,
    effectMessages: damageResult.effectMessages,
    brokenItems: damageResult.brokenItems,
    state: getDungeonRunState()
  };
}

export function spendBankGold(amount: number): DungeonRunState | undefined {
  const price = Math.max(0, Math.trunc(amount));
  if (price <= 0 || state.bankGold < price) {
    return undefined;
  }

  const bankGold = state.bankGold - price;
  state = {
    ...state,
    bankGold
  };
  saveBankGold(bankGold);

  return getDungeonRunState();
}

export function addInventoryItem(source: DungeonRunState, itemId: string): DungeonRunState {
  const definition = getItemDefinition(itemId);
  if (definition?.kind === "equipment" && definition.equipmentId) {
    const nextState = addEquipmentItem(source, definition.equipmentId);
    if (nextState.equipment === source.equipment) {
      return source;
    }

    const hadItem = nextState.inventory.includes(itemId);
    if (!hadItem) {
      addGrodorStat("objetsRamasses");
    }

    return hadItem ? nextState : { ...nextState, inventory: [...nextState.inventory, itemId] };
  }

  const hadItem = source.inventory.includes(itemId);
  let nextState = hadItem ? source : { ...source, inventory: [...source.inventory, itemId] };

  if (!hadItem) {
    addGrodorStat("objetsRamasses");
  }

  return nextState;
}

export function addDungeonInventoryItem(itemId: string): DungeonRunState {
  state = addInventoryItem(state, itemId);
  return getDungeonRunState();
}

export function addEquipmentItem(source: DungeonRunState, equipmentId: GrodorEquipmentId): DungeonRunState {
  if (source.equipment.includes(equipmentId)) {
    return source;
  }

  const slot = getEquipmentSlot(equipmentId);
  if (slot && source.equipment.some((itemId) => getEquipmentSlot(itemId) === slot)) {
    // TODO: ouvrir une fenetre de choix remplacer/garder quand un loot tombe sur un slot deja occupe.
    return source;
  }

  return applyEquipmentMaxLifeToState({ ...source, equipment: [...source.equipment, equipmentId] }, source.equipment);
}

export function replaceDungeonEquipmentItem(currentItemId: string, nextItemId: string): DungeonRunState {
  const nextDefinition = getItemDefinition(nextItemId);
  if (nextDefinition?.kind !== "equipment" || !nextDefinition.equipmentId) {
    return getDungeonRunState();
  }

  const nextEquipment = normalizeEquipmentBySlot([
    ...state.equipment.filter((itemId) => itemId !== currentItemId),
    nextDefinition.equipmentId
  ]);
  state = {
    ...state,
    equipment: nextEquipment,
    inventory: [...new Set([...state.inventory.filter((itemId) => itemId !== currentItemId && itemId !== nextItemId), nextItemId])]
  };
  state = applyEquipmentMaxLifeToState(state, [currentItemId, ...state.equipment.filter((itemId) => itemId !== nextItemId)]);
  addGrodorStat("objetsRamasses");

  return getDungeonRunState();
}

export function removeDungeonEquipmentItem(itemId: string): DungeonRunState {
  if (!state.equipment.includes(itemId)) {
    return getDungeonRunState();
  }

  const previousEquipment = state.equipment;
  state = {
    ...state,
    equipment: state.equipment.filter((equippedItem) => equippedItem !== itemId),
    inventory: state.inventory.filter((inventoryItem) => inventoryItem !== itemId)
  };
  state = applyEquipmentMaxLifeToState(state, previousEquipment);

  return getDungeonRunState();
}

function applyGoldGainWithEquipment(amount: number, random: () => number = Math.random): {
  baseGold: number;
  bonusGold: number;
  totalGold: number;
  effectMessages: string[];
} {
  const baseGold = Math.max(0, Math.trunc(amount));
  if (baseGold <= 0) {
    return { baseGold, bonusGold: 0, totalGold: 0, effectMessages: [] };
  }

  const goldEquipmentResult = applyGoldGainEquipmentEffects(state, baseGold, random);
  const bonusGold = goldEquipmentResult.bonusGold;

  const totalGold = baseGold + bonusGold;
  state = {
    ...state,
    gold: state.gold + totalGold,
    carriedGold: state.carriedGold + totalGold
  };
  addGrodorStat("poGagnes", totalGold);
  return { baseGold, bonusGold, totalGold, effectMessages: goldEquipmentResult.effectMessages };
}

function parseNumberParam(params: URLSearchParams, key: string, fallback: number, min: number, max: number): number {
  if (!params.has(key)) {
    return fallback;
  }

  const value = Number(params.get(key));
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return clampNumber(Math.trunc(value), min, max);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function loadBankGold(): number {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return 0;
    }

    const storedValue = window.localStorage.getItem(BANK_GOLD_STORAGE_KEY);
    if (storedValue === null) {
      return 0;
    }

    const parsedValue = Number(storedValue);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      saveBankGold(0);
      return 0;
    }

    return Math.trunc(parsedValue);
  } catch {
    return 0;
  }
}

function saveBankGold(value: number): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(BANK_GOLD_STORAGE_KEY, String(Math.max(0, Math.trunc(value))));
  } catch {
    // localStorage can be blocked; keep the in-memory bank state for this session.
  }
}

function cloneState(source: DungeonRunState): DungeonRunState {
  return { ...source, floor: source.currentFloor, inventory: [...source.inventory], equipment: [...source.equipment] };
}

function createNewRunState(wins: number, bankGold: number, attempt = state.attempt, random: () => number = Math.random): DungeonRunState {
  const range = getRunFloorRange(wins);
  const totalFloors = randomInt(range.min, range.max, random);
  const tragicCardioTriggered = shouldTragicCardioIncreaseMaxLife(random);
  const cardioBonus = tragicCardioTriggered ? 1 : 0;
  const maxLife = Math.min(RUN_MAX_LIFE_CAP, initialState.maxLife + cardioBonus);

  return {
    ...initialState,
    life: Math.min(maxLife, initialState.life + cardioBonus),
    maxLife,
    bankGold,
    wins,
    attempt,
    totalFloors,
    currentFloor: totalFloors,
    floor: totalFloors,
    inventory: [],
    equipment: [],
    lastEvent: tragicCardioTriggered ? GAME_TEXTS.dungeon.tragicCardioTriggered : initialState.lastEvent
  };
}

function randomInt(min: number, max: number, random: () => number = Math.random): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function parseEquipmentParam(value: string | null, fallback: string[]): string[] {
  if (!value) {
    return normalizeEquipmentBySlot(fallback);
  }

  if (value === "empty") {
    return [];
  }

  return normalizeEquipmentBySlot(value.split(",").map((item) => item.trim()));
}

function normalizeEquipmentBySlot(items: string[]): GrodorEquipmentId[] {
  const usedSlots = new Set<string>();
  const equipment: GrodorEquipmentId[] = [];

  items.forEach((item) => {
    if (!isGrodorEquipmentId(item) || equipment.includes(item)) {
      return;
    }

    const slot = getEquipmentSlot(item);
    if (slot && usedSlots.has(slot)) {
      return;
    }

    if (slot) {
      usedSlots.add(slot);
    }
    equipment.push(item);
  });

  return equipment;
}

function parseInventoryParam(
  inventoryParam: string | null,
  equipmentParam: string | null,
  equipment: string[],
  fallback: string[]
): string[] {
  if (inventoryParam === "full") {
    return [...new Set(["debug_item", ...equipment])];
  }

  if (inventoryParam === "empty") {
    return [];
  }

  if (inventoryParam !== null) {
    return [
      ...new Set(
        inventoryParam
          .split(",")
          .map((item) => item.trim())
          .filter((item) => Boolean(getItemDefinition(item)))
      )
    ];
  }

  if (equipmentParam !== null) {
    return [...new Set(equipment)];
  }

  return fallback;
}

function pickWeightedDungeonEvent(random: () => number): DungeonEventDefinition {
  const eligibleEvents = DUNGEON_EVENT_LIST.filter(isDungeonEventAvailable);
  const totalWeight = eligibleEvents.reduce((total, event) => total + event.weight, 0);
  if (totalWeight <= 0) {
    return getDungeonEventDefinition("nothing")!;
  }

  let cursor = random() * totalWeight;

  for (const event of eligibleEvents) {
    cursor -= event.weight;
    if (cursor <= 0) {
      return event;
    }
  }

  return eligibleEvents[eligibleEvents.length - 1] ?? getDungeonEventDefinition("nothing")!;
}

function isDungeonEventAvailable(event: DungeonEventDefinition): boolean {
  return event.id !== "coin_flip" || state.carriedGold > 0;
}

function getGoldDelta(definition: DungeonEventDefinition, random: () => number): number {
  if (definition.randomGoldRange) {
    const { min, max } = definition.randomGoldRange;
    return Math.floor(random() * (max - min + 1)) + min;
  }

  return definition.goldDelta ?? 0;
}

function pickFinalDoorOutcome(totalFloors: number, roll: number): FinalDoorOutcomeId {
  const chances =
    totalFloors >= 25
      ? { escapeChance: 0.22, bruiseChance: 0.76 }
      : totalFloors >= 20
        ? { escapeChance: 0.4, bruiseChance: 0.86 }
        : { escapeChance: 0.68, bruiseChance: 0.92 };

  if (roll < chances.escapeChance) {
    return "escape";
  }

  if (roll < chances.bruiseChance) {
    return "bruise";
  }

  return "trap";
}

export function continueToNextFloor(): DungeonRunState {
  const currentFloor = state.currentFloor - 1;
  state = {
    ...state,
    currentFloor,
    floor: currentFloor,
    lastEvent: GAME_TEXTS.dungeon.initialLastEvent
  };
  addGrodorStat("etagesVisites");
  return getDungeonRunState();
}
