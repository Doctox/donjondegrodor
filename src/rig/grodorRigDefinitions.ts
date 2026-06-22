import { AUTO_FRONT_STUFF_LAYERS, AUTO_SIDE_STUFF_LAYERS } from "../generated/rigAutoStuffs";
import type { GrodorRigLayerDefinition } from "./grodorRig";

export const FRONT_RIG_PATH = "/assets/sprites/grodor/rig/front_master";
export const SIDE_RIG_PATH = "/assets/sprites/grodor/rig/side_walk_master";

export const FRONT_RIG_STORAGE_KEY = "grodor-rig-debug-front-master-v1";
export const SIDE_RIG_STORAGE_KEY = "grodor-rig-debug-side-walk-master-v2";
export const HURT_RIG_STORAGE_KEY = "grodor-rig-debug-side-hurt-master-v2";
export const ATTACK_ONE_RIG_STORAGE_KEY = "grodor-rig-debug-side-attack-1-master-v5";
export const VICTORY_RIG_STORAGE_KEY = "grodor-rig-debug-front-victory-v1";
export const FRONT_RIG_PROJECT_SAVE_PATH = "/assets/sprites/grodor/rig/front_master/saves/rig_idle_jm_anchor_save.json";
export const SIDE_RIG_PROJECT_SAVE_PATH = "/assets/sprites/grodor/rig/side_walk_master/saves/rig_walk_jm_anchor_save.json";
export const HURT_RIG_PROJECT_SAVE_PATH = "/assets/sprites/grodor/rig/side_walk_master/saves/rig_hurt_jm_save.json";
export const ATTACK_ONE_RIG_PROJECT_SAVE_PATH = "/assets/sprites/grodor/rig/side_walk_master/saves/rig_attack_1_jm_save.json";
export const VICTORY_RIG_PROJECT_SAVE_PATH = "/assets/sprites/grodor/rig/front_master/saves/rig_victory_jm_save.json";

export const RIG_CANVAS_WIDTH = 522;
export const RIG_CANVAS_HEIGHT = 767;
export const RIG_AUTHORING_SCALE = 0.82;
export const WALK_POSE_COUNT = 5;
export const WALK_FRAME_SEQUENCE = [0, 1, 2, 3, 4, 3, 2, 1] as const;
export const VICTORY_FRAME_SEQUENCE = [0, 1, 2, 3] as const;
export const ATTACK_ONE_FRAME_SEQUENCE = [0, 1, 2, 3] as const;

export const FRONT_RIG_LAYERS: GrodorRigLayerDefinition[] = [
  { id: "foot_left", label: "Pied gauche", file: "front_foot_left.png" },
  { id: "foot_right", label: "Pied droit", file: "front_foot_right.png" },
  { id: "leg_right", label: "Jambe droite", file: "front_leg_right.png" },
  { id: "leg_left", label: "Jambe gauche", file: "front_leg_left.png" },
  { id: "pelvis", label: "Bas du corps", file: "front_pelvis.png" },
  { id: "front_belt", label: "Raccord ventre", file: "front_belt.png" },
  {
    id: "belt_test",
    label: "Ceinture test",
    kind: "stuff",
    file: "stuff/ceinture_test.png",
    canvas: { width: 383, height: 240 },
    pivot: { x: 191.5, y: 120 },
    basePosition: { x: 0, y: -270 },
    baseScale: 0.996,
    baseScaleY: 0.594
  },
  { id: "torso", label: "Haut du corps", file: "front_torso.png" },
  { id: "belly", label: "Ventre", file: "front_belly.png" },
  { id: "arm_right", label: "Bras droit", file: "front_arm_right.png" },
  {
    id: "glove_right",
    label: "Gant droit",
    kind: "stuff",
    file: "stuff/test_glove_right.png",
    canvas: { width: 109, height: 159 },
    pivot: { x: 54.5, y: 55 },
    basePosition: { x: -154, y: -218 },
    baseScale: 0.72
  },
  { id: "arm_left", label: "Bras gauche", file: "front_arm_left.png" },
  {
    id: "glove_left",
    label: "Gant gauche",
    kind: "stuff",
    file: "stuff/test_glove_left.png",
    canvas: { width: 109, height: 159 },
    pivot: { x: 54.5, y: 55 },
    basePosition: { x: 154, y: -218 },
    baseScale: 0.72
  },
  { id: "cape_back", label: "Cape dos", kind: "stuff", file: "stuff/cape_trop_longue_face_bas.png" },
  { id: "cape_collar", label: "Col cape", kind: "stuff", file: "stuff/cape_trop_longue_face_haut.png" },
  { id: "head", label: "Tete", file: "front_head.png" },
  ...AUTO_FRONT_STUFF_LAYERS
];

