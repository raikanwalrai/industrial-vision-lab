import { useMemo, useState } from "react";
import {
  calculateCorrespondenceDifference,
  verifyCorrespondence,
  calculateEpipolarLine,
  evaluateEpipolarLine,
  calculateFundamentalConstraint,
  type Matrix3x3,
  calculateEssentialMatrix,
  calculateEssentialConstraint,
} from "../epipolarGeometryMath";

function fmt(value: number, digits = 2): string {
  return Number(value.toFixed(digits)).toString();
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="s10-control">
      <span>
        {label} <b>{fmt(value)}</b> {unit}
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

function CorrespondenceVisual({
  leftX,
  leftY,
  rightX,
  rightY,
}: {
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
}) {
  const leftPointX = 25 + (leftX / 640) * 110;
  const rightPointX = 165 + (rightX / 640) * 110;

  const leftPointY = 55 + (leftY / 480) * 185;
  const rightPointY = 55 + (rightY / 480) * 185;

  const valid = Math.abs(leftY - rightY) < 0.001;

  return (
    <svg
      viewBox="0 0 300 300"
      width="300"
      height="300"
      role="img"
      aria-label="Corresponding points for epipolar geometry"
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

      <text x="25" y="35" className="s10-label">
        LEFT IMAGE
      </text>

      <text x="165" y="35" className="s10-label">
        RIGHT IMAGE
      </text>

      <rect
        x="20"
        y="48"
        width="120"
        height="205"
        fill="none"
        stroke="#41515e"
      />

      <rect
        x="160"
        y="48"
        width="120"
        height="205"
        fill="none"
        stroke="#41515e"
      />

      {valid && (
        <line
          x1={leftPointX}
          y1={leftPointY}
          x2={rightPointX}
          y2={rightPointY}
          stroke="#6e9fba"
          strokeDasharray="5 4"
        />
      )}

      <circle
        cx={leftPointX}
        cy={leftPointY}
        r="7"
        fill="#dce9f3"
      />

      <circle
        cx={rightPointX}
        cy={rightPointY}
        r="7"
        fill="#dce9f3"
      />

      <text
        x={leftPointX + 9}
        y={leftPointY - 8}
        className="s10-label"
      >
        x_L
      </text>

      <text
        x={rightPointX + 9}
        y={rightPointY - 8}
        className="s10-label"
      >
        x_R
      </text>

      <text x="25" y="275" className="s10-label">
        {valid ? "Same epipolar row" : "Different image rows"}
      </text>
    </svg>
  );
}

export default function Sprint11GroupBPage() {

  const [b4Tx, setB4Tx] = useState(0.2);
  const [b4LeftX, setB4LeftX] = useState(0.42);
  const [b4LeftY, setB4LeftY] = useState(0.25);
  const [b4RightX, setB4RightX] = useState(0.34);
  const [b4RightY, setB4RightY] = useState(0.25);

  const b4Rotation: Matrix3x3 = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  const b4EssentialMatrix = useMemo(
    () => calculateEssentialMatrix(b4Rotation, [b4Tx, 0, 0]),
    [b4Tx],
  );

  const b4LeftPoint = useMemo(
    () => ({
      x: b4LeftX,
      y: b4LeftY,
      w: 1,
    }),
    [b4LeftX, b4LeftY],
  );

  const b4RightPoint = useMemo(
    () => ({
      x: b4RightX,
      y: b4RightY,
      w: 1,
    }),
    [b4RightX, b4RightY],
  );

  const b4ExL = useMemo(
    () => [
      b4EssentialMatrix[0][0] * b4LeftX +
        b4EssentialMatrix[0][1] * b4LeftY +
        b4EssentialMatrix[0][2],

      b4EssentialMatrix[1][0] * b4LeftX +
        b4EssentialMatrix[1][1] * b4LeftY +
        b4EssentialMatrix[1][2],

      b4EssentialMatrix[2][0] * b4LeftX +
        b4EssentialMatrix[2][1] * b4LeftY +
        b4EssentialMatrix[2][2],
    ],
    [b4EssentialMatrix, b4LeftX, b4LeftY],
  );

  const b4Constraint = useMemo(
    () =>
      calculateEssentialConstraint(
        b4EssentialMatrix,
        b4LeftPoint,
        b4RightPoint,
      ),
    [b4EssentialMatrix, b4LeftPoint, b4RightPoint],
  );


  const [leftX, setLeftX] = useState(420);
  const [leftY, setLeftY] = useState(250);
  const [rightX, setRightX] = useState(340);
  const [rightY, setRightY] = useState(250);

  const correspondence = useMemo(
    () =>
      calculateCorrespondenceDifference(
        { x: leftX, y: leftY },
        { x: rightX, y: rightY },
      ),
    [leftX, leftY, rightX, rightY],
  );

  const fundamentalMatrix: Matrix3x3 = [
    [0, 0, 0],
    [0, 0, -1],
    [0, 1, 0],
  ];

  const epipolarLine = useMemo(
    () =>
      calculateEpipolarLine(
        fundamentalMatrix,
        { x: leftX, y: leftY },
      ),
    [leftX, leftY],
  );

  const lineValue = useMemo(
    () =>
      evaluateEpipolarLine(
        epipolarLine,
        { x: rightX, y: rightY },
      ),
    [epipolarLine, rightX, rightY],
  );

  const fundamentalConstraint = useMemo(
    () =>
      calculateFundamentalConstraint(
        fundamentalMatrix,
        { x: leftX, y: leftY },
        { x: rightX, y: rightY },
      ),
    [
      fundamentalMatrix,
      leftX,
      leftY,
      rightX,
      rightY,
    ],
  );

  const valid = verifyCorrespondence(
    { x: leftX, y: leftY },
    { x: rightX, y: rightY },
  );

  return (
    <main className="s7-page s10-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">
          SPRINT 11 · GROUP B
        </div>

        <h1>Epipolar Geometry</h1>

        <p>
          A point in one camera does not match an arbitrary point in the
          other camera. Camera geometry restricts where the corresponding
          point can appear.
        </p>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          LEARNING PROGRESSION
        </div>

        <div className="s7b-flow">
          <span>CORRESPONDING POINTS</span>
          <b>→</b>
          <span>EPIPOLAR LINES</span>
          <b>→</b>
          <span>FUNDAMENTAL MATRIX</span>
          <b>→</b>
          <span>ESSENTIAL MATRIX</span>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <CorrespondenceVisual
            leftX={leftX}
            leftY={leftY}
            rightX={rightX}
            rightY={rightY}
          />
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            B1 · CORRESPONDING POINTS
          </div>

          <h2>
            Where can the matching point appear?
          </h2>

          <p>
            The same physical 3D point is observed by both cameras. In a
            rectified stereo pair, corresponding points lie on the same
            horizontal image row.
          </p>

          <div className="s10-controls">
            <Slider
              label="Left image x"
              value={leftX}
              min={100}
              max={540}
              step={10}
              unit="px"
              onChange={setLeftX}
            />

            <Slider
              label="Left image y"
              value={leftY}
              min={100}
              max={380}
              step={10}
              unit="px"
              onChange={setLeftY}
            />

            <Slider
              label="Right image x"
              value={rightX}
              min={100}
              max={540}
              step={10}
              unit="px"
              onChange={setRightX}
            />

            <Slider
              label="Right image y"
              value={rightY}
              min={100}
              max={380}
              step={10}
              unit="px"
              onChange={setRightY}
            />
          </div>

          <div className="s10-mathBox">
            <strong>LEFT IMAGE POINT</strong>

            <code>
              x_L = ({fmt(leftX)}, {fmt(leftY)}, 1)
            </code>

            <strong>RIGHT IMAGE POINT</strong>

            <code>
              x_R = ({fmt(rightX)}, {fmt(rightY)}, 1)
            </code>

            <strong>HORIZONTAL DIFFERENCE</strong>

            <code>
              x_L − x_R = {fmt(correspondence.horizontalDifference)} px
            </code>

            <strong>VERTICAL DIFFERENCE</strong>

            <code>
              y_R − y_L = {fmt(correspondence.verticalDifference)} px
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>WHAT TO NOTICE</strong>

            <p>
              With rectified stereo, a valid correspondence has the same
              image-row coordinate:
            </p>

            <p>
              <strong>y_L = y_R</strong>
            </p>

            <p>
              If the right point moves to another row, it is no longer a valid
              rectified correspondence.
            </p>
          </div>

          <div className="s10-mathBox">
            <strong>GEOMETRIC STATUS</strong>

            <code>
              {valid
                ? "✓ Valid rectified correspondence"
                : "✗ Invalid correspondence: different image rows"}
            </code>

            <strong>WHAT COMES NEXT</strong>

            <code>
              A valid correspondence is constrained to an epipolar line.
            </code>
          </div>

          <div className="s10-mathBox">
            <strong>WORKED EXAMPLE</strong>

            <code>
              x_L = (420, 250, 1)
            </code>

            <code>
              x_R = (340, 250, 1)
            </code>

            <code>
              y_R − y_L = 250 − 250 = 0
            </code>

            <code>
              Therefore the correspondence satisfies the rectified
              same-row constraint.
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
            aria-label="Epipolar line generated from a left image point"
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

            <text x="25" y="34" className="s10-label">
              EPIPOLAR LINE
            </text>

            <rect
              x="20"
              y="50"
              width="115"
              height="205"
              fill="none"
              stroke="#41515e"
            />

            <rect
              x="160"
              y="50"
              width="120"
              height="205"
              fill="none"
              stroke="#41515e"
            />

            <text x="25" y="68" className="s10-label">
              LEFT
            </text>

            <text x="165" y="68" className="s10-label">
              RIGHT
            </text>

            <circle
              cx={20 + (leftX / 640) * 115}
              cy={50 + (leftY / 480) * 205}
              r="7"
              fill="#dce9f3"
            />

            <line
              x1="160"
              y1={50 + (leftY / 480) * 205}
              x2="280"
              y2={50 + (leftY / 480) * 205}
              stroke="#6e9fba"
              strokeWidth="3"
            />

            <circle
              cx={160 + (rightX / 640) * 120}
              cy={50 + (rightY / 480) * 205}
              r="7"
              fill="#dce9f3"
            />

            <text
              x={28 + (leftX / 640) * 115}
              y={45 + (leftY / 480) * 205}
              className="s10-label"
            >
              x_L
            </text>

            <text
              x={168 + (rightX / 640) * 120}
              y={45 + (rightY / 480) * 205}
              className="s10-label"
            >
              x_R
            </text>

            <text x="165" y="275" className="s10-label">
              y = {fmt(-epipolarLine.c / epipolarLine.b)}
            </text>
          </svg>
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            B2 · EPIPOLAR LINES
          </div>

          <h2>
            Where is the matching point allowed to be?
          </h2>

          <p>
            Once a point is selected in the left image, stereo geometry
            constrains its possible match in the right image. The possible
            matches lie on an epipolar line.
          </p>

          <div className="s10-mathBox">
            <strong>FUNDAMENTAL MATRIX</strong>

            <code>
              F = [ 0  0  0 ]
            </code>

            <code>
              {"    [ 0  0 -1 ]"}
            </code>

            <code>
              {"    [ 0  1  0 ]"}
            </code>

            <strong>LEFT IMAGE POINT</strong>

            <code>
              x_L = ({fmt(leftX)}, {fmt(leftY)}, 1)
            </code>

            <strong>EPIPOLAR LINE</strong>

            <code>
              l_R = F x_L
            </code>

            <code>
              l_R = ({fmt(epipolarLine.a)},{" "}
              {fmt(epipolarLine.b)},{" "}
              {fmt(epipolarLine.c)})
            </code>

            <strong>LINE EQUATION</strong>

            <code>
              ax + by + c = 0
            </code>

            <code>
              {fmt(epipolarLine.a)}x +{" "}
              {fmt(epipolarLine.b)}y +{" "}
              {fmt(epipolarLine.c)} = 0
            </code>

            <code>
              y = {fmt(-epipolarLine.c / epipolarLine.b)} px
            </code>
          </div>

          <div className="s10-controls">
            <Slider
              label="Left image x"
              value={leftX}
              min={100}
              max={540}
              step={10}
              unit="px"
              onChange={setLeftX}
            />

            <Slider
              label="Left image y"
              value={leftY}
              min={100}
              max={380}
              step={10}
              unit="px"
              onChange={setLeftY}
            />

            <Slider
              label="Right image x"
              value={rightX}
              min={100}
              max={540}
              step={10}
              unit="px"
              onChange={setRightX}
            />

            <Slider
              label="Right image y"
              value={rightY}
              min={100}
              max={380}
              step={10}
              unit="px"
              onChange={setRightY}
            />
          </div>

          <div className="s10-mathBox">
            <strong>EPIPOLAR CONSTRAINT CHECK</strong>

            <code>
              l_R · x_R = ax_R + by_R + c
            </code>

            <code>
              = {fmt(epipolarLine.a)} × {fmt(rightX)}
              {" + "}
              {fmt(epipolarLine.b)} × {fmt(rightY)}
              {" + "}
              {fmt(epipolarLine.c)}
            </code>

            <code>
              = <b>{fmt(lineValue, 3)}</b>
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>WHAT TO NOTICE</strong>

            <p>
              A point lying on the epipolar line gives a value of zero.
            </p>

            <p>
              Move the right-image y slider away from the line and the
              constraint becomes non-zero. The point is no longer a valid
              correspondence for this geometry.
            </p>
          </div>

          <div className="s10-mathBox">
            <strong>WORKED EXAMPLE</strong>

            <code>
              x_L = (420, 250, 1)
            </code>

            <code>
              l_R = F x_L = (0, -1, 250)
            </code>

            <code>
              -y + 250 = 0
            </code>

            <code>
              Therefore: <b>y = 250 px</b>
            </code>

            <code>
              x_R = (340, 250, 1) → l_R · x_R = 0
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
            aria-label="Fundamental matrix correspondence constraint"
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

            <text x="25" y="34" className="s10-label">
              FUNDAMENTAL MATRIX
            </text>

            <rect
              x="20"
              y="50"
              width="115"
              height="205"
              fill="none"
              stroke="#41515e"
            />

            <rect
              x="160"
              y="50"
              width="120"
              height="205"
              fill="none"
              stroke="#41515e"
            />

            <text x="25" y="68" className="s10-label">
              LEFT
            </text>

            <text x="165" y="68" className="s10-label">
              RIGHT
            </text>

            <circle
              cx={20 + (leftX / 640) * 115}
              cy={50 + (leftY / 480) * 205}
              r="7"
              fill="#dce9f3"
            />

            <line
              x1="160"
              y1={50 + (leftY / 480) * 205}
              x2="280"
              y2={50 + (leftY / 480) * 205}
              stroke="#6e9fba"
              strokeWidth="3"
            />

            <circle
              cx={160 + (rightX / 640) * 120}
              cy={50 + (rightY / 480) * 205}
              r="7"
              fill="#dce9f3"
            />

            <text x="25" y="275" className="s10-label">
              F constrains the match
            </text>
          </svg>
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            B3 · FUNDAMENTAL MATRIX
          </div>

          <h2>
            How does F enforce the correspondence constraint?
          </h2>

          <p>
            The Fundamental Matrix encodes the geometric relationship between
            the two camera images. It converts a point in one image into an
            epipolar line in the other image.
          </p>

          <div className="s10-mathBox">
            <strong>FUNDAMENTAL MATRIX</strong>

            <code>
              F = [ 0  0  0 ]
            </code>

            <code>
              {"    [ 0  0 -1 ]"}
            </code>

            <code>
              {"    [ 0  1  0 ]"}
            </code>

            <strong>LEFT IMAGE POINT</strong>

            <code>
              x_L = ({fmt(leftX)}, {fmt(leftY)}, 1)
            </code>

            <strong>RIGHT IMAGE POINT</strong>

            <code>
              x_R = ({fmt(rightX)}, {fmt(rightY)}, 1)
            </code>
          </div>

          <div className="s10-controls">
            <Slider
              label="Left image x"
              value={leftX}
              min={100}
              max={540}
              step={10}
              unit="px"
              onChange={setLeftX}
            />

            <Slider
              label="Left image y"
              value={leftY}
              min={100}
              max={380}
              step={10}
              unit="px"
              onChange={setLeftY}
            />

            <Slider
              label="Right image x"
              value={rightX}
              min={100}
              max={540}
              step={10}
              unit="px"
              onChange={setRightX}
            />

            <Slider
              label="Right image y"
              value={rightY}
              min={100}
              max={380}
              step={10}
              unit="px"
              onChange={setRightY}
            />
          </div>

          <div className="s10-mathBox">
            <strong>STEP 1 · EPIPOLAR LINE</strong>

            <code>
              l_R = F x_L
            </code>

            <code>
              l_R = ({fmt(epipolarLine.a)},{" "}
              {fmt(epipolarLine.b)},{" "}
              {fmt(epipolarLine.c)})
            </code>

            <strong>STEP 2 · FUNDAMENTAL CONSTRAINT</strong>

            <code>
              x_R^T F x_L = 0
            </code>

            <code>
              x_R^T l_R ={" "}
              <b>{fmt(fundamentalConstraint, 3)}</b>
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>WHAT TO NOTICE</strong>

            <p>
              When the right-image point lies on the epipolar line:
            </p>

            <p>
              <strong>x_R^T F x_L = 0</strong>
            </p>

            <p>
              Move the right-image y coordinate away from the epipolar line
              and the value becomes non-zero.
            </p>
          </div>

          <div className="s10-mathBox">
            <strong>WORKED EXAMPLE</strong>

            <code>
              F x_L = (0, -1, 250)
            </code>

            <code>
              x_R^T F x_L
              = 340(0) + 250(-1) + 1(250)
            </code>

            <code>
              = 0
            </code>

            <code>
              Therefore the correspondence satisfies the epipolar
              constraint.
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
            aria-label="Essential matrix correspondence constraint"
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

            <text x="25" y="34" className="s10-label">
              ESSENTIAL MATRIX
            </text>

            <rect
              x="20"
              y="50"
              width="115"
              height="205"
              fill="none"
              stroke="#41515e"
            />

            <rect
              x="160"
              y="50"
              width="120"
              height="205"
              fill="none"
              stroke="#41515e"
            />

            <text x="25" y="68" className="s10-label">
              LEFT
            </text>

            <text x="165" y="68" className="s10-label">
              RIGHT
            </text>

            <circle
              cx={20 + b4LeftX * 115}
              cy={50 + b4LeftY * 205}
              r="7"
              fill="#dce9f3"
            />

            <line
              x1="160"
              y1={50 + b4LeftY * 205}
              x2="280"
              y2={50 + b4LeftY * 205}
              stroke="#6e9fba"
              strokeWidth="3"
            />

            <circle
              cx={160 + b4RightX * 120}
              cy={50 + b4RightY * 205}
              r="7"
              fill="#dce9f3"
            />

            <text x="25" y="275" className="s10-label">
              E encodes calibrated camera motion
            </text>
          </svg>
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            B4 · ESSENTIAL MATRIX
          </div>

          <h2>
            How does E encode camera motion?
          </h2>

          <p>
            The Essential Matrix describes the geometric relationship between
            two calibrated cameras. It combines camera translation and
            rotation to enforce the correspondence constraint.
          </p>

          <div className="s10-mathBox">
            <strong>CORE RELATION</strong>

            <code>
              E = [t]ₓ R
            </code>

            <code>
              x_R^T E x_L = 0
            </code>

            <strong>ROTATION</strong>

            <code>
              R = I
            </code>

            <strong>TRANSLATION</strong>

            <code>
              t = ({b4Tx.toFixed(2)}, 0, 0)
            </code>

            <strong>LEFT IMAGE POINT</strong>

            <code>
              x_L = ({b4LeftX.toFixed(2)}, {b4LeftY.toFixed(2)}, 1)
            </code>

            <strong>RIGHT IMAGE POINT</strong>

            <code>
              x_R = ({b4RightX.toFixed(2)}, {b4RightY.toFixed(2)}, 1)
            </code>
          </div>

          <div className="s10-controls">
            <Slider
              label="Translation x"
              value={b4Tx}
              min={0.1}
              max={0.5}
              step={0.1}
              unit=""
              onChange={setB4Tx}
            />

            <Slider
              label="Left image x"
              value={b4LeftX}
              min={0.2}
              max={0.7}
              step={0.01}
              unit=""
              onChange={setB4LeftX}
            />

            <Slider
              label="Left image y"
              value={b4LeftY}
              min={0.1}
              max={0.5}
              step={0.01}
              unit=""
              onChange={setB4LeftY}
            />

            <Slider
              label="Right image x"
              value={b4RightX}
              min={0.2}
              max={0.7}
              step={0.01}
              unit=""
              onChange={setB4RightX}
            />

            <Slider
              label="Right image y"
              value={b4RightY}
              min={0.1}
              max={0.5}
              step={0.01}
              unit=""
              onChange={setB4RightY}
            />
          </div>

          <div className="s10-mathBox">
            <strong>ESSENTIAL MATRIX</strong>

            <code>
              E = [ 0  0  0 ]
            </code>

            <code>
              {"    [ 0  0 -"}{b4Tx.toFixed(2)}{" ]"}
            </code>

            <code>
              {"    [ 0  "}{b4Tx.toFixed(2)}{"  0 ]"}
            </code>

            <strong>STEP 1 · TRANSFORM LEFT POINT</strong>

            <code>
              E x_L = (
              {b4ExL[0].toFixed(3)},{" "}
              {b4ExL[1].toFixed(3)},{" "}
              {b4ExL[2].toFixed(3)})
            </code>

            <strong>STEP 2 · ESSENTIAL CONSTRAINT</strong>

            <code>
              x_R^T E x_L ={" "}
              <b>{b4Constraint.toFixed(3)}</b>
            </code>
          </div>

          <div className="s10-interpretation">
            <strong>WHAT TO NOTICE</strong>

            <p>
              For a correct correspondence between two calibrated camera
              images:
            </p>

            <p>
              <strong>x_R^T E x_L = 0</strong>
            </p>

            <p>
              Move the right-image y coordinate away from the corresponding
              epipolar line and the constraint becomes non-zero.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
