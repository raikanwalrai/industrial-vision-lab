export type Point2D = {
  x: number;
  y: number;
};

export type LineModel = {
  slope: number;
  intercept: number;
};

export type ClassifiedPoint = Point2D & {
  predictedY: number;
  distance: number;
  isInlier: boolean;
};

export type RansacIteration = {
  iteration: number;
  sampleIndices: [number, number];
  model: LineModel;
  inlierIndices: number[];
  outlierIndices: number[];
  inlierCount: number;
};

export type RansacResult = {
  model: LineModel;
  threshold: number;
  iterations: number;
  inlierIndices: number[];
  outlierIndices: number[];
  classifiedPoints: ClassifiedPoint[];
  history: RansacIteration[];
};


/* ============================================================
   D1 · CONTAMINATED MEASUREMENTS
   ============================================================ */

/*
 * The majority of points follow approximately:
 *
 *     y = 0.75x + 8
 *
 * Three measurements are deliberately contaminated.
 */
export function makeContaminatedLineDataset(): Point2D[] {
  return [
    { x: 2, y: 9.2 },
    { x: 6, y: 11.2 },
    { x: 10, y: 15.6 },
    { x: 14, y: 17.1 },
    { x: 18, y: 21.4 },
    { x: 22, y: 24.2 },

    // Deliberate outliers.
    { x: 26, y: 39.0 },
    { x: 30, y: 1.0 },
    { x: 34, y: 55.0 },
  ];
}


/* ============================================================
   BASIC LINE MODEL
   ============================================================ */

export function predictLine(
  model: LineModel,
  x: number,
): number {
  return model.slope * x + model.intercept;
}

export function fitLineThroughTwoPoints(
  first: Point2D,
  second: Point2D,
): LineModel {
  const dx = second.x - first.x;

  if (dx === 0) {
    throw new Error(
      "Cannot represent a vertical line using y = mx + b.",
    );
  }

  const slope =
    (second.y - first.y) / dx;

  const intercept =
    first.y - slope * first.x;

  return {
    slope,
    intercept,
  };
}


/* ============================================================
   LEAST-SQUARES LINE
   ============================================================ */

export function fitLineLeastSquares(
  points: Point2D[],
): LineModel {
  if (points.length < 2) {
    throw new Error(
      "At least two points are required.",
    );
  }

  const n = points.length;

  const meanX =
    points.reduce(
      (sum, point) => sum + point.x,
      0,
    ) / n;

  const meanY =
    points.reduce(
      (sum, point) => sum + point.y,
      0,
    ) / n;

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
      "Cannot fit a line when all x values are identical.",
    );
  }

  const slope =
    numerator / denominator;

  const intercept =
    meanY - slope * meanX;

  return {
    slope,
    intercept,
  };
}


/* ============================================================
   D2 · GEOMETRIC DISTANCE
   ============================================================ */

/*
 * For:
 *
 *     y = mx + b
 *
 * standard form is:
 *
 *     mx - y + b = 0
 *
 * therefore:
 *
 *     distance =
 *       |mx - y + b|
 *       ----------------
 *       sqrt(m² + 1)
 */
export function pointToLineDistance(
  point: Point2D,
  model: LineModel,
): number {
  const numerator = Math.abs(
    model.slope * point.x -
      point.y +
      model.intercept,
  );

  const denominator = Math.sqrt(
    model.slope ** 2 + 1,
  );

  return numerator / denominator;
}


/* ============================================================
   D2 · INLIER / OUTLIER CLASSIFICATION
   ============================================================ */

export function classifyPoints(
  points: Point2D[],
  model: LineModel,
  threshold: number,
): ClassifiedPoint[] {
  return points.map((point) => {
    const predictedY =
      predictLine(model, point.x);

    const distance =
      pointToLineDistance(
        point,
        model,
      );

    return {
      ...point,
      predictedY,
      distance,
      isInlier:
        distance <= threshold,
    };
  });
}


/* ============================================================
   D3 · DETERMINISTIC RANDOM GENERATOR
   ============================================================ */

/*
 * A small seeded pseudo-random generator.
 *
 * We deliberately avoid Math.random() so that the learner
 * can reproduce exactly the same RANSAC experiment.
 */
export function createSeededRandom(
  seed: number,
): () => number {
  let state = seed >>> 0;

  return () => {
    state =
      (1664525 * state + 1013904223) >>> 0;

    return state / 4294967296;
  };
}


/* ============================================================
   D3 · RANSAC
   ============================================================ */