export const VICTORY_FACE_LAYER_IDS = ["victory_smile_1", "victory_smile_2", "victory_smile_3"] as const;

export const VICTORY_RIG_LAYERS: GrodorRigLayerDefinition[] = [
  ...FRONT_RIG_LAYERS,
  {
    id: "victory_smile_1",
    label: "Sourire 1",
    file: "victory/grodor_front_master_sourire1.png",
    canvas: { width: RIG_CANVAS_WIDTH, height: RIG_CANVAS_HEIGHT },
    pivot: { x: 0, y: 0 },
    basePosition: { x: -RIG_CANVAS_WIDTH / 2, y: -RIG_CANVAS_HEIGHT }
  },
  {
    id: "victory_smile_2",
    label: "Sourire 2",
    file: "victory/grodor_front_master_sourire2.png",
    canvas: { width: RIG_CANVAS_WIDTH, height: RIG_CANVAS_HEIGHT },
    pivot: { x: 0, y: 0 },
    basePosition: { x: -RIG_CANVAS_WIDTH / 2, y: -RIG_CANVAS_HEIGHT }
  },
  {
    id: "victory_smile_3",
    label: "Sourire 3",
    file: "victory/grodor_front_master_sourire3.png",
    canvas: { width: RIG_CANVAS_WIDTH, height: RIG_CANVAS_HEIGHT },
    pivot: { x: 0, y: 0 },
    basePosition: { x: -RIG_CANVAS_WIDTH / 2, y: -RIG_CANVAS_HEIGHT }
  }
];

export const SIDE_RIG_LAYERS: GrodorRigLayerDefinition[] = [
  { id: "cape_side", label: "Cape cote", kind: "stuff", file: "stuff/cape_trop_longue_profil_bas.png" },
  { id: "cape_side_collar", label: "Col cape cote", kind: "stuff", file: "stuff/cape_trop_longue_profil_haut.png" },
  { id: "underwear", label: "Slip", file: "side_underwear.png" },
  { id: "leg_back", label: "Jambe arriere", file: "side_leg_back.png" },
  {
    id: "shoe_back",
    label: "Chauss. arriere",
    kind: "stuff",
    file: "stuff/test_shoe_back.png",
    canvas: { width: 498, height: 646 },
    pivot: { x: 250, y: 590 },
    basePosition: { x: -176, y: -78 },
    baseScale: 0.18
  },
  { id: "leg_front", label: "Jambe avant", file: "side_leg_front.png" },
  {
    id: "shoe_front",
    label: "Chauss. avant",
    kind: "stuff",
    file: "stuff/test_shoe_front.png",
    canvas: { width: 498, height: 646 },
    pivot: { x: 250, y: 590 },
    basePosition: { x: 172, y: -78 },
    baseScale: 0.18
  },
  { id: "belly", label: "Ventre", file: "side_belly.png" },
  { id: "torso", label: "Torse", file: "side_torso.png" },
  { id: "arm_back_upper", label: "Epaule arriere", file: "side_arm_back_upper.png" },
  { id: "arm_back_forearm", label: "Av-bras arriere", file: "side_arm_back_forearm.png" },
  { id: "hand_back", label: "Main arriere", file: "side_hand_back.png" },
  {
    id: "glove_back",
    label: "Gant arriere",
    kind: "stuff",
    file: "stuff/test_glove_back.png",
    canvas: { width: 168, height: 109 },
    pivot: { x: 28, y: 54 },
    basePosition: { x: -190, y: -452 },
    baseScale: 0.62
  },
  { id: "head", label: "Tete", file: "side_head.png" },
  { id: "arm_front_upper", label: "Epaule avant", file: "side_arm_front_upper.png" },
  { id: "arm_front_forearm", label: "Av-bras avant", file: "side_arm_front_forearm.png" },
  { id: "hand_front", label: "Main avant", file: "side_hand_front.png" },
  {
    id: "glove_front",
    label: "Gant avant",
    kind: "stuff",
    file: "stuff/test_glove_front.png",
    canvas: { width: 168, height: 109 },
    pivot: { x: 140, y: 54 },
    basePosition: { x: 230, y: -452 },
    baseScale: 0.62
  },
  ...AUTO_SIDE_STUFF_LAYERS
];

