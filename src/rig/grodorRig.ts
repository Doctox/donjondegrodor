export const GRODOR_RIG_PRESET_FORMAT_VERSION = 1;

export type GrodorRigMode = "frontIdle" | "sideWalk" | "sideAttack" | "sideAttack1" | "sideHurt" | "frontVictory";

export type GrodorRigLayerKind = "body" | "stuff";

export type GrodorRigPoint = {
  x: number;
  y: number;
};

export type GrodorRigLayerDefinition = {
  id: string;
  label?: string;
  file: string;
  kind?: GrodorRigLayerKind;
  canvas?: {
    width: number;
    height: number;
  };
  pivot?: GrodorRigPoint;
  basePosition?: GrodorRigPoint;
  baseScale?: number;
  baseScaleY?: number;
};

export type GrodorRigLayerSize = {
  scaleX: number;
  scaleY: number;
  rotation: number;
};

export type GrodorRigLayerAdjustment = {
  offset: GrodorRigPoint;
  size: GrodorRigLayerSize;
};

export type GrodorRigPresetV1 = {
  formatVersion: 1;
  rig: GrodorRigMode;
  scale: number;
  selected?: string;
  selectedGroup?: string[];
  animationEnabled?: boolean;
  secondaryMotionEnabled?: boolean;
  lockedWalkFrame?: number | null;
  layerOrder: string[];
  anchors: Record<string, string>;
  offsets: Record<string, GrodorRigPoint>;
  sizeAdjustments: Record<string, GrodorRigLayerSize>;
  poseAdjustments?: Record<string, GrodorRigLayerAdjustment>[];
  poseVisibility?: Record<string, boolean>[];
  visibility: Record<string, boolean>;
  stuffAdjustments?: Record<
    string,
    GrodorRigLayerAdjustment & {
      visible: boolean;
    }
  >;
};

export type GrodorRigPresetInput = Partial<GrodorRigPresetV1> & {
  formatVersion?: number;
  rig?: GrodorRigMode;
};

export function emptyRigPoint(): GrodorRigPoint {
  return { x: 0, y: 0 };
}

export function emptyRigLayerSize(): GrodorRigLayerSize {
  return { scaleX: 1, scaleY: 1, rotation: 0 };
}

export function emptyRigLayerAdjustment(): GrodorRigLayerAdjustment {
  return {
    offset: emptyRigPoint(),
    size: emptyRigLayerSize()
  };
}

export function cloneRigLayerAdjustment(adjustment?: GrodorRigLayerAdjustment): GrodorRigLayerAdjustment {
  const source = adjustment ?? emptyRigLayerAdjustment();
  return {
    offset: {
      x: source.offset.x,
      y: source.offset.y
    },
    size: {
      scaleX: source.size.scaleX,
      scaleY: source.size.scaleY,
      rotation: source.size.rotation
    }
  };
}

export function copyRigPoseAdjustments(
  poseAdjustments: Record<string, GrodorRigLayerAdjustment>[],
  layers: readonly { id: string }[],
  sourceIndex: number,
  targetIndex: number
): boolean {
  const source = poseAdjustments[sourceIndex];
  const target = poseAdjustments[targetIndex];
  if (!source || !target || sourceIndex === targetIndex) {
    return false;
  }

  layers.forEach((layer) => {
    target[layer.id] = cloneRigLayerAdjustment(source[layer.id]);
  });
  return true;
}

export function rigPoseIndexFromKeyboardEvent(event: KeyboardEvent, poseCount: number): number | null {
  const match = /^(?:Digit|Numpad)(\d)$/.exec(event.code);
  if (!match) {
    return null;
  }

  const index = Number(match[1]) - 1;
  return index >= 0 && index < poseCount ? index : null;
}

export function emptyOffsets(layers: readonly GrodorRigLayerDefinition[]): Record<string, GrodorRigPoint> {
  return layers.reduce(
    (offsets, layer) => ({
      ...offsets,
      [layer.id]: emptyRigPoint()
    }),
    {} as Record<string, GrodorRigPoint>
  );
}

