const TOTAL_FLOORS = 20;
const START_LIFE = 3;
const MAX_LIFE = 6;
const BANK_KEY = "barbare_portes_binouse_bank";
const UPGRADES_KEY = "barbare_portes_binouse_upgrades";
const STATS_KEY = "barbare_portes_binouse_stats";
const CELL_TUTORIAL_KEY = "barbare_portes_binouse_cell_tutorial_seen";
const COIN_FLIP_ASSET_PATH = "assets/Mini-jeu/pile-ou-face";
const COIN_FLIP_FRAME_MS = 360;
const SLOT_MACHINE_ASSET_PATH = "assets/Mini-jeu/machine-a-sous";
const SLOT_MACHINE_SYMBOLS = ["Grodor", "Po", "Crane", "Bourse-vide"];
const SLOT_MACHINE_FRAME_MS = 125;
const BONNETEAU_ASSET_PATH = "assets/Mini-jeu/Bonneteau";
const BONNETEAU_SYMBOLS = ["grodor", "po", "crane", "bourse"];
const CHEST_DODGE_ASSET_PATH = "assets/Mini-jeu/coffre-esquive";
const CHEST_DODGE_ROUNDS = 3;
const CHEST_DODGE_WINDOW_MS = 820;
const CHEST_DODGE_BURST_MS = 190;
const ARM_WRESTLE_ASSET_PATH = "assets/Mini-jeu/bras-de-fer";
const ARM_WRESTLE_DURATION_MS = 5000;
const ARM_WRESTLE_TICK_MS = 120;
const ARM_WRESTLE_PRESS_MS = 170;
const ARM_WRESTLE_CONTINUE_DELAY_MS = 850;
const ARM_WRESTLE_DIFFICULTIES = [
  { key: "facile", resistance: 1.25, tapPower: 5.4 },
  { key: "moyen", resistance: 1.8, tapPower: 4.8 },
  { key: "difficile", resistance: 2.45, tapPower: 4.2 },
];
const ARM_WRESTLE_FRAMES = [
  "bdf-centre.webp",
  "bdf-gagne-1.webp",
  "bdf-gagne-2.webp",
  "bdf-gagne.webp",
  "bdf-perd-1.webp",
  "bdf-perd-2.webp",
  "bdf-perdu.webp",
];
const SUPABASE_CONFIG = window.HODOR_SUPABASE || {};
const SUPABASE_URL = SUPABASE_CONFIG.url || "";
const SUPABASE_KEY = SUPABASE_CONFIG.publishableKey || SUPABASE_CONFIG.anonKey || "";
const AUTH_REDIRECT_URL = window.location.protocol.startsWith("http")
  ? `${window.location.origin}${window.location.pathname}`
  : "https://donjondegrodor.fr/";
const supabaseClient = window.supabase && SUPABASE_URL && SUPABASE_KEY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
const LOGIN_ALIAS_PATTERN = /^[a-z0-9._-]{2,32}$/;
const PASSWORD_SPECIAL_PATTERN = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;
const SUPABASE_REQUEST_TIMEOUT_MS = 15000;

const cloudState = {
  user: null,
  profile: null,
  loaded: false,
  applying: false,
  saveTimer: null,
  runSaveTimer: null,
  transferResumeTimer: null,
  transferMessage: "",
};

let fallbackBankGold = 0;
let fallbackUpgrades = {};
const DEFAULT_STATS = {
  losses: 0,
  wins: 0,
  goldBankedTotal: 0,
  sortiesReussies: 0,
  combatsGagnes: 0,
  miniJeuxReussis: 0,
  humiliations: 0,
  degatsSubis: 0,
  mortsRidicules: 0,
  poGagnes: 0,
  objetsRamasses: 0,
  runsTotal: 0,
  etagesVisites: 0,
};
const DETAILED_STATS_KEYS = [
  "sortiesReussies",
  "combatsGagnes",
  "miniJeuxReussis",
  "humiliations",
  "degatsSubis",
  "mortsRidicules",
  "poGagnes",
  "objetsRamasses",
  "runsTotal",
  "etagesVisites",
];

let fallbackStats = { ...DEFAULT_STATS };

const state = {
  screen: "cell",
  floor: TOTAL_FLOORS,
  totalFloors: TOTAL_FLOORS,
  life: START_LIFE,
  maxLife: START_LIFE,
  carriedGold: 0,
  bankGold: loadBankGold(),
  inventory: [],
  runEnded: false,
  combat: null,
  combatHp: 0,
  combatArenaKey: "",
  godMode: false,
  upgrades: loadUpgrades(),
  doorHints: [],
  floorShift: 0,
  activePact: null,
  storyTone: "neutral",
  eventToneOverride: null,
  villageLocation: "Village",
  stats: loadStats(),
  runLosses: 0,
  showWinBanner: false,
  lossRecorded: false,
  winRecorded: false,
  koBannerText: "",
  winBannerText: "",
  inputLocked: false,
  miniGame: null,
  miniGamesEncountered: 0,
  hodorPose: "idle",
  combatStrike: "",
  combatImpact: "",
  pendingCoinGain: 0,
  pendingCoinLoss: 0,
  pendingPurseLoss: false,
  renderedLife: null,
  renderedCombatHp: null,
};

let shopPanelOpen = false;
let shopPanelMode = "upgrades";
let selectedSaleItems = new Set();
let statsPanelOpen = false;
let statsPanelView = "stats";
let activeRankingCriterion = "gold"; // "gold", "wins", "losses"
let cachedRankingData = null;
let rankingLoading = false;
let villageActionTimer = null;
let villageReturnTimer = null;
let rewardHideTimer = null;
let rewardHideToken = 0;

let audioCtx = null;
let lastHodorLife = 0;
let lastPlayedBgmScreen = "";
let currentBgm = null;

let musicVolume = parseInt(localStorage.getItem("grodor_music_volume") ?? "50", 10);
let sfxVolume = parseInt(localStorage.getItem("grodor_sfx_volume") ?? "50", 10);

function getBgmMaxVolume() {
  return (musicVolume / 100) * 0.35;
}

const elementCache = new Map();
const $ = (id) => {
  if (!elementCache.has(id)) {
    elementCache.set(id, document.getElementById(id));
  }
  return elementCache.get(id);
};

const inventoryIconPaths = {
  "Boulet au Pied": "assets/Hodor V0.1/Stuff/Boulet/inv-Boulet.png",
  "Caillou Affectif": "assets/Hodor V0.1/Stuff/Cailloux/inv-cailloux.png",
  "Casque Trop Petit": "assets/Hodor V0.1/Stuff/Casque/inv-casque.png",
  "Cape Trop Longue": "assets/Hodor V0.1/Stuff/Cape/inv-cape-casse.png",
  "Chaussette Porte-Bonheur": "assets/Hodor V0.1/Stuff/Inventaire/inv-chaussette-porte-bonheur.png",
  "Gants Collants": "assets/Hodor V0.1/Stuff/Gant/inv-gant-point-interieur.png",
  "Hache Emoussee": "assets/Hodor V0.1/Stuff/Hache/inv-hache.png",
  "Medaillon du Presque-Heros": "assets/Hodor V0.1/Stuff/Medaillon du Presque-Heros/inv-medaillon.png",
  "Sandales de Panique": "assets/Hodor V0.1/Stuff/Sandales de Panique/inv-sandale.png",
  "Slip de Guerre": "assets/Hodor V0.1/Stuff/Slip de guerre/inv-slip-de-guerre.png",
};

const COMBAT_ARENAS = [
  { key: "arene-1", label: "Arene 1", image: "assets/Arene/arene-1.webp" },
  { key: "arene-2", label: "Arene 2", image: "assets/Arene/arene-2.webp" },
  { key: "arene-3", label: "Arene 3", image: "assets/Arene/arene-3.webp" },
];
const DEFAULT_COMBAT_ARENA_KEY = COMBAT_ARENAS[0].key;

const HODOR_BASE_PATH = "assets/Hodor V0.1";
const HODOR_POSE_FILES = {
  idle: "Idle",
  marche: "marche",
  fuite: "fuite",
  folie: "folie",
  question: "question",
  degats: "degats",
  "attaque-1": "attaque-1",
  "attaque-2": "attaque-2",
  "attaque-3": "attaque-3",
  victoire: "victoire",
  ko: "ko",
  mort: "mort",
};
const HODOR_WALK_FRAME_MS = 170;
const VILLAGE_ACTION_DELAY_MS = 650;
const VILLAGE_RETURN_DELAY_MS = 900;
const VILLAGE_SERVICE_RETURN_DELAY_MS = 4000;
const CELL_OPEN_DELAY_MS = 650;
const DUNGEON_EFFECT_VISIBLE_MS = 4500;
const START_INTRO_EXIT_MS = 2200;
const HODOR_WALK_FRAME_PATHS = [
  `${HODOR_BASE_PATH}/Corps/Marche/marche-1.png`,
  `${HODOR_BASE_PATH}/Corps/Marche/marche-2.png`,
  `${HODOR_BASE_PATH}/Corps/Marche/marche-3.png`,
  `${HODOR_BASE_PATH}/Corps/Marche/marche-4.png`,
];
const HODOR_STUFF_LAYERS = [
  { item: "Slip de Guerre", folder: "Slip de guerre", suffix: "slip-de-guerre" },
  { item: "Sandales de Panique", folder: "Sandales de Panique", suffix: "sandale" },
  { item: "Boulet au Pied", folder: "Boulet", suffix: "boulet" },
  { item: "Caillou Affectif", folder: "Cailloux", suffix: "cailloux" },
  { item: "Medaillon du Presque-Heros", folder: "Medaillon du Presque-Heros", suffix: "medaillon" },
  { item: "Casque Trop Petit", folder: "Casque", suffix: "casque" },
  { item: "Gants Collants", folder: "Gant", suffix: "gant" },
  { item: "Hache Emoussee", folder: "Hache", suffix: "hache" },
  { item: "Cape Trop Longue", folder: "Cape", suffix: "cape" },
];
const HODOR_WALK_STUFF_FRAME_PATHS = {
  "Slip de Guerre": [
    `${HODOR_BASE_PATH}/Stuff/Slip de guerre/Marche-Slip-de-guerre/marche-slip-de-guerre-1.png`,
    `${HODOR_BASE_PATH}/Stuff/Slip de guerre/Marche-Slip-de-guerre/marche-slip-de-guerre-2.png`,
    `${HODOR_BASE_PATH}/Stuff/Slip de guerre/Marche-Slip-de-guerre/marche-slip-de-guerre-3.png`,
    `${HODOR_BASE_PATH}/Stuff/Slip de guerre/Marche-Slip-de-guerre/marche-slip-de-guerre-4.png`,
  ],
  "Sandales de Panique": [
    `${HODOR_BASE_PATH}/Stuff/Sandales de Panique/Marche-sandale/marche-sandale-1.png`,
    `${HODOR_BASE_PATH}/Stuff/Sandales de Panique/Marche-sandale/marche-sandale-2.png`,
    `${HODOR_BASE_PATH}/Stuff/Sandales de Panique/Marche-sandale/marche-sandale-3.png`,
    `${HODOR_BASE_PATH}/Stuff/Sandales de Panique/Marche-sandale/marche-sandale-4.png`,
  ],
  "Hache Emoussee": [
    `${HODOR_BASE_PATH}/Stuff/Hache/Marche-Hache/marche-hache-1.png`,
    `${HODOR_BASE_PATH}/Stuff/Hache/Marche-Hache/marche-hache-2.png`,
    `${HODOR_BASE_PATH}/Stuff/Hache/Marche-Hache/marche-hache-3.png`,
    `${HODOR_BASE_PATH}/Stuff/Hache/Marche-Hache/marche-hache-4.png`,
  ],
  "Boulet au Pied": [
    `${HODOR_BASE_PATH}/Stuff/Boulet/Marche-Boulet/marche-boulet-1.png`,
    `${HODOR_BASE_PATH}/Stuff/Boulet/Marche-Boulet/marche-boulet-2.png`,
    `${HODOR_BASE_PATH}/Stuff/Boulet/Marche-Boulet/marche-boulet-3.png`,
    `${HODOR_BASE_PATH}/Stuff/Boulet/Marche-Boulet/marche-boulet-4.png`,
  ],
  "Gants Collants": [
    `${HODOR_BASE_PATH}/Stuff/Gant/marche-gant/marche-gant-1.png`,
    `${HODOR_BASE_PATH}/Stuff/Gant/marche-gant/marche-gant-2.png`,
    `${HODOR_BASE_PATH}/Stuff/Gant/marche-gant/marche-gant-3.png`,
    `${HODOR_BASE_PATH}/Stuff/Gant/marche-gant/marche-gant-4.png`,
  ],
};
let hodorWalkAnimationTimer = null;
let dungeonEffectPoseTimer = null;
let cellOpenTimer = null;
let coinFlipAnimationTimers = [];
let slotMachineAnimationTimers = [];
let chestDodgeTimer = null;
let chestDodgeBurstTimer = null;
let armWrestleInterval = null;
let armWrestlePressTimer = null;
let armWrestleResultTimer = null;
let startIntroDone = false;

document.addEventListener("click", (event) => {
  const miniGameAction = event.target.closest("[data-mini-game-action]");
  if (miniGameAction) {
    resolveMiniGame(miniGameAction.dataset.miniGameAction);
    return;
  }

  const deadHodor = event.target.closest(".scene.is-dead .hodor-sprite");
  if (deadHodor) {
    returnToCellFromDeath();
    return;
  }

  const door = event.target.closest(".door");
  if (door) {
    chooseDoor(door);
    return;
  }

  const strike = event.target.closest("[data-strike]");
  if (strike) {
    resolveCombat(strike.dataset.strike);
    return;
  }
});

document.addEventListener("click", dismissWinBannerOnFirstClick, true);

// Déclencheur sonore global pour tous les boutons du jeu (couvre statiques & dynamiques)
document.addEventListener("click", (event) => {
  const button = event.target.closest("button") || event.target.closest("[role='button']") || event.target.closest(".restart-card") || event.target.closest(".combat-choice") || event.target.closest(".building") || event.target.closest(".door");
  if (button) {
    playClickSound();
  }
}, true);

let startIntroActivated = false;
let logoChimePlayed = false;
let introAudioStarted = false;

function tryAutoplayIntroAudio() {
  // Discard page-load autoplay to prevent immediate hides from autoplay policy rejections
}

const startIntro = $("start-intro");
if (startIntro) {
  startIntro.addEventListener("click", () => {
    introAudioStarted = true;
    startIntroActivated = true;
    finishStartIntro();
  });
}






document.querySelectorAll(".door").forEach((door) => {
  door.addEventListener("pointerenter", previewDungeonDoorOpen);
  door.addEventListener("pointerleave", stopDungeonDoorPreview);
  door.addEventListener("mouseover", previewDungeonDoorOpen);
  door.addEventListener("mouseout", stopDungeonDoorPreview);
});

addClick("bank-building", () => delayVillageAction("bank", depositGold));
addClick("tavern-building", () => delayVillageAction("tavern", goToCellFromTavern));
addClick("shop-building", () => delayVillageAction("shop", openShop));
addClick("sell-building", () => delayVillageAction("sell", openSellPanel));
addClick("close-shop", closeShop);
addClick("stats-building", () => delayVillageAction("stats", openStatsPanel));
addClick("close-stats", closeStatsPanel);
addClick("stats-tab-stats", () => setStatsPanelView("stats"));
addClick("stats-tab-ranking", () => setStatsPanelView("ranking"));
addClick("village-modal-backdrop", closeVillagePanels);
addClick("restart-action", openCellDoor);
addClick("reset-save", resetBank);
addClick("debug-toggle", toggleDebug);
addClick("god-mode", toggleGodMode);
addClick("debug-add-bank", debugAddBank);
addClick("debug-go-village", debugGoVillage);
addClick("debug-clear-stuff", debugClearStuff);
addClick("inventory-toggle", toggleInventory);
addClick("inventory-close", closeInventory);
addClick("account-toggle", toggleAccountPopover);
addClick("account-close", closeAccountPopover);
addClick("account-open-login", openAccountPanel);
addClick("account-panel-close", closeAccountPanel);
addClick("account-settings-logout", signOutAccount);
addClick("auth-login", signInAccount);
addClick("auth-signup", openSignupPanel);
addClick("auth-register", signUpAccount);
addClick("auth-signup-close", closeSignupPanel);
addClick("auth-logout", signOutAccount);
addClick("auth-visitor", closeAccountPanel);
addEnterSubmit("auth-login-id", signInAccount);
addEnterSubmit("auth-password", signInAccount);
addEnterSubmit("signup-alias", signUpAccount);
addEnterSubmit("signup-email", signUpAccount);
addEnterSubmit("signup-password", signUpAccount);

const purseHud = document.querySelector(".stat-purse");
if (purseHud) {
  purseHud.addEventListener("click", (event) => {
    event.stopPropagation();
    purseHud.classList.toggle("is-open");
  });
}

document.querySelectorAll("[data-debug-combat]").forEach((button) => {
  button.addEventListener("click", () => debugStartCombat(button.dataset.debugCombat));
});

document.querySelectorAll("[data-debug-stuff]").forEach((button) => {
  button.addEventListener("click", () => debugAddStuff(button.dataset.debugStuff));
});

renderDebugEvents();
initAudioSettings();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeInventory();
    closeAccountPopover();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".stat-purse")) {
    document.querySelector(".stat-purse")?.classList.remove("is-open");
  }
});

document.addEventListener("click", (event) => {
  const popover = $("inventory-popover");
  if (!popover || popover.hidden) return;
  if (event.target.closest("#inventory-popover .inventory-card") || event.target.closest("#inventory-toggle")) return;
  closeInventory();
});

document.addEventListener("click", (event) => {
  const popover = $("account-popover");
  if (!popover || popover.hidden) return;
  if (event.target.closest("#account-popover .account-card") || event.target.closest("#account-toggle")) return;
  closeAccountPopover();
});

setupCloudAuth();
render();
initStartIntro();

function loadBankGold() {
  try {
    return Number(localStorage.getItem(BANK_KEY) || 0);
  } catch {
    return fallbackBankGold;
  }
}

function saveBankGold(value) {
  fallbackBankGold = value;
  try {
    localStorage.setItem(BANK_KEY, String(value));
  } catch {
    // La sauvegarde locale peut etre indisponible.
  }
  queueCloudSave();
}

function loadUpgrades() {
  try {
    return JSON.parse(localStorage.getItem(UPGRADES_KEY) || "{}");
  } catch {
    return fallbackUpgrades;
  }
}

function saveUpgrades() {
  fallbackUpgrades = { ...state.upgrades };
  try {
    localStorage.setItem(UPGRADES_KEY, JSON.stringify(state.upgrades));
  } catch {
    // La sauvegarde locale peut etre indisponible.
  }
  queueCloudSave();
}

function loadStats() {
  try {
    return normalizeStats(JSON.parse(localStorage.getItem(STATS_KEY) || "{}"));
  } catch {
    return normalizeStats(fallbackStats);
  }
}

function saveStats() {
  state.stats = normalizeStats(state.stats);
  fallbackStats = { ...state.stats };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(state.stats));
  } catch {
    // La sauvegarde locale peut etre indisponible.
  }
  queueCloudSave();
}

function normalizeStats(stats = {}) {
  const normalized = { ...DEFAULT_STATS, ...(stats || {}) };
  Object.keys(DEFAULT_STATS).forEach((key) => {
    normalized[key] = Math.max(0, Math.floor(Number(normalized[key] || 0)));
  });

  normalized.wins = Math.max(normalized.wins, normalized.sortiesReussies);
  normalized.losses = Math.max(normalized.losses, normalized.humiliations);
  normalized.sortiesReussies = Math.max(normalized.sortiesReussies, normalized.wins);
  normalized.humiliations = Math.max(normalized.humiliations, normalized.losses);
  normalized.poGagnes = Math.max(normalized.poGagnes, normalized.goldBankedTotal);
  return normalized;
}

function addStat(key, amount = 1) {
  state.stats = normalizeStats(state.stats);
  state.stats[key] = Math.max(0, Math.floor(Number(state.stats[key] || 0) + amount));
}

function detailedStatsPayload(stats = state.stats) {
  const normalized = normalizeStats(stats);
  return DETAILED_STATS_KEYS.reduce((payload, key) => {
    payload[key] = normalized[key];
    return payload;
  }, {});
}

function hodorianStats() {
  const stats = normalizeStats(state.stats);
  const gloire = stats.sortiesReussies + stats.combatsGagnes + stats.miniJeuxReussis;
  const souffrance = stats.humiliations + stats.degatsSubis + stats.mortsRidicules;
  const avidite = stats.poGagnes + stats.objetsRamasses;
  const obstination = stats.runsTotal + stats.etagesVisites;
  const scoreGrodorienTotal = gloire + souffrance + avidite + obstination;
  return {
    ...stats,
    gloire,
    souffrance,
    avidite,
    obstination,
    scoreGrodorienTotal,
    scoreHodorienTotal: scoreGrodorienTotal,
  };
}

function toggleAccountPopover() {
  const popover = $("account-popover");
  if (!popover) return;
  popover.hidden = !popover.hidden;
  $("account-toggle")?.setAttribute("aria-expanded", String(!popover.hidden));
}

function closeAccountPopover() {
  const popover = $("account-popover");
  if (!popover) return;
  popover.hidden = true;
  $("account-toggle")?.setAttribute("aria-expanded", "false");
}

function openAccountPanel() {
  const panel = $("account-panel");
  if (!panel) return;
  panel.hidden = false;
  closeAccountPopover();
  closeInventory();
  render();
}

function closeAccountPanel() {
  const panel = $("account-panel");
  if (!panel) return;
  const wasOpen = !panel.hidden;
  window.clearTimeout(cloudState.transferResumeTimer);
  panel.hidden = true;
  closeSignupPanel();
  if (wasOpen) render();
}

function openSignupPanel() {
  const overlay = $("account-signup-overlay");
  if (!overlay) return;
  window.clearTimeout(cloudState.transferResumeTimer);
  clearSignupFields();
  setSignupStatus("Création de compte", "neutral");
  overlay.hidden = false;
  $("signup-alias")?.focus();
}

function closeSignupPanel() {
  const overlay = $("account-signup-overlay");
  if (overlay) overlay.hidden = true;
}

function clearSignupFields() {
  ["signup-alias", "signup-email", "signup-password"].forEach((id) => {
    const input = $(id);
    if (input) input.value = "";
  });
}

function isAccountPanelOpen() {
  const panel = $("account-panel");
  return Boolean(panel && !panel.hidden);
}

function initStartIntro() {
  const intro = $("start-intro");
  if (!intro) return;

  if (shouldBypassStartIntro()) {
    finishStartIntro({ instant: true, revealCell: false });
    return;
  }

  intro.hidden = false;
  tryAutoplayIntroAudio();
}

function shouldBypassStartIntro() {
  return state.screen === "dungeon" || state.screen === "combat" || hasActiveRunToSave();
}

function finishStartIntro(options = {}) {
  const intro = $("start-intro");
  if (!intro || startIntroDone) return;

  startIntroDone = true;

  const revealCell = options.revealCell !== false && !shouldBypassStartIntro();
  if (revealCell) {
    closeAccountPanel();
  }

  if (options.instant) {
    intro.hidden = true;
    return;
  }

  playLogoIntroSound(
    // onRumbleStart
    () => {
      if (intro) {
        intro.classList.add("is-leaving");
      }
    },
    // onEnded
    () => {
      if (intro) {
        intro.hidden = true;
        intro.classList.remove("is-leaving");
      }
      const targetBgm = state.screen || "cell";
      lastPlayedBgmScreen = targetBgm;
      playBgm(targetBgm);
    }
  );
}

function authMessage(message) {
  const text = String(message || "");
  const lower = text.toLowerCase();
  if (lower.includes("email not confirmed")) {
    return "Email non confirmé. Va cliquer sur le lien dans ta boîte mail. Regarde aussi dans les spams: Grodor y range souvent les trucs importants.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Pseudo, email ou mot de passe incorrect. Grodor a probablement tapé avec son front. Si tu viens de créer le compte, fouille les spams pour confirmer l'email.";
  }
  if (lower.includes("password should be")) {
    return passwordPolicyMessage();
  }
  if (lower.includes("weak password")) {
    return passwordPolicyMessage();
  }
  if (lower.includes("user already registered")) {
    return "Ce compte existe déjà. Essaie Connexion.";
  }
  return text || "Erreur inconnue. Le donjon nie toute responsabilité.";
}

