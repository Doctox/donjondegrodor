import { AssetDefinition, IMAGE_ASSETS, WORLD_WIDTH } from "../data/assetKeys";

export type GeneratedJumpRect = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GeneratedJumpMarker = {
  name: string;
  x: number;
  y: number;
};

export type GeneratedJumpSpriteKind = "decor" | "timed_spike" | "timed_spike_cover";

export type GeneratedJumpSprite = {
  asset: AssetDefinition;
  x: number;
  y: number;
  width: number;
  height: number;
  originY?: number;
  kind?: GeneratedJumpSpriteKind;
};

export type GeneratedJumpSegment = {
  image: AssetDefinition;
  floors: GeneratedJumpRect[];
  hazards: GeneratedJumpRect[];
  markers: GeneratedJumpMarker[];
  sprites: GeneratedJumpSprite[];
};

type GeneratedObstacleTemplate = {
  id: string;
  hazardName: string;
  asset: AssetDefinition;
  visualWidth: number;
  visualHeight: number;
  deathWidth: number;
  deathHeight: number;
  deathXOffset?: number;
  deathYOffset?: number;
  visualAnchor?: "top" | "bottom";
  visualYOffset?: number;
  timed?: boolean;
  cover?: {
    asset: AssetDefinition;
    visualWidth: number;
    visualHeight: number;
    visualYOffset?: number;
  };
};

const GENERATED_FLOOR_Y = 826;
const GENERATED_FLOOR_HEIGHT = 120;

// Generation rules: if these cannot be respected, the generator must reduce the trap count.
const MAX_HAZARDS_PER_SEGMENT = 3;
const MIN_START_RUNWAY_WIDTH = 300;
const MIN_SAFE_REJUMP_FLOOR_WIDTH = 240;
const MIN_END_RUNWAY_WIDTH = 300;
const HAZARD_FLOOR_CLEARANCE = 0;
const EXTRA_SAFE_FLOOR_VARIATION = 80;

export const JUMP_GENERATED_ASSETS: AssetDefinition[] = [
  IMAGE_ASSETS.jumpGeneratedBackground01,
  IMAGE_ASSETS.jumpGeneratedBackground02,
  IMAGE_ASSETS.jumpGeneratedBackground03,
  IMAGE_ASSETS.jumpGeneratedBackground04,
  IMAGE_ASSETS.jumpGeneratedBackground05,
  IMAGE_ASSETS.jumpGeneratedBackground06,
  IMAGE_ASSETS.jumpGeneratedBackground07,
  IMAGE_ASSETS.jumpGeneratedLava,
  IMAGE_ASSETS.jumpGeneratedHole,
  IMAGE_ASSETS.jumpGeneratedSpike,
  IMAGE_ASSETS.jumpGeneratedSpike01,
  IMAGE_ASSETS.jumpGeneratedSpikeCover,
  IMAGE_ASSETS.jumpGeneratedWater,
  IMAGE_ASSETS.jumpGeneratedWolfspike
];

const GENERATED_BACKGROUNDS: AssetDefinition[] = [
  IMAGE_ASSETS.jumpGeneratedBackground01,
  IMAGE_ASSETS.jumpGeneratedBackground02,
  IMAGE_ASSETS.jumpGeneratedBackground03,
  IMAGE_ASSETS.jumpGeneratedBackground04,
  IMAGE_ASSETS.jumpGeneratedBackground05,
  IMAGE_ASSETS.jumpGeneratedBackground06,
  IMAGE_ASSETS.jumpGeneratedBackground07
];

const OBSTACLES: GeneratedObstacleTemplate[] = [
  {
    id: "lava",
    hazardName: "death_zone_lava_generated",
    asset: IMAGE_ASSETS.jumpGeneratedLava,
    visualWidth: 443,
    visualHeight: 68,
    deathWidth: 415,
    deathHeight: 68
  },
  {
    id: "hole",
    hazardName: "death_zone_hole_generated",
    asset: IMAGE_ASSETS.jumpGeneratedHole,
    visualWidth: 458,
    visualHeight: 357,
    deathWidth: 398,
    deathHeight: 357,
    deathXOffset: 60,
    deathYOffset: 204,
    visualAnchor: "top",
    visualYOffset: -153
  },
  {
    id: "spike",
    hazardName: "death_zone_spike_01",
    asset: IMAGE_ASSETS.jumpGeneratedSpike,
    visualWidth: 216,
    visualHeight: 71,
    deathWidth: 216,
    deathHeight: 72,
    timed: true,
    cover: {
      asset: IMAGE_ASSETS.jumpGeneratedSpikeCover,
      visualWidth: 216,
      visualHeight: 71,
      visualYOffset: 20
    }
  },
  {
    id: "spike_01",
    hazardName: "death_zone_spike_generated",
    asset: IMAGE_ASSETS.jumpGeneratedSpike01,
    visualWidth: 312,
    visualHeight: 123,
    deathWidth: 312,
    deathHeight: 114,
    visualYOffset: -30
  },
  {
    id: "water",
    hazardName: "death_zone_water_01",
    asset: IMAGE_ASSETS.jumpGeneratedWater,
    visualWidth: 183,
    visualHeight: 34,
    deathWidth: 183,
    deathHeight: 34,
    visualYOffset: -20
  },
  {
    id: "wolfspike",
    hazardName: "death_zone_wolfspike_generated",
    asset: IMAGE_ASSETS.jumpGeneratedWolfspike,
    visualWidth: 224,
    visualHeight: 101,
    deathWidth: 224,
    deathHeight: 98,
    visualYOffset: -30
  }
];

