import { assetPath } from "../utils/assetPath";

export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1080;

export type AssetDefinition = {
  key: string;
  path: string;
};

export const AUDIO_ASSETS = {
  musicIntro: { key: "music-intro", path: assetPath("/assets/audio/music/logo-intro.mp3") },
  musicVillage: { key: "music-village", path: assetPath("/assets/audio/music/ambient-village.mp3") },
  musicDungeon: { key: "music-dungeon", path: assetPath("/assets/audio/music/ambient-dungeon.mp3") },
  musicCombat: { key: "music-combat", path: assetPath("/assets/audio/music/ambient-combat.mp3") },
  musicShop: { key: "music-shop", path: assetPath("/assets/audio/sfx/ambient_shop.mp3") },
  musicTavern: { key: "music-tavern", path: assetPath("/assets/audio/sfx/ambient_tavern.mp3") },
  musicBank: { key: "music-bank", path: assetPath("/assets/audio/sfx/ambient_bank.mp3") }
} satisfies Record<string, AssetDefinition>;

export const SFX_ASSETS = {
  uiClick: { key: "sfx-ui-click", path: assetPath("/assets/audio/sfx/ui_click.mp3") },
  cellDoorOpen: { key: "sfx-cell-door-open", path: assetPath("/assets/audio/sfx/cell_door_open.mp3") },
  dungeonDoorOpen: { key: "sfx-dungeon-door-open", path: assetPath("/assets/audio/sfx/dungeon_door_open.mp3") },
  goldGain: { key: "sfx-gold-gain", path: assetPath("/assets/audio/sfx/gold_gain.mp3") },
  goldLoss: { key: "sfx-gold-loss", path: assetPath("/assets/audio/sfx/gold_loss.mp3") },
  chestOpen: { key: "sfx-chest-open", path: assetPath("/assets/audio/sfx/chest_open.mp3") },
  itemPickup: { key: "sfx-item-pickup", path: assetPath("/assets/audio/sfx/item_pickup.mp3") },
  itemBreak: { key: "sfx-item-break", path: assetPath("/assets/audio/sfx/item_break.mp3") },
  grodorHurt: { key: "sfx-grodor-hurt", path: assetPath("/assets/audio/sfx/grodor_hurt.mp3") },
  grodorDeath: { key: "sfx-grodor-death", path: assetPath("/assets/audio/sfx/grodor_death.mp3") },
  combatHit: { key: "sfx-combat-hit", path: assetPath("/assets/audio/sfx/combat_hit.mp3") },
  miniGameSuccess: { key: "sfx-minigame-success", path: assetPath("/assets/audio/sfx/minigame_success.mp3") },
  miniGameFail: { key: "sfx-minigame-fail", path: assetPath("/assets/audio/sfx/minigame_fail.mp3") }
} satisfies Record<string, AssetDefinition>;