function setAccountStatus(message, tone = "neutral") {
  const status = $("account-status");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function setAccountHelp(message) {
  const help = $("account-help");
  if (help) help.textContent = message;
}

function setSignupStatus(message, tone = "neutral") {
  const status = $("signup-status");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function updateAccountUi() {
  const connected = Boolean(cloudState.user);
  const email = cloudState.user?.email || "";
  const accountName = cloudState.profile?.alias || cloudState.profile?.display_name || email || "Visiteur";
  $("auth-login")?.toggleAttribute("hidden", connected);
  $("auth-signup")?.toggleAttribute("hidden", connected);
  $("auth-visitor")?.toggleAttribute("hidden", connected);
  $("auth-logout")?.toggleAttribute("hidden", !connected);
  $("account-open-login")?.toggleAttribute("hidden", connected);
  $("account-settings-logout")?.toggleAttribute("hidden", !connected);
  if ($("account-line")) {
    $("account-line").textContent = connected ? `Connecté : ${accountName}` : "Connecté : Visiteur";
  }
  if (connected) {
    setAccountStatus(`Connecté : ${accountName}`, cloudState.profile?.role === "admin" ? "admin" : "good");
    setAccountHelp(cloudState.profile?.role === "admin"
      ? "Compte admin : sauvegarde cloud + menu debug."
      : "Compte joueur : sauvegarde cloud active.");
  } else if (supabaseClient) {
    setAccountStatus("Non connecté", "neutral");
    setAccountHelp("Connecte-toi avec ton pseudo ou ton email pour retrouver banque, améliorations et statistiques.");
  } else {
    setAccountStatus("Sauvegarde locale", "neutral");
    setAccountHelp("Supabase n'est pas disponible, le jeu reste en sauvegarde locale.");
  }
  updateDebugAccess();
}

function updateDebugAccess() {
  const debugMenu = document.querySelector(".debug-menu");
  const isAdmin = cloudState.profile?.role === "admin";
  if (!debugMenu) return;
  debugMenu.hidden = !isAdmin;
  if (!isAdmin) {
    $("debug-panel").hidden = true;
    $("debug-toggle").setAttribute("aria-expanded", "false");
  }
}

async function setupCloudAuth() {
  updateAccountUi();
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setAccountStatus("Compte indisponible", "bad");
    setAccountHelp(authMessage(error.message));
    return;
  }

  if (data.session?.user) {
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) {
      await clearInvalidStoredSession();
      return;
    }
    await applySession({ ...data.session, user: userData.user });
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    applySession(session);
  });
}

async function clearInvalidStoredSession() {
  try {
    await supabaseClient.auth.signOut({ scope: "local" });
  } catch {
    try {
      await supabaseClient.auth.signOut();
    } catch {
      // La session locale peut deja etre invalide cote Supabase.
    }
  }
  cloudState.user = null;
  cloudState.profile = null;
  cloudState.loaded = false;
  resetGuestProgress();
  updateAccountUi();
  setAccountStatus("Session supprimée", "bad");
  setAccountHelp("Ce compte n'existe plus côté Supabase. Les champs de création ont été vidés.");
  clearSignupFields();
  render();
}

async function applySession(session) {
  const nextUser = session?.user || null;
  const sameLoadedUser = Boolean(nextUser && cloudState.user?.id === nextUser.id && cloudState.loaded);
  cloudState.user = nextUser;
  if (sameLoadedUser) {
    updateAccountUi();
    return;
  }

  cloudState.profile = null;
  cloudState.loaded = false;
  if (!cloudState.user) {
    updateAccountUi();
    return;
  }

  setAccountStatus("Chargement du compte...", "neutral");
  await loadCloudProfileAndSave();
  updateAccountUi();
  const transferMessage = cloudState.transferMessage;
  if (transferMessage) {
    setAccountStatus("Transfert terminé", "good");
    setAccountHelp(transferMessage);
    cloudState.transferMessage = "";
  }
  render();
  if (transferMessage) {
    closeSignupPanel();
    scheduleTransferResume();
  } else {
    closeAccountPanel();
    closeAccountPopover();
  }
}

function scheduleTransferResume() {
  window.clearTimeout(cloudState.transferResumeTimer);
  cloudState.transferResumeTimer = window.setTimeout(() => {
    closeAccountPanel();
    closeAccountPopover();
    render();
  }, 3000);
}

function normalizeLoginAlias(value) {
  return String(value || "").trim().toLowerCase();
}

function loginIdentifier() {
  return $("auth-login-id")?.value.trim() || "";
}

function passwordValue(inputId = "auth-password") {
  const password = $(inputId)?.value;
  if (!password) {
    setAccountStatus("Mot de passe requis", "bad");
    setAccountHelp("Ajoute ton mot de passe, ou clique sur Visiteur pour jouer sans cloud.");
    return "";
  }
  return password;
}

function passwordPolicyMessage() {
  return "Choisis un mot de passe d'au moins 8 caractères, avec des minuscules, des majuscules, un chiffre et un symbole.";
}

function validateNewPassword(password) {
  return password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && PASSWORD_SPECIAL_PATTERN.test(password);
}

async function resolveLoginEmail(identifier, options = {}) {
  const quiet = Boolean(options.quiet);
  const loginId = String(identifier || "").trim();
  if (!loginId) {
    if (!quiet) {
      setAccountStatus("Pseudo ou email requis", "bad");
      setAccountHelp("Entre ton pseudo, ton email, ou clique sur Visiteur pour jouer sans cloud.");
    }
    return "";
  }
  if (loginId.includes("@")) {
    return loginId.toLowerCase();
  }

  const alias = normalizeLoginAlias(loginId);
  if (!LOGIN_ALIAS_PATTERN.test(alias)) {
    if (!quiet) {
      setAccountStatus("Pseudo invalide", "bad");
      setAccountHelp("Utilise 2 à 32 caractères : lettres, chiffres, point, tiret ou underscore.");
    }
    return "";
  }

  let data = null;
  let error = null;
  try {
    ({ data, error } = await withTimeout(
      supabaseClient.rpc("resolve_login_alias", { p_alias: alias }),
      SUPABASE_REQUEST_TIMEOUT_MS,
      "La recherche du pseudo prend trop de temps."
    ));
  } catch (timeoutError) {
    if (!quiet) {
      setAccountStatus("Connexion trop lente", "bad");
      setAccountHelp(`${timeoutError.message} Ferme puis rouvre la PWA si elle vient d'être mise à jour.`);
    }
    return "";
  }
  if (error || !data) {
    if (!quiet) {
      setAccountStatus("Pseudo introuvable", "bad");
      setAccountHelp("Essaie ton email si ton compte a été créé avant les pseudos.");
    }
    return "";
  }

  return String(data).trim().toLowerCase();
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId = 0;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout])
    .finally(() => window.clearTimeout(timeoutId));
}

function signUpCredentials() {
  const alias = normalizeLoginAlias($("signup-alias")?.value);
  const email = $("signup-email")?.value.trim().toLowerCase();
  const password = $("signup-password")?.value || "";
  if (!alias || !email || !password) {
    setSignupStatus("Pseudo, mail et mot de passe requis.", "bad");
    return null;
  }
  if (!LOGIN_ALIAS_PATTERN.test(alias)) {
    setSignupStatus("Pseudo invalide : 2 à 32 caractères, lettres, chiffres, point, tiret ou underscore.", "bad");
    return null;
  }
  if (!email.includes("@")) {
    setSignupStatus("Mail invalide.", "bad");
    return null;
  }
  if (!validateNewPassword(password)) {
    setSignupStatus(passwordPolicyMessage(), "bad");
    return null;
  }
  return { alias, email, password };
}

async function signInAccount() {
  if (!supabaseClient) {
    setAccountStatus("Supabase non configure", "bad");
    return;
  }
  const password = passwordValue();
  if (!password) return;
  setAccountStatus("Connexion...", "neutral");
  const email = await resolveLoginEmail(loginIdentifier());
  if (!email) return;
  let error = null;
  try {
    ({ error } = await withTimeout(
      supabaseClient.auth.signInWithPassword({ email, password }),
      SUPABASE_REQUEST_TIMEOUT_MS,
      "La connexion Supabase ne répond pas."
    ));
  } catch (timeoutError) {
    setAccountStatus("Connexion trop lente", "bad");
    setAccountHelp(`${timeoutError.message} Ferme puis rouvre la PWA, ou vérifie le réseau.`);
    return;
  }
  if (error) {
    setAccountStatus("Connexion refusee", "bad");
    setAccountHelp(authMessage(error.message));
  }
}

async function signUpAccount() {
  if (!supabaseClient) {
    setSignupStatus("Supabase non configuré.", "bad");
    return;
  }
  const credentials = signUpCredentials();
  if (!credentials) return;
  setSignupStatus("Création du compte...", "neutral");
  const existingEmail = await resolveLoginEmail(credentials.alias, { quiet: true });
  if (existingEmail) {
    setSignupStatus("Ce pseudo est déjà pris.", "bad");
    return;
  }
  const { data: emailExists, error: emailCheckError } = await supabaseClient.rpc("login_email_exists", { p_email: credentials.email });
  if (emailCheckError) {
    setSignupStatus("Impossible de vérifier ce mail pour le moment.", "bad");
    return;
  }
  if (emailExists) {
    setSignupStatus("Ce mail possède déjà un compte. Utilise Connexion.", "bad");
    return;
  }
  const { data, error } = await supabaseClient.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: AUTH_REDIRECT_URL,
      data: {
        display_name: credentials.alias,
        login_alias: credentials.alias,
      },
    },
  });
  if (error) {
    setSignupStatus(authMessage(error.message), "bad");
    return;
  }
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    setSignupStatus("Ce mail possède déjà un compte. Utilise Connexion.", "bad");
    return;
  }
  if (!data.session) {
    setSignupStatus("Compte créé. Vérifie ta boîte mail et tes spams pour confirmer.", "good");
    setAccountHelp("Après confirmation, reconnecte-toi ici : ta progression visiteur restera transférable depuis ce navigateur.");
    clearSignupFields();
  } else {
    cloudState.transferMessage = "Compte créé : progression visiteur transférée.";
    setSignupStatus("Compte créé. Progression visiteur transférée.", "good");
    clearSignupFields();
  }
}

async function signOutAccount() {
  if (!supabaseClient) return;
  setAccountStatus("Déconnexion...", "neutral");
  await saveActiveRunNow({ force: true });
  await supabaseClient.auth.signOut();
  cloudState.user = null;
  cloudState.profile = null;
  cloudState.loaded = false;
  resetGuestProgress();
  updateAccountUi();
  closeAccountPopover();
  openAccountPanel();
  setAccountStatus("Deconnecte", "neutral");
  setAccountHelp("Reconnecte-toi, ou reste visiteur comme un heros fiscalement discret.");
  render();
}

async function loadCloudProfileAndSave() {
  if (!supabaseClient || !cloudState.user) return;
  cloudState.applying = true;

  try {
    const [{ data: profile, error: profileError }, { data: alias, error: aliasError }, { data: save, error: saveError }] = await Promise.all([
      supabaseClient.from("profiles").select("role, display_name").eq("user_id", cloudState.user.id).maybeSingle(),
      supabaseClient.rpc("current_login_alias"),
      supabaseClient.from("player_saves").select("bank_gold,total_gold,wins,losses,upgrades,detailed_stats,active_run").eq("user_id", cloudState.user.id).maybeSingle(),
    ]);

    if (profileError) {
      setAccountStatus("Profil indisponible", "bad");
      setAccountHelp(authMessage(profileError.message));
    }

    if (aliasError) {
      setAccountHelp(authMessage(aliasError.message));
    }

    cloudState.profile = { ...(profile || { role: "player" }), alias: alias || "" };

    if (saveError) {
      setAccountStatus("Sauvegarde indisponible", "bad");
      setAccountHelp(authMessage(saveError.message));
      return;
    }

    const keepLocalProgress = save ? shouldKeepLocalProgress(save) : false;
    const returningPlayer = save && !keepLocalProgress
      ? hasPlayedProgress(save)
      : hasPlayedProgress();

    if (save && !keepLocalProgress) {
      const detailedStats = save.detailed_stats && typeof save.detailed_stats === "object" ? save.detailed_stats : {};
      const hasDetailedStats = Object.keys(detailedStats).length > 0;
      const localStatsMatchCloud = state.bankGold === Number(save.bank_gold || 0)
        && Number(state.stats.wins || 0) === Number(save.wins || 0)
        && Number(state.stats.losses || 0) === Number(save.losses || 0)
        && Number(state.stats.goldBankedTotal || 0) === Number(save.total_gold || 0);
      const legacyDetailedStats = !hasDetailedStats && localStatsMatchCloud ? detailedStatsPayload() : {};
      resetRunCarryover();
      state.bankGold = Number(save.bank_gold || 0);
      state.stats = normalizeStats({
        ...detailedStats,
        ...legacyDetailedStats,
        wins: Number(save.wins || 0),
        losses: Number(save.losses || 0),
        goldBankedTotal: Number(save.total_gold || 0),
      });
      state.upgrades = { ...(save.upgrades || {}) };
      saveBankGold(state.bankGold);
      saveStats();
      saveUpgrades();
      if (!hasDetailedStats && localStatsMatchCloud) {
        await saveCloudNow({ force: true });
      }
    } else {
      await saveCloudNow({ force: true });
      if (keepLocalProgress || hasPlayedProgress() || hasActiveRunToSave()) {
        cloudState.transferMessage = "Progression visiteur transférée sur ce compte.";
      }
    }

    const restoredRun = keepLocalProgress ? hasActiveRunToSave() : restoreActiveRun(save?.active_run);
    if (returningPlayer && !restoredRun) {
      sendReturningPlayerToVillage();
    }

    cloudState.loaded = true;
  } catch (error) {
    setAccountStatus("Compte indisponible", "bad");
    setAccountHelp(authMessage(error?.message) || "Supabase a refuse de parler au donjon.");
  } finally {
    cloudState.applying = false;
  }
}

function shouldKeepLocalProgress(save) {
  const cloudTotal = progressScore(save);
  const localTotal = progressScore();
  return cloudTotal === 0 && (localTotal > 0 || hasActiveRunToSave());
}

function progressScore(save) {
  if (save) {
    return Number(save.bank_gold || 0)
    + Number(save.total_gold || 0)
    + Number(save.wins || 0)
    + Number(save.losses || 0)
    + Object.values(save.detailed_stats || {}).reduce((sum, value) => sum + Number(value || 0), 0)
    + Object.values(save.upgrades || {}).reduce((sum, level) => sum + Number(level || 0), 0);
  }

  return Number(state.bankGold || 0)
    + Number(state.stats.goldBankedTotal || 0)
    + Number(state.stats.wins || 0)
    + Number(state.stats.losses || 0)
    + hodorianStats().scoreHodorienTotal
    + Object.values(state.upgrades || {}).reduce((sum, level) => sum + Number(level || 0), 0);
}

function hasPlayedProgress(save) {
  return progressScore(save) > 0;
}

function sendReturningPlayerToVillage() {
  resetRunCarryover();
  state.screen = "village";
  state.villageLocation = "Village";
  state.showWinBanner = false;
  state.runEnded = true;
  state.combat = null;
  state.combatHp = 0;
  state.combatArenaKey = "";
  state.inputLocked = false;
  state.doorHints = [];
  state.floor = 0;
  state.life = state.maxLife;
  state.hodorPose = "walk";
  setStory("Grodor retrouve le village. Le garde à l'entrée prétend que c'était prévu.");
}

function resetRunCarryover() {
  clearDungeonEffectPoseTimer();
  state.carriedGold = 0;
  applyInventoryLossEffects(state.inventory);
  state.inventory = [];
  state.combat = null;
  state.combatHp = 0;
  state.combatArenaKey = "";
  state.miniGame = null;
  state.miniGamesEncountered = 0;
  state.inputLocked = false;
  state.doorHints = [];
  state.pendingCoinGain = 0;
  state.pendingPurseLoss = false;
}

function resetGuestProgress() {
  resetRunCarryover();
  state.screen = "cell";
  state.floor = TOTAL_FLOORS;
  state.totalFloors = TOTAL_FLOORS;
  state.bankGold = 0;
  state.upgrades = {};
  state.stats = { ...DEFAULT_STATS };
  state.runLosses = 0;
  state.life = START_LIFE;
  state.maxLife = START_LIFE;
  state.runEnded = true;
  state.lossRecorded = false;
  state.winRecorded = false;
  state.showWinBanner = false;
  state.koBannerText = "";
  state.winBannerText = "";
  state.miniGame = null;
  state.hodorPose = "idle";
  state.villageLocation = "Village";
  fallbackBankGold = 0;
  fallbackUpgrades = {};
  fallbackStats = { ...DEFAULT_STATS };
  try {
    localStorage.removeItem(BANK_KEY);
    localStorage.removeItem(UPGRADES_KEY);
    localStorage.removeItem(STATS_KEY);
  } catch {
    // La sauvegarde locale peut etre indisponible.
  }
}

function hasActiveRunToSave() {
  return !state.runEnded && (state.screen === "dungeon" || state.screen === "combat");
}

function combatKeyFor(monster) {
  if (!monster) return "";
  const match = Object.entries(monsters).find(([, candidate]) => candidate === monster || candidate.asset === monster.asset || candidate.name === monster.name);
  return match ? match[0] : "";
}

function combatArenaFor(key) {
  return COMBAT_ARENAS.find((arena) => arena.key === key) || COMBAT_ARENAS[0];
}

function randomCombatArenaKey() {
  return COMBAT_ARENAS[randomInt(0, COMBAT_ARENAS.length - 1)].key;
}

function buildActiveRunPayload() {
  if (!hasActiveRunToSave()) return null;
  return {
    version: 1,
    screen: state.screen,
    floor: state.floor,
    totalFloors: state.totalFloors,
    life: state.life,
    maxLife: state.maxLife,
    carriedGold: state.carriedGold,
    inventory: [...state.inventory],
    runLosses: state.runLosses,
    floorShift: state.floorShift,
    miniGamesEncountered: state.miniGamesEncountered,
    combatKey: combatKeyFor(state.combat),
    combatHp: state.screen === "combat" ? state.combatHp : 0,
    combatArenaKey: state.screen === "combat" ? combatArenaFor(state.combatArenaKey).key : "",
    activePact: state.activePact,
    updated_at: new Date().toISOString(),
  };
}

function restoreActiveRun(activeRun) {
  const snapshot = sanitizeActiveRun(activeRun);
  if (!snapshot) return false;

  state.screen = snapshot.screen;
  state.floor = snapshot.floor;
  state.totalFloors = snapshot.totalFloors;
  state.life = snapshot.life;
  state.maxLife = snapshot.maxLife;
  state.carriedGold = snapshot.carriedGold;
  state.inventory = snapshot.inventory;
  repairLegacyInventoryEffects();
  state.runLosses = snapshot.runLosses;
  state.floorShift = snapshot.floorShift;
  state.miniGamesEncountered = snapshot.miniGamesEncountered;
  state.combat = snapshot.screen === "combat" ? monsters[snapshot.combatKey] || null : null;
  state.combatHp = state.combat ? snapshot.combatHp : 0;
  state.renderedCombatHp = null;
  state.combatArenaKey = snapshot.screen === "combat" ? snapshot.combatArenaKey : "";
  state.activePact = snapshot.activePact || null;
  if (snapshot.screen === "combat" && !state.combat) {
    state.screen = "dungeon";
    state.combatHp = 0;
    state.combatArenaKey = "";
  }
  state.runEnded = false;
  state.lossRecorded = false;
  state.winRecorded = false;
  state.inputLocked = false;
  state.showWinBanner = false;
  state.villageLocation = "Village";
  state.doorHints = [];
  state.hodorPose = state.screen === "combat" ? "idle" : "question";
  prepareDoorHints();
  setStory(randomFrom([
    "Grodor cligne des yeux. Le Lapin Blanc hurle qu’il est encore en retard. Tout reprend.",
    "Grodor ouvre les yeux. Quelque part, le donjon appuie sur Start. Tout reprend.",
    "Grodor se réveil. Une voix crie “Action !”. Le donjon reprend la scène.",
  ]));
  dismissStartIntroForActiveRun();
  return true;
}

function dismissStartIntroForActiveRun() {
  finishStartIntro({ instant: true, revealCell: false });
}

function sanitizeActiveRun(activeRun) {
  if (!activeRun || typeof activeRun !== "object" || activeRun.version !== 1) return null;
  if (activeRun.screen !== "dungeon" && activeRun.screen !== "combat") return null;

  const floor = Math.max(1, Math.floor(Number(activeRun.floor || 1)));
  const totalFloors = Math.max(floor, Math.floor(Number(activeRun.totalFloors || floor || TOTAL_FLOORS)));
  const maxLife = Math.min(MAX_LIFE, Math.max(1, Math.floor(Number(activeRun.maxLife || START_LIFE))));
  const life = Math.min(maxLife, Math.max(1, Math.floor(Number(activeRun.life || START_LIFE))));
  const inventory = Array.isArray(activeRun.inventory)
    ? activeRun.inventory.filter((item) => typeof item === "string" && itemSaleValues[item] !== undefined).slice(0, 12)
    : [];
  const combatKey = typeof activeRun.combatKey === "string" && monsters[activeRun.combatKey] ? activeRun.combatKey : "";
  const monsterLife = combatKey ? monsters[combatKey].life : 0;
  const combatHp = monsterLife
    ? Math.min(monsterLife, Math.max(1, Math.floor(Number(activeRun.combatHp || monsterLife))))
    : 0;
  const combatArenaKey = typeof activeRun.combatArenaKey === "string"
    ? combatArenaFor(activeRun.combatArenaKey).key
    : DEFAULT_COMBAT_ARENA_KEY;

  return {
    screen: activeRun.screen === "combat" && combatKey ? "combat" : "dungeon",
    floor,
    totalFloors,
    life,
    maxLife,
    carriedGold: Math.max(0, Math.floor(Number(activeRun.carriedGold || 0))),
    inventory,
    runLosses: Math.max(0, Math.floor(Number(activeRun.runLosses || 0))),
    floorShift: Math.floor(Number(activeRun.floorShift || 0)),
    miniGamesEncountered: Math.max(0, Math.floor(Number(activeRun.miniGamesEncountered || 0))),
    combatKey,
    combatHp,
    combatArenaKey,
    activePact: typeof activeRun.activePact === "string" ? activeRun.activePact : null,
  };
}

function queueCloudSave() {
  if (!supabaseClient || !cloudState.user || cloudState.applying) return;
  window.clearTimeout(cloudState.saveTimer);
  cloudState.saveTimer = window.setTimeout(saveCloudNow, 500);
}

function queueActiveRunSave() {
  if (!supabaseClient || !cloudState.user || cloudState.applying || !hasActiveRunToSave()) return;
  window.clearTimeout(cloudState.runSaveTimer);
  cloudState.runSaveTimer = window.setTimeout(saveActiveRunNow, 400);
}

async function saveActiveRunNow(options = {}) {
  if (!supabaseClient || !cloudState.user || (cloudState.applying && !options.force)) return;
  const activeRun = buildActiveRunPayload();
  const { error } = await supabaseClient
    .from("player_saves")
    .update({ active_run: activeRun })
    .eq("user_id", cloudState.user.id);
  if (error) {
    setAccountStatus("Checkpoint run echoue", "bad");
    setAccountHelp(authMessage(error.message));
  }
}

async function clearActiveRunNow(options = {}) {
  if (!supabaseClient || !cloudState.user || (cloudState.applying && !options.force)) return;
  window.clearTimeout(cloudState.runSaveTimer);
  const { error } = await supabaseClient
    .from("player_saves")
    .update({ active_run: null })
    .eq("user_id", cloudState.user.id);
  if (error) {
    setAccountStatus("Nettoyage run echoue", "bad");
    setAccountHelp(authMessage(error.message));
  }
}

async function saveCloudNow(options = {}) {
  if (!supabaseClient || !cloudState.user || (cloudState.applying && !options.force)) return;
  const payload = {
    user_id: cloudState.user.id,
    bank_gold: Math.max(0, Math.floor(Number(state.bankGold || 0))),
    total_gold: Math.max(0, Math.floor(Number(state.stats.goldBankedTotal || 0))),
    wins: Math.max(0, Math.floor(Number(state.stats.wins || 0))),
    losses: Math.max(0, Math.floor(Number(state.stats.losses || 0))),
    upgrades: state.upgrades || {},
    detailed_stats: detailedStatsPayload(),
    active_run: buildActiveRunPayload(),
  };
  const { error } = await supabaseClient.from("player_saves").upsert(payload, { onConflict: "user_id" });
  if (error) {
    setAccountStatus("Sauvegarde cloud echouee", "bad");
    setAccountHelp(authMessage(error.message));
    return;
  }
  cloudState.loaded = true;
  updateAccountUi();
}

