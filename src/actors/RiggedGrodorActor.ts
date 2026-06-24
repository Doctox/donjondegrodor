import Phaser from "phaser";
import { assetPath } from "../utils/assetPath";
import {
  FRONT_RIG_ANCHORS,
  FRONT_RIG_PATH,
  FRONT_RIG_PIVOTS,
  ATTACK_ONE_FRAME_SEQUENCE,
  ATTACK_ONE_RIG_ANCHORS,
  ATTACK_ONE_RIG_LAYERS,
  ATTACK_ONE_RIG_PIVOTS,
  HURT_RIG_ANCHORS,
  HURT_RIG_LAYERS,
  HURT_RIG_PIVOTS,
  RIG_AUTHORING_SCALE,
  RIG_CANVAS_HEIGHT,
  RIG_CANVAS_WIDTH,
  SIDE_RIG_ANCHORS,
  SIDE_RIG_LAYERS,
  SIDE_RIG_PATH,
  SIDE_RIG_PIVOTS,
  VICTORY_FACE_LAYER_IDS,
  VICTORY_FRAME_SEQUENCE,
  VICTORY_RIG_LAYERS,
  WALK_FRAME_SEQUENCE,
  WALK_POSE_COUNT
} from "../rig/grodorRigDefinitions";
import {
  cleanLayerOrder,
  emptyRigLayerAdjustment,
  lerpLayerAdjustment,
  normalizeRigPresetV1,
  type GrodorRigLayerAdjustment,
  type GrodorRigLayerDefinition,
  type GrodorRigLayerSize,
  type GrodorRigPoint,
  type GrodorRigPresetInput,
  type GrodorRigPresetV1
} from "../rig/grodorRig";

type RigMode = "idle" | "walk" | "hurt" | "attack1";
type RigPose = RigMode | "attack" | "hurt" | "victory" | "death";

type RuntimeLayerState = {
  layers: readonly GrodorRigLayerDefinition[];
  pivots: Record<string, GrodorRigPoint>;
  path: string;
  keyPrefix: string;
  anchors: Record<string, string>;
  preset: GrodorRigPresetV1;
  offsets: Record<string, GrodorRigPoint>;
  sizes: Record<string, GrodorRigLayerSize>;
  poseAdjustments?: Record<string, GrodorRigLayerAdjustment>[];
  container: Phaser.GameObjects.Container;
  images: Map<string, Phaser.GameObjects.Image>;
  presetVisibility: Map<string, boolean>;
  basePositions: Map<string, GrodorRigPoint>;
  baseScales: Map<string, { x: number; y: number }>;
};

type RiggedGrodorActorConfig = {
  x: number;
  y: number;
  depth?: number;
  idleScale?: number;
  walkScale?: number;
};

const DEFAULT_IDLE_SCENE_SCALE = 0.205;
const DEFAULT_WALK_SCENE_SCALE = 0.265;
const WALK_SPEED = 10.0;
const WALK_ARM_SPEED_MULTIPLIER = 1.0;
const VICTORY_SPEED = 4.4;
const HURT_SPEED = 3.2;
const ATTACK_ONE_SPEED = 5.8;
const HURT_LAST_FRAME = 3;
const ATTACK_ONE_PIF_KEY = "rigged-grodor-attack-one-pif";
const ATTACK_ONE_PIF_PATH = "/assets/sprites/grodor/rig/side_walk_master/attack/pif_emote.png";
const ATTACK_ONE_PIF_POSITION = { x: 620, y: -438 };
const HURT_EMOTE_ORBIT_START_PROGRESS = 1.55;
const HURT_EMOTE_ORBIT_SPEED = 3.4;
const HURT_EMOTE_ORBIT_Y_SCALE = 0.56;
const HURT_EMOTE_STAR_IDS = ["hurt_emote_star_big", "hurt_emote_star_small", "hurt_emote_star_mid"] as const;

const RIG_EQUIPMENT_LAYER_MAP: Record<string, { front: readonly string[]; side: readonly string[] }> = {
  too_long_cape: {
    front: ["cape_back", "cape_collar"],
    side: ["cape_side", "cape_side_collar"]
  },
  quarter_hour_cape: {
    front: ["auto_front_cape_quart_heure_face_bas", "auto_front_cape_quart_heure_face_haut"],
    side: ["auto_side_cape_quart_heure_profil_bas", "auto_side_cape_quart_heure_profil_haut"]
  },
  axe: {
    front: ["auto_front_axe"],
    side: ["auto_side_axe"]
  },
  sticky_gloves: {
    front: ["glove_left", "glove_right"],
    side: ["glove_back", "glove_front"]
  },
  moufles_reflexion: {
    front: ["auto_front_moufles_reflexion_left", "auto_front_moufles_reflexion_right"],
    side: ["auto_side_moufles_reflexion_back", "auto_side_moufles_reflexion_front"]
  },
  panic_sandals: {
    front: ["auto_front_sandale_droite", "auto_front_sandale_gauche"],
    side: ["shoe_back", "shoe_front"]
  },
  tiny_helmet: {
    front: ["auto_front_tiny_helmet"],
    side: ["auto_side_tiny_helmet"]
  },
  war_underwear: {
    front: ["belt_test", "auto_front_war_underwear_face"],
    side: ["auto_side_ceinture_test", "auto_side_war_underwear_walk"]
  },
  almost_hero_medallion: {
    front: ["auto_front_almost_hero_medallion"],
    side: []
  },
  sablier_fele: {
    front: ["auto_front_sablier_fele"],
    side: []
  }
};

function layerKey(prefix: string, layerId: string): string {
  return `${prefix}-${layerId}`;
}

function layerAssetPath(basePath: string, layer: GrodorRigLayerDefinition): string {
  return layer.file.startsWith("/") ? layer.file : `${basePath}/${layer.file}`;
}

function emptyOffsets(layers: readonly GrodorRigLayerDefinition[]): Record<string, GrodorRigPoint> {
  return layers.reduce(
    (offsets, layer) => ({
      ...offsets,
      [layer.id]: { x: 0, y: 0 }
    }),
    {} as Record<string, GrodorRigPoint>
  );
}

function emptySizes(layers: readonly GrodorRigLayerDefinition[]): Record<string, GrodorRigLayerSize> {
  return layers.reduce(
    (sizes, layer) => ({
      ...sizes,
      [layer.id]: { scaleX: 1, scaleY: 1, rotation: 0 }
    }),
    {} as Record<string, GrodorRigLayerSize>
  );
}

function copyAdjustment(adjustment: GrodorRigLayerAdjustment): GrodorRigLayerAdjustment {
  return {
    offset: { x: adjustment.offset.x, y: adjustment.offset.y },
    size: {
      scaleX: adjustment.size.scaleX,
      scaleY: adjustment.size.scaleY,
      rotation: adjustment.size.rotation
    }
  };
}

function isDefaultAdjustment(adjustment: GrodorRigLayerAdjustment): boolean {
  return (
    adjustment.offset.x === 0 &&
    adjustment.offset.y === 0 &&
    adjustment.size.scaleX === 1 &&
    adjustment.size.scaleY === 1 &&
    adjustment.size.rotation === 0
  );
}

