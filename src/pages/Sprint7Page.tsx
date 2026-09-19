import { useEffect, useMemo, useRef, useState } from "react";
import { makeScene } from "../imageScenes";
import { normalizeForDisplay } from "../math";
import { derivativeDisplayImages, derivativePixel, verifyConstantImageDerivatives, verifyRampDerivative, type DerivativeMethod } from "../derivativeMath";
import { edgeDisplayImage, edgePixel, edgeResponse, noiseAmplificationExperiment, thresholdEdges, verifyConstantEdges, verifyHorizontalStep, verifyLoGKernel, verifyNoiseAmplification, verifyZeroCrossingStep, zeroCrossingEdges, type EdgeOperator } from "../edgeDetectionMath";
import { SCALE_VALUES, derivativeOfGaussianDisplay, gaussianSmooth, scaleSpace, verifyDerivativeKernelSums, verifyDerivativeOfGaussian, verifyGaussianKernel, verifyGaussianSmoothing } from "../scaleSpaceMath";
import {
  accumulateDualityVotes,
  createDualityDataset,
  findDualityPeaks,
  lineFromRhoTheta,
  pointToSinusoid,
  type DualityPoint,
} from "../houghDualityMath";
import {
  cannyEdgeDetection,
  houghAccumulatorDisplay,
  houghTransform,
  lineToEndpoints,
  verifyCannyStep,
  verifyHoughAccumulator,
  verifyHoughVerticalLine,
  verifyHysteresis,
  verifyNmsStep,
} from "../cannyHoughMath";


type ImageLike = { width: number; height: number; data: Float32Array };

function drawGray(canvas: HTMLCanvasElement | null, image: ImageLike) {
  if (!canvas) return;
  canvas.width = image.width; canvas.height = image.height;
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  const id = ctx.createImageData(image.width, image.height);
  for (let i = 0; i < image.data.length; i++) {
    const v = Math.max(0, Math.min(255, Math.round(image.data[i])));
    id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
}

function LabCanvas({ label, image }: { label: string; image: ImageLike }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => drawGray(ref.current, image), [image]);
  return <div className="s7a-imageCard"><div className="s7a-imageLabel">{label}</div><canvas ref={ref} className="s7a-canvas" /></div>;
}

function GroupA() {
  const [method, setMethod] = useState<DerivativeMethod>("central");
  const [sceneName, setSceneName] = useState("step");
  const [x, setX] = useState(128), [y, setY] = useState(128);
  const image = useMemo(() => makeScene(sceneName), [sceneName]);
  const display = useMemo(() => derivativeDisplayImages(image, method), [image, method]);
  const pixel = useMemo(() => derivativePixel(image, x, y, method), [image, x, y, method]);
  const sourceDisplay = useMemo(() => normalizeForDisplay(image), [image]);
  const verification = [
    { label: "Constant image → zero derivatives", pass: verifyConstantImageDerivatives() },
    { label: "Horizontal ramp → Ix ≈ 1, Iy ≈ 0", pass: verifyRampDerivative() },
  ];
  return <>
    <section className="s7a-hero"><div className="sectionEyebrow">SPRINT 7 · GROUP A</div><h1>Derivatives &amp; Gradients</h1><p>An edge is a place where image intensity changes rapidly. This laboratory turns that idea into numbers.</p><div className="s7a-meta"><span className="statusPill statusCurrent">● COMPLETE</span><span>First derivatives</span><span>Gradient magnitude</span><span>Gradient orientation</span></div></section>
    <section className="s7a-roadmap panel"><div className="sectionEyebrow">GROUP A LEARNING PATH</div><div className="s7a-flow"><span>IMAGE</span><b>→</b><span>CHANGE IN X</span><b>→</b><span>CHANGE IN Y</span><b>→</b><span>GRADIENT</span><b>→</b><span>EDGE EVIDENCE</span></div></section>
    <section className="s7a-controls panel"><div><div className="sectionEyebrow">EXPERIMENT CONTROLS</div><h2>Change the scene and derivative operator</h2><p>Central difference shows the finite-difference idea. Sobel adds weighted smoothing while measuring directional change.</p></div><label>IMAGE<select value={sceneName} onChange={e => setSceneName(e.target.value)}><option value="step">Step edge</option><option value="ramp">Horizontal ramp</option><option value="checker">Checkerboard</option><option value="corner">Corner</option><option value="shapes">Synthetic scene</option><option value="noisy">Noisy scene</option><option value="constant">Constant image</option></select></label><div className="s7a-methodButtons"><button className={method === "central" ? "active" : ""} onClick={() => setMethod("central")}>Central Difference</button><button className={method === "sobel" ? "active" : ""} onClick={() => setMethod("sobel")}>Sobel</button></div></section>
    <section className="s7a-mainGrid"><div className="s7a-imageCard"><div className="s7a-imageLabel">INPUT IMAGE · CLICK TO PROBE</div><canvas className="s7a-canvas s7a-clickable" ref={node => { if (!node) return; drawGray(node, sourceDisplay); node.onpointerdown = e => { const r = node.getBoundingClientRect(); setX(Math.max(0, Math.min(node.width - 1, Math.round(((e.clientX - r.left) / r.width) * (node.width - 1))))); setY(Math.max(0, Math.min(node.height - 1, Math.round(((e.clientY - r.top) / r.height) * (node.height - 1))))); }; }} /><div className="s7a-coordinate">Selected pixel: ({x}, {y})</div></div><LabCanvas label="Ix · HORIZONTAL DERIVATIVE" image={display.ix}/><LabCanvas label="Iy · VERTICAL DERIVATIVE" image={display.iy}/><LabCanvas label="|∇I| · GRADIENT MAGNITUDE" image={display.magnitude}/><LabCanvas label="θ · GRADIENT ORIENTATION" image={display.orientation}/></section>
    <section className="s7a-equation panel"><div className="sectionEyebrow">THE MATHEMATICS</div><h2>From two directional changes to one gradient</h2><div className="s7a-equationGrid"><div><code>I_x = ∂I/∂x</code><span>Horizontal intensity change.</span></div><div><code>I_y = ∂I/∂y</code><span>Vertical intensity change.</span></div><div><code>∇I = [ I_x, I_y ]ᵀ</code><span>The gradient points toward greatest increase.</span></div><div><code>|∇I| = √(I_x² + I_y²)</code><span>Large magnitude means strong local change.</span></div><div><code>θ = atan2(I_y, I_x)</code><span>Orientation of the gradient.</span></div></div></section>
    <section className="s7a-pixel panel"><div className="sectionEyebrow">PIXEL-BY-PIXEL INSPECTOR</div><h2>What happened at ({x}, {y})?</h2><p>These are raw values. The images above are normalized separately for display.</p><div className="s7a-pixelGrid"><div><span>INPUT</span><b>{pixel.center.toFixed(2)}</b></div><div><span>Ix</span><b>{pixel.ix.toFixed(4)}</b></div><div><span>Iy</span><b>{pixel.iy.toFixed(4)}</b></div><div><span>|∇I|</span><b>{pixel.magnitude.toFixed(4)}</b></div><div><span>θ (rad)</span><b>{pixel.orientation.toFixed(4)}</b></div><div><span>θ (deg)</span><b>{(pixel.orientation * 180 / Math.PI).toFixed(2)}°</b></div></div></section>
    <section className="s7a-finite panel"><div className="sectionEyebrow">FINITE-DIFFERENCE INTUITION</div><h2>The derivative compares nearby pixels</h2><div className="s7a-finiteGrid"><div><code>Ix ≈ [ I(x+1,y) − I(x−1,y) ] / 2</code><p>Compare left and right neighbours.</p></div><div><code>Iy ≈ [ I(x,y+1) − I(x,y−1) ] / 2</code><p>Compare upper and lower neighbours.</p></div></div><div className="s7a-takeaway"><b>KEY IDEA</b><span>A derivative filter asks how quickly brightness is changing here.</span></div></section>
    <section className="s7a-verification panel"><div className="sectionEyebrow">GROUP A VERIFICATION</div><div className="s7a-checkGrid">{verification.map((item, index) => <div key={item.label}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.label}</b><strong>{item.pass ? "PASS" : "REVIEW"}</strong></div>)}</div></section>
    <section className="s7a-next panel"><div className="sectionEyebrow">GROUP A → GROUP B</div><h2>Next: turn derivatives into practical edge detectors</h2><p>First derivatives measure directional change. Group B compares Roberts, Prewitt, and Sobel, then introduces the Laplacian and Laplacian of Gaussian.</p></section>
  </>;
}

