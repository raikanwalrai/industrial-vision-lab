import { useMemo, useState } from "react";
import {
  applyExtrinsics,
  cameraPositionToTranslation,
  identityRotation,
  projectWorldWithExtrinsics,
} from "../cameraExtrinsicsMath";
import {
  makeRotationZ,
  multiplyRotation,
  type Point3D,
} from "../cameraMath";

function fmt(value: number, digits = 3) {
  return value.toFixed(digits);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="s10-control">
      <span>
        {label}
        <strong>{value}</strong>
      </span>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
      />
    </label>
  );
}

function TranslationVisual({
  point,
  camera,
}: {
  point: Point3D;
  camera: Point3D;
}) {
  const worldX = 150 + point.x * 15;
  const worldY = 210 - point.y * 15;

  const cameraX = 150 + camera.x * 15;
  const cameraY = 210 - camera.y * 15;

  return (
    <svg
      viewBox="0 0 300 300"
      className="s10-visual"
      role="img"
      aria-label="Camera translation"
    >
      <rect
        x="0"
        y="0"
        width="300"
        height="300"
        rx="12"
        className="s10-svgBackground"
      />

      <line
        x1="25"
        y1="210"
        x2="275"
        y2="210"
        className="s10-axis"
      />

      <line
        x1="150"
        y1="35"
        x2="150"
        y2="270"
        className="s10-axis"
      />

      <line
        x1={clamp(cameraX, 25, 275)}
        y1={clamp(cameraY, 35, 270)}
        x2={clamp(worldX, 25, 275)}
        y2={clamp(worldY, 35, 270)}
        className="s10-raySecondary"
      />

      <circle
        cx={clamp(cameraX, 25, 275)}
        cy={clamp(cameraY, 35, 270)}
        r="8"
        className="s10-cameraCenter"
      />

      <circle
        cx={clamp(worldX, 25, 275)}
        cy={clamp(worldY, 35, 270)}
        r="8"
        className="s10-point"
      />

      <text x="18" y="25" className="s10-title">
        CAMERA TRANSLATION
      </text>

      <text
        x={clamp(worldX + 10, 20, 250)}
        y={clamp(worldY - 12, 45, 275)}
        className="s10-pointLabel"
      >
        Pᵂ
      </text>

      <text
        x={clamp(cameraX + 10, 20, 250)}
        y={clamp(cameraY + 24, 45, 280)}
        className="s10-label"
      >
        C
      </text>

      <text x="28" y="282" className="s10-label">
        world point − camera position
      </text>
    </svg>
  );
}

function RotationVisual({
  point,
  angle,
}: {
  point: Point3D;
  angle: number;
}) {
  const rotation = makeRotationZ(angle);
  const rotated = multiplyRotation(rotation, point);

  const originX = 150;
  const originY = 190;
  const scale = 22;

  const originalX = originX + point.x * scale;
  const originalY = originY - point.y * scale;

  const rotatedX = originX + rotated.x * scale;
  const rotatedY = originY - rotated.y * scale;

  return (
    <svg
      viewBox="0 0 300 300"
      className="s10-visual"
      role="img"
      aria-label="Camera rotation"
    >
      <rect
        x="0"
        y="0"
        width="300"
        height="300"
        rx="12"
        className="s10-svgBackground"
      />

      <line
        x1="25"
        y1={originY}
        x2="275"
        y2={originY}
        className="s10-axis"
      />

      <line
        x1={originX}
        y1="40"
        x2={originX}
        y2="270"
        className="s10-axis"
      />

      <line
        x1={originX}
        y1={originY}
        x2={clamp(originalX, 25, 275)}
        y2={clamp(originalY, 40, 270)}
        className="s10-raySecondary"
      />

      <line
        x1={originX}
        y1={originY}
        x2={clamp(rotatedX, 25, 275)}
        y2={clamp(rotatedY, 40, 270)}
        className="s10-ray"
      />

      <circle
        cx={clamp(originalX, 25, 275)}
        cy={clamp(originalY, 40, 270)}
        r="7"
        className="s10-point"
      />

      <circle
        cx={clamp(rotatedX, 25, 275)}
        cy={clamp(rotatedY, 40, 270)}
        r="8"
        className="s10-projectionPoint"
      />

      <text x="18" y="25" className="s10-title">
        ROTATION Rz(θ)
      </text>

      <text x="35" y="280" className="s10-label">
        original
      </text>

      <text x="205" y="280" className="s10-label">
        rotated
      </text>
    </svg>
  );
}

