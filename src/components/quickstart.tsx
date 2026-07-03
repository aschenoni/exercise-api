"use client";

import { useState, type ReactNode } from "react";
import { CopyButton } from "./copy-button";

export interface QuickstartTab {
  id: string;
  label: string;
  /** Raw snippet for the clipboard. */
  code: string;
  /** Server-highlighted snippet for display. */
  rendered: ReactNode;
  /** Comment-prefixed closing line, e.g. "# that's it — no key needed to start." */
  footer: string;
}

export function Quickstart({ tabs }: { tabs: QuickstartTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div className="quickstart-panel">
      <div className="tabs-bar">
        <div className="tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === active}
              className="tab"
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CopyButton text={tab.code} idle="copy" copied="copied ✓" className="copy-link" />
      </div>
      <pre>{tab.rendered}</pre>
      <div className="quickstart-foot">{tab.footer}</div>
    </div>
  );
}
