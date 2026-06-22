import Phaser from "phaser";
import { GrodorActor } from "../actors/GrodorActor";
import { MonsterActor } from "../actors/MonsterActor";
import { RiggedGrodorAccessories, preloadRiggedGrodorAccessoryAssets } from "../actors/RiggedGrodorAccessories";
import { RiggedGrodorActor, preloadRiggedGrodorActorAssets } from "../actors/RiggedGrodorActor";
import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";
import { COMBAT_PRELOAD_IMAGES, IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { CombatResult } from "../data/combatResults";
import { GAME_TEXTS } from "../data/gameTexts";
import { getMonsterDefinition, isMonsterId, MonsterHitZone, MonsterId } from "../data/monsterDefinitions";
import { playZoneMusic } from "../systems/audioManager";
import { playSfx } from "../systems/sfxManager";
import { preloadImages } from "../systems/scenePreload";
import {
  applyHeartLossWithCowardReflex,
  applyMonsterDamageWithEquipment,
  getDungeonRunState,
  setDungeonLifeForCombat
} from "../systems/dungeonRunState";
import { addGrodorStat } from "../systems/grodorStats";
import { getGrodorDebugMode, type GrodorDebugMode } from "../systems/grodorDebugMode";
import {
  ATTACK_ONE_RIG_PROJECT_SAVE_PATH,
  ATTACK_ONE_RIG_STORAGE_KEY,
  FRONT_RIG_PROJECT_SAVE_PATH,
  FRONT_RIG_STORAGE_KEY,
  HURT_RIG_PROJECT_SAVE_PATH,
  HURT_RIG_STORAGE_KEY,
  SIDE_RIG_PROJECT_SAVE_PATH,
  SIDE_RIG_STORAGE_KEY,
  VICTORY_RIG_PROJECT_SAVE_PATH,
  VICTORY_RIG_STORAGE_KEY
} from "../rig/grodorRigDefinitions";
import type { GrodorRigPresetInput } from "../rig/grodorRig";
import { showFloatingEffectSequence, showFloatingEffectText } from "../ui/floatingEffectText";
import { assetPath } from "../utils/assetPath";

type CombatSceneData = {
  arena?: number;
  debugDirect?: boolean;
  monsterId?: MonsterId | string;
};
type CombatGrodorActor = GrodorActor | RiggedGrodorActor;

const ARENA_KEYS = [IMAGE_ASSETS.combatArena1.key, IMAGE_ASSETS.combatArena2.key, IMAGE_ASSETS.combatArena3.key];
const DEPTHS = {
  arena: 0,
  actors: 20,
  ui: 50,
  exit: 70
};
const HEART_PANEL = {
  x: 300,
  y: 96,
  minWidth: 276,
  frameAspect: 356 / 147,
  paddingX: 34,
  heartSize: 42,
  heartGap: 54
};
const INACTIVITY_HINT_MS = 4000;
const EXIT_HINT_MS = 4000;
const COMBAT_GRODOR_SCALE = 1.78;
const COMBAT_GRODOR_V3_SCALE = {
  idle: 0.52,
  walk: 0.67
};
const COMBAT_MONSTER_SCALE_MULTIPLIER = 1.48;

export class CombatScene extends Phaser.Scene {
  private grodor?: CombatGrodorActor;
  private grodorAccessories?: RiggedGrodorAccessories;
  private grodorMode: GrodorDebugMode = "sprite";
  private rat?: MonsterActor;
  private clickHintText?: Phaser.GameObjects.Text;
  private exitHintText?: Phaser.GameObjects.Text;
  private lifePanel?: Phaser.GameObjects.Image;
  private combatMessage = "";
  private readonly grodorHearts: Phaser.GameObjects.Image[] = [];
  private readonly ratHearts: Phaser.GameObjects.Image[] = [];
  private exitHitZone?: Phaser.GameObjects.Zone;
  private inactivityTimer?: Phaser.Time.TimerEvent;
  private exitHintTimer?: Phaser.Time.TimerEvent;
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

  preload(): void {
    preloadImages(this, COMBAT_PRELOAD_IMAGES);
    if (IS_DEBUG_TOOLS_ENABLED) {
      preloadRiggedGrodorActorAssets(this);
      preloadRiggedGrodorAccessoryAssets(this);
    }
  }

  create(data: CombatSceneData = {}): void {
    playZoneMusic(this, "combat");
    this.resetSceneState();
    this.debugDirect = Boolean(data.debugDirect && IS_DEBUG_TOOLS_ENABLED);
    this.inputLocked = false;
    this.isClosing = false;
    this.grodorMode = getGrodorDebugMode();
    this.monsterId = this.resolveMonsterId(data.monsterId);
    const monsterDefinition = getMonsterDefinition(this.monsterId);
    this.ratLife = monsterDefinition.maxLife;
    const runState = getDungeonRunState();
    this.grodorMaxLife = runState.maxLife;
    this.grodorLife = Phaser.Math.Clamp(runState.life, 0, runState.maxLife);
    this.startingGrodorLife = this.grodorLife;
    const arenaKey = this.getArenaKey(data.arena);

    this.add.image(0, 0, arenaKey).setOrigin(0).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT).setDepth(DEPTHS.arena);

    this.grodor = this.createGrodorActor(590, 835);
    this.grodor.container.setDepth(DEPTHS.actors);
    this.syncGrodorEquipment();
    this.grodor.setFlipX(false);

    this.rat = new MonsterActor(this, 1270, 835, this.monsterId, COMBAT_MONSTER_SCALE_MULTIPLIER);
    this.rat.container.setDepth(DEPTHS.actors);
    this.rat.onZoneSelected((zone) => this.resolveZoneAttack(zone));

    this.createCombatHud();
    this.setCombatMessage(GAME_TEXTS.combat.chooseZone);
    this.startInactivityHintTimer();

    if (this.grodorLife <= 0) {
      this.inputLocked = true;
      this.rat.setZonesEnabled(false);
      this.playGrodorDeath();
      this.setCombatMessage(GAME_TEXTS.combat.temporaryDefeat);
      this.prepareCombatExit();
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

  update(time: number): void {
    if (this.grodor instanceof RiggedGrodorActor) {
      this.grodor.update(time / 1000);
      this.grodorAccessories?.update(time / 1000, false);
    }
  }

  private createGrodorActor(x: number, y: number): CombatGrodorActor {
    if (this.grodorMode !== "rigV3") {
      return new GrodorActor(this, x, y, COMBAT_GRODOR_SCALE);
    }

    const actor = new RiggedGrodorActor(this, {
      x,
      y,
      depth: DEPTHS.actors,
      idleScale: COMBAT_GRODOR_V3_SCALE.idle,
      walkScale: COMBAT_GRODOR_V3_SCALE.walk
    });
    void this.loadRiggedGrodorPresets(actor);
    return actor;
  }

  private async loadRiggedGrodorPresets(actor: RiggedGrodorActor): Promise<void> {
    const [idlePreset, walkPreset, victoryPreset, hurtPreset, attackOnePreset] = await Promise.all([
      this.loadRigPreset(FRONT_RIG_STORAGE_KEY, FRONT_RIG_PROJECT_SAVE_PATH),
      this.loadRigPreset(SIDE_RIG_STORAGE_KEY, SIDE_RIG_PROJECT_SAVE_PATH),
      this.loadRigPreset(VICTORY_RIG_STORAGE_KEY, VICTORY_RIG_PROJECT_SAVE_PATH),
      this.loadRigPreset(HURT_RIG_STORAGE_KEY, HURT_RIG_PROJECT_SAVE_PATH),
      this.loadRigPreset(ATTACK_ONE_RIG_STORAGE_KEY, ATTACK_ONE_RIG_PROJECT_SAVE_PATH)
    ]);

    if (this.grodor !== actor) {
      return;
    }

    if (idlePreset) {
      actor.applyIdlePreset(idlePreset);
    }
    if (walkPreset) {
      actor.applyWalkPreset(walkPreset);
    }
    if (victoryPreset) {
      actor.applyVictoryPreset(victoryPreset);
    }
    if (hurtPreset) {
      actor.applyHurtPreset(hurtPreset);
    }
    if (attackOnePreset) {
      actor.applyAttackOnePreset(attackOnePreset);
    }

    actor.playIdle();
    this.syncGrodorEquipment();
  }

  private async loadRigPreset(storageKey: string, projectPath: string): Promise<GrodorRigPresetInput | null> {
    try {
      const response = await fetch(`${assetPath(projectPath)}?v=${Date.now()}`);
      return response.ok ? ((await response.json()) as GrodorRigPresetInput) : null;
    } catch {
      // Local editor storage remains a fallback for temporary work-in-progress presets.
    }

    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as GrodorRigPresetInput) : null;
    } catch {
      return null;
    }
  }

  private syncGrodorEquipment(equipment = getDungeonRunState().equipment): void {
    this.grodor?.setEquipment(equipment);
    this.syncGrodorAccessories(equipment);
  }

  private syncGrodorAccessories(equipment = getDungeonRunState().equipment): void {
    if (!(this.grodor instanceof RiggedGrodorActor)) {
      this.grodorAccessories?.destroy();
      this.grodorAccessories = undefined;
      return;
    }

    if (!this.grodorAccessories) {
      this.grodorAccessories = new RiggedGrodorAccessories(this, this.grodor);
    } else {
      this.grodorAccessories.setActor(this.grodor);
    }
    this.grodorAccessories.setEquipment(equipment);
  }

  private createCombatHud(): void {
    const width = Math.max(HEART_PANEL.minWidth, HEART_PANEL.paddingX * 2 + this.grodorMaxLife * HEART_PANEL.heartGap);
    const height = width / HEART_PANEL.frameAspect;
    this.lifePanel = this.add
      .image(HEART_PANEL.x, HEART_PANEL.y, IMAGE_ASSETS.dungeonHudHeartFrame.key)
      .setDisplaySize(width, height)
      .setDepth(DEPTHS.ui);

    const firstHeartX = HEART_PANEL.x - ((this.grodorMaxLife - 1) * HEART_PANEL.heartGap) / 2;
    for (let index = 0; index < this.grodorMaxLife; index += 1) {
      const heart = this.add
        .image(firstHeartX + index * HEART_PANEL.heartGap, HEART_PANEL.y, IMAGE_ASSETS.heartEmpty.key)
        .setDisplaySize(HEART_PANEL.heartSize, HEART_PANEL.heartSize)
        .setDepth(DEPTHS.ui + 1);
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

    this.clickHintText = this.add
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.combat.clickHint, {
        fontFamily: "Georgia, serif",
        fontSize: "54px",
        color: "#ffe0a0",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.ui)
      .setVisible(false);

    this.updateLifeText();
  }

  private resolveZoneAttack(zone: MonsterHitZone): void {
    if (this.inputLocked || !this.grodor || !this.rat) {
      return;
    }

    this.clearInactivityHint();
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
      playSfx("combatHit");
      const damageResult = applyMonsterDamageWithEquipment(1);
      this.ratLife = Math.max(0, this.ratLife - damageResult.damage);
      this.syncGrodorEquipment(damageResult.state.equipment);
      this.playItemBreakSfx(damageResult.brokenItems);
      this.rat?.reactToHit();
      if (this.ratLife <= 0) {
        this.rat?.playKo();
      }
      this.showCombatEffectText(this.getMonsterEffectPoint(), GAME_TEXTS.combat.pvDelta(-damageResult.damage), "negative");
      this.showCombatEffectMessages(damageResult.effectMessages);
      this.setCombatMessage(
        [GAME_TEXTS.combat.ratDamage(this.getZoneLabel(zone), monsterName), ...damageResult.effectMessages].join("\n")
      );
    } else if (result === "grodor_damage") {
      const previousLife = this.grodorLife;
      const lossResult = applyHeartLossWithCowardReflex(1, "combat");
      const syncedState = lossResult.state;
      this.grodorLife = syncedState.life;
      this.grodorMaxLife = syncedState.maxLife;
      this.syncGrodorEquipment(syncedState.equipment);
      this.playItemBreakSfx(lossResult.brokenItems);
      if (lossResult.finalLoss <= 0) {
        this.grodor?.playIdle();
        this.showCombatEffectText(this.getGrodorEffectPoint(), GAME_TEXTS.combat.dodge, "dodge");
        this.showCombatEffectMessages(lossResult.effectMessages);
        this.setCombatMessage(lossResult.effectMessages.join("\n") || GAME_TEXTS.dungeon.cowardReflexTriggered);
      } else {
        playSfx("grodorHurt");
        this.grodor?.playHurt();
        this.showCombatEffectText(this.getGrodorEffectPoint(), GAME_TEXTS.combat.pvDelta(-lossResult.finalLoss), "negative");
        this.showCombatEffectMessages(lossResult.effectMessages);
        this.setCombatMessage(
          [GAME_TEXTS.combat.grodorDamage(this.getZoneLabel(zone), monsterName), ...lossResult.effectMessages].join("\n")
        );
        this.playCombatHeartLossEffect(previousLife);
      }
      (window as unknown as { __combatLifeSyncReport?: unknown }).__combatLifeSyncReport = {
        grodorLife: this.grodorLife,
        lossResult,
        state: syncedState
      };
    } else {
      this.showCombatEffectText(this.getMonsterEffectPoint(), GAME_TEXTS.combat.dodge, "dodge");
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
        message: this.combatMessage
      };
    });
  }

  private resolveRoundEnd(): void {
    if (this.ratLife <= 0) {
      playSfx("miniGameSuccess");
      this.grodor?.playVictory();
      this.setCombatMessage(GAME_TEXTS.combat.victory(this.getMonsterName()));
      this.prepareCombatExit();
      return;
    }

    if (this.grodorLife <= 0) {
      this.playGrodorDeath();
      playSfx("grodorDeath");
      this.setCombatMessage(GAME_TEXTS.combat.temporaryDefeat);
      this.prepareCombatExit();
      return;
    }

    this.grodor?.playIdle();
    this.inputLocked = false;
    this.rat?.setZonesEnabled(true);
    this.startInactivityHintTimer();
  }

  private playItemBreakSfx(brokenItems: string[] = []): void {
    if (brokenItems.length > 0) {
      playSfx("itemBreak");
    }
  }

  private playGrodorDeath(): void {
    if (!(this.grodor instanceof RiggedGrodorActor)) {
      this.grodor?.playDeath();
      return;
    }

    const x = this.grodor.x;
    const y = this.grodor.y;
    this.grodorAccessories?.destroy();
    this.grodorAccessories = undefined;
    this.grodor.destroy();
    this.grodor = new GrodorActor(this, x, y, COMBAT_GRODOR_SCALE);
    this.grodor.container.setDepth(DEPTHS.actors);
    this.grodor.setEquipment(getDungeonRunState().equipment);
    this.grodor.setFlipX(false);
    this.grodor.playDeath();
  }

  private startInactivityHintTimer(): void {
    this.clearInactivityHint();
    this.inactivityTimer = this.time.delayedCall(INACTIVITY_HINT_MS, () => {
      if (this.inputLocked || this.isClosing || !this.scene.isActive("CombatScene")) {
        return;
      }

      this.clickHintText?.setVisible(true);
      this.tweens.add({
        targets: this.clickHintText,
        alpha: 0.42,
        duration: 220,
        yoyo: true,
        repeat: 3
      });
      this.rat?.flashHitZones(2);
    });
  }

  private clearInactivityHint(): void {
    this.inactivityTimer?.remove(false);
    this.inactivityTimer = undefined;
    this.clickHintText?.setVisible(false);
    this.clickHintText?.setAlpha(1);
  }

  private prepareCombatExit(): void {
    if (this.exitHitZone) {
      return;
    }

    this.clearInactivityHint();
    this.inputLocked = true;
    this.rat?.setZonesEnabled(false);
    this.exitHitZone = this.add
      .zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(DEPTHS.exit)
      .setInteractive({ useHandCursor: true });
    this.exitHitZone.once("pointerdown", () => this.closeCombat());
    this.exitHintTimer = this.time.delayedCall(EXIT_HINT_MS, () => this.showExitHint());
  }

  private showExitHint(): void {
    if (this.exitHintText || this.isClosing) {
      return;
    }

    this.exitHintText = this.add
      .text(WORLD_WIDTH / 2, 890, GAME_TEXTS.combat.exitHint, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "30px",
        color: "#fff1c2",
        align: "center",
        stroke: "#120d0a",
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.exit + 1);
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
    this.combatMessage = message;
  }

  private playCombatHeartLossEffect(previousLife: number): void {
    const sourceHeart = this.grodorHearts[previousLife - 1];
    if (!sourceHeart) {
      return;
    }

    const start = { x: sourceHeart.x, y: sourceHeart.y };
    const end = this.getGrodorEffectPoint(-120);
    const mid = {
      x: (start.x + end.x) / 2,
      y: Math.min(start.y, end.y) - 120
    };
    const heart = this.add
      .image(start.x, start.y, IMAGE_ASSETS.heartBrake.key)
      .setDisplaySize(58, 54)
      .setDepth(DEPTHS.ui + 7)
      .setAlpha(0);
    const heartScaleX = heart.scaleX;
    const heartScaleY = heart.scaleY;
    heart.setScale(heartScaleX * 0.78, heartScaleY * 0.78);
    const progress = { value: 0 };

    this.tweens.add({
      targets: heart,
      alpha: 1,
      scaleX: heartScaleX,
      scaleY: heartScaleY,
      duration: 120,
      ease: "Back.easeOut"
    });
    this.tweens.add({
      targets: progress,
      value: 1,
      duration: 1400,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const t = progress.value;
        const inv = 1 - t;
        heart.setPosition(
          inv * inv * start.x + 2 * inv * t * mid.x + t * t * end.x,
          inv * inv * start.y + 2 * inv * t * mid.y + t * t * end.y
        );
        heart.setAngle(-34 * Math.sin(t * Math.PI * 2));
        if (t > 0.8) {
          heart.setAlpha(Math.max(0, (1 - t) / 0.2));
        }
      },
      onComplete: () => {
        heart.destroy();
      }
    });
  }

  private showCombatEffectMessages(messages: string[]): void {
    if (messages.length <= 0) {
      return;
    }

    showFloatingEffectSequence(this, messages, () => this.getGrodorEffectPoint(-168), {
      depth: DEPTHS.ui + 8,
      tone: "item",
      fontSize: 34,
      wrapWidth: 620,
      startDelayMs: 720,
      staggerMs: 1500
    });
  }

  private showCombatEffectText(
    point: { x: number; y: number },
    text: string,
    tone: "negative" | "dodge" | "item",
    fontSize = 48,
    wrapWidth = 420
  ): void {
    showFloatingEffectText(this, point, text, {
      depth: DEPTHS.ui + 8,
      tone,
      fontSize,
      wrapWidth,
      holdMs: 900,
      startScale: 0.84
    });
  }

  private getGrodorEffectPoint(offsetY = -250): { x: number; y: number } {
    return {
      x: this.grodor?.x ?? 590,
      y: (this.grodor?.y ?? 835) + offsetY
    };
  }

  private getMonsterEffectPoint(): { x: number; y: number } {
    const heartPoint = this.rat?.getHeartPosition();
    if (heartPoint) {
      return {
        x: heartPoint.x + 18,
        y: heartPoint.y - 36
      };
    }

    return {
      x: this.rat?.container.x ?? 1270,
      y: (this.rat?.container.y ?? 835) - 360
    };
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
    this.exitHitZone?.disableInteractive();
    this.exitHintTimer?.remove(false);
    this.exitHintTimer = undefined;
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
    this.grodorAccessories?.destroy();
    this.grodor?.destroy();
    this.grodor = undefined;
    this.grodorAccessories = undefined;
    this.grodorMode = "sprite";
    this.rat = undefined;
    this.combatMessage = "";
    this.clickHintText = undefined;
    this.exitHintText = undefined;
    this.lifePanel = undefined;
    this.exitHitZone = undefined;
    this.inactivityTimer = undefined;
    this.exitHintTimer = undefined;
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

}
