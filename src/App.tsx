import { useMemo, useState } from "react";
import { filters, stats as kernelStats, type Kernel } from "./filters";
import { makeScene, scenes, type GrayImage } from "./imageScenes";
import {
  convolve,
  normalizeForDisplay,
  patchCalculation,
  pixelNeighborhood,
  statsImage,
} from "./math";

function Canvas({ image, label }: { image: GrayImage; label: string }) {
  const ref = (node: HTMLCanvasElement | null) => {
    if (!node) return;

    const c = node.getContext("2d")!;
    const w = image.width;
    const h = image.height;

    node.width = w;
    node.height = h;

    const d = normalizeForDisplay(image).data;
    const id = c.createImageData(w, h);

    for (let i = 0; i < d.length; i++) {
      const v = Math.round(Math.max(0, Math.min(255, d[i])));

      id.data[i * 4] = v;
      id.data[i * 4 + 1] = v;
      id.data[i * 4 + 2] = v;
      id.data[i * 4 + 3] = 255;
    }

    c.putImageData(id, 0, 0);
  };

  return (
    <div className="canvasWrap">
      <canvas ref={ref} />
      <div className="caption">{label}</div>
    </div>
  );
}

function KernelGrid({
  kernel,
  onChange,
}: {
  kernel: number[][];
  onChange?: (k: number[][]) => void;
}) {
  return (
    <div
      className="kernelGrid"
      style={{
        gridTemplateColumns: `repeat(${kernel[0].length},1fr)`,
      }}
    >
      {kernel.flatMap((row, r) =>
        row.map((v, c) => (
          <input
            key={`${r}-${c}`}
            type="number"
            step="0.1"
            value={Number(v.toFixed(3))}
            onChange={(e) => {
              if (!onChange) return;

              const k = kernel.map((a) => [...a]);
              k[r][c] = Number(e.target.value);
              onChange(k);
            }}
          />
        )),
      )}
    </div>
  );
}

