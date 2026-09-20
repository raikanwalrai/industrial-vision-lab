import {
  useMemo,
  useState,
} from "react";

import {
  connectedComponents,
  makeGroupingScene,
  regionGrow,
  thresholdImage,
  type Region,
} from "../groupingMath";

import { navigateTo } from "../navigation";

function GrayCanvas({
  values,
  width,
  height,
  points = [],
  selected = [],
  onSelect,
}: {
  values: number[];
  width: number;
  height: number;
  points?: Array<{
    x: number;
    y: number;
  }>;
  selected?: Array<{
    x: number;
    y: number;
  }>;
  onSelect?: (
    x: number,
    y: number,
  ) => void;
}) {
  const draw = (
    node: HTMLCanvasElement | null,
  ) => {
    if (!node) return;

    const context =
      node.getContext("2d");

    if (!context) return;

    node.width = width;
    node.height = height;

    const pixels =
      context.createImageData(
        width,
        height,
      );

    for (
      let i = 0;
      i < values.length;
      i += 1
    ) {
      const value = Math.max(
        0,
        Math.min(
          255,
          Math.round(values[i]),
        ),
      );

      pixels.data[i * 4] =
        value;
      pixels.data[i * 4 + 1] =
        value;
      pixels.data[i * 4 + 2] =
        value;
      pixels.data[i * 4 + 3] =
        255;
    }

    context.putImageData(
      pixels,
      0,
      0,
    );

    if (selected.length > 0) {
      context.fillStyle =
        "rgba(100, 180, 230, 0.35)";

      for (
        const point of selected
      ) {
        context.fillRect(
          point.x,
          point.y,
          1,
          1,
        );
      }
    }

    context.strokeStyle =
      "rgba(255, 220, 70, 0.95)";
    context.lineWidth = 1;

    for (
      const point of points
    ) {
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
  };

  return (
    <canvas
      ref={draw}
      className="s9b-canvas"
      onClick={(event) => {
        if (!onSelect) return;

        const rect =
          event.currentTarget
            .getBoundingClientRect();

        const x = Math.max(
          0,
          Math.min(
            width - 1,
            Math.floor(
              ((event.clientX -
                rect.left) /
                rect.width) *
                width,
            ),
          ),
        );

        const y = Math.max(
          0,
          Math.min(
            height - 1,
            Math.floor(
              ((event.clientY -
                rect.top) /
                rect.height) *
                height,
            ),
          ),
        );

        onSelect(x, y);
      }}
    />
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
    <div className="s9b-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RegionTable({
  regions,
  selectedId,
  onSelect,
}: {
  regions: Region[];
  selectedId: number;
  onSelect: (
    id: number,
  ) => void;
}) {
  return (
    <div className="s9b-regionTable">
      {regions
        .slice(0, 12)
        .map((region) => (
          <button
            key={region.id}
            className={
              selectedId ===
              region.id
                ? "active"
                : ""
            }
            onClick={() =>
              onSelect(
                region.id,
              )
            }
          >
            <span>
              Region {region.id}
            </span>
            <strong>
              {region.area} px
            </strong>
          </button>
        ))}
    </div>
  );
}

export default function Sprint9GroupBPage() {
  const width = 96;
  const height = 96;

  const [threshold, setThreshold] =
    useState(100);

  const [seed, setSeed] =
    useState({
      x: 20,
      y: 22,
    });

  const [
    growTolerance,
    setGrowTolerance,
  ] = useState(12);

  const [
    connectivity,
    setConnectivity,
  ] = useState<4 | 8>(4);

  const [
    selectedRegionId,
    setSelectedRegionId,
  ] = useState(1);

  const source = useMemo(
    () =>
      makeGroupingScene(
        width,
        height,
      ),
    [],
  );

  const thresholded =
    useMemo(
      () =>
        thresholdImage(
          source,
          width,
          height,
          threshold,
        ),
      [
        source,
        threshold,
      ],
    );

  const grown =
    useMemo(
      () =>
        regionGrow(
          source,
          width,
          height,
          seed.x,
          seed.y,
          growTolerance,
          connectivity,
        ),
      [
        source,
        seed,
        growTolerance,
        connectivity,
      ],
    );

  const components =
    useMemo(
      () =>
        connectedComponents(
          thresholded.mask,
          connectivity,
        ),
      [
        thresholded.mask,
        connectivity,
      ],
    );

  const selectedRegion =
    components.regions.find(
      (region) =>
        region.id ===
        selectedRegionId,
    ) ??
    components.regions[0];

  const selectedPixels =
    selectedRegion?.pixels ??
    [];

  /*
   * Teaching example for connectivity.
   *
   * Five foreground pixels touch only diagonally:
   *
   * 1 0 0 0 0
   * 0 1 0 0 0
   * 0 0 1 0 0
   * 0 0 0 1 0
   * 0 0 0 0 1
   *
   * Therefore:
   *   4-connectivity -> 5 components
   *   8-connectivity -> 1 component
   */
  const connectivityDemo = useMemo(() => {
    const width = 5;
    const height = 5;

    const values = [
      255, 0, 0, 0, 0,
      0, 255, 0, 0, 0,
      0, 0, 255, 0, 0,
      0, 0, 0, 255, 0,
      0, 0, 0, 0, 255,
    ];

    const mask = thresholdImage(
      values,
      width,
      height,
      128,
    ).mask;

    return {
      width,
      height,
      values,
      mask,
      four: connectedComponents(
        mask,
        4,
      ),
      eight: connectedComponents(
        mask,
        8,
      ),
    };
  }, []);

  const selectedComponentValues =
    useMemo(() => {
      const data =
        new Array<number>(
          source.length,
        ).fill(20);

      for (
        const point of selectedPixels
      ) {
        data[
          point.y * width +
          point.x
        ] = 230;
      }

      return data;
    }, [
      selectedPixels,
      source.length,
    ]);

  const growValues =
    useMemo(() => {
      const data =
        source.map(
          () => 20,
        );

      for (
        const point of grown.region
      ) {
        data[
          point.y * width +
          point.x
        ] = 230;
      }

      data[
        seed.y * width +
        seed.x
      ] = 255;

      return data;
    }, [
      source,
      grown,
      seed,
    ]);

  return (
    <main className="s9b-page">

      <section className="s7-groupSwitcher panel">
        <div>
          <div className="sectionEyebrow">
            SPRINT 9 · TEXTURE + GROUPING
          </div>

          <h2>
            Choose the experiment
          </h2>

          <p>
            Group A described texture.
            Group B asks how pixels become
            meaningful regions and measurable
            objects.
          </p>
        </div>

        <div className="s7-groupButtons">
          <button
            onClick={() =>
              navigateTo(
                "/learn/sprint-9/group-a",
              )
            }
          >
            A · Texture Representation
          </button>

          <button
            className="active"
            onClick={() =>
              navigateTo(
                "/learn/sprint-9/group-b",
              )
            }
          >
            B · Grouping + Connected Structures
          </button>

          <button disabled>
            C · Model Fitting
          </button>

          <button disabled>
            D · Robust Fitting
          </button>
        </div>
      </section>

      <section className="panel s9b-hero">
        <div>
          <div className="sectionEyebrow">
            SPRINT 9 · GROUP B
          </div>

          <h1>
            Grouping + Connected Structures
          </h1>

          <p>
            A texture image contains pixels.
            Segmentation turns those pixels
            into regions. Connected-component
            analysis then turns regions into
            measurable objects.
          </p>
        </div>

        <div className="s9b-flow">
          <span>Intensity</span>
          <b>→</b>
          <span>Threshold</span>
          <b>→</b>
          <span>Regions</span>
          <b>→</b>
          <span>Connectivity</span>
          <b>→</b>
          <span>Objects</span>
          <b>→</b>
          <span>Measurements</span>
        </div>
      </section>

      <section className="panel s9b-panel s9b-stage s9b-b1">
        <div className="sectionEyebrow">
          B1 · THRESHOLDING
        </div>

        <h2>
          Turn image intensity into a
          binary region mask
        </h2>

        <div className="s9b-equation">
          B(x,y) ={" "}
          1[I(x,y) ≥ T]
        </div>

        <div className="s9b-b1-workspace">
          <div className="s9b-b1-visuals">
            <div className="s9b-b1-image">
              <GrayCanvas
                values={source}
                width={width}
                height={height}
              />
              <div className="s9b-caption">
                Original intensity image
              </div>
            </div>

            <div className="s9b-b1-image">
              <GrayCanvas
                values={
                  thresholded.mask.data.map(
                    value =>
                      value
                        ? 240
                        : 20,
                  )
                }
                width={width}
                height={height}
              />
              <div className="s9b-caption">
                Binary mask
              </div>
            </div>
          </div>

          <aside className="s9b-b1-analysis">
            <div className="s9b-controls">
              <label>
                Threshold T
                <strong>
                  {threshold}
                </strong>

                <input
                  type="range"
                  min="30"
                  max="230"
                  step="1"
                  value={threshold}
                  onChange={(event) =>
                    setThreshold(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                />
              </label>
            </div>

            <div className="s9b-b1-analysisTitle">
              What changes?
            </div>

            <p className="s9b-note">
              Pixels with intensity at or above{" "}
              <strong>T = {threshold}</strong>{" "}
              become foreground; the remaining
              pixels become background.
            </p>

            <div className="s9b-metrics">
              <Metric
                label="Foreground pixels"
                value={String(
                  thresholded.foregroundCount,
                )}
              />

              <Metric
                label="Background pixels"
                value={String(
                  thresholded.backgroundCount,
                )}
              />

              <Metric
                label="Foreground fraction"
                value={`${
                  (
                    thresholded.foregroundFraction *
                    100
                  ).toFixed(1)
                }%`}
              />
            </div>
          </aside>
        </div>
      </section>

      <section className="panel s9b-panel s9b-stage s9b-b2">
        <div className="sectionEyebrow">
          B2 · REGION GROWING
        </div>

        <h2>
          Start from one pixel and grow
          a similar region
        </h2>

        <div className="s9b-equation">
          |I(p) − I(seed)| ≤ τ
        </div>

        <p className="s9b-note">
          Click the image to move the seed.
          Pixels are accepted when their
          intensity is within the selected
          tolerance of the original seed
          intensity.
        </p>

        <div className="s9b-controls">
          <label>
            Growth tolerance τ
            <strong>
              {growTolerance}
            </strong>

            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={growTolerance}
              onChange={(event) =>
                setGrowTolerance(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />
          </label>
        </div>

        <GrayCanvas
          values={source}
          width={width}
          height={height}
          selected={
            grown.region
          }
          points={[seed]}
          onSelect={(
            x,
            y,
          ) =>
            setSeed({
              x,
              y,
            })
          }
        />

        <div className="s9b-metrics">
          <Metric
            label="Seed"
            value={`(${seed.x}, ${seed.y})`}
          />

          <Metric
            label="Seed intensity"
            value={source[
              seed.y * width +
                seed.x
            ].toFixed(1)}
          />

          <Metric
            label="Region pixels"
            value={String(
              grown.region.length,
            )}
          />

          <Metric
            label="Tolerance"
            value={String(
              growTolerance,
            )}
          />
        </div>
      </section>

      <section className="panel s9b-panel s9b-stage s9b-b3">
        <div className="sectionEyebrow">
          B3 · CONNECTED COMPONENTS
        </div>

        <h2>
          Turn a binary mask into
          separate objects
        </h2>

        <div className="s9b-equation">
          4-neighbourhood vs 8-neighbourhood
        </div>

        <div className="s9b-connectivity">
          <button
            className={
              connectivity === 4
                ? "active"
                : ""
            }
            onClick={() =>
              setConnectivity(4)
            }
          >
            4-connected
          </button>

          <button
            className={
              connectivity === 8
                ? "active"
                : ""
            }
            onClick={() =>
              setConnectivity(8)
            }
          >
            8-connected
          </button>
        </div>

        <div className="s9b-connectivityDemo">
          <div>
            <div className="s9b-smallLabel">
              MATHEMATICAL CONNECTIVITY EXAMPLE
            </div>

            <h3>
              Diagonal pixels show the difference
            </h3>

            <p className="s9b-note">
              The foreground pixels touch only at
              their corners. Four-connectivity does
              not count diagonal contact; eight-connectivity
              does.
            </p>
          </div>

          <div className="s9b-connectivityDemoGrid">
            <div>
              <GrayCanvas
                values={connectivityDemo.values}
                width={connectivityDemo.width}
                height={connectivityDemo.height}
              />

              <div className="s9b-caption">
                Five diagonal foreground pixels
              </div>
            </div>

            <div className="s9b-connectivityResult">
              <Metric
                label="4-connected components"
                value={String(
                  connectivityDemo.four.regions.length,
                )}
              />

              <Metric
                label="8-connected components"
                value={String(
                  connectivityDemo.eight.regions.length,
                )}
              />

              <div className="s9b-mathCallout">
                <strong>Why?</strong>
                <span>
                  4-connectivity uses only
                  up, down, left and right.
                  8-connectivity also includes
                  the four diagonal neighbours.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="s9b-twoCol">
          <div>
            <GrayCanvas
              values={thresholded.mask.data.map(
                value =>
                  value
                    ? 230
                    : 20,
              )}
              width={width}
              height={height}
              selected={
                selectedPixels
              }
              onSelect={(x, y) => {
                const clickedRegion =
                  components.regions.find(
                    (region) =>
                      region.pixels.some(
                        (point) =>
                          point.x === x &&
                          point.y === y,
                      ),
                  );

                if (clickedRegion) {
                  setSelectedRegionId(
                    clickedRegion.id,
                  );
                }
              }}
            />

            <div className="s9b-caption">
              Click a foreground component to
              inspect its measurements
            </div>
          </div>

          <div className="s9b-b3-analysis">
            <RegionTable
              regions={
                components.regions
              }
              selectedId={
                selectedRegion?.id ??
                0
              }
              onSelect={(
                id,
              ) =>
                setSelectedRegionId(
                  id,
                )
              }
            />

            <div className="s9b-metrics">
              <Metric
                label="Connectivity"
                value={`${connectivity}-connected`}
              />

              <Metric
                label="Components"
                value={String(
                  components.regions.length,
                )}
              />

              <Metric
                label="Largest region"
                value={
                  components.regions.length
                    ? `${Math.max(
                        ...components.regions.map(
                          region =>
                            region.area,
                        ),
                      )} px`
                    : "0 px"
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel s9b-panel s9b-stage s9b-b4">
        <div className="sectionEyebrow">
          B4 · REGION PROPERTIES
        </div>

        <h2>
          Turn a connected region into
          measurements
        </h2>

        <div className="s9b-equation">
          A = |R|
          {" "}
          and
          {" "}
          (x<sub>c</sub>,y<sub>c</sub>)
          =
          {" "}
          (
          Σx/A,
          Σy/A
          )
        </div>

        {selectedRegion ? (
          <div className="s9b-b4-layout">
            <div className="s9b-b4-image">
              <GrayCanvas
                values={selectedComponentValues}
                width={width}
                height={height}
              />

              <div className="s9b-caption">
                Selected component · Region{" "}
                {selectedRegion.id}
              </div>
            </div>

            <div className="s9b-propertyGrid">

            <Metric
              label="Region ID"
              value={String(
                selectedRegion.id,
              )}
            />

            <Metric
              label="Area"
              value={`${selectedRegion.area} px`}
            />

            <Metric
              label="Centroid"
              value={`(${selectedRegion.centroidX.toFixed(
                1,
              )}, ${selectedRegion.centroidY.toFixed(
                1,
              )})`}
            />

            <Metric
              label="Bounding width"
              value={`${selectedRegion.width} px`}
            />

            <Metric
              label="Bounding height"
              value={`${selectedRegion.height} px`}
            />

            <Metric
              label="Aspect ratio"
              value={selectedRegion.aspectRatio.toFixed(
                2,
              )}
            />
            </div>
          </div>
        ) : (
          <p className="s9b-note">
            No foreground region exists at
            the current threshold.
          </p>
        )}

        <p className="s9b-note">
          In industrial inspection, these
          measurements can describe a defect,
          component, hole, weld region, or
          surface anomaly after segmentation.
        </p>
      </section>

      <section className="panel s9b-panel">
        <div className="sectionEyebrow">
          GROUP B TAKEAWAY
        </div>

        <p className="s9b-takeaway">
          Grouping converts individual pixel
          evidence into regions. Connectivity
          tells us which pixels belong together,
          and region properties turn those
          regions into measurable objects.
        </p>
      </section>

    </main>
  );
}
