import { useEffect, useState } from "react";
import { AlertTriangle, Brain, CheckCircle2, ChevronDown, ChevronRight, Database, ExternalLink, Info, Loader2, Plug, Shield, Terminal, Trash2, X } from "lucide-react";
import { type PlatformId, type LlmConfig, type LlmModelCapabilities } from "@flash-promoter/core";
import { api } from "../api/client.js";

const p0Platforms: PlatformId[] = ["wechat", "bilibili", "zhihu-assist", "xhs-assist"];

type PlatformGuide = { id: string; name: string; authType: string; setupNote: string; setupUrl: string; docs: string[]; publishLevels: string[]; riskLevel: string; defaultMode: string };

const setupGuides: Record<string, { title: string; steps: string[]; fields: { key: string; label: string; placeholder: string }[] }> = {
  wechat: {
    title: "微信公众号 AppID / AppSecret 配置",
    steps: [
      "1. 登录微信公众平台 https://mp.weixin.qq.com（或开发者平台 developers.weixin.qq.com）",
      "2. 进入「设置与开发」→「基本配置」（开发者平台则为「开发信息」）",
      "3. 页面上的「开发者 ID(AppID)」即为 AppID",
      "4. 点击 AppSecret 旁的「重置」按钮，用管理员微信扫码",
      "5. 扫码后 AppSecret 会短暂显示在页面上，立即复制",
      "6. 注意：AppSecret 仅显示一次，关闭后无法再次查看"
    ],
    fields: [
      { key: "appId", label: "AppID（开发者 ID）", placeholder: "wxXXXXXXXXXXXXXXXX" },
      { key: "appSecret", label: "AppSecret（开发者密码）", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
    ]
  },
  bilibili: {
    title: "B站开放平台 OAuth 凭证",
    steps: [
      "1. 登录 B站开放平台 https://openhome.bilibili.com",
      "2. 进入「开发者中心」→「创建应用」",
      "3. 填写应用名称、描述，回调地址填 http://localhost:3333/callback",
      "4. 提交审核通过后，在「应用详情」中查看 client_id 和 client_secret",
      "5. 将凭证填入下方，点击保存"
    ],
    fields: [
      { key: "clientId", label: "client_id", placeholder: "xxxxxxxx" },
      { key: "clientSecret", label: "client_secret", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
    ]
  }
};

const manualNote = "此平台无官方发布 API，不需要配置凭证。发布时使用辅助模式：复制内容后手动粘贴到平台。";

export function SettingsPage() {
  const [showDebug, setShowDebug] = useState(false);
  const [guides, setGuides] = useState<PlatformGuide[]>([]);
  const [globalSafety, setGlobalSafety] = useState(false);
  const [platformSwitches, setPlatformSwitches] = useState<Record<string, boolean>>({});
  const [accounts, setAccounts] = useState<Array<{ platform: string; displayName: string; authType: string; status: string }>>([]);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [credForms, setCredForms] = useState<Record<string, Record<string, string>>>({});
  const [savingCred, setSavingCred] = useState<string | null>(null);

  // LLM
  const [llmForm, setLlmForm] = useState({ enabled: false, baseUrl: "https://api.openai.com/v1", apiKeyEncrypted: "", model: "gpt-4o", temperature: 0.7, timeoutMs: 30000, maxTokens: 4096, imageBaseUrl: "", imageApiKey: "", imageModel: "dall-e-3", capabilities: { text: true, image: false, videoFrame: false, structuredOutput: true, longContext: true } as LlmModelCapabilities });
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [hasStoredImageKey, setHasStoredImageKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [savingLlm, setSavingLlm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState("data/flash-promoter.sqlite");

  useEffect(() => {
    api.getLlmConfig().then((r) => { if (r.config.baseUrl) { const keyFromServer = r.config.apiKeyEncrypted ?? ""; const imgKeyFromServer = (r.config as Record<string, unknown>).imageApiKey as string ?? ""; setHasStoredKey(!!keyFromServer); setHasStoredImageKey(!!imgKeyFromServer); setLlmForm({ enabled: r.config.enabled, baseUrl: r.config.baseUrl, apiKeyEncrypted: "", model: r.config.model, temperature: r.config.temperature, timeoutMs: r.config.timeoutMs, maxTokens: r.config.maxTokens ?? 4096, imageBaseUrl: (r.config as Record<string, unknown>).imageBaseUrl as string ?? "", imageApiKey: "", imageModel: (r.config as Record<string, unknown>).imageModel as string ?? "dall-e-3", capabilities: r.config.capabilities }); } }).catch(() => {});
    api.getSafety().then((r) => { setGlobalSafety(r.realPublishEnabled); setPlatformSwitches(r.platformSwitches); setGuides(r.platformGuides.filter((g) => p0Platforms.includes(g.id as PlatformId))); }).catch(() => {});
    api.getPlatformAccounts().then((r) => setAccounts(r.accounts)).catch(() => {});
    api.storageInfo().then((r) => setStoragePath(r.dbPath || "data/flash-promoter.sqlite")).catch(() => {});
  }, []);

  async function saveLlm() { setSavingLlm(true); setSaveError(null); try { await api.saveLlmConfig(llmForm); setTestResult(null); if (llmForm.apiKeyEncrypted) setHasStoredKey(true); if (llmForm.imageApiKey) setHasStoredImageKey(true); } catch (e) { setSaveError(e instanceof Error ? e.message : "保存失败"); } finally { setSavingLlm(false); } }
  async function testLlm() { setTesting(true); setTestResult(null); try { const r = await api.testLlm(llmForm); setTestResult(r.ok ? "ok" : "fail"); } catch { setTestResult("fail"); } finally { setTesting(false); } }
  async function toggleGlobal(enabled: boolean) { setGlobalSafety(enabled); try { await api.saveSafety({ realPublishEnabled: enabled }); } catch {} }
  async function togglePlatform(platform: string, enabled: boolean) { const next = { ...platformSwitches, [platform]: enabled }; setPlatformSwitches(next); try { await api.saveSafety({ platformSwitches: next }); } catch {} }

  async function saveCred(platform: string, guide: PlatformGuide) {
    const form = credForms[platform] ?? {};
    setSavingCred(platform);
    try {
      await api.savePlatformAccount({ platform, displayName: guide.name, authType: guide.authType, credentials: form });
      const r = await api.getPlatformAccounts();
      setAccounts(r.accounts);
      setCredForms((prev) => { const next = { ...prev }; delete next[platform]; return next; });
    } catch {} finally { setSavingCred(null); }
  }

  async function deleteCred(platform: string) {
    setSavingCred(platform);
    try { await api.deletePlatformAccount(platform); const r = await api.getPlatformAccounts(); setAccounts(r.accounts); } catch {} finally { setSavingCred(null); }
  }

  function hasCred(platform: string): boolean { return accounts.some((a) => a.platform === platform && a.status === "active"); }
  function getAccount(platform: string) { return accounts.find((a) => a.platform === platform); }

  function topLevel(guide: PlatformGuide): string {
    for (const l of ["publish", "submit", "draft", "container", "assist", "copy", "simulate"]) {
      if (guide.publishLevels.includes(l)) return l;
    }
    return "simulate";
  }

  return (
    <div className="settings-shell">
      <header className="wizard-header"><div><span className="eyebrow">配置</span><h1>设置</h1></div></header>

      {/* === Safety === */}
      <section className="card">
        <h2><Shield size={16} /> 发布安全</h2>
        <div className="settings-row">
          <div><strong>全局真实发布</strong><p className="muted" style={{ margin: "2px 0 0", fontSize: 12 }}>关闭时所有平台仅模拟。开启后仍需逐平台配置凭证。</p></div>
          <label className="toggle-label"><input type="checkbox" checked={globalSafety} onChange={(e) => toggleGlobal(e.target.checked)} /><span className={`toggle-switch ${globalSafety ? "on" : ""}`} /></label>
        </div>
        {globalSafety && (
          <div className="understand-missing" style={{ marginTop: 12 }}><AlertTriangle size={16} /><div><strong>真实发布已全局启用</strong><p style={{ margin: "2px 0 0" }}>请在下方配置各平台凭证并开启平台开关。每次真实提交前仍需二次确认。</p></div></div>
        )}
      </section>

      {/* === Platform Config === */}
      <section className="card">
        <h2><Plug size={16} /> 平台凭证配置</h2>
        <p className="muted">按平台配置 API 凭证。未配置时默认使用模拟发布。</p>

        {guides.map((guide) => {
          const lvl = topLevel(guide);
          const guideData = setupGuides[guide.id];
          const account = getAccount(guide.id);
          const isManual = guide.authType === "manual" || guide.authType === "browser-assist";
          const expanded = expandedPlatform === guide.id;
          const form = credForms[guide.id] ?? {};

          return (
            <div key={guide.id} className="cred-platform">
              <div className="cred-header" onClick={() => setExpandedPlatform(expanded ? null : guide.id)}>
                <div className="cred-header-left">
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <strong>{guide.name}</strong>
                  <span className={`pd-level lvl-${lvl}`}>{levelLabels[lvl] ?? lvl}</span>
                  {account ? (
                    <span className="cred-status ok"><CheckCircle2 size={12} /> 已配置</span>
                  ) : isManual ? (
                    <span className="cred-status muted">无需凭证</span>
                  ) : (
                    <span className="cred-status warn"><AlertTriangle size={12} /> 未配置</span>
                  )}
                  {globalSafety && (guide.id !== "zhihu-assist" && guide.id !== "xhs-assist") && (
                    <label className="toggle-label" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={platformSwitches[guide.id] ?? false} onChange={(e) => togglePlatform(guide.id, e.target.checked)} />
                      <span className={`toggle-switch mini ${platformSwitches[guide.id] ? "on" : ""}`} />
                    </label>
                  )}
                </div>
              </div>

              {expanded && (
                <div className="cred-body">
                  {isManual ? (
                    <p className="pd-note"><Info size={13} /> {manualNote}</p>
                  ) : guideData ? (
                    <>
                      <div className="cred-guide">
                        <strong>{guideData.title}</strong>
                        <ol>{guideData.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                      </div>
                      <div className="cred-fields">
                        {guideData.fields.map((f) => (
                          <label key={f.key}>
                            <span>{f.label}</span>
                            <input className="settings-input" type={f.key.includes("secret") || f.key.includes("Password") ? "password" : "text"}
                              value={form[f.key] ?? ""}
                              onChange={(e) => setCredForms({ ...credForms, [guide.id]: { ...form, [f.key]: e.target.value } })}
                              placeholder={f.placeholder} />
                          </label>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button type="button" className="primary-button" disabled={savingCred === guide.id} onClick={() => saveCred(guide.id, guide)}>
                          {savingCred === guide.id ? "保存中…" : "保存凭证"}
                        </button>
                        {account && (
                          <button type="button" disabled={savingCred === guide.id} onClick={() => deleteCred(guide.id)}>
                            <Trash2 size={14} /> 移除
                          </button>
                        )}
                      </div>
                      {guide.setupUrl && (
                        <a href={guide.setupUrl} target="_blank" rel="noopener noreferrer" className="pd-link" style={{ marginTop: 8, display: "inline-flex" }}>
                          <ExternalLink size={12} /> 官方文档
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="muted">暂无配置引导。参考官方文档手动配置。</p>
                  )}
                </div>
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
          <div className="settings-row"><span>API Key</span><span style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}><input className="settings-input" type="password" value={llmForm.apiKeyEncrypted} onChange={(e) => setLlmForm({ ...llmForm, apiKeyEncrypted: e.target.value })} placeholder={hasStoredKey ? "已保存，留空不修改" : "输入 API Key"} style={{ flex: 1 }} />{hasStoredKey ? <span style={{ color: "#0e7c66", fontSize: 12, whiteSpace: "nowrap" }}>已保存</span> : null}</span></div>
          <div className="settings-row"><span>Model</span><input className="settings-input" value={llmForm.model} onChange={(e) => setLlmForm({ ...llmForm, model: e.target.value })} /></div>
          <div className="settings-row"><span>Temperature</span><input className="settings-input" type="number" min="0" max="2" step="0.1" value={llmForm.temperature} onChange={(e) => setLlmForm({ ...llmForm, temperature: Number(e.target.value) })} /></div>
          <div className="settings-row"><span>Timeout (ms)</span><input className="settings-input" type="number" value={llmForm.timeoutMs} onChange={(e) => setLlmForm({ ...llmForm, timeoutMs: Number(e.target.value) })} /></div>
          <div className="settings-row"><span>Max Tokens</span><input className="settings-input" type="number" value={llmForm.maxTokens} onChange={(e) => setLlmForm({ ...llmForm, maxTokens: Number(e.target.value) })} /></div>
          <div className="settings-row"><span>模型能力</span><div className="capability-tags">{(["text", "image", "videoFrame"] as const).map((k) => (<label key={k} className="cap-tag"><input type="checkbox" checked={llmForm.capabilities[k]} onChange={(e) => setLlmForm({ ...llmForm, capabilities: { ...llmForm.capabilities, [k]: e.target.checked } })} />{k === "text" ? "文本" : k === "image" ? "图片" : "视频帧"}</label>))}</div></div>
          <div className="settings-row" style={{ borderTop: "1px dashed var(--line)", paddingTop: 10, marginTop: 6 }}>
            <span style={{ fontWeight: 600 }}>🎨 AI 生图配置</span>
          </div>
          <div className="settings-row"><span>生图 API URL</span><input className="settings-input" value={llmForm.imageBaseUrl} onChange={(e) => setLlmForm({ ...llmForm, imageBaseUrl: e.target.value })} placeholder="留空则复用 Base URL" /></div>
          <div className="settings-row"><span>生图 API Key</span><span style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}><input className="settings-input" type="password" value={llmForm.imageApiKey} onChange={(e) => setLlmForm({ ...llmForm, imageApiKey: e.target.value })} placeholder={hasStoredImageKey ? "已保存，留空不修改" : "留空则复用主 API Key"} style={{ flex: 1 }} />{hasStoredImageKey ? <span style={{ color: "#0e7c66", fontSize: 12, whiteSpace: "nowrap" }}>已保存</span> : null}</span></div>
          <div className="settings-row"><span>生图 Model</span><input className="settings-input" value={llmForm.imageModel} onChange={(e) => setLlmForm({ ...llmForm, imageModel: e.target.value })} placeholder="dall-e-3" /></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
          <button type="button" className="primary-button" disabled={savingLlm} onClick={saveLlm}>{savingLlm ? "保存中…" : "保存配置"}</button>
          <button type="button" disabled={testing} onClick={testLlm}>{testing ? <Loader2 size={14} className="spinner" /> : "测试连接"}</button>
          {testResult === "ok" ? <span style={{ color: "#0e7c66", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={14} /> 连接成功</span> : testResult === "fail" ? <span style={{ color: "#b13b2e", display: "flex", alignItems: "center", gap: 4 }}><X size={14} /> 连接失败</span> : null}
          {saveError ? <span style={{ color: "#b13b2e", display: "flex", alignItems: "center", gap: 4 }}><X size={14} /> {saveError}</span> : null}
        </div>
      </section>

      {/* === Storage + Debug === */}
      <section className="card"><h2><Database size={16} /> 本地存储</h2><div className="settings-table"><div className="settings-row"><span>数据位置</span><span>{storagePath}</span></div></div></section>
      <section className="card"><h2><Terminal size={16} /> 调试</h2><button type="button" onClick={() => setShowDebug(!showDebug)}>{showDebug ? "关闭" : "开启"}</button>{showDebug && <div style={{ marginTop: 14, padding: 12, border: "1px dashed var(--line)", borderRadius: 8 }}><p className="muted">本地 MVP | API :3333 | 桌面 :5173</p></div>}</section>
    </div>
  );
}

const levelLabels: Record<string, string> = { simulate: "L0 模拟", copy: "L1 复制", assist: "L1 辅助", draft: "L2 草稿", submit: "L3 提交", publish: "L3 发布" };
