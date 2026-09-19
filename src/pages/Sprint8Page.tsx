import {
  useMemo,
  useState,
} from "react";
import {
  detectHarrisCorners,
  makeHarrisScene,
  structureTensorAt,
  verifyEigenvalueTrace,
  verifyHarrisFormula,
  verifyRegionClassification,
  verifyStructureTensorSymmetry,
} from "../cornerMath";
import type { GrayImage } from "../imageScenes";
import { normalizeForDisplay } from "../math";
import { navigateTo } from "../navigation";

type CornerScene =
  | "shapes"
  | "corner"
  | "edges"
  | "flat";

function CornerCanvas({
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
    response?: number;
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
      pixels.data[i * 4 + 1] =
        value;
      pixels.data[i * 4 + 2] =
        value;
      pixels.data[i * 4 + 3] = 255;
    }

    context.putImageData(
      pixels,
      0,
      0,
    );

    /*
     * IMPORTANT:
     * The canvas has a small internal image coordinate system
     * (96 x 96) but is displayed much larger with CSS.
     *
     * Marker geometry must therefore be defined in IMAGE pixels,
     * not scaled by clientWidth. Otherwise the markers become
     * enormous when the canvas is enlarged on screen.
     */

    context.save();

    context.strokeStyle =
      "rgba(255, 209, 102, 0.95)";
    context.fillStyle =
      "rgba(255, 209, 102, 0.95)";

    // Small marker in image-pixel coordinates.
    const radius = 1.35;

    context.lineWidth = 0.55;

    for (const point of points) {
      // Small central point.
      context.beginPath();
      context.arc(
        point.x,
        point.y,
        radius,
        0,
        Math.PI * 2,
      );
      context.fill();

      // Very short crosshair.
      const arm = 2.4;

      context.beginPath();

      context.moveTo(
        point.x - arm,
        point.y,
      );

      context.lineTo(
        point.x + arm,
        point.y,
      );

      context.moveTo(
        point.x,
        point.y - arm,
      );

      context.lineTo(
        point.x,
        point.y + arm,
      );

      context.stroke();
    }

    context.restore();
  };

  return (
    <div className="s8-canvasCard">
      <div className="s8-cardLabel">
        {label}
      </div>

      <canvas
        ref={ref}
        className="s8-canvas"
        style={{
          cursor: onPixelClick
            ? "crosshair"
            : "default",
        }}
        onClick={(event) => {
          if (!onPixelClick) return;

          const rect =
            event.currentTarget.getBoundingClientRect();

          const x = Math.max(
            0,
            Math.min(
              image.width - 1,
              Math.floor(
                ((event.clientX - rect.left) /
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
                ((event.clientY - rect.top) /
                  rect.height) *
                  image.height,
              ),
            ),
          );

          onPixelClick(x, y);
        }}
      />

      <div className="s8-cardHint">
        {points.length > 0
          ? `${points.length} corner candidates`
          : "Click the image below to inspect a pixel"}
      </div>
    </div>
  );
}

function TensorCard({
  tensor,
}: {
  tensor: ReturnType<
    typeof structureTensorAt
  >;
}) {
  return (
    <div className="s8-tensorCard">
      <div className="s8-smallLabel">
        STRUCTURE TENSOR
      </div>

      <div className="s8-matrix">
        <span>
          {tensor.a.toFixed(2)}
        </span>
        <span>
          {tensor.b.toFixed(2)}
        </span>
        <span>
          {tensor.b.toFixed(2)}
        </span>
        <span>
          {tensor.c.toFixed(2)}
        </span>
      </div>

      <div className="s8-equationLine">
        <span>
          det(M)
        </span>
        <b>
          {tensor.determinant.toFixed(2)}
        </b>
      </div>

      <div className="s8-equationLine">
        <span>
          trace(M)
        </span>
        <b>
          {tensor.trace.toFixed(2)}
        </b>
      </div>
    </div>
  );
}

