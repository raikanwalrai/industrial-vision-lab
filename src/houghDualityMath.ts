export type DualityPoint = {
  x: number;
  y: number;
};

export type DualityLine = {
  rho: number;
  theta: number;
  votes: number;
};

export type DualityCurve = {
  point: DualityPoint;
  values: Array<{
    theta: number;
    rho: number;
  }>;
};

export type DualityDataset = {
  name: string;
  points: DualityPoint[];
  expectedLines: number;
};

export type DualityPeak = {
  rho: number;
  theta: number;
  votes: number;
};

export const HOUGH_THETA_MIN = 0;
export const HOUGH_THETA_MAX = Math.PI;

export function pointToRho(
  point: DualityPoint,
  theta: number
): number {
  return (
    point.x * Math.cos(theta) +
    point.y * Math.sin(theta)
  );
}

export function pointToSinusoid(
  point: DualityPoint,
  thetaSamples = 180
): DualityCurve {
  const values: Array<{
    theta: number;
    rho: number;
  }> = [];

  for (let i = 0; i <= thetaSamples; i++) {
    const theta =
      HOUGH_THETA_MIN +
      ((HOUGH_THETA_MAX - HOUGH_THETA_MIN) * i) /
        thetaSamples;

    values.push({
      theta,
      rho: pointToRho(point, theta),
    });
  }

  return {
    point,
    values,
  };
}

export function pointsOnLine(
  count: number,
  start: DualityPoint,
  end: DualityPoint
): DualityPoint[] {
  if (count <= 1) {
    return [start];
  }

  return Array.from(
    { length: count },
    (_, index) => {
      const t = index / (count - 1);

      return {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y),
      };
    }
  );
}

export function addDeterministicNoise(
  points: DualityPoint[],
  count: number,
  range = 80
): DualityPoint[] {
  const output = [...points];

  let state = 123456789;

  function random(): number {
    state =
      (1664525 * state + 1013904223) >>> 0;

    return state / 4294967296;
  }

  for (let i = 0; i < count; i++) {
    output.push({
      x: -range + random() * 2 * range,
      y: -range + random() * 2 * range,
    });
  }

  return output;
}

export function createDualityDataset(
  type:
    | "one"
    | "two"
    | "collinear"
    | "twoLines"
    | "noisy"
): DualityDataset {
  switch (type) {
    case "one":
      return {
        name: "1 point",
        points: [{ x: 55, y: 55 }],
        expectedLines: 0,
      };

    case "two":
      return {
        name: "2 points",
        points: [
          { x: -60, y: 55 },
          { x: 60, y: -55 },
        ],
        expectedLines: 1,
      };

    case "collinear":
      return {
        name: "5 collinear points",
        points: pointsOnLine(
          5,
          { x: -70, y: 55 },
          { x: 70, y: -55 }
        ),
        expectedLines: 1,
      };

    case "twoLines":
      return {
        name: "2 lines",
        points: [
          ...pointsOnLine(
            5,
            { x: -75, y: 55 },
            { x: 75, y: -55 }
          ),
          ...pointsOnLine(
            5,
            { x: -65, y: -55 },
            { x: 65, y: 55 }
          ),
        ],
        expectedLines: 2,
      };

    case "noisy": {
      const line1 = pointsOnLine(
        5,
        { x: -75, y: 55 },
        { x: 75, y: -55 }
      );

      const line2 = pointsOnLine(
        5,
        { x: -65, y: -55 },
        { x: 65, y: 55 }
      );

      return {
        name: "3 noisy lines + clutter",
        points: addDeterministicNoise(
          [
            ...line1,
            ...line2,
            { x: -55, y: -20 },
            { x: 40, y: 25 },
            { x: 5, y: 70 },
          ],
          35
        ),
        expectedLines: 2,
      };
    }
  }
}

