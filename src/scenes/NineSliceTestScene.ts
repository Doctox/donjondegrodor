import Phaser from "phaser";
import { IMAGE_ASSETS, WORLD_HEIGHT, WORLD_WIDTH } from "../data/assetKeys";
import { GAME_TEXTS } from "../data/gameTexts";
import { setHudVisible } from "../ui/hud";
import { setLetterboxBackdrop } from "../ui/letterboxBackdrop";
import { createNineSlicePanel, NineSliceConfig } from "../ui/nineSlicePanel";

type FrameSample = {
  label: string;
  key: string;
  slices: NineSliceConfig;
  sizes: { label: string; width: number; height: number; text: string }[];
  worksAsNineSlice: boolean;
  note?: string;
};

const FRAME_SAMPLES: FrameSample[] = [
  {
    label: GAME_TEXTS.nineSliceTest.frameStory,
    key: IMAGE_ASSETS.frameStory.key,
    slices: { left: 36, right: 36, top: 36, bottom: 36 },
    worksAsNineSlice: true,
    sizes: [
      { label: GAME_TEXTS.nineSliceTest.sizes.short, width: 280, height: 120, text: GAME_TEXTS.nineSliceTest.shortText },
      {
        label: GAME_TEXTS.nineSliceTest.sizes.medium,
        width: 380,
        height: 150,
        text: GAME_TEXTS.nineSliceTest.storyMediumText
      },
      {
        label: GAME_TEXTS.nineSliceTest.sizes.long,
        width: 520,
        height: 180,
        text: GAME_TEXTS.nineSliceTest.storyLongText
      }
    ]
  }
];

export class NineSliceTestScene extends Phaser.Scene {
  constructor() {
    super("NineSliceTestScene");
  }

  create(): void {
    setHudVisible(false);
    setLetterboxBackdrop(IMAGE_ASSETS.dungeonInterior.path);
    this.add.image(0, 0, IMAGE_ASSETS.dungeonInterior.key).setOrigin(0, 0).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
    this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x120d0a, 0.68).setOrigin(0);

    this.add
      .text(48, 34, GAME_TEXTS.nineSliceTest.title, {
        fontFamily: "Georgia, serif",
        fontSize: "36px",
        color: "#fff1c2",
        stroke: "#120d0a",
        strokeThickness: 6
      })
      .setDepth(20);

    FRAME_SAMPLES.forEach((sample, rowIndex) => this.addFrameRow(sample, 180 + rowIndex * 300));
    this.addAutoSizedExample();
    this.publishReport();
  }

  private addFrameRow(sample: FrameSample, y: number): void {
    this.add
      .text(
        52,
        y - 76,
        GAME_TEXTS.nineSliceTest.sliceLabel(sample.label, sample.slices.left, sample.slices.right, sample.slices.top, sample.slices.bottom),
        {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "22px",
        color: "#f9dfaa",
        stroke: "#120d0a",
        strokeThickness: 5
        }
      )
      .setDepth(20);

    const xs = [220, 650, 1190];
    sample.sizes.forEach((size, index) => {
      const panel = createNineSlicePanel(this, sample.key, xs[index], y, size.width, size.height, sample.slices);
      panel.setDepth(10);

      this.add
        .text(xs[index], y - size.height / 2 - 24, GAME_TEXTS.nineSliceTest.sizeLabel(size.label, size.width, size.height), {
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "18px",
          color: "#fff1c2",
          stroke: "#120d0a",
          strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(20);

      this.add
        .text(xs[index], y, size.text, {
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: index === 0 ? "20px" : "22px",
          color: "#fff1c2",
          align: "center",
          wordWrap: { width: Math.max(120, size.width - sample.slices.left - sample.slices.right - 40) }
        })
        .setOrigin(0.5)
        .setDepth(20);
    });
  }

  private addAutoSizedExample(): void {
    const text = GAME_TEXTS.nineSliceTest.autoSizedText;
    const width = 620;
    const textObject = this.add
      .text(WORLD_WIDTH / 2, 880, text, {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "26px",
        color: "#fff1c2",
        align: "center",
        wordWrap: { width: width - 96 }
      })
      .setOrigin(0.5)
      .setDepth(30);

    const height = Math.max(120, textObject.height + 68);
    createNineSlicePanel(
      this,
      IMAGE_ASSETS.frameStory.key,
      WORLD_WIDTH / 2,
      880,
      width,
      height,
      { left: 36, right: 36, top: 36, bottom: 36 }
    ).setDepth(25);
  }

  private publishReport(): void {
    (window as unknown as { __nineSliceReport?: unknown }).__nineSliceReport = {
      renderer: Phaser.WEBGL === this.game.config.renderType ? "webgl" : this.game.config.renderType,
      samples: FRAME_SAMPLES
    };
  }
}
