import Phaser from "phaser";
import { GAME_TEXTS } from "../data/gameTexts";
import { MONSTER_LIST, MonsterId } from "../data/monsterDefinitions";
import { DungeonRunState } from "../systems/dungeonRunState";

type EquipmentOption = {
  label: string;
  item: string;
};

type CombatOption = {
  label: string;
  monsterId: MonsterId;
};

type EventOption = {
  label: string;
  id: "loot_chest" | "coin_flip" | "bonneteau" | "slot_machine" | "dodge_chest" | "jump" | "arm_wrestling" | "elevator";
};

const OPTIONS: EquipmentOption[] = [
  { label: GAME_TEXTS.debug.equipmentLabels.cape, item: "too_long_cape" },
  { label: GAME_TEXTS.debug.equipmentLabels.slip, item: "war_underwear" },
  { label: GAME_TEXTS.debug.equipmentLabels.sandals, item: "panic_sandals" },
  { label: GAME_TEXTS.debug.equipmentLabels.medallion, item: "almost_hero_medallion" },
  { label: GAME_TEXTS.debug.equipmentLabels.helmet, item: "tiny_helmet" },
  { label: GAME_TEXTS.debug.equipmentLabels.ankleBall, item: "ankle_ball" },
  { label: GAME_TEXTS.debug.equipmentLabels.axe, item: "axe" },
  { label: GAME_TEXTS.debug.equipmentLabels.gloves, item: "sticky_gloves" },
  { label: GAME_TEXTS.debug.equipmentLabels.pebble, item: "emotional_pebble" }
];

const COMBAT_OPTIONS: CombatOption[] = MONSTER_LIST.map((monster) => ({ label: monster.name, monsterId: monster.id }));

const EVENT_OPTIONS: EventOption[] = [
  { label: GAME_TEXTS.debug.miniGameLabels.lootChest, id: "loot_chest" },
  { label: GAME_TEXTS.debug.miniGameLabels.coinFlip, id: "coin_flip" },
  { label: GAME_TEXTS.debug.miniGameLabels.bonneteau, id: "bonneteau" },
  { label: GAME_TEXTS.debug.miniGameLabels.slotMachine, id: "slot_machine" },
  { label: GAME_TEXTS.debug.miniGameLabels.dodgeChest, id: "dodge_chest" },
  { label: GAME_TEXTS.debug.miniGameLabels.jump, id: "jump" },
  { label: GAME_TEXTS.debug.miniGameLabels.armWrestling, id: "arm_wrestling" },
  { label: GAME_TEXTS.debug.miniGameLabels.elevator, id: "elevator" }
];

type DebugSubmenu = "stuff" | "combat" | "grodor" | "events";

