import type { GrayImage } from "./imageScenes";
import {
  differenceOfGaussians,
  gaussianBlur,
  gaussianKernel1D,
} from "./blobMath";

export type SiftScale = {
  sigma: number;
  image: GrayImage;
};

export type SiftOctave = {
  octave: number;
  baseScale: number;
  scales: SiftScale[];
  dogs: GrayImage[];
};

export type SiftKeypoint = {
  x: number;
  y: number;
  octave: number;
  scaleIndex: number;
  sigma: number;
  response: number;
  orientation: number;
};

export type GradientPixel = {
  gx: number;
  gy: number;
  magnitude: number;
  orientation: number;
};

export type OrientationHistogram = {
  bins: number[];
  dominantBin: number;
  dominantAngle: number;
  dominantMagnitude: number;
};

export type DescriptorCell = {
  row: number;
  col: number;
  histogram: number[];
};

export type SiftDescriptor = {
  values: number[];
  cells: DescriptorCell[];
  normBeforeClamp: number;
  normAfterClamp: number;
};

export type SiftPipelineResult = {
  octaves: SiftOctave[];
  keypoints: SiftKeypoint[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function makeImage(
  width: number,
  height: number,
  data: Float32Array,
): GrayImage {
  return {
    width,
    height,
    data,
  };
}

/**
 * Downsample by taking every second pixel.
 *
 * This is deliberately explicit because SIFT is built around
 * scale-space octaves, not just repeated filtering at one resolution.
 */
export function downsample2(
  image: GrayImage,
): GrayImage {
  const width = Math.max(
    1,
    Math.floor(image.width / 2),
  );

  const height = Math.max(
    1,
    Math.floor(image.height / 2),
  );

  const data = new Float32Array(
    width * height,
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] =
        image.data[
          (y * 2) * image.width +
          x * 2
        ];
    }
  }

  return makeImage(
    width,
    height,
    data,
  );
}

/**
 * Build one SIFT octave.
 *
 * Each scale is Gaussian blurred from the octave base image.
 * The DoG images are differences between adjacent Gaussian scales.
 */
export function buildSiftOctave(
  base: GrayImage,
  octave: number,
  baseScale = 1,
  numScales = 5,
  k = Math.SQRT2,
): SiftOctave {
  const scales: SiftScale[] = [];

  for (
    let s = 0;
    s < numScales;
    s++
  ) {
    const sigma =
      baseScale *
      Math.pow(k, s);

    scales.push({
      sigma,
      image: gaussianBlur(
        base,
        sigma,
      ),
    });
  }

  const dogs: GrayImage[] = [];

  for (
    let s = 0;
    s < scales.length - 1;
    s++
  ) {
    dogs.push(
      differenceOfGaussians(
        base,
        scales[s].sigma,
        k,
      ),
    );
  }

  return {
    octave,
    baseScale,
    scales,
    dogs,
  };
}

/**
 * Build multiple octaves.
 *
 * The final Gaussian image of one octave becomes the source
 * for the next octave after 2x downsampling.
 */
export function buildSiftPyramid(
  image: GrayImage,
  octaveCount = 3,
  numScales = 5,
): SiftOctave[] {
  const octaves: SiftOctave[] = [];

  let current = image;
  let baseScale = 1;

  for (
    let octave = 0;
    octave < octaveCount;
    octave++
  ) {
    if (
      current.width < 16 ||
      current.height < 16
    ) {
      break;
    }

    const result =
      buildSiftOctave(
        current,
        octave,
        baseScale,
        numScales,
      );

    octaves.push(result);

    const nextSource =
      result.scales[
        result.scales.length - 1
      ].image;

    current =
      downsample2(
        nextSource,
      );

    baseScale *= 2;
  }

  return octaves;
}

/**
 * Read the gradient around one pixel.
 *
 * Central differences:
 *
 * Gx = I(x+1,y) - I(x-1,y)
 * Gy = I(x,y+1) - I(x,y-1)
 */
export function gradientAt(
  image: GrayImage,
  x: number,
  y: number,
): GradientPixel {
  const gx =
    (
      pixel(image, x + 1, y) -
      pixel(image, x - 1, y)
    ) / 2;

  const gy =
    (
      pixel(image, x, y + 1) -
      pixel(image, x, y - 1)
    ) / 2;

  const magnitude =
    Math.sqrt(
      gx * gx +
      gy * gy,
    );

  const orientation =
    Math.atan2(
      gy,
      gx,
    );

  return {
    gx,
    gy,
    magnitude,
    orientation,
  };
}

