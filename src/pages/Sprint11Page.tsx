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
    title: "Stereo Geometry",
    description:
      "Understand two cameras, baseline, corresponding points, disparity, and depth from disparity.",
    status: "active",
  },
  {
    id: "B",
    title: "Epipolar Geometry",
    description:
      "Understand corresponding points, epipolar lines, the fundamental matrix, and the essential matrix.",
    status: "active",
  },
  {
    id: "C",
    title: "Stereo Reconstruction",
    description:
      "Build toward rectification, disparity maps, depth reconstruction, and 3D point recovery.",
    status: "active",
  },
  {
    id: "D",
    title: "Multi-View Geometry",
    description:
      "Build intuition for triangulation, camera motion, bundle adjustment, and reprojection consistency.",
    status: "planned",
  },
];

export default function Sprint11Page() {
  return (
    <main className="s7-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">SPRINT 11</div>

        <h1>Stereo + Multi-View Geometry</h1>

        <p>
          Move from one calibrated camera to multiple cameras. Learn how
          disparity, epipolar geometry, and triangulation allow a vision
          system to recover depth and 3D structure.
        </p>
      </section>

      <section className="panel">
        <div className="s7-groupSwitcher">
          <div>
            <div className="sectionEyebrow">
              CHOOSE THE EXPERIMENT
            </div>

            <h2>Sprint 11 laboratory</h2>

            <p>
              Start with two-camera stereo geometry. Later groups will add
              epipolar constraints, stereo reconstruction, and multi-view
              geometry.
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
                    `/learn/sprint-11/group-${group.id.toLowerCase()}`,
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
          <span>TWO CAMERAS</span>
          <b>→</b>
          <span>DISPARITY</span>
          <b>→</b>
          <span>DEPTH</span>
          <b>→</b>
          <span>EPIPOLAR GEOMETRY</span>
          <b>→</b>
          <span>TRIANGULATION</span>
          <b>→</b>
          <span>3D RECONSTRUCTION</span>
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
                  `/learn/sprint-11/group-${group.id.toLowerCase()}`,
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

        <h2>Why stereo vision matters</h2>

        <div className="s9-contextGrid">
          <div>
            <strong>3D inspection</strong>
            <span>
              Recover physical depth from multiple camera observations.
            </span>
          </div>

          <div>
            <strong>Dimensional measurement</strong>
            <span>
              Estimate distances, heights, and part geometry in physical
              units.
            </span>
          </div>

          <div>
            <strong>Robot perception</strong>
            <span>
              Estimate object position and depth for picking, localization,
              and machine guidance.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
