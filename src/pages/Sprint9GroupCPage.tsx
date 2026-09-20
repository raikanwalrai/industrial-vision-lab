import { useMemo, useState } from "react";
import { navigateTo } from "../navigation";
import {
  fitCircleMeanCenter,
  fitLineLeastSquares,
  lineAngleDegrees,
  makeCircleDataset,
  makeLineDataset,
  pointToLineDistance,
  type Point2D,
} from "../modelFittingMath";

type PlotProps = {
  points: Point2D[];
  line?: {
    slope: number;
    intercept: number;
  };
  circle?: {
    cx: number;
    cy: number;
    radius: number;
  };
  selectedIndex?: number;
};

function ModelPlot({
  points,
  line,
  circle,
  selectedIndex,
}: PlotProps) {
  const width = 300;
  const height = 300;
  const padding = 24;

  const allX = points.map((p) => p.x);
  const allY = points.map((p) => p.y);

  if (line) {
    allX.push(2, 30);
    allY.push(
      line.slope * 2 + line.intercept,
      line.slope * 30 + line.intercept,
    );
  }

  if (circle) {
    allX.push(
      circle.cx - circle.radius,
      circle.cx + circle.radius,
    );
    allY.push(
      circle.cy - circle.radius,
      circle.cy + circle.radius,
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

  const lineY1 = line
    ? line.slope * minX + line.intercept
    : 0;

  const lineY2 = line
    ? line.slope * maxX + line.intercept
    : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="s9c-modelPlot"
      role="img"
      aria-label="Model fitting plot"
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
          y1={toSvgY(lineY1)}
          x2={toSvgX(maxX)}
          y2={toSvgY(lineY2)}
          className="s9c-fittedLine"
        />
      )}

      {circle && (
        <circle
          cx={toSvgX(circle.cx)}
          cy={toSvgY(circle.cy)}
          r={
            (circle.radius / rangeX) *
            (width - padding * 2)
          }
          className="s9c-fittedCircle"
        />
      )}

      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={toSvgX(point.x)}
          cy={toSvgY(point.y)}
          r={index === selectedIndex ? 5 : 3.5}
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

export default function Sprint9GroupCPage() {
  const linePoints = useMemo(
    () => makeLineDataset(),
    [],
  );

  const circlePoints = useMemo(
    () => makeCircleDataset(),
    [],
  );

  const lineFit = useMemo(
    () => fitLineLeastSquares(linePoints),
    [linePoints],
  );

  const circleFit = useMemo(
    () => fitCircleMeanCenter(circlePoints),
    [circlePoints],
  );

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const selectedPoint =
    linePoints[selectedIndex];

  const selectedDistance =
    pointToLineDistance(
      selectedPoint,
      lineFit.model,
    );

  const angle =
    lineAngleDegrees(lineFit.model);

  return (
    <main className="s7-page s9c-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">
          SPRINT 9 · GROUP C
        </div>

        <h1>Model Fitting</h1>

        <p>
          Turn measured image evidence into
          mathematical models. Start with a
          least-squares line, inspect residual
          error, then fit a geometric circle.
        </p>
      </section>

      <section className="panel">
        <div className="s9c-groupNav">
          <button
            onClick={() =>
              navigateTo("/learn/sprint-9/group-a")
            }
          >
            A · Texture
          </button>

          <button
            onClick={() =>
              navigateTo("/learn/sprint-9/group-b")
            }
          >
            B · Grouping
          </button>

          <button className="active">
            C · Model Fitting
          </button>

          <button disabled>
            D · Robust Fitting
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          C1 · MEASURED POINTS
        </div>

        <div className="s9c-twoColumn">
          <div>
            <ModelPlot
              points={linePoints}
              selectedIndex={selectedIndex}
            />
          </div>

          <div className="s9c-analysis">
            <h2>Measurements contain noise</h2>

            <p>
              In an industrial vision system,
              detected edge or feature points
              rarely lie perfectly on a mathematical
              model. Model fitting finds the model
              that best explains the measurements.
            </p>

            <div className="metricGrid">
              <Metric
                label="Measured points"
                value={`${linePoints.length}`}
              />

              <Metric
                label="Approximate relationship"
                value="y ≈ 0.75x + 8"
              />
            </div>

            <div className="s9c-pointTable">
              {linePoints.map((point, index) => (
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
                  <span>Point {index + 1}</span>
                  <strong>
                    ({point.x.toFixed(1)},{" "}
                    {point.y.toFixed(1)})
                  </strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          C2 · LEAST-SQUARES LINE
        </div>

        <div className="s9c-twoColumn">
          <ModelPlot
            points={linePoints}
            line={lineFit.model}
            selectedIndex={selectedIndex}
          />

          <div className="s9c-analysis">
            <h2>Find the best line</h2>

            <p>
              We want a line whose predictions
              are as close as possible to the
              measured values.
            </p>

            <Formula>
              y = mx + b
            </Formula>

            <Formula>
              m =
              {" "}
              Σ(xᵢ − x̄)(yᵢ − ȳ)
              {" "}
              /
              {" "}
              Σ(xᵢ − x̄)²
            </Formula>

            <Formula>
              b = ȳ − mx̄
            </Formula>

            <div className="metricGrid">
              <Metric
                label="Slope m"
                value={lineFit.model.slope.toFixed(4)}
              />

              <Metric
                label="Intercept b"
                value={lineFit.model.intercept.toFixed(4)}
              />

              <Metric
                label="Line angle"
                value={`${angle.toFixed(2)}°`}
              />
            </div>

            <div className="s9c-equation">
              ŷ ={" "}
              {lineFit.model.slope.toFixed(4)}
              x +{" "}
              {lineFit.model.intercept.toFixed(4)}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          C3 · RESIDUALS + ERROR
        </div>

        <div className="s9c-twoColumn">
          <div className="s9c-analysis">
            <h2>How wrong is each prediction?</h2>

            <p>
              A residual is the difference between
              the measured value and the value
              predicted by the fitted model.
            </p>

            <Formula>
              eᵢ = yᵢ − ŷᵢ
            </Formula>

            <Formula>
              SSE = Σeᵢ²
            </Formula>

            <Formula>
              MSE = SSE / n
            </Formula>

            <Formula>
              RMSE = √MSE
            </Formula>

            <div className="metricGrid">
              <Metric
                label="SSE"
                value={lineFit.sse.toFixed(5)}
              />

              <Metric
                label="MSE"
                value={lineFit.mse.toFixed(5)}
              />

              <Metric
                label="RMSE"
                value={lineFit.rmse.toFixed(5)}
              />

              <Metric
                label="R²"
                value={lineFit.rSquared.toFixed(5)}
              />
            </div>
          </div>

          <div>
            <div className="s9c-residualList">
              {lineFit.residuals.map(
                (residual, index) => (
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
                      P{index + 1}
                    </span>

                    <span>
                      measured{" "}
                      {residual.y.toFixed(2)}
                    </span>

                    <span>
                      predicted{" "}
                      {residual.predictedY.toFixed(2)}
                    </span>

                    <strong>
                      e ={" "}
                      {residual.error.toFixed(3)}
                    </strong>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          C4 · GEOMETRIC DISTANCE
        </div>

        <div className="s9c-twoColumn">
          <ModelPlot
            points={linePoints}
            line={lineFit.model}
            selectedIndex={selectedIndex}
          />

          <div className="s9c-analysis">
            <h2>Vertical error vs geometric error</h2>

            <p>
              The ordinary residual measures
              vertical error. For geometric
              measurement we can instead calculate
              the perpendicular distance from a
              point to the fitted line.
            </p>

            <Formula>
              ax + by + c = 0
            </Formula>

            <Formula>
              d =
              |ax + by + c|
              /
              √(a² + b²)
            </Formula>

            <div className="metricGrid">
              <Metric
                label="Selected point"
                value={`(${selectedPoint.x.toFixed(
                  2,
                )}, ${selectedPoint.y.toFixed(2)})`}
              />

              <Metric
                label="Predicted y"
                value={lineFit.residuals[
                  selectedIndex
                ].predictedY.toFixed(4)}
              />

              <Metric
                label="Residual"
                value={lineFit.residuals[
                  selectedIndex
                ].error.toFixed(4)}
              />

              <Metric
                label="Perpendicular distance"
                value={selectedDistance.toFixed(4)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          C5 · CIRCLE FITTING
        </div>

        <div className="s9c-twoColumn">
          <ModelPlot
            points={circlePoints}
            circle={circleFit.model}
          />

          <div className="s9c-analysis">
            <h2>Fit a circular feature</h2>

            <p>
              Circular features are common in
              industrial inspection: holes, shafts,
              bearings, bores, gears, and round
              components.
            </p>

            <Formula>
              (x − a)² + (y − b)² = r²
            </Formula>

            <p>
              This educational fit estimates the
              center from the mean measured
              coordinates, then estimates the radius
              from the mean distance to that center.
            </p>

            <div className="metricGrid">
              <Metric
                label="Center x"
                value={circleFit.model.cx.toFixed(4)}
              />

              <Metric
                label="Center y"
                value={circleFit.model.cy.toFixed(4)}
              />

              <Metric
                label="Radius"
                value={circleFit.model.radius.toFixed(4)}
              />

              <Metric
                label="Diameter"
                value={(
                  circleFit.model.radius * 2
                ).toFixed(4)}
              />

              <Metric
                label="RMSE"
                value={circleFit.rmse.toFixed(5)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          C6 · INDUSTRIAL MEASUREMENT
        </div>

        <div className="s9c-industrialGrid">
          <article>
            <strong>Alignment</strong>
            <p>
              Fit a line through measured edge
              points to estimate orientation and
              straightness.
            </p>
          </article>

          <article>
            <strong>Hole inspection</strong>
            <p>
              Fit a circle to detected boundary
              points and estimate center and
              diameter.
            </p>
          </article>

          <article>
            <strong>Quality control</strong>
            <p>
              Residual error tells us how closely
              the measured feature agrees with the
              expected geometric model.
            </p>
          </article>

          <article>
            <strong>Next: robust fitting</strong>
            <p>
              Ordinary least squares can be strongly
              affected by outliers. Group D will
              introduce robust fitting ideas.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
