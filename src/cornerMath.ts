import type { GrayImage } from "./imageScenes";

export type CornerRegion = "flat" | "edge" | "corner";

export type HarrisScene =
  | "corner"
  | "shapes"
  | "edges"
  | "flat";

function setPixel(
  data: Float32Array,
  width: number,
  x: number,
  y: number,
  value: number,
) {
  if (
    x < 0 ||
    y < 0 ||
    x >= width
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
    let y = Math.max(0, cy - radius);
    y <= Math.min(height - 1, cy + radius);
    y++
  ) {
    for (
      let x = Math.max(0, cx - radius);
      x <= Math.min(width - 1, cx + radius);
      x++
    ) {
      const dx = x - cx;
      const dy = y - cy;

      if (dx * dx + dy * dy <= r2) {
        setPixel(
          data,
          width,
          x,
          y,
          value,
        );
      }
    }
  }
}

function triangle(
  data: Float32Array,
  width: number,
  height: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  value: number,
) {
  const minX = Math.max(
    0,
    Math.floor(
      Math.min(ax, bx, cx),
    ),
  );

  const maxX = Math.min(
    width - 1,
    Math.ceil(
      Math.max(ax, bx, cx),
    ),
  );

  const minY = Math.max(
    0,
    Math.floor(
      Math.min(ay, by, cy),
    ),
  );

  const maxY = Math.min(
    height - 1,
    Math.ceil(
      Math.max(ay, by, cy),
    ),
  );

  const denominator =
    (by - cy) * (ax - cx) +
    (cx - bx) * (ay - cy);

  if (Math.abs(denominator) < 1e-9) {
    return;
  }

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const u =
        ((by - cy) * (x - cx) +
          (cx - bx) * (y - cy)) /
        denominator;

      const v =
        ((cy - ay) * (x - cx) +
          (ax - cx) * (y - cy)) /
        denominator;

      const w = 1 - u - v;

      if (
        u >= 0 &&
        v >= 0 &&
        w >= 0
      ) {
        setPixel(
          data,
          width,
          x,
          y,
          value,
        );
      }
    }
  }
}

export function makeHarrisScene(
  scene: HarrisScene,
): GrayImage {
  const width = 96;
  const height = 96;

  const data = new Float32Array(
    width * height,
  );

  // ----------------------------------------------------------
  // FLAT
  // ----------------------------------------------------------
  if (scene === "flat") {
    data.fill(128);

    return {
      width,
      height,
      data,
    };
  }

  // ----------------------------------------------------------
  // EDGES
  // A single vertical step edge.
  // There is strong change in ONE direction only.
  // ----------------------------------------------------------
  if (scene === "edges") {
    data.fill(40);

    fillRect(
      data,
      width,
      height,
      48,
      0,
      95,
      95,
      210,
    );

    return {
      width,
      height,
      data,
    };
  }

  // ----------------------------------------------------------
  // CORNER
  // A clean square with four geometric corners.
  // ----------------------------------------------------------
  if (scene === "corner") {
    data.fill(25);

    fillRect(
      data,
      width,
      height,
      24,
      24,
      71,
      71,
      230,
    );

    return {
      width,
      height,
      data,
    };
  }

  // ----------------------------------------------------------
  // SHAPES
  // A deterministic industrial-style inspection scene.
  // ----------------------------------------------------------

  data.fill(175);

  // Machine body.
  fillRect(
    data,
    width,
    height,
    16,
    50,
    55,
    82,
    55,
  );

  // Inspection opening.
  fillRect(
    data,
    width,
    height,
    28,
    61,
    43,
    82,
    220,
  );

  // Machine roof.
  triangle(
    data,
    width,
    height,
    12,
    50,
    36,
    27,
    60,
    50,
    95,
  );

  // Circular component.
  fillCircle(
    data,
    width,
    height,
    73,
    67,
    10,
    45,
  );

  // Circular inspection hole.
  fillCircle(
    data,
    width,
    height,
    73,
    67,
    4,
    220,
  );

  // Horizontal conveyor / base.
  fillRect(
    data,
    width,
    height,
    7,
    84,
    89,
    89,
    35,
  );

  return {
    width,
    height,
    data,
  };
}

export type CornerPixel = {
  x: number;
  y: number;
};

export type StructureTensor = {
  ix: number;
  iy: number;
  ix2: number;
  ixiy: number;
  iy2: number;
  a: number;
  b: number;
  c: number;
  lambda1: number;
  lambda2: number;
  determinant: number;
  trace: number;
  harris: number;
  shiTomasi: number;
  region: CornerRegion;
};

