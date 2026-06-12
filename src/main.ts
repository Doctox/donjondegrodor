import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { IntroScene } from "./scenes/IntroScene";
import { CellScene } from "./scenes/CellScene";
import { DungeonScene } from "./scenes/DungeonScene";
import { CombatScene } from "./scenes/CombatScene";
import { VillageScene } from "./scenes/VillageScene";
import { TavernScene } from "./scenes/TavernScene";
import { ResultScene } from "./scenes/ResultScene";
import { MiniGameScene } from "./scenes/MiniGameScene";
import { TiledDebugScene } from "./scenes/TiledDebugScene";
import { NineSliceTestScene } from "./scenes/NineSliceTestScene";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./data/assetKeys";
import { setupAudioSettingsButton } from "./ui/audioSettings";
import { setupMobileFullscreenButton } from "./ui/mobileFullscreen";
import { setLetterboxBackdrop } from "./ui/letterboxBackdrop";
import "./styles.css";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  backgroundColor: "#120d0a",
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    IntroScene,
    CellScene,
    DungeonScene,
    CombatScene,
    MiniGameScene,
    VillageScene,
    TavernScene,
    ResultScene,
    TiledDebugScene,
    NineSliceTestScene
  ]
};

setLetterboxBackdrop();
new Phaser.Game(config);
setupAudioSettingsButton();
setupMobileFullscreenButton();
