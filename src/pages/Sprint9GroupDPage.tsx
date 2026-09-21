import { useMemo, useState } from "react";
import { navigateTo } from "../navigation";
import {
  calculateRmse,
  classifyPoints,
  fitLineLeastSquares,
  makeContaminatedLineDataset,
  pointToLineDistance,
  runRansac,
  type Point2D,
  type RansacIteration,
} from "../robustFittingMath";

type PlotProps = {
  points: Point2D[];
  line?: {
    slope: number;
    intercept: number;
  };
  selectedIndex?: number;
};

function RobustModelPlot({
  points,
  line,
  selectedIndex,
}: PlotProps) {
  const width = 300;
  const height = 300;
  const padding = 24;

  const allX = points.map((point) => point.x);
  const allY = points.map((point) => point.y);

  if (line) {
    allX.push(2, 34);
    allY.push(
      line.slope * 2 + line.intercept,
      line.slope * 34 + line.intercept,
    );
  }

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);

  const toSvgX = (x: number) =>
    padding +
    ((x - minX) / rangeX) *
      (width - padding * 2);

  const toSvgY = (y: number) =>
    height -
    padding -
    ((y - minY) / rangeY) *
      (height - padding * 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="s9c-modelPlot"
      role="img"
      aria-label="Contaminated measurements and least-squares line"
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        className="s9c-plotBackground"
      />

      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        className="s9c-axis"
      />

      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        className="s9c-axis"
      />

      {line && (
        <line
          x1={toSvgX(minX)}
          y1={toSvgY(
            line.slope * minX +
              line.intercept,
          )}
          x2={toSvgX(maxX)}
          y2={toSvgY(
            line.slope * maxX +
              line.intercept,
          )}
          className="s9c-fittedLine"
        />
      )}

      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={toSvgX(point.x)}
          cy={toSvgY(point.y)}
          r={
            index === selectedIndex
              ? 5
              : 3.5
          }
          className={
            index === selectedIndex
              ? "s9c-dataPoint selected"
              : "s9c-dataPoint"
          }
        />
      ))}
    </svg>
  );
}


function RansacIterationPlot({
  points,
  iteration,
  selectedIndex,
}: {
  points: Point2D[];
  iteration: RansacIteration;
  selectedIndex: number;
}) {
  const width = 300;
  const height = 300;
  const padding = 24;

  const model = iteration.model;

  const allX = [
    ...points.map((point) => point.x),
    2,
    34,
  ];

  const allY = [
    ...points.map((point) => point.y),
    model.slope * 2 + model.intercept,
    model.slope * 34 + model.intercept,
  ];

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);

  const toSvgX = (x: number) =>
    padding +
    ((x - minX) / rangeX) *
      (width - padding * 2);

  const toSvgY = (y: number) =>
    height -
    padding -
    ((y - minY) / rangeY) *
      (height - padding * 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="s9c-modelPlot"
      role="img"
      aria-label={`RANSAC iteration ${iteration.iteration}`}
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        className="s9c-plotBackground"
      />

      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        className="s9c-axis"
      />

      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        className="s9c-axis"
      />

      <line
        x1={toSvgX(minX)}
        y1={toSvgY(
          model.slope * minX +
            model.intercept,
        )}
        x2={toSvgX(maxX)}
        y2={toSvgY(
          model.slope * maxX +
            model.intercept,
        )}
        className="s9c-fittedLine"
      />

      {points.map((point, index) => {
        const isSample =
          iteration.sampleIndices.includes(index);

        const isInlier =
          iteration.inlierIndices.includes(index);

        const isSelected =
          index === selectedIndex;

        return (
          <circle
            key={`${point.x}-${point.y}-${index}`}
            cx={toSvgX(point.x)}
            cy={toSvgY(point.y)}
            r={
              isSelected
                ? 6
                : isSample
                  ? 5
                  : 3.5
            }
            className={
              isSelected
                ? "s9c-dataPoint selected"
                : isInlier
                  ? "s9c-dataPoint"
                  : "s9c-dataPoint outlier"
            }
          >
            <title>
              Point {index + 1}:{" "}
              {isSample
                ? "sampled"
                : isInlier
                  ? "inlier"
                  : "outlier"}
            </title>
          </circle>
        );
      })}
    </svg>
  );
}


