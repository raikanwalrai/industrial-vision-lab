export type TexturePatch = {
  width: number;
  height: number;
  data: number[];
};

export type TextureStatistics = {
  count: number;
  mean: number;
  variance: number;
  standardDeviation: number;
  minimum: number;
  maximum: number;
  range: number;
  contrast: number;
};

export type LbpResult = {
  center: number;
  neighbours: number[];
  bits: number[];
  code: number;
};

export type LbpHistogram = {
  bins: number[];
  total: number;
};

function assertNonEmpty(
  values: number[],
): void {
  if (values.length === 0) {
    throw new Error(
      "Texture statistics require at least one value.",
    );
  }
}

/**
 * Arithmetic mean:
 *
 * μ = (1/N) Σ x_i
 */
export function mean(
  values: number[],
): number {
  assertNonEmpty(values);

  return (
    values.reduce(
      (sum, value) => sum + value,
      0,
    ) / values.length
  );
}

/**
 * Population variance:
 *
 * σ² = (1/N) Σ (x_i - μ)²
 */
export function variance(
  values: number[],
): number {
  assertNonEmpty(values);

  const mu = mean(values);

  return (
    values.reduce(
      (sum, value) =>
        sum + (value - mu) ** 2,
      0,
    ) / values.length
  );
}

/**
 * Population standard deviation:
 *
 * σ = √σ²
 */
export function standardDeviation(
  values: number[],
): number {
  return Math.sqrt(variance(values));
}

/**
 * Complete statistics for a collection
 * of intensity values.
 */
export function textureStatistics(
  values: number[],
): TextureStatistics {
  assertNonEmpty(values);

  const mu = mean(values);
  const varianceValue =
    variance(values);

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  return {
    count: values.length,
    mean: mu,
    variance: varianceValue,
    standardDeviation:
      Math.sqrt(varianceValue),
    minimum,
    maximum,
    range: maximum - minimum,
    contrast:
      Math.sqrt(varianceValue),
  };
}

/**
 * Extract a rectangular patch from a
 * grayscale image.
 */
export function extractPatch(
  image: TexturePatch,
  centerX: number,
  centerY: number,
  radius: number,
): TexturePatch {
  const width =
    radius * 2 + 1;
  const height = width;

  const data: number[] = [];

  for (
    let dy = -radius;
    dy <= radius;
    dy += 1
  ) {
    for (
      let dx = -radius;
      dx <= radius;
      dx += 1
    ) {
      const x =
        Math.max(
          0,
          Math.min(
            image.width - 1,
            centerX + dx,
          ),
        );

      const y =
        Math.max(
          0,
          Math.min(
            image.height - 1,
            centerY + dy,
          ),
        );

      data.push(
        image.data[
          y * image.width + x
        ],
      );
    }
  }

  return {
    width,
    height,
    data,
  };
}

/**
 * Compare local intensity variation.
 *
 * Useful for demonstrating why two patches
 * with similar means can have different
 * texture.
 */
export function textureContrast(
  values: number[],
): number {
  return standardDeviation(values);
}

/**
 * Compare two patches using their mean
 * and standard deviation.
 */
export function compareTexture(
  first: number[],
  second: number[],
) {
  const firstStats =
    textureStatistics(first);

  const secondStats =
    textureStatistics(second);

  return {
    first: firstStats,
    second: secondStats,
    meanDifference:
      Math.abs(
        firstStats.mean -
          secondStats.mean,
      ),
    contrastDifference:
      Math.abs(
        firstStats.contrast -
          secondStats.contrast,
      ),
  };
}

/**
 * LBP threshold function:
 *
 * s(x) = 1 if x >= 0
 *        0 otherwise
 */
export function lbpStep(
  difference: number,
): number {
  return difference >= 0
    ? 1
    : 0;
}

/**
 * Compute the standard 8-neighbour
 * Local Binary Pattern.
 *
 * Neighbour order:
 *
 *   0 1 2
 *   7 C 3
 *   6 5 4
 *
 * LBP = Σ s(g_p - g_c) 2^p
 */
