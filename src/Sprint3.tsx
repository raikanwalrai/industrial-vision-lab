import { useEffect, useMemo, useRef, useState } from "react";
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


function scanImage(
  image: GrayImage,
  kernel: number[][],
  stride = 1,
) {
  const k = kernel.length;

  const outputWidth =
    Math.floor((image.width - k) / stride) + 1;

  const outputHeight =
    Math.floor((image.height - k) / stride) + 1;

  const output = new Float32Array(outputWidth * outputHeight);

  for (let oy = 0; oy < outputHeight; oy++) {
    for (let ox = 0; ox < outputWidth; ox++) {
      const startX = ox * stride;
      const startY = oy * stride;

      let total = 0;

      for (let r = 0; r < k; r++) {
        for (let c = 0; c < k; c++) {
          total +=
            image.data[(startY + r) * image.width + (startX + c)] *
            kernel[r][c];
        }
      }

      output[oy * outputWidth + ox] = total;
    }
  }

  return {
    width: outputWidth,
    height: outputHeight,
    data: output,
  };
}

function scanPosition(
  image: GrayImage,
  kernel: number[][],
  step: number,
  stride = 1,
) {
  const k = kernel.length;

  const outputWidth =
    Math.floor((image.width - k) / stride) + 1;

  const outputHeight =
    Math.floor((image.height - k) / stride) + 1;

  const totalPositions = outputWidth * outputHeight;

  const safeStep = Math.max(
    0,
    Math.min(totalPositions - 1, step),
  );

  const outputY = Math.floor(safeStep / outputWidth);
  const outputX = safeStep % outputWidth;

  const inputX = outputX * stride;
  const inputY = outputY * stride;

  return {
    step: safeStep,
    totalPositions,
    outputX,
    outputY,
    inputX,
    inputY,
    outputWidth,
    outputHeight,
  };
}

function scanPatch(
  image: GrayImage,
  kernel: number[][],
  position: ReturnType<typeof scanPosition>,
) {
  const k = kernel.length;

  return Array.from({ length: k }, (_, r) =>
    Array.from({ length: k }, (_, c) =>
      image.data[
        (position.inputY + r) * image.width +
        position.inputX +
        c
      ],
    ),
  );
}

function scanOutputValue(
  patch: number[][],
  kernel: number[][],
) {
  return patch.reduce(
    (total, row, r) =>
      total +
      row.reduce(
        (rowTotal, value, c) =>
          rowTotal + value * kernel[r][c],
        0,
      ),
    0,
  );
}


function PixelZoom({
  patch,
  x,
  y,
}: {
  patch: number[][];
  x: number;
  y: number;
}) {
  return (
    <div className="s3-pixel-zoom">
      <div className="s3-pixel-zoom-header">
        <div>
          <span>PIXEL ZOOM</span>
          <strong>Current {patch.length} × {patch.length} patch</strong>
        </div>

        <code>input ({x}, {y})</code>
      </div>

      <div
        className="s3-pixel-grid"
        style={{
          gridTemplateColumns: `repeat(${patch.length}, minmax(0, 1fr))`,
        }}
      >
        {patch.flatMap((row, r) =>
          row.map((value, c) => (
            <div
              className={
                r === Math.floor(patch.length / 2) &&
                c === Math.floor(patch.length / 2)
                  ? "s3-pixel-cell current"
                  : "s3-pixel-cell"
              }
              key={`${r}-${c}`}
              title={`Pixel (${x + c}, ${y + r}) = ${value.toFixed(3)}`}
            >
              <span>{value.toFixed(0)}</span>
              <small>
                ({x + c},{y + r})
              </small>
            </div>
          )),
        )}
      </div>

      <div className="s3-pixel-zoom-note">
        The orange cell is the patch center. Every number is an actual image
        pixel used by the local calculation.
      </div>
    </div>
  );
}

