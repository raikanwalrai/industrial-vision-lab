import { useEffect, useMemo, useRef, useState } from "react";
import { convolve, normalizeForDisplay } from "../math";
import { makeScene, type GrayImage } from "../imageScenes";

type Kernel = number[][];

const PRESETS: Record<string, Kernel> = {
  Identity: [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
  Blur: [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
  ],
  "Edge X": [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ],
  Sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
};

function CanvasImage({
  image,
  title,
}: {
  image: GrayImage;
  title: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const display = normalizeForDisplay(image);
    canvas.width = image.width;
    canvas.height = image.height;

    const pixels = ctx.createImageData(image.width, image.height);

    for (let i = 0; i < display.data.length; i++) {
      const value = Math.max(
        0,
        Math.min(255, Math.round(display.data[i])),
      );

      pixels.data[i * 4] = value;
      pixels.data[i * 4 + 1] = value;
      pixels.data[i * 4 + 2] = value;
      pixels.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(pixels, 0, 0);
  }, [image]);

  return (
    <div className="s4a-imageCard">
      <div className="s4a-cardTitle">{title}</div>
      <div className="s4a-canvasWrap">
        <canvas ref={ref} />
      </div>
    </div>
  );
}

function KernelGrid({
  kernel,
  onChange,
}: {
  kernel: Kernel;
  onChange: (row: number, col: number, value: number) => void;
}) {
  return (
    <div className="s4a-kernelGrid">
      {kernel.flatMap((row, r) =>
        row.map((value, c) => (
          <input
            key={`${r}-${c}`}
            className={
              r === 1 && c === 1
                ? "s4a-kernelInput center"
                : "s4a-kernelInput"
            }
            type="number"
            step="0.1"
            value={Number.isFinite(value) ? value : 0}
            onChange={(event) => {
              const next = Number(event.target.value);
              onChange(r, c, Number.isFinite(next) ? next : 0);
            }}
            aria-label={`Kernel row ${r + 1}, column ${c + 1}`}
          />
        )),
      )}
    </div>
  );
}

function format(value: number) {
  if (Math.abs(value) < 0.0005) return "0";
  return Number.isInteger(value) ? value.toString() : value.toFixed(3);
}

function getCenterPatch(image: GrayImage) {
  const x = Math.floor(image.width / 2);
  const y = Math.floor(image.height / 2);

  return Array.from({ length: 3 }, (_, r) =>
    Array.from({ length: 3 }, (_, c) => {
      const ix = Math.max(0, Math.min(image.width - 1, x + c - 1));
      const iy = Math.max(0, Math.min(image.height - 1, y + r - 1));
      return image.data[iy * image.width + ix];
    }),
  );
}

function calculateResponse(patch: number[][], kernel: Kernel) {
  return patch.reduce(
    (total, row, r) =>
      total +
      row.reduce(
        (rowTotal, value, c) => rowTotal + value * kernel[r][c],
        0,
      ),
    0,
  );
}

function normalizeKernel(kernel: Kernel) {
  const sum = kernel.flat().reduce((total, value) => total + value, 0);

  if (Math.abs(sum) < 0.000001) {
    return null;
  }

  return kernel.map((row) => row.map((value) => value / sum));
}

function formatKernelSum(kernel: Kernel) {
  return kernel.flat().reduce((sum, value) => sum + value, 0);
}

export default function Sprint4Page() {
  const [sceneName, setSceneName] = useState("shapes");
  const [presetName, setPresetName] = useState("Identity");
  const [kernel, setKernel] = useState<Kernel>(() =>
    PRESETS.Identity.map((row) => [...row]),
  );
  const [useNormalizedOutput, setUseNormalizedOutput] = useState(false);

  const source = useMemo(
    () => makeScene(sceneName),
    [sceneName],
  );

  const output = useMemo(
    () => convolve(source, kernel),
    [source, kernel],
  );

  const normalizedKernel = useMemo(
    () => normalizeKernel(kernel),
    [kernel],
  );

  const normalizedOutput = useMemo(
    () =>
      normalizedKernel
        ? convolve(source, normalizedKernel)
        : output,
    [source, normalizedKernel, output],
  );

  const displayedOutput = useNormalizedOutput
    ? normalizedOutput
    : output;

  const patch = useMemo(
    () => getCenterPatch(source),
    [source],
  );

  const response = useMemo(
    () => calculateResponse(patch, kernel),
    [patch, kernel],
  );

  const normalizedResponse = useMemo(
    () =>
      normalizedKernel
        ? calculateResponse(patch, normalizedKernel)
        : null,
    [patch, normalizedKernel],
  );

  const kernelSum = useMemo(
    () => kernel.flat().reduce((sum, value) => sum + value, 0),
    [kernel],
  );

  function updateKernel(row: number, col: number, value: number) {
    setKernel((current) =>
      current.map((r, rIndex) =>
        r.map((cell, cIndex) =>
          rIndex === row && cIndex === col ? value : cell,
        ),
      ),
    );
    setPresetName("Custom");
  }

  function selectPreset(name: string) {
    const selected = PRESETS[name];
    if (!selected) return;

    setKernel(selected.map((row) => [...row]));
    setPresetName(name);
  }

  return (
    <div className="learningPage sprint4Page sprint4GroupA">
      <header className="learningPageHeader">
        <div className="sectionEyebrow">SPRINT 4 · GROUP A</div>
        <h1>Build Your Own Kernel</h1>
        <p>
          Stop treating a filter as a mysterious box. Change its numbers,
          apply it to an image, and see exactly how the response changes.
        </p>
      </header>

      <section className="s4a-learningFlow">
        <div className="s4a-flowStep">
          <span>01</span>
          <b>Choose an image</b>
          <small>Give the kernel something to inspect.</small>
        </div>
        <div className="s4a-flowArrow">→</div>
        <div className="s4a-flowStep">
          <span>02</span>
          <b>Edit the kernel</b>
          <small>Each number controls one local contribution.</small>
        </div>
        <div className="s4a-flowArrow">→</div>
        <div className="s4a-flowStep">
          <span>03</span>
          <b>Observe the response</b>
          <small>The whole image changes as the rule changes.</small>
        </div>
      </section>

      <section className="s4a-workbench">
        <div className="s4a-controls">
          <div className="s4a-controlGroup">
            <label htmlFor="s4a-scene">IMAGE SCENE</label>
            <select
              id="s4a-scene"
              value={sceneName}
              onChange={(event) => setSceneName(event.target.value)}
            >
              <option value="shapes">Shapes</option>
              <option value="constant">Constant</option>
              <option value="step">Step Edge</option>
              <option value="ramp">Ramp</option>
              <option value="checker">Checkerboard</option>
              <option value="corner">Corner</option>
              <option value="noisy">Noisy</option>
            </select>
          </div>

          <div className="s4a-controlGroup">
            <label>STARTING KERNEL</label>
            <div className="s4a-presetRow">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  className={
                    presetName === name
                      ? "s4a-preset active"
                      : "s4a-preset"
                  }
                  onClick={() => selectPreset(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="s4a-editor">
          <div>
            <div className="s4a-sectionLabel">CUSTOM 3 × 3 KERNEL</div>
            <p className="s4a-hint">
              Change one or more coefficients. The result updates immediately.
            </p>

            <KernelGrid kernel={kernel} onChange={updateKernel} />

            <div className="s4a-kernelStats">
              <div>
                <span>Kernel sum</span>
                <b>{format(kernelSum)}</b>
              </div>
              <div>
                <span>Kernel state</span>
                <b>{presetName}</b>
              </div>
            </div>
          </div>

          <div className="s4a-mathCard">
            <div className="s4a-sectionLabel">WHAT THE NUMBERS MEAN</div>
            <div className="s4a-miniEquation">
              <span>pixel</span>
              <b>×</b>
              <span>weight</span>
              <b>→</b>
              <span>contribution</span>
            </div>
            <p>
              A positive coefficient adds a pixel's contribution. A negative
              coefficient subtracts it. A zero coefficient ignores it.
            </p>
            <div className="s4a-rule">
              <b>Change one number.</b>
              <span>
                You have changed the mathematical rule applied to every
                local 3 × 3 patch.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="s4a-visuals">
        <CanvasImage image={source} title="INPUT IMAGE" />
        <CanvasImage
          image={displayedOutput}
          title={
            useNormalizedOutput
              ? "NORMALIZED KERNEL RESPONSE"
              : "CUSTOM KERNEL RESPONSE"
          }
        />
      </section>

      <section className="s4a-response">
        <div className="s4a-responseHeader">
          <div>
            <div className="s4a-sectionLabel">ONE PIXEL — WORKED OUT</div>
            <h2>See one local calculation</h2>
            <p>
              The center pixel of the image is used here so the arithmetic
              stays small enough to inspect by hand.
            </p>
          </div>
          <div className="s4a-responseValue">
            <span>OUTPUT RESPONSE</span>
            <b>{format(response)}</b>
          </div>
        </div>

        <div className="s4a-calculation">
          <div className="s4a-patch">
            <div className="s4a-sectionLabel">IMAGE PATCH</div>
            <div className="s4a-matrix">
              {patch.flatMap((row, r) =>
                row.map((value, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={
                      r === 1 && c === 1
                        ? "s4a-matrixCell center"
                        : "s4a-matrixCell"
                    }
                  >
                    {format(value)}
                  </div>
                )),
              )}
            </div>
          </div>

          <div className="s4a-operator">×</div>

          <div className="s4a-patch">
            <div className="s4a-sectionLabel">YOUR KERNEL</div>
            <div className="s4a-matrix">
              {kernel.flatMap((row, r) =>
                row.map((value, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={
                      r === 1 && c === 1
                        ? "s4a-matrixCell center"
                        : "s4a-matrixCell"
                    }
                  >
                    {format(value)}
                  </div>
                )),
              )}
            </div>
          </div>

          <div className="s4a-operator">→</div>

          <div className="s4a-sumCard">
            <div className="s4a-sectionLabel">SUM OF PRODUCTS</div>
            <code>
              {patch
                .flatMap((row, r) =>
                  row.map(
                    (value, c) =>
                      `${format(value)} × ${format(kernel[r][c])}`,
                  ),
                )
                .join("  +  ")}
            </code>
            <strong>{format(response)}</strong>
          </div>
        </div>
      </section>


      <section className="s4c-sharpening">
        <div className="s4c-header">
          <div>
            <div className="s4a-sectionLabel">SPRINT 4 · GROUP C</div>
            <h2>Sharpening &amp; Image Enhancement</h2>
            <p>
              Sharpening makes transitions and fine structures stand out.
              The key idea is to strengthen local differences rather than
              simply making every pixel brighter.
            </p>
          </div>

          <div className="s4c-ideaBadge">
            <span>ENHANCEMENT IDEA</span>
            <strong>ORIGINAL + DETAIL</strong>
          </div>
        </div>

        <div className="s4c-presets">
          <button
            className="s4c-presetInfo"
            onClick={() => selectPreset("Identity")}
          >
            <b>Identity</b>
            <span>No enhancement — a useful baseline.</span>
          </button>

          <button
            className="s4c-presetInfo"
            onClick={() => selectPreset("Sharpen")}
          >
            <b>Sharpen</b>
            <span>Strong center, negative neighbours.</span>
          </button>

          <button
            className="s4c-presetInfo"
            onClick={() => selectPreset("Blur")}
          >
            <b>Blur</b>
            <span>A comparison filter that smooths differences.</span>
          </button>
        </div>

        <div className="s4c-kernelComparison">
          <div className="s4c-kernelExplanation">
            <div className="s4a-sectionLabel">SHARPEN KERNEL</div>

            <div className="s4a-matrix">
              {PRESETS.Sharpen.flatMap((row, r) =>
                row.map((value, c) => (
                  <div
                    key={`sharp-${r}-${c}`}
                    className={
                      r === 1 && c === 1
                        ? "s4a-matrixCell center"
                        : "s4a-matrixCell"
                    }
                  >
                    {format(value)}
                  </div>
                )),
              )}
            </div>
          </div>

          <div className="s4c-sharpFormula">
            <div className="s4a-sectionLabel">WHY THE SIGNS MATTER</div>

            <div className="s4c-signRow">
              <span className="positive">+</span>
              <span className="negative">−</span>
              <span className="zero">0</span>
            </div>

            <p>
              The positive center keeps the current pixel. Negative neighbour
              weights subtract nearby pixels. Large local differences can
              therefore become more visible.
            </p>
          </div>

          <div className="s4c-example">
            <div className="s4a-sectionLabel">SIMPLE LOCAL EXAMPLE</div>

            <div className="s4c-edgeRow">
              <div>
                <span>FLAT</span>
                <b>50 · 50 · 50</b>
              </div>

              <div>
                <span>TRANSITION</span>
                <b>50 · 50 · 200</b>
              </div>

              <div>
                <span>DETAIL</span>
                <b>50 · 200 · 200</b>
              </div>
            </div>

            <p>
              When nearby pixels differ strongly, neighbour subtraction
              creates a stronger response.
            </p>
          </div>
        </div>

        <div className="s4c-controlledPatch">
          <div>
            <div className="s4a-sectionLabel">CONTROLLED 3 × 3 PATCH</div>
            <p>
              Use this simple patch to see why sharpening can strengthen a
              local peak while leaving a flat region unchanged.
            </p>
          </div>

          <div className="s4c-controlledMatrix">
            <span>50</span><span>50</span><span>50</span>
            <span>50</span><strong>100</strong><span>50</span>
            <span>50</span><span>50</span><span>50</span>
          </div>

          <div className="s4c-controlledEquation">
            <div>
              <span>IDENTITY</span>
              <b>100</b>
            </div>
            <div>
              <span>SHARPEN</span>
              <b>5(100) − 4(50) = 300</b>
            </div>
          </div>
        </div>

        <div className="s4c-responseCompare">
          <div className="s4c-responseCard">
            <span>IDENTITY RESPONSE</span>
            <strong>100</strong>
            <small>Center pixel only.</small>
          </div>

          <div className="s4c-responseCard accent">
            <span>SHARPEN RESPONSE</span>
            <strong>300</strong>
            <small>
              5(100) − 50 − 50 − 50 − 50 = 300
            </small>
          </div>

          <div className="s4c-responseCard">
            <span>SHARPEN SUM</span>
            <strong>{formatKernelSum(PRESETS.Sharpen)}</strong>
            <small>This sharpen kernel preserves overall DC level.</small>
          </div>
        </div>

        <div className="s4c-experiment">
          <div>
            <div className="s4a-sectionLabel">CONTROLLED EXPERIMENT</div>
            <h3>Same image. Different mathematical rule.</h3>
            <p>
              Use the Group A preset controls above. Keep the input image
              fixed and compare the visual response.
            </p>
          </div>

          <div className="s4c-experimentSteps">
            <span>01</span>
            <b>Select Identity</b>
            <small>Record the baseline response.</small>

            <span>02</span>
            <b>Select Sharpen</b>
            <small>Look closely at boundaries and fine structures.</small>

            <span>03</span>
            <b>Change the centre</b>
            <small>Increase 5 and observe the stronger local response.</small>
          </div>
        </div>

        <div className="s4c-lesson">
          <b>Group C lesson: </b>
          sharpening changes the local weighting so existing transitions and
          fine detail become more prominent; it does not invent new image
          information.
        </div>
      </section>

      <section className="s4b-normalization">
        <div className="s4b-header">
          <div>
            <div className="s4a-sectionLabel">SPRINT 4 · GROUP B</div>
            <h2>Kernel Sum &amp; Normalization</h2>
            <p>
              The same shape of kernel can behave very differently depending
              on the sum of its coefficients. For smoothing, we often want
              the weights to add up to 1 so a constant image keeps the same
              brightness.
            </p>
          </div>

          <div className="s4b-formula">
            <span>normalized kernel</span>
            <b>=</b>
            <span>kernel ÷ kernel sum</span>
          </div>
        </div>

        <div className="s4b-experiment">
          <div className="s4b-statCard">
            <span>RAW KERNEL SUM</span>
            <strong>{format(kernelSum)}</strong>
            <small>
              S = Σ Kᵢⱼ
            </small>
          </div>

          <div className="s4b-statCard">
            <span>NORMALIZED SUM</span>
            <strong>
              {normalizedKernel ? format(formatKernelSum(normalizedKernel)) : "—"}
            </strong>
            <small>
              {normalizedKernel
                ? "The weights now add to 1."
                : "Cannot normalize a zero-sum kernel."}
            </small>
          </div>

          <button
            className={
              useNormalizedOutput
                ? "s4b-toggle active"
                : "s4b-toggle"
            }
            onClick={() => setUseNormalizedOutput((current) => !current)}
          >
            {useNormalizedOutput
              ? "Showing normalized output"
              : "Show normalized output"}
          </button>
        </div>

        <div className="s4b-matrices">
          <div className="s4b-matrixCard">
            <div className="s4a-sectionLabel">RAW KERNEL</div>
            <div className="s4a-matrix">
              {kernel.flatMap((row, r) =>
                row.map((value, c) => (
                  <div
                    key={`raw-${r}-${c}`}
                    className={
                      r === 1 && c === 1
                        ? "s4a-matrixCell center"
                        : "s4a-matrixCell"
                    }
                  >
                    {format(value)}
                  </div>
                )),
              )}
            </div>
            <div className="s4b-matrixCaption">
              Sum = {format(kernelSum)}
            </div>
          </div>

          <div className="s4b-arrow">÷</div>

          <div className="s4b-sumBox">
            <span>KERNEL SUM</span>
            <strong>{format(kernelSum)}</strong>
            <small>
              Every coefficient is divided by this number.
            </small>
          </div>

          <div className="s4b-arrow">→</div>

          <div className="s4b-matrixCard">
            <div className="s4a-sectionLabel">NORMALIZED KERNEL</div>
            {normalizedKernel ? (
              <>
                <div className="s4a-matrix">
                  {normalizedKernel.flatMap((row, r) =>
                    row.map((value, c) => (
                      <div
                        key={`normalized-${r}-${c}`}
                        className={
                          r === 1 && c === 1
                            ? "s4a-matrixCell center"
                            : "s4a-matrixCell"
                        }
                      >
                        {format(value)}
                      </div>
                    )),
                  )}
                </div>
                <div className="s4b-matrixCaption">
                  Sum = {format(formatKernelSum(normalizedKernel))}
                </div>
              </>
            ) : (
              <div className="s4b-zeroWarning">
                This kernel has sum 0, so it cannot be normalized by division.
              </div>
            )}
          </div>
        </div>

        <div className="s4b-responseCompare">
          <div>
            <span>RAW RESPONSE</span>
            <strong>{format(response)}</strong>
          </div>
          <div>
            <span>NORMALIZED RESPONSE</span>
            <strong>
              {normalizedResponse === null ? "—" : format(normalizedResponse)}
            </strong>
          </div>
          <div>
            <span>WHY IT MATTERS</span>
            <p>
              If the kernel sum is larger than 1, a constant image can become
              brighter. If it is 1, the weighted average preserves a constant
              value.
            </p>
          </div>
        </div>

        <div className="s4b-constantTest">
          <div>
            <div className="s4a-sectionLabel">SANITY CHECK · CONSTANT IMAGE</div>
            <h3>What should happen to a flat image?</h3>
            <p>
              Suppose every pixel is 128. With a normalized kernel whose
              coefficients sum to 1:
            </p>
          </div>

          <div className="s4b-constantEquation">
            <span>128</span>
            <b>×</b>
            <span>ΣK = 1</span>
            <b>→</b>
            <strong>128</strong>
          </div>
        </div>

        <div className="s4b-lesson">
          <b>Group B lesson:</b>
          normalization changes the scale of the response without changing
          the relative pattern of the weights.
        </div>
      </section>

      <section className="s4a-lessonNote">
        <span className="statusDot" />
        <div>
          <b>Key lesson</b>
          <span>
            A custom kernel is not just a picture of numbers. It is a
            mathematical rule that is applied repeatedly to local image
            patches.
          </span>
        </div>
      </section>
    </div>
  );
}
