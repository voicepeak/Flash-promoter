import { useState } from "react";
import { Database, RotateCcw, Terminal, Video } from "lucide-react";
import { defaultPublishMode, platformLabels, videoStyleLabels, type PlatformId } from "@flash-promoter/core";

const platformList: PlatformId[] = ["wechat", "bilibili", "zhihu-assist", "xhs-assist"];

export function SettingsPage() {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="settings-shell">
      <header className="wizard-header"><div><span className="eyebrow">配置</span><h1>设置</h1></div></header>

      <section className="card">
        <h2><RotateCcw size={16} /> 默认发布方式</h2>
        <p className="muted">各平台默认采用的发布方式。模拟模式不会调用真实平台接口。</p>
        <div className="settings-table">
          {platformList.map((p) => (
            <div key={p} className="settings-row"><span>{platformLabels[p]}</span><span>{modeLabel(defaultPublishMode[p as keyof typeof defaultPublishMode] ?? "simulate")}</span></div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2><Video size={16} /> 视频默认配置</h2>
        <p className="muted">视频发布流程的默认设置。</p>
        <div className="settings-table">
          <div className="settings-row"><span>默认视频平台</span><span>B站、小红书</span></div>
          <div className="settings-row"><span>默认视频风格</span><span>知识科普</span></div>
          <div className="settings-row"><span>手动填写元数据</span><span>允许（时长、分辨率）</span></div>
          <div className="settings-row"><span>视频调试信息</span><span>关闭</span></div>
          <div className="settings-row"><span>B站真实上传</span><span>关闭（仅预留）</span></div>
          <div className="settings-row"><span>文件读取策略</span><span>仅记录文件名和大小，不上传</span></div>
        </div>
      </section>

      <section className="card">
        <h2><Database size={16} /> 本地存储</h2>
        <p className="muted">数据存储在本地 SQLite 数据库中。</p>
        <div className="settings-table">
          <div className="settings-row"><span>数据位置</span><span>data/flash-promoter.sqlite</span></div>
          <div className="settings-row"><span>存储内容</span><span>文章、视频、草稿、任务、日志、资产</span></div>
        </div>
      </section>

      <section className="card">
        <h2><Terminal size={16} /> 调试模式</h2>
        <p className="muted">开启后显示开发者工具和底层信息。</p>
        <button type="button" onClick={() => setShowDebug(!showDebug)}>{showDebug ? "关闭调试模式" : "开启调试模式"}</button>
        {showDebug ? (
          <div style={{ marginTop: 14, padding: 12, border: "1px dashed var(--line)", borderRadius: 8, background: "#f5f0e4" }}>
            <p className="muted">调试信息面板</p>
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
