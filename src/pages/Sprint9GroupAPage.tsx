import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeLBP,
  lbpHistogram,
  textureStatistics,
  makeTextureScene,
  extractTexturePatch,
  type TexturePatch,
  type TextureSceneKind,
} from "../textureMath";
import { navigateTo } from "../navigation";

function makePatch(
  values: number[],
  width: number,
): TexturePatch {
  return {
    width,
    height: Math.ceil(
      values.length / width,
    ),
    data: values,
  };
}

function TextureCanvas({
  scene,
  selectedX,
  selectedY,
  onSelect,
}: {
  scene: ReturnType<typeof makeTextureScene>;
  selectedX: number;
  selectedY: number;
  onSelect: (x: number, y: number) => void;
}) {
  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const selectFromPointer = (
    event:
      | React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    const x = Math.max(
      0,
      Math.min(
        scene.width - 1,
        Math.floor(
          ((event.clientX -
            rect.left) /
            rect.width) *
            scene.width,
        ),
      ),
    );

    const y = Math.max(
      0,
      Math.min(
        scene.height - 1,
        Math.floor(
          ((event.clientY -
            rect.top) /
            rect.height) *
            scene.height,
        ),
      ),
    );

    onSelect(x, y);
  };

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const scale = 3;

    canvas.width =
      scene.width * scale;

    canvas.height =
      scene.height * scale;

    const image =
      ctx.createImageData(
        canvas.width,
        canvas.height,
      );

    for (
      let y = 0;
      y < scene.height;
      y += 1
    ) {
      for (
        let x = 0;
        x < scene.width;
        x += 1
      ) {
        const value =
          Math.round(
            scene.data[
              y * scene.width + x
            ],
          );

        for (
          let sy = 0;
          sy < scale;
          sy += 1
        ) {
          for (
            let sx = 0;
            sx < scale;
            sx += 1
          ) {
            const px =
              x * scale + sx;

            const py =
              y * scale + sy;

            const index =
              (py * canvas.width +
                px) *
              4;

            image.data[index] =
              value;
            image.data[index + 1] =
              value;
            image.data[index + 2] =
              value;
            image.data[index + 3] =
              255;
          }
        }
      }
    }

    ctx.putImageData(
      image,
      0,
      0,
    );

    const radius = 4;

    ctx.strokeStyle =
      "#6da8d3";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      (selectedX - radius) *
        scale,
      (selectedY - radius) *
        scale,
      radius * 2 * scale,
      radius * 2 * scale,
    );

    ctx.beginPath();
    ctx.moveTo(
      selectedX * scale,
      (selectedY - 7) * scale,
    );
    ctx.lineTo(
      selectedX * scale,
      (selectedY + 7) * scale,
    );
    ctx.moveTo(
      (selectedX - 7) * scale,
      selectedY * scale,
    );
    ctx.lineTo(
      (selectedX + 7) * scale,
      selectedY * scale,
    );
    ctx.stroke();
  }, [
    scene,
    selectedX,
    selectedY,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="s9-textureCanvas"
      aria-label={`${scene.name} texture image; click or drag to select a pixel`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(
          event.pointerId,
        );
        selectFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (
          event.buttons !== 0
        ) {
          selectFromPointer(event);
        }
      }}
    />
  );
}

function Matrix({
  patch,
  highlightCenter = false,
  bits,
}: {
  patch: TexturePatch;
  highlightCenter?: boolean;
  bits?: number[];
}) {
  return (
    <div
      className="s9-textureMatrix"
      style={{
        gridTemplateColumns: `repeat(${patch.width}, 1fr)`,
      }}
    >
      {patch.data.map(
        (value, index) => {
          const x =
            index % patch.width;
          const y =
            Math.floor(
              index / patch.width,
            );

          const isCenter =
            highlightCenter &&
            x === 1 &&
            y === 1;

          return (
            <div
              key={index}
              className={`s9-textureCell ${
                isCenter
                  ? "s9-textureCellCenter"
                  : ""
              }`}
            >
              <strong>
                {value.toFixed(0)}
              </strong>

              {bits &&
                index !== 4 && (
                  <small>
                    {bits[
                      [
                        1, 2, 5,
                        8, 7, 6,
                        3, 0,
                      ].indexOf(
                        index,
                      )
                    ] ?? 0}
                  </small>
                )}
            </div>
          );
        },
      )}
    </div>
  );
}

