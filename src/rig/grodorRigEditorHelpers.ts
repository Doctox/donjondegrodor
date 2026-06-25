import type { GrodorRigLayerDefinition, GrodorRigPoint } from "./grodorRig";

export type GrodorRigLayerBaseTransform = {
  canvas: {
    width: number;
    height: number;
  };
  pivot: GrodorRigPoint;
  basePosition: GrodorRigPoint;
  baseScale: {
    x: number;
    y: number;
  };
};

export function rigLayerLabel(layer: Pick<GrodorRigLayerDefinition, "id" | "label">): string {
  return layer.label ?? layer.id;
}

export function rigLayerAssetKey(prefix: string, layer: Pick<GrodorRigLayerDefinition, "id">): string {
  return `${prefix}-${layer.id}`;
}

export function rigLayerAssetPath(basePath: string, layer: Pick<GrodorRigLayerDefinition, "file">): string {
  return layer.file.startsWith("/") ? layer.file : `${basePath}/${layer.file}`;
}

export function getRigLayerBaseTransform(
  layer: GrodorRigLayerDefinition,
  pivots: Record<string, GrodorRigPoint>,
  canvasWidth: number,
  canvasHeight: number
): GrodorRigLayerBaseTransform {
  const canvas = layer.canvas ?? { width: canvasWidth, height: canvasHeight };
  const pivot = layer.pivot ?? pivots[layer.id] ?? { x: canvas.width / 2, y: canvas.height / 2 };
  const basePosition =
    layer.basePosition ?? {
      x: pivot.x - canvasWidth / 2,
      y: pivot.y - canvasHeight
    };

  return {
    canvas,
    pivot,
    basePosition,
    baseScale: {
      x: layer.baseScale ?? 1,
      y: layer.baseScaleY ?? layer.baseScale ?? 1
    }
  };
}
