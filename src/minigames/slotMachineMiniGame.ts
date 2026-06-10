import Phaser from "phaser";
import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  MiniGameController,
  MiniGameHost,
  MiniGameResult,
  SlotMachineSymbol
} from "./miniGameTypes";

const SYMBOLS: SlotMachineSymbol[] = ["grodor", "gold", "skull", "pouch"];
const SLOT_MACHINE_IMAGE = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT
};
const MACHINE_HIT_ZONE = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT
};

export class SlotMachineMiniGame implements MiniGameController {
  private reelImages: Phaser.GameObjects.Image[] = [];
  private reels: SlotMachineSymbol[] = [];
  private resultLightImage?: Phaser.GameObjects.Image;
  private resultLightTimer?: Phaser.Time.TimerEvent;
  private resultLightFrame = 0;
  private delayedClickHint?: Phaser.GameObjects.Text;
  private delayedClickHintTween?: Phaser.Tweens.Tween;
  private delayedClickHintTimer?: Phaser.Time.TimerEvent;
  private exitHitZone?: Phaser.GameObjects.Zone;
  private exitHint?: Phaser.GameObjects.Text;
  private exitHintTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    this.host.scene.add
      .image(SLOT_MACHINE_IMAGE.x, SLOT_MACHINE_IMAGE.y, IMAGE_ASSETS.slotMachineBackground.key)
      .setDisplaySize(SLOT_MACHINE_IMAGE.width, SLOT_MACHINE_IMAGE.height)
      .setDepth(3);

    this.reelImages = [0, 1, 2].map((index) =>
      this.host.scene.add
        .image(SLOT_MACHINE_IMAGE.x, SLOT_MACHINE_IMAGE.y, this.getReelTexture(index, "gold"))
        .setDisplaySize(SLOT_MACHINE_IMAGE.width, SLOT_MACHINE_IMAGE.height)
        .setDepth(4 + index)
        .setTexture(this.getReelTexture(index, "grodor"))
        .setVisible(true)
    );
    this.resultLightImage = this.host.scene.add
      .image(SLOT_MACHINE_IMAGE.x, SLOT_MACHINE_IMAGE.y, IMAGE_ASSETS.slotMachineLightGreenLeft.key)
      .setDisplaySize(SLOT_MACHINE_IMAGE.width, SLOT_MACHINE_IMAGE.height)
      .setDepth(7)
      .setVisible(false);

