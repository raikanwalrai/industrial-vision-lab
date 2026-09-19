import { useEffect, useMemo, useState } from "react";
import {
  applyRatioTest,
  descriptorEuclideanDistance,
  findNearestDescriptors,
  makeMatchVisualization,
  verifyDescriptorDistance,
  verifyRatio,
} from "../featureMatchMath";
import {
  buildSiftDescriptor,
  buildSiftPyramid,
  detectSiftKeypoints,
} from "../siftMath";
import { makeBlobScene } from "../blobMath";
import type { GrayImage } from "../imageScenes";
import { normalizeForDisplay } from "../math";
import { navigateTo } from "../navigation";

const SHIFT_X = 8;
const SHIFT_Y = 4;
const RATIO_THRESHOLD = 0.75;
const MAX_FEATURES = 12;

function translateImage(
  image: GrayImage,
  dx: number,
  dy: number,
): GrayImage {
  const output: GrayImage = {
    width: image.width,
    height: image.height,
    data: new Float32Array(
      image.width * image.height,
    ),
  };

  output.data.fill(0);

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const sourceX = x - dx;
      const sourceY = y - dy;

      if (
        sourceX >= 0 &&
        sourceX < image.width &&
        sourceY >= 0 &&
        sourceY < image.height
      ) {
        output.data[
          y * image.width + x
        ] =
          image.data[
            sourceY * image.width +
              sourceX
          ];
      }
    }
  }

  return output;
}

