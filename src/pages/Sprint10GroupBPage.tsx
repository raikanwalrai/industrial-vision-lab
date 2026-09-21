import { useMemo, useState } from "react";
import {
  makeIntrinsicMatrix,
  normalizedToPixelWithIntrinsics,
  projectWithIntrinsics,
} from "../cameraIntrinsicsMath";

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

function PixelPlaneVisual({
  normalizedX,
  normalizedY,
  fx,
  fy,
  cx,
  cy,
  title,
}: {
  normalizedX: number;
  normalizedY: number;
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  title: string;
}) {
  const pixel = normalizedToPixelWithIntrinsics(
    {
      x: normalizedX,
      y: normalizedY,
    },
    {
      fx,
      fy,
      cx,
      cy,
    },
  );

  const scale = 0.32;

  const pointX = 150 + (pixel.u - 320) * scale;
  const pointY = 150 - (pixel.v - 240) * scale;

  const principalX = 150 + (cx - 320) * scale;
  const principalY = 150 - (cy - 240) * scale;

  return (
    <svg
      viewBox="0 0 300 300"
      className="s10-visual"
      role="img"
      aria-label={title}
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
        y1="150"
        x2="275"
        y2="150"
        className="s10-axis"
      />

      <line
        x1="150"
        y1="35"
        x2="150"
        y2="265"
        className="s10-axis"
      />

      <circle
        cx={clamp(principalX, 25, 275)}
        cy={clamp(principalY, 35, 265)}
        r="6"
        className="s10-cameraCenter"
      />

      <line
        x1={clamp(principalX, 25, 275)}
        y1={clamp(principalY, 35, 265)}
        x2={clamp(pointX, 25, 275)}
        y2={clamp(pointY, 35, 265)}
        className="s10-pointLine"
      />

      <circle
        cx={clamp(pointX, 25, 275)}
        cy={clamp(pointY, 35, 275)}
        r="8"
        className="s10-projectionPoint"
      />

      <text x="18" y="25" className="s10-title">
        PIXEL IMAGE PLANE
      </text>

      <text x="155" y="143" className="s10-label">
        principal point
      </text>

      <text
        x={clamp(pointX + 10, 20, 250)}
        y={clamp(pointY - 10, 40, 275)}
        className="s10-pointLabel"
      >
        (u,v)
      </text>

      <text x="258" y="143" className="s10-label">
        u
      </text>

      <text x="157" y="45" className="s10-label">
        v
      </text>
    </svg>
  );
}

function MatrixVisual({
  fx,
  fy,
  cx,
  cy,
}: {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
}) {
  const matrix = makeIntrinsicMatrix({
    fx,
    fy,
    cx,
    cy,
  });

  return (
    <svg
      viewBox="0 0 300 300"
      className="s10-visual"
      role="img"
      aria-label="Intrinsic camera matrix"
    >
      <rect
        x="0"
        y="0"
        width="300"
        height="300"
        rx="12"
        className="s10-svgBackground"
      />

      <text x="18" y="28" className="s10-title">
        INTRINSIC MATRIX K
      </text>

      <text x="30" y="90" className="s10-matrixBracket">
        [
      </text>

      <text x="245" y="90" className="s10-matrixBracket">
        ]
      </text>

      <text x="62" y="90" className="s10-matrixValue">
        {matrix[0][0]}
      </text>

      <text x="135" y="90" className="s10-matrixValue">
        {matrix[0][1]}
      </text>

      <text x="195" y="90" className="s10-matrixValue">
        {matrix[0][2]}
      </text>

      <text x="62" y="145" className="s10-matrixValue">
        {matrix[1][0]}
      </text>

      <text x="135" y="145" className="s10-matrixValue">
        {matrix[1][1]}
      </text>

      <text x="195" y="145" className="s10-matrixValue">
        {matrix[1][2]}
      </text>

      <text x="62" y="200" className="s10-matrixValue">
        {matrix[2][0]}
      </text>

      <text x="135" y="200" className="s10-matrixValue">
        {matrix[2][1]}
      </text>

      <text x="195" y="200" className="s10-matrixValue">
        {matrix[2][2]}
      </text>

      <text x="58" y="245" className="s10-label">
        scale X
      </text>

      <text x="130" y="245" className="s10-label">
        coupling
      </text>

      <text x="195" y="245" className="s10-label">
        center
      </text>
    </svg>
  );
}

