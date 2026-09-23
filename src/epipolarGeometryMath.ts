export interface Point2D {
  x: number;
  y: number;
}

export interface HomogeneousPoint {
  x: number;
  y: number;
  w: number;
}

export interface CorrespondenceResult {
  left: Point2D;
  right: Point2D;
  horizontalDifference: number;
  verticalDifference: number;
}

export interface EpipolarVerificationResult {
  passed: boolean;
  checks: string[];
}

export function toHomogeneous(
  point: Point2D,
): HomogeneousPoint {
  return {
    x: point.x,
    y: point.y,
    w: 1,
  };
}

export function calculateCorrespondenceDifference(
  left: Point2D,
  right: Point2D,
): CorrespondenceResult {
  return {
    left,
    right,
    horizontalDifference: left.x - right.x,
    verticalDifference: right.y - left.y,
  };
}

export function verifyCorrespondence(
  left: Point2D,
  right: Point2D,
  tolerance = 1e-12,
): boolean {
  const result = calculateCorrespondenceDifference(
    left,
    right,
  );

  return (
    Math.abs(result.verticalDifference) <= tolerance &&
    result.horizontalDifference > 0
  );
}

export function verifyEpipolarB1Math(): EpipolarVerificationResult {
  const checks: string[] = [];

  const left: Point2D = {
    x: 420,
    y: 250,
  };

  const right: Point2D = {
    x: 340,
    y: 250,
  };

  const homogeneousLeft = toHomogeneous(left);
  const homogeneousRight = toHomogeneous(right);

  if (
    homogeneousLeft.x === 420 &&
    homogeneousLeft.y === 250 &&
    homogeneousLeft.w === 1 &&
    homogeneousRight.x === 340 &&
    homogeneousRight.y === 250 &&
    homogeneousRight.w === 1
  ) {
    checks.push("B1 homogeneous image points are correct");
  } else {
    checks.push("B1 homogeneous point check failed");
  }

  const correspondence =
    calculateCorrespondenceDifference(left, right);

  if (
    Math.abs(correspondence.horizontalDifference - 80) <
      1e-12 &&
    Math.abs(correspondence.verticalDifference) <
      1e-12
  ) {
    checks.push(
      "B1 correspondence difference = 80 px horizontal, 0 px vertical",
    );
  } else {
    checks.push(
      "B1 correspondence difference check failed",
    );
  }

  if (verifyCorrespondence(left, right)) {
    checks.push("B1 correspondence is valid for rectified stereo");
  } else {
    checks.push("B1 correspondence validation failed");
  }

  const invalidRight: Point2D = {
    x: 340,
    y: 270,
  };

  if (!verifyCorrespondence(left, invalidRight)) {
    checks.push(
      "B1 vertically displaced point is rejected",
    );
  } else {
    checks.push(
      "B1 invalid correspondence check failed",
    );
  }

  return {
    passed: checks.every(
      (check) => !check.includes("failed"),
    ),
    checks,
  };
}



export type Matrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export interface EpipolarLine {
  a: number;
  b: number;
  c: number;
}

export function multiplyMatrixVector(
  matrix: Matrix3x3,
  vector: [number, number, number],
): [number, number, number] {
  return [
    matrix[0][0] * vector[0] +
      matrix[0][1] * vector[1] +
      matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] +
      matrix[1][1] * vector[1] +
      matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] +
      matrix[2][1] * vector[1] +
      matrix[2][2] * vector[2],
  ];
}

export function calculateEpipolarLine(
  fundamentalMatrix: Matrix3x3,
  point: Point2D,
): EpipolarLine {
  const result = multiplyMatrixVector(
    fundamentalMatrix,
    [point.x, point.y, 1],
  );

  return {
    a: result[0],
    b: result[1],
    c: result[2],
  };
}

export function evaluateEpipolarLine(
  line: EpipolarLine,
  point: Point2D,
): number {
  return line.a * point.x + line.b * point.y + line.c;
}

export function calculateFundamentalConstraint(
  fundamentalMatrix: Matrix3x3,
  leftPoint: Point2D,
  rightPoint: Point2D,
): number {
  const line = calculateEpipolarLine(
    fundamentalMatrix,
    leftPoint,
  );

  return evaluateEpipolarLine(
    line,
    rightPoint,
  );
}

export function verifyFundamentalMatrixMath(): EpipolarVerificationResult {
  const checks: string[] = [];

  const F: Matrix3x3 = [
    [0, 0, 0],
    [0, 0, -1],
    [0, 1, 0],
  ];

  const leftPoint: Point2D = {
    x: 420,
    y: 250,
  };

  const rightPoint: Point2D = {
    x: 340,
    y: 250,
  };

  const validConstraint = calculateFundamentalConstraint(
    F,
    leftPoint,
    rightPoint,
  );

  if (Math.abs(validConstraint) < 1e-12) {
    checks.push("B3 valid correspondence gives x_R^T F x_L = 0");
  } else {
    checks.push("B3 valid correspondence check failed");
  }

  const invalidPoint: Point2D = {
    x: 340,
    y: 270,
  };

  const invalidConstraint = calculateFundamentalConstraint(
    F,
    leftPoint,
    invalidPoint,
  );

  if (Math.abs(invalidConstraint + 20) < 1e-12) {
    checks.push("B3 invalid correspondence gives constraint = -20");
  } else {
    checks.push("B3 invalid correspondence check failed");
  }

  return {
    passed: checks.every(
      (check) => !check.includes("failed"),
    ),
    checks,
  };
}

