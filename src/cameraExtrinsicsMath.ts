import {
  makeRotationZ,
  multiplyRotation,
  type Point2D,
  type Point3D,
  type RotationMatrix3x3,
} from "./cameraMath";
import {
  normalizedToPixelWithIntrinsics,
  type IntrinsicParameters,
} from "./cameraIntrinsicsMath";

export type TranslationVector = Point3D;

export type ExtrinsicResult = {
  rotated: Point3D;
  cameraPoint: Point3D;
};

export type FullProjectionResult = {
  cameraPoint: Point3D;
  normalized: {
    x: number;
    y: number;
  };
  pixel: Point2D;
  valid: boolean;
};

export function identityRotation(): RotationMatrix3x3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

/**
 * Camera position C is a position in world coordinates.
 *
 * For the world-to-camera convention
 *
 *     Pc = R Pw + t
 *
 * the translation is
 *
 *     t = -R C
 */
export function cameraPositionToTranslation(
  cameraPosition: Point3D,
  rotation: RotationMatrix3x3,
): TranslationVector {
  const rotatedCameraPosition = multiplyRotation(
    rotation,
    cameraPosition,
  );

  return {
    x: -rotatedCameraPosition.x,
    y: -rotatedCameraPosition.y,
    z: -rotatedCameraPosition.z,
  };
}

/**
 * Apply the world-to-camera extrinsic transformation:
 *
 *     Pc = R Pw + t
 */
export function applyExtrinsics(
  worldPoint: Point3D,
  rotation: RotationMatrix3x3,
  translation: TranslationVector,
): ExtrinsicResult {
  const rotated = multiplyRotation(
    rotation,
    worldPoint,
  );

  const cameraPoint = {
    x: rotated.x + translation.x,
    y: rotated.y + translation.y,
    z: rotated.z + translation.z,
  };

  return {
    rotated,
    cameraPoint,
  };
}

/**
 * Apply only a camera translation when the camera axes
 * are parallel to the world axes:
 *
 *     Pc = Pw - C
 */
export function translateToCameraFrame(
  worldPoint: Point3D,
  cameraPosition: Point3D,
): Point3D {
  return {
    x: worldPoint.x - cameraPosition.x,
    y: worldPoint.y - cameraPosition.y,
    z: worldPoint.z - cameraPosition.z,
  };
}

export function projectWorldWithExtrinsics(
  worldPoint: Point3D,
  rotation: RotationMatrix3x3,
  translation: TranslationVector,
  intrinsics: IntrinsicParameters,
): FullProjectionResult {
  const { cameraPoint } = applyExtrinsics(
    worldPoint,
    rotation,
    translation,
  );

  if (cameraPoint.z <= 0) {
    return {
      cameraPoint,
      normalized: {
        x: 0,
        y: 0,
      },
      pixel: {
        u: 0,
        v: 0,
      },
      valid: false,
    };
  }

  const normalized = {
    x: cameraPoint.x / cameraPoint.z,
    y: cameraPoint.y / cameraPoint.z,
  };

  const pixel = normalizedToPixelWithIntrinsics(
    normalized,
    intrinsics,
  );

  return {
    cameraPoint,
    normalized,
    pixel,
    valid: true,
  };
}