function setStory(text, tone = "neutral") {
  state.storyTone = tone;
  const storyText = deathStoryText(text);
  const split = splitStoryReward(storyText);
  $("story").innerHTML = formatStory(split.story || "Grodor contemple le résultat avec une compréhension limitée.");
  setReward(split.reward);
  state.hodorPose = hodorPoseFromStory(storyText, tone);
}

function deathStoryText(text) {
  if (state.screen !== "mort") return text;
  if (/Les PO en poche sont perdues/i.test(text)) return text;
  return `${text} Les PO en poche sont perdues. Retour aux geôles.`;
}

function setReward(text) {
  const panel = $("reward-panel");
  const rewardText = $("reward-text");
  if (!panel || !rewardText) return;

  window.clearTimeout(rewardHideTimer);
  rewardHideToken += 1;
  const currentRewardToken = rewardHideToken;
  panel.hidden = !text;
  rewardText.innerHTML = text ? formatStory(text) : "";
  $("scene").classList.toggle("no-reward", !text);
  if (text && state.screen === "dungeon") {
    rewardHideTimer = window.setTimeout(() => {
      if (currentRewardToken !== rewardHideToken || state.screen !== "dungeon") return;
      panel.hidden = true;
      $("scene").classList.add("no-reward");
    }, DUNGEON_EFFECT_VISIBLE_MS);
  }
  const rewardRaw = String(text || "");
  const coinGain = rewardRaw.match(/\+(\d+)\s*PO/i);
  const coinLoss = rewardRaw.match(/-(\d+)\s*PO/i);
  state.pendingCoinGain = coinGain && !/banque/i.test(rewardRaw) ? Number(coinGain[1]) : 0;
  state.pendingCoinLoss = coinLoss && !/banque/i.test(rewardRaw) ? Number(coinLoss[1]) : 0;
  state.pendingPurseLoss = /bourse perdue/i.test(rewardRaw);
}

function hasSeenCellTutorial() {
  try {
    return localStorage.getItem(CELL_TUTORIAL_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function markCellTutorialSeen() {
  try {
    localStorage.setItem(CELL_TUTORIAL_KEY, "1");
  } catch (error) {
    // Local storage can be blocked; the cell remains playable without it.
  }
}

function renderCellInfo() {
  const card = $("cell-info-card");
  if (!card) return;

  const isCell = state.screen === "cell";
  card.hidden = !isCell;
  if (!isCell) return;

  if (!hasSeenCellTutorial()) {
    card.innerHTML = [
      "<strong>Mini-tuto de geôle</strong>",
      "<p>Grodor explore un donjon absurde, choisit des portes, survit si possible, puis ramène des PO et du stuff au village.</p>",
      "<small>Objectif : devenir riche sans devenir trop mort. Jeu indé en chantier, donc chaque grincement a du caractère.</small>",
    ].join("");
    return;
  }

  card.innerHTML = [
    "<strong>Astuce de geôle</strong>",
    "<p>Entre deux runs, passe à la banque. Les PO dans la poche de Grodor ont une espérance de vie très courte.</p>",
    "<p>Garde les Gants Collants si tu peux. Grodor ne sait pas ce qu’ils touchent, mais ça rapporte.</p>",
    "<small>Le donjon est en cours d’aménagement. Si quelque chose casse, ce n’est pas Grodor. Enfin… pas toujours.</small>",
  ].join("");
}

function hodorPoseFromStory(text, tone) {
  const content = normalizeText(text);
  const effectText = normalizeText(splitStoryReward(text).reward);
  const hasEffectItem = Boolean(knownItemInText(effectText));
  const itemWasLost = hasEffectItem && /perdu|perdue|pulverise|pulverisee|confisque|confisquee|se fend|se dechire|explose|reste sur place|partent ensuite|malediction|refuse la mort|annule la catastrophe/.test(content);
  const itemWasDuplicate = hasEffectItem && /deja|dommage|ricane|refuse le cumul|personne ne devrait/.test(content);
  if (/\+\d+\s*po|banque\s*\+\d+\s*po/.test(effectText)) return "victory";
  if (/-\d+\s*po|bourse perdue/.test(effectText)) return "ko";
  if (!effectText) return "folie";
  if (/miroir magique|avenir.*court.*flou.*douloureux/.test(content)) return "folie";
  if (itemWasLost) return "ko";
  if (itemWasDuplicate) return "question";
  if (/soigne|\+\d+\s*coeur|caillou affectif|hache emoussee|casque trop petit|sandales de panique|medaillon|chaussette|gants|slip|cape/.test(effectText)) return "victory";
  if (/-\d+\s*etages/.test(effectText)) return "fuite";
  if (/\+\d+\s*etages/.test(effectText)) return "walk";
  if (/esquive/.test(effectText)) return "fuite";
  if (/doublon|objet sauve|objet intact|sauve/.test(effectText)) return "question";
  if (/monte-charge|service client/.test(content)) return "walk";
  if (/malediction|formulaire|vexee/.test(content)) return "question";
  if (/fresque|ressemble|personne ne sait|pourquoi|mystere|etrange|bizarre|statue|salle est vide|coffre.*vide|dramatique/.test(content)) return "question";
  if (/tu l'as deja|deja|dommage|rien|vide|affamee|pauvret/.test(content)) return "releve";
  if (/mort|ko|retour aux geoles|tombe avec la dignite|one shot/.test(content)) return "dead";
  if (/-\d+\s*coeur|mord|tire|violence|baffe|croche-pied|degat|douloureux|coup/.test(content)) return "hurt";
  if (/trappe|descente|trouves un objet|tu trouves un objet|recuperes un objet/.test(content)) return "victory";
  if (/achete|echoppe|vendeur|village/.test(content)) return "walk";
  if (tone === "good" || /\+\d+\s*po|\+\d+\s*coeur|trouves|ramasses|recuperes|gagne/.test(content)) return "victory";
  return "idle";
}

function splitStoryReward(text) {
  const sentences = String(text)
    .split(/(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const story = [];
  const reward = [];

  sentences.forEach((sentence) => {
    const split = splitSentenceEffect(sentence);
    if (split.story) story.push(split.story);
    if (split.reward) reward.push(split.reward);
  });

  return {
    story: story.join(" "),
    reward: reward.join("\n"),
  };
}

function splitSentenceEffect(sentence) {
  if (/^Effet\s*:\s*Soigne/i.test(sentence)) {
    return { story: "", reward: "Soigne" };
  }

  if (/^Effet\s*:\s*Objet perdu\s*:/i.test(sentence)) {
    const item = knownItemInText(sentence);
    return { story: "", reward: item ? `Objet perdu : ${item}` : "Objet perdu" };
  }

  if (/^Effet\s*:\s*Doublon\s*:/i.test(sentence)) {
    const item = knownItemInText(sentence);
    return { story: "", reward: item ? `Doublon : ${item}` : "Doublon" };
  }

  if (/^Effet\s*:\s*Objet intact/i.test(sentence)) {
    return { story: "", reward: "Objet intact" };
  }

  if (/^Effet\s*:/i.test(sentence)) {
    const item = knownItemInText(sentence);
    if (item) return { story: "", reward: item };
  }

  const duplicate = duplicateItemEffect(sentence);
  if (duplicate) {
    return {
      story: sentence,
      reward: duplicate,
    };
  }

  const itemLoss = itemLossEffect(sentence);
  if (itemLoss) {
    return {
      story: cleanupStorySentence(stripKnownItem(sentence).replace(/(?:Utilise|Objet utilisé)\s+puis perdu\s*:\s*[^.]+/i, "")),
      reward: itemLoss,
    };
  }

  const goldSaved = sentence.match(/Total sauvegarde\s*:\s*(\d+)\s*PO/i);
  if (goldSaved) {
    return {
      story: cleanupStorySentence(sentence.replace(/Total sauvegarde\s*:\s*\d+\s*PO/i, "")),
      reward: `Banque +${goldSaved[1]} PO`,
    };
  }

  if (/Les PO en poche sont perdues/i.test(sentence)) {
    return {
      story: cleanupStorySentence(sentence.replace(/Les PO en poche sont perdues/i, "")),
      reward: "Bourse perdue",
    };
  }

  const numericEffect = sentence.match(/([+-]\d+\s*(?:PO|cœurs?|coeur|étages|etages))/i);
  if (numericEffect) {
    const isMaximumHeartEffect = /[+-]\d+\s*(?:cœurs?|coeur)\s+maximum/i.test(sentence);
    return {
      story: cleanupStorySentence(sentence.replace(numericEffect[0], "").replace(/\bmaximum\b/i, "")),
      reward: `${numericEffect[1]}${isMaximumHeartEffect ? " maximum" : ""}`,
    };
  }

  const goldEffect = goldEffectFromSentence(sentence);
  if (goldEffect) {
    const replacement = goldEffect.startsWith("-") ? "des pièces" : "quelques pièces";
    return {
      story: cleanupStorySentence(sentence.replace(/\d+\s*PO/i, replacement)),
      reward: goldEffect,
    };
  }

  const moveEffect = sentence.match(/(?:remontes?|descends?|gagne|perd)\s+(?:de\s+)?(\d+\s*(?:étages|etages))/i);
  if (moveEffect) {
    const sign = /remont|perd/i.test(sentence) ? "+" : "-";
    return {
      story: cleanupStorySentence(sentence
        .replace(/(?:remontes?|descends?|gagne|perd)\s+(?:de\s+)?\d+\s*(?:étages|etages)/i, "")
        .replace(/\s*:\s*$/g, "")),
      reward: `${sign}${moveEffect[1]}`,
    };
  }

  const itemGain = itemGainEffect(sentence);
  if (itemGain) {
    return {
      story: cleanupStorySentence(sentence),
      reward: itemGain,
    };
  }

  if (/ne casse pas/i.test(sentence)) {
    return { story: cleanupStorySentence(sentence), reward: "Objet intact" };
  }

  if (/annule la catastrophe|évitent le pire|evitent le pire|esquive/i.test(sentence)) {
    return { story: cleanupStorySentence(sentence), reward: "Esquive" };
  }

  return { story: sentence, reward: "" };
}

function goldEffectFromSentence(sentence) {
  const match = sentence.match(/(\d+)\s*PO/i);
  if (!match) return "";
  const amount = match[1];
  return /reclame|avale|roulent|vole|perd|paies/i.test(sentence)
    ? `-${amount} PO`
    : `+${amount} PO`;
}

function duplicateItemEffect(sentence) {
  if (!/deja|doublon|cumul/i.test(normalizeText(sentence))) return "";
  return knownItemInText(sentence);
}

function itemGainEffect(sentence) {
  if (/deja|perdu|pulverise|confisque|se fend|se dechire|explose/i.test(normalizeText(sentence))) return "";
  const item = knownItemInText(sentence);
  if (!item) return "";
  return item;
}

function itemLossEffect(sentence) {
  const item = knownItemInText(sentence);
  if (!item) return "";
  if (/perdu|pulverise|confisque|se fend|se dechire|explose|reste sur place|partent ensuite/i.test(normalizeText(sentence))) {
    return item;
  }
  return "";
}

function stripKnownItem(sentence) {
  const item = knownItemInText(sentence);
  if (!item) return sentence;
  const patterns = [
    new RegExp(`\\b${escapeRegExp(item)}\\b`, "gi"),
    ...itemAliasesFor(item).map((alias) => new RegExp(`\\b${escapeRegExp(alias)}\\b`, "gi")),
  ];
  return patterns
    .reduce((result, pattern) => result.replace(pattern, "un objet"), sentence)
    .replace(/\b(?:un|une|des|le|la|les)\s+un objet\b/gi, "un objet");
}

function itemAliasesFor(item) {
  const aliases = {
    "Casque Trop Petit": ["casque trop petit", "le casque trop petit"],
    "Slip de Guerre": ["slip de guerre", "le slip de guerre"],
    "Medaillon du Presque-Heros": ["medaillon", "médaillon", "medaillon du presque-heros", "médaillon du presque-héros", "un medaillon du presque-heros", "un médaillon du presque-héros"],
    "Sandales de Panique": ["ces sandales", "des sandales de panique", "sandales de panique", "sandales"],
    "Hache Emoussee": ["hache emoussee", "hache émoussée", "une hache emoussee", "une hache émoussée"],
    "Boulet au Pied": ["boulet au pied", "un boulet au pied"],
    "Chaussette Porte-Bonheur": ["chaussette porte-bonheur", "une chaussette porte-bonheur"],
    "Caillou Affectif": ["caillou affectif", "un caillou affectif"],
    "Cape Trop Longue": ["cape trop longue", "une cape trop longue"],
    "Gants Collants": ["gants collants", "des gants collants"],
  };
  return aliases[item] || [];
}

function knownItemInText(text) {
  if (typeof itemDescriptions === "undefined") return "";
  const normalized = normalizeText(text);
  return Object.keys(itemDescriptions)
    .sort((a, b) => b.length - a.length)
    .find((item) => {
      if (normalized.includes(normalizeText(item))) return true;
      return itemAliasesFor(item).some((alias) => normalized.includes(normalizeText(alias)));
    }) || "";
}

function cleanupStorySentence(sentence) {
  return sentence
    .replace(/contient\s+et\s+un mot/i, "contient un mot")
    .replace(/lâche\s*\./i, "lâche quelque chose.")
    .replace(/lache\s*\./i, "lâche quelque chose.")
    .replace(/confisque ton objet\s*:\s*un objet/i, "confisque ton objet")
    .replace(/pulvérise ton objet\s*:\s*un objet/i, "pulvérise ton objet")
    .replace(/pulverise ton objet\s*:\s*un objet/i, "pulvérise ton objet")
    .replace(/\s+([.,])/g, "$1")
    .replace(/\s*:\s*\./g, ".")
    .replace(/\.\.+/g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[:.]\s*$/g, (match) => match.includes(".") ? "." : "")
    .replace(/^\.$/, "")
    .replace(/^(?:tu|il|elle|hodor)\.$/i, "")
    .trim();
}

function normalizeText(text) {
  return String(text)
    .replace(/[œŒ]/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatStory(text) {
  return String(text)
    .split(/\n+/)
    .map((line) => highlightGold(escapeHtml(line)))
    .join("<br>");
}

function highlightGold(text) {
  return highlightItems(text)
    .replace(/(annonce\s+)(\d+\s*(?:étages|etages))/g, '$1<span class="floor-total">$2</span>')
    .replace(/(-\d+\s*(?:étages|etages))/g, '<span class="floor-down">$1</span>')
    .replace(/(\+\d+\s*(?:étages|etages))/g, '<span class="floor-up">$1</span>')
    .replace(/(remonte(?:s)? de\s+)(\d+\s*(?:étages|etages))/g, '$1<span class="floor-up">$2</span>')
    .replace(/(descend(?:s)? de\s+)(\d+\s*(?:étages|etages))/g, '$1<span class="floor-down">$2</span>')
    .replace(/(\+?\d+\s*PO|PO)/g, '<span class="po-text">$1</span>')
    .replace(/(\+\d+\s*(?:cœurs?|coeur))/g, '<span class="heart-good">$1</span>')
    .replace(/(-\d+\s*(?:cœurs?|coeur)(?:\s+bonus)?)/g, '<span class="heart-bad">$1</span>');
}

function highlightItems(text) {
  if (typeof itemDescriptions === "undefined") return text;

  const badLine = /perdu|pulverise|confisque|deja|se casse|se fend|explose|sacrifiant/i.test(text);
  const itemClass = badLine ? "item-bad" : "item-loot";
  const aliases = [
    "casque trop petit",
    "slip de guerre",
    "medaillon",
    "sandales de panique",
    "hache emoussee",
    "boulet au pied",
    "chaussette porte-bonheur",
    "caillou affectif",
    "cape trop longue",
    "gants collants",
  ];

  const withExactNames = Object.keys(itemDescriptions)
    .sort((a, b) => b.length - a.length)
    .reduce((result, item) => {
      const pattern = new RegExp(`\\b${escapeRegExp(item)}\\b`, "g");
      return result.replace(pattern, `<span class="${itemClass}">${item}</span>`);
    }, text);

  return aliases.reduce((result, alias) => {
    const pattern = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "g");
    return result.replace(pattern, (match) => `<span class="${itemClass}">${match}</span>`);
  }, withExactNames);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function snapshotRun() {
  return {
    life: state.life,
    maxLife: state.maxLife,
    carriedGold: state.carriedGold,
    inventoryCount: state.inventory.length,
    screen: state.screen,
  };
}

function gainMaxLife() {
  if (state.maxLife >= MAX_LIFE) {
    state.maxLife = MAX_LIFE;
    state.life = Math.min(state.life, state.maxLife);
    return false;
  }

  state.maxLife += 1;
  state.life = Math.min(state.maxLife, state.life + 1);
  return true;
}

function applyItemGainEffect(item) {
  if (item !== "Slip de Guerre") return;
  if (state.maxLife >= MAX_LIFE) {
    state.maxLife = MAX_LIFE;
    state.life = Math.min(state.life, state.maxLife);
    return;
  }
  state.maxLife += 1;
  state.life = Math.min(state.maxLife, state.life + 1);
}

function applyItemLossEffect(item) {
  if (item !== "Slip de Guerre") return;
  state.maxLife = Math.max(START_LIFE, state.maxLife - 1);
  state.life = Math.min(state.life, state.maxLife);
}

function applyInventoryLossEffects(items) {
  items.forEach((item) => applyItemLossEffect(item));
}

function repairLegacyInventoryEffects() {
  if (!hasItem("Slip de Guerre")) return;
  const expectedSlipMaxLife = Math.min(MAX_LIFE, START_LIFE + 1);
  if (state.maxLife >= expectedSlipMaxLife) return;
  const previousMaxLife = state.maxLife;
  state.maxLife = expectedSlipMaxLife;
  if (state.life >= previousMaxLife) {
    state.life = state.maxLife;
  }
}

function toneFromSnapshot(before) {
  if (state.eventToneOverride) {
    const tone = state.eventToneOverride;
    state.eventToneOverride = null;
    return tone;
  }
  if (state.screen === "mort") return "bad";
  if (state.screen === "village" && before.screen !== "village") return "good";
  if (state.life < before.life || state.maxLife < before.maxLife || state.carriedGold < before.carriedGold || state.inventory.length < before.inventoryCount) return "bad";
  if (state.life > before.life || state.maxLife > before.maxLife || state.carriedGold > before.carriedGold || state.inventory.length > before.inventoryCount) return "good";
  return "neutral";
}

function addClick(id, handler) {
  const element = $(id);
  if (element) {
    element.addEventListener("click", handler);
  }
}

function dismissWinBannerOnFirstClick(event) {
  if (!state.showWinBanner || state.screen !== "village") return;
  state.showWinBanner = false;
  event.preventDefault();
  event.stopPropagation();
  render();
}

function addEnterSubmit(id, handler) {
  const element = $(id);
  if (!element) return;
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handler();
  });
}

function upgradeLevel(id) {
  return state.upgrades[id] || 0;
}

function upgradeChance(id, values) {
  const level = upgradeLevel(id);
  if (level <= 0) return 0;
  return values[level - 1] || 0;
}

function clearVillageActionTarget() {
  $("scene")?.classList.remove("village-target-bank", "village-target-shop", "village-target-sell", "village-target-tavern", "village-target-stats");
}

function delayVillageAction(target, action) {
  if (state.screen !== "village" || villageActionTimer) return;

  closeInventory();
  closeAccountPopover();
  window.clearTimeout(villageReturnTimer);
  clearVillageActionTarget();
  $("scene")?.classList.add(`village-target-${target}`);

  // Démarre l'animation de marche active lors du déplacement
  state.hodorPose = "walk";

  // Oriente Grodor selon sa direction de marche
  if (target === "bank" || target === "sell") {
    state.hodorFlipped = false; // Marche vers la gauche
  } else if (target === "shop" || target === "tavern") {
    state.hodorFlipped = true; // Marche vers la droite
  } else {
    state.hodorFlipped = false;
  }

  render();

  villageActionTimer = window.setTimeout(() => {
    villageActionTimer = null;
    action();

    // Grodor arrive au bâtiment et redevient immobile
    state.hodorPose = "idle";
    render();

    const returnDelay = target === "bank" || target === "sell"
      ? VILLAGE_SERVICE_RETURN_DELAY_MS
      : VILLAGE_RETURN_DELAY_MS;

    villageReturnTimer = window.setTimeout(() => {
      // Démarre l'animation de marche active lors du retour au centre
      state.hodorPose = "walk";

      // Se retourne pour marcher dans l'autre sens
      if (target === "bank" || target === "sell") {
        state.hodorFlipped = true; // Retourne vers la droite
      } else if (target === "shop" || target === "tavern") {
        state.hodorFlipped = false; // Retourne vers la gauche
      } else {
        state.hodorFlipped = false;
      }

      clearVillageActionTarget();
      if (state.screen !== "village") return;
      state.villageLocation = "Village";
      setStory("Grodor revient au centre du village.");
      render();

      // S'arrête une fois arrivé au centre du village (après 450ms de déplacement)
      window.setTimeout(() => {
        if (state.screen === "village") {
          state.hodorPose = "idle";
          state.hodorFlipped = false; // Face vers la gauche par défaut au repos
          render();
        }
      }, 450);
    }, returnDelay);
  }, VILLAGE_ACTION_DELAY_MS);
}

function openShop() {
  if (state.screen !== "village") return;
  closeInventory();
  closeAccountPopover();
  shopPanelOpen = true;
  shopPanelMode = "upgrades";
  selectedSaleItems.clear();
  statsPanelOpen = false;
  state.hodorPose = "walk";
  state.showWinBanner = false;
  state.villageLocation = "Échoppe";
  setStory("Le vendeur sourit comme quelqu'un qui a déjà compté ton argent deux fois, gros pigeon médiéval.");
  renderShop();
  render();
}

function openSellPanel() {
  if (state.screen !== "village") return;
  closeInventory();
  closeAccountPopover();
  shopPanelOpen = true;
  shopPanelMode = "sell";
  selectedSaleItems.clear();
  statsPanelOpen = false;
  state.hodorPose = "walk";
  state.showWinBanner = false;
  state.villageLocation = "Comptoir de revente";
  setStory("Le revendeur sort une balance, deux sacs et une morale très flexible. Choisis ce que Grodor abandonne.");
  renderShop();
  render();
}

function closeShop() {
  if (!shopPanelOpen) return;
  shopPanelOpen = false;
  selectedSaleItems.clear();
  state.villageLocation = "Village";
  render();
}

function openStatsPanel() {
  if (state.screen !== "village") return;
  closeInventory();
  closeAccountPopover();
  statsPanelOpen = true;
  statsPanelView = "stats";
  shopPanelOpen = false;
  selectedSaleItems.clear();
  state.showWinBanner = false;
  state.villageLocation = "Panneau d'affichage";
  setStory("Le panneau d'affichage liste tes exploits avec une ponctuation humiliante.");
  render();
}

function setStatsPanelView(view) {
  if (!statsPanelOpen) return;
  statsPanelView = view;
  if (view === "ranking") {
    cachedRankingData = null;
    fetchRankingFromCloud();
  } else {
    renderStatsPanel();
  }
}

async function fetchRankingFromCloud() {
  if (!supabaseClient) {
    cachedRankingData = null;
    rankingLoading = false;
    renderStatsPanel();
    return;
  }

  rankingLoading = true;
  renderStatsPanel();

  try {
    const { data, error } = await supabaseClient.rpc("get_grodor_leaderboard", {
      p_limit: 20,
    });

    if (error) throw error;

    cachedRankingData = (data || []).map((item) => ({
      user_id: item.user_id,
      displayName: item.display_name || "Grodor anonyme",
      score: Number(item.score_grodorien_total || 0),
    }));
  } catch (err) {
    console.error("Failed to fetch ranking from Supabase:", err);
    cachedRankingData = [];
  } finally {
    rankingLoading = false;
    renderStatsPanel();
  }
}

function closeStatsPanel() {
  if (!statsPanelOpen) return;
  statsPanelOpen = false;
  render();
}

function closeVillagePanels() {
  const hadPanel = shopPanelOpen || statsPanelOpen;
  shopPanelOpen = false;
  statsPanelOpen = false;
  selectedSaleItems.clear();
  if (hadPanel) render();
}

function buyUpgrade(id) {
  const upgrade = upgradeDefinitions[id];
  const current = upgradeLevel(id);
  const cost = upgrade.costs[current];

  if (cost === undefined) {
    setStory(`${upgrade.name} est déjà au maximum. Même l'arnaque a ses limites.`);
    return;
  }

  if (state.bankGold < cost) {
    setStory(`Il te manque encore de l'or pour acheter ${upgrade.name}. Le vendeur fait semblant d'être triste, pauvre gueux.`);
    return;
  }

  state.bankGold -= cost;
  state.upgrades[id] = current + 1;
  saveBankGold(state.bankGold);
  saveUpgrades();
  setStory(`${upgrade.name} niveau ${current + 1} acheté. Grodor se sent progresser, ou peut-être c'est une allergie.`);
  render();
}

function chooseDoor(door) {
  if (state.runEnded || state.screen !== "dungeon" || state.inputLocked) return;

  clearDungeonEffectPoseTimer();
  stopDungeonDoorPreview();
  $("scene")?.classList.add("is-door-walking");
  const doorIndex = door.dataset.door;
  setDungeonDoorTarget(doorIndex);
  door.blur();
  flashDoor(door);
  state.inputLocked = true;
  setStory(randomFrom([
    "Grodor pose la main sur la poignée. Quelque part, le destin soupire.",
    "Grodor attrape la poignée. Le donjon hésite à faire semblant d’être vide.",
    "Grodor saisit la poignée. Le silence devient beaucoup trop silencieux.",
    "Grodor tourne la poignée. Derrière, le donjon improvise.",
    "Grodor s’empare de la poignée. La porte tremble.",
  ]));
  render();

  let delay = 3450;
  if (doorIndex === "1") delay = 3850;
  if (doorIndex === "2") delay = 4450;

  window.setTimeout(() => resolveDoorChoice(), delay);
}

function previewDungeonDoorOpen(event) {
  if (state.screen !== "dungeon" || state.inputLocked || dungeonEffectPoseTimer || event.currentTarget.disabled) return;
  setDungeonDoorPreviewTarget(event.currentTarget.dataset.door);
}

function stopDungeonDoorPreview() {
  if (state.screen !== "dungeon" || state.inputLocked || dungeonEffectPoseTimer) return;
  setDungeonDoorPreviewTarget(null);
}

function resolveDoorChoice() {
  if (state.floor === 1) {
    const before = snapshotRun();
    setStory(finalDoorOutcome(), toneFromSnapshot(before));
    state.inputLocked = false;
    resetDoorEffects();
    holdDungeonEffectPoseBriefly();
    render();
    return;
  }

  const before = snapshotRun();
  const text = dungeonEvent().run();
  let suffix = "";

  if (state.miniGame) {
    setStory(text, "neutral");
    resetDoorEffects();
    render();
    return;
  }

  suffix = completeDungeonStep();

  setStory(text + suffix, toneFromSnapshot(before));
  prepareDoorHints();
  state.inputLocked = false;
  resetDoorEffects();
  holdDungeonEffectPoseBriefly();
  render();
}

function startMiniGame(type) {
  clearChestDodgeTimers();
  clearArmWrestle();
  const configs = {
    double: {
      title: "",
      phase: state.carriedGold > 0 ? "stake" : "empty",
      stake: state.carriedGold > 0 ? 1 : 0,
      text: state.carriedGold > 0
        ? `Le croupier lorgne tes ${state.carriedGold} PO. Choisis ta mise : en cas de victoire, elle est doublée.`
        : "Le croupier regarde ta bourse vide. Sans PO, pas de pari : même lui a une limite.",
      image: `${COIN_FLIP_ASSET_PATH}/pile-face-1.webp`,
      actions: [],
    },
    slots: {
      title: "",
      phase: "ready",
      text: "",
      reels: ["Bourse-vide", "Bourse-vide", "Bourse-vide"],
      actions: [],
    },
    cards: {
      title: "",
      phase: "choose",
      text: "",
      picked: null,
      result: "",
      actions: [],
    },
    arm: {
      title: "",
      phase: "ready",
      text: "",
      assetsReady: false,
      difficulty: randomFrom(ARM_WRESTLE_DIFFICULTIES),
      frame: "bdf-centre.webp",
      position: 0,
      recentTaps: 0,
      totalTaps: 0,
      remainingMs: ARM_WRESTLE_DURATION_MS,
      buttonPressed: false,
      continueEnabled: false,
      actions: [],
    },
  };

  state.miniGamesEncountered += 1;
  state.miniGame = { type, ...configs[type] };
  if (type === "arm") {
    preloadArmWrestleAssets(state.miniGame);
  }
  return "Le donjon ouvre un petit jeu de hasard. Grodor sent que son avenir vient de devenir cliquable.";
}

function startGoldChestMiniGame(mode, amount) {
  const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));
  if (mode === "loss" && safeAmount <= 0) {
    return "Vous avez trouvé un coffre. Il claque des dents, mais la bourse de Grodor est déjà vide.";
  }

  clearChestDodgeTimers();
  clearArmWrestle();
  state.miniGamesEncountered += 1;

  const totalRounds = randomInt(3, 6);

  state.miniGame = {
    type: "chest",
    title: "",
    phase: "open",
    mode,
    amount: safeAmount,
    round: 0,
    totalRounds,
    activeSlot: null,
    previousSlot: null,
    promptState: "ok",
    image: `${CHEST_DODGE_ASSET_PATH}/coffre_open.webp`,
    text: "",
    outcome: "",
    outcomeTone: "neutral",
    actions: [],
  };
  preloadChestDodgeAssets();
  return "Vous avez trouvé un coffre.";
}

function startPactMiniGame() {
  clearChestDodgeTimers();
  clearArmWrestle();
  state.miniGamesEncountered += 1;
  state.miniGame = {
    type: "pact",
    title: "Le Marchand d'Ombres",
    text: "Une silhouette louche, enveloppée d'un drap troué, vous barre la route et siffle : 'Hé... psst ! Tu veux un marché honnête ? Enfin... presque honnête.'",
    phase: "choice",
    actions: [
      { id: "pact-midas", label: "💰 Pacte de Midas (+100% Or, 0% Esquive)" },
      { id: "pact-temerite", label: "⚡ Pacte de Témérité (Combat auto 80%, Mort subite 20%)" },
      { id: "pact-sang", label: "🩸 Pacte de Sang (+3 Cœurs max, 35% saigner)" },
      { id: "pact-refuse", label: "🏃 Fuir en hurlant (Refuser)" }
    ]
  };
  return "Une silhouette suspecte surgit d'un recoin sombre de la tour.";
}

function resolveMiniGame(action) {
  if (!state.miniGame || state.screen !== "dungeon") return;

  if (state.miniGame.type === "pact") {
    resolvePactAction(action);
    return;
  }

  if (state.miniGame.type === "double") {
    resolveCoinFlipAction(action);
    return;
  }

  if (state.miniGame.type === "slots") {
    resolveSlotMachineAction(action);
    return;
  }

  if (state.miniGame.type === "cards") {
    resolveBonneteauAction(action);
    return;
  }

  if (state.miniGame.type === "chest") {
    resolveChestDodgeAction(action);
    return;
  }

  if (state.miniGame.type === "arm") {
    resolveArmWrestleAction(action);
  }
}

function resolvePactAction(action) {
  let outcome = "";
  let tone = "good";

  if (action === "pact-midas") {
    state.activePact = "midas";
    outcome = "Grodor accepte le Pacte de Midas. Ses mains brillent d'une avidité malsaine, mais ses jambes semblent lourdes de plomb. (+100% d'or trouvé, mais TOUTES les esquives de dégâts sont désactivées !)";
    tone = "gold";
  } else if (action === "pact-temerite") {
    state.activePact = "temerite";
    outcome = "Grodor signe le Pacte de Témérité. Il se sent incroyablement fort, mais le donjon chuchote des menaces de mort immédiate. (Combat : 80% auto-victoire instantanée, 20% mort subite sans aucun joker !)";
    tone = "bad";
  } else if (action === "pact-sang") {
    state.activePact = "sang";
    state.maxLife = Math.min(6, state.maxLife + 3);
    state.life = Math.min(state.maxLife, state.life + 3);
    outcome = "Grodor boit une fiole du Pacte de Sang. Sa vitalité explose (+3 cœurs max !), mais ses veines palpitent d'une douleur lancinante à chaque marche. (35% de saigner de -1 cœur à chaque changement d'étage)";
    tone = "good";
  } else {
    outcome = "Grodor crie 'HODOR !' de toutes ses forces et s'enfuit en courant. La silhouette soupire de pitié devant tant de lâcheté.";
    tone = "neutral";
  }

  completeMiniGame(outcome, tone);
}

function completeMiniGame(outcome, tone) {
  let suffix = "";

  clearCoinFlipAnimation();
  clearSlotMachineAnimation();
  clearChestDodgeTimers();
  clearArmWrestle();
  state.miniGame = null;
  suffix = completeDungeonStep();

  setStory(outcome + suffix, tone);
  prepareDoorHints();
  state.inputLocked = false;
  resetDoorEffects();
  holdDungeonEffectPoseBriefly();
  render();
}

function resolveCoinFlipAction(action) {
  const miniGame = state.miniGame;
  if (!miniGame || miniGame.type !== "double" || miniGame.phase === "flipping") return;

  if (action === "double-confirm" && miniGame.phase === "stake") {
    const stakeField = $("mini-game-stake");
    const selectedStake = Math.floor(Number(stakeField?.value || miniGame.stake || 1));
    miniGame.stake = Math.min(state.carriedGold, Math.max(1, selectedStake));
    miniGame.phase = "choice";
    miniGame.image = `${COIN_FLIP_ASSET_PATH}/pile-face-2.webp`;
    miniGame.text = "";
    render();
    return;
  }

  if ((action === "double-pile" || action === "double-face") && miniGame.phase === "choice") {
    startCoinFlip(action === "double-pile" ? "pile" : "face");
    return;
  }

  if (action === "double-continue" && miniGame.phase === "result") {
    completeMiniGame(miniGame.outcome, miniGame.outcomeTone);
  }

  if (action === "double-continue" && miniGame.phase === "empty") {
    completeMiniGame(miniGame.text, "neutral");
  }
}

function startCoinFlip(choice) {
  clearCoinFlipAnimation();
  const miniGame = state.miniGame;
  if (!miniGame || miniGame.type !== "double") return;

  miniGame.phase = "flipping";
  miniGame.choice = choice;
  miniGame.won = Math.random() < 0.2;
  miniGame.landedSide = miniGame.won ? choice : choice === "pile" ? "face" : "pile";
  miniGame.text = "La pièce tourne. Le croupier sourit déjà un peu trop.";

  const frames = ["pile-face-1.webp", "pile-face-2.webp", "pile-face-3.webp", "pile-face-4.webp"];
  frames.forEach((frame, index) => {
    coinFlipAnimationTimers.push(window.setTimeout(() => {
      if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "flipping") return;
      miniGame.image = `${COIN_FLIP_ASSET_PATH}/${frame}`;
      render();
    }, index * COIN_FLIP_FRAME_MS));
  });

  coinFlipAnimationTimers.push(window.setTimeout(() => settleCoinFlip(miniGame), frames.length * COIN_FLIP_FRAME_MS));
  render();
}

function settleCoinFlip(miniGame) {
  if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "flipping") return;

  const before = snapshotRun();
  const stake = miniGame.stake;
  miniGame.image = `${COIN_FLIP_ASSET_PATH}/pile-face-${miniGame.landedSide}.webp`;
  miniGame.phase = "result";

  if (miniGame.won) {
    addStat("miniJeuxReussis");
    miniGame.outcome = addGold(stake, `La pièce tombe sur ${miniGame.landedSide}. Bon choix : Grodor double sa mise. +${stake} PO.`);
  } else {
    state.carriedGold = Math.max(0, state.carriedGold - stake);
    miniGame.outcome = `La pièce tombe sur ${miniGame.landedSide}. Mauvais choix : le croupier ramasse la mise. -${stake} PO.`;
  }

  miniGame.outcomeTone = toneFromSnapshot(before);
  miniGame.text = miniGame.outcome;
  render();
}

function clearCoinFlipAnimation() {
  coinFlipAnimationTimers.forEach((timer) => window.clearTimeout(timer));
  coinFlipAnimationTimers = [];
}

function resolveSlotMachineAction(action) {
  const miniGame = state.miniGame;
  if (!miniGame || miniGame.type !== "slots" || miniGame.phase === "spinning") return;

  if (action === "slots-spin" && miniGame.phase === "ready") {
    startSlotMachine();
    return;
  }

  if (action === "slots-continue" && miniGame.phase === "result") {
    completeMiniGame(miniGame.outcome, miniGame.outcomeTone);
  }
}

function startSlotMachine() {
  clearSlotMachineAnimation();
  const miniGame = state.miniGame;
  if (!miniGame || miniGame.type !== "slots") return;

  miniGame.phase = "spinning";
  miniGame.text = "";
  miniGame.result = [
    randomFrom(SLOT_MACHINE_SYMBOLS),
    randomFrom(SLOT_MACHINE_SYMBOLS),
    randomFrom(SLOT_MACHINE_SYMBOLS),
  ];

  [8, 12, 16].forEach((stopFrame, reelIndex) => {
    for (let frame = 1; frame <= stopFrame; frame += 1) {
      slotMachineAnimationTimers.push(window.setTimeout(() => {
        if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "spinning") return;
        miniGame.reels[reelIndex] = randomFrom(SLOT_MACHINE_SYMBOLS);
        render();
      }, frame * SLOT_MACHINE_FRAME_MS));
    }
    slotMachineAnimationTimers.push(window.setTimeout(() => {
      if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "spinning") return;
      miniGame.reels[reelIndex] = miniGame.result[reelIndex];
      render();
    }, (stopFrame + 1) * SLOT_MACHINE_FRAME_MS));
  });

  slotMachineAnimationTimers.push(window.setTimeout(
    () => settleSlotMachine(miniGame),
    18 * SLOT_MACHINE_FRAME_MS
  ));
  render();
}

