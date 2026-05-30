import { useEffect, useState } from "react";
import { AlertTriangle, Brain, CheckCircle2, Database, Loader2, Plug, Terminal, X } from "lucide-react";
import { platformLabels, type PlatformId, type LlmConfig, type LlmModelCapabilities } from "@flash-promoter/core";
import { api } from "../api/client.js";

const p0Platforms: PlatformId[] = ["wechat", "bilibili", "zhihu-assist", "xhs-assist", "wordpress"];

const levelInfo: Record<string, { label: string; desc: string }> = {
  simulate: { label: "L0 模拟", desc: "仅验证内容包，不调平台接口" },
  copy: { label: "L1 复制", desc: "复制内容到剪贴板" },
  assist: { label: "L1 辅助", desc: "生成内容包，辅助手动发布" },
  draft: { label: "L2 草稿", desc: "创建平台草稿/容器" },
  submit: { label: "L3 提交", desc: "官方 API 提交，可能审核" },
  publish: { label: "L3 发布", desc: "官方 API 真实发布" },
  status: { label: "L4 状态", desc: "发布后状态查询" },
  metrics: { label: "L4 数据", desc: "发布后数据回收" }
};

export function SettingsPage() {
  const [showDebug, setShowDebug] = useState(false);
  const [realPublishEnabled, setRealPublishEnabled] = useState(false);
  const [adapters, setAdapters] = useState<Array<{ id: PlatformId; name: string; capabilities: Record<string, unknown>; defaultMode: string }>>([]);

  // LLM
  const [llmForm, setLlmForm] = useState({ enabled: false, baseUrl: "https://api.openai.com/v1", apiKeyEncrypted: "", model: "gpt-4o", temperature: 0.7, timeoutMs: 30000, maxTokens: 4096, capabilities: { text: true, image: false, videoFrame: false, structuredOutput: true, longContext: true } as LlmModelCapabilities });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getLlmConfig().then((r) => { if (r.config.baseUrl) setLlmForm({ enabled: r.config.enabled, baseUrl: r.config.baseUrl, apiKeyEncrypted: r.config.apiKeyEncrypted, model: r.config.model, temperature: r.config.temperature, timeoutMs: r.config.timeoutMs, maxTokens: r.config.maxTokens ?? 4096, capabilities: r.config.capabilities }); }).catch(() => {});
    api.adapters().then((r) => setAdapters(r.adapters)).catch(() => {});
  }, []);

  async function saveLlm() { setSaving(true); try { await api.saveLlmConfig(llmForm); setTestResult(null); } catch {} finally { setSaving(false); } }
  async function testLlm() { setTesting(true); setTestResult(null); try { const r = await api.testLlm(llmForm); setTestResult(r.ok ? "ok" : "fail"); } catch { setTestResult("fail"); } finally { setTesting(false); } }

  const p0Adapters = adapters.filter((a) => p0Platforms.includes(a.id as PlatformId));

  return (
    <div className="settings-shell">
      <header className="wizard-header"><div><span className="eyebrow">配置</span><h1>设置</h1></div></header>

      {/* === Platform Management === */}
      <section className="card">
        <h2><Plug size={16} /> 平台接入管理</h2>
        <p className="muted">已接入平台的当前能力和发布等级。真实发布功能默认关闭。</p>

        <div className="settings-row" style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>全局安全开关</span>
          <label className="toggle-label">
            <input type="checkbox" checked={realPublishEnabled} onChange={(e) => setRealPublishEnabled(e.target.checked)} />
            <span className={`toggle-switch ${realPublishEnabled ? "on" : ""}`} />
          </label>
        </div>
        {realPublishEnabled && (
          <div className="understand-missing" style={{ marginBottom: 12 }}>
            <AlertTriangle size={16} />
            <div><strong>真实发布已启用</strong><p style={{ margin: "2px 0 0" }}>所有 L3 平台的真实发布按钮将可用。每次真实发布前仍需二次确认。</p></div>
          </div>
        )}

        <div className="platform-mgmt-grid">
          {p0Adapters.map((a) => {
            const caps = a.capabilities as Record<string, boolean>;
            const level = caps.supportsDirectPublish ? "publish" : caps.supportsDraft ? "draft" : caps.supportsAssistPublish ? "assist" : "simulate";
            const info = levelInfo[level] ?? levelInfo.simulate;
            return (
              <div key={a.id} className="platform-mgmt-card">
                <div className="pmc-top">
                  <strong>{platformLabels[a.id as PlatformId]}</strong>
                  <span className={`pmc-level lvl-${level}`}>{info.label}</span>
                </div>
                <p>{info.desc}</p>
                <div className="pmc-flags">
                  {caps.supportsDraft && <span className="pmc-flag">草稿</span>}
                  {caps.supportsDirectPublish && <span className="pmc-flag warn">真实发布</span>}
                  {caps.supportsAssistPublish && <span className="pmc-flag">辅助</span>}
                  {!caps.supportsDraft && !caps.supportsDirectPublish && !caps.supportsAssistPublish && <span className="pmc-flag">模拟</span>}
                  <span className="pmc-flag muted">默认: {modeLabel(a.defaultMode)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* === LLM === */}
      <section className="card">
        <h2><Brain size={16} /> AI / LLM 配置</h2>
        <p className="muted">配置 OpenAI Compatible 接口以启用字段级 AI 辅助。</p>
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
          <button type="button" className="primary-button" disabled={saving} onClick={saveLlm}>{saving ? "保存中…" : "保存配置"}</button>
          <button type="button" disabled={testing} onClick={testLlm}>{testing ? <Loader2 size={14} className="spinner" /> : "测试连接"}</button>
          {testResult === "ok" ? <span style={{ color: "#0e7c66", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={14} /> 连接成功</span> : testResult === "fail" ? <span style={{ color: "#b13b2e", display: "flex", alignItems: "center", gap: 4 }}><X size={14} /> 连接失败</span> : null}
        </div>
      </section>

      {/* === Storage === */}
      <section className="card">
        <h2><Database size={16} /> 本地存储</h2>
        <div className="settings-table">
          <div className="settings-row"><span>数据位置</span><span>data/flash-promoter.sqlite</span></div>
          <div className="settings-row"><span>存储内容</span><span>文章、视频、草稿、任务、日志、资产、凭证</span></div>
        </div>
      </section>

      {/* === Debug === */}
      <section className="card">
        <h2><Terminal size={16} /> 调试模式</h2>
        <button type="button" onClick={() => setShowDebug(!showDebug)}>{showDebug ? "关闭调试模式" : "开启调试模式"}</button>
        {showDebug && <div style={{ marginTop: 14, padding: 12, border: "1px dashed var(--line)", borderRadius: 8 }}><p className="muted">环境：本地 MVP | API：:3333 | 桌面：:5173</p></div>}
      </section>
    </div>
  );
}

function modeLabel(mode: string): string {
  switch (mode) { case "draft": return "创建草稿"; case "simulate": return "模拟发布"; case "assist": return "辅助发布"; case "submit": return "提交审核"; case "publish": return "真实发布"; default: return mode; }
}