export function runRansac(
  points: Point2D[],
  threshold: number,
  iterations: number,
  seed = 42,
): RansacResult {
  if (points.length < 2) {
    throw new Error(
      "RANSAC requires at least two points.",
    );
  }

  if (threshold <= 0) {
    throw new Error(
      "RANSAC threshold must be positive.",
    );
  }

  if (iterations <= 0) {
    throw new Error(
      "RANSAC requires at least one iteration.",
    );
  }

  const random =
    createSeededRandom(seed);

  const history: RansacIteration[] = [];

  let bestModel: LineModel | null =
    null;

  let bestInlierIndices: number[] = [];

  for (
    let iteration = 1;
    iteration <= iterations;
    iteration += 1
  ) {
    /*
     * Pick two distinct points.
     */
    const firstIndex =
      Math.floor(
        random() * points.length,
      );

    let secondIndex =
      Math.floor(
        random() * points.length,
      );

    while (
      secondIndex === firstIndex
    ) {
      secondIndex =
        Math.floor(
          random() * points.length,
        );
    }

    const model =
      fitLineThroughTwoPoints(
        points[firstIndex],
        points[secondIndex],
      );

    const classified =
      classifyPoints(
        points,
        model,
        threshold,
      );

    const inlierIndices =
      classified
        .map((point, index) =>
          point.isInlier
            ? index
            : -1,
        )
        .filter(
          (index) => index >= 0,
        );

    const outlierIndices =
      classified
        .map((point, index) =>
          point.isInlier
            ? -1
            : index,
        )
        .filter(
          (index) => index >= 0,
        );

    const current: RansacIteration = {
      iteration,
      sampleIndices: [
        firstIndex,
        secondIndex,
      ],
      model,
      inlierIndices,
      outlierIndices,
      inlierCount:
        inlierIndices.length,
    };

    history.push(current);

    if (
      inlierIndices.length >
      bestInlierIndices.length
    ) {
      bestInlierIndices =
        inlierIndices;

      bestModel = model;
    }
  }

  if (!bestModel) {
    throw new Error(
      "RANSAC did not produce a model.",
    );
  }

  /*
   * Once RANSAC has identified the consensus set,
   * refit the final model using ALL inliers.
   *
   * This is an important educational distinction:
   *
   * RANSAC discovers the trustworthy measurements.
   * Least squares then estimates the final model
   * from those trustworthy measurements.
   */
  const inlierPoints =
    bestInlierIndices.map(
      (index) => points[index],
    );

  const refinedModel =
    fitLineLeastSquares(
      inlierPoints,
    );

  const finalClassification =
    classifyPoints(
      points,
      refinedModel,
      threshold,
    );

  const finalInlierIndices =
    finalClassification
      .map((point, index) =>
        point.isInlier
          ? index
          : -1,
      )
      .filter(
        (index) => index >= 0,
      );

  const finalOutlierIndices =
    finalClassification
      .map((point, index) =>
        point.isInlier
          ? -1
          : index,
      )
      .filter(
        (index) => index >= 0,
      );

  return {
    model: refinedModel,
    threshold,
    iterations,
    inlierIndices:
      finalInlierIndices,
    outlierIndices:
      finalOutlierIndices,
    classifiedPoints:
      finalClassification,
    history,
  };
}


/* ============================================================
   ERROR METRICS
   ============================================================ */

export function calculateRmse(
  points: Point2D[],
  model: LineModel,
): number {
  if (points.length === 0) {
    return 0;
  }

  const squaredErrors =
    points.map((point) => {
      const error =
        point.y -
        predictLine(
          model,
          point.x,
        );

      return error * error;
    });

  const mse =
    squaredErrors.reduce(
      (sum, value) =>
        sum + value,
      0,
    ) / points.length;

  return Math.sqrt(mse);
}


/* ============================================================
   VERIFICATION
   ============================================================ */

export function verifyRobustFitting(): {
  leastSquaresModel: LineModel;
  ransacModel: LineModel;
  leastSquaresRmse: number;
  ransacRmseAllPoints: number;
  ransacRmseInliers: number;
  inlierIndices: number[];
  outlierIndices: number[];
  passed: boolean;
} {
  const points =
    makeContaminatedLineDataset();

  const leastSquaresModel =
    fitLineLeastSquares(points);

  const leastSquaresRmse =
    calculateRmse(
      points,
      leastSquaresModel,
    );

  const result =
    runRansac(
      points,
      2.5,
      40,
      42,
    );

  const inlierPoints =
    result.inlierIndices.map(
      (index) => points[index],
    );

  const ransacRmseAllPoints =
    calculateRmse(
      points,
      result.model,
    );

  const ransacRmseInliers =
    calculateRmse(
      inlierPoints,
      result.model,
    );

  /*
   * The exact numerical values are intentionally not
   * hard-coded into the algorithm. Verification checks
   * the expected mathematical behaviour:
   *
   * 1. RANSAC finds a majority consensus set.
   * 2. The three deliberate outliers are excluded.
   * 3. The refined line remains close to the intended
   *    underlying relationship y = 0.75x + 8.
   * 4. Inlier error is small.
   */
  const expectedOutliers =
    [6, 7, 8];

  const foundExpectedOutliers =
    expectedOutliers.every(
      (index) =>
        result.outlierIndices.includes(
          index,
        ),
    );

  const closeToGroundTruth =
    Math.abs(
      result.model.slope - 0.75,
    ) < 0.08 &&
    Math.abs(
      result.model.intercept - 8,
    ) < 1.0;

  const passed =
    result.inlierIndices.length >= 6 &&
    foundExpectedOutliers &&
    closeToGroundTruth &&
    ransacRmseInliers < 1.5;

  return {
    leastSquaresModel,
    ransacModel:
      result.model,
    leastSquaresRmse,
    ransacRmseAllPoints,
    ransacRmseInliers,
    inlierIndices:
      result.inlierIndices,
    outlierIndices:
      result.outlierIndices,
    passed,
  };
}