function settleSlotMachine(miniGame) {
  if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "spinning") return;

  const before = snapshotRun();
  const reels = miniGame.result;
  const triple = reels.every((symbol) => symbol === reels[0]);
  const pair = !triple && new Set(reels).size === 2;

  if (triple && reels[0] === "Grodor") {
    const gainedHeart = gainMaxLife();
    addStat("miniJeuxReussis");
    saveStats();
    miniGame.outcome = gainedHeart
      ? "Trois Grodor ! Le jackpot offre un cœur supplémentaire. +1 cœur maximum."
      : "Trois Grodor ! Le jackpot tousse un cœur, mais Grodor en a déjà 6. Maximum atteint.";
  } else if (triple && reels[0] === "Po") {
    const gold = state.carriedGold;
    state.carriedGold += gold;
    addStat("miniJeuxReussis");
    addStat("poGagnes", gold);
    saveStats();
    miniGame.outcome = `Trois PO ! La machine double la bourse actuelle. +${gold} PO.`;
  } else if (triple && reels[0] === "Crane") {
    const previousMaxLife = state.maxLife;
    state.maxLife = Math.max(1, state.maxLife - 1);
    state.life = Math.min(state.life, state.maxLife);
    miniGame.outcome = state.maxLife < previousMaxLife
      ? "Trois crânes. La machine dévore un cœur maximum. -1 cœur maximum."
      : "Trois crânes. La machine tente d'arracher le dernier cœur, mais même elle n'ose pas.";
  } else if (pair) {
    const healed = state.life < state.maxLife;
    state.life = Math.min(state.maxLife, state.life + 1);
    miniGame.outcome = healed
      ? "Deux symboles identiques. La machine lâche un soin à contrecœur. +1 cœur."
      : "Deux symboles identiques. Un soin tombe, mais Grodor est déjà au maximum.";
  } else {
    miniGame.outcome = takeDamage(1, "Rien ne s'aligne. La machine cogne Grodor pour équilibrer les comptes. -1 cœur.");
  }

  miniGame.phase = "result";
  miniGame.outcomeTone = toneFromSnapshot(before);
  miniGame.text = miniGame.outcome;
  render();
}

function clearSlotMachineAnimation() {
  slotMachineAnimationTimers.forEach((timer) => window.clearTimeout(timer));
  slotMachineAnimationTimers = [];
}

function resolveBonneteauAction(action) {
  const miniGame = state.miniGame;
  if (!miniGame || miniGame.type !== "cards") return;

  if (/^card-[0-2]$/.test(action) && miniGame.phase === "choose") {
    const before = snapshotRun();
    const picked = Number(action.slice(-1));
    const result = randomFrom(BONNETEAU_SYMBOLS);
    miniGame.picked = picked;
    miniGame.result = result;
    miniGame.phase = "result";

    if (result === "grodor") {
      const gainedHeart = gainMaxLife();
      addStat("miniJeuxReussis");
      saveStats();
      miniGame.outcome = gainedHeart
        ? "Grodor ! La carte offre un cœur supplémentaire. +1 cœur maximum."
        : "Grodor ! La carte offre un cœur, mais les 6 places sont déjà prises. Maximum atteint.";
    } else if (result === "po") {
      state.carriedGold += 10;
      addStat("miniJeuxReussis");
      addStat("poGagnes", 10);
      saveStats();
      miniGame.outcome = "Des PO ! Le squelette paie en grinçant des dents. +10 PO.";
    } else if (result === "crane") {
      miniGame.outcome = takeDamage(1, "Un crâne ! La carte frappe Grodor avant qu'il ne puisse protester. -1 cœur.");
    } else {
      const loss = Math.min(3, state.carriedGold);
      state.carriedGold -= loss;
      miniGame.outcome = loss
        ? `Une bourse percée ! Le squelette prélève ses frais. -${loss} PO.`
        : "Une bourse percée ! Le squelette fouille, mais Grodor n'avait déjà aucune PO.";
    }

    miniGame.outcomeTone = toneFromSnapshot(before);
    miniGame.text = miniGame.outcome;
    render();
    return;
  }

  if (action === "cards-continue" && miniGame.phase === "result") {
    completeMiniGame(miniGame.outcome, miniGame.outcomeTone);
  }
}

function preloadChestDodgeAssets() {
  [
    "coffre_open.webp",
    "coffre_esquive.webp",
    "coffre_open-gagner.webp",
    "coffre_esquive-gagner.webp",
    "coffre_esquive-perdu.webp",
    ...[1, 2, 3, 4, 5, 6].flatMap((slot) => [`esquive-${slot}-ok.png`, `esquive-${slot}-eclate.png`]),
  ].forEach((file) => {
    const image = new Image();
    image.src = `${CHEST_DODGE_ASSET_PATH}/${file}`;
  });
}

function resolveChestDodgeAction(action) {
  const miniGame = state.miniGame;
  if (!miniGame || miniGame.type !== "chest") return;

  if (action === "chest-open" && miniGame.phase === "open") {
    startChestDodgeRound(miniGame);
    return;
  }

  if (action === "chest-dodge-hit" && miniGame.phase === "dodge" && miniGame.promptState === "ok") {
    clearChestDodgeRoundTimer();
    miniGame.promptState = "eclate";
    miniGame.round += 1;
    render();
    chestDodgeBurstTimer = window.setTimeout(() => {
      if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "dodge") return;
      if (miniGame.round >= miniGame.totalRounds) {
        settleChestDodge(miniGame, true);
      } else {
        startChestDodgeRound(miniGame);
      }
    }, CHEST_DODGE_BURST_MS);
    return;
  }

  if (action === "chest-continue" && miniGame.phase === "result") {
    completeMiniGame(miniGame.outcome, miniGame.outcomeTone);
  }
}

function startChestDodgeRound(miniGame) {
  clearChestDodgeTimers();
  if (!state.miniGame || state.miniGame !== miniGame || miniGame.type !== "chest") return;
  miniGame.phase = "dodge";
  miniGame.image = `${CHEST_DODGE_ASSET_PATH}/coffre_esquive.webp`;

  let slot;
  if (miniGame.previousSlot) {
    const opposites = {
      1: [5, 6],
      2: [4, 6],
      3: [4, 5],
      4: [2, 3],
      5: [1, 3],
      6: [1, 2]
    };
    const candidates = opposites[miniGame.previousSlot] || [1, 2, 3, 4, 5, 6];
    slot = candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    slot = randomInt(1, 6);
  }

  miniGame.activeSlot = slot;
  miniGame.previousSlot = slot;
  miniGame.promptState = "ok";
  miniGame.text = "";

  const roundFactor = miniGame.round * 40;
  const currentWindow = Math.max(480, 700 - roundFactor);

  chestDodgeTimer = window.setTimeout(() => {
    if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "dodge") return;
    settleChestDodge(miniGame, false);
  }, currentWindow);
  render();
}

function settleChestDodge(miniGame, won) {
  if (!state.miniGame || state.miniGame !== miniGame || miniGame.type !== "chest") return;

  clearChestDodgeTimers();
  const before = snapshotRun();
  miniGame.phase = "result";
  miniGame.activeSlot = null;
  miniGame.promptState = "ok";
  let displayText = "";

  if (won && miniGame.mode === "gain") {
    addStat("miniJeuxReussis");
    miniGame.image = `${CHEST_DODGE_ASSET_PATH}/coffre_open-gagner.webp`;
    miniGame.outcome = addGold(
      miniGame.amount,
      `Vous avez trouvé un coffre. Grodor arrache des pièces au coffre. +${miniGame.amount} PO.`
    );
    displayText = "Vous avez trouvé un coffre. Grodor arrache des pièces au coffre.";
  } else if (won && miniGame.mode === "loss") {
    addStat("miniJeuxReussis");
    saveStats();
    miniGame.image = `${CHEST_DODGE_ASSET_PATH}/coffre_esquive-gagner.webp`;
    miniGame.outcome = "Vous avez trouvé un coffre. Grodor esquive le coffre mordeur. Perte évitée.";
    displayText = miniGame.outcome;
  } else if (miniGame.mode === "gain") {
    miniGame.image = `${CHEST_DODGE_ASSET_PATH}/coffre_esquive-perdu.webp`;
    miniGame.outcome = takeDamage(
      1,
      "Vous avez trouvé un coffre. Le coffre claque trop vite et mord Grodor. Rien gagné. -1 cœur."
    );
    displayText = "Vous avez trouvé un coffre. Le coffre claque trop vite et mord Grodor. Rien gagné.";
  } else {
    const loss = Math.min(state.carriedGold, miniGame.amount);
    state.carriedGold = Math.max(0, state.carriedGold - loss);
    miniGame.image = `${CHEST_DODGE_ASSET_PATH}/coffre_esquive-perdu.webp`;
    miniGame.outcome = takeDamage(
      1,
      `Vous avez trouvé un coffre. Le coffre avale des pièces et mord Grodor. -${loss} PO. -1 cœur.`
    );
    displayText = "Vous avez trouvé un coffre. Le coffre avale des pièces et mord Grodor.";
  }

  miniGame.outcomeTone = toneFromSnapshot(before);
  miniGame.text = displayText || miniGame.outcome;

  if (state.screen === "mort") {
    setStory(miniGame.outcome, "bad");
    render();
    return;
  }

  render();
}

function clearChestDodgeRoundTimer() {
  if (chestDodgeTimer) {
    window.clearTimeout(chestDodgeTimer);
  }
  chestDodgeTimer = null;
}

function clearChestDodgeTimers() {
  clearChestDodgeRoundTimer();
  if (chestDodgeBurstTimer) {
    window.clearTimeout(chestDodgeBurstTimer);
  }
  chestDodgeBurstTimer = null;
}

function resolveArmWrestleAction(action) {
  const miniGame = state.miniGame;
  if (!miniGame || miniGame.type !== "arm") return;

  if (action === "arm-start" && miniGame.phase === "ready" && miniGame.assetsReady) {
    startArmWrestle(miniGame);
    return;
  }

  if (action === "arm-push" && miniGame.phase === "playing") {
    miniGame.totalTaps += 1;
    miniGame.recentTaps = Math.min(12, miniGame.recentTaps + 1);
    miniGame.position = Math.min(78, miniGame.position + miniGame.difficulty.tapPower * 0.62);
    miniGame.buttonPressed = true;
    if (armWrestlePressTimer) window.clearTimeout(armWrestlePressTimer);
    armWrestlePressTimer = window.setTimeout(() => {
      if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "playing") return;
      miniGame.buttonPressed = false;
      render();
    }, ARM_WRESTLE_PRESS_MS);
    updateArmWrestleFrame(miniGame);
    render();
    return;
  }

  if (action === "arm-continue" && miniGame.phase === "result") {
    if (!miniGame.continueEnabled) return;
    if (miniGame.fatal) {
      const outcome = miniGame.outcome;
      clearArmWrestle();
      state.maxLife = 0;
      state.life = 0;
      state.miniGame = null;
      endRun("mort");
      setStory(outcome, "bad");
      render();
      return;
    }
    completeMiniGame(miniGame.outcome, miniGame.outcomeTone);
  }
}

