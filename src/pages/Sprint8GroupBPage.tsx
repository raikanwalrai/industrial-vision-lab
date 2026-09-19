import {
  useMemo,
  useState,
} from "react";
import {
  compareLoGDoG,
  detectBlobExtrema,
  detectShiTomasiCorners,
  differenceOfGaussians,
  gaussianBlur,
  gaussianScaleSpace,
  makeBlobScene,
  scaleNormalizedLoG,
  verifyDoG,
  verifyGaussianKernel,
  verifyGaussianSymmetry,
  verifyScaleNormalization,
  verifyScaleOrdering,
  verifyShiTomasi,
  type BlobScene,
} from "../blobMath";
import {
  structureTensorAt,
} from "../cornerMath";
import type { GrayImage } from "../imageScenes";
import { normalizeForDisplay } from "../math";
import { navigateTo } from "../navigation";

function ImageCanvas({
  image,
  label,
  points = [],
  onPixelClick,
}: {
  image: GrayImage;
  label: string;
  points?: Array<{
    x: number;
    y: number;
    sigma?: number;
  }>;
  onPixelClick?: (x: number, y: number) => void;
}) {
  const ref = (node: HTMLCanvasElement | null) => {
    if (!node) return;

    const context =
      node.getContext("2d");

    if (!context) return;

    const display =
      normalizeForDisplay(image).data;

    node.width = image.width;
    node.height = image.height;

    const pixels =
      context.createImageData(
        image.width,
        image.height,
      );

    for (
      let i = 0;
      i < display.length;
      i++
    ) {
      const value = Math.round(
        Math.max(
          0,
          Math.min(
            255,
            display[i],
          ),
        ),
      );

      pixels.data[i * 4] = value;
      pixels.data[i * 4 + 1] = value;
      pixels.data[i * 4 + 2] = value;
      pixels.data[i * 4 + 3] = 255;
    }

    context.putImageData(
      pixels,
      0,
      0,
    );

    for (const point of points) {
      const radius =
        point.sigma
          ? Math.max(
              2,
              point.sigma * 1.8,
            )
          : 2;

      context.beginPath();
      context.arc(
        point.x,
        point.y,
        radius,
        0,
        Math.PI * 2,
      );
      context.strokeStyle =
        "rgba(255, 220, 70, 0.95)";
      context.lineWidth = 0.8;
      context.stroke();
    }
  };

  return (
    <div className="s8b-canvasWrap">
      <div className="s8b-canvasLabel">
        {label}
      </div>

      <canvas
        ref={ref}
        className="s8b-canvas"
        onClick={(event) => {
          if (!onPixelClick) return;

          const rect =
            event.currentTarget.getBoundingClientRect();

          const x = Math.max(
            0,
            Math.min(
              image.width - 1,
              Math.floor(
                ((event.clientX -
                  rect.left) /
                  rect.width) *
                  image.width,
              ),
            ),
          );

          const y = Math.max(
            0,
            Math.min(
              image.height - 1,
              Math.floor(
                ((event.clientY -
                  rect.top) /
                  rect.height) *
                  image.height,
              ),
            ),
          );

          onPixelClick(x, y);
        }}
      />
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="s8b-metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default function Sprint8GroupBPage() {
  const [scene, setScene] =
    useState<BlobScene>("blobs");

  const [sigma, setSigma] =
    useState(2);

  const [pixel, setPixel] =
    useState({
      x: 48,
      y: 48,
    });

  const sigmas = [
    0.8,
    1.2,
    1.8,
    2.7,
    4.0,
  ];

  const image = useMemo(
    () => makeBlobScene(scene),
    [scene],
  );

  const shiTomasi =
    useMemo(
      () =>
        detectShiTomasiCorners(
          image,
          0.18,
          1,
        ),
      [image],
    );

  const scales =
    useMemo(
      () =>
        gaussianScaleSpace(
          image,
          sigmas,
        ),
      [image],
    );

  const selectedBlur =
    useMemo(
      () =>
        gaussianBlur(
          image,
          sigma,
        ),
      [image, sigma],
    );

  const selectedLog =
    useMemo(
      () =>
        scaleNormalizedLoG(
          image,
          sigma,
        ),
      [image, sigma],
    );

  const selectedDoG =
    useMemo(
      () =>
        differenceOfGaussians(
          image,
          sigma,
        ),
      [image, sigma],
    );

  const blobs =
    useMemo(
      () =>
        detectBlobExtrema(
          scales,
          0.22,
        ),
      [scales],
    );

  const comparison =
    useMemo(
      () =>
        compareLoGDoG(
          image,
          sigma,
        ),
      [image, sigma],
    );

  const selectedShi =
    shiTomasi.points
      .slice(0, 12);

  const verification = [
    [
      "Shi-Tomasi = min(λ₁, λ₂)",
      verifyShiTomasi(),
    ],
    [
      "Gaussian kernel sums to 1",
      verifyGaussianKernel(sigma),
    ],
    [
      "Gaussian kernel is symmetric",
      verifyGaussianSymmetry(sigma),
    ],
    [
      "Scale values are ordered",
      verifyScaleOrdering(),
    ],
    [
      "DoG produces a non-zero response",
      verifyDoG(image),
    ],
    [
      "Scale-normalized LoG = σ² LoG",
      verifyScaleNormalization(image),
    ],
  ] as Array<
    [string, boolean]
  >;

  const pixelIndex =
    pixel.y * image.width +
    pixel.x;

  const selectedIntensity =
    image.data[pixelIndex];

  const selectedLogValue =
    selectedLog.data[pixelIndex];

  const selectedTensor =
    structureTensorAt(
      image,
      pixel.x,
      pixel.y,
      1,
    );

  const selectedShiValue =
    detectShiTomasiCorners(
      image,
      0.18,
      1,
    ).image.data[pixelIndex];

  return (
    <main className="s8b-page">
      <section className="s7-groupSwitcher panel">
        <div>
          <div className="sectionEyebrow">
            SPRINT 8 · CORNERS + BLOBS + SIFT
          </div>

          <h2>
            Choose the experiment
          </h2>

          <p>
            Group A builds corner reasoning from the
            structure tensor. Group B moves from
            corners to blobs and scale-space features.
            Groups C and D will complete the SIFT and
            feature-matching path.
          </p>
        </div>

        <div className="s7-groupButtons">
          <button
            onClick={() =>
              navigateTo("/learn/sprint-8")
            }
          >
            A · Harris + Structure Tensor
          </button>

          <button
            className="active"
            onClick={() =>
              navigateTo(
                "/learn/sprint-8/group-b",
              )
            }
          >
            B · Shi-Tomasi + Blobs + LoG/DoG
          </button>

          <button
            onClick={() =>
              navigateTo(
                "/learn/sprint-8/group-c",
              )
            }
          >
            C · SIFT Construction
          </button>

          <button
            onClick={() =>
              navigateTo(
                "/learn/sprint-8/group-d",
              )
            }
          >
            D · Feature Matching
          </button>
        </div>
      </section>
      <section className="s8b-hero panel">
        <div>
          <div className="sectionEyebrow">
            SPRINT 8 · GROUP B
          </div>

          <h1>
            Shi-Tomasi + Blobs + LoG/DoG
          </h1>

          <p>
            Harris asks whether intensity
            changes strongly in two directions.
            Shi-Tomasi uses the smaller
            eigenvalue. Blob detection then
            extends the same local-feature idea
            across scale.
          </p>
        </div>

        <div className="s8b-flow">
          <span>Structure Tensor</span>
          <b>→</b>
          <span>Eigenvalues</span>
          <b>→</b>
          <span>Shi-Tomasi</span>
          <b>→</b>
          <span>Scale Space</span>
          <b>→</b>
          <span>LoG / DoG</span>
          <b>→</b>
          <span>Blobs</span>
        </div>
      </section>

      <section className="s8b-controls panel">
        <div className="sectionEyebrow">
          CONTROLLED SCENES
        </div>

        <div className="s8b-buttons">
          {(
            [
              ["blobs", "BLOBS"],
              ["industrial", "INDUSTRIAL"],
              ["single", "SINGLE"],
              ["flat", "FLAT"],
            ] as Array<
              [BlobScene, string]
            >
          ).map(
            ([value, label]) => (
              <button
                key={value}
                className={
                  scene === value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setScene(value)
                }
              >
                {label}
              </button>
            ),
          )}
        </div>

        <label className="s8b-slider">
          <span>
            Selected σ:{" "}
            <strong>
              {sigma.toFixed(1)}
            </strong>
          </span>

          <input
            type="range"
            min="0.8"
            max="4"
            step="0.1"
            value={sigma}
            onChange={(event) =>
              setSigma(
                Number(
                  event.target.value,
                ),
              )
            }
          />
        </label>
      </section>

      <section className="s8b-twoCol">
        <div className="panel s8b-panel">
          <div className="sectionEyebrow">
            1 · SHI-TOMASI
          </div>

          <h2>
            Corner strength =
            min(λ₁, λ₂)
          </h2>

          <div className="s8b-equation">
            R<sub>ST</sub> =
            min(λ₁, λ₂)
          </div>

          <div className="s8b-canvasGrid">
            <ImageCanvas
              image={image}
              label="INPUT"
              points={selectedShi}
              onPixelClick={(
                x,
                y,
              ) =>
                setPixel({
                  x,
                  y,
                })
              }
            />

            <ImageCanvas
              image={shiTomasi.image}
              label="SHI-TOMASI RESPONSE"
            />
          </div>

          <div className="s8b-metrics">
            <Metric
              label="Ix / Iy"
              value="computed from Group A"
            />
            <Metric
              label="Max Shi-Tomasi"
              value={shiTomasi.maxResponse.toFixed(
                2,
              )}
            />
            <Metric
              label="Detected points"
              value={String(
                shiTomasi.points.length,
              )}
            />
          </div>
        </div>

        <div className="panel s8b-panel">
          <div className="sectionEyebrow">
            PIXEL INSPECTOR
          </div>

          <h2>
            Pixel ({pixel.x}, {pixel.y})
          </h2>

          <div className="s8b-metrics">
            <Metric
              label="Intensity"
              value={selectedIntensity.toFixed(
                2,
              )}
            />
            <Metric
              label="λ₁"
              value={selectedTensor.lambda1.toFixed(
                4,
              )}
            />
            <Metric
              label="λ₂"
              value={selectedTensor.lambda2.toFixed(
                4,
              )}
            />
            <Metric
              label="min(λ₁, λ₂)"
              value={selectedTensor.shiTomasi.toFixed(
                4,
              )}
            />
            <Metric
              label="Shi-Tomasi"
              value={selectedShiValue.toFixed(
                2,
              )}
            />
            <Metric
              label="σ"
              value={sigma.toFixed(
                2,
              )}
            />
            <Metric
              label="Normalized LoG"
              value={selectedLogValue.toFixed(
                4,
              )}
            />
          </div>

          <p className="s8b-note">
            Click any point in the input image
            to inspect the same pixel through
            the Shi-Tomasi and scale-space
            calculations.
          </p>
        </div>
      </section>

      <section className="panel s8b-panel">
        <div className="sectionEyebrow">
          2 · GAUSSIAN SCALE SPACE
        </div>

        <h2>
          The same image viewed at different
          scales
        </h2>

        <div className="s8b-scaleGrid">
          {scales.map(
            (level) => (
              <ImageCanvas
                key={level.sigma}
                image={level.image}
                label={`σ = ${level.sigma}`}
              />
            ),
          )}
        </div>

        <p className="s8b-note">
          Increasing σ smooths away small
          structures first. Larger structures
          survive at larger scales. This is the
          foundation of scale-space blob
          detection and later SIFT.
        </p>
      </section>

      <section className="s8b-twoCol s8b-logDogGrid">
        <div className="panel s8b-panel">
          <div className="sectionEyebrow">
            3 · LoG
          </div>

          <h2>
            Laplacian of Gaussian
          </h2>

          <div className="s8b-equation">
            LoG =
            ∇²(G<sub>σ</sub> * I)
          </div>

          <ImageCanvas
            image={selectedLog}
            label={`SCALE-NORMALIZED LoG · σ = ${sigma.toFixed(
              1,
            )}`}
          />

          <div className="s8b-metrics">
            <Metric
              label="σ"
              value={sigma.toFixed(
                2,
              )}
            />
            <Metric
              label="LoG max |R|"
              value={comparison.maxAbsLog.toFixed(
                4,
              )}
            />
          </div>

          <p className="s8b-note">
            Scale normalization uses
            <strong> σ² LoG </strong>
            so that blob responses remain comparable across image scales.
          </p>
        </div>

        <div className="panel s8b-panel">
          <div className="sectionEyebrow">
            4 · DoG
          </div>

          <h2>
            Difference of Gaussians
          </h2>

          <div className="s8b-equation">
            DoG =
            L(x,y,kσ) − L(x,y,σ)
          </div>

          <ImageCanvas
            image={selectedDoG}
            label={`DIFFERENCE OF GAUSSIANS · σ = ${sigma.toFixed(
              1,
            )}`}
          />

          <div className="s8b-metrics">
            <Metric
              label="σ"
              value={sigma.toFixed(
                2,
              )}
            />
            <Metric
              label="k"
              value={Math.SQRT2.toFixed(
                3,
              )}
            />
            <Metric
              label="LoG max |R|"
              value={comparison.maxAbsLog.toFixed(
                4,
              )}
            />
            <Metric
              label="DoG max |R|"
              value={comparison.maxAbsDiff.toFixed(
                4,
              )}
            />
            <Metric
              label="DoG / LoG scale"
              value={comparison.scaleFactor.toFixed(
                4,
              )}
            />
          </div>

          <p className="s8b-note">
            DoG approximates the LoG response across nearby Gaussian scales,
            making scale-space extrema much cheaper to compute.
          </p>
        </div>
      </section>

      <section className="panel s8b-panel">
        <div className="sectionEyebrow">
          5 · MULTI-SCALE BLOB DETECTION
        </div>

        <h2>
          A blob is an extremum in x, y
          <em>and</em> scale
        </h2>

        <div className="s8b-equation">
          feature = (x, y, σ)
        </div>

        <ImageCanvas
          image={image}
          label="BLOB DETECTION"
          points={blobs.points}
        />

        <div className="s8b-metrics">
          <Metric
            label="Scale levels"
            value={String(
              scales.length,
            )}
          />
          <Metric
            label="Blob candidates"
            value={String(
              blobs.points.length,
            )}
          />
          <Metric
            label="Max |LoG|"
            value={blobs.maxResponse.toFixed(
              4,
            )}
          />
        </div>

        <p className="s8b-note">
          A candidate must beat its neighbors
          spatially and at adjacent scales.
          The detected σ gives the characteristic
          size of the image structure.
        </p>
      </section>

      <section className="panel s8b-panel">
        <div className="sectionEyebrow">
          MATHEMATICAL VERIFICATION
        </div>

        <div className="s8b-verification">
          {verification.map(
            ([label, pass]) => (
              <div
                key={label}
                className="s8b-verificationItem"
              >
                <span>
                  {pass
                    ? "✓"
                    : "×"}
                </span>

                <b>
                  {label}
                </b>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="panel s8b-panel">
        <div className="sectionEyebrow">
          KEY IDEA
        </div>

        <p className="s8b-takeaway">
          Harris and Shi-Tomasi reason about
          local geometry at one image scale.
          Blob detection asks a deeper question:
          <strong>
            {" "}
            at what scale does this structure
            become strongest?
          </strong>
          That x-y-scale reasoning is the
          foundation for SIFT.
        </p>
      </section>
    </main>
  );
}
