const TOTAL_FLOORS = 20;
const START_LIFE = 3;
const BANK_KEY = "barbare_portes_binouse_bank";
const UPGRADES_KEY = "barbare_portes_binouse_upgrades";
const STATS_KEY = "barbare_portes_binouse_stats";
const CELL_TUTORIAL_KEY = "barbare_portes_binouse_cell_tutorial_seen";
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
  combatArenaKey: "",
  godMode: false,
  upgrades: loadUpgrades(),
  doorHints: [],
  floorShift: 0,
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
  hodorPose: "idle",
  combatStrike: "",
  combatImpact: "",
  pendingCoinGain: 0,
  pendingCoinLoss: 0,
  pendingPurseLoss: false,
  renderedLife: null,
};

let shopPanelOpen = false;
let statsPanelOpen = false;
let statsPanelView = "stats";
let villageActionTimer = null;
let villageReturnTimer = null;
let rewardHideTimer = null;
let rewardHideToken = 0;

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
  { key: "arene-1", label: "Arene 1", image: "assets/Arene/arene-1.png" },
  { key: "arene-2", label: "Arene 2", image: "assets/Arene/arene-2.png" },
  { key: "arene-3", label: "Arene 3", image: "assets/Arene/arene-3.png" },
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
const CELL_OPEN_DELAY_MS = 650;
const DUNGEON_EFFECT_VISIBLE_MS = 3000;
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

document.addEventListener("mousemove", previewDungeonDoorWalkFromPointer);

document.querySelectorAll(".door").forEach((door) => {
  door.addEventListener("pointerenter", previewDungeonDoorWalk);
  door.addEventListener("pointerleave", stopDungeonDoorWalkPreview);
  door.addEventListener("mouseover", previewDungeonDoorWalk);
  door.addEventListener("mouseout", stopDungeonDoorWalkPreview);
});

addClick("bank-building", () => delayVillageAction("bank", depositGold));
addClick("tavern-building", () => delayVillageAction("tavern", goToCellFromTavern));
addClick("shop-building", () => delayVillageAction("shop", openShop));
addClick("sell-building", () => delayVillageAction("sell", sellStuffAtVillage));
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

document.querySelectorAll("[data-debug-combat]").forEach((button) => {
  button.addEventListener("click", () => debugStartCombat(button.dataset.debugCombat));
});

document.querySelectorAll("[data-debug-stuff]").forEach((button) => {
  button.addEventListener("click", () => debugAddStuff(button.dataset.debugStuff));
});

renderDebugEvents();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeInventory();
    closeAccountPopover();
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

