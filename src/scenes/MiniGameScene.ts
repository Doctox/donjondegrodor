import Phaser from "phaser";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { ArmWrestlingMiniGame } from "../minigames/armWrestlingMiniGame";
import { BonneteauMiniGame } from "../minigames/bonneteauMiniGame";
import { CoinFlipMiniGame } from "../minigames/coinFlipMiniGame";
import { DodgeChestMiniGame } from "../minigames/dodgeChestMiniGame";
import { ElevatorMiniGame } from "../minigames/elevatorMiniGame";
import { JumpMiniGame } from "../minigames/jumpMiniGame";
import { LootChestMiniGame } from "../minigames/lootChestMiniGame";
import { SlotMachineMiniGame } from "../minigames/slotMachineMiniGame";
import {
  MiniGameController,
  MiniGameHost,
  MiniGameResult,
  MiniGameSceneData,
  MiniGameType
} from "../minigames/miniGameTypes";

export type { BonneteauIssue, MiniGameResult, MiniGameSceneData, MiniGameType } from "../minigames/miniGameTypes";

export class MiniGameScene extends Phaser.Scene {
  private type: MiniGameType = "loot_chest";
  private ownedInventory: string[] = [];
  private carriedGold = 0;
  private life = 0;
  private maxLife = 0;
  private step = 0;
  private statusText?: Phaser.GameObjects.Text;
  private rarityText?: Phaser.GameObjects.Text;
  private result?: MiniGameResult;
  private completed = false;
  private activeMiniGame?: MiniGameController;

  constructor() {
    super("MiniGameScene");
  }

  create(data: MiniGameSceneData): void {
    this.type = data.type;
    this.ownedInventory = [...(data.ownedInventory ?? [])];
    this.carriedGold = Math.max(0, Math.trunc(data.carriedGold ?? 0));
    this.maxLife = Math.max(0, Math.trunc(data.maxLife ?? 0));
    this.life = Math.max(0, Math.min(this.maxLife, Math.trunc(data.life ?? this.maxLife)));
    this.step = 0;
    this.completed = false;
    this.result = undefined;
    this.statusText = undefined;
    this.rarityText = undefined;
    this.activeMiniGame = undefined;

    this.createSharedShell();
    this.activeMiniGame = this.createMiniGameController();
    this.activeMiniGame.start();
    this.publishMiniGameReport();
  }

  private createSharedShell(): void {
    this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x050403, 0.58).setOrigin(0).setDepth(1);

    if (
      this.type !== "loot_chest" &&
      this.type !== "coin_flip" &&
      this.type !== "bonneteau" &&
      this.type !== "slot_machine" &&
      this.type !== "dodge_chest" &&
      this.type !== "jump" &&
      this.type !== "arm_wrestling" &&
      this.type !== "elevator"
    ) {
      this.add
        .text(WORLD_WIDTH / 2, 158, this.getMiniGameTitle(), {
          fontFamily: "Georgia, serif",
          fontSize: "46px",
          color: "#fff1c2",
          stroke: "#120d0a",
          strokeThickness: 7
        })
        .setOrigin(0.5)
        .setDepth(8);
    }

    this.statusText = this.add
      .text(
        WORLD_WIDTH / 2,
        238,
        this.type === "loot_chest" ||
          this.type === "coin_flip" ||
          this.type === "bonneteau" ||
          this.type === "slot_machine" ||
          this.type === "dodge_chest" ||
          this.type === "jump" ||
          this.type === "arm_wrestling" ||
          this.type === "elevator"
          ? ""
          : this.getMiniGameIntro(),
        {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "28px",
        color: "#f9dfaa",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5,
        wordWrap: { width: 720 }
        }
      )
      .setOrigin(0.5)
      .setDepth(8);