function PixelInspector({
  image,
  pixel,
}: {
  image: GrayImage;
  pixel: { x: number; y: number };
}) {
  const neighbourhood = pixelNeighborhood(
    image,
    pixel.x,
    pixel.y,
    1,
  );

  return (
    <section className="pixelInspector panel">
      <div className="sectionEyebrow">PIXEL INSPECTOR</div>

      <div className="pixelInspectorHeader">
        <div>
          <h2>Understand the image as numbers</h2>
          <p>
            An image is a grid of numerical pixel values. The selected
            coordinate tells us exactly which number we are looking at.
          </p>
        </div>

        <div className="selectedPixel">
          <span>SELECTED PIXEL</span>
          <b>
            ({pixel.x}, {pixel.y})
          </b>
        </div>
      </div>

      <div className="pixelInspectorGrid">
        <div className="pixelMatrix">
          <h3>Local 3 × 3 neighbourhood</h3>

          <div
            className="numericMatrix"
            style={{
              gridTemplateColumns: `repeat(${neighbourhood.values[0].length}, 1fr)`,
            }}
          >
            {neighbourhood.values.flatMap((row, r) =>
              row.map((value, c) => {
                const center = r === 1 && c === 1;

                return (
                  <div
                    className={`numericCell ${
                      center ? "centerCell" : ""
                    }`}
                    key={`${r}-${c}`}
                  >
                    {value.toFixed(1)}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        <div className="pixelValueCard">
          <h3>Pixel value</h3>

          <div className="pixelValue">
            {neighbourhood.center.toFixed(2)}
          </div>

          <p>
            Therefore:
          </p>

          <div className="pixelEquation">
            I({pixel.x}, {pixel.y}) ={" "}
            <b>{neighbourhood.center.toFixed(2)}</b>
          </div>

          <p className="learningNote">
            This single number is the input value that a filter can use
            when calculating an output pixel.
          </p>
        </div>
      </div>
    </section>
  );
}


function PatchKernelAlignment({
  image,
  kernel,
  pixel,
}: {
  image: GrayImage;
  kernel: number[][];
  pixel: { x: number; y: number };
}) {
  const neighbourhood = pixelNeighborhood(
    image,
    pixel.x,
    pixel.y,
    Math.floor(kernel.length / 2),
  );

  const rows = kernel.length;
  const cols = kernel[0].length;

  return (
    <section className="patchKernelAlignment panel">
      <div className="sectionEyebrow">PATCH + KERNEL ALIGNMENT</div>

      <div className="alignmentHeader">
        <div>
          <h2>Match each image value with its kernel weight</h2>
          <p>
            The kernel does not float above the image randomly. Each kernel
            position lines up with exactly one position in the image patch.
          </p>
        </div>

        <div className="alignmentPixel">
          Pixel
          <b>
            ({pixel.x}, {pixel.y})
          </b>
        </div>
      </div>

      <div className="alignmentMatrices">
        <div className="alignmentCard">
          <h3>Image patch</h3>

          <div
            className="alignmentMatrix imageAlignmentMatrix"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(55px, 1fr))`,
            }}
          >
            {neighbourhood.values.flatMap((row, r) =>
              row.map((value, c) => (
                <div
                  className={
                    r === Math.floor(rows / 2) &&
                    c === Math.floor(cols / 2)
                      ? "alignmentCell alignmentCenterCell"
                      : "alignmentCell"
                  }
                  key={`${r}-${c}`}
                >
                  {value.toFixed(1)}
                </div>
              )),
            )}
          </div>
        </div>

        <div className="alignmentSymbol">×</div>

        <div className="alignmentCard">
          <h3>Kernel weights</h3>

          <div
            className="alignmentMatrix kernelAlignmentMatrix"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(55px, 1fr))`,
            }}
          >
            {kernel.flatMap((row, r) =>
              row.map((value, c) => (
                <div
                  className={
                    r === Math.floor(rows / 2) &&
                    c === Math.floor(cols / 2)
                      ? "alignmentCell alignmentCenterCell"
                      : "alignmentCell"
                  }
                  key={`${r}-${c}`}
                >
                  {value.toFixed(3)}
                </div>
              )),
            )}
          </div>
        </div>
      </div>

      <div className="alignmentExplanation">
        <span className="experimentLabel">KEY IDEA</span>
        <p>
          The top-left image value is paired with the top-left kernel weight.
          The centre image value is paired with the centre kernel weight, and
          so on. The next step is to multiply every matching pair.
        </p>
      </div>
    </section>
  );
}

function ElementWiseMultiplication({
  image,
  kernel,
  pixel,
}: {
  image: GrayImage;
  kernel: number[][];
  pixel: { x: number; y: number };
}) {
  const radius = Math.floor(kernel.length / 2);
  const neighbourhood = pixelNeighborhood(
    image,
    pixel.x,
    pixel.y,
    radius,
  );

  const rows = kernel.length;
  const cols = kernel[0].length;

  return (
    <section className="elementWiseMultiplication panel">
      <div className="sectionEyebrow">ELEMENT-WISE MULTIPLICATION</div>

      <div className="elementWiseHeader">
        <div>
          <h2>Multiply each matching pair</h2>
          <p>
            Take one image value and the kernel weight at the same position.
            Multiply them. Do this for every position in the patch.
          </p>
        </div>

        <div className="elementWisePixel">
          Pixel
          <b>
            ({pixel.x}, {pixel.y})
          </b>
        </div>
      </div>

      <div className="productMatrixCard">
        <h3>Image value × kernel weight = product</h3>

        <div
          className="productMatrix"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(70px, 1fr))`,
          }}
        >
          {neighbourhood.values.flatMap((row, r) =>
            row.map((value, c) => {
              const weight = kernel[r][c];
              const product = value * weight;
              const center =
                r === Math.floor(rows / 2) &&
                c === Math.floor(cols / 2);

              return (
                <div
                  className={`productCell ${
                    center ? "productCenterCell" : ""
                  }`}
                  key={`${r}-${c}`}
                >
                  <span className="productPair">
                    {value.toFixed(1)} × {weight.toFixed(3)}
                  </span>
                  <b>= {product.toFixed(2)}</b>
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="elementWiseExplanation">
        <span className="experimentLabel">KEY IDEA</span>
        <p>
          Every image value has been multiplied by the kernel weight in the
          same position. These products are the individual pieces that will
          be added together in the next step.
        </p>
      </div>

      <div className="elementWiseWarning">
        <b>STOP HERE.</b> We have multiplied the matching pairs, but we have
        <b> not added the products yet.</b>
      </div>
    </section>
  );
}


function KernelMatrixViewer({
  kernel,
  filterName,
}: {
  kernel: number[][];
  filterName: string;
}) {
  const kernelSize = `${kernel.length} × ${kernel[0].length}`;
  const centerRow = Math.floor(kernel.length / 2);
  const centerCol = Math.floor(kernel[0].length / 2);
  const centerWeight = kernel[centerRow][centerCol];

  const flat = kernel.flat();
  const sum = flat.reduce((a, b) => a + b, 0);
  const min = Math.min(...flat);
  const max = Math.max(...flat);

  return (
    <section className="kernelMatrixViewer panel">
      <div className="sectionEyebrow">KERNEL MATRIX</div>

      <div className="kernelMatrixHeader">
        <div>
          <h2>Understand the filter as numbers</h2>
          <p>
            A kernel is a small matrix of weights. Each weight is positioned
            relative to the image neighbourhood that it will act on.
          </p>
        </div>

        <div className="kernelNameBadge">
          {filterName}
        </div>
      </div>

      <div className="kernelMatrixLayout">
        <div className="kernelMatrixCard">
          <h3>Kernel weights</h3>

          <div
            className="educationalKernelMatrix"
            style={{
              gridTemplateColumns: `repeat(${kernel[0].length}, minmax(55px, 1fr))`,
            }}
          >
            {kernel.flatMap((row, r) =>
              row.map((value, c) => {
                const center =
                  r === centerRow && c === centerCol;

                return (
                  <div
                    className={`kernelMatrixCell ${
                      center ? "kernelCenterCell" : ""
                    }`}
                    key={`${r}-${c}`}
                  >
                    <span className="kernelPosition">
                      ({r},{c})
                    </span>

                    <b>{value.toFixed(3)}</b>
                  </div>
                );
              }),
            )}
          </div>

          <p className="kernelMatrixHint">
            Each cell has two meanings: its <b>position</b> and its
            numerical <b>weight</b>.
          </p>
        </div>

        <div className="kernelSummaryCard">
          <h3>Kernel summary</h3>

          <div className="metric">
            <span>Kernel size</span>
            <b>{kernelSize}</b>
          </div>

          <div className="metric">
            <span>Centre weight</span>
            <b>{centerWeight.toFixed(3)}</b>
          </div>

          <div className="metric">
            <span>Σ weights</span>
            <b>{sum.toFixed(4)}</b>
          </div>

          <div className="metric">
            <span>Minimum</span>
            <b>{min.toFixed(3)}</b>
          </div>

          <div className="metric">
            <span>Maximum</span>
            <b>{max.toFixed(3)}</b>
          </div>
        </div>
      </div>
    </section>
  );
}


function FilterDetail({ filter }: { filter: Kernel }) {
  return (
    <section className="filterDetail panel">
      <div className="filterDetailHeader">
        <div>
          <div className="sectionEyebrow">UNDERSTAND THE FILTER</div>
          <h2>{filter.name}</h2>
        </div>

        <span className="familyBadge">{filter.family}</span>
      </div>

      <div className="detailGrid">
        <article className="detailItem">
          <h3>What is it?</h3>
          <p>{filter.whatIsIt}</p>
        </article>

        <article className="detailItem">
          <h3>What does it look for?</h3>
          <p>{filter.whatDoesItLookFor}</p>
        </article>

        <article className="detailItem">
          <h3>What does it do?</h3>
          <p>{filter.whatDoesItDo}</p>
        </article>

        <article className="detailItem">
          <h3>Mathematical idea</h3>
          <p>{filter.mathematicalIdea}</p>
        </article>

        <article className="detailItem">
          <h3>What should I see?</h3>
          <p>{filter.whatShouldISee}</p>
        </article>

        <article className="detailItem tryItem">
          <h3>Try this on</h3>
          <p>
            <b>{filter.recommendedScene}</b>
          </p>
        </article>
      </div>

      <div className="experimentBox">
        <div>
          <span className="experimentLabel">EXPERIMENT</span>
          <p>{filter.experiment}</p>
        </div>
      </div>
    </section>
  );
}


function ComparisonLab({
  source,
  initialNames,
}: {
  source: GrayImage;
  initialNames: string[];
}) {
  const [names, setNames] = useState(initialNames);

  function toggleFilter(name: string) {
    setNames((current) => {
      if (current.includes(name)) {
        return current.filter((n) => n !== name);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, name];
    });
  }

  const results = useMemo(
    () =>
      names.map((name) => {
        const filter = filters.find((f) => f.name === name)!;
        const image = convolve(source, filter.values);
        return {
          filter,
          image,
          stats: statsImage(image),
        };
      }),
    [source, names],
  );

  return (
    <section className="comparisonLab panel">
      <div className="comparisonHeader">
        <div>
          <div className="sectionEyebrow">COMPARE FILTERS</div>
          <h2>What changes when the filter changes?</h2>
          <p>
            Keep the image fixed and change the filter. This makes it easier
            to see what each kernel is actually doing.
          </p>
        </div>

        <div className="comparisonCount">
          {names.length} / 4 selected
        </div>
      </div>

      <div className="comparisonControls">
        {filters.map((filter) => {
          const active = names.includes(filter.name);
          const disabled = !active && names.length >= 4;

          return (
            <button
              key={filter.name}
              className={active ? "active" : ""}
              disabled={disabled}
              onClick={() => toggleFilter(filter.name)}
            >
              {filter.name}
            </button>
          );
        })}
      </div>

      <div className="comparisonGrid">
        <div className="comparisonCard originalCard">
          <Canvas image={source} label="Original image" />
          <h3>Original</h3>
          <p>Reference image — no filter applied.</p>
        </div>

        {results.map(({ filter, image, stats }) => (
          <div className="comparisonCard" key={filter.name}>
            <Canvas image={image} label={filter.name} />
            <h3>{filter.name}</h3>
            <p>{filter.whatDoesItDo}</p>

            <div className="comparisonMetric">
              <span>Output mean</span>
              <b>{stats.mean.toFixed(2)}</b>
            </div>

            <div className="comparisonMetric">
              <span>Output range</span>
              <b>
                {stats.min.toFixed(1)} → {stats.max.toFixed(1)}
              </b>
            </div>
          </div>
        ))}
      </div>

      <div className="comparisonObservation">
        <span className="experimentLabel">OBSERVE</span>
        <p>
          Ask yourself: Which filters make the image smoother? Which ones
          emphasize boundaries? Which ones create positive and negative
          responses? The image is the same — the kernel is what changed.
        </p>
      </div>
    </section>
  );
}

export default function App() {
  const [sceneId, setSceneId] = useState("shapes");
  const [filterName, setFilterName] = useState("Box 3×3");
  const [custom, setCustom] = useState(false);
  const selected = filters.find((f) => f.name === filterName)!;
  const [kernel, setKernel] = useState(selected.values);
  const [normalize, setNormalize] = useState(true);
  const [pixel, setPixel] = useState({ x: 128, y: 128 });

  const source = useMemo(() => makeScene(sceneId), [sceneId]);
  const activeKernel = custom ? kernel : selected.values;
  const output = useMemo(
    () => convolve(source, activeKernel),
    [source, activeKernel],
  );
  const ks = useMemo(() => kernelStats(activeKernel), [activeKernel]);
  const si = statsImage(source);
  const so = statsImage(output);
  const calc = patchCalculation(source, activeKernel, pixel.x, pixel.y);
  const scene = scenes.find((s) => s.id === sceneId)!;

  function chooseFilter(name: string) {
    setFilterName(name);

    const f = filters.find((x) => x.name === name)!;
    setKernel(f.values);
    setCustom(false);
  }

  function normalizedKernel(k: number[][]) {
    const s = k.flat().reduce((a, b) => a + b, 0);
    return s === 0 ? k : k.map((r) => r.map((v) => v / s));
  }

  return (
    <main>
      <header>
        <div className="eyebrow">ID6004W · INDUSTRIAL VISION</div>
        <h1>The Filter Zoo — Interactive Lab</h1>
        <p>
          Explore how the <b>same image</b> behaves under different filters,
          then design your own kernel.
        </p>
      </header>

      <section className="controls">
        <label>
          IMAGE
          <select
            value={sceneId}
            onChange={(e) => setSceneId(e.target.value)}
          >
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="sceneNote">{scene.note}</div>
      </section>

      <section className="filterButtons">
        {filters.map((f) => (
          <button
            className={
              filterName === f.name && !custom ? "active" : ""
            }
            onClick={() => chooseFilter(f.name)}
            key={f.name}
          >
            {f.name}
          </button>
        ))}

        <button
          className={custom ? "active" : ""}
          onClick={() => setCustom(true)}
        >
          Custom kernel
        </button>
      </section>

      <section className="viewer">
        <Canvas
          image={source}
          label={`f(m,n) · ${scene.label}`}
        />

        <div className="arrow">→</div>

        <Canvas
          image={output}
          label={`g(m,n) = f * h · ${
            custom ? "Custom" : selected.name
          }`}
        />
      </section>

      {!custom && <FilterDetail filter={selected} />}

      <PixelInspector
        image={source}
        pixel={pixel}
      />

      <KernelMatrixViewer
        kernel={activeKernel}
        filterName={custom ? "Custom kernel" : selected.name}
      />

      <PatchKernelAlignment
        image={source}
        kernel={activeKernel}
        pixel={pixel}
      />

      <ElementWiseMultiplication
        image={source}
        kernel={activeKernel}
        pixel={pixel}
      />

      {!custom && (
        <ComparisonLab
          source={source}
          initialNames={["Box 3×3", "Gaussian σ≈1", "Sobel X"]}
        />
      )}

      <section className="workbench">
        <div className="panel">
          <h2>
            {custom ? "Design your own kernel" : selected.name}
          </h2>

          <p>
            {custom
              ? "Edit the weights and watch the result update."
              : "Kernel and interpretation."}
          </p>

          <KernelGrid
            kernel={activeKernel}
            onChange={custom ? setKernel : undefined}
          />

          {custom && (
            <label className="check">
              <input
                type="checkbox"
                checked={normalize}
                onChange={(e) => {
                  setNormalize(e.target.checked);

                  if (e.target.checked) {
                    setKernel(normalizedKernel(kernel));
                  }
                }}
              />
              normalize (divide by Σ weights)
            </label>
          )}

          <div className="description">
            {custom
              ? "A sum near 1 tends to preserve the mean/DC component; a sum near 0 rejects constant intensity."
              : selected.description}
          </div>
        </div>

        <div className="panel">
          <h2>Kernel mathematics</h2>

          <div className="metric">
            <span>Σ weights</span>
            <b>{ks.sum.toFixed(4)}</b>
          </div>

          <div className="metric">
            <span>Σ weights²</span>
            <b>{ks.sumSq.toFixed(4)}</b>
          </div>

          <div className="metric">
            <span>Noise gain √Σh²</span>
            <b>{ks.noiseGain.toFixed(4)}</b>
          </div>

          <div className="metric">
            <span>Minimum / maximum</span>
            <b>
              {ks.min.toFixed(3)} / {ks.max.toFixed(3)}
            </b>
          </div>

          <div className="metric">
            <span>Kernel size</span>
            <b>{ks.size}</b>
          </div>
        </div>

        <div className="panel">
          <h2>Image statistics</h2>

          <div className="metric">
            <span>Input min / max</span>
            <b>
              {si.min.toFixed(1)} / {si.max.toFixed(1)}
            </b>
          </div>

          <div className="metric">
            <span>Input mean</span>
            <b>{si.mean.toFixed(2)}</b>
          </div>

          <div className="metric">
            <span>Output min / max</span>
            <b>
              {so.min.toFixed(1)} / {so.max.toFixed(1)}
            </b>
          </div>

          <div className="metric">
            <span>Output mean</span>
            <b>{so.mean.toFixed(2)}</b>
          </div>
        </div>
      </section>

      <section className="calculation panel">
        <div className="calcHead">
          <div>
            <h2>Show the calculation</h2>
            <p>
              Select an output pixel. We explicitly show every
              multiplication and the final sum.
            </p>
          </div>

          <div className="pixel">
            <label>
              x{" "}
              <input
                type="number"
                min="0"
                max="255"
                value={pixel.x}
                onChange={(e) =>
                  setPixel((p) => ({
                    ...p,
                    x: Number(e.target.value),
                  }))
                }
              />
            </label>

            <label>
              y{" "}
              <input
                type="number"
                min="0"
                max="255"
                value={pixel.y}
                onChange={(e) =>
                  setPixel((p) => ({
                    ...p,
                    y: Number(e.target.value),
                  }))
                }
              />
            </label>
          </div>
        </div>

        <div className="terms">
          {calc.terms.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>

        <div className="result">
          Output at ({calc.x},{calc.y}) ={" "}
          <b>{calc.total.toFixed(2)}</b>
        </div>
      </section>

      <section className="concept">
        <h2>Chapter 3 mental model</h2>

        <div className="flow">
          <span>IMAGE</span>
          <b>×</b>
          <span>KERNEL</span>
          <b>→</b>
          <span>FILTERED IMAGE</span>
        </div>

        <p>
          <b>Σh ≈ 1</b> commonly indicates smoothing/DC preservation.
          <b> Σh ≈ 0</b> is common for derivative and high-pass
          operators, but by itself does not prove the derivative order.
          The CNN connection comes next: classical filters are chosen
          by people; CNN filters are learned from data.
        </p>
      </section>

      <footer>
        Built as a Chapter 3 companion lab · Runs entirely in the
        browser · No image data is uploaded
      </footer>
    </main>
  );
}