function hodorianStats() {
  const stats = normalizeStats(state.stats);
  const gloire = stats.sortiesReussies + stats.combatsGagnes + stats.miniJeuxReussis;
  const souffrance = stats.humiliations + stats.degatsSubis + stats.mortsRidicules;
  const avidite = stats.poGagnes + stats.objetsRamasses;
  const obstination = stats.runsTotal + stats.etagesVisites;
  return {
    ...stats,
    gloire,
    souffrance,
    avidite,
    obstination,
    scoreHodorienTotal: gloire + souffrance + avidite + obstination,
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
  setSignupStatus("Création de compte", "neutral");
  overlay.hidden = false;
  $("signup-alias")?.focus();
}

function closeSignupPanel() {
  const overlay = $("account-signup-overlay");
  if (overlay) overlay.hidden = true;
}

function isAccountPanelOpen() {
  const panel = $("account-panel");
  return Boolean(panel && !panel.hidden);
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
    await applySession(data.session);
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    applySession(session);
  });
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

  const { data, error } = await supabaseClient.rpc("resolve_login_alias", { p_alias: alias });
  if (error || !data) {
    if (!quiet) {
      setAccountStatus("Pseudo introuvable", "bad");
      setAccountHelp("Essaie ton email si ton compte a été créé avant les pseudos.");
    }
    return "";
  }

  return String(data).trim().toLowerCase();
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
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
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
  } else {
    cloudState.transferMessage = "Compte créé : progression visiteur transférée.";
    setSignupStatus("Compte créé. Progression visiteur transférée.", "good");
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
      supabaseClient.from("player_saves").select("bank_gold,total_gold,wins,losses,upgrades,active_run").eq("user_id", cloudState.user.id).maybeSingle(),
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
      resetRunCarryover();
      state.bankGold = Number(save.bank_gold || 0);
      state.stats = normalizeStats({
        ...state.stats,
        wins: Number(save.wins || 0),
        losses: Number(save.losses || 0),
        goldBankedTotal: Number(save.total_gold || 0),
      });
      state.upgrades = { ...(save.upgrades || {}) };
      saveBankGold(state.bankGold);
      saveStats();
      saveUpgrades();
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
  state.inventory = [];
  state.combat = null;
  state.combatArenaKey = "";
  state.miniGame = null;
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
    combatKey: combatKeyFor(state.combat),
    combatArenaKey: state.screen === "combat" ? combatArenaFor(state.combatArenaKey).key : "",
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
  state.runLosses = snapshot.runLosses;
  state.floorShift = snapshot.floorShift;
  state.combat = snapshot.screen === "combat" ? monsters[snapshot.combatKey] || null : null;
  state.combatArenaKey = snapshot.screen === "combat" ? snapshot.combatArenaKey : "";
  if (snapshot.screen === "combat" && !state.combat) {
    state.screen = "dungeon";
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
  setStory("Grodor reprend exactement là où il avait abandonné la paperasse.");
  return true;
}

function sanitizeActiveRun(activeRun) {
  if (!activeRun || typeof activeRun !== "object" || activeRun.version !== 1) return null;
  if (activeRun.screen !== "dungeon" && activeRun.screen !== "combat") return null;

  const floor = Math.max(1, Math.floor(Number(activeRun.floor || 1)));
  const totalFloors = Math.max(floor, Math.floor(Number(activeRun.totalFloors || floor || TOTAL_FLOORS)));
  const life = Math.max(1, Math.floor(Number(activeRun.life || START_LIFE)));
  const maxLife = Math.max(life, Math.floor(Number(activeRun.maxLife || START_LIFE)));
  const inventory = Array.isArray(activeRun.inventory)
    ? activeRun.inventory.filter((item) => typeof item === "string" && itemSaleValues[item] !== undefined).slice(0, 12)
    : [];
  const combatKey = typeof activeRun.combatKey === "string" && monsters[activeRun.combatKey] ? activeRun.combatKey : "";
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
    combatKey,
    combatArenaKey,
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
  return `${text} Les PO en poche sont perdues. Les gardes te renvoient dans les geôles, gros naze.`;
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
    "<p>Lis les indices, garde ta bourse au chaud, et ne vends ton stuff que si tu assumes vraiment.</p>",
    "<small>Jeu indé : courage, même les murs apprennent lentement.</small>",
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
  if (/\+\d+\s*coeur|caillou affectif|hache emoussee|casque trop petit|sandales de panique|medaillon|chaussette|gants|slip|cape/.test(effectText)) return "victory";
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
  const duplicate = duplicateItemEffect(sentence);
  if (duplicate) {
    return {
      story: "Tu trouves un objet. Le donjon ricane doucement.",
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
    return {
      story: cleanupStorySentence(sentence.replace(numericEffect[0], "").replace(/\bmaximum\b/i, "")),
      reward: numericEffect[1],
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
      story: cleanupStorySentence(stripKnownItem(sentence)),
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
    .split(/\n+|(?<=\.)\s+/)
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

  villageActionTimer = window.setTimeout(() => {
    villageActionTimer = null;
    action();
    villageReturnTimer = window.setTimeout(() => {
      clearVillageActionTarget();
      if (state.screen !== "village") return;
      state.villageLocation = "Village";
      setStory("Grodor revient au centre du village. Pour installer le jeu : menu du navigateur, puis « Ajouter à l'écran d'accueil ». Même le village appelle ça du progrès.");
      render();
    }, VILLAGE_RETURN_DELAY_MS);
  }, VILLAGE_ACTION_DELAY_MS);
}

function openShop() {
  if (state.screen !== "village") return;
  closeInventory();
  closeAccountPopover();
  shopPanelOpen = true;
  statsPanelOpen = false;
  state.hodorPose = "walk";
  state.showWinBanner = false;
  state.villageLocation = "Échoppe";
  setStory("Le vendeur sourit comme quelqu'un qui a déjà compté ton argent deux fois, gros pigeon médiéval.");
  renderShop();
  render();
}

function closeShop() {
  if (!shopPanelOpen) return;
  shopPanelOpen = false;
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
  state.showWinBanner = false;
  state.villageLocation = "Panneau d'affichage";
  setStory("Le panneau d'affichage liste tes exploits avec une ponctuation humiliante.");
  render();
}

function setStatsPanelView(view) {
  if (!statsPanelOpen) return;
  statsPanelView = view;
  renderStatsPanel();
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
  stopDungeonDoorWalkPreview();
  setDungeonDoorTarget(door.dataset.door);
  door.blur();
  flashDoor(door);
  state.inputLocked = true;
  setStory("Grodor pose la main sur la poignée. Le donjon retient son souffle, probablement pour économiser l'air.");
  render();

  window.setTimeout(() => resolveDoorChoice(), 2000);
}

function previewDungeonDoorWalk(event) {
  if (state.screen !== "dungeon" || state.inputLocked || dungeonEffectPoseTimer || event.currentTarget.disabled) return;
  setDungeonDoorTarget(event.currentTarget.dataset.door);
  state.hodorPose = "walk";
  renderHodor();
}

function previewDungeonDoorWalkFromPointer(event) {
  if (state.screen !== "dungeon" || state.inputLocked || dungeonEffectPoseTimer) return;
  const door = event.target.closest(".door");
  if (door && !door.disabled) {
    setDungeonDoorTarget(door.dataset.door);
    if (state.hodorPose !== "walk") {
      state.hodorPose = "walk";
      renderHodor();
    }
    return;
  }
  if (state.hodorPose === "walk") {
    setDungeonDoorTarget(null);
    state.hodorPose = "question";
    renderHodor();
  }
}

function stopDungeonDoorWalkPreview() {
  if (state.screen !== "dungeon" || state.inputLocked || dungeonEffectPoseTimer) return;
  setDungeonDoorTarget(null);
  state.hodorPose = "question";
  renderHodor();
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
  const text = weightedEvent().run();
  let suffix = "";

  if (state.miniGame) {
    setStory(text, "neutral");
    resetDoorEffects();
    render();
    return;
  }

  if (!state.runEnded && state.screen === "dungeon") {
    suffix = descendFloor();
  }

  setStory(text + suffix, toneFromSnapshot(before));
  prepareDoorHints();
  state.inputLocked = false;
  resetDoorEffects();
  holdDungeonEffectPoseBriefly();
  render();
}

function startMiniGame(type) {
  const configs = {
    double: {
      title: "Quitte ou double",
      text: state.carriedGold > 0
        ? `Le croupier lorgne tes ${state.carriedGold} PO. Il promet que les probabilités sont presque légales.`
        : "Le croupier regarde ta bourse vide. Il propose de miser un bout de dignité, ce qui n'est pas une monnaie stable.",
      display: ["PILE", "FACE"],
      actions: state.carriedGold > 0
        ? [
            { id: "double-all", label: "Tout miser" },
            { id: "double-half", label: "Miser la moitié" },
            { id: "double-flee", label: "Fuir" },
          ]
        : [
            { id: "double-dignity", label: "Miser la dignité" },
            { id: "double-flee", label: "Fuir" },
          ],
    },
    slots: {
      title: "Machine à sous maudite",
      text: "Trois rouleaux grincent comme des genoux de squelette. Le levier a l'air coupable.",
      display: ["?", "?", "?"],
      actions: [{ id: "slots-spin", label: "Tirer le levier" }],
    },
    cards: {
      title: "Bonneteau du donjon",
      text: "Trois cartes. Une promesse. Deux humiliations. Le marchand jure qu'il ne triche qu'avec passion.",
      display: ["I", "II", "III"],
      actions: [
        { id: "card-0", label: "Carte I" },
        { id: "card-1", label: "Carte II" },
        { id: "card-2", label: "Carte III" },
      ],
    },
  };

  state.miniGame = { type, ...configs[type] };
  return "Le donjon ouvre un petit jeu de hasard. Grodor sent que son avenir vient de devenir cliquable.";
}

function resolveMiniGame(action) {
  if (!state.miniGame || state.screen !== "dungeon") return;

  const before = snapshotRun();
  const outcome = miniGameOutcome(action);
  let suffix = "";

  state.miniGame = null;
  if (!state.runEnded && state.screen === "dungeon") {
    suffix = descendFloor();
  }

  setStory(outcome + suffix, toneFromSnapshot(before));
  prepareDoorHints();
  state.inputLocked = false;
  resetDoorEffects();
  holdDungeonEffectPoseBriefly();
  render();
}

function miniGameOutcome(action) {
  if (action === "double-flee") {
    return "Grodor recule lentement devant la table. Le croupier note 'lâche mais solvable' dans son carnet.";
  }

  if (action === "double-dignity") {
    return takeDamage(1, "Grodor mise sa dignité. Le croupier demande une monnaie moins abîmée, puis frappe la table. -1 cœur.");
  }

  if (action === "double-all" || action === "double-half") {
    const stake = action === "double-all"
      ? state.carriedGold
      : Math.max(1, Math.floor(state.carriedGold / 2));
    const roll = Math.random();

    if (roll < 0.04) {
      addStat("miniJeuxReussis");
      return addGold(stake * 3, `Grodor pousse sa mise. La table fait une erreur administrative magnifique. +${stake * 3} PO.`);
    }
    if (roll < 0.18) {
      addStat("miniJeuxReussis");
      return addGold(stake, `Grodor pousse sa mise. La table grogne, puis paie à contrecœur. +${stake} PO.`);
    }
    if (roll < 0.78) {
      state.carriedGold = Math.max(0, state.carriedGold - stake);
      return `Grodor pousse sa mise. Le croupier retourne une carte nommée 'non'. -${stake} PO.`;
    }
    state.carriedGold = Math.max(0, state.carriedGold - stake);
    return takeDamage(1, `Grodor pousse sa mise. La table perd patience et gagne physiquement. -${stake} PO. -1 cœur.`);
  }

  if (action === "slots-spin") {
    const symbols = ["HODOR", "PO", "CRANE", "RIEN", "BOTTE"];
    const reels = [randomFrom(symbols), randomFrom(symbols), randomFrom(symbols)];
    if (reels.every((symbol) => symbol === "HODOR")) {
      addStat("miniJeuxReussis");
      return addGold(50, `La machine affiche ${reels.join(" / ")}. Le jackpot tombe comme une erreur de jugement. +50 PO.`);
    }
    if (reels.every((symbol) => symbol === "PO")) {
      addStat("miniJeuxReussis");
      return addGold(20, `La machine affiche ${reels.join(" / ")}. Elle paie en soupirant. +20 PO.`);
    }
    if (reels.every((symbol) => symbol === "CRANE")) {
      return takeDamage(1, `La machine affiche ${reels.join(" / ")}. Elle appelle ça un lot de consolation osseux. -1 cœur.`);
    }
    if (reels[0] === reels[1]) {
      addStat("miniJeuxReussis");
      return addGold(5, `La machine affiche ${reels.join(" / ")}. Deux symboles presque utiles suffisent à vexer la caisse. +5 PO.`);
    }

    const loss = Math.min(state.carriedGold, randomInt(2, 6));
    state.carriedGold -= loss;
    return loss
      ? `La machine affiche ${reels.join(" / ")}. Rien ne s'aligne, sauf la honte. -${loss} PO.`
      : `La machine affiche ${reels.join(" / ")}. Elle tente de voler ta bourse vide et repart avec un malaise.`;
  }

  if (/^card-[0-2]$/.test(action)) {
    const picked = Number(action.slice(-1));
    const jackpot = randomInt(0, 2);
    const skull = (jackpot + randomInt(1, 2)) % 3;

    if (picked === jackpot) {
      addStat("miniJeuxReussis");
      return addGold(25, "Grodor retourne la bonne carte. Le marchand accuse le destin de tricher. +25 PO.");
    }
    if (picked === skull) {
      return takeDamage(1, "Grodor retourne une carte avec un crâne qui avait manifestement des bras. -1 cœur.");
    }

    const loss = Math.min(state.carriedGold, randomInt(4, 10));
    state.carriedGold -= loss;
    return loss
      ? `Grodor retourne une carte vide. Le marchand appelle ça une leçon premium. -${loss} PO.`
      : "Grodor retourne une carte vide. Le marchand facture le silence, mais ta bourse est déjà un désert.";
  }

  return "Grodor hésite si fort que le mini-jeu abandonne.";
}

function clearDungeonEffectPoseTimer() {
  if (dungeonEffectPoseTimer) {
    window.clearTimeout(dungeonEffectPoseTimer);
  }
  dungeonEffectPoseTimer = null;
  setDungeonDoorTarget(null);
  $("scene")?.classList.remove("is-effect-pose");
}

function holdDungeonEffectPoseBriefly() {
  clearDungeonEffectPoseTimer();
  if (state.screen !== "dungeon" || state.inputLocked) return;

  const effectPose = state.hodorPose || "question";
  setDungeonDoorTarget(null);
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

  if (roll < 0.68) {
    state.screen = "village";
    state.runEnded = true;
    state.life = state.maxLife;
    recordWin();
    return "La dernière porte s'ouvre enfin. Dehors, le village cache mal sa surprise.";
  }

  if (roll < 0.92) {
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
  state.screen = "combat";
  state.combat = monster;
  state.combatArenaKey = randomCombatArenaKey();
  state.hodorPose = "idle";
  state.combatStrike = "";
  state.combatImpact = "";
  return `${monster.intro} Grodor doit choisir une stratégie, ce qui surestime tout le monde.`;
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
    state.combat = null;
    state.combatArenaKey = "";
    state.inputLocked = false;
    state.combatStrike = "";
    state.combatImpact = "";

    if (!state.runEnded) {
      state.screen = "dungeon";
      setStory(outcome + descendFloor(), toneFromSnapshot(before));
      prepareDoorHints();
    } else {
      setStory(outcome, toneFromSnapshot(before));
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
  const strikeText = strikeLabel(strike);

  if (roll < deathChance) {
    return useCombatItems(instantDeath(`Tu tentes de ${strikeText}. ${monster.name} corrige ton optimisme.`), usedItems);
  }

  if (roll < deathChance + profile.loseItem && state.inventory.length) {
    const lost = removeRandomItem();
    return useCombatItems(`Tu tentes de ${strikeText}. Tu survis, mais ${monster.name} pulvérise ton objet : ${lost}.`, usedItems);
  }

  if (roll < deathChance + profile.loseItem + profile.hurt) {
    return useCombatItems(takeDamage(1, `Tu tentes de ${strikeText}. ${monster.name} refuse ton brouillon tactique, pauvre tanche. -1 cœur.`), usedItems);
  }

  if (roll < deathChance + profile.loseItem + profile.hurt + winChance) {
    const gold = randomInt(monster.reward[0], monster.reward[1]);
    addStat("combatsGagnes");
    return useCombatItems(addGold(gold, `Tu tentes de ${strikeText}. Le hasard fait semblant d'être ton ami. +${gold} PO.`), usedItems);
  }

  return useCombatItems(`Tu tentes de ${strikeText}. Vous vous ratez tous les deux. Le silence juge la scène.`, usedItems);
}

function useCombatItems(text, items) {
  const consumed = [];
  const item = items.find((candidate) => hasItem(candidate));
  if (item) {
    if (Math.random() < itemBreakChance(item)) {
      removeItem(item);
      consumed.push(item);
      if (item === "Slip de Guerre") {
        state.maxLife = Math.max(START_LIFE, state.maxLife - 1);
        state.life = Math.min(state.life, state.maxLife);
      }
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

function strikeLabel(strike) {
  if (strike === "head") return "taper dans la tête";
  if (strike === "legs") return "taper dans les jambes";
  return "taper dans le torse";
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
  if (state.floor <= 0) {
    state.screen = "village";
    state.runEnded = true;
    state.life = state.maxLife;
    recordWin();
    return " Grodor voit enfin la sortie. Il a survécu, ce qui surprend tout le monde, surtout lui.";
  }
  return "";
}

function shiftFloors(amount) {
  state.floorShift = amount;
}

function recordWin() {
  if (state.winRecorded) return;
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

function villageShameText() {
  const wins = state.stats.wins || 0;
  const losses = state.stats.losses || 0;
  const balance = wins - losses;

  if (wins === 0 && losses === 0) return "Dignité : pas encore abîmée";
  if (balance >= 8) return "Dignité : suspectement haute";
  if (balance >= 5) return "Dignité : presque reconnue";
  if (balance >= 2) return "Dignité : tient avec une ficelle";
  if (balance >= 0) return "Dignité : fragile mais comptable";
  if (balance >= -2) return "Dignité : cabossée";
  if (balance >= -5) return "Dignité : vendue en lot";
  return "Dignité : vue pour la dernière fois près d'une trappe";
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
  setDungeonDoorTarget(null);
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

function addGold(amount, text) {
  const stickyGlovesBonus = hasItem("Gants Collants") && Math.random() < 0.35 ? 1 : 0;
  const gained = amount + stickyGlovesBonus;
  let suffix = "";

  if (stickyGlovesBonus) {
    suffix = " Les gants collants ramassent 1 PO de plus, et probablement autre chose.";
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
  state.combatArenaKey = "";
  state.miniGame = null;
  if (screen === "mort") {
    state.life = 0;
    state.carriedGold = 0;
    state.inventory = [];
    addStat("mortsRidicules");
    recordLoss();
  }
}

function recordLoss() {
  if (state.lossRecorded || state.winRecorded) return;
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
  const soldItems = sellInventory();
  if (soldItems.total) {
    state.carriedGold += soldItems.total;
  }
  setStory(sellStuffText(soldItems), soldItems.total ? "good" : "neutral");
  render();
}

function sellInventory() {
  if (!state.inventory.length) {
    return { total: 0, details: [] };
  }

  const details = state.inventory.map((item) => ({
    item,
    value: itemSaleValues[item] ?? 1,
  }));
  const total = details.reduce((sum, entry) => sum + entry.value, 0);
  state.inventory = [];
  return { total, details };
}

function bankDepositText(deposited) {
  if (!deposited) {
    return "Le banquier regarde ta bourse vide. Il tamponne quand même un papier pour se sentir puissant.";
  }

  return `Le banquier pèse ta bourse et range les pièces dans son coffre sinistre. Ton stuff reste dans le sac, pour le meilleur et surtout pour le pire. Total sauvegarde : ${deposited} PO.`;
}

function sellStuffText(soldItems) {
  if (!soldItems.details.length) {
    return "Le revendeur inspecte ton sac vide avec une loupe. Il appelle ça une estimation rapide.";
  }

  return `Le revendeur rachète ${soldItems.details.length} objet${soldItems.details.length > 1 ? "s" : ""} pour ${soldItems.total} PO dans ta bourse. Grodor garde le sac, c'est déjà ça.`;
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
  state.combatArenaKey = "";
  state.doorHints = [];
  state.inputLocked = false;
  state.floorShift = 0;
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
  state.combatArenaKey = "";
  state.doorHints = [];
  state.inputLocked = false;
  state.floorShift = 0;
  if (resetLossStreak) {
    state.runLosses = 0;
  }
  state.lossRecorded = false;
  state.winRecorded = false;
  state.koBannerText = "";
  state.winBannerText = "";
  addStat("runsTotal");
  saveStats();
  applyRunUpgrades();
  prepareDoorHints();
  setStory("Grodor force la porte des geôles avec beaucoup d'optimisme et très peu de technique. Trois portes l'attendent. Bonne chance, gros benêt.");
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
  setStory("La taverne sert un conseil imbuvable. Grodor se réveille dans les geôles avec sa bourse, ce qui prouve que même les voleurs ont des limites.");
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
      state.maxLife += 1;
      state.life += 1;
    } else {
      state.maxLife = Math.max(1, state.maxLife - 1);
      state.life = Math.min(state.life, state.maxLife);
    }
  }

  if (Math.random() < upgradeChance("colis", [0.36, 0.52, 0.7])) {
    const item = randomStartingItem();
    state.inventory.push(item);
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
  const texts = {
    "Casque Trop Petit": "Tu trouves un casque trop petit sous une pancarte 'taille universelle'. Mensonge artisanal.",
    "Medaillon du Presque-Heros": "Tu ramasses un médaillon du presque-héros. Il brille comme une promesse pas tenue.",
    "Sandales de Panique": "Tu trouves des sandales de panique. Elles tremblent déjà sans toi.",
    "Hache Emoussee": "Tu récupères une hache émoussée. Elle menace surtout la patience des ennemis.",
    "Boulet au Pied": "Tu trouves un boulet au pied. Il a l'air de vouloir une relation sérieuse.",
    "Chaussette Porte-Bonheur": "Tu trouves une chaussette porte-bonheur. Elle sent la victoire mal rangée.",
    "Caillou Affectif": "Tu adoptes un caillou affectif. Il ne juge pas, avantage rare ici.",
    "Cape Trop Longue": "Tu trouves une cape trop longue. Elle a déjà enterré plusieurs ambitions.",
    "Gants Collants": "Tu enfiles des gants collants. Ils connaissent des poches que tu n'as jamais vues.",
  };
  return addItem(item, texts[item] || `Tu trouves ${item}. Le donjon refuse d'expliquer pourquoi.`);
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
    { type: "double", label: "Quitte ou double" },
    { type: "slots", label: "Machine à sous" },
    { type: "cards", label: "Bonneteau" },
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
  state.combatArenaKey = "";
  state.doorHints = [];
  state.floorShift = 0;
  state.totalFloors = Math.max(state.totalFloors || 10, 10);
  state.floor = Math.max(2, Math.min(state.floor || state.totalFloors, state.totalFloors));
  state.maxLife = Math.max(state.maxLife || START_LIFE, START_LIFE);
  state.life = Math.max(1, Math.min(state.life || state.maxLife, state.maxLife));
  state.hodorPose = "question";

  setStory(startMiniGame(type), "neutral");
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
  state.maxLife = Math.max(state.maxLife || START_LIFE, START_LIFE);
  state.life = Math.max(1, state.life || state.maxLife);
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
  state.inventory = [];
  state.hodorPose = "question";
  setStory("Debug : stuff vide. Grodor regarde ses mains comme si c'était un plan.");
  render();
}

function renderShop() {
  const grid = $("upgrade-grid");
  grid.textContent = "";

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

function addItem(item, text) {
  if (!hasItem(item)) {
    state.inventory.push(item);
    state.eventToneOverride = "good";
    addStat("objetsRamasses");
    saveStats();
    return text;
  }
  state.eventToneOverride = "bad";
  return itemDuplicateTexts[item] || `Tu trouves ${item}, mais tu l'as déjà. Dommage. Le donjon ricane doucement.`;
}

function removeItem(item) {
  state.inventory = state.inventory.filter((owned) => owned !== item);
}

function removeRandomItem() {
  const index = randomInt(0, state.inventory.length - 1);
  const item = state.inventory[index];
  state.inventory.splice(index, 1);
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
  const total = state.inventory.length + Object.values(state.upgrades).filter((level) => level > 0).length;
  if (toggle) {
    toggle.classList.toggle("has-items", total > 0);
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
  $("stats-tab-stats")?.setAttribute("aria-selected", String(statsPanelView === "stats"));
  $("stats-tab-ranking")?.setAttribute("aria-selected", String(statsPanelView === "ranking"));
  grid.classList.toggle("is-ranking", statsPanelView === "ranking");
  grid.textContent = "";

  if (statsPanelView === "ranking") {
    const empty = document.createElement("article");
    empty.className = "stats-ranking-empty";
    const label = document.createElement("span");
    const title = document.createElement("strong");
    label.textContent = "Classement";
    title.textContent = "Bientôt";
    empty.append(label, title);
    grid.appendChild(empty);
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
  if (!miniGame) {
    display.textContent = "";
    actions.textContent = "";
    return;
  }

  title.textContent = miniGame.title;
  text.textContent = miniGame.text;
  display.textContent = "";
  actions.textContent = "";

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

function render() {
  if (state.screen === "village" || state.screen === "shop") {
    state.life = state.maxLife;
  }

  const showsFloor = state.screen === "dungeon" || state.screen === "combat";
  if (isAccountPanelOpen()) {
    $("place-label").textContent = "Lieu";
    $("floor").textContent = "Donjon";
  } else {
    $("place-label").textContent = showsFloor ? "Étage" : "Lieu";
    $("floor").textContent = state.screen === "village" || state.screen === "shop"
      ? "Village"
      : state.screen === "cell"
        ? "Cellule"
        : state.screen === "mort"
          ? "Geôles"
          : state.floor;
  }
  $("carried-gold").textContent = state.carriedGold;
  $("bank-gold").textContent = state.bankGold;
  $("bank-building-gold").textContent = state.bankGold;
  $("loss-count").textContent = state.runLosses;
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

  $("scene").classList.toggle("is-dead", isDead);
  $("scene").classList.toggle("is-combat", isCombat);
  $("scene").classList.toggle("is-village", isVillage || isShop);
  $("scene").classList.toggle("is-dungeon", isDungeon || isCombat);
  $("scene").classList.toggle("is-cell", isCell);
  $("scene").classList.toggle("is-locked", state.inputLocked);
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
  placeHodorForScreen(isDungeon);
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
  $("combat-choices").hidden = !isCombat;
  const monsterAsset = state.combat?.asset;
  const usesMonsterTarget = isCombat && Boolean(monsterAsset);
  $("combat-choices").classList.toggle("has-monster-target", usesMonsterTarget);
  $("monster-target").hidden = !usesMonsterTarget;
  $("monster-target").className = `monster-target ${monsterAsset ? `${monsterAsset}-target` : ""}`.trim();
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

function placeHodorForScreen(isDungeon) {
  const hodor = document.querySelector(".hodor-sprite");
  const dungeonStage = $("dungeon-stage");
  const villageStage = $("village-stage");
  const rewardRow = $("reward-row");
  if (!hodor || !dungeonStage || !rewardRow) return;

  const target = isDungeon ? dungeonStage : state.screen === "village" ? villageStage : rewardRow;
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
  const heartRow = $("heart-row");
  const previousLife = state.renderedLife;
  heartRow.textContent = "";
  for (let index = 0; index < state.maxLife; index += 1) {
    const heart = document.createElement("span");
    heart.className = `heart-icon${index < state.life ? " is-full" : ""}`;
    if (previousLife !== null) {
      if (index >= state.life && index < previousLife) heart.classList.add("is-lost");
      if (index < state.life && index >= previousLife) heart.classList.add("is-gained");
    }
    heartRow.appendChild(heart);
  }
  state.renderedLife = state.life;
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
  hodor.style.backgroundImage = assets.map(cssAssetUrl).join(", ");
  syncHodorWalkAnimation(pose);
}

function hodorPoseForScreen() {
  if (state.screen === "mort") return "dead";
  if (state.screen === "combat") return ["idle", "combat", "combat-2", "combat-3"].includes(state.hodorPose) ? state.hodorPose : "idle";
  if (state.screen === "shop") return "walk";
  if (state.screen === "village") return state.showWinBanner ? "victory" : "question";
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

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js", { scope: "./" })
      .catch((error) => {
        console.warn("Service worker non enregistre:", error);
      });
  });
}

registerServiceWorker();
