export type BinaryImage = {
  width: number;
  height: number;
  data: number[];
};

export type RegionPoint = {
  x: number;
  y: number;
};

export type Region = {
  id: number;
  pixels: RegionPoint[];
  area: number;
  centroidX: number;
  centroidY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  aspectRatio: number;
};

export type ThresholdResult = {
  threshold: number;
  mask: BinaryImage;
  foregroundCount: number;
  backgroundCount: number;
  foregroundFraction: number;
};

export type RegionGrowingResult = {
  seed: RegionPoint;
  threshold: number;
  region: RegionPoint[];
  visited: number;
};

export type ConnectedComponentsResult = {
  mask: BinaryImage;
  connectivity: 4 | 8;
  labels: number[];
  regions: Region[];
};

export function thresholdImage(
  values: number[],
  width: number,
  height: number,
  threshold: number,
): ThresholdResult {
  if (
    values.length !==
    width * height
  ) {
    throw new Error(
      "Image dimensions do not match data length.",
    );
  }

  const data = new Array<number>(
    values.length,
  );

  let foregroundCount = 0;

  for (
    let i = 0;
    i < values.length;
    i += 1
  ) {
    const foreground =
      values[i] >= threshold
        ? 1
        : 0;

    data[i] = foreground;

    if (foreground) {
      foregroundCount += 1;
    }
  }

  const total =
    width * height;

  return {
    threshold,
    mask: {
      width,
      height,
      data,
    },
    foregroundCount,
    backgroundCount:
      total - foregroundCount,
    foregroundFraction:
      foregroundCount / total,
  };
}

function neighbours(
  x: number,
  y: number,
  width: number,
  height: number,
  connectivity: 4 | 8,
): RegionPoint[] {
  const offsets =
    connectivity === 4
      ? [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]
      : [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ];

  return offsets
    .map(
      ([dx, dy]) => ({
        x: x + dx,
        y: y + dy,
      }),
    )
    .filter(
      (point) =>
        point.x >= 0 &&
        point.x < width &&
        point.y >= 0 &&
        point.y < height,
    );
}

export function regionGrow(
  values: number[],
  width: number,
  height: number,
  seedX: number,
  seedY: number,
  threshold: number,
  connectivity: 4 | 8 = 4,
): RegionGrowingResult {
  if (
    values.length !==
    width * height
  ) {
    throw new Error(
      "Image dimensions do not match data length.",
    );
  }

  const seedIndex =
    seedY * width + seedX;

  const seedValue =
    values[seedIndex];

  const visited =
    new Uint8Array(
      width * height,
    );

  const queue: RegionPoint[] = [
    {
      x: seedX,
      y: seedY,
    },
  ];

  const region: RegionPoint[] =
    [];

  visited[seedIndex] = 1;

  while (
    queue.length > 0
  ) {
    const current =
      queue.shift()!;

    region.push(current);

    for (
      const neighbour of neighbours(
        current.x,
        current.y,
        width,
        height,
        connectivity,
      )
    ) {
      const index =
        neighbour.y * width +
        neighbour.x;

      if (visited[index]) {
        continue;
      }

      visited[index] = 1;

      if (
        Math.abs(
          values[index] -
            seedValue,
        ) <= threshold
      ) {
        queue.push(
          neighbour,
        );
      }
    }
  }

  return {
    seed: {
      x: seedX,
      y: seedY,
    },
    threshold,
    region,
    visited:
      region.length,
  };
}

function calculateRegion(
  id: number,
  pixels: RegionPoint[],
): Region {
  let sumX = 0;
  let sumY = 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (
    const pixel of pixels
  ) {
    sumX += pixel.x;
    sumY += pixel.y;

    minX = Math.min(
      minX,
      pixel.x,
    );

    maxX = Math.max(
      maxX,
      pixel.x,
    );

    minY = Math.min(
      minY,
      pixel.y,
    );

    maxY = Math.max(
      maxY,
      pixel.y,
    );
  }

  const area =
    pixels.length;

  const width =
    maxX - minX + 1;

  const height =
    maxY - minY + 1;

  return {
    id,
    pixels,
    area,
    centroidX:
      sumX / area,
    centroidY:
      sumY / area,
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    aspectRatio:
      width / height,
  };
}

export function connectedComponents(
  mask: BinaryImage,
  connectivity: 4 | 8 = 4,
): ConnectedComponentsResult {
  const labels =
    new Array<number>(
      mask.data.length,
    ).fill(0);

  const regions: Region[] =
    [];

  let nextId = 1;

  for (
    let y = 0;
    y < mask.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < mask.width;
      x += 1
    ) {
      const start =
        y * mask.width + x;

      if (
        mask.data[start] === 0 ||
        labels[start] !== 0
      ) {
        continue;
      }

      const pixels: RegionPoint[] =
        [];

      const queue: RegionPoint[] =
        [
          { x, y },
        ];

      labels[start] =
        nextId;

      while (
        queue.length > 0
      ) {
        const current =
          queue.shift()!;

        pixels.push(current);

        for (
          const neighbour of neighbours(
            current.x,
            current.y,
            mask.width,
            mask.height,
            connectivity,
          )
        ) {
          const index =
            neighbour.y *
              mask.width +
            neighbour.x;

          if (
            mask.data[index] === 0 ||
            labels[index] !== 0
          ) {
            continue;
          }

          labels[index] =
            nextId;

          queue.push(
            neighbour,
          );
        }
      }

      regions.push(
        calculateRegion(
          nextId,
          pixels,
        ),
      );

      nextId += 1;
    }
  }

  return {
    mask,
    connectivity,
    labels,
    regions,
  };
}

export function makeGroupingScene(
  width = 96,
  height = 96,
): number[] {
  const data =
    new Array<number>(
      width * height,
    ).fill(25);

  function fillCircle(
    cx: number,
    cy: number,
    radius: number,
    value: number,
  ) {
    for (
      let y =
        Math.max(
          0,
          cy - radius,
        );
      y <=
        Math.min(
          height - 1,
          cy + radius,
        );
      y += 1
    ) {
      for (
        let x =
          Math.max(
            0,
            cx - radius,
          );
        x <=
          Math.min(
            width - 1,
            cx + radius,
          );
        x += 1
      ) {
        const dx =
          x - cx;
        const dy =
          y - cy;

        if (
          dx * dx +
            dy * dy <=
          radius * radius
        ) {
          data[
            y * width + x
          ] = value;
        }
      }
    }
  }

  fillCircle(
    20,
    22,
    9,
    210,
  );

  fillCircle(
    55,
    25,
    14,
    180,
  );

  fillCircle(
    76,
    68,
    7,
    230,
  );

  fillCircle(
    35,
    70,
    11,
    150,
  );

  return data;
}
