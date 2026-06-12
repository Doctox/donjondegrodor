import Phaser from "phaser";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { getMonsterDefinition, MonsterDefinition, MonsterHitZone, MonsterId } from "../data/monsterDefinitions";

export class MonsterActor {
  readonly container: Phaser.GameObjects.Container;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly hitZones = new Map<MonsterHitZone, Phaser.GameObjects.Rectangle>();
  private readonly definition: MonsterDefinition;
  private ko = false;

  constructor(private readonly scene: Phaser.Scene, x: number, y: number, monsterId: MonsterId = "rat", scaleMultiplier = 1) {
    this.definition = getMonsterDefinition(monsterId);
    this.container = scene.add.container(x, y).setScale(this.definition.scale * scaleMultiplier).setDepth(12);

    this.sprite = scene.add.image(0, 0, this.definition.idleTextureKey).setOrigin(0.5, 1);
    this.container.add(this.sprite);
    this.createHitZones();
  }

  getHeartPosition(): { x: number; y: number } {
    return {
      x: this.container.x,
      y: this.container.y - this.definition.spriteHeight * Math.abs(this.container.scaleY) - this.definition.heartOffsetY
    };
  }

  onZoneSelected(callback: (zone: MonsterHitZone) => void): void {
    this.hitZones.forEach((rect, zone) => {
      rect.on("pointerdown", () => callback(zone));
    });
  }

  setZonesEnabled(enabled: boolean): void {
    this.hitZones.forEach((rect) => {
      if (enabled) {
        rect.setInteractive({ useHandCursor: true });
      } else {
        rect.disableInteractive();
      }
    });
  }

  highlightZone(zone: MonsterHitZone): void {
    const rect = this.hitZones.get(zone);
    if (!rect) {
      return;
    }

    rect.setFillStyle(0xffd25f, 0.36);
    this.scene.tweens.add({
      targets: rect,
      alpha: 0.12,
      duration: 180,
      yoyo: true,
      repeat: 1,
      onComplete: () => rect.setFillStyle(0x50a8ff, this.getDebugAlpha())
    });
  }

  flashHitZones(repeat = 2): void {
    this.hitZones.forEach((rect) => {
      this.scene.tweens.killTweensOf(rect);
      rect.setFillStyle(0xffd25f, 0.28);
      rect.setAlpha(1);
      this.scene.tweens.add({
        targets: rect,
        alpha: 0.22,
        duration: 170,
        yoyo: true,
        repeat: Math.max(0, repeat * 2 - 1),
        onComplete: () => {
          rect.setAlpha(1);
          rect.setFillStyle(0x50a8ff, this.getDebugAlpha());
        }
      });
    });
  }

  reactToHit(): void {
    if (this.ko) {
      return;
    }

    this.sprite.setTexture(this.definition.hurtTextureKey);
    this.sprite.setTint(0xff7070);
    this.scene.tweens.add({
      targets: this.container,
      x: this.container.x + 18,
      duration: 55,
      yoyo: true,
      repeat: 4,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.sprite.clearTint();
        if (!this.ko) {
          this.sprite.setTexture(this.definition.idleTextureKey);
        }
      }
    });
  }

  playKo(): void {
    this.ko = true;
    this.scene.tweens.killTweensOf(this.container);
    this.sprite.clearTint();
    this.sprite.setTexture(this.definition.koTextureKey);
    this.setZonesEnabled(false);
  }

  private createHitZones(): void {
    const debugAlpha = this.getDebugAlpha();
    const debugEnabled = debugAlpha > 0;

    this.definition.hitZones.forEach((definition) => {
      const rect = this.scene.add
        .rectangle(definition.x, definition.y, definition.width, definition.height, 0x50a8ff, debugAlpha)
        .setStrokeStyle(debugEnabled ? 3 : 0, 0xffd25f, debugEnabled ? 0.65 : 0)
        .setInteractive({ useHandCursor: true });
      this.hitZones.set(definition.zone, rect);
      this.container.add(rect);
    });
  }

  private getDebugAlpha(): number {
    return IS_DEBUG_TOOLS_ENABLED && new URLSearchParams(window.location.search).get("combatDebug") === "1" ? 0.18 : 0;
  }
}