export function verifyEpipolarLineMath(): EpipolarVerificationResult {
  const checks: string[] = [];

  const F: Matrix3x3 = [
    [0, 0, 0],
    [0, 0, -1],
    [0, 1, 0],
  ];

  const leftPoint: Point2D = {
    x: 420,
    y: 250,
  };

  const line = calculateEpipolarLine(F, leftPoint);

  if (
    Math.abs(line.a) < 1e-12 &&
    Math.abs(line.b + 1) < 1e-12 &&
    Math.abs(line.c - 250) < 1e-12
  ) {
    checks.push("B2 epipolar line = y = 250");
  } else {
    checks.push("B2 epipolar line check failed");
  }

  const validPoint: Point2D = {
    x: 340,
    y: 250,
  };

  const validValue = evaluateEpipolarLine(
    line,
    validPoint,
  );

  if (Math.abs(validValue) < 1e-12) {
    checks.push("B2 point on epipolar line evaluates to 0");
  } else {
    checks.push("B2 point-on-line check failed");
  }

  const invalidPoint: Point2D = {
    x: 340,
    y: 270,
  };

  const invalidValue = evaluateEpipolarLine(
    line,
    invalidPoint,
  );

  if (Math.abs(invalidValue) > 1e-12) {
    checks.push("B2 point away from epipolar line is non-zero");
  } else {
    checks.push("B2 off-line point check failed");
  }

  return {
    passed: checks.every(
      (check) => !check.includes("failed"),
    ),
    checks,
  };
}


export function calculateEssentialMatrix(
  rotation: Matrix3x3,
  translation: [number, number, number],
): Matrix3x3 {
  const [tx, ty, tz] = translation;

  const skewTranslation: Matrix3x3 = [
    [0, -tz, ty],
    [tz, 0, -tx],
    [-ty, tx, 0],
  ];

  return [
    [
      skewTranslation[0][0] * rotation[0][0] +
        skewTranslation[0][1] * rotation[1][0] +
        skewTranslation[0][2] * rotation[2][0],
      skewTranslation[0][0] * rotation[0][1] +
        skewTranslation[0][1] * rotation[1][1] +
        skewTranslation[0][2] * rotation[2][1],
      skewTranslation[0][0] * rotation[0][2] +
        skewTranslation[0][1] * rotation[1][2] +
        skewTranslation[0][2] * rotation[2][2],
    ],
    [
      skewTranslation[1][0] * rotation[0][0] +
        skewTranslation[1][1] * rotation[1][0] +
        skewTranslation[1][2] * rotation[2][0],
      skewTranslation[1][0] * rotation[0][1] +
        skewTranslation[1][1] * rotation[1][1] +
        skewTranslation[1][2] * rotation[2][1],
      skewTranslation[1][0] * rotation[0][2] +
        skewTranslation[1][1] * rotation[1][2] +
        skewTranslation[1][2] * rotation[2][2],
    ],
    [
      skewTranslation[2][0] * rotation[0][0] +
        skewTranslation[2][1] * rotation[1][0] +
        skewTranslation[2][2] * rotation[2][0],
      skewTranslation[2][0] * rotation[0][1] +
        skewTranslation[2][1] * rotation[1][1] +
        skewTranslation[2][2] * rotation[2][1],
      skewTranslation[2][0] * rotation[0][2] +
        skewTranslation[2][1] * rotation[1][2] +
        skewTranslation[2][2] * rotation[2][2],
    ],
  ];
}

export function calculateEssentialConstraint(
  essentialMatrix: Matrix3x3,
  leftPoint: HomogeneousPoint,
  rightPoint: HomogeneousPoint,
): number {
  const line = multiplyMatrixVector(essentialMatrix, [
    leftPoint.x,
    leftPoint.y,
    leftPoint.w,
  ]);

  return (
    rightPoint.x * line[0] +
    rightPoint.y * line[1] +
    rightPoint.w * line[2]
  );
}

export function verifyEssentialMatrixMath(): EpipolarVerificationResult {
  const checks: string[] = [];

  const rotation: Matrix3x3 = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  const translation: [number, number, number] = [0.2, 0, 0];

  const essentialMatrix = calculateEssentialMatrix(
    rotation,
    translation,
  );

  const leftPoint = {
    x: 0.42,
    y: 0.25,
    w: 1,
  };

  const rightPoint = {
    x: 0.34,
    y: 0.25,
    w: 1,
  };

  const validConstraint = calculateEssentialConstraint(
    essentialMatrix,
    leftPoint,
    rightPoint,
  );

  if (Math.abs(validConstraint) < 1e-12) {
    checks.push("B4 valid correspondence gives x_R^T E x_L = 0");
  } else {
    checks.push("B4 valid correspondence check failed");
  }

  const invalidPoint = {
    x: 0.34,
    y: 0.30,
    w: 1,
  };

  const invalidConstraint = calculateEssentialConstraint(
    essentialMatrix,
    leftPoint,
    invalidPoint,
  );

  if (Math.abs(invalidConstraint + 0.01) < 1e-12) {
    checks.push("B4 invalid correspondence gives constraint = -0.01");
  } else {
    checks.push("B4 invalid correspondence check failed");
  }

  return {
    passed: checks.every((check) => !check.includes("failed")),
    checks,
  };
}
