import Phaser from "phaser";
import { GAME_TEXTS } from "../data/gameTexts";

export function createItemDescriptionBubble(
  scene: Phaser.Scene,
  x: number,
  y: number,
  itemName: string,
  itemDescription: string = GAME_TEXTS.inventory.descriptionFallback
): Phaser.GameObjects.Container {
  const bubble = scene.add.container(x, y);
  const background = scene.add.rectangle(0, 0, 230, 76, 0x120d0a, 0.9).setOrigin(0.5);
  background.setStrokeStyle(2, 0xf0c071, 0.96);
  const title = scene.add
    .text(0, -15, itemName, {
      fontFamily: "Georgia, serif",
      fontSize: "18px",
      color: "#fff1c2",
      align: "center",
      stroke: "#070402",
      strokeThickness: 4,
      wordWrap: { width: 198 }
    })
    .setOrigin(0.5);
  const description = scene.add
    .text(0, 17, itemDescription, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "13px",
      color: "#f9dfaa",
      align: "center",
      stroke: "#070402",
      strokeThickness: 3,
      wordWrap: { width: 198 }
    })
    .setOrigin(0.5);

  bubble.add([background, title, description]);
  return bubble;
}