export function preloadRiggedGrodorActorAssets(scene: Phaser.Scene, keyPrefix = "rigged-grodor-runtime"): void {
  scene.load.image(ATTACK_ONE_PIF_KEY, assetPath(ATTACK_ONE_PIF_PATH));
  VICTORY_RIG_LAYERS.forEach((layer) => {
    scene.load.image(layerKey(`${keyPrefix}-front`, layer.id), assetPath(layerAssetPath(FRONT_RIG_PATH, layer)));
  });
  SIDE_RIG_LAYERS.forEach((layer) => {
    scene.load.image(layerKey(`${keyPrefix}-side`, layer.id), assetPath(layerAssetPath(SIDE_RIG_PATH, layer)));
  });
  HURT_RIG_LAYERS.forEach((layer) => {
    scene.load.image(layerKey(`${keyPrefix}-hurt`, layer.id), assetPath(layerAssetPath(SIDE_RIG_PATH, layer)));
  });
  ATTACK_ONE_RIG_LAYERS.forEach((layer) => {
    scene.load.image(layerKey(`${keyPrefix}-attack-one`, layer.id), assetPath(layerAssetPath(SIDE_RIG_PATH, layer)));
  });
}

export class RiggedGrodorActor {
  private idleSceneScale: number;
  private walkSceneScale: number;
  private readonly front: RuntimeLayerState;
  private readonly side: RuntimeLayerState;
  private readonly hurt: RuntimeLayerState;
  private readonly attackOne: RuntimeLayerState;
  private victoryPreset?: GrodorRigPresetV1;
  private victoryStartedAt = 0;
  private victoryFrame = 0;
  private hurtStartedAt = 0;
  private hurtFrame = 0;
  private attackOneStartedAt = 0;
  private attackOneFrame = 0;
  private attackOnePifPlayed = false;
  private mode: RigMode = "idle";
  private pose: RigPose = "idle";
  private facingLeft = false;
  private equipment = new Set<string>();
  private victoryHopTween?: Phaser.Tweens.Tween;
  private victoryHopBaseY = 0;
  private hurtKnockbackTweens: Phaser.Tweens.Tween[] = [];
  private attackOnePifEmote?: Phaser.GameObjects.Image;
  private attackOnePifTween?: Phaser.Tweens.Tween;

  constructor(private readonly scene: Phaser.Scene, config: RiggedGrodorActorConfig, private readonly keyPrefix = "rigged-grodor-runtime") {
    this.idleSceneScale = config.idleScale ?? DEFAULT_IDLE_SCENE_SCALE;
    this.walkSceneScale = config.walkScale ?? DEFAULT_WALK_SCENE_SCALE;
    const depth = config.depth ?? 10;

    this.front = this.createLayerState({
      layers: VICTORY_RIG_LAYERS,
      pivots: FRONT_RIG_PIVOTS,
      path: FRONT_RIG_PATH,
      keyPrefix: `${keyPrefix}-front`,
      anchors: FRONT_RIG_ANCHORS,
      rig: "frontIdle",
      poseCount: 0,
      container: scene.add.container(config.x, config.y).setDepth(depth)
    });
    this.side = this.createLayerState({
      layers: SIDE_RIG_LAYERS,
      pivots: SIDE_RIG_PIVOTS,
      path: SIDE_RIG_PATH,
      keyPrefix: `${keyPrefix}-side`,
      anchors: SIDE_RIG_ANCHORS,
      rig: "sideWalk",
      poseCount: WALK_POSE_COUNT,
      container: scene.add.container(config.x, config.y).setDepth(depth)
    });
    this.hurt = this.createLayerState({
      layers: HURT_RIG_LAYERS,
      pivots: HURT_RIG_PIVOTS,
      path: SIDE_RIG_PATH,
      keyPrefix: `${keyPrefix}-hurt`,
      anchors: HURT_RIG_ANCHORS,
      rig: "sideHurt",
      poseCount: 4,
      container: scene.add.container(config.x, config.y).setDepth(depth)
    });
    this.attackOne = this.createLayerState({
      layers: ATTACK_ONE_RIG_LAYERS,
      pivots: ATTACK_ONE_RIG_PIVOTS,
      path: SIDE_RIG_PATH,
      keyPrefix: `${keyPrefix}-attack-one`,
      anchors: ATTACK_ONE_RIG_ANCHORS,
      rig: "sideAttack1",
      poseCount: 4,
      container: scene.add.container(config.x, config.y).setDepth(depth)
    });

    this.side.container.setVisible(false);
    this.hurt.container.setVisible(false);
    this.attackOne.container.setVisible(false);
    this.applyContainerScale(this.front, this.idleSceneScale, false);
    this.applyContainerScale(this.side, this.walkSceneScale, false);
    this.applyContainerScale(this.hurt, this.walkSceneScale, false);
    this.applyContainerScale(this.attackOne, this.walkSceneScale, false);
    this.attackOnePifEmote = scene.add
      .image(ATTACK_ONE_PIF_POSITION.x, ATTACK_ONE_PIF_POSITION.y, ATTACK_ONE_PIF_KEY)
      .setOrigin(0.5)
      .setVisible(false)
      .setAlpha(0)
      .setScale(1.75);
    this.attachAttackOnePifEmote();
  }

  applyIdlePreset(raw: GrodorRigPresetInput): void {
    this.applyPreset(this.front, normalizeRigPresetV1(raw, {
      rig: "frontIdle",
      scale: RIG_AUTHORING_SCALE,
      layers: VICTORY_RIG_LAYERS,
      anchors: FRONT_RIG_ANCHORS
    }));
    VICTORY_FACE_LAYER_IDS.forEach((id) => {
      this.front.presetVisibility.set(id, false);
      this.front.images.get(id)?.setVisible(false);
    });
    this.applyIdlePose(this.scene.time.now / 1000);
  }

  applyVictoryPreset(raw: GrodorRigPresetInput): void {
    this.victoryPreset = normalizeRigPresetV1(raw, {
      rig: "frontVictory",
      scale: RIG_AUTHORING_SCALE,
      layers: VICTORY_RIG_LAYERS,
      anchors: FRONT_RIG_ANCHORS,
      poseCount: 4
    });
  }

  applyWalkPreset(raw: GrodorRigPresetInput): void {
    this.applyPreset(this.side, normalizeRigPresetV1({
      ...raw,
      lockedWalkFrame: null
    }, {
      rig: "sideWalk",
      scale: RIG_AUTHORING_SCALE,
      layers: SIDE_RIG_LAYERS,
      anchors: SIDE_RIG_ANCHORS,
      poseCount: WALK_POSE_COUNT
    }));
    this.migrateAttachedWalkStuffAnchors();
    this.applyWalkPose(this.scene.time.now / 1000);
  }

  applyHurtPreset(raw: GrodorRigPresetInput): void {
    this.applyPreset(this.hurt, normalizeRigPresetV1({
      ...raw,
      lockedWalkFrame: null
    }, {
      rig: "sideHurt",
      scale: RIG_AUTHORING_SCALE,
      layers: HURT_RIG_LAYERS,
      anchors: HURT_RIG_ANCHORS,
      poseCount: 4
    }));
    this.applyHurtPose(this.scene.time.now / 1000);
  }

  applyAttackOnePreset(raw: GrodorRigPresetInput): void {
    this.applyPreset(this.attackOne, normalizeRigPresetV1(raw, {
      rig: "sideAttack1",
      scale: RIG_AUTHORING_SCALE,
      layers: ATTACK_ONE_RIG_LAYERS,
      anchors: ATTACK_ONE_RIG_ANCHORS,
      poseCount: 4
    }));
    this.applyAttackOnePose(this.scene.time.now / 1000);
  }

