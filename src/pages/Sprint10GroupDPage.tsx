import { useMemo, useState } from "react";
import {
  radialDistort,
  radialDistortToPixel,
  estimateK1FromCorrespondences,
  reprojectionError,
  rmse,
  type RadialDistortionParameters,
} from "../cameraDistortionMath";

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
      <span className="s10-controlLabel">
        {label}: <strong>{value.toFixed(2)}</strong>
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

export default function Sprint10GroupDPage() {
  const [x, setX] = useState(0.4);
  const [y, setY] = useState(0.3);
  const [k1, setK1] = useState(0.5);
  const [k2, setK2] = useState(0.1);

  // D2 — distorted normalized point → pixel coordinates
  const [d2X, setD2X] = useState(0.4);
  const [d2Y, setD2Y] = useState(0.3);
  const [d2K1, setD2K1] = useState(0.5);
  const [d2K2, setD2K2] = useState(0.1);
  const [d2Fx, setD2Fx] = useState(800);
  const [d2Fy, setD2Fy] = useState(800);
  const [d2Cx, setD2Cx] = useState(320);
  const [d2Cy, setD2Cy] = useState(240);

  const distortion: RadialDistortionParameters = useMemo(
    () => ({ k1, k2 }),
    [k1, k2],
  );

  const result = useMemo(
    () => radialDistort({ x, y }, distortion),
    [x, y, distortion],
  );





  const d2Result = useMemo(
    () =>
      radialDistortToPixel(
        { x: d2X, y: d2Y },
        { k1: d2K1, k2: d2K2 },
        {
          fx: d2Fx,
          fy: d2Fy,
          cx: d2Cx,
          cy: d2Cy,
        },
      ),
    [d2X, d2Y, d2K1, d2K2, d2Fx, d2Fy, d2Cx, d2Cy],
  );

  // D3 — estimate k1 from known ideal/observed correspondences
  const [d3HiddenK1, setD3HiddenK1] = useState(0.5);

  const d3Correspondences = useMemo(() => {
    const idealPoints = [
      { x: 0.2, y: 0.1 },
      { x: 0.4, y: 0.1 },
      { x: 0.3, y: 0.3 },
    ];

    return idealPoints.map((ideal) => ({
      ideal,
      observed: radialDistort(ideal, { k1: d3HiddenK1, k2: 0 }).distorted,
    }));
  }, [d3HiddenK1]);

  const d3EstimatedK1 = useMemo(
    () => estimateK1FromCorrespondences(d3Correspondences),
    [d3Correspondences],
  );

  // D4 — Reprojection Error
  const [d4ObservedU, setD4ObservedU] = useState(682);
  const [d4ObservedV, setD4ObservedV] = useState(512);
  const [d4PredictedU, setD4PredictedU] = useState(682);
  const [d4PredictedV, setD4PredictedV] = useState(511.5);

  const d4Result = useMemo(
    () =>
      reprojectionError(
        { u: d4ObservedU, v: d4ObservedV },
        { u: d4PredictedU, v: d4PredictedV },
      ),
    [d4ObservedU, d4ObservedV, d4PredictedU, d4PredictedV],
  );

  const d4Rmse = useMemo(
    () => rmse([d4Result.error]),
    [d4Result.error],
  );







  return (
    <main className="s7-page s10-page">
      <section className="s7b-hero">
        <div>
          <div className="s7-eyebrow">SPRINT 10 · GROUP D</div>
          <h1>Distortion + Calibration</h1>
          <p>
            Understand how real camera lenses bend ideal image coordinates,
            and how calibration estimates the parameters of that distortion.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          LEARNING PROGRESSION
        </div>

        <div className="s7b-flow">
          <span>IDEAL POINT</span>
          <b>→</b>
          <span>DISTORTION</span>
          <b>→</b>
          <span>PIXEL</span>
          <b>→</b>
          <span>CALIBRATION</span>
          <b>→</b>
          <span>REPROJECTION ERROR</span>
        </div>
      </section>

      <section className="panel s10-experiment">
        <div className="s10-experimentVisual">
          <svg
            viewBox="0 0 300 300"
            width="300"
            height="300"
            role="img"
            aria-label="Radial distortion visualization"
          >
            <rect
              x="0"
              y="0"
              width="300"
              height="300"
              rx="14"
              fill="#0d1822"
            />

            <line
              x1="30"
              y1="150"
              x2="270"
              y2="150"
              stroke="#355064"
              strokeWidth="1"
            />

            <line
              x1="150"
              y1="30"
              x2="150"
              y2="270"
              stroke="#355064"
              strokeWidth="1"
            />

            <circle
              cx="150"
              cy="150"
              r="100"
              fill="none"
              stroke="#294354"
              strokeWidth="1"
              strokeDasharray="4 5"
            />

            <line
              x1="150"
              y1="150"
              x2={150 + x * 100}
              y2={150 - y * 100}
              stroke="#8db9d1"
              strokeWidth="2"
            />

            <circle
              cx={150 + x * 100}
              cy={150 - y * 100}
              r="6"
              fill="#8db9d1"
            />

            <line
              x1="150"
              y1="150"
              x2={150 + result.distorted.x * 100}
              y2={150 - result.distorted.y * 100}
              stroke="#f2c14e"
              strokeWidth="2"
            />

            <circle
              cx={150 + result.distorted.x * 100}
              cy={150 - result.distorted.y * 100}
              r="6"
              fill="#f2c14e"
            />

            <circle
              cx="150"
              cy="150"
              r="4"
              fill="#dce9f3"
            />

            <text
              x="38"
              y="42"
              fill="#8db9d1"
              fontSize="13"
              fontWeight="700"
            >
              ideal
            </text>

            <text
              x="38"
              y="60"
              fill="#f2c14e"
              fontSize="13"
              fontWeight="700"
            >
              distorted
            </text>
          </svg>
        </div>

        <div className="s10-analysis">
          <div className="s10-sectionLabel">D1 · RADIAL DISTORTION</div>
          <h2>How a lens moves a point</h2>
          <p>
            Start with an ideal normalized image point. Radial distortion
            moves that point according to its distance from the optical axis.
          </p>

          <div className="s10-controls">
            <Slider
              label="x"
              value={x}
              min={-0.8}
              max={0.8}
              step={0.05}
              onChange={setX}
            />
            <Slider
              label="y"
              value={y}
              min={-0.8}
              max={0.8}
              step={0.05}
              onChange={setY}
            />
            <Slider
              label="k₁"
              value={k1}
              min={-1}
              max={1}
              step={0.05}
              onChange={setK1}
            />
            <Slider
              label="k₂"
              value={k2}
              min={-1}
              max={1}
              step={0.05}
              onChange={setK2}
            />
          </div>

          <div className="s10-mathBox">
            <div>Ideal point: ({x.toFixed(4)}, {y.toFixed(4)})</div>
            <div>r² = {result.radiusSquared.toFixed(4)}</div>
            <div>Radial factor = {result.radialFactor.toFixed(4)}</div>
            <div>
              Distorted point: ({result.distorted.x.toFixed(4)},{" "}
              {result.distorted.y.toFixed(4)})
            </div>
          </div>

          <div className="s10-mathBox">
            <strong>Formula</strong>
            <div>r² = x² + y²</div>
            <div>s = 1 + k₁r² + k₂r⁴</div>
            <div>xᵈ = xs</div>
            <div>yᵈ = ys</div>
          </div>

          <div className="s10-interpretation">
            <strong>What to notice</strong>
            <p>
              Distortion becomes stronger as the point moves farther from the
              optical center. Positive radial coefficients generally push the
              point outward; negative coefficients pull it inward.
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
            aria-label="Distorted normalized point mapped to pixel coordinates"
          >
            <rect
              x="0"
              y="0"
              width="300"
              height="300"
              rx="14"
              fill="#0d1822"
            />

            <rect
              x="50"
              y="50"
              width="200"
              height="200"
              fill="none"
              stroke="#294354"
              strokeWidth="1"
            />

            <line
              x1="50"
              y1="150"
              x2="250"
              y2="150"
              stroke="#355064"
              strokeWidth="1"
            />

            <line
              x1="150"
              y1="50"
              x2="150"
              y2="250"
              stroke="#355064"
              strokeWidth="1"
            />

            <circle
              cx={150 + d2Result.distorted.x * 100}
              cy={150 - d2Result.distorted.y * 100}
              r="7"
              fill="#f2c14e"
            />

            <circle
              cx="150"
              cy="150"
              r="4"
              fill="#dce9f3"
            />

            <line
              x1="150"
              y1="150"
              x2={150 + d2Result.distorted.x * 100}
              y2={150 - d2Result.distorted.y * 100}
              stroke="#f2c14e"
              strokeWidth="2"
            />

            <text
              x="62"
              y="38"
              fill="#dce9f3"
              fontSize="13"
              fontWeight="700"
            >
              DISTORTED NORMALIZED → PIXEL
            </text>

            <text
              x="58"
              y="272"
              fill="#8db9d1"
              fontSize="12"
            >
              optical center (0,0)
            </text>
          </svg>
        </div>

        <div className="s10-analysis">
          <div className="s10-sectionLabel">D2 · DISTORTED PIXEL COORDINATES</div>

          <h2>
            Turn the distorted normalized point into a pixel
          </h2>

          <p>
            D1 moved the ideal point because of lens distortion. D2 now uses
            the camera intrinsics to convert that distorted normalized point
            into actual image pixel coordinates.
          </p>

          <div className="s10-controls">
            <Slider
              label="x"
              value={d2X}
              min={-0.8}
              max={0.8}
              step={0.05}
              onChange={setD2X}
            />
            <Slider
              label="y"
              value={d2Y}
              min={-0.8}
              max={0.8}
              step={0.05}
              onChange={setD2Y}
            />
            <Slider
              label="k₁"
              value={d2K1}
              min={-1}
              max={1}
              step={0.05}
              onChange={setD2K1}
            />
            <Slider
              label="k₂"
              value={d2K2}
              min={-1}
              max={1}
              step={0.05}
              onChange={setD2K2}
            />
          </div>

          <div className="s10-controls">
            <Slider
              label="fₓ"
              value={d2Fx}
              min={400}
              max={1200}
              step={50}
              onChange={setD2Fx}
            />
            <Slider
              label="fᵧ"
              value={d2Fy}
              min={400}
              max={1200}
              step={50}
              onChange={setD2Fy}
            />
            <Slider
              label="cₓ"
              value={d2Cx}
              min={200}
              max={440}
              step={10}
              onChange={setD2Cx}
            />
            <Slider
              label="cᵧ"
              value={d2Cy}
              min={120}
              max={360}
              step={10}
              onChange={setD2Cy}
            />
          </div>

          <div className="s10-mathBox">
            <div>
              Ideal normalized point: ({d2X.toFixed(4)}, {d2Y.toFixed(4)})
            </div>
            <div>
              r² = {d2Result.radiusSquared.toFixed(4)}
            </div>
            <div>
              Radial factor = {d2Result.radialFactor.toFixed(4)}
            </div>
            <div>
              Distorted normalized point: ({d2Result.distorted.x.toFixed(4)},{" "}
              {d2Result.distorted.y.toFixed(4)})
            </div>
          </div>

          <div className="s10-mathBox">
            <strong>Pixel projection</strong>
            <div>
              u = fₓxᵈ + cₓ
            </div>
            <div>
              = {d2Fx}({d2Result.distorted.x.toFixed(4)}) + {d2Cx}
            </div>
            <div>
              = {d2Result.pixel.u.toFixed(2)} px
            </div>
            <div>
              v = fᵧyᵈ + cᵧ
            </div>
            <div>
              = {d2Fy}({d2Result.distorted.y.toFixed(4)}) + {d2Cy}
            </div>
            <div>
              = {d2Result.pixel.v.toFixed(2)} px
            </div>
          </div>

          <div className="s10-interpretation">
            <strong>What to notice</strong>
            <p>
              Distortion changes the normalized location first. The intrinsic
              parameters then scale and shift that location into the camera
              image coordinate system measured in pixels.
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
          aria-label="Known ideal points and observed distorted points used for camera calibration"
        >
          <rect x="0" y="0" width="300" height="300" rx="14" fill="#0d1822" />
          <rect x="50" y="50" width="200" height="200" fill="none" stroke="#294354" strokeWidth="1" />
          <line x1="50" y1="150" x2="250" y2="150" stroke="#355064" strokeWidth="1" />
          <line x1="150" y1="50" x2="150" y2="250" stroke="#355064" strokeWidth="1" />

          {d3Correspondences.map((pair, index) => {
            const ix = 150 + pair.ideal.x * 100;
            const iy = 150 - pair.ideal.y * 100;
            const ox = 150 + pair.observed.x * 100;
            const oy = 150 - pair.observed.y * 100;
            return (
              <g key={index}>
                <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="#5f7f92" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={ix} cy={iy} r="5" fill="#8db9d1" />
                <circle cx={ox} cy={oy} r="5" fill="#f2c14e" />
                <text x={ix + 7} y={iy - 7} fill="#8db9d1" fontSize="10">I{index + 1}</text>
                <text x={ox + 7} y={oy + 12} fill="#f2c14e" fontSize="10">O{index + 1}</text>
              </g>
            );
          })}

          <text x="62" y="38" fill="#dce9f3" fontSize="13" fontWeight="700">CALIBRATION CORRESPONDENCES</text>
          <text x="58" y="272" fill="#8db9d1" fontSize="11">ideal = blue · observed = yellow</text>
        </svg>
      </div>

      <div className="s10-analysis">
        <div className="s10-sectionLabel">D3 · CAMERA CALIBRATION</div>

        <h2>Estimate the lens distortion from known points</h2>

        <p>
          In a real calibration process, we know where calibration points should appear and measure where the camera actually sees them. Here we simulate that observation and recover the unknown distortion parameter k₁.
        </p>

        <div className="s10-controls">
          <Slider
            label="hidden k₁"
            value={d3HiddenK1}
            min={-1}
            max={1}
            step={0.05}
            onChange={setD3HiddenK1}
          />
        </div>

        <div className="s10-mathBox">
          <div><strong>Known ideal points</strong></div>
          {d3Correspondences.map((pair, index) => (
            <div key={index}>
              P{index + 1}: ({pair.ideal.x.toFixed(3)}, {pair.ideal.y.toFixed(3)}) → observed ({pair.observed.x.toFixed(4)}, {pair.observed.y.toFixed(4)})</div>
          ))}
        </div>

        <div className="s10-mathBox">
          <div><strong>Calibration equation</strong></div>
          <div>r² = x² + y²</div>
          <div>yᵢ = xᵢᵈ / xᵢ − 1</div>
          <div>k₁ = Σ(r²yᵢ) / Σ(r⁴)</div>
          <div>Estimated k₁ = {d3EstimatedK1.toFixed(4)}</div>
        </div>

        <div className="s10-interpretation">
          <strong>What to notice</strong>
          <p>
            The camera does not tell us k₁ directly. We infer it from many known correspondences. In this controlled example, the estimated value should recover the hidden value, showing the basic idea behind camera calibration.
          </p>
        </div>
      </div>
    </section>


    <section className="panel s10-experiment">
      <div className="s10-experimentVisual">
        <svg viewBox="0 0 300 300" width="300" height="300" role="img" aria-label="Reprojection error visual">
          <rect x="0" y="0" width="300" height="300" rx="12" fill="#101820" />
          <line x1="40" y1="150" x2="260" y2="150" stroke="#526574" strokeWidth="1" />
          <line x1="150" y1="40" x2="150" y2="260" stroke="#526574" strokeWidth="1" />

          <line
            x1={150 + (d4PredictedU - 650) * 0.7}
            y1={150 - (d4PredictedV - 450) * 0.7}
            x2={150 + (d4ObservedU - 650) * 0.7}
            y2={150 - (d4ObservedV - 450) * 0.7}
            stroke="#e6c85c"
            strokeWidth="3"
            strokeDasharray="6 5"
          />

          <circle
            cx={150 + (d4PredictedU - 650) * 0.7}
            cy={150 - (d4PredictedV - 450) * 0.7}
            r="8"
            fill="#6ea8d7"
          />

          <circle
            cx={150 + (d4ObservedU - 650) * 0.7}
            cy={150 - (d4ObservedV - 450) * 0.7}
            r="8"
            fill="#e6c85c"
          />

          <text
            x={150 + (d4PredictedU - 650) * 0.7 + 12}
            y={150 - (d4PredictedV - 450) * 0.7 - 10}
            fill="#dce9f3"
            fontSize="12"
          >
            predicted
          </text>

          <text
            x={150 + (d4ObservedU - 650) * 0.7 + 12}
            y={150 - (d4ObservedV - 450) * 0.7 + 18}
            fill="#dce9f3"
            fontSize="12"
          >
            observed
          </text>

          <text x="18" y="282" fill="#8fa5b5" fontSize="11">
            error vector = observed − predicted
          </text>
        </svg>
      </div>

      <div className="s10-experimentAnalysis">
        <div className="s10-sectionLabel">D4 · REPROJECTION ERROR</div>

        <h2>Measure how well the camera model explains the image</h2>

        <p className="s10-description">
          A calibrated camera predicts where a known 3D point should appear.
          Reprojection error measures the distance between that prediction and
          the pixel that was actually observed.
        </p>

        <div className="s10-controls">
          <Slider
            label="Observed u"
            value={d4ObservedU}
            min={650}
            max={710}
            step={0.5}
            onChange={setD4ObservedU}
          />
          <Slider
            label="Observed v"
            value={d4ObservedV}
            min={480}
            max={540}
            step={0.5}
            onChange={setD4ObservedV}
          />
          <Slider
            label="Predicted u"
            value={d4PredictedU}
            min={650}
            max={710}
            step={0.5}
            onChange={setD4PredictedU}
          />
          <Slider
            label="Predicted v"
            value={d4PredictedV}
            min={480}
            max={540}
            step={0.5}
            onChange={setD4PredictedV}
          />
        </div>

        <div className="s10-mathBox">
          <div><strong>Step 1 — Pixel difference</strong></div>
          <div>
            Δu = u<sub>observed</sub> − u<sub>predicted</sub>
          </div>
          <div>
            Δu = {d4ObservedU.toFixed(1)} − {d4PredictedU.toFixed(1)}
            {" "} = <strong>{d4Result.du.toFixed(1)} px</strong>
          </div>
          <div>
            Δv = v<sub>observed</sub> − v<sub>predicted</sub>
          </div>
          <div>
            Δv = {d4ObservedV.toFixed(1)} − {d4PredictedV.toFixed(1)}
            {" "} = <strong>{d4Result.dv.toFixed(1)} px</strong>
          </div>
        </div>

        <div className="s10-mathBox">
          <div><strong>Step 2 — Reprojection error</strong></div>
          <div>
            e = √(Δu² + Δv²)
          </div>
          <div>
            e = √(({d4Result.du.toFixed(1)})² + ({d4Result.dv.toFixed(1)})²)
          </div>
          <div>
            <strong>e = {d4Result.error.toFixed(3)} px</strong>
          </div>
        </div>

        <div className="s10-mathBox">
          <div><strong>Step 3 — RMSE</strong></div>
          <div>
            RMSE = √(Σeᵢ² / N)
          </div>
          <div>
            RMSE = √(({d4Result.error.toFixed(3)})² / 1)
          </div>
          <div>
            <strong>RMSE = {d4Rmse.toFixed(3)} px</strong>
          </div>
        </div>

        <div className="s10-interpretation">
          <strong>What to notice</strong>
          <p>
            When observed and predicted pixels coincide, the reprojection
            error is zero. As the observed point moves away from the predicted
            point, the error grows. In industrial vision, a small reprojection
            error indicates that the camera model explains the observed image
            geometry closely enough for measurement and alignment tasks.
          </p>
        </div>
      </div>
    </section>
    </main>
  );
}
