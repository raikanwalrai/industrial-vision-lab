import type { GrayImage } from "./imageScenes";
import {
  structureTensorAt,
} from "./cornerMath";

export type BlobScene =
  | "blobs"
  | "industrial"
  | "single"
  | "flat";

export type ScaleLevel = {
  sigma: number;
  image: GrayImage;
  log: GrayImage;
  normalizedLog: GrayImage;
};

export type BlobPoint = {
  x: number;
  y: number;
  sigma: number;
  response: number;
};

export type ShiTomasiResponse = {
  image: GrayImage;
  points: Array<{
    x: number;
    y: number;
    response: number;
  }>;
  maxResponse: number;
};

export type ScaleSpaceResult = {
  levels: ScaleLevel[];
  dog: GrayImage[];
};

export type BlobDetectionResult = {
  points: BlobPoint[];
  maxResponse: number;
};

function clamp(
  value: number,
  lo: number,
  hi: number,
) {
  return Math.max(lo, Math.min(hi, value));
}

function pixel(
  image: GrayImage,
  x: number,
  y: number,
): number {
  const xx = clamp(
    Math.round(x),
    0,
    image.width - 1,
  );

  const yy = clamp(
    Math.round(y),
    0,
    image.height - 1,
  );

  return image.data[
    yy * image.width + xx
  ];
}

function setPixel(
  data: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  value: number,
) {
  if (
    x < 0 ||
    y < 0 ||
    x >= width ||
    y >= height
  ) {
    return;
  }

  data[y * width + x] = value;
}

function fillRect(
  data: Float32Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  value: number,
) {
  for (
    let y = Math.max(0, y0);
    y <= Math.min(height - 1, y1);
    y++
  ) {
    for (
      let x = Math.max(0, x0);
      x <= Math.min(width - 1, x1);
      x++
    ) {
      setPixel(
        data,
        width,
        height,
        x,
        y,
        value,
      );
    }
  }
}

function fillCircle(
  data: Float32Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  value: number,
) {
  const r2 = radius * radius;

  for (
    let y = Math.max(
      0,
      Math.floor(cy - radius),
    );
    y <= Math.min(
      height - 1,
      Math.ceil(cy + radius),
    );
    y++
  ) {
    for (
      let x = Math.max(
        0,
        Math.floor(cx - radius),
      );
      x <= Math.min(
        width - 1,
        Math.ceil(cx + radius),
      );
      x++
    ) {
      const dx = x - cx;
      const dy = y - cy;

      if (dx * dx + dy * dy <= r2) {
        setPixel(
          data,
          width,
          height,
          x,
          y,
          value,
        );
      }
    }
  }
}

function makeCircleScene(
  circles: Array<{
    x: number;
    y: number;
    radius: number;
    value: number;
  }>,
): GrayImage {
  const width = 96;
  const height = 96;
  const data = new Float32Array(
    width * height,
  );

  data.fill(128);

  for (const circle of circles) {
    fillCircle(
      data,
      width,
      height,
      circle.x,
      circle.y,
      circle.radius,
      circle.value,
    );
  }

  return {
    width,
    height,
    data,
  };
}

export function makeBlobScene(
  scene: BlobScene,
): GrayImage {
  if (scene === "flat") {
    const width = 96;
    const height = 96;
    const data = new Float32Array(
      width * height,
    );

    data.fill(128);

    return {
      width,
      height,
      data,
    };
  }

  if (scene === "single") {
    return makeCircleScene([
      {
        x: 48,
        y: 48,
        radius: 10,
        value: 230,
      },
    ]);
  }

  if (scene === "blobs") {
    return makeCircleScene([
      {
        x: 24,
        y: 26,
        radius: 5,
        value: 235,
      },
      {
        x: 70,
        y: 25,
        radius: 9,
        value: 225,
      },
      {
        x: 30,
        y: 68,
        radius: 13,
        value: 220,
      },
      {
        x: 72,
        y: 70,
        radius: 18,
        value: 215,
      },
    ]);
  }

  const width = 96;
  const height = 96;
  const data = new Float32Array(
    width * height,
  );

  data.fill(170);

  // Machine body.
  fillRect(
    data,
    width,
    height,
    10,
    48,
    62,
    84,
    55,
  );

  // Inspection opening.
  fillCircle(
    data,
    width,
    height,
    32,
    65,
    8,
    235,
  );

  // Bolt / component.
  fillCircle(
    data,
    width,
    height,
    74,
    30,
    5,
    35,
  );

  // Large circular component.
  fillCircle(
    data,
    width,
    height,
    74,
    65,
    13,
    50,
  );

  // Inspection hole.
  fillCircle(
    data,
    width,
    height,
    74,
    65,
    4,
    235,
  );

  // Small defect-like feature.
  fillCircle(
    data,
    width,
    height,
    52,
    30,
    3,
    235,
  );

  // Conveyor.
  fillRect(
    data,
    width,
    height,
    5,
    87,
    91,
    91,
    35,
  );

  return {
    width,
    height,
    data,
  };
}

