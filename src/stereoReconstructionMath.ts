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

export type DisparityMap = number[][];

export interface DisparityMapResult {
  map: DisparityMap;
  width: number;
  height: number;
  selectedRow: number;
  selectedColumn: number;
  selectedDisparity: number;
}

export function calculateDisparityMap(
  map: DisparityMap,
  selectedRow: number,
  selectedColumn: number,
): DisparityMapResult {
  if (map.length === 0 || map[0].length === 0) {
    throw new Error("Disparity map must not be empty");
  }

  const width = map[0].length;

  if (!map.every((row) => row.length === width)) {
    throw new Error("Disparity map rows must have equal length");
  }

  if (
    selectedRow < 0 ||
    selectedRow >= map.length ||
    selectedColumn < 0 ||
    selectedColumn >= width
  ) {
    throw new Error("Selected disparity-map cell is outside the map");
  }

  return {
    map,
    width,
    height: map.length,
    selectedRow,
    selectedColumn,
    selectedDisparity: map[selectedRow][selectedColumn],
  };
}

export function calculateCorrespondingRightX(
  leftX: number,
  disparity: number,
): number {
  return leftX - disparity;
}

export const C2_DISPARITY_MAP: DisparityMap = [
  [20, 20, 20, 20, 20],
  [20, 40, 40, 40, 20],
  [20, 40, 60, 40, 20],
  [20, 80, 80, 80, 20],
  [20, 20, 20, 20, 20],
];

export interface StereoMathVerification {
  passed: boolean;
  checks: string[];
}

export function verifyStereoDisparityMapMath(): StereoMathVerification {
  const checks: string[] = [];

  const result = calculateDisparityMap(
    C2_DISPARITY_MAP,
    2,
    2,
  );

  if (result.width === 5 && result.height === 5) {
    checks.push("C2 disparity map dimensions = 5 x 5");
  } else {
    checks.push("C2 disparity map dimensions check failed");
  }

  if (result.selectedDisparity === 60) {
    checks.push("C2 selected center disparity = 60 px");
  } else {
    checks.push("C2 selected center disparity check failed");
  }

  if (C2_DISPARITY_MAP[3][1] === 80) {
    checks.push("C2 high-disparity region = 80 px");
  } else {
    checks.push("C2 high-disparity region check failed");
  }

  if (C2_DISPARITY_MAP[0][0] === 20) {
    checks.push("C2 low-disparity region = 20 px");
  } else {
    checks.push("C2 low-disparity region check failed");
  }

  const leftX = 420;
  const disparity = result.selectedDisparity;
  const rightX = calculateCorrespondingRightX(
    leftX,
    disparity,
  );

  if (rightX === 360) {
    checks.push("C2 corresponding right x = 360 px");
  } else {
    checks.push("C2 corresponding right x check failed");
  }

  if (calculateDisparity(leftX, rightX) === disparity) {
    checks.push("C2 reconstructed disparity = 60 px");
  } else {
    checks.push("C2 disparity reconstruction check failed");
  }

  return {
    passed: checks.every((check) => !check.includes("failed")),
    checks,
  };
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