  update(timeSeconds: number): void {
    if (this.pose === "victory") {
      this.applyVictoryPose(timeSeconds);
    } else if (this.pose === "hurt") {
      this.applyHurtPose(timeSeconds);
    } else if (this.pose === "attack") {
      this.applyAttackOnePose(timeSeconds);
    } else if (this.mode === "idle") {
      this.applyIdlePose(timeSeconds);
    } else {
      this.applyWalkPose(timeSeconds);
    }
  }

  showIdleAt(x = this.x, y = this.y): void {
    this.stopVictoryHop();
    this.stopHurtKnockback();
    this.stopPoseTweens();
    this.resetAttackOnePifEmote();
    this.mode = "idle";
    this.pose = "idle";
    this.front.container.setVisible(true).setPosition(x, y);
    this.side.container.setVisible(false);
    this.hurt.container.setVisible(false);
    this.attackOne.container.setVisible(false);
    this.reorderStateLayers(this.front, this.front.preset.layerOrder);
    this.applyContainerScale(this.front, this.idleSceneScale, false);
  }

  showWalkAt(x = this.x, y = this.y, facingLeft = false): void {
    this.stopVictoryHop();
    this.stopHurtKnockback();
    this.stopPoseTweens();
    this.resetAttackOnePifEmote();
    this.mode = "walk";
    this.pose = "walk";
    this.facingLeft = facingLeft;
    this.front.container.setVisible(false);
    this.side.container.setVisible(true).setPosition(x, y);
    this.hurt.container.setVisible(false);
    this.attackOne.container.setVisible(false);
    this.applyContainerScale(this.side, this.walkSceneScale, facingLeft);
  }

  showHurtAt(x = this.x, y = this.y, facingLeft = this.facingLeft): void {
    this.stopVictoryHop();
    this.stopHurtKnockback();
    this.stopPoseTweens();
    this.resetAttackOnePifEmote();
    this.mode = "hurt";
    this.pose = "hurt";
    this.facingLeft = facingLeft;
    this.hurtStartedAt = this.scene.time.now / 1000;
    this.hurtFrame = 0;
    this.front.container.setVisible(false);
    this.side.container.setVisible(false);
    this.hurt.container.setVisible(true).setPosition(x, y);
    this.attackOne.container.setVisible(false);
    this.reorderStateLayers(this.hurt, this.hurt.preset.layerOrder);
    this.applyContainerScale(this.hurt, this.walkSceneScale, facingLeft);
    this.applyEquipmentVisibility(this.hurt, "side");
    this.startHurtKnockback(x, y, facingLeft);
  }

  showAttackOneAt(x = this.x, y = this.y, facingLeft = this.facingLeft): void {
    this.stopVictoryHop();
    this.stopHurtKnockback();
    this.stopPoseTweens();
    this.mode = "attack1";
    this.pose = "attack";
    this.facingLeft = facingLeft;
    this.attackOneStartedAt = this.scene.time.now / 1000;
    this.attackOneFrame = 0;
    this.attackOnePifPlayed = false;
    this.resetAttackOnePifEmote();
    this.front.container.setVisible(false);
    this.side.container.setVisible(false);
    this.hurt.container.setVisible(false);
    this.attackOne.container.setVisible(true).setPosition(x, y);
    this.reorderStateLayers(this.attackOne, this.attackOne.preset.layerOrder);
    this.attachAttackOnePifEmote();
    this.applyContainerScale(this.attackOne, this.walkSceneScale, facingLeft);
    this.applyEquipmentVisibility(this.attackOne, "side");
    this.applyAttackOnePose(this.scene.time.now / 1000);
  }

  walkTo(target: GrodorRigPoint, options: { facingLeft?: boolean; duration?: number; onComplete?: () => void } = {}): void {
    this.showWalkAt(this.x, this.y, options.facingLeft ?? target.x < this.x);
    const distance = Phaser.Math.Distance.Between(this.side.container.x, this.side.container.y, target.x, target.y);
    this.scene.tweens.add({
      targets: this.side.container,
      x: target.x,
      y: target.y,
      duration: options.duration ?? Phaser.Math.Clamp(distance * 2.4, 260, 850),
      ease: "Sine.easeInOut",
      onComplete: options.onComplete
    });
  }

  setDepth(depth: number): void {
    this.front.container.setDepth(depth);
    this.side.container.setDepth(depth);
    this.hurt.container.setDepth(depth);
    this.attackOne.container.setDepth(depth);
  }

  destroy(): void {
    this.stopHurtKnockback();
    this.attackOnePifTween?.stop();
    this.attackOnePifEmote?.destroy();
    this.front.container.destroy(true);
    this.side.container.destroy(true);
    this.hurt.container.destroy(true);
    this.attackOne.container.destroy(true);
  }

  get x(): number {
    return this.mode === "idle"
      ? this.front.container.x
      : this.mode === "hurt"
        ? this.hurt.container.x
        : this.mode === "attack1"
          ? this.attackOne.container.x
          : this.side.container.x;
  }

  get y(): number {
    return this.mode === "idle"
      ? this.front.container.y
      : this.mode === "hurt"
        ? this.hurt.container.y
        : this.mode === "attack1"
          ? this.attackOne.container.y
          : this.side.container.y;
  }

  get container(): Phaser.GameObjects.Container {
    return this.mode === "walk"
      ? this.side.container
      : this.mode === "hurt"
        ? this.hurt.container
        : this.mode === "attack1"
          ? this.attackOne.container
          : this.front.container;
  }

  get currentAnimation(): string {
    return `rig-v3-${this.pose}`;
  }

  setPosition(x: number, y: number): void {
    this.front.container.setPosition(x, y);
    this.side.container.setPosition(x, y);
    this.hurt.container.setPosition(x, y);
    this.attackOne.container.setPosition(x, y);
  }

  setFlipX(flip: boolean): void {
    this.facingLeft = flip;
    if (this.mode === "walk" || this.mode === "hurt" || this.mode === "attack1") {
      this.applyContainerScale(this.mode === "hurt" ? this.hurt : this.mode === "attack1" ? this.attackOne : this.side, this.walkSceneScale, flip);
    }
  }

  setSceneScales(scales: { idleScale?: number; walkScale?: number }): void {
    if (typeof scales.idleScale === "number") {
      this.idleSceneScale = scales.idleScale;
    }
    if (typeof scales.walkScale === "number") {
      this.walkSceneScale = scales.walkScale;
    }

    if (this.mode === "idle") {
      this.applyContainerScale(this.front, this.idleSceneScale, false);
      return;
    }
    if (this.mode === "hurt") {
      this.applyContainerScale(this.hurt, this.walkSceneScale, this.facingLeft);
      return;
    }
    if (this.mode === "attack1") {
      this.applyContainerScale(this.attackOne, this.walkSceneScale, this.facingLeft);
      return;
    }
    this.applyContainerScale(this.side, this.walkSceneScale, this.facingLeft);
  }

  playIdle(): void {
    this.stopVictoryHop();
    this.showIdleAt(this.x, this.y);
    this.applyEquipmentVisibility(this.front, "front");
  }

  playWalk(): void {
    this.stopVictoryHop();
    this.showWalkAt(this.x, this.y, this.facingLeft);
  }

  playAttack(): void {
    this.showAttackOneAt(this.x, this.y, this.facingLeft);
  }

