import Phaser from "phaser";

export type TiledPoint = {
  name: string;
  x: number;
  y: number;
};

export type TiledZone = TiledPoint & {
  width: number;
  height: number;
};

export function getDoorPathPoints(map: Phaser.Tilemaps.Tilemap, doorIndex: number | string): TiledPoint[] {
  return getPathPoints(map, `path_door_${doorIndex}_`);
}

export function getPathPoints(map: Phaser.Tilemaps.Tilemap, prefix: string, options: { reverse?: boolean } = {}): TiledPoint[] {
  const points = getPathObjects(map)
    .filter((object) => object.name?.startsWith(prefix))
    .map((object) => ({
      name: object.name ?? "",
      x: object.x ?? 0,
      y: object.y ?? 0
    }))
    .sort((a, b) => getPathOrder(a.name) - getPathOrder(b.name));

  return options.reverse ? points.reverse() : points;
}

export function getPathObjectNames(map: Phaser.Tilemaps.Tilemap): string[] {
  return getPathObjects(map).map((object) => object.name).filter(Boolean) as string[];
}

export function getSpawnPoint(map: Phaser.Tilemaps.Tilemap, name: string): TiledPoint | undefined {
  const object = map.getObjectLayer("spawns")?.objects.find((candidate) => candidate.name === name);
  return object ? { name: object.name ?? name, x: object.x ?? 0, y: object.y ?? 0 } : undefined;
}

export function getInteractiveZone(map: Phaser.Tilemaps.Tilemap, name: string): TiledZone | undefined {
  const object = map.getObjectLayer("interactives")?.objects.find((candidate) => candidate.name === name);
  return object
    ? {
        name: object.name ?? name,
        x: object.x ?? 0,
        y: object.y ?? 0,
        width: object.width ?? 0,
        height: object.height ?? 0
      }
    : undefined;
}

export function getInteractiveZones(map: Phaser.Tilemaps.Tilemap): TiledZone[] {
  return (map.getObjectLayer("interactives")?.objects ?? []).map((object) => ({
    name: object.name ?? "",
    x: object.x ?? 0,
    y: object.y ?? 0,
    width: object.width ?? 0,
    height: object.height ?? 0
  }));
}

function getPathOrder(name: string): number {
  if (name.endsWith("_end")) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = name.match(/_(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER - 1;
}

function getPathObjects(map: Phaser.Tilemaps.Tilemap): Phaser.Types.Tilemaps.TiledObject[] {
  return map.objects
    .filter((layer) => layer.name === "paths" || layer.name.startsWith("path_"))
    .flatMap((layer) => layer.objects ?? []);
}
