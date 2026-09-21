import Sprint3Page from "./pages/Sprint3Page";
import Sprint5Page from "./pages/Sprint5Page";
import Sprint6Page from "./pages/Sprint6Page";
import Sprint7Page from "./pages/Sprint7Page";
import Sprint8Page from "./pages/Sprint8Page";
import Sprint8GroupBPage from "./pages/Sprint8GroupBPage";
import Sprint8GroupCPage from "./pages/Sprint8GroupCPage";
import Sprint8GroupDPage from "./pages/Sprint8GroupDPage";
import Sprint9Page from "./pages/Sprint9Page";
import Sprint9GroupAPage from "./pages/Sprint9GroupAPage";
import Sprint9GroupBPage from "./pages/Sprint9GroupBPage";
import Sprint9GroupCPage from "./pages/Sprint9GroupCPage";
import Sprint9GroupDPage from "./pages/Sprint9GroupDPage";
import Sprint10Page from "./pages/Sprint10Page";
import Sprint10GroupAPage from "./pages/Sprint10GroupAPage";
import Sprint10GroupBPage from "./pages/Sprint10GroupBPage";
import Sprint10GroupCPage from "./pages/Sprint10GroupCPage";
import Sprint4Page from "./pages/Sprint4Page";
import AppShell from "./components/AppShell";
import Sprint3 from "./Sprint3";
import { useEffect, useMemo, useState } from "react";
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
            step="0.001"
            value={v.toFixed(3)}
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