function ExtrinsicVisual({
  point,
  angle,
  camera,
}: {
  point: Point3D;
  angle: number;
  camera: Point3D;
}) {
  const rotation = makeRotationZ(angle);
  const translation = cameraPositionToTranslation(
    camera,
    rotation,
  );

  const result = applyExtrinsics(
    point,
    rotation,
    translation,
  );

  const worldX = 80 + point.x * 15;
  const worldY = 215 - point.y * 15;

  const cameraX =
    210 + result.cameraPoint.x * 15;
  const cameraY =
    215 - result.cameraPoint.y * 15;

  return (
    <svg
      viewBox="0 0 300 300"
      className="s10-visual"
      role="img"
      aria-label="Extrinsic transformation"
    >
      <rect
        x="0"
        y="0"
        width="300"
        height="300"
        rx="12"
        className="s10-svgBackground"
      />

      <line
        x1="150"
        y1="45"
        x2="150"
        y2="260"
        className="s10-divider"
      />

      <line
        x1="25"
        y1="215"
        x2="135"
        y2="215"
        className="s10-axis"
      />

      <line
        x1="165"
        y1="215"
        x2="275"
        y2="215"
        className="s10-axis"
      />

      <circle
        cx={clamp(worldX, 25, 135)}
        cy={clamp(worldY, 45, 260)}
        r="8"
        className="s10-point"
      />

      <circle
        cx={clamp(cameraX, 165, 275)}
        cy={clamp(cameraY, 45, 260)}
        r="8"
        className="s10-projectionPoint"
      />

      <line
        x1={clamp(worldX, 25, 135)}
        y1={clamp(worldY, 45, 260)}
        x2={clamp(cameraX, 165, 275)}
        y2={clamp(cameraY, 45, 260)}
        className="s10-raySecondary"
      />

      <text x="18" y="25" className="s10-title">
        EXTRINSIC TRANSFORM
      </text>

      <text x="35" y="55" className="s10-label">
        WORLD
      </text>

      <text x="205" y="55" className="s10-label">
        CAMERA
      </text>

      <text x="18" y="280" className="s10-label">
        R
      </text>

      <text x="82" y="280" className="s10-label">
        +
      </text>

      <text x="108" y="280" className="s10-label">
        t
      </text>
    </svg>
  );
}

function FullPipelineVisual({
  point,
  angle,
  camera,
}: {
  point: Point3D;
  angle: number;
  camera: Point3D;
}) {
  const rotation = makeRotationZ(angle);

  const translation = cameraPositionToTranslation(
    camera,
    rotation,
  );

  const projection = projectWorldWithExtrinsics(
    point,
    rotation,
    translation,
    {
      fx: 800,
      fy: 800,
      cx: 320,
      cy: 240,
    },
  );

  const pointX = 65 + point.x * 9;
  const pointY = 150 - point.y * 9;

  const pixelX =
    205 + (projection.pixel.u - 320) * 0.12;

  const pixelY =
    150 - (projection.pixel.v - 240) * 0.12;

  return (
    <svg
      viewBox="0 0 300 300"
      className="s10-visual"
      role="img"
      aria-label="Full camera projection pipeline"
    >
      <rect
        x="0"
        y="0"
        width="300"
        height="300"
        rx="12"
        className="s10-svgBackground"
      />

      <line
        x1="105"
        y1="45"
        x2="105"
        y2="255"
        className="s10-cameraPlane"
      />

      <line
        x1="205"
        y1="55"
        x2="205"
        y2="245"
        className="s10-imagePlane"
      />

      <circle
        cx="105"
        cy="150"
        r="6"
        className="s10-cameraCenter"
      />

      <circle
        cx={clamp(pointX, 25, 95)}
        cy={clamp(pointY, 55, 245)}
        r="8"
        className="s10-point"
      />

      <line
        x1="105"
        y1="150"
        x2={clamp(pointX, 25, 95)}
        y2={clamp(pointY, 55, 245)}
        className="s10-raySecondary"
      />

      <line
        x1="105"
        y1="150"
        x2={clamp(pixelX, 205, 290)}
        y2={clamp(pixelY, 55, 245)}
        className="s10-ray"
      />

      <circle
        cx={clamp(pixelX, 205, 290)}
        cy={clamp(pixelY, 55, 245)}
        r="8"
        className="s10-projectionPoint"
      />

      <text x="18" y="25" className="s10-title">
        FULL CAMERA MODEL
      </text>

      <text x="35" y="275" className="s10-label">
        WORLD
      </text>

      <text x="88" y="275" className="s10-label">
        [R|t]
      </text>

      <text x="155" y="275" className="s10-label">
        /Z
      </text>

      <text x="225" y="275" className="s10-label">
        K → pixel
      </text>
    </svg>
  );
}