function startArmWrestle(miniGame) {
  clearArmWrestle();
  miniGame.phase = "playing";
  miniGame.startedAt = Date.now();
  miniGame.position = 0;
  miniGame.recentTaps = 0;
  miniGame.totalTaps = 0;
  miniGame.remainingMs = ARM_WRESTLE_DURATION_MS;
  miniGame.frame = "bdf-centre.webp";
  miniGame.buttonPressed = false;
  miniGame.continueEnabled = false;
  armWrestleInterval = window.setInterval(() => advanceArmWrestle(miniGame), ARM_WRESTLE_TICK_MS);
  render();
}

function preloadArmWrestleAssets(miniGame) {
  miniGame.preloadedImages = ARM_WRESTLE_FRAMES.map((frame) => {
    const image = new Image();
    image.src = `${ARM_WRESTLE_ASSET_PATH}/${frame}`;
    return image;
  });

  Promise.all(miniGame.preloadedImages.map((image) => {
    if (typeof image.decode === "function") {
      return image.decode().catch(() => {});
    }
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  })).then(() => {
    if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "ready") return;
    miniGame.assetsReady = true;
    render();
  });
}

function advanceArmWrestle(miniGame) {
  if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "playing") {
    clearArmWrestle();
    return;
  }

  miniGame.remainingMs = Math.max(0, ARM_WRESTLE_DURATION_MS - (Date.now() - miniGame.startedAt));
  const clickDrive = miniGame.recentTaps * miniGame.difficulty.tapPower * 0.4;
  const opponentDrive = miniGame.difficulty.resistance + Math.random() * 1.2;
  const wobble = (Math.random() - 0.5) * 3.4;
  miniGame.position = Math.max(-78, Math.min(78, miniGame.position + clickDrive - opponentDrive + wobble));
  miniGame.recentTaps *= 0.58;
  updateArmWrestleFrame(miniGame);

  if (miniGame.remainingMs <= 0) {
    settleArmWrestle(miniGame);
    return;
  }

  render();
}

function updateArmWrestleFrame(miniGame) {
  if (miniGame.position >= 45) {
    miniGame.frame = "bdf-gagne-2.webp";
  } else if (miniGame.position >= 16) {
    miniGame.frame = "bdf-gagne-1.webp";
  } else if (miniGame.position <= -45) {
    miniGame.frame = "bdf-perd-2.webp";
  } else if (miniGame.position <= -16) {
    miniGame.frame = "bdf-perd-1.webp";
  } else {
    miniGame.frame = "bdf-centre.webp";
  }
}

function settleArmWrestle(miniGame) {
  if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "playing") return;

  clearArmWrestle();
  const before = snapshotRun();
  const won = miniGame.position >= 16;
  miniGame.phase = "result";

  if (won) {
    const gainedHeart = gainMaxLife();
    addStat("miniJeuxReussis");
    saveStats();
    miniGame.frame = "bdf-gagne.webp";
    miniGame.outcome = gainedHeart
      ? "Grodor écrase le bras adverse ! +1 cœur maximum."
      : "Grodor écrase le bras adverse ! Le cœur promis refuse de dépasser 6. Maximum atteint.";
  } else {
    miniGame.frame = "bdf-perdu.webp";
    miniGame.fatal = state.maxLife <= 1;
    if (miniGame.fatal) {
      miniGame.outcome = "Le champion écrase Grodor. Son dernier cœur cède. -1 cœur maximum.";
    } else {
      state.maxLife -= 1;
      state.life = Math.min(state.life, state.maxLife);
      miniGame.outcome = "Le champion écrase le bras de Grodor. -1 cœur maximum.";
    }
  }

  miniGame.outcomeTone = toneFromSnapshot(before);
  miniGame.text = miniGame.outcome;
  miniGame.continueEnabled = false;
  armWrestleResultTimer = window.setTimeout(() => {
    if (!state.miniGame || state.miniGame !== miniGame || miniGame.phase !== "result") return;
    miniGame.continueEnabled = true;
    render();
  }, ARM_WRESTLE_CONTINUE_DELAY_MS);
  render();
}

function clearArmWrestle() {
  if (armWrestleInterval) {
    window.clearInterval(armWrestleInterval);
  }
  if (armWrestlePressTimer) {
    window.clearTimeout(armWrestlePressTimer);
  }
  if (armWrestleResultTimer) {
    window.clearTimeout(armWrestleResultTimer);
  }
  armWrestleInterval = null;
  armWrestlePressTimer = null;
  armWrestleResultTimer = null;
}


function clearDungeonEffectPoseTimer() {
  if (dungeonEffectPoseTimer) {
    window.clearTimeout(dungeonEffectPoseTimer);
  }
  dungeonEffectPoseTimer = null;
  setDungeonDoorTarget(null);
  setDungeonDoorPreviewTarget(null);
  $("scene")?.classList.remove("is-effect-pose");
}

function holdDungeonEffectPoseBriefly() {
  clearDungeonEffectPoseTimer();
  if (state.screen !== "dungeon" || state.inputLocked) return;

  const effectPose = state.hodorPose || "question";
  setDungeonDoorTarget(null);
  setDungeonDoorPreviewTarget(null);
  $("scene")?.classList.add("is-effect-pose");
  dungeonEffectPoseTimer = window.setTimeout(() => {
    dungeonEffectPoseTimer = null;
    $("scene")?.classList.remove("is-effect-pose");
    if (state.screen !== "dungeon" || state.inputLocked || state.hodorPose !== effectPose) return;
    state.hodorPose = "question";
    renderHodor();
  }, 3000);
}

function finalDoorOutcome() {
  const roll = Math.random();
  const difficulty = longTowerDifficulty();
  const escapeChance = difficulty === 2 ? 0.22 : difficulty === 1 ? 0.4 : 0.68;
  const bruiseChance = difficulty === 2 ? 0.76 : difficulty === 1 ? 0.86 : 0.92;

  if (roll < escapeChance) {
    state.screen = "village";
    state.runEnded = true;
    state.life = state.maxLife;
    recordWin();
    return randomFrom([
      "Grodor ouvre la porte. Il est dehors. Le donjon referme doucement, vexé.",
      "Grodor ouvre la porte. Il est dehors. Les villageois le regardent arriver, étonnés.",
      "Grodor ouvre la dernière. Dehors, le village cache mal sa surprise",
    ]);
  }

  if (roll < bruiseChance) {
    return takeDamage(1, "La dernière porte s'ouvre sur deux gardes en pause café. Ton visage devient l'ordre du jour, andouille cuirassée. -1 cœur.");
  }

  return takeDamage(2, "La dernière porte disait 'Sortie'. Le mur derrière appelle ça du marketing. -2 cœurs.");
}

function prepareDoorHints() {
  state.doorHints = ["", "", ""];
  if (state.screen !== "dungeon" || state.floor === 1) return;
  const level = upgradeLevel("lecture");
  if (Math.random() >= upgradeChance("lecture", [0.58, 0.78, 1])) return;

  const hints = doorHintPool(level);
  const index = randomInt(0, 2);
  const falseHint = Math.random() < (0.45 - level * 0.08);
  state.doorHints[index] = falseHint
    ? `Indice foireux : ${randomFrom(hints.false)}`
    : `Indice : ${randomFrom(hints.true)}`;
}

function doorHintPool(level) {
  const base = {
    true: [
      "ça sent l'or",
      "ça grogne",
      "ça pique",
      "silence suspect",
      "courant d'air",
      "ça sent la cave humide",
      "bruit de pièces",
      "ronflement pas rassurant",
      "odeur de décision nulle",
    ],
    false: [
      "panneau menteur",
      "promis juré, aucun piège",
      "odeur de victoire douteuse",
      "ça a l'air presque légal",
      "le donjon insiste beaucoup",
    ],
  };

  if (level >= 2) {
    base.true.push(
      "probable coffre ou arnaque brillante",
      "bruit de ferraille en colère",
      "escalier quelque part, peut-être même utile",
      "air frais, ou cadavre très poli",
      "quelque chose gratte la porte",
      "butin possible, humiliation certaine"
    );
    base.false.push(
      "un bruit louche, ou juste un mensonge administratif",
      "la porte fait semblant d'être gentille",
      "ça clignote comme une mauvaise idée",
      "l'inscription a été écrite par un mur",
      "très bon choix selon la porte, donc méfiance"
    );
  }

  if (level >= 3) {
    base.true.push(
      "forte chance de combat",
      "ça ressemble à du butin",
      "risque de baffe, pas forcément de mort",
      "possible raccourci vertical",
      "odeur de boutique sans vendeur",
      "statistiquement moins honteux"
    );
    base.false.push(
      "indice premium, donc probablement nul",
      "la porte essaye trop fort",
      "statistiquement ridicule, donc tentant",
      "Grodor comprend l'indice, mauvais signe",
      "le panneau transpire la confiance"
    );
  }

  return base;
}

function startCombat(monster) {
  if (state.activePact === "temerite") {
    if (Math.random() < 0.80) {
      const gold = randomInt(monster.reward[0], monster.reward[1]);
      addStat("combatsGagnes");
      return addGold(gold, `(Pacte de Témérité) Grodor fronce les sourcils. Une aura de pure violence émane de lui. ${monster.name} s'autodétruit de terreur pure ! Le hasard fait semblant d'être ton ami. +${gold} PO.`);
    } else {
      endRun("mort");
      return `(Pacte de Témérité) Grodor tente un regard intimidant. C'est un échec cuisant. ${monster.name} ne sourit pas et élimine Grodor d'une simple claque cosmique.`;
    }
  }

  state.screen = "combat";
  state.combat = monster;
  state.combatHp = monster.life;
  state.combatArenaKey = randomCombatArenaKey();
  state.hodorPose = "idle";
  state.combatStrike = "";
  state.combatImpact = "";
  state.renderedCombatHp = null;
  return `${monster.intro} Grodor doit attaquer, aide-le à choisir.`;
}

function resolveCombat(strike) {
  if (state.screen !== "combat" || !state.combat || state.inputLocked) return;

  const monster = state.combat;
  const before = snapshotRun();
  state.inputLocked = true;
  state.hodorPose = "combat";
  state.combatStrike = strike;
  state.combatImpact = "windup";
  render();

  window.setTimeout(() => {
    if (state.screen !== "combat" || state.combat !== monster) return;
    state.hodorPose = "combat-2";
    state.combatImpact = "hit";
    render();
  }, 720);

  window.setTimeout(() => {
    if (state.screen !== "combat" || state.combat !== monster) return;
    state.hodorPose = "combat-3";
    state.combatImpact = "aftermath";
    render();
  }, 1280);

  window.setTimeout(() => {
    const outcome = combatOutcome(monster, strike);
    state.inputLocked = false;
    state.combatStrike = "";
    state.combatImpact = "";

    if (!state.runEnded && !outcome.defeated) {
      state.hodorPose = "idle";
      setStory(outcome.text, outcome.hit ? "good" : toneFromSnapshot(before));
    } else if (!state.runEnded) {
      state.combat = null;
      state.combatHp = 0;
      state.combatArenaKey = "";
      state.screen = "dungeon";
      setStory(outcome.text + completeDungeonStep(), toneFromSnapshot(before));
      if (!state.runEnded) {
        prepareDoorHints();
      }
    } else {
      state.combatHp = 0;
      setStory(outcome.text, toneFromSnapshot(before));
    }
    render();
  }, 2000);
}

function combatOutcome(monster, strike) {
  const profile = {
    head: { win: 0.42, hurt: 0.28, loseItem: 0.16, death: monster.danger + 0.08 },
    legs: { win: 0.55, hurt: 0.25, loseItem: 0.14, death: monster.danger - 0.04 },
    torso: { win: 0.5, hurt: 0.3, loseItem: 0.12, death: monster.danger },
  }[strike];

  let winChance = profile.win;
  let deathChance = Math.max(0.03, profile.death);
  const usedItems = [];

  if (hasItem("Hache Emoussee") && strike !== "legs") {
    winChance += 0.12;
    usedItems.push("Hache Emoussee");
  }
  if (hasItem("Casque Trop Petit") && strike === "head") {
    deathChance -= 0.06;
    usedItems.push("Casque Trop Petit");
  }
  if (hasItem("Sandales de Panique") && strike === "legs") {
    winChance += 0.1;
    usedItems.push("Sandales de Panique");
  }
  if (hasItem("Slip de Guerre")) {
    deathChance -= 0.03;
    usedItems.push("Slip de Guerre");
  }

  const roll = Math.random();
  const strikeText = strikeStoryText(strike);

  if (roll < deathChance) {
    return {
      text: useCombatItems(instantDeath(`${strikeText} ${monster.name} corrige ton optimisme.`), usedItems, strike),
      defeated: false,
      hit: false,
    };
  }

  if (roll < deathChance + profile.loseItem && state.inventory.length) {
    const lost = removeRandomItem();
    const story = monster === monsters.skeleton && strike === "torso"
      ? "Tu tapes dans le torse. Le squelette bâille. Grodor panique et lâche un objet en fuyant."
      : `${strikeText} Tu survis, mais ${monster.name} pulvérise ton objet.`;
    return {
      text: useCombatItems(`${story} Effet : Objet perdu : ${lost}.`, usedItems, strike),
      defeated: false,
      hit: false,
    };
  }

  if (roll < deathChance + profile.loseItem + profile.hurt) {
    const story = monster === monsters.skeleton && strike === "head"
      ? "Tu vises la tête. Le squelette la retire par habitude. Grodor frappe le vide et perd l’équilibre."
      : `${strikeText} ${monster.name} refuse ton brouillon tactique, pauvre tanche.`;
    return {
      text: useCombatItems(takeDamage(1, `${story} -1 cœur.`), usedItems, strike),
      defeated: false,
      hit: false,
    };
  }

  if (roll < deathChance + profile.loseItem + profile.hurt + winChance) {
    state.combatHp = Math.max(0, state.combatHp - 1);
    if (state.combatHp > 0) {
      return {
        text: useCombatItems(`${strikeText} ${monster.name} vacille, mais reste debout juste pour être pénible.`, usedItems, strike),
        defeated: false,
        hit: true,
      };
    }
    const gold = randomInt(monster.reward[0], monster.reward[1]);
    addStat("combatsGagnes");
    return {
      text: useCombatItems(addGold(gold, `${strikeText} Le hasard fait semblant d'être ton ami. +${gold} PO.`), usedItems, strike),
      defeated: true,
      hit: true,
    };
  }

  return {
    text: useCombatItems(`${strikeText} Vous vous ratez tous les deux. Le silence juge la scène.`, usedItems, strike),
    defeated: false,
    hit: false,
  };
}

function useCombatItems(text, items, strike) {
  const consumed = [];
  const item = items.find((candidate) => hasItem(candidate));
  if (item) {
    if (Math.random() < itemBreakChance(item)) {
      removeItem(item);
      consumed.push(item);
    } else if (strike === "torso") {
      return `${text} L’objet cogne, grince, puis tient bon. Grodor le regarde avec un respect nouveau. Effet : Objet intact.`;
    } else if (strike === "legs") {
      return `${text} Son objet tient encore debout. Par miracle. Effet : Objet intact.`;
    } else {
      return `${text} ${item} a servi, mais ne casse pas cette fois. Le matériel demande des témoins.`;
    }
  }

  if (!consumed.length) return text;
  return `${text} Objet utilisé puis perdu : ${consumed.join(", ")}.`;
}

function itemBreakChance(item) {
  if (item === "Medaillon du Presque-Heros") return 1;
  if (item === "Slip de Guerre") return 0.45;
  return 0.35;
}

function strikeStoryText(strike) {
  if (strike === "head") return "Tu vises la tête.";
  if (strike === "legs") return "Grodor s’avance, trébuche, et frappe les jambes dans un grand fracas.";
  return "Tu tapes dans le torse.";
}

function longTowerDifficulty() {
  if (state.totalFloors >= 25) return 2;
  if (state.totalFloors >= 20) return 1;
  return 0;
}

function longTowerHazard() {
  const difficulty = longTowerDifficulty();
  const chance = difficulty === 2 ? 0.22 : difficulty === 1 ? 0.12 : 0;
  if (!chance || Math.random() >= chance) return "";

  return takeDamage(1, randomFrom([
    " Plus la tour est haute, plus elle a le temps de devenir méchante. Une dalle jalouse te gifle. -1 cœur.",
    " La tour remarque que tu tiens encore debout et corrige cet oubli avec un gravat. -1 cœur.",
    " Vingt étages de rancune tombent du plafond sous forme de brique. -1 cœur.",
  ]));
}

function completeDungeonStep() {
  if (state.runEnded || state.screen !== "dungeon") return "";
  const hazard = longTowerHazard();
  if (state.runEnded || state.screen !== "dungeon") return hazard;
  return hazard + descendFloor();
}

function descendFloor() {
  const previousFloor = state.floor;
  if (state.floorShift) {
    state.floor += state.floorShift;
    state.floor = Math.min(state.totalFloors, state.floor);
    state.floorShift = 0;
  } else {
    state.floor -= 1;
  }
  addStat("etagesVisites", Math.max(1, previousFloor - state.floor));
  saveStats();

  let bloodText = "";
  if (state.activePact === "sang" && state.floor > 0 && previousFloor !== state.floor) {
    if (Math.random() < 0.35) {
      state.life -= 1;
      addStat("degatsSubis", 1);
      saveStats();
      if (state.life <= 0) {
        state.life = 0;
        endRun("mort");
        bloodText = " (Pacte de Sang : Tes veines se déchirent à la marche. Tu succombes au saignement !)";
      } else {
        bloodText = " (Pacte de Sang : Tes veines se déchirent. Tu perds 1 cœur !)";
      }
    }
  }

  if (state.floor <= 0) {
    state.screen = "village";
    state.runEnded = true;
    state.life = state.maxLife;
    recordWin();
    return " Grodor voit enfin la sortie. Il a survécu, ce qui surprend tout le monde, surtout lui." + bloodText;
  }
  return bloodText;
}

function shiftFloors(amount) {
  state.floorShift = amount;
}

function recordWin() {
  if (state.winRecorded) return;
  playVictorySound();
  void clearActiveRunNow();
  state.winRecorded = true;
  state.showWinBanner = true;
  state.villageLocation = "Enfin dehors";
  addStat("sortiesReussies");
  state.stats.wins = state.stats.sortiesReussies;
  state.winBannerText = winTaunt();
  saveStats();
}

function koTaunt() {
  if (state.koBannerText) return state.koBannerText;
  const losses = Math.max(1, state.runLosses);
  const taunts = [
    "ONE SHOOT, GROS NUL. Le panneau Perdu vient de te gifler avec de la typographie.",
    "Non mais on t'a aidé pour être aussi mauvais, ou c'est du talent brut ?",
    "Tu te fous de qui pour rater un donjon sans boss, vieille quiche molle ?",
    `Défaite numéro ${losses}. À ce stade, même le tutoriel demanderait un tuteur.`,
    "T'es trop nul. Pas nul normal: nul avec finition artisanale.",
    "Le donjon n'avait même pas mis son pantalon de combat, et tu t'es couché quand même.",
    "Retour aux geôles. Même la serrure a demandé à changer de héros.",
    "Franchement, là, Grodor a joué comme un PNJ de fond de taverne.",
  ];
  state.koBannerText = randomFrom(taunts);
  return state.koBannerText;
}

function winTaunt() {
  if (state.winBannerText) return state.winBannerText;
  const wins = Math.max(1, state.stats.wins);
  const taunts = [
    "Franchement GG mon gars. Même le donjon a vérifié les logs.",
    "Hé bé, well played. Le village est étonné de te revoir en un seul morceau.",
    "Victoire validée. Les anciens disent que c'est louche, mais ils applaudissent quand même.",
    `Sortie numéro ${wins}. Grodor commence à ressembler à un bug exploitable.`,
    "GG, presque-héros. La taverne t'offre un regard moins méprisant que d'habitude.",
    "Bien joué, espèce de sac à surprises. Personne n'avait misé plus de trois croûtons.",
    "Le donjon annonce une enquête interne. Tu étais censé perdre, techniquement.",
    "Grodor est vivant. Le village spamme /clap par prudence.",
  ];
  state.winBannerText = randomFrom(taunts);
  return state.winBannerText;
}


function flashDoor(door) {
  $("doors").classList.add("resolving");
  door.classList.remove("chosen");
  requestAnimationFrame(() => {
    door.classList.add("chosen");
  });
}

function resetDoorEffects() {
  $("doors").classList.remove("resolving");
  $("scene")?.classList.remove("is-door-walking");
  setDungeonDoorTarget(null);
  setDungeonDoorPreviewTarget(null);
  document.querySelectorAll(".door").forEach((door) => {
    door.classList.remove("chosen");
    door.blur();
  });
  if (document.activeElement?.classList?.contains("door")) {
    document.activeElement.blur();
  }
}

function setDungeonDoorTarget(doorIndex) {
  const scene = $("scene");
  if (!scene) return;
  scene.classList.remove("door-target-0", "door-target-1", "door-target-2");
  if (doorIndex === "0" || doorIndex === "1" || doorIndex === "2") {
    scene.classList.add(`door-target-${doorIndex}`);
  }
}

function setDungeonDoorPreviewTarget(doorIndex) {
  const scene = $("scene");
  if (!scene) return;
  scene.classList.remove("door-preview-target-0", "door-preview-target-1", "door-preview-target-2");
  if (doorIndex === "0" || doorIndex === "1" || doorIndex === "2") {
    scene.classList.add(`door-preview-target-${doorIndex}`);
  }
}

function addGold(amount, text) {
  const stickyGlovesBonus = hasItem("Gants Collants") && Math.random() < 0.35 ? 1 : 0;
  let gained = amount + stickyGlovesBonus;
  let suffix = "";

  if (state.activePact === "midas") {
    gained *= 2;
    suffix = " (Pacte de Midas : Or doublé !)";
  } else if (stickyGlovesBonus) {
    suffix = " Les gants collants ramassent 1 PO de plus, et probablement autre chose.";
  }

  if (gained > 0) {
    playCoinSound();
  }

  state.carriedGold += gained;
  addStat("poGagnes", gained);
  saveStats();
  return text + suffix;
}

function withoutPreventedDamageEffect(text) {
  return cleanupStorySentence(String(text).replace(/-\d+\s*(?:cœurs?|coeur)(?:\s+bonus)?/gi, ""));
}

function takeDamage(amount, text) {
  if (state.godMode) {
    return `${text} God mode absorbe le dégât. Grodor ne comprend pas, mais il approuve.`;
  }

  if (state.activePact === "midas") {
    state.life -= amount;
    addStat("degatsSubis", amount);
    saveStats();
    if (state.life <= 0) {
      state.life = 0;
      endRun("mort");
    }
    return `${text} (Pacte de Midas : Le plomb t'empêche d'esquiver !)`;
  }

  if (hasItem("Boulet au Pied") && Math.random() < 0.18) {
    text = `${text} Le boulet au pied rend l'esquive impossible. Il fait un bruit humiliant.`;
  }

  if (Math.random() < upgradeChance("reflexes", [0.16, 0.26, 0.38])) {
    const dodgedText = withoutPreventedDamageEffect(text);
    if (state.inventory.length && Math.random() < 0.25) {
      const lost = removeRandomItem();
      return `${dodgedText} Réflexes de Lâche déclenche une esquive, mais ${lost} reste sur place pour couvrir la retraite.`;
    }
    return `${dodgedText} Réflexes de Lâche déclenche une esquive moche mais efficace.`;
  }

  if (hasItem("Cape Trop Longue") && Math.random() < 0.12) {
    removeItem("Cape Trop Longue");
    state.life -= 1;
    addStat("degatsSubis", 1);
    saveStats();
    if (state.life <= 0) {
      state.life = 0;
      endRun("mort");
    }
    return `${text} La cape trop longue s'enroule autour de tes jambes. -1 cœur bonus, puis elle se déchire.`;
  }

  if (hasItem("Sandales de Panique") && Math.random() < 0.16) {
    removeItem("Sandales de Panique");
    return `${withoutPreventedDamageEffect(text)} Mais tes sandales paniquent avant toi et t'évitent le pire. Elles partent ensuite vivre leur propre vie.`;
  }

  if (hasItem("Casque Trop Petit") && Math.random() < 0.22) {
    removeItem("Casque Trop Petit");
    return `${withoutPreventedDamageEffect(text)} Le casque trop petit bloque le coup, comprime une pensée inutile, puis se fend en deux.`;
  }

  state.life -= amount;
  addStat("degatsSubis", amount);
  saveStats();
  if (state.life <= 0) {
    if (hasItem("Medaillon du Presque-Heros")) {
      removeItem("Medaillon du Presque-Heros");
      state.life = 1;
      return `${withoutPreventedDamageEffect(text)} Médaillon du Presque-Héros explose et refuse la mort. Grodor ne comprend pas la procédure, mais il vit.`;
    }
    state.life = 0;
    endRun("mort");
  }
  return text;
}

