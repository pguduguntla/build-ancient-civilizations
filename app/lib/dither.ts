import { type GradientOptions, calculateGradientMask } from "./gradient";

export interface DitherOptions {
  threshold?: number;
  pixelSize?: number;
  spacing?: number;
  blur?: number;
  gradient?: GradientOptions;
  resolution?: number;
  invert?: boolean;
  steps?: number;
  brightness?: number;
  contrast?: number;
  useOrdered?: boolean;
}

const bayerMatrix8x8 = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
];

export function ditherImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: DitherOptions = {}
) {
  const {
    threshold = 128,
    pixelSize = 1,
    spacing = 2,
    blur = 0,
    gradient = {
      angle: 0,
      points: [
        { position: 0, opacity: 100, density: 100 },
        { position: 100, opacity: 100, density: 100 },
      ],
    },
    resolution = 2,
    invert = false,
    brightness: brightnessAdj = 0,
    contrast: contrastAdj = 0,
    useOrdered = true,
  } = options;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;

  if (blur > 0) {
    tempCtx.filter = `blur(${blur}px)`;
    tempCtx.drawImage(ctx.canvas, 0, 0);
    const blurredData = tempCtx.getImageData(0, 0, width, height).data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = blurredData[i];
      data[i + 1] = blurredData[i + 1];
      data[i + 2] = blurredData[i + 2];
    }
  }

  ctx.clearRect(0, 0, width, height);

  const actualSpacing = Math.max(1, Math.floor(spacing / resolution));

  for (let y = 0; y < height; y += actualSpacing) {
    for (let x = 0; x < width; x += actualSpacing) {
      const i = (Math.floor(y) * width + Math.floor(x)) * 4;
      let brightness =
        (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);

      brightness = brightness * (1 + contrastAdj / 100) + brightness * (brightness / 255) * (contrastAdj / 100);
      brightness = brightness + brightnessAdj;

      if (invert) {
        brightness = 255 - brightness;
      }

      const mask = calculateGradientMask(x, y, width, height, gradient);

      let on = false;
      if (useOrdered) {
        const matrixX = Math.floor(x) % 8;
        const matrixY = Math.floor(y) % 8;
        const bayerValue = bayerMatrix8x8[matrixY][matrixX] / 64;
        const ditheredThreshold = threshold + (bayerValue - 0.5) * 255 * mask.density;
        on = brightness > ditheredThreshold;
      } else {
        on = brightness > threshold;
      }

      if (on) {
        ctx.fillStyle = `rgba(255, 255, 255, ${mask.opacity})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
      }
    }
  }
}