export const ATTACK_ONE_RIG_LAYERS: GrodorRigLayerDefinition[] = [
  { id: "cape_side", label: "Cape cote", kind: "stuff", file: "stuff/cape_trop_longue_profil_bas.png" },
  { id: "cape_side_collar", label: "Col cape cote", kind: "stuff", file: "stuff/cape_trop_longue_profil_haut.png" },
  { id: "underwear", label: "Slip", file: "side_underwear.png" },
  { id: "leg_back", label: "Jambe arriere", file: "side_leg_back.png" },
  {
    id: "shoe_back",
    label: "Chauss. arriere",
    kind: "stuff",
    file: "stuff/test_shoe_back.png",
    canvas: { width: 498, height: 646 },
    pivot: { x: 250, y: 590 },
    basePosition: { x: -176, y: -78 },
    baseScale: 0.18
  },
  { id: "leg_front", label: "Jambe avant", file: "side_leg_front.png" },
  {
    id: "shoe_front",
    label: "Chauss. avant",
    kind: "stuff",
    file: "stuff/test_shoe_front.png",
    canvas: { width: 498, height: 646 },
    pivot: { x: 250, y: 590 },
    basePosition: { x: 172, y: -78 },
    baseScale: 0.18
  },
  { id: "belly", label: "Ventre", file: "side_belly.png" },
  { id: "torso", label: "Torse", file: "side_torso.png" },
  {
    id: "hand_back",
    label: "Bras arriere attack",
    file: "attack/attack_arm_back.png",
    canvas: { width: 181, height: 149 },
    pivot: { x: 38, y: 42 },
    basePosition: { x: -58, y: -492 },
    baseScale: 1
  },
  {
    id: "glove_back",
    label: "Gant arriere",
    kind: "stuff",
    file: "stuff/test_glove_back.png",
    canvas: { width: 168, height: 109 },
    pivot: { x: 28, y: 54 },
    basePosition: { x: -190, y: -452 },
    baseScale: 0.62
  },
  { id: "head", label: "Tete", file: "side_head.png" },
  {
    id: "attack_front_shoulder_over",
    label: "Attack epaule avant",
    file: "attack/epaule_front_arm_attack.png",
    canvas: { width: 219, height: 165 },
    pivot: { x: 38, y: 42 },
    basePosition: { x: 106, y: -492 },
    baseScale: 1
  },
  {
    id: "attack_front_forearm_over",
    label: "Attack av-bras avant",
    file: "attack/avantbras_front_arm_attack.png",
    canvas: { width: 219, height: 165 },
    pivot: { x: 38, y: 42 },
    basePosition: { x: 106, y: -492 },
    baseScale: 1
  },
  {
    id: "attack_front_hand_over",
    label: "Attack main avant",
    file: "attack/main_front_arm_attack.png",
    canvas: { width: 219, height: 165 },
    pivot: { x: 38, y: 42 },
    basePosition: { x: 106, y: -492 },
    baseScale: 1
  },
  {
    id: "attack_front_arm",
    label: "Bras avant attack complet",
    file: "attack/bras_front_arm_attack.png",
    canvas: { width: 285, height: 141 },
    pivot: { x: 38, y: 42 },
    basePosition: { x: 106, y: -492 },
    baseScale: 1
  },
  {
    id: "glove_front",
    label: "Gant avant",
    kind: "stuff",
    file: "stuff/test_glove_front.png",
    canvas: { width: 168, height: 109 },
    pivot: { x: 140, y: 54 },
    basePosition: { x: 230, y: -452 },
    baseScale: 0.62
  },
  ...AUTO_SIDE_STUFF_LAYERS
];

