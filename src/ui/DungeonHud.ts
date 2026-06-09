import Phaser from "phaser";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { IMAGE_ASSETS } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { DungeonRunState } from "../systems/dungeonRunState";

const HUD_DEPTH = 70;
const COUNTER_NUMBER_VISUAL_Y_OFFSET = 0;
const HUD_COUNTERS = {
  attemptX: 704,
  floorX: 1007,
  y: 16,
  width: 293,
  height: 106,
  centerY: 37,
  labelCenterY: 49,
  circleRadius: 47,
  attemptLabelCenterX: 102,
  attemptNumberCenterX: 241,
  floorNumberCenterX: 52,
  floorLabelCenterX: 191
};

const HUD_STATUS_PANEL = {
  x: 1438,
  y: 16,
  width: 462,
  height: 394,
  heartCenterX: 1669,
  heartStartY: 121,
  heartGapX: 51,
  heartGapY: 45,
  maxHeartsPerLine: 6,
  maxHearts: 12,
  pouchX: 1588,
  resourceY: 276,
  goldTextX: 1649,
  inventoryX: 1768,
  inventoryY: 276
};

const TEXTURE_VISIBLE_ORIGINS = {
  pouch: { x: 1566 / 1920, y: 219 / 1080 },
  inventory: { x: 1767 / 1920, y: 219 / 1080 }
};

