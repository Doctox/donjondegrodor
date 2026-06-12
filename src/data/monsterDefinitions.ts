import { IMAGE_ASSETS } from "./assetKeys";
import { GAME_TEXTS } from "./gameTexts";

export type MonsterId = "rat" | "skeleton" | "guard";
export type MonsterHitZone = "head" | "body" | "legs";

export type MonsterHitZoneDefinition = {
  zone: MonsterHitZone;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MonsterDefinition = {
  id: MonsterId;
  name: string;
  maxLife: number;
  baseGoldReward: number;
  idleTextureKey: string;
  hurtTextureKey: string;
  koTextureKey: string;
  scale: number;
  spriteHeight: number;
  heartOffsetY: number;
  hitZones: MonsterHitZoneDefinition[];
};

export const MONSTER_DEFINITIONS = {
  rat: {
    id: "rat",
    name: GAME_TEXTS.monsters.rat,
    maxLife: 1,
    baseGoldReward: 1,
    idleTextureKey: IMAGE_ASSETS.ratIdle.key,
    hurtTextureKey: IMAGE_ASSETS.ratHurt.key,
    koTextureKey: IMAGE_ASSETS.ratKo.key,
    scale: 0.34,
    spriteHeight: 996,
    heartOffsetY: 34,
    hitZones: [
      { zone: "head", x: 0, y: -760, width: 520, height: 300 },
      { zone: "body", x: 0, y: -440, width: 580, height: 360 },
      { zone: "legs", x: 0, y: -135, width: 600, height: 270 }
    ]
  },
  skeleton: {
    id: "skeleton",
    name: GAME_TEXTS.monsters.skeleton,
    maxLife: 2,
    baseGoldReward: 2,
    idleTextureKey: IMAGE_ASSETS.skeletonIdle.key,
    hurtTextureKey: IMAGE_ASSETS.skeletonHurt.key,
    koTextureKey: IMAGE_ASSETS.skeletonKo.key,
    scale: 0.38,
    spriteHeight: 1090,
    heartOffsetY: 36,
    hitZones: [
      { zone: "head", x: 0, y: -850, width: 430, height: 260 },
      { zone: "body", x: 0, y: -520, width: 500, height: 380 },
      { zone: "legs", x: 0, y: -180, width: 500, height: 320 }
    ]
  },
  guard: {
    id: "guard",
    name: GAME_TEXTS.monsters.guard,
    maxLife: 3,
    baseGoldReward: 3,
    idleTextureKey: IMAGE_ASSETS.guardIdle.key,
    hurtTextureKey: IMAGE_ASSETS.guardHurt.key,
    koTextureKey: IMAGE_ASSETS.guardKo.key,
    scale: 0.43,
    spriteHeight: 934,
    heartOffsetY: 38,
    hitZones: [
      { zone: "head", x: 0, y: -735, width: 380, height: 230 },
      { zone: "body", x: 0, y: -455, width: 450, height: 330 },
      { zone: "legs", x: 0, y: -160, width: 460, height: 280 }
    ]
  }
} satisfies Record<MonsterId, MonsterDefinition>;

export const MONSTER_LIST = Object.values(MONSTER_DEFINITIONS);

export function getMonsterDefinition(id: MonsterId): MonsterDefinition {
  return MONSTER_DEFINITIONS[id];
}

export function isMonsterId(id: string): id is MonsterId {
  return id in MONSTER_DEFINITIONS;
}