export const HURT_RIG_LAYERS: GrodorRigLayerDefinition[] = [
  { id: "cape_side", label: "Cape cote", kind: "stuff", file: "stuff/cape_trop_longue_profil_bas.png" },
  { id: "cape_side_collar", label: "Col cape cote", kind: "stuff", file: "stuff/cape_trop_longue_profil_haut.png" },
  { id: "underwear", label: "Slip", file: "side_underwear.png" },
  { id: "leg_back", label: "Jambe arriere", file: "side_leg_back.png" },
  {
    id: "shoe_back",
    label: "Chauss. arriere",
    kind: "stuff",
    file: "stuff/test_shoe_back.png",
    canvas: { width: 498, height: 646 },
    pivot: { x: 250, y: 590 },
    basePosition: { x: -176, y: -78 },
    baseScale: 0.18
  },
  { id: "leg_front", label: "Jambe avant", file: "side_leg_front.png" },
  {
    id: "shoe_front",
    label: "Chauss. avant",
    kind: "stuff",
    file: "stuff/test_shoe_front.png",
    canvas: { width: 498, height: 646 },
    pivot: { x: 250, y: 590 },
    basePosition: { x: 172, y: -78 },
    baseScale: 0.18
  },
  { id: "belly", label: "Ventre", file: "side_belly.png" },
  { id: "torso", label: "Torse", file: "side_torso.png" },
  { id: "hurt_arm_back_upper", label: "Epaule arriere hurt", file: "hurt/side_arm_back_upper_hurt.png" },
  { id: "hurt_arm_back_forearm", label: "Av-bras arr. hurt", file: "hurt/side_arm_back_forearm_hurt.png" },
  { id: "hurt_hand_back", label: "Main arriere hurt", file: "hurt/side_hand_back_hurt.png" },
  {
    id: "glove_back",
    label: "Gant arriere",
    kind: "stuff",
    file: "stuff/test_glove_back.png",
    canvas: { width: 168, height: 109 },
    pivot: { x: 28, y: 54 },
    basePosition: { x: -190, y: -452 },
    baseScale: 0.62
  },
  { id: "head", label: "Tete", file: "side_head.png" },
  { id: "hurt_head", label: "Tete hurt", file: "hurt/side_head_hurt.png" },
  { id: "hurt_arm_front_upper", label: "Epaule avant hurt", file: "hurt/side_arm_front_upper_hurt.png" },
  { id: "hurt_arm_front_forearm", label: "Av-bras av. hurt", file: "hurt/side_arm_front_forearm_hurt.png" },
  { id: "hurt_hand_front", label: "Main avant hurt", file: "hurt/side_hand_front_hurt.png" },
  {
    id: "glove_front",
    label: "Gant avant",
    kind: "stuff",
    file: "stuff/test_glove_back.png",
    canvas: { width: 168, height: 109 },
    pivot: { x: 28, y: 54 },
    basePosition: { x: 230, y: -452 },
    baseScale: 0.62
  },
  {
    id: "hurt_emote",
    label: "Emote hurt",
    file: "hurt/hurt_emote_orbit_base.png",
    canvas: { width: 220, height: 135 },
    pivot: { x: 110, y: 118 },
    basePosition: { x: 52, y: -642 },
    baseScale: 0.72
  },
  {
    id: "hurt_emote_star_big",
    label: "Emote grande etoile",
    file: "hurt/hurt_emote_star_big.png",
    canvas: { width: 76, height: 73 },
    pivot: { x: 38, y: 36.5 },
    basePosition: { x: 18, y: -644 },
    baseScale: 0.72
  },
  {
    id: "hurt_emote_star_small",
    label: "Emote petite etoile",
    file: "hurt/hurt_emote_star_small.png",
    canvas: { width: 62, height: 56 },
    pivot: { x: 31, y: 28 },
    basePosition: { x: 84, y: -722 },
    baseScale: 0.72
  },
  {
    id: "hurt_emote_star_mid",
    label: "Emote etoile moyenne",
    file: "hurt/hurt_emote_star_small.png",
    canvas: { width: 62, height: 56 },
    pivot: { x: 31, y: 28 },
    basePosition: { x: 110, y: -658 },
    baseScale: 0.52
  },
  ...AUTO_SIDE_STUFF_LAYERS
];

export const FRONT_RIG_PIVOTS = {
  foot_left: { x: 365, y: 738 },
  foot_right: { x: 160, y: 738 },
  leg_left: { x: 352, y: 545 },
  leg_right: { x: 170, y: 545 },
  pelvis: { x: 261, y: 520 },
  front_belt: { x: 261, y: 506 },
  torso: { x: 261, y: 330 },
  arm_left: { x: 382, y: 260 },
  arm_right: { x: 140, y: 260 },
  glove_left: { x: 382, y: 560 },
  glove_right: { x: 140, y: 560 },
  belly: { x: 261, y: 420 },
  cape_back: { x: 261, y: 337 },
  cape_collar: { x: 261, y: 337 },
  belt_test: { x: 261, y: 506 },
  head: { x: 261, y: 246 }
} satisfies Record<string, { x: number; y: number }>;