export function computeLBP(
  patch: TexturePatch,
  centerX = 1,
  centerY = 1,
): LbpResult {
  if (
    patch.width < 3 ||
    patch.height < 3
  ) {
    throw new Error(
      "LBP requires at least a 3×3 patch.",
    );
  }

  const center =
    patch.data[
      centerY * patch.width +
        centerX
    ];

  const coordinates = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ];

  const neighbours =
    coordinates.map(
      ([dx, dy]) =>
        patch.data[
          (centerY + dy) *
              patch.width +
            (centerX + dx)
        ],
    );

  const bits = neighbours.map(
    (value) =>
      lbpStep(
        value - center,
      ),
  );

  const code = bits.reduce(
    (result, bit, index) =>
      result +
      bit * 2 ** index,
    0,
  );

  return {
    center,
    neighbours,
    bits,
    code,
  };
}

/**
 * Build an LBP histogram.
 *
 * For 8 neighbours there are 256
 * possible codes: 0 ... 255.
 */
export function lbpHistogram(
  image: TexturePatch,
): LbpHistogram {
  if (
    image.width < 3 ||
    image.height < 3
  ) {
    throw new Error(
      "LBP histogram requires an image of at least 3×3.",
    );
  }

  const bins = new Array<number>(
    256,
  ).fill(0);

  let total = 0;

  for (
    let y = 1;
    y < image.height - 1;
    y += 1
  ) {
    for (
      let x = 1;
      x < image.width - 1;
      x += 1
    ) {
      const result =
        computeLBP(
          image,
          x,
          y,
        );

      bins[result.code] += 1;
      total += 1;
    }
  }

  return {
    bins,
    total,
  };
}

/**
 * Verify the mean formula.
 */
export function verifyMean(
  values: number[],
): boolean {
  if (values.length === 0) {
    return false;
  }

  const expected =
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    ) / values.length;

  return (
    Math.abs(
      mean(values) -
        expected,
    ) < 1e-10
  );
}

/**
 * Verify the variance formula.
 */
export function verifyVariance(
  values: number[],
): boolean {
  if (values.length === 0) {
    return false;
  }

  const mu =
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    ) / values.length;

  const expected =
    values.reduce(
      (sum, value) =>
        sum +
        (value - mu) ** 2,
      0,
    ) / values.length;

  return (
    Math.abs(
      variance(values) -
        expected,
    ) < 1e-10
  );
}

/**
 * Verify that standard deviation is
 * sqrt(variance).
 */
export function verifyStandardDeviation(
  values: number[],
): boolean {
  if (values.length === 0) {
    return false;
  }

  return (
    Math.abs(
      standardDeviation(values) -
        Math.sqrt(
          variance(values),
        ),
    ) < 1e-10
  );
}

/**
 * Verify the LBP binary-code equation.
 */
export function verifyLBP(
  result: LbpResult,
): boolean {
  const expected =
    result.bits.reduce(
      (sum, bit, index) =>
        sum +
        bit * 2 ** index,
      0,
    );

  return (
    result.code === expected &&
    result.bits.every(
      (bit) =>
        bit === 0 ||
        bit === 1,
    )
  );
}

/**
 * Verify that an LBP histogram counts
 * every valid interior pixel exactly once.
 */
export function verifyLBPHistogram(
  image: TexturePatch,
  histogram: LbpHistogram,
): boolean {
  const expectedTotal =
    Math.max(
      0,
      image.width - 2,
    ) *
    Math.max(
      0,
      image.height - 2,
    );

  const actualTotal =
    histogram.bins.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  return (
    histogram.total ===
      expectedTotal &&
    actualTotal ===
      expectedTotal
  );
}

/* ============================================================
   SPRINT 9 — VISUAL TEXTURE SCENES
   Deterministic synthetic textures for teaching.
   ============================================================ */

export type TextureSceneKind =
  | "smooth"
  | "brushed"
  | "checker"
  | "weave"
  | "speckle"
  | "defect";

export type TextureScene = {
  width: number;
  height: number;
  data: number[];
  name: string;
  description: string;
};

function clampTexture(value: number): number {
  return Math.max(
    0,
    Math.min(255, value),
  );
}

function deterministicNoise(
  x: number,
  y: number,
): number {
  const value =
    Math.sin(
      x * 12.9898 +
      y * 78.233 +
      37.719,
    ) *
    43758.5453;

  return (
    (value -
      Math.floor(value)) *
    2 -
    1
  );
}