  playHurt(): void {
    this.showHurtAt(this.x, this.y, this.facingLeft);
  }

  playVictory(): void {
    if (this.pose === "victory" && this.victoryHopTween) {
      return;
    }

    this.showIdleAt(this.x, this.y);
    this.pose = "victory";
    this.victoryStartedAt = this.scene.time.now / 1000;
    this.victoryFrame = 0;
    if (this.victoryPreset) {
      this.reorderStateLayers(this.front, this.victoryPreset.layerOrder);
    }
    this.applyEquipmentVisibility(this.front, "front");
    this.startVictoryHop();
  }

  playDeath(): void {
    this.pose = "death";
  }

  setEquipment(_items: string[]): void {
    this.equipment = new Set(_items);
    this.applyEquipmentVisibility(this.front, "front");
    this.applyEquipmentVisibility(this.side, "side");
    this.applyEquipmentVisibility(this.hurt, "side");
    this.applyEquipmentVisibility(this.attackOne, "side");
  }

  private createLayerState(options: {
    layers: readonly GrodorRigLayerDefinition[];
    pivots: Record<string, GrodorRigPoint>;
    path: string;
    keyPrefix: string;
    anchors: Record<string, string>;
    rig: "frontIdle" | "sideWalk" | "sideHurt" | "sideAttack1";
    poseCount: number;
    container: Phaser.GameObjects.Container;
  }): RuntimeLayerState {
    const state: RuntimeLayerState = {
      ...options,
      preset: normalizeRigPresetV1({}, {
        rig: options.rig,
        scale: RIG_AUTHORING_SCALE,
        layers: options.layers,
        anchors: options.anchors,
        poseCount: options.poseCount
      }),
      offsets: emptyOffsets(options.layers),
      sizes: emptySizes(options.layers),
      poseAdjustments: options.poseCount > 0
        ? Array.from({ length: options.poseCount }, () =>
            options.layers.reduce(
              (pose, layer) => ({
                ...pose,
                [layer.id]: emptyRigLayerAdjustment()
              }),
              {} as Record<string, GrodorRigLayerAdjustment>
            )
          )
        : undefined,
      images: new Map(),
      presetVisibility: new Map(),
      basePositions: new Map(),
      baseScales: new Map()
    };

    options.layers.forEach((layer) => {
      const canvas = layer.canvas ?? { width: RIG_CANVAS_WIDTH, height: RIG_CANVAS_HEIGHT };
      const pivot = layer.pivot ?? options.pivots[layer.id] ?? { x: canvas.width / 2, y: canvas.height / 2 };
      const basePosition =
        layer.basePosition ?? {
          x: pivot.x - RIG_CANVAS_WIDTH / 2,
          y: pivot.y - RIG_CANVAS_HEIGHT
        };
      const baseScale = layer.baseScale ?? 1;
      const baseScaleY = layer.baseScaleY ?? baseScale;
      const imageOrigin =
        layer.id === "hurt_emote"
          ? { x: 0.5, y: 0.5 }
          : { x: pivot.x / canvas.width, y: pivot.y / canvas.height };
      const imagePosition =
        layer.id === "hurt_emote"
          ? {
              x: basePosition.x + (canvas.width / 2 - pivot.x) * baseScale,
              y: basePosition.y + (canvas.height / 2 - pivot.y) * baseScaleY
            }
          : basePosition;
      const image = this.scene.add
        .image(imagePosition.x, imagePosition.y, layerKey(options.keyPrefix, layer.id))
        .setOrigin(imageOrigin.x, imageOrigin.y);
      state.basePositions.set(layer.id, imagePosition);
      state.baseScales.set(layer.id, {
        x: baseScale,
        y: baseScaleY
      });
      image.setVisible(layer.kind !== "stuff");
      state.presetVisibility.set(layer.id, true);
      state.images.set(layer.id, image);
      options.container.add(image);
    });

    return state;
  }

  private applyPreset(state: RuntimeLayerState, preset: GrodorRigPresetV1): void {
    state.preset = preset;
    state.offsets = { ...emptyOffsets(state.layers), ...preset.offsets };
    state.sizes = { ...emptySizes(state.layers), ...preset.sizeAdjustments };
    state.poseAdjustments = preset.poseAdjustments?.map((pose) =>
      state.layers.reduce(
        (result, layer) => ({
          ...result,
          [layer.id]: copyAdjustment(pose[layer.id] ?? emptyRigLayerAdjustment())
        }),
        {} as Record<string, GrodorRigLayerAdjustment>
      )
    );

    state.layers.forEach((layer) => {
      state.presetVisibility.set(layer.id, preset.visibility[layer.id] ?? true);
    });
    this.applyEquipmentVisibility(state, state === this.front ? "front" : "side");

    this.reorderStateLayers(state, preset.layerOrder);
  }

  private reorderStateLayers(state: RuntimeLayerState, layerOrder: readonly string[]): void {
    state.container.removeAll(false);
    cleanLayerOrder(layerOrder, state.layers).forEach((id) => {
      const image = state.images.get(id);
      if (image) {
        state.container.add(image);
      }
    });
  }

  private applyIdlePose(time: number): void {
    this.front.layers.forEach((layer) => {
      this.applyLayerPose(this.front, layer.id, this.idlePose(layer.id, time), emptyRigLayerAdjustment());
    });
  }

  private applyVictoryPose(time: number): void {
    const poseAdjustments = this.victoryPreset?.poseAdjustments;
    if (!this.victoryPreset || !poseAdjustments?.length) {
      this.applyIdlePose(time);
      return;
    }

    const progress = Math.floor((time - this.victoryStartedAt) * VICTORY_SPEED);
    const sequenceIndex = Phaser.Math.Clamp(progress, 0, VICTORY_FRAME_SEQUENCE.length - 1);
    this.victoryFrame = VICTORY_FRAME_SEQUENCE[sequenceIndex];
    this.front.layers.forEach((layer) => {
      this.applyLayerPose(this.front, layer.id, emptyRigLayerAdjustment(), this.frontPoseAdjustmentForLayer(layer.id));
    });
    this.applyVictoryVisibility(this.victoryFrame);
  }

  private idlePose(id: string, time: number): GrodorRigLayerAdjustment & { size: GrodorRigLayerSize } {
    if (this.front.preset.animationEnabled === false) {
      return emptyRigLayerAdjustment();
    }

    const breath = Math.sin(time * 1.8);
    const breathOut = (breath + 1) / 2;
    const sway = Math.sin(time * 0.85);
    const tinyCounter = Math.sin(time * 1.8 + Math.PI);

    switch (id) {
      case "head":
        return { offset: { x: sway * 0.75, y: -1.2 - breathOut * 1.7 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(sway * 0.005) } };
      case "torso":
      case "cape_back":
      case "cape_collar":
        return { offset: { x: sway * 0.35, y: -breathOut * 0.8 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(sway * 0.002) } };
      case "belly":
        return { offset: { x: sway * 0.25, y: -breathOut * 1.05 }, size: { scaleX: 1 + breathOut * 0.01, scaleY: 1 + breathOut * 0.012, rotation: 0 } };
      case "front_belt":
      case "belt_test":
        return { offset: { x: sway * 0.24, y: -breathOut * 1.15 }, size: { scaleX: 1 + breathOut * 0.008, scaleY: 1 + breathOut * 0.012, rotation: 0 } };
      case "arm_left":
      case "glove_left":
        return { offset: { x: sway * 0.58, y: -breathOut * 0.75 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(0.008 + tinyCounter * 0.0055) } };
      case "arm_right":
      case "glove_right":
        return { offset: { x: sway * 0.48, y: -breathOut * 0.75 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(-0.008 - tinyCounter * 0.0055) } };
      default:
        return emptyRigLayerAdjustment();
    }
  }

