import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import {
  MiniGameController,
  MiniGameHost,
  MiniGameResult
} from "./miniGameTypes";

const COIN_FLIP_IMAGE = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT
};

export class CoinFlipMiniGame implements MiniGameController {
  private eventImage?: Phaser.GameObjects.Image;
  private controls: Phaser.GameObjects.GameObject[] = [];
  private betText?: Phaser.GameObjects.Text;
  private bet = 1;
  private readonly launchFrames = [
    IMAGE_ASSETS.coinFlipLaunch1.key,
    IMAGE_ASSETS.coinFlipLaunch2.key,
    IMAGE_ASSETS.coinFlipLaunch3.key
  ];
  private readonly turnFrames = [IMAGE_ASSETS.coinFlipTurn1.key, IMAGE_ASSETS.coinFlipTurn2.key, IMAGE_ASSETS.coinFlipTurn3.key];
  private readonly fallFrames = [
    IMAGE_ASSETS.coinFlipFall1.key,
    IMAGE_ASSETS.coinFlipFall2.key,
    IMAGE_ASSETS.coinFlipFall3.key,
    IMAGE_ASSETS.coinFlipFall4.key
  ];

  constructor(private readonly host: MiniGameHost) {}

  start(): void {
    this.bet = Math.min(1, this.host.getCarriedGold());
    this.eventImage = this.host.scene.add
      .image(COIN_FLIP_IMAGE.x, COIN_FLIP_IMAGE.y, IMAGE_ASSETS.coinFlipStart.key)
      .setDisplaySize(COIN_FLIP_IMAGE.width, COIN_FLIP_IMAGE.height)
      .setDepth(3);

    if (this.host.getCarriedGold() <= 0) {
      const result: MiniGameResult = { type: "coin_flip", outcome: "neutral" };
      this.host.setCompleted(true);
      this.host.setResult(result);
      this.host.getStatusText()?.setText(GAME_TEXTS.miniGames.coinFlip.noGold);
      this.host.createContinueButton(result);
      return;
    }

    this.showChoice();
  }

  getReportState(): Record<string, unknown> {
    return {
      coinBet: this.bet
    };
  }

  private showChoice(): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.host.setStep(1);
    this.eventImage?.setTexture(IMAGE_ASSETS.coinFlipStart.key);
    this.host.getStatusText()?.setText(GAME_TEXTS.miniGames.coinFlip.chooseSide).setY(210).setDepth(8);
    this.host.getRarityText()?.setText("");
    this.renderBetText();
    this.createControls();
    this.host.publishMiniGameReport();
  }

  private createControls(): void {
    this.clearControls();
    const text = GAME_TEXTS.miniGames.coinFlip;
    const betBackground = this.host.scene.add.rectangle(WORLD_WIDTH / 2 - 215, 805, 260, 48, 0x120d0a, 0.84).setDepth(6);
    betBackground.setStrokeStyle(2, 0xf0c071, 0.9);
    this.betText = this.host.scene.add
      .text(WORLD_WIDTH / 2 - 215, 805, "", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#fff1c2",
        align: "center",
        stroke: "#070402",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(7);
    const minusButton = this.host.createMiniGameButton(WORLD_WIDTH / 2 - 260, 870, text.betMinus, () => {
      this.bet = Math.max(1, this.bet - 1);
      this.renderBetText();
    });
    const plusButton = this.host.createMiniGameButton(WORLD_WIDTH / 2 - 170, 870, text.betPlus, () => {
      this.bet = Math.min(this.host.getCarriedGold(), this.bet + 1);
      this.renderBetText();
    });
    const pileButton = this.host.createMiniGameButton(WORLD_WIDTH / 2 + 80, 870, text.pileButton, () => this.throwCoin("pile"));
    const faceButton = this.host.createMiniGameButton(WORLD_WIDTH / 2 + 250, 870, text.faceButton, () => this.throwCoin("face"));

    this.controls.push(betBackground, this.betText, minusButton, plusButton, pileButton, faceButton);
    this.renderBetText();
  }

  private renderBetText(): void {
    this.host.getRarityText()?.setText("");
    this.betText?.setText(GAME_TEXTS.miniGames.coinFlip.chooseBet(this.bet));
  }

  private throwCoin(choice: "pile" | "face"): void {
    if (this.host.getCompleted()) {
      return;
    }

    this.host.setCompleted(true);
    this.clearControls();
    this.host.getStatusText()?.setText(GAME_TEXTS.miniGames.coinFlip.throwing);
    this.host.getRarityText()?.setText("");

    this.playThrowSequence(choice);
  }

  private playThrowSequence(choice: "pile" | "face"): void {
    const won = Math.random() < 0.2;
    const resultSide = won ? choice : choice === "pile" ? "face" : "pile";
    const resultFrames =
      resultSide === "pile"
        ? [IMAGE_ASSETS.coinFlipPileEnd1.key, IMAGE_ASSETS.coinFlipPileEnd2.key, IMAGE_ASSETS.coinFlipPileEnd.key]
        : [IMAGE_ASSETS.coinFlipFaceEnd1.key, IMAGE_ASSETS.coinFlipFaceEnd2.key, IMAGE_ASSETS.coinFlipFaceEnd.key];
    const frames = [...this.launchFrames, ...this.turnFrames, ...this.turnFrames, ...this.turnFrames, ...this.fallFrames, ...resultFrames];
    this.playFrames(frames, 92, () => this.showResult(choice, resultSide, won));
  }

  private showResult(choice: "pile" | "face", resultSide: "pile" | "face", won: boolean): void {
    const result: MiniGameResult = {
      type: "coin_flip",
      outcome: won ? "success" : "failure",
      goldDelta: won ? this.bet : undefined,
      goldLoss: won ? undefined : this.bet,
      bet: this.bet,
      choice,
      resultSide
    };
    this.host.setResult(result);
    this.eventImage?.setTexture(resultSide === "pile" ? IMAGE_ASSETS.coinFlipPileEnd.key : IMAGE_ASSETS.coinFlipFaceEnd.key);
    this.host
      .getStatusText()
      ?.setText(
        [
          resultSide === "pile" ? GAME_TEXTS.miniGames.coinFlip.resultPile : GAME_TEXTS.miniGames.coinFlip.resultFace,
          won ? GAME_TEXTS.miniGames.coinFlip.win(this.bet) : GAME_TEXTS.miniGames.coinFlip.lose(this.bet)
        ].join("\n")
      );
    this.host.createContinueButton(result);
    this.host.publishMiniGameReport();
  }

  private playFrames(frames: string[], delayMs: number, onComplete: () => void): void {
    let index = 0;
    const next = (): void => {
      const frame = frames[index];
      if (frame) {
        this.eventImage?.setTexture(frame);
      }
      index += 1;
      if (index < frames.length) {
        this.host.scene.time.delayedCall(delayMs, next);
        return;
      }

      onComplete();
    };

    next();
  }

  private clearControls(): void {
    this.controls.forEach((control) => control.destroy());
    this.controls = [];
    this.betText = undefined;
  }
}