function IntrinsicEffectVisual({
  fx,
  fy,
  cx,
  cy,
}: {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
}) {
  const base = normalizedToPixelWithIntrinsics(
    { x: 0.25, y: 0.2 },
    { fx: 800, fy: 800, cx: 320, cy: 240 },
  );

  const changed = normalizedToPixelWithIntrinsics(
    { x: 0.25, y: 0.2 },
    { fx, fy, cx, cy },
  );

  const baseX = 75;
  const baseY = 145;

  const changedX =
    baseX + (changed.u - base.u) * 0.35;

  const changedY =
    baseY - (changed.v - base.v) * 0.35;

  return (
    <svg
      viewBox="0 0 300 300"
      className="s10-visual"
      role="img"
      aria-label="Intrinsic parameter effects"
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
        x1="30"
        y1="145"
        x2="270"
        y2="145"
        className="s10-axis"
      />

      <line
        x1="75"
        y1="40"
        x2="75"
        y2="255"
        className="s10-axis"
      />

      <circle
        cx={baseX}
        cy={baseY}
        r="7"
        className="s10-point"
      />

      <circle
        cx={clamp(changedX, 30, 270)}
        cy={clamp(changedY, 40, 255)}
        r="8"
        className="s10-projectionPoint"
      />

      <line
        x1={baseX}
        y1={baseY}
        x2={clamp(changedX, 30, 270)}
        y2={clamp(changedY, 40, 255)}
        className="s10-raySecondary"
      />

      <text x="18" y="25" className="s10-title">
        INTRINSIC EFFECT
      </text>

      <text x="42" y="180" className="s10-label">
        reference
      </text>

      <text
        x={clamp(changedX + 10, 20, 245)}
        y={clamp(changedY - 12, 40, 270)}
        className="s10-pointLabel"
      >
        changed
      </text>

      <text x="28" y="275" className="s10-label">
        fx/fy = scale · cx/cy = shift
      </text>
    </svg>
  );
}

