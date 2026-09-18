import type { ColorImage, RGB } from "./colorScenes";

export interface ImageFormationParams {
  lightX: number;
  lightY: number;
  strength: number;
  sensorGain: number;
}

export interface ImageFormationPixel {
  reflectance: RGB;
  illumination: number;
  incident: RGB;
  observed: RGB;
}

const clamp255 = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value)));

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

export function illuminationAt(
  x: number,
  y: number,
  width: number,
  height: number,
  lightX: number,
  lightY: number,
  strength: number,
): number {
  const nx = x / Math.max(1, width - 1);
  const ny = y / Math.max(1, height - 1);

  const dx = nx - clamp01(lightX);
  const dy = ny - clamp01(lightY);

  const distance = Math.sqrt(dx * dx + dy * dy);
  const falloff = Math.max(0, 1 - distance / 0.75);

  return 0.25 + clamp01(strength) * 0.75 * falloff;
}

export function formPixel(
  reflectance: RGB,
  illumination: number,
  sensorGain: number,
): ImageFormationPixel {
  const l = Math.max(0, illumination);
  const gain = Math.max(0, sensorGain);

  const incident: RGB = {
    r: clamp255(reflectance.r * l),
    g: clamp255(reflectance.g * l),
    b: clamp255(reflectance.b * l),
  };

  const observed: RGB = {
    r: clamp255(reflectance.r * l * gain),
    g: clamp255(reflectance.g * l * gain),
    b: clamp255(reflectance.b * l * gain),
  };

  return {
    reflectance,
    illumination: l,
    incident,
    observed,
  };
}

export function createIlluminationImage(
  image: ColorImage,
  params: ImageFormationParams,
): ColorImage {
  const output = new Uint8ClampedArray(
    image.width * image.height * 3,
  );

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const l = illuminationAt(
        x,
        y,
        image.width,
        image.height,
        params.lightX,
        params.lightY,
        params.strength,
      );

      const value = clamp255(l * 255);
      const i = (y * image.width + x) * 3;

      output[i] = value;
      output[i + 1] = value;
      output[i + 2] = value;
    }
  }

  return {
    width: image.width,
    height: image.height,
    data: output,
  };
}

export function formObservedImage(
  reflectanceImage: ColorImage,
  params: ImageFormationParams,
): ColorImage {
  const output = new Uint8ClampedArray(
    reflectanceImage.data.length,
  );

  for (let y = 0; y < reflectanceImage.height; y++) {
    for (let x = 0; x < reflectanceImage.width; x++) {
      const illumination = illuminationAt(
        x,
        y,
        reflectanceImage.width,
        reflectanceImage.height,
        params.lightX,
        params.lightY,
        params.strength,
      );

      const i =
        (y * reflectanceImage.width + x) * 3;

      output[i] = clamp255(
        reflectanceImage.data[i] *
          illumination *
          Math.max(0, params.sensorGain),
      );

      output[i + 1] = clamp255(
        reflectanceImage.data[i + 1] *
          illumination *
          Math.max(0, params.sensorGain),
      );

      output[i + 2] = clamp255(
        reflectanceImage.data[i + 2] *
          illumination *
          Math.max(0, params.sensorGain),
      );
    }
  }

  return {
    width: reflectanceImage.width,
    height: reflectanceImage.height,
    data: output,
  };
}

export function getImageFormationPixel(
  image: ColorImage,
  x: number,
  y: number,
  params: ImageFormationParams,
): ImageFormationPixel {
  const px = Math.max(
    0,
    Math.min(image.width - 1, Math.round(x)),
  );

  const py = Math.max(
    0,
    Math.min(image.height - 1, Math.round(y)),
  );

  const i = (py * image.width + px) * 3;

  const reflectance: RGB = {
    r: image.data[i],
    g: image.data[i + 1],
    b: image.data[i + 2],
  };

  const illumination = illuminationAt(
    px,
    py,
    image.width,
    image.height,
    params.lightX,
    params.lightY,
    params.strength,
  );

  return formPixel(
    reflectance,
    illumination,
    params.sensorGain,
  );
}

export function verifyUnitIllumination(): boolean {
  const source: RGB = {
    r: 100,
    g: 150,
    b: 200,
  };

  const result = formPixel(
    source,
    1,
    1,
  );

  return (
    result.observed.r === 100 &&
    result.observed.g === 150 &&
    result.observed.b === 200
  );
}

export function verifyZeroIllumination(): boolean {
  const source: RGB = {
    r: 100,
    g: 150,
    b: 200,
  };

  const result = formPixel(
    source,
    0,
    1,
  );

  return (
    result.observed.r === 0 &&
    result.observed.g === 0 &&
    result.observed.b === 0
  );
}

export function verifyGainLinearity(): boolean {
  const source: RGB = {
    r: 50,
    g: 100,
    b: 150,
  };

  const normal = formPixel(
    source,
    0.5,
    1,
  );

  const doubled = formPixel(
    source,
    0.5,
    2,
  );

  return (
    doubled.observed.r === normal.observed.r * 2 &&
    doubled.observed.g === normal.observed.g * 2 &&
    doubled.observed.b === normal.observed.b * 2
  );
}
