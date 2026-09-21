import { navigateTo } from "../navigation";

type Group = {
  id: string;
  title: string;
  description: string;
  status: "active" | "planned";
};

const groups: Group[] = [
  {
    id: "A",
    title: "Coordinate Systems + Pinhole Camera",
    description:
      "Build the camera model from 3D world coordinates through camera coordinates to a 2D image.",
    status: "active",
  },
  {
    id: "B",
    title: "Perspective Projection + Intrinsics",
    description:
      "Understand focal length, principal point, pixel coordinates, and the intrinsic matrix.",
    status: "active",
  },
  {
    id: "C",
    title: "Extrinsics + Full Camera Model",
    description:
      "Understand camera pose, rotation, translation, and the complete projection pipeline.",
    status: "active",
  },
  {
    id: "D",
    title: "Distortion + Calibration + Reprojection",
    description:
      "Understand lens distortion, calibration, and how reprojection error measures calibration quality.",
    status: "planned",
  },
];

export default function Sprint10Page() {
  return (
    <main className="s7-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">SPRINT 10</div>

        <h1>Camera Models + Calibration</h1>

        <p>
          Understand how a 3D scene becomes a 2D image, then build toward
          camera calibration and measurable projection error.
        </p>
      </section>

      <section className="panel">
        <div className="s7-groupSwitcher">
          <div>
            <div className="sectionEyebrow">
              CHOOSE THE EXPERIMENT
            </div>

            <h2>Sprint 10 laboratory</h2>

            <p>
              Start with coordinate systems and the pinhole camera. Later
              groups add intrinsics, camera pose, distortion, and calibration.
            </p>
          </div>

          <div className="s7-groupButtons">
            {groups.map((group) => (
              <button
                key={group.id}
                className={
                  group.status === "active"
                    ? "active"
                    : ""
                }
                disabled={group.status === "planned"}
                onClick={() => {
                  if (group.status !== "active") {
                    return;
                  }

                  navigateTo(
                    `/learn/sprint-10/group-${group.id.toLowerCase()}`,
                  );
                }}
              >
                {group.id} · {group.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          LEARNING PROGRESSION
        </div>

        <div className="s7b-flow">
          <span>3D WORLD</span>
          <b>→</b>
          <span>CAMERA FRAME</span>
          <b>→</b>
          <span>PERSPECTIVE</span>
          <b>→</b>
          <span>INTRINSICS</span>
          <b>→</b>
          <span>EXTRINSICS</span>
          <b>→</b>
          <span>DISTORTION</span>
          <b>→</b>
          <span>CALIBRATION</span>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">GROUPS</div>

        <div className="s9-groupCards">
          {groups.map((group) => (
            <article
              key={group.id}
              className={
                group.status === "active"
                  ? "s9-groupCard available"
                  : "s9-groupCard"
              }
              onClick={() => {
                if (group.status !== "active") {
                  return;
                }

                navigateTo(
                  `/learn/sprint-10/group-${group.id.toLowerCase()}`,
                );
              }}
            >
              <div className="s9-groupNumber">
                {group.id}
              </div>

              <div>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </div>

              <span className="s9-groupStatus">
                {group.status === "active"
                  ? "AVAILABLE"
                  : "PLANNED"}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          INDUSTRIAL CONTEXT
        </div>

        <h2>Why camera models matter</h2>

        <div className="s9-contextGrid">
          <div>
            <strong>Dimensional inspection</strong>
            <span>
              Connect image measurements to physical geometry.
            </span>
          </div>

          <div>
            <strong>Robot and camera alignment</strong>
            <span>
              Relate a camera's coordinate frame to the scene being measured.
            </span>
          </div>

          <div>
            <strong>Calibration</strong>
            <span>
              Quantify how well a mathematical camera model explains observed
              image points.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