export default function Sprint8Page() {
  const [group] = useState<"A">("A");
  const [
    sceneName,
    setSceneName,
  ] = useState<CornerScene>(
    "corner",
  );

  const [
    pixel,
    setPixel,
  ] = useState({
    x: 32,
    y: 32,
  });

  const [
    threshold,
    setThreshold,
  ] = useState(0.18);

  const image = useMemo(
    () => makeHarrisScene(sceneName),
    [sceneName],
  );

  const tensor = useMemo(
    () =>
      structureTensorAt(
        image,
        pixel.x,
        pixel.y,
        1,
        0.04,
      ),
    [image, pixel],
  );

  const corners = useMemo(
    () =>
      detectHarrisCorners(
        image,
        threshold,
        1,
        0.04,
      ),
    [image, threshold],
  );

  const verification = [
    {
      label:
        "Structure tensor is symmetric",
      pass:
        verifyStructureTensorSymmetry(),
    },
    {
      label:
        "Eigenvalues preserve trace",
      pass:
        verifyEigenvalueTrace(),
    },
    {
      label:
        "Harris response formula",
      pass:
        verifyHarrisFormula(),
    },
    {
      label:
        "Flat / edge / corner classification",
      pass:
        verifyRegionClassification(),
    },
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
            Group A builds corner reasoning from the
            structure tensor. Group B moves from
            corners to blobs and scale-space features.
            Groups C and D will complete the SIFT and
            feature-matching path.
          </p>
        </div>

        <div className="s7-groupButtons">
          <button
            className={group === "A" ? "active" : ""}
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

      <section className="s8-hero panel">
        <div>
          <div className="sectionEyebrow">
            SPRINT 8 · GROUP A
          </div>

          <h1>
            Harris Corner Laboratory
          </h1>

          <p>
            A corner is not just a bright spot.
            It is a place where image intensity
            changes strongly in more than one
            direction.
          </p>
        </div>

        <div className="s8-heroFormula">
          <span>
            STRUCTURE
          </span>
          <b>
            M =
            [
            Iₓ²&nbsp;&nbsp;IₓIᵧ;
            IₓIᵧ&nbsp;&nbsp;Iᵧ²
            ]
          </b>
          <small>
            local gradient behaviour
          </small>
        </div>
      </section>

      <section className="s8-flow panel">
        <div className="sectionEyebrow">
          THE MATHEMATICAL CHAIN
        </div>

        <div className="s8-flowGrid">
          {[
            "IMAGE",
            "GRADIENTS",
            "SQUARED TERMS",
            "STRUCTURE TENSOR",
            "EIGENVALUES",
            "HARRIS RESPONSE",
            "CORNER",
          ].map(
            (step, index) => (
              <div
                className="s8-flowStep"
                key={step}
              >
                <b>
                  {String(
                    index + 1,
                  ).padStart(2, "0")}
                </b>
                <span>
                  {step}
                </span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="s8-scenes panel">
        <div className="s8-sectionHeader">
          <div>
            <div className="sectionEyebrow">
              EXPERIMENT
            </div>

            <h2>
              Compare flat regions,
              edges and corners
            </h2>

            <p>
              Change the scene and watch how
              the same mathematics responds
              differently.
            </p>
          </div>

          <div className="s8-sceneButtons">
            {(
              [
                [
                  "corner",
                  "CORNER",
                ],
                [
                  "shapes",
                  "SHAPES",
                ],
                [
                  "edges",
                  "EDGES",
                ],
                [
                  "flat",
                  "FLAT",
                ],
              ] as const
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  className={
                    sceneName === value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSceneName(value)
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="s8-controlRow">
          <label>
            CORNER THRESHOLD
            <input
              type="range"
              min="0.03"
              max="0.5"
              step="0.01"
              value={threshold}
              onChange={(e) =>
                setThreshold(
                  Number(
                    e.target.value,
                  ),
                )
              }
            />
            <b>
              {threshold.toFixed(2)}
            </b>
          </label>
        </div>

        <div className="s8-imageGrid">
          <CornerCanvas
            image={image}
            label="INPUT IMAGE"
            points={corners.points}
            onPixelClick={(x, y) =>
              setPixel({ x, y })
            }
          />

          <CornerCanvas
            image={corners.image}
            label="HARRIS RESPONSE"
            points={[]}
          />
        </div>

        <div className="s8-cornerSummary">
          <div>
            <span>
              DETECTED CORNERS
            </span>
            <b>
              {corners.points.length}
            </b>
          </div>

          <div>
            <span>
              MAX RESPONSE
            </span>
            <b>
              {corners.maxResponse.toFixed(
                2,
              )}
            </b>
          </div>

          <div>
            <span>
              k
            </span>
            <b>
              0.04
            </b>
          </div>
        </div>
      </section>

      <section className="s8-inspector panel">
        <div className="s8-sectionHeader">
          <div>
            <div className="sectionEyebrow">
              PIXEL-LEVEL MATHEMATICS
            </div>

            <h2>
              Follow one pixel through
              Harris detection
            </h2>

            <p>
              The selected pixel is passed
              through the complete calculation.
            </p>
          </div>

          <div className="s8-selected">
            <span>
              SELECTED PIXEL
            </span>
            <b>
              ({pixel.x}, {pixel.y})
            </b>
          </div>
        </div>

        <div className="s8-pixelGrid">
          <div className="s8-gradientCard">
            <div className="s8-smallLabel">
              GRADIENT
            </div>

            <div className="s8-bigValue">
              Iₓ = {tensor.ix.toFixed(3)}
            </div>

            <div className="s8-bigValue">
              Iᵧ = {tensor.iy.toFixed(3)}
            </div>

            <div className="s8-formulaNote">
              Iₓ = [I(x+1,y)-I(x-1,y)] / 2
              <br />
              Iᵧ = [I(x,y+1)-I(x,y-1)] / 2
            </div>
          </div>

          <TensorCard tensor={tensor} />

          <div className="s8-eigenCard">
            <div className="s8-smallLabel">
              EIGENVALUES
            </div>

            <div className="s8-eigenRow">
              <span>
                λ₁
              </span>
              <b>
                {tensor.lambda1.toFixed(
                  3,
                )}
              </b>
            </div>

            <div className="s8-eigenRow">
              <span>
                λ₂
              </span>
              <b>
                {tensor.lambda2.toFixed(
                  3,
                )}
              </b>
            </div>

            <div
              className={`s8-region s8-${tensor.region}`}
            >
              {tensor.region.toUpperCase()}
            </div>
          </div>

          <div className="s8-harrisCard">
            <div className="s8-smallLabel">
              HARRIS
            </div>

            <div className="s8-harrisFormula">
              R = det(M) − k trace(M)²
            </div>

            <div className="s8-harrisValue">
              {tensor.harris.toFixed(3)}
            </div>

            <div className="s8-formulaNote">
              k = 0.04
            </div>
          </div>
        </div>

        <div
          className="s8-pixelClickArea"
          onClick={(event) => {
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

            setPixel({ x, y });
          }}
        >
          <span>
            CLICK ANYWHERE TO INSPECT
            THAT PIXEL
          </span>
        </div>
      </section>

      <section className="s8-explanation panel">
        <div className="sectionEyebrow">
          WHY EIGENVALUES MATTER
        </div>

        <div className="s8-regionGrid">
          <article>
            <b>FLAT</b>
            <span>
              Little intensity change in either
              direction. Both eigenvalues are small.
            </span>
          </article>

          <article>
            <b>EDGE</b>
            <span>
              Strong change in one direction but
              little change along the edge.
            </span>
          </article>

          <article>
            <b>CORNER</b>
            <span>
              Strong change in two directions.
              Both eigenvalues become large.
            </span>
          </article>
        </div>
      </section>

      <section className="s8-verification panel">
        <div className="sectionEyebrow">
          MATHEMATICAL VERIFICATION
        </div>

        <div className="s8-verificationGrid">
          {verification.map(
            (item) => (
              <div
                className="s8-verificationItem"
                key={item.label}
              >
                <span>
                  {item.pass
                    ? "✓"
                    : "×"}
                </span>

                <b>
                  {item.label}
                </b>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="s8-takeaway panel">
        <b>
          KEY IDEA
        </b>

        <span>
          A Harris corner is a location where
          the image changes strongly in
          <strong> two directions</strong>.
          The structure tensor captures those
          directional changes, its eigenvalues
          reveal the local geometry, and the
          Harris response turns that geometry
          into a corner score.
        </span>
      </section>
    </main>
  );
}
