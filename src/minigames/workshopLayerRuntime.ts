import Phaser from "phaser";

export type WorkshopLayerId = string;

type WorkshopLayerDefinition = {
  id: WorkshopLayerId;
  label?: string;
  key: string;
  path?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultVisible?: boolean;
};

type WorkshopLayerTransform = {
  x: number;
  y: number;
};

type WorkshopLayerSize = {
  scaleX: number;
  scaleY: number;
  rotation: number;
};

type WorkshopLayerSave = {
  layers?: WorkshopLayerDefinition[];
  layerOrder?: WorkshopLayerId[];
  offsets?: Record<WorkshopLayerId, WorkshopLayerTransform>;
  sizes?: Record<WorkshopLayerId, WorkshopLayerSize>;
  visibility?: Record<WorkshopLayerId, boolean>;
};

type WorkshopLayerRuntimeOptions = {
  depthStart?: number;
  fitToLayer?: {
    layerId: WorkshopLayerId;
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type WorkshopLayerFitTransform = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  scaleX: number;
  scaleY: number;
};

export class WorkshopLayerRuntime {
  private readonly layerDefinitions = new Map<WorkshopLayerId, WorkshopLayerDefinition>();
  private readonly layerOrder: WorkshopLayerId[] = [];
  private readonly images = new Map<WorkshopLayerId, Phaser.GameObjects.Image>();
  private readonly visibleOverrides = new Map<WorkshopLayerId, boolean>();
  private readonly depthStart: number;
  private readonly fitTransform?: WorkshopLayerFitTransform;

  constructor(
    private readonly scene: Phaser.Scene,
    save: WorkshopLayerSave,
    options: WorkshopLayerRuntimeOptions = {}
  ) {
    this.depthStart = options.depthStart ?? 3;
    (save.layers ?? []).forEach((layer) => {
      if (!layer.id || !layer.key) {
        return;
      }
      this.layerDefinitions.set(layer.id, layer);
    });
    const orderedLayers = (save.layerOrder ?? []).filter((layerId) => this.layerDefinitions.has(layerId));
    this.layerDefinitions.forEach((_layer, layerId) => {
      if (!orderedLayers.includes(layerId)) {
        orderedLayers.push(layerId);
      }
    });
    this.layerOrder.push(...orderedLayers);
    this.fitTransform = this.createFitTransform(save, options.fitToLayer);
    this.createImages(save);
  }

  destroy(): void {
    this.images.forEach((image) => image.destroy());
    this.images.clear();
    this.visibleOverrides.clear();
  }

  setLayerVisible(layerId: WorkshopLayerId, visible: boolean): void {
    this.visibleOverrides.set(layerId, visible);
    this.images.get(layerId)?.setVisible(visible);
  }

  setLayerAlpha(layerId: WorkshopLayerId, alpha: number): void {
    this.images.get(layerId)?.setAlpha(alpha);
  }

  setLayerInteractive(layerId: WorkshopLayerId, callback: () => void): void {
    const image = this.images.get(layerId);
    if (!image) {
      return;
    }
    image.setInteractive({ useHandCursor: true });
    image.on("pointerdown", callback);
  }

  setLayerInteractionEnabled(layerId: WorkshopLayerId, enabled: boolean): void {
    const image = this.images.get(layerId);
    if (!image) {
      return;
    }
    if (enabled) {
      image.setInteractive({ useHandCursor: true });
      return;
    }
    image.disableInteractive();
  }

  getLayerBounds(layerId: WorkshopLayerId): Phaser.Geom.Rectangle | null {
    const image = this.images.get(layerId);
    if (!image) {
      return null;
    }
    return image.getBounds();
  }

  layerIdsByPrefix(prefix: string): WorkshopLayerId[] {
    return this.layerOrder.filter((layerId) => layerId.startsWith(prefix));
  }

  private createImages(save: WorkshopLayerSave): void {
    this.layerOrder.forEach((layerId, index) => {
      const layer = this.layerDefinitions.get(layerId);
      if (!layer || !this.scene.textures.exists(layer.key)) {
        return;
      }

      const offset = save.offsets?.[layerId] ?? { x: 0, y: 0 };
      const size = save.sizes?.[layerId] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
      const visible = save.visibility?.[layerId] ?? layer.visible ?? layer.defaultVisible ?? true;
      const sourceX = (layer.x ?? layer.defaultX ?? 0) + offset.x;
      const sourceY = (layer.y ?? layer.defaultY ?? 0) + offset.y;
      const x = this.fitTransform
        ? this.fitTransform.targetX + (sourceX - this.fitTransform.sourceX) * this.fitTransform.scaleX
        : sourceX;
      const y = this.fitTransform
        ? this.fitTransform.targetY + (sourceY - this.fitTransform.sourceY) * this.fitTransform.scaleY
        : sourceY;
      const width = (layer.width ?? layer.defaultWidth ?? 1) * size.scaleX * (this.fitTransform?.scaleX ?? 1);
      const height = (layer.height ?? layer.defaultHeight ?? 1) * size.scaleY * (this.fitTransform?.scaleY ?? 1);
      const image = this.scene.add
        .image(x, y, layer.key)
        .setDisplaySize(width, height)
        .setRotation(Phaser.Math.DegToRad(size.rotation))
        .setVisible(visible)
        .setDepth(this.depthStart + index);
      this.images.set(layerId, image);
    });
  }

  private createFitTransform(
    save: WorkshopLayerSave,
    fitToLayer: WorkshopLayerRuntimeOptions["fitToLayer"]
  ): WorkshopLayerFitTransform | undefined {
    if (!fitToLayer) {
      return undefined;
    }

    const layer = this.layerDefinitions.get(fitToLayer.layerId);
    if (!layer) {
      return undefined;
    }

    const offset = save.offsets?.[fitToLayer.layerId] ?? { x: 0, y: 0 };
    const size = save.sizes?.[fitToLayer.layerId] ?? { scaleX: 1, scaleY: 1, rotation: 0 };
    const sourceWidth = (layer.width ?? layer.defaultWidth ?? 1) * size.scaleX;
    const sourceHeight = (layer.height ?? layer.defaultHeight ?? 1) * size.scaleY;
    return {
      sourceX: (layer.x ?? layer.defaultX ?? 0) + offset.x,
      sourceY: (layer.y ?? layer.defaultY ?? 0) + offset.y,
      targetX: fitToLayer.x,
      targetY: fitToLayer.y,
      scaleX: fitToLayer.width / sourceWidth,
      scaleY: fitToLayer.height / sourceHeight
    };
  }
}