    const hitZone = this.host.scene.add
      .zone(MACHINE_HIT_ZONE.x, MACHINE_HIT_ZONE.y, MACHINE_HIT_ZONE.width, MACHINE_HIT_ZONE.height)
      .setDepth(8)
      .setInteractive({ useHandCursor: true });
    hitZone.on("pointerdown", () => {
      this.hideDelayedClickHint();
      hitZone.destroy();
      this.spin();
    });
    this.delayedClickHintTimer = this.host.scene.time.delayedCall(4000, () => this.showDelayedClickHint());
  }

  getReportState(): Record<string, unknown> {
    return {
      reels: this.reels
    };
  }

  private spin(): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.host.setCompleted(true);
    this.hideDelayedClickHint();
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");

    const finalReels = [this.pickSymbol(), this.pickSymbol(), this.pickSymbol()] as SlotMachineSymbol[];
    this.reels = finalReels;
    let tick = 0;
    const maxTicks = 18;

    const animate = (): void => {
      this.reelImages.forEach((image, index) => {
        const symbol = tick >= 10 + index * 4 ? finalReels[index] : SYMBOLS[(tick + index) % SYMBOLS.length];
        image.setTexture(this.getReelTexture(index, symbol));
        image.setVisible(true);
      });

      if (tick >= maxTicks) {
        this.showResult(finalReels);
        return;
      }

      tick += 1;
      this.host.scene.time.delayedCall(90 + tick * 8, animate);
    };

    animate();
  }

  private showDelayedClickHint(): void {
    if (this.host.getCompleted() || this.delayedClickHint) {
      return;
    }

    this.delayedClickHint = this.host.scene.add
      .text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, GAME_TEXTS.miniGames.slotMachine.delayedClickHint, {
        fontFamily: "Georgia, serif",
        fontSize: "72px",
        color: "#ffffff",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 9
      })
      .setOrigin(0.5)
      .setDepth(9)
      .setAlpha(0.2);

    this.delayedClickHintTween = this.host.scene.tweens.add({
      targets: this.delayedClickHint,
      alpha: 1,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 360,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private hideDelayedClickHint(): void {
    this.delayedClickHintTimer?.remove(false);
    this.delayedClickHintTimer = undefined;
    this.delayedClickHintTween?.stop();
    this.delayedClickHintTween = undefined;
    this.delayedClickHint?.destroy();
    this.delayedClickHint = undefined;
  }

  private showResult(reels: SlotMachineSymbol[]): void {
    const result = this.resolveResult(reels);
    this.host.setResult(result);
    this.playResultLights(result);
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.createExitHitZone(result);
    this.exitHintTimer = this.host.scene.time.delayedCall(4000, () => this.showExitHint());
    this.host.publishMiniGameReport();
  }

  private createExitHitZone(result: MiniGameResult): void {
    if (this.exitHitZone) {
      return;
    }

    this.exitHitZone = this.host.scene.add
      .zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });
    this.exitHitZone.once("pointerdown", () => {
      this.exitHintTimer?.remove(false);
      this.exitHintTimer = undefined;
      this.exitHint?.destroy();
      this.exitHint = undefined;
      this.resultLightTimer?.remove(false);
      this.resultLightTimer = undefined;
      this.host.finishMiniGame(result);
    });
  }

  private showExitHint(): void {
    if (this.exitHint) {
      return;
    }

    this.exitHint = this.host.scene.add
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.miniGames.slotMachine.exitHint, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "30px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private playResultLights(result: MiniGameResult): void {
    this.resultLightTimer?.remove(false);
    this.resultLightTimer = undefined;
    const frames =
      result.outcome === "neutral"
        ? [IMAGE_ASSETS.slotMachineLightRedLeft.key, IMAGE_ASSETS.slotMachineLightRedRight.key]
        : [IMAGE_ASSETS.slotMachineLightGreenLeft.key, IMAGE_ASSETS.slotMachineLightGreenRight.key];
    this.resultLightFrame = 0;
    this.resultLightImage?.setTexture(frames[this.resultLightFrame]).setVisible(true).setAlpha(1);
    this.resultLightTimer = this.host.scene.time.addEvent({
      delay: 280,
      loop: true,
      callback: () => {
        this.resultLightFrame = (this.resultLightFrame + 1) % frames.length;
        this.resultLightImage?.setTexture(frames[this.resultLightFrame]);
      }
    });
  }

  private resolveResult(reels: SlotMachineSymbol[]): MiniGameResult {
    if (this.countSymbol(reels, "gold") === 3) {
      return { type: "slot_machine", outcome: "success", goldDelta: 15, slotMachineReels: reels };
    }
    if (this.countSymbol(reels, "grodor") === 3) {
      return { type: "slot_machine", outcome: "success", followUpMiniGame: "loot_chest", slotMachineReels: reels };
    }
    if (this.countSymbol(reels, "skull") === 3) {
      return { type: "slot_machine", outcome: "failure", instantDeath: true, slotMachineReels: reels };
    }
    if (this.countSymbol(reels, "pouch") === 3) {
      if (this.host.getCarriedGold() <= 0) {
        return { type: "slot_machine", outcome: "failure", maxLifeLoss: 1, slotMachineReels: reels };
      }

      return {
        type: "slot_machine",
        outcome: "failure",
        goldLoss: Math.min(this.host.getCarriedGold(), Phaser.Math.Between(1, 15)),
        slotMachineReels: reels
      };
    }

    if (this.countSymbol(reels, "gold") === 2) {
      return { type: "slot_machine", outcome: "success", goldDelta: 5, slotMachineReels: reels };
    }
    if (this.countSymbol(reels, "grodor") === 2) {
      return {
        type: "slot_machine",
        outcome: "success",
        maxLifeDelta: this.host.getMaxLife() >= 12 ? undefined : 1,
        slotMachineReels: reels
      };
    }
    if (this.countSymbol(reels, "skull") === 2) {
      return { type: "slot_machine", outcome: "failure", lifeDelta: -1, slotMachineReels: reels };
    }
    if (this.countSymbol(reels, "pouch") === 2) {
      return {
        type: "slot_machine",
        outcome: "failure",
        goldLoss: Math.min(this.host.getCarriedGold(), Phaser.Math.Between(1, 3)),
        slotMachineReels: reels
      };
    }

    return { type: "slot_machine", outcome: "neutral", slotMachineReels: reels };
  }

  private pickSymbol(): SlotMachineSymbol {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  private countSymbol(reels: SlotMachineSymbol[], symbol: SlotMachineSymbol): number {
    return reels.filter((reelSymbol) => reelSymbol === symbol).length;
  }

  private getReelTexture(index: number, symbol: SlotMachineSymbol): string {
    const byReel = [
      {
        grodor: IMAGE_ASSETS.slotMachineSlot1Grodor.key,
        gold: IMAGE_ASSETS.slotMachineSlot1Gold.key,
        skull: IMAGE_ASSETS.slotMachineSlot1Skull.key,
        pouch: IMAGE_ASSETS.slotMachineSlot1Pouch.key
      },
      {
        grodor: IMAGE_ASSETS.slotMachineSlot2Grodor.key,
        gold: IMAGE_ASSETS.slotMachineSlot2Gold.key,
        skull: IMAGE_ASSETS.slotMachineSlot2Skull.key,
        pouch: IMAGE_ASSETS.slotMachineSlot2Pouch.key
      },
      {
        grodor: IMAGE_ASSETS.slotMachineSlot3Grodor.key,
        gold: IMAGE_ASSETS.slotMachineSlot3Gold.key,
        skull: IMAGE_ASSETS.slotMachineSlot3Skull.key,
        pouch: IMAGE_ASSETS.slotMachineSlot3Pouch.key
      }
    ] satisfies Array<Record<SlotMachineSymbol, string>>;

    return byReel[index][symbol];
  }
}