let lastGeneratedCourseKey = "";

export function createGeneratedJumpSegment(random = Math.random): GeneratedJumpSegment {
  const background = GENERATED_BACKGROUNDS[randomInt(random, 0, GENERATED_BACKGROUNDS.length - 1)];
  const courses = pickCourseCandidates(random, 36);

  for (const course of courses) {
    const segment = buildSegment(background, course, random);
    if (isValidSegment(segment)) {
      lastGeneratedCourseKey = getCourseKey(course);
      return segment;
    }
  }

  const fallback = [OBSTACLES[0]];
  lastGeneratedCourseKey = getCourseKey(fallback);
  return buildSegment(background, fallback, random);
}

function pickCourseCandidates(random: () => number, attempts: number): GeneratedObstacleTemplate[][] {
  const courses: GeneratedObstacleTemplate[][] = [];
  const seen = new Set<string>();

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const obstacleCount = randomInt(random, 1, MAX_HAZARDS_PER_SEGMENT);
    const course = Array.from({ length: obstacleCount }, () => OBSTACLES[randomInt(random, 0, OBSTACLES.length - 1)]);
    const key = getCourseKey(course);
    if (!seen.has(key)) {
      seen.add(key);
      courses.push(course);
    }
  }

  const nonRepeatingCourses = courses.filter((course) => getCourseKey(course) !== lastGeneratedCourseKey);
  const repeatingCourses = courses.filter((course) => getCourseKey(course) === lastGeneratedCourseKey);
  return [...nonRepeatingCourses, ...repeatingCourses, ...buildFallbackCourses()];
}

function buildSegment(background: AssetDefinition, obstacles: GeneratedObstacleTemplate[], random: () => number): GeneratedJumpSegment {
  const floors: GeneratedJumpRect[] = [];
  const hazards: GeneratedJumpRect[] = [];
  const sprites: GeneratedJumpSprite[] = [];
  const startRunwayWidth = getStartRunwayWidth(obstacles, random);
  let cursorX = 0;

  const startFloor = createFloor("generated_floor_start", cursorX, startRunwayWidth);
  floors.push(startFloor);
  cursorX = startFloor.x + startFloor.width;

  obstacles.forEach((obstacle, index) => {
    const gapStartX = cursorX;
    const gapWidth = addObstacle(obstacle, gapStartX, hazards, sprites);
    addObstacleEdgeFloors(obstacle, gapStartX, floors, index);
    cursorX += gapWidth;

    const isLastObstacle = index === obstacles.length - 1;
    if (!isLastObstacle) {
      const safeFloor = createFloor(
        `generated_floor_between_${index + 1}`,
        cursorX,
        MIN_SAFE_REJUMP_FLOOR_WIDTH + randomInt(random, 0, EXTRA_SAFE_FLOOR_VARIATION)
      );
      floors.push(safeFloor);
      cursorX = safeFloor.x + safeFloor.width;
    }
  });

  const endFloorWidth = Math.max(MIN_END_RUNWAY_WIDTH, WORLD_WIDTH - cursorX);
  floors.push(createFloor("generated_floor_end", cursorX, endFloorWidth));

  const endFloor = floors[floors.length - 1];
  return {
    image: background,
    floors,
    hazards,
    markers: [
      { name: "spawn_grodor", x: 96, y: GENERATED_FLOOR_Y },
      { name: "segment_end", x: Math.min(WORLD_WIDTH - 80, endFloor.x + endFloor.width - 80), y: GENERATED_FLOOR_Y }
    ],
    sprites
  };
}

function getStartRunwayWidth(obstacles: GeneratedObstacleTemplate[], random: () => number): number {
  const obstacleWidth = obstacles.reduce((total, obstacle) => total + obstacle.visualWidth, 0);
  const betweenFloorCount = Math.max(0, obstacles.length - 1);
  const reservedWidth =
    obstacleWidth +
    betweenFloorCount * MIN_SAFE_REJUMP_FLOOR_WIDTH +
    MIN_START_RUNWAY_WIDTH +
    MIN_END_RUNWAY_WIDTH;
  const spareWidth = Math.max(0, WORLD_WIDTH - reservedWidth);
  return MIN_START_RUNWAY_WIDTH + randomInt(random, Math.floor(spareWidth * 0.55), spareWidth);
}

