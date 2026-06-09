import { IS_DEBUG_TOOLS_ENABLED } from "../config/debugConfig";

type DebugReportName =
  | "__dungeonSceneReport"
  | "__dungeonDeathResetReport"
  | "__dungeonCombatDebugReport"
  | "__dungeonCombatReport"
  | "__dungeonMiniGameReport"
  | "__dungeonCombatResultReport"
  | "__dungeonMiniGameResultReport"
  | "__equipmentReplacementReport"
  | "__shopDiscoveryReport"
  | "__grodorPoseReport"
  | "__dungeonFinalDoorReport"
  | "__dungeonFinalDoorRetryReport"
  | "__dungeonEventReport"
  | "__dungeonCombatPanelReport"
  | "__dungeonContinueReport"
  | "__dungeonExitReport"
  | "__doorReadingReport"
  | "__tiledMovementReport"
  | "__tiledDebugReport"
  | "__villageCombatDebugReport"
  | "__villageMiniGameDebugReport"
  | "__grodorHouseReport"
  | "__villageSceneReport"
  | "__villageMovementReport"
  | "__villagePanelReport"
  | "__villageReturnReport"
  | "__villageShopMenuReport"
  | "__villageShopReport"
  | "__villageShopPassiveReport"
  | "__shopPassiveInputReport";

function publishDebugReport(name: DebugReportName, payload: unknown): void {
  if (!IS_DEBUG_TOOLS_ENABLED || typeof window === "undefined") {
    return;
  }

  (window as unknown as Record<DebugReportName, unknown>)[name] = payload;
}

function getDebugReport<T>(name: DebugReportName): T | undefined {
  if (!IS_DEBUG_TOOLS_ENABLED || typeof window === "undefined") {
    return undefined;
  }

  return (window as unknown as Partial<Record<DebugReportName, unknown>>)[name] as T | undefined;
}

export const publishDungeonSceneReport = (payload: unknown): void => publishDebugReport("__dungeonSceneReport", payload);
export const publishDungeonDeathResetReport = (payload: unknown): void => publishDebugReport("__dungeonDeathResetReport", payload);
export const publishDungeonCombatDebugReport = (payload: unknown): void => publishDebugReport("__dungeonCombatDebugReport", payload);
export const publishDungeonCombatReport = (payload: unknown): void => publishDebugReport("__dungeonCombatReport", payload);
export const publishDungeonMiniGameReport = (payload: unknown): void => publishDebugReport("__dungeonMiniGameReport", payload);
export const publishDungeonCombatResultReport = (payload: unknown): void => publishDebugReport("__dungeonCombatResultReport", payload);
export const publishDungeonMiniGameResultReport = (payload: unknown): void => publishDebugReport("__dungeonMiniGameResultReport", payload);
export const publishEquipmentReplacementReport = (payload: unknown): void => publishDebugReport("__equipmentReplacementReport", payload);
export const publishShopDiscoveryReport = (payload: unknown): void => publishDebugReport("__shopDiscoveryReport", payload);
export const publishGrodorPoseReport = (payload: unknown): void => publishDebugReport("__grodorPoseReport", payload);
export const publishDungeonFinalDoorReport = (payload: unknown): void => publishDebugReport("__dungeonFinalDoorReport", payload);
export const publishDungeonFinalDoorRetryReport = (payload: unknown): void => publishDebugReport("__dungeonFinalDoorRetryReport", payload);
export const publishDungeonEventReport = (payload: unknown): void => publishDebugReport("__dungeonEventReport", payload);
export const publishDungeonCombatPanelReport = (payload: unknown): void => publishDebugReport("__dungeonCombatPanelReport", payload);
export const publishDungeonContinueReport = (payload: unknown): void => publishDebugReport("__dungeonContinueReport", payload);
export const publishDungeonExitReport = (payload: unknown): void => publishDebugReport("__dungeonExitReport", payload);
export const publishDoorReadingReport = (payload: unknown): void => publishDebugReport("__doorReadingReport", payload);
export const publishTiledMovementReport = (payload: unknown): void => publishDebugReport("__tiledMovementReport", payload);
export const publishTiledDebugReport = (payload: unknown): void => publishDebugReport("__tiledDebugReport", payload);

export const publishVillageCombatDebugReport = (payload: unknown): void => publishDebugReport("__villageCombatDebugReport", payload);
export const publishVillageMiniGameDebugReport = (payload: unknown): void => publishDebugReport("__villageMiniGameDebugReport", payload);
export const publishGrodorHouseReport = (payload: unknown): void => publishDebugReport("__grodorHouseReport", payload);
export const publishVillageReport = (payload: unknown): void => publishDebugReport("__villageSceneReport", payload);
export const publishVillageMovementReport = (payload: unknown): void => publishDebugReport("__villageMovementReport", payload);
export const publishVillagePanelReport = (payload: unknown): void => publishDebugReport("__villagePanelReport", payload);
export const publishVillageReturnReport = (payload: unknown): void => publishDebugReport("__villageReturnReport", payload);

export const publishVillageShopMenuReport = (payload: unknown): void => publishDebugReport("__villageShopMenuReport", payload);
export const publishShopReport = (payload: unknown): void => publishDebugReport("__villageShopReport", payload);
export const publishVillageShopPassiveReport = (payload: unknown): void => publishDebugReport("__villageShopPassiveReport", payload);
export const publishShopPassiveInputReport = (payload: unknown): void => publishDebugReport("__shopPassiveInputReport", payload);
export const getShopPassiveInputReport = (): Record<string, unknown> | undefined =>
  getDebugReport<Record<string, unknown>>("__shopPassiveInputReport");
