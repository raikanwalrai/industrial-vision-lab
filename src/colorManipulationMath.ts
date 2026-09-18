import type { ColorImage, RGB } from "./colorScenes";

const clamp255 = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value)));

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

/*
 * ------------------------------------------------------------
 * 1. BRIGHTNESS
 * ------------------------------------------------------------
 *
 * I' = I + Δ
 *
 * The same Δ is added to R, G and B.
 */
export function adjustBrightness(
  rgb: RGB,
  delta: number,
): RGB {
  return {
    r: clamp255(rgb.r + delta),
    g: clamp255(rgb.g + delta),
    b: clamp255(rgb.b + delta),
  };
}

/*
 * ------------------------------------------------------------
 * 2. CONTRAST
 * ------------------------------------------------------------
 *
 * I' = α(I - μ) + μ
 *
 * μ is the midpoint around which contrast is changed.
 */
export function adjustContrast(
  rgb: RGB,
  alpha: number,
  midpoint = 128,
): RGB {
  return {
    r: clamp255(alpha * (rgb.r - midpoint) + midpoint),
    g: clamp255(alpha * (rgb.g - midpoint) + midpoint),
    b: clamp255(alpha * (rgb.b - midpoint) + midpoint),
  };
}

/*
 * ------------------------------------------------------------
 * 3. RGB -> HSV
 * ------------------------------------------------------------
 *
 * We use HSV because saturation is an explicit component.
 */
function rgbToHsv(rgb: RGB) {
  const r = clamp255(rgb.r) / 255;
  const g = clamp255(rgb.g) / 255;
  const b = clamp255(rgb.b) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  if (h < 0) {
    h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

/*
 * HSV -> RGB
 */
function hsvToRgb(
  h: number,
  s: number,
  v: number,
): RGB {
  const hue = ((h % 360) + 360) % 360;

  const c = v * s;
  const x =
    c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;

  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (hue < 60) {
    [rp, gp, bp] = [c, x, 0];
  } else if (hue < 120) {
    [rp, gp, bp] = [x, c, 0];
  } else if (hue < 180) {
    [rp, gp, bp] = [0, c, x];
  } else if (hue < 240) {
    [rp, gp, bp] = [0, x, c];
  } else if (hue < 300) {
    [rp, gp, bp] = [x, 0, c];
  } else {
    [rp, gp, bp] = [c, 0, x];
  }

  return {
    r: clamp255((rp + m) * 255),
    g: clamp255((gp + m) * 255),
    b: clamp255((bp + m) * 255),
  };
}

/*
 * ------------------------------------------------------------
 * 4. SATURATION
 * ------------------------------------------------------------
 *
 * S' = clamp(S × factor)
 *
 * Hue and Value remain unchanged.
 */
export function adjustSaturation(
  rgb: RGB,
  factor: number,
): RGB {
  const hsv = rgbToHsv(rgb);

  const newSaturation =
    clamp01(hsv.s * factor);

  return hsvToRgb(
    hsv.h,
    newSaturation,
    hsv.v,
  );
}

/*
 * ------------------------------------------------------------
 * 5. INDIVIDUAL RGB CHANNEL
 * ------------------------------------------------------------
 *
 * Only the selected channel changes.
 */
export function adjustChannel(
  rgb: RGB,
  channel: "r" | "g" | "b",
  delta: number,
): RGB {
  return {
    r:
      channel === "r"
        ? clamp255(rgb.r + delta)
        : clamp255(rgb.r),

    g:
      channel === "g"
        ? clamp255(rgb.g + delta)
        : clamp255(rgb.g),

    b:
      channel === "b"
        ? clamp255(rgb.b + delta)
        : clamp255(rgb.b),
  };
}

/*
 * ------------------------------------------------------------
 * 6. APPLY ALL GROUP D OPERATIONS
 * ------------------------------------------------------------
 *
 * Order:
 *
 * RGB
 *   -> brightness
 *   -> contrast
 *   -> saturation
 *   -> selected RGB channel
 */
export function manipulatePixel(
  rgb: RGB,
  brightness: number,
  contrast: number,
  saturation: number,
  channel: "r" | "g" | "b",
  channelDelta: number,
): RGB {
  const bright = adjustBrightness(
    rgb,
    brightness,
  );

  const contrasted = adjustContrast(
    bright,
    contrast,
    128,
  );

  const saturated = adjustSaturation(
    contrasted,
    saturation,
  );

  return adjustChannel(
    saturated,
    channel,
    channelDelta,
  );
}

/*
 * ------------------------------------------------------------
 * 7. APPLY TRANSFORMATION TO AN ENTIRE IMAGE
 * ------------------------------------------------------------
 */
export function mapColorImage(
  image: ColorImage,
  transform: (rgb: RGB) => RGB,
): ColorImage {
  const output =
    new Uint8ClampedArray(
      image.data.length,
    );

  for (
    let i = 0;
    i < image.data.length;
    i += 3
  ) {
    const rgb: RGB = {
      r: image.data[i],
      g: image.data[i + 1],
      b: image.data[i + 2],
    };

    const transformed =
      transform(rgb);

    output[i] =
      clamp255(transformed.r);

    output[i + 1] =
      clamp255(transformed.g);

    output[i + 2] =
      clamp255(transformed.b);
  }

  return {
    width: image.width,
    height: image.height,
    data: output,
  };
}

export function applyColourManipulation(
  image: ColorImage,
  brightness: number,
  contrast: number,
  saturation: number,
  channel: "r" | "g" | "b",
  channelDelta: number,
): ColorImage {
  return mapColorImage(
    image,
    (rgb) =>
      manipulatePixel(
        rgb,
        brightness,
        contrast,
        saturation,
        channel,
        channelDelta,
      ),
  );
}

/*
 * ------------------------------------------------------------
 * 8. VERIFICATION HELPERS
 * ------------------------------------------------------------
 */

export function channelChanges(
  before: RGB,
  after: RGB,
) {
  return {
    r: after.r - before.r,
    g: after.g - before.g,
    b: after.b - before.b,
  };
}

export function rgbDistance(
  a: RGB,
  b: RGB,
): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 +
    (a.g - b.g) ** 2 +
    (a.b - b.b) ** 2,
  );
}