function instantDeath(text) {
  if (state.godMode) {
    return `${text} God mode refuse la mort avec une mauvaise foi admirable.`;
  }

  if (hasItem("Medaillon du Presque-Heros")) {
    removeItem("Medaillon du Presque-Heros");
    return `${text} Médaillon du Presque-Héros explose et annule la catastrophe. Grodor hoche la tête comme s'il avait prévu le coup.`;
  }

  const pityChance = Math.min(0.45, state.runLosses * 0.08);
  if (pityChance && Math.random() < pityChance) {
    return takeDamage(1, `${text} Le donjon hésite devant tant d'échec et transforme ça en grosse baffe. -1 cœur.`);
  }

  if (Math.random() < upgradeChance("instinct", [0.18, 0.3, 0.44])) {
    return `${text} Instinct Presque Fiable invente une esquive beaucoup trop tardive, mais techniquement vivante.`;
  }

  endRun("mort");
  return text;
}

function endRun(screen) {
  void clearActiveRunNow();
  state.screen = screen;
  state.runEnded = true;
  state.combat = null;
  state.combatHp = 0;
  state.combatArenaKey = "";
  state.miniGame = null;
  if (screen === "mort") {
    state.life = 0;
    state.carriedGold = 0;
    applyInventoryLossEffects(state.inventory);
    state.inventory = [];
    addStat("mortsRidicules");
    recordLoss();
  }
}

function recordLoss() {
  if (state.lossRecorded || state.winRecorded) return;
  playDefeatSound();
  state.lossRecorded = true;
  state.runLosses += 1;
  addStat("humiliations");
  state.stats.losses = state.stats.humiliations;
  state.koBannerText = koTaunt();
  saveStats();
}

function depositGold() {
  if (state.screen !== "village") return;
  state.showWinBanner = false;
  state.villageLocation = "Banque";
  const deposited = state.carriedGold;
  state.bankGold += deposited;
  state.stats.goldBankedTotal = (state.stats.goldBankedTotal || 0) + deposited;
  state.carriedGold = 0;
  saveBankGold(state.bankGold);
  saveStats();
  setStory(bankDepositText(deposited), deposited ? "good" : "neutral");
  render();
}

function sellStuffAtVillage() {
  if (state.screen !== "village") return;
  state.showWinBanner = false;
  state.villageLocation = "Comptoir de revente";
  const soldItems = sellSelectedInventory();
  if (soldItems.total) {
    state.carriedGold += soldItems.total;
  }
  selectedSaleItems.clear();
  setStory(sellStuffText(soldItems), soldItems.total ? "good" : "neutral");
  renderShop();
  render();
}

function sellSelectedInventory() {
  const selectedItems = state.inventory.filter((item) => selectedSaleItems.has(item));
  if (!selectedItems.length) {
    return { total: 0, details: [] };
  }

  const details = selectedItems.map((item) => ({
    item,
    value: itemSaleValues[item] ?? 1,
  }));
  const total = details.reduce((sum, entry) => sum + entry.value, 0);
  details.forEach((entry) => applySoldItemEffect(entry.item));
  state.inventory = state.inventory.filter((item) => !selectedSaleItems.has(item));
  return { total, details };
}

function applySoldItemEffect(item) {
  applyItemLossEffect(item);
}

function bankDepositText(deposited) {
  if (!deposited) {
    return "Grodor tend sa bourse au banquier. Le banquier la retourne. Rien. Il montre la sortie.";
  }

  return `Grodor pose sa bourse sur le comptoir. Le banquier compte les PO, les range dans son coffre, puis lui rend sa bourse vide en montrant la sortie. Total sauvegarde : ${deposited} PO.`;
}

function sellStuffText(soldItems) {
  if (!soldItems.details.length) {
    return "Le revendeur inspecte ton sac vide avec une loupe. Il appelle ça une estimation rapide.";
  }

  return `Grodor pose ${soldItems.details.length} objet${soldItems.details.length > 1 ? "s" : ""} sur le comptoir. Le revendeur le regarde à peine, lâche quelques PO, puis le cache très vite sous la table. +${soldItems.total} PO.`;
}

function openCellDoor() {
  if (state.screen !== "cell") return;
  if (cellOpenTimer) return;

  markCellTutorialSeen();
  $("scene")?.classList.add("is-cell-opening");
  $("restart-action").disabled = true;
  cellOpenTimer = window.setTimeout(() => {
    cellOpenTimer = null;
    $("scene")?.classList.remove("is-cell-opening");
    $("restart-action").disabled = false;
    startRun();
  }, CELL_OPEN_DELAY_MS);
}

function returnToCellFromDeath() {
  if (state.screen !== "mort") return;
  state.screen = "cell";
  state.runEnded = true;
  state.combat = null;
  state.combatHp = 0;
  state.combatArenaKey = "";
  state.doorHints = [];
  state.inputLocked = false;
  state.floorShift = 0;
  state.miniGamesEncountered = 0;
  state.hodorPose = "idle";
  setStory("Grodor se réveille dans sa geôle. Le sol refuse de commenter ce qu'il vient de voir.");
  render();
}

function startRun() {
  const resetLossStreak = state.screen === "village" || state.screen === "shop";
  const floorRange = runFloorRange();
  state.showWinBanner = false;
  state.villageLocation = "Village";
  state.screen = "dungeon";
  state.totalFloors = randomInt(floorRange.min, floorRange.max);
  state.floor = state.totalFloors;
  state.life = START_LIFE;
  state.maxLife = START_LIFE;
  state.runEnded = false;
  state.combat = null;
  state.combatHp = 0;
  state.combatArenaKey = "";
  state.doorHints = [];
  state.inputLocked = false;
  state.floorShift = 0;
  state.miniGamesEncountered = 0;
  if (resetLossStreak) {
    state.runLosses = 0;
  }
  state.lossRecorded = false;
  state.winRecorded = false;
  state.koBannerText = "";
  state.winBannerText = "";
  state.activePact = null;
  addStat("runsTotal");
  saveStats();
  applyRunUpgrades();
  prepareDoorHints();
  setStory("Grodor force la porte de sa cellule. Devant lui : trois portes, trois choix, et l’illusion d’une bonne idée.");
  state.hodorPose = "question";
  render();
}

function goToCellFromTavern() {
  state.showWinBanner = false;
  state.villageLocation = "Taverne";
  state.screen = "cell";
  state.runEnded = true;
  state.runLosses = 0;
  state.combat = null;
  state.combatHp = 0;
  state.combatArenaKey = "";
  state.miniGame = null;
  state.doorHints = [];
  state.inputLocked = false;
  state.floorShift = 0;
  state.hodorPose = "idle";
  closeShop();
  closeStatsPanel();
  closeInventory();
  closeAccountPopover();
  setStory("Grodor entre à la taverne. Une chope plus tard, il se réveille dans les geôles. C’est reparti pour un tour.");
  render();
}

function runFloorRange() {
  const wins = state.stats.wins;
  if (wins < 10) return { min: 5, max: 10 };
  if (wins < 20) return { min: 5, max: 15 };
  if (wins < 30) return { min: 5, max: 20 };
  if (wins < 40) return { min: 5, max: 25 };
  return { min: 5, max: 30 };
}

function applyRunUpgrades() {
  if (Math.random() < upgradeChance("cardio", [0.35, 0.5, 0.68])) {
    if (Math.random() < 0.82) {
      gainMaxLife();
    } else {
      state.maxLife = Math.max(1, state.maxLife - 1);
      state.life = Math.min(state.life, state.maxLife);
    }
  }

  if (Math.random() < upgradeChance("colis", [0.36, 0.52, 0.7])) {
    const item = randomStartingItem();
    state.inventory.push(item);
    applyItemGainEffect(item);
  }
}

function randomStartingItem() {
  const items = [
    "Casque Trop Petit",
    "Medaillon du Presque-Heros",
    "Sandales de Panique",
    "Hache Emoussee",
    "Boulet au Pied",
    "Chaussette Porte-Bonheur",
    "Caillou Affectif",
    "Cape Trop Longue",
    "Gants Collants",
  ];
  return items[randomInt(0, items.length - 1)];
}

function randomDungeonItemText() {
  const item = randomStartingItem();
  if (item === "Casque Trop Petit") {
    return addItem(item, "Grodor trouve un casque. Il l’enfonce sur sa tête. Il entend le casque dire : « Gryffondor. » Effet : Casque Trop Petit.");
  }
  if (item === "Hache Emoussee") {
    return addItem(item, "Grodor ramasse la hache. Même Gimli demanderait un reçu. Effet : Hache Emoussee.");
  }
  return addItem(item, `${randomFrom([
    "Grodor lève l’objet fièrement. « Mon précieux ! » Le donjon explose de rire.",
    "Grodor approche l’objet de son oreille. Une voix murmure depuis l’intérieur. Il sourit. L’objet avait pourtant l’air inquiet.",
    "Grodor glisse l’objet dans son sac. Le sac pousse un petit soupir.",
    "Grodor range l’objet. Quelque chose dans sa poche change de place tout seul.",
  ])} Effet : ${item}.`);
}

function resetBank() {
  state.bankGold = 0;
  saveBankGold(0);
  setStory("La banque est vidée. Le banquier sourit, ce qui n'est jamais bon signe.");
  $("debug-panel").hidden = true;
  $("debug-toggle").setAttribute("aria-expanded", "false");
  render();
}

function toggleDebug() {
  const panel = $("debug-panel");
  panel.hidden = !panel.hidden;
  $("debug-toggle").setAttribute("aria-expanded", String(!panel.hidden));
}

function toggleGodMode() {
  state.godMode = !state.godMode;
  render();
}

function debugBankAmount() {
  const value = Number($("debug-bank-amount").value || 0);
  return Math.max(0, Math.floor(value));
}

function debugAddBank() {
  const amount = debugBankAmount();
  state.bankGold += amount;
  saveBankGold(state.bankGold);
  setStory(`Debug : ${amount} PO ajoutés à la banque. Le banquier n'a rien vu, officiellement.`);
  render();
}

function debugGoVillage() {
  state.screen = "village";
  state.showWinBanner = false;
  state.villageLocation = "Village";
  state.floor = 0;
  state.runEnded = true;
  state.combat = null;
  state.combatHp = 0;
  state.combatArenaKey = "";
  state.miniGame = null;
  state.doorHints = [];
  setStory("Debug : Grodor apparaît au village sans explication crédible.");
  render();
}

function renderDebugEvents() {
  const list = $("debug-event-list");
  if (!list || typeof eventPool === "undefined") return;

  const miniGameEvents = [
    { type: "double", label: "Pile ou face - Quitte ou double" },
    { type: "cards", label: "Bonneteau" },
    { type: "arm", label: "Bras de fer" },
    { type: "slots", label: "Machine à sous" },
    { type: "pact", label: "Marchand d'Ombres (Pactes)" },
  ];

  list.textContent = "";
  miniGameEvents.forEach((event) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.debugEvent = event.type;
    button.textContent = event.label;
    button.addEventListener("click", () => debugRunMiniGame(event.type));
    list.appendChild(button);
  });
}

function debugRunMiniGame(type) {
  state.screen = "dungeon";
  state.runEnded = false;
  state.showWinBanner = false;
  state.inputLocked = false;
  state.lossRecorded = false;
  state.winRecorded = false;
  state.miniGame = null;
  state.combat = null;
  state.combatHp = 0;
  state.combatArenaKey = "";
  state.doorHints = [];
  state.floorShift = 0;
  state.totalFloors = Math.max(state.totalFloors || 10, 10);
  state.floor = Math.max(2, Math.min(state.floor || state.totalFloors, state.totalFloors));
  state.maxLife = Math.min(MAX_LIFE, Math.max(state.maxLife || START_LIFE, START_LIFE));
  state.life = Math.max(1, Math.min(state.life || state.maxLife, state.maxLife));
  state.hodorPose = "question";

  const msg = type === "pact" ? startPactMiniGame() : startMiniGame(type);
  setStory(msg, "neutral");
  $("debug-panel").hidden = true;
  $("debug-toggle").setAttribute("aria-expanded", "false");
  render();
}

function debugStartCombat(monsterId) {
  const monster = monsters[monsterId] || monsters.rat;
  state.runEnded = false;
  state.showWinBanner = false;
  state.inputLocked = false;
  state.lossRecorded = false;
  state.winRecorded = false;
  state.floor = state.floor > 0 ? state.floor : randomInt(5, 10);
  state.maxLife = Math.min(MAX_LIFE, Math.max(state.maxLife || START_LIFE, START_LIFE));
  state.life = Math.max(1, Math.min(state.life || state.maxLife, state.maxLife));
  state.doorHints = [];
  $("debug-panel").hidden = true;
  $("debug-toggle").setAttribute("aria-expanded", "false");
  setStory(startCombat(monster), "neutral");
  render();
}

function debugAddStuff(item) {
  if (!itemDescriptions[item]) {
    setStory("Debug : objet introuvable. Même le menu triche vient de rater son jet.");
    render();
    return;
  }

  const alreadyEquipped = hasItem(item);
  if (!alreadyEquipped) {
    state.inventory.push(item);
    applyItemGainEffect(item);
  }

  state.hodorPose = "victory";
  setStory(
    alreadyEquipped
      ? `Debug : ${item} est déjà dans les poches. Grodor insiste quand même pour avoir l'air équipé.`
      : `Debug : ${item} ajouté. Grodor parade avec un sérieux inquiétant.`,
    alreadyEquipped ? "neutral" : "good"
  );
  render();
}

function debugClearStuff() {
  applyInventoryLossEffects(state.inventory);
  state.inventory = [];
  state.hodorPose = "question";
  setStory("Debug : stuff vide. Grodor regarde ses mains comme si c'était un plan.");
  render();
}

function renderShop() {
  const grid = $("upgrade-grid");
  grid.textContent = "";
  grid.classList.toggle("is-sell-grid", shopPanelMode === "sell");

  const header = document.querySelector("#shop-panel .shop-header div");
  if (header) {
    header.innerHTML = "";
    const eyebrow = document.createElement("span");
    const title = document.createElement("strong");
    eyebrow.textContent = shopPanelMode === "sell" ? "Comptoir de revente" : "Échoppe Douteuse";
    title.textContent = shopPanelMode === "sell"
      ? "Choisis les objets à vendre"
      : "Améliorations permanentes, résultats discutables";
    header.append(eyebrow, title);
  }

  if (shopPanelMode === "sell") {
    renderSellPanel(grid);
    return;
  }

  Object.entries(upgradeDefinitions).forEach(([id, upgrade]) => {
    const level = upgradeLevel(id);
    const cost = upgrade.costs[level];
    const card = document.createElement("article");
    card.className = "upgrade-card";

    const title = document.createElement("strong");
    title.textContent = upgrade.name;

    const meta = document.createElement("span");
    meta.textContent = `Niveau ${level} / ${upgrade.costs.length}`;

    const desc = document.createElement("p");
    desc.textContent = upgrade.description;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = cost === undefined ? "Maximum" : `Acheter - ${cost} PO`;
    button.disabled = cost === undefined || state.bankGold < cost;
    button.addEventListener("click", () => buyUpgrade(id));

    card.append(title, meta, desc, button);
    grid.appendChild(card);
  });
}

function renderSellPanel(grid) {
  if (!state.inventory.length) {
    const empty = document.createElement("article");
    empty.className = "sell-empty";
    empty.textContent = "Sac vide. Le revendeur range déjà sa calculette avec mépris.";
    grid.appendChild(empty);
    return;
  }

  state.inventory.forEach((item) => {
    const value = itemSaleValues[item] ?? 1;
    const selected = selectedSaleItems.has(item);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "sell-item-card";
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
    card.dataset.saleItem = item;

    const image = document.createElement("img");
    image.src = inventoryIconPaths[item] || "";
    image.alt = "";

    const text = document.createElement("span");
    const name = document.createElement("strong");
    const price = document.createElement("small");
    name.textContent = item;
    price.textContent = `${value} PO`;
    text.append(name, price);

    card.append(image, text);
    card.addEventListener("click", () => toggleSaleItem(item));
    grid.appendChild(card);
  });

  const selectedDetails = state.inventory
    .filter((item) => selectedSaleItems.has(item))
    .map((item) => ({ item, value: itemSaleValues[item] ?? 1 }));
  const selectedTotal = selectedDetails.reduce((sum, entry) => sum + entry.value, 0);

  const actions = document.createElement("div");
  actions.className = "sell-actions";

  const summary = document.createElement("span");
  summary.textContent = `${selectedDetails.length} objet${selectedDetails.length > 1 ? "s" : ""} sélectionné${selectedDetails.length > 1 ? "s" : ""} - ${selectedTotal} PO`;

  const selectAll = document.createElement("button");
  selectAll.type = "button";
  selectAll.textContent = selectedDetails.length === state.inventory.length ? "Tout désélectionner" : "Tout sélectionner";
  selectAll.addEventListener("click", () => {
    if (selectedSaleItems.size === state.inventory.length) {
      selectedSaleItems.clear();
    } else {
      selectedSaleItems = new Set(state.inventory);
    }
    renderShop();
  });

  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.className = "sell-confirm";
  confirm.textContent = selectedTotal ? `Vendre - ${selectedTotal} PO` : "Vendre";
  confirm.disabled = !selectedDetails.length;
  confirm.addEventListener("click", sellStuffAtVillage);

  actions.append(summary, selectAll, confirm);
  grid.appendChild(actions);
}

function toggleSaleItem(item) {
  if (selectedSaleItems.has(item)) {
    selectedSaleItems.delete(item);
  } else {
    selectedSaleItems.add(item);
  }
  renderShop();
}

function addItem(item, text) {
  if (!hasItem(item)) {
    state.inventory.push(item);
    applyItemGainEffect(item);
    state.eventToneOverride = "good";
    addStat("objetsRamasses");
    saveStats();
    return text;
  }
  state.eventToneOverride = "bad";
  return itemDuplicateTexts[item] || `Tu trouves ${item}, mais tu l'as déjà. Dommage. Le donjon ricane doucement.`;
}

function removeItem(item) {
  const hadItem = hasItem(item);
  state.inventory = state.inventory.filter((owned) => owned !== item);
  if (hadItem) {
    applyItemLossEffect(item);
  }
}

function removeRandomItem() {
  const index = randomInt(0, state.inventory.length - 1);
  const item = state.inventory[index];
  state.inventory.splice(index, 1);
  applyItemLossEffect(item);
  return item;
}

function hasItem(item) {
  return state.inventory.includes(item);
}

function toggleInventory() {
  if (isAccountPanelOpen()) return;
  const popover = $("inventory-popover");
  const toggle = $("inventory-toggle");
  const shouldOpen = popover.hidden;
  popover.hidden = !shouldOpen;
  toggle.setAttribute("aria-expanded", String(shouldOpen));
}

function closeInventory() {
  const popover = $("inventory-popover");
  const toggle = $("inventory-toggle");
  if (!popover || popover.hidden) return;
  popover.hidden = true;
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

function renderInventory() {
  const inventory = $("inventory");
  const toggle = $("inventory-toggle");
  inventory.textContent = "";
  if (toggle) {
    toggle.classList.toggle("has-items", state.inventory.length > 0);
  }

  if (!state.inventory.length) {
    const empty = document.createElement("p");
    empty.className = "inventory-empty";
    empty.textContent = "Aucun objet dans le sac. Beaucoup d'assurance, par contre.";
    inventory.appendChild(empty);
    return;
  }

  state.inventory.forEach((item) => {
    const icon = inventoryIconPaths[item];
    if (icon) {
      const button = document.createElement("button");
      button.className = "inventory-item";
      button.type = "button";
      button.dataset.tooltip = itemDescriptions[item] || "Objet mystère. Même le donjon a perdu la notice.";

      const image = document.createElement("img");
      image.src = icon;
      image.alt = item;

      const label = document.createElement("span");
      label.textContent = item;

      button.append(image, label);
      inventory.appendChild(button);
      return;
    }

    const chip = document.createElement("span");
    chip.className = "item-chip inventory-fallback";
    chip.tabIndex = 0;
    chip.textContent = item;
    chip.dataset.tooltip = itemDescriptions[item] || "Objet mystère. Même le donjon a perdu la notice.";
    inventory.appendChild(chip);
  });
}

function renderUpgradeSummary() {
  const summary = $("upgrade-summary");
  summary.textContent = "";

  if (state.activePact) {
    const pactNames = {
      midas: "Pacte de Midas",
      temerite: "Pacte de Témérité",
      sang: "Pacte de Sang",
    };
    const pactDescs = {
      midas: "Or doublé, mais toutes les esquives de dégâts sont impossibles !",
      temerite: "Combat : 80% de chance d'auto-victoire instantanée, 20% de mort subite sans aucun joker !",
      sang: "Vitalité accrue (+3 cœurs max), mais 35% de chance de saigner de -1 cœur par étage.",
    };
    const chip = document.createElement("span");
    chip.className = "upgrade-chip pact-chip";
    chip.style.borderColor = "var(--bad)";
    chip.style.color = "var(--bad)";
    chip.style.fontWeight = "bold";
    chip.tabIndex = 0;
    chip.textContent = `💀 ${pactNames[state.activePact] || state.activePact}`;
    chip.dataset.tooltip = pactDescs[state.activePact] || "";
    summary.appendChild(chip);
  }

  Object.entries(upgradeDefinitions).forEach(([id, upgrade]) => {
    const level = upgradeLevel(id);
    if (!level) return;

    const chip = document.createElement("span");
    chip.className = "upgrade-chip";
    chip.tabIndex = 0;
    chip.textContent = `${upgrade.name} ${level}/${upgrade.costs.length}`;
    chip.dataset.tooltip = upgrade.description;
    summary.appendChild(chip);
  });
}

function renderStatsPanel() {
  const grid = $("stats-panel-grid");
  if (!grid) return;
  const expandedFamily = grid.querySelector(".stats-family-card[open] summary span")?.textContent || "";
  $("stats-tab-stats")?.setAttribute("aria-selected", String(statsPanelView === "stats"));
  $("stats-tab-ranking")?.setAttribute("aria-selected", String(statsPanelView === "ranking"));
  grid.classList.toggle("is-ranking", statsPanelView === "ranking");
  grid.textContent = "";

  if (statsPanelView === "ranking") {
    // 1. Gérer l'état de chargement
    if (rankingLoading) {
      const loader = document.createElement("div");
      loader.className = "ranking-loader";
      const spinner = document.createElement("div");
      spinner.className = "ranking-spinner";
      const text = document.createElement("span");
      text.textContent = "Interrogation de la taverne...";
      loader.append(spinner, text);
      grid.appendChild(loader);
      return;
    }

    // 2. Récupérer les données cloud
    const listContainer = document.createElement("div");
    listContainer.className = "ranking-list";

    let rowsData = [];

    if (cachedRankingData && cachedRankingData.length > 0) {
      rowsData = cachedRankingData.map((item) => {
        const displayName = item.displayName || "Grodor anonyme";
        const isPlayer = item.user_id === cloudState.user?.id;
        return {
          name: isPlayer ? `${displayName} (Toi)` : displayName,
          score: item.score,
          isPlayer
        };
      });
    } else {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "ranking-empty";
      emptyMessage.textContent = "Aucun compte inscrit dans le classement pour le moment.";
      listContainer.appendChild(emptyMessage);
      grid.appendChild(listContainer);
      return;
    }

    // 3. Rendre le classement
    rowsData.forEach((row, idx) => {
      const rankingRow = document.createElement("div");
      rankingRow.className = `ranking-row ${row.isPlayer ? "is-player" : ""}`.trim();

      const rankSpan = document.createElement("span");
      rankSpan.className = `ranking-rank rank-${idx + 1}`;

      // Petites médailles emojis pour le top 3
      if (idx === 0) rankSpan.textContent = "🥇";
      else if (idx === 1) rankSpan.textContent = "🥈";
      else if (idx === 2) rankSpan.textContent = "🥉";
      else rankSpan.textContent = `${idx + 1}`;

      const nameSpan = document.createElement("span");
      nameSpan.className = "ranking-name";
      nameSpan.textContent = row.name;

      const scoreSpan = document.createElement("span");
      scoreSpan.className = "ranking-score score-gold"; // Utiliser la classe or pour l'effet pulsant
      scoreSpan.textContent = `${row.score} Score Grodorien`;

      rankingRow.append(rankSpan, nameSpan, scoreSpan);
      listContainer.appendChild(rankingRow);
    });

    grid.appendChild(listContainer);
    return;
  }

  const stats = hodorianStats();
  const families = [
    {
      label: "Gloire",
      value: stats.gloire,
      tone: "gold",
      rows: [
        ["Sorties réussies", stats.sortiesReussies],
        ["Combats gagnés", stats.combatsGagnes],
        ["Mini-jeux réussis", stats.miniJeuxReussis],
      ],
    },
    {
      label: "Souffrance",
      value: stats.souffrance,
      tone: "danger",
      rows: [
        ["Humiliations", stats.humiliations],
        ["Dégâts subis", stats.degatsSubis],
        ["Morts ridicules", stats.mortsRidicules],
      ],
    },
    {
      label: "Avidité",
      value: stats.avidite,
      tone: "gold",
      rows: [
        ["PO gagnées", stats.poGagnes],
        ["Objets ramassés", stats.objetsRamasses],
      ],
    },
    {
      label: "Obstination",
      value: stats.obstination,
      tone: "gold",
      rows: [
        ["Runs total", stats.runsTotal],
        ["Étages visités", stats.etagesVisites],
      ],
    },
  ];

  families.forEach((family) => {
    const details = document.createElement("details");
    details.className = `stats-family-card stats-tone-${family.tone}`;
    details.open = family.label === expandedFamily;
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      grid.querySelectorAll(".stats-family-card[open]").forEach((openDetails) => {
        if (openDetails !== details) openDetails.open = false;
      });
    });

    const summary = document.createElement("summary");
    const heading = document.createElement("span");
    const value = document.createElement("strong");
    const chevron = document.createElement("b");
    heading.textContent = family.label;
    value.textContent = family.value;
    chevron.textContent = "∨";
    summary.append(heading, value, chevron);

    const detailGrid = document.createElement("div");
    detailGrid.className = "stats-family-details";
    family.rows.forEach(([label, rowValue]) => {
      const row = document.createElement("article");
      const rowLabel = document.createElement("span");
      const rowValueNode = document.createElement("strong");
      rowLabel.textContent = label;
      rowValueNode.textContent = rowValue;
      row.append(rowLabel, rowValueNode);
      detailGrid.appendChild(row);
    });

    details.append(summary, detailGrid);
    grid.appendChild(details);
  });

  const total = document.createElement("article");
  total.className = "stats-total";
  const totalLabel = document.createElement("span");
  const totalValue = document.createElement("strong");
  totalLabel.textContent = "Score grodorien total";
  totalValue.textContent = stats.scoreHodorienTotal;
  total.append(totalLabel, totalValue);
  grid.appendChild(total);
}