function addObstacle(
  obstacle: GeneratedObstacleTemplate,
  gapStartX: number,
  hazards: GeneratedJumpRect[],
  sprites: GeneratedJumpSprite[]
): number {
  const generatedGapWidth = obstacle.visualWidth;
  const spriteX = gapStartX;
  const hazardX = gapStartX + (obstacle.deathXOffset ?? (obstacle.visualWidth - obstacle.deathWidth) / 2);

  hazards.push({
    name: obstacle.hazardName,
    x: hazardX,
    y: GENERATED_FLOOR_Y - obstacle.deathHeight + (obstacle.deathYOffset ?? 0),
    width: obstacle.deathWidth,
    height: obstacle.deathHeight
  });

  sprites.push({
    asset: obstacle.asset,
    x: spriteX,
    y: (obstacle.visualAnchor === "top" ? GENERATED_FLOOR_Y : GENERATED_FLOOR_Y + 2) + (obstacle.visualYOffset ?? 0),
    width: obstacle.visualWidth,
    height: obstacle.visualHeight,
    originY: obstacle.visualAnchor === "top" ? 0 : 1,
    kind: obstacle.timed ? "timed_spike" : "decor"
  });

  if (obstacle.cover) {
    sprites.push({
      asset: obstacle.cover.asset,
      x: gapStartX + (obstacle.visualWidth - obstacle.cover.visualWidth) / 2,
      y: GENERATED_FLOOR_Y + 2 + (obstacle.cover.visualYOffset ?? 0),
      width: obstacle.cover.visualWidth,
      height: obstacle.cover.visualHeight,
      kind: "timed_spike_cover"
    });
  }

  return generatedGapWidth;
}

function addObstacleEdgeFloors(
  obstacle: GeneratedObstacleTemplate,
  gapStartX: number,
  floors: GeneratedJumpRect[],
  index: number
): void {
  const leftFloorWidth = obstacle.deathXOffset ?? 0;
  if (leftFloorWidth > 0) {
    floors.push(createFloor(`generated_floor_obstacle_${index + 1}_left`, gapStartX, leftFloorWidth));
  }

  const hazardEndX = gapStartX + leftFloorWidth + obstacle.deathWidth;
  const rightFloorWidth = Math.max(0, obstacle.visualWidth - leftFloorWidth - obstacle.deathWidth);
  if (rightFloorWidth > 0) {
    floors.push(createFloor(`generated_floor_obstacle_${index + 1}_right`, hazardEndX, rightFloorWidth));
  }
}

function getCourseKey(course: GeneratedObstacleTemplate[]): string {
  return course.map((obstacle) => obstacle.id).join("|");
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(random, 0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function buildFallbackCourses(): GeneratedObstacleTemplate[][] {
  return OBSTACLES.map((obstacle) => [obstacle]);
}

function createFloor(name: string, x: number, width: number): GeneratedJumpRect {
  return {
    name,
    x,
    y: GENERATED_FLOOR_Y,
    width,
    height: GENERATED_FLOOR_HEIGHT
  };
}

function isValidSegment(segment: GeneratedJumpSegment): boolean {
  return (
    segment.hazards.length <= MAX_HAZARDS_PER_SEGMENT &&
    hasEnoughSafeFloors(segment.floors) &&
    !hasFloorHazardConflict(segment.floors, segment.hazards) &&
    isInsideWorld(segment.floors) &&
    isInsideWorld(segment.hazards)
  );
}

function hasEnoughSafeFloors(floors: GeneratedJumpRect[]): boolean {
  const betweenFloors = floors.filter((floor) => floor.name.startsWith("generated_floor_between"));
  const startFloor = floors.find((floor) => floor.name === "generated_floor_start");
  const endFloor = floors.find((floor) => floor.name === "generated_floor_end");

  return (
    Boolean(startFloor && startFloor.width >= MIN_START_RUNWAY_WIDTH) &&
    Boolean(endFloor && endFloor.width >= MIN_END_RUNWAY_WIDTH) &&
    betweenFloors.every((floor) => floor.width >= MIN_SAFE_REJUMP_FLOOR_WIDTH)
  );
}

function hasFloorHazardConflict(floors: GeneratedJumpRect[], hazards: GeneratedJumpRect[]): boolean {
  return hazards.some((hazard) =>
    floors.some((floor) => rangesOverlap(hazard.x, hazard.x + hazard.width, floor.x, floor.x + floor.width, HAZARD_FLOOR_CLEARANCE))
  );
}

function rangesOverlap(firstStart: number, firstEnd: number, secondStart: number, secondEnd: number, clearance: number): boolean {
  return firstStart < secondEnd + clearance && firstEnd > secondStart - clearance;
}

function isInsideWorld(regions: GeneratedJumpRect[]): boolean {
  return regions.every((region) => region.x >= 0 && region.x + region.width <= WORLD_WIDTH);
}
