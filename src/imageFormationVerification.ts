import type { ColorImage, RGB } from "./colorScenes";

export interface FullImageFormationParams {
  lightR: number;
  lightG: number;
  lightB: number;
  sensorGain: number;
}

export interface FullImageFormationPixel {
  reflectance: RGB;
  illumination: RGB;
  incident: RGB;
  observed: RGB;
}

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const lightOf = (p: FullImageFormationParams): RGB => ({
  r: clamp01(p.lightR), g: clamp01(p.lightG), b: clamp01(p.lightB),
});

export function formFullPixel(
  reflectance: RGB,
  params: FullImageFormationParams,
): FullImageFormationPixel {
  const illumination = lightOf(params);
  const incident: RGB = {
    r: clamp255(reflectance.r * illumination.r),
    g: clamp255(reflectance.g * illumination.g),
    b: clamp255(reflectance.b * illumination.b),
  };
  const gain = Math.max(0, params.sensorGain);
  const observed: RGB = {
    r: clamp255(reflectance.r * illumination.r * gain),
    g: clamp255(reflectance.g * illumination.g * gain),
    b: clamp255(reflectance.b * illumination.b * gain),
  };
  return { reflectance, illumination, incident, observed };
}

export function formFullObservedImage(
  image: ColorImage,
  params: FullImageFormationParams,
): ColorImage {
  const output = new Uint8ClampedArray(image.data.length);
  const l = lightOf(params);
  const gain = Math.max(0, params.sensorGain);
  for (let i = 0; i < image.data.length; i += 3) {
    output[i] = clamp255(image.data[i] * l.r * gain);
    output[i + 1] = clamp255(image.data[i + 1] * l.g * gain);
    output[i + 2] = clamp255(image.data[i + 2] * l.b * gain);
  }
  return { width: image.width, height: image.height, data: output };
}

export function createFullIlluminationImage(
  image: ColorImage,
  params: FullImageFormationParams,
): ColorImage {
  const output = new Uint8ClampedArray(image.data.length);
  const l = lightOf(params);
  for (let i = 0; i < image.data.length; i += 3) {
    output[i] = clamp255(l.r * 255);
    output[i + 1] = clamp255(l.g * 255);
    output[i + 2] = clamp255(l.b * 255);
  }
  return { width: image.width, height: image.height, data: output };
}

export function getFullImageFormationPixel(
  image: ColorImage, x: number, y: number,
  params: FullImageFormationParams,
): FullImageFormationPixel {
  const px = Math.max(0, Math.min(image.width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(image.height - 1, Math.round(y)));
  const i = (py * image.width + px) * 3;
  return formFullPixel(
    { r: image.data[i], g: image.data[i + 1], b: image.data[i + 2] },
    params,
  );
}

const approx = (a: number, b: number, tolerance = 1) => Math.abs(a - b) <= tolerance;

export function verifyWhiteIllumination(): boolean {
  const o = formFullPixel({r:220,g:100,b:40},
    {lightR:1,lightG:1,lightB:1,sensorGain:1}).observed;
  return approx(o.r,220) && approx(o.g,100) && approx(o.b,40);
}

export function verifyColouredIllumination(): boolean {
  const o = formFullPixel({r:220,g:100,b:40},
    {lightR:1,lightG:0,lightB:0,sensorGain:1}).observed;
  return approx(o.r,220) && approx(o.g,0) && approx(o.b,0);
}

export function verifyGainLinearity(): boolean {
  const r = {r:100,g:80,b:40};
  const a = formFullPixel(r,{lightR:1,lightG:1,lightB:1,sensorGain:1}).observed;
  const b = formFullPixel(r,{lightR:1,lightG:1,lightB:1,sensorGain:.5}).observed;
  return approx(b.r,50) && approx(b.g,40) && approx(b.b,20) &&
    a.r > b.r && a.g > b.g && a.b > b.b;
}

export function verifyChannelIndependence(): boolean {
  const r = {r:200,g:120,b:60};
  const a = formFullPixel(r,{lightR:1,lightG:.5,lightB:.25,sensorGain:1}).observed;
  const b = formFullPixel(r,{lightR:.5,lightG:.5,lightB:.25,sensorGain:1}).observed;
  return approx(a.g,b.g) && approx(a.b,b.b) && a.r !== b.r;
}

export function verifyZeroIllumination(): boolean {
  const o = formFullPixel({r:200,g:120,b:60},
    {lightR:0,lightG:0,lightB:0,sensorGain:1}).observed;
  return o.r === 0 && o.g === 0 && o.b === 0;
}
