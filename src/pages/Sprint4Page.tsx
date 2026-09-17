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

export default function Sprint4Page() {
  const [sceneName, setSceneName] = useState("shapes");
  const [presetName, setPresetName] = useState("Identity");
  const [kernel, setKernel] = useState<Kernel>(() =>
    PRESETS.Identity.map((row) => [...row]),
  );

  const source = useMemo(
    () => makeScene(sceneName),
    [sceneName],
  );

  const output = useMemo(
    () => convolve(source, kernel),
    [source, kernel],
  );

  const patch = useMemo(
    () => getCenterPatch(source),
    [source],
  );

  const response = useMemo(
    () => calculateResponse(patch, kernel),
    [patch, kernel],
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
        <CanvasImage image={output} title="CUSTOM KERNEL RESPONSE" />
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
