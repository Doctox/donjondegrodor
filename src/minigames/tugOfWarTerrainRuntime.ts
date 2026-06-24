import Phaser from "phaser";
import { RiggedGrodorActor, preloadRiggedGrodorActorAssets } from "../actors/RiggedGrodorActor";
import { IMAGE_ASSETS, JSON_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import {
  HURT_RIG_PROJECT_SAVE_PATH,
  RIG_AUTHORING_SCALE,
  RIG_CANVAS_HEIGHT,
  RIG_CANVAS_WIDTH,
  SIDE_RIG_LAYERS,
  SIDE_RIG_PATH,
  SIDE_RIG_PIVOTS,
  VICTORY_RIG_PROJECT_SAVE_PATH,
  WALK_POSE_COUNT
} from "../rig/grodorRigDefinitions";
import type { GrodorRigPresetInput } from "../rig/grodorRig";
import { emptyRigLayerAdjustment, type GrodorRigLayerAdjustment } from "../rig/grodorRig";
import { getRigLayerBaseTransform, rigLayerAssetKey, rigLayerAssetPath } from "../rig/grodorRigEditorHelpers";
import { assetPath } from "../utils/assetPath";
import type { TugOfWarSandboxSnapshot } from "./tugOfWarSandboxGameplay";

type TerrainLayerId = string;

type TerrainLayerDefinition = {
  id: TerrainLayerId;
  label: string;
  key: string;
  path: string;
  defaultX: number;
  defaultY: number;
  defaultWidth: number;
  defaultHeight: number;
  defaultVisible: boolean;
};

type LayerOffset = {
  x: number;
  y: number;
};

type LayerSize = {
  scaleX: number;
  scaleY: number;
  rotation: number;
};

type TerrainSave = {
  version: 1;
  layers: TerrainLayerDefinition[];
  layerOrder: TerrainLayerId[];
  offsets: Record<TerrainLayerId, LayerOffset>;
  sizes: Record<TerrainLayerId, LayerSize>;
  visibility: Record<TerrainLayerId, boolean>;
};

type SimpleRigLayerDefinition = {
  id: string;
  key: string;
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type RigLayerAdjustment = {
  offset: LayerOffset;
  size: LayerSize;
};

type GrodorTugSave = {
  layerOrder?: string[];
  lockedWalkFrame?: number | null;
  offsets?: Record<string, LayerOffset>;
  sizeAdjustments?: Record<string, LayerSize>;
  poseAdjustments?: Array<Record<string, RigLayerAdjustment>>;
  visibility?: Record<string, boolean>;
};

type BossTugSave = {
  layerOrder?: string[];
  lockedPose?: number | null;
  offsets?: Record<string, LayerOffset>;
  sizes?: Record<string, LayerSize>;
  poseAdjustments?: Array<Record<string, RigLayerAdjustment>>;
  visibility?: Record<string, boolean>;
  poseVisibility?: Array<Record<string, boolean>>;
};

const TUG_GRODOR_OUTCOME_KEY_PREFIX = "tug-of-war-outcome-grodor";
const TUG_GRODOR_LAYER_ID = "grodor_tug";
const TUG_GRODOR_FRONT_ARM_LAYER_ID = "grodor_tug_front_arm";
const TUG_GRODOR_VICTORY_LAYER_ID = "grodor_victory";
const TUG_GRODOR_HURT_LAYER_ID = "grodor_hurt";
const TUG_GRODOR_FRONT_ARM_IDS = new Set(["arm_front_upper", "arm_front_forearm", "hand_front", "glove_front"]);
const TUG_BOSS_LAYER_ID = "boss_tug";
const TUG_BOSS_FRONT_ARM_LAYER_ID = "boss_tug_front_arm";
const TUG_BOSS_FRONT_ARM_IDS = new Set(["bras_front"]);
const TUG_BOSS_LOOSE_LAYER_ID = "bossLoose";
const TUG_ROPE_LAYER_ID = "tugRope";
const TUG_FLAG_LAYER_ID = "tugFlag";
const TUG_TERRAIN_BACKGROUND_TEXTURE_KEY = "rig-mj-tug-terrain-background";
const TUG_TERRAIN_ROPE_TEXTURE_KEY = "rig-mj-tug-terrain-rope";
const TUG_TERRAIN_FLAG_TEXTURE_KEY = "rig-mj-tug-terrain-flag";
const TUG_TERRAIN_BOSS_LOOSE_TEXTURE_KEY = "rig-mj-tug-terrain-boss-loose";
const TUG_ROPE_RUNTIME_Y_OFFSET = -18;

const BOSS_RIG_STAGE_X = WORLD_WIDTH / 2;
const BOSS_RIG_STAGE_Y = 610;
const BOSS_RIG_POSE_COUNT = 4;
const BOSS_RIG_FRAME_SEQUENCE = [0, 1, 2, 3, 2, 1, 0] as const;
const BOSS_TUG_KEY_PREFIX = "tug-of-war-boss";
const TUG_GRODOR_KEY_PREFIX = "tug-of-war-grodor";
const TUG_GRODOR_PULL_SEQUENCE = [1, 2, 3, 4, 3, 2, 1] as const;
const TUG_GRODOR_OUTCOME_IDLE_SCALE = 0.21;
const TUG_GRODOR_OUTCOME_SIDE_SCALE = 0.265;

const BOSS_LAYERS: readonly SimpleRigLayerDefinition[] = [
  {
    id: "dos",
    key: `${BOSS_TUG_KEY_PREFIX}-dos`,
    path: "/assets/minigames/tug_of_war/boss/dos.png",
    x: BOSS_RIG_STAGE_X + 134,
    y: BOSS_RIG_STAGE_Y - 170,
    width: 336,
    height: 245
  },
  {
    id: "bas_du_corp",
    key: `${BOSS_TUG_KEY_PREFIX}-bas-du-corp`,
    path: "/assets/minigames/tug_of_war/boss/bas_du_corp.png",
    x: BOSS_RIG_STAGE_X + 36,
    y: BOSS_RIG_STAGE_Y + 172,
    width: 522,
    height: 580
  },
  {
    id: "haut_du_corp",
    key: `${BOSS_TUG_KEY_PREFIX}-haut-du-corp`,
    path: "/assets/minigames/tug_of_war/boss/haut_du_corp.png",
    x: BOSS_RIG_STAGE_X - 14,
    y: BOSS_RIG_STAGE_Y - 118,
    width: 416,
    height: 550
  },
  {
    id: "bras_back",
    key: `${BOSS_TUG_KEY_PREFIX}-bras-back`,
    path: "/assets/minigames/tug_of_war/boss/bras_back.png",
    x: BOSS_RIG_STAGE_X + 250,
    y: BOSS_RIG_STAGE_Y - 30,
    width: 303,
    height: 271
  },
  {
    id: "bras_front",
    key: `${BOSS_TUG_KEY_PREFIX}-bras-front`,
    path: "/assets/minigames/tug_of_war/boss/bras_front.png",
    x: BOSS_RIG_STAGE_X - 270,
    y: BOSS_RIG_STAGE_Y - 34,
    width: 498,
    height: 349
  }
];

function defaultTerrainSave(): TerrainSave {
  return {
    version: 1,
    layers: [
      {
        id: "background",
        label: "Background",
        key: IMAGE_ASSETS.tugOfWarBackground.key,
        path: IMAGE_ASSETS.tugOfWarBackground.path,
        defaultX: 960,
        defaultY: 604,
        defaultWidth: 1540,
        defaultHeight: 867,
        defaultVisible: true
      },
      {
        id: TUG_GRODOR_LAYER_ID,
        label: "Grodor anime",
        key: "",
        path: "",
        defaultX: 320,
        defaultY: 890,
        defaultWidth: 320,
        defaultHeight: 460,
        defaultVisible: true
      },
      {
        id: TUG_ROPE_LAYER_ID,
        label: "Corde base",
        key: IMAGE_ASSETS.tugOfWarRope.key,
        path: IMAGE_ASSETS.tugOfWarRope.path,
        defaultX: 960,
        defaultY: 874,
        defaultWidth: 1420,
        defaultHeight: 106,
        defaultVisible: true
      },
      {
        id: TUG_FLAG_LAYER_ID,
        label: "Fanion corde",
        key: IMAGE_ASSETS.tugOfWarFlag.key,
        path: IMAGE_ASSETS.tugOfWarFlag.path,
        defaultX: 960,
        defaultY: 806,
        defaultWidth: 92,
        defaultHeight: 116,
        defaultVisible: true
      },
      {
        id: TUG_BOSS_LAYER_ID,
        label: "Boss anime",
        key: "",
        path: "",
        defaultX: 1580,
        defaultY: 814,
        defaultWidth: 390,
        defaultHeight: 520,
        defaultVisible: true
      },
      {
        id: TUG_BOSS_LOOSE_LAYER_ID,
        label: "Boss loose",
        key: IMAGE_ASSETS.tugOfWarBossLoose.key,
        path: IMAGE_ASSETS.tugOfWarBossLoose.path,
        defaultX: 1580,
        defaultY: 822,
        defaultWidth: 310,
        defaultHeight: 568,
        defaultVisible: true
      }
    ],
    layerOrder: ["background", TUG_BOSS_LAYER_ID, TUG_GRODOR_LAYER_ID, TUG_ROPE_LAYER_ID, TUG_FLAG_LAYER_ID, TUG_BOSS_LOOSE_LAYER_ID],
    offsets: {},
    sizes: {},
    visibility: {}
  };
}

export function preloadTugOfWarTerrainRuntimeAssets(scene: Phaser.Scene): void {
  queueImageIfMissing(scene, IMAGE_ASSETS.tugOfWarBackground.key, IMAGE_ASSETS.tugOfWarBackground.path);
  queueImageIfMissing(scene, IMAGE_ASSETS.tugOfWarRope.key, IMAGE_ASSETS.tugOfWarRope.path);
  queueImageIfMissing(scene, IMAGE_ASSETS.tugOfWarFlag.key, IMAGE_ASSETS.tugOfWarFlag.path);
  queueImageIfMissing(scene, IMAGE_ASSETS.tugOfWarBossLoose.key, IMAGE_ASSETS.tugOfWarBossLoose.path);
  queueImageIfMissing(scene, TUG_TERRAIN_BACKGROUND_TEXTURE_KEY, IMAGE_ASSETS.tugOfWarBackground.path);
  queueImageIfMissing(scene, TUG_TERRAIN_ROPE_TEXTURE_KEY, IMAGE_ASSETS.tugOfWarRope.path);
  queueImageIfMissing(scene, TUG_TERRAIN_FLAG_TEXTURE_KEY, IMAGE_ASSETS.tugOfWarFlag.path);
  queueImageIfMissing(scene, TUG_TERRAIN_BOSS_LOOSE_TEXTURE_KEY, IMAGE_ASSETS.tugOfWarBossLoose.path);
  scene.load.json(JSON_ASSETS.tugOfWarTerrain.key, JSON_ASSETS.tugOfWarTerrain.path);
  scene.load.json(JSON_ASSETS.tugOfWarGrodor.key, JSON_ASSETS.tugOfWarGrodor.path);
  scene.load.json(JSON_ASSETS.tugOfWarBoss.key, JSON_ASSETS.tugOfWarBoss.path);
  preloadRiggedGrodorActorAssets(scene, TUG_GRODOR_OUTCOME_KEY_PREFIX);
  SIDE_RIG_LAYERS.forEach((layer) => {
    scene.load.image(rigLayerAssetKey(TUG_GRODOR_KEY_PREFIX, layer), assetPath(rigLayerAssetPath(SIDE_RIG_PATH, layer)));
  });
  BOSS_LAYERS.forEach((layer) => {
    scene.load.image(layer.key, assetPath(layer.path));
  });
}

export function areTugOfWarTerrainTexturesReady(scene: Phaser.Scene): boolean {
  return (
    scene.textures.exists(TUG_TERRAIN_BACKGROUND_TEXTURE_KEY) &&
    scene.textures.exists(TUG_TERRAIN_ROPE_TEXTURE_KEY) &&
    scene.textures.exists(TUG_TERRAIN_FLAG_TEXTURE_KEY) &&
    scene.textures.exists(TUG_TERRAIN_BOSS_LOOSE_TEXTURE_KEY)
  );
}

function queueImageIfMissing(scene: Phaser.Scene, key: string, path: string): void {
  if (!scene.textures.exists(key)) {
    scene.load.image(key, path);
  }
}

export class TugOfWarTerrainRuntime {
  private readonly save: TerrainSave;
  private readonly layerDefinitions = new Map<TerrainLayerId, TerrainLayerDefinition>();
  private readonly layerImages = new Map<TerrainLayerId, Phaser.GameObjects.Image>();
  private readonly grodorImages = new Map<string, Phaser.GameObjects.Image>();
  private readonly grodorFrontArmImages = new Map<string, Phaser.GameObjects.Image>();
  private readonly grodorBasePositions = new Map<string, LayerOffset>();
  private readonly grodorBaseScales = new Map<string, { x: number; y: number }>();
  private readonly bossImages = new Map<string, Phaser.GameObjects.Image>();
  private readonly bossFrontArmImages = new Map<string, Phaser.GameObjects.Image>();
  private readonly grodorPoseAdjustments = Array.from({ length: WALK_POSE_COUNT }, () =>
    SIDE_RIG_LAYERS.reduce(
      (adjustments, layer) => ({
        ...adjustments,
        [layer.id]: emptyRigLayerAdjustment()
      }),
      {} as Record<string, RigLayerAdjustment>
    )
  );
  private readonly bossPoseAdjustments = Array.from({ length: BOSS_RIG_POSE_COUNT }, () =>
    BOSS_LAYERS.reduce(
      (adjustments, layer) => ({
        ...adjustments,
        [layer.id]: emptyRigLayerAdjustment()
      }),
      {} as Record<string, RigLayerAdjustment>
    )
  );
  private grodorLayerOrder = SIDE_RIG_LAYERS.map((layer) => layer.id);
  private readonly grodorOffsets = SIDE_RIG_LAYERS.reduce(
    (offsets, layer) => ({
      ...offsets,
      [layer.id]: { x: 0, y: 0 }
    }),
    {} as Record<string, LayerOffset>
  );
  private readonly grodorSizeAdjustments = SIDE_RIG_LAYERS.reduce(
    (sizes, layer) => ({
      ...sizes,
      [layer.id]: { scaleX: 1, scaleY: 1, rotation: 0 }
    }),
    {} as Record<string, LayerSize>
  );
  private readonly grodorVisibility = SIDE_RIG_LAYERS.reduce(
    (visibility, layer) => ({
      ...visibility,
      [layer.id]: true
    }),
    {} as Record<string, boolean>
  );
  private bossLayerOrder = BOSS_LAYERS.map((layer) => layer.id);
  private readonly bossOffsets = BOSS_LAYERS.reduce(
    (offsets, layer) => ({
      ...offsets,
      [layer.id]: { x: 0, y: 0 }
    }),
    {} as Record<string, LayerOffset>
  );
  private readonly bossSizeAdjustments = BOSS_LAYERS.reduce(
    (sizes, layer) => ({
      ...sizes,
      [layer.id]: { scaleX: 1, scaleY: 1, rotation: 0 }
    }),
    {} as Record<string, LayerSize>
  );
  private readonly bossVisibility = BOSS_LAYERS.reduce(
    (visibility, layer) => ({
      ...visibility,
      [layer.id]: true
    }),
    {} as Record<string, boolean>
  );
  private readonly bossPoseVisibility = Array.from({ length: BOSS_RIG_POSE_COUNT }, () =>
    BOSS_LAYERS.reduce(
      (visibility, layer) => ({
        ...visibility,
        [layer.id]: true
      }),
      {} as Record<string, boolean>
    )
  );
  private readonly offsets: Record<TerrainLayerId, LayerOffset>;
  private readonly sizes: Record<TerrainLayerId, LayerSize>;
  private readonly visibility: Record<TerrainLayerId, boolean>;
  private readonly layerOrder: TerrainLayerId[];
  private grodorIdleFrame = 0;
  private bossIdleFrame = 0;
  private grodorContainer?: Phaser.GameObjects.Container;
  private grodorFrontArmContainer?: Phaser.GameObjects.Container;
  private bossContainer?: Phaser.GameObjects.Container;
  private bossFrontArmContainer?: Phaser.GameObjects.Container;
  private grodorOutcomeActor?: RiggedGrodorActor;
  private lastOutcomePhase?: "won" | "lost";
  private lastOutcomeTransform?: {
    phase: "won" | "lost";
    x: number;
    y: number;
    idleScale: number;
    walkScale: number;
    rotation: number;
  };
  private grodorActionUntilMs = 0;
  private bossActionUntilMs = 0;

  constructor(private readonly scene: Phaser.Scene, depth = 3) {
    this.save = this.normalizeSave(scene.cache.json.get(JSON_ASSETS.tugOfWarTerrain.key));
    this.layerOrder = [...this.save.layerOrder];
    this.offsets = { ...this.save.offsets };
    this.sizes = { ...this.save.sizes };
    this.visibility = { ...this.save.visibility };
    this.save.layers.forEach((layer) => this.layerDefinitions.set(layer.id, layer));
    this.applyGrodorTugSave(scene.cache.json.get(JSON_ASSETS.tugOfWarGrodor.key));
    this.applyBossTugSave(scene.cache.json.get(JSON_ASSETS.tugOfWarBoss.key));
    this.createLayers(depth);
    void this.applyOutcomePresets();
  }

  update(timeSeconds: number, snapshot: TugOfWarSandboxSnapshot): void {
    this.refreshGrodorLayer(timeSeconds);
    this.refreshBossLayer(timeSeconds, snapshot);
    this.grodorOutcomeActor?.update(timeSeconds);
    this.applyTugOffset(snapshot);
    this.applyOutcomeVisibility(snapshot);
  }

  registerHitFeedback(): void {
    this.grodorActionUntilMs = this.scene.time.now + 520;
  }

  registerBossPullFeedback(): void {
    this.bossActionUntilMs = this.scene.time.now + 560;
  }

  destroy(): void {
    this.grodorOutcomeActor?.destroy();
    this.layerImages.forEach((image) => image.destroy());
    this.grodorContainer?.destroy(true);
    this.grodorFrontArmContainer?.destroy(true);
    this.bossContainer?.destroy(true);
    this.bossFrontArmContainer?.destroy(true);
  }

  private normalizeSave(raw: unknown): TerrainSave {
    const fallback = defaultTerrainSave();
    const save = raw && typeof raw === "object" ? (raw as Partial<TerrainSave>) : fallback;
    const layers = Array.isArray(save.layers) && save.layers.length > 0 ? save.layers : fallback.layers;
    const layerOrder = Array.isArray(save.layerOrder) && save.layerOrder.length > 0 ? save.layerOrder : fallback.layerOrder;
    const offsets = save.offsets ?? {};
    const sizes = save.sizes ?? {};
    const visibility = save.visibility ?? {};

    layers.forEach((layer) => {
      offsets[layer.id] ??= { x: 0, y: 0 };
      sizes[layer.id] ??= { scaleX: 1, scaleY: 1, rotation: 0 };
      visibility[layer.id] ??= layer.defaultVisible;
    });

    return {
      version: 1,
      layers,
      layerOrder,
      offsets,
      sizes,
      visibility
    };
  }

  private applyGrodorTugSave(raw: unknown): void {
    const save = raw && typeof raw === "object" ? (raw as GrodorTugSave) : undefined;
    if (!save) {
      return;
    }

    if (Array.isArray(save.layerOrder)) {
      const nextOrder = save.layerOrder.filter((id) => SIDE_RIG_LAYERS.some((layer) => layer.id === id));
      SIDE_RIG_LAYERS.forEach((layer) => {
        if (!nextOrder.includes(layer.id)) {
          nextOrder.push(layer.id);
        }
      });
      this.grodorLayerOrder = nextOrder;
    }

    if (typeof save.lockedWalkFrame === "number") {
      this.grodorIdleFrame = Phaser.Math.Clamp(Math.trunc(save.lockedWalkFrame), 0, WALK_POSE_COUNT - 1);
    }

    SIDE_RIG_LAYERS.forEach((layer) => {
      const offset = save.offsets?.[layer.id];
      const size = save.sizeAdjustments?.[layer.id];
      const visible = save.visibility?.[layer.id];
      if (offset) {
        this.grodorOffsets[layer.id] = this.normalizeOffset(offset);
      }
      if (size) {
        this.grodorSizeAdjustments[layer.id] = this.normalizeSize(size);
      }
      if (typeof visible === "boolean") {
        this.grodorVisibility[layer.id] = visible;
      }
    });

    save.poseAdjustments?.slice(0, WALK_POSE_COUNT).forEach((pose, poseIndex) => {
      SIDE_RIG_LAYERS.forEach((layer) => {
        const adjustment = pose?.[layer.id];
        if (adjustment) {
          this.grodorPoseAdjustments[poseIndex][layer.id] = this.normalizeAdjustment(adjustment);
        }
      });
    });
  }

  private applyBossTugSave(raw: unknown): void {
    const save = raw && typeof raw === "object" ? (raw as BossTugSave) : undefined;
    if (!save) {
      return;
    }

    if (Array.isArray(save.layerOrder)) {
      const nextOrder = save.layerOrder.filter((id) => BOSS_LAYERS.some((layer) => layer.id === id));
      BOSS_LAYERS.forEach((layer) => {
        if (!nextOrder.includes(layer.id)) {
          nextOrder.push(layer.id);
        }
      });
      this.bossLayerOrder = nextOrder;
    }

    if (typeof save.lockedPose === "number") {
      this.bossIdleFrame = Phaser.Math.Clamp(Math.trunc(save.lockedPose), 0, BOSS_RIG_POSE_COUNT - 1);
    }

    BOSS_LAYERS.forEach((layer) => {
      const offset = save.offsets?.[layer.id];
      const size = save.sizes?.[layer.id];
      const visible = save.visibility?.[layer.id];
      if (offset) {
        this.bossOffsets[layer.id] = this.normalizeOffset(offset);
      }
      if (size) {
        this.bossSizeAdjustments[layer.id] = this.normalizeSize(size);
      }
      if (typeof visible === "boolean") {
        this.bossVisibility[layer.id] = visible;
      }
    });

    save.poseAdjustments?.slice(0, BOSS_RIG_POSE_COUNT).forEach((pose, poseIndex) => {
      BOSS_LAYERS.forEach((layer) => {
        const adjustment = pose?.[layer.id];
        if (adjustment) {
          this.bossPoseAdjustments[poseIndex][layer.id] = this.normalizeAdjustment(adjustment);
        }
      });
    });

    save.poseVisibility?.slice(0, BOSS_RIG_POSE_COUNT).forEach((pose, poseIndex) => {
      BOSS_LAYERS.forEach((layer) => {
        const visible = pose?.[layer.id];
        if (typeof visible === "boolean") {
          this.bossPoseVisibility[poseIndex][layer.id] = visible;
        }
      });
    });
  }

  private normalizeOffset(offset: LayerOffset): LayerOffset {
    return {
      x: Number(offset.x) || 0,
      y: Number(offset.y) || 0
    };
  }

  private normalizeSize(size: LayerSize): LayerSize {
    return {
      scaleX: Math.max(0.05, Number(size.scaleX) || 1),
      scaleY: Math.max(0.05, Number(size.scaleY) || 1),
      rotation: Number(size.rotation) || 0
    };
  }

  private normalizeAdjustment(adjustment: RigLayerAdjustment): RigLayerAdjustment {
    return {
      offset: this.normalizeOffset(adjustment.offset ?? { x: 0, y: 0 }),
      size: this.normalizeSize(adjustment.size ?? { scaleX: 1, scaleY: 1, rotation: 0 })
    };
  }

  private createLayers(baseDepth: number): void {
    this.layerOrder.forEach((layerId, index) => {
      const layer = this.layerById(layerId);
      if (layerId === TUG_GRODOR_LAYER_ID) {
        this.createGrodorContainer(layer, baseDepth + index);
        return;
      }
      if (layerId === TUG_GRODOR_FRONT_ARM_LAYER_ID) {
        this.createGrodorFrontArmContainer(layer, baseDepth + index);
        return;
      }
      if (layerId === TUG_BOSS_LAYER_ID) {
        this.createBossContainer(layer, baseDepth + index);
        return;
      }
      if (layerId === TUG_BOSS_FRONT_ARM_LAYER_ID) {
        this.createBossFrontArmContainer(layer, baseDepth + index);
        return;
      }
      if (!layer.key || !this.scene.textures.exists(layer.key)) {
        return;
      }

      const offset = this.offsets[layerId] ?? { x: 0, y: 0 };
      const size = this.sizes[layerId] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
      const isBackground = layerId === "background";
      const imageX = isBackground ? WORLD_WIDTH / 2 : layer.defaultX + offset.x;
      const imageY = isBackground ? WORLD_HEIGHT / 2 : layer.defaultY + offset.y + this.staticLayerRuntimeYOffset(layerId);
      const imageWidth = isBackground ? WORLD_WIDTH : layer.defaultWidth * size.scaleX;
      const imageHeight = isBackground ? WORLD_HEIGHT : layer.defaultHeight * size.scaleY;
      const image = this.scene.add
        .image(imageX, imageY, layer.key)
        .setDisplaySize(imageWidth, imageHeight)
        .setRotation(Phaser.Math.DegToRad(size.rotation))
        .setVisible(this.visibility[layerId] ?? layer.defaultVisible)
        .setDepth(baseDepth + index);
      this.layerImages.set(layerId, image);
    });

    this.createOutcomeActor(baseDepth + this.layerOrder.length + 1);
  }

  private createGrodorContainer(layer: TerrainLayerDefinition, depth: number): void {
    const offset = this.offsets[layer.id] ?? { x: 0, y: 0 };
    const size = this.sizes[layer.id] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
    const container = this.scene.add
      .container(layer.defaultX + offset.x, layer.defaultY + offset.y)
      .setScale(0.34 * RIG_AUTHORING_SCALE * size.scaleX, 0.34 * RIG_AUTHORING_SCALE * size.scaleY)
      .setRotation(Phaser.Math.DegToRad(size.rotation))
      .setVisible(this.visibility[layer.id] ?? layer.defaultVisible)
      .setDepth(depth);
    this.grodorContainer = container;
    this.grodorLayerOrder
      .filter((layerId) => !TUG_GRODOR_FRONT_ARM_IDS.has(layerId))
      .map((layerId) => this.grodorRigLayerById(layerId))
      .filter((rigLayer): rigLayer is (typeof SIDE_RIG_LAYERS)[number] => Boolean(rigLayer))
      .forEach((rigLayer) => {
        const image = this.createGrodorLayerImage(rigLayer);
        this.grodorImages.set(rigLayer.id, image);
        container.add(image);
      });
  }

  private createGrodorFrontArmContainer(layer: TerrainLayerDefinition, depth: number): void {
    const parentLayer = this.layerById(TUG_GRODOR_LAYER_ID);
    const offset = this.offsets[TUG_GRODOR_LAYER_ID] ?? { x: 0, y: 0 };
    const size = this.sizes[TUG_GRODOR_LAYER_ID] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
    const container = this.scene.add
      .container(parentLayer.defaultX + offset.x, parentLayer.defaultY + offset.y)
      .setScale(0.34 * RIG_AUTHORING_SCALE * size.scaleX, 0.34 * RIG_AUTHORING_SCALE * size.scaleY)
      .setRotation(Phaser.Math.DegToRad(size.rotation))
      .setVisible((this.visibility[layer.id] ?? layer.defaultVisible) && (this.visibility[TUG_GRODOR_LAYER_ID] ?? true))
      .setDepth(depth);
    this.grodorFrontArmContainer = container;
    this.grodorLayerOrder
      .filter((layerId) => TUG_GRODOR_FRONT_ARM_IDS.has(layerId))
      .map((layerId) => this.grodorRigLayerById(layerId))
      .filter((rigLayer): rigLayer is (typeof SIDE_RIG_LAYERS)[number] => Boolean(rigLayer))
      .forEach((rigLayer) => {
        const image = this.createGrodorLayerImage(rigLayer);
        this.grodorFrontArmImages.set(rigLayer.id, image);
        container.add(image);
      });
  }

  private createGrodorLayerImage(layer: (typeof SIDE_RIG_LAYERS)[number]): Phaser.GameObjects.Image {
    const transform = getRigLayerBaseTransform(layer, SIDE_RIG_PIVOTS, RIG_CANVAS_WIDTH, RIG_CANVAS_HEIGHT);
    this.grodorBasePositions.set(layer.id, { x: transform.basePosition.x, y: transform.basePosition.y });
    this.grodorBaseScales.set(layer.id, { x: transform.baseScale.x, y: transform.baseScale.y });
    return this.scene.add
      .image(transform.basePosition.x, transform.basePosition.y, rigLayerAssetKey(TUG_GRODOR_KEY_PREFIX, layer))
      .setOrigin(transform.pivot.x / transform.canvas.width, transform.pivot.y / transform.canvas.height)
      .setScale(transform.baseScale.x, transform.baseScale.y)
      .setVisible(this.grodorVisibility[layer.id] && layer.kind !== "stuff");
  }

  private createBossContainer(layer: TerrainLayerDefinition, depth: number): void {
    const offset = this.offsets[layer.id] ?? { x: 0, y: 0 };
    const size = this.sizes[layer.id] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
    const container = this.scene.add
      .container(layer.defaultX + offset.x, layer.defaultY + offset.y)
      .setScale(0.46 * size.scaleX, 0.46 * size.scaleY)
      .setRotation(Phaser.Math.DegToRad(size.rotation))
      .setVisible(this.visibility[layer.id] ?? layer.defaultVisible)
      .setDepth(depth);
    this.bossContainer = container;
    this.bossLayerOrder
      .filter((layerId) => !TUG_BOSS_FRONT_ARM_IDS.has(layerId))
      .map((layerId) => this.bossRigLayerById(layerId))
      .filter((rigLayer): rigLayer is SimpleRigLayerDefinition => Boolean(rigLayer))
      .forEach((rigLayer) => {
        const image = this.createBossLayerImage(rigLayer);
        this.bossImages.set(rigLayer.id, image);
        container.add(image);
      });
  }

  private createBossFrontArmContainer(layer: TerrainLayerDefinition, depth: number): void {
    const bossLayer = this.layerById(TUG_BOSS_LAYER_ID);
    const offset = this.offsets[TUG_BOSS_LAYER_ID] ?? { x: 0, y: 0 };
    const size = this.sizes[TUG_BOSS_LAYER_ID] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
    const container = this.scene.add
      .container(bossLayer.defaultX + offset.x, bossLayer.defaultY + offset.y)
      .setScale(0.46 * size.scaleX, 0.46 * size.scaleY)
      .setRotation(Phaser.Math.DegToRad(size.rotation))
      .setVisible((this.visibility[layer.id] ?? layer.defaultVisible) && (this.visibility[TUG_BOSS_LAYER_ID] ?? true))
      .setDepth(depth);
    this.bossFrontArmContainer = container;
    this.bossLayerOrder
      .filter((layerId) => TUG_BOSS_FRONT_ARM_IDS.has(layerId))
      .map((layerId) => this.bossRigLayerById(layerId))
      .filter((rigLayer): rigLayer is SimpleRigLayerDefinition => Boolean(rigLayer))
      .forEach((rigLayer) => {
        const image = this.createBossLayerImage(rigLayer);
        this.bossFrontArmImages.set(rigLayer.id, image);
        container.add(image);
      });
  }

  private createBossLayerImage(layer: SimpleRigLayerDefinition): Phaser.GameObjects.Image {
    return this.scene.add.image(layer.x - BOSS_RIG_STAGE_X, layer.y - BOSS_RIG_STAGE_Y, layer.key).setDisplaySize(layer.width, layer.height);
  }

  private createOutcomeActor(depth: number): void {
    const layer = this.layerById(TUG_GRODOR_VICTORY_LAYER_ID);
    const offset = this.offsets[TUG_GRODOR_VICTORY_LAYER_ID] ?? { x: 0, y: 0 };
    this.grodorOutcomeActor = new RiggedGrodorActor(
      this.scene,
      {
        x: layer.defaultX + offset.x,
        y: layer.defaultY + offset.y,
        depth,
        idleScale: TUG_GRODOR_OUTCOME_IDLE_SCALE,
        walkScale: TUG_GRODOR_OUTCOME_SIDE_SCALE
      },
      TUG_GRODOR_OUTCOME_KEY_PREFIX
    );
    this.grodorOutcomeActor.setEquipment([]);
    this.grodorOutcomeActor.container.setVisible(false);
  }

  private async applyOutcomePresets(): Promise<void> {
    const [victoryPreset, hurtPreset] = await Promise.all([
      this.fetchRigPreset(VICTORY_RIG_PROJECT_SAVE_PATH),
      this.fetchRigPreset(HURT_RIG_PROJECT_SAVE_PATH)
    ]);
    if (victoryPreset) {
      this.grodorOutcomeActor?.applyVictoryPreset(victoryPreset);
    }
    if (hurtPreset) {
      this.grodorOutcomeActor?.applyHurtPreset(hurtPreset);
    }
  }

  private async fetchRigPreset(path: string): Promise<GrodorRigPresetInput | null> {
    try {
      const response = await fetch(assetPath(path));
      if (!response.ok) {
        return null;
      }
      return (await response.json()) as GrodorRigPresetInput;
    } catch {
      return null;
    }
  }

  private refreshGrodorLayer(time: number): void {
    const { fromFrame, toFrame, amount } = this.scene.time.now < this.grodorActionUntilMs
      ? this.sequencePoseBlend(TUG_GRODOR_PULL_SEQUENCE, time, 8)
      : { fromFrame: this.grodorIdleFrame, toFrame: this.grodorIdleFrame, amount: 0 };

    SIDE_RIG_LAYERS.forEach((layer) => {
      const image = TUG_GRODOR_FRONT_ARM_IDS.has(layer.id) ? this.grodorFrontArmImages.get(layer.id) : this.grodorImages.get(layer.id);
      if (!image) {
        return;
      }
      const base = this.grodorBasePositions.get(layer.id) ?? { x: 0, y: 0 };
      const baseScale = this.grodorBaseScales.get(layer.id) ?? { x: 1, y: 1 };
      const from = this.grodorPoseAdjustments[fromFrame]?.[layer.id] ?? emptyRigLayerAdjustment();
      const to = this.grodorPoseAdjustments[toFrame]?.[layer.id] ?? emptyRigLayerAdjustment();
      const globalOffset = this.grodorOffsets[layer.id] ?? { x: 0, y: 0 };
      const globalSize = this.grodorSizeAdjustments[layer.id] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
      const poseOffset = {
        x: Phaser.Math.Linear(from.offset.x, to.offset.x, amount),
        y: Phaser.Math.Linear(from.offset.y, to.offset.y, amount)
      };
      const poseSize = {
        scaleX: Phaser.Math.Linear(from.size.scaleX, to.size.scaleX, amount),
        scaleY: Phaser.Math.Linear(from.size.scaleY, to.size.scaleY, amount),
        rotation: from.size.rotation + Phaser.Math.Angle.ShortestBetween(from.size.rotation, to.size.rotation) * amount
      };

      image
        .setPosition(base.x + globalOffset.x + poseOffset.x, base.y + globalOffset.y + poseOffset.y)
        .setScale(baseScale.x * globalSize.scaleX * poseSize.scaleX, baseScale.y * globalSize.scaleY * poseSize.scaleY)
        .setRotation(Phaser.Math.DegToRad(globalSize.rotation + poseSize.rotation))
        .setVisible(this.grodorVisibility[layer.id] && layer.kind !== "stuff");
    });
  }

  private refreshBossLayer(time: number, snapshot: TugOfWarSandboxSnapshot): void {
    const { fromFrame, toFrame, amount } =
      snapshot.phase === "playing" && this.scene.time.now < this.bossActionUntilMs
        ? this.sequencePoseBlend(BOSS_RIG_FRAME_SEQUENCE, time, 7.4)
        : { fromFrame: this.bossIdleFrame, toFrame: this.bossIdleFrame, amount: 0 };

    BOSS_LAYERS.forEach((layer) => {
      const image = TUG_BOSS_FRONT_ARM_IDS.has(layer.id) ? this.bossFrontArmImages.get(layer.id) : this.bossImages.get(layer.id);
      if (!image) {
        return;
      }
      const from = this.bossPoseAdjustments[fromFrame]?.[layer.id] ?? emptyRigLayerAdjustment();
      const to = this.bossPoseAdjustments[toFrame]?.[layer.id] ?? emptyRigLayerAdjustment();
      const globalOffset = this.bossOffsets[layer.id] ?? { x: 0, y: 0 };
      const globalSize = this.bossSizeAdjustments[layer.id] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
      const poseVisible = this.bossPoseVisibility[fromFrame]?.[layer.id] ?? true;
      const poseOffset = {
        x: Phaser.Math.Linear(from.offset.x, to.offset.x, amount),
        y: Phaser.Math.Linear(from.offset.y, to.offset.y, amount)
      };
      const poseSize = {
        scaleX: Phaser.Math.Linear(from.size.scaleX, to.size.scaleX, amount),
        scaleY: Phaser.Math.Linear(from.size.scaleY, to.size.scaleY, amount),
        rotation: from.size.rotation + Phaser.Math.Angle.ShortestBetween(from.size.rotation, to.size.rotation) * amount
      };

      image
        .setPosition(layer.x - BOSS_RIG_STAGE_X + globalOffset.x + poseOffset.x, layer.y - BOSS_RIG_STAGE_Y + globalOffset.y + poseOffset.y)
        .setDisplaySize(layer.width * globalSize.scaleX * poseSize.scaleX, layer.height * globalSize.scaleY * poseSize.scaleY)
        .setRotation(Phaser.Math.DegToRad(globalSize.rotation + poseSize.rotation))
        .setVisible(this.bossVisibility[layer.id] && poseVisible);
    });
  }

  private applyTugOffset(snapshot: TugOfWarSandboxSnapshot): void {
    const ropeShift = -snapshot.normalizedTension * 260;
    const grodorShift = snapshot.normalizedTension >= 0 ? ropeShift * 0.24 : ropeShift * 0.7;
    const bossShift = snapshot.normalizedTension >= 0 ? ropeShift * 0.7 : ropeShift * 0.24;
    this.applyStaticLayerX(TUG_ROPE_LAYER_ID, ropeShift);
    this.applyStaticLayerX(TUG_FLAG_LAYER_ID, ropeShift);
    this.applyStaticLayerX(TUG_BOSS_LOOSE_LAYER_ID, bossShift);
    this.applyContainerX(TUG_GRODOR_LAYER_ID, this.grodorContainer, grodorShift);
    this.applyContainerX(TUG_GRODOR_LAYER_ID, this.grodorFrontArmContainer, grodorShift);
    this.applyContainerX(TUG_BOSS_LAYER_ID, this.bossContainer, bossShift);
    this.applyContainerX(TUG_BOSS_LAYER_ID, this.bossFrontArmContainer, bossShift);
    this.refreshOutcomeActorTransform(snapshot);
  }

  private applyOutcomeVisibility(snapshot: TugOfWarSandboxSnapshot): void {
    const bossLooseVisible = snapshot.phase === "won";
    const grodorOutcomeVisible = snapshot.phase === "won" || snapshot.phase === "lost";
    this.layerImages.get(TUG_BOSS_LOOSE_LAYER_ID)?.setVisible(bossLooseVisible);
    this.grodorOutcomeActor?.container.setVisible(grodorOutcomeVisible);
    this.grodorContainer?.setVisible(!grodorOutcomeVisible && (this.visibility[TUG_GRODOR_LAYER_ID] ?? true));
    this.grodorFrontArmContainer?.setVisible(!grodorOutcomeVisible && (this.visibility[TUG_GRODOR_FRONT_ARM_LAYER_ID] ?? true));
    this.bossContainer?.setVisible(!bossLooseVisible && (this.visibility[TUG_BOSS_LAYER_ID] ?? true));
    this.bossFrontArmContainer?.setVisible(!bossLooseVisible && (this.visibility[TUG_BOSS_FRONT_ARM_LAYER_ID] ?? true));
    if (snapshot.phase === this.lastOutcomePhase) {
      return;
    }
    this.lastOutcomePhase = snapshot.phase === "won" || snapshot.phase === "lost" ? snapshot.phase : undefined;
    if (snapshot.phase === "won") {
      this.grodorOutcomeActor?.playVictory();
    } else if (snapshot.phase === "lost") {
      this.grodorOutcomeActor?.playHurt();
    }
  }

  private refreshOutcomeActorTransform(snapshot: TugOfWarSandboxSnapshot): void {
    if (!this.grodorOutcomeActor || (snapshot.phase !== "won" && snapshot.phase !== "lost")) {
      return;
    }
    const layerId = snapshot.phase === "won" ? TUG_GRODOR_VICTORY_LAYER_ID : TUG_GRODOR_HURT_LAYER_ID;
    const layer = this.layerById(layerId);
    const offset = this.offsets[layerId] ?? { x: 0, y: 0 };
    const size = this.sizes[layerId] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
    const ropeShift = -snapshot.normalizedTension * 260;
    const grodorShift = snapshot.normalizedTension >= 0 ? ropeShift * 0.24 : ropeShift * 0.7;
    const baseScale = snapshot.phase === "won" ? TUG_GRODOR_OUTCOME_IDLE_SCALE : TUG_GRODOR_OUTCOME_SIDE_SCALE;
    const transform = {
      phase: snapshot.phase,
      x: layer.defaultX + offset.x + grodorShift,
      y: layer.defaultY + offset.y,
      idleScale: baseScale * size.scaleX,
      walkScale: baseScale * size.scaleY,
      rotation: Phaser.Math.DegToRad(size.rotation)
    };
    if (
      this.lastOutcomeTransform &&
      this.lastOutcomeTransform.phase === transform.phase &&
      this.lastOutcomeTransform.x === transform.x &&
      this.lastOutcomeTransform.y === transform.y &&
      this.lastOutcomeTransform.idleScale === transform.idleScale &&
      this.lastOutcomeTransform.walkScale === transform.walkScale &&
      this.lastOutcomeTransform.rotation === transform.rotation
    ) {
      return;
    }

    this.lastOutcomeTransform = transform;
    this.grodorOutcomeActor.setPosition(transform.x, transform.y);
    this.grodorOutcomeActor.setSceneScales({ idleScale: transform.idleScale, walkScale: transform.walkScale });
    this.grodorOutcomeActor.container.setRotation(transform.rotation);
  }

  private applyStaticLayerX(layerId: TerrainLayerId, gameplayX: number): void {
    if (layerId === "background") {
      return;
    }
    const layer = this.layerById(layerId);
    const offset = this.offsets[layerId] ?? { x: 0, y: 0 };
    this.layerImages
      .get(layerId)
      ?.setPosition(layer.defaultX + offset.x + gameplayX, layer.defaultY + offset.y + this.staticLayerRuntimeYOffset(layerId));
  }

  private staticLayerRuntimeYOffset(layerId: TerrainLayerId): number {
    return layerId === TUG_ROPE_LAYER_ID || layerId === TUG_FLAG_LAYER_ID ? TUG_ROPE_RUNTIME_Y_OFFSET : 0;
  }

  private applyContainerX(layerId: TerrainLayerId, container: Phaser.GameObjects.Container | undefined, gameplayX: number): void {
    const layer = this.layerById(layerId);
    const offset = this.offsets[layerId] ?? { x: 0, y: 0 };
    container?.setX(layer.defaultX + offset.x + gameplayX);
  }

  private sequencePoseBlend(sequence: readonly number[], time: number, speed: number): { fromFrame: number; toFrame: number; amount: number } {
    const scaled = time * speed;
    const index = Math.floor(scaled) % sequence.length;
    return {
      fromFrame: sequence[index] ?? 0,
      toFrame: sequence[(index + 1) % sequence.length] ?? 0,
      amount: scaled - Math.floor(scaled)
    };
  }

  private layerById(id: TerrainLayerId): TerrainLayerDefinition {
    return this.layerDefinitions.get(id) ?? this.save.layers[0];
  }

  private grodorRigLayerById(id: string): (typeof SIDE_RIG_LAYERS)[number] | undefined {
    return SIDE_RIG_LAYERS.find((layer) => layer.id === id);
  }

  private bossRigLayerById(id: string): SimpleRigLayerDefinition | undefined {
    return BOSS_LAYERS.find((layer) => layer.id === id);
  }
}