export function gaussianKernel1D(
  sigma: number,
): Float32Array {
  const safeSigma = Math.max(
    sigma,
    0.01,
  );

  const radius = Math.max(
    1,
    Math.ceil(3 * safeSigma),
  );

  const size = radius * 2 + 1;
  const kernel = new Float32Array(size);

  let sum = 0;

  for (
    let i = -radius;
    i <= radius;
    i++
  ) {
    const value =
      Math.exp(
        -(i * i) /
          (2 * safeSigma * safeSigma),
      );

    kernel[i + radius] = value;
    sum += value;
  }

  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

function convolveHorizontal(
  image: GrayImage,
  kernel: Float32Array,
): GrayImage {
  const radius =
    Math.floor(kernel.length / 2);

  const data = new Float32Array(
    image.width * image.height,
  );

  for (
    let y = 0;
    y < image.height;
    y++
  ) {
    for (
      let x = 0;
      x < image.width;
      x++
    ) {
      let sum = 0;

      for (
        let k = -radius;
        k <= radius;
        k++
      ) {
        sum +=
          pixel(
            image,
            x + k,
            y,
          ) *
          kernel[k + radius];
      }

      data[y * image.width + x] = sum;
    }
  }

  return {
    width: image.width,
    height: image.height,
    data,
  };
}

function convolveVertical(
  image: GrayImage,
  kernel: Float32Array,
): GrayImage {
  const radius =
    Math.floor(kernel.length / 2);

  const data = new Float32Array(
    image.width * image.height,
  );

  for (
    let y = 0;
    y < image.height;
    y++
  ) {
    for (
      let x = 0;
      x < image.width;
      x++
    ) {
      let sum = 0;

      for (
        let k = -radius;
        k <= radius;
        k++
      ) {
        sum +=
          pixel(
            image,
            x,
            y + k,
          ) *
          kernel[k + radius];
      }

      data[y * image.width + x] = sum;
    }
  }

  return {
    width: image.width,
    height: image.height,
    data,
  };
}

export function gaussianBlur(
  image: GrayImage,
  sigma: number,
): GrayImage {
  const kernel =
    gaussianKernel1D(sigma);

  const horizontal =
    convolveHorizontal(
      image,
      kernel,
    );

  return convolveVertical(
    horizontal,
    kernel,
  );
}

function subtractImages(
  a: GrayImage,
  b: GrayImage,
): GrayImage {
  const data = new Float32Array(
    a.width * a.height,
  );

  for (
    let i = 0;
    i < data.length;
    i++
  ) {
    data[i] =
      a.data[i] -
      b.data[i];
  }

  return {
    width: a.width,
    height: a.height,
    data,
  };
}

export function laplacian(
  image: GrayImage,
): GrayImage {
  const data = new Float32Array(
    image.width * image.height,
  );

  for (
    let y = 0;
    y < image.height;
    y++
  ) {
    for (
      let x = 0;
      x < image.width;
      x++
    ) {
      const center =
        pixel(image, x, y);

      const value =
        pixel(image, x - 1, y) +
        pixel(image, x + 1, y) +
        pixel(image, x, y - 1) +
        pixel(image, x, y + 1) -
        4 * center;

      data[
        y * image.width + x
      ] = value;
    }
  }

  return {
    width: image.width,
    height: image.height,
    data,
  };
}

export function laplacianOfGaussian(
  image: GrayImage,
  sigma: number,
): GrayImage {
  const blurred =
    gaussianBlur(
      image,
      sigma,
    );

  return laplacian(blurred);
}

export function scaleNormalizedLoG(
  image: GrayImage,
  sigma: number,
): GrayImage {
  const log =
    laplacianOfGaussian(
      image,
      sigma,
    );

  const data = new Float32Array(
    log.width * log.height,
  );

  const factor =
    sigma * sigma;

  for (
    let i = 0;
    i < data.length;
    i++
  ) {
    data[i] =
      factor * log.data[i];
  }

  return {
    width: log.width,
    height: log.height,
    data,
  };
}

export function gaussianScaleSpace(
  image: GrayImage,
  sigmas: number[],
): ScaleLevel[] {
  return sigmas.map(
    (sigma) => {
      const blurred =
        gaussianBlur(
          image,
          sigma,
        );

      const log =
        laplacian(blurred);

      const normalizedLog =
        new Float32Array(
          log.width *
            log.height,
        );

      const factor =
        sigma * sigma;

      for (
        let i = 0;
        i < normalizedLog.length;
        i++
      ) {
        normalizedLog[i] =
          factor *
          log.data[i];
      }

      return {
        sigma,
        image: blurred,
        log,
        normalizedLog: {
          width: log.width,
          height: log.height,
          data: normalizedLog,
        },
      };
    },
  );
}

export function differenceOfGaussians(
  image: GrayImage,
  sigma: number,
  k = Math.SQRT2,
): GrayImage {
  const a =
    gaussianBlur(
      image,
      sigma,
    );

  const b =
    gaussianBlur(
      image,
      sigma * k,
    );

  return subtractImages(
    b,
    a,
  );
}

export function shiTomasiResponseAt(
  image: GrayImage,
  x: number,
  y: number,
  radius = 1,
): number {
  return structureTensorAt(
    image,
    x,
    y,
    radius,
  ).shiTomasi;
}

export function shiTomasiResponseMap(
  image: GrayImage,
  radius = 1,
): GrayImage {
  const data = new Float32Array(
    image.width *
      image.height,
  );

  for (
    let y = 0;
    y < image.height;
    y++
  ) {
    for (
      let x = 0;
      x < image.width;
      x++
    ) {
      data[
        y * image.width + x
      ] =
        shiTomasiResponseAt(
          image,
          x,
          y,
          radius,
        );
    }
  }

  return {
    width: image.width,
    height: image.height,
    data,
  };
}

export function detectShiTomasiCorners(
  image: GrayImage,
  threshold = 0.15,
  radius = 1,
): ShiTomasiResponse {
  const response =
    shiTomasiResponseMap(
      image,
      radius,
    );

  let maxResponse = 0;

  for (
    const value of response.data
  ) {
    maxResponse =
      Math.max(
        maxResponse,
        value,
      );
  }

  const points: Array<{
    x: number;
    y: number;
    response: number;
  }> = [];

  if (maxResponse <= 0) {
    return {
      image: response,
      points,
      maxResponse,
    };
  }

  const absoluteThreshold =
    maxResponse * threshold;

  for (
    let y = 1;
    y < image.height - 1;
    y++
  ) {
    for (
      let x = 1;
      x < image.width - 1;
      x++
    ) {
      const value =
        response.data[
          y * image.width + x
        ];

      if (
        value <
        absoluteThreshold
      ) {
        continue;
      }

      let isMaximum = true;

      for (
        let dy = -1;
        dy <= 1;
        dy++
      ) {
        for (
          let dx = -1;
          dx <= 1;
          dx++
        ) {
          if (
            dx === 0 &&
            dy === 0
          ) {
            continue;
          }

          const neighbour =
            response.data[
              (y + dy) *
                image.width +
                (x + dx)
            ];

          if (
            neighbour > value
          ) {
            isMaximum = false;
          }
        }
      }

      if (isMaximum) {
        points.push({
          x,
          y,
          response: value,
        });
      }
    }
  }

  return {
    image: response,
    points,
    maxResponse,
  };
}

export function detectBlobExtrema(
  levels: ScaleLevel[],
  threshold = 0.25,
): BlobDetectionResult {
  const points: BlobPoint[] = [];

  let maxResponse = 0;

  for (
    const level of levels
  ) {
    for (
      const value of level.normalizedLog.data
    ) {
      maxResponse =
        Math.max(
          maxResponse,
          Math.abs(value),
        );
    }
  }

  if (maxResponse <= 0) {
    return {
      points,
      maxResponse,
    };
  }

  const absoluteThreshold =
    maxResponse * threshold;

  for (
    let s = 1;
    s < levels.length - 1;
    s++
  ) {
    const current =
      levels[s].normalizedLog;

    for (
      let y = 1;
      y < current.height - 1;
      y++
    ) {
      for (
        let x = 1;
        x < current.width - 1;
        x++
      ) {
        const index =
          y * current.width + x;

        const value =
          current.data[index];

        if (
          Math.abs(value) <
          absoluteThreshold
        ) {
          continue;
        }

        let isMaximum =
          true;

        for (
          let ds = -1;
          ds <= 1 && isMaximum;
          ds++
        ) {
          const neighbourLevel =
            levels[s + ds]
              .normalizedLog;

          for (
            let dy = -1;
            dy <= 1 && isMaximum;
            dy++
          ) {
            for (
              let dx = -1;
              dx <= 1;
              dx++
            ) {
              if (
                ds === 0 &&
                dx === 0 &&
                dy === 0
              ) {
                continue;
              }

              const neighbour =
                neighbourLevel.data[
                  (y + dy) *
                    current.width +
                    (x + dx)
                ];

              if (
                Math.abs(neighbour) >
                Math.abs(value)
              ) {
                isMaximum = false;
                break;
              }
            }
          }
        }

        if (isMaximum) {
          points.push({
            x,
            y,
            sigma:
              current.width > 0
                ? levels[s].sigma
                : 0,
            response: value,
          });
        }
      }
    }
  }

  return {
    points,
    maxResponse,
  };
}

export function compareLoGDoG(
  image: GrayImage,
  sigma: number,
  k = Math.SQRT2,
) {
  const log =
    laplacianOfGaussian(
      image,
      sigma,
    );

  const normalizedLog =
    scaleNormalizedLoG(
      image,
      sigma,
    );

  const dog =
    differenceOfGaussians(
      image,
      sigma,
      k,
    );

  let sumAbsLog = 0;
  let sumAbsDiff = 0;
  let maxAbsLog = 0;
  let maxAbsDiff = 0;

  for (
    let i = 0;
    i < log.data.length;
    i++
  ) {
    const a =
      Math.abs(log.data[i]);

    const b =
      Math.abs(dog.data[i]);

    sumAbsLog += a;
    sumAbsDiff += b;
    maxAbsLog =
      Math.max(
        maxAbsLog,
        a,
      );
    maxAbsDiff =
      Math.max(
        maxAbsDiff,
        b,
      );
  }

  const meanAbsLog =
    sumAbsLog /
    log.data.length;

  const meanAbsDiff =
    sumAbsDiff /
    dog.data.length;

  const scaleFactor =
    maxAbsLog > 1e-9
      ? maxAbsDiff / maxAbsLog
      : 0;

  return {
    sigma,
    k,
    meanAbsLog,
    meanAbsDiff,
    maxAbsLog,
    maxAbsDiff,
    scaleFactor,
  };
}

export function inspectBlobPixel(
  image: GrayImage,
  x: number,
  y: number,
  sigma: number,
) {
  const tensor =
    structureTensorAt(
      image,
      x,
      y,
      1,
    );

  const rawLog =
    laplacianOfGaussian(
      image,
      sigma,
    );

  const normalizedLog =
    scaleNormalizedLoG(
      image,
      sigma,
    );

  const index =
    clamp(
      Math.round(y),
      0,
      image.height - 1,
    ) *
      image.width +
    clamp(
      Math.round(x),
      0,
      image.width - 1,
    );

  return {
    x,
    y,
    sigma,
    intensity:
      image.data[index],
    lambda1:
      tensor.lambda1,
    lambda2:
      tensor.lambda2,
    shiTomasi:
      tensor.shiTomasi,
    log:
      rawLog.data[index],
    normalizedLog:
      normalizedLog.data[index],
  };
}

export function verifyShiTomasi(): boolean {
  const image = makeCircleScene([
    {
      x: 48,
      y: 48,
      radius: 8,
      value: 230,
    },
  ]);

  const tensor =
    structureTensorAt(
      image,
      48,
      48,
      1,
    );

  return (
    Math.abs(
      tensor.shiTomasi -
        Math.min(
          tensor.lambda1,
          tensor.lambda2,
        ),
    ) < 1e-10
  );
}

export function verifyGaussianKernel(
  sigma = 1.5,
): boolean {
  const kernel =
    gaussianKernel1D(sigma);

  let sum = 0;

  for (
    const value of kernel
  ) {
    sum += value;
  }

  return (
    Math.abs(sum - 1) <
    1e-6
  );
}

export function verifyGaussianSymmetry(
  sigma = 1.5,
): boolean {
  const kernel =
    gaussianKernel1D(sigma);

  for (
    let i = 0;
    i < Math.floor(
      kernel.length / 2,
    );
    i++
  ) {
    const j =
      kernel.length - 1 - i;

    if (
      Math.abs(
        kernel[i] -
          kernel[j],
      ) > 1e-6
    ) {
      return false;
    }
  }

  return true;
}

export function verifyDoG(
  image = makeCircleScene([
    {
      x: 48,
      y: 48,
      radius: 10,
      value: 230,
    },
  ]),
): boolean {
  const dog =
    differenceOfGaussians(
      image,
      1.4,
    );

  return dog.data.some(
    (value) =>
      Math.abs(value) >
      1e-6,
  );
}

export function verifyScaleNormalization(
  image = makeCircleScene([
    {
      x: 48,
      y: 48,
      radius: 10,
      value: 230,
    },
  ]),
): boolean {
  const sigma = 2;

  const log =
    laplacianOfGaussian(
      image,
      sigma,
    );

  const normalized =
    scaleNormalizedLoG(
      image,
      sigma,
    );

  const index =
    48 * image.width + 48;

  return (
    Math.abs(
      normalized.data[index] -
        sigma *
          sigma *
          log.data[index],
    ) < 1e-6
  );
}

export function verifyScaleOrdering(): boolean {
  const sigmas = [
    0.8,
    1.2,
    1.8,
    2.7,
    4.0,
  ];

  for (
    let i = 1;
    i < sigmas.length;
    i++
  ) {
    if (
      sigmas[i] <= sigmas[i - 1]
    ) {
      return false;
    }
  }

  return true;
}