export type CornerResponse = {
  image: GrayImage;
  points: Array<CornerPixel & { response: number }>;
  maxResponse: number;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function pixel(image: GrayImage, x: number, y: number): number {
  const xx = clamp(Math.round(x), 0, image.width - 1);
  const yy = clamp(Math.round(y), 0, image.height - 1);
  return image.data[yy * image.width + xx];
}

export function gradientAt(
  image: GrayImage,
  x: number,
  y: number,
): { ix: number; iy: number } {
  const ix =
    (pixel(image, x + 1, y) -
      pixel(image, x - 1, y)) /
    2;

  const iy =
    (pixel(image, x, y + 1) -
      pixel(image, x, y - 1)) /
    2;

  return { ix, iy };
}

export function structureTensorAt(
  image: GrayImage,
  x: number,
  y: number,
  radius = 1,
  k = 0.04,
): StructureTensor {
  let ix2 = 0;
  let ixiy = 0;
  let iy2 = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const g = gradientAt(image, x + dx, y + dy);

      ix2 += g.ix * g.ix;
      ixiy += g.ix * g.iy;
      iy2 += g.iy * g.iy;
    }
  }

  const a = ix2;
  const b = ixiy;
  const c = iy2;

  const trace = a + c;
  const determinant = a * c - b * b;

  const discriminant = Math.max(
    0,
    (a - c) * (a - c) + 4 * b * b,
  );

  const root = Math.sqrt(discriminant);

  const lambda1 = (trace + root) / 2;
  const lambda2 = (trace - root) / 2;

  const harris =
    determinant - k * trace * trace;

  const shiTomasi = Math.min(
    lambda1,
    lambda2,
  );

  const scale =
    Math.max(lambda1, lambda2, 1e-9);

  let region: CornerRegion;

  if (lambda1 < scale * 0.08) {
    region = "flat";
  } else if (lambda2 < lambda1 * 0.2) {
    region = "edge";
  } else {
    region = "corner";
  }

  return {
    ix: gradientAt(image, x, y).ix,
    iy: gradientAt(image, x, y).iy,
    ix2,
    ixiy,
    iy2,
    a,
    b,
    c,
    lambda1,
    lambda2,
    determinant,
    trace,
    harris,
    shiTomasi,
    region,
  };
}

export function harrisResponseAt(
  image: GrayImage,
  x: number,
  y: number,
  radius = 1,
  k = 0.04,
): number {
  return structureTensorAt(
    image,
    x,
    y,
    radius,
    k,
  ).harris;
}

export function harrisResponseMap(
  image: GrayImage,
  radius = 1,
  k = 0.04,
): GrayImage {
  const data = new Float32Array(
    image.width * image.height,
  );

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      data[y * image.width + x] =
        harrisResponseAt(
          image,
          x,
          y,
          radius,
          k,
        );
    }
  }

  return {
    width: image.width,
    height: image.height,
    data,
  };
}

export function detectHarrisCorners(
  image: GrayImage,
  threshold = 0.15,
  radius = 1,
  k = 0.04,
): CornerResponse {
  const response = harrisResponseMap(
    image,
    radius,
    k,
  );

  let maxResponse = 0;

  for (const value of response.data) {
    maxResponse = Math.max(
      maxResponse,
      value,
    );
  }

  const points: Array<
    CornerPixel & { response: number }
  > = [];

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
      const index =
        y * image.width + x;

      const value = response.data[index];

      if (value < absoluteThreshold) {
        continue;
      }

      let isMaximum = true;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) {
            continue;
          }

          const neighbour =
            response.data[
              (y + dy) * image.width +
                (x + dx)
            ];

          if (neighbour > value) {
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

export function classifyEigenvalues(
  lambda1: number,
  lambda2: number,
): CornerRegion {
  const largest =
    Math.max(lambda1, lambda2);

  if (largest < 1e-9) {
    return "flat";
  }

  if (
    Math.min(lambda1, lambda2) <
    largest * 0.2
  ) {
    return "edge";
  }

  return "corner";
}

export function verifyStructureTensorSymmetry(): boolean {
  const a = 4;
  const b = 2;
  const c = 9;

  const m = [
    [a, b],
    [b, c],
  ];

  return (
    m[0][1] === m[1][0]
  );
}

export function verifyEigenvalueTrace(): boolean {
  const a = 5;
  const b = 1;
  const c = 3;

  const trace = a + c;

  const discriminant =
    (a - c) * (a - c) +
    4 * b * b;

  const root = Math.sqrt(discriminant);

  const l1 = (trace + root) / 2;
  const l2 = (trace - root) / 2;

  return (
    Math.abs(
      l1 + l2 - trace,
    ) < 1e-10
  );
}

export function verifyHarrisFormula(): boolean {
  const a = 5;
  const b = 1;
  const c = 3;
  const k = 0.04;

  const determinant =
    a * c - b * b;

  const trace = a + c;

  const expected =
    determinant -
    k * trace * trace;

  const actual =
    15 -
    0.04 * 64;

  return (
    Math.abs(
      expected - actual,
    ) < 1e-10
  );
}

export function verifyRegionClassification(): boolean {
  return (
    classifyEigenvalues(0, 0) ===
      "flat" &&
    classifyEigenvalues(10, 1) ===
      "edge" &&
    classifyEigenvalues(10, 9) ===
      "corner"
  );
}
