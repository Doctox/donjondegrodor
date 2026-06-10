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
const COIN_FLIP_UI = {
  y: 870,
  betX: 580,
  minusX: 330,
  plusX: 830,
  pileX: 1180,
  faceX: 1530,
  betPanelWidth: 390,
  betPanelHeight: 126,
  smallButtonWidth: 112,
  smallButtonHeight: 56,
  choiceButtonWidth: 300,
  choiceButtonHeight: 98
};
const EXIT_HINT_MS = 4000;

export class CoinFlipMiniGame implements MiniGameController {
  private eventImage?: Phaser.GameObjects.Image;
  private controls: Phaser.GameObjects.GameObject[] = [];
  private betText?: Phaser.GameObjects.Text;
  private exitHint?: Phaser.GameObjects.Text;
  private exitHitZone?: Phaser.GameObjects.Zone;
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
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
    this.createControls();
    this.host.publishMiniGameReport();
  }

  private createControls(): void {
    this.clearControls();
    const text = GAME_TEXTS.miniGames.coinFlip;
    const betBackground = this.host.scene.add
      .image(COIN_FLIP_UI.betX, COIN_FLIP_UI.y, IMAGE_ASSETS.bankDepositPanelEmpty.key)
      .setDisplaySize(COIN_FLIP_UI.betPanelWidth, COIN_FLIP_UI.betPanelHeight)
      .setDepth(6);
    this.betText = this.host.scene.add
      .text(COIN_FLIP_UI.betX, COIN_FLIP_UI.y, "", {
        fontFamily: "Georgia, serif",
        fontSize: "30px",
        color: "#fff1c2",
        align: "center",
        stroke: "#070402",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(7);
    const minusButton = this.createFramedButton(
      COIN_FLIP_UI.minusX,
      COIN_FLIP_UI.y,
      COIN_FLIP_UI.smallButtonWidth,
      COIN_FLIP_UI.smallButtonHeight,
      text.betMinus,
      () => {
      this.bet = Math.max(1, this.bet - 1);
      this.renderBetText();
      },
      34
    );
    const plusButton = this.createFramedButton(
      COIN_FLIP_UI.plusX,
      COIN_FLIP_UI.y,
      COIN_FLIP_UI.smallButtonWidth,
      COIN_FLIP_UI.smallButtonHeight,
      text.betPlus,
      () => {
      this.bet = Math.min(this.host.getCarriedGold(), this.bet + 1);
      this.renderBetText();
      },
      34
    );
    const pileButton = this.createFramedButton(
      COIN_FLIP_UI.pileX,
      COIN_FLIP_UI.y,
      COIN_FLIP_UI.choiceButtonWidth,
      COIN_FLIP_UI.choiceButtonHeight,
      text.pileButton,
      () => this.throwCoin("pile"),
      32
    );
    const faceButton = this.createFramedButton(
      COIN_FLIP_UI.faceX,
      COIN_FLIP_UI.y,
      COIN_FLIP_UI.choiceButtonWidth,
      COIN_FLIP_UI.choiceButtonHeight,
      text.faceButton,
      () => this.throwCoin("face"),
      32
    );

    this.controls.push(betBackground, this.betText, minusButton, plusButton, pileButton, faceButton);
    this.renderBetText();
  }

  private createFramedButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    fontSize: number
  ): Phaser.GameObjects.Container {
    const button = this.host.scene.add.container(x, y).setDepth(7);
    const frame = this.host.scene.add
      .image(0, 0, IMAGE_ASSETS.bankMoneyStatusPanelEmpty.key)
      .setDisplaySize(width, height);
    const text = this.host.scene.add
      .text(0, 0, label, {
        fontFamily: "Georgia, serif",
        fontSize: `${fontSize}px`,
        color: "#fff1c2",
        align: "center",
        stroke: "#070402",
        strokeThickness: 5
      })
      .setOrigin(0.5);
    button.add([frame, text]);
    button.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    button.on("pointerover", () => button.setScale(1.04));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerdown", onClick);
    return button;
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
    this.host.getStatusText()?.setText("");
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
    this.host.getStatusText()?.setText("");
    this.host.getRarityText()?.setText("");
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
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.miniGames.coinFlip.exitHint, {
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
