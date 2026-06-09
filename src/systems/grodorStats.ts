export type GrodorStatKey =
  | "sortiesReussies"
  | "combatsGagnes"
  | "miniJeuxReussis"
  | "humiliations"
  | "degatsSubis"
  | "mortsRidicules"
  | "poGagnes"
  | "objetsRamasses"
  | "runsTotal"
  | "etagesVisites";

export type GrodorStats = Record<GrodorStatKey, number>;

export type GrodorScore = {
  gloire: number;
  souffrance: number;
  avidite: number;
  obstination: number;
  total: number;
};

const GRODOR_STATS_STORAGE_KEY = "grodor_stats";

const defaultStats: GrodorStats = {
  sortiesReussies: 0,
  combatsGagnes: 0,
  miniJeuxReussis: 0,
  humiliations: 0,
  degatsSubis: 0,
  mortsRidicules: 0,
  poGagnes: 0,
  objetsRamasses: 0,
  runsTotal: 0,
  etagesVisites: 0
};

let stats: GrodorStats = loadGrodorStats();
let currentRunStats: GrodorStats = cloneStats(defaultStats);

export function getGrodorStats(): GrodorStats {
  return cloneStats(stats);
}

export function getCurrentGrodorRunStats(): GrodorStats {
  return cloneStats(currentRunStats);
}

export function addGrodorStat(key: GrodorStatKey, amount = 1): GrodorStats {
  const nextAmount = Math.max(0, Math.trunc(amount));
  if (nextAmount <= 0) {
    return getGrodorStats();
  }

  currentRunStats = {
    ...currentRunStats,
    [key]: currentRunStats[key] + nextAmount
  };
  stats = {
    ...stats,
    [key]: stats[key] + nextAmount
  };
  saveGrodorStats(stats);

  return getGrodorStats();
}

export function calculateGrodorScore(sourceStats: GrodorStats = stats): GrodorScore {
  const gloire = sourceStats.sortiesReussies + sourceStats.combatsGagnes + sourceStats.miniJeuxReussis;
  const souffrance = sourceStats.humiliations + sourceStats.degatsSubis + sourceStats.mortsRidicules;
  const avidite = sourceStats.poGagnes + sourceStats.objetsRamasses;
  const obstination = sourceStats.runsTotal + sourceStats.etagesVisites;

  return {
    gloire,
    souffrance,
    avidite,
    obstination,
    total: gloire + souffrance + avidite + obstination
  };
}

export function calculateCurrentGrodorRunScore(): GrodorScore {
  return calculateGrodorScore(currentRunStats);
}

export function resetCurrentGrodorRunStats(): GrodorStats {
  currentRunStats = cloneStats(defaultStats);
  return getCurrentGrodorRunStats();
}

export function resetGrodorStatsDebug(): GrodorStats {
  stats = cloneStats(defaultStats);
  currentRunStats = cloneStats(defaultStats);
  saveGrodorStats(stats);
  return getGrodorStats();
}

function loadGrodorStats(): GrodorStats {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return cloneStats(defaultStats);
    }

    const storedValue = window.localStorage.getItem(GRODOR_STATS_STORAGE_KEY);
    if (!storedValue) {
      return cloneStats(defaultStats);
    }

    const parsedValue = JSON.parse(storedValue) as Partial<Record<GrodorStatKey, unknown>>;
    const loadedStats = cloneStats(defaultStats);
    (Object.keys(defaultStats) as GrodorStatKey[]).forEach((key) => {
      const value = Number(parsedValue[key]);
      loadedStats[key] = Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
    });

    saveGrodorStats(loadedStats);
    return loadedStats;
  } catch {
    saveGrodorStats(defaultStats);
    return cloneStats(defaultStats);
  }
}

function saveGrodorStats(value: GrodorStats): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(GRODOR_STATS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage can be blocked; keep stats in memory for this session.
  }
}

function cloneStats(source: GrodorStats): GrodorStats {
  return { ...source };
}