export function verifyExtrinsicMath(): {
  passed: boolean;
  checks: string[];
} {
  const checks: string[] = [];

  /*
   * C1 — Translation
   *
   * Pw = (4,3,10)
   * C  = (1,1,2)
   *
   * Pc = Pw - C
   *    = (3,2,8)
   */
  const worldPoint = {
    x: 4,
    y: 3,
    z: 10,
  };

  const cameraPosition = {
    x: 1,
    y: 1,
    z: 2,
  };

  const translated = translateToCameraFrame(
    worldPoint,
    cameraPosition,
  );

  const translationOk =
    Math.abs(translated.x - 3) < 1e-9 &&
    Math.abs(translated.y - 2) < 1e-9 &&
    Math.abs(translated.z - 8) < 1e-9;

  checks.push(
    translationOk
      ? "Camera translation"
      : "FAILED: Camera translation",
  );

  /*
   * C2 — Rotation
   *
   * Rotate (1,0,0) by +90 degrees around Z:
   *
   *     (1,0,0) -> (0,1,0)
   */
  const rotation90 = makeRotationZ(90);

  const rotated = multiplyRotation(
    rotation90,
    { x: 1, y: 0, z: 0 },
  );

  const rotationOk =
    Math.abs(rotated.x) < 1e-9 &&
    Math.abs(rotated.y - 1) < 1e-9 &&
    Math.abs(rotated.z) < 1e-9;

  checks.push(
    rotationOk
      ? "Camera rotation"
      : "FAILED: Camera rotation",
  );

  /*
   * C3 — Extrinsic transformation
   *
   * With R = I and C = (1,1,2):
   *
   *     t = -R C
   *       = (-1,-1,-2)
   *
   *     Pc = R Pw + t
   *        = (4,3,10) + (-1,-1,-2)
   *        = (3,2,8)
   */
  const identity = identityRotation();

  const translation = cameraPositionToTranslation(
    cameraPosition,
    identity,
  );

  const extrinsic = applyExtrinsics(
    worldPoint,
    identity,
    translation,
  );

  const extrinsicOk =
    Math.abs(translation.x + 1) < 1e-9 &&
    Math.abs(translation.y + 1) < 1e-9 &&
    Math.abs(translation.z + 2) < 1e-9 &&
    Math.abs(extrinsic.cameraPoint.x - 3) < 1e-9 &&
    Math.abs(extrinsic.cameraPoint.y - 2) < 1e-9 &&
    Math.abs(extrinsic.cameraPoint.z - 8) < 1e-9;

  checks.push(
    extrinsicOk
      ? "Extrinsic R,t transformation"
      : "FAILED: Extrinsic R,t transformation",
  );

  /*
   * C4 — Full camera model
   *
   * Pc = (3,2,8)
   *
   * normalized:
   *
   *     xn = 3/8 = 0.375
   *     yn = 2/8 = 0.25
   *
   * K =
   *
   *     [800  0 320]
   *     [  0 800 240]
   *     [  0  0   1]
   *
   * therefore:
   *
   *     u = 800(0.375) + 320 = 620
   *     v = 800(0.25)  + 240 = 440
   */
  const intrinsics = {
    fx: 800,
    fy: 800,
    cx: 320,
    cy: 240,
  };

  const fullProjection =
    projectWorldWithExtrinsics(
      worldPoint,
      identity,
      translation,
      intrinsics,
    );

  const fullProjectionOk =
    fullProjection.valid &&
    Math.abs(fullProjection.cameraPoint.x - 3) < 1e-9 &&
    Math.abs(fullProjection.cameraPoint.y - 2) < 1e-9 &&
    Math.abs(fullProjection.cameraPoint.z - 8) < 1e-9 &&
    Math.abs(fullProjection.normalized.x - 0.375) < 1e-9 &&
    Math.abs(fullProjection.normalized.y - 0.25) < 1e-9 &&
    Math.abs(fullProjection.pixel.u - 620) < 1e-9 &&
    Math.abs(fullProjection.pixel.v - 440) < 1e-9;

  checks.push(
    fullProjectionOk
      ? "Full K[R|t] projection pipeline"
      : "FAILED: Full K[R|t] projection pipeline",
  );

  /*
   * Additional rotated-camera check.
   *
   * Pw = (2,0,5)
   * Rz(90)Pw = (0,2,5)
   * t = (0,0,0)
   *
   * This confirms that rotation is applied before translation.
   */
  const rotatedPoint = applyExtrinsics(
    { x: 2, y: 0, z: 5 },
    rotation90,
    { x: 0, y: 0, z: 0 },
  );

  const rotatedPipelineOk =
    Math.abs(rotatedPoint.cameraPoint.x) < 1e-9 &&
    Math.abs(rotatedPoint.cameraPoint.y - 2) < 1e-9 &&
    Math.abs(rotatedPoint.cameraPoint.z - 5) < 1e-9;

  checks.push(
    rotatedPipelineOk
      ? "Rotation before translation"
      : "FAILED: Rotation before translation",
  );

  return {
    passed:
      translationOk &&
      rotationOk &&
      extrinsicOk &&
      fullProjectionOk &&
      rotatedPipelineOk,
    checks,
  };
}