/*
 * Brightness verification:
 *
 * [100,120,140] + 20
 * =
 * [120,140,160]
 */
export function verifyBrightnessDelta(): boolean {
  const source: RGB = {
    r: 100,
    g: 120,
    b: 140,
  };

  const result =
    adjustBrightness(source, 20);

  return (
    result.r === 120 &&
    result.g === 140 &&
    result.b === 160
  );
}

/*
 * Contrast verification around μ = 80:
 *
 * 2(100 - 80) + 80 = 120
 * 2(60  - 80) + 80 = 40
 */
export function verifyContrastSymmetry(): boolean {
  const high =
    adjustContrast(
      { r: 100, g: 100, b: 100 },
      2,
      80,
    );

  const low =
    adjustContrast(
      { r: 60, g: 60, b: 60 },
      2,
      80,
    );

  return (
    high.r === 120 &&
    low.r === 40
  );
}

/*
 * Saturation must always produce valid
 * 8-bit RGB values.
 */
export function verifySaturationBounded(): boolean {
  const result =
    adjustSaturation(
      { r: 220, g: 100, b: 40 },
      1.8,
    );

  return [
    result.r,
    result.g,
    result.b,
  ].every(
    (value) =>
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 255,
  );
}

/*
 * Changing R must not directly change G or B.
 */
export function verifyChannelIndependence(): boolean {
  const source: RGB = {
    r: 100,
    g: 150,
    b: 200,
  };

  const result =
    adjustChannel(
      source,
      "r",
      20,
    );

  return (
    result.r === 120 &&
    result.g === 150 &&
    result.b === 200
  );
}