    this.rarityText = this.add
      .text(WORLD_WIDTH / 2, 764, "", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "28px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5,
        wordWrap: { width: 760 }
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createMiniGameController(): MiniGameController {
    const host = this.createHost();
    if (this.type === "coin_flip") {
      return new CoinFlipMiniGame(host);
    }
    if (this.type === "bonneteau") {
      return new BonneteauMiniGame(host);
    }
    if (this.type === "slot_machine") {
      return new SlotMachineMiniGame(host);
    }
    if (this.type === "dodge_chest") {
      return new DodgeChestMiniGame(host);
    }
    if (this.type === "jump") {
      return new JumpMiniGame(host);
    }
    if (this.type === "arm_wrestling") {
      return new ArmWrestlingMiniGame(host);
    }
    if (this.type === "elevator") {
      return new ElevatorMiniGame(host);
    }

    return new LootChestMiniGame(host);
  }

  private createHost(): MiniGameHost {
    return {
      scene: this,
      getStatusText: () => this.statusText,
      getRarityText: () => this.rarityText,
      getCarriedGold: () => this.carriedGold,
      getOwnedInventory: () => [...this.ownedInventory],
      getLife: () => this.life,
      getMaxLife: () => this.maxLife,
      getStep: () => this.step,
      getCompleted: () => this.completed,
      setStep: (step) => {
        this.step = step;
      },
      setCompleted: (completed) => {
        this.completed = completed;
      },
      setResult: (result) => {
        this.result = result;
      },
      finishMiniGame: (result) => this.finish(result),
      createContinueButton: (result) => this.createContinueButton(result),
      createMiniGameButton: (x, y, label, onClick) => this.createMiniGameButton(x, y, label, onClick),
      publishMiniGameReport: () => this.publishMiniGameReport()
    };
  }

  private createContinueButton(result: MiniGameResult): Phaser.GameObjects.Text {
    const continueButton = this.add
      .text(WORLD_WIDTH / 2, 862, GAME_TEXTS.miniGames.lootChest.continueButton, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "26px",
        color: "#1b100b",
        backgroundColor: "#f0c071",
        padding: { x: 24, y: 11 }
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });
    continueButton.on("pointerdown", () => this.finish(result));
    return continueButton;
  }

  private createMiniGameButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "26px",
        color: "#1b100b",
        backgroundColor: "#f0c071",
        padding: { x: 24, y: 11 }
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setStyle({ backgroundColor: "#ffd98b" }));
    button.on("pointerout", () => button.setStyle({ backgroundColor: "#f0c071" }));
    button.on("pointerdown", onClick);
    return button;
  }

  private finish(result: MiniGameResult): void {
    const targetScene = this.scene.isActive("DungeonScene") ? this.scene.get("DungeonScene") : this.scene.get("VillageScene");
    targetScene.events.emit("minigame-closed", result);
    this.scene.stop();
  }

  private getMiniGameTitle(): string {
    if (this.type === "coin_flip") {
      return GAME_TEXTS.miniGames.coinFlip.title;
    }
    if (this.type === "bonneteau") {
      return GAME_TEXTS.miniGames.bonneteau.title;
    }
    if (this.type === "slot_machine") {
      return GAME_TEXTS.miniGames.slotMachine.title;
    }
    if (this.type === "dodge_chest") {
      return GAME_TEXTS.miniGames.dodgeChest.title;
    }
    if (this.type === "jump") {
      return GAME_TEXTS.miniGames.jump.title;
    }
    if (this.type === "arm_wrestling") {
      return GAME_TEXTS.miniGames.armWrestling.title;
    }
    if (this.type === "elevator") {
      return GAME_TEXTS.miniGames.elevator.title;
    }

    return GAME_TEXTS.miniGames.lootChest.title;
  }

  private getMiniGameIntro(): string {
    if (this.type === "coin_flip") {
      return GAME_TEXTS.miniGames.coinFlip.intro;
    }
    if (this.type === "bonneteau") {
      return GAME_TEXTS.miniGames.bonneteau.instruction;
    }
    if (this.type === "slot_machine") {
      return GAME_TEXTS.miniGames.slotMachine.intro;
    }
    if (this.type === "dodge_chest") {
      return GAME_TEXTS.miniGames.dodgeChest.intro;
    }
    if (this.type === "jump") {
      return GAME_TEXTS.miniGames.jump.intro;
    }
    if (this.type === "arm_wrestling") {
      return GAME_TEXTS.miniGames.armWrestling.intro;
    }
    if (this.type === "elevator") {
      return GAME_TEXTS.miniGames.elevator.intro;
    }

    return GAME_TEXTS.miniGames.lootChest.clickInstruction;
  }

  private publishMiniGameReport(): void {
    (window as unknown as { __miniGameReport?: unknown }).__miniGameReport = {
      type: this.type,
      step: this.step,
      completed: this.completed,
      carriedGold: this.carriedGold,
      life: this.life,
      maxLife: this.maxLife,
      result: this.result,
      ...(this.activeMiniGame?.getReportState?.() ?? {})
    };
  }
}
