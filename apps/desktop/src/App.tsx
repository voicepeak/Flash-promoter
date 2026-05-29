import { useState } from "react";
import { FileText, ListChecks, Settings } from "lucide-react";
import { FlowWizard } from "./components/FlowWizard.js";
import { HistoryPage } from "./components/HistoryPage.js";
import { SettingsPage } from "./components/SettingsPage.js";
import "./styles.css";

type Page = "wizard" | "history" | "settings";

const navItems: { page: Page; icon: typeof FileText; label: string }[] = [
  { page: "wizard", icon: FileText, label: "新建发布" },
  { page: "history", icon: ListChecks, label: "发布记录" },
  { page: "settings", icon: Settings, label: "设置" }
];

export default function App() {
  const [page, setPage] = useState<Page>("wizard");

  return (
    <div className="app-shell">
      <nav className="side-nav">
        <div className="brand-mark">flash-promoter</div>
        {navItems.map((item) => (
          <button
            key={item.page}
            type="button"
            className={page === item.page ? "active" : ""}
            onClick={() => setPage(item.page)}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <main className="workspace">
        {page === "wizard" ? <FlowWizard /> : page === "history" ? <HistoryPage /> : <SettingsPage />}
      </main>
    </div>
  );
}