export function accumulateDualityVotes(
  points: DualityPoint[],
  thetaBins = 180,
  rhoBins = 160,
  rhoMin = -160,
  rhoMax = 160
): {
  accumulator: number[][];
  thetaValues: number[];
  rhoValues: number[];
  maxVotes: number;
} {
  const accumulator = Array.from(
    { length: rhoBins },
    () => new Array(thetaBins).fill(0)
  );

  const thetaValues = Array.from(
    { length: thetaBins },
    (_, index) =>
      HOUGH_THETA_MIN +
      ((HOUGH_THETA_MAX - HOUGH_THETA_MIN) *
        index) /
        (thetaBins - 1)
  );

  const rhoValues = Array.from(
    { length: rhoBins },
    (_, index) =>
      rhoMin +
      ((rhoMax - rhoMin) * index) /
        (rhoBins - 1)
  );

  const rhoStep =
    (rhoMax - rhoMin) /
    Math.max(1, rhoBins - 1);

  for (const point of points) {
    for (let t = 0; t < thetaBins; t++) {
      const theta = thetaValues[t];
      const rho = pointToRho(point, theta);

      const rhoIndex = Math.round(
        (rho - rhoMin) / rhoStep
      );

      if (
        rhoIndex >= 0 &&
        rhoIndex < rhoBins
      ) {
        accumulator[rhoIndex][t]++;
      }
    }
  }

  let maxVotes = 0;

  for (const row of accumulator) {
    for (const value of row) {
      maxVotes = Math.max(maxVotes, value);
    }
  }

  return {
    accumulator,
    thetaValues,
    rhoValues,
    maxVotes,
  };
}

export function findDualityPeaks(
  points: DualityPoint[],
  minVotes = 3,
  thetaBins = 180,
  rhoBins = 160
): DualityPeak[] {
  const result = accumulateDualityVotes(
    points,
    thetaBins,
    rhoBins
  );

  const peaks: DualityPeak[] = [];

  for (let r = 1; r < rhoBins - 1; r++) {
    for (let t = 0; t < thetaBins; t++) {
      const value = result.accumulator[r][t];

      if (value < minVotes) {
        continue;
      }

      let isPeak = true;

      for (let dr = -1; dr <= 1 && isPeak; dr++) {
        for (let dt = -1; dt <= 1; dt++) {
          if (dr === 0 && dt === 0) {
            continue;
          }

          const neighborTheta =
            (t + dt + thetaBins) %
            thetaBins;

          if (
            result.accumulator[r + dr][
              neighborTheta
            ] > value
          ) {
            isPeak = false;
            break;
          }
        }
      }

      if (isPeak) {
        peaks.push({
          rho: result.rhoValues[r],
          theta: result.thetaValues[t],
          votes: value,
        });
      }
    }
  }

  return peaks.sort(
    (a, b) => b.votes - a.votes
  );
}

export function lineFromRhoTheta(
  rho: number,
  theta: number,
  extent = 100
): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  const directionX = -sin;
  const directionY = cos;

  const baseX = rho * cos;
  const baseY = rho * sin;

  return {
    x1: baseX - extent * directionX,
    y1: baseY - extent * directionY,
    x2: baseX + extent * directionX,
    y2: baseY + extent * directionY,
  };
}

export function verifyPointProducesSinusoid(): boolean {
  const point = { x: 50, y: 25 };

  const curve = pointToSinusoid(
    point,
    180
  );

  return (
    curve.values.length === 181 &&
    Math.abs(
      curve.values[0].rho - 50
    ) < 1e-6 &&
    Math.abs(
      curve.values[90].rho - 25
    ) < 1e-6
  );
}

export function verifyCollinearPeak(): boolean {
  const dataset =
    createDualityDataset("collinear");

  const peaks = findDualityPeaks(
    dataset.points,
    3
  );

  return peaks.length > 0;
}

export function verifyTwoLinePeaks(): boolean {
  const dataset =
    createDualityDataset("twoLines");

  const peaks = findDualityPeaks(
    dataset.points,
    3
  );

  return peaks.length >= 2;
}
