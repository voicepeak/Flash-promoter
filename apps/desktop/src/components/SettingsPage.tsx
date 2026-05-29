import { useState } from "react";
import { Database, RotateCcw, Terminal, Trash2 } from "lucide-react";
import { defaultPublishMode, platformLabels, type PlatformId } from "@flash-promoter/core";

const platformList: PlatformId[] = ["wechat", "bilibili", "zhihu-assist", "xhs-assist"];

export function SettingsPage() {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="settings-shell">
      <header className="wizard-header">
        <div>
          <span className="eyebrow">配置</span>
          <h1>设置</h1>
        </div>
      </header>

      <section className="card">
        <h2><RotateCcw size={16} /> 默认发布方式</h2>
        <p className="muted">各平台默认采用的发布方式。模拟模式不会调用真实平台接口。</p>
        <div className="settings-table">
          {platformList.map((p) => (
            <div key={p} className="settings-row">
              <span>{platformLabels[p]}</span>
              <span>{modeLabel(defaultPublishMode[p as keyof typeof defaultPublishMode] ?? "simulate")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2><Database size={16} /> 本地存储</h2>
        <p className="muted">数据存储在本地 SQLite 数据库中。</p>
        <div className="settings-table">
          <div className="settings-row">
            <span>数据位置</span>
            <span>data/flash-promoter.sqlite</span>
          </div>
          <div className="settings-row">
            <span>存储内容</span>
            <span>文章、草稿、发布任务、日志、资产</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2><Terminal size={16} /> 调试模式</h2>
        <p className="muted">开启后显示开发者工具和底层信息。</p>
        <button type="button" onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? "关闭调试模式" : "开启调试模式"}
        </button>

        {showDebug ? (
          <div style={{ marginTop: 14, padding: 12, border: "1px dashed var(--line)", borderRadius: 8, background: "#f5f0e4" }}>
            <p className="muted">调试信息面板（开发中）</p>
            <p className="muted">当前环境：本地 MVP</p>
            <p className="muted">API：http://127.0.0.1:3333</p>
            <p className="muted">桌面端：http://127.0.0.1:5173</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function modeLabel(mode: string): string {
  switch (mode) {
    case "draft": return "生成草稿";
    case "simulate": return "模拟发布";
    case "assist": return "辅助发布";
    default: return mode;
  }
}
