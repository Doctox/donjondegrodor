import Phaser from "phaser";
import type { RiggedGrodorActor } from "./RiggedGrodorActor";
import { assetPath } from "../utils/assetPath";

const COMPANION_ASSETS = {
  pebble: {
    key: "rig-companion-emotional-pebble",
    path: "/assets/sprites/grodor/rig/companions/emotional_pebble.png"
  },
  heart: {
    key: "rig-companion-heart-emote",
    path: "/assets/sprites/grodor/rig/companions/emote/heart_emote.png"
  },
  star: {
    key: "rig-companion-star-emote",
    path: "/assets/sprites/grodor/rig/companions/emote/star_emote.png"
  }
} as const;

const TETHERED_ASSETS = {
  ball: {
    key: "rig-tethered-ankle-ball",
    path: "/assets/sprites/grodor/rig/tethered/ankle_ball.png"
  },
  chain: {
    key: "rig-tethered-ankle-chain",
    path: "/assets/sprites/grodor/rig/tethered/ankle_chain.png"
  },
  angry: {
    key: "rig-tethered-angry-emote",
    path: "/assets/sprites/grodor/rig/tethered/emote/angry_emote.png"
  },
  smoke: {
    key: "rig-tethered-smoke-emote",
    path: "/assets/sprites/grodor/rig/tethered/emote/smoke_emote.png"
  }
} as const;

const COMPANION_ITEM_ID = "emotional_pebble";
const TETHERED_ITEM_ID = "ankle_ball";
const COMPANION_IDLE_OFFSET = { x: -116, y: -8 };
const COMPANION_WALK_TRAIL = 112;
const COMPANION_SCALE = 0.28;
const TETHERED_GRODOR_ANCHOR = { x: -36, y: -4 };
const TETHERED_IDLE_OFFSET = { x: -218, y: 18 };
const TETHERED_WALK_TRAIL = 190;
const TETHERED_BALL_SCALE = 0.24;
const TETHERED_CHAIN_HEIGHT = 22;

export function preloadRiggedGrodorAccessoryAssets(scene: Phaser.Scene): void {
  scene.load.image(COMPANION_ASSETS.pebble.key, assetPath(COMPANION_ASSETS.pebble.path));
  scene.load.image(COMPANION_ASSETS.heart.key, assetPath(COMPANION_ASSETS.heart.path));
  scene.load.image(COMPANION_ASSETS.star.key, assetPath(COMPANION_ASSETS.star.path));
  scene.load.image(TETHERED_ASSETS.ball.key, assetPath(TETHERED_ASSETS.ball.path));
  scene.load.image(TETHERED_ASSETS.chain.key, assetPath(TETHERED_ASSETS.chain.path));
  scene.load.image(TETHERED_ASSETS.angry.key, assetPath(TETHERED_ASSETS.angry.path));
  scene.load.image(TETHERED_ASSETS.smoke.key, assetPath(TETHERED_ASSETS.smoke.path));
}

