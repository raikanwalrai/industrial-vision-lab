import { useMemo, useState } from "react";
import {
  cameraToNormalized,
  perspectiveScale,
  projectPinhole,
  vectorMagnitude,
  worldToCamera,
  type Point3D,
} from "../cameraMath";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fmt(value: number, digits = 3) {
  return value.toFixed(digits);
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
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function PointVisual({
  point,
  title,
  camera = false,
}: {
  point: Point3D;
  title: string;
  camera?: boolean;
}) {
  const width = 300;
  const height = 300;

  const scale = 22;
  const originX = 150;
  const originY = 225;

  const px = originX + point.x * scale;
  const py = originY - point.y * scale;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="s10-visual"
      role="img"
      aria-label={title}
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
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
        y1="25"
        x2={originX}
        y2="275"
        className="s10-axis"
      />

      <line
        x1={originX}
        y1={originY}
        x2={originX + 65}
        y2={originY - 65}
        className="s10-depthAxis"
      />

      <circle
        cx={originX}
        cy={originY}
        r="4"
        className="s10-origin"
      />

      <line
        x1={originX}
        y1={originY}
        x2={clamp(px, 25, 275)}
        y2={clamp(py, 25, 275)}
        className="s10-pointLine"
      />

      <circle
        cx={clamp(px, 25, 275)}
        cy={clamp(py, 25, 275)}
        r="8"
        className="s10-point"
      />

      <text x="260" y={originY - 8} className="s10-label">
        X
      </text>

      <text x={originX + 8} y="35" className="s10-label">
        Y
      </text>

      <text x={originX + 72} y={originY - 70} className="s10-label">
        Z
      </text>

      <text x="18" y="25" className="s10-title">
        {camera ? "CAMERA FRAME" : "WORLD FRAME"}
      </text>

      <text
        x={clamp(px + 10, 20, 225)}
        y={clamp(py - 10, 40, 280)}
        className="s10-pointLabel"
      >
        P
      </text>
    </svg>
  );
}

function ProjectionVisual({
  x,
  y,
  z,
  focalLength,
}: {
  x: number;
  y: number;
  z: number;
  focalLength: number;
}) {
  const projected = projectPinhole(
    { x, y, z },
    { fx: focalLength, fy: focalLength, cx: 0, cy: 0 },
    focalLength,
  );

  const imageX = 205 + projected.normalized.x * 22;
  const imageY = 150 - projected.normalized.y * 22;

  const pointX = 65 + (x / 8) * 80;
  const pointY = 150 - (y / 6) * 80;

  return (
    <svg
      viewBox="0 0 300 300"
      className="s10-visual"
      role="img"
      aria-label="Pinhole camera projection"
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
        x1="55"
        y1="35"
        x2="55"
        y2="265"
        className="s10-cameraPlane"
      />

      <line
        x1="205"
        y1="45"
        x2="205"
        y2="255"
        className="s10-imagePlane"
      />

      <circle
        cx="55"
        cy="150"
        r="7"
        className="s10-cameraCenter"
      />

      <circle
        cx={pointX}
        cy={pointY}
        r="8"
        className="s10-point"
      />

      <line
        x1="55"
        y1="150"
        x2={pointX}
        y2={pointY}
        className="s10-ray"
      />

      <line
        x1={pointX}
        y1={pointY}
        x2={imageX}
        y2={imageY}
        className="s10-raySecondary"
      />

      <circle
        cx={imageX}
        cy={imageY}
        r="7"
        className="s10-projectionPoint"
      />

      <text x="18" y="25" className="s10-title">
        PINHOLE PROJECTION
      </text>

      <text x="30" y="285" className="s10-label">
        camera
      </text>

      <text x="180" y="285" className="s10-label">
        image plane
      </text>

      <text x="70" y="140" className="s10-label">
        P(X,Y,Z)
      </text>

      <text x="210" y={clamp(imageY - 12, 30, 265)} className="s10-label">
        p
      </text>
    </svg>
  );
}

