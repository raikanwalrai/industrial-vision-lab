export interface StereoPoint {
  xLeft: number;
  xRight: number;
}

export interface StereoDepthResult {
  disparity: number;
  depth: number;
}

export interface StereoCameraSetup {
  baseline: number;
  focalLength: number;
}

export interface StereoVerificationResult {
  passed: boolean;
  checks: string[];
}

export function calculateDisparity(
  xLeft: number,
  xRight: number,
): number {
  return xLeft - xRight;
}

export function calculateDepthFromDisparity(
  focalLength: number,
  baseline: number,
  disparity: number,
): number {
  if (disparity <= 0) {
    throw new Error("Disparity must be greater than zero.");
  }

  if (focalLength <= 0) {
    throw new Error("Focal length must be greater than zero.");
  }

  if (baseline <= 0) {
    throw new Error("Baseline must be greater than zero.");
  }

  return (focalLength * baseline) / disparity;
}

export function calculateStereoDepth(
  point: StereoPoint,
  setup: StereoCameraSetup,
): StereoDepthResult {
  const disparity = calculateDisparity(
    point.xLeft,
    point.xRight,
  );

  const depth = calculateDepthFromDisparity(
    setup.focalLength,
    setup.baseline,
    disparity,
  );

  return {
    disparity,
    depth,
  };
}

export function verifyStereoMath(): StereoVerificationResult {
  const checks: string[] = [];

  // A1 — Two cameras + baseline
  const baseline = 0.20;
  const focalLength = 800;

  checks.push(
    Math.abs(baseline - 0.20) < 1e-12
      ? "A1 baseline = 0.20 m"
      : "A1 baseline check failed",
  );

  // A2 — Corresponding points + disparity
  const disparity = calculateDisparity(420, 340);

  if (Math.abs(disparity - 80) < 1e-12) {
    checks.push("A2 disparity = 80 px");
  } else {
    checks.push("A2 disparity check failed");
  }

  // A3 — Depth from disparity
  const depth = calculateDepthFromDisparity(
    focalLength,
    baseline,
    disparity,
  );

  if (Math.abs(depth - 2.0) < 1e-12) {
    checks.push("A3 depth = 2.0 m");
  } else {
    checks.push("A3 depth check failed");
  }

  // A4 — Interactive stereo depth examples
  const nearDepth = calculateDepthFromDisparity(
    800,
    0.20,
    160,
  );

  const middleDepth = calculateDepthFromDisparity(
    800,
    0.20,
    80,
  );

  const farDepth = calculateDepthFromDisparity(
    800,
    0.20,
    40,
  );

  if (
    Math.abs(nearDepth - 1.0) < 1e-12 &&
    Math.abs(middleDepth - 2.0) < 1e-12 &&
    Math.abs(farDepth - 4.0) < 1e-12
  ) {
    checks.push("A4 depth progression = 1 m, 2 m, 4 m");
  } else {
    checks.push("A4 depth progression check failed");
  }

  const passed = checks.every(
    (check) => !check.includes("failed"),
  );

  return {
    passed,
    checks,
  };
}
