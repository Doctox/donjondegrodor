import Phaser from "phaser";
import { IMAGE_ASSETS, JSON_ASSETS, WORLD_WIDTH } from "../data/assetKeys";

type VillageBirdActorSave = {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  visible?: boolean;
  alpha?: number;
};

type VillageAnimSceneSave = {
  actors?: Record<string, VillageBirdActorSave>;
};

type VillageBirdRigSave = {
  poseVisibility?: Array<Record<string, boolean>>;
};

const BIRD_DEPTH = 4;
const BIRD_FRAME_MS = 95;
const BIRD_SCALE_MULTIPLIER = 0.78;
const BIRD_START_X = WORLD_WIDTH + 150;
const BIRD_END_X = -170;
const BIRD_FRAME_KEYS_BY_LAYER_ID: Record<string, string> = {
  bird_1: IMAGE_ASSETS.villageBird1.key,
  bird_2: IMAGE_ASSETS.villageBird2.key,
  bird_3: IMAGE_ASSETS.villageBird3.key,
  bird_4: IMAGE_ASSETS.villageBird4.key,
  bird_5: IMAGE_ASSETS.villageBird5.key
};
const FALLBACK_FRAME_KEYS = [
  IMAGE_ASSETS.villageBird1.key,
  IMAGE_ASSETS.villageBird2.key,
  IMAGE_ASSETS.villageBird3.key,
  IMAGE_ASSETS.villageBird4.key,
  IMAGE_ASSETS.villageBird5.key,
  IMAGE_ASSETS.villageBird4.key,
  IMAGE_ASSETS.villageBird3.key,
  IMAGE_ASSETS.villageBird2.key
];
const FISHER_FRAME_KEYS = [
  IMAGE_ASSETS.villageFisher1.key,
  IMAGE_ASSETS.villageFisher2.key,
  IMAGE_ASSETS.villageFisher3.key,
  IMAGE_ASSETS.villageFisher4.key,
  IMAGE_ASSETS.villageFisher5.key,
  IMAGE_ASSETS.villageFisher1.key
];
const SMOKE_ACTOR_IDS = ["smoke_2", "smoke_3", "smoke_4", "smoke_5"] as const;

type RuntimeBird = {
  image: Phaser.GameObjects.Image;
  frameIndex: number;
  baseX: number;
  baseY: number;
  scaleX: number;
  scaleY: number;
};

export class VillageBirdFlock {
  private readonly scene: Phaser.Scene;
  private readonly birds: RuntimeBird[] = [];
  private frameKeys: string[] = FALLBACK_FRAME_KEYS;
  private timer?: Phaser.Time.TimerEvent;
  private flightDelay?: Phaser.Time.TimerEvent;
  private fisher?: Phaser.GameObjects.Image;
  private fisherDelay?: Phaser.Time.TimerEvent;
  private activeBirdTweens: Phaser.Tweens.Tween[] = [];
  private smokeTweens: Phaser.Tweens.Tween[] = [];
  private smokeImages: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    const save = this.scene.cache.json.get(JSON_ASSETS.villageAnimScene.key) as VillageAnimSceneSave | undefined;
    if (!save?.actors) {
      return;
    }

    this.frameKeys = this.readFrameKeys();

    this.createBirds(save);
    this.createFisher(save.actors.fisher);
    this.createSmokes(save.actors);

