import { useEffect, useState } from "react";
import { AlertTriangle, Brain, CheckCircle2, Database, ExternalLink, Info, Loader2, Plug, Shield, Terminal, X } from "lucide-react";
import { type PlatformId, type LlmConfig, type LlmModelCapabilities } from "@flash-promoter/core";
import { api } from "../api/client.js";

const p0Platforms: PlatformId[] = ["wechat", "bilibili", "zhihu-assist", "xhs-assist", "wordpress"];

type PlatformGuide = { id: string; name: string; authType: string; setupNote: string; setupUrl: string; docs: string[]; publishLevels: string[]; riskLevel: string; defaultMode: string };

const levelLabels: Record<string, string> = {
  simulate: "L0 模拟", copy: "L1 复制", share: "L1 分享",
  assist: "L1 辅助", draft: "L2 草稿", container: "L2 容器",
  submit: "L3 提交", publish: "L3 发布", status: "L4 状态", metrics: "L4 数据"
};

const levelDescs: Record<string, string> = {
  simulate: "仅验证内容包，不调平台接口",
  assist: "生成内容包，辅助手动发布",
  draft: "创建平台草稿/容器，不公开",
  submit: "官方 API 提交，可能进入审核",
  publish: "官方 API 真实发布"
};

const authLabels: Record<string, string> = {
  "app-secret": "AppID/Secret", "oauth2": "OAuth 2.0", "api-key": "API Key",
  "bot-token": "Bot Token", manual: "手动操作", mock: "模拟",
  "browser-assist": "浏览器辅助", none: "无需凭证"
};

