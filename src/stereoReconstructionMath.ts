export interface StereoPoint {
  x: number;
  y: number;
}

export interface RectificationResult {
  left: StereoPoint;
  rightOriginal: StereoPoint;
  rightRectified: StereoPoint;
  verticalErrorBefore: number;
  verticalErrorAfter: number;
  disparity: number;
  rectified: boolean;
}

export function calculateVerticalAlignmentError(
  leftY: number,
  rightY: number,
): number {
  return leftY - rightY;
}

export function calculateDisparity(
  leftX: number,
  rightX: number,
): number {
  return leftX - rightX;
}

export function rectifyRightPoint(
  rightPoint: StereoPoint,
  targetY: number,
): StereoPoint {
  return {
    x: rightPoint.x,
    y: targetY,
  };
}

export function calculateRectification(
  leftPoint: StereoPoint,
  rightPoint: StereoPoint,
  tolerance = 1e-12,
): RectificationResult {
  const verticalErrorBefore = calculateVerticalAlignmentError(
    leftPoint.y,
    rightPoint.y,
  );

  const rightRectified = rectifyRightPoint(
    rightPoint,
    leftPoint.y,
  );

  const verticalErrorAfter = calculateVerticalAlignmentError(
    leftPoint.y,
    rightRectified.y,
  );

  const disparity = calculateDisparity(
    leftPoint.x,
    rightPoint.x,
  );

  return {
    left: leftPoint,
    rightOriginal: rightPoint,
    rightRectified,
    verticalErrorBefore,
    verticalErrorAfter,
    disparity,
    rectified: Math.abs(verticalErrorAfter) <= tolerance,
  };
}

export interface StereoMathVerification {
  passed: boolean;
  checks: string[];
}

export function verifyStereoRectificationMath(): StereoMathVerification {
  const checks: string[] = [];

  const leftPoint = {
    x: 420,
    y: 250,
  };

  const rightPoint = {
    x: 340,
    y: 270,
  };

  const result = calculateRectification(
    leftPoint,
    rightPoint,
  );

  if (result.verticalErrorBefore === -20) {
    checks.push("C1 vertical error before rectification = -20 px");
  } else {
    checks.push("C1 vertical error before rectification check failed");
  }

  if (result.rightRectified.y === 250) {
    checks.push("C1 right point is rectified onto the left scanline");
  } else {
    checks.push("C1 rectification check failed");
  }

  if (result.verticalErrorAfter === 0) {
    checks.push("C1 vertical error after rectification = 0 px");
  } else {
    checks.push("C1 post-rectification alignment check failed");
  }

  if (result.disparity === 80) {
    checks.push("C1 disparity remains 80 px after rectification");
  } else {
    checks.push("C1 disparity preservation check failed");
  }

  if (result.rectified) {
    checks.push("C1 correspondence satisfies y_L = y_R");
  } else {
    checks.push("C1 rectified correspondence check failed");
  }

  return {
    passed: checks.every((check) => !check.includes("failed")),
    checks,
  };
}