function GroupB() {
  const [operator, setOperator] = useState<EdgeOperator>("sobel");
  const [sceneName, setSceneName] = useState("step");
  const [sigma, setSigma] = useState(1);
  const [threshold, setThreshold] = useState(40);
  const [zeroThreshold, setZeroThreshold] = useState(5);
  const [noiseSigma, setNoiseSigma] = useState(18);
  const [x, setX] = useState(128), [y, setY] = useState(128);
  const image = useMemo(() => makeScene(sceneName), [sceneName]);
  const response = useMemo(() => edgeResponse(image, operator, sigma), [image, operator, sigma]);
  const responseDisplay = useMemo(() => edgeDisplayImage(image, operator, sigma), [image, operator, sigma]);
  const edgeMap = useMemo(() => thresholdEdges(response, threshold), [response, threshold]);
  // Zero crossings require a signed second-derivative response.
  const secondDerivativeOperator: EdgeOperator =
    operator === "log" ? "log" : "laplacian";

  const secondDerivativeResponse = useMemo(
    () => edgeResponse(image, secondDerivativeOperator, sigma),
    [image, secondDerivativeOperator, sigma]
  );

  const zeroCrossings = useMemo(
    () => zeroCrossingEdges(secondDerivativeResponse, zeroThreshold),
    [secondDerivativeResponse, zeroThreshold]
  );
  const noiseExperiment = useMemo(() => noiseAmplificationExperiment(noiseSigma, 42), [noiseSigma]);
  const noiseDifferenceDisplay = useMemo(() => normalizeForDisplay(noiseExperiment.difference), [noiseExperiment.difference]);



  const sourceDisplay = useMemo(() => normalizeForDisplay(image), [image]);
  const pixel = useMemo(() => edgePixel(image, x, y, operator, sigma), [image, x, y, operator, sigma]);
  const operators: { id: EdgeOperator; label: string; detail: string }[] = [
    { id: "roberts", label: "Roberts", detail: "2×2 diagonal first derivatives" },
    { id: "prewitt", label: "Prewitt", detail: "3×3 directional derivatives" },
    { id: "sobel", label: "Sobel", detail: "3×3 derivative + weighted smoothing" },
    { id: "laplacian", label: "Laplacian", detail: "Second derivative in x and y" },
    { id: "log", label: "LoG", detail: "Gaussian smoothing + Laplacian" },
  ];
  const verification = [
    { label: "Constant image → no edge response", pass: verifyConstantEdges() },
    { label: "Horizontal step → Sobel detects transition", pass: verifyHorizontalStep() },
    { label: "LoG kernel sums to approximately zero", pass: verifyLoGKernel() },
    { label: "Laplacian step -> zero crossing exists", pass: verifyZeroCrossingStep() },
    { label: "First difference -> noise variance approx 2x", pass: verifyNoiseAmplification() },
    { label: "Laplacian step -> zero crossing exists", pass: verifyZeroCrossingStep() },
    { label: "First difference -> noise variance approx 2x", pass: verifyNoiseAmplification() },
  ];
  return <>
    <section className="s7b-hero"><div className="sectionEyebrow">SPRINT 7 · GROUP B</div><h1>Edge Detection</h1><p>Turn the derivative idea into practical edge operators. Compare first-derivative detectors with second-derivative methods and see exactly where edges appear.</p><div className="s7a-meta"><span className="statusPill statusCurrent">● CURRENT</span><span>Roberts</span><span>Prewitt</span><span>Sobel</span><span>Laplacian</span><span>LoG</span></div></section>
    <section className="s7b-roadmap panel"><div className="sectionEyebrow">GROUP B LEARNING PATH</div><div className="s7b-flow"><span>INTENSITY</span><b>→</b><span>DERIVATIVE</span><b>→</b><span>EDGE RESPONSE</span><b>→</b><span>THRESHOLD</span><b>→</b><span>EDGE MAP</span></div></section>
    <section className="s7b-controls panel"><div><div className="sectionEyebrow">EDGE LAB CONTROLS</div><h2>Choose an image and edge operator</h2><p>Keep the scene fixed and change only the operator. For LoG, change σ to see how smoothing changes which structures survive.</p></div><div className="s7b-controlField"><label>IMAGE<select value={sceneName} onChange={e => setSceneName(e.target.value)}><option value="step">Step edge</option><option value="ramp">Horizontal ramp</option><option value="checker">Checkerboard</option><option value="corner">Corner</option><option value="shapes">Synthetic scene</option><option value="noisy">Noisy scene</option><option value="constant">Constant image</option></select></label></div><div className="s7b-controlField"><label>EDGE OPERATOR</label><div className="s7b-operatorButtons">{operators.map(op => <button key={op.id} className={operator === op.id ? "active" : ""} onClick={() => setOperator(op.id)}>{op.label}</button>)}</div></div><div className="s7b-parameterStack">{operator === "log" && <label className="s7b-slider">SIGMA<input type="range" min={0.5} max={2} step={0.5} value={sigma} onChange={e => setSigma(Number(e.target.value))}/><b>{sigma.toFixed(1)}</b></label>}<label className="s7b-slider">THRESHOLD<input type="range" min={0} max={150} step={5} value={threshold} onChange={e => setThreshold(Number(e.target.value))}/><b>{threshold}</b></label></div></section>
    <section className="s7b-mainGrid"><div className="s7a-imageCard"><div className="s7a-imageLabel">INPUT IMAGE · CLICK TO PROBE</div><canvas className="s7a-canvas s7a-clickable" ref={node => { if (!node) return; drawGray(node, sourceDisplay); node.onpointerdown = e => { const r = node.getBoundingClientRect(); setX(Math.max(0, Math.min(node.width - 1, Math.round(((e.clientX - r.left) / r.width) * (node.width - 1))))); setY(Math.max(0, Math.min(node.height - 1, Math.round(((e.clientY - r.top) / r.height) * (node.height - 1))))); }; }} /><div className="s7a-coordinate">Selected pixel: ({x}, {y})</div></div><LabCanvas label={`${operators.find(o => o.id === operator)?.label} · RAW RESPONSE`} image={responseDisplay}/><LabCanvas label="THRESHOLDED EDGE MAP" image={edgeMap}/></section>
    <section className="s7b-second panel"><div><div className="sectionEyebrow">SECOND-DERIVATIVE ANALYSIS</div><h2>Zero crossings reveal sign changes</h2><p>Zero crossings are computed from a signed second-derivative response. Laplacian is used for Roberts, Prewitt, and Sobel selections; LoG is used when LoG is selected.</p></div><div className="s7b-secondControls"><label>ZERO-CROSSING THRESHOLD<input type="range" min={0} max={50} step={1} value={zeroThreshold} onChange={e => setZeroThreshold(Number(e.target.value))}/><b>{zeroThreshold}</b></label></div><LabCanvas label={`${secondDerivativeOperator === "log" ? "LoG" : "LAPLACIAN"} · ZERO-CROSSING MAP`} image={zeroCrossings}/></section>
    <section className="s7b-noise panel"><div className="sectionEyebrow">NOISE + DIFFERENTIATION</div><h2>Why smoothing matters before differentiation</h2><p>For independent noise with variance sigma-squared, a simple difference n2-n1 has variance 2 sigma-squared. This controlled experiment makes that amplification visible.</p><label>INPUT NOISE σ<input type="range" min={2} max={40} step={2} value={noiseSigma} onChange={e => setNoiseSigma(Number(e.target.value))}/><b>{noiseSigma}</b></label><div className="s7b-noiseGrid"><LabCanvas label="NOISY CONSTANT IMAGE" image={noiseExperiment.noisy}/><LabCanvas label="FIRST DIFFERENCE RESPONSE" image={noiseDifferenceDisplay}/><div className="s7b-noiseMetrics"><div><span>INPUT VARIANCE</span><b>{noiseExperiment.inputVariance.toFixed(2)}</b></div><div><span>DERIVATIVE VARIANCE</span><b>{noiseExperiment.derivativeVariance.toFixed(2)}</b></div><div><span>MEASURED RATIO</span><b>{noiseExperiment.varianceRatio.toFixed(2)}x</b></div><div><span>THEORY</span><b>{noiseExperiment.expectedRatio.toFixed(0)}x</b></div></div></div></section>


    <section className="s7b-compare panel"><div className="sectionEyebrow">OPERATOR COMPARISON</div><h2>What changes when the edge operator changes?</h2><div className="s7b-operatorCards">{operators.map(op => <article key={op.id} className={operator === op.id ? "active" : ""} onClick={() => setOperator(op.id)}><div className="s7b-cardTitle"><b>{op.label}</b><span>{op.id === "laplacian" || op.id === "log" ? "2nd order" : "1st order"}</span></div><p>{op.detail}</p></article>)}</div></section>
    <section className="s7b-math panel"><div className="sectionEyebrow">THE MATHEMATICS</div><h2>Five operators, two main ideas</h2><div className="s7b-equationGrid"><div><code>G = √(Gx² + Gy²)</code><span>Roberts, Prewitt and Sobel combine directional first derivatives.</span></div><div><code>∇²I = Ixx + Iyy</code><span>The Laplacian measures second-order change in both directions.</span></div><div><code>LoG(I) = ∇²(Gσ * I)</code><span>LoG smooths first, then applies the Laplacian.</span></div><div><code>|R(x,y)| ≥ T</code><span>Thresholding converts a response into a binary edge map.</span></div></div></section>
    <section className="s7b-pixel panel"><div className="sectionEyebrow">PIXEL-BY-PIXEL INSPECTOR</div><h2>What did {operators.find(o => o.id === operator)?.label} do at ({x}, {y})?</h2><p>Inspect the raw response before thresholding. Positive and negative second-derivative responses are meaningful even when the display is normalized.</p><div className="s7a-pixelGrid"><div><span>INPUT</span><b>{pixel.input.toFixed(2)}</b></div><div><span>RESPONSE</span><b>{pixel.response.toFixed(4)}</b></div><div><span>|RESPONSE|</span><b>{pixel.absolute.toFixed(4)}</b></div><div><span>THRESHOLD</span><b>{threshold}</b></div><div><span>EDGE?</span><b>{pixel.absolute >= threshold ? "YES" : "NO"}</b></div></div></section>
    <section className="s7b-verification panel"><div className="sectionEyebrow">GROUP B VERIFICATION</div><div className="s7a-checkGrid">{verification.map((item, index) => <div key={item.label}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.label}</b><strong>{item.pass ? "PASS" : "REVIEW"}</strong></div>)}</div></section>
    <section className="s7b-teaching panel"><div className="sectionEyebrow">WHY THE OPERATORS DIFFER</div><div className="s7b-teachingGrid"><div><b>Roberts</b><p>Very small 2×2 operator. It reacts to diagonal changes but is sensitive to noise.</p></div><div><b>Prewitt</b><p>Uses a 3×3 neighbourhood, giving a little local averaging while estimating direction.</p></div><div><b>Sobel</b><p>Weights the centre row or column more strongly, combining derivative measurement with extra smoothing.</p></div><div><b>Laplacian</b><p>Uses second derivatives. It responds to rapid changes of slope and does not directly give a gradient direction.</p></div><div><b>LoG</b><p>Gaussian smoothing reduces noise before the second-derivative response is measured.</p></div></div></section>
    <section className="s7b-next panel"><div className="sectionEyebrow">GROUP B → GROUP C</div><h2>Next: scale space</h2><p>An edge is not always visible at one resolution. Group C will vary Gaussian σ and observe how fine, medium, and coarse structures appear or disappear across scale.</p></section>
  </>;
}


