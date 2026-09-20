export type Point2D = {
  x: number;
  y: number;
};

export type LineModel = {
  slope: number;
  intercept: number;
};

export type Residual = Point2D & {
  predictedY: number;
  error: number;
  squaredError: number;
};

export type LineFitResult = {
  model: LineModel;
  residuals: Residual[];
  sse: number;
  mse: number;
  rmse: number;
  rSquared: number;
};

export type CircleModel = {
  cx: number;
  cy: number;
  radius: number;
};

export type CircleFitResult = {
  model: CircleModel;
  radialResiduals: Array<
    Point2D & {
      predictedRadius: number;
      residual: number;
      squaredError: number;
    }
  >;
  sse: number;
  mse: number;
  rmse: number;
};

export function makeLineDataset(): Point2D[] {
  /*
   * Ground-truth relationship is approximately:
   *
   *     y = 0.75x + 8
   *
   * Small deterministic measurement errors are added deliberately.
   */
  const offsets = [
    1.2,
    -0.8,
    0.6,
    -1.4,
    0.9,
    -0.3,
    1.1,
    -0.7,
  ];

  return offsets.map((noise, index) => {
    const x = 2 + index * 4;
    const idealY = 0.75 * x + 8;

    return {
      x,
      y: idealY + noise,
    };
  });
}

export function predictLine(
  model: LineModel,
  x: number,
): number {
  return model.slope * x + model.intercept;
}

export function fitLineLeastSquares(
  points: Point2D[],
): LineFitResult {
  if (points.length < 2) {
    throw new Error(
      "At least two points are required to fit a line.",
    );
  }

  const n = points.length;

  const meanX =
    points.reduce((sum, point) => sum + point.x, 0) /
    n;

  const meanY =
    points.reduce((sum, point) => sum + point.y, 0) /
    n;

  let numerator = 0;
  let denominator = 0;

  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;

    numerator += dx * dy;
    denominator += dx * dx;
  }

  if (denominator === 0) {
    throw new Error(
      "Cannot fit y = mx + b when all x values are identical.",
    );
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  const model = {
    slope,
    intercept,
  };

  const residuals = points.map((point) => {
    const predictedY = predictLine(
      model,
      point.x,
    );

    const error = point.y - predictedY;

    return {
      ...point,
      predictedY,
      error,
      squaredError: error * error,
    };
  });

  const sse = residuals.reduce(
    (sum, residual) =>
      sum + residual.squaredError,
    0,
  );

  const mse = sse / n;
  const rmse = Math.sqrt(mse);

  const totalSumOfSquares = points.reduce(
    (sum, point) =>
      sum + (point.y - meanY) ** 2,
    0,
  );

  const rSquared =
    totalSumOfSquares === 0
      ? 1
      : 1 - sse / totalSumOfSquares;

  return {
    model,
    residuals,
    sse,
    mse,
    rmse,
    rSquared,
  };
}

export function lineStandardForm(
  model: LineModel,
): {
  a: number;
  b: number;
  c: number;
} {
  /*
   * y = mx + b
   *
   * becomes
   *
   * mx - y + b = 0
   */
  return {
    a: model.slope,
    b: -1,
    c: model.intercept,
  };
}

export function pointToLineDistance(
  point: Point2D,
  model: LineModel,
): number {
  const { a, b, c } =
    lineStandardForm(model);

  return (
    Math.abs(
      a * point.x +
        b * point.y +
        c,
    ) /
    Math.sqrt(a * a + b * b)
  );
}

export function lineAngleDegrees(
  model: LineModel,
): number {
  return (
    (Math.atan(model.slope) * 180) /
    Math.PI
  );
}

export function makeCircleDataset(): Point2D[] {
  /*
   * Ground truth:
   *
   * center = (50, 50)
   * radius = 25
   *
   * Small deterministic radial measurement
   * errors make this a fitting problem.
   */
  const angles = [
    0,
    30,
    60,
    90,
    120,
    150,
    180,
    210,
    240,
    270,
    300,
    330,
  ];

  const radialOffsets = [
    0.8,
    -1.1,
    0.6,
    -0.7,
    1.0,
    -0.5,
    0.4,
    -0.9,
    0.7,
    -0.4,
    1.2,
    -0.6,
  ];

  const cx = 50;
  const cy = 50;
  const radius = 25;

  return angles.map(
    (angleDegrees, index) => {
      const theta =
        (angleDegrees * Math.PI) /
        180;

      const measuredRadius =
        radius + radialOffsets[index];

      return {
        x:
          cx +
          measuredRadius *
            Math.cos(theta),
        y:
          cy +
          measuredRadius *
            Math.sin(theta),
      };
    },
  );
}

export function fitCircleMeanCenter(
  points: Point2D[],
): CircleFitResult {
  if (points.length < 3) {
    throw new Error(
      "At least three points are required to fit a circle.",
    );
  }

  /*
   * Educational circle fit:
   *
   * 1. Estimate the center as the mean x/y.
   * 2. Compute each point's radius from that center.
   * 3. Use the mean radius as the fitted radius.
   *
   * This is intentionally transparent rather than
   * a full nonlinear least-squares circle solver.
   */
  const cx =
    points.reduce(
      (sum, point) => sum + point.x,
      0,
    ) / points.length;

  const cy =
    points.reduce(
      (sum, point) => sum + point.y,
      0,
    ) / points.length;

  const radii = points.map((point) =>
    Math.sqrt(
      (point.x - cx) ** 2 +
        (point.y - cy) ** 2,
    ),
  );

  const radius =
    radii.reduce(
      (sum, value) => sum + value,
      0,
    ) / radii.length;

  const model = {
    cx,
    cy,
    radius,
  };

  const radialResiduals = points.map(
    (point, index) => {
      const predictedRadius = radius;
      const residual =
        radii[index] - predictedRadius;

      return {
        ...point,
        predictedRadius,
        residual,
        squaredError:
          residual * residual,
      };
    },
  );

  const sse = radialResiduals.reduce(
    (sum, item) =>
      sum + item.squaredError,
    0,
  );

  const mse =
    sse / radialResiduals.length;

  const rmse = Math.sqrt(mse);

  return {
    model,
    radialResiduals,
    sse,
    mse,
    rmse,
  };
}

export function verifyLineFit(): boolean {
  const points = makeLineDataset();
  const result =
    fitLineLeastSquares(points);

  return (
    Math.abs(result.model.slope - 0.75) <
      0.05 &&
    Math.abs(result.model.intercept - 8) <
      1.0 &&
    result.rmse < 1.5 &&
    result.rSquared > 0.98
  );
}

export function verifyCircleFit(): boolean {
  const points = makeCircleDataset();
  const result =
    fitCircleMeanCenter(points);

  return (
    Math.abs(result.model.cx - 50) < 1 &&
    Math.abs(result.model.cy - 50) < 1 &&
    Math.abs(result.model.radius - 25) < 1 &&
    result.rmse < 1
  );
}