export function emptySizeAdjustments(layers: readonly GrodorRigLayerDefinition[]): Record<string, GrodorRigLayerSize> {
  return layers.reduce(
    (sizes, layer) => ({
      ...sizes,
      [layer.id]: emptyRigLayerSize()
    }),
    {} as Record<string, GrodorRigLayerSize>
  );
}

export function emptyPoseAdjustments(layers: readonly GrodorRigLayerDefinition[], poseCount: number): Record<string, GrodorRigLayerAdjustment>[] {
  return Array.from({ length: poseCount }, () =>
    layers.reduce(
      (adjustments, layer) => ({
        ...adjustments,
        [layer.id]: emptyRigLayerAdjustment()
      }),
      {} as Record<string, GrodorRigLayerAdjustment>
    )
  );
}

export function cleanLayerOrder(layerOrder: readonly string[] | undefined, layers: readonly GrodorRigLayerDefinition[]): string[] {
  const validIds = new Set(layers.map((layer) => layer.id));
  const defaultOrder = layers.map((layer) => layer.id);
  const cleanOrder = (layerOrder ?? []).filter((id) => validIds.has(id));

  defaultOrder.forEach((id) => {
    if (cleanOrder.includes(id)) {
      return;
    }

    const defaultIndex = defaultOrder.indexOf(id);
    const insertBefore = cleanOrder.findIndex((orderedId) => defaultOrder.indexOf(orderedId) > defaultIndex);
    if (insertBefore >= 0) {
      cleanOrder.splice(insertBefore, 0, id);
    } else {
      cleanOrder.push(id);
    }
  });

  return cleanOrder;
}

export function isDefaultLayerAdjustment(adjustment: GrodorRigLayerAdjustment): boolean {
  return (
    adjustment.offset.x === 0 &&
    adjustment.offset.y === 0 &&
    adjustment.size.scaleX === 1 &&
    adjustment.size.scaleY === 1 &&
    adjustment.size.rotation === 0
  );
}

export function lerpLayerAdjustment(
  from: GrodorRigLayerAdjustment,
  to: GrodorRigLayerAdjustment,
  amount: number
): GrodorRigLayerAdjustment {
  const lerp = (a: number, b: number) => a + (b - a) * amount;
  const lerpRotation = (a: number, b: number) => {
    const delta = ((((b - a) % 360) + 540) % 360) - 180;
    return a + delta * amount;
  };
  return {
    offset: {
      x: lerp(from.offset.x, to.offset.x),
      y: lerp(from.offset.y, to.offset.y)
    },
    size: {
      scaleX: lerp(from.size.scaleX, to.size.scaleX),
      scaleY: lerp(from.size.scaleY, to.size.scaleY),
      rotation: lerpRotation(from.size.rotation, to.size.rotation)
    }
  };
}

export function buildStuffAdjustments(
  layers: readonly GrodorRigLayerDefinition[],
  offsets: Record<string, GrodorRigPoint>,
  sizeAdjustments: Record<string, GrodorRigLayerSize>,
  visibility: Record<string, boolean>
): GrodorRigPresetV1["stuffAdjustments"] {
  return layers
    .filter((layer) => layer.kind === "stuff")
    .reduce(
      (state, layer) => ({
        ...state,
        [layer.id]: {
          offset: offsets[layer.id] ?? emptyRigPoint(),
          size: sizeAdjustments[layer.id] ?? emptyRigLayerSize(),
          visible: visibility[layer.id] ?? false
        }
      }),
      {} as NonNullable<GrodorRigPresetV1["stuffAdjustments"]>
    );
}

