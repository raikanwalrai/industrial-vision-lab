import type { GrayImage } from "./imageScenes";
import { derivativeResponses } from "./derivativeMath";
import { gaussianSmooth } from "./scaleSpaceMath";
import { normalizeForDisplay } from "./math";

export type CannyResult = {
  smoothed: GrayImage;
  ix: GrayImage;
  iy: GrayImage;
  magnitude: GrayImage;
  orientation: GrayImage;
  nms: GrayImage;
  strong: GrayImage;
  weak: GrayImage;
  edges: GrayImage;
};

export type HoughLine = {
  rho: number;
  theta: number;
  votes: number;
};

export type HoughResult = {
  accumulator: number[][];
  display: GrayImage;
  rhoMin: number;
  rhoMax: number;
  rhoStep: number;
  thetaStep: number;
  lines: HoughLine[];
};

function emptyImage(width: number, height: number): GrayImage {
  return {
    width,
    height,
    data: new Float32Array(width * height),
  };
}

export function nonMaximumSuppression(
  magnitude: GrayImage,
  orientation: GrayImage
): GrayImage {
  const output = emptyImage(magnitude.width, magnitude.height);
  const { width, height } = magnitude;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      const value = magnitude.data[index];

      let angle = (orientation.data[index] * 180) / Math.PI;

      if (angle < 0) {
        angle += 180;
      }

      let first = 0;
      let second = 0;

      if (angle < 22.5 || angle >= 157.5) {
        first = magnitude.data[y * width + (x + 1)];
        second = magnitude.data[y * width + (x - 1)];
      } else if (angle < 67.5) {
        first = magnitude.data[(y + 1) * width + (x - 1)];
        second = magnitude.data[(y - 1) * width + (x + 1)];
      } else if (angle < 112.5) {
        first = magnitude.data[(y + 1) * width + x];
        second = magnitude.data[(y - 1) * width + x];
      } else {
        first = magnitude.data[(y - 1) * width + (x - 1)];
        second = magnitude.data[(y + 1) * width + (x + 1)];
      }

      if (value >= first && value >= second) {
        output.data[index] = value;
      }
    }
  }

  return output;
}

export function doubleThreshold(
  nms: GrayImage,
  lowThreshold: number,
  highThreshold: number
): {
  strong: GrayImage;
  weak: GrayImage;
} {
  const strong = emptyImage(nms.width, nms.height);
  const weak = emptyImage(nms.width, nms.height);

  const low = Math.min(lowThreshold, highThreshold);
  const high = Math.max(lowThreshold, highThreshold);

  for (let i = 0; i < nms.data.length; i++) {
    const value = nms.data[i];

    if (value >= high) {
      strong.data[i] = 255;
    } else if (value >= low) {
      weak.data[i] = 128;
    }
  }

  return { strong, weak };
}

export function hysteresis(
  strong: GrayImage,
  weak: GrayImage
): GrayImage {
  const output = emptyImage(strong.width, strong.height);
  const { width, height } = strong;

  const queue: number[] = [];

  for (let i = 0; i < strong.data.length; i++) {
    if (strong.data[i] > 0) {
      output.data[i] = 255;
      queue.push(i);
    }
  }

  let head = 0;

  while (head < queue.length) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (
          nx < 0 ||
          nx >= width ||
          ny < 0 ||
          ny >= height
        ) {
          continue;
        }

        const neighbor = ny * width + nx;

        if (
          weak.data[neighbor] > 0 &&
          output.data[neighbor] === 0
        ) {
          output.data[neighbor] = 255;
          queue.push(neighbor);
        }
      }
    }
  }

  return output;
}

export function cannyEdgeDetection(
  image: GrayImage,
  sigma = 1,
  lowThreshold = 30,
  highThreshold = 70
): CannyResult {
  const smoothed = gaussianSmooth(image, sigma);

  const derivatives = derivativeResponses(
    smoothed,
    "sobel"
  );

  const nms = nonMaximumSuppression(
    derivatives.magnitude,
    derivatives.orientation
  );

  const thresholded = doubleThreshold(
    nms,
    lowThreshold,
    highThreshold
  );

  const edges = hysteresis(
    thresholded.strong,
    thresholded.weak
  );

  return {
    smoothed,
    ix: derivatives.ix,
    iy: derivatives.iy,
    magnitude: derivatives.magnitude,
    orientation: derivatives.orientation,
    nms,
    strong: thresholded.strong,
    weak: thresholded.weak,
    edges,
  };
}

