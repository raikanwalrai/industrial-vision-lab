import { useMemo, useState } from "react";
import {
  calculateDisparity,
  calculateDepthFromDisparity,
} from "../stereoGeometryMath";

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

function StereoCameraVisual({
  baseline,
  depth,
}: {
  baseline: number;
  depth: number;
}) {
  const width = 300;
  const height = 300;

  const leftCameraX = 70;
  const rightCameraX = 230;
  const cameraY = 215;

  const baselinePixels = 160;
  const depthPixels = clamp(depth * 32, 55, 155);

  const pointX = 150;
  const pointY = cameraY - depthPixels;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="s10-visual"
      role="img"
      aria-label="Two camera stereo geometry with baseline"
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
        x1={leftCameraX}
        y1={cameraY}
        x2={rightCameraX}
        y2={cameraY}
        className="s10-axis"
      />

      <line
        x1={leftCameraX}
        y1={cameraY}
        x2={pointX}
        y2={pointY}
        className="s10-ray"
      />

      <line
        x1={rightCameraX}
        y1={cameraY}
        x2={pointX}
        y2={pointY}
        className="s10-raySecondary"
      />

      <rect
        x={leftCameraX - 11}
        y={cameraY - 8}
        width="22"
        height="16"
        rx="3"
        className="s10-cameraPlane"
      />

      <rect
        x={rightCameraX - 11}
        y={cameraY - 8}
        width="22"
        height="16"
        rx="3"
        className="s10-cameraPlane"
      />

      <circle
        cx={pointX}
        cy={pointY}
        r="8"
        className="s10-point"
      />

      <line
        x1={leftCameraX}
        y1={cameraY + 28}
        x2={rightCameraX}
        y2={cameraY + 28}
        className="s10-depthAxis"
      />

      <line
        x1={leftCameraX}
        y1={cameraY + 21}
        x2={leftCameraX}
        y2={cameraY + 35}
        className="s10-depthAxis"
      />

      <line
        x1={rightCameraX}
        y1={cameraY + 21}
        x2={rightCameraX}
        y2={cameraY + 35}
        className="s10-depthAxis"
      />

      <text x="18" y="25" className="s10-title">
        STEREO CAMERA SETUP
      </text>

      <text
        x={leftCameraX - 28}
        y={cameraY + 48}
        className="s10-label"
      >
        LEFT
      </text>

      <text
        x={rightCameraX - 30}
        y={cameraY + 48}
        className="s10-label"
      >
        RIGHT
      </text>

      <text
        x="137"
        y={cameraY + 52}
        className="s10-label"
      >
        B = {fmt(baseline, 2)} m
      </text>

      <text
        x={clamp(pointX + 12, 20, 230)}
        y={clamp(pointY - 12, 45, 270)}
        className="s10-label"
      >
        P
      </text>

      <text
        x={pointX + 12}
        y={pointY + 20}
        className="s10-label"
      >
        Z = {fmt(depth, 2)} m
      </text>
    </svg>
  );
}