function OutputCanvas({
  image,
  outputX,
  outputY,
  title,
}: {
  image: GrayImage;
  outputX: number;
  outputY: number;
  title: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = 2;
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const normalized = normalizeForDisplay(image);

    const pixels = ctx.createImageData(image.width, image.height);

    for (let i = 0; i < normalized.data.length; i++) {
      const value = Math.max(0, Math.min(255, normalized.data[i]));
      pixels.data[i * 4] = value;
      pixels.data[i * 4 + 1] = value;
      pixels.data[i * 4 + 2] = value;
      pixels.data[i * 4 + 3] = 255;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.putImageData(pixels, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      tempCanvas,
      0,
      0,
      image.width * scale,
      image.height * scale,
    );

    const cellX = outputX * scale;
    const cellY = outputY * scale;

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = Math.max(2, scale);
    ctx.strokeRect(
      cellX,
      cellY,
      scale,
      scale,
    );
  }, [image, outputX, outputY]);

  return (
    <div className="s3-output-canvas-wrap">
      <canvas ref={canvasRef} aria-label={title} />
      <div className="s3-output-current-marker">
        Current output pixel: ({outputX}, {outputY})
      </div>
    </div>
  );
}


function ScanMap({
  outputX,
  outputY,
  outputWidth,
  outputHeight,
}: {
  outputX: number;
  outputY: number;
  outputWidth: number;
  outputHeight: number;
}) {
  const columns = 20;
  const visibleRows = 7;

  /*
   * This is a teaching map, not a literal 254 × 254 pixel map.
   *
   * We show a small window around the ACTUAL current row so that
   * row-to-row movement remains visible.
   */
  const startRow = Math.max(
    0,
    Math.min(
      Math.max(0, outputHeight - visibleRows),
      outputY - Math.floor(visibleRows / 2),
    ),
  );

  const endRow = Math.min(
    outputHeight - 1,
    startRow + visibleRows - 1,
  );

  const rows = Array.from(
    { length: endRow - startRow + 1 },
    (_, index) => startRow + index,
  );

  const mapColumn = Math.min(
    columns - 1,
    Math.floor(
      (outputX / Math.max(1, outputWidth - 1)) *
        (columns - 1),
    ),
  );

  return (
    <div className="s3-scan-map">
      <div className="s3-scan-map-header">
        <div>
          <span>SCAN MAP</span>
          <strong>Kernel movement through the output positions</strong>
        </div>

        <code>
          row {outputY} / {outputHeight - 1}
          {" · "}
          column {outputX} / {outputWidth - 1}
        </code>
      </div>

      <div className="s3-scan-map-current-row">
        <span>CURRENT SCAN ROW</span>
        <strong>
          {outputY}
        </strong>
        <small>
          of {outputHeight - 1}
        </small>
      </div>

      <div className="s3-scan-map-column-label">
        <span>OUTPUT COLUMNS →</span>
        <span>
          current column {outputX}
        </span>
      </div>

      <div className="s3-scan-map-grid">
        {rows.map((row) => (
          <div
            className={[
              "s3-scan-map-row",
              row === outputY ? "current-row" : "",
              row < outputY ? "completed-row" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={row}
          >
            <div className="s3-scan-map-row-label">
              {row}
            </div>

            <div
              className="s3-scan-map-row-cells"
              style={{
                gridTemplateColumns:
                  `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from(
                { length: columns },
                (_, column) => {
                  const isCurrent =
                    row === outputY &&
                    column === mapColumn;

                  const completed =
                    row < outputY ||
                    (row === outputY &&
                      column < mapColumn);

                  return (
                    <div
                      className={[
                        "s3-map-cell",
                        completed ? "scanned" : "",
                        isCurrent ? "current" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={column}
                    >
                      {isCurrent ? "●" : ""}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="s3-scan-map-direction">
        <span>→</span>
        <strong>scan left → right across the current row</strong>
        <span>↓</span>
        <strong>at the end, move to the next row</strong>
      </div>

      <div className="s3-scan-map-note">
        The map shows the actual current output row and column.
        The small cells compress the 254 × 254 output space so the
        scanning pattern remains visible.
      </div>
    </div>
  );
}

function OutputPixelZoom({
  image,
  x,
  y,
}: {
  image: GrayImage;
  x: number;
  y: number;
}) {
  const safeX = Math.max(0, Math.min(image.width - 1, x));
  const safeY = Math.max(0, Math.min(image.height - 1, y));

  const value = image.data[safeY * image.width + safeX];

  const values = [-1, 0, 1].map((dy) =>
    [-1, 0, 1].map((dx) => {
      const px = Math.max(0, Math.min(image.width - 1, safeX + dx));
      const py = Math.max(0, Math.min(image.height - 1, safeY + dy));
      return image.data[py * image.width + px];
    }),
  );

  return (
    <div className="s3-output-pixel-zoom">
      <div className="s3-output-pixel-header">
        <div>
          <span>OUTPUT PIXEL ZOOM</span>
          <strong>Current output neighborhood</strong>
        </div>

        <code>
          ({safeX}, {safeY})
        </code>
      </div>

      <div className="s3-output-pixel-layout">
        <div
          className="s3-output-pixel-grid"
          style={{
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          }}
        >
          {values.flatMap((row, r) =>
            row.map((cellValue, c) => (
              <div
                key={`${r}-${c}`}
                className={
                  r === 1 && c === 1
                    ? "s3-output-pixel-cell current"
                    : "s3-output-pixel-cell"
                }
              >
                {cellValue.toFixed(0)}
              </div>
            )),
          )}
        </div>

        <div className="s3-output-pixel-value">
          <span>ONE OUTPUT VALUE</span>
          <strong>{value.toFixed(3)}</strong>
          <small>
            created by the current input patch
          </small>
        </div>
      </div>
    </div>
  );
}


function formatKernelWeight(value: number): string {
  const fractions: Array<[number, string]> = [
    [1 / 9, "1/9"],
    [1 / 81, "1/81"],
    [1 / 16, "1/16"],
  ];

  for (const [numberValue, label] of fractions) {
    if (Math.abs(value - numberValue) < 0.000001) {
      return label;
    }

    if (Math.abs(value + numberValue) < 0.000001) {
      return `-${label}`;
    }
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(3);
}

function MultiplicationGrid({
  patch,
  kernel,
  products,
}: {
  patch: number[][];
  kernel: number[][];
  products: number[][];
}) {
  return (
    <div
      className="s3-multiplication-grid"
      style={{
        gridTemplateColumns:
          `repeat(${patch[0]?.length ?? 1}, minmax(0, 1fr))`,
      }}
    >
      {patch.flatMap((row, r) =>
        row.map((pixelValue, c) => {
          const kernelValue = kernel[r][c];
          const product = products[r][c];

          const isCenter =
            r === Math.floor(patch.length / 2) &&
            c === Math.floor(row.length / 2);

          return (
            <div
              key={`${r}-${c}`}
              className={[
                "s3-multiplication-cell",
                isCenter ? "current" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="s3-multiplication-expression">
                <strong>{pixelValue.toFixed(0)}</strong>
                <span>×</span>
                <strong>{formatKernelWeight(kernelValue)}</strong>
              </div>

              <div className="s3-multiplication-result">
                = {product.toFixed(2)}
              </div>
            </div>
          );
        }),
      )}
    </div>
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
  const [scanStep, setScanStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

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

  const scan = useMemo(
    () => scanImage(image, kernel.values, 1),
    [image, kernel.values],
  );

  const scanInfo = useMemo(
    () => scanPosition(image, kernel.values, scanStep, 1),
    [image, kernel.values, scanStep],
  );

  useEffect(() => {
    if (!isScanning) {
      return;
    }

    const timer = window.setInterval(() => {
      setScanStep((current) => {
        const last = scanInfo.totalPositions - 1;

        if (current >= last) {
          setIsScanning(false);
          return last;
        }

        return current + 1;
      });
    }, 30);

    return () => window.clearInterval(timer);
  }, [isScanning, scanInfo.totalPositions]);


  const scannedPatch = useMemo(
    () => scanPatch(image, kernel.values, scanInfo),
    [image, kernel.values, scanInfo],
  );

  const scannedOutput = useMemo(
    () => scanOutputValue(scannedPatch, kernel.values),
    [scannedPatch, kernel.values],
  );

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
              onChange={(event) => {
                setSceneId(event.target.value);
                setScanStep(0);
                setIsScanning(false);
              }}
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
              onChange={(event) => {
                setKernelName(event.target.value);
                setScanStep(0);
                setIsScanning(false);
              }}
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

            <MultiplicationGrid
              patch={patch}
              kernel={kernel.values}
              products={products}
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


      <div className="s3-group-divider">
        <span>GROUP B</span>
        <strong>Scan → Repeat → Construct</strong>
      </div>

      <Section number="3.4" title="Scan the image positions">
        <div className="s3-scan-controls">
          <button
            className="s3-primary-button"
            onClick={() => {
              setScanStep((current) =>
                current >= scanInfo.totalPositions - 1
                  ? 0
                  : current + 1,
              );
              setIsScanning(false);
            }}
          >
            Next position →
          </button>

          <button
            className="s3-secondary-button"
            onClick={() => {
              setScanStep((current) => Math.max(0, current - 1));
              setIsScanning(false);
            }}
          >
            ← Previous
          </button>

          <button
            className="s3-secondary-button"
            onClick={() => {
              setScanStep(0);
              setIsScanning(false);
            }}
          >
            Reset
          </button>

          <button
            className="s3-primary-button"
            onClick={() => setIsScanning((current) => !current)}
          >
            {isScanning ? "Pause scan" : "▶ Play scan"}
          </button>

          <div className="s3-scan-counter">
            <span>SCAN POSITION</span>
            <strong>
              {scanInfo.step + 1} / {scanInfo.totalPositions.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="s3-scan-layout">
          <div className="s3-scan-image">
            <ImageCanvas
              image={image}
              title="Kernel scan position"
              overlay={{
                x: scanInfo.inputX + Math.floor(kernelSize / 2),
                y: scanInfo.inputY + Math.floor(kernelSize / 2),
                kernelSize,
              }}
            />

            <PixelZoom
              patch={scannedPatch}
              x={scanInfo.inputX}
              y={scanInfo.inputY}
            />
          </div>

          <div className="s3-scan-explanation">
            <div className="s3-card-title">
              Where is the kernel?
            </div>

            <div className="s3-coordinate">
              <span>INPUT PATCH · TOP-LEFT</span>
              <strong>
                ({scanInfo.inputX}, {scanInfo.inputY})
              </strong>
            </div>

            <div className="s3-coordinate">
              <span>KERNEL CENTER</span>
              <strong>
                (
                {scanInfo.inputX + Math.floor(kernelSize / 2)},
                {scanInfo.inputY + Math.floor(kernelSize / 2)}
                )
              </strong>
            </div>

            <div className="s3-coordinate">
              <span>OUTPUT PIXEL</span>
              <strong>
                ({scanInfo.outputX}, {scanInfo.outputY})
              </strong>
            </div>

            <div className="s3-coordinate">
              <span>STRIDE</span>
              <strong>1</strong>
            </div>

            <div className="s3-coordinate">
              <span>PADDING</span>
              <strong>0</strong>
            </div>

            <p>
              The kernel takes a local patch beginning at the input
              top-left position. The whole patch produces one output pixel.
              When the scan reaches the end of a row, it starts again at the
              first column of the next row.
            </p>
          </div>
        </div>

        <div className="s3-scan-path">
          <div className="s3-path-label">
            Current scan path
          </div>

          <div className="s3-path-row">
            <span className="done">← previous positions</span>
            <strong>
              ({scanInfo.outputX}, {scanInfo.outputY})
            </strong>
            <span>→ next positions</span>
          </div>
        </div>

        <div className="s3-scan-visual">
          <div className="s3-scan-visual-header">
            <strong>How the kernel scans one row</strong>
            <span>
              column {scanInfo.outputX + 1} / {scanInfo.outputWidth}
            </span>
          </div>

          <div className="s3-scan-track">
            <div
              className="s3-scan-track-progress"
              style={{
                width: `${((scanInfo.outputX + 1) / scanInfo.outputWidth) * 100}%`,
              }}
            />

            <div
              className="s3-scan-track-marker"
              style={{
                left: `${((scanInfo.outputX + 0.5) / scanInfo.outputWidth) * 100}%`,
              }}
            />
          </div>

          <div className="s3-scan-row-labels">
            <span>column 0</span>
            <span>→ left to right →</span>
            <span>column {scanInfo.outputWidth - 1}</span>
          </div>

          <div className="s3-scan-direction">
            <span className="arrow">→</span>
            <strong>
              When this row ends, the scan moves down one row
            </strong>
            <span className="arrow">↓</span>
          </div>
        </div>

        <ScanMap
          outputX={scanInfo.outputX}
          outputY={scanInfo.outputY}
          outputWidth={scanInfo.outputWidth}
          outputHeight={scanInfo.outputHeight}
        />

        <div className="s3-scan-equation">
          <span>Input</span>
          <b>{image.width} × {image.height}</b>
          <strong>→</strong>
          <span>Kernel</span>
          <b>{kernelSize} × {kernelSize}</b>
          <strong>→</strong>
          <span>Output</span>
          <b>{scan.width} × {scan.height}</b>
        </div>
      </Section>

      <Section number="3.5" title="Repeat the local calculation">
        <div className="s3-repeat-header">
          <div>
            <div className="s3-card-title">
              Every position performs the same operation
            </div>

            <p>
              The scan does not introduce a new mathematical operation.
              It simply repeats the Group A calculation at a new location.
            </p>
          </div>

          <div className="s3-repeat-position">
            <span>CURRENT OUTPUT</span>
            <strong>
              g({scanInfo.outputX},{scanInfo.outputY})
            </strong>
          </div>
        </div>

        <div className="s3-repeat-layout">
          <div className="s3-repeat-card">
            <div className="s3-repeat-number">1</div>
            <strong>Take the patch</strong>
            <p>
              Read the image values underneath the kernel.
            </p>
          </div>

          <div className="s3-repeat-arrow">→</div>

          <div className="s3-repeat-card">
            <div className="s3-repeat-number">2</div>
            <strong>Multiply</strong>
            <p>
              Pair each patch value with its kernel weight.
            </p>
          </div>

          <div className="s3-repeat-arrow">→</div>

          <div className="s3-repeat-card">
            <div className="s3-repeat-number">3</div>
            <strong>Add</strong>
            <p>
              Add all products to produce one number.
            </p>
          </div>

          <div className="s3-repeat-arrow">→</div>

          <div className="s3-repeat-card">
            <div className="s3-repeat-number">4</div>
            <strong>Move</strong>
            <p>
              Shift the kernel and repeat the exact same calculation.
            </p>
          </div>
        </div>

        <div className="s3-repeat-live">
          <div className="s3-live-patch">
            <span>PATCH</span>
            <strong>
              {kernelSize} × {kernelSize}
            </strong>
          </div>

          <div className="s3-repeat-live-arrow">→</div>

          <div className="s3-live-patch">
            <span>CALCULATION</span>
            <strong>
              {kernelSize * kernelSize} products
            </strong>
          </div>

          <div className="s3-repeat-live-arrow">→</div>

          <div className="s3-live-output">
            <span>OUTPUT PIXEL</span>
            <strong>
              {scannedOutput.toFixed(3)}
            </strong>
          </div>
        </div>
      </Section>

      <Section number="3.6" title="Construct the output image">
        <div className="s3-output-layout">
          <div className="s3-output-image-card">
            <div className="s3-card-title">
              One output pixel for every valid kernel position
            </div>

            <div className="s3-output-canvas-shell">
              <OutputCanvas
                image={scan}
                outputX={scanInfo.outputX}
                outputY={scanInfo.outputY}
                title={`Output image · ${scan.width} × ${scan.height}`}
              />
            </div>
          </div>

          <div className="s3-output-explanation">
            <div className="s3-card-title">
              Where did the output come from?
            </div>

            <div className="s3-output-stat">
              <span>Input</span>
              <strong>
                {image.width} × {image.height}
              </strong>
            </div>

            <div className="s3-output-stat">
              <span>Kernel</span>
              <strong>
                {kernelSize} × {kernelSize}
              </strong>
            </div>

            <div className="s3-output-stat">
              <span>Stride</span>
              <strong>1</strong>
            </div>

            <div className="s3-output-stat">
              <span>Padding</span>
              <strong>0</strong>
            </div>

            <div className="s3-output-stat">
              <span>Output</span>
              <strong>
                {scan.width} × {scan.height}
              </strong>
            </div>

            <div className="s3-output-callout">
              <strong>
                {scanInfo.totalPositions.toLocaleString()} output pixels
              </strong>
              <p>
                Each output pixel came from one local patch calculation.
              </p>
            </div>

            <OutputPixelZoom
              image={scan}
              x={scanInfo.outputX}
              y={scanInfo.outputY}
            />
          </div>
        </div>

        <div className="s3-output-flow">
          <div>
            <strong>PATCH</strong>
            <span>Local image region</span>
          </div>

          <b>→</b>

          <div>
            <strong>MULTIPLY + ADD</strong>
            <span>Group A calculation</span>
          </div>

          <b>→</b>

          <div>
            <strong>ONE PIXEL</strong>
            <span>One output value</span>
          </div>

          <b>→</b>

          <div>
            <strong>REPEAT</strong>
            <span>Fill the output image</span>
          </div>
        </div>

        <div className="s3-b-summary">
          <strong>The big idea:</strong>
          convolution is the same local calculation repeated at every valid
          position of the image.
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