function textureValue(
  kind: TextureSceneKind,
  x: number,
  y: number,
): number {
  const nx = x / 96;
  const ny = y / 96;

  if (kind === "smooth") {
    return clampTexture(
      128 +
        5 *
          Math.sin(
            nx * Math.PI * 3,
          ) +
        3 *
          Math.cos(
            ny * Math.PI * 2,
          ) +
        deterministicNoise(
          x,
          y,
        ) *
          2,
    );
  }

  if (kind === "brushed") {
    return clampTexture(
      128 +
        24 *
          Math.sin(
            nx * Math.PI * 22 +
              deterministicNoise(
                x,
                0,
              ) *
                0.7,
          ) +
        deterministicNoise(
          x * 3,
          y,
        ) *
          10,
    );
  }

  if (kind === "checker") {
    const cell = 8;

    const cx =
      Math.floor(x / cell);
    const cy =
      Math.floor(y / cell);

    return (
      (cx + cy) % 2 === 0
        ? 220
        : 35
    );
  }

  if (kind === "weave") {
    const horizontal =
      Math.sin(
        ny *
          Math.PI *
          24,
      );

    const vertical =
      Math.sin(
        nx *
          Math.PI *
          24,
      );

    return clampTexture(
      125 +
        horizontal * 48 +
        vertical * 48 +
        deterministicNoise(
          x,
          y,
        ) *
          8,
    );
  }

  if (kind === "speckle") {
    const noise =
      deterministicNoise(
        x * 2,
        y * 2,
      );

    return clampTexture(
      128 +
        noise * 48 +
        deterministicNoise(
          x * 7,
          y * 5,
        ) *
          14,
    );
  }

  // defect
  const base =
    125 +
    18 *
      Math.sin(
        nx * Math.PI * 20,
      ) +
    deterministicNoise(
      x,
      y,
    ) *
      8;

  const dx = x - 67;
  const dy = y - 46;

  const distance =
    Math.sqrt(
      dx * dx +
        dy * dy,
    );

  const defect =
    distance < 10
      ? 85
      : 0;

  return clampTexture(
    base + defect,
  );
}

export function makeTextureScene(
  kind: TextureSceneKind,
  width = 96,
  height = 96,
): TextureScene {
  const names: Record<
    TextureSceneKind,
    string
  > = {
    smooth: "Smooth metal",
    brushed: "Brushed metal",
    checker: "Checker structure",
    weave: "Weave texture",
    speckle: "Speckled surface",
    defect: "Surface with defect",
  };

  const descriptions: Record<
    TextureSceneKind,
    string
  > = {
    smooth:
      "Low-variation surface with slowly changing intensity.",
    brushed:
      "Directional texture similar to machining or brushed metal marks.",
    checker:
      "High-frequency repeated spatial pattern.",
    weave:
      "Two directional patterns combine to create a woven surface.",
    speckle:
      "Irregular granular texture with local intensity variation.",
    defect:
      "A directional surface containing a localized abnormal region.",
  };

  const data: number[] =
    new Array(
      width * height,
    );

  for (
    let y = 0;
    y < height;
    y += 1
  ) {
    for (
      let x = 0;
      x < width;
      x += 1
    ) {
      data[
        y * width + x
      ] = textureValue(
        kind,
        x,
        y,
      );
    }
  }

  return {
    width,
    height,
    data,
    name: names[kind],
    description:
      descriptions[kind],
  };
}

export function extractTexturePatch(
  scene: TextureScene,
  centerX: number,
  centerY: number,
  size = 9,
): TexturePatch {
  const half =
    Math.floor(size / 2);

  const data: number[] =
    [];

  for (
    let y = -half;
    y <= half;
    y += 1
  ) {
    for (
      let x = -half;
      x <= half;
      x += 1
    ) {
      const px = Math.max(
        0,
        Math.min(
          scene.width - 1,
          centerX + x,
        ),
      );

      const py = Math.max(
        0,
        Math.min(
          scene.height - 1,
          centerY + y,
        ),
      );

      data.push(
        scene.data[
          py * scene.width +
            px
        ],
      );
    }
  }

  return {
    width: size,
    height: size,
    data,
  };
}
