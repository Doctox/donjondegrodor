import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  MiniGameController,
  MiniGameHost,
  MiniGameResult
} from "./miniGameTypes";

const DISPLAY = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT
};
const BUBBLE_AREA = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT
};
const BUBBLE = {
  size: 260,
  hitSize: 244,
  minTimeoutMs: 560,
  maxTimeoutMs: 930,
  burstMs: 95,
  minCount: 3,
  maxCount: 7,
  paddingX: 135,
  paddingTop: 135,
  paddingBottom: 135
};
const SUCCESS_GOLD = 10;
const COUNTDOWN_VALUES = [3, 2, 1, 0];
const COUNTDOWN_INTERVAL_MS = 520;

type DodgeChestPhase = "countdown" | "running" | "success" | "failure";

export class DodgeChestMiniGame implements MiniGameController {
  private background?: Phaser.GameObjects.Image;
  private bubbleImage?: Phaser.GameObjects.Image;
  private bubbleHitZone?: Phaser.GameObjects.Zone;
  private missHitZone?: Phaser.GameObjects.Zone;
  private timeoutEvent?: Phaser.Time.TimerEvent;
  private countdownText?: Phaser.GameObjects.Text;
  private currentBubble = 0;
  private targetBubbles = 0;
  private currentBubbleFrame = 1;
  private currentBubbleTimeoutMs = 0;
  private phase: DodgeChestPhase = "countdown";
  private exitHitZone?: Phaser.GameObjects.Zone;
  private exitHint?: Phaser.GameObjects.Text;
  private exitHintTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    this.background = this.host.scene.add
      .image(DISPLAY.x, DISPLAY.y, IMAGE_ASSETS.dodgeChestOpen.key)
      .setDisplaySize(DISPLAY.width, DISPLAY.height)
      .setDepth(3);
    this.host.getStatusText()?.setText("");
    this.startCountdown();
  }

  getReportState(): Record<string, unknown> {
    return {
      phase: this.phase,
      currentBubble: this.currentBubble,
      targetBubbles: this.targetBubbles,
      currentBubbleFrame: this.currentBubbleFrame,
      currentBubbleTimeoutMs: this.currentBubbleTimeoutMs
    };
  }

  private startSequence(): void {
    if (this.host.getCompleted() || this.phase !== "countdown") {
      return;
    }

    this.phase = "running";
    this.countdownText?.destroy();
    this.countdownText = undefined;
    this.targetBubbles = Phaser.Math.Between(BUBBLE.minCount, BUBBLE.maxCount);
    this.background?.setTexture(IMAGE_ASSETS.dodgeChestDodge.key);
    this.createMissHitZone();
    this.host.getRarityText()?.setText("");
    this.spawnNextBubble();
  }

  private startCountdown(): void {
    this.countdownText = this.host.scene.add
      .text(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "", {
        fontFamily: "Georgia, serif",
        fontSize: "126px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setDepth(9);

    let index = 0;
    const tick = (): void => {
      const value = COUNTDOWN_VALUES[index];
      this.host.setStep(index);
      this.countdownText?.setText(String(value));
      this.host.publishMiniGameReport();
      index += 1;

      if (index < COUNTDOWN_VALUES.length) {
        this.host.scene.time.delayedCall(COUNTDOWN_INTERVAL_MS, tick);
        return;
      }

      this.host.scene.time.delayedCall(COUNTDOWN_INTERVAL_MS, () => this.startSequence());
    };

    tick();
  }

  private spawnNextBubble(): void {
    if (this.host.getCompleted()) {
      return;
    }

    if (this.currentBubble >= this.targetBubbles) {
      this.succeed();
      return;
    }

    this.clearBubble();
    this.currentBubble += 1;
    this.host.setStep(this.currentBubble);
    this.currentBubbleFrame = Phaser.Math.Between(1, 6);
    this.currentBubbleTimeoutMs = Phaser.Math.Between(BUBBLE.minTimeoutMs, BUBBLE.maxTimeoutMs);
    const position = this.pickBubblePosition();
    this.bubbleImage = this.host.scene.add
      .image(position.x, position.y, this.getFrameTexture(this.currentBubbleFrame, "ok"))
      .setDisplaySize(BUBBLE.size, BUBBLE.size)
      .setDepth(6);
    this.bubbleHitZone = this.host.scene.add
      .zone(position.x, position.y, BUBBLE.hitSize, BUBBLE.hitSize)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });
    this.bubbleHitZone.on("pointerdown", () => this.popBubble());
    this.timeoutEvent = this.host.scene.time.delayedCall(this.currentBubbleTimeoutMs, () => this.fail());
    this.host.getStatusText()?.setText("");
    this.host.publishMiniGameReport();
  }

  private createMissHitZone(): void {
    this.missHitZone?.destroy();
    this.missHitZone = this.host.scene.add
      .zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(8)
      .setInteractive({ useHandCursor: false });
    this.missHitZone.on("pointerdown", () => this.fail());
  }

  private popBubble(): void {
    if (this.host.getCompleted() || this.phase !== "running") {
      return;
    }

    this.timeoutEvent?.remove(false);
    this.timeoutEvent = undefined;
    this.bubbleHitZone?.destroy();
    this.bubbleHitZone = undefined;
    this.bubbleImage?.setTexture(this.getFrameTexture(this.currentBubbleFrame, "break"));
    this.host.scene.time.delayedCall(BUBBLE.burstMs, () => this.spawnNextBubble());
  }

  private succeed(): void {
    this.clearBubble();
    const result: MiniGameResult = {
      type: "dodge_chest",
      outcome: "success",
      goldDelta: SUCCESS_GOLD,
      dodgeChestFrame: this.currentBubbleFrame
    };
    this.finish(result, "success");
  }

  private fail(): void {
    const result: MiniGameResult = {
      type: "dodge_chest",
      outcome: "failure",
      lifeDelta: -1,
      dodgeChestFrame: this.currentBubbleFrame
    };
    this.finish(result, "failure");
  }

  private finish(result: MiniGameResult, outcome: "success" | "failure"): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.host.setCompleted(true);
    this.phase = outcome;
    this.timeoutEvent?.remove(false);
    this.timeoutEvent = undefined;
    this.bubbleHitZone?.destroy();
    this.bubbleHitZone = undefined;
    this.missHitZone?.destroy();
    this.missHitZone = undefined;
    this.background?.setTexture(outcome === "success" ? IMAGE_ASSETS.dodgeChestOpenWin.key : IMAGE_ASSETS.dodgeChestDodgeLose.key);
    this.bubbleImage?.setTexture(this.getFrameTexture(this.currentBubbleFrame, outcome === "success" ? "ok" : "break"));
    this.bubbleImage?.setVisible(outcome === "failure");
    this.host.setResult(result);
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
      this.host.finishMiniGame(result);
    });
  }

  private showExitHint(): void {
    if (this.exitHint) {
      return;
    }

    this.exitHint = this.host.scene.add
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.miniGames.dodgeChest.exitHint, {
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

  private clearBubble(): void {
    this.timeoutEvent?.remove(false);
    this.timeoutEvent = undefined;
    this.bubbleHitZone?.destroy();
    this.bubbleHitZone = undefined;
    this.missHitZone?.destroy();
    this.missHitZone = undefined;
    this.bubbleImage?.destroy();
    this.bubbleImage = undefined;
  }

  private pickBubblePosition(): { x: number; y: number } {
    const minX = BUBBLE_AREA.x - BUBBLE_AREA.width / 2 + BUBBLE.paddingX;
    const maxX = BUBBLE_AREA.x + BUBBLE_AREA.width / 2 - BUBBLE.paddingX;
    const minY = BUBBLE_AREA.y - BUBBLE_AREA.height / 2 + BUBBLE.paddingTop;
    const maxY = BUBBLE_AREA.y + BUBBLE_AREA.height / 2 - BUBBLE.paddingBottom;

    return {
      x: Phaser.Math.Between(Math.round(minX), Math.round(maxX)),
      y: Phaser.Math.Between(Math.round(minY), Math.round(maxY))
    };
  }

  private getFrameTexture(frame: number, state: "ok" | "break"): string {
    const frameIndex = Math.max(1, Math.min(6, frame)) as 1 | 2 | 3 | 4 | 5 | 6;
    const byFrame = {
      1: {
        ok: IMAGE_ASSETS.dodgeChestFrame1Ok.key,
        break: IMAGE_ASSETS.dodgeChestFrame1Break.key
      },
      2: {
        ok: IMAGE_ASSETS.dodgeChestFrame2Ok.key,
        break: IMAGE_ASSETS.dodgeChestFrame2Break.key
      },
      3: {
        ok: IMAGE_ASSETS.dodgeChestFrame3Ok.key,
        break: IMAGE_ASSETS.dodgeChestFrame3Break.key
      },
      4: {
        ok: IMAGE_ASSETS.dodgeChestFrame4Ok.key,
        break: IMAGE_ASSETS.dodgeChestFrame4Break.key
      },
      5: {
        ok: IMAGE_ASSETS.dodgeChestFrame5Ok.key,
        break: IMAGE_ASSETS.dodgeChestFrame5Break.key
      },
      6: {
        ok: IMAGE_ASSETS.dodgeChestFrame6Ok.key,
        break: IMAGE_ASSETS.dodgeChestFrame6Break.key
      }
    } satisfies Record<1 | 2 | 3 | 4 | 5 | 6, Record<"ok" | "break", string>>;

    return byFrame[frameIndex][state];
  }
}