export default function Sprint11GroupAPage() {
  const [baseline, setBaseline] = useState(0.2);
  const [depth, setDepth] = useState(2.0);
  const [focalLength, setFocalLength] = useState(800);

  const stereoDepth = useMemo(() => {
    const disparity = (focalLength * baseline) / depth;
    return {
      disparity,
      depth,
    };
  }, [baseline, depth, focalLength]);

  const [a2LeftX, setA2LeftX] = useState(420);
  const [a2RightX, setA2RightX] = useState(340);
  const [a2LeftY, setA2LeftY] = useState(250);
  const [a2RightY, setA2RightY] = useState(250);

  const a2Disparity = useMemo(
    () => calculateDisparity(a2LeftX, a2RightX),
    [a2LeftX, a2RightX],
  );

  const a2VerticalDifference = a2RightY - a2LeftY;

  const [a3Baseline, setA3Baseline] = useState(0.2);
  const [a3FocalLength, setA3FocalLength] = useState(800);
  const [a3Disparity, setA3Disparity] = useState(80);

  const [a4Baseline, setA4Baseline] = useState(0.2);
  const [a4FocalLength, setA4FocalLength] = useState(800);
  const [a4LeftX, setA4LeftX] = useState(420);
  const [a4RightX, setA4RightX] = useState(340);

  const a4Disparity = useMemo(
    () => calculateDisparity(a4LeftX, a4RightX),
    [a4LeftX, a4RightX],
  );

  const a4Depth = useMemo(
    () =>
      calculateDepthFromDisparity(
        a4FocalLength,
        a4Baseline,
        a4Disparity,
      ),
    [a4FocalLength, a4Baseline, a4Disparity],
  );

  const a3Depth = useMemo(
    () =>
      calculateDepthFromDisparity(
        a3FocalLength,
        a3Baseline,
        a3Disparity,
      ),
    [a3FocalLength, a3Baseline, a3Disparity],
  );

  const exampleDisparity = calculateDisparity(420, 340);
  const exampleDepth = calculateDepthFromDisparity(
    800,
    0.2,
    exampleDisparity,
  );

  return (
    <main className="s7-page s10-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">
          SPRINT 11 · GROUP A
        </div>

        <h1>
          Stereo Geometry
        </h1>

        <p>
          Learn how two cameras observe the same 3D point. Start with the
          distance between the cameras, then connect image disparity to depth.
        </p>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          LEARNING PROGRESSION
        </div>

        <div className="s7b-flow">
          <span>TWO CAMERAS</span>
          <b>→</b>
          <span>BASELINE</span>
          <b>→</b>
          <span>DISPARITY</span>
          <b>→</b>
          <span>DEPTH</span>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <StereoCameraVisual
            baseline={baseline}
            depth={depth}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            A1 · TWO CAMERAS + BASELINE
          </div>

          <h2>
            Why do we need two cameras?
          </h2>

          <p>
            A single camera sees a 3D scene as a 2D image. Two cameras see
            the same physical point from slightly different positions. The
            distance between their optical centers is called the baseline.
          </p>

          <div className="s10-controls">
            <Slider
              label="Baseline B (m)"
              value={baseline}
              min={0.1}
              max={0.5}
              step={0.05}
              onChange={setBaseline}
            />

            <Slider
              label="Object depth Z (m)"
              value={depth}
              min={0.5}
              max={5}
              step={0.5}
              onChange={setDepth}
            />

            <Slider
              label="Focal length f (px)"
              value={focalLength}
              min={400}
              max={1200}
              step={100}
              onChange={setFocalLength}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Baseline</strong>
            <code>
              B = {fmt(baseline, 2)} m
            </code>

            <strong>Object depth</strong>
            <code>
              Z = {fmt(depth, 2)} m
            </code>

            <strong>Focal length</strong>
            <code>
              f = {focalLength} px
            </code>

            <strong>Expected disparity</strong>
            <code>
              d = fB/Z = {focalLength} × {fmt(baseline, 2)} /{" "}
              {fmt(depth, 2)} = {fmt(stereoDepth.disparity, 2)} px
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>What to notice</strong>

            <p>
              The two cameras are separated by B. Both observe the same
              physical point, but the point appears at different horizontal
              image positions. That image shift is called disparity.
            </p>

            <p>
              With the default values, B = 0.20 m, Z = 2.0 m, and f = 800 px,
              so the expected disparity is 80 px.
            </p>
          </div>

          <div className="s10-mathBox">
            <strong>Worked example</strong>

            <code>
              xL = 420 px, xR = 340 px
            </code>

            <code>
              d = xL - xR = 420 - 340 = {exampleDisparity} px
            </code>

            <code>
              Z = fB/d = 800 × 0.20 / 80 = {fmt(exampleDepth)} m
            </code>
          </div>
        </div>
      </section>
      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <svg
            viewBox="0 0 300 300"
            width="300"
            height="300"
            role="img"
            aria-label="Corresponding points in left and right stereo images"
          >
            <rect
              x="10"
              y="10"
              width="280"
              height="280"
              rx="10"
              fill="#11161b"
              stroke="#34424d"
            />

            <text x="25" y="32" className="s10-label">
              LEFT IMAGE
            </text>

            <text x="165" y="32" className="s10-label">
              RIGHT IMAGE
            </text>

            <rect
              x="20"
              y="45"
              width="125"
              height="205"
              fill="none"
              stroke="#41515e"
            />

            <rect
              x="155"
              y="45"
              width="125"
              height="205"
              fill="none"
              stroke="#41515e"
            />

            <line
              x1={20 + (a2LeftX / 640) * 125}
              y1={45 + (a2LeftY / 480) * 205}
              x2={155 + (a2RightX / 640) * 125}
              y2={45 + (a2RightY / 480) * 205}
              stroke="#6e9fba"
              strokeDasharray="5 4"
            />

            <circle
              cx={20 + (a2LeftX / 640) * 125}
              cy={45 + (a2LeftY / 480) * 205}
              r="7"
              fill="#dce9f3"
            />

            <circle
              cx={155 + (a2RightX / 640) * 125}
              cy={45 + (a2RightY / 480) * 205}
              r="7"
              fill="#dce9f3"
            />

            <text
              x={28 + (a2LeftX / 640) * 125}
              y={38 + (a2LeftY / 480) * 205}
              className="s10-label"
            >
              P_L
            </text>

            <text
              x={163 + (a2RightX / 640) * 125}
              y={38 + (a2RightY / 480) * 205}
              className="s10-label"
            >
              P_R
            </text>

            <text x="25" y="270" className="s10-label">
              xL = {fmt(a2LeftX)} px
            </text>

            <text x="165" y="270" className="s10-label">
              xR = {fmt(a2RightX)} px
            </text>
          </svg>
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            A2 · CORRESPONDING POINTS + DISPARITY
          </div>

          <h2>
            How does the same point appear in two cameras?
          </h2>

          <p>
            The same physical point is projected into both images. Because
            the cameras are separated, the point usually appears at different
            horizontal positions. The difference is called disparity.
          </p>

          <div className="s10-controls">
            <Slider
              label="Left image x (px)"
              value={a2LeftX}
              min={100}
              max={540}
              step={10}
              onChange={setA2LeftX}
            />

            <Slider
              label="Right image x (px)"
              value={a2RightX}
              min={100}
              max={540}
              step={10}
              onChange={setA2RightX}
            />

            <Slider
              label="Left image y (px)"
              value={a2LeftY}
              min={100}
              max={380}
              step={10}
              onChange={setA2LeftY}
            />

            <Slider
              label="Right image y (px)"
              value={a2RightY}
              min={100}
              max={380}
              step={10}
              onChange={setA2RightY}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Left image point</strong>
            <code>
              P_L = ({fmt(a2LeftX)}, {fmt(a2LeftY)}) px
            </code>

            <strong>Right image point</strong>
            <code>
              P_R = ({fmt(a2RightX)}, {fmt(a2RightY)}) px
            </code>

            <strong>Disparity</strong>
            <code>
              d = xL − xR
            </code>

            <code>
              d = {fmt(a2LeftX)} − {fmt(a2RightX)} ={" "}
              {fmt(a2Disparity)} px
            </code>

            <strong>Vertical difference</strong>
            <code>
              Δy = yR − yL = {fmt(a2VerticalDifference)} px
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>What to notice</strong>

            <p>
              In rectified stereo, corresponding points lie on the same
              horizontal row, so yL and yR are equal and Δy = 0.
            </p>

            <p>
              The important quantity is the horizontal shift:
              <strong> larger disparity means the image positions are
              farther apart.</strong>
            </p>
          </div>

          <div className="s10-mathBox">
            <strong>Worked example</strong>

            <code>
              xL = 420 px
            </code>

            <code>
              xR = 340 px
            </code>

            <code>
              d = xL − xR = 420 − 340 = 80 px
            </code>

            <code>
              yL = yR = 250 px → Δy = 0 px
            </code>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <svg
            viewBox="0 0 300 300"
            width="300"
            height="300"
            role="img"
            aria-label="Stereo depth from disparity"
          >
            <rect
              x="10"
              y="10"
              width="280"
              height="280"
              rx="10"
              fill="#11161b"
              stroke="#34424d"
            />

            <text x="25" y="32" className="s10-label">
              DEPTH FROM DISPARITY
            </text>

            <line
              x1="55"
              y1="85"
              x2="245"
              y2="85"
              stroke="#41515e"
              strokeWidth="2"
            />

            <circle cx="55" cy="85" r="8" fill="#dce9f3" />
            <circle cx="245" cy="85" r="8" fill="#dce9f3" />

            <text x="38" y="108" className="s10-label">
              LEFT
            </text>

            <text x="226" y="108" className="s10-label">
              RIGHT
            </text>

            <text x="112" y="78" className="s10-label">
              B = {fmt(a3Baseline, 2)} m
            </text>

            <line
              x1="150"
              y1="125"
              x2="150"
              y2="245"
              stroke="#6e9fba"
              strokeWidth="2"
            />

            <circle
              cx="150"
              cy="125"
              r="8"
              fill="#dce9f3"
            />

            <text x="163" y="129" className="s10-label">
              3D POINT
            </text>

            <text x="163" y="190" className="s10-label">
              Z = {fmt(a3Depth, 2)} m
            </text>

            <text x="163" y="207" className="s10-label">
              d = {fmt(a3Disparity, 0)} px
            </text>

            <text x="25" y="270" className="s10-label">
              Larger d → smaller Z
            </text>
          </svg>
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            A3 · DEPTH FROM DISPARITY
          </div>

          <h2>
            How can two image positions reveal depth?
          </h2>

          <p>
            Once the cameras are calibrated and the baseline is known,
            disparity can be converted into physical depth. A point that is
            closer to the cameras produces a larger disparity.
          </p>

          <div className="s10-controls">
            <Slider
              label="Baseline B (m)"
              value={a3Baseline}
              min={0.1}
              max={0.5}
              step={0.05}
              onChange={setA3Baseline}
            />

            <Slider
              label="Focal length f (px)"
              value={a3FocalLength}
              min={400}
              max={1200}
              step={100}
              onChange={setA3FocalLength}
            />

            <Slider
              label="Disparity d (px)"
              value={a3Disparity}
              min={20}
              max={200}
              step={10}
              onChange={setA3Disparity}
            />
          </div>

          <div className="s10-mathBox">
            <strong>Depth equation</strong>

            <code>
              Z = fB / d
            </code>

            <strong>Inputs</strong>

            <code>
              f = {a3FocalLength} px
            </code>

            <code>
              B = {fmt(a3Baseline, 2)} m
            </code>

            <code>
              d = {fmt(a3Disparity, 0)} px
            </code>

            <strong>Substitution</strong>

            <code>
              Z = {a3FocalLength} × {fmt(a3Baseline, 2)} /{" "}
              {fmt(a3Disparity, 0)}
            </code>

            <strong>Calculated depth</strong>

            <code>
              Z = <b>{fmt(a3Depth, 3)} m</b>
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>What to notice</strong>

            <p>
              Depth is inversely related to disparity. When disparity becomes
              larger, the calculated depth becomes smaller.
            </p>

            <p>
              When disparity becomes smaller, the point is interpreted as
              being farther away.
            </p>
          </div>

          <div className="s10-mathBox">
            <strong>Worked example</strong>

            <code>
              f = 800 px, B = 0.20 m, d = 80 px
            </code>

            <code>
              Z = fB/d
            </code>

            <code>
              Z = 800 × 0.20 / 80 = <b>2.000 m</b>
            </code>
          </div>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <svg
            viewBox="0 0 300 300"
            width="300"
            height="300"
            role="img"
            aria-label="Interactive stereo depth calculation"
          >
            <rect
              x="10"
              y="10"
              width="280"
              height="280"
              rx="10"
              fill="#11161b"
              stroke="#34424d"
            />

            <text x="25" y="32" className="s10-label">
              INTERACTIVE STEREO DEPTH
            </text>

            <rect
              x="20"
              y="55"
              width="115"
              height="155"
              fill="none"
              stroke="#41515e"
            />

            <rect
              x="165"
              y="55"
              width="115"
              height="155"
              fill="none"
              stroke="#41515e"
            />

            <text x="28" y="72" className="s10-label">
              LEFT
            </text>

            <text x="174" y="72" className="s10-label">
              RIGHT
            </text>

            <circle
              cx={20 + ((a4LeftX - 100) / 440) * 115}
              cy="130"
              r="7"
              fill="#dce9f3"
            />

            <circle
              cx={165 + ((a4RightX - 100) / 440) * 115}
              cy="130"
              r="7"
              fill="#dce9f3"
            />

            <line
              x1={20 + ((a4LeftX - 100) / 440) * 115}
              y1="130"
              x2={165 + ((a4RightX - 100) / 440) * 115}
              y2="130"
              stroke="#6e9fba"
              strokeDasharray="5 4"
            />

            <text x="25" y="235" className="s10-label">
              d = {fmt(a4Disparity, 0)} px
            </text>

            <text x="25" y="252" className="s10-label">
              Z = {fmt(a4Depth, 3)} m
            </text>

            <text x="25" y="275" className="s10-label">
              B = {fmt(a4Baseline, 2)} m
            </text>

            <text x="165" y="275" className="s10-label">
              f = {a4FocalLength} px
            </text>
          </svg>
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            A4 · INTERACTIVE STEREO DEPTH
          </div>

          <h2>
            Put the whole stereo pipeline together
          </h2>

          <p>
            We now combine the image measurements from A2 with the depth
            equation from A3. Change the image positions and camera
            parameters and watch the estimated physical depth change.
          </p>

          <div className="s10-controls">
            <Slider
              label="Baseline B (m)"
              value={a4Baseline}
              min={0.1}
              max={0.5}
              step={0.05}
              onChange={setA4Baseline}
            />

            <Slider
              label="Focal length f (px)"
              value={a4FocalLength}
              min={400}
              max={1200}
              step={100}
              onChange={setA4FocalLength}
            />

            <Slider
              label="Left image x (px)"
              value={a4LeftX}
              min={a4RightX + 10}
              max={540}
              step={10}
              onChange={setA4LeftX}
            />

            <Slider
              label="Right image x (px)"
              value={a4RightX}
              min={100}
              max={a4LeftX - 10}
              step={10}
              onChange={setA4RightX}
            />
          </div>

          <div className="s10-mathBox">
            <strong>STEP 1 · IMAGE POSITIONS</strong>

            <code>
              xL = {fmt(a4LeftX)} px
            </code>

            <code>
              xR = {fmt(a4RightX)} px
            </code>

            <strong>STEP 2 · DISPARITY</strong>

            <code>
              d = xL − xR
            </code>

            <code>
              d = {fmt(a4LeftX)} − {fmt(a4RightX)} ={" "}
              <b>{fmt(a4Disparity, 0)} px</b>
            </code>

            <strong>STEP 3 · DEPTH</strong>

            <code>
              Z = fB/d
            </code>

            <code>
              Z = {a4FocalLength} × {fmt(a4Baseline, 2)} /{" "}
              {fmt(a4Disparity, 0)}
            </code>

            <strong>FINAL DEPTH</strong>

            <code>
              Z = <b>{fmt(a4Depth, 3)} m</b>
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>What to notice</strong>

            <p>
              The entire measurement chain is now visible. A change in image
              position changes disparity, and disparity changes the estimated
              depth.
            </p>

            <p>
              For fixed f and B:
            </p>

            <p>
              <strong>d ↑ → Z ↓</strong>
              <br />
              <strong>d ↓ → Z ↑</strong>
            </p>
          </div>

          <div className="s10-mathBox">
            <strong>WORKED EXAMPLES</strong>

            <code>
              d = 160 px → Z = 800 × 0.20 / 160 = <b>1.000 m</b>
            </code>

            <code>
              d = 80 px → Z = 800 × 0.20 / 80 = <b>2.000 m</b>
            </code>

            <code>
              d = 40 px → Z = 800 × 0.20 / 40 = <b>4.000 m</b>
            </code>
          </div>
        </div>
      </section>

    </main>
  );
}
