import { MonsterId } from "./monsterDefinitions";

export type CombatOutcome = "victory" | "death";

export type CombatResult = {
  outcome: CombatOutcome;
  monsterId: MonsterId;
  grodorLife: number;
  monsterLife: number;
  perfect: boolean;
  goldReward: number;
};
