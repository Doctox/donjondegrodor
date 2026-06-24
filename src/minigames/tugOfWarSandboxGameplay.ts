export type TugOfWarSandboxPhase = "playing" | "won" | "lost";

export type TugOfWarSandboxFeedback = "ready" | "hit" | "miss" | "wait" | "win" | "lose";

export type TugOfWarSandboxSnapshot = {
  phase: TugOfWarSandboxPhase;
  tension: number;
  normalizedTension: number;
  elapsedMs: number;
  nextBeatMs: number;
  beatProgress: number;
  currentBeatIntervalMs: number;
  currentBeatHit: boolean;
  upcomingBeatIntervalsMs: number[];
  feedback: TugOfWarSandboxFeedback;
  streak: number;
};

type TugOfWarSandboxConfig = {
  winThreshold: number;
  loseThreshold: number;
  beatIntervalMs: number;
  beatIntervalMinMs: number;
  beatIntervalMaxMs: number;
  firstBeatDelayMs: number;
  rhythmBeatMs: number;
  rhythmJitterMs: number;
  hitWindowEarlyMs: number;
  hitWindowLateMs: number;
  playerPull: number;
  missPenalty: number;
  waitPenalty: number;
  bossPressurePerSecond: number;
};

const DEFAULT_CONFIG: TugOfWarSandboxConfig = {
  winThreshold: 170,
  loseThreshold: -130,
  beatIntervalMs: 820,
  beatIntervalMinMs: 560,
  beatIntervalMaxMs: 1080,
  firstBeatDelayMs: 820,
  rhythmBeatMs: 560,
  rhythmJitterMs: 24,
  hitWindowEarlyMs: 150,
  hitWindowLateMs: 150,
  playerPull: 16,
  missPenalty: 29,
  waitPenalty: 18,
  bossPressurePerSecond: 3
};

const RHYTHM_PATTERNS: readonly (readonly number[])[] = [
  [1, 1, 0.5, 0.5, 1.5, 0.5, 1],
  [0.5, 0.5, 1, 1, 0.75, 0.75, 1.5],
  [1, 0.5, 0.5, 1.5, 1, 0.5, 0.5],
  [0.75, 0.75, 0.5, 1, 1.5, 0.5, 1],
  [1.5, 0.5, 1, 0.5, 0.5, 1, 1]
] as const;

export class TugOfWarSandboxGameplay {
  private readonly config: TugOfWarSandboxConfig;
  private phase: TugOfWarSandboxPhase = "playing";
  private tension = 0;
  private elapsedMs = 0;
  private nextBeatMs = 0;
  private currentBeatIntervalMs = 0;
  private currentBeatHit = false;
  private readonly rhythmQueueMs: number[] = [];
  private readonly upcomingBeatIntervalsMs: number[] = [];
  private feedback: TugOfWarSandboxFeedback = "ready";
  private streak = 0;

  constructor(config: Partial<TugOfWarSandboxConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.reset();
  }

  reset(): TugOfWarSandboxSnapshot {
    this.phase = "playing";
    this.tension = 0;
    this.elapsedMs = 0;
    this.upcomingBeatIntervalsMs.length = 0;
    this.rhythmQueueMs.length = 0;
    this.currentBeatIntervalMs = this.config.firstBeatDelayMs;
    this.nextBeatMs = this.config.firstBeatDelayMs;
    this.currentBeatHit = false;
    this.fillUpcomingBeatIntervals();
    this.feedback = "ready";
    this.streak = 0;
    return this.snapshot();
  }

  update(deltaMs: number): TugOfWarSandboxSnapshot {
    if (this.phase !== "playing") {
      return this.snapshot();
    }

    this.elapsedMs += Math.max(0, deltaMs);
    this.tension -= (this.config.bossPressurePerSecond * deltaMs) / 1000;

    if (this.elapsedMs > this.nextBeatMs + this.config.hitWindowLateMs) {
      if (!this.currentBeatHit) {
        this.tension -= this.config.waitPenalty;
        this.feedback = "wait";
        this.streak = 0;
      }
      this.currentBeatHit = false;
      this.scheduleNextBeat(this.feedback !== "wait");
    }

    this.resolvePhase();
    return this.snapshot();
  }

