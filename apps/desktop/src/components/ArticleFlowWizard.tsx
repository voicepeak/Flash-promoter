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

const userPlatforms: PlatformId[] = ["wechat", "bilibili", "zhihu-assist", "xhs-assist"];
const steps = ["输入原稿", "选择平台", "生成内容包", "编辑确认", "发布前检查", "发布结果"];

type Analyzed = { title: string; summary: string; tags: string[]; keyPoints: string[]; highlights: string[]; suggestedPlatforms: string[]; tone: string };

export function ArticleFlowWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [body, setBody] = useState("");
  const [analyzed, setAnalyzed] = useState<Analyzed | null>(null);
  const [tagsText, setTagsText] = useState("");

  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>([...userPlatforms]);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [publishResults, setPublishResults] = useState<Record<string, PublishResult>>({});

  const showMessage = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 4000); }, []);

  function handleAnalyzed(b: string, a: Analyzed, t: string) { setBody(b); setAnalyzed(a); setTagsText(t); setStep(1); }

  async function handleGenerate() {
    setStep(2); setBusy(true); setMessage(null);
    try {
      const title = analyzed?.title ?? "";
      const summary = analyzed?.summary ?? "";
      const tags = analyzed?.tags ?? [];
      const created = await api.createPost({ title, body, summary, tags, inputFormat: "markdown", assets: [] });
      setCurrentPostId(created.id);
      const generated = await api.generateDrafts(created.id, selectedPlatforms);
      setDrafts(generated.items);
      setStep(3); showMessage("平台内容包已生成");
    } catch (error) {
      setStep(1); setMessage(error instanceof Error ? error.message : "生成失败");
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
        if (res.result) {
          results[draft.platform] = res.result;
          if (res.result.raw && (res.result.raw as Record<string, unknown>).realApiCalled) realCount++;
        }
      } catch {
        results[draft.platform] = { platform: draft.platform, mode: "simulate", status: "failed", message: "发布失败，请检查凭证和平台配置", createdAt: Date.now() };
      }
    }
    setPublishResults(results); setStep(5);
    showMessage(realCount > 0 ? `${realCount} 个平台真实发布完成，其余模拟` : "发布完成（部分平台未开启真实发布）");
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
        {step === 0 && <StepInput onAnalyzed={handleAnalyzed} />}
        {step === 1 && <StepPlatforms selected={selectedPlatforms} onToggle={(p) => setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])} onBack={() => setStep(0)} onGenerate={handleGenerate} busy={busy} canNext={canNext} />}
        {step === 2 && <StepGenerate selectedPlatforms={selectedPlatforms} busy={busy} />}
        {step === 3 && <StepEditConfirm drafts={drafts} selectedPlatforms={selectedPlatforms} busy={busy} onDraftsChange={setDrafts} onBack={() => setStep(1)} onNext={async () => { setBusy(true); const ok = await handleValidateAll(); setBusy(false); ok ? setStep(4) : setMessage("部分平台校验未通过"); }} canNext={canNext} />}
        {step === 4 && <StepValidatePublish drafts={drafts} busy={busy} onBack={() => setStep(3)} onPublish={handlePublishAll} allValid={drafts.every((d) => d.validation?.ok === true)} />}
        {step === 5 && <StepResults drafts={drafts} results={publishResults} onBackToEdit={() => setStep(3)} onNewPost={() => { setStep(0); setBody(""); setAnalyzed(null); setDrafts([]); setPublishResults({}); }} />}
      </div>
    </div>
  );
}

function defaultModeForPlatform(platform: PlatformId): PublishMode {
  if (platform === "mock") return "simulate";
  return (defaultPublishMode[platform as keyof typeof defaultPublishMode] ?? "simulate") as PublishMode;
}

export { userPlatforms as articlePlatforms };
