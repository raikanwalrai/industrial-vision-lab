import { useEffect, useMemo, useRef, useState } from "react";
import { addGaussianNoise, addSaltPepperNoise, makeScene, type GrayImage } from "../imageScenes";
import { convolve, imageErrorMetrics, medianFilter, meanFilter } from "../math";
import { filters } from "../filters";

type NoiseKind = "gaussian" | "salt-pepper";

const GROUPS = [
  ["A", "Noise Generation", "Create controlled Gaussian and salt-and-pepper degradation."],
  ["B", "Noise Measurement", "Measure error with MSE, RMSE, and a visual error map."],
  ["C", "Restoration Filters", "Compare mean, Gaussian, and median restoration."],
  ["D", "Controlled Comparison", "Apply different restoration rules to the same noisy image."],
  ["E", "Illumination", "Understand uneven lighting and background correction."],
  ["F", "Final Verification", "Verify the mathematics and complete the degradation pipeline."],
] as const;

function drawGray(
  canvas: HTMLCanvasElement,
  image: GrayImage,
  mode: "gray" | "error" = "gray",
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const pixels = ctx.createImageData(image.width, image.height);

  for (let i = 0; i < image.data.length; i++) {
    let value = image.data[i];

    if (mode === "error") {
      value = 128 + value * 2.5;
    }

    value = Math.max(0, Math.min(255, value));

    const p = i * 4;
    pixels.data[p] = value;
    pixels.data[p + 1] = value;
    pixels.data[p + 2] = value;
    pixels.data[p + 3] = 255;
  }

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.putImageData(pixels, 0, 0);
}

