const PERMANENT_UPGRADES_STORAGE_KEY = "grodor_permanent_upgrades";

export type DressingLevel = 0 | 1 | 2 | 3;
export type CowardReflexLevel = 0 | 1 | 2 | 3;
export type TragicCardioLevel = 0 | 1 | 2 | 3;
export type DoorReadingLevel = 0 | 1 | 2 | 3;
export type PermanentUpgradeId = "dressing" | "cowardReflex" | "tragicCardio" | "doorReading";

export type PermanentUpgrades = {
  dressingLevel: DressingLevel;
  cowardReflexLevel: CowardReflexLevel;
  tragicCardioLevel: TragicCardioLevel;
  doorReadingLevel: DoorReadingLevel;
};

export type DressingUpgradePurchaseResult = {
  ok: boolean;
  reason?: "max_level";
  upgrades: PermanentUpgrades;
  cost?: number;
};

const DEFAULT_PERMANENT_UPGRADES: PermanentUpgrades = {
  dressingLevel: 0,
  cowardReflexLevel: 0,
  tragicCardioLevel: 0,
  doorReadingLevel: 0
};

const DRESSING_UPGRADE_COSTS: Record<Exclude<DressingLevel, 0>, number> = {
  1: 80,
  2: 180,
  3: 350
};

const COWARD_REFLEX_UPGRADE_COSTS: Record<Exclude<CowardReflexLevel, 0>, number> = {
  1: 40,
  2: 100,
  3: 220
};

const COWARD_REFLEX_CHANCES: Record<CowardReflexLevel, number> = {
  0: 0,
  1: 0.05,
  2: 0.15,
  3: 0.25
};

const TRAGIC_CARDIO_UPGRADE_COSTS: Record<Exclude<TragicCardioLevel, 0>, number> = {
  1: 30,
  2: 80,
  3: 160
};

const TRAGIC_CARDIO_CHANCES: Record<TragicCardioLevel, number> = {
  0: 0,
  1: 0.25,
  2: 0.5,
  3: 0.8
};

const DOOR_READING_UPGRADE_COSTS: Record<Exclude<DoorReadingLevel, 0>, number> = {
  1: 70,
  2: 140,
  3: 250
};

const DOOR_READING_CHANCES: Record<DoorReadingLevel, number> = {
  0: 0,
  1: 0.1,
  2: 0.25,
  3: 0.4
};

let permanentUpgrades = loadPermanentUpgrades();

export function getPermanentUpgrades(): PermanentUpgrades {
  return { ...permanentUpgrades };
}

export function getDressingLevel(): DressingLevel {
  return permanentUpgrades.dressingLevel;
}

export function getCowardReflexLevel(): CowardReflexLevel {
  return permanentUpgrades.cowardReflexLevel;
}

export function getTragicCardioLevel(): TragicCardioLevel {
  return permanentUpgrades.tragicCardioLevel;
}

export function getDoorReadingLevel(): DoorReadingLevel {
  return permanentUpgrades.doorReadingLevel;
}

export function getCowardReflexCancelChance(): number {
  return COWARD_REFLEX_CHANCES[getCowardReflexLevel()];
}

export function getCowardReflexCancelPercent(): number {
  return Math.round(getCowardReflexCancelChance() * 100);
}

export function getTragicCardioChance(): number {
  return TRAGIC_CARDIO_CHANCES[getTragicCardioLevel()];
}

export function getTragicCardioPercent(): number {
  return Math.round(getTragicCardioChance() * 100);
}

export function getDoorReadingChance(): number {
  return DOOR_READING_CHANCES[getDoorReadingLevel()];
}

export function getDoorReadingPercent(): number {
  return Math.round(getDoorReadingChance() * 100);
}

export function getMaxStartingEquipmentCount(): number {
  return 1 + getDressingLevel();
}

