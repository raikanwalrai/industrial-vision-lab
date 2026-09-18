import { useState } from "react";

const groups = [
  ["A", "RGB Fundamentals", "Understand colour pixels, channels, and RGB vectors."],
  ["B", "Channel Separation", "Separate, inspect, and recombine R, G, and B channels."],
  ["C", "Colour Spaces", "Understand RGB, grayscale, HSV, and HSL representations."],
  ["D", "Colour Manipulation", "Explore brightness, contrast, saturation, and channel operations."],
  ["E", "Image Formation", "Connect illumination, reflectance, and sensor response."],
  ["F", "Colour + Illumination", "See how lighting changes the observed colour image."],
  ["G", "Final Verification", "Run deterministic checks for the complete Sprint 6 pipeline."],
] as const;

export default function Sprint6Page() {
  const [active, setActive] = useState("A");
  const activeGroup = groups.find((g) => g[0] === active) ?? groups[0];

  return (
    <div className="sprintPage s6-page">
      <section className="sprintHero">
        <div className="sectionEyebrow">SPRINT 6 · COLOUR VISION</div>
        <h1>Colour + Image Formation</h1>
        <p>
          Move from single-channel grayscale images to colour images and
          understand how illumination and reflectance create what a camera observes.
        </p>
        <div className="sprintMetaRow">
          <span className="statusPill statusCurrent">● CURRENT</span>
          <span>7 learning groups</span>
          <span>RGB · Colour Spaces · Image Formation</span>
        </div>
      </section>

      <section className="s6-roadmap">
        <div className="sectionEyebrow">SPRINT 6 ROADMAP</div>
        <div className="s6-groupGrid">
          {groups.map(([id, title, description]) => (
            <button
              key={id}
              type="button"
              className={`s6-groupCard ${active === id ? "s6-groupCardActive" : ""}`}
              onClick={() => setActive(id)}
            >
              <span className="s6-groupNumber">{id}</span>
              <span className="s6-groupTitle">{title}</span>
              <span className="s6-groupDescription">{description}</span>
              <span className="s6-groupStatus">{active === id ? "CURRENT" : "PLANNED"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="s6-currentCard">
        <div className="s6-currentBadge">{activeGroup[0]}</div>
        <div>
          <div className="sectionEyebrow">CURRENT EXPERIMENT</div>
          <h2>{activeGroup[1]}</h2>
          <p>{activeGroup[2]}</p>
        </div>
        <span className="statusPill statusPlanned">PLANNED</span>
      </section>

      <section className="s6-foundation">
        <div>
          <div className="sectionEyebrow">WHY SPRINT 6?</div>
          <h2>From one intensity value to a colour vector</h2>
          <p>
            Earlier sprints represented a pixel with one grayscale intensity.
            A colour pixel carries three channel values: red, green, and blue.
          </p>
        </div>
        <div className="s6-equation">
          <div className="s6-equationLabel">GRAYSCALE</div>
          <code>I(x,y)</code>
          <div className="s6-arrow">→</div>
          <div className="s6-equationLabel">RGB</div>
          <code>[ R(x,y), G(x,y), B(x,y) ]ᵀ</code>
        </div>
      </section>

      <section className="s6-learningLoop">
        <div className="sectionEyebrow">LEARNING LOOP</div>
        <div className="s6-loopGrid">
          <div><b>01 · REPRESENT</b><span>How is colour stored at a pixel?</span></div>
          <div><b>02 · SEPARATE</b><span>What does each colour channel contain?</span></div>
          <div><b>03 · TRANSFORM</b><span>Why do we use different colour spaces?</span></div>
          <div><b>04 · FORM</b><span>How does lighting become an observed image?</span></div>
        </div>
      </section>

      <section className="s6-gate">
        <div className="sectionEyebrow">SPRINT 6 STARTING GATE</div>
        <h2>Page + navigation foundation</h2>
        <p>
          This first slice establishes the Sprint 6 learning page. Numerical
          colour labs will be implemented one verified group at a time.
        </p>
        <div className="s6-gateStatus">● 6.0 IN PROGRESS</div>
      </section>
    </div>
  );
}
