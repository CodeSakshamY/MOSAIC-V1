import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function FilterMenu({ active, children }: { active: number; children: ReactNode }) {
  return (
    <details className="filter-menu">
      <summary>
        <span>Filters</span>
        {active > 0 ? <span className="filter-count">{active}</span> : null}
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="filter-panel">{children}</div>
    </details>
  );
}
