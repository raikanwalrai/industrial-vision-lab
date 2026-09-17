export default function Sprint4Page() {
  return (
    <div className="learningPage sprint4Page">
      <header className="learningPageHeader">
        <div className="sectionEyebrow">SPRINT 4</div>

        <h1>Custom Kernels + Enhancement</h1>

        <p>
          Build your own image filters, understand how kernel values control
          image response, and use filtering to enhance important visual
          structures.
        </p>
      </header>

      <section className="sprint4Overview">
        <div className="sprint4Intro">
          <span className="sectionEyebrow">WHAT YOU WILL LEARN</span>

          <h2>From using filters to designing them</h2>

          <p>
            In Sprint 3, you learned how a kernel moves across an image and
            how every output pixel is calculated. Sprint 4 takes the next
            step: instead of only choosing an existing kernel, you will
            construct and experiment with your own.
          </p>

          <p>
            You will then connect the numbers inside a kernel to its overall
            behaviour — smoothing, detecting structure, sharpening, and
            enhancing an image.
          </p>
        </div>

        <div className="sprint4Roadmap">
          <div className="sprint4RoadmapItem">
            <span>01</span>
            <div>
              <b>Custom Kernel</b>
              <small>Build and edit kernel values</small>
            </div>
          </div>

          <div className="sprint4RoadmapItem">
            <span>02</span>
            <div>
              <b>Kernel Mathematics</b>
              <small>Sum, normalization and response</small>
            </div>
          </div>

          <div className="sprint4RoadmapItem">
            <span>03</span>
            <div>
              <b>Sharpening</b>
              <small>Make important structures stand out</small>
            </div>
          </div>

          <div className="sprint4RoadmapItem">
            <span>04</span>
            <div>
              <b>Unsharp + High-Boost</b>
              <small>Understand enhancement mathematically</small>
            </div>
          </div>
        </div>
      </section>

      <section className="sprint4Principle">
        <div className="sectionEyebrow">CORE IDEA</div>

        <div className="sprint4Equation">
          <span>IMAGE</span>
          <b>×</b>
          <span>KERNEL</span>
          <b>→</b>
          <span>RESPONSE</span>
        </div>

        <p>
          A kernel is a small mathematical rule. Changing its numbers changes
          what the image responds to.
        </p>
      </section>

      <section className="sprint4Status">
        <span className="statusDot" />
        <div>
          <b>Sprint 4 is ready</b>
          <span>
            Next: Group A — build and experiment with a custom kernel.
          </span>
        </div>
      </section>
    </div>
  );
}