export function SettingsPage() {
  const [showDebug, setShowDebug] = useState(false);
  const [guides, setGuides] = useState<PlatformGuide[]>([]);
  const [globalSafety, setGlobalSafety] = useState(false);
  const [platformSwitches, setPlatformSwitches] = useState<Record<string, boolean>>({});
  const [savingSafety, setSavingSafety] = useState(false);

  // LLM
  const [llmForm, setLlmForm] = useState({ enabled: false, baseUrl: "https://api.openai.com/v1", apiKeyEncrypted: "", model: "gpt-4o", temperature: 0.7, timeoutMs: 30000, maxTokens: 4096, capabilities: { text: true, image: false, videoFrame: false, structuredOutput: true, longContext: true } as LlmModelCapabilities });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [savingLlm, setSavingLlm] = useState(false);

  useEffect(() => {
    api.getLlmConfig().then((r) => { if (r.config.baseUrl) setLlmForm({ enabled: r.config.enabled, baseUrl: r.config.baseUrl, apiKeyEncrypted: r.config.apiKeyEncrypted, model: r.config.model, temperature: r.config.temperature, timeoutMs: r.config.timeoutMs, maxTokens: r.config.maxTokens ?? 4096, capabilities: r.config.capabilities }); }).catch(() => {});
    api.getSafety().then((r) => { setGlobalSafety(r.realPublishEnabled); setPlatformSwitches(r.platformSwitches); setGuides(r.platformGuides.filter((g) => p0Platforms.includes(g.id as PlatformId))); }).catch(() => {});
  }, []);

  async function saveLlm() { setSavingLlm(true); try { await api.saveLlmConfig(llmForm); setTestResult(null); } catch {} finally { setSavingLlm(false); } }
  async function testLlm() { setTesting(true); setTestResult(null); try { const r = await api.testLlm(llmForm); setTestResult(r.ok ? "ok" : "fail"); } catch { setTestResult("fail"); } finally { setTesting(false); } }

  async function toggleGlobal(enabled: boolean) {
    setGlobalSafety(enabled);
    setSavingSafety(true);
    try { await api.saveSafety({ realPublishEnabled: enabled }); } catch {} finally { setSavingSafety(false); }
  }

  async function togglePlatform(platform: string, enabled: boolean) {
    const next = { ...platformSwitches, [platform]: enabled };
    setPlatformSwitches(next);
    setSavingSafety(true);
    try { await api.saveSafety({ platformSwitches: next }); } catch {} finally { setSavingSafety(false); }
  }

  function topLevel(guide: PlatformGuide): string {
    for (const l of ["publish", "submit", "draft", "container", "assist", "copy", "simulate"]) {
      if (guide.publishLevels.includes(l)) return l;
    }
    return "simulate";
  }

  function canRealPublish(guide: PlatformGuide): boolean {
    return guide.publishLevels.includes("submit") || guide.publishLevels.includes("publish");
  }

  return (
    <div className="settings-shell">
      <header className="wizard-header"><div><span className="eyebrow">配置</span><h1>设置</h1></div></header>

      {/* === Safety: Real Publish === */}
      <section className="card">
        <h2><Shield size={16} /> 发布安全配置</h2>
        <p className="muted">控制是否允许调用平台真实接口。默认关闭，开启后仍需按平台单独启用。</p>

        <div className="safety-section">
          <div className="settings-row">
            <div>
              <strong>全局真实发布</strong>
              <p className="muted" style={{ margin: "2px 0 0", fontSize: 12 }}>关闭时所有平台仅模拟发布。开启后仍需为每个平台单独配置凭证和开关。</p>
            </div>
            <label className="toggle-label">
              <input type="checkbox" checked={globalSafety} onChange={(e) => toggleGlobal(e.target.checked)} />
              <span className={`toggle-switch ${globalSafety ? "on" : ""}`} />
            </label>
          </div>

          {globalSafety && (
            <div className="understand-missing" style={{ marginTop: 12 }}>
              <AlertTriangle size={16} />
              <div>
                <strong>真实发布已全局启用</strong>
                <p style={{ margin: "2px 0 0" }}>请在下方为每个平台单独配置凭证并开启真实发布。每次真实提交前仍需用户二次确认。</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* === Platform Management === */}
      <section className="card">
        <h2><Plug size={16} /> 平台接入管理</h2>
        <p className="muted">各平台当前能力等级和真实发布配置状态。</p>

        {guides.map((guide) => {
          const lvl = topLevel(guide);
          const canPublish = canRealPublish(guide);
          const switchOn = platformSwitches[guide.id] ?? false;
          return (
            <div key={guide.id} className="platform-detail">
              <div className="pd-header">
                <div>
                  <strong>{guide.name}</strong>
                  <div className="pd-tags">
                    <span className={`pd-level lvl-${lvl}`}>{levelLabels[lvl] ?? lvl}</span>
                    <span className={`pd-risk ${guide.riskLevel}`}>风险: {guide.riskLevel === "low" ? "低" : guide.riskLevel === "medium" ? "中" : "高"}</span>
                    <span className="pd-auth">{authLabels[guide.authType] ?? guide.authType}</span>
                  </div>
                </div>
                {globalSafety && canPublish && (
                  <label className="toggle-label">
                    <input type="checkbox" checked={switchOn} onChange={(e) => togglePlatform(guide.id, e.target.checked)} />
                    <span className={`toggle-switch ${switchOn ? "on" : ""}`} />
                  </label>
                )}
                {globalSafety && !canPublish && (
                  <span className="muted" style={{ fontSize: 12 }}>仅辅助 · 无直发 API</span>
                )}
              </div>

              <div className="pd-body">
                <p>{levelDescs[lvl] ?? ""} · 默认: {modeLabel(guide.defaultMode)}</p>
                {guide.setupNote && (
                  <p className="pd-note"><Info size={13} /> 配置要求：{guide.setupNote}</p>
                )}
                {guide.setupUrl && (
                  <a href={guide.setupUrl} target="_blank" rel="noopener noreferrer" className="pd-link">
                    <ExternalLink size={12} /> {guide.setupUrl}
                  </a>
                )}
                {guide.docs.length > 0 && guide.docs.map((d, i) => (
                  <a key={i} href={d} target="_blank" rel="noopener noreferrer" className="pd-link">
                    <ExternalLink size={12} /> 官方文档
                  </a>
                ))}
              </div>

              {globalSafety && !switchOn && canPublish && (
                <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>真实发布已关闭。开启后每次提交前仍需二次确认。</p>
              )}
              {globalSafety && switchOn && canPublish && (
                <p style={{ fontSize: 12, color: "#c62828", marginTop: 4 }}>
                  ⚠ 真实发布已开启。内容提交后将进入平台审核流程。
                </p>
              )}
            </div>
          );
        })}
      </section>

      {/* === LLM === */}
      <section className="card">
        <h2><Brain size={16} /> AI / LLM 配置</h2>
        <div className="settings-table">
          <div className="settings-row"><span>启用 AI 辅助</span><label className="toggle-label"><input type="checkbox" checked={llmForm.enabled} onChange={(e) => setLlmForm({ ...llmForm, enabled: e.target.checked })} /><span className={`toggle-switch ${llmForm.enabled ? "on" : ""}`} /></label></div>
          <div className="settings-row"><span>Base URL</span><input className="settings-input" value={llmForm.baseUrl} onChange={(e) => setLlmForm({ ...llmForm, baseUrl: e.target.value })} /></div>
          <div className="settings-row"><span>API Key</span><input className="settings-input" type="password" value={llmForm.apiKeyEncrypted} onChange={(e) => setLlmForm({ ...llmForm, apiKeyEncrypted: e.target.value })} /></div>
          <div className="settings-row"><span>Model</span><input className="settings-input" value={llmForm.model} onChange={(e) => setLlmForm({ ...llmForm, model: e.target.value })} /></div>
          <div className="settings-row"><span>Temperature</span><input className="settings-input" type="number" min="0" max="2" step="0.1" value={llmForm.temperature} onChange={(e) => setLlmForm({ ...llmForm, temperature: Number(e.target.value) })} /></div>
          <div className="settings-row"><span>Timeout (ms)</span><input className="settings-input" type="number" value={llmForm.timeoutMs} onChange={(e) => setLlmForm({ ...llmForm, timeoutMs: Number(e.target.value) })} /></div>
          <div className="settings-row"><span>Max Tokens</span><input className="settings-input" type="number" value={llmForm.maxTokens} onChange={(e) => setLlmForm({ ...llmForm, maxTokens: Number(e.target.value) })} /></div>
          <div className="settings-row"><span>模型能力</span><div className="capability-tags">{(["text", "image", "videoFrame"] as const).map((k) => (<label key={k} className="cap-tag"><input type="checkbox" checked={llmForm.capabilities[k]} onChange={(e) => setLlmForm({ ...llmForm, capabilities: { ...llmForm.capabilities, [k]: e.target.checked } })} />{k === "text" ? "文本" : k === "image" ? "图片" : "视频帧"}</label>))}</div></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
          <button type="button" className="primary-button" disabled={savingLlm} onClick={saveLlm}>{savingLlm ? "保存中…" : "保存配置"}</button>
          <button type="button" disabled={testing} onClick={testLlm}>{testing ? <Loader2 size={14} className="spinner" /> : "测试连接"}</button>
          {testResult === "ok" ? <span style={{ color: "#0e7c66", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={14} /> 连接成功</span> : testResult === "fail" ? <span style={{ color: "#b13b2e", display: "flex", alignItems: "center", gap: 4 }}><X size={14} /> 连接失败</span> : null}
        </div>
      </section>

      {/* === Storage + Debug === */}
      <section className="card">
        <h2><Database size={16} /> 本地存储</h2>
        <div className="settings-table">
          <div className="settings-row"><span>数据位置</span><span>data/flash-promoter.sqlite</span></div>
        </div>
      </section>
      <section className="card">
        <h2><Terminal size={16} /> 调试</h2>
        <button type="button" onClick={() => setShowDebug(!showDebug)}>{showDebug ? "关闭" : "开启调试模式"}</button>
        {showDebug && <div style={{ marginTop: 14, padding: 12, border: "1px dashed var(--line)", borderRadius: 8 }}><p className="muted">本地 MVP | API :3333 | 桌面 :5173</p></div>}
      </section>
    </div>
  );
}

function modeLabel(mode: string): string {
  switch (mode) { case "draft": return "创建草稿"; case "simulate": return "模拟发布"; case "assist": return "辅助发布"; case "submit": return "提交审核"; case "publish": return "真实发布"; default: return mode; }
}
