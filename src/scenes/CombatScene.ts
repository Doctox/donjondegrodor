import Phaser from "phaser";
import { GrodorActor } from "../actors/GrodorActor";
import { MonsterActor } from "../actors/MonsterActor";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { CombatResult } from "../data/combatResults";
import { GAME_TEXTS } from "../data/gameTexts";
import { getMonsterDefinition, isMonsterId, MonsterHitZone, MonsterId } from "../data/monsterDefinitions";
import {
  applyHeartLossWithCowardReflex,
  applyMonsterDamageWithEquipment,
  getDungeonRunState,
  setDungeonLifeForCombat
} from "../systems/dungeonRunState";
import { addGrodorStat } from "../systems/grodorStats";
import { createNineSlicePanel } from "../ui/nineSlicePanel";

type CombatSceneData = {
  arena?: number;
  debugDirect?: boolean;
  monsterId?: MonsterId | string;
};

const ARENA_KEYS = [IMAGE_ASSETS.combatArena1.key, IMAGE_ASSETS.combatArena2.key, IMAGE_ASSETS.combatArena3.key];
const DEPTHS = {
  overlay: 0,
  zone: 5,
  arena: 10,
  actors: 20,
  ui: 50
};

export class CombatScene extends Phaser.Scene {
  private grodor?: GrodorActor;
  private rat?: MonsterActor;
  private messageText?: Phaser.GameObjects.Text;
  private readonly grodorHearts: Phaser.GameObjects.Image[] = [];
  private readonly ratHearts: Phaser.GameObjects.Image[] = [];
  private continueButton?: Phaser.GameObjects.Text;
  private debugDirect = false;
  private inputLocked = false;
  private isClosing = false;
  private ratLife = 3;
  private grodorLife = 3;
  private grodorMaxLife = 3;
  private startingGrodorLife = 3;
  private monsterId: MonsterId = "rat";

  constructor() {
    super("CombatScene");
  }

