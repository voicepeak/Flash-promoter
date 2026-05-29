import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Database, Loader2, RotateCcw, Terminal, Video, X } from "lucide-react";
import { defaultPublishMode, platformLabels, type PlatformId, type LlmConfig, type LlmModelCapabilities } from "@flash-promoter/core";
import { api } from "../api/client.js";

const platformList: PlatformId[] = ["wechat", "bilibili", "zhihu-assist", "xhs-assist"];

export function SettingsPage() {
  const [showDebug, setShowDebug] = useState(false);
  const [llmForm, setLlmForm] = useState({ enabled: false, baseUrl: "https://api.openai.com/v1", apiKeyEncrypted: "", model: "gpt-4o", temperature: 0.7, timeoutMs: 30000, maxTokens: 4096, capabilities: { text: true, image: false, videoFrame: false, structuredOutput: true, longContext: true } as LlmModelCapabilities });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getLlmConfig().then((r) => { if (r.config.baseUrl) setLlmForm({ enabled: r.config.enabled, baseUrl: r.config.baseUrl, apiKeyEncrypted: r.config.apiKeyEncrypted, model: r.config.model, temperature: r.config.temperature, timeoutMs: r.config.timeoutMs, maxTokens: r.config.maxTokens ?? 4096, capabilities: r.config.capabilities }); }).catch(() => {}); }, []);

  async function saveLlm() { setSaving(true); try { await api.saveLlmConfig(llmForm); setTestResult(null); } catch {} finally { setSaving(false); } }
  async function testLlm() { setTesting(true); setTestResult(null); try { const r = await api.testLlm(llmForm); setTestResult(r.ok ? "ok" : "fail"); } catch { setTestResult("fail"); } finally { setTesting(false); } }

  return (
    <div className="settings-shell">
      <header className="wizard-header"><div><span className="eyebrow">配置</span><h1>设置</h1></div></header>

      <section className="card">
        <h2><Brain size={16} /> AI / LLM 配置</h2>
        <p className="muted">配置 OpenAI Compatible 接口以启用字段级 AI 辅助填写。建议配置支持多模态能力的模型。</p>
        <div className="settings-table">
          <div className="settings-row">
            <span>启用 AI 辅助</span>
            <label className="toggle-label"><input type="checkbox" checked={llmForm.enabled} onChange={(e) => setLlmForm({ ...llmForm, enabled: e.target.checked })} /><span className={`toggle-switch ${llmForm.enabled ? "on" : ""}`} /></label>
          </div>
          <div className="settings-row"><span>Base URL</span><input className="settings-input" value={llmForm.baseUrl} onChange={(e) => setLlmForm({ ...llmForm, baseUrl: e.target.value })} /></div>
          <div className="settings-row"><span>API Key</span><input className="settings-input" type="password" value={llmForm.apiKeyEncrypted} onChange={(e) => setLlmForm({ ...llmForm, apiKeyEncrypted: e.target.value })} /></div>
          <div className="settings-row"><span>Model</span><input className="settings-input" value={llmForm.model} onChange={(e) => setLlmForm({ ...llmForm, model: e.target.value })} /></div>
          <div className="settings-row"><span>Temperature</span><input className="settings-input" type="number" min="0" max="2" step="0.1" value={llmForm.temperature} onChange={(e) => setLlmForm({ ...llmForm, temperature: Number(e.target.value) })} /></div>
          <div className="settings-row"><span>Timeout (ms)</span><input className="settings-input" type="number" value={llmForm.timeoutMs} onChange={(e) => setLlmForm({ ...llmForm, timeoutMs: Number(e.target.value) })} /></div>
          <div className="settings-row"><span>Max Tokens</span><input className="settings-input" type="number" value={llmForm.maxTokens} onChange={(e) => setLlmForm({ ...llmForm, maxTokens: Number(e.target.value) })} /></div>
          <div className="settings-row">
            <span>模型能力</span>
            <div className="capability-tags">
              {(["text", "image", "videoFrame"] as const).map((k) => (
                <label key={k} className="cap-tag"><input type="checkbox" checked={llmForm.capabilities[k]} onChange={(e) => setLlmForm({ ...llmForm, capabilities: { ...llmForm.capabilities, [k]: e.target.checked } })} />{k === "text" ? "文本" : k === "image" ? "图片" : "视频帧"}</label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
          <button type="button" className="primary-button" disabled={saving} onClick={saveLlm}>{saving ? "保存中…" : "保存配置"}</button>
          <button type="button" disabled={testing} onClick={testLlm}>{testing ? <Loader2 size={14} className="spinner" /> : "测试连接"}</button>
          {testResult === "ok" ? <span style={{ color: "#0e7c66", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={14} /> 连接成功</span> : testResult === "fail" ? <span style={{ color: "#b13b2e", display: "flex", alignItems: "center", gap: 4 }}><X size={14} /> 连接失败</span> : null}
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>建议使用支持多模态的模型。API Key 加密保存不出现在日志中。未配置 LLM 时仍可使用本地规则生成。</p>
      </section>

      <section className="card">
        <h2><RotateCcw size={16} /> 默认发布方式</h2>
        <p className="muted">各平台默认采用的发布方式。</p>
        <div className="settings-table">
          {platformList.map((p) => (<div key={p} className="settings-row"><span>{platformLabels[p]}</span><span>{modeLabel(defaultPublishMode[p as keyof typeof defaultPublishMode] ?? "simulate")}</span></div>))}
        </div>
      </section>

      <section className="card">
        <h2><Video size={16} /> 视频默认配置</h2>
        <p className="muted">视频发布流程的默认设置。</p>
        <div className="settings-table">
          <div className="settings-row"><span>默认视频平台</span><span>B站、小红书</span></div>
          <div className="settings-row"><span>默认视频风格</span><span>知识科普</span></div>
          <div className="settings-row"><span>手动填写元数据</span><span>允许</span></div>
          <div className="settings-row"><span>B站真实上传</span><span>关闭（仅预留）</span></div>
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
        <button type="button" onClick={() => setShowDebug(!showDebug)}>{showDebug ? "关闭调试模式" : "开启调试模式"}</button>
        {showDebug && <div style={{ marginTop: 14, padding: 12, border: "1px dashed var(--line)", borderRadius: 8 }}><p className="muted">环境：本地 MVP | API：:3333 | 桌面：:5173</p></div>}
      </section>
    </div>
  );
}

function modeLabel(mode: string): string {
  switch (mode) { case "draft": return "生成草稿"; case "simulate": return "模拟发布"; case "assist": return "辅助发布"; default: return mode; }
}
