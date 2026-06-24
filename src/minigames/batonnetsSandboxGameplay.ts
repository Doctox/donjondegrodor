export type BatonnetsActor = "player" | "enemy";
export type BatonnetsTurn = BatonnetsActor | "finished";
export type BatonnetsOutcome = "player_win" | "player_loss";

export type BatonnetsSandboxSnapshot = {
  total: number;
  remaining: number;
  turn: BatonnetsTurn;
  outcome?: BatonnetsOutcome;
  lastActor?: BatonnetsActor;
  lastTake: number;
};

type BatonnetsSandboxOptions = {
  total?: number;
  totalRange?: { min: number; max: number };
  maxTake?: number;
  smartEnemyChance?: number;
  startingTurn?: BatonnetsTurn;
  randomStartingTurn?: boolean;
  random?: () => number;
};

const DEFAULT_TOTAL = 21;
const DEFAULT_MAX_TAKE = 3;
const DEFAULT_SMART_ENEMY_CHANCE = 0.72;

export class BatonnetsSandboxGameplay {
  private readonly totalRange?: { min: number; max: number };
  private readonly maxTake: number;
  private readonly smartEnemyChance: number;
  private readonly startingTurn: BatonnetsTurn;
  private readonly randomStartingTurn: boolean;
  private readonly random: () => number;
  private total: number;
  private remaining: number;
  private turn: BatonnetsTurn;
  private outcome?: BatonnetsOutcome;
  private lastActor?: BatonnetsActor;
  private lastTake = 0;

  constructor(options: BatonnetsSandboxOptions = {}) {
    this.random = options.random ?? Math.random;
    this.totalRange = options.totalRange
      ? {
          min: Math.max(1, Math.trunc(options.totalRange.min)),
          max: Math.max(1, Math.trunc(options.totalRange.max))
        }
      : undefined;
    this.total = this.pickTotal(options.total);
    this.maxTake = Math.max(1, Math.trunc(options.maxTake ?? DEFAULT_MAX_TAKE));
    this.smartEnemyChance = Math.max(0, Math.min(1, options.smartEnemyChance ?? DEFAULT_SMART_ENEMY_CHANCE));
    this.startingTurn = options.startingTurn === "enemy" ? "enemy" : "player";
    this.randomStartingTurn = options.randomStartingTurn ?? false;
    this.remaining = this.total;
    this.turn = this.pickStartingTurn();
  }

  snapshot(): BatonnetsSandboxSnapshot {
    return {
      total: this.total,
      remaining: this.remaining,
      turn: this.turn,
      outcome: this.outcome,
      lastActor: this.lastActor,
      lastTake: this.lastTake
    };
  }

  reset(): BatonnetsSandboxSnapshot {
    this.total = this.pickTotal();
    this.remaining = this.total;
    this.turn = this.pickStartingTurn();
    this.outcome = undefined;
    this.lastActor = undefined;
    this.lastTake = 0;
    return this.snapshot();
  }

  playerTake(count: number): BatonnetsSandboxSnapshot {
    if (this.turn !== "player") {
      return this.snapshot();
    }

    return this.take("player", count);
  }

  enemyTake(): BatonnetsSandboxSnapshot {
    if (this.turn !== "enemy") {
      return this.snapshot();
    }

    return this.take("enemy", this.pickEnemyTake());
  }

  private take(actor: BatonnetsActor, requestedCount: number): BatonnetsSandboxSnapshot {
    const count = Math.max(1, Math.min(this.maxTake, this.remaining, Math.trunc(requestedCount)));
    this.remaining = Math.max(0, this.remaining - count);
    this.lastActor = actor;
    this.lastTake = count;

    if (this.remaining <= 0) {
      this.turn = "finished";
      this.outcome = actor === "player" ? "player_loss" : "player_win";
      return this.snapshot();
    }

    this.turn = actor === "player" ? "enemy" : "player";
    return this.snapshot();
  }

  private pickEnemyTake(): number {
    const legalTakes = Array.from({ length: Math.min(this.maxTake, this.remaining) }, (_unused, index) => index + 1);
    const smartTake = (this.remaining - 1) % (this.maxTake + 1);
    if (smartTake > 0 && legalTakes.includes(smartTake) && this.random() < this.smartEnemyChance) {
      return smartTake;
    }

    return legalTakes[Math.floor(this.random() * legalTakes.length)] ?? 1;
  }

  private pickTotal(fallbackTotal = DEFAULT_TOTAL): number {
    if (!this.totalRange) {
      return Math.max(1, Math.trunc(fallbackTotal));
    }

    const min = Math.min(this.totalRange.min, this.totalRange.max);
    const max = Math.max(this.totalRange.min, this.totalRange.max);
    return min + Math.floor(this.random() * (max - min + 1));
  }

  private pickStartingTurn(): BatonnetsTurn {
    if (!this.randomStartingTurn) {
      return this.startingTurn;
    }

    return this.random() < 0.5 ? "player" : "enemy";
  }
}