function weightedEvent() {
  const total = eventPool.reduce((sum, event) => sum + event.weight, 0);
  let roll = Math.random() * total;
  for (const event of eventPool) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return eventPool[0];
}

function dungeonEvent() {
  const mustOfferMiniGame = state.miniGamesEncountered === 0
    && state.floor <= Math.ceil(state.totalFloors / 2);
  const extraMiniGameChance = state.totalFloors >= 25
    ? 0.1
    : state.totalFloors >= 20
      ? 0.08
      : 0.06;

  if (mustOfferMiniGame || Math.random() < extraMiniGameChance) {
    return {
      run() {
        return startMiniGame(randomFrom(["double", "slots", "cards"]));
      },
    };
  }

  return weightedEvent();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(list) {
  return list[randomInt(0, list.length - 1)];
}

function renderMiniGame() {
  const panel = $("mini-game-panel");
  const title = $("mini-game-title");
  const text = $("mini-game-text");
  const display = $("mini-game-display");
  const actions = $("mini-game-actions");
  if (!panel || !title || !text || !display || !actions) return;

  const miniGame = state.miniGame;
  panel.hidden = !miniGame;
  panel.classList.toggle("is-coin-flip-panel", miniGame?.type === "double");
  panel.classList.toggle("is-slot-machine-panel", miniGame?.type === "slots");
  panel.classList.toggle("is-bonneteau-panel", miniGame?.type === "cards");
  panel.classList.toggle("is-chest-dodge-panel", miniGame?.type === "chest");
  panel.classList.toggle("is-arm-wrestle-panel", miniGame?.type === "arm");
  panel.dataset.miniGamePhase = miniGame?.phase || "";
  if (!miniGame) {
    display.classList.remove("is-coin-flip");
    display.classList.remove("is-slot-machine");
    display.classList.remove("is-bonneteau");
    display.classList.remove("is-chest-dodge");
    display.classList.remove("is-arm-wrestle");
    display.textContent = "";
    actions.textContent = "";
    return;
  }

  title.textContent = miniGame.title;
  text.textContent = miniGame.text;
  if (miniGame.type === "arm" && updatePlayingArmWrestleMiniGame(miniGame, display, actions)) {
    return;
  }
  display.textContent = "";
  actions.textContent = "";

  if (miniGame.type === "double") {
    renderCoinFlipMiniGame(miniGame, display, actions);
    return;
  }

  if (miniGame.type === "slots") {
    renderSlotMachineMiniGame(miniGame, display, actions);
    return;
  }

  if (miniGame.type === "cards") {
    renderBonneteauMiniGame(miniGame, display, actions);
    return;
  }

  if (miniGame.type === "chest") {
    renderChestDodgeMiniGame(miniGame, display, actions);
    return;
  }

  if (miniGame.type === "arm") {
    renderArmWrestleMiniGame(miniGame, display, actions);
    return;
  }

  display.classList.remove("is-coin-flip");
  display.classList.remove("is-slot-machine");
  display.classList.remove("is-bonneteau");
  display.classList.remove("is-chest-dodge");
  display.classList.remove("is-arm-wrestle");
  (miniGame.display || []).forEach((value) => {
    const tile = document.createElement("span");
    tile.className = `mini-game-tile ${miniGame.type === "cards" ? "is-card" : ""}`.trim();
    tile.textContent = value;
    display.appendChild(tile);
  });

  miniGame.actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-game-button";
    button.dataset.miniGameAction = action.id;
    button.textContent = action.label;
    actions.appendChild(button);
  });
}

function renderCoinFlipMiniGame(miniGame, display, actions) {
  display.classList.remove("is-slot-machine", "is-bonneteau", "is-chest-dodge", "is-arm-wrestle");
  display.classList.add("is-coin-flip");

  const image = document.createElement("img");
  image.className = "coin-flip-scene";
  image.src = miniGame.image;
  image.alt = miniGame.phase === "result"
    ? `La pièce est tombée sur ${miniGame.landedSide}.`
    : "Grodor face au croupier de pile ou face.";
  display.appendChild(image);

  if (miniGame.phase === "stake") {
    const field = document.createElement("label");
    field.className = "coin-flip-stake";
    const fieldLabel = document.createElement("span");
    fieldLabel.textContent = "Mise";
    const input = document.createElement("input");
    input.id = "mini-game-stake";
    input.type = "number";
    input.inputMode = "numeric";
    input.min = "1";
    input.max = String(state.carriedGold);
    input.value = String(Math.min(state.carriedGold, Math.max(1, miniGame.stake)));
    field.append(fieldLabel, input);
    display.appendChild(field);

    appendMiniGameButton(actions, "double-confirm", "Valider la mise");
    return;
  }

  if (miniGame.phase === "choice") {
    appendMiniGameButton(actions, "double-pile", "Pile");
    appendMiniGameButton(actions, "double-face", "Face");
    return;
  }

  if (miniGame.phase === "result") {
    appendMiniGameButton(actions, "double-continue", "Continuer");
    return;
  }

  if (miniGame.phase === "empty") {
    appendMiniGameButton(actions, "double-continue", "Continuer");
  }
}

function appendMiniGameButton(actions, id, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mini-game-button";
  button.dataset.miniGameAction = id;
  button.textContent = label;
  actions.appendChild(button);
}

function renderSlotMachineMiniGame(miniGame, display, actions) {
  display.classList.remove("is-coin-flip", "is-bonneteau", "is-chest-dodge", "is-arm-wrestle");
  display.classList.add("is-slot-machine");

  const machine = document.createElement("img");
  machine.className = "slot-machine-scene";
  machine.src = `${SLOT_MACHINE_ASSET_PATH}/Machine-a-sous.webp`;
  machine.alt = "Grodor devant la machine à sous.";
  display.appendChild(machine);

  miniGame.reels.forEach((symbol, index) => {
    const reel = document.createElement("img");
    reel.className = "slot-machine-reel";
    reel.src = `${SLOT_MACHINE_ASSET_PATH}/Slot-${index + 1}/${symbol}-slot-${index + 1}.png`;
    reel.alt = "";
    display.appendChild(reel);
  });

  if (miniGame.phase === "ready") {
    const tapZone = document.createElement("button");
    tapZone.type = "button";
    tapZone.className = "slot-machine-tap-zone";
    tapZone.dataset.miniGameAction = "slots-spin";
    tapZone.setAttribute("aria-label", "Taper ici pour lancer la machine à sous");
    display.appendChild(tapZone);
    return;
  }

  if (miniGame.phase === "result") {
    appendMiniGameButton(actions, "slots-continue", "Continuer");
  }
}

function renderBonneteauMiniGame(miniGame, display, actions) {
  display.classList.remove("is-coin-flip", "is-slot-machine", "is-chest-dodge", "is-arm-wrestle");
  display.classList.add("is-bonneteau");

  const scene = document.createElement("img");
  scene.className = "bonneteau-scene";
  scene.src = `${BONNETEAU_ASSET_PATH}/bonneteau-face-cache.webp`;
  scene.alt = "Grodor face au squelette du Bonneteau.";
  display.appendChild(scene);

  if (miniGame.phase === "result" && miniGame.picked !== null) {
    ["carte", miniGame.result].forEach((layer) => {
      const overlay = document.createElement("img");
      overlay.className = "bonneteau-card";
      overlay.src = `${BONNETEAU_ASSET_PATH}/Slot-${miniGame.picked + 1}/bonneteau-slot-${miniGame.picked + 1}-${layer}.png`;
      overlay.alt = "";
      display.appendChild(overlay);
    });
  }

  if (miniGame.phase === "choose") {
    [0, 1, 2].forEach((index) => {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.className = `bonneteau-choice-zone is-slot-${index + 1}`;
      choice.dataset.miniGameAction = `card-${index}`;
      choice.setAttribute("aria-label", `Choisir la carte ${index + 1}`);
      display.appendChild(choice);
    });
  }

  if (miniGame.phase === "result") {
    appendMiniGameButton(actions, "cards-continue", "Continuer");
  }
}

function renderChestDodgeMiniGame(miniGame, display, actions) {
  display.classList.remove("is-coin-flip", "is-slot-machine", "is-bonneteau", "is-arm-wrestle");
  display.classList.add("is-chest-dodge");

  const scene = document.createElement("img");
  scene.className = "chest-dodge-scene";
  scene.src = miniGame.image;
  scene.alt = miniGame.phase === "result"
    ? "Résultat du coffre esquive."
    : "Grodor face au coffre du donjon.";
  display.appendChild(scene);

  if (miniGame.phase === "open") {
    appendMiniGameButton(actions, "chest-open", "Ouvrir");
    return;
  }

  if (miniGame.phase === "dodge" && miniGame.activeSlot) {
    const target = document.createElement("button");
    target.type = "button";
    target.className = `chest-dodge-target is-slot-${miniGame.activeSlot}`;
    target.dataset.miniGameAction = "chest-dodge-hit";
    target.setAttribute("aria-label", `Esquive ${miniGame.round + 1}`);

    const targetImage = document.createElement("img");
    targetImage.src = `${CHEST_DODGE_ASSET_PATH}/esquive-${miniGame.activeSlot}-${miniGame.promptState}.png`;
    targetImage.alt = "";
    target.appendChild(targetImage);
    display.appendChild(target);
    return;
  }

  if (miniGame.phase === "result") {
    appendMiniGameButton(actions, "chest-continue", "Continuer");
  }
}

function renderArmWrestleMiniGame(miniGame, display, actions) {
  display.classList.remove("is-coin-flip", "is-slot-machine", "is-bonneteau", "is-chest-dodge");
  display.classList.add("is-arm-wrestle");

  const scene = document.createElement("img");
  scene.className = "arm-wrestle-scene";
  scene.src = `${ARM_WRESTLE_ASSET_PATH}/${miniGame.frame}`;
  scene.alt = miniGame.phase === "result"
    ? "Résultat du bras de fer de Grodor."
    : "Grodor dispute un bras de fer au champion du donjon.";
  display.appendChild(scene);

  if (miniGame.phase !== "result") {
    const status = document.createElement("p");
    status.className = "arm-wrestle-status";
    status.textContent = miniGame.phase === "ready"
      ? miniGame.assetsReady
        ? "5 secondes. Tape aussi vite que possible !"
        : "Le champion se prépare..."
      : `${(miniGame.remainingMs / 1000).toFixed(1)} s · ${miniGame.totalTaps} taps`;
    display.appendChild(status);
  }

  if (miniGame.phase === "ready" && miniGame.assetsReady) {
    appendMiniGameButton(actions, "arm-start", "Commencer");
  } else if (miniGame.phase === "playing") {
    appendMiniGameButton(actions, "arm-push", "FORCER !");
    const pushButton = actions.lastElementChild;
    if (miniGame.buttonPressed && pushButton) pushButton.classList.add("is-pressed");
  } else if (miniGame.phase === "result") {
    appendMiniGameButton(actions, "arm-continue", "Continuer");
    const continueButton = actions.lastElementChild;
    if (continueButton) continueButton.disabled = !miniGame.continueEnabled;
  }
}

function updatePlayingArmWrestleMiniGame(miniGame, display, actions) {
  if (miniGame.phase !== "playing") return false;

  const scene = display.querySelector(".arm-wrestle-scene");
  const status = display.querySelector(".arm-wrestle-status");
  const pushButton = actions.querySelector('[data-mini-game-action="arm-push"]');
  if (!scene || !status || !pushButton) return false;

  const nextFrame = `${ARM_WRESTLE_ASSET_PATH}/${miniGame.frame}`;
  if (scene.getAttribute("src") !== nextFrame) scene.src = nextFrame;
  status.textContent = `${(miniGame.remainingMs / 1000).toFixed(1)} s · ${miniGame.totalTaps} taps`;
  pushButton.classList.toggle("is-pressed", miniGame.buttonPressed);
  return true;
}

function render() {
  state.maxLife = Math.min(MAX_LIFE, state.maxLife);
  state.life = Math.min(state.life, state.maxLife);
  if (state.screen === "village" || state.screen === "shop") {
    state.life = state.maxLife;
  }

  // Déclencheurs de sons et musiques dynamiques sur changement d'état !
  if (lastHodorLife > 0) {
    if (state.life > lastHodorLife && state.screen !== "village" && state.screen !== "shop") {
      playHealSound();
    } else if (state.life < lastHodorLife && state.life > 0) {
      playDamageSound();
    }
  }
  lastHodorLife = state.life;

  if (state.screen !== lastPlayedBgmScreen) {
    lastPlayedBgmScreen = state.screen;
    playBgm(state.screen);
  }

  const showsFloor = state.screen === "dungeon" || state.screen === "combat";
  $("place-label").textContent = showsFloor ? "Étage" : "Lieu";
  $("floor").textContent = state.screen === "village" || state.screen === "shop"
    ? "Village"
    : state.screen === "cell"
      ? "Cellule"
      : state.screen === "mort"
        ? "Geôles"
        : state.floor;
  const carriedGoldText = String(state.carriedGold);
  $("carried-gold").textContent = carriedGoldText;
  $("carried-gold").dataset.digits = String(carriedGoldText.length);
  $("bank-gold").textContent = state.bankGold;
  $("bank-building-gold").textContent = state.bankGold;
  const lossCountText = String(state.runLosses);
  $("loss-count").textContent = lossCountText;
  $("loss-count").dataset.digits = String(lossCountText.length);
  const statsSummary = hodorianStats();
  $("village-loss-count").textContent = statsSummary.souffrance;
  $("village-win-count").textContent = statsSummary.gloire;
  $("village-bank-count").textContent = statsSummary.scoreHodorienTotal;
  $("village-shame").textContent = `Avidité ${statsSummary.avidite} / Obstination ${statsSummary.obstination}`;
  renderHearts();
  renderPurse();
  renderInventory();
  renderUpgradeSummary();
  renderStatsPanel();

  const isDungeon = state.screen === "dungeon";
  const isCombat = state.screen === "combat";
  const isVillage = state.screen === "village" || state.screen === "shop";
  const isDead = state.screen === "mort";
  const isCell = state.screen === "cell";
  if (!isVillage) {
    shopPanelOpen = false;
    statsPanelOpen = false;
  }
  const isShop = isVillage && shopPanelOpen;
  const isStatsPanel = isVillage && statsPanelOpen;

  document.querySelector(".game-shell")?.classList.toggle("is-village-layout", isVillage);
  $("scene").classList.toggle("is-dead", isDead);
  $("scene").classList.toggle("is-combat", isCombat);
  $("scene").classList.toggle("is-village", isVillage || isShop);
  $("scene").classList.toggle("is-dungeon", isDungeon || isCombat);
  $("scene").classList.toggle("is-cell", isCell);
  $("scene").classList.toggle("is-locked", state.inputLocked);
  $("scene").classList.toggle("has-mini-game", Boolean(state.miniGame));
  const combatArena = combatArenaFor(state.combatArenaKey);
  $("scene").dataset.combatArena = isCombat ? combatArena.key : "";
  $("scene").style.setProperty("--combat-arena-image", `url("${combatArena.image}")`);
  $("scene").classList.toggle("combat-windup", isCombat && state.combatImpact === "windup");
  $("scene").classList.toggle("combat-hit", isCombat && state.combatImpact === "hit");
  $("scene").classList.toggle("combat-aftermath", isCombat && state.combatImpact === "aftermath");
  ["head", "torso", "legs"].forEach((strike) => {
    $("scene").classList.toggle(`combat-strike-${strike}`, isCombat && state.combatStrike === strike);
  });
  $("scene").classList.toggle("has-win-banner", isVillage && state.showWinBanner);
  $("scene").classList.toggle("story-good", state.storyTone === "good" && !isDead);
  $("scene").classList.toggle("story-bad", state.storyTone === "bad" && !isDead);
  $("scene").classList.toggle("story-neutral", state.storyTone === "neutral" && !isDead);
  $("bank-score").hidden = true;
  $("loss-score").hidden = isVillage || isShop;
  placeHodorForScreen(isDungeon, isCombat);
  renderHodor();

  $("location").textContent = isVillage
    ? state.villageLocation
    : isDead
      ? "Retour aux geôles"
      : isCell
        ? "Dans les geôles"
        : isShop
          ? "Échoppe douteuse"
          : isCombat
            ? "Ça va taper"
            : "Couloirs du donjon";

  $("doors").hidden = !isDungeon || Boolean(state.miniGame);
  $("dungeon-stage").hidden = !isDungeon || Boolean(state.miniGame);
  renderMiniGame();
  $("village-stage").hidden = !isVillage;
  $("village-tip-card").hidden = !isVillage || isShop || isStatsPanel;
  $("village-install-prompt").hidden = isInstalledApp();
  $("village-install-steps").hidden = isInstalledApp();
  $("combat-stage").hidden = !isCombat;
  $("combat-choices").hidden = !isCombat;
  const monsterAsset = state.combat?.asset;
  const usesMonsterTarget = isCombat && Boolean(monsterAsset);
  $("combat-choices").classList.toggle("has-monster-target", usesMonsterTarget);
  $("monster-target").hidden = !usesMonsterTarget;
  $("monster-target").className = `monster-target ${monsterAsset ? `${monsterAsset}-target` : ""}`.trim();
  $("monster-target").setAttribute("aria-label", state.combat?.name || "Monstre");
  renderMonsterHearts();
  $("village-choices").hidden = !isVillage;
  $("shop-panel").hidden = !isShop;
  $("stats-panel").hidden = !isStatsPanel;
  $("village-modal-backdrop").hidden = !(isShop || isStatsPanel);
  $("death-choices").hidden = !isCell;
  renderCellInfo();
  $("ko-banner").hidden = !isDead;
  $("win-banner").hidden = !(isVillage && state.showWinBanner);
  if (isDead) $("ko-taunt").textContent = koTaunt();
  if (isVillage && state.showWinBanner) $("win-taunt").textContent = winTaunt();

  document.querySelectorAll(".door").forEach((door) => {
    door.disabled = !isDungeon || state.inputLocked || Boolean(state.miniGame);
  });

  document.querySelectorAll("[data-strike]").forEach((button) => {
    button.disabled = !isCombat || state.inputLocked;
    button.classList.toggle("is-selected", isCombat && button.dataset.strike === state.combatStrike);
  });

  document.querySelectorAll(".door-hint").forEach((hint, index) => {
    hint.textContent = state.doorHints[index] || "";
    hint.hidden = !state.doorHints[index];
  });

  if (isShop) renderShop();

  $("god-mode").textContent = `God mode : ${state.godMode ? "ON" : "OFF"}`;
  $("god-mode").setAttribute("aria-pressed", String(state.godMode));
  $("restart-label").textContent = isCell ? "Sortir des geôles" : "S'échapper des geôles";
  $("restart-help").textContent = isCell
    ? "La porte grince. Grodor appelle ça de la discrétion."
    : "Les gardes t'ont ramené en haut. Ils auraient dû mieux fermer.";

  playPendingCoinAnimation();
  playPendingCoinLossAnimation();
  playPendingPurseLossAnimation();
  queueActiveRunSave();
}

function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

function placeHodorForScreen(isDungeon, isCombat) {
  const hodor = document.querySelector(".hodor-sprite");
  const dungeonStage = $("dungeon-stage");
  const combatStage = $("combat-stage");
  const villageStage = $("village-stage");
  const rewardRow = $("reward-row");
  if (!hodor || !dungeonStage || !rewardRow) return;

  const target = isCombat ? combatStage : isDungeon ? dungeonStage : state.screen === "village" ? villageStage : rewardRow;
  if (!target) return;
  if (hodor.parentElement !== target) {
    target.appendChild(hodor);
  }
}

function playPendingCoinAnimation() {
  if (!state.pendingCoinGain || state.pendingCoinGain <= 0) return;
  const rewardPanel = $("reward-panel");
  const purse = document.querySelector(".stat-purse .purse-visual") || document.querySelector(".stat-purse");
  if (!rewardPanel || rewardPanel.hidden || !purse) return;

  const from = rewardPanel.getBoundingClientRect();
  const to = purse.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const coinX = to.left + to.width / 2 - (from.left + from.width / 2);
  const coinY = to.top + to.height / 2 - (from.top + from.height / 2);
  const coinCount = Math.min(5, Math.max(1, state.pendingCoinGain));
  for (let index = 0; index < coinCount; index += 1) {
    const coin = document.createElement("span");
    const offset = (index - (coinCount - 1) / 2) * 18;
    coin.className = "flying-coin";
    coin.style.setProperty("--coin-x", `${coinX}px`);
    coin.style.setProperty("--coin-y", `${coinY}px`);
    coin.style.setProperty("--coin-mid-x", `${coinX * (0.48 + index * 0.035)}px`);
    coin.style.setProperty("--coin-mid-y", `${coinY * (0.52 + index * 0.025)}px`);
    coin.style.setProperty("--coin-drift", `${offset}px`);
    coin.style.setProperty("--coin-delay", `${index * 95}ms`);
    coin.style.left = `${from.left + from.width / 2}px`;
    coin.style.top = `${from.top + from.height / 2}px`;
    document.body.appendChild(coin);
    coin.addEventListener("animationend", () => coin.remove(), { once: true });
  }
  state.pendingCoinGain = 0;
}

