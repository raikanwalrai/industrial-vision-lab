import { useState } from "react";

const groups = [
  ["A", "Noise Generation", "Create controlled Gaussian and salt-and-pepper degradation."],
  ["B", "Noise Measurement", "Measure error with MSE, RMSE, and visual error maps."],
  ["C", "Restoration Filters", "Compare mean, Gaussian, and median restoration."],
  ["D", "Controlled Comparison", "Apply different restoration rules to the same noisy image."],
  ["E", "Illumination", "Understand uneven lighting and background correction."],
  ["F", "Final Verification", "Verify the mathematics and complete degradation pipeline."],
];

export default function Sprint5Page() {
  const [active, setActive] = useState("A");
  const current = groups.find((g) => g[0] === active)!;

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
            The goal is not simply to make an image look cleaner. The goal is
            to understand <strong>what changed, why it changed, and how
            restoration can recover useful information.</strong>
          </p>
        </div>

        <div className="s5-introCard s5-modelCard">
          <div className="s5-label">CORE MODEL</div>
          <div className="s5-equation">I<sub>noisy</sub> = I + N</div>
          <div className="s5-equation">D = I<sub>noisy</sub> − I</div>
          <div className="s5-equation">I<sub>restored</sub> ≈ restore(I<sub>noisy</sub>)</div>
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
          <div className="s5-current">GROUP {active} · READY</div>
        </div>

        <div className="s5-groupGrid">
          {groups.map(([letter, title, description]) => (
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
            <div className="s5-label">NEXT EXPERIMENT</div>
            <h3>{current[1]}</h3>
            <p>{current[2]}</p>
          </div>
        </div>
      </section>

      <section className="s5-concepts">
        <div className="s5-label">MATHEMATICAL ANCHORS</div>
        <h2>Three ideas we will keep returning to</h2>
        <div className="s5-conceptGrid">
          <article><span>01</span><strong>Noise</strong><p>Model how unwanted variation is added to an image.</p></article>
          <article><span>02</span><strong>Error</strong><p>Turn visual degradation into measurable quantities such as MSE and RMSE.</p></article>
          <article><span>03</span><strong>Restoration</strong><p>Reduce degradation while preserving useful image structure.</p></article>
        </div>
      </section>

      <section className="s5-ready">
        <div>
          <div className="s5-label">SPRINT 5 STATUS</div>
          <h2>Ready for Group A — Noise Generation</h2>
          <p>
            The page shell is complete. The next slice will add the actual
            noise generator without changing the verified Sprint 3 or Sprint 4 mathematics.
          </p>
        </div>
        <div className="s5-readyBadge">
          <strong>● CURRENT</strong>
          <span>Group A next</span>
        </div>
      </section>
    </div>
  );
}
