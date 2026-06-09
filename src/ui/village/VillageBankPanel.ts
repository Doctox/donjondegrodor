import Phaser from "phaser";
import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../../data/assetKeys";
import { GAME_TEXTS } from "../../data/gameTexts";
import { depositCarriedGoldInBank, getDungeonRunState } from "../../systems/dungeonRunState";

export type VillageBankPanelCallbacks = {
  onClose: () => void;
  onHudRefresh: () => void;
  onPublishReport: () => void;
  onStatus: (message: string) => void;
};

const BANK_PANEL_LAYOUT = {
  title: { x: 0, y: -430 },
  deposit: { x: -674, y: 413, width: 536, height: 173 },
  info: { x: 0, y: 413, width: 636, height: 205 },
  statusPouch: { x: -118, y: 424, width: 210, height: 100 },
  statusChest: { x: 118, y: 424, width: 210, height: 100 },
  exit: { x: 674, y: 413, width: 536, height: 173 },
  separator: { x: 0, y: 424, width: 12, height: 92 },
  pouch: { iconX: -162, iconY: 425, textX: -86, textY: 427 },
  chest: { iconX: 82, iconY: 425, textX: 158, textY: 427 }
};

export class VillageBankPanel {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: VillageBankPanelCallbacks
  ) {}

  open(): Phaser.GameObjects.Container {
    const text = GAME_TEXTS.village.bank;
    const container = this.scene.add.container(WORLD_WIDTH / 2, WORLD_HEIGHT / 2).setDepth(80);
    const background = this.scene.add
      .image(0, 0, IMAGE_ASSETS.bankBackground.key)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setInteractive({ useHandCursor: false });
    const titleLabel = this.scene.add
      .text(BANK_PANEL_LAYOUT.title.x, BANK_PANEL_LAYOUT.title.y + 2, text.bankerTitle, this.bankTitleTextStyle())
      .setOrigin(0.5);
    const depositPanel = this.scene.add
      .image(BANK_PANEL_LAYOUT.deposit.x, BANK_PANEL_LAYOUT.deposit.y, IMAGE_ASSETS.bankDepositPanelEmpty.key)
      .setDisplaySize(BANK_PANEL_LAYOUT.deposit.width, BANK_PANEL_LAYOUT.deposit.height)
      .setInteractive({ useHandCursor: true });
    const infoPanel = this.scene.add
      .image(BANK_PANEL_LAYOUT.info.x, BANK_PANEL_LAYOUT.info.y, IMAGE_ASSETS.bankInfoPanelEmpty.key)
      .setDisplaySize(BANK_PANEL_LAYOUT.info.width, BANK_PANEL_LAYOUT.info.height);
    const statusPouchPanel = this.scene.add
      .image(BANK_PANEL_LAYOUT.statusPouch.x, BANK_PANEL_LAYOUT.statusPouch.y, IMAGE_ASSETS.bankMoneyStatusPanelEmpty.key)
      .setDisplaySize(BANK_PANEL_LAYOUT.statusPouch.width, BANK_PANEL_LAYOUT.statusPouch.height);
    const statusChestPanel = this.scene.add
      .image(BANK_PANEL_LAYOUT.statusChest.x, BANK_PANEL_LAYOUT.statusChest.y, IMAGE_ASSETS.bankMoneyStatusPanelEmpty.key)
      .setDisplaySize(BANK_PANEL_LAYOUT.statusChest.width, BANK_PANEL_LAYOUT.statusChest.height);
    const separator = this.scene.add
      .image(BANK_PANEL_LAYOUT.separator.x, BANK_PANEL_LAYOUT.separator.y, IMAGE_ASSETS.bankSeparator.key)
      .setDisplaySize(BANK_PANEL_LAYOUT.separator.width, BANK_PANEL_LAYOUT.separator.height);
    const exitPanel = this.scene.add
      .image(BANK_PANEL_LAYOUT.exit.x, BANK_PANEL_LAYOUT.exit.y, IMAGE_ASSETS.bankExitPanelEmpty.key)
      .setDisplaySize(BANK_PANEL_LAYOUT.exit.width, BANK_PANEL_LAYOUT.exit.height)
      .setInteractive({ useHandCursor: true });
    const depositLabel = this.scene.add
      .text(BANK_PANEL_LAYOUT.deposit.x, BANK_PANEL_LAYOUT.deposit.y + 2, text.depositButton, this.bankButtonTextStyle())
      .setOrigin(0.5);
    const exitLabel = this.scene.add
      .text(BANK_PANEL_LAYOUT.exit.x, BANK_PANEL_LAYOUT.exit.y + 2, text.exitButton, this.bankButtonTextStyle())
      .setOrigin(0.5);
    const pouchIcon = this.scene.add
      .image(BANK_PANEL_LAYOUT.pouch.iconX, BANK_PANEL_LAYOUT.pouch.iconY, IMAGE_ASSETS.bankPouchIcon.key)
      .setDisplaySize(64, 58);
    const chestIcon = this.scene.add
      .image(BANK_PANEL_LAYOUT.chest.iconX, BANK_PANEL_LAYOUT.chest.iconY, IMAGE_ASSETS.bankChestIcon.key)
      .setDisplaySize(64, 54);
    const carriedGoldText = this.scene.add
      .text(BANK_PANEL_LAYOUT.pouch.textX, BANK_PANEL_LAYOUT.pouch.textY, "0", this.bankAmountTextStyle())
      .setOrigin(0.5);
    const bankGoldText = this.scene.add
      .text(BANK_PANEL_LAYOUT.chest.textX, BANK_PANEL_LAYOUT.chest.textY, "0", this.bankAmountTextStyle())
      .setOrigin(0.5);

    const refreshPanel = (feedback?: string) => {
      const state = getDungeonRunState();
      carriedGoldText.setText(String(state.carriedGold));
      bankGoldText.setText(String(state.bankGold));
      depositPanel.setAlpha(state.carriedGold > 0 ? 1 : 0.74);
      depositLabel.setAlpha(state.carriedGold > 0 ? 1 : 0.74);
      this.callbacks.onStatus(feedback ?? GAME_TEXTS.village.chooseBuilding);
      this.callbacks.onPublishReport();
    };

    depositPanel.on("pointerover", () => {
      depositPanel.setTint(0xffdf91);
      depositLabel.setColor("#fff6d2");
    });
    depositPanel.on("pointerout", () => {
      depositPanel.clearTint();
      depositLabel.setColor("#fff1c2");
      refreshPanel();
    });
    depositPanel.on("pointerdown", () => {
      const beforeDeposit = getDungeonRunState().carriedGold;
      if (beforeDeposit <= 0) {
        refreshPanel(text.nothingToDeposit);
        return;
      }

      depositCarriedGoldInBank();
      this.callbacks.onHudRefresh();
      refreshPanel(text.depositSuccess(beforeDeposit));
    });
    exitPanel.on("pointerover", () => {
      exitPanel.setTint(0xffdf91);
      exitLabel.setColor("#fff6d2");
    });
    exitPanel.on("pointerout", () => {
      exitPanel.clearTint();
      exitLabel.setColor("#fff1c2");
    });
    exitPanel.on("pointerdown", () => this.callbacks.onClose());

    container.add([
      background,
      titleLabel,
      depositPanel,
      infoPanel,
      statusPouchPanel,
      separator,
      statusChestPanel,
      exitPanel,
      depositLabel,
      exitLabel,
      pouchIcon,
      chestIcon,
      carriedGoldText,
      bankGoldText
    ]);
    refreshPanel();
    return container;
  }

  private bankTitleTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Georgia, serif",
      fontSize: "74px",
      color: "#fff1c2",
      align: "center",
      stroke: "#120d0a",
      strokeThickness: 9,
      shadow: { offsetX: 2, offsetY: 3, color: "#000000", blur: 3, fill: true }
    };
  }

  private bankButtonTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Georgia, serif",
      fontSize: "50px",
      color: "#fff1c2",
      align: "center",
      stroke: "#120d0a",
      strokeThickness: 7,
      shadow: { offsetX: 2, offsetY: 3, color: "#000000", blur: 3, fill: true }
    };
  }

  private bankAmountTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Georgia, serif",
      fontSize: "42px",
      color: "#fff1c2",
      align: "center",
      stroke: "#120d0a",
      strokeThickness: 7,
      shadow: { offsetX: 2, offsetY: 3, color: "#000000", blur: 3, fill: true }
    };
  }
}