function playPendingCoinLossAnimation() {
  if (!state.pendingCoinLoss || state.pendingCoinLoss <= 0) return;
  const rewardPanel = $("reward-panel");
  const purse = document.querySelector(".stat-purse .purse-visual") || document.querySelector(".stat-purse");
  if (!rewardPanel || rewardPanel.hidden || !purse) return;

  const from = purse.getBoundingClientRect();
  const to = rewardPanel.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const coinX = to.left + to.width / 2 - (from.left + from.width / 2);
  const coinY = to.top + to.height / 2 - (from.top + from.height / 2);
  const coinCount = Math.min(5, Math.max(1, state.pendingCoinLoss));
  for (let index = 0; index < coinCount; index += 1) {
    const coin = document.createElement("span");
    const offset = (index - (coinCount - 1) / 2) * 18;
    coin.className = "flying-coin is-loss";
    coin.style.setProperty("--coin-x", `${coinX}px`);
    coin.style.setProperty("--coin-y", `${coinY}px`);
    coin.style.setProperty("--coin-mid-x", `${coinX * (0.48 + index * 0.035)}px`);
    coin.style.setProperty("--coin-mid-y", `${coinY * (0.52 + index * 0.025)}px`);
    coin.style.setProperty("--coin-drift", `${offset}px`);
    coin.style.setProperty("--coin-delay", `${index * 95}ms`);
    coin.style.left = `${from.left + from.width / 2}px`;
    coin.style.top = `${from.top + from.height / 2}px`;
    document.body.appendChild(coin);
    coin.addEventListener("animationend", () => coin.remove(), { once: true });
  }
  state.pendingCoinLoss = 0;
}

function playPendingPurseLossAnimation() {
  if (!state.pendingPurseLoss) return;
  const rewardPanel = $("reward-panel");
  const purse = document.querySelector(".stat-purse .purse-visual") || document.querySelector(".stat-purse");
  if (!rewardPanel || rewardPanel.hidden || !purse) return;

  const from = purse.getBoundingClientRect();
  const to = rewardPanel.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const lostPurse = document.createElement("span");
  lostPurse.className = "flying-purse";
  const purseX = to.left + to.width / 2 - (from.left + from.width / 2);
  const purseY = to.top + to.height / 2 - (from.top + from.height / 2);
  lostPurse.style.setProperty("--purse-x", `${purseX}px`);
  lostPurse.style.setProperty("--purse-y", `${purseY}px`);
  lostPurse.style.setProperty("--purse-mid-x", `${purseX * 0.76}px`);
  lostPurse.style.setProperty("--purse-mid-y", `${purseY * 0.76}px`);
  lostPurse.style.left = `${from.left + from.width / 2}px`;
  lostPurse.style.top = `${from.top + from.height / 2}px`;
  document.body.appendChild(lostPurse);
  lostPurse.addEventListener("animationend", () => lostPurse.remove(), { once: true });
  state.pendingPurseLoss = false;
}

function renderHearts() {
  const lifeHud = document.querySelector(".stat-life");
  if (lifeHud) {
    lifeHud.dataset.life = String(state.life);
    lifeHud.dataset.maxLife = String(state.maxLife);
  }
  const pvFill = $("pv-fill");
  if (pvFill) {
    const percentage = Math.max(0, Math.min(100, (state.life / state.maxLife) * 100));
    pvFill.style.width = `${percentage}%`;
  }
  state.renderedLife = state.life;
}

function renderMonsterHearts() {
  const healthRow = $("monster-health");
  if (!healthRow) return;

  const monster = state.screen === "combat" ? state.combat : null;
  const maxLife = monster?.life || 0;
  const life = Math.max(0, Math.min(maxLife, state.combatHp));
  const previousLife = state.renderedCombatHp;
  healthRow.hidden = !monster;
  healthRow.textContent = "";

  if (!monster) {
    state.renderedCombatHp = null;
    return;
  }

  healthRow.setAttribute("aria-label", `Vie de ${monster.name} : ${life} sur ${maxLife} cœurs`);
  for (let index = 0; index < maxLife; index += 1) {
    const heart = document.createElement("span");
    heart.className = `heart-icon monster-heart${index < life ? " is-full" : ""}`;
    if (previousLife !== null && index >= life && index < previousLife) {
      heart.classList.add("is-lost");
    }
    healthRow.appendChild(heart);
  }
  state.renderedCombatHp = life;
}

function renderPurse() {
  const purse = document.querySelector(".stat-purse");
  if (purse) {
    purse.classList.toggle("has-gold", state.carriedGold > 0);
  }
}

function renderHodor() {
  const hodor = document.querySelector(".hodor-sprite");
  if (!hodor) return;

  const pose = hodorPoseForScreen();
  const assets = hodorLayerUrlsForInventory(pose);
  const poseClass = `pose-${pose}`;
  if (!hodor.classList.contains(poseClass)) {
    hodor.classList.remove("pose-idle", "pose-walk", "pose-fuite", "pose-folie", "pose-question", "pose-releve", "pose-victory", "pose-hurt", "pose-ko", "pose-combat", "pose-combat-2", "pose-combat-3", "pose-dead");
    hodor.classList.add(poseClass);
  }

  // Applique le retournement horizontal (classe CSS)
  hodor.classList.toggle("is-flipped", !!state.hodorFlipped);

  hodor.style.backgroundImage = assets.map(cssAssetUrl).join(", ");
  syncHodorWalkAnimation(pose);
}

function hodorPoseForScreen() {
  if (state.screen === "mort") return "dead";
  if (state.screen === "combat") return ["idle", "combat", "combat-2", "combat-3"].includes(state.hodorPose) ? state.hodorPose : "idle";
  if (state.screen === "shop") return "walk";
  if (state.screen === "village") {
    if (state.hodorPose === "walk") return "walk";
    return state.showWinBanner ? "victory" : "question";
  }
  if (state.screen === "dungeon") {
    if (state.inputLocked || state.hodorPose === "walk") return "walk";
    return state.hodorPose && state.hodorPose !== "idle" ? state.hodorPose : "question";
  }
  if (state.screen === "cell") return "idle";
  return state.hodorPose || "idle";
}

function cssAssetUrl(asset) {
  return `url("${asset}")`;
}

function hodorLayerUrlsForInventory(pose) {
  const owned = new Set(state.inventory);
  const cleanPose = hodorV01PoseName(pose);
  if (cleanPose === "mort") {
    return [`${HODOR_BASE_PATH}/Corps/mort-mort.png`];
  }
  const walkFrameIndex = cleanPose === "marche" ? hodorWalkFrameIndex() : 0;
  const layersBottomToTop = [hodorBaseLayerUrl(cleanPose, walkFrameIndex)];

  HODOR_STUFF_LAYERS.forEach((layer) => {
    if (owned.has(layer.item)) {
      layersBottomToTop.push(hodorStuffLayerUrl(layer, cleanPose, walkFrameIndex));
    }
  });

  return layersBottomToTop.reverse();
}

function hodorBaseLayerUrl(cleanPose, walkFrameIndex) {
  if (cleanPose === "marche") {
    return HODOR_WALK_FRAME_PATHS[walkFrameIndex];
  }

  if (cleanPose === "folie") {
    return `${HODOR_BASE_PATH}/Corps/folie.png`;
  }

  const poseFile = HODOR_POSE_FILES[cleanPose] || HODOR_POSE_FILES.idle;
  return `${HODOR_BASE_PATH}/Corps/${poseFile}.png`;
}

function hodorStuffLayerUrl(layer, cleanPose, walkFrameIndex) {
  const walkFramePaths = HODOR_WALK_STUFF_FRAME_PATHS[layer.item];
  if (cleanPose === "marche" && walkFramePaths) {
    return walkFramePaths[walkFrameIndex];
  }

  const poseFile = layer.poseFiles && layer.poseFiles[cleanPose] ? layer.poseFiles[cleanPose] : `${cleanPose}-${layer.suffix}`;
  return `${HODOR_BASE_PATH}/Stuff/${layer.folder}/${poseFile}.png`;
}

function hodorWalkFrameIndex() {
  return Math.floor(performance.now() / HODOR_WALK_FRAME_MS) % HODOR_WALK_FRAME_PATHS.length;
}

function syncHodorWalkAnimation(pose) {
  if (pose === "walk") {
    if (!hodorWalkAnimationTimer) {
      hodorWalkAnimationTimer = setInterval(renderHodor, HODOR_WALK_FRAME_MS);
    }
    return;
  }

  if (hodorWalkAnimationTimer) {
    clearInterval(hodorWalkAnimationTimer);
    hodorWalkAnimationTimer = null;
  }
}

function hodorV01PoseName(pose) {
  return {
    idle: "idle",
    walk: "marche",
    fuite: "fuite",
    folie: "folie",
    question: "question",
    releve: "question",
    victory: "victoire",
    hurt: "degats",
    ko: "ko",
    combat: "attaque-1",
    "combat-2": "attaque-2",
    "combat-3": "attaque-3",
    dead: "mort"
  }[pose] || "idle";
}

// ==========================================================================
// SYSTÈME DE SYNTHÈSE AUDIO COMIC-RETRO & GESTIONNAIRE DE MUSIQUE D'AMBIANCE
// Conçu de manière 100% légale, sans droit d'auteur, et ultra-léger (0 octet d'asset)
// ==========================================================================

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Initialisation des curseurs de paramètres volume et enregistrement localStorage
function initAudioSettings() {
  const musicSlider = document.getElementById("volume-music");
  const sfxSlider = document.getElementById("volume-sfx");
  const musicVal = document.getElementById("volume-music-val");
  const sfxVal = document.getElementById("volume-sfx-val");

  if (musicSlider && sfxSlider && musicVal && sfxVal) {
    musicSlider.value = musicVolume;
    sfxSlider.value = sfxVolume;
    musicVal.textContent = `${musicVolume}%`;
    sfxVal.textContent = `${sfxVolume}%`;

    musicSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      musicVolume = val;
      localStorage.setItem("grodor_music_volume", val);
      musicVal.textContent = `${val}%`;
      if (currentBgm) {
        currentBgm.volume = getBgmMaxVolume();
      }
    });

    sfxSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      sfxVolume = val;
      localStorage.setItem("grodor_sfx_volume", val);
      sfxVal.textContent = `${val}%`;
    });

    sfxSlider.addEventListener("change", () => {
      // Joue un clic pour tester le volume des bruitages
      playClickSound();
    });
  }
}


// Signature sonore style Netflix / YouTube medieval joué au clic d'entrée de jeu
function playLogoIntroSound(onRumbleStart, onEnded) {
  if (logoChimePlayed) return;
  logoChimePlayed = true;
  initAudio();

  const handleRumbleStart = typeof onRumbleStart === "function" ? onRumbleStart : () => {};
  const handleEnded = typeof onEnded === "function" ? onEnded : () => {};

  // Tente d'abord de charger le fichier final logo-intro.mp3 s'il a été fourni
  const introAudio = new Audio("assets/Audio/logo-intro.mp3");
  introAudio.volume = (sfxVolume / 100) * 0.5;

  let endedTriggered = false;
  const triggerEnded = () => {
    if (endedTriggered) return;
    endedTriggered = true;
    handleEnded();
  };

  // Sécurité générale (Watchdog) pour garantir le démarrage du BGM s'il y a un blocage
  const watchdog = window.setTimeout(triggerEnded, 4500);

  introAudio.play()
    .then(() => {
      // Démarrage du glissement de porte 1 seconde après le début du son
      window.setTimeout(handleRumbleStart, 1000);

      introAudio.addEventListener("ended", () => {
        window.clearTimeout(watchdog);
        triggerEnded();
      });
      introAudio.addEventListener("error", () => {
        window.clearTimeout(watchdog);
        triggerEnded();
      });
    })
    .catch(() => {
      window.clearTimeout(watchdog);

      // Fallback : Synthétiseur Web Audio API medieval boom & chime
      if (!audioCtx || audioCtx.state === "suspended") {
        logoChimePlayed = false;
        triggerEnded();
        return;
      }

      const now = audioCtx.currentTime;

      // 1. Castle drum boom (Netflix "ta-dum" style, but fantasy medieval)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(80, now);
      osc1.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      gain1.gain.setValueAtTime(0.35 * (sfxVolume / 100), now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.start(now);
      osc1.stop(now + 0.6);

      // 2. Magical crystal chord (comical-epic resolve chord)
      const notes = [293.66, 349.23, 440.00, 587.33]; // Ré4 -> Fa4 -> La4 -> Ré5 (D minor)
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";

        const delay = 0.12 + i * 0.08;
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.12 * (sfxVolume / 100), now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 2.2);

        osc.start(now + delay);
        osc.stop(now + delay + 2.2);
      });

      // 3. Heavy stone gate opening rumble (bandpass filtered white noise) - Retardé de 1s pour s'aligner
      try {
        const rumbleDuration = 2.2;
        const bufferSize = audioCtx.sampleRate * rumbleDuration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(65, now + 1.0);
        filter.frequency.linearRampToValueAtTime(32, now + 1.0 + rumbleDuration);
        filter.Q.setValueAtTime(4.5, now + 1.0);

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.0, now + 1.0);
        noiseGain.gain.linearRampToValueAtTime(0.16 * (sfxVolume / 100), now + 1.0 + 0.1);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0 + rumbleDuration);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);

        noise.start(now + 1.0);
        noise.stop(now + 1.0 + rumbleDuration);
      } catch (err) {
        // Ignorer en cas d'incompatibilité de buffer sur les vieux navigateurs
      }

      // Déclencheurs de callbacks pour la synthèse
      window.setTimeout(handleRumbleStart, 1000);
      window.setTimeout(triggerEnded, 3200);
    });
}

// Bruit de pièce d'or (PO) rétro et comique
function playCoinSound() {
  initAudio();
  if (!audioCtx || sfxVolume <= 0) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "sine";
  const now = audioCtx.currentTime;

  // Note montante de cartoon
  osc.frequency.setValueAtTime(587.33, now); // Ré5
  osc.frequency.setValueAtTime(880, now + 0.07); // La5

  gain.gain.setValueAtTime(0.12 * (sfxVolume / 100), now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  osc.start(now);
  osc.stop(now + 0.32);
}

// Bruit de baffe / dégât (bonk comique)
function playDamageSound() {
  initAudio();
  if (!audioCtx || sfxVolume <= 0) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "triangle";
  const now = audioCtx.currentTime;

  // Fréquence glissante vers le bas (bonk étouffé)
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

  gain.gain.setValueAtTime(0.28 * (sfxVolume / 100), now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.start(now);
  osc.stop(now + 0.25);
}

// Arpège de soin joyeux
function playHealSound() {
  initAudio();
  if (!audioCtx || sfxVolume <= 0) return;
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // Do5 -> Mi5 -> Sol5 -> Do6
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.06);
    gain.gain.setValueAtTime(0.1 * (sfxVolume / 100), now + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.22);
    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.22);
  });
}

// Fanfare de victoire triomphale et ridicule
function playVictorySound() {
  initAudio();
  if (!audioCtx || sfxVolume <= 0) return;
  const now = audioCtx.currentTime;
  const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25, 659.25];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + i * 0.1);
    gain.gain.setValueAtTime(0.12 * (sfxVolume / 100), now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.3);
  });
}

// Descente comique triste de défaite
function playDefeatSound() {
  initAudio();
  if (!audioCtx || sfxVolume <= 0) return;
  const now = audioCtx.currentTime;
  const notes = [349.23, 329.63, 293.66, 220.00]; // Fa4 -> Mi4 -> Ré4 -> La3
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now + i * 0.18);
    gain.gain.setValueAtTime(0.14 * (sfxVolume / 100), now + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.4);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.4);
  });
}

// Micro-clic comique pour les boutons
function playClickSound() {
  initAudio();
  if (!audioCtx || sfxVolume <= 0) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "sine";
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

  gain.gain.setValueAtTime(0.04 * (sfxVolume / 100), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.start(now);
  osc.stop(now + 0.04);
}

function playBgm(sceneName) {
  initAudio();
  const fileMap = {
    cell: "assets/Audio/ambient-dungeon.mp3",
    dungeon: "assets/Audio/ambient-dungeon.mp3",
    combat: "assets/Audio/ambient-combat.mp3",
    village: "assets/Audio/ambient-village.mp3",
    shop: "assets/Audio/ambient-village.mp3",
    stats: "assets/Audio/ambient-village.mp3",
    mort: "assets/Audio/ambient-dungeon.mp3"
  };

  const file = fileMap[sceneName];
  if (!file) return;

  if (currentBgm) {
    if (currentBgm.src.endsWith(encodeURI(file))) {
      if (currentBgm.paused) {
        const targetVol = getBgmMaxVolume();
        currentBgm.play()
          .then(() => {
            let vol = currentBgm.volume;
            const step = targetVol / 50;
            const fadeIn = setInterval(() => {
              vol = Math.min(targetVol, vol + step);
              currentBgm.volume = vol;
              if (vol >= targetVol) {
                clearInterval(fadeIn);
              }
            }, 30);
          })
          .catch(() => {});
      }
      return;
    }
    const oldBgm = currentBgm;
    let vol = oldBgm.volume;
    const fadeOut = setInterval(() => {
      vol = Math.max(0, vol - 0.03);
      oldBgm.volume = vol;
      if (vol <= 0) {
        clearInterval(fadeOut);
        oldBgm.pause();
      }
    }, 30);
  }

  const audio = new Audio(file);
  audio.loop = true;
  audio.volume = 0;
  currentBgm = audio;

  const targetVol = getBgmMaxVolume();
  if (targetVol <= 0) {
    audio.volume = 0;
    return;
  }

  audio.play()
    .then(() => {
      let vol = 0;
      const step = targetVol / 50; // 50 étapes de fondu
      const fadeIn = setInterval(() => {
        vol = Math.min(targetVol, vol + step);
        audio.volume = vol;
        if (vol >= targetVol) {
          clearInterval(fadeIn);
        }
      }, 30); // 30ms * 50 = 1,5 seconde de fondu d'entrée très doux
    })
    .catch(() => {
      // Ignorer si les fichiers MusicFX n'ont pas encore été déposés par l'utilisateur
    });
}

function preloadAndDecodeAssets() {
  const assetsToPreload = [
    "assets/Accueil/Background-Grodor.webp",
    "assets/Accueil/Background-accueil-logo.png",
    "assets/Donjon/Donjon-accueil.webp",
    "assets/Donjon/Donjon-interieur.webp",
    "assets/Donjon/Donjon-interieur-porte-1.png",
    "assets/Donjon/Donjon-interieur-porte-2.png",
    "assets/Donjon/Donjon-interieur-porte-3.png",
    "assets/Donjon/geole-ferme.webp",
    "assets/Donjon/geole-ouvert.webp",
    "assets/Donjon/porte geole fermé.png",
    "assets/Donjon/porte geole ouverte.png",
    "assets/Village/village.webp",
    "assets/Arene/arene-1.webp",
    "assets/Arene/arene-2.webp",
    "assets/Arene/arene-3.webp",
    "assets/Ui/bourse-vide.png",
    "assets/Ui/bourse-pleine.png",
    "assets/Ui/inventaire-vide.png",
    "assets/Ui/inventaire-plein.png",
    "assets/Ui/coeur vide.png",
    "assets/Ui/coeur plein.png",
    "assets/Ui/po.png",
    "assets/Ui/po-effet.png",
    "assets/Monstres/Rat/tete.png",
    "assets/Monstres/Rat/corps.png",
    "assets/Monstres/Rat/jambes.png",
    "assets/Monstres/Squelette fatigue/tete.png",
    "assets/Monstres/Squelette fatigue/corps.png",
    "assets/Monstres/Squelette fatigue/jambes.png",
    "assets/Monstres/Guard/Tete.png",
    "assets/Monstres/Guard/corps.png",
    "assets/Monstres/Guard/jambe.png",
    // Mini-jeux lourds (Pile ou Face)
    "assets/Mini-jeu/pile-ou-face/pile-face-1.webp",
    "assets/Mini-jeu/pile-ou-face/pile-face-2.webp",
    "assets/Mini-jeu/pile-ou-face/pile-face-3.webp",
    "assets/Mini-jeu/pile-ou-face/pile-face-4.webp",
    "assets/Mini-jeu/pile-ou-face/pile-face-face.webp",
    "assets/Mini-jeu/pile-ou-face/pile-face-pile.webp",
    // Machine à sous
    "assets/Mini-jeu/machine-a-sous/Machine-a-sous.webp",
    "assets/Mini-jeu/machine-a-sous/Slot-1/Bourse-vide-slot-1.png",
    "assets/Mini-jeu/machine-a-sous/Slot-1/Crane-slot-1.png",
    "assets/Mini-jeu/machine-a-sous/Slot-1/Grodor-slot-1.png",
    "assets/Mini-jeu/machine-a-sous/Slot-1/Po-slot-1.png",
    "assets/Mini-jeu/machine-a-sous/Slot-2/Bourse-vide-slot-2.png",
    "assets/Mini-jeu/machine-a-sous/Slot-2/Crane-slot-2.png",
    "assets/Mini-jeu/machine-a-sous/Slot-2/Grodor-slot-2.png",
    "assets/Mini-jeu/machine-a-sous/Slot-2/Po-slot-2.png",
    "assets/Mini-jeu/machine-a-sous/Slot-3/Bourse-vide-slot-3.png",
    "assets/Mini-jeu/machine-a-sous/Slot-3/Crane-slot-3.png",
    "assets/Mini-jeu/machine-a-sous/Slot-3/Grodor-slot-3.png",
    "assets/Mini-jeu/machine-a-sous/Slot-3/Po-slot-3.png",
    // Bonneteau
    "assets/Mini-jeu/Bonneteau/bonneteau-face-cache.webp",
    "assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-bourse.png",
    "assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-carte.png",
    "assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-crane.png",
    "assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-grodor.png",
    "assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-po.png",
    "assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-bourse.png",
    "assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-carte.png",
    "assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-crane.png",
    "assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-grodor.png",
    "assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-po.png",
    "assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-bourse.png",
    "assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-carte.png",
    "assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-crane.png",
    "assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-grodor.png",
    "assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-po.png"
  ];

  // 1. Ajouter les poses de Grodor
  Object.values(HODOR_POSE_FILES).forEach(file => {
    assetsToPreload.push(`${HODOR_BASE_PATH}/Corps/${file}.png`);
  });
  assetsToPreload.push(`${HODOR_BASE_PATH}/Corps/mort-mort.png`);

  // 2. Ajouter les frames de marche de Grodor
  HODOR_WALK_FRAME_PATHS.forEach(url => assetsToPreload.push(url));

  // 3. Ajouter les couches d'objets (Stuff layers) pour chaque pose
  HODOR_STUFF_LAYERS.forEach(layer => {
    const poses = ["idle", "marche", "fuite", "folie", "question", "degats", "attaque-1", "attaque-2", "attaque-3", "victoire", "ko", "mort"];
    poses.forEach(pose => {
      const cleanPose = hodorV01PoseName(pose);
      const poseFile = layer.poseFiles && layer.poseFiles[cleanPose] ? layer.poseFiles[cleanPose] : `${cleanPose}-${layer.suffix}`;
      assetsToPreload.push(`${HODOR_BASE_PATH}/Stuff/${layer.folder}/${poseFile}.png`);
    });
  });

  // 4. Ajouter les frames de marche pour chaque objet
  Object.values(HODOR_WALK_STUFF_FRAME_PATHS).forEach(frames => {
    frames.forEach(url => assetsToPreload.push(url));
  });

  // Filtrer les doublons et URL invalides
  const uniqueUrls = [...new Set(assetsToPreload)];

  // Charger et décoder asynchronement lors de l'inactivité du navigateur
  const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));

  idleCallback(() => {
    uniqueUrls.forEach((url) => {
      const img = new Image();
      img.src = encodeURI(url);
      if (typeof img.decode === "function") {
        img.decode().catch(() => {});
      }
    });
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js", { scope: "./" })
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const nextWorker = registration.installing;
          if (!nextWorker) return;
          nextWorker.addEventListener("statechange", () => {
            if (nextWorker.state === "installed" && navigator.serviceWorker.controller) {
              nextWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        return registration.update();
      })
      .catch((error) => {
        console.warn("Service worker non enregistre:", error);
      });
  });
}

registerServiceWorker();
preloadAndDecodeAssets();