function StatisticsCard({
  title,
  patch,
}: {
  title: string;
  patch: TexturePatch;
}) {
  const stats = useMemo(
    () =>
      textureStatistics(
        patch.data,
      ),
    [patch],
  );

  return (
    <div className="s9-statCard">
      <div className="s9-smallLabel">
        {title}
      </div>

      <Matrix patch={patch} />

      <div className="s9-statGrid">
        <div>
          <span>Mean μ</span>
          <strong>
            {stats.mean.toFixed(2)}
          </strong>
        </div>

        <div>
          <span>Variance σ²</span>
          <strong>
            {stats.variance.toFixed(2)}
          </strong>
        </div>

        <div>
          <span>Std. Dev. σ</span>
          <strong>
            {stats.standardDeviation.toFixed(
              2,
            )}
          </strong>
        </div>

        <div>
          <span>Range</span>
          <strong>
            {stats.range.toFixed(2)}
          </strong>
        </div>
      </div>

      <div className="s9-equation">
        μ = (
        {patch.data
          .map((v) =>
            v.toFixed(0),
          )
          .join(" + ")}
        ) / {patch.data.length}
        {" = "}
        {stats.mean.toFixed(2)}
      </div>

      <div className="s9-equation">
        σ² =
        {" "}
        {stats.variance.toFixed(2)}
      </div>

      <p className="s9-learningNote">
        Standard deviation measures how
        much the pixel values vary around
        their mean. We use it here as a
        simple measure of local intensity
        variation.
      </p>
    </div>
  );
}