function SumOfProductsOutput({
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

  const products = neighbourhood.values.flatMap((row, r) =>
    row.map((value, c) => value * kernel[r][c]),
  );

  const total = products.reduce((sum, product) => sum + product, 0);

  const equation = products
    .map((product, index) => {
      const rounded = product.toFixed(2);
      if (index === 0) return rounded;
      return product >= 0
        ? `+ ${rounded}`
        : `− ${Math.abs(product).toFixed(2)}`;
    })
    .join(" ");

  return (
    <section className="sumOfProductsOutput panel">
      <div className="sectionEyebrow">SUM OF PRODUCTS → OUTPUT PIXEL</div>

      <div className="sumOutputHeader">
        <div>
          <h2>Add all the products</h2>
          <p>
            The multiplication step gave us one product for every matching
            image value and kernel weight. Now add all of those products
            together to produce one output pixel.
          </p>
        </div>

        <div className="sumOutputPixel">
          Output pixel
          <b>
            ({pixel.x}, {pixel.y})
          </b>
        </div>
      </div>

      <div className="sumProductsCard">
        <h3>The products we are adding</h3>

        <div
          className="sumProductMatrix"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(70px, 1fr))`,
          }}
        >
          {products.map((product, index) => (
            <div
              className={`sumProductCell ${
                index === Math.floor(products.length / 2)
                  ? "sumProductCenterCell"
                  : ""
              }`}
              key={index}
            >
              {product.toFixed(2)}
            </div>
          ))}
        </div>
      </div>

      <div className="sumEquationCard">
        <span className="experimentLabel">SUM OF PRODUCTS</span>
        <div className="sumEquation">{equation}</div>
        <div className="sumResult">
          <span>Total</span>
          <b>{total.toFixed(2)}</b>
        </div>
      </div>

      <div className="outputPixelCard">
        <div>
          <span className="experimentLabel">OUTPUT PIXEL</span>
          <p>
            The sum becomes the filter response at this location.
          </p>
        </div>

        <div className="outputPixelValue">
          <span>
            g({pixel.x}, {pixel.y})
          </span>
          <b>{total.toFixed(2)}</b>
        </div>
      </div>

      <div className="sumOutputExplanation">
        <span className="experimentLabel">KEY IDEA</span>
        <p>
          One patch + one kernel → many products → one sum → one output pixel.
          To create the whole output image, we move the kernel to the next
          pixel and repeat the same calculation.
        </p>
      </div>
    </section>
  );
}


function FormulaAndNumericalCalculation({
  image,
  kernel,
  pixel,
}: {
  image: GrayImage;
  kernel: number[][];
  pixel: { x: number; y: number };
}) {
  const calculation = patchCalculation(image, kernel, pixel.x, pixel.y);
  const kh = kernel.length;
  const kw = kernel[0].length;

  return (
    <section className="formulaCalculation panel">
      <div className="sectionEyebrow">
        SLICE 2.6 · FORMULA + NUMERICAL CALCULATION
      </div>

      <div className="formulaHeader">
        <div>
          <h2>Turn the picture into a formula</h2>
          <p>
            Everything we have done visually can now be written as one
            mathematical rule for one output pixel.
          </p>
        </div>

        <div className="formulaPixel">
          <span>Selected pixel</span>
          <b>({pixel.x}, {pixel.y})</b>
        </div>
      </div>

      <div className="formulaMainCard">
        <span className="experimentLabel">GENERAL RULE</span>
        <div className="bigFormula">
          g(x,y) = Σᵢ Σⱼ f(x+i, y+j) · h(j,i)
        </div>
        <p className="formulaNote">
          For this lab, the kernel is used in the same orientation in which
          it is displayed. This is the common image-processing
          <b> cross-correlation convention</b>; a mathematical convolution
          would flip the kernel by 180° first.
        </p>
      </div>

      <div className="formulaSteps">
        <article className="formulaStep">
          <span>1</span>
          <h3>Take the local patch</h3>
          <p>
            The selected output location determines a {kh} × {kw} image
            neighbourhood.
          </p>
        </article>

        <article className="formulaStep">
          <span>2</span>
          <h3>Multiply matching values</h3>
          <p>
            Each image value is multiplied by the kernel weight at the same
            position.
          </p>
        </article>

        <article className="formulaStep">
          <span>3</span>
          <h3>Add the products</h3>
          <p>
            The {kh * kw} products are added together. The result is one
            output value.
          </p>
        </article>
      </div>

      <div className="numericalCalculationCard">
        <span className="experimentLabel">NUMERICAL EXAMPLE</span>

        <div className="calculationEquation">
          {calculation.terms.map((term, index) => (
            <span key={index}>
              {term}
              {index < calculation.terms.length - 1 ? "  +  " : ""}
            </span>
          ))}
        </div>

        <div className="numericalResult">
          <span>g({pixel.x},{pixel.y})</span>
          <b>{calculation.total.toFixed(2)}</b>
        </div>
      </div>

      <div className="formulaMentalModel">
        <span className="experimentLabel">MENTAL MODEL</span>
        <p>
          <b>Patch × Kernel → products → sum → one output pixel.</b>
          Move the window and repeat this calculation to build the complete
          filtered image.
        </p>
      </div>
    </section>
  );
}

function KernelStatisticsLab({
  kernel,
  filterName,
}: {
  kernel: number[][];
  filterName: string;
}) {
  const flat = kernel.flat();
  const sum = flat.reduce((a, b) => a + b, 0);
  const sumSq = flat.reduce((a, b) => a + b * b, 0);
  const noiseGain = Math.sqrt(sumSq);
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const mean = sum / flat.length;

  return (
    <section className="kernelStatisticsLab panel">
      <div className="sectionEyebrow">SLICE 2.7 · KERNEL STATISTICS</div>

      <div className="statisticsHeader">
        <div>
          <h2>Read the kernel as a mathematical object</h2>
          <p>
            A kernel is not just a picture. Its weights tell us about
            brightness preservation, cancellation, and sensitivity to noise.
          </p>
        </div>

        <div className="statisticsFilter">{filterName}</div>
      </div>

      <div className="statisticsGrid">
        <article className="statExplanation">
          <span>Σ h</span>
          <b>{sum.toFixed(4)}</b>
          <p>
            The sum of the weights. A sum near 1 commonly preserves the
            constant/DC component; a sum near 0 commonly cancels constant
            intensity.
          </p>
        </article>

        <article className="statExplanation">
          <span>Σ h²</span>
          <b>{sumSq.toFixed(4)}</b>
          <p>
            The sum of squared weights. It is directly related to how white
            noise variance is scaled by a linear filter.
          </p>
        </article>

        <article className="statExplanation">
          <span>√Σ h²</span>
          <b>{noiseGain.toFixed(4)}</b>
          <p>
            A useful noise-gain measure for comparing how strongly a kernel
            responds to independent equal-variance noise.
          </p>
        </article>

        <article className="statExplanation">
          <span>Range</span>
          <b>{min.toFixed(3)} → {max.toFixed(3)}</b>
          <p>
            The smallest and largest weights show the strength and sign of
            the kernel's individual contributions.
          </p>
        </article>
      </div>

      <div className="statisticsEquation">
        <span className="experimentLabel">WHY THIS MATTERS</span>
        <p>
          If a constant image has value C, then the filter response is
          <b> C × Σh</b>. This gives us a simple way to predict what a
          kernel will do to a perfectly flat region.
        </p>
        <div className="constantResponseFormula">
          flat image C → output = C × Σh
        </div>
        <div className="statisticsMean">
          Mean kernel weight = {mean.toFixed(4)}
        </div>
      </div>
    </section>
  );
}

function RawVsDisplayResponse({
  rawOutput,
  pixel,
}: {
  rawOutput: GrayImage;
  pixel: { x: number; y: number };
}) {
  const displayOutput = normalizeForDisplay(rawOutput);
  const rawStats = statsImage(rawOutput);
  const displayStats = statsImage(displayOutput);

  const rawValue = rawOutput.data[pixel.y * rawOutput.width + pixel.x];
  const displayValue =
    displayOutput.data[pixel.y * displayOutput.width + pixel.x];

  return (
    <section className="rawVsDisplayResponse panel">
      <div className="sectionEyebrow">
        SLICE 2.8 · RAW vs DISPLAY-NORMALIZED RESPONSE
      </div>

      <div className="rawDisplayHeader">
        <div>
          <h2>Separate the mathematics from the picture</h2>
          <p>
            The filter first produces a raw numerical response. The canvas
            then rescales that response to 0–255 so we can see it clearly.
          </p>
        </div>

        <div className="rawDisplayPixel">
          Pixel ({pixel.x}, {pixel.y})
        </div>
      </div>

      <div className="rawDisplayFlow">
        <div className="responseCard">
          <span className="experimentLabel">RAW RESPONSE</span>
          <b>{rawValue.toFixed(4)}</b>
          <p>Actual value produced by the kernel calculation.</p>
          <small>
            range: {rawStats.min.toFixed(2)} → {rawStats.max.toFixed(2)}
          </small>
        </div>

        <div className="responseArrow">→</div>

        <div className="responseCard">
          <span className="experimentLabel">DISPLAY VALUE</span>
          <b>{displayValue.toFixed(2)}</b>
          <p>Rescaled to the visible 0–255 range for the canvas.</p>
          <small>
            range: {displayStats.min.toFixed(2)} →{" "}
            {displayStats.max.toFixed(2)}
          </small>
        </div>
      </div>

      <div className="normalizationFormula">
        <span className="experimentLabel">DISPLAY NORMALIZATION</span>
        <div>
          display = (raw − raw<sub>min</sub>) × 255 /
          (raw<sub>max</sub> − raw<sub>min</sub>)
        </div>
        <p>
          This changes how the response is displayed; it does not change the
          underlying raw filter calculation.
        </p>
      </div>

      <div className="rawDisplayWarning">
        <b>IMPORTANT:</b> A raw derivative response can be negative, zero,
        or positive. Display normalization maps the range into visible
        grayscale values, so the displayed brightness is not automatically
        the original numerical response.
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



function MathematicalFilterComparison() {
  const rows = filters.map((filter) => {
    const s = kernelStats(filter.values);
    const lowerFamily = filter.family.toLowerCase();
    const lowerName = filter.name.toLowerCase();

    const order =
      lowerFamily.includes("second") ||
      lowerFamily.includes("laplacian") ||
      lowerName.includes("log")
        ? "2nd"
        : lowerFamily.includes("derivative") ||
          lowerFamily.includes("gradient") ||
          lowerName.includes("sobel") ||
          lowerName.includes("prewitt")
          ? "1st"
          : "0th";

    const dc =
      Math.abs(s.sum) < 1e-9
        ? "≈ 0 · cancels constant"
        : Math.abs(s.sum - 1) < 1e-9
          ? "≈ 1 · preserves constant"
          : s.sum.toFixed(3);

    return {
      name: filter.name,
      family: filter.family,
      size: `${filter.values.length}×${filter.values[0].length}`,
      sum: s.sum,
      sumSq: s.sumSq,
      noiseGain: s.noiseGain,
      order,
      dc,
    };
  });

  const familySummary = [
    { family: "Identity", idea: "Copy / no filtering", clue: "Σh = 1" },
    { family: "Smoothing", idea: "Average nearby pixels", clue: "Usually Σh = 1" },
    { family: "Gradient", idea: "Find directional intensity change", clue: "Usually Σh ≈ 0" },
    { family: "Second derivative", idea: "Find rapid changes / curvature", clue: "Σh ≈ 0" },
    { family: "Sharpening", idea: "Emphasize local contrast", clue: "Often Σh = 1" },
    { family: "LoG-like", idea: "Smooth + second derivative", clue: "Σh ≈ 0" },
  ];

  return (
    <section className="mathematicalFilterComparison panel">
      <div className="sectionEyebrow">SLICE 2.9 · MATHEMATICAL FILTER COMPARISON</div>

      <div className="comparisonMathHeader">
        <div>
          <h2>Compare filters by their mathematics</h2>
          <p>
            Instead of memorising filter names, inspect what the kernel numbers
            tell us: constant response, derivative order, and sensitivity to
            white noise.
          </p>
        </div>
        <div className="comparisonMathBadge">
          <span>FILTERS</span>
          <b>{rows.length}</b>
        </div>
      </div>

      <div className="filterFamilyCards">
        {familySummary.map((item) => (
          <article className="filterFamilyCard" key={item.family}>
            <span className="experimentLabel">{item.family}</span>
            <h3>{item.idea}</h3>
            <p>{item.clue}</p>
          </article>
        ))}
      </div>

      <div className="comparisonMathTableWrap">
        <table className="comparisonMathTable">
          <thead>
            <tr>
              <th>Filter</th>
              <th>Family</th>
              <th>Order</th>
              <th>Σh</th>
              <th>Σh²</th>
              <th>√Σh²</th>
              <th>Constant/DC clue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td><b>{row.name}</b></td>
                <td>{row.family}</td>
                <td>{row.order}</td>
                <td>{row.sum.toFixed(3)}</td>
                <td>{row.sumSq.toFixed(4)}</td>
                <td>{row.noiseGain.toFixed(4)}</td>
                <td>{row.dc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparisonMathExplanation">
        <span className="experimentLabel">HOW TO READ THIS TABLE</span>
        <div className="comparisonRuleGrid">
          <div>
            <b>Σh ≈ 1</b>
            <p>A constant image is largely preserved because C × Σh = C.</p>
          </div>
          <div>
            <b>Σh ≈ 0</b>
            <p>A constant image cancels to approximately zero, useful for change and edge detection.</p>
          </div>
          <div>
            <b>√Σh²</b>
            <p>Gives a simple white-noise gain measure. Larger values mean stronger amplification of independent pixel noise.</p>
          </div>
          <div>
            <b>Derivative order</b>
            <p>First derivatives measure slope/change; second derivatives measure curvature or rapid change of slope.</p>
          </div>
        </div>
      </div>

      <div className="comparisonMathTakeaway">
        <b>KEY IDEA</b>
        <span>
          A filter's numbers are not arbitrary. Their sum, squared energy,
          signs, symmetry, and arrangement explain much of what the filter
          does to an image.
        </span>
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

function SprintTwoVerification() {
  const checks = [
    {
      title: "Patch + kernel dimensions",
      detail: "The selected image neighbourhood matches the selected kernel size.",
      status: "PASS",
    },
    {
      title: "Element-wise multiplication",
      detail: "Every patch value is paired with the kernel weight at the same position.",
      status: "PASS",
    },
    {
      title: "Sum of products",
      detail: "All products are added to create one numerical output pixel.",
      status: "PASS",
    },
    {
      title: "Constant-image reasoning",
      detail: "For a constant image C, the response follows C × Σh.",
      status: "PASS",
    },
    {
      title: "Raw response preserved",
      detail: "Negative, zero, and positive filter responses remain numerical values before display normalization.",
      status: "PASS",
    },
    {
      title: "Display normalization separated",
      detail: "Visualization maps the raw range to 0–255 without changing the filter calculation.",
      status: "PASS",
    },
  ];

  return (
    <section className="sprintTwoVerification panel">
      <div className="sectionEyebrow">SLICE 2.10 · VERIFICATION + SPRINT CLOSURE</div>

      <div className="verificationHeader">
        <div>
          <h2>Verify the complete mathematical pipeline</h2>
          <p>
            Sprint 2 is complete when the learner can follow one output pixel
            from image numbers all the way to the displayed response.
          </p>
        </div>
        <div className="verificationBadge">
          <span>MATHEMATICAL CHAIN</span>
          <b>6 / 6</b>
        </div>
      </div>

      <div className="verificationFlow">
        <span>IMAGE PATCH</span><b>→</b>
        <span>KERNEL</span><b>→</b>
        <span>MULTIPLY</span><b>→</b>
        <span>SUM</span><b>→</b>
        <span>RAW RESPONSE</span><b>→</b>
        <span>DISPLAY</span>
      </div>

      <div className="verificationChecklist">
        {checks.map((check) => (
          <article className="verificationCheck" key={check.title}>
            <div className="verificationCheckTop">
              <b>{check.title}</b>
              <span>{check.status}</span>
            </div>
            <p>{check.detail}</p>
          </article>
        ))}
      </div>

      <div className="sprintClosureCard">
        <span className="experimentLabel">SPRINT 2 TAKEAWAY</span>
        <h3>One local calculation creates one output number.</h3>
        <p>
          The same operation is repeated as the kernel moves across the image.
          That repeated local operation is the mathematical foundation for the
          next sprint: interactive convolution.
        </p>
      </div>
    </section>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

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

  if (path === "/learn/sprint-3") {
    return (
      <AppShell>
        <Sprint3Page />
      </AppShell>
    );
  }
  if (path === "/learn/sprint-8") {
    return (
      <AppShell>
        <Sprint8Page />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-8/group-b") {
    return (
      <AppShell>
        <Sprint8GroupBPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-8/group-c") {
    return (
      <AppShell>
        <Sprint8GroupCPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-8/group-d") {
    return (
      <AppShell>
        <Sprint8GroupDPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-9/group-b") {
    return (
      <AppShell>
        <Sprint9GroupBPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-9/group-c") {
    return (
      <AppShell>
        <Sprint9GroupCPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-9/group-d") {
    return (
      <AppShell>
        <Sprint9GroupDPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-9/group-a") {
    return (
      <AppShell>
        <Sprint9GroupAPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-10/group-c") {
    return (
      <AppShell>
        <Sprint10GroupCPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-10/group-b") {
    return (
      <AppShell>
        <Sprint10GroupBPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-10/group-a") {
    return (
      <AppShell>
        <Sprint10GroupAPage />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-10") {
    return (
      <AppShell>
        <Sprint10Page />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-9") {
    return (
      <AppShell>
        <Sprint9Page />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-7") {
    return (
      <AppShell>
        <Sprint7Page />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-6") {
    return (
      <AppShell>
        <Sprint6Page />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-5") {
    return (
      <AppShell>
        <Sprint5Page />
      </AppShell>
    );
  }

  if (path === "/learn/sprint-4") {
    return (
      <AppShell>
        <Sprint4Page />
      </AppShell>
    );
  }

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
    <AppShell>
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

      <SumOfProductsOutput
        image={source}
        kernel={activeKernel}
        pixel={pixel}
      />

      <FormulaAndNumericalCalculation
        image={source}
        kernel={activeKernel}
        pixel={pixel}
      />

      <KernelStatisticsLab
        kernel={activeKernel}
        filterName={custom ? "Custom kernel" : selected.name}
      />

      <RawVsDisplayResponse
        rawOutput={output}
        pixel={pixel}
      />

      {!custom && (
        <>
          <MathematicalFilterComparison />

          <ComparisonLab
            source={source}
            initialNames={["Box 3×3", "Gaussian σ≈1", "Sobel X"]}
          />
        </>
      )}

      <div id="sprint-2-verification">
        <SprintTwoVerification />
      </div>

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
    </AppShell>
  );
}

export default App;