  private applyWalkPose(time: number): void {
    const cycle = time * WALK_SPEED;
    this.side.layers.forEach((layer) => {
      const layerCycle = this.walkCycleForLayer(layer.id, cycle);
      this.applyLayerPose(this.side, layer.id, this.walkSecondaryPose(layer.id, layerCycle), this.walkPoseAdjustmentForLayer(layer.id, layerCycle));
    });
    this.applyContainerScale(this.side, this.walkSceneScale, this.facingLeft);
  }

  private applyHurtPose(time: number): void {
    const progress = Phaser.Math.Clamp((time - this.hurtStartedAt) * HURT_SPEED, 0, HURT_LAST_FRAME);
    this.hurtFrame = Phaser.Math.Clamp(Math.round(progress), 0, HURT_LAST_FRAME);
    this.hurt.layers.forEach((layer) => {
      this.applyHurtLayerPose(layer.id, progress);
    });
    this.applyHurtEmoteOrbit(time);
    this.applyHurtVisibility(this.hurtFrame);
    this.applyContainerScale(this.hurt, this.walkSceneScale, this.facingLeft);
  }

  private applyAttackOnePose(time: number): void {
    const progress = Math.floor((time - this.attackOneStartedAt) * ATTACK_ONE_SPEED);
    const sequenceIndex = Phaser.Math.Clamp(progress, 0, ATTACK_ONE_FRAME_SEQUENCE.length - 1);
    this.attackOneFrame = ATTACK_ONE_FRAME_SEQUENCE[sequenceIndex];
    this.attackOne.layers.forEach((layer) => {
      this.applyAttackOneLayerPose(layer.id);
    });
    this.applyAttackOneVisibility(this.attackOneFrame);
    if (this.attackOneFrame === 3 && !this.attackOnePifPlayed) {
      this.playAttackOnePifEmote();
    }
    this.applyContainerScale(this.attackOne, this.walkSceneScale, this.facingLeft);
  }

  private attachAttackOnePifEmote(): void {
    if (!this.attackOnePifEmote) {
      return;
    }

    this.attackOne.container.add(this.attackOnePifEmote);
    this.attackOne.container.bringToTop(this.attackOnePifEmote);
  }

  private resetAttackOnePifEmote(): void {
    this.attackOnePifTween?.stop();
    this.attackOnePifTween = undefined;
    this.attackOnePifEmote
      ?.setPosition(ATTACK_ONE_PIF_POSITION.x, ATTACK_ONE_PIF_POSITION.y)
      .setScale(1.75)
      .setAlpha(0)
      .setVisible(false);
  }

