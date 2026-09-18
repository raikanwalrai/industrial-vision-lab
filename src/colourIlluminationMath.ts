import type { ColorImage, RGB } from "./colorScenes";

export interface ColourIlluminationParams {
  lightR: number;
  lightG: number;
  lightB: number;
}

export interface ColourIlluminationPixel {
  reflectance: RGB;
  illumination: RGB;
  incident: RGB;
  observed: RGB;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export function formColourPixel(
  reflectance: RGB,
  illumination: RGB,
): ColourIlluminationPixel {
  const l: RGB = {
    r: clamp01(illumination.r),
    g: clamp01(illumination.g),
    b: clamp01(illumination.b),
  };

  const incident: RGB = {
    r: clamp255(reflectance.r * l.r),
    g: clamp255(reflectance.g * l.g),
    b: clamp255(reflectance.b * l.b),
  };

  return {
    reflectance,
    illumination: l,
    incident,
    observed: incident,
  };
}

export function createColourIlluminationImage(
  image: ColorImage,
  params: ColourIlluminationParams,
): ColorImage {
  const output = new Uint8ClampedArray(image.data.length);
  const l = {
    r: clamp01(params.lightR),
    g: clamp01(params.lightG),
    b: clamp01(params.lightB),
  };

  for (let i = 0; i < image.data.length; i += 3) {
    output[i] = clamp255(l.r * 255);
    output[i + 1] = clamp255(l.g * 255);
    output[i + 2] = clamp255(l.b * 255);
  }

  return { width: image.width, height: image.height, data: output };
}

export function formColourObservedImage(
  image: ColorImage,
  params: ColourIlluminationParams,
): ColorImage {
  const output = new Uint8ClampedArray(image.data.length);
  const l = {
    r: clamp01(params.lightR),
    g: clamp01(params.lightG),
    b: clamp01(params.lightB),
  };

  for (let i = 0; i < image.data.length; i += 3) {
    output[i] = clamp255(image.data[i] * l.r);
    output[i + 1] = clamp255(image.data[i + 1] * l.g);
    output[i + 2] = clamp255(image.data[i + 2] * l.b);
  }

  return { width: image.width, height: image.height, data: output };
}

export function getColourIlluminationPixel(
  image: ColorImage,
  x: number,
  y: number,
  params: ColourIlluminationParams,
): ColourIlluminationPixel {
  const px = Math.max(0, Math.min(image.width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(image.height - 1, Math.round(y)));
  const i = (py * image.width + px) * 3;

  return formColourPixel(
    { r: image.data[i], g: image.data[i + 1], b: image.data[i + 2] },
    { r: params.lightR, g: params.lightG, b: params.lightB },
  );
}

export function verifyWhiteLight(): boolean {
  const p = formColourPixel({r:220,g:100,b:40}, {r:1,g:1,b:1});
  return p.observed.r===220 && p.observed.g===100 && p.observed.b===40;
}

export function verifyRedLight(): boolean {
  const p = formColourPixel({r:220,g:100,b:40}, {r:1,g:0.2,b:0.2});
  return p.observed.r===220 && p.observed.g===20 && p.observed.b===8;
}

export function verifyChannelIndependenceF(): boolean {
  const p = formColourPixel({r:220,g:100,b:40}, {r:1,g:0.2,b:0.2});
  return p.observed.r===220 && p.observed.g===20 && p.observed.b===8;
}

export function verifyZeroColourIllumination(): boolean {
  const p = formColourPixel({r:220,g:100,b:40}, {r:0,g:0,b:0});
  return p.observed.r===0 && p.observed.g===0 && p.observed.b===0;
}