/**
 * Convert an angle from [-π, π] into [0, 2π).
 */
export function positiveAngle(
  angle: number,
): number {
  const twoPi =
    Math.PI * 2;

  return (
    (angle % twoPi + twoPi) %
    twoPi
  );
}

/**
 * Build the orientation histogram around a keypoint.
 *
 * SIFT commonly uses 36 bins for the orientation assignment stage.
 */
export function orientationHistogram(
  image: GrayImage,
  centerX: number,
  centerY: number,
  radius = 8,
  bins = 36,
): OrientationHistogram {
  const histogram =
    new Array<number>(
      bins,
    ).fill(0);

  const sigmaWindow =
    Math.max(
      1,
      radius / 2,
    );

  for (
    let dy = -radius;
    dy <= radius;
    dy++
  ) {
    for (
      let dx = -radius;
      dx <= radius;
      dx++
    ) {
      const x =
        Math.round(centerX) +
        dx;

      const y =
        Math.round(centerY) +
        dy;

      if (
        x <= 0 ||
        y <= 0 ||
        x >= image.width - 1 ||
        y >= image.height - 1
      ) {
        continue;
      }

      const gradient =
        gradientAt(
          image,
          x,
          y,
        );

      const distance2 =
        dx * dx +
        dy * dy;

      const weight =
        Math.exp(
          -distance2 /
            (2 *
              sigmaWindow *
              sigmaWindow),
        );

      const angle =
        positiveAngle(
          gradient.orientation,
        );

      const binFloat =
        (angle /
          (2 * Math.PI)) *
        bins;

      const bin =
        Math.floor(binFloat) %
        bins;

      histogram[bin] +=
        gradient.magnitude *
        weight;
    }
  }

  let dominantBin = 0;

  for (
    let i = 1;
    i < histogram.length;
    i++
  ) {
    if (
      histogram[i] >
      histogram[dominantBin]
    ) {
      dominantBin = i;
    }
  }

  const dominantAngle =
    (
      dominantBin + 0.5
    ) *
    (2 * Math.PI / bins);

  return {
    bins: histogram,
    dominantBin,
    dominantAngle,
    dominantMagnitude:
      histogram[dominantBin],
  };
}

/**
 * Check whether a DoG sample is a strict magnitude extremum
 * against its 3x3 neighborhood in the current scale.
 *
 * The complete SIFT localization stage also compares adjacent
 * scales. This function exposes the spatial part explicitly.
 */
export function isSpatialExtremum(
  image: GrayImage,
  x: number,
  y: number,
  threshold = 0,
): boolean {
  const center =
    Math.abs(
      pixel(image, x, y),
    );

  if (center <= threshold) {
    return false;
  }

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

      if (
        Math.abs(
          pixel(
            image,
            x + dx,
            y + dy,
          ),
        ) > center
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Detect scale-space extrema across three adjacent DoG images.
 *
 * This educational implementation uses response magnitude so
 * positive and negative blob responses can both be inspected.
 */
export function detectSiftKeypoints(
  octave: SiftOctave,
  thresholdRatio = 0.35,
): SiftKeypoint[] {
  const keypoints: SiftKeypoint[] =
    [];

  if (
    octave.dogs.length < 3
  ) {
    return keypoints;
  }

  let globalMax = 0;

  for (
    const dog of octave.dogs
  ) {
    for (
      const value of dog.data
    ) {
      globalMax =
        Math.max(
          globalMax,
          Math.abs(value),
        );
    }
  }

  const threshold =
    globalMax *
    thresholdRatio;

  for (
    let s = 1;
    s < octave.dogs.length - 1;
    s++
  ) {
    const previous =
      octave.dogs[s - 1];

    const current =
      octave.dogs[s];

    const next =
      octave.dogs[s + 1];

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
          y * current.width +
          x;

        const value =
          current.data[index];

        const magnitude =
          Math.abs(value);

        if (
          magnitude <
          threshold
        ) {
          continue;
        }

        let isExtremum = true;

        for (
          let ds = -1;
          ds <= 1 && isExtremum;
          ds++
        ) {
          const image =
            ds === -1
              ? previous
              : ds === 0
                ? current
                : next;

          for (
            let dy = -1;
            dy <= 1 && isExtremum;
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

              const neighbor =
                Math.abs(
                  image.data[
                    (y + dy) *
                      image.width +
                    (x + dx)
                  ],
                );

              if (
                neighbor >
                magnitude
              ) {
                isExtremum = false;
                break;
              }
            }
          }
        }

        if (!isExtremum) {
          continue;
        }

        const scale =
          octave.scales[
            Math.min(
              s,
              octave.scales.length - 1,
            )
          ];

        const histogram =
          orientationHistogram(
            scale.image,
            x,
            y,
          );

        keypoints.push({
          x,
          y,
          octave:
            octave.octave,
          scaleIndex: s,
          sigma:
            scale.sigma,
          response: value,
          orientation:
            histogram.dominantAngle,
        });
      }
    }
  }

  return keypoints;
}