export function edgePixelCoordinates(
  edgeMap: GrayImage
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < edgeMap.height; y++) {
    for (let x = 0; x < edgeMap.width; x++) {
      if (edgeMap.data[y * edgeMap.width + x] > 0) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

export function houghTransform(
  edgeMap: GrayImage,
  thetaStep = 2,
  peakThreshold = 40,
  maxLines = 8
): HoughResult {
  const width = edgeMap.width;
  const height = edgeMap.height;

  const diagonal = Math.ceil(
    Math.hypot(width, height)
  );

  const rhoMin = -diagonal;
  const rhoMax = diagonal;
  const rhoStep = 1;

  const thetaBins = Math.ceil(180 / thetaStep);
  const rhoBins =
    Math.floor((rhoMax - rhoMin) / rhoStep) + 1;

  const accumulator: number[][] = Array.from(
    { length: rhoBins },
    () => new Array(thetaBins).fill(0)
  );

  const cosTable = new Float64Array(thetaBins);
  const sinTable = new Float64Array(thetaBins);

  for (let t = 0; t < thetaBins; t++) {
    const theta = (t * thetaStep * Math.PI) / 180;

    cosTable[t] = Math.cos(theta);
    sinTable[t] = Math.sin(theta);
  }

  const points = edgePixelCoordinates(edgeMap);

  for (const point of points) {
    for (let t = 0; t < thetaBins; t++) {
      const rho =
        point.x * cosTable[t] +
        point.y * sinTable[t];

      const rhoIndex =
        Math.round((rho - rhoMin) / rhoStep);

      if (
        rhoIndex >= 0 &&
        rhoIndex < rhoBins
      ) {
        accumulator[rhoIndex][t]++;
      }
    }
  }

  const displayData = new Float32Array(
    rhoBins * thetaBins
  );

  let maximum = 0;

  for (let r = 0; r < rhoBins; r++) {
    for (let t = 0; t < thetaBins; t++) {
      maximum = Math.max(
        maximum,
        accumulator[r][t]
      );
    }
  }

  for (let r = 0; r < rhoBins; r++) {
    for (let t = 0; t < thetaBins; t++) {
      const index = r * thetaBins + t;

      displayData[index] =
        maximum > 0
          ? (accumulator[r][t] / maximum) * 255
          : 0;
    }
  }

  const peaks: HoughLine[] = [];

  for (let r = 1; r < rhoBins - 1; r++) {
    for (let t = 0; t < thetaBins; t++) {
      const value = accumulator[r][t];

      if (value < peakThreshold) {
        continue;
      }

      let isPeak = true;

      for (let dr = -1; dr <= 1 && isPeak; dr++) {
        for (let dt = -1; dt <= 1; dt++) {
          if (dr === 0 && dt === 0) continue;

          const neighborTheta =
            (t + dt + thetaBins) % thetaBins;

          if (
            accumulator[r + dr][neighborTheta] >
            value
          ) {
            isPeak = false;
            break;
          }
        }
      }

      if (isPeak) {
        peaks.push({
          rho: rhoMin + r * rhoStep,
          theta: (t * thetaStep * Math.PI) / 180,
          votes: value,
        });
      }
    }
  }

  peaks.sort((a, b) => b.votes - a.votes);

  const selected: HoughLine[] = [];

  for (const candidate of peaks) {
    const tooClose = selected.some((line) => {
      const rhoDistance = Math.abs(
        line.rho - candidate.rho
      );

      let thetaDistance = Math.abs(
        line.theta - candidate.theta
      );

      thetaDistance = Math.min(
        thetaDistance,
        Math.PI - thetaDistance
      );

      return (
        rhoDistance < 10 &&
        (thetaDistance * 180) / Math.PI < 8
      );
    });

    if (!tooClose) {
      selected.push(candidate);
    }

    if (selected.length >= maxLines) {
      break;
    }
  }

  return {
    accumulator,
    display: {
      width: thetaBins,
      height: rhoBins,
      data: displayData,
    },
    rhoMin,
    rhoMax,
    rhoStep,
    thetaStep,
    lines: selected,
  };
}

export function houghAccumulatorDisplay(
  result: HoughResult
): GrayImage {
  return normalizeForDisplay(result.display);
}

export function lineToEndpoints(
  line: HoughLine,
  width: number,
  height: number
): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} | null {
  const cos = Math.cos(line.theta);
  const sin = Math.sin(line.theta);

  const points: Array<{ x: number; y: number }> = [];

  if (Math.abs(sin) > 1e-8) {
    const yAtLeft = line.rho / sin;
    const yAtRight =
      (line.rho - (width - 1) * cos) / sin;

    if (yAtLeft >= 0 && yAtLeft <= height - 1) {
      points.push({ x: 0, y: yAtLeft });
    }

    if (
      yAtRight >= 0 &&
      yAtRight <= height - 1
    ) {
      points.push({
        x: width - 1,
        y: yAtRight,
      });
    }
  }

  if (Math.abs(cos) > 1e-8) {
    const xAtTop = line.rho / cos;
    const xAtBottom =
      (line.rho - (height - 1) * sin) / cos;

    if (xAtTop >= 0 && xAtTop <= width - 1) {
      points.push({ x: xAtTop, y: 0 });
    }

    if (
      xAtBottom >= 0 &&
      xAtBottom <= width - 1
    ) {
      points.push({
        x: xAtBottom,
        y: height - 1,
      });
    }
  }

  const unique = points.filter(
    (point, index, array) =>
      array.findIndex(
        (other) =>
          Math.abs(other.x - point.x) < 1e-6 &&
          Math.abs(other.y - point.y) < 1e-6
      ) === index
  );

  if (unique.length < 2) {
    return null;
  }

  return {
    x1: unique[0].x,
    y1: unique[0].y,
    x2: unique[1].x,
    y2: unique[1].y,
  };
}

export function verifyNmsStep(): boolean {
  const magnitude: GrayImage = {
    width: 5,
    height: 5,
    data: new Float32Array([
      0, 0, 0, 0, 0,
      0, 10, 20, 10, 0,
      0, 10, 40, 10, 0,
      0, 10, 20, 10, 0,
      0, 0, 0, 0, 0,
    ]),
  };

  const orientation: GrayImage = {
    width: 5,
    height: 5,
    data: new Float32Array(25),
  };

  const result = nonMaximumSuppression(
    magnitude,
    orientation
  );

  return (
    result.data[12] === 40 &&
    result.data[11] === 0 &&
    result.data[13] === 0
  );
}

export function verifyHysteresis(): boolean {
  const strong = emptyImage(5, 5);
  const weak = emptyImage(5, 5);

  strong.data[2 * 5 + 1] = 255;
  weak.data[2 * 5 + 2] = 128;
  weak.data[2 * 5 + 3] = 128;

  const result = hysteresis(strong, weak);

  return (
    result.data[11] === 255 &&
    result.data[12] === 255 &&
    result.data[13] === 255
  );
}

export function verifyCannyStep(): boolean {
  const data = new Float32Array(25);

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      data[y * 5 + x] = x < 2 ? 0 : 255;
    }
  }

  const image: GrayImage = {
    width: 5,
    height: 5,
    data,
  };

  const result = cannyEdgeDetection(
    image,
    0.5,
    5,
    10
  );

  return result.edges.data.some(
    (value) => value > 0
  );
}

export function verifyHoughVerticalLine(): boolean {
  const edgeMap: GrayImage = {
    width: 32,
    height: 32,
    data: new Float32Array(32 * 32),
  };

  for (let y = 0; y < 32; y++) {
    edgeMap.data[y * 32 + 10] = 255;
  }

  const result = houghTransform(
    edgeMap,
    2,
    20,
    5
  );

  return (
    result.lines.length > 0 &&
    result.lines.some(
      (line) =>
        Math.abs(line.rho - 10) <= 2 &&
        Math.abs(line.theta) < 0.1
    )
  );
}

export function verifyHoughAccumulator(): boolean {
  const edgeMap: GrayImage = {
    width: 32,
    height: 32,
    data: new Float32Array(32 * 32),
  };

  for (let x = 0; x < 32; x++) {
    edgeMap.data[16 * 32 + x] = 255;
  }

  const result = houghTransform(
    edgeMap,
    2,
    20,
    5
  );

  return result.lines.length > 0;
}
