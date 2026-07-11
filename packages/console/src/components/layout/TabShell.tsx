import { useNovaStore, type TabId } from "../../store/novaStore";
import type { ReactNode } from "react";

const TABS: { id: TabId; label: string }[] = [
  { id: "trade", label: "Trade" },
  { id: "markets", label: "Markets" },
  { id: "portfolio", label: "Portfolio" },
  { id: "vaults", label: "Vaults" },
  { id: "stats", label: "Stats" },
  { id: "risk", label: "Risk" },
  { id: "review", label: "Review" },
];

export function TabShell({ views }: { views: Record<TabId, ReactNode> }) {
  const tab = useNovaStore((s) => s.tab);
  const setTab = useNovaStore((s) => s.setTab);

  return (
    <>
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {TABS.map((t) => (
        <section key={t.id} className={`view ${tab === t.id ? "active" : ""}`}>
          {views[t.id]}
        </section>
      ))}
    </>
  );
}
