export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type Point2D = {
  u: number;
  v: number;
};

export type CameraPosition = Point3D;

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type Intrinsics = {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
};

export type RotationMatrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export type CameraCoordinates = Point3D;

export type ProjectionResult = {
  normalized: NormalizedPoint;
  pixel: Point2D;
  depth: number;
  valid: boolean;
};

export function worldToCamera(
  worldPoint: Point3D,
  cameraPosition: CameraPosition,
): CameraCoordinates {
  return {
    x: worldPoint.x - cameraPosition.x,
    y: worldPoint.y - cameraPosition.y,
    z: worldPoint.z - cameraPosition.z,
  };
}

export function cameraToNormalized(
  cameraPoint: CameraCoordinates,
): NormalizedPoint {
  if (cameraPoint.z === 0) {
    throw new Error("Perspective projection is undefined when Z = 0.");
  }

  return {
    x: cameraPoint.x / cameraPoint.z,
    y: cameraPoint.y / cameraPoint.z,
  };
}

export function normalizedToPixel(
  normalized: NormalizedPoint,
  intrinsics: Intrinsics,
): Point2D {
  return {
    u: intrinsics.fx * normalized.x + intrinsics.cx,
    v: intrinsics.fy * normalized.y + intrinsics.cy,
  };
}

export function projectPinhole(
  cameraPoint: CameraCoordinates,
  intrinsics: Intrinsics,
  focalLength: number,
): ProjectionResult {
  if (cameraPoint.z === 0) {
    return {
      normalized: { x: 0, y: 0 },
      pixel: { u: 0, v: 0 },
      depth: cameraPoint.z,
      valid: false,
    };
  }

  const normalized = cameraToNormalized(cameraPoint);

  const pixel = {
    u: focalLength * normalized.x,
    v: focalLength * normalized.y,
  };

  return {
    normalized,
    pixel,
    depth: cameraPoint.z,
    valid: cameraPoint.z > 0,
  };
}

export function makeRotationZ(
  degrees: number,
): RotationMatrix3x3 {
  const theta = (degrees * Math.PI) / 180;
  const c = Math.cos(theta);
  const s = Math.sin(theta);

  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

export function multiplyRotation(
  rotation: RotationMatrix3x3,
  point: Point3D,
): Point3D {
  return {
    x:
      rotation[0][0] * point.x +
      rotation[0][1] * point.y +
      rotation[0][2] * point.z,
    y:
      rotation[1][0] * point.x +
      rotation[1][1] * point.y +
      rotation[1][2] * point.z,
    z:
      rotation[2][0] * point.x +
      rotation[2][1] * point.y +
      rotation[2][2] * point.z,
  };
}

export function vectorMagnitude(point: Point3D): number {
  return Math.sqrt(
    point.x ** 2 +
      point.y ** 2 +
      point.z ** 2,
  );
}

export function perspectiveScale(
  focalLength: number,
  depth: number,
): number {
  if (depth === 0) {
    throw new Error("Perspective scale is undefined when Z = 0.");
  }

  return focalLength / depth;
}

export function projectWorldPoint(
  worldPoint: Point3D,
  cameraPosition: CameraPosition,
  intrinsics: Intrinsics,
): ProjectionResult {
  const cameraPoint = worldToCamera(
    worldPoint,
    cameraPosition,
  );

  const normalized = cameraToNormalized(
    cameraPoint,
  );

  const pixel = normalizedToPixel(
    normalized,
    intrinsics,
  );

  return {
    normalized,
    pixel,
    depth: cameraPoint.z,
    valid: cameraPoint.z > 0,
  };
}

export function verifyCameraMath(): {
  passed: boolean;
  checks: string[];
} {
  const checks: string[] = [];

  const world = { x: 4, y: 3, z: 10 };
  const camera = { x: 1, y: 1, z: 2 };

  const cameraPoint = worldToCamera(
    world,
    camera,
  );

  const cameraOk =
    Math.abs(cameraPoint.x - 3) < 1e-9 &&
    Math.abs(cameraPoint.y - 2) < 1e-9 &&
    Math.abs(cameraPoint.z - 8) < 1e-9;

  checks.push(
    cameraOk
      ? "World → camera coordinates"
      : "FAILED: World → camera coordinates",
  );

  const normalized =
    cameraToNormalized(cameraPoint);

  const normalizedOk =
    Math.abs(normalized.x - 0.375) < 1e-9 &&
    Math.abs(normalized.y - 0.25) < 1e-9;

  checks.push(
    normalizedOk
      ? "Perspective normalization"
      : "FAILED: Perspective normalization",
  );

  const intrinsics = {
    fx: 800,
    fy: 800,
    cx: 320,
    cy: 240,
  };

  const pixel = normalizedToPixel(
    normalized,
    intrinsics,
  );

  const pixelOk =
    Math.abs(pixel.u - 620) < 1e-9 &&
    Math.abs(pixel.v - 440) < 1e-9;

  checks.push(
    pixelOk
      ? "Intrinsic pixel mapping"
      : "FAILED: Intrinsic pixel mapping",
  );

  const rotation =
    makeRotationZ(90);

  const rotated = multiplyRotation(
    rotation,
    { x: 1, y: 0, z: 0 },
  );

  const rotationOk =
    Math.abs(rotated.x) < 1e-9 &&
    Math.abs(rotated.y - 1) < 1e-9 &&
    Math.abs(rotated.z) < 1e-9;

  checks.push(
    rotationOk
      ? "Z-axis rotation"
      : "FAILED: Z-axis rotation",
  );

  const magnitude =
    vectorMagnitude({
      x: 3,
      y: 4,
      z: 12,
    });

  const magnitudeOk =
    Math.abs(magnitude - 13) < 1e-9;

  checks.push(
    magnitudeOk
      ? "3D vector magnitude"
      : "FAILED: 3D vector magnitude",
  );

  const scaleNear =
    perspectiveScale(100, 5);

  const scaleFar =
    perspectiveScale(100, 10);

  const perspectiveOk =
    Math.abs(scaleNear - 20) < 1e-9 &&
    Math.abs(scaleFar - 10) < 1e-9 &&
    scaleNear === 2 * scaleFar;

  checks.push(
    perspectiveOk
      ? "Inverse-depth perspective scaling"
      : "FAILED: Inverse-depth perspective scaling",
  );

  const worldProjection =
    projectWorldPoint(
      world,
      camera,
      intrinsics,
    );

  const pipelineOk =
    Math.abs(
      worldProjection.pixel.u - 620,
    ) < 1e-9 &&
    Math.abs(
      worldProjection.pixel.v - 440,
    ) < 1e-9;

  checks.push(
    pipelineOk
      ? "World → camera → normalized → pixel"
      : "FAILED: World → camera → normalized → pixel",
  );

  return {
    passed:
      cameraOk &&
      normalizedOk &&
      pixelOk &&
      rotationOk &&
      magnitudeOk &&
      perspectiveOk &&
      pipelineOk,
    checks,
  };
}