export class DungeonHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly floorText: Phaser.GameObjects.Text;
  private readonly attemptText: Phaser.GameObjects.Text;
  private readonly goldText: Phaser.GameObjects.Text;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly pouch: Phaser.GameObjects.Image;
  private readonly inventory: Phaser.GameObjects.Image;
  private readonly inventoryHitZone: Phaser.GameObjects.Zone;
  private inventoryClickHandler?: () => void;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setDepth(HUD_DEPTH);

    const attemptFrame = this.createCounterFrame(HUD_COUNTERS.attemptX, HUD_COUNTERS.y);
    const tentativeNumberZone = {
      centerX: HUD_COUNTERS.attemptX + HUD_COUNTERS.attemptNumberCenterX,
      centerY: HUD_COUNTERS.y + HUD_COUNTERS.centerY
    };
    const attemptLabel = this.createText(
      HUD_COUNTERS.attemptX + HUD_COUNTERS.attemptLabelCenterX,
      HUD_COUNTERS.y + HUD_COUNTERS.labelCenterY,
      GAME_TEXTS.hud.attempt,
      24
    ).setOrigin(0.5, 0.5);
    this.attemptText = this.createText(
      tentativeNumberZone.centerX,
      tentativeNumberZone.centerY + COUNTER_NUMBER_VISUAL_Y_OFFSET,
      "0",
      34
    )
      .setOrigin(0.5, 0.5)
      .setAlign("center");

    const floorFrame = this.createCounterFrame(HUD_COUNTERS.floorX, HUD_COUNTERS.y).setFlipX(true);
    const floorNumberZone = {
      centerX: HUD_COUNTERS.floorX + HUD_COUNTERS.floorNumberCenterX,
      centerY: HUD_COUNTERS.y + HUD_COUNTERS.centerY
    };
    const floorLabel = this.createText(
      HUD_COUNTERS.floorX + HUD_COUNTERS.floorLabelCenterX,
      HUD_COUNTERS.y + HUD_COUNTERS.labelCenterY,
      GAME_TEXTS.hud.floor,
      24
    ).setOrigin(0.5, 0.5);
    this.floorText = this.createText(
      floorNumberZone.centerX,
      floorNumberZone.centerY + COUNTER_NUMBER_VISUAL_Y_OFFSET,
      "0",
      34
    )
      .setOrigin(0.5, 0.5)
      .setAlign("center");
    this.container.add([attemptFrame, attemptLabel, this.attemptText, floorFrame, floorLabel, this.floorText]);

    const statusPanel = scene.add
      .image(HUD_STATUS_PANEL.x, HUD_STATUS_PANEL.y, IMAGE_ASSETS.dungeonHudStatusPanelEmpty.key)
      .setOrigin(0)
      .setDisplaySize(HUD_STATUS_PANEL.width, HUD_STATUS_PANEL.height);
    this.container.add(statusPanel);

    for (let index = 0; index < HUD_STATUS_PANEL.maxHearts; index += 1) {
      const column = index % HUD_STATUS_PANEL.maxHeartsPerLine;
      const row = Math.floor(index / HUD_STATUS_PANEL.maxHeartsPerLine);
      const heart = scene.add
        .image(
          HUD_STATUS_PANEL.heartCenterX + (column - 2.5) * HUD_STATUS_PANEL.heartGapX,
          HUD_STATUS_PANEL.heartStartY + row * HUD_STATUS_PANEL.heartGapY,
          IMAGE_ASSETS.heartEmpty.key
        )
        .setScale(0.068);
      this.hearts.push(heart);
      this.container.add(heart);
    }

    this.pouch = scene.add
      .image(HUD_STATUS_PANEL.pouchX, HUD_STATUS_PANEL.resourceY, IMAGE_ASSETS.coinPouchEmpty.key)
      .setOrigin(TEXTURE_VISIBLE_ORIGINS.pouch.x, TEXTURE_VISIBLE_ORIGINS.pouch.y)
      .setScale(0.48);
    this.goldText = this.createText(HUD_STATUS_PANEL.goldTextX, HUD_STATUS_PANEL.resourceY + 2, "0", 34).setOrigin(0.5);
    this.inventory = scene.add
      .image(HUD_STATUS_PANEL.inventoryX, HUD_STATUS_PANEL.inventoryY, IMAGE_ASSETS.inventoryEmpty.key)
      .setOrigin(TEXTURE_VISIBLE_ORIGINS.inventory.x, TEXTURE_VISIBLE_ORIGINS.inventory.y)
      .setScale(0.48)
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(1706, 160, 122, 120),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true
      });
    this.inventoryHitZone = scene.add
      .zone(HUD_STATUS_PANEL.inventoryX, HUD_STATUS_PANEL.inventoryY, 185, 169)
      .setInteractive({ useHandCursor: true });
    this.inventory.on("pointerdown", () => this.inventoryClickHandler?.());
    this.inventoryHitZone.on("pointerdown", () => this.inventoryClickHandler?.());
    this.container.add([this.pouch, this.goldText, this.inventory, this.inventoryHitZone]);
    this.drawCounterDebugGuides([tentativeNumberZone, floorNumberZone]);
  }

  updateHud(runState: DungeonRunState): void {
    this.floorText.setText(String(runState.currentFloor));
    this.attemptText.setText(String(runState.attempt));
    this.goldText.setText(String(runState.carriedGold));
    this.pouch.setTexture(runState.carriedGold > 0 ? IMAGE_ASSETS.coinPouchFull.key : IMAGE_ASSETS.coinPouchEmpty.key);
    this.inventory.setTexture(runState.inventory.length > 0 ? IMAGE_ASSETS.inventoryFull.key : IMAGE_ASSETS.inventoryEmpty.key);

    this.hearts.forEach((heart, index) => {
      heart.setVisible(index < runState.maxLife);
      heart.setTexture(index < runState.life ? IMAGE_ASSETS.heartFull.key : IMAGE_ASSETS.heartEmpty.key);
      if (index < runState.maxLife) {
        const row = Math.floor(index / HUD_STATUS_PANEL.maxHeartsPerLine);
        const rowStart = row * HUD_STATUS_PANEL.maxHeartsPerLine;
        const heartsInRow = Math.min(HUD_STATUS_PANEL.maxHeartsPerLine, runState.maxLife - rowStart);
        const column = index - rowStart;
        heart.setPosition(
          HUD_STATUS_PANEL.heartCenterX + (column - (heartsInRow - 1) / 2) * HUD_STATUS_PANEL.heartGapX,
          HUD_STATUS_PANEL.heartStartY + row * HUD_STATUS_PANEL.heartGapY
        );
      }
    });

    (window as unknown as { __dungeonHudReport?: unknown }).__dungeonHudReport = {
      floor: runState.floor,
      currentFloor: runState.currentFloor,
      totalFloors: runState.totalFloors,
      wins: runState.wins,
      attempt: runState.attempt,
      life: runState.life,
      maxLife: runState.maxLife,
      carriedGold: runState.carriedGold,
      inventoryCount: runState.inventory.length,
      pouchTexture: this.pouch.texture.key,
      inventoryTexture: this.inventory.texture.key,
      floorText: this.floorText.text,
      attemptText: this.attemptText.text,
      goldText: this.goldText.text
    };
  }

  destroy(): void {
    this.container.destroy(true);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  setInventoryClickHandler(handler?: () => void): void {
    this.inventoryClickHandler = handler;
  }

  private createText(x: number, y: number, text: string, fontSize: number): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, {
      fontFamily: "Georgia, serif",
      fontSize: `${fontSize}px`,
      color: "#fff1c2",
      align: "center",
      stroke: "#120d0a",
      strokeThickness: 5
    });
  }

  private createCounterFrame(x: number, y: number): Phaser.GameObjects.Image {
    return this.scene.add
      .image(x, y, IMAGE_ASSETS.dungeonHudCounterFrame.key)
      .setOrigin(0)
      .setDisplaySize(HUD_COUNTERS.width, HUD_COUNTERS.height);
  }

  private drawCounterDebugGuides(zones: { centerX: number; centerY: number }[]): void {
    if (!IS_DEBUG_TOOLS_ENABLED) {
      return;
    }

    const debug = this.scene.add.graphics();
    debug.lineStyle(1, 0xff0000, 1);
    zones.forEach(({ centerX, centerY }) => {
      debug.strokeCircle(centerX, centerY, HUD_COUNTERS.circleRadius);
      debug.lineBetween(centerX - 14, centerY, centerX + 14, centerY);
      debug.lineBetween(centerX, centerY - 14, centerX, centerY + 14);
      debug.fillStyle(0xff0000, 1);
      debug.fillCircle(centerX, centerY, 4);
    });
    this.container.add(debug);
  }
}
