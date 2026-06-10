import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  BonneteauIssue,
  MiniGameController,
  MiniGameHost,
  MiniGameResult
} from "./miniGameTypes";

export class BonneteauMiniGame implements MiniGameController {
  private hitZones: Phaser.GameObjects.Zone[] = [];
  private cardOverlayImage?: Phaser.GameObjects.Image;
  private resultOverlayImage?: Phaser.GameObjects.Image;
  private delayedClickHint?: Phaser.GameObjects.Text;
  private delayedClickHintTween?: Phaser.Tweens.Tween;
  private delayedClickHintTimer?: Phaser.Time.TimerEvent;
  private delayedExitHint?: Phaser.GameObjects.Text;
  private delayedExitHintTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, IMAGE_ASSETS.bonneteauFaceCache.key)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(4);
    this.cardOverlayImage = this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, IMAGE_ASSETS.bonneteauSlot1Carte.key)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(5)
      .setVisible(false);
    this.resultOverlayImage = this.host.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, IMAGE_ASSETS.bonneteauSlot1Po.key)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(6)
      .setVisible(false);

    const positions = [
      { slot: 1 as const, x: 834, y: 424, width: 210, height: 190 },
      { slot: 2 as const, x: 988, y: 482, width: 210, height: 190 },
      { slot: 3 as const, x: 1136, y: 540, width: 230, height: 200 }
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
    this.delayedClickHintTimer = this.host.scene.time.delayedCall(4000, () => this.showDelayedClickHint());
  }

  private reveal(slot: 1 | 2 | 3): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.host.setCompleted(true);
    this.hideDelayedClickHint();
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
    const exitZone = this.host.scene.add
      .zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(8)
      .setInteractive({ useHandCursor: true });
    this.delayedExitHintTimer = this.host.scene.time.delayedCall(4000, () => this.showDelayedExitHint());
    exitZone.once("pointerdown", () => {
      this.hideDelayedExitHint();
      exitZone.destroy();
      this.host.finishMiniGame(result);
    });
    this.host.publishMiniGameReport();
  }

  private showDelayedClickHint(): void {
    if (this.host.getCompleted() || this.delayedClickHint) {
      return;
    }

    this.delayedClickHint = this.host.scene.add
      .text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, GAME_TEXTS.miniGames.bonneteau.delayedClickHint, {
        fontFamily: "Georgia, serif",
        fontSize: "72px",
        color: "#ffffff",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 9
      })
      .setOrigin(0.5)
      .setDepth(8)
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

  private showDelayedExitHint(): void {
    if (!this.host.getCompleted() || this.delayedExitHint) {
      return;
    }

    this.delayedExitHint = this.host.scene.add
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.miniGames.bonneteau.delayedExitHint, {
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

  private hideDelayedExitHint(): void {
    this.delayedExitHintTimer?.remove(false);
    this.delayedExitHintTimer = undefined;
    this.delayedExitHint?.destroy();
    this.delayedExitHint = undefined;
  }

  private hideDelayedClickHint(): void {
    this.delayedClickHintTimer?.remove(false);
    this.delayedClickHintTimer = undefined;
    this.delayedClickHintTween?.stop();
    this.delayedClickHintTween = undefined;
    this.delayedClickHint?.destroy();
    this.delayedClickHint = undefined;
  }

  private pickIssue(): BonneteauIssue {
    const issues: BonneteauIssue[] = ["grodor", "gold", "skull", "pierced_pouch"];
    return issues[Math.floor(Math.random() * issues.length)];
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