export function buildRigPresetV1(options: {
  rig: GrodorRigMode;
  scale: number;
  layers: readonly GrodorRigLayerDefinition[];
  selected?: string;
  selectedGroup?: readonly string[];
  animationEnabled?: boolean;
  secondaryMotionEnabled?: boolean;
  lockedWalkFrame?: number | null;
  layerOrder: readonly string[];
  anchors: Record<string, string>;
  offsets: Record<string, GrodorRigPoint>;
  sizeAdjustments: Record<string, GrodorRigLayerSize>;
  poseAdjustments?: Record<string, GrodorRigLayerAdjustment>[];
  poseVisibility?: Record<string, boolean>[];
  visibility: Record<string, boolean>;
}): GrodorRigPresetV1 {
  return {
    formatVersion: GRODOR_RIG_PRESET_FORMAT_VERSION,
    rig: options.rig,
    scale: options.scale,
    selected: options.selected,
    selectedGroup: options.selectedGroup ? [...options.selectedGroup] : undefined,
    animationEnabled: options.animationEnabled,
    secondaryMotionEnabled: options.secondaryMotionEnabled,
    lockedWalkFrame: options.lockedWalkFrame,
    layerOrder: cleanLayerOrder(options.layerOrder, options.layers),
    anchors: { ...options.anchors },
    offsets: { ...options.offsets },
    sizeAdjustments: { ...options.sizeAdjustments },
    poseAdjustments: options.poseAdjustments,
    poseVisibility: options.poseVisibility,
    visibility: { ...options.visibility },
    stuffAdjustments: buildStuffAdjustments(options.layers, options.offsets, options.sizeAdjustments, options.visibility)
  };
}

export function normalizeRigPresetV1(
  raw: GrodorRigPresetInput,
  options: {
    rig: GrodorRigMode;
    scale: number;
    layers: readonly GrodorRigLayerDefinition[];
    anchors: Record<string, string>;
    poseCount?: number;
  }
): GrodorRigPresetV1 {
  const offsets = emptyOffsets(options.layers);
  const sizeAdjustments = emptySizeAdjustments(options.layers);
  const visibility = options.layers.reduce(
    (state, layer) => ({
      ...state,
      [layer.id]: raw.visibility?.[layer.id] ?? true
    }),
    {} as Record<string, boolean>
  );

  options.layers.forEach((layer) => {
    const offset = raw.offsets?.[layer.id];
    if (offset) {
      offsets[layer.id] = { x: offset.x ?? 0, y: offset.y ?? 0 };
    }

    const size = raw.sizeAdjustments?.[layer.id];
    if (size) {
      sizeAdjustments[layer.id] = {
        scaleX: size.scaleX ?? 1,
        scaleY: size.scaleY ?? 1,
        rotation: size.rotation ?? 0
      };
    }
  });

  const poseCount = options.poseCount ?? raw.poseAdjustments?.length ?? 0;
  const poseAdjustments = poseCount > 0 ? emptyPoseAdjustments(options.layers, poseCount) : undefined;
  raw.poseAdjustments?.slice(0, poseCount).forEach((pose, frameIndex) => {
    options.layers.forEach((layer) => {
      const adjustment = pose?.[layer.id];
      if (!adjustment || !poseAdjustments) {
        return;
      }

      poseAdjustments[frameIndex][layer.id] = {
        offset: {
          x: adjustment.offset?.x ?? 0,
          y: adjustment.offset?.y ?? 0
        },
        size: {
          scaleX: adjustment.size?.scaleX ?? 1,
          scaleY: adjustment.size?.scaleY ?? 1,
          rotation: adjustment.size?.rotation ?? 0
        }
      };
    });
  });

  const poseVisibility = poseCount > 0 && raw.poseVisibility
    ? Array.from({ length: poseCount }, (_unused, frameIndex) => ({
        ...visibility,
        ...(raw.poseVisibility?.[frameIndex] ?? {})
      }))
    : undefined;

  return {
    formatVersion: GRODOR_RIG_PRESET_FORMAT_VERSION,
    rig: options.rig,
    scale: raw.scale ?? options.scale,
    selected: raw.selected,
    animationEnabled: raw.animationEnabled,
    secondaryMotionEnabled: raw.secondaryMotionEnabled,
    lockedWalkFrame: typeof raw.lockedWalkFrame === "number" || raw.lockedWalkFrame === null ? raw.lockedWalkFrame : undefined,
    layerOrder: cleanLayerOrder(raw.layerOrder, options.layers),
    anchors: {
      ...options.anchors,
      ...(raw.anchors ?? {})
    },
    offsets,
    sizeAdjustments,
    poseAdjustments,
    poseVisibility,
    visibility,
    stuffAdjustments: buildStuffAdjustments(options.layers, offsets, sizeAdjustments, visibility)
  };
}
