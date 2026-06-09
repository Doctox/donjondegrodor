import Phaser from "phaser";

export type ShopMenuViewCallbacks = {
  onObjects: () => void;
  onPassives: () => void;
  onResell: () => void;
  onClose: () => void;
};

export type ShopMenuViewTexts = {
  title: string;
  objectsButton: string;
  passivesButton: string;
  resellButton: string;
  message: string;
};

export type ShopMenuViewAssets = {
  backgroundKey: string;
  titleSignKey: string;
  categoryPanelKey: string;
  objectsIconKey: string;
  passivesIconKey: string;
  resellIconKey: string;
  closeButtonKey: string;
};

export type ShopMenuViewOptions = {
  assets: ShopMenuViewAssets;
  callbacks: ShopMenuViewCallbacks;
  texts: ShopMenuViewTexts;
  worldHeight: number;
  worldWidth: number;
};

export class ShopMenuView {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: ShopMenuViewOptions
  ) {}

  create(): Phaser.GameObjects.Container {
    const { assets, callbacks, texts, worldHeight, worldWidth } = this.options;
    const container = this.scene.add.container(worldWidth / 2, worldHeight / 2).setDepth(80);
    const background = this.scene.add.image(0, 0, assets.backgroundKey).setDisplaySize(worldWidth, worldHeight);
    const titleSign = this.scene.add.image(0, -356, assets.titleSignKey).setDisplaySize(700, 156);
    const title = this.scene.add
      .text(0, -360, texts.title, {
        fontFamily: "Georgia, serif",
        fontSize: "39px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 6,
        align: "center"
      })
      .setOrigin(0.5);
    const objectsBlock = this.createCategoryBlock(-440, 270, assets.objectsIconKey, texts.objectsButton, callbacks.onObjects);
    const passivesBlock = this.createCategoryBlock(0, 270, assets.passivesIconKey, texts.passivesButton, callbacks.onPassives);
    const resellBlock = this.createCategoryBlock(440, 270, assets.resellIconKey, texts.resellButton, callbacks.onResell);
    const message = this.scene.add
      .text(0, 474, texts.message, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "21px",
        color: "#f9dfaa",
        align: "center",
        lineSpacing: 6,
        stroke: "#070402",
        strokeThickness: 4,
        wordWrap: { width: 720 }
      })
      .setOrigin(0.5);

    container.add([background, titleSign, title, objectsBlock, passivesBlock, resellBlock, message, this.createCloseButton(callbacks.onClose)]);
    return container;
  }

  private createCategoryBlock(x: number, y: number, iconKey: string, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const block = this.scene.add.container(x, y);
    const icon = this.scene.add.image(0, -108, iconKey).setDisplaySize(184, 184);
    const panel = this.scene.add.image(0, 62, this.options.assets.categoryPanelKey).setDisplaySize(320, 222);
    const labelText = this.scene.add
      .text(0, 72, label, {
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 6
      })
      .setOrigin(0.5);
    const hitZone = this.scene.add.zone(0, -6, 360, 410).setInteractive({ useHandCursor: true });

    hitZone.on("pointerover", () => {
      icon.setScale(1.08);
      icon.setTint(0xfff0b8);
      panel.setTint(0xffd98b);
      labelText.setColor("#fff8d8");
    });
    hitZone.on("pointerout", () => {
      icon.setScale(1);
      icon.clearTint();
      panel.clearTint();
      labelText.setColor("#fff1c2");
    });
    hitZone.on("pointerdown", onClick);

    block.add([icon, panel, labelText, hitZone]);
    return block;
  }

  private createCloseButton(onClose: () => void): Phaser.GameObjects.Container {
    const button = this.scene.add.container(792, -384);
    const icon = this.scene.add.image(0, 0, this.options.assets.closeButtonKey).setDisplaySize(98, 96);
    button.add(icon);
    button.setInteractive(new Phaser.Geom.Rectangle(-56, -56, 112, 112), Phaser.Geom.Rectangle.Contains);
    button.on("pointerover", () => icon.setDisplaySize(106, 104));
    button.on("pointerout", () => icon.setDisplaySize(98, 96));
    button.on("pointerdown", onClose);
    return button;
  }
}