  private playAttackOnePifEmote(): void {
    if (!this.attackOnePifEmote) {
      return;
    }

    this.attackOnePifPlayed = true;
    this.attackOnePifTween?.stop();
    this.attackOnePifEmote
      .setPosition(ATTACK_ONE_PIF_POSITION.x, ATTACK_ONE_PIF_POSITION.y)
      .setScale(1.75)
      .setAlpha(0)
      .setVisible(true);

    this.attackOnePifTween = this.scene.tweens.add({
      targets: this.attackOnePifEmote,
      alpha: 1,
      scaleX: 3.75,
      scaleY: 3.75,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        this.attackOnePifTween = this.scene.tweens.add({
          targets: this.attackOnePifEmote,
          alpha: 0,
          scaleX: 4.75,
          scaleY: 4.75,
          duration: 820,
          ease: "Sine.easeOut",
          onComplete: () => {
            this.attackOnePifEmote?.setVisible(false);
            this.attackOnePifTween = undefined;
          }
        });
      }
    });
  }

  private applyAttackOneLayerPose(id: string): void {
    const image = this.attackOne.images.get(id);
    if (!image) {
      return;
    }

    const transform = this.attackOneLayerTransform(id, this.attackOneFrame);
    const baseScale = this.attackOne.baseScales.get(id) ?? { x: 1, y: 1 };
    image.setPosition(transform.x, transform.y);
    image.setRotation(transform.rotation);
    image.setScale(baseScale.x * transform.scaleX, baseScale.y * transform.scaleY);
  }

  private attackOneLayerTransform(id: string, frame: number, resolving = new Set<string>()): { x: number; y: number; rotation: number; scaleX: number; scaleY: number } {
    if (resolving.has(id)) {
      return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    }
    resolving.add(id);

    const base = this.attackOne.basePositions.get(id) ?? { x: 0, y: 0 };
    const offset = this.attackOne.offsets[id] ?? { x: 0, y: 0 };
    const size = this.attackOne.sizes[id] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
    const poseAdjustment = this.attackOnePoseAdjustmentForLayer(id, frame);
    const parentId = this.attackOneParentId(id, frame);
    const localRotation = Phaser.Math.DegToRad(size.rotation + poseAdjustment.size.rotation);
    const localScaleX = size.scaleX * poseAdjustment.size.scaleX;
    const localScaleY = size.scaleY * poseAdjustment.size.scaleY;

    if (parentId) {
      const parent = this.attackOneLayerTransform(parentId, frame, resolving);
      const parentBase = this.attackOne.basePositions.get(parentId) ?? { x: 0, y: 0 };
      const local = {
        x: (base.x - parentBase.x + offset.x + poseAdjustment.offset.x) * parent.scaleX,
        y: (base.y - parentBase.y + offset.y + poseAdjustment.offset.y) * parent.scaleY
      };
      const cos = Math.cos(parent.rotation);
      const sin = Math.sin(parent.rotation);
      resolving.delete(id);
      return {
        x: parent.x + local.x * cos - local.y * sin,
        y: parent.y + local.x * sin + local.y * cos,
        rotation: parent.rotation + localRotation,
        scaleX: parent.scaleX * localScaleX,
        scaleY: parent.scaleY * localScaleY
      };
    }

    resolving.delete(id);
    return {
      x: base.x + offset.x + poseAdjustment.offset.x,
      y: base.y + offset.y + poseAdjustment.offset.y,
      rotation: localRotation,
      scaleX: localScaleX,
      scaleY: localScaleY
    };
  }

  private attackOneParentId(id: string, frame: number): string | undefined {
    if (id === "glove_front" || id === "auto_side_moufles_reflexion_front" || id === "auto_side_axe") {
      const poseVisibility = this.attackOne.preset.poseVisibility?.[frame] ?? this.attackOne.preset.visibility;
      const candidates = ["attack_front_hand_over", "attack_front_arm", "attack_front_shoulder_over"];
      return candidates.find((candidateId) => poseVisibility?.[candidateId] ?? this.attackOne.presetVisibility.get(candidateId) ?? true) ?? this.attackOne.preset.anchors[id];
    }

    return this.attackOne.preset.anchors[id];
  }

  private attackOnePoseAdjustmentForLayer(id: string, frame: number): GrodorRigLayerAdjustment {
    return this.attackOne.poseAdjustments?.[frame]?.[id] ?? emptyRigLayerAdjustment();
  }

  private applyAttackOneVisibility(frame: number): void {
    const poseVisibility = this.attackOne.preset.poseVisibility?.[frame] ?? this.attackOne.preset.visibility;
    const visibleLayerIds = new Set<string>();
    this.equipment.forEach((item) => {
      RIG_EQUIPMENT_LAYER_MAP[item]?.side.forEach((layerId) => visibleLayerIds.add(layerId));
    });

    this.attackOne.layers.forEach((layer) => {
      const image = this.attackOne.images.get(layer.id);
      if (!image) {
        return;
      }

      const presetVisible = poseVisibility?.[layer.id] ?? this.attackOne.presetVisibility.get(layer.id) ?? true;
      image.setVisible(layer.kind === "stuff" ? presetVisible && visibleLayerIds.has(layer.id) : presetVisible);
    });
  }

  private applyHurtLayerPose(id: string, progress: number): void {
    const image = this.hurt.images.get(id);
    if (!image) {
      return;
    }

    const transform = this.hurtLayerTransform(id, progress);
    const baseScale = this.hurt.baseScales.get(id) ?? { x: 1, y: 1 };
    image.setPosition(transform.x, transform.y);
    image.setRotation(transform.rotation);
    image.setScale(baseScale.x * transform.scaleX, baseScale.y * transform.scaleY);
  }

  private hurtLayerTransform(id: string, progress: number, resolving = new Set<string>()): { x: number; y: number; rotation: number; scaleX: number; scaleY: number } {
    if (resolving.has(id)) {
      return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    }
    resolving.add(id);

    const base = this.hurt.basePositions.get(id) ?? { x: 0, y: 0 };
    const offset = this.hurt.offsets[id] ?? { x: 0, y: 0 };
    const size = this.hurt.sizes[id] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
    const poseAdjustment = this.hurtPoseAdjustmentForLayer(id, progress);
    const parentId = this.hurt.preset.anchors[id];
    const secondaryPose = parentId ? emptyRigLayerAdjustment() : this.hurtSecondaryPose(id, progress);

    const localRotation = Phaser.Math.DegToRad(size.rotation + secondaryPose.size.rotation + poseAdjustment.size.rotation);
    const localScaleX = size.scaleX * secondaryPose.size.scaleX * poseAdjustment.size.scaleX;
    const localScaleY = size.scaleY * secondaryPose.size.scaleY * poseAdjustment.size.scaleY;

    if (parentId) {
      const parent = this.hurtLayerTransform(parentId, progress, resolving);
      const parentBase = this.hurt.basePositions.get(parentId) ?? { x: 0, y: 0 };
      const local = {
        x: (base.x - parentBase.x + offset.x + poseAdjustment.offset.x) * parent.scaleX,
        y: (base.y - parentBase.y + offset.y + poseAdjustment.offset.y) * parent.scaleY
      };
      const cos = Math.cos(parent.rotation);
      const sin = Math.sin(parent.rotation);
      resolving.delete(id);
      return {
        x: parent.x + local.x * cos - local.y * sin,
        y: parent.y + local.x * sin + local.y * cos,
        rotation: parent.rotation + localRotation,
        scaleX: parent.scaleX * localScaleX,
        scaleY: parent.scaleY * localScaleY
      };
    }

    resolving.delete(id);
    return {
      x: base.x + offset.x + secondaryPose.offset.x + poseAdjustment.offset.x,
      y: base.y + offset.y + secondaryPose.offset.y + poseAdjustment.offset.y,
      rotation: localRotation,
      scaleX: localScaleX,
      scaleY: localScaleY
    };
  }

  private hurtSecondaryPose(id: string, progress: number): GrodorRigLayerAdjustment {
    if (this.hurt.preset.secondaryMotionEnabled === false) {
      return emptyRigLayerAdjustment();
    }

    const cycle = (progress * Math.PI) / 2;
    const step = Math.sin(cycle);
    const bounce = Math.abs(step);
    const soft = Math.sin(cycle * 0.5);
    switch (id) {
      case "head":
      case "hurt_head":
        return { offset: { x: soft * 0.8, y: -bounce * 1.6 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(soft * 0.008) } };
      case "torso":
        return { offset: { x: soft * 0.35, y: -bounce * 1.2 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(soft * 0.004) } };
      case "belly":
        return { offset: { x: soft * 0.25, y: -bounce * 0.8 }, size: { scaleX: 1 + bounce * 0.004, scaleY: 1 + bounce * 0.003, rotation: Phaser.Math.RadToDeg(soft * 0.002) } };
      case "underwear":
        return { offset: { x: soft * 0.18, y: -bounce * 0.55 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(soft * 0.0015) } };
      case "hurt_arm_front_upper":
      case "hurt_arm_front_forearm":
      case "hurt_hand_front":
        return { offset: { x: 0, y: 0 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(step * 0.006) } };
      case "hurt_arm_back_upper":
      case "hurt_arm_back_forearm":
      case "hurt_hand_back":
        return { offset: { x: 0, y: 0 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(-step * 0.005) } };
      case "leg_front":
      case "leg_back":
        return { offset: { x: 0, y: bounce * 0.45 }, size: { scaleX: 1, scaleY: 1, rotation: 0 } };
      default:
        return emptyRigLayerAdjustment();
    }
  }

  private hurtPoseAdjustmentForLayer(id: string, progress: number): GrodorRigLayerAdjustment {
    const poseAdjustments = this.hurt.poseAdjustments;
    if (!poseAdjustments?.length) {
      return emptyRigLayerAdjustment();
    }

    if (typeof this.hurt.preset.lockedWalkFrame === "number") {
      return poseAdjustments[this.hurt.preset.lockedWalkFrame]?.[id] ?? emptyRigLayerAdjustment();
    }

    const fromFrame = Math.floor(progress);
    const toFrame = Math.min(fromFrame + 1, HURT_LAST_FRAME);
    const amount = Phaser.Math.SmoothStep(progress - fromFrame, 0, 1);
    return lerpLayerAdjustment(
      poseAdjustments[fromFrame]?.[id] ?? emptyRigLayerAdjustment(),
      poseAdjustments[toFrame]?.[id] ?? emptyRigLayerAdjustment(),
      amount
    );
  }

  private applyHurtEmoteOrbit(time: number): void {
    if (this.hurt.preset.secondaryMotionEnabled === false || this.hurtFrame < HURT_EMOTE_ORBIT_START_PROGRESS) {
      return;
    }

    const stars = HURT_EMOTE_STAR_IDS.map((id) => this.hurt.images.get(id)).filter((image): image is Phaser.GameObjects.Image => Boolean(image));
    if (stars.length < HURT_EMOTE_STAR_IDS.length) {
      return;
    }

    const center = stars.reduce(
      (point, image) => ({
        x: point.x + image.x / stars.length,
        y: point.y + image.y / stars.length
      }),
      { x: 0, y: 0 }
    );
    const orbitStartTime = this.hurtStartedAt + HURT_EMOTE_ORBIT_START_PROGRESS / HURT_SPEED;
    const angle = Math.max(0, time - orbitStartTime) * HURT_EMOTE_ORBIT_SPEED;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    stars.forEach((image) => {
      const x = image.x - center.x;
      const y = image.y - center.y;
      const ovalY = y / HURT_EMOTE_ORBIT_Y_SCALE;
      image.setPosition(
        center.x + x * cos - ovalY * sin,
        center.y + (x * sin + ovalY * cos) * HURT_EMOTE_ORBIT_Y_SCALE
      );
    });
  }

  private applyHurtVisibility(frame: number): void {
    const poseVisibility = this.hurt.preset.poseVisibility?.[frame] ?? this.hurt.preset.visibility;
    const visibleLayerIds = new Set<string>();
    this.equipment.forEach((item) => {
      RIG_EQUIPMENT_LAYER_MAP[item]?.side.forEach((layerId) => visibleLayerIds.add(layerId));
    });

    this.hurt.layers.forEach((layer) => {
      const image = this.hurt.images.get(layer.id);
      if (!image) {
        return;
      }

      const presetVisible = poseVisibility?.[layer.id] ?? this.hurt.presetVisibility.get(layer.id) ?? true;
      image.setVisible(layer.kind === "stuff" ? presetVisible && visibleLayerIds.has(layer.id) : presetVisible);
    });
  }

  private walkSecondaryPose(id: string, cycle: number): GrodorRigLayerAdjustment {
    if (this.side.preset.secondaryMotionEnabled === false || this.side.preset.lockedWalkFrame !== undefined && this.side.preset.lockedWalkFrame !== null) {
      return emptyRigLayerAdjustment();
    }
    const parentId = this.side.preset.anchors[id];
    if (parentId) {
      return this.walkSecondaryPose(parentId, cycle);
    }

    const step = Math.sin(cycle);
    const bounce = Math.abs(step);
    const soft = Math.sin(cycle * 0.5);
    switch (id) {
      case "head":
        return { offset: { x: soft * 0.8, y: -bounce * 1.6 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(soft * 0.008) } };
      case "torso":
        return { offset: { x: soft * 0.35, y: -bounce * 1.2 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(soft * 0.004) } };
      case "belly":
        return { offset: { x: soft * 0.25, y: -bounce * 0.8 }, size: { scaleX: 1 + bounce * 0.004, scaleY: 1 + bounce * 0.003, rotation: Phaser.Math.RadToDeg(soft * 0.002) } };
      case "underwear":
        return { offset: { x: soft * 0.18, y: -bounce * 0.55 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(soft * 0.0015) } };
      case "arm_front_upper":
      case "arm_front_forearm":
      case "hand_front":
        return { offset: { x: 0, y: 0 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(step * 0.006) } };
      case "arm_back_upper":
      case "arm_back_forearm":
      case "hand_back":
        return { offset: { x: 0, y: 0 }, size: { scaleX: 1, scaleY: 1, rotation: Phaser.Math.RadToDeg(-step * 0.005) } };
      case "leg_front":
      case "leg_back":
        return { offset: { x: 0, y: bounce * 0.45 }, size: { scaleX: 1, scaleY: 1, rotation: 0 } };
      default:
        return emptyRigLayerAdjustment();
    }
  }

  private walkPoseAdjustmentForLayer(id: string, cycle: number): GrodorRigLayerAdjustment {
    return this.rawWalkPoseAdjustment(this.side.preset.anchors[id] ?? id, cycle);
  }

  private walkCycleForLayer(id: string, baseCycle: number): number {
    const anchoredTo = this.side.preset.anchors[id];
    const resolvedId = anchoredTo ?? id;
    return this.isWalkArmLayer(resolvedId) ? baseCycle * WALK_ARM_SPEED_MULTIPLIER : baseCycle;
  }

  private isWalkArmLayer(id: string): boolean {
    return (
      id === "arm_front_upper" ||
      id === "arm_front_forearm" ||
      id === "hand_front" ||
      id === "glove_front" ||
      id === "auto_side_axe" ||
      id === "arm_back_upper" ||
      id === "arm_back_forearm" ||
      id === "hand_back" ||
      id === "glove_back"
    );
  }

  private rawWalkPoseAdjustment(id: string, cycle: number): GrodorRigLayerAdjustment {
    const poseAdjustments = this.side.poseAdjustments;
    if (!poseAdjustments || poseAdjustments.length === 0) {
      return emptyRigLayerAdjustment();
    }

    if (typeof this.side.preset.lockedWalkFrame === "number") {
      return poseAdjustments[this.side.preset.lockedWalkFrame]?.[id] ?? emptyRigLayerAdjustment();
    }

    const walkProgress = Phaser.Math.Wrap(cycle / (Math.PI / 2), 0, WALK_FRAME_SEQUENCE.length);
    const sequenceIndex = Math.floor(walkProgress) % WALK_FRAME_SEQUENCE.length;
    const nextSequenceIndex = (sequenceIndex + 1) % WALK_FRAME_SEQUENCE.length;
    const fromFrame = WALK_FRAME_SEQUENCE[sequenceIndex];
    const toFrame = WALK_FRAME_SEQUENCE[nextSequenceIndex];
    const amount = Phaser.Math.SmoothStep(walkProgress - sequenceIndex, 0, 1);
    return lerpLayerAdjustment(
      poseAdjustments[fromFrame]?.[id] ?? emptyRigLayerAdjustment(),
      poseAdjustments[toFrame]?.[id] ?? emptyRigLayerAdjustment(),
      amount
    );
  }

  private applyLayerPose(
    state: RuntimeLayerState,
    id: string,
    secondaryPose: GrodorRigLayerAdjustment,
    poseAdjustment: GrodorRigLayerAdjustment
  ): void {
    const image = state.images.get(id);
    if (!image) {
      return;
    }

    const base = state.basePositions.get(id) ?? { x: 0, y: 0 };
    const baseScale = state.baseScales.get(id) ?? { x: 1, y: 1 };
    const size = state.sizes[id] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
    const offset = state.offsets[id] ?? { x: 0, y: 0 };
    const parentId = state.preset.anchors[id];

    if (parentId) {
      const parentBase = state.basePositions.get(parentId) ?? { x: 0, y: 0 };
      const parentOffset = state.offsets[parentId] ?? { x: 0, y: 0 };
      const parentSize = state.sizes[parentId] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
      const parentWalkCycle = this.walkCycleForLayer(parentId, this.scene.time.now / 1000 * WALK_SPEED);
      const parentPose = state === this.front
        ? this.pose === "victory"
          ? emptyRigLayerAdjustment()
          : this.idlePose(parentId, this.scene.time.now / 1000)
        : this.walkSecondaryPose(parentId, parentWalkCycle);
      const parentPoseAdjustment = state === this.front ? this.frontPoseAdjustmentForLayer(parentId) : this.walkPoseAdjustmentForLayer(parentId, parentWalkCycle);
      const childPoseAdjustment = state === this.front && this.pose === "victory" ? poseAdjustment : emptyRigLayerAdjustment();
      const parentRotation = Phaser.Math.DegToRad(parentSize.rotation + parentPose.size.rotation + parentPoseAdjustment.size.rotation);
      const parentScaleX = parentSize.scaleX * parentPose.size.scaleX * parentPoseAdjustment.size.scaleX;
      const parentScaleY = parentSize.scaleY * parentPose.size.scaleY * parentPoseAdjustment.size.scaleY;
      const parentPosition = {
        x: parentBase.x + parentOffset.x + parentPose.offset.x + parentPoseAdjustment.offset.x,
        y: parentBase.y + parentOffset.y + parentPose.offset.y + parentPoseAdjustment.offset.y
      };
      const localNail = {
        x: (base.x - parentBase.x + offset.x + childPoseAdjustment.offset.x) * parentScaleX,
        y: (base.y - parentBase.y + offset.y + childPoseAdjustment.offset.y) * parentScaleY
      };
      const cos = Math.cos(parentRotation);
      const sin = Math.sin(parentRotation);

      image.setPosition(parentPosition.x + localNail.x * cos - localNail.y * sin, parentPosition.y + localNail.x * sin + localNail.y * cos);
      image.setRotation(parentRotation + Phaser.Math.DegToRad(size.rotation + childPoseAdjustment.size.rotation));
      image.setScale(baseScale.x * size.scaleX * childPoseAdjustment.size.scaleX, baseScale.y * size.scaleY * childPoseAdjustment.size.scaleY);
      return;
    }

    image.setPosition(
      base.x + offset.x + secondaryPose.offset.x + poseAdjustment.offset.x,
      base.y + offset.y + secondaryPose.offset.y + poseAdjustment.offset.y
    );
    image.setRotation(Phaser.Math.DegToRad(size.rotation + secondaryPose.size.rotation + poseAdjustment.size.rotation));
    image.setScale(
      baseScale.x * size.scaleX * secondaryPose.size.scaleX * poseAdjustment.size.scaleX,
      baseScale.y * size.scaleY * secondaryPose.size.scaleY * poseAdjustment.size.scaleY
    );
  }

  private migrateAttachedWalkStuffAnchors(): void {
    const poseAdjustments = this.side.poseAdjustments;
    if (!poseAdjustments) {
      return;
    }

    const sourceFrame = Phaser.Math.Clamp(typeof this.side.preset.lockedWalkFrame === "number" ? this.side.preset.lockedWalkFrame : 0, 0, WALK_POSE_COUNT - 1);
    this.side.layers
      .filter((layer) => layer.kind === "stuff" && Boolean(this.side.preset.anchors[layer.id]))
      .forEach((layer) => {
        const globalAdjustment = {
          offset: this.side.offsets[layer.id],
          size: this.side.sizes[layer.id]
        };
        const sourceAdjustment = poseAdjustments[sourceFrame]?.[layer.id];
        if (sourceAdjustment && isDefaultAdjustment(globalAdjustment) && !isDefaultAdjustment(sourceAdjustment)) {
          this.side.offsets[layer.id] = { x: sourceAdjustment.offset.x, y: sourceAdjustment.offset.y };
          this.side.sizes[layer.id] = {
            scaleX: sourceAdjustment.size.scaleX,
            scaleY: sourceAdjustment.size.scaleY,
            rotation: sourceAdjustment.size.rotation
          };
        }
        poseAdjustments.forEach((pose) => {
          pose[layer.id] = emptyRigLayerAdjustment();
        });
      });
  }

  private frontPoseAdjustmentForLayer(id: string): GrodorRigLayerAdjustment {
    if (this.pose !== "victory") {
      return emptyRigLayerAdjustment();
    }

    return this.victoryPreset?.poseAdjustments?.[this.victoryFrame]?.[id] ?? emptyRigLayerAdjustment();
  }

  private applyVictoryVisibility(frame: number): void {
    const poseVisibility = this.victoryPreset?.poseVisibility?.[frame] ?? this.victoryPreset?.visibility;
    const visibleLayerIds = new Set<string>();
    this.equipment.forEach((item) => {
      RIG_EQUIPMENT_LAYER_MAP[item]?.front.forEach((layerId) => visibleLayerIds.add(layerId));
    });

    this.front.layers.forEach((layer) => {
      const image = this.front.images.get(layer.id);
      if (!image) {
        return;
      }

      const presetVisible = poseVisibility?.[layer.id] ?? this.front.presetVisibility.get(layer.id) ?? true;
      const hiddenCape = RIG_EQUIPMENT_LAYER_MAP.too_long_cape.front.includes(layer.id);
      image.setVisible(layer.kind === "stuff" ? presetVisible && visibleLayerIds.has(layer.id) && !hiddenCape : presetVisible);
    });
  }

  private applyEquipmentVisibility(state: RuntimeLayerState, mode: "front" | "side"): void {
    const visibleLayerIds = new Set<string>();
    this.equipment.forEach((item) => {
      RIG_EQUIPMENT_LAYER_MAP[item]?.[mode].forEach((layerId) => visibleLayerIds.add(layerId));
    });

    state.layers.forEach((layer) => {
      const image = state.images.get(layer.id);
      if (!image) {
        return;
      }

      const presetVisible = state.presetVisibility.get(layer.id) ?? true;
      const hiddenWhenNotVictory = mode === "front" && VICTORY_FACE_LAYER_IDS.includes(layer.id as (typeof VICTORY_FACE_LAYER_IDS)[number]) && this.pose !== "victory";
      const hiddenForVictory = this.pose === "victory" && mode === "front" && RIG_EQUIPMENT_LAYER_MAP.too_long_cape.front.includes(layer.id);
      image.setVisible(layer.kind === "stuff" ? presetVisible && visibleLayerIds.has(layer.id) && !hiddenForVictory : presetVisible && !hiddenWhenNotVictory);
    });
  }

  private startHurtKnockback(originX: number, originY: number, facingLeft: boolean): void {
    const direction = facingLeft ? 1 : -1;
    const liftX = originX + direction * 30;
    const landX = originX + direction * 54;
    const liftY = originY - 24;
    const target = this.hurt.container;

    const impactTween = this.scene.tweens.add({
      targets: target,
      x: liftX,
      y: liftY,
      duration: 120,
      ease: "Quad.easeOut",
      onComplete: () => {
        const landTween = this.scene.tweens.add({
          targets: target,
          x: landX,
          y: originY,
          duration: 210,
          ease: "Bounce.easeOut",
          onComplete: () => {
            this.hurtKnockbackTweens = this.hurtKnockbackTweens.filter((tween) => tween !== landTween);
          }
        });
        this.hurtKnockbackTweens = this.hurtKnockbackTweens.filter((tween) => tween !== impactTween);
        this.hurtKnockbackTweens.push(landTween);
      }
    });

    this.hurtKnockbackTweens = [impactTween];
  }

  private stopHurtKnockback(): void {
    this.hurtKnockbackTweens.forEach((tween) => tween.stop());
    this.hurtKnockbackTweens = [];
  }

  private stopPoseTweens(): void {
    this.scene.tweens.killTweensOf([
      this.front.container,
      this.side.container,
      this.hurt.container,
      this.attackOne.container
    ]);
  }

  private startVictoryHop(): void {
    if (this.victoryHopTween) {
      return;
    }

    this.victoryHopBaseY = this.front.container.y;
    this.victoryHopTween = this.scene.tweens.add({
      targets: this.front.container,
      y: this.victoryHopBaseY - 12,
      duration: 130,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeOut"
    });
  }

  private stopVictoryHop(): void {
    if (!this.victoryHopTween) {
      return;
    }

    this.victoryHopTween.stop();
    this.victoryHopTween = undefined;
    this.front.container.setY(this.victoryHopBaseY);
  }

  private applyContainerScale(state: RuntimeLayerState, sceneScale: number, facingLeft: boolean): void {
    const presetScale = state.preset.scale || RIG_AUTHORING_SCALE;
    const multiplier = sceneScale / RIG_AUTHORING_SCALE;
    const finalScale = presetScale * multiplier;
    state.container.setScale(facingLeft ? -finalScale : finalScale, finalScale);
  }
}
