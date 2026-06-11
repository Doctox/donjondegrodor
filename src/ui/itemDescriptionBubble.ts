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
  const background = scene.add.rectangle(0, 0, 430, 168, 0x120d0a, 0.9).setOrigin(0.5);
  background.setStrokeStyle(2, 0xf0c071, 0.96);
  const title = scene.add
    .text(0, -52, itemName, {
      fontFamily: "Georgia, serif",
      fontSize: "34px",
      color: "#fff1c2",
      align: "center",
      stroke: "#070402",
      strokeThickness: 5,
      wordWrap: { width: 382 }
    })
    .setOrigin(0.5);
  const description = scene.add
    .text(0, 32, itemDescription, {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "26px",
      color: "#f9dfaa",
      align: "center",
      stroke: "#070402",
      strokeThickness: 4,
      wordWrap: { width: 382 }
    })
    .setOrigin(0.5);

  bubble.add([background, title, description]);
  return bubble;
}