export function getNextDressingUpgradeCost(): number | undefined {
  const nextLevel = (getDressingLevel() + 1) as DressingLevel;
  if (!isDressingUpgradeLevel(nextLevel)) {
    return undefined;
  }

  return DRESSING_UPGRADE_COSTS[nextLevel];
}

export function getNextCowardReflexUpgradeCost(): number | undefined {
  const nextLevel = (getCowardReflexLevel() + 1) as CowardReflexLevel;
  if (!isCowardReflexUpgradeLevel(nextLevel)) {
    return undefined;
  }

  return COWARD_REFLEX_UPGRADE_COSTS[nextLevel];
}

export function getNextTragicCardioUpgradeCost(): number | undefined {
  const nextLevel = (getTragicCardioLevel() + 1) as TragicCardioLevel;
  if (!isTragicCardioUpgradeLevel(nextLevel)) {
    return undefined;
  }

  return TRAGIC_CARDIO_UPGRADE_COSTS[nextLevel];
}

export function getNextDoorReadingUpgradeCost(): number | undefined {
  const nextLevel = (getDoorReadingLevel() + 1) as DoorReadingLevel;
  if (!isDoorReadingUpgradeLevel(nextLevel)) {
    return undefined;
  }

  return DOOR_READING_UPGRADE_COSTS[nextLevel];
}

export function buyDressingUpgrade(): DressingUpgradePurchaseResult {
  const cost = getNextDressingUpgradeCost();
  if (cost === undefined) {
    return {
      ok: false,
      reason: "max_level",
      upgrades: getPermanentUpgrades()
    };
  }

  permanentUpgrades = {
    ...permanentUpgrades,
    dressingLevel: (permanentUpgrades.dressingLevel + 1) as DressingLevel
  };
  savePermanentUpgrades(permanentUpgrades);

  return {
    ok: true,
    upgrades: getPermanentUpgrades(),
    cost
  };
}

export function buyCowardReflexUpgrade(): DressingUpgradePurchaseResult {
  const cost = getNextCowardReflexUpgradeCost();
  if (cost === undefined) {
    return {
      ok: false,
      reason: "max_level",
      upgrades: getPermanentUpgrades()
    };
  }

  permanentUpgrades = {
    ...permanentUpgrades,
    cowardReflexLevel: (permanentUpgrades.cowardReflexLevel + 1) as CowardReflexLevel
  };
  savePermanentUpgrades(permanentUpgrades);

  return {
    ok: true,
    upgrades: getPermanentUpgrades(),
    cost
  };
}

export function buyTragicCardioUpgrade(): DressingUpgradePurchaseResult {
  const cost = getNextTragicCardioUpgradeCost();
  if (cost === undefined) {
    return {
      ok: false,
      reason: "max_level",
      upgrades: getPermanentUpgrades()
    };
  }

  permanentUpgrades = {
    ...permanentUpgrades,
    tragicCardioLevel: (permanentUpgrades.tragicCardioLevel + 1) as TragicCardioLevel
  };
  savePermanentUpgrades(permanentUpgrades);

  return {
    ok: true,
    upgrades: getPermanentUpgrades(),
    cost
  };
}

export function buyDoorReadingUpgrade(): DressingUpgradePurchaseResult {
  const cost = getNextDoorReadingUpgradeCost();
  if (cost === undefined) {
    return {
      ok: false,
      reason: "max_level",
      upgrades: getPermanentUpgrades()
    };
  }

  permanentUpgrades = {
    ...permanentUpgrades,
    doorReadingLevel: (permanentUpgrades.doorReadingLevel + 1) as DoorReadingLevel
  };
  savePermanentUpgrades(permanentUpgrades);

  return {
    ok: true,
    upgrades: getPermanentUpgrades(),
    cost
  };
}

export function shouldCowardReflexCancelDamage(random: () => number = Math.random): boolean {
  const chance = getCowardReflexCancelChance();
  return chance > 0 && random() < chance;
}

