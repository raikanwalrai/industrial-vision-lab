import Sprint3 from "../Sprint3";

export default function Sprint3Page() {
  return (
    <div className="learningPage">
      <header className="learningPageHeader">
        <div className="sectionEyebrow">SPRINT 3</div>
        <h1>Interactive Convolution</h1>
        <p>
          Move a kernel across an image, inspect each local calculation,
          and connect the arithmetic to the complete output image.
        </p>
      </header>

      <div className="learningPageContent">
        <Sprint3 />
      </div>
    </div>
  );
}
