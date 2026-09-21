import type { Point2D, NormalizedPoint } from "./cameraMath";
import {
  normalizedToPixelWithIntrinsics,
  type IntrinsicParameters,
} from "./cameraIntrinsicsMath";

export type RadialDistortionParameters = {
  k1: number;
  k2: number;
};

export type DistortedPoint = {
  ideal: NormalizedPoint;
  radiusSquared: number;
  radialFactor: number;
  distorted: NormalizedPoint;
};

export type DistortedPixelResult = DistortedPoint & {
  pixel: Point2D;
};

export type ReprojectionErrorResult = {
  du: number;
  dv: number;
  error: number;
};

export function radialDistort(
  point: NormalizedPoint,
  distortion: RadialDistortionParameters,
): DistortedPoint {
  const radiusSquared = point.x ** 2 + point.y ** 2;

  const radialFactor =
    1 +
    distortion.k1 * radiusSquared +
    distortion.k2 * radiusSquared ** 2;

  return {
    ideal: point,
    radiusSquared,
    radialFactor,
    distorted: {
      x: point.x * radialFactor,
      y: point.y * radialFactor,
    },
  };
}

export function radialDistortToPixel(
  point: NormalizedPoint,
  distortion: RadialDistortionParameters,
  intrinsics: IntrinsicParameters,
): DistortedPixelResult {
  const result = radialDistort(point, distortion);

  return {
    ...result,
    pixel: normalizedToPixelWithIntrinsics(
      result.distorted,
      intrinsics,
    ),
  };
}

export function reprojectionError(
  observed: Point2D,
  predicted: Point2D,
): ReprojectionErrorResult {
  const du = observed.u - predicted.u;
  const dv = observed.v - predicted.v;

  return {
    du,
    dv,
    error: Math.sqrt(du ** 2 + dv ** 2),
  };
}

export function estimateK1FromCorrespondences(
  correspondences: Array<{
    ideal: NormalizedPoint;
    observed: NormalizedPoint;
  }>,
): number {
  let numerator = 0;
  let denominator = 0;

  for (const pair of correspondences) {
    const r2 =
      pair.ideal.x ** 2 +
      pair.ideal.y ** 2;

    if (Math.abs(pair.ideal.x) < 1e-12) {
      continue;
    }

    const y =
      pair.observed.x / pair.ideal.x - 1;

    numerator += r2 * y;
    denominator += r2 ** 2;
  }

  if (denominator === 0) {
    throw new Error(
      "Cannot estimate k1: no usable correspondences.",
    );
  }

  return numerator / denominator;
}

export function rmse(values: number[]): number {
  if (values.length === 0) {
    throw new Error("RMSE requires at least one value.");
  }

  const meanSquare =
    values.reduce(
      (sum, value) => sum + value ** 2,
      0,
    ) / values.length;

  return Math.sqrt(meanSquare);
}

export function verifyDistortionMath(): {
  passed: boolean;
  checks: string[];
} {
  const checks: string[] = [];

  // D1
  // x = 0.4, y = 0.3
  // r² = 0.25
  // k1 = 0.5, k2 = 0.1
  //
  // factor =
  // 1 + 0.5(0.25) + 0.1(0.25²)
  // = 1.13125
  const d1 = radialDistort(
    { x: 0.4, y: 0.3 },
    { k1: 0.5, k2: 0.1 },
  );

  const d1Ok =
    Math.abs(d1.radiusSquared - 0.25) < 1e-12 &&
    Math.abs(d1.radialFactor - 1.13125) < 1e-12 &&
    Math.abs(d1.distorted.x - 0.4525) < 1e-12 &&
    Math.abs(d1.distorted.y - 0.339375) < 1e-12;

  checks.push(
    d1Ok
      ? "Radial distortion numerical example"
      : "FAILED: Radial distortion numerical example",
  );

  const identity = radialDistort(
    { x: 0.4, y: 0.3 },
    { k1: 0, k2: 0 },
  );

  const identityOk =
    Math.abs(identity.distorted.x - 0.4) < 1e-12 &&
    Math.abs(identity.distorted.y - 0.3) < 1e-12;

  checks.push(
    identityOk
      ? "Zero-distortion baseline"
      : "FAILED: Zero-distortion baseline",
  );

  // D2
  // xd = 0.4525, yd = 0.339375
  //
  // u = 800(0.4525) + 320 = 682
  // v = 800(0.339375) + 240 = 511.5
  const d2 = radialDistortToPixel(
    { x: 0.4, y: 0.3 },
    { k1: 0.5, k2: 0.1 },
    { fx: 800, fy: 800, cx: 320, cy: 240 },
  );

  const d2Ok =
    Math.abs(d2.pixel.u - 682) < 1e-12 &&
    Math.abs(d2.pixel.v - 511.5) < 1e-12;

  checks.push(
    d2Ok
      ? "Distorted normalized to pixel mapping"
      : "FAILED: Distorted normalized to pixel mapping",
  );

  // D3
  // Synthetic data generated from k1 = 0.5.
  const correspondences = [
    { x: 0.2, y: 0.1 },
    { x: 0.4, y: 0.1 },
    { x: 0.3, y: 0.3 },
  ].map((ideal) => {
    const result = radialDistort(
      ideal,
      { k1: 0.5, k2: 0 },
    );

    return {
      ideal,
      observed: result.distorted,
    };
  });

  const estimatedK1 =
    estimateK1FromCorrespondences(correspondences);

  const d3Ok =
    Math.abs(estimatedK1 - 0.5) < 1e-12;

  checks.push(
    d3Ok
      ? "k1 calibration from correspondences"
      : "FAILED: k1 calibration from correspondences",
  );

  // D4
  // observed  = (682, 512)
  // predicted = (682, 511.5)
  // error = sqrt(0² + 0.5²) = 0.5 px
  const error = reprojectionError(
    { u: 682, v: 512 },
    { u: 682, v: 511.5 },
  );

  const d4ErrorOk =
    Math.abs(error.du) < 1e-12 &&
    Math.abs(error.dv - 0.5) < 1e-12 &&
    Math.abs(error.error - 0.5) < 1e-12;

  const rmseOk =
    Math.abs(
      rmse([0, 0.5, 1]) -
      Math.sqrt(1.25 / 3),
    ) < 1e-12;

  checks.push(
    d4ErrorOk
      ? "Reprojection error magnitude"
      : "FAILED: Reprojection error magnitude",
  );

  checks.push(
    rmseOk
      ? "RMSE calculation"
      : "FAILED: RMSE calculation",
  );

  return {
    passed:
      d1Ok &&
      identityOk &&
      d2Ok &&
      d3Ok &&
      d4ErrorOk &&
      rmseOk,
    checks,
  };
}
