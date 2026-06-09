import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  BonneteauIssue,
  MINI_GAME_EVENT_IMAGE_HEIGHT,
  MINI_GAME_EVENT_IMAGE_WIDTH,
  MiniGameController,
  MiniGameHost,
  MiniGameResult
} from "./miniGameTypes";

export class BonneteauMiniGame implements MiniGameController {
  private hitZones: Phaser.GameObjects.Zone[] = [];
  private cardOverlayImage?: Phaser.GameObjects.Image;
  private resultOverlayImage?: Phaser.GameObjects.Image;

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 54, IMAGE_ASSETS.bonneteauFaceCache.key)
      .setDisplaySize(MINI_GAME_EVENT_IMAGE_WIDTH, MINI_GAME_EVENT_IMAGE_HEIGHT)
      .setDepth(4);
    this.cardOverlayImage = this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 54, IMAGE_ASSETS.bonneteauSlot1Carte.key)
      .setDisplaySize(MINI_GAME_EVENT_IMAGE_WIDTH, MINI_GAME_EVENT_IMAGE_HEIGHT)
      .setDepth(5)
      .setVisible(false);
    this.resultOverlayImage = this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 54, IMAGE_ASSETS.bonneteauSlot1Po.key)
      .setDisplaySize(MINI_GAME_EVENT_IMAGE_WIDTH, MINI_GAME_EVENT_IMAGE_HEIGHT)
      .setDepth(6)
      .setVisible(false);
    this.host.getStatusText()?.setText(GAME_TEXTS.miniGames.bonneteau.instruction);

    const positions = [
      { slot: 1 as const, x: 925, y: 559, width: 110, height: 135 },
      { slot: 2 as const, x: 1000, y: 587, width: 105, height: 150 },
      { slot: 3 as const, x: WORLD_WIDTH / 2 + 182, y: WORLD_HEIGHT / 2 + 76 }
    ];

    positions.forEach(({ slot, x, y, width = 150, height = 260 }) => {
      const hitZone = this.host.scene.add.zone(x, y, width, height).setDepth(7).setInteractive({ useHandCursor: true });
      hitZone.on("pointerdown", () => {
        (window as unknown as { __bonneteauClickReport?: unknown }).__bonneteauClickReport = { slot, x, y, width, height };
        this.reveal(slot);
      });
      this.hitZones.push(hitZone);
    });
    (window as unknown as { __bonneteauHitZoneReport?: unknown }).__bonneteauHitZoneReport = positions;
  }

  private reveal(slot: 1 | 2 | 3): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.host.setCompleted(true);
    const issue = this.pickIssue();
    const goldLoss = issue === "pierced_pouch" ? Math.min(this.host.getCarriedGold(), Phaser.Math.Between(1, 3)) : undefined;
    const atMaxLife = this.host.getMaxLife() >= 12;
    const result: MiniGameResult = {
      type: "bonneteau",
      outcome: issue === "grodor" || issue === "gold" ? "success" : "failure",
      issue,
      slot,
      goldDelta: issue === "gold" ? 10 : undefined,
      goldLoss,
      lifeDelta: issue === "skull" ? -1 : undefined,
      maxLifeDelta: issue === "grodor" && !atMaxLife ? 1 : undefined
    };
    this.host.setResult(result);

    this.hitZones.forEach((hitZone) => hitZone.destroy());
    this.hitZones = [];
    this.cardOverlayImage?.setTexture(this.getTexture(slot, "carte"));
    this.cardOverlayImage?.setVisible(true);
    this.resultOverlayImage?.setTexture(this.getTexture(slot, issue));
    this.resultOverlayImage?.setVisible(true);
    this.host.getStatusText()?.setText(this.getResultText(result));
    this.host.getRarityText()?.setText(GAME_TEXTS.miniGames.bonneteau.revealed);
    this.host.createContinueButton(result);
    this.host.publishMiniGameReport();
  }

  private pickIssue(): BonneteauIssue {
    const issues: BonneteauIssue[] = ["grodor", "gold", "skull", "pierced_pouch"];
    return issues[Math.floor(Math.random() * issues.length)];
  }

  private getResultText(result: MiniGameResult): string {
    if (result.issue === "grodor") {
      return result.maxLifeDelta ? GAME_TEXTS.miniGames.bonneteau.grodor : GAME_TEXTS.miniGames.bonneteau.grodorMax;
    }
    if (result.issue === "gold") {
      return GAME_TEXTS.miniGames.bonneteau.gold;
    }
    if (result.issue === "skull") {
      return GAME_TEXTS.miniGames.bonneteau.skull;
    }
    if (result.issue === "pierced_pouch") {
      const loss = result.goldLoss ?? 0;
      return loss > 0 ? GAME_TEXTS.miniGames.bonneteau.piercedPouch(loss) : GAME_TEXTS.miniGames.bonneteau.piercedPouchEmpty;
    }

    return GAME_TEXTS.miniGames.bonneteau.revealed;
  }

  private getTexture(slot: 1 | 2 | 3, issue: BonneteauIssue | "carte"): string {
    const bySlot = {
      1: {
        carte: IMAGE_ASSETS.bonneteauSlot1Carte.key,
        grodor: IMAGE_ASSETS.bonneteauSlot1Grodor.key,
        gold: IMAGE_ASSETS.bonneteauSlot1Po.key,
        skull: IMAGE_ASSETS.bonneteauSlot1Crane.key,
        pierced_pouch: IMAGE_ASSETS.bonneteauSlot1Bourse.key
      },
      2: {
        carte: IMAGE_ASSETS.bonneteauSlot2Carte.key,
        grodor: IMAGE_ASSETS.bonneteauSlot2Grodor.key,
        gold: IMAGE_ASSETS.bonneteauSlot2Po.key,
        skull: IMAGE_ASSETS.bonneteauSlot2Crane.key,
        pierced_pouch: IMAGE_ASSETS.bonneteauSlot2Bourse.key
      },
      3: {
        carte: IMAGE_ASSETS.bonneteauSlot3Carte.key,
        grodor: IMAGE_ASSETS.bonneteauSlot3Grodor.key,
        gold: IMAGE_ASSETS.bonneteauSlot3Po.key,
        skull: IMAGE_ASSETS.bonneteauSlot3Crane.key,
        pierced_pouch: IMAGE_ASSETS.bonneteauSlot3Bourse.key
      }
    } satisfies Record<1 | 2 | 3, Record<BonneteauIssue | "carte", string>>;

    return bySlot[slot][issue];
  }
}