function DepthVisual({
  nearZ,
  farZ,
}: {
  nearZ: number;
  farZ: number;
}) {
  const nearScale = perspectiveScale(100, nearZ);
  const farScale = perspectiveScale(100, farZ);

  const nearSize = clamp(nearScale * 3.2, 24, 105);
  const farSize = clamp(farScale * 3.2, 14, 105);

  return (
    <svg
      viewBox="0 0 300 300"
      className="s10-visual"
      role="img"
      aria-label="Perspective depth comparison"
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
        x1="55"
        y1="35"
        x2="55"
        y2="265"
        className="s10-cameraPlane"
      />

      <line
        x1="55"
        y1="150"
        x2="270"
        y2="150"
        className="s10-axis"
      />

      <circle
        cx="55"
        cy="150"
        r="6"
        className="s10-cameraCenter"
      />

      <rect
        x={100 - nearSize / 2}
        y={150 - nearSize / 2}
        width={nearSize}
        height={nearSize}
        rx="5"
        className="s10-nearObject"
      />

      <rect
        x={230 - farSize / 2}
        y={150 - farSize / 2}
        width={farSize}
        height={farSize}
        rx="5"
        className="s10-farObject"
      />

      <text x="18" y="25" className="s10-title">
        DEPTH → IMAGE SIZE
      </text>

      <text x="78" y="275" className="s10-label">
        Z = {nearZ}
      </text>

      <text x="208" y="275" className="s10-label">
        Z = {farZ}
      </text>
    </svg>
  );
}