  pull(): TugOfWarSandboxSnapshot {
    if (this.phase !== "playing") {
      return this.snapshot();
    }

    const earlyDeltaMs = this.nextBeatMs - this.elapsedMs;
    const lateDeltaMs = this.elapsedMs - this.nextBeatMs;
    const isInsideHitWindow = earlyDeltaMs <= this.config.hitWindowEarlyMs && lateDeltaMs <= this.config.hitWindowLateMs;
    if (isInsideHitWindow && !this.currentBeatHit) {
      this.streak += 1;
      this.tension += this.config.playerPull + Math.min(this.streak, 3) * 2;
      this.currentBeatHit = true;
      this.feedback = "hit";
    } else {
      this.tension -= this.config.missPenalty;
      this.feedback = "miss";
      this.streak = 0;
    }

    this.resolvePhase();
    return this.snapshot();
  }

  snapshot(): TugOfWarSandboxSnapshot {
    const maxMagnitude = Math.max(this.config.winThreshold, Math.abs(this.config.loseThreshold));
    const beatProgress = 1 - (this.nextBeatMs - this.elapsedMs) / this.currentBeatIntervalMs;
    return {
      phase: this.phase,
      tension: this.tension,
      normalizedTension: Math.max(-1, Math.min(1, this.tension / maxMagnitude)),
      elapsedMs: this.elapsedMs,
      nextBeatMs: this.nextBeatMs,
      beatProgress: Math.max(0, beatProgress),
      currentBeatIntervalMs: this.currentBeatIntervalMs,
      currentBeatHit: this.currentBeatHit,
      upcomingBeatIntervalsMs: [...this.upcomingBeatIntervalsMs],
      feedback: this.feedback,
      streak: this.streak
    };
  }

  private scheduleNextBeat(resetFeedback = true): void {
    const previousBeatMs = this.nextBeatMs;
    this.currentBeatIntervalMs = this.upcomingBeatIntervalsMs.shift() ?? this.nextRhythmicInterval();
    this.upcomingBeatIntervalsMs.push(this.nextRhythmicInterval());
    this.nextBeatMs = previousBeatMs + this.currentBeatIntervalMs;
    this.currentBeatHit = false;
    if (resetFeedback) {
      this.feedback = "ready";
    }
  }

  private fillUpcomingBeatIntervals(): void {
    while (this.upcomingBeatIntervalsMs.length < 6) {
      this.upcomingBeatIntervalsMs.push(this.nextRhythmicInterval());
    }
  }

  private nextRhythmicInterval(): number {
    if (this.rhythmQueueMs.length === 0) {
      this.enqueueRhythmPhrase();
    }
    return this.rhythmQueueMs.shift() ?? this.config.beatIntervalMs;
  }

  private enqueueRhythmPhrase(): void {
    const pattern = RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)] ?? RHYTHM_PATTERNS[0];
    pattern.forEach((multiplier) => {
      const jitter = (Math.random() * 2 - 1) * this.config.rhythmJitterMs;
      const interval = this.config.rhythmBeatMs * multiplier + jitter;
      this.rhythmQueueMs.push(Math.round(Math.max(this.config.beatIntervalMinMs * 0.7, Math.min(this.config.beatIntervalMaxMs, interval))));
    });
  }

  private resolvePhase(): void {
    if (this.tension >= this.config.winThreshold) {
      this.tension = this.config.winThreshold;
      this.phase = "won";
      this.feedback = "win";
      return;
    }

    if (this.tension <= this.config.loseThreshold) {
      this.tension = this.config.loseThreshold;
      this.phase = "lost";
      this.feedback = "lose";
    }
  }
}
