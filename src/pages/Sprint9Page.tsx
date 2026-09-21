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
    title: "Texture Representation",
    description:
      "Mean, variance, local variation, spatial texture, and Local Binary Patterns.",
    status: "active",
  },
  {
    id: "B",
    title: "Grouping + Connected Structures",
    description:
      "Move from individual texture measurements toward regions and connected image structures.",
    status: "active",
  },
  {
    id: "C",
    title: "Model Fitting",
    description:
      "Fit mathematical models to measured image evidence, inspect residual error, and perform geometric measurement.",
    status: "active",
  },
  {
    id: "D",
    title: "Robust Fitting",
    description:
      "Separate useful evidence from outliers and use robust models when measurements are contaminated.",
    status: "active",
  },
];

export default function Sprint9Page() {
  return (
    <main className="s7-page">
      <section className="s7b-hero">
        <div className="sectionEyebrow">
          SPRINT 9
        </div>

        <h1>
          Texture + Grouping + Model Fitting + Robust Fitting
        </h1>

        <p>
          Move beyond individual local features
          toward describing regions, grouping
          image evidence, and fitting mathematical
          models to what the image contains.
        </p>
      </section>

      <section className="panel">
        <div className="s7-groupSwitcher">
          <div>
            <div className="sectionEyebrow">
              CHOOSE THE EXPERIMENT
            </div>

            <h2>
              Sprint 9 laboratory
            </h2>

            <p>
              Move from texture representation
              through grouping and model fitting
              to robust fitting with outliers.

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
                disabled={
                  group.status === "planned"
                }
                onClick={() => {
                  if (group.status !== "active") {
                    return;
                  }

                  navigateTo(
                    `/learn/sprint-9/group-${group.id.toLowerCase()}`,
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
          <span>PIXELS</span>
          <b>→</b>
          <span>STATISTICS</span>
          <b>→</b>
          <span>LOCAL VARIATION</span>
          <b>→</b>
          <span>SPATIAL TEXTURE</span>
          <b>→</b>
          <span>TEXTURE DESCRIPTOR</span>
          <b>→</b>
          <span>GROUPS</span>
          <b>→</b>
          <span>MODELS</span>
        </div>
      </section>

      <section className="panel">
        <div className="sectionEyebrow">
          GROUPS
        </div>

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
                  `/learn/sprint-9/group-${group.id.toLowerCase()}`,
                );
              }}
            >
              <div className="s9-groupNumber">
                {group.id}
              </div>

              <div>
                <h3>
                  {group.title}
                </h3>

                <p>
                  {group.description}
                </p>
              </div>

              <span
                className="s9-groupStatus"
              >
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

        <h2>
          Why this stage matters
        </h2>

        <div className="s9-contextGrid">
          <div>
            <strong>
              Surface inspection
            </strong>
            <span>
              Describe normal and abnormal
              surface patterns.
            </span>
          </div>

          <div>
            <strong>
              Defect detection
            </strong>
            <span>
              Identify regions whose texture
              differs from expected material
              appearance.
            </span>
          </div>

          <div>
            <strong>
              Geometric reasoning
            </strong>
            <span>
              Connect image evidence to
              mathematical models.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
