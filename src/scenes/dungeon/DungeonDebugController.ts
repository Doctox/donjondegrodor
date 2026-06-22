import Phaser from "phaser";
import { IS_DEBUG_TOOLS_ENABLED } from "../../config/debugConfig";
import { GAME_TEXTS } from "../../data/gameTexts";
import { isMonsterId, MonsterId } from "../../data/monsterDefinitions";
import { publishDungeonCombatDebugReport, publishDungeonDeathResetReport } from "../../debug/debugReports";
import {
  addDungeonGoldForDebug,
  adjustDungeonLifeForDebug,
  applyDungeonRunDebugOverrides,
  DungeonRunEvent,
  getDungeonRunState,
  resolveDoorEvent,
  setDungeonEquipmentForDebug,
  setDungeonLifeForCombat
} from "../../systems/dungeonRunState";
import { resetAllLocalProgressDebug } from "../../systems/fullProgressReset";
import type { GrodorDebugMode } from "../../systems/grodorDebugMode";
import { DungeonDebugMenu } from "../../ui/DungeonDebugMenu";

export type DungeonDebugControllerCallbacks = {
  addDeathStats: () => void;
  launchMiniGameEvent: (event: DungeonRunEvent) => void;
  playDeath: () => void;
  playIdle: () => void;
  restoreDungeonOverlaysWhenCombatCloses: () => void;
  setAwaitingContinue: (awaitingContinue: boolean) => void;
  setDungeonCombatLock: (locked: boolean) => void;
  setDungeonOverlaysVisible: (visible: boolean) => void;
  setGrodorMode: (mode: GrodorDebugMode) => void;
  setStatus: (message: string) => void;
  showDefeatResult: () => void;
  syncGrodorEquipment: () => void;
  updateRunHud: () => void;
};

export class DungeonDebugController {
  private debugMenu?: DungeonDebugMenu;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: DungeonDebugControllerCallbacks
  ) {}

  static applyDebugOverridesIfEnabled(sceneKey: string, params: URLSearchParams, startedFromCell: boolean): void {
    if (!DungeonDebugController.shouldApplyDebugOverrides(sceneKey, params, startedFromCell)) {
      return;
    }

    applyDungeonRunDebugOverrides(params);
  }

  createMenu(): void {
    if (!IS_DEBUG_TOOLS_ENABLED) {
      return;
    }

    this.debugMenu = new DungeonDebugMenu(
      this.scene,
      (items) => this.handleEquipmentChange(items),
      (monsterId) => this.launchCombatDebug(monsterId),
      (eventId) => this.callbacks.launchMiniGameEvent(resolveDoorEvent(eventId)),
      (delta) => this.handleLifeChange(delta),
      () => this.handleGoldAdd(),
      () => this.resetAllProgress(),
      () => this.scene.scene.start("VillageScene"),
      (mode) => this.callbacks.setGrodorMode(mode)
    );
    this.debugMenu.update(getDungeonRunState());
  }

  update(): void {
    this.debugMenu?.update(getDungeonRunState());
  }

  setVisible(visible: boolean): void {
    this.debugMenu?.setVisible(visible);
  }

  launchCombatDebugRoute(): void {
    if (!IS_DEBUG_TOOLS_ENABLED) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("scene") !== "combat" || this.scene.scene.isActive("CombatScene")) {
      return;
    }

    const arena = Number(params.get("arena"));
    const monsterParam = params.get("monster");
    const monsterId = monsterParam && isMonsterId(monsterParam) ? monsterParam : "rat";
    this.callbacks.setDungeonOverlaysVisible(false);
    this.callbacks.setDungeonCombatLock(true);
    this.scene.scene.launch("CombatScene", {
      arena: Number.isFinite(arena) ? arena : undefined,
      monsterId,
      debugDirect: true
    });
    this.callbacks.restoreDungeonOverlaysWhenCombatCloses();
  }

  private static shouldApplyDebugOverrides(sceneKey: string, params: URLSearchParams, startedFromCell: boolean): boolean {
    if (!IS_DEBUG_TOOLS_ENABLED) {
      return false;
    }

    if (startedFromCell) {
      return false;
    }

    const routeScene = params.get("scene");

    if (sceneKey === "CellScene") {
      return routeScene === "cell";
    }

    return routeScene !== "cell";
  }

  private handleEquipmentChange(items: string[]): void {
    const state = setDungeonEquipmentForDebug(items);
    this.callbacks.syncGrodorEquipment();
    this.callbacks.updateRunHud();
    this.callbacks.setStatus(state.lastEvent);
  }

  private handleLifeChange(delta: number): void {
    const state = adjustDungeonLifeForDebug(delta);
    if (state.life <= 0) {
      this.callbacks.playDeath();
      this.callbacks.setAwaitingContinue(true);
      this.callbacks.setDungeonCombatLock(true);
      this.callbacks.addDeathStats();
      this.callbacks.updateRunHud();
      this.callbacks.setStatus(GAME_TEXTS.dungeon.runEndedStatus);
      publishDungeonDeathResetReport({
        result: { source: "debug_life", delta },
        nextScene: "ResultScene",
        state
      });
      this.scene.time.delayedCall(650, () => this.callbacks.showDefeatResult());
      return;
    }

    this.callbacks.playIdle();
    this.callbacks.updateRunHud();
    this.callbacks.setStatus(state.lastEvent);
  }

  private handleGoldAdd(): void {
    const state = addDungeonGoldForDebug(10);
    this.callbacks.updateRunHud();
    this.callbacks.setStatus(state.lastEvent);
  }

  private launchCombatDebug(monsterId: MonsterId): void {
    if (!IS_DEBUG_TOOLS_ENABLED || this.scene.scene.isActive("CombatScene")) {
      return;
    }

    const runState = getDungeonRunState();
    if (runState.life <= 0) {
      setDungeonLifeForCombat(Math.min(3, runState.maxLife));
      this.callbacks.updateRunHud();
    }

    this.callbacks.setDungeonOverlaysVisible(false);
    this.callbacks.setDungeonCombatLock(true);
    this.scene.scene.launch("CombatScene", {
      monsterId,
      debugDirect: false
    });
    this.callbacks.restoreDungeonOverlaysWhenCombatCloses();
    this.callbacks.setStatus(GAME_TEXTS.dungeon.combatDebugStatus(monsterId));
    publishDungeonCombatDebugReport({
      monsterId,
      state: getDungeonRunState()
    });
  }

  private resetAllProgress(): void {
    resetAllLocalProgressDebug();
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    window.location.href = url.toString();
  }
}
