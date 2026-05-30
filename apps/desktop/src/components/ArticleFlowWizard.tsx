import { useState, useCallback } from "react";
import type { PlatformDraft, PlatformId, PublishMode, PublishResult } from "@flash-promoter/core";
import { defaultPublishMode } from "@flash-promoter/core";
import { api } from "../api/client.js";
import { StepInput } from "./steps/StepInput.js";
import { StepPlatforms } from "./steps/StepPlatforms.js";
import { StepGenerate } from "./steps/StepGenerate.js";
import { StepEditConfirm } from "./steps/StepEditConfirm.js";
import { StepValidatePublish } from "./steps/StepValidatePublish.js";
import { StepResults } from "./steps/StepResults.js";

const userPlatforms: PlatformId[] = ["wechat", "bilibili", "zhihu-assist", "xhs-assist", "wordpress"];
const steps = ["输入原稿", "选择平台", "生成内容包", "编辑确认", "发布"];

type ImageItem = { id: string; dataUrl: string; filename: string; source: "upload" | "ai" };

export function ArticleFlowWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [body, setBody] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>([...userPlatforms]);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [publishResults, setPublishResults] = useState<Record<string, PublishResult>>({});

  const showMessage = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 4000); }, []);

  function handleConfirmInput(b: string, imgs: ImageItem[]) { setBody(b); setImages(imgs); setStep(1); }

  async function handleGenerate() {
    setStep(2); setBusy(true); setMessage(null);
    try {
      // Try LLM analysis if configured, fall back to plain text
      let title = body.slice(0, 30);
      let summary = "";
      let tags: string[] = [];
      let llmAvailable = false;
      try {
        const cfg = await api.getLlmConfig();
        llmAvailable = !!(cfg?.config?.enabled && cfg?.config?.apiKeyEncrypted);
      } catch { llmAvailable = false; }

      if (llmAvailable) {
        try {
          const analysis = await api.aiAction({
            contentId: "input-stage", action: "analyzeContent", contentType: "article",
            currentValue: body, slotKey: "body", fieldLabel: "分析", inputContext: {}
          });
          const json = tryParse(analysis.candidates[0] ?? "");
          if (json) { title = String(json.title ?? title); summary = String(json.summary ?? ""); tags = Array.isArray(json.tags) ? json.tags.map(String) : []; }
        } catch { /* LLM unavailable, use plain title */ }
      }

      const imgAssets = images.map((img) => ({ id: img.id, type: "image" as const, dataUrl: img.dataUrl, filename: img.filename, mimeType: "image/png", createdAt: Date.now(), updatedAt: Date.now() }));
      const created = await api.createPost({ title, body, summary, tags, inputFormat: "markdown", assets: imgAssets });
      setCurrentPostId(created.id);
      const generated = await api.generateDrafts(created.id, selectedPlatforms);
      setDrafts(generated.items);
      setStep(3); showMessage("平台内容包已生成");
    } catch (error) {
      setStep(1); setMessage(error instanceof Error ? error.message : "生成失败，请确认 API 服务已启动");
    } finally { setBusy(false); }
  }

  async function handlePublishAll() {
    setBusy(true); setMessage(null);
    const results: Record<string, PublishResult> = {};
    let realCount = 0;
    for (const draft of drafts) {
      try {
        const mode = defaultModeForPlatform(draft.platform);
        const res = await api.publishDraft(draft.id, mode, false);
        if (res.result) { results[draft.platform] = res.result; if ((res.result.raw as Record<string, unknown>)?.realApiCalled) realCount++; }
      } catch {
        results[draft.platform] = { platform: draft.platform, mode: "simulate", status: "failed", message: "发布失败", createdAt: Date.now() };
      }
    }
    setPublishResults(results); setStep(4);
    showMessage(realCount > 0 ? `${realCount} 个平台真实发布完成` : "发布完成");
    setBusy(false);
  }

  async function handleValidateAll(): Promise<boolean> {
    let allOk = true; const updated = [...drafts];
    for (let i = 0; i < updated.length; i++) { try { const r = await api.validateDraft(updated[i].id); updated[i] = r.draft; if (!r.ok) allOk = false; } catch { allOk = false; } }
    setDrafts(updated); return allOk;
  }

  const canNext = (() => {
    switch (step) { case 1: return selectedPlatforms.length > 0; case 3: return drafts.every((d) => d.userConfirmed); default: return true; }
  })();

  return (
    <div className="wizard-shell">
      <header className="wizard-header"><div><span className="eyebrow">图文发布向导</span><h1>新建内容发布</h1></div></header>
      <div className="stepper">{steps.map((label, i) => (<div key={label} className={`stepper-step ${i === step ? "current" : i < step ? "done" : ""}`}><span className="stepper-num">{i < step ? "✓" : i + 1}</span><span className="stepper-label">{label}</span></div>))}</div>
      {message ? <div className="wizard-banner">{message}</div> : null}
      <div className="step-body">
        {step === 0 && <StepInput onConfirm={handleConfirmInput} />}
        {step === 1 && <StepPlatforms selected={selectedPlatforms} onToggle={(p) => setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])} onBack={() => setStep(0)} onGenerate={handleGenerate} busy={busy} canNext={canNext} />}
        {step === 2 && <StepGenerate selectedPlatforms={selectedPlatforms} busy={busy} />}
        {step === 3 && <StepEditConfirm drafts={drafts} selectedPlatforms={selectedPlatforms} busy={busy} onDraftsChange={setDrafts} onBack={() => setStep(1)} onNext={async () => { setBusy(true); const ok = await handleValidateAll(); setBusy(false); ok ? setStep(4) : setMessage("部分平台校验未通过"); }} canNext={canNext} />}
        {step === 4 && (Object.keys(publishResults).length > 0 ? (
          <StepResults drafts={drafts} results={publishResults} onBackToEdit={() => setStep(3)} onNewPost={() => { setStep(0); setBody(""); setDrafts([]); setPublishResults({}); }} />
        ) : (
          <StepValidatePublish drafts={drafts} busy={busy} onBack={() => setStep(3)} onPublish={handlePublishAll} allValid={drafts.every((d) => d.validation?.ok === true)} />
        ))}
      </div>
    </div>
  );
}

function defaultModeForPlatform(platform: PlatformId): PublishMode {
  if (platform === "mock") return "simulate";
  return (defaultPublishMode[platform as keyof typeof defaultPublishMode] ?? "simulate") as PublishMode;
}

function tryParse(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()) as Record<string, unknown>; } catch { return null; }
}

export { userPlatforms as articlePlatforms };
