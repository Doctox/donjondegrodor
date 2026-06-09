import Phaser from "phaser";
import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  MINI_GAME_EVENT_IMAGE_HEIGHT,
  MINI_GAME_EVENT_IMAGE_WIDTH,
  MiniGameController,
  MiniGameHost,
  MiniGameResult,
  SlotMachineSymbol
} from "./miniGameTypes";

const SYMBOLS: SlotMachineSymbol[] = ["grodor", "gold", "skull", "pouch"];
const MACHINE_HIT_ZONE = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2 + 62,
  width: 700,
  height: 604
};

export class SlotMachineMiniGame implements MiniGameController {
  private reelImages: Phaser.GameObjects.Image[] = [];
  private reels: SlotMachineSymbol[] = [];

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 54, IMAGE_ASSETS.slotMachineBackground.key)
      .setDisplaySize(MINI_GAME_EVENT_IMAGE_WIDTH, MINI_GAME_EVENT_IMAGE_HEIGHT)
      .setDepth(4);

    this.reelImages = [0, 1, 2].map((index) =>
      this.host.scene.add
        .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 54, this.getReelTexture(index, "gold"))
        .setDisplaySize(MINI_GAME_EVENT_IMAGE_WIDTH, MINI_GAME_EVENT_IMAGE_HEIGHT)
        .setDepth(5 + index)
        .setVisible(false)
    );

    this.host.getStatusText()?.setText(GAME_TEXTS.miniGames.slotMachine.instruction);
    const hitZone = this.host.scene.add
      .zone(MACHINE_HIT_ZONE.x, MACHINE_HIT_ZONE.y, MACHINE_HIT_ZONE.width, MACHINE_HIT_ZONE.height)
      .setDepth(8)
      .setInteractive({ useHandCursor: true });
    hitZone.on("pointerdown", () => {
      hitZone.destroy();
      this.spin();
    });
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
    this.host.getStatusText()?.setText(GAME_TEXTS.miniGames.slotMachine.spinning);
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

  private showResult(reels: SlotMachineSymbol[]): void {
    const result = this.resolveResult(reels);
    this.host.setResult(result);
    this.host.getStatusText()?.setText(this.getResultText(result));
    this.host.getRarityText()?.setText(reels.map((symbol) => this.getSymbolLabel(symbol)).join(" - "));
    this.host.createContinueButton(result);
    this.host.publishMiniGameReport();
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

  private getResultText(result: MiniGameResult): string {
    const reels = result.slotMachineReels ?? [];
    const goldCount = this.countSymbol(reels, "gold");
    const grodorCount = this.countSymbol(reels, "grodor");
    const skullCount = this.countSymbol(reels, "skull");
    const pouchCount = this.countSymbol(reels, "pouch");

    if (goldCount === 3) {
      return GAME_TEXTS.miniGames.slotMachine.goldThree;
    }
    if (grodorCount === 3) {
      return GAME_TEXTS.miniGames.slotMachine.grodorThree;
    }
    if (skullCount === 3) {
      return GAME_TEXTS.miniGames.slotMachine.skullThree;
    }
    if (pouchCount === 3) {
      if (result.maxLifeLoss) {
        return GAME_TEXTS.miniGames.slotMachine.pouchMaxLife;
      }
      return result.goldLoss ? GAME_TEXTS.miniGames.slotMachine.pouch(result.goldLoss) : GAME_TEXTS.miniGames.slotMachine.pouchEmpty;
    }
    if (goldCount === 2) {
      return GAME_TEXTS.miniGames.slotMachine.goldTwo;
    }
    if (grodorCount === 2) {
      return result.maxLifeDelta ? GAME_TEXTS.miniGames.slotMachine.grodorTwo : GAME_TEXTS.miniGames.slotMachine.grodorMax;
    }
    if (skullCount === 2) {
      return GAME_TEXTS.miniGames.slotMachine.skullTwo;
    }
    if (pouchCount === 2) {
      return result.goldLoss ? GAME_TEXTS.miniGames.slotMachine.pouchTwo(result.goldLoss) : GAME_TEXTS.miniGames.slotMachine.pouchEmpty;
    }

    return GAME_TEXTS.miniGames.slotMachine.neutral;
  }

  private pickSymbol(): SlotMachineSymbol {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  private getSymbolLabel(symbol: SlotMachineSymbol): string {
    return GAME_TEXTS.miniGames.slotMachine.symbolLabels[symbol];
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
