import type { NormalizedPoint, Point2D } from "./cameraMath";

export type IntrinsicParameters = {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
};

export type IntrinsicMatrix = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export type IntrinsicProjectionResult = {
  normalized: NormalizedPoint;
  pixel: Point2D;
  matrix: IntrinsicMatrix;
};

export function normalizedToPixelWithIntrinsics(
  normalized: NormalizedPoint,
  intrinsics: IntrinsicParameters,
): Point2D {
  return {
    u: intrinsics.fx * normalized.x + intrinsics.cx,
    v: intrinsics.fy * normalized.y + intrinsics.cy,
  };
}

export function makeIntrinsicMatrix(
  intrinsics: IntrinsicParameters,
): IntrinsicMatrix {
  return [
    [intrinsics.fx, 0, intrinsics.cx],
    [0, intrinsics.fy, intrinsics.cy],
    [0, 0, 1],
  ];
}

export function projectWithIntrinsics(
  normalized: NormalizedPoint,
  intrinsics: IntrinsicParameters,
): IntrinsicProjectionResult {
  return {
    normalized,
    pixel: normalizedToPixelWithIntrinsics(
      normalized,
      intrinsics,
    ),
    matrix: makeIntrinsicMatrix(intrinsics),
  };
}

export function focalPixelShift(
  normalizedCoordinate: number,
  focalLength: number,
): number {
  return focalLength * normalizedCoordinate;
}

export function principalPointShift(
  coordinate: number,
  principalPoint: number,
): number {
  return coordinate + principalPoint;
}

export function verifyIntrinsicMath(): {
  passed: boolean;
  checks: string[];
} {
  const checks: string[] = [];

  const normalized = {
    x: 0.375,
    y: 0.25,
  };

  const intrinsics = {
    fx: 800,
    fy: 800,
    cx: 320,
    cy: 240,
  };

  const pixel = normalizedToPixelWithIntrinsics(
    normalized,
    intrinsics,
  );

  const projectionOk =
    Math.abs(pixel.u - 620) < 1e-9 &&
    Math.abs(pixel.v - 440) < 1e-9;

  checks.push(
    projectionOk
      ? "Normalized → pixel projection"
      : "FAILED: Normalized → pixel projection",
  );

  const matrix = makeIntrinsicMatrix(
    intrinsics,
  );

  const matrixOk =
    matrix[0][0] === 800 &&
    matrix[0][1] === 0 &&
    matrix[0][2] === 320 &&
    matrix[1][0] === 0 &&
    matrix[1][1] === 800 &&
    matrix[1][2] === 240 &&
    matrix[2][0] === 0 &&
    matrix[2][1] === 0 &&
    matrix[2][2] === 1;

  checks.push(
    matrixOk
      ? "Intrinsic matrix construction"
      : "FAILED: Intrinsic matrix construction",
  );

  const fxChange =
    normalizedToPixelWithIntrinsics(
      normalized,
      {
        fx: 1000,
        fy: 800,
        cx: 320,
        cy: 240,
      },
    );

  const fxOk =
    Math.abs(fxChange.u - 695) < 1e-9 &&
    Math.abs(fxChange.v - 440) < 1e-9;

  checks.push(
    fxOk
      ? "Focal length affects horizontal scale"
      : "FAILED: Focal length affects horizontal scale",
  );

  const principalChange =
    normalizedToPixelWithIntrinsics(
      normalized,
      {
        fx: 800,
        fy: 800,
        cx: 300,
        cy: 200,
      },
    );

  const principalOk =
    Math.abs(principalChange.u - 600) < 1e-9 &&
    Math.abs(principalChange.v - 400) < 1e-9;

  checks.push(
    principalOk
      ? "Principal point shifts image coordinates"
      : "FAILED: Principal point shifts image coordinates",
  );

  const aspectChange =
    normalizedToPixelWithIntrinsics(
      normalized,
      {
        fx: 800,
        fy: 1200,
        cx: 320,
        cy: 240,
      },
    );

  const aspectOk =
    Math.abs(aspectChange.u - 620) < 1e-9 &&
    Math.abs(aspectChange.v - 540) < 1e-9;

  checks.push(
    aspectOk
      ? "Independent fx/fy scaling"
      : "FAILED: Independent fx/fy scaling",
  );

  return {
    passed:
      projectionOk &&
      matrixOk &&
      fxOk &&
      principalOk &&
      aspectOk,
    checks,
  };
}
