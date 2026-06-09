import Phaser from "phaser";
import { IMAGE_ASSETS, INVENTORY_ITEM_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../../data/assetKeys";
import { CombatResult } from "../../data/combatResults";
import { GAME_TEXTS } from "../../data/gameTexts";
import { DungeonRunEvent, FinalDoorOutcome } from "../../systems/dungeonRunState";
import { createNineSlicePanel } from "../../ui/nineSlicePanel";

type EquipmentReplacementPanelOptions = {
  currentItemId: string;
  nextItemId: string;
  currentName: string;
  nextName: string;
  onKeep: () => void;
  onReplace: () => void;
};

export class DungeonPanelFactory {
  constructor(private readonly scene: Phaser.Scene) {}

  createFinalDoorPanel(outcome: FinalDoorOutcome, onContinue: () => void): Phaser.GameObjects.Container {
    const container = this.createStoryContainer();
    const background = this.createStoryBackground();
    const title = this.createStoryTitle(outcome.title);
    const message = this.createStoryMessage(outcome.message);
    const effect = this.createStoryEffect(outcome.effectLabel);
    const continueButton = this.createContinueButton(90, onContinue);

    container.add([background, title, message, effect, continueButton]);
    return container;
  }

  createEventPanel(event: DungeonRunEvent, onContinue: () => void): Phaser.GameObjects.Container {
    const container = this.createStoryContainer();
    const background = this.createStoryBackground();
    const title = this.createStoryTitle(event.title);
    const message = this.createStoryMessage(event.message);
    const effect = this.createStoryEffect(event.effectLabel);
    const continueButton = this.createContinueButton(90, onContinue);

    container.add([background, title, message, effect, continueButton]);
    return container;
  }

  createCombatResultPanel(
    result: CombatResult,
    canContinue: boolean,
    effectMessages: string[],
    onContinue: () => void
  ): Phaser.GameObjects.Container {
    const container = this.createStoryContainer();
    const background = this.createStoryBackground();
    const title = this.createStoryTitle(
      result.outcome === "victory" ? GAME_TEXTS.combat.resultPanel.victoryTitle : GAME_TEXTS.combat.resultPanel.deathTitle
    );
    const message = this.createStoryMessage(this.getCombatResultMessage(result));
    const effect = this.createStoryEffect(this.getCombatResultEffect(result, effectMessages));
    const children: Phaser.GameObjects.GameObject[] = [background, title, message, effect];

    if (canContinue) {
      children.push(this.createContinueButton(90, onContinue));
    }

    container.add(children);
    return container;
  }

  createEquipmentReplacementPanel(options: EquipmentReplacementPanelOptions): Phaser.GameObjects.Container {
    const text = GAME_TEXTS.miniGames.lootChest.replacementChoice;
    const container = this.scene.add.container(WORLD_WIDTH / 2, WORLD_HEIGHT / 2).setDepth(88);
    const background = createNineSlicePanel(this.scene, IMAGE_ASSETS.frameStory.key, 0, 0, 860, 430, {
      left: 142,
      right: 142,
      top: 88,
      bottom: 88
    });
    const title = this.scene.add
      .text(0, -164, text.title, {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5);
    const currentCard = this.createEquipmentChoiceCard(-210, -22, text.current(options.currentName), options.currentItemId);
    const nextCard = this.createEquipmentChoiceCard(210, -22, text.incoming(options.nextName), options.nextItemId);
    const keepButton = this.createEquipmentChoiceButton(-150, text.keepButton, options.onKeep);
    const replaceButton = this.createEquipmentChoiceButton(150, text.replaceButton, options.onReplace);

    container.add([background, title, ...currentCard, ...nextCard, keepButton, replaceButton]);
    return container;
  }

  private createStoryContainer(): Phaser.GameObjects.Container {
    return this.scene.add.container(WORLD_WIDTH / 2, WORLD_HEIGHT / 2).setDepth(80);
  }

  private createStoryBackground(): Phaser.GameObjects.NineSlice {
    return createNineSlicePanel(this.scene, IMAGE_ASSETS.frameStory.key, 0, 0, 720, 300, {
      left: 142,
      right: 142,
      top: 88,
      bottom: 88
    });
  }

  private createStoryTitle(label: string): Phaser.GameObjects.Text {
    return this.scene.add
      .text(0, -58, label, {
        fontFamily: "Georgia, serif",
        fontSize: "30px",
        color: "#fff1c2"
      })
      .setOrigin(0.5);
  }

  private createStoryMessage(label: string): Phaser.GameObjects.Text {
    return this.scene.add
      .text(0, -8, label, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "24px",
        color: "#f9dfaa",
        align: "center",
        lineSpacing: 4,
        wordWrap: { width: 430 }
      })
      .setOrigin(0.5);
  }

  private createStoryEffect(label: string): Phaser.GameObjects.Text {
    return this.scene.add
      .text(0, 44, label, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "22px",
        color: "#fff1c2",
        align: "center"
      })
      .setOrigin(0.5);
  }

  private createContinueButton(y: number, onContinue: () => void): Phaser.GameObjects.Text {
    const button = this.scene.add
      .text(0, y, GAME_TEXTS.common.continue, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "24px",
        color: "#1b100b",
        backgroundColor: "#f0c071",
        padding: { x: 22, y: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", onContinue);
    return button;
  }

  private createEquipmentChoiceCard(x: number, y: number, label: string, itemId: string): Phaser.GameObjects.GameObject[] {
    const card = this.scene.add.rectangle(x, y, 260, 190, 0x140e09, 0.78).setOrigin(0.5);
    card.setStrokeStyle(2, 0xf0c071, 0.82);
    const asset = INVENTORY_ITEM_ASSETS[itemId as keyof typeof INVENTORY_ITEM_ASSETS];
    const children: Phaser.GameObjects.GameObject[] = [card];
    if (asset && this.scene.textures.exists(asset.key)) {
      const icon = this.scene.add.image(x, y - 34, asset.key);
      const scale = Math.min(96 / icon.width, 96 / icon.height);
      icon.setScale(scale);
      children.push(icon);
    }

    children.push(
      this.scene.add
        .text(x, y + 66, label, {
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "18px",
          color: "#fff1c2",
          align: "center",
          stroke: "#070402",
          strokeThickness: 4,
          wordWrap: { width: 220 }
        })
        .setOrigin(0.5)
    );
    return children;
  }

  private createEquipmentChoiceButton(x: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.scene.add
      .text(x, 148, label, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "25px",
        color: "#1b100b",
        backgroundColor: "#f0c071",
        padding: { x: 24, y: 11 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", onClick);
    return button;
  }

  private getCombatResultMessage(result: CombatResult): string {
    if (result.outcome === "death") {
      return GAME_TEXTS.combat.resultPanel.deathMessage;
    }

    return result.perfect ? GAME_TEXTS.combat.resultPanel.perfectVictoryMessage : GAME_TEXTS.combat.resultPanel.victoryMessage;
  }

  private getCombatResultEffect(result: CombatResult, effectMessages: string[] = []): string {
    const baseEffect =
      result.outcome === "death" ? GAME_TEXTS.combat.resultPanel.deathEffect : GAME_TEXTS.combat.resultPanel.goldRewardEffect(result.goldReward);

    return GAME_TEXTS.itemEffects.combined([baseEffect, ...effectMessages]);
  }
}
