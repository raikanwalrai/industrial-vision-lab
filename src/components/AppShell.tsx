import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
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
          <button className="topNavLink">LEARN</button>
          <button className="topNavLink">LABS</button>
          <button className="topNavLink">RESEARCH</button>
          <button className="topNavLink">ABOUT</button>
        </nav>
      </header>

      <main className="appContent">
        {children}
      </main>
    </div>
  );
}