export const IMAGE_ASSETS = {
  introBackground: { key: "intro-background", path: assetPath("/assets/backgrounds/intro/intro_background.webp") },
  introLogo: { key: "intro-logo", path: assetPath("/assets/backgrounds/intro/intro_logo.png") },
  dungeonGeole: { key: "dungeon-geole", path: assetPath("/assets/backgrounds/dungeon/dungeon_geole.png") },
  dungeonInterior: { key: "dungeon-interior", path: assetPath("/assets/backgrounds/dungeon/dungeon_interior.webp") },
  dungeonChestOpen: { key: "dungeon-chest-open", path: assetPath("/assets/backgrounds/dungeon/dungeon_coffre_open.png") },
  villageBackground: { key: "village-background", path: assetPath("/assets/village/village_background.png") },
  tavernBackground: { key: "tavern-background", path: assetPath("/assets/village/tavern/tavern_background.png") },
  tavernDrinkBeer: { key: "tavern-drink-beer", path: assetPath("/assets/village/tavern/drink_beer.png") },
  villagePouchEmpty: { key: "village-pouch-empty", path: assetPath("/assets/village/ui/villagePouchEmpty.png") },
  villagePouchFull: { key: "village-pouch-full", path: assetPath("/assets/village/ui/villagePouchFull.png") },
  villageInventoryEmpty: { key: "village-inventory-empty", path: assetPath("/assets/village/ui/villageInventoryEmpty.png") },
  villageInventoryFull: { key: "village-inventory-full", path: assetPath("/assets/village/ui/villageInventoryFull.png") },
  bankBackground: { key: "bank-background", path: assetPath("/assets/village/bank/bank_background.webp") },
  bankDepositPanelEmpty: { key: "bank-deposit-panel-empty", path: assetPath("/assets/village/bank/bank_deposit_panel_empty.png") },
  bankMoneyStatusPanelEmpty: {
    key: "bank-money-status-panel-empty",
    path: assetPath("/assets/village/bank/bank_money_status_panel_empty.png")
  },
  bankExitPanelEmpty: { key: "bank-exit-panel-empty", path: assetPath("/assets/village/bank/bank_exit_panel_empty.png") },
  bankPouchIcon: { key: "bank-pouch-icon", path: assetPath("/assets/village/bank/bank_pouch_icon.png") },
  bankChestIcon: { key: "bank-chest-icon", path: assetPath("/assets/village/bank/bank_chest_icon.png") },
  bankInfoPanelEmpty: { key: "bank-info-panel-empty", path: assetPath("/assets/village/bank/bank_info_panel_empty.png") },
  bankSeparator: { key: "bank-separator", path: assetPath("/assets/village/bank/bank_separateur.png") },
  grodorHouseChestPanel: { key: "grodor-house-chest-panel", path: assetPath("/assets/ui/inventory/chest_grid_panel.png") },
  inventoryEquipmentPanel: { key: "inventory-equipment-panel", path: assetPath("/assets/ui/inventory/inventory_equipment_panel.png") },
  inventoryWindowFrameEmpty: {
    key: "inventory-window-frame-empty",
    path: assetPath("/assets/ui/inventory/inventory_window_frame_empty.png")
  },
  inventoryEquipmentSlotEmpty: {
    key: "inventory-equipment-slot-empty",
    path: assetPath("/assets/ui/inventory/inventory_equipment_slot_empty.png")
  },
  inventoryKeySlotEmpty: { key: "inventory-key-slot-empty", path: assetPath("/assets/ui/inventory/inventory_key_slot_empty.png") },
  inventoryCloseButton: { key: "inventory-close-button", path: assetPath("/assets/ui/inventory/inventory_close_button.png") },
  shopMarcelBackground: { key: "shop-marcel-background", path: assetPath("/assets/village/shop/shop_marcel_background.webp") },
  shopTitleSignEmpty: { key: "shop-title-sign-empty", path: assetPath("/assets/village/shop/shop_title_sign_empty.png") },
  shopCategoryPanelEmpty: { key: "shop-category-panel-empty", path: assetPath("/assets/village/shop/shop_category_panel_empty.png") },
  shopCategoryObjectsIcon: { key: "shop-category-objects-icon", path: assetPath("/assets/village/shop/shop_category_objects_icon.png") },
  shopCategoryPassivesIcon: { key: "shop-category-passives-icon", path: assetPath("/assets/village/shop/shop_category_passives_icon.png") },
  shopCategoryResellIcon: { key: "shop-category-resell-icon", path: assetPath("/assets/village/shop/shop_category_resell_icon.png") },
  shopItemsWindowFrame: { key: "shop-items-window-frame", path: assetPath("/assets/village/shop/shop_items_window_frame.png") },
  shopItemSlotEmpty: { key: "shop-item-slot-empty", path: assetPath("/assets/village/shop/shop_item_slot_empty.png") },
  shopItemSlotHover: { key: "shop-item-slot-hover", path: assetPath("/assets/village/shop/shop_item_slot_hover.png") },
  shopItemSlotSelected: { key: "shop-item-slot-selected", path: assetPath("/assets/village/shop/shop_item_slot_selected.png") },
  shopBuyButtonNormal: { key: "shop-buy-button-normal", path: assetPath("/assets/village/shop/shop_buy_button_normal.png") },
  shopBuyButtonHover: { key: "shop-buy-button-hover", path: assetPath("/assets/village/shop/shop_buy_button_hover.png") },
  shopBuyButtonDisabled: { key: "shop-buy-button-disabled", path: assetPath("/assets/village/shop/shop_buy_button_disabled.png") },
  shopCloseButton: { key: "shop-close-button", path: assetPath("/assets/village/shop/shop_close_button.png") },
  shopPageArrowLeft: { key: "shop-page-arrow-left", path: assetPath("/assets/village/shop/shop_page_arrow_left.png") },
  shopPageArrowRight: { key: "shop-page-arrow-right", path: assetPath("/assets/village/shop/shop_page_arrow_right.png") },
  shopItemNameRibbonEmpty: { key: "shop-item-name-ribbon-empty", path: assetPath("/assets/village/shop/shop_item_name_ribbon_empty.png") },
  shopPassivesWindowFrame: { key: "shop-passives-window-frame", path: assetPath("/assets/ui/shop/shop_passives_window_frame.png") },
  shopPassiveRowNormal: { key: "shop-passive-row-normal", path: assetPath("/assets/ui/shop/shop_passive_row_normal.png") },
  shopPassiveRowHover: { key: "shop-passive-row-hover", path: assetPath("/assets/ui/shop/shop_passive_row_hover.png") },
  shopPassiveRowSelected: { key: "shop-passive-row-selected", path: assetPath("/assets/ui/shop/shop_passive_row_selected.png") },
  shopPassiveDetailIconFrame: { key: "shop-passive-detail-icon-frame", path: assetPath("/assets/ui/shop/shop_passive_detail_icon_frame.png") },
  shopPassiveNameRibbonEmpty: { key: "shop-passive-name-ribbon-empty", path: assetPath("/assets/ui/shop/shop_passive_name_ribbon_empty.png") },
  passiveSurvivalDressing: { key: "passive-survival-dressing", path: assetPath("/assets/ui/shop/passives/passive_survival_dressing.png") },
  passiveCowardReflexes: { key: "passive-coward-reflexes", path: assetPath("/assets/ui/shop/passives/passive_coward_reflexes.png") },
  passiveTragicCardio: { key: "passive-tragic-cardio", path: assetPath("/assets/ui/shop/passives/passive_tragic_cardio.png") },
  passiveAlmostReliableInstinct: {
    key: "passive-almost-reliable-instinct",
    path: assetPath("/assets/ui/shop/passives/passive_almost_reliable_instinct.png")
  },
  passiveDoorReading: { key: "passive-door-reading", path: assetPath("/assets/ui/shop/passives/passive_door_reading.png") },
  door1: { key: "dungeon-door-1", path: assetPath("/assets/doors/dungeon/door_1.png") },
  door2: { key: "dungeon-door-2", path: assetPath("/assets/doors/dungeon/door_2.png") },
  door3: { key: "dungeon-door-3", path: assetPath("/assets/doors/dungeon/door_3.png") },
  door1Closed: { key: "dungeon-door-1-closed", path: assetPath("/assets/doors/dungeon/door_1_closed.png") },
  door1Open: { key: "dungeon-door-1-open", path: assetPath("/assets/doors/dungeon/door_1_open.png") },
  door2Closed: { key: "dungeon-door-2-closed", path: assetPath("/assets/doors/dungeon/door_2_closed.png") },
  door2Open: { key: "dungeon-door-2-open", path: assetPath("/assets/doors/dungeon/door_2_open.png") },
  door3Closed: { key: "dungeon-door-3-closed", path: assetPath("/assets/doors/dungeon/door_3_closed.png") },
  door3Open: { key: "dungeon-door-3-open", path: assetPath("/assets/doors/dungeon/door_3_open.png") },
  grodorIdle: { key: "grodor-idle", path: assetPath("/assets/sprites/grodor/grodor_idle.png") },
  grodorWalk1: { key: "grodor-walk-1", path: assetPath("/assets/sprites/grodor/grodor_walk_1.png") },
  grodorWalk2: { key: "grodor-walk-2", path: assetPath("/assets/sprites/grodor/grodor_walk_2.png") },
  grodorWalk3: { key: "grodor-walk-3", path: assetPath("/assets/sprites/grodor/grodor_walk_3.png") },
  grodorWalk4: { key: "grodor-walk-4", path: assetPath("/assets/sprites/grodor/grodor_walk_4.png") },
  grodorRun1: { key: "grodor-run-1", path: assetPath("/assets/sprites/grodor/grodor_run_01.png") },
  grodorRun2: { key: "grodor-run-2", path: assetPath("/assets/sprites/grodor/grodor_run_02.png") },
  grodorRun3: { key: "grodor-run-3", path: assetPath("/assets/sprites/grodor/grodor_run_03.png") },
  grodorJump2: { key: "grodor-jump-2", path: assetPath("/assets/sprites/grodor/grodor_jump_02.png") },
  grodorJump3: { key: "grodor-jump-3", path: assetPath("/assets/sprites/grodor/grodor_jump_03.png") },
  grodorJump5: { key: "grodor-jump-5", path: assetPath("/assets/sprites/grodor/grodor_jump_05.png") },
  grodorAttack1: { key: "grodor-attack-1", path: assetPath("/assets/sprites/grodor/grodor_attack_1.png") },
  grodorAttack2: { key: "grodor-attack-2", path: assetPath("/assets/sprites/grodor/grodor_attack_2.png") },
  grodorAttack3: { key: "grodor-attack-3", path: assetPath("/assets/sprites/grodor/grodor_attack_3.png") },
  grodorHurt: { key: "grodor-hurt", path: assetPath("/assets/sprites/grodor/grodor_hurt.png") },
  grodorDeath1: { key: "grodor-death-1", path: assetPath("/assets/sprites/grodor/grodor_death_1.png") },
  grodorDeath2: { key: "grodor-death-2", path: assetPath("/assets/sprites/grodor/grodor_death_2.png") },
  grodorVictory: { key: "grodor-victory", path: assetPath("/assets/sprites/grodor/grodor_victory.png") },
  grodorAxeIdle: { key: "grodor-axe-idle", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_idle.png") },
  grodorAxeWalk1: { key: "grodor-axe-walk-1", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_walk_1.png") },
  grodorAxeWalk2: { key: "grodor-axe-walk-2", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_walk_2.png") },
  grodorAxeWalk3: { key: "grodor-axe-walk-3", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_walk_3.png") },
  grodorAxeWalk4: { key: "grodor-axe-walk-4", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_walk_4.png") },
  grodorAxeAttack1: { key: "grodor-axe-attack-1", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_attack_1.png") },
  grodorAxeAttack2: { key: "grodor-axe-attack-2", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_attack_2.png") },
  grodorAxeAttack3: { key: "grodor-axe-attack-3", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_attack_3.png") },
  grodorAxeHurt: { key: "grodor-axe-hurt", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_hurt.png") },
  grodorAxeDeath: { key: "grodor-axe-death", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_death.png") },
  grodorAxeVictory: { key: "grodor-axe-victory", path: assetPath("/assets/sprites/grodor/equipment/axe/axe_victory.png") },
  grodorWarUnderwearIdle: {
    key: "grodor-war-underwear-idle",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_idle.png")
  },
  grodorWarUnderwearWalk1: {
    key: "grodor-war-underwear-walk-1",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_walk_1.png")
  },
  grodorWarUnderwearWalk2: {
    key: "grodor-war-underwear-walk-2",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_walk_2.png")
  },
  grodorWarUnderwearWalk3: {
    key: "grodor-war-underwear-walk-3",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_walk_3.png")
  },
  grodorWarUnderwearWalk4: {
    key: "grodor-war-underwear-walk-4",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_walk_4.png")
  },
  grodorWarUnderwearAttack1: {
    key: "grodor-war-underwear-attack-1",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_attack_1.png")
  },
  grodorWarUnderwearAttack2: {
    key: "grodor-war-underwear-attack-2",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_attack_2.png")
  },
  grodorWarUnderwearAttack3: {
    key: "grodor-war-underwear-attack-3",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_attack_3.png")
  },
  grodorWarUnderwearHurt: {
    key: "grodor-war-underwear-hurt",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_hurt.png")
  },
  grodorWarUnderwearDeath: {
    key: "grodor-war-underwear-death",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_death.png")
  },
  grodorWarUnderwearVictory: {
    key: "grodor-war-underwear-victory",
    path: assetPath("/assets/sprites/grodor/equipment/war_underwear/war_underwear_victory.png")
  },
  grodorPanicSandalsIdle: {
    key: "grodor-panic-sandals-idle",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_idle.png")
  },
  grodorPanicSandalsWalk1: {
    key: "grodor-panic-sandals-walk-1",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_walk_1.png")
  },
  grodorPanicSandalsWalk2: {
    key: "grodor-panic-sandals-walk-2",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_walk_2.png")
  },
  grodorPanicSandalsWalk3: {
    key: "grodor-panic-sandals-walk-3",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_walk_3.png")
  },
  grodorPanicSandalsWalk4: {
    key: "grodor-panic-sandals-walk-4",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_walk_4.png")
  },
  grodorPanicSandalsAttack1: {
    key: "grodor-panic-sandals-attack-1",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_attack_1.png")
  },
  grodorPanicSandalsAttack2: {
    key: "grodor-panic-sandals-attack-2",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_attack_2.png")
  },
  grodorPanicSandalsAttack3: {
    key: "grodor-panic-sandals-attack-3",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_attack_3.png")
  },
  grodorPanicSandalsHurt: {
    key: "grodor-panic-sandals-hurt",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_hurt.png")
  },
  grodorPanicSandalsDeath: {
    key: "grodor-panic-sandals-death",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_death.png")
  },
  grodorPanicSandalsVictory: {
    key: "grodor-panic-sandals-victory",
    path: assetPath("/assets/sprites/grodor/equipment/panic_sandals/panic_sandals_victory.png")
  },
  grodorAlmostHeroMedallionIdle: {
    key: "grodor-almost-hero-medallion-idle",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_idle.png")
  },
  grodorAlmostHeroMedallionWalk1: {
    key: "grodor-almost-hero-medallion-walk-1",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_walk_1.png")
  },
  grodorAlmostHeroMedallionWalk2: {
    key: "grodor-almost-hero-medallion-walk-2",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_walk_2.png")
  },
  grodorAlmostHeroMedallionWalk3: {
    key: "grodor-almost-hero-medallion-walk-3",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_walk_3.png")
  },
  grodorAlmostHeroMedallionWalk4: {
    key: "grodor-almost-hero-medallion-walk-4",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_walk_4.png")
  },
  grodorAlmostHeroMedallionAttack1: {
    key: "grodor-almost-hero-medallion-attack-1",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_attack_1.png")
  },
  grodorAlmostHeroMedallionAttack2: {
    key: "grodor-almost-hero-medallion-attack-2",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_attack_2.png")
  },
  grodorAlmostHeroMedallionAttack3: {
    key: "grodor-almost-hero-medallion-attack-3",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_attack_3.png")
  },
  grodorAlmostHeroMedallionHurt: {
    key: "grodor-almost-hero-medallion-hurt",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_hurt.png")
  },
  grodorAlmostHeroMedallionDeath: {
    key: "grodor-almost-hero-medallion-death",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_death.png")
  },
  grodorAlmostHeroMedallionVictory: {
    key: "grodor-almost-hero-medallion-victory",
    path: assetPath("/assets/sprites/grodor/equipment/almost_hero_medallion/almost_hero_medallion_victory.png")
  },
  grodorTooLongCapeIdle: {
    key: "grodor-too-long-cape-idle",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_idle.png")
  },
  grodorTooLongCapeWalk1: {
    key: "grodor-too-long-cape-walk-1",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_walk_1.png")
  },
  grodorTooLongCapeWalk2: {
    key: "grodor-too-long-cape-walk-2",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_walk_2.png")
  },
  grodorTooLongCapeWalk3: {
    key: "grodor-too-long-cape-walk-3",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_walk_3.png")
  },
  grodorTooLongCapeWalk4: {
    key: "grodor-too-long-cape-walk-4",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_walk_4.png")
  },
  grodorTooLongCapeAttack1: {
    key: "grodor-too-long-cape-attack-1",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_attack_1.png")
  },
  grodorTooLongCapeAttack2: {
    key: "grodor-too-long-cape-attack-2",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_attack_2.png")
  },
  grodorTooLongCapeAttack3: {
    key: "grodor-too-long-cape-attack-3",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_attack_3.png")
  },
  grodorTooLongCapeHurt: {
    key: "grodor-too-long-cape-hurt",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_hurt.png")
  },
  grodorTooLongCapeDeath: {
    key: "grodor-too-long-cape-death",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_death.png")
  },
  grodorTooLongCapeVictory: {
    key: "grodor-too-long-cape-victory",
    path: assetPath("/assets/sprites/grodor/equipment/too_long_cape/too_long_cape_victory.png")
  },
  grodorTinyHelmetIdle: {
    key: "grodor-tiny-helmet-idle",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_idle.png")
  },
  grodorTinyHelmetWalk1: {
    key: "grodor-tiny-helmet-walk-1",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_walk_1.png")
  },
  grodorTinyHelmetWalk2: {
    key: "grodor-tiny-helmet-walk-2",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_walk_2.png")
  },
  grodorTinyHelmetWalk3: {
    key: "grodor-tiny-helmet-walk-3",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_walk_3.png")
  },
  grodorTinyHelmetWalk4: {
    key: "grodor-tiny-helmet-walk-4",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_walk_4.png")
  },
  grodorTinyHelmetAttack1: {
    key: "grodor-tiny-helmet-attack-1",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_attack_1.png")
  },
  grodorTinyHelmetAttack2: {
    key: "grodor-tiny-helmet-attack-2",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_attack_2.png")
  },
  grodorTinyHelmetAttack3: {
    key: "grodor-tiny-helmet-attack-3",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_attack_3.png")
  },
  grodorTinyHelmetHurt: {
    key: "grodor-tiny-helmet-hurt",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_hurt.png")
  },
  grodorTinyHelmetDeath: {
    key: "grodor-tiny-helmet-death",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_death.png")
  },
  grodorTinyHelmetVictory: {
    key: "grodor-tiny-helmet-victory",
    path: assetPath("/assets/sprites/grodor/equipment/tiny_helmet/tiny_helmet_victory.png")
  },
  grodorAnkleBallIdle: {
    key: "grodor-ankle-ball-idle",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_idle.png")
  },
  grodorAnkleBallWalk1: {
    key: "grodor-ankle-ball-walk-1",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_walk_1.png")
  },
  grodorAnkleBallWalk2: {
    key: "grodor-ankle-ball-walk-2",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_walk_2.png")
  },
  grodorAnkleBallWalk3: {
    key: "grodor-ankle-ball-walk-3",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_walk_3.png")
  },
  grodorAnkleBallWalk4: {
    key: "grodor-ankle-ball-walk-4",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_walk_4.png")
  },
  grodorAnkleBallAttack1: {
    key: "grodor-ankle-ball-attack-1",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_attack_1.png")
  },
  grodorAnkleBallAttack2: {
    key: "grodor-ankle-ball-attack-2",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_attack_2.png")
  },
  grodorAnkleBallAttack3: {
    key: "grodor-ankle-ball-attack-3",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_attack_3.png")
  },
  grodorAnkleBallHurt: {
    key: "grodor-ankle-ball-hurt",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_hurt.png")
  },
  grodorAnkleBallDeath: {
    key: "grodor-ankle-ball-death",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_death.png")
  },
  grodorAnkleBallVictory: {
    key: "grodor-ankle-ball-victory",
    path: assetPath("/assets/sprites/grodor/equipment/ankle_ball/ankle_ball_victory.png")
  },
  grodorStickyGlovesIdle: {
    key: "grodor-sticky-gloves-idle",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_idle.png")
  },
  grodorStickyGlovesWalk1: {
    key: "grodor-sticky-gloves-walk-1",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_walk_1.png")
  },
  grodorStickyGlovesWalk2: {
    key: "grodor-sticky-gloves-walk-2",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_walk_2.png")
  },
  grodorStickyGlovesWalk3: {
    key: "grodor-sticky-gloves-walk-3",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_walk_3.png")
  },
  grodorStickyGlovesWalk4: {
    key: "grodor-sticky-gloves-walk-4",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_walk_4.png")
  },
  grodorStickyGlovesAttack1: {
    key: "grodor-sticky-gloves-attack-1",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_attack_1.png")
  },
  grodorStickyGlovesAttack2: {
    key: "grodor-sticky-gloves-attack-2",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_attack_2.png")
  },
  grodorStickyGlovesAttack3: {
    key: "grodor-sticky-gloves-attack-3",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_attack_3.png")
  },
  grodorStickyGlovesHurt: {
    key: "grodor-sticky-gloves-hurt",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_hurt.png")
  },
  grodorStickyGlovesDeath: {
    key: "grodor-sticky-gloves-death",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_death.png")
  },
  grodorStickyGlovesVictory: {
    key: "grodor-sticky-gloves-victory",
    path: assetPath("/assets/sprites/grodor/equipment/sticky_gloves/sticky_gloves_victory.png")
  },
  grodorEmotionalPebbleIdle: {
    key: "grodor-emotional-pebble-idle",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_idle.png")
  },
  grodorEmotionalPebbleWalk1: {
    key: "grodor-emotional-pebble-walk-1",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_walk_1.png")
  },
  grodorEmotionalPebbleWalk2: {
    key: "grodor-emotional-pebble-walk-2",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_walk_2.png")
  },
  grodorEmotionalPebbleWalk3: {
    key: "grodor-emotional-pebble-walk-3",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_walk_3.png")
  },
  grodorEmotionalPebbleWalk4: {
    key: "grodor-emotional-pebble-walk-4",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_walk_4.png")
  },
  grodorEmotionalPebbleAttack1: {
    key: "grodor-emotional-pebble-attack-1",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_attack_1.png")
  },
  grodorEmotionalPebbleAttack2: {
    key: "grodor-emotional-pebble-attack-2",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_attack_2.png")
  },
  grodorEmotionalPebbleAttack3: {
    key: "grodor-emotional-pebble-attack-3",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_attack_3.png")
  },
  grodorEmotionalPebbleHurt: {
    key: "grodor-emotional-pebble-hurt",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_hurt.png")
  },
  grodorEmotionalPebbleDeath: {
    key: "grodor-emotional-pebble-death",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_death.png")
  },
  grodorEmotionalPebbleVictory: {
    key: "grodor-emotional-pebble-victory",
    path: assetPath("/assets/sprites/grodor/equipment/emotional_pebble/emotional_pebble_victory.png")
  },
  hudLife: { key: "hud-life", path: assetPath("/assets/ui/stat_frame.png") },
  hudStat: { key: "hud-stat", path: assetPath("/assets/ui/stat_frame.png") },
  dungeonHudCounterFrame: {
    key: "dungeon-hud-counter-frame",
    path: assetPath("/assets/ui/dungeon/dungeon_hud_counter_frame.png")
  },
  dungeonHudStatusPanelEmpty: {
    key: "dungeon-hud-status-panel-empty",
    path: assetPath("/assets/ui/dungeon/dungeon_hud_status_panel_empty.png")
  },
  dungeonHudHeartFrame: {
    key: "dungeon-hud-heart-frame",
    path: assetPath("/assets/ui/dungeon/hud_coeur.png")
  },
  jumpButton: { key: "jump-button", path: assetPath("/assets/ui/jump_btn.png") },
  tapButton: { key: "tap-button", path: assetPath("/assets/ui/tap_btn.png") },
  hudAttempt: { key: "hud-attempt", path: assetPath("/assets/ui/attempt_frame.png") },
  hudFloor: { key: "hud-floor", path: assetPath("/assets/ui/floor_frame.png") },
  frameStory: { key: "frame-story", path: assetPath("/assets/ui/frames/story_frame.png") },
  gold: { key: "gold", path: assetPath("/assets/ui/gold.png") },
  heartFull: { key: "heart-full", path: assetPath("/assets/ui/heart_full.png") },
  heartEmpty: { key: "heart-empty", path: assetPath("/assets/ui/heart_empty.png") },
  heartBrake: { key: "heart-brake", path: assetPath("/assets/ui/heart_brake.png") },
  coinPouchFull: { key: "coin-pouch-full", path: assetPath("/assets/ui/coin_pouch_full.png") },
  coinPouchEmpty: { key: "coin-pouch-empty", path: assetPath("/assets/ui/coin_pouch_empty.png") },
  inventoryFull: { key: "inventory-full", path: assetPath("/assets/ui/inventory_full.png") },
  inventoryEmpty: { key: "inventory-empty", path: assetPath("/assets/ui/inventory_empty.png") },
  inventoryItemAlmostHeroMedallion: {
    key: "inventory-item-almost-hero-medallion",
    path: assetPath("/assets/ui/inventory/items/almost_hero_medallion.png")
  },
  inventoryItemAnkleBall: { key: "inventory-item-ankle-ball", path: assetPath("/assets/ui/inventory/items/ankle_ball.png") },
  inventoryItemAxe: { key: "inventory-item-axe", path: assetPath("/assets/ui/inventory/items/axe.png") },
  inventoryItemEmotionalPebble: {
    key: "inventory-item-emotional-pebble",
    path: assetPath("/assets/ui/inventory/items/emotional_pebble.png")
  },
  inventoryItemPanicSandals: { key: "inventory-item-panic-sandals", path: assetPath("/assets/ui/inventory/items/panic_sandals.png") },
  inventoryItemStickyGloves: { key: "inventory-item-sticky-gloves", path: assetPath("/assets/ui/inventory/items/sticky_gloves.png") },
  inventoryItemTinyHelmet: { key: "inventory-item-tiny-helmet", path: assetPath("/assets/ui/inventory/items/tiny_helmet.png") },
  inventoryItemTooLongCape: { key: "inventory-item-too-long-cape", path: assetPath("/assets/ui/inventory/items/too_long_cape.png") },
  inventoryItemWarUnderwear: { key: "inventory-item-war-underwear", path: assetPath("/assets/ui/inventory/items/war_underwear.png") },
  combatArena1: { key: "combat-arena-1", path: assetPath("/assets/combat/arene_1.webp") },
  combatArena2: { key: "combat-arena-2", path: assetPath("/assets/combat/arene_2.webp") },
  combatArena3: { key: "combat-arena-3", path: assetPath("/assets/combat/arene_3.webp") },
  resultDefeatBanner: { key: "result-defeat-banner", path: assetPath("/assets/results/defeat/defeat_banner.png") },
  resultVictoryBanner: { key: "result-victory-banner", path: assetPath("/assets/results/victory/victory_banner.png") },
  resultVictoryConfetti: { key: "result-victory-confetti", path: assetPath("/assets/results/victory/victory_confetti.png") },
  resultButtonVillage: { key: "result-button-village", path: assetPath("/assets/results/buttons/result_button_village.png") },
  resultButtonCell: { key: "result-button-cell", path: assetPath("/assets/results/buttons/result_button_cell.png") },
  resultScoreFrame: { key: "result-score-frame", path: assetPath("/assets/results/common/result_score_frame.png") },
  resultDefeatBackground: { key: "result-defeat-background", path: assetPath("/assets/ui/results/result_defeat_background.webp") },
  resultScoreBreakdownPanel: {
    key: "result-score-breakdown-panel",
    path: assetPath("/assets/ui/results/result_score_breakdown_panel.png")
  },
  resultButtonPrimaryEmpty: { key: "result-button-primary-empty", path: assetPath("/assets/ui/results/result_button_primary_empty.png") },
  resultButtonSecondaryEmpty: {
    key: "result-button-secondary-empty",
    path: assetPath("/assets/ui/results/result_button_secondary_empty.png")
  },
  resultVictoryBackground: { key: "result-victory-background", path: assetPath("/assets/ui/results/result_victory_background.webp") },
  resultVictoryCoinBagFull: {
    key: "result-victory-coin-bag-full",
    path: assetPath("/assets/ui/results/result_victory_coin_bag_full.png")
  },
  resultVictoryCoinBagEmpty: {
    key: "result-victory-coin-bag-empty",
    path: assetPath("/assets/ui/results/result_victory_coin_bag_empty.png")
  },
  resultVictoryLootChest: {
    key: "result-victory-loot-chest",
    path: assetPath("/assets/ui/results/result_victory_loot_chest.png")
  },
  lootChestClosed: { key: "loot-chest-closed", path: assetPath("/assets/minigames/loot_chest/chest_closed.png") },
  lootChestKeyAppear: { key: "loot-chest-key-appear", path: assetPath("/assets/minigames/loot_chest/key_appear.png") },
  lootChestKeyInsert1: { key: "loot-chest-key-insert-1", path: assetPath("/assets/minigames/loot_chest/key_insert_1.png") },
  lootChestKeyInsert2: { key: "loot-chest-key-insert-2", path: assetPath("/assets/minigames/loot_chest/key_insert_2.png") },
  lootChestKeyTurn: { key: "loot-chest-key-turn", path: assetPath("/assets/minigames/loot_chest/key_turn.png") },
  lootChestOpen: { key: "loot-chest-open", path: assetPath("/assets/minigames/loot_chest/chest_open.png") },
  lootChestRarityCommon: { key: "loot-chest-rarity-common", path: assetPath("/assets/minigames/loot_chest/rarity_common.png") },
  lootChestRarityRare: { key: "loot-chest-rarity-rare", path: assetPath("/assets/minigames/loot_chest/rarity_rare.png") },
  lootChestRarityEpic: { key: "loot-chest-rarity-epic", path: assetPath("/assets/minigames/loot_chest/rarity_epic.png") },
  lootChestRarityLegendary: {
    key: "loot-chest-rarity-legendary",
    path: assetPath("/assets/minigames/loot_chest/rarity_legendary.png")
  },
  coinFlipStart: { key: "coin-flip-start", path: assetPath("/assets/minigames/coin_flip/pileouface_start.webp") },
  coinFlipLaunch1: { key: "coin-flip-launch-1", path: assetPath("/assets/minigames/coin_flip/pileouface_lance_01.webp") },
  coinFlipLaunch2: { key: "coin-flip-launch-2", path: assetPath("/assets/minigames/coin_flip/pileouface_lance_02.webp") },
  coinFlipLaunch3: { key: "coin-flip-launch-3", path: assetPath("/assets/minigames/coin_flip/pileouface_lance_03.webp") },
  coinFlipTurn1: { key: "coin-flip-turn-1", path: assetPath("/assets/minigames/coin_flip/pileouface_piece_tourne_01.webp") },
  coinFlipTurn2: { key: "coin-flip-turn-2", path: assetPath("/assets/minigames/coin_flip/pileouface_piece_tourne_02.webp") },
  coinFlipTurn3: { key: "coin-flip-turn-3", path: assetPath("/assets/minigames/coin_flip/pileouface_piece_tourne_03.webp") },
  coinFlipFall1: { key: "coin-flip-fall-1", path: assetPath("/assets/minigames/coin_flip/pileouface_piece_tombe_01.webp") },
  coinFlipFall2: { key: "coin-flip-fall-2", path: assetPath("/assets/minigames/coin_flip/pileouface_piece_tombe_02.webp") },
  coinFlipFall3: { key: "coin-flip-fall-3", path: assetPath("/assets/minigames/coin_flip/pileouface_piece_tombe_03.webp") },
  coinFlipFall4: { key: "coin-flip-fall-4", path: assetPath("/assets/minigames/coin_flip/pileouface_piece_tombe_04.webp") },
  coinFlipPileEnd1: { key: "coin-flip-pile-end-1", path: assetPath("/assets/minigames/coin_flip/pileoufrace_pile_fin_01.webp") },
  coinFlipPileEnd2: { key: "coin-flip-pile-end-2", path: assetPath("/assets/minigames/coin_flip/pileoufrace_pile_fin_02.webp") },
  coinFlipPileEnd: { key: "coin-flip-pile-end", path: assetPath("/assets/minigames/coin_flip/pileoufrace_pile_fin_end.png") },
  coinFlipFaceEnd1: { key: "coin-flip-face-end-1", path: assetPath("/assets/minigames/coin_flip/pileoufrace_face_fin_01.webp") },
  coinFlipFaceEnd2: { key: "coin-flip-face-end-2", path: assetPath("/assets/minigames/coin_flip/pileoufrace_face_fin_02.webp") },
  coinFlipFaceEnd: { key: "coin-flip-face-end", path: assetPath("/assets/minigames/coin_flip/pileoufrace_face_fin_end.webp") },
  bonneteauFaceCache: { key: "bonneteau-face-cache", path: assetPath("/assets/minigames/bonneteau/bonneteau-face-cache.png") },
  bonneteauSlot1Carte: { key: "bonneteau-slot-1-carte", path: assetPath("/assets/minigames/bonneteau/slot_1/card_decouverte_1.png") },
  bonneteauSlot1Grodor: { key: "bonneteau-slot-1-grodor", path: assetPath("/assets/minigames/bonneteau/slot_1/grodor_1.png") },
  bonneteauSlot1Po: { key: "bonneteau-slot-1-po", path: assetPath("/assets/minigames/bonneteau/slot_1/po_1.png") },
  bonneteauSlot1Crane: { key: "bonneteau-slot-1-crane", path: assetPath("/assets/minigames/bonneteau/slot_1/crane_1.png") },
  bonneteauSlot1Bourse: { key: "bonneteau-slot-1-bourse", path: assetPath("/assets/minigames/bonneteau/slot_1/bourse_1.png") },
  bonneteauSlot2Carte: { key: "bonneteau-slot-2-carte", path: assetPath("/assets/minigames/bonneteau/slot_2/card_decouverte_2.png") },
  bonneteauSlot2Grodor: { key: "bonneteau-slot-2-grodor", path: assetPath("/assets/minigames/bonneteau/slot_2/grodor_2.png") },
  bonneteauSlot2Po: { key: "bonneteau-slot-2-po", path: assetPath("/assets/minigames/bonneteau/slot_2/po_2.png") },
  bonneteauSlot2Crane: { key: "bonneteau-slot-2-crane", path: assetPath("/assets/minigames/bonneteau/slot_2/crane_2.png") },
  bonneteauSlot2Bourse: { key: "bonneteau-slot-2-bourse", path: assetPath("/assets/minigames/bonneteau/slot_2/bourse_2.png") },
  bonneteauSlot3Carte: { key: "bonneteau-slot-3-carte", path: assetPath("/assets/minigames/bonneteau/slot_3/card_decouverte_3.png") },
  bonneteauSlot3Grodor: { key: "bonneteau-slot-3-grodor", path: assetPath("/assets/minigames/bonneteau/slot_3/grodor_3.png") },
  bonneteauSlot3Po: { key: "bonneteau-slot-3-po", path: assetPath("/assets/minigames/bonneteau/slot_3/po_3.png") },
  bonneteauSlot3Crane: { key: "bonneteau-slot-3-crane", path: assetPath("/assets/minigames/bonneteau/slot_3/crane_3.png") },
  bonneteauSlot3Bourse: { key: "bonneteau-slot-3-bourse", path: assetPath("/assets/minigames/bonneteau/slot_3/bourse_3.png") },
  slotMachineBackground: { key: "slot-machine-background", path: assetPath("/assets/minigames/slot_machine/Machine_a_sous.webp") },
  slotMachineSlot1Pouch: { key: "slot-machine-slot-1-pouch", path: assetPath("/assets/minigames/slot_machine/slot_1/bourse_vide_slot_1.png") },
  slotMachineSlot1Skull: { key: "slot-machine-slot-1-skull", path: assetPath("/assets/minigames/slot_machine/slot_1/crane_slot_1.png") },
  slotMachineSlot1Grodor: { key: "slot-machine-slot-1-grodor", path: assetPath("/assets/minigames/slot_machine/slot_1/grodor_slot_1.png") },
  slotMachineSlot1Gold: { key: "slot-machine-slot-1-gold", path: assetPath("/assets/minigames/slot_machine/slot_1/po_slot_1.png") },
  slotMachineSlot2Pouch: { key: "slot-machine-slot-2-pouch", path: assetPath("/assets/minigames/slot_machine/slot_2/bourse_vide_slot_2.png") },
  slotMachineSlot2Skull: { key: "slot-machine-slot-2-skull", path: assetPath("/assets/minigames/slot_machine/slot_2/crane_slot_2.png") },
  slotMachineSlot2Grodor: { key: "slot-machine-slot-2-grodor", path: assetPath("/assets/minigames/slot_machine/slot_2/grodor_slot_2.png") },
  slotMachineSlot2Gold: { key: "slot-machine-slot-2-gold", path: assetPath("/assets/minigames/slot_machine/slot_2/po_slot_2.png") },
  slotMachineSlot3Pouch: { key: "slot-machine-slot-3-pouch", path: assetPath("/assets/minigames/slot_machine/slot_3/bourse_vide_slot_3.png") },
  slotMachineSlot3Skull: { key: "slot-machine-slot-3-skull", path: assetPath("/assets/minigames/slot_machine/slot_3/crane_slot_3.png") },
  slotMachineSlot3Grodor: { key: "slot-machine-slot-3-grodor", path: assetPath("/assets/minigames/slot_machine/slot_3/grodor_slot_3.png") },
  slotMachineSlot3Gold: { key: "slot-machine-slot-3-gold", path: assetPath("/assets/minigames/slot_machine/slot_3/po_slot_3.png") },
  slotMachineLightGreenLeft: {
    key: "slot-machine-light-green-left",
    path: assetPath("/assets/minigames/slot_machine/light/light_green_left.png")
  },
  slotMachineLightGreenRight: {
    key: "slot-machine-light-green-right",
    path: assetPath("/assets/minigames/slot_machine/light/light_green_right.png")
  },
  slotMachineLightRedLeft: {
    key: "slot-machine-light-red-left",
    path: assetPath("/assets/minigames/slot_machine/light/light_red_left.png")
  },
  slotMachineLightRedRight: {
    key: "slot-machine-light-red-right",
    path: assetPath("/assets/minigames/slot_machine/light/light_red_right.png")
  },
  dodgeChestOpen: { key: "dodge-chest-open", path: assetPath("/assets/minigames/dodge_chest/coffre_open.png") },
  dodgeChestOpenWin: { key: "dodge-chest-open-win", path: assetPath("/assets/minigames/dodge_chest/coffre_open-gagner.png") },
  dodgeChestDodge: { key: "dodge-chest-dodge", path: assetPath("/assets/minigames/dodge_chest/coffre_esquive.png") },
  dodgeChestDodgeWin: { key: "dodge-chest-dodge-win", path: assetPath("/assets/minigames/dodge_chest/coffre_esquive-gagner.png") },
  dodgeChestDodgeLose: { key: "dodge-chest-dodge-lose", path: assetPath("/assets/minigames/dodge_chest/coffre_esquive-perdu.png") },
  dodgeChestFrame1Ok: { key: "dodge-chest-frame-1-ok", path: assetPath("/assets/minigames/dodge_chest/esquive-1-ok.png") },
  dodgeChestFrame1Break: { key: "dodge-chest-frame-1-break", path: assetPath("/assets/minigames/dodge_chest/esquive-1-eclate.png") },
  dodgeChestFrame2Ok: { key: "dodge-chest-frame-2-ok", path: assetPath("/assets/minigames/dodge_chest/esquive-2-ok.png") },
  dodgeChestFrame2Break: { key: "dodge-chest-frame-2-break", path: assetPath("/assets/minigames/dodge_chest/esquive-2-eclate.png") },
  dodgeChestFrame3Ok: { key: "dodge-chest-frame-3-ok", path: assetPath("/assets/minigames/dodge_chest/esquive-3-ok.png") },
  dodgeChestFrame3Break: { key: "dodge-chest-frame-3-break", path: assetPath("/assets/minigames/dodge_chest/esquive-3-eclate.png") },
  dodgeChestFrame4Ok: { key: "dodge-chest-frame-4-ok", path: assetPath("/assets/minigames/dodge_chest/esquive-4-ok.png") },
  dodgeChestFrame4Break: { key: "dodge-chest-frame-4-break", path: assetPath("/assets/minigames/dodge_chest/esquive-4-eclate.png") },
  dodgeChestFrame5Ok: { key: "dodge-chest-frame-5-ok", path: assetPath("/assets/minigames/dodge_chest/esquive-5-ok.png") },
  dodgeChestFrame5Break: { key: "dodge-chest-frame-5-break", path: assetPath("/assets/minigames/dodge_chest/esquive-5-eclate.png") },
  dodgeChestFrame6Ok: { key: "dodge-chest-frame-6-ok", path: assetPath("/assets/minigames/dodge_chest/esquive-6-ok.png") },
  dodgeChestFrame6Break: { key: "dodge-chest-frame-6-break", path: assetPath("/assets/minigames/dodge_chest/esquive-6-eclate.png") },
  armWrestlingIdle: { key: "arm-wrestling-idle", path: assetPath("/assets/minigames/arm_wrestling/idle.png") },
  armWrestlingPlayer1: { key: "arm-wrestling-player-1", path: assetPath("/assets/minigames/arm_wrestling/player_1.png") },
  armWrestlingPlayer2: { key: "arm-wrestling-player-2", path: assetPath("/assets/minigames/arm_wrestling/player_2.png") },
  armWrestlingPlayerWin: { key: "arm-wrestling-player-win", path: assetPath("/assets/minigames/arm_wrestling/player_win.png") },
  armWrestlingEnemy1: { key: "arm-wrestling-enemy-1", path: assetPath("/assets/minigames/arm_wrestling/enemy_1.png") },
  armWrestlingEnemy2: { key: "arm-wrestling-enemy-2", path: assetPath("/assets/minigames/arm_wrestling/enemy_2.png") },
  armWrestlingPlayerLose: { key: "arm-wrestling-player-lose", path: assetPath("/assets/minigames/arm_wrestling/player_lose.png") },
  elevatorIdle: { key: "elevator-idle", path: assetPath("/assets/minigames/elevator/elevator_idle.png") },
  elevatorWin: { key: "elevator-win", path: assetPath("/assets/minigames/elevator/elevator_win.png") },
  elevatorNeutral: { key: "elevator-neutral", path: assetPath("/assets/minigames/elevator/elevator_neutral.png") },
  elevatorLose: { key: "elevator-lose", path: assetPath("/assets/minigames/elevator/elevator_lose.png") },
  elevatorGauge: { key: "elevator-gauge", path: assetPath("/assets/minigames/elevator/elevator_gauge.png") },
  elevatorCursor: { key: "elevator-cursor", path: assetPath("/assets/minigames/elevator/elevator_cursor.png") },
  elevatorArrowDownGreen: {
    key: "elevator-arrow-down-green",
    path: assetPath("/assets/minigames/elevator/fleche_bas_verte.png")
  },
  elevatorArrowUpRed: { key: "elevator-arrow-up-red", path: assetPath("/assets/minigames/elevator/fleche_haut_rouge.png") },
  jumpRunnerScene: { key: "jump-runner-scene", path: assetPath("/assets/minigames/jump/runner_segment_01.png") },
  jumpRunnerScene02: { key: "jump-runner-scene-02", path: assetPath("/assets/minigames/jump/runner_segment_02.png") },
  jumpRunnerScene03: { key: "jump-runner-scene-03", path: assetPath("/assets/minigames/jump/runner_segment_03.png") },
  jumpRunnerSpike03: { key: "jump-runner-spike-03", path: assetPath("/assets/minigames/jump/runner_spike_03.png") },
  jumpGeneratedBackground01: {
    key: "jump-generated-background-01",
    path: assetPath("/assets/minigames/jump/generated/background_01.png")
  },
  jumpGeneratedBackground02: {
    key: "jump-generated-background-02",
    path: assetPath("/assets/minigames/jump/generated/background_02.png")
  },
  jumpGeneratedBackground03: {
    key: "jump-generated-background-03",
    path: assetPath("/assets/minigames/jump/generated/background_03.png")
  },
  jumpGeneratedBackground04: {
    key: "jump-generated-background-04",
    path: assetPath("/assets/minigames/jump/generated/background_04.png")
  },
  jumpGeneratedBackground05: {
    key: "jump-generated-background-05",
    path: assetPath("/assets/minigames/jump/generated/background_05.png")
  },
  jumpGeneratedBackground06: {
    key: "jump-generated-background-06",
    path: assetPath("/assets/minigames/jump/generated/background_06.png")
  },
  jumpGeneratedBackground07: {
    key: "jump-generated-background-07",
    path: assetPath("/assets/minigames/jump/generated/background_07.png")
  },
  jumpGeneratedLava: { key: "jump-generated-lava", path: assetPath("/assets/minigames/jump/generated/lava.png") },
  jumpGeneratedHole: { key: "jump-generated-hole", path: assetPath("/assets/minigames/jump/generated/hole.png") },
  jumpGeneratedSpike: { key: "jump-generated-spike", path: assetPath("/assets/minigames/jump/generated/spike.png") },
  jumpGeneratedSpike01: { key: "jump-generated-spike-01", path: assetPath("/assets/minigames/jump/generated/spike_01.png") },
  jumpGeneratedSpikeCover: {
    key: "jump-generated-spike-cover",
    path: assetPath("/assets/minigames/jump/generated/spike_cover.png")
  },
  jumpGeneratedWater: { key: "jump-generated-water", path: assetPath("/assets/minigames/jump/generated/water.png") },
  jumpGeneratedWolfspike: { key: "jump-generated-wolfspike", path: assetPath("/assets/minigames/jump/generated/wolfspike.png") },
  ratIdle: { key: "rat-idle", path: assetPath("/assets/sprites/monsters/rat/rat_idle.png") },
  skeletonIdle: { key: "skeleton-idle", path: assetPath("/assets/sprites/monsters/skeleton/skeleton_idle.png") },
  guardIdle: { key: "guard-idle", path: assetPath("/assets/sprites/monsters/guard/guard_idle.png") }
} satisfies Record<string, AssetDefinition>;

export const INVENTORY_ITEM_ASSETS = {
  almost_hero_medallion: IMAGE_ASSETS.inventoryItemAlmostHeroMedallion,
  ankle_ball: IMAGE_ASSETS.inventoryItemAnkleBall,
  axe: IMAGE_ASSETS.inventoryItemAxe,
  emotional_pebble: IMAGE_ASSETS.inventoryItemEmotionalPebble,
  panic_sandals: IMAGE_ASSETS.inventoryItemPanicSandals,
  sticky_gloves: IMAGE_ASSETS.inventoryItemStickyGloves,
  tiny_helmet: IMAGE_ASSETS.inventoryItemTinyHelmet,
  too_long_cape: IMAGE_ASSETS.inventoryItemTooLongCape,
  war_underwear: IMAGE_ASSETS.inventoryItemWarUnderwear
} satisfies Record<string, AssetDefinition>;

export const JSON_ASSETS = {
  dungeonMap: { key: "dungeon-map", path: assetPath("/assets/tiled/dungeon/dungeon_map.json") },
  villageMap: { key: "village-map", path: assetPath("/assets/village/village_map.json") },
  tavernMap: { key: "tavern-map", path: assetPath("/assets/village/tavern/tavern_grodor.json") },
  jumpRunnerSegment: { key: "jump-runner-segment", path: assetPath("/assets/minigames/jump/runner_segment_01.json") },
  jumpRunnerSegment02: { key: "jump-runner-segment-02", path: assetPath("/assets/minigames/jump/runner_segment_02.json") },
  jumpRunnerSegment03: { key: "jump-runner-segment-03", path: assetPath("/assets/minigames/jump/runner_segment_03.json") }
} satisfies Record<string, AssetDefinition>;

export const ANIMATION_KEYS = {
  grodorIdle: "grodor_idle",
  grodorWalk: "grodor_walk",
  grodorRun: "grodor_run",
  grodorJump: "grodor_jump",
  grodorAttack: "grodor_attack",
  grodorHurt: "grodor_hurt",
  grodorDeath: "grodor_death",
  grodorVictory: "grodor_victory",
  grodorAxeIdle: "grodor_axe_idle",
  grodorAxeWalk: "grodor_axe_walk",
  grodorAxeAttack: "grodor_axe_attack",
  grodorAxeHurt: "grodor_axe_hurt",
  grodorAxeDeath: "grodor_axe_death",
  grodorAxeVictory: "grodor_axe_victory",
  grodorWarUnderwearIdle: "grodor_war_underwear_idle",
  grodorWarUnderwearWalk: "grodor_war_underwear_walk",
  grodorWarUnderwearAttack: "grodor_war_underwear_attack",
  grodorWarUnderwearHurt: "grodor_war_underwear_hurt",
  grodorWarUnderwearDeath: "grodor_war_underwear_death",
  grodorWarUnderwearVictory: "grodor_war_underwear_victory",
  grodorPanicSandalsIdle: "grodor_panic_sandals_idle",
  grodorPanicSandalsWalk: "grodor_panic_sandals_walk",
  grodorPanicSandalsAttack: "grodor_panic_sandals_attack",
  grodorPanicSandalsHurt: "grodor_panic_sandals_hurt",
  grodorPanicSandalsDeath: "grodor_panic_sandals_death",
  grodorPanicSandalsVictory: "grodor_panic_sandals_victory",
  grodorAlmostHeroMedallionIdle: "grodor_almost_hero_medallion_idle",
  grodorAlmostHeroMedallionWalk: "grodor_almost_hero_medallion_walk",
  grodorAlmostHeroMedallionAttack: "grodor_almost_hero_medallion_attack",
  grodorAlmostHeroMedallionHurt: "grodor_almost_hero_medallion_hurt",
  grodorAlmostHeroMedallionDeath: "grodor_almost_hero_medallion_death",
  grodorAlmostHeroMedallionVictory: "grodor_almost_hero_medallion_victory",
  grodorTooLongCapeIdle: "grodor_too_long_cape_idle",
  grodorTooLongCapeWalk: "grodor_too_long_cape_walk",
  grodorTooLongCapeAttack: "grodor_too_long_cape_attack",
  grodorTooLongCapeHurt: "grodor_too_long_cape_hurt",
  grodorTooLongCapeDeath: "grodor_too_long_cape_death",
  grodorTooLongCapeVictory: "grodor_too_long_cape_victory",
  grodorTinyHelmetIdle: "grodor_tiny_helmet_idle",
  grodorTinyHelmetWalk: "grodor_tiny_helmet_walk",
  grodorTinyHelmetAttack: "grodor_tiny_helmet_attack",
  grodorTinyHelmetHurt: "grodor_tiny_helmet_hurt",
  grodorTinyHelmetDeath: "grodor_tiny_helmet_death",
  grodorTinyHelmetVictory: "grodor_tiny_helmet_victory",
  grodorAnkleBallIdle: "grodor_ankle_ball_idle",
  grodorAnkleBallWalk: "grodor_ankle_ball_walk",
  grodorAnkleBallAttack: "grodor_ankle_ball_attack",
  grodorAnkleBallHurt: "grodor_ankle_ball_hurt",
  grodorAnkleBallDeath: "grodor_ankle_ball_death",
  grodorAnkleBallVictory: "grodor_ankle_ball_victory",
  grodorStickyGlovesIdle: "grodor_sticky_gloves_idle",
  grodorStickyGlovesWalk: "grodor_sticky_gloves_walk",
  grodorStickyGlovesAttack: "grodor_sticky_gloves_attack",
  grodorStickyGlovesHurt: "grodor_sticky_gloves_hurt",
  grodorStickyGlovesDeath: "grodor_sticky_gloves_death",
  grodorStickyGlovesVictory: "grodor_sticky_gloves_victory",
  grodorEmotionalPebbleIdle: "grodor_emotional_pebble_idle",
  grodorEmotionalPebbleWalk: "grodor_emotional_pebble_walk",
  grodorEmotionalPebbleAttack: "grodor_emotional_pebble_attack",
  grodorEmotionalPebbleHurt: "grodor_emotional_pebble_hurt",
  grodorEmotionalPebbleDeath: "grodor_emotional_pebble_death",
  grodorEmotionalPebbleVictory: "grodor_emotional_pebble_victory"
} as const;

export const INTRO_PRELOAD_IMAGES = [IMAGE_ASSETS.introBackground, IMAGE_ASSETS.introLogo];
export const PRELOAD_IMAGES = Object.values(IMAGE_ASSETS);
export const PRELOAD_JSON = Object.values(JSON_ASSETS);
export const INTRO_PRELOAD_AUDIO = [AUDIO_ASSETS.musicIntro];
export const PRELOAD_AUDIO = Object.values(AUDIO_ASSETS);