export default function Sprint10GroupBPage() {
  const [b1NormalizedX, setB1NormalizedX] =
    useState(0.375);

  const [b1NormalizedY, setB1NormalizedY] =
    useState(0.25);

  const [b1Fx, setB1Fx] = useState(800);
  const [b1Fy, setB1Fy] = useState(800);

  const [b3Fx, setB3Fx] = useState(800);
  const [b3Fy, setB3Fy] = useState(800);

  const [b3Cx, setB3Cx] = useState(320);
  const [b3Cy, setB3Cy] = useState(240);

  const [b2Cx, setB2Cx] = useState(320);
  const [b2Cy, setB2Cy] = useState(240);

  const [b4Fx, setB4Fx] = useState(800);
  const [b4Fy, setB4Fy] = useState(800);
  const [b4Cx, setB4Cx] = useState(320);
  const [b4Cy, setB4Cy] = useState(240);

  const b1Projection = useMemo(
    () =>
      projectWithIntrinsics(
        {
          x: b1NormalizedX,
          y: b1NormalizedY,
        },
        {
          fx: b1Fx,
          fy: b1Fy,
          cx: 320,
          cy: 240,
        },
      ),
    [b1NormalizedX, b1NormalizedY, b1Fx, b1Fy],
  );

  const defaultProjection =
    normalizedToPixelWithIntrinsics(
      {
        x: b1NormalizedX,
        y: b1NormalizedY,
      },
      {
        fx: 800,
        fy: 800,
        cx: 320,
        cy: 240,
      },
    );

  const b3Matrix = makeIntrinsicMatrix({
    fx: b3Fx,
    fy: b3Fy,
    cx: b3Cx,
    cy: b3Cy,
  });

  const b4Projection = normalizedToPixelWithIntrinsics(
    {
      x: 0.25,
      y: 0.2,
    },
    {
      fx: b4Fx,
      fy: b4Fy,
      cx: b4Cx,
      cy: b4Cy,
    },
  );

  return (
    <main className="s7-page s10-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">
          SPRINT 10 · GROUP B
        </div>

        <h1>
          Perspective Projection + Intrinsics
        </h1>

        <p>
          Turn normalized camera coordinates into actual pixel coordinates and
          see how focal length and the principal point control the image.
        </p>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          LEARNING PROGRESSION
        </div>

        <div className="s7b-flow">
          <span>NORMALIZED POINT</span>
          <b>→</b>
          <span>fₓ / fᵧ</span>
          <b>→</b>
          <span>cₓ / cᵧ</span>
          <b>→</b>
          <span>PIXEL</span>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <PixelPlaneVisual
            normalizedX={b1NormalizedX}
            normalizedY={b1NormalizedY}
            fx={b1Fx}
            fy={b1Fy}
            cx={320}
            cy={240}
            title="Normalized coordinate mapped into pixel coordinates"
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            B1 · PERSPECTIVE → PIXEL
          </div>

          <h2>
            Where does the normalized point land in the image?
          </h2>

          <p>
            Group A stopped at normalized coordinates. Now the camera converts
            those dimensionless coordinates into actual image pixels.
          </p>

          <div className="s10-controls">
            <Slider
              label="xₙ"
              value={b1NormalizedX}
              min={-0.75}
              max={0.75}
              step={0.025}
              onChange={setB1NormalizedX}
            />

            <Slider
              label="yₙ"
              value={b1NormalizedY}
              min={-0.75}
              max={0.75}
              step={0.025}
              onChange={setB1NormalizedY}
            />

            <Slider
              label="fₓ"
              value={b1Fx}
              min={400}
              max={1200}
              step={50}
              onChange={setB1Fx}
            />

            <Slider
              label="fᵧ"
              value={b1Fy}
              min={400}
              max={1200}
              step={50}
              onChange={setB1Fy}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Horizontal coordinate</strong>
            <code>
              u = fₓxₙ + cₓ
            </code>

            <code>
              u = {b1Fx} × {fmt(b1NormalizedX)} + 320 ={" "}
              {fmt(b1Projection.pixel.u)}
            </code>

            <strong>Vertical coordinate</strong>
            <code>
              v = fᵧyₙ + cᵧ
            </code>

            <code>
              v = {b1Fy} × {fmt(b1NormalizedY)} + 240 ={" "}
              {fmt(b1Projection.pixel.v)}
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>What to notice</strong>
            <span>
              The normalized point describes direction. Intrinsics turn that
              direction into a location measured in pixels.
            </span>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <PixelPlaneVisual
            normalizedX={0.25}
            normalizedY={0.2}
            fx={800}
            fy={800}
            cx={b2Cx}
            cy={b2Cy}
            title="Principal point movement"
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            B2 · PRINCIPAL POINT
          </div>

          <h2>
            What happens when the image center moves?
          </h2>

          <p>
            The principal point is the location where the camera's optical axis
            intersects the image plane. Changing it translates the pixel
            coordinates without changing the normalized direction.
          </p>

          <div className="s10-controls">
            <Slider
              label="cₓ"
              value={b2Cx}
              min={200}
              max={440}
              step={10}
              onChange={setB2Cx}
            />

            <Slider
              label="cᵧ"
              value={b2Cy}
              min={140}
              max={340}
              step={10}
              onChange={setB2Cy}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Horizontal shift</strong>
            <code>
              u = 800 × 0.25 + {b2Cx} ={" "}
              {fmt(800 * 0.25 + b2Cx)}
            </code>

            <strong>Vertical shift</strong>
            <code>
              v = 800 × 0.20 + {b2Cy} ={" "}
              {fmt(800 * 0.2 + b2Cy)}
            </code>

            <strong>Normalized point</strong>
            <code>
              (xₙ,yₙ) = (0.25, 0.20)
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>Key idea</strong>
            <span>
              cₓ and cᵧ move the coordinate origin on the image. They do not
              multiply the normalized coordinates.
            </span>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <MatrixVisual
            fx={b3Fx}
            fy={b3Fy}
            cx={b3Cx}
            cy={b3Cy}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            B3 · INTRINSIC MATRIX
          </div>

          <h2>
            Put the camera intrinsics into one matrix
          </h2>

          <p>
            The four useful parameters are packaged into the intrinsic matrix
            K. Change the controls and watch the actual matrix values change.
          </p>

          <div className="s10-controls">
            <Slider
              label="fₓ"
              value={b3Fx}
              min={400}
              max={1200}
              step={50}
              onChange={setB3Fx}
            />

            <Slider
              label="fᵧ"
              value={b3Fy}
              min={400}
              max={1200}
              step={50}
              onChange={setB3Fy}
            />

            <Slider
              label="cₓ"
              value={b3Cx}
              min={200}
              max={440}
              step={10}
              onChange={setB3Cx}
            />

            <Slider
              label="cᵧ"
              value={b3Cy}
              min={140}
              max={340}
              step={10}
              onChange={setB3Cy}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Intrinsic matrix</strong>

            <code>
              K = [ {b3Matrix[0][0]} &nbsp; 0 &nbsp;{" "}
              {b3Matrix[0][2]} ]
            </code>

            <code>
              &nbsp;&nbsp;&nbsp;&nbsp;[ 0 &nbsp;{" "}
              {b3Matrix[1][1]} &nbsp; {b3Matrix[1][2]} ]
            </code>

            <code>
              &nbsp;&nbsp;&nbsp;&nbsp;[ 0 &nbsp; 0 &nbsp; 1 ]
            </code>

            <strong>Interpretation</strong>

            <code>
              fₓ,fᵧ → scale
            </code>

            <code>
              cₓ,cᵧ → image-center offset
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>Why this matters</strong>
            <span>
              Calibration estimates these camera-specific parameters so that
              mathematical projections agree with real image measurements.
            </span>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <IntrinsicEffectVisual
            fx={b3Fx}
            fy={b3Fy}
            cx={b3Cx}
            cy={b3Cy}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            B4 · WHAT INTRINSICS DO
          </div>

          <h2>
            Scaling versus translation
          </h2>

          <p>
            This final experiment separates the two main effects: focal lengths
            control scale, while the principal point controls translation.
          </p>

          <div className="s10-mathBox">
            <strong>Reference camera</strong>
            <code>
              (fₓ,fᵧ,cₓ,cᵧ) = (800,800,320,240)
            </code>

            <strong>Reference pixel</strong>
            <code>
              ({fmt(defaultProjection.u)},{" "}
              {fmt(defaultProjection.v)})
            </code>

            <strong>Current pixel</strong>
            <code>
              ({fmt(b4Projection.u)},{" "}
              {fmt(b4Projection.v)})
            </code>

            <strong>Current parameters</strong>
            <code>
              fₓ={b3Fx}, fᵧ={b3Fy}, cₓ={b3Cx}, cᵧ={b3Cy}
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>Industrial connection</strong>
            <span>
              Camera calibration matters because a dimensional inspection
              system depends on knowing how physical directions and geometry map
              into actual sensor pixels.
            </span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          GROUP B KEY MESSAGE
        </div>

        <h2>
          Intrinsics turn geometry into pixels
        </h2>

        <div className="s10-summaryFlow">
          <span>NORMALIZED POINT</span>
          <b>→</b>
          <span>FOCAL SCALE</span>
          <b>→</b>
          <span>PRINCIPAL POINT SHIFT</span>
          <b>→</b>
          <span>PIXEL</span>
        </div>

        <p className="s10-summaryText">
          Group B adds the intrinsic camera parameters. Group C will add the
          camera pose—rotation and translation—so that the complete camera
          projection pipeline can be constructed.
        </p>
      </section>
    </main>
  );
}