export default function Sprint10GroupCPage() {
  const [translationX, setTranslationX] = useState(1);
  const [translationY, setTranslationY] = useState(1);
  const [translationZ, setTranslationZ] = useState(2);

  const [c2RotationAngle, setC2RotationAngle] =
    useState(0);

  const [c3RotationAngle, setC3RotationAngle] =
    useState(0);

  const [extrinsicX, setExtrinsicX] = useState(1);
  const [extrinsicY, setExtrinsicY] = useState(1);
  const [extrinsicZ, setExtrinsicZ] = useState(2);

  const [c4RotationAngle, setC4RotationAngle] =
    useState(0);

  const [c4CameraX, setC4CameraX] = useState(1);
  const [c4CameraY, setC4CameraY] = useState(1);
  const [c4CameraZ, setC4CameraZ] = useState(2);

  const [pipelineX, setPipelineX] = useState(4);
  const [pipelineY, setPipelineY] = useState(3);
  const [pipelineZ, setPipelineZ] = useState(10);

  const cameraPosition = useMemo(
    () => ({
      x: translationX,
      y: translationY,
      z: translationZ,
    }),
    [translationX, translationY, translationZ],
  );

  const worldPoint = {
    x: 4,
    y: 3,
    z: 10,
  };

  const translatedPoint = useMemo(
    () => ({
      x: worldPoint.x - cameraPosition.x,
      y: worldPoint.y - cameraPosition.y,
      z: worldPoint.z - cameraPosition.z,
    }),
    [cameraPosition],
  );

  const c2Rotation = useMemo(
    () => makeRotationZ(c2RotationAngle),
    [c2RotationAngle],
  );

  const c3Rotation = useMemo(
    () => makeRotationZ(c3RotationAngle),
    [c3RotationAngle],
  );

  const c4Rotation = useMemo(
    () => makeRotationZ(c4RotationAngle),
    [c4RotationAngle],
  );

  const rotationPoint = {
    x: 2,
    y: 1,
    z: 5,
  };

  const rotatedPoint = useMemo(
    () =>
      multiplyRotation(
        c2Rotation,
        rotationPoint,
      ),
    [c2Rotation],
  );

  const extrinsicPoint = {
    x: 4,
    y: 3,
    z: 10,
  };

  const extrinsicCamera = {
    x: extrinsicX,
    y: extrinsicY,
    z: extrinsicZ,
  };

  const extrinsicTranslation =
    cameraPositionToTranslation(
      extrinsicCamera,
      c3Rotation,
    );

  const extrinsicResult = applyExtrinsics(
    extrinsicPoint,
    c3Rotation,
    extrinsicTranslation,
  );

  const pipelinePoint = {
    x: pipelineX,
    y: pipelineY,
    z: pipelineZ,
  };

  const c4CameraPosition = useMemo(
    () => ({
      x: c4CameraX,
      y: c4CameraY,
      z: c4CameraZ,
    }),
    [c4CameraX, c4CameraY, c4CameraZ],
  );

  const pipelineTranslation =
    cameraPositionToTranslation(
      c4CameraPosition,
      c4Rotation,
    );

  const fullProjection =
    projectWorldWithExtrinsics(
      pipelinePoint,
      c4Rotation,
      pipelineTranslation,
      {
        fx: 800,
        fy: 800,
        cx: 320,
        cy: 240,
      },
    );

  return (
    <main className="s7-page s10-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">
          SPRINT 10 · GROUP C
        </div>

        <h1>
          Extrinsics + Full Camera Model
        </h1>

        <p>
          Add camera position and orientation to the
          intrinsic model. Build the complete
          world-to-camera-to-pixel pipeline step by
          step.
        </p>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          LEARNING PROGRESSION
        </div>

        <div className="s7b-flow">
          <span>WORLD POINT</span>
          <b>→</b>
          <span>TRANSLATION</span>
          <b>→</b>
          <span>ROTATION</span>
          <b>→</b>
          <span>[R|t]</span>
          <b>→</b>
          <span>K → PIXEL</span>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <TranslationVisual
            point={worldPoint}
            camera={cameraPosition}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            C1 · CAMERA TRANSLATION
          </div>

          <h2>
            Move the camera and watch the point in
            camera coordinates
          </h2>

          <p>
            If the camera axes remain parallel to the
            world axes, moving the camera changes the
            point relative to the camera by subtraction.
          </p>

          <div className="s10-controls">
            <Slider
              label="Cₓ"
              value={translationX}
              min={-2}
              max={4}
              step={1}
              onChange={setTranslationX}
            />

            <Slider
              label="Cᵧ"
              value={translationY}
              min={-2}
              max={4}
              step={1}
              onChange={setTranslationY}
            />

            <Slider
              label="Cᵤ"
              value={translationZ}
              min={0}
              max={5}
              step={1}
              onChange={setTranslationZ}
            />
          </div>

          <div className="s10-mathBox">
            <strong>World point</strong>

            <code>
              Pᵂ = ({worldPoint.x},{worldPoint.y},{worldPoint.z})
            </code>

            <strong>Camera position</strong>

            <code>
              C = ({cameraPosition.x},{cameraPosition.y},{cameraPosition.z})
            </code>

            <strong>Camera coordinates</strong>

            <code>
              Pᶜ = Pᵂ − C
            </code>

            <code>
              = ({worldPoint.x}−{cameraPosition.x},{" "}
              {worldPoint.y}−{cameraPosition.y},{" "}
              {worldPoint.z}−{cameraPosition.z})
            </code>

            <code>
              = ({fmt(translatedPoint.x)},{" "}
              {fmt(translatedPoint.y)},{" "}
              {fmt(translatedPoint.z)})
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>Key idea</strong>

            <span>
              The same physical point has different
              coordinates depending on where the camera
              is located.
            </span>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <RotationVisual
            point={rotationPoint}
            angle={c2RotationAngle}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            C2 · CAMERA ROTATION
          </div>

          <h2>
            Rotate the camera coordinate frame
          </h2>

          <p>
            Translation changes where the camera is.
            Rotation changes how its coordinate axes are
            oriented.
          </p>

          <div className="s10-controls">
            <Slider
              label="θ"
              value={c2RotationAngle}
              min={-180}
              max={180}
              step={15}
              onChange={setC2RotationAngle}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Rotation matrix</strong>

            <code>
              Rz(θ) = [ cosθ  −sinθ  0 ]
            </code>

            <code>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ sinθ &nbsp;cosθ  0 ]
            </code>

            <code>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ 0 &nbsp;&nbsp;&nbsp;&nbsp;0 &nbsp;&nbsp;&nbsp;1 ]
            </code>

            <strong>Current angle</strong>

            <code>
              θ = {c2RotationAngle}°
            </code>

            <strong>Rotated point</strong>

            <code>
              R Pᵂ = (
              {fmt(rotatedPoint.x)},
              {fmt(rotatedPoint.y)},
              {fmt(rotatedPoint.z)}
              )
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>What changes?</strong>

            <span>
              Rotation mixes the X and Y coordinates while
              preserving Z for a rotation around the Z-axis.
            </span>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <ExtrinsicVisual
            point={extrinsicPoint}
            angle={c3RotationAngle}
            camera={extrinsicCamera}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            C3 · EXTRINSIC PARAMETERS
          </div>

          <h2>
            Combine rotation and translation
          </h2>

          <p>
            The extrinsic parameters describe how a world
            point is transformed into the camera frame.
            We use the explicit convention:
          </p>

          <div className="s10-mathBox">
            <strong>
              World → camera
            </strong>

            <code>
              Pᶜ = R Pᵂ + t
            </code>

            <strong>
              Translation from camera position
            </strong>

            <code>
              t = −R C
            </code>

            <strong>
              Therefore
            </strong>

            <code>
              Pᶜ = R Pᵂ − R C
            </code>
          </div>

          <div className="s10-controls">
            <Slider
              label="θ"
              value={c3RotationAngle}
              min={-180}
              max={180}
              step={15}
              onChange={setC3RotationAngle}
            />

            <Slider
              label="Cₓ"
              value={extrinsicX}
              min={-2}
              max={4}
              step={1}
              onChange={setExtrinsicX}
            />

            <Slider
              label="Cᵧ"
              value={extrinsicY}
              min={-2}
              max={4}
              step={1}
              onChange={setExtrinsicY}
            />

            <Slider
              label="C_z"
              value={extrinsicZ}
              min={0}
              max={5}
              step={1}
              onChange={setExtrinsicZ}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Current translation vector</strong>

            <code>
              t = (
              {fmt(extrinsicTranslation.x)},
              {fmt(extrinsicTranslation.y)},
              {fmt(extrinsicTranslation.z)}
              )
            </code>

            <strong>
              Rotated world point
            </strong>

            <code>
              R Pᵂ = (
              {fmt(extrinsicResult.rotated.x)},
              {fmt(extrinsicResult.rotated.y)},
              {fmt(extrinsicResult.rotated.z)}
              )
            </code>

            <strong>
              Camera point
            </strong>

            <code>
              Pᶜ = (
              {fmt(extrinsicResult.cameraPoint.x)},
              {fmt(extrinsicResult.cameraPoint.y)},
              {fmt(extrinsicResult.cameraPoint.z)}
              )
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>Important convention</strong>

            <span>
              C is the camera position in world
              coordinates. t is the translation used by
              the world-to-camera equation. They are not
              generally the same vector.
            </span>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <FullPipelineVisual
            point={pipelinePoint}
            angle={c4RotationAngle}
            camera={c4CameraPosition}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            C4 · FULL CAMERA MODEL
          </div>

          <h2>
            From a 3D world point to an image pixel
          </h2>

          <p>
            This connects Groups A, B, and C. First use
            the extrinsics to express the point in the
            camera frame. Then divide by depth and apply
            the intrinsic matrix.
          </p>

          <div className="s10-controls">
            <Slider
              label="θ"
              value={c4RotationAngle}
              min={-180}
              max={180}
              step={15}
              onChange={setC4RotationAngle}
            />

            <Slider
              label="Cₓ"
              value={c4CameraX}
              min={-2}
              max={4}
              step={1}
              onChange={setC4CameraX}
            />

            <Slider
              label="Cᵧ"
              value={c4CameraY}
              min={-2}
              max={4}
              step={1}
              onChange={setC4CameraY}
            />

            <Slider
              label="C_z"
              value={c4CameraZ}
              min={0}
              max={5}
              step={1}
              onChange={setC4CameraZ}
            />

            <Slider
              label="Xᵂ"
              value={pipelineX}
              min={1}
              max={8}
              step={1}
              onChange={setPipelineX}
            />

            <Slider
              label="Yᵂ"
              value={pipelineY}
              min={1}
              max={7}
              step={1}
              onChange={setPipelineY}
            />

            <Slider
              label="Zᵂ"
              value={pipelineZ}
              min={5}
              max={15}
              step={1}
              onChange={setPipelineZ}
            />
          </div>

          <div className="s10-mathBox">
            <strong>
              1. World point
            </strong>

            <code>
              Pᵂ = (
              {pipelinePoint.x},
              {pipelinePoint.y},
              {pipelinePoint.z}
              )
            </code>

            <strong>
              2. Extrinsic transformation
            </strong>

            <code>
              Pᶜ = R Pᵂ + t
            </code>

            <code>
              = (
              {fmt(fullProjection.cameraPoint.x)},
              {fmt(fullProjection.cameraPoint.y)},
              {fmt(fullProjection.cameraPoint.z)}
              )
            </code>

            <strong>
              3. Perspective normalization
            </strong>

            <code>
              xₙ = Xᶜ/Zᶜ ={" "}
              {fmt(fullProjection.normalized.x)}
            </code>

            <code>
              yₙ = Yᶜ/Zᶜ ={" "}
              {fmt(fullProjection.normalized.y)}
            </code>

            <strong>
              4. Intrinsic projection
            </strong>

            <code>
              u = 800xₙ + 320 ={" "}
              {fmt(fullProjection.pixel.u)}
            </code>

            <code>
              v = 800yₙ + 240 ={" "}
              {fmt(fullProjection.pixel.v)}
            </code>
          </div>

          <div className="s10-mathBox">
            <strong>
              Complete camera equation
            </strong>

            <code>
              x ∼ K[R|t]X
            </code>

            <code>
              World → Extrinsics → Camera → /Z → K → Pixel
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>
              Industrial connection
            </strong>

            <span>
              A calibrated inspection camera needs both
              intrinsic parameters and camera pose. Together
              they allow 3D scene geometry to be related to
              measured image pixels.
            </span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          GROUP C KEY MESSAGE
        </div>

        <h2>
          Extrinsics describe where the camera is and how
          it is oriented
        </h2>

        <div className="s10-summaryFlow">
          <span>WORLD</span>
          <b>→</b>
          <span>R,t</span>
          <b>→</b>
          <span>CAMERA</span>
          <b>→</b>
          <span>K</span>
          <b>→</b>
          <span>PIXEL</span>
        </div>

        <p className="s10-summaryText">
          Groups A and B established the coordinate and
          intrinsic models. Group C adds camera pose and
          combines them into the complete projection model.
          Group D will introduce lens distortion and
          calibration error.
        </p>
      </section>
    </main>
  );
}