export default function Sprint9GroupAPage() {
  const [activeExperiment, setActiveExperiment] =
    useState("A1");

  const [textureKind, setTextureKind] =
    useState<TextureSceneKind>(
      "smooth",
    );

  const [selectedX, setSelectedX] =
    useState(48);

  const [selectedY, setSelectedY] =
    useState(48);

  const textureScene = useMemo(
    () =>
      makeTextureScene(
        textureKind,
        96,
        96,
      ),
    [textureKind],
  );

  const visualTexturePatch =
    useMemo(
      () =>
        extractTexturePatch(
          textureScene,
          selectedX,
          selectedY,
          9,
        ),
      [
        textureScene,
        selectedX,
        selectedY,
      ],
    );

  const liveTextureStats =
    useMemo(
      () =>
        textureStatistics(
          visualTexturePatch.data,
        ),
      [visualTexturePatch],
    );

  const liveLbpPatch =
    useMemo(
      () =>
        extractTexturePatch(
          textureScene,
          selectedX,
          selectedY,
          3,
        ),
      [
        textureScene,
        selectedX,
        selectedY,
      ],
    );

  const liveLbp =
    useMemo(
      () =>
        computeLBP(
          liveLbpPatch,
          1,
          1,
        ),
      [liveLbpPatch],
    );

  const [lbpPattern, setLbpPattern] =
    useState<
      "live" |
      "bright-right" |
      "checker"
    >("live");

  const smoothPatch =
    makePatch(
      [
        100, 101, 100,
        101, 100, 101,
        100, 101, 100,
      ],
      3,
    );

  const texturedPatch =
    makePatch(
      [
        30, 220, 30,
        220, 30, 220,
        30, 220, 30,
      ],
      3,
    );

  const sameMeanPatchA =
    makePatch(
      [
        30, 30, 30,
        30, 30, 30,
        220, 220, 220,
      ],
      3,
    );

  const sameMeanPatchB =
    makePatch(
      [
        30, 220, 30,
        220, 30, 220,
        30, 220, 30,
      ],
      3,
    );

  const teachingLbpPatch =
    lbpPattern ===
    "bright-right"
      ? makePatch(
          [
            0, 0, 0,
            0, 10, 20,
            0, 0, 0,
          ],
          3,
        )
      : makePatch(
          [
            20, 0, 20,
            0, 10, 0,
            20, 0, 20,
          ],
          3,
        );

  const lbpPatch =
    lbpPattern === "live"
      ? liveLbpPatch
      : teachingLbpPatch;

  const lbp = useMemo(
    () =>
      computeLBP(
        lbpPatch,
        1,
        1,
      ),
    [lbpPatch],
  );

  const histogram = useMemo(
    () =>
      lbpHistogram(lbpPatch),
    [lbpPatch],
  );

  return (
    <main className="page">
      <section className="hero">
        <div className="heroKicker">
          SPRINT 9 · GROUP A
        </div>

        <h1>
          Texture Representation
        </h1>

        <p>
          Move from individual pixels
          to describing the local
          appearance of a region.
        </p>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          CHOOSE THE EXPERIMENT
        </div>

        <div className="s7-groupSwitcher">
          <div className="s7-groupButtons">
            {[
              ["A1", "Statistics"],
              ["A2", "Local Variation"],
              ["A3", "Spatial Texture"],
              ["A4", "LBP"],
            ].map(
              ([id, label]) => (
                <button
                  key={id}
                  className={
                    activeExperiment ===
                    id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveExperiment(
                      id,
                    )
                  }
                >
                  {id} · {label}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          SEE THE TEXTURE
        </div>

        <h2>
          Start with the image, then inspect
          the mathematics
        </h2>

        <p>
          Texture is a visual property first.
          Choose a controlled industrial-style
          surface below. The highlighted region
          is the local area that we can measure.
        </p>

        <div className="s9-textureSceneControls">
          {[
            ["smooth", "Smooth metal"],
            ["brushed", "Brushed metal"],
            ["checker", "Checker"],
            ["weave", "Weave"],
            ["speckle", "Speckle"],
            ["defect", "Defect surface"],
          ].map(
            ([kind, label]) => (
              <button
                key={kind}
                className={
                  textureKind ===
                  kind
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setTextureKind(
                    kind as TextureSceneKind,
                  )
                }
              >
                {label}
              </button>
            ),
          )}
        </div>

        <div className="s9-visualTextureGrid">
          <div className="s9-visualTextureCard">
            <div className="s9-smallLabel">
              TEXTURE IMAGE
            </div>

            <TextureCanvas
              scene={textureScene}
              selectedX={selectedX}
              selectedY={selectedY}
              onSelect={(x, y) => {
                setSelectedX(x);
                setSelectedY(y);
              }}
            />

            <div className="s9-textureCaption">
              <strong>
                {textureScene.name}
              </strong>

              <span>
                {textureScene.description}
              </span>
            </div>
          </div>

          <div className="s9-visualTextureCard">
            <div className="s9-smallLabel">
              SELECTED LOCAL REGION
            </div>

            <Matrix
              patch={visualTexturePatch}
              highlightCenter
            />

            <div className="s9-textureCaption">
              <strong>
                9 × 9 analysis patch
              </strong>

              <span>
                Selected pixel:
                {" "}
                ({selectedX}, {selectedY})
              </span>
            </div>

            <div className="s9-equation">
              Image → local patch →
              numerical measurements
            </div>

            <div className="s9-liveMetrics">
              <div>
                <span>Mean μ</span>
                <strong>
                  {liveTextureStats.mean.toFixed(
                    2,
                  )}
                </strong>
              </div>

              <div>
                <span>Variance σ²</span>
                <strong>
                  {liveTextureStats.variance.toFixed(
                    2,
                  )}
                </strong>
              </div>

              <div>
                <span>Std. Dev. σ</span>
                <strong>
                  {liveTextureStats.standardDeviation.toFixed(
                    2,
                  )}
                </strong>
              </div>

              <div>
                <span>Range</span>
                <strong>
                  {liveTextureStats.range.toFixed(
                    2,
                  )}
                </strong>
              </div>
            </div>

            <div className="s9-liveCoordinate">
              Live statistics for pixel
              {" "}
              <strong>
                ({selectedX}, {selectedY})
              </strong>
            </div>
          </div>
        </div>
      </section>

      {activeExperiment ===
        "A1" && (
        <section className="panel">
          <div className="sectionEyebrow">
            A1 · INTENSITY STATISTICS
          </div>

          <h2>
            Describe a region using
            numbers
          </h2>

          <p>
            Start with the simplest
            question: what are the
            intensity values doing inside
            a small image region?
          </p>

          <div className="s9-statisticsGrid">
            <StatisticsCard
              title="PATCH"
              patch={makePatch(
                [
                  20, 30, 40,
                  30, 40, 50,
                  40, 50, 60,
                ],
                3,
              )}
            />
          </div>

          <div className="s9-formulaPanel">
            <div>
              <strong>
                Mean
              </strong>
              <span>
                μ = (1/N) Σ xᵢ
              </span>
            </div>

            <div>
              <strong>
                Variance
              </strong>
              <span>
                σ² = (1/N) Σ(xᵢ − μ)²
              </span>
            </div>

            <div>
              <strong>
                Standard deviation
              </strong>
              <span>
                σ = √σ²
              </span>
            </div>
          </div>
        </section>
      )}

      {activeExperiment ===
        "A2" && (
        <section className="panel">
          <div className="sectionEyebrow">
            A2 · LOCAL VARIATION
          </div>

          <h2>
            Smooth and textured
            regions can behave very
            differently
          </h2>

          <p>
            A smooth patch has pixel
            values close to one another.
            A textured patch changes
            rapidly from pixel to pixel.
          </p>

          <div className="s9-twoColumn">
            <StatisticsCard
              title="SMOOTH PATCH"
              patch={smoothPatch}
            />

            <StatisticsCard
              title="TEXTURED PATCH"
              patch={texturedPatch}
            />
          </div>

          <div className="s9-callout">
            <strong>
              Key idea
            </strong>

            <span>
              Similar image regions can
              have very different local
              variation. Standard deviation
              gives us a simple numerical
              description of that variation.
            </span>
          </div>
        </section>
      )}

      {activeExperiment ===
        "A3" && (
        <section className="panel">
          <div className="sectionEyebrow">
            A3 · SPATIAL TEXTURE
          </div>

          <h2>
            Statistics alone do not tell
            the whole story
          </h2>

          <p>
            Two regions can have similar
            intensity distributions while
            arranging those values
            differently in space.
          </p>

          <div className="s9-twoColumn">
            <StatisticsCard
              title="ARRANGEMENT A"
              patch={sameMeanPatchA}
            />

            <StatisticsCard
              title="ARRANGEMENT B"
              patch={sameMeanPatchB}
            />
          </div>

          <div className="s9-equationPanel">
            <div>
              <strong>
                What changed?
              </strong>

              <p>
                The numerical values are
                similar in distribution, but
                their spatial arrangement is
                different.
              </p>
            </div>

            <div>
              <strong>
                Why does this matter?
              </strong>

              <p>
                Industrial surfaces can have
                similar brightness but
                different patterns, grain,
                weave, machining marks, or
                defects.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeExperiment ===
        "A4" && (
        <section className="panel">
          <div className="sectionEyebrow">
            A4 · LOCAL BINARY PATTERN
          </div>

          <h2>
            Turn local texture into a
            binary code
          </h2>

          <p>
            LBP compares every neighbour
            with the center pixel. Each
            comparison becomes either 0 or
            1.
          </p>

          <div className="s9-lbpControls">
            <button
              className={
                lbpPattern ===
                "live"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLbpPattern(
                  "live",
                )
              }
            >
              Live selected pixel
            </button>

            <button
              className={
                lbpPattern ===
                "bright-right"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLbpPattern(
                  "bright-right",
                )
              }
            >
              Controlled example
            </button>

            <button
              className={
                lbpPattern ===
                "checker"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLbpPattern(
                  "checker",
                )
              }
            >
              Checker example
            </button>
          </div>

          {lbpPattern === "live" && (
            <div className="s9-liveNotice">
              LBP is now calculated from the
              selected pixel in the texture image.
              Move the marker above and this
              calculation will change.
            </div>
          )}

          <div className="s9-lbpGrid">
            <div className="s9-lbpCard">
              <div className="s9-smallLabel">
                3 × 3 NEIGHBOURHOOD
              </div>

              <Matrix
                patch={lbpPatch}
                highlightCenter
                bits={lbp.bits}
              />

              <div className="s9-lbpCenter">
                Center pixel:
                <strong>
                  {lbp.center.toFixed(2)}
                </strong>

                {lbpPattern ===
                  "live" && (
                    <span>
                      from ({selectedX},
                      {selectedY})
                    </span>
                  )}
              </div>
            </div>

            <div className="s9-lbpCard">
              <div className="s9-smallLabel">
                STEP 1 · COMPARE
              </div>

              <div className="s9-bitList">
                {lbp.neighbours.map(
                  (
                    neighbour,
                    index,
                  ) => (
                    <div
                      key={index}
                    >
                      <span>
                        g{index}
                      </span>

                      <span>
                        {neighbour}
                        {" "}
                        −
                        {" "}
                        {lbp.center}
                      </span>

                      <strong>
                        {lbp.bits[
                          index
                        ]}
                      </strong>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="s9-lbpCard">
              <div className="s9-smallLabel">
                STEP 2 · BINARY PATTERN
              </div>

              <div className="s9-binaryPattern">
                {lbp.bits.join("")}
              </div>

              <div className="s9-equation">
                LBP =
                {" "}
                {lbp.bits
                  .map(
                    (
                      bit,
                      index,
                    ) =>
                      `${bit}×2^${index}`,
                  )
                  .join(" + ")}
              </div>

              <div className="s9-lbpCode">
                {lbp.code}
              </div>
            </div>
          </div>

          <div className="s9-formulaPanel">
            <div>
              <strong>
                LBP formula
              </strong>

              <span>
                LBP =
                {" "}
                Σ s(gₚ − g꜀) 2ᵖ
              </span>
            </div>

            <div>
              <strong>
                Threshold
              </strong>

              <span>
                s(x) = 1 if x ≥ 0,
                otherwise 0
              </span>
            </div>
          </div>

          <div className="s9-histogramCard">
            <div className="s9-smallLabel">
              LBP HISTOGRAM
            </div>

            <div className="s9-histogram">
              {histogram.bins.map(
                (count, index) =>
                  count > 0 && (
                    <div
                      key={index}
                      className="s9-histBar"
                    >
                      <span>
                        {index}
                      </span>

                      <i
                        style={{
                          height: `${Math.max(
                            8,
                            count * 24,
                          )}px`,
                        }}
                      />

                      <small>
                        {count}
                      </small>
                    </div>
                  ),
              )}
            </div>

            <p>
              The histogram counts how
              frequently each LBP code occurs
              across the interior pixels of
              the image region.
            </p>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="sectionEyebrow">
          INDUSTRIAL CONNECTION
        </div>

        <h2>
          Why texture matters in
          industrial vision
        </h2>

        <div className="s9-industrialGrid">
          <div>
            <strong>
              Surface inspection
            </strong>
            <span>
              Scratches, pits, stains,
              machining marks, and abnormal
              surface patterns.
            </span>
          </div>

          <div>
            <strong>
              Material classification
            </strong>
            <span>
              Distinguishing materials or
              surface finishes from their
              local appearance.
            </span>
          </div>

          <div>
            <strong>
              Defect detection
            </strong>
            <span>
              Detecting regions whose local
              texture differs from the normal
              production surface.
            </span>
          </div>
        </div>
      </section>

      <div className="s9-bottomNav">
        <button
          onClick={() =>
            navigateTo(
              "/learn/sprint-9",
            )
          }
        >
          ← Sprint 9
        </button>
      </div>
    </main>
  );
}