/**
 * Build one 8-bin orientation histogram for one spatial cell.
 */
export function descriptorCellHistogram(
  image: GrayImage,
  centerX: number,
  centerY: number,
  orientation: number,
  cellSize = 4,
  bins = 8,
): number[] {
  const histogram =
    new Array<number>(
      bins,
    ).fill(0);

  const half =
    Math.floor(
      cellSize / 2,
    );

  for (
    let dy = -half;
    dy < half;
    dy++
  ) {
    for (
      let dx = -half;
      dx < half;
      dx++
    ) {
      const x =
        Math.round(centerX) +
        dx;

      const y =
        Math.round(centerY) +
        dy;

      if (
        x <= 0 ||
        y <= 0 ||
        x >= image.width - 1 ||
        y >= image.height - 1
      ) {
        continue;
      }

      const gradient =
        gradientAt(
          image,
          x,
          y,
        );

      const relativeAngle =
        positiveAngle(
          gradient.orientation -
            orientation,
        );

      const bin =
        Math.floor(
          (relativeAngle /
            (2 * Math.PI)) *
            bins,
        ) % bins;

      histogram[bin] +=
        gradient.magnitude;
    }
  }

  return histogram;
}

/**
 * Construct the educational 4x4x8 SIFT descriptor.
 *
 * 4 spatial rows × 4 spatial columns × 8 orientation bins = 128.
 */
export function buildSiftDescriptor(
  image: GrayImage,
  centerX: number,
  centerY: number,
  orientation: number,
): SiftDescriptor {
  const cells: DescriptorCell[] =
    [];

  const values: number[] = [];

  const cellSize = 4;

  for (
    let row = 0;
    row < 4;
    row++
  ) {
    for (
      let col = 0;
      col < 4;
      col++
    ) {
      const offsetX =
        (col - 1.5) *
        cellSize;

      const offsetY =
        (row - 1.5) *
        cellSize;

      const histogram =
        descriptorCellHistogram(
          image,
          centerX + offsetX,
          centerY + offsetY,
          orientation,
          cellSize,
          8,
        );

      cells.push({
        row,
        col,
        histogram,
      });

      values.push(
        ...histogram,
      );
    }
  }

  let normBeforeClamp =
    Math.sqrt(
      values.reduce(
        (sum, value) =>
          sum + value * value,
        0,
      ),
    );

  if (
    normBeforeClamp <
    1e-12
  ) {
    normBeforeClamp = 1;
  }

  for (
    let i = 0;
    i < values.length;
    i++
  ) {
    values[i] /=
      normBeforeClamp;
  }

  for (
    let i = 0;
    i < values.length;
    i++
  ) {
    values[i] =
      Math.min(
        values[i],
        0.2,
      );
  }

  let normAfterClamp =
    Math.sqrt(
      values.reduce(
        (sum, value) =>
          sum + value * value,
        0,
      ),
    );

  if (
    normAfterClamp <
    1e-12
  ) {
    normAfterClamp = 1;
  }

  for (
    let i = 0;
    i < values.length;
    i++
  ) {
    values[i] /=
      normAfterClamp;
  }

  return {
    values,
    cells,
    normBeforeClamp,
    normAfterClamp,
  };
}

/**
 * Useful verification checks for the SIFT laboratory.
 */
export function verifySiftDescriptorDimension(
  descriptor: SiftDescriptor,
): boolean {
  return (
    descriptor.cells.length === 16 &&
    descriptor.values.length === 128
  );
}

export function verifyGradientMagnitude(
  gx: number,
  gy: number,
  magnitude: number,
): boolean {
  return (
    Math.abs(
      magnitude -
        Math.sqrt(
          gx * gx +
            gy * gy,
        ),
    ) < 1e-8
  );
}

export function verifyGradientOrientation(
  gx: number,
  gy: number,
  orientation: number,
): boolean {
  return (
    Math.abs(
      Math.sin(
        orientation -
          Math.atan2(
            gy,
            gx,
          ),
      ),
    ) < 1e-8
  );
}

export function verifyGaussianKernelForSift(
  sigma = 1.6,
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
