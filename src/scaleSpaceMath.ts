import type { GrayImage } from "./imageScenes";
import { convolve, normalizeForDisplay } from "./math";

export const SCALE_VALUES = [0.5, 1, 2, 4] as const;

export type ScaleValue = typeof SCALE_VALUES[number];

export function gaussianKernel(size = 7, sigma = 1): number[][] {
  const safeSigma = Math.max(sigma, 0.1);
  const radius = Math.floor(size / 2);
  const kernel: number[][] = [];
  let sum = 0;

  for (let y = -radius; y <= radius; y++) {
    const row: number[] = [];

    for (let x = -radius; x <= radius; x++) {
      const value =
        Math.exp(-(x * x + y * y) / (2 * safeSigma * safeSigma)) /
        (2 * Math.PI * safeSigma * safeSigma);

      row.push(value);
      sum += value;
    }

    kernel.push(row);
  }

  return kernel.map((row) => row.map((value) => value / sum));
}

export function gaussianSmooth(
  image: GrayImage,
  sigma: number,
  size = 7
): GrayImage {
  return convolve(image, gaussianKernel(size, sigma));
}

export function gaussianDerivativeXKernel(
  size = 7,
  sigma = 1
): number[][] {
  const safeSigma = Math.max(sigma, 0.1);
  const radius = Math.floor(size / 2);
  const kernel: number[][] = [];
  const sigma2 = safeSigma * safeSigma;
  const normalization =
    1 / (2 * Math.PI * safeSigma * safeSigma);

  for (let y = -radius; y <= radius; y++) {
    const row: number[] = [];

    for (let x = -radius; x <= radius; x++) {
      const gaussian =
        normalization *
        Math.exp(-(x * x + y * y) / (2 * sigma2));

      row.push((-x / sigma2) * gaussian);
    }

    kernel.push(row);
  }

  return kernel;
}

export function gaussianDerivativeYKernel(
  size = 7,
  sigma = 1
): number[][] {
  const safeSigma = Math.max(sigma, 0.1);
  const radius = Math.floor(size / 2);
  const kernel: number[][] = [];
  const sigma2 = safeSigma * safeSigma;
  const normalization =
    1 / (2 * Math.PI * safeSigma * safeSigma);

  for (let y = -radius; y <= radius; y++) {
    const row: number[] = [];

    for (let x = -radius; x <= radius; x++) {
      const gaussian =
        normalization *
        Math.exp(-(x * x + y * y) / (2 * sigma2));

      row.push((-y / sigma2) * gaussian);
    }

    kernel.push(row);
  }

  return kernel;
}

export function derivativeOfGaussian(
  image: GrayImage,
  sigma: number,
  size = 7
) {
  const dx = convolve(
    image,
    gaussianDerivativeXKernel(size, sigma)
  );

  const dy = convolve(
    image,
    gaussianDerivativeYKernel(size, sigma)
  );

  const magnitude: GrayImage = {
    width: image.width,
    height: image.height,
    data: new Float32Array(image.data.length),
  };

  for (let i = 0; i < magnitude.data.length; i++) {
    magnitude.data[i] = Math.hypot(dx.data[i], dy.data[i]);
  }

  return { dx, dy, magnitude };
}

export function derivativeOfGaussianDisplay(
  image: GrayImage,
  sigma: number,
  size = 7
) {
  const response = derivativeOfGaussian(image, sigma, size);

  return {
    dx: normalizeForDisplay(response.dx),
    dy: normalizeForDisplay(response.dy),
    magnitude: normalizeForDisplay(response.magnitude),
    raw: response,
  };
}

export function scaleSpace(
  image: GrayImage,
  sigma: number,
  size = 7
): GrayImage {
  return gaussianSmooth(image, sigma, size);
}

export function compareScaleResponses(
  image: GrayImage,
  scales: readonly number[] = SCALE_VALUES
) {
  return scales.map((sigma) => ({
    sigma,
    smoothed: gaussianSmooth(image, sigma),
    derivative: derivativeOfGaussian(image, sigma),
  }));
}

export function imageVariance(image: GrayImage): number {
  if (image.data.length === 0) return 0;

  let sum = 0;

  for (const value of image.data) {
    sum += value;
  }

  const mean = sum / image.data.length;

  let squared = 0;

  for (const value of image.data) {
    const delta = value - mean;
    squared += delta * delta;
  }

  return squared / image.data.length;
}

export function kernelSum(kernel: number[][]): number {
  return kernel.flat().reduce((sum, value) => sum + value, 0);
}

export function verifyGaussianKernel(): boolean {
  const kernel = gaussianKernel(7, 1);

  const sum = kernelSum(kernel);
  const center = kernel[3][3];

  return (
    Math.abs(sum - 1) < 1e-5 &&
    center > kernel[0][0]
  );
}

export function verifyGaussianSmoothing(): boolean {
  const image: GrayImage = {
    width: 9,
    height: 9,
    data: new Float32Array(81),
  };

  image.data.fill(0);
  image.data[4 * 9 + 4] = 255;

  const fine = gaussianSmooth(image, 0.5);
  const coarse = gaussianSmooth(image, 4);

  const fineCenter = fine.data[4 * 9 + 4];
  const coarseCenter = coarse.data[4 * 9 + 4];

  return (
    fineCenter > coarseCenter &&
    imageVariance(coarse) < imageVariance(fine)
  );
}

export function verifyDerivativeOfGaussian(): boolean {
  const image: GrayImage = {
    width: 9,
    height: 9,
    data: new Float32Array(
      Array.from({ length: 81 }, (_, i) => i % 9)
    ),
  };

  const response = derivativeOfGaussian(image, 1);

  const interior = [10, 11, 12, 19, 20, 21, 28, 29, 30];

  return interior.every(
    (index) =>
      Math.abs(response.dx.data[index]) >
      Math.abs(response.dy.data[index])
  );
}

export function verifyDerivativeKernelSums(): boolean {
  const dx = gaussianDerivativeXKernel(7, 1);
  const dy = gaussianDerivativeYKernel(7, 1);

  return (
    Math.abs(kernelSum(dx)) < 1e-5 &&
    Math.abs(kernelSum(dy)) < 1e-5
  );
}
