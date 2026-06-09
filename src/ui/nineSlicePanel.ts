import Phaser from "phaser";

export type NineSliceConfig = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export function createNineSlicePanel(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  width: number,
  height: number,
  sliceConfig: NineSliceConfig
): Phaser.GameObjects.NineSlice {
  return scene.add.nineslice(
    x,
    y,
    key,
    undefined,
    width,
    height,
    sliceConfig.left,
    sliceConfig.right,
    sliceConfig.top,
    sliceConfig.bottom
  );
}