export default function Sprint5Page() {
  const [active, setActive] = useState("A");
  const [noiseKind, setNoiseKind] = useState<NoiseKind>("gaussian");
  const [strength, setStrength] = useState(18);
  const [seed, setSeed] = useState(42);

  const clean = useMemo(() => makeScene("shapes"), []);

  const noisy = useMemo(() => {
    if (noiseKind === "gaussian") return addGaussianNoise(clean, strength, seed);
    return addSaltPepperNoise(clean, strength / 100, 0.5, seed);
  }, [clean, noiseKind, strength, seed]);

  const noisyMetrics = useMemo(() => imageErrorMetrics(clean, noisy), [clean, noisy]);
  const metrics = noisyMetrics;

  const meanRestored = useMemo(() => meanFilter(noisy, 3), [noisy]);
  const gaussianKernel = useMemo(
    () => filters.find((item) => item.name === "Gaussian σ≈1")!.values,
    [],
  );
  const gaussianRestored = useMemo(
    () => convolve(noisy, gaussianKernel),
    [noisy, gaussianKernel],
  );
  const medianRestored = useMemo(() => medianFilter(noisy, 3), [noisy]);

  const restorationResults = useMemo(
    () => [
      { name: "Mean 3×3", metrics: imageErrorMetrics(clean, meanRestored) },
      { name: "Gaussian σ≈1", metrics: imageErrorMetrics(clean, gaussianRestored) },
      { name: "Median 3×3", metrics: imageErrorMetrics(clean, medianRestored) },
    ],
    [clean, meanRestored, gaussianRestored, medianRestored],
  );

  const cleanRef = useRef<HTMLCanvasElement>(null);
  const noisyRef = useRef<HTMLCanvasElement>(null);
  const errorRef = useRef<HTMLCanvasElement>(null);
  const meanRef = useRef<HTMLCanvasElement>(null);
  const gaussianRef = useRef<HTMLCanvasElement>(null);
  const medianRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (cleanRef.current) drawGray(cleanRef.current, clean);
    if (noisyRef.current) drawGray(noisyRef.current, noisy);
    if (errorRef.current) {
      drawGray(errorRef.current, metrics.errorImage, "error");
    }
    if (meanRef.current) drawGray(meanRef.current, meanRestored);
    if (gaussianRef.current) drawGray(gaussianRef.current, gaussianRestored);
    if (medianRef.current) drawGray(medianRef.current, medianRestored);
  }, [clean, noisy, metrics.errorImage, meanRestored, gaussianRestored, medianRestored]);

  const current = GROUPS.find((g) => g[0] === active)!;
  const live = active === "A" || active === "B" || active === "C" || active === "D";

  return (
    <div className="s5-page">
      <header className="s5-hero">
        <div>
          <div className="s5-eyebrow">SPRINT 5</div>
          <h1>Noise + Restoration + Illumination</h1>
          <p>
            Start with a clean image, introduce controlled degradation, measure
            what changed, restore the image, and understand uneven illumination
            in industrial vision.
          </p>
        </div>
        <div className="s5-heroBadge">
          <span>LEARNING PATH</span>
          <strong>DEGRADE → MEASURE → RESTORE</strong>
        </div>
      </header>

      <section className="s5-introGrid">
        <div className="s5-introCard">
          <div className="s5-label">WHAT YOU WILL LEARN</div>
          <h2>Real images are rarely perfect.</h2>
          <p>
            Camera images can contain random noise, impulse defects, shadows,
            and uneven lighting. Sprint 5 turns those imperfections into
            controlled experiments.
          </p>
          <p>
            The goal is to understand <strong>what changed, why it changed,
            and how restoration can recover useful information.</strong>
          </p>
        </div>
        <div className="s5-introCard s5-modelCard">
          <div className="s5-label">CORE MODEL</div>
          <div className="s5-equation">I<sub>noisy</sub> = I + N</div>
          <div className="s5-equation">Ĩ = restore(I<sub>noisy</sub>)</div>
          <div className="s5-equation">MSE = (1/N) Σ(Ĩ − I)<sup>2</sup></div>
          <div className="s5-equation">RMSE = √MSE</div>
        </div>
      </section>

      <section className="s5-pipeline">
        <div className="s5-label">SPRINT 5 PIPELINE</div>
        <div className="s5-pipelineRow">
          {[
            ["01", "CLEAN", "Known image data."],
            ["02", "ADD NOISE", "Controlled degradation."],
            ["03", "MEASURE", "Quantify the error."],
            ["04", "RESTORE", "Apply a suitable filter."],
            ["05", "CORRECT", "Handle lighting variation."],
          ].map(([n, title, text], i) => (
            <div className="s5-pipelineItem" key={n}>
              <div className="s5-step">
                <span>{n}</span><strong>{title}</strong><small>{text}</small>
              </div>
              {i < 4 && <b>→</b>}
            </div>
          ))}
        </div>
      </section>

      <section className="s5-groups">
        <div className="s5-groupsHeader">
          <div>
            <div className="s5-label">LEARNING MODULES</div>
            <h2>Six controlled experiments</h2>
          </div>
          <div className="s5-current">
            GROUP {active} · {live ? "ACTIVE" : "PLANNED"}
          </div>
        </div>

        <div className="s5-groupGrid">
          {GROUPS.map(([letter, title, description]) => (
            <button
              key={letter}
              className={`s5-groupCard ${active === letter ? "active" : ""}`}
              onClick={() => setActive(letter)}
            >
              <span>{letter}</span>
              <strong>{title}</strong>
              <small>{description}</small>
            </button>
          ))}
        </div>

        <div className="s5-focus">
          <div className="s5-focusNumber">{current[0]}</div>
          <div>
            <div className="s5-label">{live ? "CURRENT EXPERIMENT" : "NEXT EXPERIMENT"}</div>
            <h3>{current[1]}</h3>
            <p>{current[2]}</p>
          </div>
        </div>
      </section>

      {(active === "A" || active === "B") && (
        <section className="s5-noiseLab">
          <div className="s5-labHeader">
            <div>
              <div className="s5-label">GROUPS A + B · LIVE LAB</div>
              <h2>Make noise, then measure exactly what changed</h2>
              <p>
                The clean image is fixed. Changing the seed or noise settings
                creates a controlled experiment, and the same noisy image is
                used for every measurement.
              </p>
            </div>
            <div className="s5-liveBadge">● REPRODUCIBLE</div>
          </div>

          <div className="s5-controls">
            <label>
              <span>NOISE TYPE</span>
              <select value={noiseKind} onChange={(e) => setNoiseKind(e.target.value as NoiseKind)}>
                <option value="gaussian">Gaussian</option>
                <option value="salt-pepper">Salt-and-pepper</option>
              </select>
            </label>

            <label>
              <span>{noiseKind === "gaussian" ? "SIGMA" : "NOISY PIXEL %"} · {strength}</span>
              <input
                type="range"
                min={0}
                max={noiseKind === "gaussian" ? 60 : 30}
                step={1}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
              />
            </label>

            <label>
              <span>SEED · {seed}</span>
              <input
                type="number"
                min={0}
                max={999999}
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value) || 0)}
              />
            </label>
          </div>

          <div className="s5-imageGrid">
            <article className="s5-imageCard">
              <div className="s5-imageTitle"><span>01</span><strong>CLEAN IMAGE</strong></div>
              <canvas ref={cleanRef} />
              <small>Ground truth: I(x,y)</small>
            </article>

            <article className="s5-imageCard">
              <div className="s5-imageTitle"><span>02</span><strong>NOISY IMAGE</strong></div>
              <canvas ref={noisyRef} />
              <small>{noiseKind === "gaussian" ? `Gaussian σ = ${strength}` : `${strength}% salt-and-pepper corruption`}</small>
            </article>

            <article className="s5-imageCard">
              <div className="s5-imageTitle"><span>03</span><strong>ERROR MAP</strong></div>
              <canvas ref={errorRef} />
              <small>Gray = 0 error · bright = positive · dark = negative</small>
            </article>
          </div>

          <div className="s5-metricsGrid">
            <article className="s5-metric"><span>MEAN ERROR</span><strong>{metrics.meanError.toFixed(3)}</strong><small>E[e]</small></article>
            <article className="s5-metric"><span>ERROR VARIANCE</span><strong>{metrics.variance.toFixed(3)}</strong><small>Var(e)</small></article>
            <article className="s5-metric"><span>MSE</span><strong>{metrics.mse.toFixed(3)}</strong><small>(1/N)Σe²</small></article>
            <article className="s5-metric"><span>RMSE</span><strong>{metrics.rmse.toFixed(3)}</strong><small>√MSE</small></article>
          </div>

          <div className="s5-explainGrid">
            <div className="s5-explainCard">
              <div className="s5-label">STEP 1 · GENERATE</div>
              <h3>I<sub>noisy</sub> = I + N</h3>
              <p>Gaussian noise adds a random value to each pixel. Salt-and-pepper noise replaces a controlled fraction with 0 or 255.</p>
            </div>
            <div className="s5-explainCard">
              <div className="s5-label">STEP 2 · SUBTRACT</div>
              <h3>e = I<sub>noisy</sub> − I</h3>
              <p>The error image tells us how much each pixel moved away from the clean reference. A perfect copy has e = 0 everywhere.</p>
            </div>
            <div className="s5-explainCard">
              <div className="s5-label">STEP 3 · SUM THE DAMAGE</div>
              <h3>MSE = (1/N)Σe²</h3>
              <p>Squaring removes the sign and makes large mistakes count more. RMSE returns to the original pixel-intensity scale.</p>
            </div>
          </div>
        </section>
      )}



      {active === "C" && (
        <section className="s5-restorationLab">
          <div className="s5-labHeader">
            <div>
              <div className="s5-label">GROUP C · RESTORATION LAB</div>
              <h2>Restore the same noisy image three different ways</h2>
              <p>
                Nothing about the degradation changes. Mean, Gaussian, and
                median filters receive exactly the same noisy image and are
                evaluated against exactly the same clean reference.
              </p>
            </div>
            <div className="s5-liveBadge">● SAME INPUT</div>
          </div>

          <div className="s5-controls">
            <label>
              <span>NOISE TYPE</span>
              <select value={noiseKind} onChange={(e) => setNoiseKind(e.target.value as NoiseKind)}>
                <option value="gaussian">Gaussian</option>
                <option value="salt-pepper">Salt-and-pepper</option>
              </select>
            </label>
            <label>
              <span>{noiseKind === "gaussian" ? "SIGMA" : "NOISY PIXEL %"} · {strength}</span>
              <input
                type="range"
                min={0}
                max={noiseKind === "gaussian" ? 60 : 30}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
              />
            </label>
            <label>
              <span>SEED · {seed}</span>
              <input
                type="number"
                min={0}
                max={999999}
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value) || 0)}
              />
            </label>
          </div>

          <div className="s5-restorationGrid">
            <article className="s5-imageCard">
              <div className="s5-imageTitle"><span>01</span><strong>CLEAN</strong></div>
              <canvas ref={cleanRef} />
              <small>Reference image I</small>
            </article>
            <article className="s5-imageCard">
              <div className="s5-imageTitle"><span>02</span><strong>NOISY</strong></div>
              <canvas ref={noisyRef} />
              <small>Same input for all restorations</small>
            </article>
            <article className="s5-imageCard">
              <div className="s5-imageTitle"><span>03</span><strong>MEAN 3×3</strong></div>
              <canvas ref={meanRef} />
              <small>Equal-weight local average</small>
            </article>
            <article className="s5-imageCard">
              <div className="s5-imageTitle"><span>04</span><strong>GAUSSIAN</strong></div>
              <canvas ref={gaussianRef} />
              <small>Centre-weighted local average</small>
            </article>
            <article className="s5-imageCard">
              <div className="s5-imageTitle"><span>05</span><strong>MEDIAN 3×3</strong></div>
              <canvas ref={medianRef} />
              <small>Middle value after sorting</small>
            </article>
          </div>

          <div className="s5-restorationTable">
            <div className="s5-tableHead">
              <span>METHOD</span><span>MSE</span><span>RMSE</span><span>IDEA</span>
            </div>
            <div className="s5-tableRow">
              <strong>Noisy input</strong>
              <span>{noisyMetrics.mse.toFixed(3)}</span>
              <span>{noisyMetrics.rmse.toFixed(3)}</span>
              <span>Before restoration</span>
            </div>
            {restorationResults.map((result) => (
              <div className="s5-tableRow" key={result.name}>
                <strong>{result.name}</strong>
                <span>{result.metrics.mse.toFixed(3)}</span>
                <span>{result.metrics.rmse.toFixed(3)}</span>
                <span>
                  {result.name.startsWith("Mean")
                    ? "Equal weights"
                    : result.name.startsWith("Gaussian")
                      ? "Centre weighted"
                      : "Rank-based"}
                </span>
              </div>
            ))}
          </div>

          <div className="s5-manualGrid">
            <div className="s5-explainCard">
              <div className="s5-label">MEAN FILTER</div>
              <h3>Average the neighbourhood</h3>
              <p>For a 3×3 window, add the nine pixel values and divide by 9. Every pixel receives the same weight.</p>
              <div className="s5-equation">Ĩ = (1/9) Σ I<sub>window</sub></div>
            </div>
            <div className="s5-explainCard">
              <div className="s5-label">GAUSSIAN FILTER</div>
              <h3>Give nearby pixels different weights</h3>
              <p>The centre gets more influence than farther neighbours. The existing normalized Gaussian kernel is reused here.</p>
              <div className="s5-equation">Ĩ = Σ G(i,j) I(x+i,y+j)</div>
            </div>
            <div className="s5-explainCard">
              <div className="s5-label">MEDIAN FILTER</div>
              <h3>Sort, then take the middle</h3>
              <p>For salt-and-pepper noise, extreme values such as 255 can be pushed out by ranking instead of averaging.</p>
              <div className="s5-equation">[10,11,12,10,255,12,11,12,13] → 12</div>
            </div>
          </div>

          <div className="s5-restorationNote">
            <strong>Read the numbers and the pictures together.</strong> MSE/RMSE
            measures closeness to the clean reference; the images reveal what
            structure each restoration method preserves or smooths.
          </div>
        </section>
      )}


      {active === "D" && (
        <section className="s5-comparisonLab">
          <div className="s5-labHeader">
            <div>
              <div className="s5-label">GROUP D · CONTROLLED COMPARISON</div>
              <h2>Change the degradation, not the experiment</h2>
              <p>
                Keep the clean reference and restoration methods fixed. Change
                only the noise model and strength, then compare how the same
                three restoration rules respond.
              </p>
            </div>
            <div className="s5-liveBadge">● CONTROLLED</div>
          </div>

          <div className="s5-comparisonRules">
            <article>
              <span>01</span>
              <strong>FIXED REFERENCE</strong>
              <small>The same clean image is used for every trial.</small>
            </article>
            <article>
              <span>02</span>
              <strong>FIXED METHODS</strong>
              <small>Mean, Gaussian, and median stay unchanged.</small>
            </article>
            <article>
              <span>03</span>
              <strong>CHANGE ONE FACTOR</strong>
              <small>Noise type or strength is the experimental variable.</small>
            </article>
          </div>

          <div className="s5-comparisonControls">
            <button
              className={noiseKind === "gaussian" ? "active" : ""}
              onClick={() => setNoiseKind("gaussian")}
            >
              Gaussian noise
            </button>
            <button
              className={noiseKind === "salt-pepper" ? "active" : ""}
              onClick={() => setNoiseKind("salt-pepper")}
            >
              Salt-and-pepper noise
            </button>
          </div>

          <div className="s5-comparisonReadout">
            <div>
              <span>NOISE MODEL</span>
              <strong>
                {noiseKind === "gaussian"
                  ? `Gaussian · σ = ${strength}`
                  : `Salt-and-pepper · ${strength}%`}
              </strong>
            </div>
            <div>
              <span>SEED</span>
              <strong>{seed}</strong>
            </div>
            <div>
              <span>INPUT MSE</span>
              <strong>{metrics.mse.toFixed(3)}</strong>
            </div>
            <div>
              <span>INPUT RMSE</span>
              <strong>{metrics.rmse.toFixed(3)}</strong>
            </div>
          </div>

          <div className="s5-comparisonTable">
            <div className="s5-comparisonHead">
              <span>METHOD</span><span>MSE</span><span>RMSE</span>
              <span>CHANGE FROM NOISY</span><span>ROLE</span>
            </div>

            <div className="s5-comparisonRow">
              <strong>Noisy input</strong>
              <span>{metrics.mse.toFixed(3)}</span>
              <span>{metrics.rmse.toFixed(3)}</span>
              <span>Baseline</span>
              <span>Degraded image</span>
            </div>

            {restorationResults.map((result) => {
              const mseReduction =
                metrics.mse === 0
                  ? 0
                  : ((metrics.mse - result.metrics.mse) / metrics.mse) * 100;

              return (
                <div className="s5-comparisonRow" key={result.name}>
                  <strong>{result.name}</strong>
                  <span>{result.metrics.mse.toFixed(3)}</span>
                  <span>{result.metrics.rmse.toFixed(3)}</span>
                  <span>{mseReduction.toFixed(1)}%</span>
                  <span>
                    {result.name.startsWith("Mean")
                      ? "Equal-weight smoothing"
                      : result.name.startsWith("Gaussian")
                        ? "Weighted smoothing"
                        : "Rank-based impulse removal"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="s5-comparisonLesson">
            <div>
              <div className="s5-label">HOW TO READ THIS EXPERIMENT</div>
              <h3>One number is not the whole story.</h3>
              <p>
                First record the noisy baseline. Then compare restored MSE and
                RMSE with that same baseline. Lower error means the restored
                image is numerically closer to the clean reference, but inspect
                the image too: smoothing can remove useful edges.
              </p>
            </div>
            <div className="s5-comparisonFormula">
              <span>MSE REDUCTION</span>
              <strong>
                100 × (MSE<sub>noisy</sub> − MSE<sub>restored</sub>)
                / MSE<sub>noisy</sub>
              </strong>
            </div>
          </div>

          <div className="s5-experimentMatrix">
            <div className="s5-label">CONTROLLED EXPERIMENT MATRIX</div>
            <h3>Run the same comparison under two noise models</h3>
            <div className="s5-matrixGrid">
              <article>
                <strong>TRIAL 1</strong>
                <span>Gaussian</span>
                <small>Random additive variation</small>
              </article>
              <article>
                <strong>TRIAL 2</strong>
                <span>Salt-and-pepper</span>
                <small>Impulse replacement with 0 / 255</small>
              </article>
              <article>
                <strong>KEEP FIXED</strong>
                <span>Reference + seed + filters</span>
                <small>Only the degradation condition changes.</small>
              </article>
            </div>
          </div>
        </section>
      )}

      {active === "A" || active === "B" ? (
        <section className="s5-ready">
          <div>
            <div className="s5-label">MODULE STATUS</div>
            <h2>Groups A + B — implemented</h2>
            <p>Select Group C to compare restoration filters using the same controlled noisy image.</p>
          </div>
          <div className="s5-readyBadge"><strong>● READY</strong><span>Group C available</span></div>
        </section>
      ) : null}

      {active !== "A" && active !== "B" && active !== "C" && (
        <section className="s5-ready">
          <div>
            <div className="s5-label">MODULE STATUS</div>
            <h2>{current[1]} — planned</h2>
            <p>Group C is implemented. Later modules will build on this controlled degradation and restoration experiment.</p>
          </div>
          <div className="s5-readyBadge"><strong>● PLANNED</strong><span>Complete Group C first</span></div>
        </section>
      )}

      <section className="s5-concepts">
        <div className="s5-label">MATHEMATICAL ANCHORS</div>
        <h2>Three ideas we will keep returning to</h2>
        <div className="s5-conceptGrid">
          <article><span>01</span><strong>Noise</strong><p>Model how unwanted variation is added to an image.</p></article>
          <article><span>02</span><strong>Error</strong><p>Turn visual degradation into measurable quantities such as MSE and RMSE.</p></article>
          <article><span>03</span><strong>Restoration</strong><p>Reduce degradation while preserving useful image structure.</p></article>
        </div>
      </section>
    </div>
  );
}