    if (this.birds.length > 0) {
      this.timer = this.scene.time.addEvent({
        delay: BIRD_FRAME_MS,
        loop: true,
        callback: () => this.advanceFrames()
      });
      this.scheduleNextFlight(Phaser.Math.Between(600, 1800));
    }
  }

  destroy(): void {
    this.timer?.remove(false);
    this.flightDelay?.remove(false);
    this.fisherDelay?.remove(false);
    this.timer = undefined;
    this.flightDelay = undefined;
    this.fisherDelay = undefined;
    this.activeBirdTweens.forEach((tween) => tween.remove());
    this.activeBirdTweens.length = 0;
    this.smokeTweens.forEach((tween) => tween.remove());
    this.smokeTweens.length = 0;
    this.birds.forEach((bird) => bird.image.destroy());
    this.birds.length = 0;
    this.fisher?.destroy();
    this.fisher = undefined;
    this.smokeImages.forEach((smoke) => smoke.destroy());
    this.smokeImages = [];
  }

  private createBirds(save: VillageAnimSceneSave): void {
    Object.entries(save.actors ?? {}).forEach(([actorId, actor], index) => {
      if (!actorId.startsWith("bird_")) {
        return;
      }
      if (actor.visible === false) {
        return;
      }

      const frameIndex = index % this.frameKeys.length;
      const scaleX = (actor.scaleX ?? 1) * BIRD_SCALE_MULTIPLIER;
      const scaleY = (actor.scaleY ?? actor.scaleX ?? 1) * BIRD_SCALE_MULTIPLIER;
      const image = this.scene.add
        .image(actor.x ?? 0, actor.y ?? 0, this.frameKeys[frameIndex])
        .setOrigin(0.5, 0.5)
        .setFlipX(true)
        .setScale(scaleX, scaleY)
        .setRotation(actor.rotation ?? 0)
        .setDepth(BIRD_DEPTH + index * 0.001)
        .setAlpha(0)
        .setVisible(false);

      this.birds.push({
        image,
        frameIndex,
        baseX: actor.x ?? 0,
        baseY: actor.y ?? 0,
        scaleX,
        scaleY
      });
    });
  }

  private advanceFrames(): void {
    this.birds.forEach((bird) => {
      bird.frameIndex = (bird.frameIndex + 1) % this.frameKeys.length;
      bird.image.setTexture(this.frameKeys[bird.frameIndex]);
    });
  }

  private createFisher(actor?: VillageBirdActorSave): void {
    if (!actor || actor.visible === false) {
      return;
    }

    this.fisher = this.scene.add
      .image(actor.x ?? 0, actor.y ?? 0, FISHER_FRAME_KEYS[0])
      .setOrigin(0.5, 0.5)
      .setScale(actor.scaleX ?? 1, actor.scaleY ?? actor.scaleX ?? 1)
      .setRotation(actor.rotation ?? 0)
      .setAlpha(actor.alpha ?? 1)
      .setDepth(5);

    this.scheduleFisherAnimation(Phaser.Math.Between(2000, 7000));
  }

  private scheduleFisherAnimation(delay: number): void {
    this.fisherDelay?.remove(false);
    this.fisherDelay = this.scene.time.delayedCall(delay, () => this.playFisherAnimation());
  }

  private playFisherAnimation(): void {
    if (!this.fisher) {
      return;
    }

    let frameIndex = 0;
    this.fisher.setTexture(FISHER_FRAME_KEYS[frameIndex]);
    this.fisherDelay = this.scene.time.addEvent({
      delay: 280,
      repeat: FISHER_FRAME_KEYS.length - 2,
      callback: () => {
        if (!this.fisher) {
          return;
        }

        frameIndex += 1;
        this.fisher.setTexture(FISHER_FRAME_KEYS[frameIndex]);

        if (frameIndex >= FISHER_FRAME_KEYS.length - 1) {
          this.scheduleFisherAnimation(Phaser.Math.Between(2000, 7000));
        }
      }
    });
  }

  private createSmokes(actors: Record<string, VillageBirdActorSave>): void {
    SMOKE_ACTOR_IDS.forEach((actorId, index) => {
      const actor = actors[actorId];
      if (!actor || actor.visible === false) {
        return;
      }

      const baseAlpha = actor.alpha ?? 0.4;
      const baseScaleX = actor.scaleX ?? 1;
      const baseScaleY = actor.scaleY ?? baseScaleX;
      const smoke = this.scene.add
        .image(actor.x ?? 0, actor.y ?? 0, IMAGE_ASSETS.villageSmoke.key)
        .setOrigin(0.5, 0.5)
        .setScale(baseScaleX, baseScaleY)
        .setRotation(actor.rotation ?? 0)
        .setFlipX(actorId === "smoke_5")
        .setAlpha(0)
        .setDepth(6 + index * 0.001);

      this.smokeImages.push(smoke);
      this.startSmokeLoop(smoke, actor, baseAlpha, baseScaleX, baseScaleY, index);
    });
  }

  private startSmokeLoop(
    smoke: Phaser.GameObjects.Image,
    actor: VillageBirdActorSave,
    baseAlpha: number,
    baseScaleX: number,
    baseScaleY: number,
    index: number
  ): void {
    const baseX = actor.x ?? 0;
    const baseY = actor.y ?? 0;
    const duration = Phaser.Math.Between(3600, 5200);
    const driftX = Phaser.Math.Between(-10, 10);
    const riseY = Phaser.Math.Between(18, 30);
    const delay = index * 650 + Phaser.Math.Between(0, 500);

    smoke.setPosition(baseX, baseY).setScale(baseScaleX, baseScaleY).setAlpha(0);

    let tween: Phaser.Tweens.Tween;
    tween = this.scene.tweens.add({
      targets: smoke,
      x: baseX + driftX,
      y: baseY - riseY,
      scaleX: baseScaleX * 1.18,
      scaleY: baseScaleY * 1.18,
      duration,
      delay,
      ease: "Sine.easeInOut",
      onUpdate: (activeTween) => {
        const progress = activeTween.progress;
        const fadeIn = Phaser.Math.Clamp(progress / 0.2, 0, 1);
        const fadeOut = Phaser.Math.Clamp((1 - progress) / 0.35, 0, 1);
        smoke.setAlpha(baseAlpha * Math.min(fadeIn, fadeOut));
      },
      onComplete: () => {
        this.forgetSmokeTween(tween);
        smoke.setPosition(baseX, baseY).setScale(baseScaleX, baseScaleY).setAlpha(0);
        this.startSmokeLoop(smoke, actor, baseAlpha, baseScaleX, baseScaleY, index);
      }
    });

    this.smokeTweens.push(tween);
  }

  private scheduleNextFlight(delay: number): void {
    this.flightDelay?.remove(false);
    this.flightDelay = this.scene.time.delayedCall(delay, () => this.startFlight());
  }

  private startFlight(): void {
    this.activeBirdTweens.forEach((tween) => tween.remove());
    this.activeBirdTweens.length = 0;
    this.birds.forEach((bird) => {
      bird.image.setVisible(false).setAlpha(0);
    });

    const count = Phaser.Math.Between(Math.min(2, this.birds.length), Math.min(5, this.birds.length));
    const selectedBirds = Phaser.Utils.Array.Shuffle([...this.birds]).slice(0, count);
    const rightMostBaseX = Math.max(...this.birds.map((bird) => bird.baseX));
    const duration = Phaser.Math.Between(26000, 36000);
    const yOffset = Phaser.Math.Between(-10, 18);
    const spreadX = Phaser.Math.Between(44, 72);
    const spreadY = Phaser.Math.Between(12, 22);
    let completed = 0;

    selectedBirds.forEach((bird, index) => {
      const formationOffsetX = bird.baseX - rightMostBaseX - index * spreadX;
      const startX = BIRD_START_X + formationOffsetX;
      const endX = BIRD_END_X + formationOffsetX;
      const laneY = (index - (selectedBirds.length - 1) / 2) * spreadY;
      const baseY = bird.baseY + yOffset + laneY + Phaser.Math.Between(-6, 6);
      const delay = index * Phaser.Math.Between(160, 420);
      const bobPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

      bird.image
        .setPosition(startX, baseY)
        .setScale(bird.scaleX, bird.scaleY)
        .setAlpha(0)
        .setVisible(true);

      const tween = this.scene.tweens.add({
        targets: bird.image,
        x: endX,
        duration,
        delay,
        ease: "Sine.easeInOut",
        onUpdate: (activeTween) => {
          const progress = activeTween.progress;
          const fadeIn = Phaser.Math.Clamp(progress / 0.08, 0, 1);
          const fadeOut = Phaser.Math.Clamp((1 - progress) / 0.1, 0, 1);
          bird.image.setAlpha(Math.min(fadeIn, fadeOut));
          bird.image.y = baseY + Math.sin(progress * Math.PI * 4 + bobPhase) * 5;
        },
        onComplete: () => {
          bird.image.setVisible(false).setAlpha(0);
          completed += 1;
          if (completed >= selectedBirds.length) {
            this.scheduleNextFlight(Phaser.Math.Between(2500, 6500));
          }
        }
      });

      this.activeBirdTweens.push(tween);
    });
  }

  private forgetSmokeTween(tween: Phaser.Tweens.Tween): void {
    const index = this.smokeTweens.indexOf(tween);
    if (index >= 0) {
      this.smokeTweens.splice(index, 1);
    }
  }

  private readFrameKeys(): string[] {
    const rigSave = this.scene.cache.json.get(JSON_ASSETS.villageBirdRig.key) as VillageBirdRigSave | undefined;
    const poseFrames =
      rigSave?.poseVisibility
        ?.map((visibility) => Object.entries(visibility).find(([, visible]) => visible)?.[0])
        .filter((layerId): layerId is string => Boolean(layerId))
        .map((layerId) => BIRD_FRAME_KEYS_BY_LAYER_ID[layerId])
        .filter((key): key is string => Boolean(key)) ?? [];

    if (poseFrames.length < 2) {
      return FALLBACK_FRAME_KEYS;
    }

    return [...poseFrames, ...poseFrames.slice(1, -1).reverse()];
  }
}