export const SIDE_RIG_PIVOTS = {
  cape_side: { x: 261, y: 337 },
  cape_side_collar: { x: 261, y: 337 },
  leg_back: { x: 236, y: 532 },
  leg_front: { x: 286, y: 532 },
  shoe_back: { x: 236, y: 590 },
  shoe_front: { x: 286, y: 590 },
  underwear: { x: 261, y: 520 },
  belly: { x: 292, y: 388 },
  torso: { x: 292, y: 300 },
  arm_back_upper: { x: 202, y: 275 },
  arm_back_forearm: { x: 202, y: 275 },
  hand_back: { x: 202, y: 275 },
  glove_back: { x: 202, y: 275 },
  head: { x: 302, y: 218 },
  arm_front_upper: { x: 366, y: 275 },
  arm_front_forearm: { x: 366, y: 275 },
  hand_front: { x: 366, y: 275 },
  glove_front: { x: 366, y: 275 }
} satisfies Record<string, { x: number; y: number }>;

export const HURT_RIG_PIVOTS = {
  cape_side: { x: 261, y: 337 },
  cape_side_collar: { x: 261, y: 337 },
  leg_back: { x: 236, y: 532 },
  leg_front: { x: 286, y: 532 },
  shoe_back: { x: 236, y: 590 },
  shoe_front: { x: 286, y: 590 },
  underwear: { x: 261, y: 520 },
  belly: { x: 292, y: 388 },
  torso: { x: 292, y: 300 },
  hurt_arm_back_upper: { x: 330, y: 385 },
  hurt_arm_back_forearm: { x: 376, y: 386 },
  hurt_hand_back: { x: 443, y: 365 },
  glove_back: { x: 443, y: 365 },
  head: { x: 302, y: 218 },
  hurt_head: { x: 302, y: 218 },
  hurt_arm_front_upper: { x: 317, y: 382 },
  hurt_arm_front_forearm: { x: 386, y: 386 },
  hurt_hand_front: { x: 359, y: 377 },
  glove_front: { x: 359, y: 377 },
  hurt_emote: { x: 110, y: 118 },
  hurt_emote_star_big: { x: 38, y: 36.5 },
  hurt_emote_star_small: { x: 31, y: 28 },
  hurt_emote_star_mid: { x: 31, y: 28 }
} satisfies Record<string, { x: number; y: number }>;

export const ATTACK_ONE_RIG_PIVOTS = {
  ...SIDE_RIG_PIVOTS,
  hand_back: { x: 38, y: 42 },
  attack_front_shoulder_over: { x: 38, y: 42 },
  attack_front_forearm_over: { x: 38, y: 42 },
  attack_front_hand_over: { x: 38, y: 42 },
  attack_front_arm: { x: 38, y: 42 }
} satisfies Record<string, { x: number; y: number }>;

export const FRONT_RIG_ANCHORS = {
  belt_test: "front_belt",
  glove_right: "arm_right",
  glove_left: "arm_left",
  cape_back: "torso",
  cape_collar: "torso",
  auto_front_almost_hero_medallion: "torso",
  auto_front_axe: "arm_right",
  auto_front_sandale_droite: "foot_right",
  auto_front_sandale_gauche: "foot_left",
  auto_front_tiny_helmet: "head",
  auto_front_war_underwear_face: "front_belt"
} satisfies Record<string, string>;

export const SIDE_RIG_ANCHORS = {
  glove_back: "hand_back",
  glove_front: "hand_front",
  shoe_back: "leg_back",
  shoe_front: "leg_front",
  auto_side_tiny_helmet: "head",
  auto_side_ceinture_test: "underwear",
  auto_side_war_underwear_walk: "underwear"
} satisfies Record<string, string>;

export const HURT_RIG_ANCHORS = {
  hurt_arm_back_forearm: "hurt_arm_back_upper",
  hurt_hand_back: "hurt_arm_back_forearm",
  hurt_arm_front_forearm: "hurt_arm_front_upper",
  hurt_hand_front: "hurt_arm_front_forearm",
  glove_back: "hurt_hand_back",
  glove_front: "hurt_hand_front",
  shoe_back: "leg_back",
  shoe_front: "leg_front",
  auto_side_tiny_helmet: "head",
  auto_side_ceinture_test: "underwear",
  auto_side_war_underwear_walk: "underwear"
} satisfies Record<string, string>;

export const ATTACK_ONE_RIG_ANCHORS = {
  torso: "belly",
  underwear: "belly",
  attack_front_forearm_over: "attack_front_shoulder_over",
  attack_front_hand_over: "attack_front_shoulder_over",
  glove_back: "hand_back",
  glove_front: "attack_front_hand_over",
  auto_side_axe: "attack_front_hand_over",
  shoe_back: "leg_back",
  shoe_front: "leg_front",
  auto_side_tiny_helmet: "head",
  auto_side_ceinture_test: "underwear",
  auto_side_war_underwear_walk: "underwear"
} satisfies Record<string, string>;