export default function Sprint10GroupAPage() {
  const [worldX, setWorldX] = useState(4);
  const [worldY, setWorldY] = useState(3);
  const [worldZ, setWorldZ] = useState(10);

  const [cameraX, setCameraX] = useState(1);
  const [cameraY, setCameraY] = useState(1);
  const [cameraZ, setCameraZ] = useState(2);

  const [projectionX, setProjectionX] = useState(4);
  const [projectionY, setProjectionY] = useState(3);
  const [projectionZ, setProjectionZ] = useState(8);
  const [focalLength, setFocalLength] = useState(100);

  const [nearZ, setNearZ] = useState(5);
  const farZ = 10;

  const worldPoint = useMemo(
    () => ({
      x: worldX,
      y: worldY,
      z: worldZ,
    }),
    [worldX, worldY, worldZ],
  );

  const cameraPoint = useMemo(
    () =>
      worldToCamera(worldPoint, {
        x: cameraX,
        y: cameraY,
        z: cameraZ,
      }),
    [worldPoint, cameraX, cameraY, cameraZ],
  );

  const worldDistance = vectorMagnitude(worldPoint);

  const projectionPoint = {
    x: projectionX,
    y: projectionY,
    z: projectionZ,
  };

  const normalized = cameraToNormalized(projectionPoint);

  const projection = projectPinhole(
    projectionPoint,
    {
      fx: focalLength,
      fy: focalLength,
      cx: 0,
      cy: 0,
    },
    focalLength,
  );

  const nearScale = perspectiveScale(100, nearZ);
  const farScale = perspectiveScale(100, farZ);

  return (
    <main className="s7-page s10-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">
          SPRINT 10 · GROUP A
        </div>

        <h1>
          Coordinate Systems + Pinhole Camera
        </h1>

        <p>
          Build the camera model step by step: first describe a point in 3D,
          then move into the camera frame, and finally project that point onto
          a 2D image.
        </p>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          LEARNING PROGRESSION
        </div>

        <div className="s7b-flow">
          <span>WORLD POINT</span>
          <b>→</b>
          <span>CAMERA FRAME</span>
          <b>→</b>
          <span>PROJECTION</span>
          <b>→</b>
          <span>DEPTH</span>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <PointVisual
            point={worldPoint}
            title="Interactive 3D world coordinate point"
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            A1 · WORLD COORDINATES
          </div>

          <h2>
            Where is the point in 3D?
          </h2>

          <p>
            A camera does not begin with pixels. It begins with points in
            physical 3D space. Move the point and watch its coordinates and
            distance from the origin change.
          </p>

          <div className="s10-controls">
            <Slider
              label="X"
              value={worldX}
              min={-5}
              max={8}
              step={1}
              onChange={setWorldX}
            />

            <Slider
              label="Y"
              value={worldY}
              min={-5}
              max={8}
              step={1}
              onChange={setWorldY}
            />

            <Slider
              label="Z"
              value={worldZ}
              min={2}
              max={15}
              step={1}
              onChange={setWorldZ}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Point</strong>
            <code>
              P = ({worldX}, {worldY}, {worldZ})
            </code>

            <strong>Distance from origin</strong>
            <code>
              |P| = √(X² + Y² + Z²) = {fmt(worldDistance)}
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>What to notice</strong>
            <span>
              The sliders change the actual point. The distance changes because
              the geometry changed—not because the page is displaying a new
              label.
            </span>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <PointVisual
            point={cameraPoint}
            camera
            title="World to camera coordinate transformation"
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            A2 · WORLD → CAMERA
          </div>

          <h2>
            What does the camera see?
          </h2>

          <p>
            The same physical point can be described relative to the camera.
            For this first experiment we use translation only, so the camera
            coordinate is the world point minus the camera position.
          </p>

          <div className="s10-controls">
            <Slider
              label="Camera X"
              value={cameraX}
              min={-4}
              max={4}
              step={1}
              onChange={setCameraX}
            />

            <Slider
              label="Camera Y"
              value={cameraY}
              min={-4}
              max={4}
              step={1}
              onChange={setCameraY}
            />

            <Slider
              label="Camera Z"
              value={cameraZ}
              min={-1}
              max={6}
              step={1}
              onChange={setCameraZ}
            />
          </div>

          <div className="s10-mathBox">
            <strong>World point</strong>
            <code>
              Pᵥ = ({worldX}, {worldY}, {worldZ})
            </code>

            <strong>Camera position</strong>
            <code>
              C = ({cameraX}, {cameraY}, {cameraZ})
            </code>

            <strong>Camera coordinates</strong>
            <code>
              P꜀ = Pᵥ − C = ({fmt(cameraPoint.x)},{" "}
              {fmt(cameraPoint.y)}, {fmt(cameraPoint.z)})
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>Industrial connection</strong>
            <span>
              A measurement system needs a consistent reference frame. Moving
              the camera changes the coordinates used to describe the same
              physical point.
            </span>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <ProjectionVisual
            x={projectionX}
            y={projectionY}
            z={projectionZ}
            focalLength={focalLength}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            A3 · PINHOLE PROJECTION
          </div>

          <h2>
            How does 3D become 2D?
          </h2>

          <p>
            The pinhole camera sends a ray from the camera center through the
            3D point until it reaches the image plane.
          </p>

          <div className="s10-controls">
            <Slider
              label="X"
              value={projectionX}
              min={-6}
              max={6}
              step={1}
              onChange={setProjectionX}
            />

            <Slider
              label="Y"
              value={projectionY}
              min={-5}
              max={5}
              step={1}
              onChange={setProjectionY}
            />

            <Slider
              label="Z"
              value={projectionZ}
              min={2}
              max={15}
              step={1}
              onChange={setProjectionZ}
            />

            <Slider
              label="f"
              value={focalLength}
              min={50}
              max={160}
              step={10}
              onChange={setFocalLength}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Normalized coordinates</strong>
            <code>
              xₙ = X/Z = {fmt(normalized.x)}
            </code>
            <code>
              yₙ = Y/Z = {fmt(normalized.y)}
            </code>

            <strong>Image coordinates</strong>
            <code>
              x = fX/Z = {fmt(projection.normalized.x)}
            </code>
            <code>
              y = fY/Z = {fmt(projection.normalized.y)}
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>Key idea</strong>
            <span>
              Z appears in the denominator. That single division is the source
              of perspective: farther points occupy less image space.
            </span>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <DepthVisual
            nearZ={nearZ}
            farZ={farZ}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            A4 · PERSPECTIVE + DEPTH
          </div>

          <h2>
            Why does distance change apparent size?
          </h2>

          <p>
            Keep the same focal length and physical object size, then move the
            object farther from the camera. Its projected size follows the
            inverse-depth relationship.
          </p>

          <div className="s10-controls">
            <Slider
              label="Near object Z"
              value={nearZ}
              min={2}
              max={9}
              step={1}
              onChange={setNearZ}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Perspective scale</strong>
            <code>
              s = f/Z
            </code>

            <code>
              Near: 100/{nearZ} = {fmt(nearScale)}
            </code>

            <code>
              Far: 100/{farZ} = {fmt(farScale)}
            </code>

            <strong>Scale ratio</strong>
            <code>
              near / far = {fmt(nearScale / farScale)}
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>Industrial connection</strong>
            <span>
              A camera-based measurement system must account for depth. The
              same physical feature can occupy very different numbers of
              pixels when its distance from the camera changes.
            </span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          GROUP A KEY MESSAGE
        </div>

        <h2>
          A camera is a mathematical mapping
        </h2>

        <div className="s10-summaryFlow">
          <span>3D WORLD POINT</span>
          <b>→</b>
          <span>CAMERA COORDINATES</span>
          <b>→</b>
          <span>NORMALIZED COORDINATES</span>
          <b>→</b>
          <span>2D IMAGE POINT</span>
        </div>

        <p className="s10-summaryText">
          Group A establishes the geometric foundation. Group B will add the
          camera's intrinsic parameters and connect normalized coordinates to
          actual pixel coordinates.
        </p>
      </section>
    </main>
  );
}