  create(data: CombatSceneData = {}): void {
    this.resetSceneState();
    this.debugDirect = Boolean(data.debugDirect && IS_DEBUG_TOOLS_ENABLED);
    this.inputLocked = false;
    this.isClosing = false;
    this.monsterId = this.resolveMonsterId(data.monsterId);
    const monsterDefinition = getMonsterDefinition(this.monsterId);
    this.ratLife = monsterDefinition.maxLife;
    const runState = getDungeonRunState();
    this.grodorMaxLife = runState.maxLife;
    this.grodorLife = Phaser.Math.Clamp(runState.life, 0, runState.maxLife);
    this.startingGrodorLife = this.grodorLife;
    const arenaKey = this.getArenaKey(data.arena);

    this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x000000, 0.38).setOrigin(0).setDepth(DEPTHS.overlay);
    this.add
      .image(0, 0, IMAGE_ASSETS.combatZone.key)
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(DEPTHS.zone);
    this.add.image(0, 0, arenaKey).setOrigin(0).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT).setDepth(DEPTHS.arena);

    this.grodor = new GrodorActor(this, 635, 790);
    this.grodor.container.setDepth(DEPTHS.actors);
    this.grodor.setEquipment(getDungeonRunState().equipment);
    this.grodor.setFlipX(false);
    this.grodor.container.setScale(0.9);

    this.rat = new MonsterActor(this, 1270, 790, this.monsterId);
    this.rat.container.setDepth(DEPTHS.actors);
    this.rat.onZoneSelected((zone) => this.resolveZoneAttack(zone));

    this.createCombatHud();
    this.setCombatMessage(GAME_TEXTS.combat.chooseZone);

    this.continueButton = this.createButton(960, 925, GAME_TEXTS.common.continue, () => this.closeCombat()).setVisible(false);
    if (this.grodorLife <= 0) {
      this.inputLocked = true;
      this.rat.setZonesEnabled(false);
      this.grodor.playDeath();
      this.setCombatMessage(GAME_TEXTS.combat.temporaryDefeat);
      this.continueButton.setVisible(true);
    }

    (window as unknown as { __combatSceneReport?: unknown }).__combatSceneReport = {
      status: "ready",
      arena: arenaKey,
      debugDirect: this.debugDirect,
      monsterId: this.monsterId,
      ratLife: this.ratLife,
      monsterLife: this.ratLife,
      grodorLife: this.grodorLife,
      grodorMaxLife: this.grodorMaxLife,
      startingGrodorLife: this.startingGrodorLife
    };
  }

  private createCombatHud(): void {
    for (let index = 0; index < 6; index += 1) {
      const heart = this.add.image(1518 + index * 56, 42, IMAGE_ASSETS.heartEmpty.key).setScale(0.08).setDepth(DEPTHS.ui);
      this.grodorHearts.push(heart);
    }

    const ratHeartPosition = this.rat?.getHeartPosition() ?? { x: 1270, y: 420 };
    const monsterDefinition = getMonsterDefinition(this.monsterId);
    for (let index = 0; index < monsterDefinition.maxLife; index += 1) {
      const heart = this.add
        .image(ratHeartPosition.x + index * 42, ratHeartPosition.y, IMAGE_ASSETS.heartFull.key)
        .setScale(0.07)
        .setDepth(DEPTHS.ui);
      this.ratHearts.push(heart);
    }

    const panelWidth = 520;
    const panelHeight = 220;
    const panelX = WORLD_WIDTH - 304;
    const panelY = WORLD_HEIGHT - 152;
    createNineSlicePanel(this, IMAGE_ASSETS.frameStory.key, panelX, panelY, panelWidth, panelHeight, {
      left: 64,
      right: 64,
      top: 64,
      bottom: 64
    }).setDepth(DEPTHS.ui);

    this.messageText = this.add
      .text(panelX, panelY, "", {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "24px",
        color: "#fff1c2",
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: panelWidth - 76 }
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.ui);

    this.updateLifeText();
  }

  private resolveZoneAttack(zone: MonsterHitZone): void {
    if (this.inputLocked || !this.grodor || !this.rat) {
      return;
    }

    this.inputLocked = true;
    this.rat.setZonesEnabled(false);
    this.rat.highlightZone(zone);
    this.grodor.playAttack();

    this.time.delayedCall(460, () => {
      if (!this.scene.isActive("CombatScene")) {
        return;
      }
      this.applyAttackResult(zone, this.pickAttackResult());
    });
  }

  private applyAttackResult(zone: MonsterHitZone, result: "rat_damage" | "grodor_damage" | "nothing"): void {
    const monsterName = this.getMonsterName();
    if (result === "rat_damage") {
      const damageResult = applyMonsterDamageWithEquipment(1);
      this.ratLife = Math.max(0, this.ratLife - damageResult.damage);
      this.grodor?.setEquipment(damageResult.state.equipment);
      this.rat?.reactToHit();
      this.setCombatMessage(
        [GAME_TEXTS.combat.ratDamage(this.getZoneLabel(zone), monsterName), ...damageResult.effectMessages].join("\n")
      );
    } else if (result === "grodor_damage") {
      const previousLife = this.grodorLife;
      const lossResult = applyHeartLossWithCowardReflex(1, "combat");
      const syncedState = lossResult.state;
      this.grodorLife = syncedState.life;
      this.grodorMaxLife = syncedState.maxLife;
      this.grodor?.setEquipment(syncedState.equipment);
      if (lossResult.finalLoss <= 0) {
        this.grodor?.playIdle();
        this.setCombatMessage(lossResult.effectMessages.join("\n") || GAME_TEXTS.dungeon.cowardReflexTriggered);
      } else {
        this.grodor?.playHurt();
        this.setCombatMessage(
          [GAME_TEXTS.combat.grodorDamage(this.getZoneLabel(zone), monsterName), ...lossResult.effectMessages].join("\n")
        );
        this.flashLostGrodorHeart(previousLife);
      }
      (window as unknown as { __combatLifeSyncReport?: unknown }).__combatLifeSyncReport = {
        grodorLife: this.grodorLife,
        lossResult,
        state: syncedState
      };
    } else {
      this.setCombatMessage(GAME_TEXTS.combat.nothing(this.getZoneLabel(zone)));
    }

    this.updateLifeText();

    this.time.delayedCall(820, () => {
      if (!this.scene.isActive("CombatScene")) {
        return;
      }
      this.resolveRoundEnd();
      (window as unknown as { __combatSceneReport?: unknown }).__combatSceneReport = {
        status: "resolved",
        monsterId: this.monsterId,
        zone,
        result,
        ratLife: this.ratLife,
        monsterLife: this.ratLife,
        grodorLife: this.grodorLife,
        message: this.messageText?.text
      };
    });
  }

  private resolveRoundEnd(): void {
    if (this.ratLife <= 0) {
      this.setCombatMessage(GAME_TEXTS.combat.victory(this.getMonsterName()));
      this.continueButton?.setVisible(true);
      return;
    }

    if (this.grodorLife <= 0) {
      this.grodor?.playDeath();
      this.setCombatMessage(GAME_TEXTS.combat.temporaryDefeat);
      this.continueButton?.setVisible(true);
      return;
    }

    this.grodor?.playIdle();
    this.inputLocked = false;
    this.rat?.setZonesEnabled(true);
  }

  private pickAttackResult(): "rat_damage" | "grodor_damage" | "nothing" {
    return Phaser.Utils.Array.GetRandom(["rat_damage", "grodor_damage", "nothing"]);
  }

  private updateLifeText(): void {
    this.grodorHearts.forEach((heart, index) => {
      heart.setVisible(index < this.grodorMaxLife);
      heart.setTexture(index < this.grodorLife ? IMAGE_ASSETS.heartFull.key : IMAGE_ASSETS.heartEmpty.key);
    });
    this.ratHearts.forEach((heart, index) => {
      heart.setTexture(index < this.ratLife ? IMAGE_ASSETS.heartFull.key : IMAGE_ASSETS.heartEmpty.key);
    });

    (window as unknown as { __combatHudReport?: unknown }).__combatHudReport = {
      monsterId: this.monsterId,
      grodorLife: this.grodorLife,
      grodorMaxLife: this.grodorMaxLife,
      monsterLife: this.ratLife,
      grodorFullHearts: this.grodorHearts.filter((heart) => heart.visible && heart.texture.key === IMAGE_ASSETS.heartFull.key)
        .length,
      monsterFullHearts: this.ratHearts.filter((heart) => heart.texture.key === IMAGE_ASSETS.heartFull.key).length
    };
  }

  private setCombatMessage(message: string): void {
    this.messageText?.setText(message);
  }

  private flashLostGrodorHeart(previousLife: number): void {
    const lostHeart = this.grodorHearts[previousLife - 1];
    if (!lostHeart) {
      return;
    }

    this.tweens.add({
      targets: lostHeart,
      scale: 0.12,
      alpha: 0.45,
      duration: 120,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        lostHeart.setScale(0.08);
        lostHeart.setAlpha(1);
      }
    });
  }

  private getZoneLabel(zone: MonsterHitZone): string {
    return zone === "head"
      ? GAME_TEXTS.combat.zoneLabels.head
      : zone === "body"
        ? GAME_TEXTS.combat.zoneLabels.body
        : GAME_TEXTS.combat.zoneLabels.legs;
  }

  private getMonsterName(): string {
    return getMonsterDefinition(this.monsterId).name;
  }

  private closeCombat(): void {
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    this.continueButton?.disableInteractive();
    this.time.removeAllEvents();
    const updatedState = setDungeonLifeForCombat(this.grodorLife);
    const result = this.createCombatResult();
    (window as unknown as { __combatCloseReport?: unknown }).__combatCloseReport = {
      grodorLife: this.grodorLife,
      result,
      state: updatedState
    };

    if (!this.scene.isActive("DungeonScene") && this.scene.isActive("VillageScene")) {
      this.scene.get("VillageScene").events.emit("combat-closed", result);
      this.scene.stop("CombatScene");
      return;
    }

    if (this.debugDirect && !this.scene.isActive("DungeonScene")) {
      this.setCombatMessage(GAME_TEXTS.combat.closedToCell);
      if (result.outcome === "death") {
        addGrodorStat("humiliations");
        addGrodorStat("mortsRidicules");
        this.scene.start("ResultScene", { mode: "defeat", scoreGain: 2 });
        return;
      }
      this.scene.start("DungeonScene");
      return;
    }

    const dungeonScene = this.scene.get("DungeonScene");
    dungeonScene?.events.emit("combat-closed", result);
    this.scene.wake("DungeonScene");
    this.scene.stop("CombatScene");
  }

  private resetSceneState(): void {
    this.grodor = undefined;
    this.rat = undefined;
    this.messageText = undefined;
    this.continueButton = undefined;
    this.grodorHearts.length = 0;
    this.ratHearts.length = 0;
  }

  private getArenaKey(forcedArena?: number): string {
    const urlArena = IS_DEBUG_TOOLS_ENABLED ? Number(new URLSearchParams(window.location.search).get("arena")) : Number.NaN;
    const arenaNumber = forcedArena ?? urlArena;

    if (arenaNumber >= 1 && arenaNumber <= ARENA_KEYS.length) {
      return ARENA_KEYS[arenaNumber - 1];
    }

    return ARENA_KEYS[Math.floor(Math.random() * ARENA_KEYS.length)];
  }

  private resolveMonsterId(monsterId: string | undefined): MonsterId {
    return monsterId && isMonsterId(monsterId) ? monsterId : "rat";
  }

  private createCombatResult(): CombatResult {
    const monsterDefinition = getMonsterDefinition(this.monsterId);
    const outcome = this.grodorLife <= 0 ? "death" : "victory";
    const perfect = outcome === "victory" && this.grodorLife === this.startingGrodorLife;
    const goldReward = outcome === "victory" ? monsterDefinition.baseGoldReward + (perfect ? 1 : 0) : 0;

    return {
      outcome,
      monsterId: this.monsterId,
      grodorLife: this.grodorLife,
      monsterLife: this.ratLife,
      perfect,
      goldReward
    };
  }

  private navigateToNewCellRun(): void {
    const url = new URL(window.location.href);
    url.searchParams.set("scene", "cell");
    ["event", "monster", "arena", "life", "maxLife", "gold", "inventory", "equipment", "floor", "currentFloor", "totalFloors"].forEach((key) => {
      url.searchParams.delete(key);
    });
    window.location.href = url.toString();
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "32px",
        color: "#1b100b",
        backgroundColor: "#f0c071",
        padding: { x: 34, y: 14 }
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.ui)
      .setInteractive({ useHandCursor: true });

    button.on("pointerover", () => button.setStyle({ backgroundColor: "#ffd98b" }));
    button.on("pointerout", () => button.setStyle({ backgroundColor: "#f0c071" }));
    button.on("pointerdown", onClick);

    return button;
  }
}