function Canvas({
  image,
  label,
  points = [],
  selected,
}: {
  image: GrayImage;
  label: string;
  points?: Array<{
    x: number;
    y: number;
  }>;
  selected?: {
    x: number;
    y: number;
  };
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
      i += 1
    ) {
      const value = Math.round(
        Math.max(
          0,
          Math.min(255, display[i]),
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

    context.save();
    context.strokeStyle = "#63b3ed";
    context.lineWidth = 1.5;

    for (const point of points) {
      context.beginPath();
      context.arc(
        point.x,
        point.y,
        3,
        0,
        Math.PI * 2,
      );
      context.stroke();
    }

    if (selected) {
      context.strokeStyle =
        "#f8fafc";
      context.lineWidth = 2;

      context.beginPath();
      context.arc(
        selected.x,
        selected.y,
        5,
        0,
        Math.PI * 2,
      );
      context.stroke();

      context.beginPath();
      context.moveTo(
        selected.x - 7,
        selected.y,
      );
      context.lineTo(
        selected.x + 7,
        selected.y,
      );
      context.moveTo(
        selected.x,
        selected.y - 7,
      );
      context.lineTo(
        selected.x,
        selected.y + 7,
      );
      context.stroke();
    }

    context.restore();
  };

  return (
    <div className="s8d-canvasWrap">
      <div className="s8d-canvasLabel">
        {label}
      </div>
      <canvas
        ref={ref}
        className="s8d-canvas"
      />
    </div>
  );
}

function MatchCanvas({
  source,
  target,
  matches,
}: {
  source: GrayImage;
  target: GrayImage;
  matches: ReturnType<
    typeof makeMatchVisualization
  >;
}) {
  useEffect(() => {
    const canvas =
      document.getElementById(
        "s8d-match-canvas",
      ) as HTMLCanvasElement | null;

    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    const width =
      source.width + target.width;
    const height = Math.max(
      source.height,
      target.height,
    );

    canvas.width = width;
    canvas.height = height;

    const left =
      normalizeForDisplay(source).data;
    const right =
      normalizeForDisplay(target).data;

    const imageData =
      context.createImageData(
        width,
        height,
      );

    for (
      let y = 0;
      y < height;
      y += 1
    ) {
      for (
        let x = 0;
        x < width;
        x += 1
      ) {
        const value =
          x < source.width
            ? left[y * source.width + x]
            : right[
                y * target.width +
                  (x - source.width)
              ];

        const clamped = Math.round(
          Math.max(
            0,
            Math.min(255, value ?? 0),
          ),
        );

        const index =
          (y * width + x) * 4;

        imageData.data[index] = clamped;
        imageData.data[index + 1] =
          clamped;
        imageData.data[index + 2] =
          clamped;
        imageData.data[index + 3] = 255;
      }
    }

    context.putImageData(
      imageData,
      0,
      0,
    );

    context.save();
    context.strokeStyle =
      "rgba(99,179,237,0.8)";
    context.lineWidth = 1.5;

    for (const match of matches) {
      context.beginPath();
      context.arc(
        match.source.x,
        match.source.y,
        3,
        0,
        Math.PI * 2,
      );
      context.stroke();

      context.beginPath();
      context.arc(
        source.width +
          match.target.x,
        match.target.y,
        3,
        0,
        Math.PI * 2,
      );
      context.stroke();

      context.beginPath();
      context.moveTo(
        match.source.x,
        match.source.y,
      );
      context.lineTo(
        source.width +
          match.target.x,
        match.target.y,
      );
      context.stroke();
    }

    context.restore();
  }, [source, target, matches]);

  return (
    <div className="s8d-matchCanvasWrap">
      <div className="s8d-matchCanvasLabel">
        Accepted descriptor matches
      </div>
      <canvas
        id="s8d-match-canvas"
        className="s8d-matchCanvas"
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
    <div className="s8d-metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function BarGrid({
  values,
  title,
}: {
  values: number[];
  title: string;
}) {
  const max =
    Math.max(
      ...values.map((value) =>
        Math.abs(value),
      ),
      1e-9,
    );

  return (
    <div className="s8d-bars">
      <div className="s8d-barsTitle">
        {title}
      </div>

      <div className="s8d-barGrid">
        {values.map(
          (value, index) => (
            <div
              className="s8d-barItem"
              key={index}
            >
              <div
                className="s8d-bar"
                style={{
                  height: `${Math.max(
                    3,
                    (Math.abs(value) /
                      max) *
                      100,
                  )}%`,
                }}
              />
              <span>
                {index + 1}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default function Sprint8GroupDPage() {
  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const sourceImage = useMemo(
    () =>
      makeBlobScene(
        "industrial",
      ),
    [],
  );

  const targetImage = useMemo(
    () =>
      translateImage(
        sourceImage,
        SHIFT_X,
        SHIFT_Y,
      ),
    [sourceImage],
  );

  const pyramid = useMemo(
    () =>
      buildSiftPyramid(
        sourceImage,
        3,
        5,
      ),
    [sourceImage],
  );

  const sourceKeypoints = useMemo(
    () =>
      pyramid
        .flatMap((octave) =>
          detectSiftKeypoints(
            octave,
            0.35,
          ),
        )
        .filter(
          (point) =>
            point.x > 20 &&
            point.x <
              sourceImage.width - 20 &&
            point.y > 20 &&
            point.y <
              sourceImage.height - 20,
        )
        .sort(
          (a, b) =>
            Math.abs(b.response) -
            Math.abs(a.response),
        )
        .slice(0, MAX_FEATURES),
    [pyramid, sourceImage],
  );

  const targetKeypoints =
    sourceKeypoints.map(
      (point) => ({
        ...point,
        x: point.x + SHIFT_X,
        y: point.y + SHIFT_Y,
      }),
    );

  const targetPyramid = useMemo(
    () =>
      buildSiftPyramid(
        targetImage,
        3,
        5,
      ),
    [targetImage],
  );

  const sourceDescriptors =
    useMemo(
      () =>
        sourceKeypoints.map(
          (point) => {
            const octave =
              pyramid[point.octave];

            const scale =
              octave?.scales[
                point.scaleIndex
              ];

            return buildSiftDescriptor(
              scale?.image ??
                sourceImage,
              point.x,
              point.y,
              point.orientation,
            );
          },
        ),
      [
        sourceKeypoints,
        pyramid,
        sourceImage,
      ],
    );

  const targetDescriptors =
    useMemo(
      () =>
        targetKeypoints.map(
          (point) => {
            const octave =
              targetPyramid[
                point.octave
              ];

            const scale =
              octave?.scales[
                point.scaleIndex
              ];

            return buildSiftDescriptor(
              scale?.image ??
                targetImage,
              point.x,
              point.y,
              point.orientation,
            );
          },
        ),
      [
        targetKeypoints,
        targetPyramid,
        targetImage,
      ],
    );

  const candidates = useMemo(
    () =>
      findNearestDescriptors(
        sourceDescriptors,
        targetDescriptors,
      ),
    [
      sourceDescriptors,
      targetDescriptors,
    ],
  );

  const matches = useMemo(
    () =>
      applyRatioTest(
        candidates,
        RATIO_THRESHOLD,
      ),
    [candidates],
  );

  const visualMatches = useMemo(
    () =>
      makeMatchVisualization(
        sourceKeypoints,
        targetKeypoints,
        matches,
      ),
    [
      sourceKeypoints,
      targetKeypoints,
      matches,
    ],
  );

  const selectedMatch =
    matches[selectedIndex] ??
    matches[0];

  const selectedDistance =
    selectedMatch &&
    selectedMatch.nearestIndex >= 0
      ? descriptorEuclideanDistance(
          sourceDescriptors[
            selectedMatch.indexA
          ],
          targetDescriptors[
            selectedMatch.nearestIndex
          ],
          selectedMatch.indexA,
          selectedMatch.nearestIndex,
        )
      : null;

  const verification = [
    [
      "Descriptor dimension = 128",
      sourceDescriptors.every(
        (descriptor) =>
          descriptor.values.length ===
          128,
      ),
    ],
    [
      "Euclidean distance formula",
      selectedDistance
        ? verifyDescriptorDistance(
            sourceDescriptors[
              selectedMatch.indexA
            ],
            targetDescriptors[
              selectedMatch.nearestIndex
            ],
          )
        : false,
    ],
    [
      "Nearest distance ≤ second nearest",
      selectedMatch
        ? selectedMatch.nearestDistance <=
          selectedMatch.secondNearestDistance
        : false,
    ],
    [
      "Lowe ratio formula",
      selectedMatch
        ? verifyRatio(
            selectedMatch.nearestDistance,
            selectedMatch.secondNearestDistance,
            selectedMatch.ratio,
          )
        : false,
    ],
    [
      `Ratio test uses r < ${RATIO_THRESHOLD}`,
      selectedMatch
        ? selectedMatch.accepted ===
          (selectedMatch.ratio <
            RATIO_THRESHOLD)
        : false,
    ],
  ];

  const selectedSource =
    sourceKeypoints[
      selectedMatch?.indexA ?? 0
    ];

  const selectedTarget =
    targetKeypoints[
      selectedMatch?.nearestIndex ?? 0
    ];

  return (
    <main className="s8-page">
      <section className="s7-groupSwitcher panel">
        <div>
          <div className="sectionEyebrow">
            SPRINT 8 · CORNERS + BLOBS + SIFT
          </div>

          <h2>
            Choose the experiment
          </h2>

          <p>
            Group D completes the SIFT
            pipeline: descriptors become
            measurable vectors, vectors are
            compared by distance, and
            ambiguous matches are rejected
            by Lowe&apos;s ratio test.
          </p>
        </div>

        <div className="s7-groupButtons">
          <button
            onClick={() =>
              navigateTo(
                "/learn/sprint-8",
              )
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
            onClick={() =>
              navigateTo(
                "/learn/sprint-8/group-c",
              )
            }
          >
            C · SIFT Construction
          </button>

          <button
            className="active"
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

      <section className="s8-hero">
        <div>
          <div className="sectionEyebrow">
            GROUP D · FEATURE MATCHING
          </div>

          <h1>
            From SIFT descriptors to
            reliable matches
          </h1>

          <p>
            A descriptor is only useful when
            we can compare it with another
            descriptor. This laboratory makes
            every step visible: 128-dimensional
            Euclidean distance, nearest-neighbor
            search, the second-best candidate,
            Lowe&apos;s ratio, and the final
            match decision.
          </p>
        </div>
      </section>

      <section className="s8d-cardGrid">
        <article className="panel s8d-card">
          <div className="sectionEyebrow">
            D1 · DESCRIPTOR DISTANCE
          </div>

          <h2>
            Compare two 128-dimensional
            descriptors
          </h2>

          <div className="s8d-equation">
            d(D_A,D_B) =
            √Σ<sub>i=1</sub>
            <sup>128</sup>
            (D<sub>A,i</sub> −
            D<sub>B,i</sub>)²
          </div>

          <p>
            Each SIFT descriptor is a vector
            with 128 numbers. We subtract the
            corresponding values, square the
            differences, add them, and take the
            square root.
          </p>

          <div className="s8d-metrics">
            <Metric
              label="Descriptor dimensions"
              value="128"
            />
            <Metric
              label="Source features"
              value={`${sourceDescriptors.length}`}
            />
            <Metric
              label="Distance"
              value={
                selectedDistance
                  ? selectedDistance.distance.toFixed(
                      5,
                    )
                  : "—"
              }
            />
          </div>
        </article>

        <article className="panel s8d-card">
          <div className="sectionEyebrow">
            D2 · NEAREST NEIGHBOR
          </div>

          <h2>
            Find the closest descriptor
          </h2>

          <div className="s8d-equation">
            d₁ = min<sub>j</sub>
            d(D<sub>A,i</sub>,D<sub>B,j</sub>)
          </div>

          <p>
            For every descriptor in image A,
            calculate its distance to every
            descriptor in image B. The smallest
            distance becomes the nearest
            neighbor.
          </p>

          <div className="s8d-metrics">
            <Metric
              label="Selected source"
              value={`A[${selectedMatch?.indexA ?? "—"}]`}
            />
            <Metric
              label="Nearest target"
              value={`B[${selectedMatch?.nearestIndex ?? "—"}]`}
            />
            <Metric
              label="d₁"
              value={
                selectedMatch
                  ? selectedMatch.nearestDistance.toFixed(
                      5,
                    )
                  : "—"
              }
            />
          </div>
        </article>

        <article className="panel s8d-card">
          <div className="sectionEyebrow">
            D3 · LOWE RATIO TEST
          </div>

          <h2>
            Reject ambiguous matches
          </h2>

          <div className="s8d-equation">
            r =
            <span>
              d₁
              <br />
              ──
              <br />
              d₂
            </span>
            &nbsp;&nbsp;&lt;&nbsp;&nbsp;τ
          </div>

          <p>
            A very good match should be
            clearly better than the second-best
            match. Lowe&apos;s ratio test measures
            that separation.
          </p>

          <div className="s8d-metrics">
            <Metric
              label="Second distance d₂"
              value={
                selectedMatch
                  ? selectedMatch.secondNearestDistance.toFixed(
                      5,
                    )
                  : "—"
              }
            />
            <Metric
              label="Ratio r"
              value={
                selectedMatch
                  ? selectedMatch.ratio.toFixed(
                      4,
                    )
                  : "—"
              }
            />
            <Metric
              label="Threshold τ"
              value={RATIO_THRESHOLD.toFixed(
                2,
              )}
            />
          </div>
        </article>

        <article className="panel s8d-card">
          <div className="sectionEyebrow">
            D4 · MATCH DECISION
          </div>

          <h2>
            Visualize accepted correspondences
          </h2>

          <div className="s8d-decision">
            <span
              className={
                selectedMatch?.accepted
                  ? "s8d-pass"
                  : "s8d-reject"
              }
            >
              {selectedMatch?.accepted
                ? "MATCH ACCEPTED"
                : "MATCH REJECTED"}
            </span>
          </div>

          <div className="s8d-metrics">
            <Metric
              label="Candidates"
              value={`${matches.length}`}
            />
            <Metric
              label="Accepted"
              value={`${matches.filter((m) => m.accepted).length}`}
            />
            <Metric
              label="Rejected"
              value={`${matches.filter((m) => !m.accepted).length}`}
            />
          </div>

          <p>
            The lines below are drawn only for
            descriptors that pass the ratio test.
            This turns the numerical decision into
            a visible feature correspondence.
          </p>
        </article>
      </section>

      <section className="panel s8d-card">
        <div className="sectionEyebrow">
          CONTROLLED MATCHING EXPERIMENT
        </div>

        <h2>
          Image A → translated Image B
        </h2>

        <p>
          Image B is a deterministic translated
          copy of Image A:
          <strong>
            {" "}
            Δx = {SHIFT_X}px, Δy ={" "}
            {SHIFT_Y}px
          </strong>
          . This gives us a controlled experiment
          in which corresponding industrial
          features have a known geometric shift.
        </p>

        <div className="s8d-imagePair">
          <Canvas
            image={sourceImage}
            label="Image A · source"
            points={sourceKeypoints}
            selected={selectedSource}
          />

          <Canvas
            image={targetImage}
            label="Image B · translated target"
            points={targetKeypoints}
            selected={selectedTarget}
          />
        </div>
      </section>

      <section className="panel s8d-card">
        <div className="sectionEyebrow">
          D4 · MATCH VISUALIZATION
        </div>

        <h2>
          Accepted feature correspondences
        </h2>

        <MatchCanvas
          source={sourceImage}
          target={targetImage}
          matches={visualMatches}
        />

        <p className="s8d-note">
          Each line connects a source
          descriptor to its nearest target
          descriptor after the ratio test.
        </p>
      </section>

      <section className="panel s8d-card">
        <div className="sectionEyebrow">
          D5 · SELECTED MATCH
        </div>

        <h2>
          Inspect every number behind one
          decision
        </h2>

        <div className="s8d-selector">
          <label htmlFor="s8d-match-select">
            Select source descriptor
          </label>

          <select
            id="s8d-match-select"
            value={selectedIndex}
            onChange={(event) =>
              setSelectedIndex(
                Number(event.target.value),
              )
            }
          >
            {matches.map(
              (match, index) => (
                <option
                  key={index}
                  value={index}
                >
                  A[{match.indexA}] → B[
                  {match.nearestIndex}
                  ] · r=
                  {match.ratio.toFixed(3)}
                </option>
              ),
            )}
          </select>
        </div>

        {selectedDistance &&
          selectedMatch && (
            <>
              <div className="s8d-detailGrid">
                <div>
                  <h3>
                    Descriptor A
                  </h3>
                  <BarGrid
                    title="First 16 values"
                    values={sourceDescriptors[
                      selectedMatch.indexA
                    ].values.slice(0, 16)}
                  />
                </div>

                <div>
                  <h3>
                    Descriptor B
                  </h3>
                  <BarGrid
                    title="First 16 values"
                    values={targetDescriptors[
                      selectedMatch.nearestIndex
                    ].values.slice(0, 16)}
                  />
                </div>

                <div>
                  <h3>
                    Squared differences
                  </h3>
                  <BarGrid
                    title="First 16 terms"
                    values={selectedDistance.squaredDifferences.slice(
                      0,
                      16,
                    )}
                  />
                </div>
              </div>

              <div className="s8d-calculation">
                <div>
                  <span>
                    Σ squared differences
                  </span>
                  <strong>
                    {selectedDistance.squaredDifferences
                      .reduce(
                        (sum, value) =>
                          sum + value,
                        0,
                      )
                      .toFixed(8)}
                  </strong>
                </div>

                <div>
                  <span>
                    √Σ squared differences
                  </span>
                  <strong>
                    {selectedDistance.distance.toFixed(
                      8,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Nearest distance d₁
                  </span>
                  <strong>
                    {selectedMatch.nearestDistance.toFixed(
                      8,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Second distance d₂
                  </span>
                  <strong>
                    {selectedMatch.secondNearestDistance.toFixed(
                      8,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Ratio r = d₁ / d₂
                  </span>
                  <strong>
                    {selectedMatch.ratio.toFixed(
                      8,
                    )}
                  </strong>
                </div>
              </div>
            </>
          )}
      </section>

      <section className="panel s8d-card">
        <div className="sectionEyebrow">
          MATHEMATICAL VERIFICATION
        </div>

        <h2>
          Does the implementation obey the
          equations?
        </h2>

        <div className="s8d-verification">
          {verification.map(
            ([label, pass]) => (
              <div
                className="s8d-verificationRow"
                key={String(label)}
              >
                <span>{String(label)}</span>
                <b
                  className={
                    pass
                      ? "s8d-pass"
                      : "s8d-reject"
                  }
                >
                  {pass
                    ? "PASS"
                    : "CHECK"}
                </b>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="panel s8d-card">
        <div className="sectionEyebrow">
          INDUSTRIAL CONNECTION
        </div>

        <h2>
          Why feature matching matters
        </h2>

        <div className="s8d-industrialGrid">
          <div>
            <strong>
              Inspection
            </strong>
            <p>
              Match the same surface,
              corner, or component across
              different camera views.
            </p>
          </div>

          <div>
            <strong>
              Registration
            </strong>
            <p>
              Establish correspondences before
              aligning two images.
            </p>
          </div>

          <div>
            <strong>
              Tracking
            </strong>
            <p>
              Re-identify visual features as
              an object moves through a
              production line.
            </p>
          </div>

          <div>
            <strong>
              Defect analysis
            </strong>
            <p>
              Compare a current observation
              against a known reference using
              local visual evidence.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
