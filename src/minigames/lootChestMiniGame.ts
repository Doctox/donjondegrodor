import Phaser from "phaser";
import { IMAGE_ASSETS, INVENTORY_ITEM_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { ItemRarity, LOOTABLE_ITEM_DEFINITIONS } from "../data/itemDefinitions";
import {
  MINI_GAME_EVENT_IMAGE_HEIGHT,
  MINI_GAME_EVENT_IMAGE_WIDTH,
  MiniGameController,
  MiniGameHost,
  MiniGameResult
} from "./miniGameTypes";

type RarityDefinition = {
  rarity: ItemRarity;
  weight: number;
};

const RARITIES: RarityDefinition[] = [
  { rarity: "common", weight: 70 },
  { rarity: "rare", weight: 20 },
  { rarity: "epic", weight: 8 },
  { rarity: "legendary", weight: 2 }
];
const LOOT_CHEST_IMAGE = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2 - 52,
  width: MINI_GAME_EVENT_IMAGE_WIDTH,
  height: MINI_GAME_EVENT_IMAGE_HEIGHT
};
const LOOT_CHEST_BACKDROP_ALPHA = 0.82;
const DELAYED_HINT_MS = 4000;
const EXIT_HINT_MS = 4000;

export class LootChestMiniGame implements MiniGameController {
  private eventImage?: Phaser.GameObjects.Image;
  private keyImage?: Phaser.GameObjects.Image;
  private rarityImage?: Phaser.GameObjects.Image;
  private delayedHint?: Phaser.GameObjects.Text;
  private delayedHintEvent?: Phaser.Time.TimerEvent;
  private exitHint?: Phaser.GameObjects.Text;
  private exitHitZone?: Phaser.GameObjects.Zone;

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    const scene = this.host.scene;
    scene.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x000000, LOOT_CHEST_BACKDROP_ALPHA).setOrigin(0).setDepth(3);

    this.eventImage = scene.add
      .image(LOOT_CHEST_IMAGE.x, LOOT_CHEST_IMAGE.y, IMAGE_ASSETS.lootChestClosed.key)
      .setDisplaySize(LOOT_CHEST_IMAGE.width, LOOT_CHEST_IMAGE.height)
      .setDepth(4);
    this.keyImage = scene.add
      .image(LOOT_CHEST_IMAGE.x, LOOT_CHEST_IMAGE.y, IMAGE_ASSETS.lootChestKeyAppear.key)
      .setDisplaySize(LOOT_CHEST_IMAGE.width, LOOT_CHEST_IMAGE.height)
      .setVisible(false)
      .setDepth(4);

    const hitZone = scene.add.zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT).setDepth(5).setInteractive({
      useHandCursor: true
    });
    hitZone.on("pointerdown", () => this.advance());
    this.delayedHintEvent = scene.time.delayedCall(DELAYED_HINT_MS, () => this.showDelayedHint());
  }

  getReportState(): Record<string, unknown> {
    return {
      step: this.host.getStep()
    };
  }

  private advance(): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.clearDelayedHint();
    this.host.setStep(this.host.getStep() + 1);
    this.host.getStatusText()?.setText("");
    this.shakeChest();

    const step = this.host.getStep();
    if (step <= 4) {
      this.eventImage?.setTexture(IMAGE_ASSETS.lootChestClosed.key);
      this.keyImage?.setTexture(this.getStepTexture(step));
      this.keyImage?.setVisible(true);
    }

    if (step >= 5) {
      this.openChest();
    }

    this.host.publishMiniGameReport();
  }

  private showDelayedHint(): void {
    if (this.host.getCompleted() || this.host.getStep() > 0 || this.delayedHint) {
      return;
    }

    this.delayedHint = this.host.scene.add
      .text(LOOT_CHEST_IMAGE.x, LOOT_CHEST_IMAGE.y, GAME_TEXTS.miniGames.lootChest.delayedClickHint, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "64px",
        color: "#fff7ce",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 9
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.host.scene.tweens.add({
      targets: this.delayedHint,
      alpha: 0.32,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 360,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private clearDelayedHint(): void {
    this.delayedHintEvent?.remove(false);
    this.delayedHintEvent = undefined;
    if (this.delayedHint) {
      this.host.scene.tweens.killTweensOf(this.delayedHint);
    }
    this.delayedHint?.destroy();
    this.delayedHint = undefined;
  }

  private shakeChest(): void {
    if (!this.eventImage) {
      return;
    }

    this.host.scene.tweens.add({
      targets: [this.eventImage, this.keyImage].filter(Boolean),
      x: { from: WORLD_WIDTH / 2 - 10, to: WORLD_WIDTH / 2 + 10 },
      duration: 55,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.eventImage?.setX(LOOT_CHEST_IMAGE.x);
        this.keyImage?.setX(LOOT_CHEST_IMAGE.x);
      }
    });
  }

  private openChest(): void {
    this.host.setCompleted(true);
    this.keyImage?.setVisible(false);
    this.eventImage?.setTexture(IMAGE_ASSETS.lootChestOpen.key);
    this.host.scene.time.delayedCall(320, () => this.runRarityReveal());
  }

  private runRarityReveal(): void {
    const rarity = this.pickRarity();
    const result = this.pickResult(rarity);
    this.host.setResult(result);

    const delays = [45, 50, 58, 70, 88, 112, 145, 190, 250, 330, 430, 520, 650, 830];
    const spinOrder: ItemRarity[] = ["common", "rare", "epic", "legendary"];
    let tick = 0;

    const spin = (): void => {
      const currentRarity = spinOrder[tick % spinOrder.length];
      this.showRarityImage(currentRarity);
      this.host.getRarityText()?.setText(GAME_TEXTS.miniGames.lootChest.rarity(this.getRarityLabel(currentRarity)));

      if (tick >= delays.length) {
        this.showRarityImage(rarity);
        this.host.scene.time.delayedCall(360, () => this.showResult(result, rarity));
        return;
      }

      const delay = delays[tick];
      tick += 1;
      this.host.scene.time.delayedCall(delay, spin);
    };

    spin();
  }

  private showRarityImage(rarity: ItemRarity): void {
    if (!this.rarityImage) {
      this.rarityImage = this.host.scene.add
        .image(LOOT_CHEST_IMAGE.x, LOOT_CHEST_IMAGE.y, this.getRarityTexture(rarity))
        .setDisplaySize(LOOT_CHEST_IMAGE.width, LOOT_CHEST_IMAGE.height)
        .setDepth(5);
      return;
    }

    this.rarityImage.setTexture(this.getRarityTexture(rarity));
  }

  private showResult(result: MiniGameResult, rarity: ItemRarity): void {
    this.host.getRarityText()?.setText(GAME_TEXTS.miniGames.lootChest.rarity(this.getRarityLabel(rarity)));

    if (result.itemId) {
      const asset = INVENTORY_ITEM_ASSETS[result.itemId as keyof typeof INVENTORY_ITEM_ASSETS];
      if (asset && this.host.scene.textures.exists(asset.key)) {
        const icon = this.host.scene.add.image(WORLD_WIDTH / 2, 548, asset.key).setDepth(6);
        const scale = Math.min(360 / icon.width, 360 / icon.height);
        icon.setScale(scale * 0.2);
        this.host.scene.tweens.add({ targets: icon, scaleX: scale, scaleY: scale, duration: 360, ease: "Back.easeOut" });
      }
    } else {
      this.host.getStatusText()?.setText("");
    }

    this.host.getStatusText()?.setText("");
    this.createExitHitZone(result);
    this.host.scene.time.delayedCall(EXIT_HINT_MS, () => this.showExitHint());
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
    this.exitHitZone.on("pointerdown", () => this.host.finishMiniGame(result));
  }

  private showExitHint(): void {
    if (this.exitHint) {
      return;
    }

    this.exitHint = this.host.scene.add
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.miniGames.lootChest.exitHint, {
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

  private pickRarity(): ItemRarity {
    const total = RARITIES.reduce((sum, rarity) => sum + rarity.weight, 0);
    let cursor = Math.random() * total;
    for (const rarity of RARITIES) {
      cursor -= rarity.weight;
      if (cursor <= 0) {
        return rarity.rarity;
      }
    }

    return "common";
  }

  private pickResult(rarity: ItemRarity): MiniGameResult {
    const owned = new Set(this.host.getOwnedInventory());
    const sameRarity = LOOTABLE_ITEM_DEFINITIONS.filter(
      (definition) => definition.rarity === rarity && !owned.has(definition.id)
    );
    const fallback = LOOTABLE_ITEM_DEFINITIONS.filter((definition) => !owned.has(definition.id));
    const candidates = sameRarity.length > 0 ? sameRarity : fallback;

    if (candidates.length === 0) {
      return { type: "loot_chest", outcome: "neutral", goldDelta: 3 };
    }

    const item = candidates[Math.floor(Math.random() * candidates.length)];
    return { type: "loot_chest", outcome: "success", itemId: item.id };
  }

  private getStepTexture(step: number): string {
    if (step === 1) {
      return IMAGE_ASSETS.lootChestKeyAppear.key;
    }
    if (step === 2) {
      return IMAGE_ASSETS.lootChestKeyInsert1.key;
    }
    if (step === 3) {
      return IMAGE_ASSETS.lootChestKeyInsert2.key;
    }
    if (step === 4) {
      return IMAGE_ASSETS.lootChestKeyTurn.key;
    }

    return IMAGE_ASSETS.lootChestOpen.key;
  }

  private getRarityTexture(rarity: ItemRarity): string {
    if (rarity === "rare") {
      return IMAGE_ASSETS.lootChestRarityRare.key;
    }
    if (rarity === "epic") {
      return IMAGE_ASSETS.lootChestRarityEpic.key;
    }
    if (rarity === "legendary") {
      return IMAGE_ASSETS.lootChestRarityLegendary.key;
    }

    return IMAGE_ASSETS.lootChestRarityCommon.key;
  }

  private getRarityLabel(rarity: ItemRarity): string {
    return GAME_TEXTS.miniGames.lootChest.rarityLabels[rarity];
  }
}