function HoughLineCanvas({
  image,
  lines,
}: {
  image: ImageLike;
  lines: Array<{ rho: number; theta: number; votes: number }>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    drawGray(canvas, image);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;

    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    for (const line of lines) {
      const endpoints = lineToEndpoints(
        line,
        image.width,
        image.height
      );

      if (!endpoints) continue;

      ctx.beginPath();
      ctx.moveTo(
        endpoints.x1 * scaleX,
        endpoints.y1 * scaleY
      );
      ctx.lineTo(
        endpoints.x2 * scaleX,
        endpoints.y2 * scaleY
      );
      ctx.stroke();
    }

    ctx.restore();
  }, [image, lines]);

  return (
    <div className="s7a-imageCard">
      <div className="s7a-imageLabel">
        DETECTED HOUGH LINES
      </div>
      <canvas
        ref={ref}
        className="s7a-canvas"
      />
    </div>
  );
}


function DualityImagePlot({
  points,
  showLines,
}: {
  points: DualityPoint[];
  showLines: boolean;
}) {
  const width = 500;
  const height = 320;
  const margin = 42;
  const min = -100;
  const max = 100;

  const sx = (x: number) =>
    margin +
    ((x - min) / (max - min)) *
      (width - 2 * margin);

  const sy = (y: number) =>
    height -
    margin -
    ((y - min) / (max - min)) *
      (height - 2 * margin);

  const peaks = findDualityPeaks(points, 3);

  return (
    <div className="s7d-dualityPlot">
      <div className="s7d-plotTitle">
        IMAGE SPACE · POINTS
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="s7d-dualitySvg"
      >
        <line
          x1={margin}
          y1={height - margin}
          x2={width - margin}
          y2={height - margin}
          className="s7d-axis"
        />

        <line
          x1={margin}
          y1={margin}
          x2={margin}
          y2={height - margin}
          className="s7d-axis"
        />

        <text
          x={width - margin + 8}
          y={height - margin + 4}
          className="s7d-axisLabel"
        >
          x
        </text>

        <text
          x={margin - 22}
          y={margin - 8}
          className="s7d-axisLabel"
        >
          y
        </text>

        {showLines &&
          peaks.slice(0, 2).map((peak, index) => {
            const line = lineFromRhoTheta(
              peak.rho,
              peak.theta,
              150
            );

            return (
              <line
                key={`dual-line-${index}`}
                x1={sx(line.x1)}
                y1={sy(line.y1)}
                x2={sx(line.x2)}
                y2={sy(line.y2)}
                className="s7d-dualityDetectedLine"
              />
            );
          })}

        {points.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}-${index}`}
            cx={sx(point.x)}
            cy={sy(point.y)}
            r={index < 12 ? 4 : 2.5}
            className={
              index < 12
                ? `s7d-dualityPoint s7d-dualityPoint-${index % 12}`
                : "s7d-dualityNoise"
            }
          />
        ))}
      </svg>
    </div>
  );
}

function DualityHoughPlot({
  points,
}: {
  points: DualityPoint[];
}) {
  const width = 620;
  const height = 320;
  const margin = 48;
  const rhoMin = -160;
  const rhoMax = 160;

  const tx = (theta: number) =>
    margin +
    (theta / Math.PI) *
      (width - 2 * margin);

  const ty = (rho: number) =>
    height -
    margin -
    ((rho - rhoMin) /
      (rhoMax - rhoMin)) *
      (height - 2 * margin);

  const curves = points
    .slice(0, 12)
    .map((point) =>
      pointToSinusoid(point, 120)
    );

  const peaks = findDualityPeaks(
    points,
    3
  );

  return (
    <div className="s7d-dualityPlot s7d-houghCurvePlot">
      <div className="s7d-plotTitle">
        HOUGH SPACE · ρ(θ)
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="s7d-dualitySvg"
      >
        <line
          x1={margin}
          y1={height - margin}
          x2={width - margin}
          y2={height - margin}
          className="s7d-axis"
        />

        <line
          x1={margin}
          y1={margin}
          x2={margin}
          y2={height - margin}
          className="s7d-axis"
        />

        <text
          x={width - margin + 8}
          y={height - margin + 4}
          className="s7d-axisLabel"
        >
          θ →
        </text>

        <text
          x={margin - 28}
          y={margin - 8}
          className="s7d-axisLabel"
        >
          ρ
        </text>

        <text
          x={margin - 5}
          y={height - margin + 20}
          className="s7d-tick"
        >
          0°
        </text>

        <text
          x={width - margin - 20}
          y={height - margin + 20}
          className="s7d-tick"
        >
          180°
        </text>

        {curves.map((curve, index) => {
          const path = curve.values
            .map(
              (value) =>
                `${tx(value.theta)},${ty(
                  value.rho
                )}`
            )
            .join(" ");

          return (
            <polyline
              key={`${curve.point.x}-${curve.point.y}-${index}`}
              points={path}
              className={`s7d-dualityCurve s7d-dualityCurve-${index % 12}`}
            />
          );
        })}

        {peaks.slice(0, 4).map(
          (peak, index) => (
            <g
              key={`dual-peak-${index}`}
            >
              <circle
                cx={tx(peak.theta)}
                cy={ty(peak.rho)}
                r={index === 0 ? 6 : 4}
                className="s7d-dualityPeak"
              />

              <text
                x={tx(peak.theta) + 9}
                y={ty(peak.rho) - 8}
                className="s7d-peakLabel"
              >
                {peak.votes} votes
              </text>
            </g>
          )
        )}
      </svg>
    </div>
  );
}

function GroupD() {
  const [sceneName, setSceneName] = useState("shapes");
  const [sigma, setSigma] = useState(1);
  const [lowThreshold, setLowThreshold] = useState(30);
  const [highThreshold, setHighThreshold] = useState(70);
  const [peakThreshold, setPeakThreshold] = useState(40);
  const [thetaStep, setThetaStep] = useState(2);

  const [dualityMode, setDualityMode] =
    useState<
      "one" |
      "two" |
      "collinear" |
      "twoLines" |
      "noisy"
    >("collinear");

  const dualityDataset = useMemo(
    () => createDualityDataset(dualityMode),
    [dualityMode]
  );

  const dualityPeaks = useMemo(
    () =>
      findDualityPeaks(
        dualityDataset.points,
        3
      ),
    [dualityDataset]
  );

  const dualityAccumulator =
    useMemo(
      () =>
        accumulateDualityVotes(
          dualityDataset.points,
          180,
          160,
          -160,
          160
        ),
      [dualityDataset]
    );

  const image = useMemo(
    () => makeScene(sceneName),
    [sceneName]
  );

  const canny = useMemo(
    () =>
      cannyEdgeDetection(
        image,
        sigma,
        lowThreshold,
        highThreshold
      ),
    [
      image,
      sigma,
      lowThreshold,
      highThreshold,
    ]
  );

  const hough = useMemo(
    () =>
      houghTransform(
        canny.edges,
        thetaStep,
        peakThreshold,
        8
      ),
    [
      canny.edges,
      thetaStep,
      peakThreshold,
    ]
  );

  const verification = [
    {
      label: "Non-Maximum Suppression keeps local maxima",
      pass: verifyNmsStep(),
    },
    {
      label: "Hysteresis follows connected weak edges",
      pass: verifyHysteresis(),
    },
    {
      label: "Canny detects a synthetic step edge",
      pass: verifyCannyStep(),
    },
    {
      label: "Hough detects a vertical line",
      pass: verifyHoughVerticalLine(),
    },
    {
      label: "Hough accumulator produces a line peak",
      pass: verifyHoughAccumulator(),
    },
  ];

  return (
    <>
      <section className="s7d-hero">
        <div className="sectionEyebrow">
          SPRINT 7 · GROUP D
        </div>

        <h1>Canny + Hough Laboratory</h1>

        <p>
          Build a complete edge detector from gradients, then
          transform edge pixels into geometric line evidence using
          the Hough transform.
        </p>

        <div className="s7a-meta">
          <span className="statusPill statusCurrent">
            ● CURRENT
          </span>
          <span>Canny edge detection</span>
          <span>Non-Maximum Suppression</span>
          <span>Hysteresis</span>
          <span>Hough lines</span>
        </div>
      </section>

      <section className="s7a-roadmap panel">
        <div className="sectionEyebrow">
          GROUP D LEARNING PATH
        </div>

        <div className="s7a-flow">
          <span>IMAGE</span>
          <b>→</b>
          <span>SMOOTH</span>
          <b>→</b>
          <span>GRADIENT</span>
          <b>→</b>
          <span>NMS</span>
          <b>→</b>
          <span>HYSTERESIS</span>
          <b>→</b>
          <span>HOUGH</span>
        </div>
      </section>

      <section className="s7d-controls panel">
        <div>
          <div className="sectionEyebrow">
            CANNY CONTROLS
          </div>

          <h2>Build the edge detector</h2>

          <p>
            Change one parameter at a time and observe how the
            Canny pipeline changes.
          </p>
        </div>

        <label>
          IMAGE
          <select
            value={sceneName}
            onChange={(e) =>
              setSceneName(e.target.value)
            }
          >
            <option value="step">Step edge</option>
            <option value="ramp">
              Horizontal ramp
            </option>
            <option value="checker">
              Checkerboard
            </option>
            <option value="corner">Corner</option>
            <option value="shapes">
              Synthetic scene
            </option>
            <option value="noisy">
              Noisy scene
            </option>
            <option value="constant">
              Constant image
            </option>
          </select>
        </label>

        <label className="s7d-slider">
          GAUSSIAN σ
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={sigma}
            onChange={(e) =>
              setSigma(Number(e.target.value))
            }
          />
          <b>{sigma.toFixed(1)}</b>
        </label>

        <label className="s7d-slider">
          LOW THRESHOLD
          <input
            type="range"
            min={1}
            max={150}
            value={lowThreshold}
            onChange={(e) =>
              setLowThreshold(
                Math.min(
                  Number(e.target.value),
                  highThreshold
                )
              )
            }
          />
          <b>{lowThreshold}</b>
        </label>

        <label className="s7d-slider">
          HIGH THRESHOLD
          <input
            type="range"
            min={1}
            max={200}
            value={highThreshold}
            onChange={(e) =>
              setHighThreshold(
                Math.max(
                  Number(e.target.value),
                  lowThreshold
                )
              )
            }
          />
          <b>{highThreshold}</b>
        </label>
      </section>

      <section className="s7d-stage panel">
        <div className="sectionEyebrow">
          CANNY · STAGE BY STAGE
        </div>

        <h2>Watch the edge detector being constructed</h2>

        <div className="s7d-grid">
          <LabCanvas
            label="1 · GAUSSIAN SMOOTHED"
            image={normalizeForDisplay(
              canny.smoothed
            )}
          />

          <LabCanvas
            label="2 · GRADIENT MAGNITUDE"
            image={normalizeForDisplay(
              canny.magnitude
            )}
          />

          <LabCanvas
            label="3 · NON-MAXIMUM SUPPRESSION"
            image={normalizeForDisplay(
              canny.nms
            )}
          />

          <LabCanvas
            label="4 · STRONG EDGES"
            image={canny.strong}
          />

          <LabCanvas
            label="5 · WEAK EDGES"
            image={canny.weak}
          />

          <LabCanvas
            label="6 · FINAL CANNY EDGES"
            image={canny.edges}
          />
        </div>
      </section>

      <section className="s7d-explanation panel">
        <div className="sectionEyebrow">
          WHY EACH STEP EXISTS
        </div>

        <div className="s7d-stepCards">
          <article>
            <b>01 · SMOOTH</b>
            <span>
              Gaussian filtering reduces noise before
              differentiation.
            </span>
          </article>

          <article>
            <b>02 · GRADIENT</b>
            <span>
              Sobel derivatives estimate intensity change
              and edge direction.
            </span>
          </article>

          <article>
            <b>03 · NMS</b>
            <span>
              Keep only the strongest response along the
              gradient direction.
            </span>
          </article>

          <article>
            <b>04 · THRESHOLD</b>
            <span>
              Separate strong evidence from weak candidate
              edges.
            </span>
          </article>

          <article>
            <b>05 · HYSTERESIS</b>
            <span>
              Keep weak edges only when they connect to
              strong edges.
            </span>
          </article>
        </div>
      </section>

      <section className="s7d-duality panel">
        <div className="sectionEyebrow">
          HOUGH DUALITY · FROM POINTS TO PARAMETER SPACE
        </div>

        <h2>
          Why does one image point become a curve?
        </h2>

        <p className="s7d-dualityIntro">
          The Hough transform changes the question.
          Instead of asking which line passes through a
          pixel, we let every possible line vote for itself.
          For one point <strong>(x, y)</strong>, changing
          <strong> θ</strong> traces the sinusoid
          <strong>
            {" "}ρ(θ) = x cos θ + y sin θ
          </strong>.
          Points belonging to the same line produce curves
          that meet at the same parameter-space location.
        </p>

        <div className="s7d-dualityModes">
          <button
            className={
              dualityMode === "one"
                ? "active"
                : ""
            }
            onClick={() =>
              setDualityMode("one")
            }
          >
            1 POINT
          </button>

          <button
            className={
              dualityMode === "two"
                ? "active"
                : ""
            }
            onClick={() =>
              setDualityMode("two")
            }
          >
            2 POINTS
          </button>

          <button
            className={
              dualityMode === "collinear"
                ? "active"
                : ""
            }
            onClick={() =>
              setDualityMode("collinear")
            }
          >
            5 COLLINEAR
          </button>

          <button
            className={
              dualityMode === "twoLines"
                ? "active"
                : ""
            }
            onClick={() =>
              setDualityMode("twoLines")
            }
          >
            2 LINES
          </button>

          <button
            className={
              dualityMode === "noisy"
                ? "active"
                : ""
            }
            onClick={() =>
              setDualityMode("noisy")
            }
          >
            NOISE + CLUTTER
          </button>
        </div>

        <div className="s7d-dualityGrid">
          <DualityImagePlot
            points={dualityDataset.points}
            showLines={
              dualityMode !== "one"
            }
          />

          <DualityHoughPlot
            points={dualityDataset.points}
          />
        </div>

        <div className="s7d-dualityEquation">
          <code>
            ρ = x cos θ + y sin θ
          </code>

          <span>
            One image-space point generates many possible
            lines. In Hough space those possibilities form
            one sinusoidal curve.
          </span>
        </div>

        <div className="s7d-dualitySteps">
          <article>
            <b>01 · POINT</b>
            <span>
              A pixel fixes x and y.
            </span>
          </article>

          <article>
            <b>02 · VARY θ</b>
            <span>
              Every orientation gives one possible line.
            </span>
          </article>

          <article>
            <b>03 · TRACE ρ</b>
            <span>
              The point becomes a curve in parameter space.
            </span>
          </article>

          <article>
            <b>04 · INTERSECT</b>
            <span>
              Collinear points create a common Hough peak.
            </span>
          </article>

          <article>
            <b>05 · VOTE</b>
            <span>
              The strongest peak becomes a candidate line.
            </span>
          </article>
        </div>

        <div className="s7d-dualitySummary">
          <div>
            <span>POINTS</span>
            <b>
              {dualityDataset.points.length}
            </b>
          </div>

          <div>
            <span>STRONGEST PEAK</span>
            <b>
              {dualityPeaks[0]?.votes ?? 0}
              {" "}votes
            </b>
          </div>

          <div>
            <span>PEAK θ</span>
            <b>
              {dualityPeaks[0]
                ? `${(
                    (dualityPeaks[0].theta *
                      180) /
                    Math.PI
                  ).toFixed(1)}°`
                : "—"}
            </b>
          </div>

          <div>
            <span>PEAK ρ</span>
            <b>
              {dualityPeaks[0]
                ? dualityPeaks[0].rho.toFixed(1)
                : "—"}
            </b>
          </div>

          <div>
            <span>PARAMETER BINS</span>
            <b>
              {dualityAccumulator.rhoValues.length}
              {" × "}
              {dualityAccumulator.thetaValues.length}
            </b>
          </div>
        </div>

        <div className="s7d-dualityTakeaway">
          <b>KEY IDEA</b>

          <span>
            Image space:
            {" "}
            <strong>
              points vote for lines.
            </strong>
            {" "}
            Hough space:
            {" "}
            <strong>
              curves intersect where many points
              support the same line.
            </strong>
          </span>
        </div>
      </section>

      <section className="s7d-houghControls panel">
        <div>
          <div className="sectionEyebrow">
            HOUGH TRANSFORM
          </div>

          <h2>Turn edge pixels into line votes</h2>

          <p>
            Every Canny edge pixel votes for all lines that
            could pass through it.
          </p>
        </div>

        <label className="s7d-slider">
          PEAK THRESHOLD
          <input
            type="range"
            min={5}
            max={200}
            value={peakThreshold}
            onChange={(e) =>
              setPeakThreshold(
                Number(e.target.value)
              )
            }
          />
          <b>{peakThreshold}</b>
        </label>

        <label className="s7d-slider">
          θ STEP
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={thetaStep}
            onChange={(e) =>
              setThetaStep(
                Number(e.target.value)
              )
            }
          />
          <b>{thetaStep}°</b>
        </label>
      </section>

      <section className="s7d-hough panel">
        <div className="sectionEyebrow">
          HOUGH · FROM PIXELS TO GEOMETRY
        </div>

        <div className="s7d-houghGrid">
          <LabCanvas
            label="CANNY EDGE PIXELS"
            image={canny.edges}
          />

          <LabCanvas
            label="HOUGH ACCUMULATOR · ρ × θ"
            image={houghAccumulatorDisplay(
              hough
            )}
          />

          <HoughLineCanvas
            image={normalizeForDisplay(image)}
            lines={hough.lines}
          />
        </div>

        <div className="s7d-equation">
          <code>
            ρ = x cos(θ) + y sin(θ)
          </code>

          <span>
            A single edge pixel becomes a sinusoidal vote
            curve in parameter space. Where many curves
            intersect, many pixels support the same line.
          </span>
        </div>
      </section>

      <section className="s7d-lines panel">
        <div className="sectionEyebrow">
          DETECTED LINES
        </div>

        <h2>
          Hough accumulator peaks
        </h2>

        {hough.lines.length === 0 ? (
          <div className="s7d-empty">
            No lines currently exceed the peak threshold.
            Lower the threshold to inspect weaker geometric
            evidence.
          </div>
        ) : (
          <div className="s7d-lineGrid">
            {hough.lines.map((line, index) => (
              <div key={`${line.rho}-${line.theta}`}>
                <span>
                  LINE {String(index + 1).padStart(2, "0")}
                </span>

                <b>
                  ρ = {line.rho.toFixed(1)}
                </b>

                <b>
                  θ ={" "}
                  {(
                    (line.theta * 180) /
                    Math.PI
                  ).toFixed(1)}
                  °
                </b>

                <small>
                  votes = {line.votes}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="s7d-math panel">
        <div className="sectionEyebrow">
          THE MATHEMATICS
        </div>

        <h2>
          Canny and Hough in equations
        </h2>

        <div className="s7d-equationGrid">
          <div>
            <code>
              M = √(Iₓ² + Iᵧ²)
            </code>
            <span>
              Gradient magnitude measures edge strength.
            </span>
          </div>

          <div>
            <code>
              θ = atan2(Iᵧ, Iₓ)
            </code>
            <span>
              Gradient orientation determines the direction
              used by NMS.
            </span>
          </div>

          <div>
            <code>
              NMS → local maximum along θ
            </code>
            <span>
              Thick gradient responses become thin candidate
              edges.
            </span>
          </div>

          <div>
            <code>
              weak → keep if connected to strong
            </code>
            <span>
              Hysteresis removes isolated weak responses.
            </span>
          </div>

          <div>
            <code>
              ρ = x cos θ + y sin θ
            </code>
            <span>
              Hough transforms image coordinates into line
              parameter space.
            </span>
          </div>
        </div>
      </section>

      <section className="s7d-verification panel">
        <div className="sectionEyebrow">
          GROUP D VERIFICATION
        </div>

        <div className="s7a-checkGrid">
          {verification.map(
            (item, index) => (
              <div key={item.label}>
                <span>
                  {String(index + 1).padStart(
                    2,
                    "0"
                  )}
                </span>

                <b>{item.label}</b>

                <strong>
                  {item.pass
                    ? "PASS"
                    : "REVIEW"}
                </strong>
              </div>
            )
          )}
        </div>
      </section>

      <section className="s7d-industrial panel">
        <div className="sectionEyebrow">
          INDUSTRIAL VISION CONNECTION
        </div>

        <h2>
          Why Canny + Hough matters
        </h2>

        <p>
          Canny produces clean geometric evidence. Hough
          converts that evidence into explicit geometric
          structures such as rails, pipes, machine edges,
          alignment boundaries, and structural lines.
        </p>
      </section>

      <section className="s7d-complete panel">
        <div className="sectionEyebrow">
          SPRINT 7 COMPLETE
        </div>

        <h2>
          Derivatives → Edges → Scale → Geometry
        </h2>

        <p>
          Sprint 7 now connects first derivatives,
          second derivatives, scale space, Canny edge
          detection, and Hough geometric reasoning into
          one progression.
        </p>
      </section>
    </>
  );
}

function GroupC() {
  const [sceneName, setSceneName] = useState("shapes");
  const [sigma, setSigma] = useState<number>(2);
  const [x, setX] = useState(128);
  const [y, setY] = useState(128);

  const image = useMemo(() => makeScene(sceneName), [sceneName]);

  const smoothed = useMemo(
    () => scaleSpace(image, sigma),
    [image, sigma]
  );

  const dog = useMemo(
    () => derivativeOfGaussianDisplay(image, sigma),
    [image, sigma]
  );

  const multiScale = useMemo(
    () =>
      SCALE_VALUES.map((value) => ({
        sigma: value,
        image: gaussianSmooth(image, value),
      })),
    [image]
  );

  const sourceDisplay = useMemo(
    () => normalizeForDisplay(image),
    [image]
  );

  const smoothedDisplay = useMemo(
    () => normalizeForDisplay(smoothed),
    [smoothed]
  );

  const logResponses = useMemo(
    () =>
      SCALE_VALUES.map((value) => ({
        sigma: value,
        response: normalizeForDisplay(
          edgeResponse(image, "log", value)
        ),
      })),
    [image]
  );

  const verification = [
    {
      label: "Gaussian kernel sums to approximately 1",
      pass: verifyGaussianKernel(),
    },
    {
      label: "Larger σ produces stronger smoothing",
      pass: verifyGaussianSmoothing(),
    },
    {
      label: "Derivative-of-Gaussian detects horizontal change",
      pass: verifyDerivativeOfGaussian(),
    },
    {
      label: "Derivative kernels have approximately zero sum",
      pass: verifyDerivativeKernelSums(),
    },
  ];

  const selectedPixel = y * image.width + x;

  return (
    <>
      <section className="s7b-hero">
        <div className="sectionEyebrow">SPRINT 7 · GROUP C</div>
        <h1>Scale Space &amp; Derivative of Gaussian</h1>
        <p>
          The same image can reveal different structures at different
          scales. Blur the image with Gaussian σ, then measure how
          derivatives change as the scale changes.
        </p>
        <div className="s7a-meta">
          <span className="statusPill statusCurrent">● CURRENT</span>
          <span>Gaussian scale space</span>
          <span>Derivative of Gaussian</span>
          <span>Multi-scale LoG</span>
        </div>
      </section>

      <section className="s7a-roadmap panel">
        <div className="sectionEyebrow">GROUP C LEARNING PATH</div>
        <div className="s7a-flow">
          <span>IMAGE</span>
          <b>→</b>
          <span>GAUSSIAN σ</span>
          <b>→</b>
          <span>SMOOTHED IMAGE</span>
          <b>→</b>
          <span>DERIVATIVE</span>
          <b>→</b>
          <span>MULTI-SCALE RESPONSE</span>
        </div>
      </section>

      <section className="s7b-controls panel">
        <div>
          <div className="sectionEyebrow">SCALE SPACE CONTROLS</div>
          <h2>Change the image and Gaussian scale</h2>
          <p>
            Small σ preserves fine detail. Larger σ suppresses fine
            structures and emphasizes broader image structure.
          </p>
        </div>

        <div className="s7b-controlField">
          <label>
            IMAGE
            <select
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
            >
              <option value="step">Step edge</option>
              <option value="ramp">Horizontal ramp</option>
              <option value="checker">Checkerboard</option>
              <option value="corner">Corner</option>
              <option value="shapes">Synthetic scene</option>
              <option value="noisy">Noisy scene</option>
              <option value="constant">Constant image</option>
            </select>
          </label>
        </div>

        <div className="s7b-controlField">
          <label className="s7b-slider">
            GAUSSIAN σ
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={sigma}
              onChange={(e) => setSigma(Number(e.target.value))}
            />
            <b>{sigma.toFixed(1)}</b>
          </label>
        </div>
      </section>

      <section className="s7c-mainGrid s7a-mainGrid">
        <div className="s7a-imageCard">
          <div className="s7a-imageLabel">
            INPUT IMAGE · CLICK TO PROBE
          </div>

          <canvas
            className="s7a-canvas s7a-clickable"
            ref={(node) => {
              if (!node) return;

              drawGray(node, sourceDisplay);

              node.onpointerdown = (e) => {
                const r = node.getBoundingClientRect();

                setX(
                  Math.max(
                    0,
                    Math.min(
                      node.width - 1,
                      Math.round(
                        ((e.clientX - r.left) / r.width) *
                          (node.width - 1)
                      )
                    )
                  )
                );

                setY(
                  Math.max(
                    0,
                    Math.min(
                      node.height - 1,
                      Math.round(
                        ((e.clientY - r.top) / r.height) *
                          (node.height - 1)
                      )
                    )
                  )
                );
              };
            }}
          />

          <div className="s7a-coordinate">
            Selected pixel: ({x}, {y})
          </div>
        </div>

        <LabCanvas
          label={`GAUSSIAN SMOOTHED · σ = ${sigma.toFixed(1)}`}
          image={smoothedDisplay}
        />

        <LabCanvas
          label={`∂Gσ/∂x · σ = ${sigma.toFixed(1)}`}
          image={dog.dx}
        />

        <LabCanvas
          label={`∂Gσ/∂y · σ = ${sigma.toFixed(1)}`}
          image={dog.dy}
        />

        <LabCanvas
          label={`|∇(Gσ * I)| · σ = ${sigma.toFixed(1)}`}
          image={dog.magnitude}
        />
      </section>

      <section className="s7b-compare panel">
        <div className="sectionEyebrow">
          SCALE SPACE · FINE → COARSE
        </div>

        <h2>What disappears as σ becomes larger?</h2>

        <div className="s7c-scaleCards s7b-operatorCards">
          {multiScale.map((item) => (
            <article
              key={item.sigma}
              className={sigma === item.sigma ? "active" : ""}
              onClick={() => setSigma(item.sigma)}
            >
              <div className="s7b-cardTitle">
                <b>σ = {item.sigma}</b>
                <span>
                  {item.sigma === 0.5
                    ? "FINE"
                    : item.sigma === 1
                    ? "SMALL"
                    : item.sigma === 2
                    ? "MEDIUM"
                    : "COARSE"}
                </span>
              </div>

              <LabCanvas
                label={`SMOOTHED · σ = ${item.sigma}`}
                image={normalizeForDisplay(item.image)}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="s7b-second panel">
        <div className="sectionEyebrow">
          DERIVATIVE OF GAUSSIAN
        </div>

        <h2>Differentiate after smoothing — or smooth the derivative</h2>

        <p>
          The derivative can be moved through convolution:
        </p>

        <div className="s7b-math">
          <code>
            ∂/∂x (Gσ * I) = (∂Gσ/∂x) * I
          </code>
        </div>

        <p>
          This means we can use a derivative-of-Gaussian kernel
          directly on the original image.
        </p>

        <div className="s7a-pixelGrid">
          <div>
            <span>σ</span>
            <b>{sigma.toFixed(1)}</b>
          </div>
          <div>
            <span>PIXEL X</span>
            <b>{x}</b>
          </div>
          <div>
            <span>PIXEL Y</span>
            <b>{y}</b>
          </div>
          <div>
            <span>IMAGE VALUE</span>
            <b>{image.data[selectedPixel]?.toFixed(2)}</b>
          </div>
        </div>
      </section>

      <section className="s7b-noise panel">
        <div className="sectionEyebrow">
          LAPLACIAN OF GAUSSIAN · MULTI-SCALE
        </div>

        <h2>Which scale responds most strongly?</h2>

        <p>
          LoG combines Gaussian smoothing with a second derivative.
          Changing σ changes which structures are emphasized.
        </p>

        <div className="s7c-logCards s7b-operatorCards">
          {logResponses.map((item) => (
            <article
              key={item.sigma}
              className={sigma === item.sigma ? "active" : ""}
              onClick={() => setSigma(item.sigma)}
            >
              <div className="s7b-cardTitle">
                <b>LoG · σ = {item.sigma}</b>
                <span>SECOND DERIVATIVE</span>
              </div>

              <LabCanvas
                label={`LoG RESPONSE · σ = ${item.sigma}`}
                image={item.response}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="s7b-math panel">
        <div className="sectionEyebrow">THE MATHEMATICS</div>

        <h2>Scale space in four equations</h2>

        <div className="s7b-equationGrid">
          <div>
            <code>
              Iσ = Gσ * I
            </code>
            <span>
              Create a smoothed image at scale σ.
            </span>
          </div>

          <div>
            <code>
              Gσ(x,y) = 1/(2πσ²)e^(-(x²+y²)/(2σ²))
            </code>
            <span>
              Larger σ spreads the Gaussian over a wider neighbourhood.
            </span>
          </div>

          <div>
            <code>
              ∂(Gσ * I)/∂x = (∂Gσ/∂x) * I
            </code>
            <span>
              Smoothing and differentiation can be combined into one
              derivative-of-Gaussian filter.
            </span>
          </div>

          <div>
            <code>
              LoGσ = ∇²Gσ
            </code>
            <span>
              The Laplacian of Gaussian detects second-order structure
              at a chosen scale.
            </span>
          </div>
        </div>
      </section>

      <section className="s7b-verification panel">
        <div className="sectionEyebrow">
          GROUP C VERIFICATION
        </div>

        <div className="s7a-checkGrid">
          {verification.map((item, index) => (
            <div key={item.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{item.label}</b>
              <strong>{item.pass ? "PASS" : "REVIEW"}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="s7b-next panel">
        <div className="sectionEyebrow">
          GROUP C → GROUP D
        </div>

        <h2>Next: Canny + Hough</h2>

        <p>
          Scale space tells us how image structures change with
          smoothing. Group D will turn these ideas into a complete
          Canny edge detector and then use edge evidence to detect
          geometric lines with the Hough transform.
        </p>
      </section>
    </>
  );
}

export default function Sprint7Page() {
  const [group, setGroup] = useState<"A" | "B" | "C" | "D">("A");
  return <main className="s7-page"><section className="s7-groupSwitcher panel"><div><div className="sectionEyebrow">SPRINT 7 · DERIVATIVES + EDGES + SCALE</div><h2>Choose the experiment</h2><p>Group A established derivatives. Group B turns those derivatives into edge detectors. Group C studies how structures change across scale.</p></div><div className="s7-groupButtons"><button className={group === "A" ? "active" : ""} onClick={() => setGroup("A")}>A · Derivatives + Gradients</button><button className={group === "B" ? "active" : ""} onClick={() => setGroup("B")}>B · Edge Detection</button><button className={group === "C" ? "active" : ""} onClick={() => setGroup("C")}>C · Scale Space</button><button className={group === "D" ? "active" : ""} onClick={() => setGroup("D")}>D · Canny + Hough</button></div></section>{group === "A" ? <GroupA /> : group === "B" ? <GroupB /> : group === "C" ? <GroupC /> : <GroupD />}</main>;
}
