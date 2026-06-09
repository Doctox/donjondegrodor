import { ANIMATION_KEYS, IMAGE_ASSETS } from "./assetKeys";

export type GrodorPose = "idle" | "walk" | "attack" | "hurt" | "victory" | "death";
export type GrodorEquipmentId =
  | "too_long_cape"
  | "war_underwear"
  | "panic_sandals"
  | "almost_hero_medallion"
  | "tiny_helmet"
  | "ankle_ball"
  | "axe"
  | "sticky_gloves"
  | "emotional_pebble";

export type GrodorEquipmentDefinition = {
  id: GrodorEquipmentId;
  layerOrder: number;
  animations: Partial<Record<GrodorPose, string>>;
  animationDefinitions: Array<{
    key: string;
    frames: string[];
    frameRate: number;
    repeat: number;
  }>;
  fallbackTexture: string;
};

export const GRODOR_EQUIPMENT_DEFINITIONS = {
  too_long_cape: {
    id: "too_long_cape",
    layerOrder: 20,
    animations: {
      idle: ANIMATION_KEYS.grodorTooLongCapeIdle,
      walk: ANIMATION_KEYS.grodorTooLongCapeWalk,
      attack: ANIMATION_KEYS.grodorTooLongCapeAttack,
      hurt: ANIMATION_KEYS.grodorTooLongCapeHurt,
      victory: ANIMATION_KEYS.grodorTooLongCapeVictory,
      death: ANIMATION_KEYS.grodorTooLongCapeDeath
    },
    animationDefinitions: [
      {
        key: ANIMATION_KEYS.grodorTooLongCapeIdle,
        frames: [IMAGE_ASSETS.grodorTooLongCapeIdle.key],
        frameRate: 1,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorTooLongCapeWalk,
        frames: [
          IMAGE_ASSETS.grodorTooLongCapeWalk1.key,
          IMAGE_ASSETS.grodorTooLongCapeWalk2.key,
          IMAGE_ASSETS.grodorTooLongCapeWalk3.key,
          IMAGE_ASSETS.grodorTooLongCapeWalk4.key
        ],
        frameRate: 5,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorTooLongCapeAttack,
        frames: [
          IMAGE_ASSETS.grodorTooLongCapeAttack1.key,
          IMAGE_ASSETS.grodorTooLongCapeAttack2.key,
          IMAGE_ASSETS.grodorTooLongCapeAttack3.key
        ],
        frameRate: 6,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorTooLongCapeHurt,
        frames: [IMAGE_ASSETS.grodorTooLongCapeHurt.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorTooLongCapeDeath,
        frames: [IMAGE_ASSETS.grodorTooLongCapeDeath.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorTooLongCapeVictory,
        frames: [IMAGE_ASSETS.grodorTooLongCapeVictory.key],
        frameRate: 1,
        repeat: -1
      }
    ],
    fallbackTexture: IMAGE_ASSETS.grodorTooLongCapeIdle.key
  },
  war_underwear: {
    id: "war_underwear",
    layerOrder: 5,
    animations: {
      idle: ANIMATION_KEYS.grodorWarUnderwearIdle,
      walk: ANIMATION_KEYS.grodorWarUnderwearWalk,
      attack: ANIMATION_KEYS.grodorWarUnderwearAttack,
      hurt: ANIMATION_KEYS.grodorWarUnderwearHurt,
      victory: ANIMATION_KEYS.grodorWarUnderwearVictory,
      death: ANIMATION_KEYS.grodorWarUnderwearDeath
    },
    animationDefinitions: [
      {
        key: ANIMATION_KEYS.grodorWarUnderwearIdle,
        frames: [IMAGE_ASSETS.grodorWarUnderwearIdle.key],
        frameRate: 1,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorWarUnderwearWalk,
        frames: [
          IMAGE_ASSETS.grodorWarUnderwearWalk1.key,
          IMAGE_ASSETS.grodorWarUnderwearWalk2.key,
          IMAGE_ASSETS.grodorWarUnderwearWalk3.key,
          IMAGE_ASSETS.grodorWarUnderwearWalk4.key
        ],
        frameRate: 5,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorWarUnderwearAttack,
        frames: [
          IMAGE_ASSETS.grodorWarUnderwearAttack1.key,
          IMAGE_ASSETS.grodorWarUnderwearAttack2.key,
          IMAGE_ASSETS.grodorWarUnderwearAttack3.key
        ],
        frameRate: 6,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorWarUnderwearHurt,
        frames: [IMAGE_ASSETS.grodorWarUnderwearHurt.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorWarUnderwearDeath,
        frames: [IMAGE_ASSETS.grodorWarUnderwearDeath.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorWarUnderwearVictory,
        frames: [IMAGE_ASSETS.grodorWarUnderwearVictory.key],
        frameRate: 1,
        repeat: -1
      }
    ],
    fallbackTexture: IMAGE_ASSETS.grodorWarUnderwearIdle.key
  },
  panic_sandals: {
    id: "panic_sandals",
    layerOrder: 6,
    animations: {
      idle: ANIMATION_KEYS.grodorPanicSandalsIdle,
      walk: ANIMATION_KEYS.grodorPanicSandalsWalk,
      attack: ANIMATION_KEYS.grodorPanicSandalsAttack,
      hurt: ANIMATION_KEYS.grodorPanicSandalsHurt,
      victory: ANIMATION_KEYS.grodorPanicSandalsVictory,
      death: ANIMATION_KEYS.grodorPanicSandalsDeath
    },
    animationDefinitions: [
      {
        key: ANIMATION_KEYS.grodorPanicSandalsIdle,
        frames: [IMAGE_ASSETS.grodorPanicSandalsIdle.key],
        frameRate: 1,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorPanicSandalsWalk,
        frames: [
          IMAGE_ASSETS.grodorPanicSandalsWalk1.key,
          IMAGE_ASSETS.grodorPanicSandalsWalk2.key,
          IMAGE_ASSETS.grodorPanicSandalsWalk3.key,
          IMAGE_ASSETS.grodorPanicSandalsWalk4.key
        ],
        frameRate: 5,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorPanicSandalsAttack,
        frames: [
          IMAGE_ASSETS.grodorPanicSandalsAttack1.key,
          IMAGE_ASSETS.grodorPanicSandalsAttack2.key,
          IMAGE_ASSETS.grodorPanicSandalsAttack3.key
        ],
        frameRate: 6,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorPanicSandalsHurt,
        frames: [IMAGE_ASSETS.grodorPanicSandalsHurt.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorPanicSandalsDeath,
        frames: [IMAGE_ASSETS.grodorPanicSandalsDeath.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorPanicSandalsVictory,
        frames: [IMAGE_ASSETS.grodorPanicSandalsVictory.key],
        frameRate: 1,
        repeat: -1
      }
    ],
    fallbackTexture: IMAGE_ASSETS.grodorPanicSandalsIdle.key
  },
  almost_hero_medallion: {
    id: "almost_hero_medallion",
    layerOrder: 7,
    animations: {
      idle: ANIMATION_KEYS.grodorAlmostHeroMedallionIdle,
      walk: ANIMATION_KEYS.grodorAlmostHeroMedallionWalk,
      attack: ANIMATION_KEYS.grodorAlmostHeroMedallionAttack,
      hurt: ANIMATION_KEYS.grodorAlmostHeroMedallionHurt,
      victory: ANIMATION_KEYS.grodorAlmostHeroMedallionVictory,
      death: ANIMATION_KEYS.grodorAlmostHeroMedallionDeath
    },
    animationDefinitions: [
      {
        key: ANIMATION_KEYS.grodorAlmostHeroMedallionIdle,
        frames: [IMAGE_ASSETS.grodorAlmostHeroMedallionIdle.key],
        frameRate: 1,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorAlmostHeroMedallionWalk,
        frames: [
          IMAGE_ASSETS.grodorAlmostHeroMedallionWalk1.key,
          IMAGE_ASSETS.grodorAlmostHeroMedallionWalk2.key,
          IMAGE_ASSETS.grodorAlmostHeroMedallionWalk3.key,
          IMAGE_ASSETS.grodorAlmostHeroMedallionWalk4.key
        ],
        frameRate: 5,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorAlmostHeroMedallionAttack,
        frames: [
          IMAGE_ASSETS.grodorAlmostHeroMedallionAttack1.key,
          IMAGE_ASSETS.grodorAlmostHeroMedallionAttack2.key,
          IMAGE_ASSETS.grodorAlmostHeroMedallionAttack3.key
        ],
        frameRate: 6,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorAlmostHeroMedallionHurt,
        frames: [IMAGE_ASSETS.grodorAlmostHeroMedallionHurt.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorAlmostHeroMedallionDeath,
        frames: [IMAGE_ASSETS.grodorAlmostHeroMedallionDeath.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorAlmostHeroMedallionVictory,
        frames: [IMAGE_ASSETS.grodorAlmostHeroMedallionVictory.key],
        frameRate: 1,
        repeat: -1
      }
    ],
    fallbackTexture: IMAGE_ASSETS.grodorAlmostHeroMedallionIdle.key
  },
  tiny_helmet: {
    id: "tiny_helmet",
    layerOrder: 8,
    animations: {
      idle: ANIMATION_KEYS.grodorTinyHelmetIdle,
      walk: ANIMATION_KEYS.grodorTinyHelmetWalk,
      attack: ANIMATION_KEYS.grodorTinyHelmetAttack,
      hurt: ANIMATION_KEYS.grodorTinyHelmetHurt,
      victory: ANIMATION_KEYS.grodorTinyHelmetVictory,
      death: ANIMATION_KEYS.grodorTinyHelmetDeath
    },
    animationDefinitions: [
      {
        key: ANIMATION_KEYS.grodorTinyHelmetIdle,
        frames: [IMAGE_ASSETS.grodorTinyHelmetIdle.key],
        frameRate: 1,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorTinyHelmetWalk,
        frames: [
          IMAGE_ASSETS.grodorTinyHelmetWalk1.key,
          IMAGE_ASSETS.grodorTinyHelmetWalk2.key,
          IMAGE_ASSETS.grodorTinyHelmetWalk3.key,
          IMAGE_ASSETS.grodorTinyHelmetWalk4.key
        ],
        frameRate: 5,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorTinyHelmetAttack,
        frames: [
          IMAGE_ASSETS.grodorTinyHelmetAttack1.key,
          IMAGE_ASSETS.grodorTinyHelmetAttack2.key,
          IMAGE_ASSETS.grodorTinyHelmetAttack3.key
        ],
        frameRate: 6,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorTinyHelmetHurt,
        frames: [IMAGE_ASSETS.grodorTinyHelmetHurt.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorTinyHelmetDeath,
        frames: [IMAGE_ASSETS.grodorTinyHelmetDeath.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorTinyHelmetVictory,
        frames: [IMAGE_ASSETS.grodorTinyHelmetVictory.key],
        frameRate: 1,
        repeat: -1
      }
    ],
    fallbackTexture: IMAGE_ASSETS.grodorTinyHelmetIdle.key
  },
  ankle_ball: {
    id: "ankle_ball",
    layerOrder: 9,
    animations: {
      idle: ANIMATION_KEYS.grodorAnkleBallIdle,
      walk: ANIMATION_KEYS.grodorAnkleBallWalk,
      attack: ANIMATION_KEYS.grodorAnkleBallAttack,
      hurt: ANIMATION_KEYS.grodorAnkleBallHurt,
      victory: ANIMATION_KEYS.grodorAnkleBallVictory,
      death: ANIMATION_KEYS.grodorAnkleBallDeath
    },
    animationDefinitions: [
      {
        key: ANIMATION_KEYS.grodorAnkleBallIdle,
        frames: [IMAGE_ASSETS.grodorAnkleBallIdle.key],
        frameRate: 1,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorAnkleBallWalk,
        frames: [
          IMAGE_ASSETS.grodorAnkleBallWalk1.key,
          IMAGE_ASSETS.grodorAnkleBallWalk2.key,
          IMAGE_ASSETS.grodorAnkleBallWalk3.key,
          IMAGE_ASSETS.grodorAnkleBallWalk4.key
        ],
        frameRate: 5,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorAnkleBallAttack,
        frames: [
          IMAGE_ASSETS.grodorAnkleBallAttack1.key,
          IMAGE_ASSETS.grodorAnkleBallAttack2.key,
          IMAGE_ASSETS.grodorAnkleBallAttack3.key
        ],
        frameRate: 6,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorAnkleBallHurt,
        frames: [IMAGE_ASSETS.grodorAnkleBallHurt.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorAnkleBallDeath,
        frames: [IMAGE_ASSETS.grodorAnkleBallDeath.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorAnkleBallVictory,
        frames: [IMAGE_ASSETS.grodorAnkleBallVictory.key],
        frameRate: 1,
        repeat: -1
      }
    ],
    fallbackTexture: IMAGE_ASSETS.grodorAnkleBallIdle.key
  },
  axe: {
    id: "axe",
    layerOrder: 10,
    animations: {
      idle: ANIMATION_KEYS.grodorAxeIdle,
      walk: ANIMATION_KEYS.grodorAxeWalk,
      attack: ANIMATION_KEYS.grodorAxeAttack,
      hurt: ANIMATION_KEYS.grodorAxeHurt,
      victory: ANIMATION_KEYS.grodorAxeVictory,
      death: ANIMATION_KEYS.grodorAxeDeath
    },
    animationDefinitions: [
      {
        key: ANIMATION_KEYS.grodorAxeIdle,
        frames: [IMAGE_ASSETS.grodorAxeIdle.key],
        frameRate: 1,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorAxeWalk,
        frames: [
          IMAGE_ASSETS.grodorAxeWalk1.key,
          IMAGE_ASSETS.grodorAxeWalk2.key,
          IMAGE_ASSETS.grodorAxeWalk3.key,
          IMAGE_ASSETS.grodorAxeWalk4.key
        ],
        frameRate: 5,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorAxeAttack,
        frames: [IMAGE_ASSETS.grodorAxeAttack1.key, IMAGE_ASSETS.grodorAxeAttack2.key, IMAGE_ASSETS.grodorAxeAttack3.key],
        frameRate: 6,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorAxeHurt,
        frames: [IMAGE_ASSETS.grodorAxeHurt.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorAxeDeath,
        frames: [IMAGE_ASSETS.grodorAxeDeath.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorAxeVictory,
        frames: [IMAGE_ASSETS.grodorAxeVictory.key],
        frameRate: 1,
        repeat: -1
      }
    ],
    fallbackTexture: IMAGE_ASSETS.grodorAxeIdle.key
  },
  sticky_gloves: {
    id: "sticky_gloves",
    layerOrder: 11,
    animations: {
      idle: ANIMATION_KEYS.grodorStickyGlovesIdle,
      walk: ANIMATION_KEYS.grodorStickyGlovesWalk,
      attack: ANIMATION_KEYS.grodorStickyGlovesAttack,
      hurt: ANIMATION_KEYS.grodorStickyGlovesHurt,
      victory: ANIMATION_KEYS.grodorStickyGlovesVictory,
      death: ANIMATION_KEYS.grodorStickyGlovesDeath
    },
    animationDefinitions: [
      {
        key: ANIMATION_KEYS.grodorStickyGlovesIdle,
        frames: [IMAGE_ASSETS.grodorStickyGlovesIdle.key],
        frameRate: 1,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorStickyGlovesWalk,
        frames: [
          IMAGE_ASSETS.grodorStickyGlovesWalk1.key,
          IMAGE_ASSETS.grodorStickyGlovesWalk2.key,
          IMAGE_ASSETS.grodorStickyGlovesWalk3.key,
          IMAGE_ASSETS.grodorStickyGlovesWalk4.key
        ],
        frameRate: 5,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorStickyGlovesAttack,
        frames: [
          IMAGE_ASSETS.grodorStickyGlovesAttack1.key,
          IMAGE_ASSETS.grodorStickyGlovesAttack2.key,
          IMAGE_ASSETS.grodorStickyGlovesAttack3.key
        ],
        frameRate: 6,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorStickyGlovesHurt,
        frames: [IMAGE_ASSETS.grodorStickyGlovesHurt.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorStickyGlovesDeath,
        frames: [IMAGE_ASSETS.grodorStickyGlovesDeath.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorStickyGlovesVictory,
        frames: [IMAGE_ASSETS.grodorStickyGlovesVictory.key],
        frameRate: 1,
        repeat: -1
      }
    ],
    fallbackTexture: IMAGE_ASSETS.grodorStickyGlovesIdle.key
  },
  emotional_pebble: {
    id: "emotional_pebble",
    layerOrder: 12,
    animations: {
      idle: ANIMATION_KEYS.grodorEmotionalPebbleIdle,
      walk: ANIMATION_KEYS.grodorEmotionalPebbleWalk,
      attack: ANIMATION_KEYS.grodorEmotionalPebbleAttack,
      hurt: ANIMATION_KEYS.grodorEmotionalPebbleHurt,
      victory: ANIMATION_KEYS.grodorEmotionalPebbleVictory,
      death: ANIMATION_KEYS.grodorEmotionalPebbleDeath
    },
    animationDefinitions: [
      {
        key: ANIMATION_KEYS.grodorEmotionalPebbleIdle,
        frames: [IMAGE_ASSETS.grodorEmotionalPebbleIdle.key],
        frameRate: 1,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorEmotionalPebbleWalk,
        frames: [
          IMAGE_ASSETS.grodorEmotionalPebbleWalk1.key,
          IMAGE_ASSETS.grodorEmotionalPebbleWalk2.key,
          IMAGE_ASSETS.grodorEmotionalPebbleWalk3.key,
          IMAGE_ASSETS.grodorEmotionalPebbleWalk4.key
        ],
        frameRate: 5,
        repeat: -1
      },
      {
        key: ANIMATION_KEYS.grodorEmotionalPebbleAttack,
        frames: [
          IMAGE_ASSETS.grodorEmotionalPebbleAttack1.key,
          IMAGE_ASSETS.grodorEmotionalPebbleAttack2.key,
          IMAGE_ASSETS.grodorEmotionalPebbleAttack3.key
        ],
        frameRate: 6,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorEmotionalPebbleHurt,
        frames: [IMAGE_ASSETS.grodorEmotionalPebbleHurt.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorEmotionalPebbleDeath,
        frames: [IMAGE_ASSETS.grodorEmotionalPebbleDeath.key],
        frameRate: 1,
        repeat: 0
      },
      {
        key: ANIMATION_KEYS.grodorEmotionalPebbleVictory,
        frames: [IMAGE_ASSETS.grodorEmotionalPebbleVictory.key],
        frameRate: 1,
        repeat: -1
      }
    ],
    fallbackTexture: IMAGE_ASSETS.grodorEmotionalPebbleIdle.key
  }
} satisfies Record<GrodorEquipmentId, GrodorEquipmentDefinition>;

export const GRODOR_EQUIPMENT_LIST = Object.values(GRODOR_EQUIPMENT_DEFINITIONS);

export function getGrodorEquipmentDefinition(id: string): GrodorEquipmentDefinition | undefined {
  return GRODOR_EQUIPMENT_DEFINITIONS[id as GrodorEquipmentId];
}

export function isGrodorEquipmentId(id: string): id is GrodorEquipmentId {
  return id in GRODOR_EQUIPMENT_DEFINITIONS;
}
