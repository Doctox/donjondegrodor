import type Phaser from "phaser";

export type MiniGameType = "loot_chest" | "coin_flip" | "bonneteau" | "slot_machine" | "dodge_chest" | "jump";
export type BonneteauIssue = "grodor" | "gold" | "skull" | "pierced_pouch";
export type SlotMachineSymbol = "grodor" | "gold" | "skull" | "pouch";

export type MiniGameResult = {
  type: MiniGameType;
  outcome: "success" | "failure" | "neutral";
  goldDelta?: number;
  goldLoss?: number;
  lifeDelta?: number;
  maxLifeLoss?: number;
  instantDeath?: boolean;
  itemId?: string;
  maxLifeDelta?: number;
  followUpMiniGame?: MiniGameType;
  issue?: BonneteauIssue;
  slot?: 1 | 2 | 3;
  bet?: number;
  choice?: "pile" | "face";
  resultSide?: "pile" | "face";
  slotMachineReels?: SlotMachineSymbol[];
  dodgeChestFrame?: number;
};

export type MiniGameSceneData = {
  type: MiniGameType;
  ownedInventory?: string[];
  carriedGold?: number;
  maxLife?: number;
};

export type MiniGameHost = {
  scene: Phaser.Scene;
  getStatusText: () => Phaser.GameObjects.Text | undefined;
  getRarityText: () => Phaser.GameObjects.Text | undefined;
  getCarriedGold: () => number;
  getOwnedInventory: () => string[];
  getMaxLife: () => number;
  getStep: () => number;
  getCompleted: () => boolean;
  setStep: (step: number) => void;
  setCompleted: (completed: boolean) => void;
  setResult: (result: MiniGameResult) => void;
  createContinueButton: (result: MiniGameResult) => Phaser.GameObjects.Text;
  createMiniGameButton: (x: number, y: number, label: string, onClick: () => void) => Phaser.GameObjects.Text;
  publishMiniGameReport: () => void;
};

export type MiniGameController = {
  start: () => void;
  getReportState?: () => Record<string, unknown>;
};

export const MINI_GAME_EVENT_IMAGE_WIDTH = 740;
export const MINI_GAME_EVENT_IMAGE_HEIGHT = 607;