export function shouldTragicCardioIncreaseMaxLife(random: () => number = Math.random): boolean {
  const chance = getTragicCardioChance();
  return chance > 0 && random() < chance;
}

export function shouldRevealDoorReadingHint(random: () => number = Math.random): boolean {
  const chance = getDoorReadingChance();
  return chance > 0 && random() < chance;
}

export function resetPermanentUpgradesDebug(): PermanentUpgrades {
  permanentUpgrades = { ...DEFAULT_PERMANENT_UPGRADES };
  savePermanentUpgrades(permanentUpgrades);
  return getPermanentUpgrades();
}

function loadPermanentUpgrades(): PermanentUpgrades {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return DEFAULT_PERMANENT_UPGRADES;
    }

    const rawValue = window.localStorage.getItem(PERMANENT_UPGRADES_STORAGE_KEY);
    if (!rawValue) {
      return DEFAULT_PERMANENT_UPGRADES;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      savePermanentUpgrades(DEFAULT_PERMANENT_UPGRADES);
      return DEFAULT_PERMANENT_UPGRADES;
    }

    const loadedUpgrades = sanitizePermanentUpgrades(parsedValue as Record<string, unknown>);
    savePermanentUpgrades(loadedUpgrades);
    return loadedUpgrades;
  } catch {
    return DEFAULT_PERMANENT_UPGRADES;
  }
}

function savePermanentUpgrades(upgrades: PermanentUpgrades): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(PERMANENT_UPGRADES_STORAGE_KEY, JSON.stringify(sanitizePermanentUpgrades(upgrades)));
  } catch {
    // localStorage can be blocked; keep the in-memory upgrades for this session.
  }
}

function sanitizePermanentUpgrades(value: Record<string, unknown>): PermanentUpgrades {
  return {
    dressingLevel: sanitizeDressingLevel(value.dressingLevel),
    cowardReflexLevel: sanitizeCowardReflexLevel(value.cowardReflexLevel),
    tragicCardioLevel: sanitizeTragicCardioLevel(value.tragicCardioLevel),
    doorReadingLevel: sanitizeDoorReadingLevel(value.doorReadingLevel)
  };
}

function sanitizeDressingLevel(value: unknown): DressingLevel {
  const level = Math.trunc(Number(value));
  if (level <= 0) {
    return 0;
  }
  if (level >= 3) {
    return 3;
  }
  return level as DressingLevel;
}

function isDressingUpgradeLevel(level: DressingLevel): level is Exclude<DressingLevel, 0> {
  return level > 0 && level <= 3;
}

function sanitizeCowardReflexLevel(value: unknown): CowardReflexLevel {
  const level = Math.trunc(Number(value));
  if (level <= 0) {
    return 0;
  }
  if (level >= 3) {
    return 3;
  }
  return level as CowardReflexLevel;
}

function isCowardReflexUpgradeLevel(level: CowardReflexLevel): level is Exclude<CowardReflexLevel, 0> {
  return level > 0 && level <= 3;
}

function sanitizeTragicCardioLevel(value: unknown): TragicCardioLevel {
  const level = Math.trunc(Number(value));
  if (level <= 0) {
    return 0;
  }
  if (level >= 3) {
    return 3;
  }
  return level as TragicCardioLevel;
}

function isTragicCardioUpgradeLevel(level: TragicCardioLevel): level is Exclude<TragicCardioLevel, 0> {
  return level > 0 && level <= 3;
}

function sanitizeDoorReadingLevel(value: unknown): DoorReadingLevel {
  const level = Math.trunc(Number(value));
  if (level <= 0) {
    return 0;
  }
  if (level >= 3) {
    return 3;
  }
  return level as DoorReadingLevel;
}

function isDoorReadingUpgradeLevel(level: DoorReadingLevel): level is Exclude<DoorReadingLevel, 0> {
  return level > 0 && level <= 3;
}
