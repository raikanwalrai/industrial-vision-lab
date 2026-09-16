import { useMemo, useState } from "react";
import { filters, type Kernel } from "./filters";
import { makeScene, type GrayImage } from "./imageScenes";
import { normalizeForDisplay, patchCalculation } from "./math";

function ImageCanvas({
  image,
  title,
  overlay,
}: {
  image: GrayImage;
  title: string;
  overlay?: {
    x: number;
    y: number;
    kernelSize: number;
  };
}) {
  const ref = (node: HTMLCanvasElement | null) => {
    if (!node) return;

    const ctx = node.getContext("2d");
    if (!ctx) return;

    const display = normalizeForDisplay(image);
    const w = image.width;
    const h = image.height;

    node.width = w;
    node.height = h;

    const pixels = ctx.createImageData(w, h);

    for (let i = 0; i < display.data.length; i++) {
      const value = Math.max(0, Math.min(255, Math.round(display.data[i])));
      pixels.data[i * 4] = value;
      pixels.data[i * 4 + 1] = value;
      pixels.data[i * 4 + 2] = value;
      pixels.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(pixels, 0, 0);

    if (overlay) {
      const half = Math.floor(overlay.kernelSize / 2);

      ctx.strokeStyle = "#ffb000";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        Math.max(0, overlay.x - half),
        Math.max(0, overlay.y - half),
        Math.min(overlay.kernelSize, w),
        Math.min(overlay.kernelSize, h),
      );

      ctx.fillStyle = "#ffb000";
      ctx.beginPath();
      ctx.arc(overlay.x, overlay.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  return (
    <div className="s3-image-card">
      <div className="s3-card-title">{title}</div>
      <div className="s3-canvas-shell">
        <canvas ref={ref} />
      </div>
    </div>
  );
}

function NumberGrid({
  values,
  className = "",
  decimals = 1,
  highlightCenter = false,
}: {
  values: number[][];
  className?: string;
  decimals?: number;
  highlightCenter?: boolean;
}) {
  const rows = values.length;
  const cols = values[0]?.length ?? 0;

  return (
    <div
      className={`s3-number-grid ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {values.flatMap((row, r) =>
        row.map((value, c) => {
          const center =
            highlightCenter &&
            r === Math.floor(rows / 2) &&
            c === Math.floor(cols / 2);

          return (
            <div className={center ? "s3-number-cell center" : "s3-number-cell"}>
              {value.toFixed(decimals)}
            </div>
          );
        }),
      )}
    </div>
  );
}

function getPatch(
  image: GrayImage,
  kernel: number[][],
  x: number,
  y: number,
) {
  const k = kernel.length;
  const half = Math.floor(k / 2);

  return Array.from({ length: k }, (_, r) =>
    Array.from({ length: k }, (_, c) => {
      const ix = Math.max(0, Math.min(image.width - 1, x + c - half));
      const iy = Math.max(0, Math.min(image.height - 1, y + r - half));
      return image.data[iy * image.width + ix];
    }),
  );
}

function calculateProducts(patch: number[][], kernel: number[][]) {
  return patch.map((row, r) =>
    row.map((value, c) => value * kernel[r][c]),
  );
}

function calculateOutput(
  image: GrayImage,
  kernel: number[][],
  x: number,
  y: number,
) {
  const patch = getPatch(image, kernel, x, y);

  return patch.reduce(
    (sum, row, r) =>
      sum + row.reduce((rowSum, value, c) => rowSum + value * kernel[r][c], 0),
    0,
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="s3-section">
      <div className="s3-section-heading">
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function Sprint3() {
  const [sceneId, setSceneId] = useState("constant");
  const [kernelName, setKernelName] = useState("Box 3×3");
  const [x, setX] = useState(128);
  const [y, setY] = useState(128);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const kernel: Kernel =
    filters.find((item) => item.name === kernelName) ?? filters[0];

  const image = useMemo(() => makeScene(sceneId), [sceneId]);

  const patch = useMemo(
    () => getPatch(image, kernel.values, x, y),
    [image, kernel.values, x, y],
  );

  const products = useMemo(
    () => calculateProducts(patch, kernel.values),
    [patch, kernel.values],
  );

  const outputValue = useMemo(
    () => calculateOutput(image, kernel.values, x, y),
    [image, kernel.values, x, y],
  );

  const calculation = useMemo(
    () => patchCalculation(image, kernel.values, x, y),
    [image, kernel.values, x, y],
  );

  const kernelSize = kernel.values.length;

  function move(dx: number, dy: number) {
    setX((current) => Math.max(0, Math.min(255, current + dx)));
    setY((current) => Math.max(0, Math.min(255, current + dy)));
  }

  return (
    <section className="sprint3">
      <div className="s3-hero">
        <div>
          <div className="s3-eyebrow">SPRINT 3 · INTERACTIVE CONVOLUTION</div>
          <h1>Move the Kernel. See the Mathematics.</h1>
          <p>
            Move a small kernel across an image. The patch changes, the
            multiplications change, and one output pixel is produced.
          </p>
        </div>

        <div className="s3-progress">
          <span>GROUP A</span>
          <strong>Move → Inspect → Calculate</strong>
        </div>
      </div>

      <Section number="3.1" title="Move the kernel">
        <div className="s3-control-bar">
          <label>
            IMAGE SCENE
            <select
              value={sceneId}
              onChange={(event) => setSceneId(event.target.value)}
            >
              <option value="constant">Constant</option>
              <option value="shapes">Shapes</option>
              <option value="step">Step</option>
              <option value="ramp">Ramp</option>
              <option value="checker">Checker</option>
              <option value="corner">Corner</option>
              <option value="noisy">Noisy</option>
            </select>
          </label>

          <label>
            KERNEL
            <select
              value={kernelName}
              onChange={(event) => setKernelName(event.target.value)}
            >
              {filters.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="s3-position">
            <span>POSITION</span>
            <strong>({x}, {y})</strong>
          </div>

          <div className="s3-move-buttons">
            <button onClick={() => move(-1, 0)}>←</button>
            <button onClick={() => move(0, -1)}>↑</button>
            <button onClick={() => move(0, 1)}>↓</button>
            <button onClick={() => move(1, 0)}>→</button>
          </div>
        </div>

        <div className="s3-image-layout">
          <ImageCanvas
            image={image}
            title={`Input image · ${sceneId}`}
            overlay={{ x, y, kernelSize }}
          />

          <div className="s3-arrow">→</div>

          <div className="s3-explanation-card">
            <div className="s3-card-title">What is happening?</div>

            <div className="s3-flow-step">
              <span className="s3-step-number">1</span>
              <div>
                <strong>Kernel is positioned</strong>
                <p>
                  The orange square marks the part of the image currently
                  being inspected.
                </p>
              </div>
            </div>

            <div className="s3-flow-step">
              <span className="s3-step-number">2</span>
              <div>
                <strong>Patch is extracted</strong>
                <p>
                  The pixels underneath the kernel become a small matrix.
                </p>
              </div>
            </div>

            <div className="s3-flow-step">
              <span className="s3-step-number">3</span>
              <div>
                <strong>One output pixel is calculated</strong>
                <p>
                  Corresponding numbers are multiplied and then added.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section number="3.2" title="Expose the current patch">
        <div className="s3-two-column">
          <div className="s3-matrix-card">
            <div className="s3-card-title">
              Image patch centered at ({x}, {y})
            </div>

            <NumberGrid
              values={patch}
              decimals={1}
              highlightCenter
            />

            <div className="s3-matrix-note">
              The center cell corresponds to the pixel at ({x}, {y}).
            </div>
          </div>

          <div className="s3-matrix-card">
            <div className="s3-card-title">
              {kernel.name} kernel
            </div>

            <NumberGrid
              values={kernel.values}
              decimals={kernelSize > 3 ? 3 : 2}
              highlightCenter
            />

            <div className="s3-matrix-note">
              Each kernel value is paired with the image value in the same
              position.
            </div>
          </div>
        </div>
      </Section>

      <Section number="3.3" title="Calculate the live output pixel">
        <div className="s3-calculation-layout">
          <div className="s3-products-card">
            <div className="s3-card-title">
              Element-wise multiplication
            </div>

            <NumberGrid
              values={products}
              className="s3-product-grid"
              decimals={2}
              highlightCenter
            />

            <button
              className="s3-secondary-button"
              onClick={() => setShowAllProducts((value) => !value)}
            >
              {showAllProducts
                ? "Hide detailed calculation"
                : "Show detailed calculation"}
            </button>

            {showAllProducts && (
              <div className="s3-detail-list">
                {calculation.terms.map((term, index) => (
                  <span key={index}>{term}</span>
                ))}
              </div>
            )}
          </div>

          <div className="s3-result-card">
            <div className="s3-card-title">Output pixel</div>

            <div className="s3-formula">
              g({x},{y}) =
            </div>

            <div className="s3-result-value">
              {outputValue.toFixed(3)}
            </div>

            <div className="s3-result-explanation">
              <strong>Multiply → Add</strong>
              <p>
                Every patch value is multiplied by its corresponding kernel
                value. All those products are then added together.
              </p>
            </div>

            <div className="s3-sum-line">
              Sum of {kernelSize * kernelSize} products
            </div>
          </div>
        </div>
      </Section>

      <section className="s3-connected">
        <div className="s3-connected-title">
          <span>GROUP A</span>
          <h2>Everything is connected</h2>
        </div>

        <div className="s3-connected-flow">
          <div>
            <strong>MOVE</strong>
            <span>Kernel position changes</span>
          </div>

          <b>→</b>

          <div>
            <strong>INSPECT</strong>
            <span>Patch changes</span>
          </div>

          <b>→</b>

          <div>
            <strong>MULTIPLY</strong>
            <span>Products change</span>
          </div>

          <b>→</b>

          <div>
            <strong>ADD</strong>
            <span>Output pixel changes</span>
          </div>
        </div>

        <div className="s3-live-message">
          Current output value: <strong>{outputValue.toFixed(3)}</strong>
        </div>
      </section>
    </section>
  );
}