export class DungeonDebugMenu {
  private readonly container: Phaser.GameObjects.Container;
  private readonly panel: Phaser.GameObjects.Container;
  private readonly currentText: Phaser.GameObjects.Text;
  private readonly stuffButtons: Phaser.GameObjects.Container[] = [];
  private readonly combatButtons: Phaser.GameObjects.Container[] = [];
  private readonly grodorButtons: Phaser.GameObjects.Container[] = [];
  private readonly eventButtons: Phaser.GameObjects.Container[] = [];
  private readonly stuffTab: Phaser.GameObjects.Container;
  private readonly combatTab: Phaser.GameObjects.Container;
  private readonly grodorTab: Phaser.GameObjects.Container;
  private readonly eventsTab: Phaser.GameObjects.Container;
  private currentEquipment: string[] = [];
  private isOpen = false;
  private activeSubmenu: DebugSubmenu = "stuff";
  private readonly closeOnOutsidePointer = (pointer: Phaser.Input.Pointer): void => {
    if (!this.isOpen || this.isInsideMenu(pointer.worldX, pointer.worldY)) {
      return;
    }

    this.closePanel();
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onEquipmentChange: (items: string[]) => void,
    private readonly onCombatStart: (monsterId: MonsterId) => void,
    private readonly onEventStart: (eventId: EventOption["id"]) => void,
    private readonly onGrodorLifeChange: (delta: number) => void,
    private readonly onGrodorGoldAdd: () => void,
    private readonly onFullReset: () => void,
    private readonly onVillageStart: () => void
  ) {
    this.container = scene.add.container(28, 384).setDepth(140);
    this.panel = scene.add.container(0, 46).setVisible(false);

    const infoButton = scene.add.container(0, 0);
    const infoBackground = scene.add.circle(18, 18, 18, 0x120d0a, 0.84);
    infoBackground.setStrokeStyle(2, 0xe0b46e, 0.9);
    const infoText = scene.add.text(18, 18, GAME_TEXTS.debug.infoButton, this.textStyle(24, "#fff1c2")).setOrigin(0.5);
    infoButton.add([infoBackground, infoText]);
    infoButton.setInteractive(new Phaser.Geom.Circle(18, 18, 18), Phaser.Geom.Circle.Contains);
    infoButton.on("pointerover", () => infoBackground.setFillStyle(0x4a2d18, 0.95));
    infoButton.on("pointerout", () => infoBackground.setFillStyle(0x120d0a, 0.84));
    infoButton.on("pointerdown", () => this.togglePanel());

    const background = scene.add.rectangle(0, 0, 292, 458, 0x120d0a, 0.76).setOrigin(0);
    background.setStrokeStyle(2, 0xe0b46e, 0.85);

    const title = scene.add.text(14, 12, GAME_TEXTS.debug.title, this.textStyle(22, "#fff1c2"));
    this.currentText = scene.add.text(14, 88, "", this.textStyle(16, "#f3d49a"));
    this.stuffTab = this.createButton(14, 48, GAME_TEXTS.debug.tabs.stuff, () => this.setSubmenu("stuff"), 58, 15);
    this.combatTab = this.createButton(76, 48, GAME_TEXTS.debug.tabs.combat, () => this.setSubmenu("combat"), 68, 15);
    this.grodorTab = this.createButton(148, 48, GAME_TEXTS.debug.tabs.grodor, () => this.setSubmenu("grodor"), 68, 15);
    this.eventsTab = this.createButton(220, 48, GAME_TEXTS.debug.tabs.events, () => this.setSubmenu("events"), 58, 15);
    this.panel.add([background, title, this.stuffTab, this.combatTab, this.grodorTab, this.eventsTab, this.currentText]);

    OPTIONS.forEach((option, index) => {
      const button = this.createButton(14, 120 + index * 38, option.label, () => this.toggleEquipment(option.item), 258);
      this.stuffButtons.push(button);
      this.panel.add(button);
    });

    COMBAT_OPTIONS.forEach((option, index) => {
      const button = this.createButton(14, 120 + index * 38, option.label, () => this.onCombatStart(option.monsterId), 258);
      this.combatButtons.push(button);
      this.panel.add(button);
    });

    EVENT_OPTIONS.forEach((option, index) => {
      const button = this.createButton(14, 120 + index * 38, option.label, () => this.onEventStart(option.id), 258);
      this.eventButtons.push(button);
      this.panel.add(button);
    });

    const healButton = this.createButton(14, 120, GAME_TEXTS.debug.heal, () => this.onGrodorLifeChange(1), 258);
    const damageButton = this.createButton(14, 158, GAME_TEXTS.debug.damage, () => this.onGrodorLifeChange(-1), 258);
    const addGoldButton = this.createButton(14, 196, GAME_TEXTS.debug.addGold, () => this.onGrodorGoldAdd(), 258);
    const resetButton = this.createButton(14, 234, GAME_TEXTS.debug.resetAll, () => {
      this.closePanel();
      this.onFullReset();
    }, 258);
    const villageButton = this.createButton(14, 272, GAME_TEXTS.debug.village, () => {
      this.closePanel();
      this.onVillageStart();
    }, 258);
    this.grodorButtons.push(healButton, damageButton, addGoldButton, resetButton, villageButton);
    this.panel.add([healButton, damageButton, addGoldButton, resetButton, villageButton]);

    this.setSubmenu("stuff");
    this.container.add([infoButton, this.panel]);
    scene.input.on("pointerdown", this.closeOnOutsidePointer);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off("pointerdown", this.closeOnOutsidePointer);
    });
  }

  update(runState: DungeonRunState): void {
    this.currentEquipment = [...runState.equipment];
    this.updateCurrentText(runState);
  }

  private toggleEquipment(item: string): void {
    const nextEquipment = this.currentEquipment.includes(item)
      ? this.currentEquipment.filter((equippedItem) => equippedItem !== item)
      : [...this.currentEquipment, item];
    this.onEquipmentChange(nextEquipment);
  }

  private togglePanel(): void {
    this.isOpen = !this.isOpen;
    this.panel.setVisible(this.isOpen);
  }

  private closePanel(): void {
    this.isOpen = false;
    this.panel.setVisible(false);
  }

  setVisible(visible: boolean): void {
    if (!visible) {
      this.closePanel();
    }
    this.container.setVisible(visible);
  }

  private setSubmenu(submenu: DebugSubmenu): void {
    this.activeSubmenu = submenu;
    this.stuffButtons.forEach((button) => button.setVisible(submenu === "stuff"));
    this.combatButtons.forEach((button) => button.setVisible(submenu === "combat"));
    this.grodorButtons.forEach((button) => button.setVisible(submenu === "grodor"));
    this.eventButtons.forEach((button) => button.setVisible(submenu === "events"));
    this.tintTab(this.stuffTab, submenu === "stuff");
    this.tintTab(this.combatTab, submenu === "combat");
    this.tintTab(this.grodorTab, submenu === "grodor");
    this.tintTab(this.eventsTab, submenu === "events");
    this.updateCurrentText();
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    width = 226,
    fontSize = 17
  ): Phaser.GameObjects.Container {
    const button = this.scene.add.container(x, y);
    const background = this.scene.add.rectangle(0, 0, width, 30, 0x2b1b11, 0.9).setOrigin(0);
    background.setStrokeStyle(1, 0xe0b46e, 0.75);
    const text = this.scene.add.text(12, 5, label, this.textStyle(fontSize, "#fff1c2"));
    button.add([background, text]);
    button.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, 30), Phaser.Geom.Rectangle.Contains);
    button.on("pointerover", () => background.setFillStyle(0x4a2d18, 0.95));
    button.on("pointerout", () => background.setFillStyle(0x2b1b11, 0.9));
    button.on("pointerdown", onClick);
    return button;
  }

  private tintTab(tab: Phaser.GameObjects.Container, active: boolean): void {
    const background = tab.list[0];
    if (background instanceof Phaser.GameObjects.Rectangle) {
      background.setFillStyle(active ? 0x4a2d18 : 0x2b1b11, active ? 0.96 : 0.9);
    }
  }

  private getEquipmentLabel(): string {
    return `${GAME_TEXTS.debug.equipmentPrefix}: ${
      this.currentEquipment.length > 0 ? this.currentEquipment.join(", ") : GAME_TEXTS.debug.equipmentNone
    }`;
  }

  private updateCurrentText(runState?: DungeonRunState): void {
    if (this.activeSubmenu === "stuff") {
      this.currentText.setText(this.getEquipmentLabel());
    } else if (this.activeSubmenu === "combat") {
      this.currentText.setText(GAME_TEXTS.debug.monsterTest);
    } else if (this.activeSubmenu === "events") {
      this.currentText.setText(GAME_TEXTS.debug.eventTest);
    } else {
      this.currentText.setText(
        runState ? GAME_TEXTS.debug.grodorStatus(runState.life, runState.maxLife, runState.carriedGold) : GAME_TEXTS.debug.grodorLifeFallback
      );
    }
  }

  private isInsideMenu(x: number, y: number): boolean {
    const originX = this.container.x;
    const originY = this.container.y;
    const insideInfoButton = x >= originX && x <= originX + 36 && y >= originY && y <= originY + 36;
    const insidePanel =
      x >= originX &&
      x <= originX + 292 &&
      y >= originY + 46 &&
      y <= originY + 46 + 458;

    return insideInfoButton || insidePanel;
  }

  private textStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: `${fontSize}px`,
      color,
      stroke: "#070402",
      strokeThickness: 4
    };
  }
}
