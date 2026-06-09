import { resetGameState } from "./gameState";
import { resetGrodorStatsDebug } from "./grodorStats";
import { resetDungeonProgressDebug } from "./dungeonRunState";
import { resetMetaProgressionDebug } from "./metaProgression";
import { resetPermanentUpgradesDebug } from "./permanentUpgrades";
import { resetVillageDiscoveryDebug } from "./villageDiscovery";

export function resetAllLocalProgressDebug(): void {
  resetMetaProgressionDebug();
  resetPermanentUpgradesDebug();
  resetGrodorStatsDebug();
  resetVillageDiscoveryDebug();
  resetDungeonProgressDebug();
  resetGameState();
}