function ModelComparisonPlot({
  points,
  leastSquaresModel,
  ransacModel,
  selectedIndex,
}: {
  points: Point2D[];
  leastSquaresModel: {
    slope: number;
    intercept: number;
  };
  ransacModel: {
    slope: number;
    intercept: number;
  };
  selectedIndex: number;
}) {
  const width = 300;
  const height = 300;
  const padding = 24;

  const allX = [
    ...points.map((point) => point.x),
    2,
    34,
  ];

  const allY = [
    ...points.map((point) => point.y),
    leastSquaresModel.slope * 2 +
      leastSquaresModel.intercept,
    leastSquaresModel.slope * 34 +
      leastSquaresModel.intercept,
    ransacModel.slope * 2 +
      ransacModel.intercept,
    ransacModel.slope * 34 +
      ransacModel.intercept,
  ];

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);

  const toSvgX = (x: number) =>
    padding +
    ((x - minX) / rangeX) *
      (width - padding * 2);

  const toSvgY = (y: number) =>
    height -
    padding -
    ((y - minY) / rangeY) *
      (height - padding * 2);

  return (
    <svg
      viewBox={"0 0 " + width + " " + height}
      className="s9c-modelPlot"
      role="img"
      aria-label="Least-squares and RANSAC model comparison"
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        className="s9c-plotBackground"
      />

      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        className="s9c-axis"
      />

      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        className="s9c-axis"
      />

      <line
        x1={toSvgX(minX)}
        y1={toSvgY(
          leastSquaresModel.slope * minX +
            leastSquaresModel.intercept,
        )}
        x2={toSvgX(maxX)}
        y2={toSvgY(
          leastSquaresModel.slope * maxX +
            leastSquaresModel.intercept,
        )}
        className="s9c-fittedLine"
      />

      <line
        x1={toSvgX(minX)}
        y1={toSvgY(
          ransacModel.slope * minX +
            ransacModel.intercept,
        )}
        x2={toSvgX(maxX)}
        y2={toSvgY(
          ransacModel.slope * maxX +
            ransacModel.intercept,
        )}
        className="s9c-fittedLine"
        strokeDasharray="6 4"
      />

      {points.map((point, index) => {
        const isSelected =
          index === selectedIndex;

        const isRansacInlier =
          pointToLineDistance(
            point,
            ransacModel,
          ) <= 2.5;

        return (
          <circle
            key={
              point.x +
              "-" +
              point.y +
              "-" +
              index
            }
            cx={toSvgX(point.x)}
            cy={toSvgY(point.y)}
            r={isSelected ? 6 : 3.5}
            className={
              isSelected
                ? "s9c-dataPoint selected"
                : isRansacInlier
                  ? "s9c-dataPoint"
                  : "s9c-dataPoint outlier"
            }
          >
            <title>
              Point {index + 1}:{" "}
              {isRansacInlier
                ? "RANSAC inlier"
                : "RANSAC outlier"}
            </title>
          </circle>
        );
      })}
    </svg>
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
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Formula({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="s9c-formula">
      {children}
    </div>
  );
}


function InlierOutlierPlot({
  points,
  model,
  classified,
  selectedIndex,
}: {
  points: Point2D[];
  model: {
    slope: number;
    intercept: number;
  };
  classified: ReturnType<typeof classifyPoints>;
  selectedIndex: number;
}) {
  const width = 300;
  const height = 300;
  const padding = 24;

  const allX = points.map((point) => point.x);
  const allY = points.map((point) => point.y);

  allX.push(2, 34);
  allY.push(
    model.slope * 2 + model.intercept,
    model.slope * 34 + model.intercept,
  );

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);

  const toSvgX = (x: number) =>
    padding +
    ((x - minX) / rangeX) *
      (width - padding * 2);

  const toSvgY = (y: number) =>
    height -
    padding -
    ((y - minY) / rangeY) *
      (height - padding * 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="s9c-modelPlot"
      role="img"
      aria-label="Inlier and outlier classification plot"
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        className="s9c-plotBackground"
      />

      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        className="s9c-axis"
      />

      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        className="s9c-axis"
      />

      <line
        x1={toSvgX(2)}
        y1={toSvgY(
          model.slope * 2 +
            model.intercept,
        )}
        x2={toSvgX(34)}
        y2={toSvgY(
          model.slope * 34 +
            model.intercept,
        )}
        className="s9c-fittedLine"
      />

      {classified.map((point, index) => {
        const predictedY =
          model.slope * point.x +
          model.intercept;

        const distance = pointToLineDistance(
          point,
          model,
        );

        /*
         * Projection of the point onto the fitted
         * line. This gives us the foot of the
         * perpendicular used to visualize the
         * geometric distance.
         */
        const denominator =
          model.slope ** 2 + 1;

        const projectedX =
          (point.x +
            model.slope *
              (point.y -
                model.intercept)) /
          denominator;

        const projectedY =
          model.slope *
            projectedX +
          model.intercept;

        return (
          <g key={`${point.x}-${point.y}-${index}`}>
            <line
              x1={toSvgX(point.x)}
              y1={toSvgY(point.y)}
              x2={toSvgX(projectedX)}
              y2={toSvgY(projectedY)}
              stroke="currentColor"
              strokeOpacity={
                index === selectedIndex
                  ? 0.8
                  : 0.25
              }
              strokeWidth={
                index === selectedIndex
                  ? 2
                  : 1
              }
              strokeDasharray="3 3"
            />

            <circle
              cx={toSvgX(point.x)}
              cy={toSvgY(point.y)}
              r={
                index === selectedIndex
                  ? 5
                  : 3.5
              }
              fill={
                point.isInlier
                  ? "currentColor"
                  : "none"
              }
              stroke="currentColor"
              strokeWidth={
                point.isInlier ? 1 : 2
              }
            />

            {index === selectedIndex && (
              <circle
                cx={toSvgX(projectedX)}
                cy={toSvgY(projectedY)}
                r="2.5"
                fill="currentColor"
              />
            )}

            <title>
              {`Point ${index + 1}: distance ${distance.toFixed(
                3,
              )}, ${
                point.isInlier
                  ? "inlier"
                  : "outlier"
              }`}
            </title>

            <title>
              {`Predicted y = ${predictedY.toFixed(
                3,
              )}`}
            </title>
          </g>
        );
      })}
    </svg>
  );
}

