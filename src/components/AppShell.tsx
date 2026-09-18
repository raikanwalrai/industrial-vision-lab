import { useState, type ReactNode } from "react";
import { curriculum, navigateTo, type Sprint } from "../navigation";

type AppShellProps = {
  children: ReactNode;
};

function SprintMenu({
  sprints,
  onSelect,
}: {
  sprints: Sprint[];
  onSelect: (sprint: Sprint) => void;
}) {
  return (
    <div className="learnMenu" role="menu">
      <div className="learnMenuHeader">
        <span className="sectionEyebrow">CURRICULUM</span>
        <b>Industrial Vision Learning Path</b>
      </div>

      <div className="learnMenuGrid">
        {sprints.map((sprint) => (
          <button
            key={sprint.number}
            className={`sprintMenuItem sprint-${sprint.status}`}
            onClick={() => {
              if (sprint.status !== "planned") {
                onSelect(sprint);
              }
            }}
            disabled={sprint.status === "planned"}
            role="menuitem"
            aria-label={
              sprint.status === "planned"
                ? `Sprint ${sprint.number}: planned`
                : `Sprint ${sprint.number}: ${sprint.title}`
            }
          >
            <span className="sprintMenuNumber">
              {String(sprint.number).padStart(2, "0")}
            </span>

            <span className="sprintMenuText">
              <b>Sprint {sprint.number}</b>
              <span>{sprint.title}</span>
            </span>

            <span className="sprintMenuStatus">
              {sprint.status === "complete"
                ? "✓"
                : sprint.status === "current"
                  ? "●"
                  : "→"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const [learnOpen, setLearnOpen] = useState(false);

  function handleSprintSelect(sprint: Sprint) {
    setLearnOpen(false);

    if (sprint.number === 1) {
      navigateTo("/");
      return;
    }

    if (sprint.number === 2) {
      navigateTo("/");

      window.setTimeout(() => {
        const target = document.getElementById("sprint-2-verification");

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 150);

      return;
    }

    if (sprint.number === 3) {
      navigateTo("/learn/sprint-3");
      return;
    }

    if (sprint.number === 4) {
      navigateTo("/learn/sprint-4");
    }


    if (sprint.number === 5) {
      navigateTo("/learn/sprint-5");
    }
    if (sprint.number === 6) {
      navigateTo("/learn/sprint-6");
      return;
    }
  }



  return (
    <div className="appShell">
      <header className="topNav">
        <div className="brand">
          <div className="brandMark">IV</div>

          <div>
            <div className="brandName">Industrial Vision Lab</div>
            <div className="brandSubtitle">
              Learn · Experiment · Understand
            </div>
          </div>
        </div>

        <nav className="topNavLinks" aria-label="Main navigation">
          <button className="topNavLink active">HOME</button>

          <div className="navMenu">
            <button
              className={`topNavLink ${learnOpen ? "menuOpen" : ""}`}
              onClick={() => setLearnOpen((open) => !open)}
              aria-expanded={learnOpen}
              aria-haspopup="menu"
            >
              LEARN <span className="navChevron">▼</span>
            </button>

            {learnOpen && (
              <SprintMenu
                sprints={curriculum}
                onSelect={handleSprintSelect}
              />
            )}
          </div>

          <button className="topNavLink">LABS</button>
          <button className="topNavLink">RESEARCH</button>
          <button className="topNavLink">ABOUT</button>
        </nav>
      </header>

      <main className="appContent">{children}</main>
    </div>
  );
}
