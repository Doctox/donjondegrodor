import Phaser from "phaser";
import { AssetDefinition } from "../data/assetKeys";

export function preloadImages(scene: Phaser.Scene, assets: AssetDefinition[]): void {
  uniqueAssets(assets).forEach((asset) => {
    if (!scene.textures.exists(asset.key)) {
      scene.load.image(asset.key, asset.path);
    }
  });
}

export function preloadTilemaps(scene: Phaser.Scene, assets: AssetDefinition[]): void {
  uniqueAssets(assets).forEach((asset) => {
    if (!scene.cache.tilemap.exists(asset.key)) {
      scene.load.tilemapTiledJSON(asset.key, asset.path);
    }
  });
}

function uniqueAssets(assets: AssetDefinition[]): AssetDefinition[] {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    if (seen.has(asset.key)) {
      return false;
    }

    seen.add(asset.key);
    return true;
  });
}
