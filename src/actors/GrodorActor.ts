import Phaser from "phaser";
import { ANIMATION_KEYS, IMAGE_ASSETS } from "../data/assetKeys";
import {
  getGrodorEquipmentDefinition,
  GRODOR_EQUIPMENT_LIST,
  GrodorEquipmentDefinition,
  GrodorEquipmentId,
  GrodorPose
} from "../data/equipmentDefinitions";

const GRODOR_SCALE = 0.58;
const GRODOR_WALK_FRAME_RATE = 5;

export class GrodorActor {
  readonly container: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Sprite;
  private readonly equipmentLayers = new Map<GrodorEquipmentId, Phaser.GameObjects.Sprite>();
  private facingLeft = false;
  private pose: GrodorPose = "idle";

  constructor(private readonly scene: Phaser.Scene, x: number, y: number, private readonly scale = GRODOR_SCALE) {
    this.ensureAnimations(scene);
    this.container = scene.add.container(x, y).setScale(scale).setDepth(12);
    this.body = scene.add.sprite(0, 0, IMAGE_ASSETS.grodorIdle.key).setOrigin(0.5, 1);
    this.container.add(this.body);
    this.playIdle();
  }

  get x(): number {
    return this.container.x;
  }

  get y(): number {
    return this.container.y;
  }

  get currentAnimation(): string | null {
    return this.body.anims.currentAnim?.key ?? null;
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setFlipX(flip: boolean): void {
    this.facingLeft = flip;
    this.container.setScale(flip ? -this.scale : this.scale, this.scale);
  }

  playIdle(): void {
    this.playPose("idle", ANIMATION_KEYS.grodorIdle);
  }

  playWalk(): void {
    this.playPose("walk", ANIMATION_KEYS.grodorWalk);
  }

  playAttack(): void {
    this.playPose("attack", ANIMATION_KEYS.grodorAttack);
  }

  playHurt(): void {
    this.playPose("hurt", ANIMATION_KEYS.grodorHurt);
  }

  playVictory(): void {
    this.playPose("victory", ANIMATION_KEYS.grodorVictory);
  }

  playDeath(): void {
    this.playPose("death", ANIMATION_KEYS.grodorDeath);
  }

  setEquipment(items: string[]): void {
    this.equipmentLayers.forEach((layer) => layer.setVisible(false));

    items.forEach((item) => {
      const definition = getGrodorEquipmentDefinition(item);
      if (!definition) {
        return;
      }

      const layer = this.getOrCreateEquipmentLayer(definition);
      layer.setVisible(true);
      this.playEquipmentPose(definition, this.pose);
    });

    this.sortEquipmentLayers();
  }

  private playPose(pose: GrodorPose, bodyAnimation: string): void {
    this.pose = pose;
    this.body.play(bodyAnimation);
    this.equipmentLayers.forEach((layer, item) => {
      if (layer.visible) {
        const definition = getGrodorEquipmentDefinition(item);
        if (definition) {
          this.playEquipmentPose(definition, pose);
        }
      }
    });
  }

  private getOrCreateEquipmentLayer(definition: GrodorEquipmentDefinition): Phaser.GameObjects.Sprite {
    const existing = this.equipmentLayers.get(definition.id);
    if (existing) {
      return existing;
    }

    const layer = this.scene.add.sprite(0, 0, definition.fallbackTexture).setOrigin(0.5, 1).setDepth(definition.layerOrder);
    this.container.add(layer);
    this.equipmentLayers.set(definition.id, layer);
    return layer;
  }

  private sortEquipmentLayers(): void {
    this.container.bringToTop(this.body);

    [...this.equipmentLayers.entries()]
      .sort((first, second) => {
        const firstOrder = getGrodorEquipmentDefinition(first[0])?.layerOrder ?? 0;
        const secondOrder = getGrodorEquipmentDefinition(second[0])?.layerOrder ?? 0;
        return firstOrder - secondOrder;
      })
      .forEach(([, layer]) => this.container.bringToTop(layer));
  }

  private playEquipmentPose(definition: GrodorEquipmentDefinition, pose: GrodorPose): void {
    const layer = this.equipmentLayers.get(definition.id);
    if (!layer) {
      return;
    }

    const animation =
      definition.animations[pose] ??
      (pose === "attack" ? definition.animations.idle : undefined) ??
      definition.animations.idle;
    if (animation && this.scene.anims.exists(animation)) {
      layer.setVisible(true);
      layer.play(animation);
    } else {
      layer.stop();
      layer.setTexture(definition.fallbackTexture);
      layer.setVisible(true);
    }
  }

  private ensureAnimations(scene: Phaser.Scene): void {
    this.createAnimationIfMissing(scene, {
      key: ANIMATION_KEYS.grodorIdle,
      frames: [{ key: IMAGE_ASSETS.grodorIdle.key }],
      frameRate: 1,
      repeat: -1
    });

    this.createAnimationIfMissing(scene, {
      key: ANIMATION_KEYS.grodorWalk,
      frames: [
        { key: IMAGE_ASSETS.grodorWalk1.key },
        { key: IMAGE_ASSETS.grodorWalk2.key },
        { key: IMAGE_ASSETS.grodorWalk3.key },
        { key: IMAGE_ASSETS.grodorWalk4.key }
      ],
      frameRate: GRODOR_WALK_FRAME_RATE,
      repeat: -1
    });

    this.createAnimationIfMissing(scene, {
      key: ANIMATION_KEYS.grodorAttack,
      frames: [
        { key: IMAGE_ASSETS.grodorAttack1.key },
        { key: IMAGE_ASSETS.grodorAttack2.key },
        { key: IMAGE_ASSETS.grodorAttack3.key }
      ],
      frameRate: 6,
      repeat: 0
    });

    this.createAnimationIfMissing(scene, {
      key: ANIMATION_KEYS.grodorHurt,
      frames: [{ key: IMAGE_ASSETS.grodorHurt.key }],
      frameRate: 1,
      repeat: 0
    });

    this.createAnimationIfMissing(scene, {
      key: ANIMATION_KEYS.grodorDeath,
      frames: [{ key: IMAGE_ASSETS.grodorDeath1.key }, { key: IMAGE_ASSETS.grodorDeath2.key }],
      frameRate: 3,
      repeat: 0
    });

    this.createAnimationIfMissing(scene, {
      key: ANIMATION_KEYS.grodorVictory,
      frames: [{ key: IMAGE_ASSETS.grodorVictory.key }],
      frameRate: 1,
      repeat: -1
    });

    GRODOR_EQUIPMENT_LIST.forEach((equipment) => {
      equipment.animationDefinitions.forEach((definition) => {
        this.createAnimationIfMissing(scene, {
          key: definition.key,
          frames: definition.frames.map((key) => ({ key })),
          frameRate: definition.frameRate,
          repeat: definition.repeat
        });
      });
    });
  }

  private createAnimationIfMissing(
    scene: Phaser.Scene,
    config: Phaser.Types.Animations.Animation & { key: string }
  ): void {
    if (!scene.anims.exists(config.key)) {
      scene.anims.create(config);
    }
  }
}