export default function Sprint9GroupDPage() {
  const points = useMemo(
    () => makeContaminatedLineDataset(),
    [],
  );

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const [threshold, setThreshold] =
    useState(2.5);

  const [ransacIteration, setRansacIteration] =
    useState(1);

  const leastSquaresModel = useMemo(
    () => fitLineLeastSquares(points),
    [points],
  );

  const rmse = useMemo(
    () =>
      calculateRmse(
        points,
        leastSquaresModel,
      ),
    [points, leastSquaresModel],
  );

  const classifiedPoints = useMemo(
    () =>
      classifyPoints(
        points,
        leastSquaresModel,
        threshold,
      ),
    [
      points,
      leastSquaresModel,
      threshold,
    ],
  );

  const inlierCount =
    classifiedPoints.filter(
      (point) => point.isInlier,
    ).length;

  const outlierCount =
    classifiedPoints.length -
    inlierCount;

  const selectedClassification =
    classifiedPoints[selectedIndex];

  const ransacResult = useMemo(
    () =>
      runRansac(
        points,
        threshold,
        40,
        42,
      ),
    [points, threshold],
  );

  const selectedRansacIteration =
    ransacResult.history[
      Math.min(
        ransacIteration - 1,
        ransacResult.history.length - 1,
      )
    ];

  const selectedPoint =
    points[selectedIndex];

  const selectedPredicted =
    leastSquaresModel.slope *
      selectedPoint.x +
    leastSquaresModel.intercept;

  const selectedResidual =
    selectedPoint.y -
    selectedPredicted;

  return (
    <main className="s7-page s9c-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">
          SPRINT 9 · GROUP D
        </div>

        <h1>Robust Fitting</h1>

        <p>
          What happens when some measurements
          are wrong? Start by seeing how
          outliers can pull an ordinary
          least-squares model away from the
          majority of the measurements.
        </p>
      </section>

      <section className="panel">
        <div className="s9c-groupNav">
          <button
            onClick={() =>
              navigateTo(
                "/learn/sprint-9/group-a",
              )
            }
          >
            A · Texture
          </button>

          <button
            onClick={() =>
              navigateTo(
                "/learn/sprint-9/group-b",
              )
            }
          >
            B · Grouping
          </button>

          <button
            onClick={() =>
              navigateTo(
                "/learn/sprint-9/group-c",
              )
            }
          >
            C · Model Fitting
          </button>

          <button className="active">
            D · Robust Fitting
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          D1 · OUTLIERS BREAK ORDINARY FITTING
        </div>

        <div className="s9c-twoColumn">
          <RobustModelPlot
            points={points}
            line={leastSquaresModel}
            selectedIndex={selectedIndex}
          />

          <div className="s9c-analysis">
            <h2>A few bad measurements can move the line</h2>

            <p>
              Most measurements follow approximately
              the relationship
              {" "}
              <strong>y = 0.75x + 8</strong>.
              Three measurements are deliberately
              contaminated. Least squares does not
              know which measurements are trustworthy,
              so it tries to compromise with all of
              them.
            </p>

            <Formula>
              y = mx + b
            </Formula>

            <Formula>
              min
              {" "}
              Σ(yᵢ − (mxᵢ + b))²
            </Formula>

            <div className="metricGrid">
              <Metric
                label="Measured points"
                value={`${points.length}`}
              />

              <Metric
                label="Least-squares slope"
                value={leastSquaresModel.slope.toFixed(
                  4,
                )}
              />

              <Metric
                label="Least-squares intercept"
                value={leastSquaresModel.intercept.toFixed(
                  4,
                )}
              />

              <Metric
                label="RMSE"
                value={rmse.toFixed(4)}
              />
            </div>

            <div className="s9c-equation">
              ŷ ={" "}
              {leastSquaresModel.slope.toFixed(
                4,
              )}
              x +{" "}
              {leastSquaresModel.intercept.toFixed(
                4,
              )}
            </div>

            <p>
              Select a measurement to inspect
              its contribution to the fitted model.
            </p>

            <div className="s9c-pointTable">
              {points.map((point, index) => (
                <button
                  key={index}
                  className={
                    index === selectedIndex
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setSelectedIndex(index)
                  }
                >
                  <span>
                    Point {index + 1}
                  </span>

                  <strong>
                    ({point.x.toFixed(1)},{" "}
                    {point.y.toFixed(1)})
                  </strong>
                </button>
              ))}
            </div>

            <div className="metricGrid">
              <Metric
                label="Selected measured y"
                value={selectedPoint.y.toFixed(
                  3,
                )}
              />

              <Metric
                label="Predicted y"
                value={selectedPredicted.toFixed(
                  3,
                )}
              />

              <Metric
                label="Residual"
                value={selectedResidual.toFixed(
                  3,
                )}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          D2 · RESIDUALS + INLIERS
        </div>

        <div className="s9c-twoColumn">
          <InlierOutlierPlot
            points={points}
            model={leastSquaresModel}
            classified={classifiedPoints}
            selectedIndex={selectedIndex}
          />

          <div className="s9c-analysis">
            <h2>Distance tells us whether a point belongs</h2>

            <p>
              A vertical residual measures error in the
              y-direction. For robust geometric fitting,
              we use the perpendicular distance from a
              measured point to the fitted line.
            </p>

            <Formula>
              mx - y + b = 0
            </Formula>

            <Formula>
              d =
              |mx - y + b|
              /
              √(m² + 1)
            </Formula>

            <Formula>
              inlier = 1 if d ≤ τ
            </Formula>

            <Formula>
              outlier = 0 if d &gt; τ
            </Formula>

            <div className="metricGrid">
              <Metric
                label="Threshold τ"
                value={threshold.toFixed(2)}
              />

              <Metric
                label="Inliers"
                value={`${inlierCount}`}
              />

              <Metric
                label="Outliers"
                value={`${outlierCount}`}
              />

              <Metric
                label="Selected distance"
                value={selectedClassification.distance.toFixed(
                  3,
                )}
              />
            </div>

            <div className="s9c-equation">
              τ = {threshold.toFixed(2)}
            </div>

            <label
              style={{
                display: "block",
                marginTop: "14px",
              }}
            >
              <span
                style={{
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Classification threshold
              </span>

              <input
                type="range"
                min="0.25"
                max="25"
                step="0.25"
                value={threshold}
                onChange={(event) =>
                  setThreshold(
                    Number(event.target.value),
                  )
                }
                style={{ width: "100%" }}
              />
            </label>

            <p>
              Increase τ to accept points farther
              from the fitted line. Decrease τ to make
              the definition of an inlier stricter.
            </p>

            <div className="s9c-pointTable">
              {classifiedPoints.map(
                (point, index) => (
                  <button
                    key={index}
                    className={
                      index === selectedIndex
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setSelectedIndex(index)
                    }
                  >
                    <span>
                      Point {index + 1}
                    </span>

                    <strong>
                      d ={" "}
                      {point.distance.toFixed(3)}
                    </strong>

                    <span>
                      {point.isInlier
                        ? "INLIER"
                        : "OUTLIER"}
                    </span>
                  </button>
                ),
              )}
            </div>

            <div className="metricGrid">
              <Metric
                label="Selected point"
                value={`(${selectedClassification.x.toFixed(
                  1,
                )}, ${selectedClassification.y.toFixed(
                  1,
                )})`}
              />

              <Metric
                label="Classification"
                value={
                  selectedClassification.isInlier
                    ? "INLIER"
                    : "OUTLIER"
                }
              />
            </div>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="sectionEyebrow">
          D3 · RANSAC STEP BY STEP
        </div>

        <div className="s9c-twoColumn">
          <RansacIterationPlot
            points={points}
            iteration={selectedRansacIteration}
            selectedIndex={selectedIndex}
          />

          <div className="s9c-analysis">
            <h2>Try many small hypotheses</h2>

            <p>
              RANSAC repeatedly samples two measured
              points, fits a line, checks every point,
              and counts how many measurements agree
              with that line.
            </p>

            <Formula>
              sample 2 points → fit line
            </Formula>

            <Formula>
              measure distance → classify points
            </Formula>

            <Formula>
              keep the model with the most inliers
            </Formula>

            <div className="metricGrid">
              <Metric
                label="Iteration"
                value={`${selectedRansacIteration.iteration} / ${ransacResult.history.length}`}
              />

              <Metric
                label="Sample points"
                value={selectedRansacIteration.sampleIndices
                  .map((index) => index + 1)
                  .join(" + ")}
              />

              <Metric
                label="Inliers"
                value={`${selectedRansacIteration.inlierCount}`}
              />

              <Metric
                label="Outliers"
                value={`${selectedRansacIteration.outlierIndices.length}`}
              />
            </div>

            <div className="s9c-equation">
              y ={" "}
              {selectedRansacIteration.model.slope.toFixed(
                4,
              )}
              x +{" "}
              {selectedRansacIteration.model.intercept.toFixed(
                4,
              )}
            </div>

            <label
              style={{
                display: "block",
                marginTop: "14px",
              }}
            >
              <span
                style={{
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                RANSAC iteration
              </span>

              <input
                type="range"
                min="1"
                max={ransacResult.history.length}
                step="1"
                value={ransacIteration}
                onChange={(event) =>
                  setRansacIteration(
                    Number(event.target.value),
                  )
                }
                style={{ width: "100%" }}
              />
            </label>

            <p>
              The highlighted sample points are the two
              measurements used to create this iteration's
              candidate line. The other points are then
              tested against it.
            </p>

            <div className="s9c-pointTable">
              {selectedRansacIteration.sampleIndices.map(
                (index) => (
                  <button
                    key={`sample-${index}`}
                    className={
                      index === selectedIndex
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setSelectedIndex(index)
                    }
                  >
                    <span>
                      Sample point {index + 1}
                    </span>

                    <strong>
                      (
                      {points[index].x.toFixed(1)}
                      ,{" "}
                      {points[index].y.toFixed(1)}
                      )
                    </strong>
                  </button>
                ),
              )}
            </div>

            <div className="metricGrid">
              <Metric
                label="Best inliers so far"
                value={`${Math.max(
                  ...ransacResult.history
                    .slice(
                      0,
                      selectedRansacIteration.iteration,
                    )
                    .map(
                      (item) =>
                        item.inlierCount,
                    ),
                )}`}
              />

              <Metric
                label="Final RANSAC model"
                value={`y = ${ransacResult.model.slope.toFixed(
                  4,
                )}x + ${ransacResult.model.intercept.toFixed(
                  4,
                )}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          D4 · LEAST SQUARES VS RANSAC
        </div>

        <div className="s9c-twoColumn">
          <ModelComparisonPlot
            points={points}
            leastSquaresModel={leastSquaresModel}
            ransacModel={ransacResult.model}
            selectedIndex={selectedIndex}
          />

          <div className="s9c-analysis">
            <h2>Two models, two objectives</h2>

            <p>
              Both methods fit a line to the same contaminated
              measurements, but they optimize different things.
              Least squares uses every residual. RANSAC searches
              for the largest group of measurements that agrees
              with one candidate model.
            </p>

            <Formula>
              LS: min Σ(yᵢ - (mxᵢ + b))²
            </Formula>

            <Formula>
              RANSAC: max Σ 1(dᵢ ≤ τ)
            </Formula>

            <div className="metricGrid">
              <Metric
                label="LS slope"
                value={leastSquaresModel.slope.toFixed(4)}
              />

              <Metric
                label="LS intercept"
                value={leastSquaresModel.intercept.toFixed(4)}
              />

              <Metric
                label="LS RMSE"
                value={rmse.toFixed(4)}
              />

              <Metric
                label="RANSAC slope"
                value={ransacResult.model.slope.toFixed(4)}
              />

              <Metric
                label="RANSAC intercept"
                value={ransacResult.model.intercept.toFixed(4)}
              />

              <Metric
                label="RANSAC inliers"
                value={`${ransacResult.inlierIndices.length}`}
              />

              <Metric
                label="RANSAC outliers"
                value={`${ransacResult.outlierIndices.length}`}
              />

              <Metric
                label="RANSAC inlier RMSE"
                value={calculateRmse(
                  ransacResult.inlierIndices.map(
                    (index) => points[index],
                  ),
                  ransacResult.model,
                ).toFixed(4)}
              />
            </div>

            <div className="s9c-equation">
              LS: y ={" "}
              {leastSquaresModel.slope.toFixed(4)}
              x +{" "}
              {leastSquaresModel.intercept.toFixed(4)}
            </div>

            <div className="s9c-equation">
              RANSAC: y ={" "}
              {ransacResult.model.slope.toFixed(4)}
              x +{" "}
              {ransacResult.model.intercept.toFixed(4)}
            </div>

            <p>
              The solid line is the least-squares model.
              The dashed line is the RANSAC model. The three
              deliberate contaminated measurements remain in
              the dataset, so RANSAC's all-point RMSE can still
              be large. Its meaningful robust error is the
              RMSE measured on the accepted inliers.
            </p>

            <div className="s9c-pointTable">
              {points.map((point, index) => (
                <button
                  key={index}
                  className={
                    index === selectedIndex
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setSelectedIndex(index)
                  }
                >
                  <span>
                    Point {index + 1}
                  </span>

                  <strong>
                    {ransacResult.inlierIndices.includes(
                      index,
                    )
                      ? "RANSAC INLIER"
                      : "RANSAC OUTLIER"}
                  </strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="sectionEyebrow">
          D5 · INDUSTRIAL ROBUST MEASUREMENT
        </div>

        <div className="s9c-twoColumn">
          <div className="s9c-modelPlot s9c-plotBackground">
            <svg
              viewBox="0 0 300 300"
              width="300"
              height="300"
              role="img"
              aria-label="Industrial robust measurement examples"
            >
              <rect
                x="0"
                y="0"
                width="300"
                height="300"
                className="s9c-plotBackground"
              />

              <line
                x1="45"
                y1="220"
                x2="255"
                y2="80"
                className="s9c-fittedLine"
              />

              <circle
                cx="70"
                cy="203"
                r="5"
                className="s9c-dataPoint"
              />
              <circle
                cx="105"
                cy="180"
                r="5"
                className="s9c-dataPoint"
              />
              <circle
                cx="140"
                cy="157"
                r="5"
                className="s9c-dataPoint"
              />
              <circle
                cx="175"
                cy="133"
                r="5"
                className="s9c-dataPoint"
              />
              <circle
                cx="210"
                cy="110"
                r="5"
                className="s9c-dataPoint"
              />

              <circle
                cx="130"
                cy="55"
                r="6"
                className="s9c-dataPoint outlier"
              />
              <circle
                cx="225"
                cy="235"
                r="6"
                className="s9c-dataPoint outlier"
              />
            </svg>
          </div>

          <div className="s9c-analysis">
            <h2>Robust fitting turns noisy measurements into useful geometry</h2>

            <p>
              Industrial vision rarely produces perfectly clean
              measurements. Reflections, defective pixels, missing
              edges, incorrect matches, vibration, and partial
              occlusion can introduce measurements that do not belong
              to the structure being measured.
            </p>

            <div className="metricGrid">
              <Metric
                label="Surface inspection"
                value="Reject spurious measurements"
              />

              <Metric
                label="Dimensional measurement"
                value="Fit reliable geometry"
              />

              <Metric
                label="Feature matching"
                value="Handle incorrect matches"
              />

              <Metric
                label="Alignment"
                value="Estimate stable geometry"
              />
            </div>

            <Formula>
              useful evidence = consensus measurements
            </Formula>

            <Formula>
              contamination = measurements rejected by the model
            </Formula>

            <p>
              The learning progression is now complete:
              identify contaminated measurements, measure their
              distance from a model, classify inliers and outliers,
              repeatedly test small hypotheses with RANSAC, and
              compare the result with ordinary least-squares fitting.
            </p>

            <div className="s9c-equation">
              Texture → Grouping → Model Fitting → Robust Fitting
            </div>

            <p>
              In a production inspection system, these steps can
              become part of a larger pipeline for surface inspection,
              geometric measurement, alignment, defect detection,
              and quality control.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
