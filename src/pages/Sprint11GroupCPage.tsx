import { useMemo, useState } from "react";
import {
  calculateCorrespondingRightX,
  calculateDisparityMap,
  calculateRectification,
  C2_DISPARITY_MAP,
  type StereoPoint,
} from "../stereoReconstructionMath";

function fmt(value: number, digits = 2): string {
  return value.toFixed(digits);
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
        {label} <b>{value.toFixed(2)}</b> {unit}
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


export default function Sprint11GroupCPage() {
  const [leftX, setLeftX] = useState(420);
  const [leftY, setLeftY] = useState(250);
  const [rightX, setRightX] = useState(340);
  const [rightY, setRightY] = useState(270);
  const [selectedRow, setSelectedRow] = useState(2);
  const [selectedColumn, setSelectedColumn] = useState(2);
  const [c2LeftX, setC2LeftX] = useState(420);

  const leftPoint: StereoPoint = useMemo(
    () => ({
      x: leftX,
      y: leftY,
    }),
    [leftX, leftY],
  );

  const rightPoint: StereoPoint = useMemo(
    () => ({
      x: rightX,
      y: rightY,
    }),
    [rightX, rightY],
  );

  const rectification = useMemo(
    () => calculateRectification(leftPoint, rightPoint),
    [leftPoint, rightPoint],
  );

  const disparityMap = useMemo(
    () =>
      calculateDisparityMap(
        C2_DISPARITY_MAP,
        selectedRow,
        selectedColumn,
      ),
    [selectedRow, selectedColumn],
  );

  const c2RightX = calculateCorrespondingRightX(
    c2LeftX,
    disparityMap.selectedDisparity,
  );

  return (
    <main className="s7-page s10-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">
          SPRINT 11 · GROUP C
        </div>

        <h1>Stereo Reconstruction</h1>

        <p>
          Rectify stereo images, calculate disparity maps, reconstruct depth,
          and recover 3D points from calibrated camera observations.
        </p>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          LEARNING PROGRESSION
        </div>

        <div className="s7b-flow">
          <span>RECTIFICATION</span>
          <b>→</b>
          <span>DISPARITY MAP</span>
          <b>→</b>
          <span>DEPTH RECONSTRUCTION</span>
          <b>→</b>
          <span>3D POINT RECOVERY</span>
        </div>
      </section>

      <section className="panel s10-experiment">
          <div className="s10-experimentVisual">
            <svg
              viewBox="0 0 300 300"
              width="300"
              height="300"
              role="img"
              aria-label="Stereo rectification"
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
                STEREO RECTIFICATION
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

              <line
                x1="20"
                y1={50 + (leftY / 480) * 205}
                x2="280"
                y2={50 + (leftY / 480) * 205}
                stroke="#6e9fba"
                strokeWidth="2"
                strokeDasharray="5 4"
              />

              <circle
                cx={20 + (leftX / 640) * 115}
                cy={50 + (leftY / 480) * 205}
                r="7"
                fill="#dce9f3"
              />

              <circle
                cx={160 + (rightX / 640) * 120}
                cy={50 + (rightY / 480) * 205}
                r="7"
                fill="#dce9f3"
              />

              <line
                x1={160 + (rightX / 640) * 120}
                y1={50 + (rightY / 480) * 205}
                x2={160 + (rightX / 640) * 120}
                y2={50 + (leftY / 480) * 205}
                stroke="#8db9d1"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              <circle
                cx={160 + (rightX / 640) * 120}
                cy={50 + (leftY / 480) * 205}
                r="5"
                fill="none"
                stroke="#8db9d1"
                strokeWidth="2"
              />

              <text x="25" y="275" className="s10-label">
                yL = yR after rectification
              </text>
            </svg>
          </div>

          <div className="s10-analysis">
            <div className="sectionEyebrow">
              C1 · STEREO RECTIFICATION
            </div>

            <h2>
              Why do we rectify stereo images?
            </h2>

            <p>
              Rectification transforms the two images so corresponding points
              lie on the same horizontal scanline. This changes correspondence
              search from a two-dimensional search into a horizontal search.
            </p>

            <div className="s10-mathBox">
              <strong>RECTIFICATION CONDITION</strong>

              <code>
                y<sub>L</sub> = y<sub>R</sub>
              </code>

              <strong>DISPARITY</strong>

              <code>
                d = x<sub>L</sub> - x<sub>R</sub>
              </code>

              <strong>VERTICAL ALIGNMENT ERROR</strong>

              <code>
                Δy = y<sub>L</sub> - y<sub>R</sub>
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
              <strong>BEFORE RECTIFICATION</strong>

              <code>
                y<sub>L</sub> = {fmt(leftY, 0)} px
              </code>

              <code>
                y<sub>R</sub> = {fmt(rightY, 0)} px
              </code>

              <code>
                Δy = {fmt(rectification.verticalErrorBefore, 0)} px
              </code>

              <strong>AFTER RECTIFICATION</strong>

              <code>
                y<sub>R,rectified</sub> = {fmt(rectification.rightRectified.y, 0)} px
              </code>

              <code>
                Δy = {fmt(rectification.verticalErrorAfter, 0)} px
              </code>

              <strong>DISPARITY</strong>

              <code>
                d = {fmt(rectification.disparity, 0)} px
              </code>
            </div>

            <div className="s10-interpretation">
              <strong>WHAT TO NOTICE</strong>

              <p>
                Before rectification, the corresponding points can have a
                vertical offset.
              </p>

              <p>
                Rectification moves the right point onto the left point's
                scanline while preserving its x coordinate.
              </p>

              <p>
                <strong>
                  After rectification: y<sub>L</sub> = y<sub>R</sub> and
                  disparity remains d = x<sub>L</sub> - x<sub>R</sub>.
                </strong>
              </p>
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
            aria-label="Interactive five by five disparity map"
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
              DISPARITY MAP
            </text>

            {C2_DISPARITY_MAP.map((row, rowIndex) =>
              row.map((disparity, columnIndex) => {
                const x = 35 + columnIndex * 46;
                const y = 58 + rowIndex * 40;
                const selected =
                  rowIndex === selectedRow &&
                  columnIndex === selectedColumn;

                const normalized = (disparity - 20) / 60;
                const shade = Math.round(45 + normalized * 150);

                return (
                  <g
                    key={`${rowIndex}-${columnIndex}`}
                    onClick={() => {
                      setSelectedRow(rowIndex);
                      setSelectedColumn(columnIndex);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Row ${rowIndex}, column ${columnIndex}, disparity ${disparity} pixels`}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setSelectedRow(rowIndex);
                        setSelectedColumn(columnIndex);
                      }
                    }}
                  >
                    <rect
                      x={x}
                      y={y}
                      width="40"
                      height="34"
                      rx="5"
                      fill={`rgb(${shade}, ${shade + 20}, ${shade + 35})`}
                      stroke={selected ? "#dce9f3" : "#34424d"}
                      strokeWidth={selected ? 3 : 1}
                    />

                    <text
                      x={x + 20}
                      y={y + 22}
                      textAnchor="middle"
                      className="s10-label"
                    >
                      {disparity}
                    </text>
                  </g>
                );
              }),
            )}

            <text x="35" y="275" className="s10-label">
              selected: ({selectedRow}, {selectedColumn})
            </text>
          </svg>
        </div>

        <div className="s10-analysis">
          <div className="sectionEyebrow">
            C2 · DISPARITY MAP
          </div>

          <h2>
            How does a stereo pair become a disparity map?
          </h2>

          <p>
            After rectification, corresponding points lie on the same
            horizontal scanline. For every correspondence, we measure the
            horizontal shift between the left and right images.
          </p>

          <div className="s10-mathBox">
            <strong>DISPARITY FORMULA</strong>

            <code>
              d = x<sub>L</sub> - x<sub>R</sub>
            </code>

            <strong>SELECTED CELL</strong>

            <code>
              D({disparityMap.selectedRow}, {disparityMap.selectedColumn}) ={" "}
              {fmt(disparityMap.selectedDisparity, 0)} px
            </code>

            <strong>CORRESPONDING RIGHT POSITION</strong>

            <code>
              x<sub>R</sub> = x<sub>L</sub> - d
            </code>

            <code>
              x<sub>R</sub> = {fmt(c2LeftX, 0)} -{" "}
              {fmt(disparityMap.selectedDisparity, 0)} ={" "}
              {fmt(c2RightX, 0)} px
            </code>

            <strong>VERIFICATION</strong>

            <code>
              {fmt(c2LeftX, 0)} - {fmt(c2RightX, 0)} ={" "}
              {fmt(c2LeftX - c2RightX, 0)} px
            </code>
          </div>

          <div className="s10-controls">
            <Slider
              label="Left image x"
              value={c2LeftX}
              min={100}
              max={540}
              step={10}
              unit="px"
              onChange={setC2LeftX}
            />
          </div>

          <div className="s10-interpretation">
            <strong>WHAT TO NOTICE</strong>

            <p>
              Click a cell in the disparity map. The selected disparity is
              used immediately in the correspondence calculation.
            </p>

            <p>
              A larger disparity means a larger horizontal shift between the
              two rectified views. A smaller disparity means a smaller shift.
            </p>

            <p>
              <strong>
                The next step is depth reconstruction. We deliberately do not
                introduce the depth equation here; that is C3.
              </strong>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
