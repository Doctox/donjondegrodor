import Phaser from "phaser";

export type FloatingEffectTone = "negative" | "dodge" | "item";

export type FloatingEffectPoint = {
  x: number;
  y: number;
};

export type FloatingEffectOptions = {
  depth: number;
  tone?: FloatingEffectTone;
  fontSize?: number;
  wrapWidth?: number;
  strokeThickness?: number;
  startScale?: number;
  rise?: number;
  fadeRise?: number;
  holdMs?: number;
};

const EFFECT_COLORS: Record<FloatingEffectTone, string> = {
  negative: "#ff8f7d",
  dodge: "#f8e7b1",
  item: "#f8e7b1"
};

export function showFloatingEffectText(
  scene: Phaser.Scene,
  point: FloatingEffectPoint,
  text: string,
  options: FloatingEffectOptions
): void {
  const tone = options.tone ?? "item";
  const rise = options.rise ?? 30;
  const fadeRise = options.fadeRise ?? 92;
  const effectText = scene.add
    .text(point.x, point.y, text, {
      fontFamily: "Georgia, serif",
      fontSize: `${options.fontSize ?? 38}px`,
      color: EFFECT_COLORS[tone],
      align: "center",
      stroke: "#120d0a",
      strokeThickness: options.strokeThickness ?? (tone === "item" ? 7 : 8),
      wordWrap: { width: options.wrapWidth ?? 620, useAdvancedWrap: true }
    })
    .setOrigin(0.5)
    .setDepth(options.depth)
    .setAlpha(0)
    .setScale(options.startScale ?? 0.86);

  scene.tweens.add({
    targets: effectText,
    alpha: 1,
    y: point.y - rise,
    scaleX: 1,
    scaleY: 1,
    duration: 220,
    ease: "Back.easeOut",
    onComplete: () => {
      scene.tweens.add({
        targets: effectText,
        alpha: 0,
        y: point.y - fadeRise,
        delay: options.holdMs ?? 1250,
        duration: 340,
        ease: "Sine.easeIn",
        onComplete: () => effectText.destroy()
      });
    }
  });
}

export function showFloatingEffectSequence(
  scene: Phaser.Scene,
  messages: string[],
  getPoint: () => FloatingEffectPoint,
  options: FloatingEffectOptions & { startDelayMs?: number; staggerMs?: number }
): void {
  messages.forEach((message, index) => {
    scene.time.delayedCall((options.startDelayMs ?? 0) + index * (options.staggerMs ?? 1500), () => {
      showFloatingEffectText(scene, getPoint(), message, options);
    });
  });
}