export class RiggedGrodorAccessories {
  private readonly equipment = new Set<string>();
  private companion?: Phaser.GameObjects.Image;
  private companionFacing = 1;
  private lastCompanionGrodorX = 0;
  private tetheredBall?: Phaser.GameObjects.Image;
  private tetheredChain?: Phaser.GameObjects.Image;
  private tetheredFacing = 1;
  private lastTetheredGrodorX = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private actor: RiggedGrodorActor
  ) {
    this.createCompanion();
    this.createTethered();
    this.lastCompanionGrodorX = actor.x;
    this.lastTetheredGrodorX = actor.x;
  }

  setActor(actor: RiggedGrodorActor): void {
    this.actor = actor;
    this.lastCompanionGrodorX = actor.x;
    this.lastTetheredGrodorX = actor.x;
    this.syncVisibility();
  }

  setEquipment(items: string[]): void {
    this.equipment.clear();
    items.forEach((item) => this.equipment.add(item));
    this.syncVisibility();
  }

  update(time: number, moving: boolean): void {
    this.updateCompanion(time, moving);
    this.updateTethered(time, moving);
  }

  destroy(): void {
    this.companion?.destroy();
    this.tetheredBall?.destroy();
    this.tetheredChain?.destroy();
  }

  private createCompanion(): void {
    this.companion = this.scene.add
      .image(this.actor.x + COMPANION_IDLE_OFFSET.x, this.actor.y + COMPANION_IDLE_OFFSET.y, COMPANION_ASSETS.pebble.key)
      .setOrigin(0.5, 0.78)
      .setScale(COMPANION_SCALE)
      .setDepth(13)
      .setVisible(false);
  }

  private createTethered(): void {
    const anchor = this.getTetheredAnchor();
    this.tetheredChain = this.scene.add.image(anchor.x, anchor.y, TETHERED_ASSETS.chain.key).setOrigin(0, 0.5).setDepth(11).setVisible(false);
    this.tetheredBall = this.scene.add
      .image(this.actor.x + TETHERED_IDLE_OFFSET.x, this.actor.y + TETHERED_IDLE_OFFSET.y, TETHERED_ASSETS.ball.key)
      .setOrigin(0.5, 0.86)
      .setScale(TETHERED_BALL_SCALE)
      .setDepth(13)
      .setVisible(false);
  }

  private syncVisibility(): void {
    const companionVisible = this.equipment.has(COMPANION_ITEM_ID);
    this.companion?.setVisible(companionVisible);
    if (companionVisible && this.companion) {
      this.companion.setPosition(this.actor.x + COMPANION_IDLE_OFFSET.x, this.actor.y + COMPANION_IDLE_OFFSET.y);
    }

    const tetheredVisible = this.equipment.has(TETHERED_ITEM_ID);
    this.tetheredBall?.setVisible(tetheredVisible);
    this.tetheredChain?.setVisible(tetheredVisible);
    if (tetheredVisible && this.tetheredBall) {
      this.tetheredBall.setPosition(this.actor.x + TETHERED_IDLE_OFFSET.x, this.actor.y + TETHERED_IDLE_OFFSET.y);
      this.updateTetheredChain();
    }
  }

  private updateCompanion(time: number, moving: boolean): void {
    if (!this.companion?.visible) {
      return;
    }

    const grodorDeltaX = this.actor.x - this.lastCompanionGrodorX;
    if (Math.abs(grodorDeltaX) > 0.2) {
      this.companionFacing = grodorDeltaX > 0 ? 1 : -1;
    }
    this.lastCompanionGrodorX = this.actor.x;

    const trail = moving ? -this.companionFacing * COMPANION_WALK_TRAIL : COMPANION_IDLE_OFFSET.x;
    const targetX = this.actor.x + trail;
    const targetY = this.actor.y + COMPANION_IDLE_OFFSET.y + Math.sin(time * 3.4) * (moving ? 2 : 5);
    const previousX = this.companion.x;
    const lerp = moving ? 0.075 : 0.12;
    this.companion.setPosition(
      Phaser.Math.Linear(this.companion.x, targetX, lerp),
      Phaser.Math.Linear(this.companion.y, targetY, lerp)
    );

    const rolled = this.companion.x - previousX;
    this.companion.angle += rolled * 2.4;
    if (!moving) {
      this.companion.angle *= 0.94;
    }
  }

  private updateTethered(time: number, moving: boolean): void {
    if (!this.tetheredBall?.visible) {
      return;
    }

    const grodorDeltaX = this.actor.x - this.lastTetheredGrodorX;
    if (Math.abs(grodorDeltaX) > 0.2) {
      this.tetheredFacing = grodorDeltaX > 0 ? 1 : -1;
    }
    this.lastTetheredGrodorX = this.actor.x;

    const anchor = this.getTetheredAnchor();
    const targetX = moving ? anchor.x - this.tetheredFacing * TETHERED_WALK_TRAIL : this.actor.x + TETHERED_IDLE_OFFSET.x;
    const groundY = this.actor.y + TETHERED_IDLE_OFFSET.y;
    const targetY = groundY - Math.abs(Math.sin(time * 5.4)) * (moving ? 2 : 0.5);
    const previousX = this.tetheredBall.x;
    const lerp = moving ? 0.045 : 0.075;
    this.tetheredBall.setPosition(
      Phaser.Math.Linear(this.tetheredBall.x, targetX, lerp),
      Math.min(groundY, Phaser.Math.Linear(this.tetheredBall.y, targetY, lerp))
    );

    const rolled = this.tetheredBall.x - previousX;
    const targetAngle = moving ? Phaser.Math.Clamp(this.tetheredBall.angle + rolled * 0.72, -22, 22) : 0;
    this.tetheredBall.angle = Phaser.Math.Linear(this.tetheredBall.angle, targetAngle, moving ? 0.42 : 0.1);
    this.updateTetheredChain(anchor);
  }

  private getTetheredAnchor(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.actor.x + TETHERED_GRODOR_ANCHOR.x, this.actor.y + TETHERED_GRODOR_ANCHOR.y);
  }

  private updateTetheredChain(anchor = this.getTetheredAnchor()): void {
    if (!this.tetheredChain || !this.tetheredBall) {
      return;
    }

    const end = new Phaser.Math.Vector2(this.tetheredBall.x, this.tetheredBall.y - 12);
    const distance = Phaser.Math.Distance.Between(anchor.x, anchor.y, end.x, end.y);
    this.tetheredChain
      .setPosition(anchor.x, anchor.y)
      .setRotation(Phaser.Math.Angle.Between(anchor.x, anchor.y, end.x, end.y))
      .setDisplaySize(Math.max(24, distance), TETHERED_CHAIN_HEIGHT);
  }
}
