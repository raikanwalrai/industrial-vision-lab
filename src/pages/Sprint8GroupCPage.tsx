import { useMemo, useState } from "react";
import {
  buildSiftDescriptor,
  buildSiftPyramid,
  detectSiftKeypoints,
  gradientAt,
  orientationHistogram,
  verifyGaussianKernelForSift,
  verifyGradientMagnitude,
  verifyGradientOrientation,
  verifySiftDescriptorDimension,
} from "../siftMath";
import { makeBlobScene } from "../blobMath";
import type { GrayImage } from "../imageScenes";
import { normalizeForDisplay } from "../math";
import { navigateTo } from "../navigation";

function ImageCanvas({
  image,
  label,
  points = [],
  selectedPoint,
}: {
  image: GrayImage;
  label: string;
  points?: Array<{
    x: number;
    y: number;
    sigma?: number;
  }>;
  selectedPoint?: {
    x: number;
    y: number;
  };
}) {
  const ref = (node: HTMLCanvasElement | null) => {
    if (!node) return;

    const context = node.getContext("2d");
    if (!context) return;

    const display = normalizeForDisplay(image).data;

    node.width = image.width;
    node.height = image.height;

    const pixels = context.createImageData(
      image.width,
      image.height,
    );

    for (let i = 0; i < display.length; i++) {
      const value = Math.round(
        Math.max(0, Math.min(255, display[i])),
      );

      pixels.data[i * 4] = value;
      pixels.data[i * 4 + 1] = value;
      pixels.data[i * 4 + 2] = value;
      pixels.data[i * 4 + 3] = 255;
    }

    context.putImageData(pixels, 0, 0);

    const scaleX = node.clientWidth / image.width;
    const scaleY = node.clientHeight / image.height;

    context.save();
    context.scale(
      Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1,
      Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 1,
    );

    context.strokeStyle = "#63b3ed";
    context.fillStyle = "#63b3ed";
    context.lineWidth = 1.5;

    for (const point of points) {
      context.beginPath();
      context.arc(
        point.x,
        point.y,
        Math.min(5, Math.max(2.5, (point.sigma ?? 3) * 0.7)),
        0,
        Math.PI * 2,
      );
      context.stroke();
    }

    if (selectedPoint) {
      context.strokeStyle = "#f8fafc";
      context.lineWidth = 2;

      context.beginPath();
      context.arc(
        selectedPoint.x,
        selectedPoint.y,
        4.5,
        0,
        Math.PI * 2,
      );
      context.stroke();

      context.beginPath();
      context.moveTo(
        selectedPoint.x - 6,
        selectedPoint.y,
      );
      context.lineTo(
        selectedPoint.x + 6,
        selectedPoint.y,
      );
      context.moveTo(
        selectedPoint.x,
        selectedPoint.y - 6,
      );
      context.lineTo(
        selectedPoint.x,
        selectedPoint.y + 6,
      );
      context.stroke();
    }

    context.restore();
  };

  return (
    <div className="s8c-canvasWrap">
      <div className="s8c-canvasLabel">{label}</div>
      <canvas ref={ref} className="s8c-canvas" />
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
    <div className="s8c-metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default function Sprint8GroupCPage() {
  const [selectedKeypointIndex, setSelectedKeypointIndex] =
    useState(0);

  const image = useMemo(
    () =>
      makeBlobScene(
        "industrial",
      ),
    [],
  );

  const pyramid = useMemo(
    () =>
      buildSiftPyramid(
        image,
        3,
        5,
      ),
    [image],
  );

  const keypoints = useMemo(
    () =>
      pyramid.flatMap((octave) =>
        detectSiftKeypoints(
          octave,
          0.35,
        ),
      ),
    [pyramid],
  );

  const selectedKeypoint =
    keypoints[
      Math.min(
        selectedKeypointIndex,
        Math.max(0, keypoints.length - 1),
      )
    ];

  const selectedOctave =
    pyramid[selectedKeypoint?.octave ?? 0] ??
    pyramid[0];

  const selectedScale =
    selectedOctave?.scales[
      selectedKeypoint?.scaleIndex ?? 0
    ] ?? selectedOctave?.scales[0];

  const selectedImage =
    selectedScale?.image ?? image;

  const selectedX =
    selectedKeypoint?.x ?? Math.floor(image.width / 2);

  const selectedY =
    selectedKeypoint?.y ?? Math.floor(image.height / 2);

  const selectedGradient = gradientAt(
    selectedImage,
    selectedX,
    selectedY,
  );

  const selectedOrientation =
    orientationHistogram(
      selectedImage,
      selectedX,
      selectedY,
    );

  const descriptor = buildSiftDescriptor(
    selectedImage,
    selectedX,
    selectedY,
    selectedOrientation.dominantAngle,
  );

  const verification = [
    [
      "Gaussian kernel sums to 1",
      verifyGaussianKernelForSift(
        selectedScale?.sigma ?? 1.6,
      ),
    ],
    [
      "Gradient magnitude formula",
      verifyGradientMagnitude(
        selectedGradient.gx,
        selectedGradient.gy,
        selectedGradient.magnitude,
      ),
    ],
    [
      "Gradient orientation formula",
      verifyGradientOrientation(
        selectedGradient.gx,
        selectedGradient.gy,
        selectedGradient.orientation,
      ),
    ],
    [
      "Descriptor has 16 cells",
      descriptor.cells.length === 16,
    ],
    [
      "Descriptor has 128 values",
      verifySiftDescriptorDimension(
        descriptor,
      ),
    ],
  ] as Array<[string, boolean]>;

  const visibleKeypoints =
    keypoints.slice(0, 80);

  const octave0 =
    pyramid[0];

  const dog0 =
    octave0?.dogs[0];

  return (
    <main className="s8c-page">
      <section className="s7-groupSwitcher panel">
        <div>
          <div className="sectionEyebrow">
            SPRINT 8 · CORNERS + BLOBS + SIFT
          </div>

          <h2>Choose the experiment</h2>

          <p>
            Group A builds corner reasoning from the
            structure tensor. Group B moves from
            corners to blobs and scale-space features.
            Group C now constructs SIFT from those
            ideas. Group D will complete the feature
            matching path.
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
            onClick={() =>
              navigateTo(
                "/learn/sprint-8/group-b",
              )
            }
          >
            B · Shi-Tomasi + Blobs + LoG/DoG
          </button>

          <button
            className="active"
            onClick={() =>
              navigateTo(
                "/learn/sprint-8/group-c",
              )
            }
          >
            C · SIFT Construction
          </button>

          <button disabled>
            D · Feature Matching
          </button>
        </div>
      </section>

      <section className="s8c-hero panel">
        <div>
          <div className="sectionEyebrow">
            GROUP C · LOCAL FEATURES
          </div>

          <h1>
            Build SIFT step by step
          </h1>

          <p>
            SIFT turns the scale-space ideas from
            Group B into a robust local feature:
            find a stable location and scale, assign
            an orientation, then describe the local
            image structure numerically.
          </p>
        </div>

        <div className="s8c-flow">
          <span>Gaussian Pyramid</span>
          <b>→</b>
          <span>DoG</span>
          <b>→</b>
          <span>Keypoint</span>
          <b>→</b>
          <span>Orientation</span>
          <b>→</b>
          <span>128-D Descriptor</span>
        </div>
      </section>

      <section className="panel s8c-panel">
        <div className="sectionEyebrow">
          1 · SIFT PIPELINE
        </div>

        <h2>
          From scale-space structure to a local
          feature descriptor
        </h2>

        <div className="s8c-pipeline">
          <div>
            <strong>1</strong>
            <span>Build Gaussian scales</span>
          </div>
          <div>
            <strong>2</strong>
            <span>Subtract nearby scales</span>
          </div>
          <div>
            <strong>3</strong>
            <span>Find stable extrema</span>
          </div>
          <div>
            <strong>4</strong>
            <span>Assign orientation</span>
          </div>
          <div>
            <strong>5</strong>
            <span>Build 128 numbers</span>
          </div>
        </div>

        <div className="s8c-equation">
          descriptor =
          4 × 4 spatial cells × 8 orientation bins
          = <strong>128 dimensions</strong>
        </div>
      </section>

      <section className="panel s8c-panel">
        <div className="sectionEyebrow">
          2 · GAUSSIAN PYRAMID
        </div>

        <h2>
          The image is examined at multiple scales
        </h2>

        <div className="s8c-scaleGrid">
          {octave0?.scales.map(
            (scale) => (
              <ImageCanvas
                key={scale.sigma}
                image={scale.image}
                label={`OCTAVE 0 · σ = ${scale.sigma.toFixed(
                  2,
                )}`}
              />
            ),
          )}
        </div>

        <p className="s8c-note">
          A SIFT octave contains progressively
          blurred versions of the same image.
          After an octave, the representation is
          downsampled and the process continues at
          a larger image scale.
        </p>

        <div className="s8c-metrics">
          <Metric
            label="Octaves"
            value={String(pyramid.length)}
          />
          <Metric
            label="Scales / octave"
            value={String(
              octave0?.scales.length ?? 0,
            )}
          />
          <Metric
            label="Base resolution"
            value={`${image.width} × ${image.height}`}
          />
        </div>
      </section>

      <section className="s8c-twoCol">
        <div className="panel s8c-panel">
          <div className="sectionEyebrow">
            3 · DIFFERENCE OF GAUSSIANS
          </div>

          <h2>
            Approximate scale-space derivatives
          </h2>

          {dog0 ? (
            <ImageCanvas
              image={dog0}
              label="DOG · OCTAVE 0 · SCALE 0"
            />
          ) : null}

          <div className="s8c-equation">
            D(x,y,σ) =
            L(x,y,kσ) − L(x,y,σ)
          </div>

          <p className="s8c-note">
            SIFT uses differences between nearby
            Gaussian scales to find structures that
            are stable in both position and scale.
          </p>
        </div>

        <div className="panel s8c-panel">
          <div className="sectionEyebrow">
            4 · SCALE-SPACE KEYPOINTS
          </div>

          <h2>
            Search in x, y and scale
          </h2>

          <ImageCanvas
            image={image}
            label="KEYPOINT CANDIDATES"
            points={visibleKeypoints}
            selectedPoint={
              selectedKeypoint
                ? {
                    x: selectedX,
                    y: selectedY,
                  }
                : undefined
            }
          />

          <div className="s8c-metrics">
            <Metric
              label="Detected keypoints"
              value={String(
                keypoints.length,
              )}
            />
            <Metric
              label="Selected octave"
              value={String(
                selectedKeypoint?.octave ?? 0,
              )}
            />
            <Metric
              label="Selected σ"
              value={
                selectedKeypoint
                  ? selectedKeypoint.sigma.toFixed(
                      2,
                    )
                  : "—"
              }
            />
          </div>

          {keypoints.length > 0 ? (
            <label className="s8c-slider">
              <span>
                Inspect keypoint #
                {selectedKeypointIndex + 1}
              </span>

              <input
                type="range"
                min={0}
                max={Math.max(
                  0,
                  keypoints.length - 1,
                )}
                value={selectedKeypointIndex}
                onChange={(event) =>
                  setSelectedKeypointIndex(
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />
            </label>
          ) : null}
        </div>
      </section>

      <section className="s8c-twoCol">
        <div className="panel s8c-panel">
          <div className="sectionEyebrow">
            5 · ORIENTATION ASSIGNMENT
          </div>

          <h2>
            Give the keypoint a dominant direction
          </h2>

          <div className="s8c-equation s8c-equationStack">
            <div>
              m(x,y) = √(G<sub>x</sub><sup>2</sup> +
              G<sub>y</sub><sup>2</sup>)
            </div>
            <div>
              θ(x,y) = atan2(G<sub>y</sub>, G<sub>x</sub>)
            </div>
          </div>

          <div className="s8c-metrics">
            <Metric
              label="Gx"
              value={selectedGradient.gx.toFixed(
                4,
              )}
            />
            <Metric
              label="Gy"
              value={selectedGradient.gy.toFixed(
                4,
              )}
            />
            <Metric
              label="Magnitude"
              value={selectedGradient.magnitude.toFixed(
                4,
              )}
            />
            <Metric
              label="Angle"
              value={`${(
                selectedGradient.orientation *
                180 /
                Math.PI
              ).toFixed(2)}°`}
            />
            <Metric
              label="Dominant bin"
              value={String(
                selectedOrientation.dominantBin,
              )}
            />
            <Metric
              label="Dominant angle"
              value={`${(
                selectedOrientation.dominantAngle *
                180 /
                Math.PI
              ).toFixed(2)}°`}
            />
          </div>
        </div>

        <div className="panel s8c-panel">
          <div className="sectionEyebrow">
            ORIENTATION HISTOGRAM
          </div>

          <h2>
            36 bins summarize local direction
          </h2>

          <div className="s8c-histogram">
            {selectedOrientation.bins.map(
              (value, index) => {
                const max =
                  Math.max(
                    ...selectedOrientation.bins,
                    1,
                  );

                return (
                  <div
                    key={index}
                    className={
                      index ===
                      selectedOrientation.dominantBin
                        ? "s8c-bar active"
                        : "s8c-bar"
                    }
                    style={{
                      height: `${Math.max(
                        3,
                        (value / max) * 100,
                      )}%`,
                    }}
                    title={`Bin ${index}: ${value.toFixed(
                      3,
                    )}`}
                  />
                );
              },
            )}
          </div>

          <p className="s8c-note">
            The strongest orientation becomes the
            reference direction for the local
            descriptor, helping make the feature less
            sensitive to image rotation.
          </p>
        </div>
      </section>

      <section className="panel s8c-panel">
        <div className="sectionEyebrow">
          6 · 128-DIMENSIONAL DESCRIPTOR
        </div>

        <h2>
          Convert local image structure into numbers
        </h2>

        <div className="s8c-equation">
          4 × 4 cells × 8 orientation bins
          = <strong>128 values</strong>
        </div>

        <div className="s8c-descriptorLayout">
          <div>
            <div className="s8c-cellGrid">
              {descriptor.cells.map(
                (cell) => (
                  <div
                    key={`${cell.row}-${cell.col}`}
                    className="s8c-descriptorCell"
                  >
                    <span>
                      {cell.row + 1},
                      {cell.col + 1}
                    </span>

                    <div className="s8c-miniBars">
                      {cell.histogram.map(
                        (value, index) => {
                          const max =
                            Math.max(
                              ...cell.histogram,
                              1,
                            );

                          return (
                            <i
                              key={index}
                              style={{
                                height: `${Math.max(
                                  2,
                                  (value / max) *
                                    100,
                                )}%`,
                              }}
                            />
                          );
                        },
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="s8c-descriptorSummary">
            <Metric
              label="Spatial cells"
              value="16"
            />
            <Metric
              label="Orientation bins"
              value="8"
            />
            <Metric
              label="Descriptor length"
              value={String(
                descriptor.values.length,
              )}
            />
            <Metric
              label="Pre-normalization norm"
              value={descriptor.normBeforeClamp.toFixed(
                4,
              )}
            />
            <Metric
              label="Post-clamp norm"
              value={descriptor.normAfterClamp.toFixed(
                4,
              )}
            />

            <div className="s8c-vector">
              <div className="s8c-vectorTitle">
                First 16 descriptor values
              </div>

              <div className="s8c-vectorGrid">
                {descriptor.values
                  .slice(0, 16)
                  .map((value, index) => (
                    <div
                      className="s8c-vectorValue"
                      key={index}
                    >
                      <span>d{index + 1}</span>
                      <b>{value.toFixed(3)}</b>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <p className="s8c-note">
          Each cell records how much gradient energy
          points into each of eight orientation bins.
          Concatenating the sixteen histograms creates
          the 128-dimensional local descriptor.
        </p>
      </section>

      <section className="panel s8c-panel">
        <div className="sectionEyebrow">
          MATHEMATICAL VERIFICATION
        </div>

        <div className="s8c-verification">
          {verification.map(
            ([label, pass]) => (
              <div
                key={label}
                className="s8c-verificationItem"
              >
                <span>
                  {pass ? "✓" : "×"}
                </span>
                <b>{label}</b>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="panel s8c-panel">
        <div className="sectionEyebrow">
          KEY IDEA
        </div>

        <p className="s8c-takeaway">
          SIFT does not describe a pixel directly.
          It first asks
          <strong>
            {" "}
            where is the structure stable,
            at what scale, and in which direction?
          </strong>
          {" "}
          It then converts the local gradient
          structure into a normalized 128-dimensional
          vector that can later be compared with
          descriptors from another image.
        </p>
      </section>
    </main>
  );
}
