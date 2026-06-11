import Phaser from "phaser";
import { IMAGE_ASSETS, JSON_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { GrodorActor } from "../actors/GrodorActor";
import { getDungeonRunState, resetDungeonRunState } from "../systems/dungeonRunState";
import { getMaxStartingEquipmentCount, getStartingLoadoutCount } from "../systems/metaProgression";
import { playZoneMusic } from "../systems/audioManager";
import { setHudVisible } from "../ui/hud";
import { setLetterboxBackdrop } from "../ui/letterboxBackdrop";
import { createNineSlicePanel } from "../ui/nineSlicePanel";

type TavernPoint = {
  name: string;
  x: number;
  y: number;
};

type TavernZone = TavernPoint & {
  width: number;
  height: number;
};

type TavernAction = "drink" | "exit";

const TAVERN_GRODOR_SCALE = 0.95;

export class TavernScene extends Phaser.Scene {
  private map?: Phaser.Tilemaps.Tilemap;
  private grodor?: GrodorActor;
  private moving = false;
  private confirmationPanel?: Phaser.GameObjects.Container;
  private statusText?: Phaser.GameObjects.Text;
  private readonly zones = new Map<TavernAction, Phaser.GameObjects.Zone>();

  constructor() {
    super("TavernScene");
  }

  create(): void {
    this.resetRuntime();
    setHudVisible(false);
    setLetterboxBackdrop(IMAGE_ASSETS.tavernBackground.path);
    playZoneMusic(this, "tavern");
    this.map = this.make.tilemap({ key: JSON_ASSETS.tavernMap.key });
    this.add.image(0, 0, IMAGE_ASSETS.tavernBackground.key).setOrigin(0).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const spawn = this.getPoint("spawn_grodor", ["spawn"]);
    if (spawn) {
      this.grodor = new GrodorActor(this, spawn.x, spawn.y, TAVERN_GRODOR_SCALE);
      this.grodor.container.setDepth(20);
      this.grodor.setEquipment(getDungeonRunState().equipment);
      this.grodor.playIdle();
    }

    this.createStatusPanel();
    this.createInteractives();
    this.setStatus(GAME_TEXTS.village.tavern.message);
    this.publishReport();
  }

  private resetRuntime(): void {
    this.map = undefined;
    this.grodor = undefined;
    this.moving = false;
    this.confirmationPanel = undefined;
    this.statusText = undefined;
    this.zones.clear();
  }

  private createInteractives(): void {
    const drinkZone = this.getZone("interact_drink");
    const exitZone = this.getZone("interact_exit");

    if (drinkZone) {
      this.createInteractiveZone("drink", drinkZone);
    }
    if (exitZone) {
      this.createInteractiveZone("exit", exitZone);
    }
  }

  private createInteractiveZone(action: TavernAction, zone: TavernZone): void {
    const hitZone = this.add
      .zone(zone.x + zone.width / 2, zone.y + zone.height / 2, zone.width, zone.height)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });
    hitZone.on("pointerdown", () => this.handleAction(action));
    this.zones.set(action, hitZone);
  }

  private handleAction(action: TavernAction): void {
    if (this.moving || this.confirmationPanel) {
      return;
    }

    if (action === "drink") {
      this.setStatus(GAME_TEXTS.village.tavern.movingToDrink);
      this.walkPath(this.getDrinkPath(), () => this.showDrinkConfirmation());
      return;
    }

    this.setStatus(GAME_TEXTS.village.tavern.movingToExit);
    this.walkPath(this.getExitPath(), () => this.scene.start("VillageScene", { fromTavern: true }));
  }

  private getDrinkPath(): TavernPoint[] {
    return [this.getPoint("path_to_counter_01", ["path"]), this.getPoint("path_to_counter_end", ["path"])].filter(
      Boolean
    ) as TavernPoint[];
  }

  private getExitPath(): TavernPoint[] {
    return [this.getPoint("path_to_exit_end", ["path"])].filter(Boolean) as TavernPoint[];
  }

  private walkPath(path: TavernPoint[], onComplete: () => void): void {
    if (!this.grodor || path.length === 0) {
      onComplete();
      return;
    }

    this.moving = true;
    this.grodor.playWalk();

    const walkSegment = (index: number): void => {
      if (!this.grodor) {
        return;
      }

      const point = path[index];
      const distance = Phaser.Math.Distance.Between(this.grodor.x, this.grodor.y, point.x, point.y);
      this.grodor.setFlipX(point.x < this.grodor.x);
      this.tweens.add({
        targets: this.grodor.container,
        x: point.x,
        y: point.y,
        duration: Phaser.Math.Clamp(distance * 2.1, 240, 820),
        ease: "Sine.easeInOut",
        onComplete: () => {
          if (index < path.length - 1) {
            walkSegment(index + 1);
            return;
          }

          this.moving = false;
          this.grodor?.playIdle();
          this.grodor?.setFlipX(false);
          onComplete();
        }
      });
    };

    walkSegment(0);
  }

  private showDrinkConfirmation(): void {
    const text = GAME_TEXTS.village.tavern;
    const container = this.add.container(WORLD_WIDTH / 2, WORLD_HEIGHT / 2).setDepth(90);
    const image = this.add
      .image(0, 0, IMAGE_ASSETS.tavernDrinkBeer.key)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(0);
    const story = createNineSlicePanel(this, IMAGE_ASSETS.frameStory.key, 0, 310, 820, 230, {
      left: 36,
      right: 36,
      top: 36,
      bottom: 36
    });
    const message = this.add
      .text(0, 258, text.drinkConfirm, {
        fontFamily: "Georgia, serif",
        fontSize: "31px",
        color: "#fff1c2",
        align: "center",
        stroke: "#070402",
        strokeThickness: 5,
        wordWrap: { width: 680 }
      })
      .setOrigin(0.5);
    const noButton = this.createButton(-92, 348, GAME_TEXTS.common.no);
    const yesButton = this.createButton(112, 348, GAME_TEXTS.common.yes);

    noButton.on("pointerdown", () => this.cancelDrink());
    yesButton.on("pointerdown", () => this.confirmDrink());

    container.add([image, story, message, noButton, yesButton]);
    this.confirmationPanel = container;
    this.setInputsEnabled(false);
  }

  private cancelDrink(): void {
    this.confirmationPanel?.destroy();
    this.confirmationPanel = undefined;
    const spawnBeer = this.getPoint("spawn_beer", ["spawn"]);
    if (this.grodor && spawnBeer) {
      this.grodor.setPosition(spawnBeer.x, spawnBeer.y);
      this.grodor.setFlipX(false);
      this.grodor.playIdle();
    }
    this.setInputsEnabled(true);
    this.setStatus(GAME_TEXTS.village.tavern.backAtBeer);
  }

  private confirmDrink(): void {
    if (getStartingLoadoutCount() > getMaxStartingEquipmentCount()) {
      this.showBlockedDepartureMessage(GAME_TEXTS.village.grodorHouse.removeEquipmentBeforeLeaving);
      return;
    }

    const startingLoadoutCount = getStartingLoadoutCount();
    if (startingLoadoutCount > 0) {
      resetDungeonRunState({ useStartingLoadout: true, preserveCarriedGold: true });
    } else {
      const carriedEquipment = getDungeonRunState().equipment;
      const extraEquipmentCount = Math.max(0, carriedEquipment.length - getMaxStartingEquipmentCount());
      if (extraEquipmentCount > 0) {
        this.showBlockedDepartureMessage(GAME_TEXTS.village.tavern.tooMuchCarriedEquipment(extraEquipmentCount));
        return;
      }
      resetDungeonRunState({ preserveInventoryEquipment: carriedEquipment.length > 0, preserveCarriedGold: true });
    }
    this.scene.start("CellScene", {
      introOverlayActive: false,
      preserveRunState: true,
      wakeMessage: GAME_TEXTS.village.tavern.wakeUpMessage
    });
  }

  private showBlockedDepartureMessage(messageText: string): void {
    this.confirmationPanel?.destroy();

    const container = this.add.container(WORLD_WIDTH / 2, WORLD_HEIGHT / 2).setDepth(92);
    const panel = createNineSlicePanel(this, IMAGE_ASSETS.frameStory.key, 0, 0, 760, 260, {
      left: 36,
      right: 36,
      top: 36,
      bottom: 36
    });
    const message = this.add
      .text(0, -38, messageText, {
        fontFamily: "Georgia, serif",
        fontSize: "30px",
        color: "#fff1c2",
        align: "center",
        stroke: "#070402",
        strokeThickness: 5,
        wordWrap: { width: 620 }
      })
      .setOrigin(0.5);
    const continueButton = this.createButton(0, 86, GAME_TEXTS.common.continue);

    continueButton.on("pointerdown", () => this.returnToVillageTavernSpawn());
    container.add([panel, message, continueButton]);
    this.confirmationPanel = container;
    this.setStatus(messageText);
  }

  private returnToVillageTavernSpawn(): void {
    this.confirmationPanel?.destroy();
    this.confirmationPanel = undefined;
    this.scene.start("VillageScene", { fromTavern: true });
  }

  private createButton(x: number, y: number, label: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, label, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "25px",
        color: "#1b100b",
        backgroundColor: "#f0c071",
        padding: { x: 28, y: 11 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
  }

  private createStatusPanel(): void {
    const panelX = WORLD_WIDTH - 304;
    const panelY = WORLD_HEIGHT - 152;
    createNineSlicePanel(this, IMAGE_ASSETS.frameStory.key, panelX, panelY, 520, 220, {
      left: 36,
      right: 36,
      top: 36,
      bottom: 36
    }).setDepth(60);
    this.statusText = this.add
      .text(panelX, panelY, "", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "24px",
        color: "#fff1c2",
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: 420 }
      })
      .setOrigin(0.5)
      .setDepth(61);
  }

  private setStatus(message: string): void {
    this.statusText?.setText([GAME_TEXTS.village.tavern.title, "", message].join("\n"));
  }

  private setInputsEnabled(enabled: boolean): void {
    this.zones.forEach((zone) => {
      zone.input!.enabled = enabled;
    });
  }

  private getPoint(name: string, layerNames: string[]): TavernPoint | undefined {
    const normalizedName = this.normalizeName(name);
    for (const layerName of layerNames) {
      const layer = this.map?.getObjectLayer(layerName);
      const object = layer?.objects.find((candidate) => this.normalizeName(candidate.name ?? "") === normalizedName);
      if (object) {
        return {
          name,
          x: object.x ?? 0,
          y: object.y ?? 0
        };
      }
    }
    return undefined;
  }

  private getZone(name: string): TavernZone | undefined {
    const normalizedName = this.normalizeName(name);
    const object = this.map
      ?.getObjectLayer("interactives")
      ?.objects.find((candidate) => this.normalizeName(candidate.name ?? "") === normalizedName);
    return object
      ? {
          name,
          x: object.x ?? 0,
          y: object.y ?? 0,
          width: object.width ?? 0,
          height: object.height ?? 0
        }
      : undefined;
  }

  private normalizeName(name: string): string {
    return name.replace(/\s+/g, "");
  }

  private publishReport(): void {
    (window as unknown as { __tavernSceneReport?: unknown }).__tavernSceneReport = {
      hasMap: Boolean(this.map),
      spawn: this.getPoint("spawn_grodor", ["spawn"]),
      drinkPath: this.getDrinkPath(),
      exitPath: this.getExitPath(),
      zones: {
        drink: Boolean(this.zones.get("drink")),
        exit: Boolean(this.zones.get("exit"))
      }
    };
  }
}
